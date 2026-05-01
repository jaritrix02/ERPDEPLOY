const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding records...');

  const employees = await prisma.employee.findMany({ take: 10 });

  if (employees.length === 0) {
    console.log('No employees found to seed records for.');
    return;
  }

  // Seed Salary Slips for March
  for (const emp of employees) {
    const earnings = [
      { head: 'Basic', amount: emp.salary * 0.5 },
      { head: 'HRA', amount: emp.salary * 0.3 },
      { head: 'Conveyance', amount: emp.salary * 0.2 }
    ];
    const deductions = [
      { head: 'PF', amount: 1800 },
      { head: 'ESI', amount: emp.salary * 0.0075 }
    ];
    const netPayable = emp.salary - 1800 - (emp.salary * 0.0075);

    await prisma.salarySlip.upsert({
      where: {
        employeeId_month_year: {
          employeeId: emp.id,
          month: 3,
          year: 2024
        }
      },
      update: {},
      create: {
        employeeId: emp.id,
        month: 3,
        year: 2024,
        earnings: JSON.stringify(earnings),
        deductions: JSON.stringify(deductions),
        attendance: JSON.stringify({ present: 26, absent: 0, leave: 1, halfDay: 0 }),
        netPayable: netPayable,
        modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Seed Data' }])
      }
    });
    console.log(`Created March salary slip for ${emp.name}`);
  }

  // Seed some advances
  for (let i = 0; i < 3; i++) {
    const emp = employees[i % employees.length];
    await prisma.employeeAdvance.create({
      data: {
        employeeId: emp.id,
        amount: 5000 + (i * 1000),
        date: new Date(),
        purpose: 'Festival Advance',
        paymentMode: 'Cash',
        referenceNo: `VCH-${2024}-${100 + i}`,
        status: 'PENDING'
      }
    });
  }
  console.log('Created 3 advance records');

  // Seed some gate passes
  for (let i = 0; i < 3; i++) {
    const emp = employees[i % employees.length];
    await prisma.employeeGatePass.create({
      data: {
        employeeId: emp.id,
        date: new Date(),
        outTime: new Date(),
        reason: 'Personal Work',
        passType: 'Personal',
        gatePassNo: `GP-2024-000${i+1}`,
        status: 'OUT'
      }
    });
  }
  console.log('Created 3 gate pass records');

  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
