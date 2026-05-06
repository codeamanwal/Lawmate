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

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const leadSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  city: z.string(),
  category: z.string(),
  description: z.string(),
  preferredTime: z.string(),
  userId: z.string().optional()
}).passthrough();

fastify.post('/api/leads', async (request: any, reply: any) => {
  try {
    const data = leadSchema.parse(request.body);
    const authUserId = request.headers['x-user-id'] as string;
    
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
        userId: authUserId || data.userId || null,
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
  const userId = request.headers['x-user-id'] as string;
  
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { lawyer: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return leads;
});

fastify.post('/api/leads/:id/complete', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  const authUserId = request.headers['x-user-id'] as string;
  
  try {
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { 
        status: 'COMPLETED',
        // Also associate user if not already associated
        ...(authUserId && { userId: authUserId })
      }
    });
    return updatedLead;
  } catch (error) {
    return reply.status(500).send({ error: 'Update failed' });
  }
});

fastify.delete('/api/leads/:id', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  try {
    // 1. Find the booking associated with this lead
    const booking = await prisma.booking.findUnique({
      where: { leadId: id }
    });

    if (booking) {
      // 2. Delete the payment associated with the booking
      if (booking.paymentId) {
        await prisma.payment.delete({ where: { id: booking.paymentId } }).catch(() => {});
      }
      // 3. Delete the booking
      await prisma.booking.delete({ where: { id: booking.id } });
    }

    // 4. Finally delete the lead
    await prisma.lead.delete({
      where: { id }
    });
    
    return { success: true };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Delete failed. This case might have active dependencies.' });
  }
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
