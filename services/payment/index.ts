import Fastify from 'fastify';
import cors from '@fastify/cors';
import Razorpay from 'razorpay';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import dotenv from 'dotenv';
import crypto from 'crypto';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ logger: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});


fastify.register(cors);

fastify.post('/api/payments/create-link', async (request: any, reply: any) => {
  const { leadId } = request.body as { leadId: string };
  
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    // Check if we already have a payment/order for this lead
    let payment = await prisma.payment.findFirst({
      where: { booking: { leadId: lead.id } }
    });

    let order;
    if (!payment) {
      // Create Razorpay Order
      order = await razorpay.orders.create({
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        receipt: leadId,
      });

      // Create Payment record in DB
      payment = await prisma.payment.create({
        data: {
          amount: 99900,
          razorpayOrderId: order.id,
          status: 'created',
        }
      });
    }

    // Ensure a valid User exists for this lead
    let user = await prisma.user.findUnique({ where: { phone: lead.phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone: lead.phone, name: lead.name, city: lead.city } });
    }

    // Ensure a valid Lawyer exists to assign this booking
    let dummyLawyer = await prisma.lawyerProfile.findFirst();
    if (!dummyLawyer) {
      const dummyUser = await prisma.user.create({ data: { phone: '9999999999', name: 'LawMate Expert', role: 'LAWYER' } });
      dummyLawyer = await prisma.lawyerProfile.create({ data: { userId: dummyUser.id, categories: ['General'], verified: true } });
    }

    // Update lead with userId if it was missing
    if (!lead.userId) {
      await prisma.lead.update({ where: { id: lead.id }, data: { userId: user.id } });
    }

    // Check if booking already exists
    let booking = await prisma.booking.findUnique({ where: { leadId: lead.id } });
    
    if (!booking) {
      // Create Booking record in DB
      await prisma.booking.create({
        data: {
          leadId: lead.id,
          clientId: user.id,
          lawyerId: lead.lawyerId || dummyLawyer.id,
          status: 'PENDING',
          paymentId: payment.id
        }
      });
    }


    // Generate Payment Link
    const paymentLink = await razorpay.paymentLink.create({
      amount: 99900,
      currency: 'INR',
      accept_partial: false,
      description: `Legal Consultation for ${lead.category}`,
      customer: {
        name: lead.name,
        contact: lead.phone,
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL}/success`,
      callback_method: 'get'
    });

    return paymentLink;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to create payment link' });
  }
});

// Webhook for reliable status updates
fastify.post('/api/payments/webhook', async (request: any, reply: any) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const signature = request.headers['x-razorpay-signature'] as string;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(request.body))
    .digest('hex');

  if (signature === expectedSignature) {
    const event = (request.body as any).event;
    const payload = (request.body as any).payload;

    if (event === 'payment.captured') {
      const orderId = payload.payment.entity.order_id;
      const updatedPayment = await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { 
          status: 'captured',
          razorpayPaymentId: payload.payment.entity.id,
          razorpaySignature: signature
        },
        include: { booking: true }
      });
      
      // If there's a booking associated, update its status
      if (updatedPayment.booking) {
        await prisma.booking.update({
          where: { id: updatedPayment.booking.id },
          data: { status: 'CONFIRMED' }
        });

        await prisma.lead.update({
          where: { id: updatedPayment.booking.leadId },
          data: { status: 'COMPLETED' }
        });
      }
    }

  }

  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Payment service running on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
