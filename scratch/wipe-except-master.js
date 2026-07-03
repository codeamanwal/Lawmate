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
const admin = require('../services/auth/node_modules/firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- STARTING COMPLETE DATA RESET (EXCEPT MASTERDEV) ---');

  const targetEmail = 'masterdev@shugendolabs.com';
  const targetPhone = '7052145255';
  const targetPhoneFull = '+917052145255';
  const targetPassword = 'Shu@2026';

  // 1. Ensure masterdev user exists in Firebase Auth
  let firebaseMasterUid = null;
  try {
    const fbUser = await admin.auth().getUserByEmail(targetEmail);
    firebaseMasterUid = fbUser.uid;
    console.log(`- Found masterdev in Firebase Auth (UID: ${firebaseMasterUid})`);
  } catch (err) {
    console.log('- masterdev not found in Firebase. Creating account...');
    try {
      const newFbUser = await admin.auth().createUser({
        email: targetEmail,
        phoneNumber: targetPhoneFull,
        password: targetPassword,
        displayName: 'Master Dev'
      });
      firebaseMasterUid = newFbUser.uid;
      console.log(`- Created masterdev in Firebase Auth (UID: ${firebaseMasterUid})`);
    } catch (createErr) {
      console.error('Failed to create masterdev in Firebase:', createErr);
    }
  }

  // 2. Ensure masterdev user exists in PostgreSQL Database
  const hashedPassword = crypto.createHash('sha256').update(targetPassword).digest('hex');
  let masterdevUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: targetEmail },
        { phone: targetPhone }
      ]
    }
  });

  if (!masterdevUser) {
    console.log('- masterdev not found in database. Creating account...');
    masterdevUser = await prisma.user.create({
      data: {
        email: targetEmail,
        phone: targetPhone,
        name: 'Master Dev',
        password: hashedPassword,
        role: 'CLIENT'
      }
    });
    console.log(`- Created masterdev in PostgreSQL database (ID: ${masterdevUser.id})`);
  } else {
    console.log(`- Found masterdev in database (ID: ${masterdevUser.id})`);
    // Update password to ensure it matches Shu@2026
    await prisma.user.update({
      where: { id: masterdevUser.id },
      data: { password: hashedPassword, phone: targetPhone }
    });
  }

  // 3. Wipe PostgreSQL Tables (Except masterdev relations)
  console.log('Wiping PostgreSQL tables...');

  // Delete all bookings and payments
  const bookingsCount = await prisma.booking.deleteMany({});
  console.log(`- Deleted ${bookingsCount.count} bookings.`);

  const paymentsCount = await prisma.payment.deleteMany({});
  console.log(`- Deleted ${paymentsCount.count} payments.`);

  // Delete all leads except masterdev's leads
  const leadsCount = await prisma.lead.deleteMany({
    where: {
      NOT: {
        OR: [
          { userId: masterdevUser.id },
          { phone: targetPhone }
        ]
      }
    }
  });
  console.log(`- Deleted ${leadsCount.count} leads (except masterdev).`);

  // Delete all lawyer profiles except masterdev (if they were registered as lawyer)
  const profilesCount = await prisma.lawyerProfile.deleteMany({
    where: {
      NOT: {
        userId: masterdevUser.id
      }
    }
  });
  console.log(`- Deleted ${profilesCount.count} lawyer profiles.`);

  // Delete all users except masterdev
  const usersCount = await prisma.user.deleteMany({
    where: {
      NOT: {
        id: masterdevUser.id
      }
    }
  });
  console.log(`- Deleted ${usersCount.count} users (except masterdev).`);

  // Delete OTPs
  const otpsCount = await prisma.otp.deleteMany({});
  console.log(`- Deleted ${otpsCount.count} OTPs.`);

  // 4. Wipe Firebase Authentication Users (Except masterdev)
  console.log('\nWiping Firebase Authentication users...');
  let uids = [];
  let nextPageToken;
  
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      const email = (userRecord.email || '').toLowerCase().trim();
      const phone = userRecord.phoneNumber || '';
      if (email !== targetEmail && !phone.includes(targetPhone) && userRecord.uid !== firebaseMasterUid) {
        uids.push(userRecord.uid);
      }
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`- Found ${uids.length} other users in Firebase Authentication to delete.`);

  if (uids.length > 0) {
    for (let i = 0; i < uids.length; i += 1000) {
      const batch = uids.slice(i, i + 1000);
      const deleteResult = await admin.auth().deleteUsers(batch);
      console.log(`- Successfully deleted ${deleteResult.successCount} other users.`);
    }
  }

  console.log('\n--- DATA RESET COMPLETED SUCCESSFULLY ---');
}

main()
  .catch(e => {
    console.error('Error during wipe:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
