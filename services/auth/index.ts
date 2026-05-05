import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import * as admin from 'firebase-admin';
// @ts-ignore
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client/index.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';





import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });


// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,

  }),
});

const fastify = Fastify({ logger: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

fastify.register(cors);
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-lawmate-key'
});

fastify.post('/api/auth/verify', async (request: any, reply: any) => {

  const { idToken } = request.body as { idToken: string };

  try {
    // 1. Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;
    const email = decodedToken.email;

    if (!phone && !email) {
      return reply.status(400).send({ error: 'Identity info missing in token' });
    }

    const identifier = phone || email!;
    // 2. Find or create user in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email: email! }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email!,
          phone: phone || undefined,
          role: 'CLIENT'
        }
      });
    }


    // 3. Issue our own JWT
    const token = fastify.jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, { expiresIn: '7d' });


    return { token, user };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(401).send({ error: 'Unauthorized' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Auth service running on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
