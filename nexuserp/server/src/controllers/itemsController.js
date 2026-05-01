const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateItemCode = async (itemType) => {
  const prefixMap = { RAW_MATERIAL: 'RM', SEMI_FINISHED: 'SF', CONSUMABLE: 'CO', FINISHED: null };
  const prefix = prefixMap[itemType];
  if (!prefix) return null; // Finished items don't get auto code

  const last = await prisma.item.findFirst({
    where: { itemCode: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' }
  });
  if (!last) return `${prefix}001`;
  const num = parseInt(last.itemCode.replace(prefix, '')) + 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
};

// GET /api/items
const getItems = async (req, res) => {
  try {
    const { type } = req.query;
    const items = await prisma.item.findMany({
      where: type ? { itemType: type } : {},
      include: { unit: true, gst: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/items
const createItem = async (req, res) => {
  try {
    const { itemName, itemType, unitId, gstId, description, minStockLevel, itemCode } = req.body;
    let code = itemCode;
    if (!code) code = await generateItemCode(itemType);
    if (!code) return res.status(400).json({ success: false, message: 'Item code required for Finished items' });

    const exists = await prisma.item.findUnique({ where: { itemCode: code } });
    if (exists) return res.status(400).json({ success: false, message: 'Item code already exists' });

    const item = await prisma.item.create({
      data: { itemCode: code, itemName, itemType, unitId, gstId: gstId || null, description, minStockLevel: minStockLevel || 0 },
      include: { unit: true, gst: true }
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/items/:id
const updateItem = async (req, res) => {
  try {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body,
      include: { unit: true, gst: true }
    });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getItems, createItem, updateItem, deleteItem };
