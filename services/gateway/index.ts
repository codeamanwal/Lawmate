import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import replyFrom from '@fastify/reply-from';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ logger: true });

fastify.register(cors);
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-lawmate-key'
});

declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify(): Promise<void>;
  }
}




// Register downstream services (we will use full URLs in reply.from)
fastify.register(replyFrom);

const AUTH_SERVICE = 'http://localhost:3001';
const LEAD_SERVICE = 'http://localhost:3002';
const PAYMENT_SERVICE = 'http://localhost:3003';
const PROFILE_SERVICE = 'http://localhost:3005';

// Auth routes (public)
fastify.all('/api/auth/*', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`, { rewriteRequestHeaders: (req, headers) => headers });
});

// Leads routes (public intake)
fastify.post('/api/leads', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, { rewriteRequestHeaders: (req, headers) => headers });
});


// Protected routes
fastify.register(async (instance) => {
  instance.addHook('onRequest', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  instance.get('/api/leads/my', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, {
      rewriteRequestHeaders: (req, headers) => ({
        ...headers,
        'x-user-id': user.id,
        'x-user-phone': user.phone,
        'x-user-role': user.role
      })
    });
  });

  instance.post('/api/payments/*', (request, reply) => {
    return reply.from(`${PAYMENT_SERVICE}${request.url}`, { rewriteRequestHeaders: (req, headers) => headers });
  });

  instance.get('/api/profiles/*', (request, reply) => {
    return reply.from(`${PROFILE_SERVICE}${request.url}`, { rewriteRequestHeaders: (req, headers) => headers });
  });

  instance.post('/api/profiles/update', (request, reply) => {
    return reply.from(`${PROFILE_SERVICE}${request.url}`, { rewriteRequestHeaders: (req, headers) => headers });
  });

});

const start = async () => {
  try {
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    console.log('API Gateway running on port 8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
