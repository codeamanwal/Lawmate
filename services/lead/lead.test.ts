import { describe, expect, test, jest, beforeAll, afterAll } from '@jest/globals';
import { formatExotelPhoneNumber, formatPhoneNumber, fastify, prisma, pool } from './index';
import supertest from 'supertest';

// Mock Prisma Client using the exact path imported by the index file
jest.mock('../../packages/db/node_modules/@prisma/client/index.js', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        lead: {
          findUnique: jest.fn(),
          update: jest.fn()
        },
        lawyerProfile: {
          findUnique: jest.fn()
        },
        $disconnect: jest.fn().mockImplementation(() => Promise.resolve())
      };
    })
  };
});

describe('Phone Number Formatting Helpers', () => {
  test('formatExotelPhoneNumber should prepend 0 and clean non-digits', () => {
    expect(formatExotelPhoneNumber('+919198266455')).toBe('09198266455');
    expect(formatExotelPhoneNumber('9198266455')).toBe('09198266455');
    expect(formatExotelPhoneNumber('+916307640107')).toBe('06307640107');
    expect(formatExotelPhoneNumber('6307640107')).toBe('06307640107');
    expect(formatExotelPhoneNumber('07292002026')).toBe('07292002026');
  });

  test('formatPhoneNumber should format standard 10-digit Indian numbers with +91', () => {
    expect(formatPhoneNumber('9826645532')).toBe('+919826645532');
    expect(formatPhoneNumber('+919826645532')).toBe('+919826645532');
    expect(formatPhoneNumber('09826645532')).toBe('+919826645532');
  });
});

describe('POST /api/leads/:id/call Endpoint Routing', () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await pool.end();
    await prisma.$disconnect();
  });

  test('should return 404 if lawyer profile is not found', async () => {
    // Mock the database findUnique behavior
    (prisma.lawyerProfile.findUnique as any).mockResolvedValue(null);

    const response = await supertest(fastify.server)
      .post('/api/leads/cd758003-cf78-4946-9437-9b45f969a069/call')
      .set('x-user-id', 'non-existent-user-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Lawyer profile not found' });
  });
});
