import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import dotenv from 'dotenv';
import { z } from 'zod';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

export const fastify = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : true });

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter }); // Reload trigger to pick up new env keys and database schema

export function formatPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 10) {
    return `+91${clean}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

export function formatExotelPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.substring(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 10) {
    return `0${clean}`;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return clean;
  }
  return phone;
}

async function triggerExotelCall(lawyerPhone: string, clientPhone: string, leadId: string): Promise<any> {
  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;
  const accountSid = process.env.EXOTEL_ACCOUNT_SID;
  const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
  const exophone = process.env.EXOTEL_EXOPHONE;
  const statusCallbackUrl = process.env.EXOTEL_STATUS_CALLBACK_URL;

  if (!apiKey || !apiToken || !accountSid || !exophone) {
    console.error('Exotel credentials or ExoPhone missing in environment variables');
    throw new Error('Call service not fully configured.');
  }

  const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
  const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

  const formattedLawyer = formatExotelPhoneNumber(lawyerPhone);
  const formattedClient = formatExotelPhoneNumber(clientPhone);
  const formattedExophone = exophone;

  const params = new URLSearchParams();
  params.append('From', formattedLawyer);
  params.append('To', formattedClient);
  params.append('CallerId', formattedExophone);
  params.append('Record', 'true');
  
  if (statusCallbackUrl) {
    params.append('StatusCallback', statusCallbackUrl);
    params.append('StatusCallbackContentType', 'application/json');
  }

  console.log(`Triggering Exotel call from ${formattedLawyer} to ${formattedClient} using ExoPhone ${exophone}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Exotel call connection failed:', errorText);
    throw new Error(`Exotel connection failed: ${response.statusText}`);
  }

  const data: any = await response.json();
  console.log('Exotel call initiated successfully:', data);

  if (data?.Call?.Sid) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { callSid: data.Call.Sid }
    });
  }

  return data;
}

const leadSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  city: z.string().optional().default(''),
  category: z.string().optional().default('General'),
  description: z.string().optional().default(''),
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

    const isCallback = data.preferredTime.toLowerCase().includes('callback');

    const lead = await prisma.lead.create({
      data: {
        name: data.fullName,
        phone: data.phone,
        city: data.city || '',
        category: data.category || 'General',
        description: data.description || '',
        preferredTime: data.preferredTime,
        userId: authUserId || data.userId || null,
        status: 'NEW',
        slaStatus: isCallback ? 'CALLBACK_PENDING' : undefined
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
        { notifiedLawyerIds: { has: lawyerProfile.id } },
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
    let lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    if (!lead) return;

    // Check if we already hit the max retries of 3
    if (lead.retryCount >= 3) {
      console.log(`[SLA Matcher] Lead ${leadId} has reached max assignment attempts (3). Moving to manual handling.`);
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          slaStatus: 'NOT_ATTENDED',
          lawyerId: null,
          notifiedLawyerIds: [],
          assignedAt: null
        }
      });
      return;
    }

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).toLowerCase();

    const isLawyerAvailableToday = (lawyer: any) => {
      if (lawyer.isAvailable === false) return false;
      const avail = lawyer.availability;
      if (!avail) {
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(currentDay);
      }
      try {
        const availObj = typeof avail === 'string' ? JSON.parse(avail) : avail;
        if (availObj && Array.isArray(availObj.days)) {
          return availObj.days.map((d: string) => d.toLowerCase()).includes(currentDay);
        }
      } catch (err) {
        console.error(`[SLA Matcher] Error parsing availability for lawyer ${lawyer.id}:`, err);
      }
      return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(currentDay);
    };

    // Find available matching lawyers
    let availableLawyers = await prisma.lawyerProfile.findMany({
      where: {
        isAvailable: true,
        id: { notIn: lead.declinedLawyerIds }
      }
    });

    let matchingLawyers = availableLawyers.filter((lawyer: any) => 
      lawyer.categories.some((cat: string) => cat.toLowerCase() === lead!.category.toLowerCase()) &&
      isLawyerAvailableToday(lawyer)
    ).slice(0, 5);

    // If we exhausted all matching lawyers in the database, reset declined list and retry (up to 3 times)
    if (matchingLawyers.length === 0) {
      const nextRetryCount = lead.retryCount + 1;
      if (nextRetryCount >= 3) {
        console.log(`[SLA Matcher] Lead ${leadId} exhausted all matching lawyers and reached max retries (3). Moving to manual handling.`);
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            slaStatus: 'NOT_ATTENDED',
            lawyerId: null,
            notifiedLawyerIds: [],
            assignedAt: null,
            retryCount: 3
          }
        });
        return;
      }

      console.log(`[SLA Matcher] Lead ${leadId} exhausted matching lawyers. Resetting declined list for Attempt ${nextRetryCount + 1}...`);
      
      // Update DB to clear declined list and increment retryCount
      lead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          declinedLawyerIds: [],
          retryCount: nextRetryCount
        }
      });

      // Refetch available matching lawyers with cleared declined list
      availableLawyers = await prisma.lawyerProfile.findMany({
        where: { isAvailable: true }
      });
      matchingLawyers = availableLawyers.filter((lawyer: any) => 
        lawyer.categories.some((cat: string) => cat.toLowerCase() === lead!.category.toLowerCase()) &&
        isLawyerAvailableToday(lawyer)
      ).slice(0, 5);
    }

    if (matchingLawyers.length > 0) {
      const nextRetryCount = lead.retryCount === 0 ? 1 : lead.retryCount;

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          notifiedLawyerIds: matchingLawyers.map((l: any) => l.id),
          lawyerId: null,
          assignedAt: new Date(),
          slaStatus: lead.slaStatus === 'NOT_ATTENDED' ? 'NOT_ATTENDED' : 'PENDING_ACCEPTANCE',
          retryCount: nextRetryCount
        }
      });
      console.log(`[SLA Matcher] Successfully matched Lead ${leadId} to Lawyers in bulk: ${matchingLawyers.map((l: any) => l.id).join(', ')} (Attempt ${nextRetryCount}/3)`);
    } else {
      console.log(`[SLA Matcher] No matching lawyers exist in DB for Lead ${leadId}. System awaiting manual assignment.`);
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          slaStatus: 'NOT_ATTENDED',
          lawyerId: null,
          notifiedLawyerIds: [],
          assignedAt: null,
          retryCount: 3
        }
      });
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
      const isAsapSla = preferredTime.includes('asap') || 
                        (preferredTime.includes('emergency') && !preferredTime.includes('later')) || 
                        (preferredTime.includes('callback') && !preferredTime.includes('later'));
      // ASAP: 5 mins acceptance window. 24HRS (LATER): 10 mins acceptance window.
      const acceptanceTimeoutMs = isAsapSla
        ? 5 * 60 * 1000
        : 10 * 60 * 1000;

      // ASAP: 60 mins attendance window. 24HRS (LATER): 24 hours attendance window.
      const attendanceTimeoutMs = isAsapSla
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

      // Case B: DECLINE / TIMEOUT during Acceptance (5m ASAP / 10m 24HRS)
      if (lead.status === 'NEW' && (lead.lawyerId || (lead.notifiedLawyerIds && lead.notifiedLawyerIds.length > 0)) && lead.assignedAt) {
        const assignedTime = new Date(lead.assignedAt).getTime();
        if (now.getTime() - assignedTime > acceptanceTimeoutMs) {
          console.log(`[SLA Timeout] Lead ${lead.id} acceptance window exceeded.`);

          const nextRetryCount = lead.retryCount + 1;
          if (nextRetryCount >= 3) {
            console.log(`[SLA Timeout] Lead ${lead.id} has reached max attempts (3). Moving to manual handling.`);
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                slaStatus: 'NOT_ATTENDED',
                lawyerId: null,
                notifiedLawyerIds: [],
                assignedAt: null,
                retryCount: 3
              }
            });
          } else {
            console.log(`[SLA Timeout] Reassigning Lead ${lead.id} (Attempt ${nextRetryCount + 1})...`);
            const newlyDeclined = [...lead.declinedLawyerIds];
            if (lead.lawyerId) {
              newlyDeclined.push(lead.lawyerId);
            }
            if (lead.notifiedLawyerIds && lead.notifiedLawyerIds.length > 0) {
              newlyDeclined.push(...lead.notifiedLawyerIds);
            }
            const updatedDeclined = Array.from(new Set(newlyDeclined));

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                declinedLawyerIds: updatedDeclined,
                lawyerId: null,
                notifiedLawyerIds: [],
                assignedAt: null,
                slaStatus: 'REASSIGNING',
                retryCount: nextRetryCount
              }
            });

            await assignLeadToLawyer(lead.id);
          }
        }
      }

      // Case C: ACCEPTED BUT NOT ATTENDED within SLA window (60m ASAP / 24hrs 24HRS)
      if (lead.status === 'ASSIGNED' && lead.lawyerId && lead.acceptedAt) {
        const acceptedTime = new Date(lead.acceptedAt).getTime();
        if (now.getTime() - acceptedTime > attendanceTimeoutMs) {
          console.log(`[SLA Timeout] Lead ${lead.id} was accepted but not attended in SLA window. Reassigning...`);
          
          const updatedDeclined = [...lead.declinedLawyerIds, lead.lawyerId];
          const nextRetryCount = lead.retryCount + 1;

          if (nextRetryCount >= 3) {
            console.log(`[SLA Timeout] Lead ${lead.id} has reached max attempts (3) during attendance timeout. Moving to manual handling.`);
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                declinedLawyerIds: updatedDeclined,
                lawyerId: null,
                notifiedLawyerIds: [],
                assignedAt: null,
                acceptedAt: null,
                slaStatus: 'NOT_ATTENDED',
                retryCount: 3
              }
            });
          } else {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                declinedLawyerIds: updatedDeclined,
                lawyerId: null,
                notifiedLawyerIds: [],
                assignedAt: null,
                acceptedAt: null,
                slaStatus: 'NOT_ATTENDED', // Acts as delay apology banner for client
                retryCount: nextRetryCount
              }
            });

            await assignLeadToLawyer(lead.id);
          }
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
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    let updatedLead = lead;

    // 1. If the lead has no userId, try to find a registered user by phone number (endsWith match)
    if (!lead.userId && lead.phone) {
      const cleanPhone10 = lead.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone10.length === 10) {
        const matchedUser = await prisma.user.findFirst({
          where: {
            role: 'CLIENT',
            phone: {
              endsWith: cleanPhone10
            }
          }
        });
        if (matchedUser) {
          updatedLead = await prisma.lead.update({
            where: { id },
            data: { userId: matchedUser.id }
          });
          fastify.log.info(`Linked lead ${id} to user ${matchedUser.id} via phone match`);
        }
      }
    }

    // 2. Create a booking record if one doesn't exist (so client can pay from their dashboard)
    if (updatedLead.userId) {
      const existingBooking = await prisma.booking.findUnique({ where: { leadId: id } });
      if (!existingBooking) {
        let dummyLawyer = await prisma.lawyerProfile.findFirst();
        if (!dummyLawyer) {
          const dummyUser = await prisma.user.create({ 
            data: { 
              email: 'expert@lawmate.in',
              phone: '9999999999', 
              name: 'LawOnCall Expert', 
              role: 'LAWYER' 
            } 
          });
          dummyLawyer = await prisma.lawyerProfile.create({ 
            data: { 
              userId: dummyUser.id, 
              categories: ['General'], 
              verified: true,
              name: dummyUser.name,
              email: dummyUser.email,
              phone: dummyUser.phone
            } 
          });
        }
        await prisma.booking.create({
          data: {
            leadId: id,
            status: 'PENDING',
            clientId: updatedLead.userId,
            lawyerId: updatedLead.lawyerId || dummyLawyer.id
          }
        });
      }
    }
    // 3. Trigger SLA lawyer matching
    await assignLeadToLawyer(id);

    return { success: true, linkedUserId: updatedLead.userId };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Match failed' });
  }
});

