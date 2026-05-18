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
    
    // Check for duplicates (disabled in local dev environment for seamless iterative testing)
    /*
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
    */

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
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(400).send({ error: 'Invalid data', message: error.message });
  }
});

fastify.get('/api/leads/my', async (request: any, reply: any) => {
  const userId = request.headers['x-user-id'] as string;
  
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { 
      lawyer: { include: { user: true } },
      booking: { include: { payment: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return leads;
});

fastify.get('/api/leads/lawyer-calls', async (request: any, reply: any) => {
  const userId = request.headers['x-user-id'] as string;
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

  // Get the lawyer profile for this user
  const lawyerProfile = await prisma.lawyerProfile.findUnique({
    where: { userId }
  });

  if (!lawyerProfile) return [];

  // Fetch ALL leads assigned to this lawyer (NEW, COMPLETED, etc.)
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { lawyerId: lawyerProfile.id },
        { declinedLawyerIds: { has: lawyerProfile.id } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { 
      user: true,
      booking: { include: { payment: true } }
    }
  });

  return leads;
});

// SLA Matching & Reassignment Helper
async function assignLeadToLawyer(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    if (!lead) return;

    // Find verified available lawyers (verified condition bypassed in local development/sandbox for testing)
    const availableLawyers = await prisma.lawyerProfile.findMany({
      where: {
        isAvailable: true,
        // verified: true,
        id: { notIn: lead.declinedLawyerIds }
      }
    });

    // Find the first lawyer that matches the lead's category
    const matchingLawyer = availableLawyers.find((lawyer: any) => 
      lawyer.categories.some((cat: string) => cat.toLowerCase() === lead.category.toLowerCase())
    );

    if (matchingLawyer) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          lawyerId: matchingLawyer.id,
          assignedAt: new Date(),
          slaStatus: lead.slaStatus === 'NOT_ATTENDED' ? 'NOT_ATTENDED' : 'PENDING_ACCEPTANCE'
        }
      });
      console.log(`[SLA Matcher] Successfully matched Lead ${leadId} to Lawyer ${matchingLawyer.id}`);
    } else {
      console.log(`[SLA Matcher] No active matching lawyers online for Lead ${leadId}. System awaiting manual assignment.`);
    }
  } catch (error) {
    console.error('SLA Matching Helper Error:', error);
  }
}

// Background SLA Check Loop (Runs every 30 seconds)
setInterval(async () => {
  try {
    const now = new Date();
    // Query leads with pending or accepted status that have a booking
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'ASSIGNED'] }
      },
      include: { booking: true }
    });

    for (const lead of activeLeads) {
      // Only check paid leads
      if (!lead.booking || lead.booking.status !== 'CONFIRMED') {
        continue;
      }

      const preferredTime = lead.preferredTime.toLowerCase();
      // ASAP: 10 mins acceptance window. 24HRS (LATER): 1 hour acceptance window.
      const acceptanceTimeoutMs = preferredTime.includes('asap')
        ? 10 * 60 * 1000
        : 60 * 60 * 1000;

      // ASAP: 60 mins attendance window. 24HRS (LATER): 24 hours attendance window.
      const attendanceTimeoutMs = preferredTime.includes('asap')
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

      // Case B: DECLINE / TIMEOUT during Acceptance (10m ASAP / 1hr 24HRS)
      if (lead.status === 'NEW' && lead.lawyerId && lead.assignedAt) {
        const assignedTime = new Date(lead.assignedAt).getTime();
        if (now.getTime() - assignedTime > acceptanceTimeoutMs) {
          console.log(`[SLA Timeout] Lead ${lead.id} acceptance window exceeded. Reassigning...`);
          
          const updatedDeclined = [...lead.declinedLawyerIds, lead.lawyerId];
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              declinedLawyerIds: updatedDeclined,
              lawyerId: null,
              assignedAt: null,
              slaStatus: 'REASSIGNING'
            }
          });

          await assignLeadToLawyer(lead.id);
        }
      }

      // Case C: ACCEPTED BUT NOT ATTENDED within SLA window (60m ASAP / 24hrs 24HRS)
      if (lead.status === 'ASSIGNED' && lead.lawyerId && lead.acceptedAt) {
        const acceptedTime = new Date(lead.acceptedAt).getTime();
        if (now.getTime() - acceptedTime > attendanceTimeoutMs) {
          console.log(`[SLA Timeout] Lead ${lead.id} was accepted but not attended in SLA window. Reassigning...`);
          
          const updatedDeclined = [...lead.declinedLawyerIds, lead.lawyerId];
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              declinedLawyerIds: updatedDeclined,
              lawyerId: null,
              assignedAt: null,
              acceptedAt: null,
              slaStatus: 'NOT_ATTENDED' // Acts as delay apology banner for client
            }
          });

          await assignLeadToLawyer(lead.id);
        }
      }
    }
  } catch (err) {
    console.error('SLA background loop failed:', err);
  }
}, 30000);

