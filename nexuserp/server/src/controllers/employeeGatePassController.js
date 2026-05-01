const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate GP number like GP-2024-0001
const generateGatePassNo = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.employeeGatePass.count();
  return `GP-${year}-${String(count + 1).padStart(4, '0')}`;
};

const getGatePasses = async (req, res) => {
  try {
    const passes = await prisma.employeeGatePass.findMany({
      include: { employee: true },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: passes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createGatePass = async (req, res) => {
  try {
    const { employeeId, date, outTime, inTime, reason, passType, approvedBy, status } = req.body;

    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee is required' });
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const gatePassNo = await generateGatePassNo();

    const pass = await prisma.employeeGatePass.create({
      data: {
        employeeId,
        gatePassNo,
        passType: passType || 'Personal',
        date: new Date(date),
        outTime: outTime ? new Date(outTime) : null,
        inTime: inTime ? new Date(inTime) : null,
        reason: reason || null,
        approvedBy: approvedBy || null,
        status: status || (inTime ? 'RETURNED' : 'OUT'),
        modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Created', by: req.user.name }])
      },
      include: { employee: true }
    });
    res.status(201).json({ success: true, data: pass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateGatePass = async (req, res) => {
  try {
    const { inTime, outTime, date, status, approvedBy, reason, passType, modifyReason } = req.body;
    
    const existing = await prisma.employeeGatePass.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Gate pass not found' });

    const history = JSON.parse(existing.modifyHistory || '[]');
    history.push({
      when: new Date(),
      reason: modifyReason || 'Updated Record',
      by: req.user.name
    });

    const pass = await prisma.employeeGatePass.update({
      where: { id: req.params.id },
      data: {
        date: date ? new Date(date) : undefined,
        outTime: outTime ? new Date(outTime) : undefined,
        inTime: inTime ? new Date(inTime) : undefined,
        status: status || undefined,
        approvedBy: approvedBy || undefined,
        reason: reason || undefined,
        passType: passType || undefined,
        modifyHistory: JSON.stringify(history)
      },
      include: { employee: true }
    });
    res.json({ success: true, data: pass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteGatePass = async (req, res) => {
  try {
    await prisma.employeeGatePass.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'GATE PASS RECORD DELETED' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

const importGatePasses = async (req, res) => {
  try {
    const list = req.body;
    let count = 0;
    for (const item of list) {
        if (!item.employeeId) continue;
        const gpNo = await generateGatePassNo();
        await prisma.employeeGatePass.create({
            data: {
                employeeId: item.employeeId,
                gatePassNo: gpNo,
                date: new Date(item.date),
                outTime: item.outTime ? new Date(item.outTime) : null,
                inTime: item.inTime ? new Date(item.inTime) : null,
                reason: item.reason || null,
                passType: item.type || 'PERSONAL',
                status: item.status || 'APPROVED'
            }
        });
        count++;
    }
    res.json({ success: true, message: `IMPORTED ${count} GATE PASSES SUCCESSFULLY` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

module.exports = { getGatePasses, createGatePass, updateGatePass, deleteGatePass, importGatePasses };
