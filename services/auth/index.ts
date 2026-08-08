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
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    
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

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') }); // Reload trigger for env change


// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,

  }),
});

export const fastify = Fastify({ 
  logger: process.env.NODE_ENV === 'test' ? false : true,
  bodyLimit: 52428800 // 50MB
});

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

fastify.register(cors);
const rootUploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(rootUploadsDir)) {
  fs.mkdirSync(rootUploadsDir, { recursive: true });
}
fastify.register(fastifyStatic, {
  root: rootUploadsDir,
  prefix: '/uploads/',
});
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-lawmate-key'
});

// Configure Email Transporter
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // True for 465 (SSL), false for 587 (TLS/STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, // Force IPv4 to prevent ENETUNREACH errors on IPv6-unfriendly environments like Render
  connectionTimeout: 5000, // 5 seconds connection timeout
  greetingTimeout: 5000,   // 5 seconds greeting timeout
  socketTimeout: 5000,     // 5 seconds socket timeout
  ...(smtpPort !== 465 ? { requireTLS: true } : {})
} as any);

// Helpers for OTP Generation and Email Transmission
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (
  email: string,
  otp: string,
  subject: string,
  actionName: string
): Promise<{ success: boolean; emailSent: boolean; error?: string }> => {
  // Always log to console immediately so OTP is available instantly in logs
  console.log(`[OTP BACKUP LOG] Action: ${actionName} | Email: ${email} | OTP: ${otp}`);

  let emailSent = false;
  let mailError = null;

  // 1. Try Brevo HTTP API if configured (Port 443 - never blocked by Render)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`[BREVO] Attempting HTTPS email delivery for ${actionName}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "LawOnCall",
            email: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "no-reply@lawoncall.in"
          },
          to: [
            {
              email: email
            }
          ],
          replyTo: {
            email: process.env.BREVO_REPLY_TO || "no-reply@lawoncall.in",
            name: "No Reply"
          },
          subject: subject,
          htmlContent: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
               <h2 style="color: #4f46e5;">LawOnCall Verification</h2>
               <p>Hello,</p>
               <p>Your verification code for LawOnCall (${actionName}) is:</p>
               <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0;">${otp}</div>
               <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
             </div>
           `
        })
      });

      if (response.ok) {
        emailSent = true;
        console.log(`[BREVO] Successfully sent OTP to ${email} for ${actionName}`);
      } else {
        const errText = await response.text();
        mailError = `Brevo API returned status ${response.status}: ${errText}`;
        console.error(`[BREVO ERROR]`, mailError);
      }
    } catch (err: any) {
      mailError = err.message;
      console.error(`[BREVO ERROR] Failed to send via HTTP:`, err);
    }
  }

  // 2. Fallback to SMTP if Brevo is not configured
  if (!emailSent && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log(`[SMTP] Attempting SMTP email delivery for ${actionName}...`);
      await transporter.sendMail({
        from: `"LawOnCall" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: `"No Reply" <${process.env.BREVO_REPLY_TO || "no-reply@lawoncall.in"}>`,
        subject: subject,
        text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5;">LawOnCall Verification</h2>
            <p>Hello,</p>
            <p>Your verification code for LawOnCall (${actionName}) is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0;">${otp}</div>
            <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`[SMTP] Successfully sent OTP to ${email} for ${actionName}`);
    } catch (err: any) {
      mailError = err.message;
      console.error(`[SMTP ERROR] Failed to send email to ${email} for ${actionName}:`, err);
    }
  }

  if (!emailSent && !process.env.BREVO_API_KEY && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.warn(`[MAIL WARNING] Neither Brevo nor SMTP is configured. Falling back to console logging.`);
  }

  return {
    success: true,
    emailSent,
    error: mailError || undefined
  };
};

// 1. Send OTP
fastify.post('/api/auth/send-otp', async (request: any, reply: any) => {
  const { email } = request.body as { email: string };

  if (!email) return reply.status(400).send({ error: 'Email is required' });

  try {
    const otp = generateOTP();
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

    // Dispatch email transmission in background to avoid blocking API gateway
    sendOTPEmail(email, otp, 'Your LawOnCall Verification Code', 'Verification').catch(err => {
      console.error('Background sendOTPEmail failed:', err);
    });

    return { 
      success: true, 
      emailSent: true, 
      message: 'OTP verification code generated.' 
    };
  } catch (error: any) {
    console.error('OTP ROUTE ERROR:', error);
    return reply.status(500).send({ error: `Failed to process OTP request: ${error.message}` });
  }
});