// API Endpoints for SLA matching & actions
fastify.post('/api/leads/:id/match', async (request: any, reply: any) => {
  const { id } = request.params;
  await assignLeadToLawyer(id);
  return { success: true };
});

fastify.post('/api/leads/:id/accept', async (request: any, reply: any) => {
  const { id } = request.params;
  const userId = request.headers['x-user-id'] as string;
  
  try {
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId }
    });

    if (!lawyerProfile) return reply.status(404).send({ error: 'Lawyer profile not found' });

    const lead = await prisma.lead.findUnique({ where: { id } });
    const cleanDeclined = lead?.declinedLawyerIds.filter(declinedId => declinedId !== lawyerProfile.id) || [];

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        lawyerId: lawyerProfile.id,
        declinedLawyerIds: cleanDeclined,
        acceptedAt: new Date(),
        slaStatus: 'ACCEPTED'
      }
    });

    // Also link the booking's lawyerId to the accepting lawyer
    await prisma.booking.update({
      where: { leadId: id },
      data: { lawyerId: lawyerProfile.id }
    });

    return updatedLead;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to accept lead' });
  }
});

fastify.post('/api/leads/:id/decline', async (request: any, reply: any) => {
  const { id } = request.params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead || !lead.lawyerId) return reply.status(404).send({ error: 'Lead or lawyer not found' });

    const updatedDeclined = [...lead.declinedLawyerIds, lead.lawyerId];
    await prisma.lead.update({
      where: { id },
      data: {
        declinedLawyerIds: updatedDeclined,
        lawyerId: null,
        assignedAt: null,
        slaStatus: 'REASSIGNING'
      }
    });

    await assignLeadToLawyer(id);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to decline lead' });
  }
});

fastify.post('/api/leads/:id/resolve', async (request: any, reply: any) => {
  const { id } = request.params;
  const { resolution } = request.body as { resolution: 'CLOSED' | 'CANCELLED' | 'FORWARDED' };
  try {
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        slaStatus: 'COMPLETED',
        lawyerResolution: resolution
      }
    });

    // Mark the associated booking as completed
    const booking = await prisma.booking.findUnique({ where: { leadId: id } });
    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' }
      });
    }

    return updatedLead;
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to resolve lead' });
  }
});

fastify.post('/api/leads/:id/feedback', async (request: any, reply: any) => {
  const { id } = request.params;
  const { rating, feedback } = request.body as { rating: number, feedback: string };
  try {
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        feedbackRating: rating,
        feedbackText: feedback
      }
    });
    return updatedLead;
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to submit feedback' });
  }
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
fastify.post('/api/leads/:id/simulate-accept-timeout', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });
    
    // Mark current assigned lawyer as declined/timed out
    const declinedLawyers = [...(lead.declinedLawyerIds || [])];
    if (lead.lawyerId) declinedLawyers.push(lead.lawyerId);
    
    await prisma.lead.update({
      where: { id },
      data: {
        assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        declinedLawyerIds: declinedLawyers,
        lawyerId: null
      }
    });
    
    // Trigger matching
    await assignLeadToLawyer(id);
    
    return { success: true, message: 'Acceptance timeout simulated successfully!' };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Simulation failed' });
  }
});

fastify.post('/api/leads/:id/simulate-attendance-timeout', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });
    
    const declinedLawyers = [...(lead.declinedLawyerIds || [])];
    if (lead.lawyerId) declinedLawyers.push(lead.lawyerId);
    
    await prisma.lead.update({
      where: { id },
      data: {
        slaStatus: 'NOT_ATTENDED',
        declinedLawyerIds: declinedLawyers,
        lawyerId: null,
        status: 'NEW' // Reset status to NEW so new lawyer receives invitation
      }
    });
    
    // Trigger matching
    await assignLeadToLawyer(id);
    
    return { success: true, message: 'Attendance timeout simulated successfully!' };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Simulation failed' });
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
