import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ logger: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

fastify.register(cors);

fastify.get('/api/profiles/match', async (request: any, reply: any) => {
  const { category, city } = request.query as { category: string, city: string };

  try {
    const lawyers = await prisma.lawyerProfile.findMany({
      where: {
        categories: { has: category },
        user: { city },
        verified: true
      },
      include: { user: true },
      orderBy: { rating: 'desc' },
      take: 5
    });

    return lawyers;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Matching failed' });
  }
});

fastify.get('/api/profiles/:id', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  const profile = await prisma.lawyerProfile.findUnique({
    where: { id },
    include: { user: true }
  });
  return profile;
});

fastify.post('/api/profiles/update', async (request: any, reply: any) => {
  const userId = request.headers['x-user-id'] as string;
  const { name, city, phone } = request.body as { name: string, city: string, phone?: string };

  if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, city, phone }
    });

    // Sync user details to all client's leads
    await prisma.lead.updateMany({
      where: { userId: userId },
      data: {
        ...(name && { name }),
        ...(city && { city }),
        ...(phone && { phone })
      }
    });

    return updatedUser;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Update failed' });
  }
});


const start = async () => {
  try {
    await fastify.listen({ port: 3005, host: '0.0.0.0' });
    console.log('Profile service running on port 3005');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
