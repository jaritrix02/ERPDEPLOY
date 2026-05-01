const { prisma } = require('../db');
const employeeService = require('../services/employeeService');
const path = require('path');
const fs = require('fs');

// Employee code is now manual per user request. 
// We can keep generateEmpCode as fallback if needed, but the requirement is "HR khud se employee code dega" and "dublicate nahi".


// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { employeeCode } = req.body;
    if (!employeeCode) return res.status(400).json({ success: false, message: 'Employee Code is required' });
    
    // Check duplicate
    const existing = await prisma.employee.findUnique({ where: { employeeCode } });
    if (existing) return res.status(400).json({ success: false, message: 'Employee Code already exists' });

    const employee = await prisma.employee.create({
      data: employeeService.cleanEmployeeData(req.body)
    });
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/employees/bulk
const importEmployees = async (req, res) => {
  try {
    const employees = req.body;
    if (!Array.isArray(employees)) return res.status(400).json({ success: false, message: 'INVALID DATA FORMAT' });

    // ATOMIC TRANSACTION: All or Nothing
    await prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        const cleaned = employeeService.cleanEmployeeData(emp);
        
        // 1. Check for Duplicate Code
        const dupCode = await tx.employee.findUnique({ where: { employeeCode: String(cleaned.employeeCode) } });
        if (dupCode) throw new Error(`DUPLICATE EMPLOYEE CODE: ${cleaned.employeeCode} (${cleaned.name}) ALREADY EXISTS IN DATABASE.`);

        // 2. Check for Duplicate Aadhar
        if (cleaned.aadharNumber) {
            const dupAadhar = await tx.employee.findFirst({ where: { aadharNumber: cleaned.aadharNumber } });
            if (dupAadhar) throw new Error(`DUPLICATE AADHAR: ${cleaned.aadharNumber} ALREADY ASSIGNED TO ${dupAadhar.name}.`);
        }

        // 3. Check for Duplicate PAN
        if (cleaned.panNumber) {
            const dupPAN = await tx.employee.findFirst({ where: { panNumber: cleaned.panNumber } });
            if (dupPAN) throw new Error(`DUPLICATE PAN: ${cleaned.panNumber} ALREADY ASSIGNED TO ${dupPAN.name}.`);
        }

        await tx.employee.create({ data: cleaned });
      }
    });

    res.json({ success: true, message: `SUCCESSFULLY IMPORTED ${employees.length} EMPLOYEES` });
  } catch (err) {
    // Transaction will automatically rollback on error
    res.status(500).json({ success: false, message: 'IMPORT FAILED: ' + err.message.toUpperCase() });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: employeeService.cleanEmployeeData(req.body)
    });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    // Check for related records
    const [att, adv, pass, slips, indents] = await Promise.all([
        prisma.attendance.count({ where: { employeeId: id } }),
        prisma.employeeAdvance.count({ where: { employeeId: id } }),
        prisma.employeeGatePass.count({ where: { employeeId: id } }),
        prisma.salarySlip.count({ where: { employeeId: id } }),
        prisma.indent.count({ where: { requestedById: id } })
    ]);

    if (att > 0 || adv > 0 || pass > 0 || slips > 0 || indents > 0) {
        return res.status(400).json({ 
            success: false, 
            message: "CANNOT DELETE: THIS PERSONNEL HAS ACTIVE HISTORY (ATTENDANCE/SALARY/ADVANCES/PURCHASE INDENTS). PLEASE TRANSITION TO 'INACTIVE' STATUS TO PROTECT DATA INTEGRITY." 
        });
    }

    await prisma.employee.delete({ where: { id } });
    res.json({ success: true, message: 'EMPLOYEE RECORD PERMANENTLY REMOVED' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

const wipeAllData = async (req, res) => {
  try {
    // Correct Order to handle Foreign Keys
    await prisma.salarySlip.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.employeeAdvance.deleteMany();
    await prisma.employeeGatePass.deleteMany();
    await prisma.indentItem.deleteMany();
    await prisma.indent.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();

    res.json({ success: true, message: 'SYSTEM RESET SUCCESSFUL: ALL EMPLOYEE DATA HAS BEEN DELETED.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.toUpperCase() });
  }
};

const getEmployeeDocuments = async (req, res) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { employeeId: req.params.id },
      orderBy: { uploadedAt: 'desc' }
    });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Validations are now in employeeService


const uploadDocument = async (req, res) => {
  try {
    const { employeeId, documentCategory, customCategory } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Validate file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must be less than 5MB.' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only PDF, JPG, and PNG files are allowed.' });
    }

    // Get employee to validate fields
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Validate Phone, Aadhar, PAN for blocking
    const phoneValidation = employeeService.validatePhone(employee.phone);
    const aadharValidation = employeeService.validateAadhar(employee.aadharNumber);
    const panValidation = employeeService.validatePAN(employee.panNumber);

    if (!phoneValidation.valid || !aadharValidation.valid || !panValidation.valid) {
      const messages = [];
      if (!phoneValidation.valid) messages.push(phoneValidation.message);
      if (!aadharValidation.valid) messages.push(aadharValidation.message);
      if (!panValidation.valid) messages.push(panValidation.message);

      return res.status(400).json({
        success: false,
        message: 'Document upload blocked due to validation errors.',
        errors: messages
      });
    }

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        documentCategory,
        customCategory: customCategory || null,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedBy: req.user?.id
      }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Delete file
    const filePath = path.join(__dirname, '../../', doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.employeeDocument.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getEmployees, createEmployee, updateEmployee, deleteEmployee, 
  importEmployees, wipeAllData, getEmployeeDocuments, uploadDocument, deleteDocument 
};
