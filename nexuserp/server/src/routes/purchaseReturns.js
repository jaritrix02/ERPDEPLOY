const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try { const d = await prisma.purchaseReturn.findMany({include:{grn:{include:{po:{include:{vendor:true}}}}},orderBy:{date:'desc'}}); res.json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const count = await prisma.purchaseReturn.count();
    const returnNo = `RET${String(count+1).padStart(5,'0')}`;
    const d = await prisma.purchaseReturn.create({data:{...req.body,returnNo}});
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
