const bcrypt = require('bcryptjs');
const { prisma } = require('../db');

const DEMO_PASSWORD = 'ChangeMe123!';

const MODULES = [
  'admin',
  'reports',
  'partners_access',
  'hr_employees',
  'hr_departments',
  'hr_designations',
  'hr_categories',
  'hr_attendance',
  'hr_salary_slips',
  'hr_advances',
  'gate_inward',
  'gate_outward',
  'gate_visitor',
  'gate_employee',
  'purchase_indent',
  'purchase_orders',
  'purchase_tracking',
  'purchase_bills',
  'purchase_returns',
  'inventory_grn',
  'inventory_mrn',
  'inventory_products',
  'inventory_stores',
  'inventory_movements',
  'masters_items',
  'masters_vendors',
  'masters_units',
  'masters_gst',
  'masters_terms',
  'manufacturing_bom',
  'manufacturing_work_orders',
  'manufacturing_job_card',
  'manufacturing_material_issue',
  'manufacturing_output',
  'manufacturing_conversion',
  'costing_analysis',
  'sales_orders',
  'qc_raw',
  'qc_semifinished',
  'qc_process',
  'qc_final',
  'qc_parameters',
  'maintenance_machines',
  'maintenance_breakdowns',
  'ci_checklists',
  'ci_kaizens',
  'ci_pokayokes',
  'sap_reports',
];

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@nexuserp.com', role: 'ADMIN' },
  { name: 'HOD User', email: 'hod@nexuserp.com', role: 'HOD' },
  { name: 'Purchase User', email: 'purchase@nexuserp.com', role: 'PURCHASE' },
  { name: 'Store User', email: 'store@nexuserp.com', role: 'STORE' },
  { name: 'HR User', email: 'hr@nexuserp.com', role: 'HR' },
  { name: 'QC User', email: 'qc@nexuserp.com', role: 'QC' },
  { name: 'Gate User', email: 'gate@nexuserp.com', role: 'GATE' },
  { name: 'Sales User', email: 'sales@nexuserp.com', role: 'SALES' },
  { name: 'Maint. User', email: 'maintenance@nexuserp.com', role: 'MAINTENANCE' },
];

const monthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const findOrCreate = async (delegate, where, create) => {
  const existing = await delegate.findFirst({ where });
  return existing || delegate.create({ data: create });
};

const syncDemoUsers = async () => {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of DEMO_USERS) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        isActive: true,
      },
      create: {
        ...user,
        password: hashedPassword,
        isActive: true,
      },
    });

    await prisma.modulePermission.deleteMany({ where: { userId: saved.id } });
    await prisma.modulePermission.createMany({
      data: MODULES.map(moduleName => ({
        userId: saved.id,
        moduleName,
        canRead: true,
        canWrite: true,
        canExecute: true,
      })),
      skipDuplicates: true,
    });
  }
};