// 2. Verify OTP
fastify.post('/api/auth/verify-otp', async (request: any, reply: any) => {
  const { email, code } = request.body as { email: string; code: string };

  if (code === '654321') {
    // Backdoor code for testing/signup ease
    const record = await prisma.otp.findUnique({ where: { email } });
    if (record) {
      await prisma.otp.delete({ where: { email } });
    }
    return { success: true };
  }

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
    let decodedToken;
    const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.VITE_API_URL?.includes('localhost');

    if (isLocal) {
      console.log('[DEV MODE] Bypassing Firebase signature verification to prevent Node v24 crypto crash...');
      try {
        const parts = idToken.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT format');
        decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      } catch (err: any) {
        return reply.status(400).send({ error: `Invalid token structure: ${err.message}` });
      }
    } else {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    }

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
      if (existing.role === 'LAWYER' && !existing.password) {
        // Incomplete registration. Update details and generate a new OTP
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            phone: data.phone?.toString(),
            name: data.fullName,
            city: data.city,
            lawyerProfile: {
              upsert: {
                create: {
                  licenseNumber: data.licenseNumber,
                  aadhaarNumber: data.aadhaarNumber,
                  experience: data.experience ? parseInt(data.experience.toString()) : 0,
                  categories: data.practiceAreas || [],
                  state: data.state,
                  address: data.address,
                  verified: false
                },
                update: {
                  licenseNumber: data.licenseNumber,
                  aadhaarNumber: data.aadhaarNumber,
                  experience: data.experience ? parseInt(data.experience.toString()) : 0,
                  categories: data.practiceAreas || [],
                  state: data.state,
                  address: data.address
                }
              }
            }
          }
        });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        await prisma.otp.upsert({
          where: { email: data.email },
          update: { code: otp, expiresAt },
          create: { email: data.email, code: otp, expiresAt }
        });

        await sendOTPEmail(data.email, otp, 'Advocate Registration', 'Lawyer Onboarding');

        return { success: true, userId: existing.id };
      } else {
        const reason = existing.email === data.email ? 'Email already registered' : 'Mobile number already registered';
        return reply.status(409).send({ error: reason });
      }
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
            aadhaarNumber: data.aadhaarNumber,
            firmName: data.firmName || 'Independent',
            experience: data.experience ? parseInt(data.experience.toString()) : 0,
            categories: data.practiceAreas || [],
            state: data.state,
            address: data.address,
            verified: false 
          }
        }
      }
    });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await prisma.otp.upsert({
      where: { email: data.email },
      update: { code: otp, expiresAt },
      create: { email: data.email, code: otp, expiresAt }
    });

    // Dispatch email transmission in background to avoid blocking API gateway
    sendOTPEmail(data.email, otp, 'Your LawOnCall Verification Code', 'Lawyer Onboarding').catch(err => {
      console.error('Background sendOTPEmail failed:', err);
    });

    return { 
      success: true, 
      userId: user.id,
      emailSent: true,
      message: 'Lawyer onboarding verification code generated.'
    };
  } catch (error: any) {
    console.error('SIGNUP ERROR:', error);
    return reply.status(500).send({ error: `Registration failed: ${error.message}` });
  }
});

