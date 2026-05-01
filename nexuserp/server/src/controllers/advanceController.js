const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate a simple voucher number like ADV-2024-0001
const generateVoucherNo = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.employeeAdvance.count();
  return `ADV-${year}-${String(count + 1).padStart(4, '0')}`;
};

const getAdvances = async (req, res) => {
  try {
    const { employeeId, status, search } = req.query;
    const advances = await prisma.employeeAdvance.findMany({
      where: {
        employeeId: employeeId || undefined,
        status: status || undefined,
        OR: search ? [
            { referenceNo: { contains: search, mode: 'insensitive' } },
            { purpose: { contains: search, mode: 'insensitive' } },
            { employee: { name: { contains: search, mode: 'insensitive' } } },
            { employee: { employeeCode: { contains: search, mode: 'insensitive' } } }
        ] : undefined
      },
      include: { 
        employee: {
            select: {
                id: true,
                name: true,
                employeeCode: true,
                department: true,
                designation: true,
                employeeAdvances: {
                    where: { status: 'APPROVED' },
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        } 
      },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: advances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAdvance = async (req, res) => {
  try {
    const { employeeId, amount, date, purpose, reason, paymentMode, referenceNo, approvedBy, status } = req.body;

    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee is required' });
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    const autoRef = referenceNo && referenceNo.trim() !== '' ? referenceNo : await generateVoucherNo();

    const advance = await prisma.employeeAdvance.create({
      data: {
        employeeId,
        amount: Number(amount),
        date: new Date(date),
        purpose: purpose || reason || null,
        paymentMode: paymentMode || 'Cash',
        referenceNo: autoRef,
        approvedBy: approvedBy || null,
        status: status || 'PENDING',
      },
      include: { employee: true }
    });
    res.status(201).json({ success: true, data: advance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdvance = async (req, res) => {
  try {
    const { status, approvedBy, amount, date, purpose, reason, paymentMode, referenceNo } = req.body;
    const advance = await prisma.employeeAdvance.update({
      where: { id: req.params.id },
      data: {
        status: status || undefined,
        approvedBy: approvedBy || undefined,
        amount: amount ? Number(amount) : undefined,
        date: date ? new Date(date) : undefined,
        purpose: purpose || reason || undefined,
        paymentMode: paymentMode || undefined,
        referenceNo: referenceNo || undefined,
      },
      include: { employee: true }
    });
    res.json({ success: true, data: advance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdvance = async (req, res) => {
  try {
    await prisma.employeeAdvance.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'ADVANCE RECORD DELETED' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

const importAdvances = async (req, res) => {
  try {
    const list = req.body;
    let count = 0;
    for (const item of list) {
        if (!item.employeeId) continue;
        const ref = await generateVoucherNo();
        await prisma.employeeAdvance.create({
            data: {
                employeeId: item.employeeId,
                amount: Number(item.amount) || 0,
                date: new Date(item.date),
                purpose: item.reason || item.purpose || null,
                referenceNo: ref,
                status: item.status || 'APPROVED'
            }
        });
        count++;
    }
    res.json({ success: true, message: `IMPORTED ${count} ADVANCES SUCCESSFULLY` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

module.exports = { getAdvances, createAdvance, updateAdvance, deleteAdvance, importAdvances };
