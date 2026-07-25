import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory (.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
  }),
});

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearFirebase() {
  console.log('=== Starting Firebase Authentication Cleanup ===');
  let nextPageToken;
  let totalDeleted = 0;
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const uids = listUsersResult.users
      .filter((user) => user.email !== 'masterdev@shugendolabs.com')
      .map((user) => user.uid);
    if (uids.length > 0) {
      const deleteResult = await admin.auth().deleteUsers(uids);
      totalDeleted += deleteResult.successCount;
      console.log(`Deleted ${deleteResult.successCount} users from Firebase Auth.`);
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  console.log(`=== Firebase Cleanup Completed. Total deleted: ${totalDeleted} users ===`);
}

async function clearDatabase() {
  console.log('=== Starting PostgreSQL Database Cleanup ===');
  
  await prisma.booking.deleteMany();
  console.log('Cleared Booking table.');
  
  await prisma.payment.deleteMany();
  console.log('Cleared Payment table.');

  await prisma.lead.deleteMany();
  console.log('Cleared Lead table.');

  await prisma.lawyerProfile.deleteMany({
    where: {
      user: {
        email: { not: 'masterdev@shugendolabs.com' }
      }
    }
  });
  console.log('Cleared LawyerProfile table (except masterdev).');

  await prisma.user.deleteMany({
    where: {
      email: { not: 'masterdev@shugendolabs.com' }
    }
  });
  console.log('Cleared User table (except masterdev).');

  await prisma.otp.deleteMany();
  console.log('Cleared Otp table.');

  console.log('=== PostgreSQL Database Cleanup Completed ===');
}

async function main() {
  try {
    await clearFirebase();
    await clearDatabase();
    console.log('🎉 WIPE AND RESET COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  }
}

main();
