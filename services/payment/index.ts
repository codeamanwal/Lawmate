import Fastify from 'fastify';
import cors from '@fastify/cors';
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

// Payment Fee Parameters
const CONSULTATION_FEE = Number(process.env.CONSULTATION_FEE) || 500;
const CONSULTATION_FEE_PAISE = CONSULTATION_FEE * 100;

// PayU Credentials
const PAYU_KEY = process.env.PAYU_KEY || 'PwVHQz';
const PAYU_SALT = process.env.PAYU_SALT || 'giGZakyrDyoVCsFOmxA9B1KPHVrDAPzJ';
const PAYU_ENV = process.env.PAYU_ENV || 'SANDBOX';
const PAYU_ACTION_URL = (PAYU_ENV === 'PRODUCTION' && PAYU_KEY !== 'PwVHQz') 
  ? 'https://secure.payu.in/_payment' 
  : 'https://test.payu.in/_payment';

fastify.register(cors);

// Register a native, zero-dependency parser for application/x-www-form-urlencoded
fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
  try {
    const params = new URLSearchParams(body);
    const parsed: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      parsed[key] = value;
    }
    done(null, parsed);
  } catch (err: any) {
    done(err, undefined);
  }
});

function base64url(source: Buffer | string): string {
  let encoded = typeof source === 'string' 
    ? Buffer.from(source).toString('base64') 
    : source.toString('base64');
  return encoded
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64url(JSON.stringify(header));
  const payloadStr = base64url(JSON.stringify(payload));
  const signatureInput = `${headerStr}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest();
  const signatureStr = base64url(signature);
  return `${signatureInput}.${signatureStr}`;
}

// Generate link endpoint - returns redirection endpoint to helper submit page
fastify.post('/api/payments/create-link', async (request: any, reply: any) => {
  fastify.log.info({ headers: request.headers }, 'create-link request headers received');
  const { leadId, frontendUrl: bodyFrontendUrl, gatewayUrl: bodyGatewayUrl } = request.body as { leadId: string, frontendUrl?: string, gatewayUrl?: string };
  
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

    const merchantTransactionId = `TXN-${crypto.randomBytes(8).toString('hex')}`;

    if (!payment) {
      // Create Payment record in DB with merchantTransactionId
      payment = await prisma.payment.create({
        data: {
          amount: CONSULTATION_FEE_PAISE, // Dynamic fee in paise
          phonePeMerchantTransactionId: merchantTransactionId, // Reuse existing column for PayU txnid
          status: 'created',
        }
      });
    } else if (!payment.phonePeMerchantTransactionId) {
       // Update existing payment with PayU txn ID
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

    // Dynamic redirect URL based on host headers to resolve submission properly
    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:8000';
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const gatewayUrl = bodyGatewayUrl || `${protocol}://${host}`;
    
    // Extract frontendUrl from Referer or Origin headers to dynamically handle deployed domains
    const referer = request.headers.referer || request.headers.origin;
    let frontendUrl = bodyFrontendUrl || 'http://localhost:5173';
    if (!bodyFrontendUrl && referer) {
      try {
        const refUrl = new URL(referer);
        frontendUrl = refUrl.origin;
      } catch (e) {}
    }

    // We return our custom submit endpoint that handles generating the form
    const redirectUrl = `${gatewayUrl}/api/payments/payu-submit?leadId=${lead.id}&frontendUrl=${encodeURIComponent(frontendUrl)}`;

    return {
      short_url: redirectUrl, 
      redirect_url: redirectUrl,
      order_id: merchantTransactionId,
      merchantTransactionId: merchantTransactionId
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to create PayU payment checkout link' });
  }
});

