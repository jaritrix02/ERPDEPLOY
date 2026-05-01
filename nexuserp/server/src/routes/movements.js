const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const d = await prisma.stockMovement.findMany({
      include: { product:true, item:{include:{unit:true}}, fromStore:true, toStore:true },
      orderBy: { date:'desc' }
    });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const d = await prisma.stockMovement.create({
      data:{...req.body, createdBy:req.user.id},
      include:{product:true,item:true,fromStore:true,toStore:true}
    });
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
