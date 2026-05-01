const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.employeeCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const existing = await prisma.employeeCategory.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    const category = await prisma.employeeCategory.create({
      data: { name }
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await prisma.employeeCategory.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await prisma.employeeCategory.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'CATEGORY NOT FOUND' });

    // Check if any employee is using this category (manual check since no direct relation)
    const linkedEmployees = await prisma.employee.count({
      where: { employeeCategory: target.name }
    });

    if (linkedEmployees > 0) {
      return res.status(400).json({ success: false, message: `CANNOT DELETE: ${linkedEmployees} EMPLOYEES ARE CURRENTLY ASSIGNED TO THIS CATEGORY.` });
    }

    await prisma.employeeCategory.delete({ where: { id } });
    res.json({ success: true, message: 'CATEGORY DELETED SUCCESSFULLY' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
