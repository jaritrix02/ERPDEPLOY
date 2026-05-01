const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Department already exists' });

    const department = await prisma.department.create({
      data: { name, location }
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'DEPARTMENT DELETED' });
  } catch (err) {
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'CANNOT DELETE: THIS DEPARTMENT IS LINKED TO EXISTING EMPLOYEES' });
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

const importDepartments = async (req, res) => {
  try {
    const list = req.body;
    let count = 0;
    for (const d of list) {
        if (!d.name) continue;
        const exists = await prisma.department.findUnique({ where: { name: d.name } });
        if (exists) continue;
        await prisma.department.create({ data: { name: d.name, location: d.location } });
        count++;
    }
    res.json({ success: true, message: `IMPORTED ${count} DEPARTMENTS` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, importDepartments };
