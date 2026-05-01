const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect, adminOnly } = require('../middleware/auth');
const prisma = new PrismaClient();

router.use(protect);

router.get('/', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    const d = await prisma[modelMap['vendors']].findMany({orderBy:{createdAt:'desc'}});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.post('/', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    
    // Auto-generate Vendor Code if missing
    if (!req.body.vendorCode) {
       const count = await prisma.vendor.count();
       req.body.vendorCode = `VND-${String(count + 1000).padStart(4, '0')}`;
    }
    
    // Parse numeric fields
    if (req.body.creditDays) req.body.creditDays = parseInt(req.body.creditDays, 10);
    if (req.body.creditLimit) req.body.creditLimit = parseFloat(req.body.creditLimit);
    if (req.body.openingBalance) req.body.openingBalance = parseFloat(req.body.openingBalance);
    
    // Parse Date fields
    if (req.body.gstRegDate) req.body.gstRegDate = new Date(req.body.gstRegDate);
    if (req.body.tinDate) req.body.tinDate = new Date(req.body.tinDate);
    if (req.body.cstDate) req.body.cstDate = new Date(req.body.cstDate);

    const d = await prisma[modelMap['vendors']].create({data:req.body});
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.put('/:id', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    if (req.body.creditDays) req.body.creditDays = parseInt(req.body.creditDays, 10);
    if (req.body.creditLimit) req.body.creditLimit = parseFloat(req.body.creditLimit);
    if (req.body.openingBalance) req.body.openingBalance = parseFloat(req.body.openingBalance);
    
    if (req.body.gstRegDate) req.body.gstRegDate = new Date(req.body.gstRegDate);
    if (req.body.tinDate) req.body.tinDate = new Date(req.body.tinDate);
    if (req.body.cstDate) req.body.cstDate = new Date(req.body.cstDate);
    const d = await prisma[modelMap['vendors']].update({where:{id:req.params.id},data:req.body});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.delete('/:id', adminOnly, async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    await prisma[modelMap['vendors']].delete({where:{id:req.params.id}});
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
