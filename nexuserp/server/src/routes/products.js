// products.js
const express1 = require('express');
const r1 = express1.Router();
const { PrismaClient: P1 } = require('@prisma/client');
const p1 = new P1();
const { protect: prot1 } = require('../middleware/auth');
const { generateUniqueCode } = require('../utils/codeGenerator');
r1.use(prot1);
r1.get('/', async (req,res) => {
  try {
    const { storeId } = req.query;
    const products = await p1.product.findMany({
      where: storeId ? { storeId } : {},
      include: { item: { include: { unit:true } }, store:true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success:true, data:products });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
r1.post('/', async (req,res) => {
  try {
    const { mfgDate, expDate, ...rest } = req.body;
    const barcode = await generateUniqueCode({
      prisma: p1,
      model: 'product',
      field: 'barcode',
      prefix: 'NX',
      length: 10
    });
    const d = await p1.product.create({ 
      data:{
        ...rest, 
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expDate: expDate ? new Date(expDate) : null,
        barcode
      }, 
      include:{item:true,store:true} 
    });
    res.status(201).json({ success:true, data:d });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
r1.put('/:id', async (req,res) => {
  try {
    const { mfgDate, expDate, ...rest } = req.body;
    const d = await p1.product.update({ 
      where:{id:req.params.id}, 
      data:{
        ...rest,
        mfgDate: mfgDate ? new Date(mfgDate) : undefined,
        expDate: expDate ? new Date(expDate) : undefined
      }, 
      include:{item:true,store:true} 
    });
    res.json({ success:true, data:d });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
r1.delete('/:id', async (req,res) => {
  try {
    await p1.product.delete({ where: { id: req.params.id } });
    res.json({ success:true, message:'Deleted' });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

module.exports = r1;
