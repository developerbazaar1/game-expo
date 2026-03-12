import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { aiService } from '../services/gemini.service.js';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';

const REFERENCE_IMAGE_URL = process.env.REFERENCE_IMAGE_URL;

function getMimeTypeFromFileName(fileName: string) {
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

function getMimeTypeFromContentType(contentType: string | null) {
    if (!contentType) return undefined;
    const mime = contentType.split(';')[0]?.trim().toLowerCase();
    if (!mime) return undefined;
    return mime;
}

async function fetchReferenceImageAsDataUrl(imageUrl: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const res = await fetch(imageUrl, { signal: controller.signal });
        if (!res.ok) {
            throw new Error(`Failed to download reference image (${res.status} ${res.statusText})`);
        }

        const contentType = getMimeTypeFromContentType(res.headers.get('content-type'));
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const fallbackMimeType = getMimeTypeFromFileName(new URL(imageUrl).pathname);
        return `data:${contentType || fallbackMimeType};base64,${base64}`;
    } finally {
        clearTimeout(timeout);
    }
}

async function loadReferenceImageAsDataUrl() {
    if (!REFERENCE_IMAGE_URL) {
        throw new Error('Missing REFERENCE_IMAGE_URL env var.');
    }

    return fetchReferenceImageAsDataUrl(REFERENCE_IMAGE_URL);
}

// WebSocket clients
const clients = new Set<any>();

function broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const client of clients) {
        try {
            if (client.socket && client.socket.readyState === 1) { // 1 = OPEN
                client.socket.send(data);
            }
        } catch (err) {
            console.error('Broadcast error:', err);
            clients.delete(client);
        }
    }
}

export default async function eventRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // WebSocket handler
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        clients.add(connection);
        connection.socket.on('close', () => {
            clients.delete(connection);
        });
    });

    // POST /events
    fastify.post('/events', async (request, reply) => {
        const { name, maxPlayers } = request.body as { name: string; maxPlayers: unknown };

        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (!trimmedName) {
            return reply.status(400).send({ error: 'Name is required' });
        }

        const parsedMaxPlayers =
            typeof maxPlayers === 'string' ? Number(maxPlayers) : typeof maxPlayers === 'number' ? maxPlayers : NaN;

        if (!Number.isFinite(parsedMaxPlayers) || !Number.isInteger(parsedMaxPlayers)) {
            return reply.status(400).send({ error: 'maxPlayers must be an integer' });
        }

        // Prisma `Int` maps to Postgres INT4 (32-bit signed), so enforce a safe range to avoid 500s.
        if (parsedMaxPlayers < 1 || parsedMaxPlayers > 2147483647) {
            return reply.status(400).send({ error: 'maxPlayers must be between 1 and 2147483647' });
        }

        try {
            const event = await prisma.event.create({
                data: {
                    name: trimmedName,
                    maxPlayers: parsedMaxPlayers,
                    status: 'waiting'
                }
            });

            return event;
        } catch (err: any) {
            const message = typeof err?.message === 'string' ? err.message : '';
            if (message.includes('Unable to fit integer value') || message.includes('INT4')) {
                return reply.status(400).send({ error: 'Invalid maxPlayers value' });
            }
            request.log?.error?.(err);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // GET /events/:id
    fastify.get('/events/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

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
    fastify.post<{ Params: { id: string }; Body: { name: string; email: string; phone?: string } }>(
        '/events/:id/join',
        async (request, reply) => {
            const { id } = request.params;
            const { name, email, phone } = request.body;

            if (!name || !email) {
                return reply.status(400).send({ error: 'Name and email are required' });
            }

            const event = await prisma.event.findUnique({
                where: { id },
                include: { _count: { select: { players: true } } }
            });

            if (!event) return reply.status(404).send({ error: 'Event not found' });
            if (event._count.players >= event.maxPlayers) return reply.status(400).send({ error: 'Full' });

            // Create player
            const player = await prisma.player.create({
                data: { name, email, phone: phone || null, eventId: id }
            });

            // If first player, generate AI ref
            if (event.status === 'waiting') {
                const imageUrl = await loadReferenceImageAsDataUrl();
                const referencePrompt = await aiService.generatePromptFromImage(imageUrl);

                await prisma.event.update({
                    where: { id },
                    data: {
                        status: 'active',
                        referenceImageUrl: imageUrl,
                        referencePrompt: referencePrompt
                    } as any
                });

                broadcast({ type: 'EVENT_ACTIVE', eventId: id, imageUrl });
            }

            broadcast({ type: 'PLAYER_JOINED', eventId: id, player: { name: player.name, score: 0 } });

            return { success: true, player };
        }
    );

    // POST /events/:id/submit
    fastify.post<{ Params: { id: string }; Body: { email?: string; prompt: string } }>(
        '/events/:id/submit',
        async (request, reply) => {
            const { id } = request.params;
            const { email, prompt } = request.body;

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event || event.status !== 'active') {
                return reply.status(400).send({ error: 'Game not active' });
            }

            let player;
            if (email) {
                player = await prisma.player.findFirst({
                    where: { eventId: id, email }
                });
            } else {
                // Pick the oldest player who hasn't submitted yet
                player = await prisma.player.findFirst({
                    where: { eventId: id, score: null },
                    orderBy: { createdAt: 'asc' }
                });
            }

            if (!player) return reply.status(404).send({ error: 'No active player found' });
            if (player.score !== null) return reply.status(400).send({ error: 'Already submitted' });

            // Generate user AI image
            const referenceImageUrl = (event as any).referenceImageUrl || "";
            const { imageUrl: userImageUrl, scorePercentage: score } = await aiService.generateImageAndScoreFromPrompt(prompt, referenceImageUrl);

            const updatedPlayer = await prisma.player.update({
                where: { id: player.id },
                data: {
                    prompt,
                    generatedImageUrl: userImageUrl,
                    score
                }
            });

            // Update event wins
            const updateData: any = {};
            if (score >= 90) {
                updateData.humanWins = { increment: 1 };
            } else {
                updateData.aiWins = { increment: 1 };
            }

            await prisma.event.update({
                where: { id },
                data: updateData
            });

            broadcast({ type: 'SCORE_UPDATE', eventId: id, player: { name: player.name, score } });

            return { success: true, score, imageUrl: userImageUrl };
        }
    );
}
