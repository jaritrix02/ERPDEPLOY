const bcrypt = require('bcryptjs');
const { prisma } = require('../db');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { permissions: true, employee: { select: { employeeCode: true, department: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users  — admin only
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, password: hashed, role,
        permissions: {
          create: permissions?.map(p => ({
            moduleName: p.moduleName,
            canRead:    p.canRead    || false,
            canWrite:   p.canWrite   || false,
            canExecute: p.canExecute || false
          })) || []
        }
      },
      include: { permissions: true }
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, role, isActive, permissions, password } = req.body;
    await prisma.modulePermission.deleteMany({ where: { userId: req.params.id } });
    
    const updateData = {
      name, role, isActive,
      permissions: {
        create: permissions?.map(p => ({
          moduleName: p.moduleName,
          canRead:    p.canRead    || false,
          canWrite:   p.canWrite   || false,
          canExecute: p.canExecute || false
        })) || []
      }
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { permissions: true }
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
