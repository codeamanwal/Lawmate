const { PrismaClient } = require('../../packages/db/node_modules/@prisma/client/index.js');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../lawmate-pwa/.env') });

async function run() {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- LATEST LEAD DETAILS ---');
  const latestLead = await prisma.lead.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { booking: true, lawyer: true }
  });

  if (latestLead) {
    console.log(JSON.stringify(latestLead, null, 2));
  } else {
    console.log('No leads found.');
  }

  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
