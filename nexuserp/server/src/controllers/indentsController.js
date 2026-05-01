const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateUniqueCode } = require('../utils/codeGenerator');

const generateIndentNo = async () => {
  return generateUniqueCode({
    prisma,
    model: 'indent',
    field: 'indentNo',
    prefix: 'IND',
    length: 6
  });
};

// GET /api/indents
const getIndents = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const where = {};
    if (type)   where.indentType = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { indentNo: { contains: search, mode: 'insensitive' } },
        { requestedBy: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const indents = await prisma.indent.findMany({
      where,
      include: {
        requestedBy: { select: { name: true, employeeCode: true, department: true } },
        items: { include: { item: { include: { unit: true } } } },
        purchaseOrders: { select: { poNo: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: indents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/indents
const createIndent = async (req, res) => {
  try {
    const { indentType, requestedById, orderId, dueDate, remarks, items } = req.body;
    const indentNo = await generateIndentNo();

    const indent = await prisma.indent.create({
      data: {
        indentNo, indentType, requestedById,
        orderId: orderId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
        items: {
          create: items.map(i => ({
            itemId:          i.itemId,
            stockInHand:     i.stockInHand     || 0,
            requestQty:      i.requestQty,
            lastVendor:      i.lastVendor      || null,
            lastPurchaseDate: i.lastPurchaseDate ? new Date(i.lastPurchaseDate) : null,
            lastPrice:       i.lastPrice       || null,
            remark:          i.remark          || null
          }))
        }
      },
      include: { items: { include: { item: true } }, requestedBy: true }
    });

    // Emit socket event
    req.app.get('io')?.emit('indent:created', { indentNo, indentType, requestedBy: indent.requestedBy.name });

    res.status(201).json({ success: true, data: indent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/indents/:id/approve  — HOD approves/rejects
const approveIndent = async (req, res) => {
  try {
    const { status, approvalRemark, vendorId } = req.body;
    const indent = await prisma.indent.update({
      where: { id: req.params.id },
      data: {
        status, approvalRemark,
        approvedById: req.user.id,
        approvalDate: new Date()
      }
    });
    req.app.get('io')?.emit('indent:approved', { indentNo: indent.indentNo, status, approvedBy: req.user.name });
    res.json({ success: true, data: indent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/indents/:id/short  — Indent Shorting
const shortIndent = async (req, res) => {
  try {
    const { itemId, shortQty } = req.body;
    const item = await prisma.indentItem.updateMany({
      where: { indentId: req.params.id, itemId },
      data: { shortQty }
    });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/indents/:id/close
const closeIndent = async (req, res) => {
  try {
    const indent = await prisma.indent.update({
      where: { id: req.params.id },
      data: { isClosed: true }
    });
    res.json({ success: true, data: indent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getIndents, createIndent, approveIndent, shortIndent, closeIndent };
