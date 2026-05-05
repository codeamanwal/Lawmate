import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import dotenv from 'dotenv';
import { z } from 'zod';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ logger: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

fastify.register(cors);

const leadSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  city: z.string(),
  category: z.string(),
  description: z.string(),
  preferredTime: z.string(),
});

fastify.post('/api/leads', async (request: any, reply: any) => {
  try {
    const data = leadSchema.parse(request.body);
    
    // Check for duplicates (same phone + same category in last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingLead = await prisma.lead.findFirst({
      where: {
        phone: data.phone,
        category: data.category,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (existingLead) {
      return existingLead; // Return existing if duplicate
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.fullName,
        phone: data.phone,
        city: data.city,
        category: data.category,
        description: data.description,
        preferredTime: data.preferredTime,
        status: 'NEW'
      }
    });

    return lead;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: 'Invalid data' });
  }
});

fastify.get('/api/leads/my', async (request: any, reply: any) => {
  // In a real app, we'd verify JWT here or at Gateway
  // For MVP, we'll assume the gateway passed user info in headers
  const phone = request.headers['x-user-phone'] as string;
  
  if (!phone) return reply.status(401).send({ error: 'Unauthorized' });

  const leads = await prisma.lead.findMany({
    where: { phone },
    include: { lawyer: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return leads;
});

const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('Lead service running on port 3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
