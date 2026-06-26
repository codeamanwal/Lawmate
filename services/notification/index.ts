import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { z } from 'zod';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const fastify = Fastify({ logger: true });
fastify.register(cors);

const notifySchema = z.object({
  type: z.enum(['PUSH', 'SMS', 'WHATSAPP']),
  to: z.string(),
  title: z.string().optional(),
  message: z.string(),
});

fastify.post('/api/notifications/send', async (request: any, reply: any) => {
  try {
    const { type, to, title, message } = notifySchema.parse(request.body);

    if (type === 'PUSH') {
      await admin.messaging().send({
        token: to,
        notification: { title, body: message },
        android: { priority: 'high' }
      });
    } else if (type === 'WHATSAPP') {
      // Integration with WhatsApp API (e.g. Twilio, Meta)
      console.log(`Sending WhatsApp to ${to}: ${message}`);
    } else if (type === 'SMS') {
      console.log(`Sending SMS to ${to}: ${message}`);
    }

    return { status: 'sent' };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to send notification' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3004, host: '0.0.0.0' });
    console.log('Notification service running on port 3004');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}
