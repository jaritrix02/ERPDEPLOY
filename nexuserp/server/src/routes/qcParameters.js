const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

// Get all parameters
router.get('/', async (req, res) => {
  try {
    const data = await prisma.qCParameter.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create parameter
router.post('/', async (req, res) => {
  try {
    const data = await prisma.qCParameter.create({ data: req.body });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update parameter
router.put('/:id', async (req, res) => {
  try {
    const data = await prisma.qCParameter.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete parameter
router.delete('/:id', async (req, res) => {
  try {
    await prisma.qCParameter.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
