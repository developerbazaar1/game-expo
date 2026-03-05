import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import eventRoutes from './routes/event.js';
dotenv.config();
const fastify = Fastify({
    logger: true
});
// Enable CORS
await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
});
await fastify.register(websocket);
const prisma = new PrismaClient();
fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
});
// Register routes
fastify.register(eventRoutes);
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '4000');
        await fastify.listen({ port, host: '0.0.0.0' });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map