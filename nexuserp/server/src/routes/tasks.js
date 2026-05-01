const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

// GET /api/tasks
router.get('/', async (req,res) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start && end) {
        where.date = { gte: new Date(start), lte: new Date(end) };
    }
    const tasks = await prisma.task.findMany({ where, orderBy: { date: 'asc' } });
    res.json({ success: true, data: tasks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/tasks
router.post('/', async (req,res) => {
  try {
    const { date, ...rest } = req.body;
    const task = await prisma.task.create({
      data: { ...rest, date: new Date(date) }
    });
    res.status(201).json({ success: true, data: task });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req,res) => {
  try {
    const { date, ...rest } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const updateData = { ...rest };
    if (date) updateData.date = new Date(date);

    // Timer Logic
    if (req.body.toggleTimer) {
      if (task.timerActive) {
        const elapsed = Math.floor((new Date() - new Date(task.timerStart)) / 1000);
        updateData.totalSeconds = task.totalSeconds + elapsed;
        updateData.timerActive = false;
        updateData.timerStart = null;
      } else {
        updateData.timerActive = true;
        updateData.timerStart = new Date();
      }
    }

    // Completion Audit
    if (req.body.completion === 100 && task.completion < 100) {
      updateData.completedBy = req.user.name;
      updateData.completedAt = new Date();
      updateData.status = 'COMPLETED';
    } else if (req.body.completion < 100) {
      updateData.status = req.body.completion > 0 ? 'IN_PROGRESS' : 'PENDING';
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req,res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
