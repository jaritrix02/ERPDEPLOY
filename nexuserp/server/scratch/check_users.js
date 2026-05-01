const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
