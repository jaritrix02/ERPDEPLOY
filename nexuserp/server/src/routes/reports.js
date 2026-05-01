const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
router.use(protect);
router.get('/indents/excel', async (req,res) => {
  try {
    const indents = await prisma.indent.findMany({ include:{requestedBy:true,items:{include:{item:true}}} });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Indents');
    ws.columns = [
      {header:'Indent No',key:'indentNo',width:15},
      {header:'Type',key:'indentType',width:15},
      {header:'Requested By',key:'requestedBy',width:20},
      {header:'Status',key:'status',width:12},
      {header:'Date',key:'createdAt',width:18}
    ];
    indents.forEach(i => ws.addRow({indentNo:i.indentNo,indentType:i.indentType,requestedBy:i.requestedBy.name,status:i.status,createdAt:i.createdAt.toLocaleDateString()}));
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename=indents.xlsx');
    await wb.xlsx.write(res);
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});
module.exports = router;