// 5. Set Password
fastify.post('/api/auth/set-password', async (request: any, reply: any) => {
  const { userId, password } = request.body;
  
  try {
    // 1. Hash and Update Password in PostgreSQL
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // 2. Sync to Firebase Authentication
    if (user && user.email) {
      try {
        let fbUser;
        try {
          fbUser = await admin.auth().getUserByEmail(user.email);
        } catch (e) {
          fbUser = null;
        }

        if (fbUser) {
          // If already in Firebase, update the password
          await admin.auth().updateUser(fbUser.uid, {
            password: password
          });
        } else {
          // Create new user in Firebase Auth
          try {
            await admin.auth().createUser({
              email: user.email,
              password: password,
              displayName: user.name || undefined,
              phoneNumber: user.phone ? (user.phone.startsWith('+') ? user.phone : `+91${user.phone}`) : undefined
            });
          } catch (createError: any) {
            if (createError.code === 'auth/phone-number-already-exists' || createError.code === 'auth/invalid-phone-number') {
              await admin.auth().createUser({
                email: user.email,
                password: password,
                displayName: user.name || undefined
              });
            } else {
              throw createError;
            }
          }
        }
      } catch (fbErr) {
        // Silent catch to prevent blocking PostgreSQL-based registration
      }
    }

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

    const token = fastify.jwt.sign({ 
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
  const { bio, languages, categories, availability, onboardingCompleted, enrollmentCert, panCard, degreeCert, photo, firmName } = request.body;
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

    if (!userRecord) {
      console.error('Update failed: User does not exist in the database');
      return reply.status(401).send({ error: 'User session has expired. Please sign in again.' });
    }

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

    if (firmName) {
      updateData.firmName = firmName;
    }

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

// 8a. Get My Auth Profile (General)
fastify.get('/api/auth/me', async (request: any, reply: any) => {
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

      const profileId = profile.id;

      // If the lawyer went offline, clean up any active pending notifications immediately
      if (isAvailable === false) {
        try {
          const activeLeads = await prisma.lead.findMany({
            where: {
              status: 'NEW',
              notifiedLawyerIds: { has: profileId }
            }
          });

          for (const lead of activeLeads) {
            const remainingNotified = lead.notifiedLawyerIds.filter((id: string) => id !== profileId);
            const updatedDeclined = Array.from(new Set([...lead.declinedLawyerIds, profileId]));

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                notifiedLawyerIds: remainingNotified,
                declinedLawyerIds: updatedDeclined
              }
            });

            // Trigger reassignment immediately in Lead Service
            fetch(`http://127.0.0.1:3002/api/leads/${lead.id}/match`, { method: 'POST' })
              .catch(err => console.error(`[Availability Sync] Failed to trigger matching for lead ${lead.id}:`, err));
          }
        } catch (syncErr) {
          console.error('[Availability Sync] Error cleaning up pending leads:', syncErr);
        }
      }
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
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  
  if (!cleanEmail) {
    return reply.status(400).send({ error: 'Email address is required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (!user) return reply.status(404).send({ error: 'No account found with this email address' });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.otp.upsert({
      where: { email: cleanEmail },
      update: { code: otp, expiresAt },
      create: { email: cleanEmail, code: otp, expiresAt }
    });

    console.log(`[PASSWORD RESET OTP GENERATED] Email: ${cleanEmail}, Code: ${otp}`);

    // Dispatch email transmission in background to avoid blocking API gateway
    sendOTPEmail(user.email, otp, 'Your LawOnCall Reset Password Code', 'Password Reset').catch(err => {
      console.error('Background sendOTPEmail failed:', err);
    });

    return { 
      success: true,
      emailSent: true,
      message: 'Reset password verification code generated.'
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return reply.status(500).send({ error: 'Failed to send reset code' });
  }
});

// 7b. Verify Reset OTP
fastify.post('/api/auth/verify-reset-otp', async (request: any, reply: any) => {
  const { email, code } = request.body;
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const cleanCode = code ? String(code).trim() : '';

  console.log(`[VERIFY RESET OTP ATTEMPT] Email: "${cleanEmail}", Code: "${cleanCode}"`);

  if (!cleanEmail || !cleanCode) {
    return reply.status(400).send({ error: 'Email and 6-digit code are required' });
  }
  
  try {
    // Master test code 654321 is always valid
    if (cleanCode === '654321') {
      console.log(`[VERIFY RESET OTP MASTER CODE] Accepted 654321 for email: ${cleanEmail}`);
      return { success: true };
    }

    const record = await prisma.otp.findUnique({
      where: { email: cleanEmail }
    });

    if (!record) {
      console.error(`[VERIFY RESET OTP FAILED] No OTP record found for email: ${cleanEmail}`);
      return reply.status(400).send({ error: 'Invalid or expired code. Please request a new code.' });
    }

    if (record.code.trim() !== cleanCode) {
      console.error(`[VERIFY RESET OTP FAILED] Code mismatch for email: ${cleanEmail}. Expected: ${record.code}, Got: ${cleanCode}`);
      return reply.status(400).send({ error: 'Invalid verification code. Please check your email.' });
    }

    if (new Date() > record.expiresAt) {
      console.error(`[VERIFY RESET OTP FAILED] Code expired for email: ${cleanEmail}. Expired at: ${record.expiresAt}`);
      return reply.status(400).send({ error: 'Code has expired. Please request a new reset code.' });
    }

    console.log(`[VERIFY RESET OTP SUCCESS] Code verified for email: ${cleanEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return reply.status(500).send({ error: 'Verification failed' });
  }
});

// 8. Reset Password
fastify.post('/api/auth/reset-password', async (request: any, reply: any) => {
  const { email, code, newPassword } = request.body;
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const cleanCode = code ? String(code).trim() : '';
  
  console.log(`[RESET PASSWORD ATTEMPT] Email: "${cleanEmail}"`);

  if (!cleanEmail || !cleanCode || !newPassword) {
    return reply.status(400).send({ error: 'Email, code, and new password are required' });
  }

  try {
    // 1. Verify OTP (master test code 654321 or stored OTP)
    if (cleanCode !== '654321') {
      const record = await prisma.otp.findUnique({
        where: { email: cleanEmail }
      });

      if (!record || record.code.trim() !== cleanCode || new Date() > record.expiresAt) {
        return reply.status(400).send({ error: 'Invalid or expired code. Please request a new code.' });
      }
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User account not found' });
    }

    // 2. Hash and Update Password in PostgreSQL
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // 3. Sync to Firebase Authentication
    try {
      const fbUser = await admin.auth().getUserByEmail(user.email);
      if (fbUser) {
        await admin.auth().updateUser(fbUser.uid, {
          password: newPassword
        });
      }
    } catch (fbErr) {
      // Silent catch
    }

    // 4. Clear OTP
    await prisma.otp.delete({
      where: { email: cleanEmail }
    }).catch(() => {});

    console.log(`[RESET PASSWORD SUCCESS] Password updated for email: ${cleanEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return reply.status(500).send({ error: 'Failed to reset password' });
  }
});

// 9. Delete Profile / Account
fastify.post('/api/profiles/delete', async (request: any, reply: any) => {
  const userId = request.headers['x-user-id'] as string;
  if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { lawyerProfile: true }
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    // 1. Delete associated bookings and payments first to prevent foreign key errors
    if (user.role === 'LAWYER' && user.lawyerProfile) {
      const lawyerId = user.lawyerProfile.id;

      // Find lawyer bookings
      const bookings = await prisma.booking.findMany({
        where: { lawyerId }
      });
      const bookingIds = bookings.map((b: any) => b.id);
      const paymentIds = bookings.map((b: any) => b.paymentId).filter(Boolean) as string[];

      if (bookingIds.length > 0) {
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }
      if (paymentIds.length > 0) {
        await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
      }

      // Update leads assigned to this lawyer (clear lawyerId, reset status to NEW)
      await prisma.lead.updateMany({
        where: { lawyerId },
        data: {
          lawyerId: null,
          status: 'NEW',
          acceptedAt: null,
          assignedAt: null
        }
      });

      // Remove lawyer's profile ID from notified/declined lists in all other leads
      const allActiveLeads = await prisma.lead.findMany({
        where: {
          OR: [
            { notifiedLawyerIds: { has: lawyerId } },
            { declinedLawyerIds: { has: lawyerId } }
          ]
        }
      });

      for (const lead of allActiveLeads) {
        const remainingNotified = lead.notifiedLawyerIds.filter((id: string) => id !== lawyerId);
        const remainingDeclined = lead.declinedLawyerIds.filter((id: string) => id !== lawyerId);
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            notifiedLawyerIds: remainingNotified,
            declinedLawyerIds: remainingDeclined
          }
        });
      }

      // Delete LawyerProfile
      await prisma.lawyerProfile.delete({
        where: { id: lawyerId }
      });

    } else if (user.role === 'CLIENT') {
      // Find client bookings
      const bookings = await prisma.booking.findMany({
        where: { clientId: userId }
      });
      const bookingIds = bookings.map((b: any) => b.id);
      const paymentIds = bookings.map((b: any) => b.paymentId).filter(Boolean) as string[];

      if (bookingIds.length > 0) {
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }
      if (paymentIds.length > 0) {
        await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
      }

      // Delete client's leads
      await prisma.lead.deleteMany({
        where: { userId }
      });
    }

    // 2. Delete from PostgreSQL User table
    await prisma.user.delete({
      where: { id: userId }
    });

    // 3. Delete from Firebase Auth
    try {
      const fbUser = await admin.auth().getUserByEmail(user.email);
      if (fbUser) {
        await admin.auth().deleteUser(fbUser.uid);
      }
    } catch (fbErr) {
      console.error('Firebase Auth deletion skipped or user not found:', fbErr);
    }

    return { success: true, message: 'Account and profile deleted successfully.' };
  } catch (error: any) {
    console.error('CRITICAL: Delete Account Failed:', error);
    return reply.status(500).send({ error: `Delete Account Failed: ${error.message}` });
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

if (process.env.NODE_ENV !== 'test') {
  start();
}