fastify.post('/api/leads/:id/prepare-emergency', async (request: any, reply: any) => {
  const { id } = request.params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    let updatedLead = lead;

    // 1. If the lead has no userId, try to find or create a user by phone number (endsWith match)
    if (!lead.userId && lead.phone) {
      const cleanPhone10 = lead.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone10.length === 10) {
        let matchedUser = await prisma.user.findFirst({
          where: {
            role: 'CLIENT',
            phone: {
              endsWith: cleanPhone10
            }
          }
        });
        if (!matchedUser) {
          matchedUser = await prisma.user.create({
            data: {
              email: `guest-${cleanPhone10}-${Date.now()}@lawmate.in`,
              phone: `+91${cleanPhone10}`,
              name: lead.name || 'Guest Client',
              role: 'CLIENT',
              city: lead.city || ''
            }
          });
          fastify.log.info(`Created guest user ${matchedUser.id} for lead ${id}`);
        }
        updatedLead = await prisma.lead.update({
          where: { id },
          data: { userId: matchedUser.id }
        });
        fastify.log.info(`Linked lead ${id} to user ${matchedUser.id}`);
      }
    }

    // 2. Create a booking record if one doesn't exist (so client can pay from their dashboard)
    if (updatedLead.userId) {
      const existingBooking = await prisma.booking.findUnique({ where: { leadId: id } });
      if (!existingBooking) {
        let dummyLawyer = await prisma.lawyerProfile.findFirst();
        if (!dummyLawyer) {
          const dummyUser = await prisma.user.create({ 
            data: { 
              email: 'expert@lawmate.in',
              phone: '9999999999', 
              name: 'LawOnCall Expert', 
              role: 'LAWYER' 
            } 
          });
          dummyLawyer = await prisma.lawyerProfile.create({ 
            data: { 
              userId: dummyUser.id, 
              categories: ['General'], 
              verified: true,
              name: dummyUser.name,
              email: dummyUser.email,
              phone: dummyUser.phone
            } 
          });
        }
        await prisma.booking.create({
          data: {
            leadId: id,
            status: 'PENDING',
            clientId: updatedLead.userId,
            lawyerId: updatedLead.lawyerId || dummyLawyer.id
          }
        });
      }
    }

    return { success: true, linkedUserId: updatedLead.userId };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Prepare failed' });
  }
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
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    if (lead.status !== 'NEW') {
      return reply.status(400).send({ error: 'This consultation has already been accepted by another advocate.' });
    }

    const cleanDeclined = lead.declinedLawyerIds.filter(declinedId => declinedId !== lawyerProfile.id);

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        lawyerId: lawyerProfile.id,
        notifiedLawyerIds: [],
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

    // Trigger Exotel Click-to-Call connection
    try {
      if (lawyerProfile.phone && updatedLead.phone) {
        await triggerExotelCall(lawyerProfile.phone, updatedLead.phone, id);
      } else {
        console.error('Missing phone number for lawyer or lead to trigger Exotel call');
      }
    } catch (callErr) {
      console.error('Failed to trigger Exotel call on accept:', callErr);
    }

    return updatedLead;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to accept lead' });
  }
});

