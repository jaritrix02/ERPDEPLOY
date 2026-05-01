const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try { const d = await prisma.bOM.findMany({include:{items:{include:{item:true}}},orderBy:{createdAt:'desc'}}); res.json({success:true,data:d}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const count = await prisma.bOM.count();
    const bomCode = `BOM${String(count+1).padStart(4,'0')}`;
    const {productName,version,items} = req.body;
    const d = await prisma.bOM.create({
      data:{bomCode,productName,version,items:{create:items.map(i=>({itemId:i.itemId,qty:i.qty,level:i.level||1,unit:i.unit}))}},
      include:{items:true}
    });
    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.put('/:id', async (req,res) => {
  try {
    const { productName, version, items = [] } = req.body;
    await prisma.bOMItem.deleteMany({ where: { bomId: req.params.id } });
    const d = await prisma.bOM.update({
      where: { id: req.params.id },
      data: {
        productName,
        version,
        items: { create: items.map(i => ({ itemId: i.itemId, qty: Number(i.qty || 0), level: Number(i.level || 1), unit: i.unit || 'NOS' })) }
      },
      include: { items: { include: { item: true } } }
    });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.delete('/:id', async (req,res) => {
  try {
    await prisma.bOM.delete({ where: { id: req.params.id } });
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
