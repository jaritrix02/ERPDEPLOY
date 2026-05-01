const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const data = await prisma.machine.findMany({
      include: { checkpoints: true },
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { checkpoints, ...rest } = req.body;
    const data = await prisma.machine.create({
      data: {
        ...rest,
        checkpoints: {
          create: checkpoints || []
        }
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { checkpoints, ...rest } = req.body;
    
    // Delete old checkpoints and re-create for simplicity in this turn
    if (checkpoints) {
      await prisma.maintenanceCheckpoint.deleteMany({ where: { machineId: req.params.id } });
    }

    const data = await prisma.machine.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        checkpoints: checkpoints ? {
          create: checkpoints
        } : undefined
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.machine.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
