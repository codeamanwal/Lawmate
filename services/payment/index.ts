import Fastify from 'fastify';
import cors from '@fastify/cors';
import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

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

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: 99900, // ₹999 in paise
      currency: 'INR',
      receipt: leadId,
    });

    // Create Payment record in DB
    await prisma.payment.create({
      data: {
        amount: 99900,
        razorpayOrderId: order.id,
        status: 'created',
      }
    });

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
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { 
          status: 'captured',
          razorpayPaymentId: payload.payment.entity.id,
          razorpaySignature: signature
        }
      });
      
      // Also update Lead/Booking status here
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
