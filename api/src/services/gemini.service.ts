import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

type GenerateAndScoreResult = {
    imageUrl: string;
    scorePercentage: number;
};

type InlineImagePart = {
    inlineData: {
        mimeType: string;
        data: string;
    };
};

interface AIService {
    generatePromptFromImage(referenceImageDataUrl: string): Promise<string>;
    generateImageAndScoreFromPrompt(prompt: string, referenceImageDataUrl: string): Promise<GenerateAndScoreResult>;
}

class GeminiService implements AIService {
    private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'EMPTY_KEY');

    async generatePromptFromImage(referenceImageDataUrl: string): Promise<string> {
        const fallbackPrompt = 'Create an image that matches the reference image composition, subject, lighting, and style.';
        const referenceImagePart = await toInlineImagePart(referenceImageDataUrl);
        if (!referenceImagePart) return fallbackPrompt;

        try {
            const textModels = uniqueNonEmpty([
                process.env.GEMINI_TEXT_MODEL,
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp"
            ]);

            for (const modelName of textModels) {
                try {
                    const model = this.genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent([
                        referenceImagePart,
                        "Write one concise text-to-image prompt that recreates this image's key subject, setting, mood, colors, and composition."
                    ]);
                    const prompt = result.response.text()?.trim();
                    if (prompt) return prompt;
                } catch (modelError) {
                    console.error(`Gemini prompt model failed (${modelName}):`, modelError);
                }
            }
        } catch (error) {
            console.error('Gemini prompt generation failed:', error);
        }
        return fallbackPrompt;
    }

    async generateImageAndScoreFromPrompt(prompt: string, referenceImageDataUrl: string): Promise<GenerateAndScoreResult> {
        const imageUrl = await this.generateImageFromPrompt(prompt);
        const scorePercentage = await this.compareImages(referenceImageDataUrl, imageUrl, prompt);
        return { imageUrl, scorePercentage };
    }

    private async generateImageFromPrompt(prompt: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation",
                generationConfig: { responseModalities: ["TEXT", "IMAGE"] } as any
            });

            const result = await model.generateContent([
                `Generate one high quality image for this prompt: "${prompt}".`
            ]);

            const candidates = (result as any)?.response?.candidates || [];
            const parts = candidates.flatMap((c: any) => c?.content?.parts || []);
            const imagePart = parts.find((p: any) => p?.inlineData?.data);

            if (imagePart?.inlineData?.data) {
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${imagePart.inlineData.data}`;
            }
        } catch (error) {
            console.error('Gemini image generation failed:', error);
        }

        return buildFallbackImage(prompt);
    }

    private async compareImages(referenceImageDataUrl: string, generatedImageDataUrl: string, prompt: string): Promise<number> {
        const referencePart = await toInlineImagePart(referenceImageDataUrl);
        const generatedPart = await toInlineImagePart(generatedImageDataUrl);

        if (!referencePart || !generatedPart) {
            return 0;
        }

        try {
            const scoreModels = uniqueNonEmpty([
                process.env.GEMINI_SCORE_MODEL,
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp"
            ]);

            for (const modelName of scoreModels) {
                try {
                    const model = this.genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent([
                        referencePart,
                        generatedPart,
                        `Compare image 1 (reference) and image 2 (generated for prompt "${prompt}").
Return ONLY valid JSON:
{"scorePercentage": <0-100>}`
                    ]);

                    const text = result.response.text()?.trim() || '';
                    const parsed = parseScorePercentage(text);
                    if (parsed !== null) return parsed;
                } catch (modelError) {
                    console.error(`Gemini score model failed (${modelName}):`, modelError);
                }
            }
        } catch (error) {
            console.error('Gemini image scoring failed:', error);
        }

        return 0;
    }
}

const service: AIService = new GeminiService();

export const aiService: AIService = {
    generatePromptFromImage(referenceImageDataUrl: string) {
        return service.generatePromptFromImage(referenceImageDataUrl);
    },
    generateImageAndScoreFromPrompt(prompt: string, referenceImageDataUrl: string) {
        return service.generateImageAndScoreFromPrompt(prompt, referenceImageDataUrl);
    }
};

function parseScorePercentage(text: string): number | null {
    if (!text) return null;

    try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.scorePercentage === 'number') {
            return clampPercentage(parsed.scorePercentage);
        }
    } catch {
        // Continue to regex parsing.
    }

    const jsonLike = text.match(/"scorePercentage"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (jsonLike?.[1]) return clampPercentage(Number(jsonLike[1]));

    const percentLike = text.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
    if (percentLike?.[1]) return clampPercentage(Number(percentLike[1]));

    const numberLike = text.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (!numberLike?.[1]) return null;

    const raw = Number(numberLike[1]);
    if (!Number.isFinite(raw)) return null;
    if (raw <= 1) return clampPercentage(raw * 100);
    return clampPercentage(raw);
}

function clampPercentage(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function buildFallbackImage(prompt: string) {
    const stopWords = new Set(['a', 'an', 'the', 'on', 'in', 'at', 'by', 'is', 'of', 'with', 'and', 'or', 'for']);
    const keywords = encodeURIComponent(
        prompt.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w))
            .slice(0, 4)
            .join(',')
    );
    const seed = Math.floor(Math.random() * 1000000);
    return `https://loremflickr.com/1024/1024/${keywords}?lock=${seed}`;
}

async function toInlineImagePart(imageUrl: string): Promise<InlineImagePart | null> {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('data:')) {
        const match = imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (!match?.[1] || !match?.[2]) return null;
        return {
            inlineData: {
                mimeType: match[1],
                data: match[2]
            }
        };
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
            const res = await fetch(imageUrl);
            if (!res.ok) return null;
            const arrayBuffer = await res.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            return {
                inlineData: {
                    mimeType: res.headers.get('content-type') || 'image/png',
                    data: base64Data
                }
            };
        } catch {
            return null;
        }
    }

    return null;
}

function uniqueNonEmpty(values: Array<string | undefined>) {
    return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))];
}
