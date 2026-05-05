import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';

import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

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
  const { userId, name, city } = request.body as { userId: string, name: string, city: string };

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, city }
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
