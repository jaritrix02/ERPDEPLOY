const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDesignations = async (req, res) => {
  try {
    const designations = await prisma.designation.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: designations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const existing = await prisma.designation.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Designation already exists' });

    const designation = await prisma.designation.create({
      data: { name }
    });
    res.status(201).json({ success: true, data: designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const designation = await prisma.designation.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await prisma.designation.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'DESIGNATION NOT FOUND' });

    // Check if any employee is using this designation (manual check since no direct relation)
    const linkedEmployees = await prisma.employee.count({
      where: { designation: target.name }
    });

    if (linkedEmployees > 0) {
      return res.status(400).json({ success: false, message: `CANNOT DELETE: ${linkedEmployees} EMPLOYEES ARE CURRENTLY ASSIGNED TO THIS DESIGNATION.` });
    }

    await prisma.designation.delete({ where: { id } });
    res.json({ success: true, message: 'DESIGNATION DELETED SUCCESSFULLY' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

module.exports = { getDesignations, createDesignation, updateDesignation, deleteDesignation };