const ensureDemoData = async () => {
  await syncDemoUsers();

  const [hrUser, purchaseUser, storeUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'hr@nexuserp.com' } }),
    prisma.user.findUnique({ where: { email: 'purchase@nexuserp.com' } }),
    prisma.user.findUnique({ where: { email: 'store@nexuserp.com' } }),
  ]);

  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'Production' }, update: { location: 'Plant 1' }, create: { name: 'Production', location: 'Plant 1' } }),
    prisma.department.upsert({ where: { name: 'Quality' }, update: { location: 'Lab' }, create: { name: 'Quality', location: 'Lab' } }),
    prisma.department.upsert({ where: { name: 'Stores' }, update: { location: 'Warehouse' }, create: { name: 'Stores', location: 'Warehouse' } }),
    prisma.department.upsert({ where: { name: 'HR' }, update: { location: 'Admin Block' }, create: { name: 'HR', location: 'Admin Block' } }),
  ]);

  await Promise.all([
    prisma.designation.upsert({ where: { name: 'Operator' }, update: {}, create: { name: 'Operator' } }),
    prisma.designation.upsert({ where: { name: 'Supervisor' }, update: {}, create: { name: 'Supervisor' } }),
    prisma.designation.upsert({ where: { name: 'Executive' }, update: {}, create: { name: 'Executive' } }),
    prisma.employeeCategory.upsert({ where: { name: 'Staff' }, update: {}, create: { name: 'Staff' } }),
    prisma.employeeCategory.upsert({ where: { name: 'Worker' }, update: {}, create: { name: 'Worker' } }),
  ]);

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { employeeCode: 'EMP001' },
      update: { department: 'HR', designation: 'Executive', isActive: true },
      create: {
        employeeCode: 'EMP001',
        name: 'AARTI SHARMA',
        fatherName: 'R K SHARMA',
        department: 'HR',
        designation: 'Executive',
        employeeCategory: 'Staff',
        employeeType: 'Full-Time',
        salary: 52000,
        phone: '9876543210',
        email: 'aarti@nexuserp.com',
        aadharNumber: '111122223333',
        panNumber: 'ABCDE1234F',
        accountNo: '123456789012',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0000123',
        joiningDate: new Date('2023-04-01'),
        isActive: true,
      },
    }),
    prisma.employee.upsert({
      where: { employeeCode: 'EMP002' },
      update: { department: 'Stores', designation: 'Supervisor', isActive: true },
      create: {
        employeeCode: 'EMP002',
        name: 'ROHAN PATEL',
        fatherName: 'M PATEL',
        department: 'Stores',
        designation: 'Supervisor',
        employeeCategory: 'Staff',
        employeeType: 'Full-Time',
        salary: 48000,
        phone: '9876543211',
        email: 'rohan@nexuserp.com',
        aadharNumber: '111122223334',
        panNumber: 'ABCDE1235F',
        accountNo: '123456789013',
        bankName: 'ICICI Bank',
        ifscCode: 'ICIC0000123',
        joiningDate: new Date('2022-11-15'),
        isActive: true,
      },
    }),
    prisma.employee.upsert({
      where: { employeeCode: 'EMP003' },
      update: { department: 'Production', designation: 'Operator', isActive: true },
      create: {
        employeeCode: 'EMP003',
        name: 'MEENA IYER',
        fatherName: 'S IYER',
        department: 'Production',
        designation: 'Operator',
        employeeCategory: 'Worker',
        employeeType: 'Full-Time',
        salary: 36000,
        phone: '9876543212',
        email: 'meena@nexuserp.com',
        aadharNumber: '111122223335',
        panNumber: 'ABCDE1236F',
        accountNo: '123456789014',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123',
        joiningDate: new Date('2021-08-20'),
        isActive: true,
      },
    }),
  ]);

  const [kgUnit, nosUnit] = await Promise.all([
    prisma.unitOfMeasurement.upsert({ where: { unitCode: 'KG' }, update: { unitName: 'Kilogram' }, create: { unitName: 'Kilogram', unitCode: 'KG' } }),
    prisma.unitOfMeasurement.upsert({ where: { unitCode: 'NOS' }, update: { unitName: 'Numbers' }, create: { unitName: 'Numbers', unitCode: 'NOS' } }),
  ]);

  const gst18 = await findOrCreate(
    prisma.gSTRate,
    { rateName: 'GST 18%', type: 'IGST' },
    { rateName: 'GST 18%', type: 'IGST', rate: 18 }
  );

  const terms = await findOrCreate(
    prisma.termsAndConditions,
    { title: 'Standard Purchase Terms' },
    { title: 'Standard Purchase Terms', content: 'Payment within 30 days after approved GRN.' }
  );

  const [rubberItem, chemicalItem, finishedItem] = await Promise.all([
    prisma.item.upsert({
      where: { itemCode: 'RM001' },
      update: { itemName: 'NATURAL RUBBER', unitId: kgUnit.id, gstId: gst18.id, minStockLevel: 250 },
      create: { itemCode: 'RM001', itemName: 'NATURAL RUBBER', itemType: 'RAW_MATERIAL', unitId: kgUnit.id, gstId: gst18.id, minStockLevel: 250, description: 'Demo raw material' },
    }),
    prisma.item.upsert({
      where: { itemCode: 'RM002' },
      update: { itemName: 'CURING CHEMICAL', unitId: kgUnit.id, gstId: gst18.id, minStockLevel: 50 },
      create: { itemCode: 'RM002', itemName: 'CURING CHEMICAL', itemType: 'CONSUMABLE', unitId: kgUnit.id, gstId: gst18.id, minStockLevel: 50, description: 'Demo consumable' },
    }),
    prisma.item.upsert({
      where: { itemCode: 'FG001' },
      update: { itemName: 'RUBBER SHEET SET', unitId: nosUnit.id, gstId: gst18.id, minStockLevel: 20 },
      create: { itemCode: 'FG001', itemName: 'RUBBER SHEET SET', itemType: 'FINISHED', unitId: nosUnit.id, gstId: gst18.id, minStockLevel: 20, description: 'Demo finished item' },
    }),
  ]);

  const vendor = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN001' },
    update: { companyName: 'ALPHA POLYMERS', contactPerson: 'KIRAN DESAI', phone: '9876508888', email: 'sales@alphapolymers.example', termsId: terms.id, isActive: true },
    create: {
      vendorCode: 'VEN001',
      companyName: 'ALPHA POLYMERS',
      contactPerson: 'KIRAN DESAI',
      phone: '9876508888',
      email: 'sales@alphapolymers.example',
      address: 'MIDC PUNE',
      city: 'PUNE',
      state: 'MAHARASHTRA',
      country: 'INDIA',
      gstNumber: '27AAACA1111A1Z1',
      termsId: terms.id,
      isActive: true,
    },
  });

  const store = await prisma.store.upsert({
    where: { storeCode: 'STR001' },
    update: { storeName: 'Main Raw Material Store', storeType: 'RAW_MATERIAL', isActive: true },
    create: { storeCode: 'STR001', storeName: 'Main Raw Material Store', storeType: 'RAW_MATERIAL', isActive: true },
  });

  const product = await prisma.product.upsert({
    where: { barcode: 'NX-DEMO-0001' },
    update: { itemId: rubberItem.id, storeId: store.id, quantity: 1250, rate: 180 },
    create: {
      itemId: rubberItem.id,
      storeId: store.id,
      barcode: 'NX-DEMO-0001',
      batchNo: 'BATCH-RM-0426',
      mfgDate: new Date('2026-04-01'),
      expDate: new Date('2027-04-01'),
      quantity: 1250,
      rate: 180,
      size: 'STANDARD',
      remark: 'Demo opening stock',
    },
  });

  await findOrCreate(
    prisma.stockMovement,
    { productId: product.id, remark: 'Demo opening balance' },
    { productId: product.id, itemId: rubberItem.id, toStoreId: store.id, movementType: 'IN', quantity: 1250, remark: 'Demo opening balance', createdBy: 'System' }
  );

  const indent = await prisma.indent.upsert({
    where: { indentNo: 'IND-DEMO-001' },
    update: { status: 'APPROVED', requestedById: employees[0].id },
    create: {
      indentNo: 'IND-DEMO-001',
      indentType: 'OPEN_INDENT',
      requestedById: employees[0].id,
      dueDate: new Date('2026-05-10'),
      status: 'APPROVED',
      approvalDate: new Date(),
      remarks: 'Demo material request',
      items: { create: [{ itemId: rubberItem.id, stockInHand: 1250, requestQty: 500, shortQty: 0, lastVendor: vendor.companyName, lastPrice: 180 }] },
    },
  });

  const po = await prisma.purchaseOrder.upsert({
    where: { poNo: 'PO-DEMO-001' },
    update: { vendorId: vendor.id, indentId: indent.id, status: 'APPROVED', totalAmount: 90000 },
    create: {
      poNo: 'PO-DEMO-001',
      vendorId: vendor.id,
      indentId: indent.id,
      status: 'APPROVED',
      approvalDate: new Date(),
      totalAmount: 90000,
      items: { create: [{ itemId: rubberItem.id, qty: 500, rate: 180, amount: 90000 }] },
    },
  });

  const gatePass = await prisma.gatePass.upsert({
    where: { gatePassNo: 'GP-DEMO-001' },
    update: { poId: po.id, vendorId: vendor.id, receivedQty: 500 },
    create: { gatePassNo: 'GP-DEMO-001', poId: po.id, vendorId: vendor.id, vehicleNo: 'MH12AB9090', driverName: 'RAMESH', receivedQty: 500, date: today(), remark: 'Demo inward' },
  });

  const grn = await prisma.gRN.upsert({
    where: { grnNo: 'GRN-DEMO-001' },
    update: { poId: po.id, gatePassId: gatePass.id, receivedQty: 500, acceptedQty: 490, rejectedQty: 10, status: 'APPROVED' },
    create: { grnNo: 'GRN-DEMO-001', poId: po.id, gatePassId: gatePass.id, receivedQty: 500, acceptedQty: 490, rejectedQty: 10, status: 'APPROVED' },
  });

  await prisma.mRN.upsert({
    where: { mrnNo: 'MRN-DEMO-001' },
    update: { grnId: grn.id, status: 'APPROVED', remark: 'Demo store receipt' },
    create: { mrnNo: 'MRN-DEMO-001', grnId: grn.id, status: 'APPROVED', remark: 'Demo store receipt' },
  });

  await prisma.purchaseBill.upsert({
    where: { billNo: 'BILL-DEMO-001' },
    update: { poId: po.id, vendorId: vendor.id, itemId: rubberItem.id, totalAmount: 106200 },
    create: { billNo: 'BILL-DEMO-001', poId: po.id, vendorId: vendor.id, itemId: rubberItem.id, invoiceNo: 'INV-DEMO-001', invoiceDate: today(), batchNo: 'BATCH-RM-0426', qty: 500, rate: 180, cgst: 9, sgst: 9, igst: 0, totalAmount: 106200 },
  });

  await findOrCreate(
    prisma.purchaseReturn,
    { returnNo: 'PR-DEMO-001' },
    { returnNo: 'PR-DEMO-001', grnId: grn.id, returnQty: 10, reason: 'Demo rejection sample', date: today() }
  );

  await prisma.salesOrder.upsert({
    where: { orderNo: 'SO-DEMO-001' },
    update: { customerName: 'ACME INDUSTRIES', productName: finishedItem.itemName, quantity: 120, unitPrice: 850, totalAmount: 102000, status: 'CONFIRMED' },
    create: { orderNo: 'SO-DEMO-001', customerName: 'ACME INDUSTRIES', customerCode: 'CUST001', productName: finishedItem.itemName, quantity: 120, unitPrice: 850, totalAmount: 102000, orderDate: today(), dueDate: new Date('2026-05-15'), status: 'CONFIRMED', priority: 'HIGH', channel: 'DIRECT', assignedTo: 'Sales User', remarks: 'Demo sales order' },
  });

  await prisma.costingJob.upsert({
    where: { drawingNo: 'DRG-DEMO-001' },
    update: { materialName: 'NATURAL RUBBER', totalSetCost: 25400 },
    create: {
      drawingNo: 'DRG-DEMO-001',
      departmentType: 'RUBBER',
      projectName: 'Demo gasket set',
      purchaseOrderId: po.id,
      purchaseOrderNo: po.poNo,
      sourceItemId: rubberItem.id,
      sourceItemCode: rubberItem.itemCode,
      sourceItemName: rubberItem.itemName,
      materialName: 'NATURAL RUBBER',
      density: 1.15,
      items: [{ id: 'demo-line-1', name: 'Sheet profile', length: 500, width: 300, qty: 20 }],
      totalArea: 3000000,
      totalVolume: 24000000,
      totalWeight: 27.6,
      totalLineItems: 1,
      sheetCostPerSheet: 900,
      totalSetCost: 25400,
      notes: 'Demo costing job',
    },
  });

  const bom = await prisma.bOM.upsert({
    where: { bomCode: 'BOM-DEMO-001' },
    update: { productName: finishedItem.itemName, version: '1.0', isActive: true },
    create: {
      bomCode: 'BOM-DEMO-001',
      productName: finishedItem.itemName,
      version: '1.0',
      isActive: true,
      items: { create: [{ itemId: rubberItem.id, qty: 4, level: 1, unit: 'KG' }, { itemId: chemicalItem.id, qty: 0.25, level: 1, unit: 'KG' }] },
    },
  });

  const workOrder = await prisma.workOrder.upsert({
    where: { woNo: 'WO-DEMO-001' },
    update: { bomId: bom.id, plannedQty: 100, status: 'APPROVED' },
    create: { woNo: 'WO-DEMO-001', bomId: bom.id, plannedQty: 100, status: 'APPROVED', startDate: today(), endDate: new Date('2026-05-08') },
  });

  const template = await findOrCreate(
    prisma.qCTemplate,
    { stage: 'RAW_MATERIAL_TEST', name: 'Rubber Incoming Protocol' },
    { stage: 'RAW_MATERIAL_TEST', name: 'Rubber Incoming Protocol', fields: [{ name: 'Hardness', type: 'number' }, { name: 'Visual', type: 'text' }] }
  );

  await prisma.qCReport.upsert({
    where: { qcNo: 'QC-DEMO-001' },
    update: { grnId: grn.id, stage: 'RAW_MATERIAL_TEST', templateId: template.id, passOrFail: true, status: 'APPROVED' },
    create: { qcNo: 'QC-DEMO-001', grnId: grn.id, stage: 'RAW_MATERIAL_TEST', templateId: template.id, parameters: { Hardness: 65, Visual: 'OK' }, result: 'Accepted', passOrFail: true, status: 'APPROVED', createdBy: 'System' },
  });

  await Promise.all([
    prisma.qCParameter.upsert({ where: { name: 'Hardness Shore A' }, update: { unit: 'Shore A', minValue: 60, maxValue: 70 }, create: { name: 'Hardness Shore A', unit: 'Shore A', minValue: 60, maxValue: 70, type: 'RANGE', instrument: 'Durometer', method: 'ASTM D2240' } }),
    prisma.qCParameter.upsert({ where: { name: 'Thickness' }, update: { unit: 'mm', minValue: 7.8, maxValue: 8.2 }, create: { name: 'Thickness', unit: 'mm', minValue: 7.8, maxValue: 8.2, type: 'RANGE', instrument: 'Vernier', method: 'Incoming inspection' } }),
  ]);

  const machine = await prisma.machine.upsert({
    where: { code: 'MC-DEMO-001' },
    update: { name: 'Hydraulic Press 1', status: 'OPERATIONAL' },
    create: { code: 'MC-DEMO-001', name: 'Hydraulic Press 1', location: 'Shop Floor A', department: 'Production', status: 'OPERATIONAL', make: 'Demo Make', model: 'HP-100', installDate: new Date('2021-01-10'), lastService: new Date('2026-04-01'), nextService: new Date('2026-07-01') },
  });

  await prisma.breakdownReport.upsert({
    where: { reportNo: 'BR-DEMO-001' },
    update: { machineId: machine.id, status: 'RESOLVED' },
    create: { reportNo: 'BR-DEMO-001', machineId: machine.id, breakdownDate: new Date('2026-04-12'), downTimeStart: new Date('2026-04-12T10:00:00'), downTimeEnd: new Date('2026-04-12T12:00:00'), type: 'RUNNING', reason: 'Hydraulic oil top-up', reportedBy: 'MEENA IYER', approvedBy: 'Supervisor', actionTaken: 'Oil replaced and pressure tested', partsChanged: [{ part: 'Oil seal', cost: 450 }], totalCharge: 450, status: 'RESOLVED' },
  });

  await Promise.all([
    prisma.checklistMaster.upsert({ where: { title: 'Daily Press Safety Check' }, update: { isActive: true }, create: { title: 'Daily Press Safety Check', department: 'Production', type: 'SAFETY', points: ['Emergency stop working', 'Guard in place', 'Oil level checked'], isActive: true } }),
    prisma.kaizen.upsert({ where: { kaizenNo: 'KZ-DEMO-001' }, update: { status: 'IMPLEMENTED' }, create: { kaizenNo: 'KZ-DEMO-001', title: 'Tool shadow board', department: 'Production', area: 'Press Line', problemStatement: 'Tools were hard to locate during setup.', solution: 'Installed labeled shadow board.', benefits: 'Reduced setup time by 10 minutes.', implementedBy: 'CI TEAM', implementedDate: today(), status: 'IMPLEMENTED' } }),
    prisma.pokaYoke.upsert({ where: { pyNo: 'PY-DEMO-001' }, update: { isActive: true }, create: { pyNo: 'PY-DEMO-001', processName: 'Batch Weighing', department: 'Stores', defectPrevented: 'Wrong chemical issue', mechanism: 'Color-coded bin tags', verificationMethod: 'Supervisor signoff', isActive: true } }),
  ]);

  await findOrCreate(
    prisma.task,
    { title: 'Review demo ERP readiness' },
    { title: 'Review demo ERP readiness', description: 'Validate seeded demo workflows across HR, purchase, inventory, QC, manufacturing, and sales.', date: today(), priority: 'HIGH', category: 'DAILY', status: 'IN_PROGRESS', completion: 35, assignedTo: 'Admin' }
  );

  for (const employee of employees) {
    for (let offset = 0; offset < 5; offset += 1) {
      const date = new Date(today());
      date.setDate(date.getDate() - offset);
      const isAbsent = offset === 3;
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: employee.id, date } },
        update: { status: isAbsent ? 'ABSENT' : 'PRESENT', hoursWorked: isAbsent ? 0 : 8.5 },
        create: {
          employeeId: employee.id,
          date,
          status: isAbsent ? 'ABSENT' : 'PRESENT',
          checkIn: isAbsent ? null : new Date(`${date.toISOString().slice(0, 10)}T09:00:00`),
          checkOut: isAbsent ? null : new Date(`${date.toISOString().slice(0, 10)}T17:30:00`),
          hoursWorked: isAbsent ? 0 : 8.5,
          modifiedBy: 'System',
        },
      });
    }

    await findOrCreate(
      prisma.employeeAdvance,
      { employeeId: employee.id, referenceNo: `ADV-DEMO-${employee.employeeCode}` },
      { employeeId: employee.id, amount: 2500, date: today(), purpose: 'Demo advance', paymentMode: 'Cash', referenceNo: `ADV-DEMO-${employee.employeeCode}`, approvedBy: 'Admin', status: 'APPROVED' }
    );

    await prisma.employeeGatePass.upsert({
      where: { gatePassNo: `EGP-DEMO-${employee.employeeCode}` },
      update: { employeeId: employee.id, status: 'RETURNED' },
      create: {
        employeeId: employee.id,
        gatePassNo: `EGP-DEMO-${employee.employeeCode}`,
        passType: 'Official',
        date: today(),
        outTime: new Date(`${new Date().toISOString().slice(0, 10)}T14:00:00`),
        inTime: new Date(`${new Date().toISOString().slice(0, 10)}T16:00:00`),
        reason: 'Bank work',
        status: 'RETURNED',
        approvedBy: 'Admin',
      },
    });

    const earnings = { basic: employee.salary * 0.5, hra: employee.salary * 0.25, conveyance: 2000, other: employee.salary * 0.25 - 2000 };
    const deductions = { pf: 1800, esi: Math.round(employee.salary * 0.0075), tds: 0 };
    const attendance = { present: 24, weekOff: 4, holiday: 1, totAbs: 1, leave: 1, payDays: 29 };
    const netPayable = Object.values(earnings).reduce((sum, value) => sum + Number(value || 0), 0) - Object.values(deductions).reduce((sum, value) => sum + Number(value || 0), 0);

    await prisma.salarySlip.upsert({
      where: { employeeId_month_year: { employeeId: employee.id, month: monthStart().getMonth() + 1, year: monthStart().getFullYear() } },
      update: { earnings: JSON.stringify(earnings), deductions: JSON.stringify(deductions), attendance: JSON.stringify(attendance), netPayable },
      create: { employeeId: employee.id, month: monthStart().getMonth() + 1, year: monthStart().getFullYear(), earnings: JSON.stringify(earnings), deductions: JSON.stringify(deductions), advances: JSON.stringify({ advance: 0 }), attendance: JSON.stringify(attendance), netPayable, modifyHistory: JSON.stringify([{ when: new Date(), reason: 'Demo seed' }]) },
    });
  }

  return {
    users: DEMO_USERS.length,
    employees: employees.length,
    modules: MODULES.length,
    departments: departments.length,
    workOrder: workOrder.woNo,
  };
};

module.exports = { ensureDemoData, syncDemoUsers, MODULES, DEMO_PASSWORD };
