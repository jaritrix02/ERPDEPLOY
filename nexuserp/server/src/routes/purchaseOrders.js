const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const { generateUniqueCode } = require('../utils/codeGenerator');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.poNo = { contains: search, mode:'insensitive' };
    const d = await prisma.purchaseOrder.findMany({
      where, 
      include:{
        vendor:true, 
        indent:true, 
        items: { include: { item: true } },
        gatePasses: true,
        grns: { include: { qcReports: true } },
        purchaseBills: true
      },

      orderBy:{createdAt:'desc'}
    });

    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const poNo = await generateUniqueCode({
      prisma,
      model: 'purchaseOrder',
      field: 'poNo',
      prefix: 'PO',
      length: 6
    });
    const { indentId, vendorId, items } = req.body;
    const totalAmount = items.reduce((s,i) => s + (i.qty * i.rate), 0);
    const d = await prisma.purchaseOrder.create({
      data:{ poNo, indentId, vendorId, totalAmount,
        items:{ create: items.map(i=>({itemId:i.itemId,qty:i.qty,rate:i.rate,amount:i.qty*i.rate})) }
      },
      include:{vendor:true,items:{ include: { item: true } }}
    });
    req.app.get('io')?.emit('po:created', {poNo, vendorId});
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
const approvePurchaseOrder = async (req,res) => {
  try {
    const d = await prisma.purchaseOrder.update({
      where:{id:req.params.id},
      data:{ status:req.body.status, approvedById:req.user.id, approvalDate:new Date(), approvalRemark:req.body.approvalRemark }
    });
    req.app.get('io')?.emit('po:approved', {poNo:d.poNo, status:d.status});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

router.put('/:id/approve', approvePurchaseOrder);
router.post('/:id/approve', approvePurchaseOrder);
module.exports = router;
