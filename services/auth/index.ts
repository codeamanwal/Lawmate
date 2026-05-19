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
import fs from 'fs';
import fastifyStatic from '@fastify/static';

// Helper to save Base64 as real file
const saveBase64File = (base64String: string | undefined, prefix: string, userId: string) => {
  if (!base64String || typeof base64String !== 'string' || !base64String.includes(';base64,')) {
    return base64String;
  }
  
  try {
    console.log(`Processing ${prefix} for user ${userId}...`);
    const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      console.error(`Invalid base64 format for ${prefix}`);
      return base64String;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    let extension = mimeType.split('/')[1];
    if (extension === 'jpeg') extension = 'jpg';
    
    const filename = `${prefix}_${userId}_${Date.now()}.${extension}`;
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    console.log(`✅ Saved physical file: ${filename} (${Math.round(base64Data.length / 1024)} KB)`);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error(`❌ File save error for ${prefix}:`, error);
    return base64String;
  }
};

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });


// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,

  }),
});

const fastify = Fastify({ 
  logger: true,
  bodyLimit: 52428800 // 50MB
});

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

fastify.register(cors);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/',
});
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

  try {
    // Generate OTP (Hardcoded to 123456 to bypass Render SMTP firewall in production tests)
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // 2. Bypass Email for Render testing (to prevent firewall hanging)
    console.log(`[TEST MODE] OTP for ${email} is: ${otp}`);
    
    /* 
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
    */

    return { success: true, message: 'OTP logged to console. Check server logs!' };
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

// 3. Instant Connect (Masked Call Request)
fastify.all('/api/auth/instant-call', async (request: any, reply: any) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    // Extract user ID from token
    const decoded = fastify.jwt.verify(token) as { id: string };
    
    // Get client details
    const clientUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!clientUser) return reply.status(404).send({ error: 'User not found' });

    // Find the target lawyers by phone number
    const targetPhones = ['6307640107', '9163080411'];
    const lawyers = await prisma.lawyerProfile.findMany({
      where: {
        user: { phone: { in: targetPhones } }
      },
      include: { user: true }
    });

    if (lawyers.length > 0) {
      // Create a Lead for each found lawyer
      for (const lawyer of lawyers) {
        await prisma.lead.create({
          data: {
            userId: clientUser.id,
            name: clientUser.name || 'Anonymous Client',
            phone: clientUser.phone || 'Unknown Phone',
            city: clientUser.city || 'Unknown City',
            category: 'Instant Consultation',
            description: 'Client requested an instant secure connection from the dashboard.',
            preferredTime: 'ASAP',
            lawyerId: lawyer.id,
            status: 'NEW'
          }
        });
        console.log(`[SECURE CALL] Assigned to Lawyer: ${lawyer.user.name || 'Advocate'} (${lawyer.user.phone})`);
      }
    } else {
      console.log(`[SECURE CALL] No target lawyers found! Proceeding with fallback.`);
    }
    
    // We return success and the business number
    return { 
      success: true, 
      message: 'Secure connection initiated',
      businessNumber: '+91 7292002026' // Official business number
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to initiate secure call' });
  }
});

fastify.post('/api/auth/verify', async (request: any, reply: any) => {
  const { idToken } = request.body as { idToken: string };

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;
    const email = decodedToken.email;

    if (!phone && !email) return reply.status(400).send({ error: 'Identity info missing in token' });

    // Find user by email or phone
    let user = await prisma.user.findFirst({ 
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      },
      include: { lawyerProfile: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || `${phone}@phone.auth`,
          phone: phone ?? null,
          role: 'CLIENT'
        },
        include: { lawyerProfile: true }
      });
    }

    if (!user) return reply.status(500).send({ error: 'Failed to create user session' });

    // Role Enforcement for Firebase users
    const { role: requestedRole } = request.body;
    if (requestedRole && user.role !== requestedRole) {
      return reply.status(403).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, { expiresIn: '7d' });

    return { token, user };
  } catch (error) {
    console.error('VERIFY ERROR:', error);
    return reply.status(401).send({ error: 'Invalid credentials' });
  }
});

// 4. Lawyer Signup
fastify.post('/api/auth/lawyer/signup', async (request: any, reply: any) => {
  const data = request.body;
  const { role } = request.body; // Path role

  try {
    // Check if user already exists
    const existing = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { email: data.email },
          { phone: data.phone?.toString() }
        ]
      } 
    });
    
    if (existing) {
      const reason = existing.email === data.email ? 'Email already registered' : 'Mobile number already registered';
      return reply.status(409).send({ error: reason });
    }

    // Create User and LawyerProfile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone?.toString(),
        name: data.fullName,
        city: data.city,
        role: 'LAWYER',
        lawyerProfile: {
          create: {
            licenseNumber: data.licenseNumber,
            experience: data.experience ? parseInt(data.experience.toString()) : 0,
            categories: data.practiceAreas || [],
            state: data.state,
            address: data.address,
            verified: false 
          }
        }
      }
    });

    // Generate OTP (Hardcoded for testing to bypass Render email firewall)
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await prisma.otp.upsert({
      where: { email: data.email },
      update: { code: otp, expiresAt },
      create: { email: data.email, code: otp, expiresAt }
    });

    // Bypass Email
    console.log(`[TEST MODE] Lawyer Signup OTP for ${data.email} is: ${otp}`);

    return { success: true, userId: user.id };
  } catch (error: any) {
    console.error('SIGNUP ERROR:', error);
    return reply.status(500).send({ error: `Registration failed: ${error.message}` });
  }
});