fastify.post('/api/leads/:id/call', async (request: any, reply: any) => {
  const { id } = request.params;
  const userId = request.headers['x-user-id'] as string;
  
  try {
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId }
    });

    if (!lawyerProfile) return reply.status(404).send({ error: 'Lawyer profile not found' });

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    if (lead.lawyerId !== lawyerProfile.id) {
      return reply.status(403).send({ error: 'You are not assigned to this consultation' });
    }

    if (!lawyerProfile.phone) {
      return reply.status(400).send({ error: 'Your advocate profile is missing a phone number' });
    }

    const callResult = await triggerExotelCall(lawyerProfile.phone, lead.phone, id);
    return { success: true, callSid: callResult?.Call?.Sid };
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(400).send({ error: error.message || 'Failed to initiate call via Exotel' });
  }
});

fastify.post('/api/leads/call-status', async (request: any, reply: any) => {
  const payload = request.body;
  fastify.log.info('Exotel Status Callback Received:', payload);

  const callSid = payload?.CallSid || payload?.Call?.Sid;
  const recordingUrl = payload?.RecordingUrl || payload?.Call?.RecordingUrl;

  if (callSid) {
    const lead = await prisma.lead.findFirst({
      where: { callSid }
    });

    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          recordingUrl: recordingUrl || undefined
        }
      });
      fastify.log.info(`Updated lead ${lead.id} with Exotel callback details.`);
    } else {
      fastify.log.warn(`No lead matching Exotel CallSid ${callSid}`);
    }
  }

  return { success: true };
});

