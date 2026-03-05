import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here'
        ? process.env.OPENAI_API_KEY
        : 'EMPTY_KEY',
});
export async function generateImage(prompt) {
    // If no real API key, return a mock URL
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key_here') {
        console.warn('OPENAI_API_KEY is not set. Returning mock image.');
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
    }
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });
        const url = response.data?.[0]?.url;
        if (!url)
            throw new Error('Failed to generate image URL');
        return url;
    }
    catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}
export async function getEmbedding(text) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key_here') {
        console.warn('OPENAI_API_KEY is not set. Returning mock embedding.');
        return new Array(3072).fill(0).map(() => Math.random());
    }
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: text,
        });
        const embedding = response.data?.[0]?.embedding;
        if (!embedding)
            throw new Error('Failed to generate embedding');
        return embedding;
    }
    catch (error) {
        console.error('Error getting embedding:', error);
        throw error;
    }
}
export function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const valA = a[i] ?? 0;
        const valB = b[i] ?? 0;
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0)
        return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
//# sourceMappingURL=ai.js.map