const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const { generateUniqueCode } = require('../utils/codeGenerator');
const prisma = new PrismaClient();
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const d = await prisma.gRN.findMany({ include:{po:{include:{vendor:true}},gatePass:true}, orderBy:{date:'desc'} });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const { date, ...rest } = req.body;
    const grnNo = await generateUniqueCode({
      prisma,
      model: 'gRN',
      field: 'grnNo',
      prefix: 'GRN',
      length: 6
    });
    
    const d = await prisma.$transaction(async (tx) => {
      const grn = await tx.gRN.create({ 
        data:{
          ...rest, 
          grnNo,
          date: date ? new Date(date) : new Date(),
          status: 'APPROVED' // Auto-approve for now to simplify integration
        }, 
        include:{po:{include:{items:true}}} 
      });

      // INTEGRATION: Update Stock for each PO Item
      if (grn.po?.items) {
        for (const item of grn.po.items) {
          // Find or create product in a default "Main Store" or use the one from PO (if added later)
          // For now, we find any store to add it to, or the first RAW_MATERIAL store
          const store = await tx.store.findFirst({ where: { storeType: 'RAW_MATERIAL' } });
          if (store) {
            const existing = await tx.product.findFirst({ 
              where: { itemId: item.itemId, storeId: store.id } 
            });

            let targetProduct = existing;
            if (existing) {
              await tx.product.update({
                where: { id: existing.id },
                data: { quantity: { increment: item.qty } }
              });
            } else {
              targetProduct = await tx.product.create({
                data: {
                  itemId: item.itemId,
                  storeId: store.id,
                  barcode: `GRN-${grn.grnNo}-${Date.now()}`,
                  quantity: item.qty,
                  rate: item.rate
                }
              });
            }
            
            // Log movement
            await tx.stockMovement.create({
              data: {
                productId: targetProduct.id,
                itemId: item.itemId,
                toStoreId: store.id,
                movementType: 'IN',
                quantity: item.qty,
                remark: `Received via GRN: ${grn.grnNo}`,
                createdBy: 'SYSTEM'
              }
            });
          }
        }
      }
      return grn;
    });

    res.status(201).json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.put('/:id/approve', async (req,res) => {
  try {
    const d = await prisma.gRN.update({ where:{id:req.params.id}, data:{status:req.body.status} });
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
