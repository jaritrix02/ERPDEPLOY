const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/attendance?from=&to=&employeeId=
const getAttendance = async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(to);
    }
    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { name: true, employeeCode: true, department: true } } },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/summary  — daily summary
const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const target = date ? new Date(date) : new Date();
    const records = await prisma.attendance.findMany({
      where: { date: target },
      include: { employee: true }
    });
    const present = records.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY');
    const totalHours = present.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    res.json({ success: true, data: { date: target, totalPresent: present.length, totalAbsent: records.filter(r => r.status === 'ABSENT').length, totalHours, records } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance
const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;
    let hoursWorked = null;
    if (checkIn && checkOut) {
      hoursWorked = (new Date(checkOut) - new Date(checkIn)) / 3600000;
    }
    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      create: { employeeId, date: new Date(date), status, checkIn: checkIn && checkIn.trim() !== '' ? new Date(checkIn) : null, checkOut: checkOut && checkOut.trim() !== '' ? new Date(checkOut) : null, hoursWorked },
      update: { status, checkIn: checkIn && checkIn.trim() !== '' ? new Date(checkIn) : null, checkOut: checkOut && checkOut.trim() !== '' ? new Date(checkOut) : null, hoursWorked }
    });
    req.app.get('io')?.emit('attendance:updated', { date, employeeId });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/bulk
const markBulkAttendance = async (req, res) => {
  try {
    const records = req.body; // Array of { employeeId, date, status, checkIn, checkOut }
    if (!Array.isArray(records)) return res.status(400).json({ success: false, message: 'Expected an array' });
    
    let count = 0;
    for (const data of records) {
      if (!data.employeeId || !data.date || !data.status) continue;
      let hoursWorked = null;
      if (data.checkIn && data.checkOut && data.checkIn.trim() !== '' && data.checkOut.trim() !== '') {
        hoursWorked = (new Date(data.checkOut) - new Date(data.checkIn)) / 3600000;
      }
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: data.employeeId, date: new Date(data.date) } },
        create: { employeeId: data.employeeId, date: new Date(data.date), status: data.status, checkIn: data.checkIn && data.checkIn.trim() !== '' ? new Date(data.checkIn) : null, checkOut: data.checkOut && data.checkOut.trim() !== '' ? new Date(data.checkOut) : null, hoursWorked },
        update: { status: data.status, checkIn: data.checkIn && data.checkIn.trim() !== '' ? new Date(data.checkIn) : null, checkOut: data.checkOut && data.checkOut.trim() !== '' ? new Date(data.checkOut) : null, hoursWorked }
      });
      count++;
    }
    req.app.get('io')?.emit('attendance:updated', { bulk: true });
    res.json({ success: true, message: `Marked attendance for ${count} employees` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/attendance/:id  — HR modifies with reason
const modifyAttendance = async (req, res) => {
  try {
    const { checkIn, checkOut, status, modifyReason } = req.body;
    let hoursWorked = null;
    if (checkIn && checkOut && checkIn.trim() !== '' && checkOut.trim() !== '') {
      hoursWorked = (new Date(checkOut) - new Date(checkIn)) / 3600000;
    }
    
    // Get existing record to append history
    const existing = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Record not found' });
    
    let history = [];
    if (existing.modifyReason) {
      try { history = JSON.parse(existing.modifyReason); } catch(e) { history = [{ reason: existing.modifyReason, date: existing.updatedAt }]; }
    }
    history.push({ reason: modifyReason, date: new Date(), by: req.user?.name || req.user?.email || 'HR' });
    
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        checkIn:  checkIn && checkIn.trim() !== ''  ? new Date(checkIn)  : null,
        checkOut: checkOut && checkOut.trim() !== '' ? new Date(checkOut) : null,
        status, hoursWorked,
        modifiedBy:   req.user?.id,
        modifyReason: JSON.stringify(history)
      }
    });
    req.app.get('io')?.emit('attendance:updated', { id: req.params.id, date: record.date });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAttendance, getDailySummary, markAttendance, modifyAttendance, markBulkAttendance };
