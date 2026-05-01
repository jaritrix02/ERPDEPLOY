const authService = require('../services/authService');
const { prisma } = require('../db');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'EMAIL AND PASSWORD ARE REQUIRED' });

    const result = await authService.validateCredentials(email, password);
    
    if (!result.success) {
      console.log(`Login failed: ${result.message}`);
      return res.status(401).json(result);
    }

    console.log(`Login successful for: ${email}`);
    res.json(result);
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ 
      success: false, 
      message: 'SERVER ERROR: ' + err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { permissions: true, employee: true }
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'EMAIL REQUIRED' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ success: false, message: 'USER NOT FOUND' });

    await prisma.task.create({
      data: {
        title: 'PASSWORD RESET REQUEST',
        description: `User ${user.name} (${email}) requested a password reset. Please generate a new password.`,
        date: new Date(),
        priority: 'URGENT',
        category: 'NOTICE',
        status: 'PENDING',
        assignedTo: 'Admin'
      }
    });

    res.json({ success: true, message: 'Notification sent to Admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, getMe, forgotPassword };
