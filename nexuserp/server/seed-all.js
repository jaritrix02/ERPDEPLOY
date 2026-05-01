const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Starting deep seed process...');

  const employees = await prisma.employee.findMany({ take: 10 });

  if (employees.length === 0) {
    console.log('❌ No employees found. Please add employees first.');
    return;
  }

  const march2024 = new Date(2024, 2, 1); // March 1st, 2024
  const daysInMarch = 31;

  for (const emp of employees) {
    console.log(`\n📦 Seeding data for ${emp.name} (${emp.employeeCode})`);

    // 1. Seed Attendance for March
    console.log(`   - Generating 31 days of attendance...`);
    for (let day = 1; day <= daysInMarch; day++) {
      const date = new Date(2024, 2, day);
      const isSunday = date.getDay() === 0;
      
      let status = 'PRESENT';
      let checkIn = new Date(2024, 2, day, 9, 0, 0);
      let checkOut = new Date(2024, 2, day, 18, 0, 0);
      let hours = 9;

      if (isSunday) {
        status = 'ABSENT'; // Or weekly off, but our enum only has PRESENT/ABSENT/HALF_DAY
        checkIn = null;
        checkOut = null;
        hours = 0;
      } else if (day === 15) {
        status = 'HALF_DAY';
        checkOut = new Date(2024, 2, day, 13, 0, 0);
        hours = 4;
      }

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date: date } },
        update: { status, checkIn, checkOut, hoursWorked: hours },
        create: { employeeId: emp.id, date: date, status, checkIn, checkOut, hoursWorked: hours }
      });
    }

    // 2. Seed 1-2 Advances
    console.log(`   - Recording advances...`);
    await prisma.employeeAdvance.create({
      data: {
        employeeId: emp.id,
        amount: 2000,
        date: new Date(2024, 2, 5),
        purpose: 'Personal emergency',
        paymentMode: 'Cash',
        referenceNo: `ADV-MAR-${emp.employeeCode}-01`,
        status: 'APPROVED'
      }
    });

    // 3. Seed 1-2 Gate Passes
    console.log(`   - Recording gate passes...`);
    await prisma.employeeGatePass.create({
      data: {
        employeeId: emp.id,
        date: new Date(2024, 2, 10),
        outTime: new Date(2024, 2, 10, 14, 0, 0),
        inTime: new Date(2024, 2, 10, 16, 0, 0),
        reason: 'Bank work',
        passType: 'Official',
        gatePassNo: `GP-MAR-${emp.employeeCode}-01`,
        status: 'RETURNED'
      }
    });

    // 4. Seed Salary Slip for March
    console.log(`   - Generating March Salary Slip...`);
    const earnings = [
      { head: 'Basic Pay', amount: emp.salary * 0.4 },
      { head: 'HRA', amount: emp.salary * 0.2 },
      { head: 'DA', amount: emp.salary * 0.2 },
      { head: 'Special Allowance', amount: emp.salary * 0.2 }
    ];
    const deductions = [
      { head: 'PF', amount: 1800 },
      { head: 'ESI', amount: Math.round(emp.salary * 0.0075) },
      { head: 'Professional Tax', amount: 200 }
    ];
    
    // Calculate net
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPayable = totalEarnings - totalDeductions - 2000; // deducting the advance

    await prisma.salarySlip.upsert({
      where: { employeeId_month_year: { employeeId: emp.id, month: 3, year: 2024 } },
      update: {},
      create: {
        employeeId: emp.id,
        month: 3,
        year: 2024,
        earnings: JSON.stringify(earnings),
        deductions: JSON.stringify(deductions),
        advances: JSON.stringify([{ head: 'Festival Advance', amount: 2000 }]),
        attendance: JSON.stringify({ present: 26, absent: 5, leave: 0, halfDay: 0, payDays: 26 }),
        netPayable: netPayable,
        modifyHistory: JSON.stringify([{ when: new Date(), reason: 'System Generated Seed' }])
      }
    });
  }

  console.log('\n✅ Seeding complete! 10 Employees processed for March 2024.');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
