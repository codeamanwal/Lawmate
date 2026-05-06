import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import * as admin from 'firebase-admin';
// @ts-ignore
import { PrismaClient } from '../../packages/db/node_modules/@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import nodemailer from 'nodemailer';
import crypto from 'crypto';





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

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, 
  requireTLS: true, // Force TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 1. Send OTP
fastify.post('/api/auth/send-otp', async (request: any, reply: any) => {
  const { email } = request.body as { email: string };
  if (!email) return reply.status(400).send({ error: 'Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // 1. Save to DB (upsert)
    // We wrap this in a try-catch to see if DB is the problem
    try {
      await prisma.otp.upsert({
        where: { email },
        update: { code: otp, expiresAt },
        create: { email, code: otp, expiresAt }
      });
    } catch (dbErr) {
      console.error('DATABASE ERROR:', dbErr);
      return reply.status(500).send({ error: 'Database error. Please check if OTP model is pushed.' });
    }

    // 2. Send Email
    await transporter.sendMail({
      from: `"LawOnCall" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your LawOnCall Verification Code',
      text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">LawOnCall Verification</h2>
          <p>Hello,</p>
          <p>Your verification code for LawOnCall is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0;">${otp}</div>
          <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('SMTP ERROR:', error);
    return reply.status(500).send({ error: `Failed to send email: ${error.message}` });
  }
});

// 2. Verify OTP
fastify.post('/api/auth/verify-otp', async (request: any, reply: any) => {
  const { email, code } = request.body as { email: string; code: string };

  const record = await prisma.otp.findUnique({ where: { email } });

  if (!record || record.code !== code) {
    return reply.status(400).send({ error: 'Invalid verification code' });
  }

  if (new Date() > record.expiresAt) {
    return reply.status(400).send({ error: 'Code has expired. Please request a new one.' });
  }

  // Success - clear OTP
  await prisma.otp.delete({ where: { email } });

  return { success: true };
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
          phone: phone ?? null,
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
