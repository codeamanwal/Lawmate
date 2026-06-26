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
});