// 5. Set Password
fastify.post('/api/auth/set-password', async (request: any, reply: any) => {
  const { userId, password } = request.body;
  
  try {
    // In real production, use bcrypt. Here we'll use a simple sha256 for demo safety
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to set password' });
  }
});

// 6. Login (Email + Password)
fastify.post('/api/auth/login', async (request: any, reply: any) => {
  const { email, password, role } = request.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { lawyerProfile: true }
    });
    if (!user || !user.password) return reply.status(401).send({ error: 'Invalid credentials' });

    // Role Check
    if (role && user.role !== role) {
      return reply.status(403).send({ error: 'Invalid email or password' });
    }

    const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedInput !== user.password) return reply.status(401).send({ error: 'Invalid email or password' });

    const token = await fastify.jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, { expiresIn: '7d' });

    return { token, user };
  } catch (error) {
    return reply.status(500).send({ error: 'Login failed' });
  }
});

// 7. Update Lawyer Profile (Onboarding)
fastify.post('/api/profiles/lawyer/update', async (request: any, reply: any) => {
  console.log('RECEIVED LAWYER UPDATE REQUEST:', request.body);
  const { bio, languages, categories, availability, onboardingCompleted, enrollmentCert, panCard, degreeCert, photo } = request.body;
  const authHeader = request.headers.authorization;
  
  if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  
  try {
    console.log('--- STARTING PROFILE UPDATE ---');
    console.log('Incoming Docs Check:', {
      enrollment: enrollmentCert ? enrollmentCert.substring(0, 50) + '...' : 'EMPTY',
      pan: panCard ? panCard.substring(0, 50) + '...' : 'EMPTY',
    });
    const decoded = fastify.jwt.verify(token) as { id: string };
    if (!decoded.id) {
      console.error('Update failed: Invalid token ID');
      return reply.status(401).send({ error: 'Invalid token payload' });
    }

    const enrollmentPath = saveBase64File(enrollmentCert, 'enrollment', decoded.id);
    const panPath = saveBase64File(panCard, 'pancard', decoded.id);
    const degreePath = saveBase64File(degreeCert, 'degree', decoded.id);
    const photoPath = saveBase64File(photo, 'photo', decoded.id);

    const userRecord = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    const updateData: any = {
      bio,
      languages,
      categories,
      availability,
      enrollmentCert: enrollmentPath,
      panCard: panPath,
      degreeCert: degreePath,
      photo: photoPath,
      name: userRecord?.name,
      email: userRecord?.email,
      phone: userRecord?.phone
    };

    if (onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = onboardingCompleted;
    }

    // Two-step approach: Find first, then update or create
    let profile = await prisma.lawyerProfile.findUnique({
      where: { userId: decoded.id }
    });

    if (profile) {
      await prisma.lawyerProfile.update({
        where: { userId: decoded.id },
        data: updateData
      });
    } else {
      await prisma.lawyerProfile.create({
        data: {
          ...updateData,
          userId: decoded.id,
          experience: 0,
          licenseNumber: "PENDING"
        }
      });
    }

    const finalUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { lawyerProfile: true }
    });

    return reply.send({ success: true, user: finalUser });
  } catch (error: any) {
    console.error('CRITICAL PROFILE UPDATE ERROR:', error);
    return reply.status(500).send({ error: `Server Error: ${error.message}` });
  }
});

// 8. Get My Lawyer Profile
fastify.get('/api/profiles/lawyer/me', async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];

  try {
    const decoded = fastify.jwt.verify(token) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { lawyerProfile: true }
    });
    return { success: true, user };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});

// 8b. Update Availability
fastify.post('/api/profiles/lawyer/availability', async (request: any, reply: any) => {
  const { isAvailable } = request.body;
  const authHeader = request.headers.authorization;
  if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];

  try {
    const decoded = fastify.jwt.verify(token) as { id: string };
    
    // Find or create profile robustly to prevent 500 crashes
    let profile = await prisma.lawyerProfile.findUnique({
      where: { userId: decoded.id }
    });

    if (profile) {
      profile = await prisma.lawyerProfile.update({
        where: { userId: decoded.id },
        data: { isAvailable }
      });
    } else {
      const userRecord = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      profile = await prisma.lawyerProfile.create({
        data: {
          userId: decoded.id,
          isAvailable,
          experience: 0,
          licenseNumber: "PENDING",
          name: userRecord?.name,
          email: userRecord?.email,
          phone: userRecord?.phone
        }
      });
    }

    return reply.send({ success: true, isAvailable: profile.isAvailable });
  } catch (error: any) {
    console.error('CRITICAL: Failed to update availability:', error);
    return reply.status(500).send({ error: `Server Error: ${error.message}` });
  }
});

// 7. Forgot Password (Send OTP)
fastify.post('/api/auth/forgot-password', async (request: any, reply: any) => {
  const { email } = request.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    // Generate OTP (Hardcoded to 123456 to bypass Render SMTP firewall in production tests)
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt }
    });

    // Bypass Email
    console.log(`[TEST MODE] Forgot Password OTP for ${email} is: ${otp}`);

    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to send reset code' });
  }
});

// 8. Reset Password
fastify.post('/api/auth/reset-password', async (request: any, reply: any) => {
  const { email, code, newPassword } = request.body;
  
  try {
    // 1. Verify OTP
    const record = await prisma.otp.findUnique({ where: { email } });
    if (!record || record.code !== code || new Date() > record.expiresAt) {
      return reply.status(400).send({ error: 'Invalid or expired code' });
    }

    // 2. Hash and Update Password
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // 3. Clear OTP
    await prisma.otp.delete({ where: { email } });

    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to reset password' });
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
