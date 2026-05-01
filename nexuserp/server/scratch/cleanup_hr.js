const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupHR() {
  console.log('🧹 CLEANING UP HR & ATTENDANCE DATA...');

  try {
    // 1. Delete dependent records first
    await prisma.salarySlip.deleteMany();
    await prisma.employeeAdvance.deleteMany();
    await prisma.employeeGatePass.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.indentItem.deleteMany();
    await prisma.indent.deleteMany();
    
    // 2. Delete Employees
    await prisma.employee.deleteMany();
    
    // 3. Optional: Delete Departments (User didn't ask but usually goes together)
    // await prisma.department.deleteMany();

    console.log('✅ PERSONNEL AND ATTENDANCE RECORDS DELETED SUCCESSFULLY.');
  } catch (err) {
    console.error('❌ CLEANUP FAILED:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupHR();
