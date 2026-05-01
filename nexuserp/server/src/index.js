const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (ngrok) to satisfy express-rate-limit security requirements
const httpServer = createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.set('io', io); // make io accessible in controllers

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL === '*' ? true : process.env.CLIENT_URL, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5000 });
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/designations', require('./routes/designations'));
app.use('/api/employee-categories', require('./routes/categories'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/units',      require('./routes/units'));
app.use('/api/gst',        require('./routes/gst'));
app.use('/api/terms',      require('./routes/terms'));
app.use('/api/items',      require('./routes/items'));
app.use('/api/vendors',    require('./routes/vendors'));
app.use('/api/stores',     require('./routes/stores'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/movements',  require('./routes/movements'));
app.use('/api/indents',    require('./routes/indents'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/sales-orders', require('./routes/salesOrders'));
app.use('/api/costing', require('./routes/costing'));
app.use('/api/gate-pass',  require('./routes/gatePass'));
app.use('/api/grn',        require('./routes/grn'));
app.use('/api/mrn',        require('./routes/mrn'));
app.use('/api/purchase-bills', require('./routes/purchaseBills'));
app.use('/api/purchase-returns', require('./routes/purchaseReturns'));
app.use('/api/bom', require('./routes/bom'));
app.use('/api/manufacturing', require('./routes/workOrders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/qc-parameters', require('./routes/qcParameters'));
app.use('/api/qc', require('./routes/qc'));
app.use('/api/machines', require('./routes/machines'));
app.use('/api/breakdowns', require('./routes/breakdowns'));
app.use('/api/ci', require('./routes/ci'));

app.use('/api/employee-advances', require('./routes/employeeAdvances'));
app.use('/api/advances', require('./routes/employeeAdvances')); // Alias
app.use('/api/employee-gate-passes', require('./routes/employeeGatePasses'));
app.use('/api/gatepass', require('./routes/employeeGatePasses')); // Alias
app.use('/api', require('./routes/demoRecords'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── Serve Frontend in Production ─────────────────────────────────────────────
const path = require('path');
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const { prisma, connectDB } = require('./db');
const bcrypt = require('bcryptjs');

const logger = require('./utils/logger');
const { ensureDemoData } = require('./services/demoDataService');

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  logger.system(`NexusERP Server running on port ${PORT}`);
  const connected = await connectDB();
  if (!connected) return;

  // Auto-seed demo users if none exist or to reset them
  try {
    logger.info('Syncing demo users for all departments...');
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
    
    const demoUsers = [
      { name: 'Admin User',    email: 'admin@nexuserp.com',    role: 'ADMIN' },
      { name: 'HOD User',      email: 'hod@nexuserp.com',      role: 'HOD' },
      { name: 'Purchase User', email: 'purchase@nexuserp.com', role: 'PURCHASE' },
      { name: 'Store User',    email: 'store@nexuserp.com',    role: 'STORE' },
      { name: 'HR User',       email: 'hr@nexuserp.com',       role: 'HR' },
      { name: 'QC User',       email: 'qc@nexuserp.com',       role: 'QC' },
      { name: 'Gate User',     email: 'gate@nexuserp.com',     role: 'GATE' },
      { name: 'Sales User',    email: 'sales@nexuserp.com',    role: 'SALES' },
      { name: 'Maint. User',   email: 'maintenance@nexuserp.com', role: 'MAINTENANCE' },
    ];

    for (const u of demoUsers) {
      try {
        await prisma.user.upsert({
          where: { email: u.email },
          update: { 
            password: hashedPassword,
            role: u.role,
            isActive: true
          },
          create: {
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            isActive: true,
            permissions: {
              create: [
                { moduleName: 'Dashboard', canRead: true, canWrite: true, canExecute: true },
                { moduleName: u.role, canRead: true, canWrite: true, canExecute: true }
              ]
            }
          }
        });
        logger.info(`Synced user: ${u.email} (${u.role})`);
      } catch (userError) {
        logger.error(`Failed to sync user ${u.email}: ${userError.message}`);
      }
    }
    logger.success('Demo users sync cycle completed!');
  } catch (error) {
    logger.error(`Failed to seed demo users: ${error.message}`);
  }

  try {
    const summary = await ensureDemoData();
    logger.success(`Demo data ready: ${summary.employees} employees, ${summary.modules} modules, ${summary.workOrder} work order`);
  } catch (error) {
    logger.error(`Failed to seed demo records: ${error.message}`);
  }
});
