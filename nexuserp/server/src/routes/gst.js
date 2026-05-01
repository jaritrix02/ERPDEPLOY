const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const map = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    const model = 'gst';
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    const d = await prisma[modelMap[model]].findMany({orderBy:{createdAt:'desc'}});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    const d = await prisma[modelMap['gst']].create({data:req.body});
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.put('/:id', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    const d = await prisma[modelMap['gst']].update({where:{id:req.params.id},data:req.body});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.delete('/:id', async (req,res) => {
  try {
    const modelMap = {units:'unitOfMeasurement',gst:'gSTRate',terms:'termsAndConditions',vendors:'vendor',stores:'store'};
    await prisma[modelMap['gst']].delete({where:{id:req.params.id}});
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
