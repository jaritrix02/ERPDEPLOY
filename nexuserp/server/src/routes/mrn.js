const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const { generateUniqueCode } = require('../utils/codeGenerator');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try { const d = await prisma.mRN.findMany({include:{grn:true},orderBy:{date:'desc'}}); res.json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const mrnNo = await generateUniqueCode({
      prisma,
      model: 'mRN',
      field: 'mrnNo',
      prefix: 'MRN',
      length: 6
    });
    const d = await prisma.mRN.create({data:{...req.body,mrnNo},include:{grn:true}});
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.put('/:id', async (req,res) => {
  try { const d = await prisma.mRN.update({where:{id:req.params.id},data:req.body}); res.json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
