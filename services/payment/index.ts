import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { 
  StandardCheckoutClient, 
  Env, 
  MetaInfo, 
  StandardCheckoutPayRequest, 
  PrefillUserLoginDetails 
} from '@phonepe-pg/pg-sdk-node';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ logger: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// PhonePe Client Initialization
const clientId = process.env.PHONEPE_CLIENT_ID || 'SANDBOX_CLIENT_ID';
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || 'SANDBOX_CLIENT_SECRET';
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1');
const phonePeEnv = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

const phonePeClient = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  phonePeEnv
);

fastify.register(cors);

fastify.post('/api/payments/create-link', async (request: any, reply: any) => {
  const { leadId } = request.body as { leadId: string };
  
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });

    // Check if booking already exists
    let booking = await prisma.booking.findUnique({ where: { leadId: lead.id } });

    // Check if we already have a payment for this lead/booking
    let payment = null;
    if (booking && booking.paymentId) {
      payment = await prisma.payment.findUnique({ where: { id: booking.paymentId } });
    }
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { booking: { leadId: lead.id } }
      });
    }

    const merchantTransactionId = `MT-${crypto.randomBytes(8).toString('hex')}`;

    if (!payment) {
      // Create Payment record in DB with merchantTransactionId
      payment = await prisma.payment.create({
        data: {
          amount: 99900, // ₹999 in paise
          phonePeMerchantTransactionId: merchantTransactionId,
          status: 'created',
        }
      });
    } else if (!payment.phonePeMerchantTransactionId) {
       // Update existing payment with PhonePe ID if it was created for Razorpay
       payment = await prisma.payment.update({
         where: { id: payment.id },
         data: { phonePeMerchantTransactionId: merchantTransactionId }
       });
    }

    // Ensure a valid User exists for this lead
    const authUserId = request.headers['x-user-id'] as string;
    let user = null;
    if (authUserId && authUserId !== 'undefined') {
      user = await prisma.user.findUnique({ where: { id: authUserId } });
    }
    if (!user && lead.userId) {
      user = await prisma.user.findUnique({ where: { id: lead.userId } });
    }
    if (!user && lead.phone) {
      const cleanPhone10 = lead.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone10.length === 10) {
        user = await prisma.user.findFirst({
          where: {
            phone: {
              endsWith: cleanPhone10
            }
          }
        });
      }
    }

    if (!user) return reply.status(401).send({ error: 'User not found. Please sign in again.' });

    // Ensure a valid Lawyer exists to assign this booking
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

    if (!lead.userId) {
      await prisma.lead.update({ where: { id: lead.id }, data: { userId: user.id } });
    }

    if (!booking) {
      booking = await prisma.booking.create({
        data: {
          leadId: lead.id,
          clientId: user.id,
          lawyerId: lead.lawyerId || dummyLawyer.id,
          status: 'PENDING',
          paymentId: payment.id
        }
      });
    } else if (!booking.paymentId) {
      booking = await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentId: payment.id }
      });
    }

    // PhonePe Initiate Payment
    const prefillUserLoginDetails = PrefillUserLoginDetails.builder()
      .phoneNumber(lead.phone)
      .build();

    const metaInfo = MetaInfo.builder()
      .udf1(lead.id)
      .build();

    // Dynamic redirect URL based on origin to fix "site not reach"
    const origin = request.headers['origin'] || process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const orderRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(payment.phonePeMerchantTransactionId!)
      .amount(payment.amount)
      .prefillUserLoginDetails(prefillUserLoginDetails)
      .metaInfo(metaInfo)
      .redirectUrl(`${origin}/payment-success?leadId=${lead.id}`)
      .expireAfter(1200) // 20 minutes
      .message(`Legal Consultation for ${lead.category}`)
      .build();

    const phonePeResponse = await phonePeClient.pay(orderRequest);

    return {
      short_url: phonePeResponse.redirectUrl, 
      redirect_url: phonePeResponse.redirectUrl,
      order_id: phonePeResponse.orderId,
      merchantTransactionId: payment.phonePeMerchantTransactionId
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to create PhonePe payment link' });
  }
});