fastify.get('/api/leads/exotel-connect', async (request: any, reply: any) => {
  const { From, To } = request.query as { From: string; To: string };
  fastify.log.info(`Exotel Connect Webhook received call from ${From} to virtual number ${To}`);

  try {
    // 1. Clean the incoming From number to search in DB
    const cleanFrom = From ? From.replace(/\D/g, '').slice(-10) : '';

    let destinations: Array<{ contact_uri: string }> = [];

    if (cleanFrom) {
      // Find the user by phone number (matching last 10 digits to be safe)
      const clientUser = await prisma.user.findFirst({
        where: {
          phone: { endsWith: cleanFrom }
        }
      });

      if (clientUser) {
        // Find the latest active lead for this user with an assigned lawyer
        const lead = await prisma.lead.findFirst({
          where: {
            userId: clientUser.id,
            lawyerId: { not: null },
            status: { in: ['NEW', 'ASSIGNED'] }
          },
          orderBy: { createdAt: 'desc' },
          include: { lawyer: true }
        });

        if (lead && lead.lawyer && lead.lawyer.phone) {
          const lawyerPhone = formatPhoneNumber(lead.lawyer.phone);
          destinations.push({ contact_uri: lawyerPhone });
          fastify.log.info(`Exotel Connect: Routed client ${cleanFrom} to assigned lawyer ${lawyerPhone}`);
        }
      }
    }

    // Fallback destinations if no active lead/assigned lawyer found
    if (destinations.length === 0) {
      // Default fallback numbers (e.g. support or main admin numbers)
      const defaultPhones = ['+916307640107', '+919163080411'];
      destinations = defaultPhones.map(phone => ({ contact_uri: phone }));
      fastify.log.info(`Exotel Connect: No active assignment found, routing to default fallback numbers`);
    }

    // Return the response format expected by CCM Programmable Connect
    return reply.status(200).send({
      fetch_after_attempt: false,
      destination: destinations,
      state_management: true,
      outgoing_phone_number: To, // Dial out using the same virtual ExoPhone number
      sticky_agent: false,
      recording: {
        record: true,
        channels: "single"
      },
      max_ringing_duration: 30,
      max_conversation_duration: 900,
      music_on_hold: {
        type: "default_tone"
      }
    });
  } catch (error: any) {
    fastify.log.error('Exotel Connect Webhook Error:', error);
    // If anything fails, return fallback support number so call doesn't get dropped
    return reply.status(200).send({
      fetch_after_attempt: false,
      destination: [{ contact_uri: "+916307640107" }],
      state_management: false,
      recording: { record: false }
    });
  }
});

