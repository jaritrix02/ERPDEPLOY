const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    const { employeeId, date, outTime, reason } = req.body;
    const pass = await prisma.employeeGatePass.create({
      data: {
        employeeId,
        date: new Date(date),
        outTime: outTime ? new Date(outTime) : null,
        reason
      }
    });
    res.status(201).json({ success: true, data: pass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateGatePass = async (req, res) => {
    try {
        const { inTime, status, approvedBy } = req.body;
        const pass = await prisma.employeeGatePass.update({
            where: { id: req.params.id },
            data: { 
                inTime: inTime ? new Date(inTime) : undefined,
                status,
                approvedBy
            }
        });
        res.json({ success: true, data: pass });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getGatePasses, createGatePass, updateGatePass };
