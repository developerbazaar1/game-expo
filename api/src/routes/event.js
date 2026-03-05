import { PrismaClient } from '@prisma/client';
import { generateImage, getEmbedding, cosineSimilarity } from '../services/ai.js';
const prisma = new PrismaClient();
// WebSocket clients
const clients = new Set();
function broadcast(message) {
    const data = JSON.stringify(message);
    for (const client of clients) {
        try {
            if (client.socket && client.socket.readyState === 1) { // 1 = OPEN
                client.socket.send(data);
            }
        }
        catch (err) {
            console.error('Broadcast error:', err);
            clients.delete(client);
        }
    }
}
export default async function eventRoutes(fastify, options) {
    // WebSocket handler
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        clients.add(connection);
        connection.socket.on('close', () => {
            clients.delete(connection);
        });
    });
    // POST /events
    fastify.post('/events', async (request, reply) => {
        const { name, maxPlayers } = request.body;
        if (!name || !maxPlayers) {
            return reply.status(400).send({ error: 'Name and maxPlayers are required' });
        }
        const event = await prisma.event.create({
            data: {
                name,
                maxPlayers: Number(maxPlayers),
                status: 'waiting'
            }
        });
        return event;
    });
    // GET /events/:id
    fastify.get('/events/:id', async (request, reply) => {
        const { id } = request.params;
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                players: {
                    orderBy: { score: 'desc' },
                    take: 10
                }
            }
        });
        if (!event) {
            return reply.status(404).send({ error: 'Event not found' });
        }
        return event;
    });
    // POST /events/:id/join
    fastify.post('/events/:id/join', async (request, reply) => {
        const { id } = request.params;
        const { name, email, phone } = request.body;
        if (!name || !email) {
            return reply.status(400).send({ error: 'Name and email are required' });
        }
        const event = await prisma.event.findUnique({
            where: { id },
            include: { _count: { select: { players: true } } }
        });
        if (!event)
            return reply.status(404).send({ error: 'Event not found' });
        if (event._count.players >= event.maxPlayers)
            return reply.status(400).send({ error: 'Full' });
        // Create player
        const player = await prisma.player.create({
            data: { name, email, phone: phone || null, eventId: id }
        });
        // If first player, generate AI ref
        if (event.status === 'waiting') {
            const referencePrompt = "A futuristic cyberpunk city with neon lights and flying cars, digital art style";
            const imageUrl = await generateImage(referencePrompt);
            const embedding = await getEmbedding(referencePrompt);
            await prisma.event.update({
                where: { id },
                data: {
                    status: 'active',
                    referenceImageUrl: imageUrl,
                    referenceEmbedding: embedding
                }
            });
            broadcast({ type: 'EVENT_ACTIVE', eventId: id, imageUrl });
        }
        broadcast({ type: 'PLAYER_JOINED', eventId: id, player: { name: player.name, score: 0 } });
        return { success: true, player };
    });
    // POST /events/:id/submit
    fastify.post('/events/:id/submit', async (request, reply) => {
        const { id } = request.params;
        const { email, prompt } = request.body;
        const event = await prisma.event.findUnique({
            where: { id }
        });
        if (!event || event.status !== 'active') {
            return reply.status(400).send({ error: 'Game not active' });
        }
        const player = await prisma.player.findFirst({
            where: { eventId: id, email }
        });
        if (!player)
            return reply.status(404).send({ error: 'Not registered' });
        if (player.score !== null)
            return reply.status(400).send({ error: 'Already submitted' });
        // Generate user AI image & embedding
        const userImageUrl = await generateImage(prompt);
        const userEmbedding = await getEmbedding(prompt);
        // Compare
        const refEmbedding = event.referenceEmbedding;
        const similarity = cosineSimilarity(refEmbedding, userEmbedding);
        const score = Math.round(similarity * 100);
        const updatedPlayer = await prisma.player.update({
            where: { id: player.id },
            data: {
                prompt,
                generatedImageUrl: userImageUrl,
                score
            }
        });
        broadcast({ type: 'SCORE_UPDATE', eventId: id, player: { name: player.name, score } });
        return { success: true, score, imageUrl: userImageUrl };
    });
}
//# sourceMappingURL=event.js.map