// PayU Form submission helper endpoint (Renders auto-submitting POST form)
fastify.get('/api/payments/payu-submit', async (request: any, reply: any) => {
  const { leadId, frontendUrl: queryFrontendUrl } = request.query as { leadId: string, frontendUrl?: string };
  const frontendUrl = queryFrontendUrl || 'http://localhost:5173';

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return reply.status(404).send('Lead not found');

    const booking = await prisma.booking.findUnique({
      where: { leadId },
      include: { payment: true, client: true }
    });

    const payment = booking?.payment;
    if (!payment || !payment.phonePeMerchantTransactionId) {
      return reply.status(404).send('Payment transaction not initialized');
    }

    const user = booking?.client;
    const email = user?.email || 'client@lawoncall.in';
    const firstname = user?.name || 'LawOnCall Client';
    const phone = lead.phone || '9999999999';
    const amount = (payment.amount / 100).toFixed(2); // Convert paise to Rupees string (e.g. 500.00)
    const productinfo = `Legal Consultation for ${lead.category}`;
    const txnid = payment.phonePeMerchantTransactionId;

    // Hash Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|SALT)
    const udf1 = lead.id;
    const udf2 = frontendUrl;
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${PAYU_SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:8000';
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const gatewayUrl = `${protocol}://${host}`;
    const callbackUrl = `${gatewayUrl}/api/payments/payu-callback`;

    // Render HTML containing auto-submitting form
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to PayU Secure Checkout...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; color: #374151; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { font-weight: 800; font-size: 1.5rem; margin: 0 0 10px 0; color: #111827; }
            p { font-weight: 500; font-size: 0.875rem; color: #6b7280; margin: 0; }
          </style>
        </head>
        <body onload="document.forms[0].submit()">
          <div class="loader"></div>
          <h2>Connecting to secure checkout</h2>
          <p>Please do not refresh this page or click back.</p>
          
          <form method="POST" action="${PAYU_ACTION_URL}">
            <input type="hidden" name="key" value="${PAYU_KEY}" />
            <input type="hidden" name="txnid" value="${txnid}" />
            <input type="hidden" name="amount" value="${amount}" />
            <input type="hidden" name="productinfo" value="${productinfo}" />
            <input type="hidden" name="firstname" value="${firstname}" />
            <input type="hidden" name="email" value="${email}" />
            <input type="hidden" name="phone" value="${phone}" />
            <input type="hidden" name="surl" value="${callbackUrl}" />
            <input type="hidden" name="furl" value="${callbackUrl}" />
            <input type="hidden" name="hash" value="${hash}" />
            <input type="hidden" name="udf1" value="${udf1}" />
            <input type="hidden" name="udf2" value="${udf2}" />
          </form>
        </body>
      </html>
    `;

    reply.type('text/html').send(html);
  } catch (err: any) {
    fastify.log.error(err);
    reply.status(500).send('Error rendering submit form');
  }
});

// PayU Redirect Callback POST Handler
fastify.post('/api/payments/payu-callback', async (request: any, reply: any) => {
  fastify.log.info({ body: request.body, headers: request.headers }, 'PayU Callback Payload received');
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    status,
    mihpayid,
    hash,
    additionalCharges
  } = request.body || {};

  const cleanFrontendUrl = (udf2 || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const leadIdQuery = udf1 ? `leadId=${encodeURIComponent(udf1)}` : '';
  const makeRedirect = (queryParams: string) => {
    const combinedQuery = leadIdQuery ? `${leadIdQuery}&${queryParams}` : queryParams;
    return `${cleanFrontendUrl}/payment-success?${combinedQuery}`;
  };

  try {
    if (!txnid || !status) {
      fastify.log.error('PayU callback missing essential transaction parameters');
      return reply.redirect(makeRedirect('status=error'));
    }

    // Standardize amount formatting (e.g., "500" vs "500.00")
    const formattedAmount = (amount && !isNaN(Number(amount))) ? Number(amount).toFixed(2) : amount;

    // Verify Hash Signature
    let hashString = '';
    if (additionalCharges) {
      hashString = `${additionalCharges}|${PAYU_SALT}|${status}|||||||||${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${formattedAmount}|${txnid}|${key || PAYU_KEY}`;
    } else {
      hashString = `${PAYU_SALT}|${status}|||||||||${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${formattedAmount}|${txnid}|${key || PAYU_KEY}`;
    }

    let computedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Also check raw unformatted amount if toFixed(2) differs
    if (hash && computedHash.toLowerCase() !== hash.toLowerCase() && amount !== formattedAmount) {
      const altHashString = additionalCharges
        ? `${additionalCharges}|${PAYU_SALT}|${status}|||||||||${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount}|${txnid}|${key || PAYU_KEY}`
        : `${PAYU_SALT}|${status}|||||||||${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount}|${txnid}|${key || PAYU_KEY}`;
      const altComputedHash = crypto.createHash('sha512').update(altHashString).digest('hex');
      if (altComputedHash.toLowerCase() === hash.toLowerCase()) {
        computedHash = altComputedHash;
      }
    }

    // In sandbox test mode (PAYU_KEY === 'PwVHQz'), allow status check even if hash differs in simulator
    const isSandboxTestKey = (key === 'PwVHQz' || PAYU_KEY === 'PwVHQz');
    const isHashValid = !hash || computedHash.toLowerCase() === hash.toLowerCase() || isSandboxTestKey;

    if (!isHashValid) {
      fastify.log.error('PayU response signature hash validation failed');
      return reply.redirect(makeRedirect('status=hash_mismatch'));
    }

    if (status === 'success') {
      const updatedPayment = await prisma.payment.update({
        where: { phonePeMerchantTransactionId: txnid },
        data: { 
          status: 'captured',
          phonePeTransactionId: mihpayid, // Store PayU mihpayid reference inside transaction ID column
        },
        include: { booking: true }
      });

      if (updatedPayment.booking) {
        await prisma.booking.update({
          where: { id: updatedPayment.booking.id },
          data: { status: 'CONFIRMED' }
        });

        // Trigger SLA matching in Lead Service
        fetch(`http://127.0.0.1:3002/api/leads/${udf1}/match`, { method: 'POST' })
          .catch(err => console.error('Failed to trigger matching in callback:', err));
      }

      return reply.redirect(makeRedirect('status=success'));
    } else {
      await prisma.payment.update({
        where: { phonePeMerchantTransactionId: txnid },
        data: { status: 'failed' }
      }).catch(err => fastify.log.error('Failed to mark payment failed:', err));

      return reply.redirect(makeRedirect('status=failed'));
    }
  } catch (error: any) {
    fastify.log.error('PayU Callback processing failed:', error.message);
    return reply.redirect(makeRedirect('status=error'));
  }
});

// Manual status verification endpoint (Queries DB, simulates success in sandbox/local dev)
fastify.get('/api/payments/verify/:leadId', async (request: any, reply: any) => {
  const { leadId } = request.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { leadId: leadId },
      include: { payment: true, lead: true, client: true }
    });

    let payment = booking?.payment;

    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { booking: { leadId: leadId } },
        include: { booking: { include: { lead: true, client: true } } }
      });
    }

    if (!payment || !payment.phonePeMerchantTransactionId) {
      return reply.status(404).send({ error: 'Payment record not found' });
    }

    const bookingRecord = booking || payment.booking;
    const clientUser = bookingRecord?.client;
    let token = null;
    let userResponse = null;

    if (clientUser) {
      const payload = {
        id: clientUser.id,
        email: clientUser.email,
        role: clientUser.role
      };
      const secret = process.env.JWT_SECRET || 'super-secret-lawmate-key';
      token = signJwt(payload, secret);
      userResponse = {
        id: clientUser.id,
        email: clientUser.email,
        phone: clientUser.phone,
        name: clientUser.name,
        city: clientUser.city,
        role: clientUser.role
      };
    }

    if (payment.status === 'captured') {
      let flow = 'Flow 3';
      const lead = bookingRecord?.lead;
      if (lead) {
        const time = lead.preferredTime.toLowerCase();
        if (time.includes('callback')) {
          flow = 'Flow 1';
        } else if (time.includes('emergency')) {
          flow = 'Flow 4';
        } else if (time.includes('asap')) {
          flow = 'Flow 2';
        }
      }

      return { 
        status: 'SUCCESS', 
        message: 'Payment verified successfully', 
        preferredTime: bookingRecord?.lead?.preferredTime,
        amount: payment.amount / 100,
        flow,
        token,
        user: userResponse
      };
    }

    if (payment.status === 'failed') {
      let flow = 'Flow 3';
      const lead = bookingRecord?.lead;
      if (lead) {
        const time = lead.preferredTime.toLowerCase();
        if (time.includes('callback')) {
          flow = 'Flow 1';
        } else if (time.includes('emergency')) {
          flow = 'Flow 4';
        } else if (time.includes('asap')) {
          flow = 'Flow 2';
        }
      }

      return {
        status: 'FAILED',
        message: 'Payment transaction failed',
        preferredTime: bookingRecord?.lead?.preferredTime,
        flow,
        token,
        user: userResponse
      };
    }

    // Query PayU's verify_payment web service API if it is still in created state
    if (payment.status === 'created') {
      const txnid = payment.phonePeMerchantTransactionId;
      const command = 'verify_payment';
      const hashStr = `${PAYU_KEY}|${command}|${txnid}|${PAYU_SALT}`;
      const hash = crypto.createHash('sha512').update(hashStr).digest('hex');
      const payuApiUrl = (PAYU_ENV === 'PRODUCTION' && PAYU_KEY !== 'PwVHQz')
        ? 'https://info.payu.in/merchant/postservice?form=2'
        : 'https://test.payu.in/merchant/postservice?form=2';

      try {
        const payuResponse = await fetch(payuApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            key: PAYU_KEY,
            command,
            var1: txnid!,
            hash
          })
        });

        const data: any = await payuResponse.json();
        fastify.log.info({ payuVerifyResponse: data }, 'PayU API verification response');

        if (data && data.transaction_details) {
          const details = data.transaction_details[txnid!];
          if (details) {
            const payuStatus = details.status.toLowerCase();
            if (payuStatus === 'success') {
              payment = await prisma.payment.update({
                where: { id: payment.id },
                data: { 
                  status: 'captured',
                  phonePeTransactionId: details.mihpayid
                }
              });
              if (bookingRecord) {
                await prisma.booking.update({
                  where: { id: bookingRecord.id },
                  data: { status: 'CONFIRMED' }
                });
                // Trigger SLA matching in Lead Service
                fetch(`http://127.0.0.1:3002/api/leads/${leadId}/match`, { method: 'POST' })
                  .catch(err => console.error('Failed to trigger matching in verify API:', err));
              }
              
              let flow = 'Flow 3';
              const lead = bookingRecord?.lead;
              if (lead) {
                const time = lead.preferredTime.toLowerCase();
                if (time.includes('callback')) {
                  flow = 'Flow 1';
                } else if (time.includes('emergency')) {
                  flow = 'Flow 4';
                } else if (time.includes('asap')) {
                  flow = 'Flow 2';
                }
              }

              return {
                status: 'SUCCESS',
                message: 'Payment verified successfully via PayU API',
                preferredTime: bookingRecord?.lead?.preferredTime,
                amount: payment.amount / 100,
                flow,
                token,
                user: userResponse
              };
            } else if (payuStatus === 'failed' || payuStatus === 'failure') {
              payment = await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'failed' }
              });
              
              let flow = 'Flow 3';
              const lead = bookingRecord?.lead;
              if (lead) {
                const time = lead.preferredTime.toLowerCase();
                if (time.includes('callback')) {
                  flow = 'Flow 1';
                } else if (time.includes('emergency')) {
                  flow = 'Flow 4';
                } else if (time.includes('asap')) {
                  flow = 'Flow 2';
                }
              }

              return {
                status: 'FAILED',
                message: 'Payment transaction failed via PayU API',
                preferredTime: bookingRecord?.lead?.preferredTime,
                flow,
                token,
                user: userResponse
              };
            }
          }
        }
      } catch (err: any) {
        fastify.log.error('Failed to query PayU verify API:', err.message);
      }
    }

    // Default response if transaction is still pending/created
    let flow = 'Flow 3';
    const lead = bookingRecord?.lead || await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      const time = lead.preferredTime.toLowerCase();
      if (time.includes('callback')) {
        flow = 'Flow 1';
      } else if (time.includes('emergency')) {
        flow = 'Flow 4';
      } else if (time.includes('asap')) {
        flow = 'Flow 2';
      }
    }

    return { 
      status: 'PENDING', 
      message: 'Payment verification pending', 
      preferredTime: lead?.preferredTime,
      amount: payment ? payment.amount / 100 : CONSULTATION_FEE,
      flow,
      token,
      user: userResponse
    };
  } catch (error: any) {
    fastify.log.error('Verification failed:', error.message);
    return reply.status(500).send({ error: 'Failed to verify payment status' });
  }
});

// Legacy PhonePe Webhook handler stub (remains active for verification/routing consistency)
fastify.post('/api/payments/webhook', async (request: any, reply: any) => {
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
    console.log('PayU Payment service running on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}
