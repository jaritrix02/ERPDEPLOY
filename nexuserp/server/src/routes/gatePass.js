const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const { generateUniqueCode } = require('../utils/codeGenerator');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const d = await prisma.gatePass.findMany({ include:{po:{include:{items:true}},vendor:true}, orderBy:{date:'desc'} });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const { date, ...rest } = req.body;
    const gatePassNo = await generateUniqueCode({
      prisma,
      model: 'gatePass',
      field: 'gatePassNo',
      prefix: 'GP',
      length: 6
    });
    const d = await prisma.gatePass.create({ 
      data:{
        ...rest, 
        gatePassNo,
        date: date ? new Date(date) : new Date()
      }, 
      include:{po:true,vendor:true} 
    });
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
