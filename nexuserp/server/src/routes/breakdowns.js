const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const data = await prisma.breakdownReport.findMany({
      include: { machine: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { breakdownDate, downTimeStart, downTimeEnd, ...rest } = req.body;
    const data = await prisma.breakdownReport.create({
      data: {
        ...rest,
        breakdownDate: new Date(breakdownDate),
        downTimeStart: new Date(downTimeStart),
        downTimeEnd: downTimeEnd ? new Date(downTimeEnd) : null,
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { breakdownDate, downTimeStart, downTimeEnd, ...rest } = req.body;
    const data = await prisma.breakdownReport.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        breakdownDate: breakdownDate ? new Date(breakdownDate) : undefined,
        downTimeStart: downTimeStart ? new Date(downTimeStart) : undefined,
        downTimeEnd: downTimeEnd ? new Date(downTimeEnd) : null,
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
