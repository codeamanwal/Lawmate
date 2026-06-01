const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../lawmate-pwa/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const parts = trimmedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const pg = require('../packages/db/node_modules/pg');
const { PrismaPg } = require('../packages/db/node_modules/@prisma/adapter-pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting lawyer database cleanup...');

  // 1. Find all lawyers
  const lawyers = await prisma.lawyerProfile.findMany({
    include: {
      user: true
    }
  });

  // Filter to find all lawyers except law1@gmail.com
  const lawyersToDelete = lawyers.filter(l => {
    const email = (l.email || '').toLowerCase().trim();
    const userEmail = (l.user?.email || '').toLowerCase().trim();
    return email !== 'law1@gmail.com' && userEmail !== 'law1@gmail.com';
  });

  const deletedEmails = lawyersToDelete.map(l => l.email || l.user?.email).filter(Boolean);
  const lawyerIds = lawyersToDelete.map(l => l.id);
  const userIds = lawyersToDelete.map(l => l.userId).filter(Boolean);

  console.log(`Found ${lawyersToDelete.length} lawyers to delete.`);
  console.log('Emails to delete:', deletedEmails);

  if (lawyerIds.length > 0) {
    // 2. Clean up dependencies
    // A. Delete associated payments & bookings
    const bookings = await prisma.booking.findMany({
      where: {
        lawyerId: { in: lawyerIds }
      }
    });
    const bookingIds = bookings.map(b => b.id);
    const paymentIds = bookings.map(b => b.paymentId).filter(Boolean);

    console.log(`Cleaning up ${bookings.length} bookings and ${paymentIds.length} payments...`);
    
    if (bookingIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: bookingIds } }
      });
    }
    if (paymentIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { id: { in: paymentIds } }
      });
    }

    // B. Set lawyerId to null in Leads
    const leadsUpdated = await prisma.lead.updateMany({
      where: {
        lawyerId: { in: lawyerIds }
      },
      data: {
        lawyerId: null
      }
    });
    console.log(`Updated ${leadsUpdated.count} leads to clear lawyerId.`);

    // C. Set userId to null in Leads for deleted users
    if (userIds.length > 0) {
      const userLeadsUpdated = await prisma.lead.updateMany({
        where: {
          userId: { in: userIds }
        },
        data: {
          userId: null
        }
      });
      console.log(`Updated ${userLeadsUpdated.count} leads to clear userId.`);
    }

    // D. Delete LawyerProfiles
    const deletedProfiles = await prisma.lawyerProfile.deleteMany({
      where: {
        id: { in: lawyerIds }
      }
    });
    console.log(`Deleted ${deletedProfiles.count} lawyer profiles.`);

    // E. Delete Users
    if (userIds.length > 0) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          id: { in: userIds }
        }
      });
      console.log(`Deleted ${deletedUsers.count} user records.`);
    }
  }

  // 3. Create 5 new lawyer profiles
  // Categories: 3 of them 'Property', 2 of them 'Matrimonial'
  const newLawyers = [
    { email: 'testlawyer1@gmail.com', name: 'Test Lawyer 1', categories: ['Property'] },
    { email: 'testlawyer2@gmail.com', name: 'Test Lawyer 2', categories: ['Property'] },
    { email: 'testlawyer3@gmail.com', name: 'Test Lawyer 3', categories: ['Property'] },
    { email: 'testlawyer4@gmail.com', name: 'Test Lawyer 4', categories: ['Matrimonial'] },
    { email: 'testlawyer5@gmail.com', name: 'Test Lawyer 5', categories: ['Matrimonial'] }
  ];

  const hashedPassword = crypto.createHash('sha256').update('12345678').digest('hex');

  console.log('Creating 5 new lawyer profiles...');

  for (const info of newLawyers) {
    // Check if user already exists (just in case)
    const existingUser = await prisma.user.findUnique({
      where: { email: info.email }
    });

    if (existingUser) {
      // Delete existing profile and user to ensure fresh setup
      await prisma.lawyerProfile.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const user = await prisma.user.create({
      data: {
        email: info.email,
        name: info.name,
        role: 'LAWYER',
        password: hashedPassword,
        lawyerProfile: {
          create: {
            name: info.name,
            email: info.email,
            categories: info.categories,
            experience: 5,
            rating: 5.0,
            verified: true,
            isAvailable: true,
            onboardingCompleted: true,
            licenseNumber: 'TEST-' + Math.floor(Math.random() * 100000)
          }
        }
      }
    });

    console.log(`Created Lawyer: ${info.email} with categories: ${info.categories}`);
  }

  console.log('Cleanup and generation completed successfully!');
  console.log('DELETED_EMAILS_JSON:' + JSON.stringify(deletedEmails));
}

main()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
