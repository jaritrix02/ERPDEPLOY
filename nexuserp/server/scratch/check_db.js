const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@nexuserp.com' }
    });
    if (user) {
      console.log('✅ ADMIN USER EXISTS:', user.email, 'ROLE:', user.role);
    } else {
      console.log('❌ ADMIN USER NOT FOUND. Please run: npm run seed');
    }
  } catch (err) {
    console.error('❌ DATABASE ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
