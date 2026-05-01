const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

router.get('/templates', async (req,res) => {
  try {
    const { stage } = req.query;
    const d = await prisma.qCTemplate.findMany({ where: stage ? {stage} : {}, orderBy:{createdAt:'desc'} });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.post('/templates', async (req,res) => {
  try { const d = await prisma.qCTemplate.create({data:req.body}); res.status(201).json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.get('/reports', async (req,res) => {
  try {
    const { stage } = req.query;
    const d = await prisma.qCReport.findMany({
      where: stage ? {stage} : {},
      include:{grn:{include:{po:{include:{vendor:true}}}},template:true},
      orderBy:[{ status: 'asc' }, { createdAt: 'desc' }] // Show PENDING first
    });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.get('/pending/:stage', async (req,res) => {
  try {
    const grns = await prisma.gRN.findMany({
      where:{ status:'APPROVED', qcReports:{ none:{ stage:req.params.stage } } },
      include:{po:{include:{vendor:true,items:{include:{item:true}}}}}
    });
    res.json({success:true,data:grns});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.post('/reports', async (req,res) => {
  try {
    const count = await prisma.qCReport.count();
    const qcNo = `QC${String(count+1).padStart(5,'0')}`;
    const d = await prisma.qCReport.create({
      data:{...req.body, qcNo, createdBy: req.user.name},
      include:{template:true,grn:true}
    });
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.put('/reports/:id', async (req,res) => {
  try {
    const d = await prisma.qCReport.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.post('/reports/:id/approve', async (req,res) => {
  try {
    const d = await prisma.qCReport.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.name,
        approvedAt: new Date()
      }
    });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
