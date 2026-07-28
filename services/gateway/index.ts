import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import replyFrom from '@fastify/reply-from';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

const fastify = Fastify({ 
  logger: true,
  bodyLimit: 52428800 // 50MB
});

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-lawmate-key'
});

declare module 'fastify' {
  interface FastifyRequest {
    jwtVerify(): Promise<void>;
  }
}

// Prevent Fastify from consuming the body stream so reply-from can natively proxy POST requests
fastify.addContentTypeParser('*', (req, payload, done) => {
  done(null);
});

// Helper to strip headers that interfere with the proxy
const proxyOptions = (request: any, extraHeaders: any = {}) => {
  const headers = request.headers;
  // Strip expect and host headers
  const { host, expect, ...rest } = headers as Record<string, string>;
  
  const forwardedHost = headers['x-forwarded-host'] || host || '';
  const forwardedProto = headers['x-forwarded-proto'] || 'http';
  
  return {
    rewriteRequestHeaders: () => ({ 
      ...rest, 
      'x-forwarded-host': forwardedHost,
      'x-forwarded-proto': forwardedProto,
      ...extraHeaders 
    })
  };
};

// Register downstream services (we will use full URLs in reply.from)
fastify.register(replyFrom);

const AUTH_SERVICE = 'http://127.0.0.1:3001';
const LEAD_SERVICE = 'http://127.0.0.1:3002';
const PAYMENT_SERVICE = 'http://127.0.0.1:3003';
const PROFILE_SERVICE = 'http://127.0.0.1:3005';

// Auth routes (public)
fastify.all('/api/auth/*', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`, proxyOptions(request));
});

// Leads routes (optional auth)
fastify.post('/api/leads', async (request, reply) => {
  let userHeaders = {};
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    userHeaders = {
      'x-user-id': user.id,
      'x-user-email': user.email
    };
  } catch (err) {}

  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, userHeaders));
});

fastify.delete('/api/leads/:id', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/leads', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/leads/:id', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.put('/api/leads/:id', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/leads/:id/complete', async (request, reply) => {
  let userHeaders = {};
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    userHeaders = {
      'x-user-id': user.id,
      'x-user-email': user.email
    };
  } catch (err) {}

  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, userHeaders));
});

// Public Payment Webhook & Verification (PhonePe & PayU)
fastify.get('/api/payments/prices', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/admin/payments/prices', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/payments/webhook', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/payments/payu-callback', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/payments/payu-submit', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/payments/simulate-success/:leadId', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/leads/:id/simulate-accept-timeout', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/leads/:id/prepare-emergency', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/leads/:id/simulate-attendance-timeout', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/leads/call-status', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/leads/exotel-connect', (request, reply) => {
  return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/payments/verify/:leadId', (request, reply) => {
  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.post('/api/payments/create-link', async (request, reply) => {
  let userHeaders = {};
  try {
    await request.jwtVerify();
    const user = (request as any).user;
    userHeaders = {
      'x-user-id': user.id,
      'x-user-email': user.email
    };
  } catch (err) {}

  return reply.from(`${PAYMENT_SERVICE}${request.url}`, proxyOptions(request, userHeaders));
});

// Protected routes
fastify.register(async (instance) => {
  instance.addHook('onRequest', async (request: any, reply: any) => {
    if (request.method === 'OPTIONS') return;
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  instance.get('/api/leads/my', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email,
      'x-user-role': user.role
    }));
  });

  instance.get('/api/leads/lawyer-calls', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email,
      'x-user-role': user.role
    }));
  });



  instance.get('/api/profiles/*', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${PROFILE_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/profiles/update', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${PROFILE_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/profiles/delete', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${AUTH_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/match', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/accept', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/call', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/decline', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/resolve', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

  instance.post('/api/leads/:id/feedback', (request, reply) => {
    const user = request.user as any;
    return reply.from(`${LEAD_SERVICE}${request.url}`, proxyOptions(request, {
      'x-user-id': user.id,
      'x-user-email': user.email
    }));
  });

}); // End of protected block

fastify.post('/api/profiles/lawyer/update', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/api/profiles/lawyer/me', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`, proxyOptions(request));
}); // Reload trigger to pick up new env keys and database schema

fastify.post('/api/profiles/lawyer/availability', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`, proxyOptions(request));
});

fastify.get('/uploads/*', (request, reply) => {
  return reply.from(`${AUTH_SERVICE}${request.url}`);
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 8000, host: '0.0.0.0' });
    console.log('API Gateway running on port 8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}