fastify.post('/api/leads/:id/decline', async (request: any, reply: any) => {
  const { id } = request.params;
  const userId = request.headers['x-user-id'] as string;
  
  try {
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId }
    });

    if (!lawyerProfile) return reply.status(404).send({ error: 'Lawyer profile not found' });

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    const isAssigned = lead.lawyerId === lawyerProfile.id;
    const isNotified = lead.notifiedLawyerIds.includes(lawyerProfile.id);

    if (!isAssigned && !isNotified) {
      return reply.status(400).send({ error: 'Advocate is not invited or assigned to this lead.' });
    }

    const updatedDeclined = Array.from(new Set([...lead.declinedLawyerIds, lawyerProfile.id]));

    if (isAssigned) {
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
    } else {
      const remainingNotified = lead.notifiedLawyerIds.filter(id => id !== lawyerProfile.id);
      if (remainingNotified.length === 0) {
        await prisma.lead.update({
          where: { id },
          data: {
            declinedLawyerIds: updatedDeclined,
            notifiedLawyerIds: [],
            lawyerId: null,
            assignedAt: null,
            slaStatus: 'REASSIGNING'
          }
        });
        await assignLeadToLawyer(id);
      } else {
        await prisma.lead.update({
          where: { id },
          data: {
            declinedLawyerIds: updatedDeclined,
            notifiedLawyerIds: remainingNotified
          }
        });
      }
    }

    return { success: true };
  } catch (error) {
    fastify.log.error(error);
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

    if (updatedLead.lawyerId) {
      const allFeedbackLeads = await prisma.lead.findMany({
        where: {
          lawyerId: updatedLead.lawyerId,
          feedbackRating: { not: null }
        },
        select: {
          feedbackRating: true
        }
      });

      if (allFeedbackLeads.length > 0) {
        const totalRating = allFeedbackLeads.reduce((acc, lead) => acc + (lead.feedbackRating || 0), 0);
        const averageRating = totalRating / allFeedbackLeads.length;

        await prisma.lawyerProfile.update({
          where: { id: updatedLead.lawyerId },
          data: {
            rating: averageRating
          }
        });
      }
    }

    return updatedLead;
  } catch (error) {
    fastify.log.error(error);
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

fastify.get('/api/leads', async (request: any, reply: any) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        lawyer: { include: { user: true } },
        booking: { include: { payment: true } },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return leads;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch leads' });
  }
});

const leadUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  preferredTime: z.string().optional(),
  status: z.string().optional(),
  adminStatus: z.string().optional().nullable(),
  adminComment: z.string().optional().nullable()
}).passthrough();

fastify.put('/api/leads/:id', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  try {
    const data = leadUpdateSchema.parse(request.body);
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.city && { city: data.city }),
        ...(data.category && { category: data.category }),
        ...(data.description && { description: data.description }),
        ...(data.preferredTime && { preferredTime: data.preferredTime }),
        ...(data.status && { status: data.status as any }),
        adminStatus: data.adminStatus !== undefined ? data.adminStatus : undefined,
        adminComment: data.adminComment !== undefined ? data.adminComment : undefined
      }
    });

    if (updatedLead.userId) {
      await prisma.user.update({
        where: { id: updatedLead.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.phone && { phone: data.phone }),
          ...(data.city && { city: data.city })
        }
      });
    }

    return updatedLead;
  } catch (error: any) {
    fastify.log.error(error);
    return reply.status(400).send({ error: 'Invalid data', message: error.message });
  }
});

fastify.post('/api/leads/:id/simulate-accept-timeout', async (request: any, reply: any) => {
  const { id } = request.params as { id: string };
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });
    
    // Mark current assigned and notified lawyers as declined/timed out
    const declinedLawyers = [...(lead.declinedLawyerIds || [])];
    if (lead.lawyerId) declinedLawyers.push(lead.lawyerId);
    if (lead.notifiedLawyerIds && lead.notifiedLawyerIds.length > 0) {
      declinedLawyers.push(...lead.notifiedLawyerIds);
    }
    const updatedDeclined = Array.from(new Set(declinedLawyers));
    
    await prisma.lead.update({
      where: { id },
      data: {
        assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        declinedLawyerIds: updatedDeclined,
        lawyerId: null,
        notifiedLawyerIds: []
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
    if (lead.notifiedLawyerIds && lead.notifiedLawyerIds.length > 0) {
      declinedLawyers.push(...lead.notifiedLawyerIds);
    }
    const updatedDeclined = Array.from(new Set(declinedLawyers));
    
    await prisma.lead.update({
      where: { id },
      data: {
        slaStatus: 'NOT_ATTENDED',
        declinedLawyerIds: updatedDeclined,
        lawyerId: null,
        notifiedLawyerIds: [],
        status: 'NEW' // Reset status to NEW so new lawyers receive invitations
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

if (process.env.NODE_ENV !== 'test') {
  start();
}

// Cache clear trigger
