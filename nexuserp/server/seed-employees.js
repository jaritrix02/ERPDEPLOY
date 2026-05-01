const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding 10 dummy employees...')
  
  const depts = await prisma.department.findMany()
  const deptName = depts.length > 0 ? depts[0].name : 'IT'
  if (depts.length === 0) {
    await prisma.department.create({ data: { name: 'IT' } })
  }

  let created = 0;
  for (let i = 1; i <= 10; i++) {
    const code = `EMP${String(Math.floor(Math.random() * 9000) + 1000)}`
    try {
      await prisma.employee.create({
        data: {
          employeeCode: code,
          name: `Dummy Employee ${i}`,
          department: deptName,
          designation: 'Software Engineer',
          salary: 50000 + (i * 1000),
          phone: `987654321${i%10}`,
          email: `dummy${i}@nexuserp.com`,
          joiningDate: new Date('2023-01-01'),
          isActive: true
        }
      })
      created++;
      console.log(`✅ Created ${code}`)
    } catch(e) {
      console.log(`❌ Skipped ${code} (already exists or error)`)
    }
  }
  
  console.log(`\n🎉 Successfully added ${created} dummy employees!`)
  process.exit(0)
}

seed()
