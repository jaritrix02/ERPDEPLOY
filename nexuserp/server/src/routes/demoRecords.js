const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { prisma } = require('../db');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'demo-records.json');

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const defaultStore = () => ({
  customers: [
    { id: 'demo-customer-1', companyName: 'ACME INDUSTRIES', contactPerson: 'RAHUL MEHRA', email: 'purchase@acme.example', mobile: '9876501111', address: 'PUNE INDUSTRIAL AREA', type: 'DOMESTIC', gstNo: '27ABCDE1234F1Z5' },
    { id: 'demo-customer-2', companyName: 'GLOBAL RUBBER LLC', contactPerson: 'ANITA SHAH', email: 'exports@globalrubber.example', mobile: '9876502222', address: 'JEBEL ALI FREE ZONE', type: 'EXPORT', gstNo: '' },
  ],
  groups: [
    { id: 'demo-group-1', groupName: 'NUCORK HOLDINGS', parentId: '', headOffice: 'MUMBAI', email: 'corp@nucork.example', mobile: '9876503333' },
    { id: 'demo-group-2', groupName: 'NUCORK MANUFACTURING UNIT', parentId: 'demo-group-1', headOffice: 'NASHIK', email: 'plant@nucork.example', mobile: '9876503334' },
  ],
  transporters: [
    { id: 'demo-transporter-1', transporterName: 'FASTWAY LOGISTICS', contactPerson: 'SURESH PATIL', email: 'ops@fastway.example', mobile: '9876504444', address: 'BHIWANDI HUB', vehicleCount: 18, registrationNo: 'TRN-MH-001' },
    { id: 'demo-transporter-2', transporterName: 'WESTERN FREIGHT CARRIERS', contactPerson: 'IMRAN KHAN', email: 'desk@westernfreight.example', mobile: '9876505555', address: 'VAPI DEPOT', vehicleCount: 11, registrationNo: 'TRN-GJ-014' },
  ],
  jobs: [
    { id: 'demo-job-1', title: 'QUALITY INSPECTOR', department: 'Quality', positionType: 'FULL_TIME', openings: 2, status: 'OPEN', description: 'Incoming and final inspection ownership.', requirements: 'QC tools and shop-floor experience.' },
    { id: 'demo-job-2', title: 'STORE EXECUTIVE', department: 'Stores', positionType: 'FULL_TIME', openings: 1, status: 'OPEN', description: 'GRN, MRN, and stock ledger control.', requirements: 'ERP and inventory experience.' },
  ],
  trainings: [
    { id: 'demo-training-1', title: 'FIRE SAFETY REFRESHER', type: 'COMPLIANCE', trainer: 'SAFETY TEAM', startDate: '2026-04-20', endDate: '2026-04-20', status: 'COMPLETED', description: 'Mandatory safety refresher.' },
    { id: 'demo-training-2', title: '5S SHOP FLOOR AUDIT', type: 'TECHNICAL', trainer: 'CI TEAM', startDate: '2026-05-05', endDate: '2026-05-06', status: 'PLANNED', description: 'Lean workplace audit training.' },
  ],
  performance: [
    { id: 'demo-performance-1', employeeId: '', reviewDate: '2026-04-15', rating: 4, comments: 'Reliable ownership of daily production targets.', status: 'COMPLETED' },
    { id: 'demo-performance-2', employeeId: '', reviewDate: '2026-04-18', rating: 5, comments: 'Excellent attendance and team coordination.', status: 'COMPLETED' },
  ],
  exits: [
    { id: 'demo-exit-1', employeeId: '', exitDate: '2026-05-31', reason: 'Relocation', type: 'RESIGNATION', status: 'PENDING' },
  ],
  leaves: [
    { id: 'demo-leave-1', employeeId: '', leaveType: 'SICK', startDate: '2026-04-26', endDate: '2026-04-27', reason: 'Medical recovery', status: 'APPROVED' },
    { id: 'demo-leave-2', employeeId: '', leaveType: 'CASUAL', startDate: '2026-05-03', endDate: '2026-05-03', reason: 'Personal work', status: 'PENDING' },
  ],
  outward: [
    { id: 'demo-outward-1', passNo: 'OUT-2026-001', destination: 'ACME INDUSTRIES', vehicleNo: 'MH12AB1234', driverName: 'MAHESH', driverPhone: '9876507777', driverAadhar: '123412341234', materialDesc: 'FINISHED RUBBER SHEETS', qty: '40 NOS', remark: 'Demo dispatch', date: '2026-04-30' },
  ],
});

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultStore(), null, 2));
  }

  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const defaults = defaultStore();
  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (!Array.isArray(store[key])) {
      store[key] = value;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  return store;
};

const saveStore = (store) => fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));

const getEmployees = async () => prisma.employee.findMany({
  where: { isActive: true },
  orderBy: { employeeCode: 'asc' },
  take: 20,
});