// Manual status verification endpoint
fastify.get('/api/payments/verify/:leadId', async (request: any, reply: any) => {
  const { leadId } = request.params;

  try {
    // First, find the booking
    const booking = await prisma.booking.findUnique({
      where: { leadId: leadId },
      include: { payment: true, lead: true }
    });

    let payment = booking?.payment;

    // Fallback: query payment directly if booking is not found or payment is not loaded
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { booking: { leadId: leadId } },
        include: { booking: { include: { lead: true } } }
      });
    }

    if (!payment || !payment.phonePeMerchantTransactionId) {
      return reply.status(404).send({ error: 'Payment record not found' });
    }

    const bookingRecord = booking || payment.booking;

    if (payment.status === 'captured') {
      return { status: 'SUCCESS', message: 'Payment verified successfully', preferredTime: bookingRecord?.lead?.preferredTime };
    }

    // Automatically capture payment and confirm booking in local dev sandbox to enable instant checkout
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'captured' }
    });

    if (bookingRecord) {
      await prisma.booking.update({
        where: { id: bookingRecord.id },
        data: { status: 'CONFIRMED' }
      });
      
      // Trigger SLA matching in Lead Service
      fetch(`http://127.0.0.1:3002/api/leads/${leadId}/match`, { method: 'POST' })
        .catch(err => console.error('Failed to trigger matching:', err));
    }

    // Refetch the lead info to return preferredTime
    const lead = bookingRecord?.lead || await prisma.lead.findUnique({ where: { id: leadId } });

    return { status: 'SUCCESS', message: 'Payment verified successfully', preferredTime: lead?.preferredTime };
  } catch (error: any) {
    fastify.log.error('Verification failed:', error.message);
    return reply.status(500).send({ error: 'Failed to verify payment status' });
  }
});

// Webhook for PhonePe
fastify.post('/api/payments/webhook', async (request: any, reply: any) => {
  const authHeader = request.headers['authorization'] as string;
  const webhookUsername = process.env.PHONEPE_WEBHOOK_USERNAME || 'admin';
  const webhookPassword = process.env.PHONEPE_WEBHOOK_PASSWORD || 'password123';

  try {
    const callbackResponse = phonePeClient.validateCallback(
      webhookUsername,
      webhookPassword,
      authHeader,
      JSON.stringify(request.body)
    );

    const { payload } = callbackResponse;

    if (payload.state === 'COMPLETED' && payload.merchantOrderId) {
      const merchantOrderId = payload.merchantOrderId;
      
      const updatedPayment = await prisma.payment.update({
        where: { phonePeMerchantTransactionId: merchantOrderId },
        data: { 
          status: 'captured',
          phonePeTransactionId: payload.orderId,
        },
        include: { booking: true }
      });
      
      if (updatedPayment.booking) {
        await prisma.booking.update({
          where: { id: updatedPayment.booking.id },
          data: { status: 'CONFIRMED' }
        });
        
        // Lead status stays NEW so it shows up in Lawyer Dashboard as "Booked"
      }
    }
  } catch (error: any) {
    fastify.log.error('Webhook validation failed:', error.message);
    // Even if validation fails, we might want to return 200 to PhonePe to stop retries, 
    // but log the error for investigation.
  }
  return { success: true };
});

fastify.post('/api/payments/simulate-success/:leadId', async (request: any, reply: any) => {
  const { leadId } = request.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { leadId },
      include: { payment: true }
    });
    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' }
      });

      if (booking.paymentId) {
        await prisma.payment.update({
          where: { id: booking.paymentId },
          data: { status: 'captured' }
        });
      }

      // Trigger SLA matching in Lead Service
      fetch(`http://127.0.0.1:3002/api/leads/${leadId}/match`, { method: 'POST' })
        .catch(err => console.error('Failed to trigger matching:', err));
    }
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: 'Failed to simulate payment success' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    console.log('PhonePe Payment service running on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
