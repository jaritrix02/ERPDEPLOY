const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { permissions: true }
    });

    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'User not found or inactive' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN')
    return res.status(403).json({ success: false, message: 'Admin access only' });
  next();
};

const checkPermission = (module, action) => (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  const perm = req.user.permissions.find(p => p.moduleName === module);
  const allowed =
    action === 'read'    ? perm?.canRead :
    action === 'write'   ? perm?.canWrite :
    action === 'execute' ? perm?.canExecute : false;

  if (!allowed)
    return res.status(403).json({ success: false, message: `No ${action} permission for ${module}` });
  next();
};

module.exports = { protect, adminOnly, checkPermission };
