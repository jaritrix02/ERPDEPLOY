const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const connectDB = async () => {
  try {
    console.log('[DB] Attempting to connect to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Database connection established successfully');
    
    // Check if we can actually query the DB
    const userCount = await prisma.user.count();
    console.log(`[DB] Connected! Current user count: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error('   👉 Ensure PostgreSQL is running and your .env DATABASE_URL is correct.');
    return false;
  }
};

module.exports = { prisma, connectDB };
