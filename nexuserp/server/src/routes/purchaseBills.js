const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try { const d = await prisma.purchaseBill.findMany({include:{po:true,vendor:true,item:{include:{unit:true}}},orderBy:{createdAt:'desc'}}); res.json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const { invoiceDate, mfgDate, expDate, ...rest } = req.body;
    const count = await prisma.purchaseBill.count();
    const billNo = `BILL${String(count+1).padStart(5,'0')}`;
    const d = await prisma.purchaseBill.create({
      data:{
        ...rest,
        billNo,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expDate: expDate ? new Date(expDate) : null,
      },
      include:{vendor:true,item:true}
    });
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