const populateEmployees = async (records) => {
  const employees = await getEmployees();
  const byId = new Map(employees.map(emp => [emp.id, emp]));
  return records.map((record, index) => {
    const fallback = employees[index % Math.max(employees.length, 1)];
    const employee = byId.get(record.employeeId) || fallback || null;
    return {
      ...record,
      employeeId: record.employeeId || employee?.id || '',
      employee,
    };
  });
};

const withTree = (groups) => {
  const nodes = groups.map(group => ({ ...group, children: [] }));
  const byId = new Map(nodes.map(group => [group.id, group]));
  const roots = [];
  for (const group of nodes) {
    if (group.parentId && byId.has(group.parentId)) byId.get(group.parentId).children.push(group);
    else roots.push(group);
  }
  return roots;
};

const list = (key) => async (req, res) => {
  try {
    const store = ensureStore();
    let data = store[key] || [];
    if (['leaves', 'performance', 'exits'].includes(key)) data = await populateEmployees(data);
    if (key === 'groups') data = withTree(data);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const create = (key, prefix) => async (req, res) => {
  try {
    const store = ensureStore();
    const record = {
      id: id(prefix),
      ...req.body,
      date: req.body.date || (key === 'outward' ? today() : req.body.date),
    };
    if (key === 'outward') record.passNo = record.passNo || `OUT-${Date.now().toString().slice(-6)}`;
    store[key].unshift(record);
    saveStore(store);
    res.status(201).json({ success: true, data: record });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const update = (key) => async (req, res) => {
  try {
    const store = ensureStore();
    const index = store[key].findIndex(record => record.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Record not found' });
    store[key][index] = { ...store[key][index], ...req.body };
    saveStore(store);
    res.json({ success: true, data: store[key][index] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const remove = (key) => async (req, res) => {
  try {
    const store = ensureStore();
    store[key] = store[key].filter(record => record.id !== req.params.id);
    saveStore(store);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const crud = (pathName, key, prefix) => {
  router.get(pathName, list(key));
  router.post(pathName, create(key, prefix));
  router.put(`${pathName}/:id`, update(key));
  router.delete(`${pathName}/:id`, remove(key));
};

crud('/customers', 'customers', 'customer');
crud('/transporters', 'transporters', 'transporter');
crud('/jobs', 'jobs', 'job');
crud('/trainings', 'trainings', 'training');
crud('/performance', 'performance', 'performance');
crud('/exits', 'exits', 'exit');
crud('/leaves', 'leaves', 'leave');
crud('/gate-pass/outward', 'outward', 'outward');

router.get('/groups', list('groups'));
router.post('/groups', create('groups', 'group'));

router.get('/ess/me', async (req, res) => {
  try {
    const store = ensureStore();
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: req.user.id },
          { email: req.user.email },
        ],
      },
    }) || await prisma.employee.findFirst({ where: { isActive: true }, orderBy: { employeeCode: 'asc' } });

    if (!employee) return res.json({ success: true, data: null });

    const [attendance, advances, salarySlips, gatePasses] = await Promise.all([
      prisma.attendance.findMany({ where: { employeeId: employee.id }, orderBy: { date: 'desc' }, take: 6 }),
      prisma.employeeAdvance.findMany({ where: { employeeId: employee.id }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.salarySlip.findMany({ where: { employeeId: employee.id }, orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 5 }),
      prisma.employeeGatePass.findMany({ where: { employeeId: employee.id }, orderBy: { date: 'desc' }, take: 5 }),
    ]);

    const leaves = store.leaves.filter(item => !item.employeeId || item.employeeId === employee.id);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lastSlip = salarySlips[0];

    res.json({
      success: true,
      data: {
        employee,
        attendanceCount: attendance.filter(a => a.status === 'PRESENT').length,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length,
        totalAdvances: advances.reduce((sum, adv) => sum + Number(adv.amount || 0), 0),
        lastSalaryMonth: lastSlip ? `${monthNames[lastSlip.month - 1]} ${lastSlip.year}` : 'N/A',
        recentAttendance: attendance.map(a => ({
          date: a.date?.toISOString?.().slice(0, 10) || a.date,
          status: a.status,
          checkIn: a.checkIn ? a.checkIn.toTimeString().slice(0, 5) : '',
          checkOut: a.checkOut ? a.checkOut.toTimeString().slice(0, 5) : '',
        })),
        recentSalarySlips: salarySlips,
        myRequests: [
          ...leaves.map(l => ({ type: `Leave - ${l.leaveType}`, date: l.startDate, status: l.status })),
          ...gatePasses.map(g => ({ type: g.passType || 'Gate Pass', date: g.date?.toISOString?.().slice(0, 10), status: g.status })),
        ],
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/qc', async (req, res) => {
  try {
    const data = await prisma.qCReport.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/qc/parameters', async (req, res) => {
  try {
    const data = await prisma.qCParameter.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
