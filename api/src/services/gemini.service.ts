import { GoogleGenerativeAI } from "@google/generative-ai";
import { InferenceClient } from "@huggingface/inference";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'EMPTY_KEY');
const hfClient = new InferenceClient("f_IKMXWWWhncHXCpvLRseZDmcZQngmXdIrZd");

export async function generateImageFromPrompt(prompt: string) {
    // If no real HF_TOKEN, return a mock URL
    const isPlaceholder = "f_IKMXWWWhncHXCpvLRseZDmcZQngmXdIrZd";


    // if (isPlaceholder) {
    //     console.warn('HF_TOKEN is a placeholder or not set. Returning mock image.');
    //     return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
    // }

    try {
        const imageBlob: any = await hfClient.textToImage({
            provider: "fal-ai",
            model: "black-forest-labs/FLUX.1-dev",
            inputs: prompt,
            parameters: { num_inference_steps: 5 },
        });

        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        return `data:image/png;base64,${base64Image}`;
    } catch (error: any) {
        console.warn('Hugging Face image generation failed:', error.message);

        // Return a dynamically generated image based on the prompt as a fallback
        // loremflickr.com provides relevant images based on keywords
        // We filter out common stop words to get more meaningful keywords
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
}

// Simple text similarity using a mock embedding approach if real embeddings aren't requested
// Or we can use the Gemini embedding model
export async function getPromptSimilarity(prompt1: string, prompt2: string) {
    const isPlaceholder = "f_IKMXWWWhncHXCpvLRseZDmcZQngmXdIrZd";
    // process.env.GEMINI_API_KEY === 'your_key_here' ||
    // process.env.GEMINI_API_KEY === 'EMPTY_KEY';

    if (isPlaceholder) {
        // Simple fallback similarity based on word overlap for testing
        const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
        const words2 = new Set(prompt2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const res1 = await model.embedContent(prompt1);
        const res2 = await model.embedContent(prompt2);

        const embedding1 = res1.embedding.values;
        const embedding2 = res2.embedding.values;

        return calculateCosineSimilarity(embedding1, embedding2);
    } catch (error) {
        console.error('Error calculating similarity with Gemini:', error);
        return 0.5; // Error fallback
    }
}

function calculateCosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const valA = a[i] || 0;
        const valB = b[i] || 0;
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
