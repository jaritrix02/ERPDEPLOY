const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

// --- CHECKLIST MASTERS ---
router.get('/checklists', async (req, res) => {
  try {
    const d = await prisma.checklistMaster.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/checklists', async (req, res) => {
  try {
    const d = await prisma.checklistMaster.create({ data: req.body });
    res.status(201).json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/checklists/:id', async (req, res) => {
  try {
    const d = await prisma.checklistMaster.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/checklists/:id', async (req, res) => {
  try {
    await prisma.checklistMaster.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- KAIZEN MASTERS ---
router.get('/kaizens', async (req, res) => {
  try {
    const d = await prisma.kaizen.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/kaizens', async (req, res) => {
  try {
    const count = await prisma.kaizen.count();
    const kaizenNo = `KZ-${String(count + 1).padStart(4, '0')}`;
    const d = await prisma.kaizen.create({ data: { ...req.body, kaizenNo } });
    res.status(201).json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/kaizens/:id', async (req, res) => {
  try {
    const d = await prisma.kaizen.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/kaizens/:id', async (req, res) => {
  try {
    await prisma.kaizen.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- POKA-YOKE MASTERS ---
router.get('/pokayokes', async (req, res) => {
  try {
    const d = await prisma.pokaYoke.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/pokayokes', async (req, res) => {
  try {
    const count = await prisma.pokaYoke.count();
    const pyNo = `PY-${String(count + 1).padStart(4, '0')}`;
    const d = await prisma.pokaYoke.create({ data: { ...req.body, pyNo } });
    res.status(201).json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/pokayokes/:id', async (req, res) => {
  try {
    const d = await prisma.pokaYoke.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: d });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/pokayokes/:id', async (req, res) => {
  try {
    await prisma.pokaYoke.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
