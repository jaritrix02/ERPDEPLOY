const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/salary
const getSalarySlips = async (req, res) => {
  try {
    const slips = await prisma.salarySlip.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON strings and flatten for frontend
    const formattedSlips = slips.map(slip => {
        const earnings = JSON.parse(slip.earnings || '{}');
        const deductions = JSON.parse(slip.deductions || '{}');
        const attendance = JSON.parse(slip.attendance || '{}');
        const advances = JSON.parse(slip.advances || '{}');
        
        return {
            ...slip,
            ...earnings,
            ...deductions,
            ...attendance,
            ...advances,
            totalEarnings: Object.values(earnings).reduce((a, b) => Number(a) + Number(b), 0),
            totalDeductions: Object.values(deductions).reduce((a, b) => Number(a) + Number(b), 0)
        };
    });

    res.json({ success: true, data: formattedSlips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salary/attendance?empId=...&month=...&year=...
const getEmpAttendanceStats = async (req, res) => {
    try {
        const { empId, month, year } = req.query;
        const now = new Date();
        const selectedMonth = Number(month) || now.getMonth() + 1;
        const selectedYear = Number(year) || now.getFullYear();
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);

        const where = {
            date: { gte: startDate, lte: endDate }
        };

        if (empId) {
            where.employeeId = empId;
        }

        const attendance = await prisma.attendance.findMany({
            where
        });

        const stats = {
            present: attendance.filter(a => a.status === 'PRESENT').length,
            totAbs: attendance.filter(a => a.status === 'ABSENT').length,
            halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
            leave: attendance.filter(a => a.status === 'LEAVE').length,
            othrs: attendance.reduce((sum, a) => sum + (a.hoursWorked > 8 ? a.hoursWorked - 8 : 0), 0),
            payDays: 0 // Will be calculated on frontend or by HR
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// POST /api/salary
const saveSalarySlip = async (req, res) => {
  try {
    const { employeeId, month, year, earnings, deductions, advances, attendance, netPayable, modifyReason } = req.body;
    
    const existing = await prisma.salarySlip.findUnique({
        where: { employeeId_month_year: { employeeId, month: Number(month), year: Number(year) } }
    });

    if (existing) {
        // Update
        const history = JSON.parse(existing.modifyHistory || '[]');
        history.push({
            when: new Date(),
            reason: modifyReason || 'Record Updated',
            netPayable: existing.netPayable
        });

        const slip = await prisma.salarySlip.update({
            where: { id: existing.id },
            data: {
                earnings: JSON.stringify(earnings),
                deductions: JSON.stringify(deductions),
                advances: JSON.stringify(advances),
                attendance: JSON.stringify(attendance),
                netPayable: Number(netPayable),
                modifyHistory: JSON.stringify(history)
            }
        });
        return res.json({ success: true, data: slip });
    }

    const slip = await prisma.salarySlip.create({
      data: {
        employeeId,
        month: Number(month),
        year: Number(year),
        earnings: JSON.stringify(earnings),
        deductions: JSON.stringify(deductions),
        advances: JSON.stringify(advances),
        attendance: JSON.stringify(attendance),
        netPayable: Number(netPayable),
        modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Initial Generation' }])
      }
    });
    res.status(201).json({ success: true, data: slip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const saveBulkSalarySlips = async (req, res) => {
  try {
    const slips = Array.isArray(req.body) ? req.body : req.body?.data;
    if (!Array.isArray(slips) || slips.length === 0) {
      return res.status(400).json({ success: false, message: 'No salary rows provided' });
    }

    const saved = [];
    for (const row of slips) {
      const earnings = row.earnings || {};
      const deductions = row.deductions || {};
      const advances = row.advances || {};
      const attendance = row.attendance || {};
      const totalEarnings = Object.values(earnings).reduce((sum, value) => sum + Number(value || 0), 0);
      const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + Number(value || 0), 0);
      const totalAdvances = Object.values(advances).reduce((sum, value) => sum + Number(value || 0), 0);
      const netPayable = Number(row.netPayable || (totalEarnings - totalDeductions - totalAdvances));

      const slip = await prisma.salarySlip.upsert({
        where: {
          employeeId_month_year: {
            employeeId: row.employeeId,
            month: Number(row.month),
            year: Number(row.year),
          },
        },
        update: {
          earnings: JSON.stringify(earnings),
          deductions: JSON.stringify(deductions),
          advances: JSON.stringify(advances),
          attendance: JSON.stringify(attendance),
          netPayable,
          modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Bulk import/update' }]),
        },
        create: {
          employeeId: row.employeeId,
          month: Number(row.month),
          year: Number(row.year),
          earnings: JSON.stringify(earnings),
          deductions: JSON.stringify(deductions),
          advances: JSON.stringify(advances),
          attendance: JSON.stringify(attendance),
          netPayable,
          modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Bulk import' }]),
        },
      });
      saved.push(slip);
    }

    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSalarySlip = async (req, res) => {
  try {
    await prisma.salarySlip.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Salary slip deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSalarySlips, saveSalarySlip, saveBulkSalarySlips, deleteSalarySlip, getEmpAttendanceStats };
