const { prisma } = require('../db');
const { generateUniqueCode } = require('../utils/codeGenerator');

exports.getWorkOrders = async (req, res) => {
    try {
        const data = await prisma.workOrder.findMany({
            include: { 
                bom: { include: { items: { include: { item: true } } } }, 
                issues: true,
                processes: { orderBy: { sequence: 'asc' } },
                dailyOutputs: { orderBy: { date: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) { 
        console.error('WorkOrder Fetch Error:', error);
        res.status(500).json({ success: false, message: error.message }); 
    }
};

exports.createWorkOrder = async (req, res) => {
    try {
        const { bomId, plannedQty, startDate } = req.body;
        const woNo = await generateUniqueCode({
            prisma,
            model: 'workOrder',
            field: 'woNo',
            prefix: `WO-${new Date().getFullYear()}`,
            separator: '-',
            length: 6
        });

        const data = await prisma.workOrder.create({
            data: {
                woNo,
                bomId,
                plannedQty: parseFloat(plannedQty),
                startDate: new Date(startDate),
                status: 'PENDING'
            }
        });

        // Automatically create a Production Indent for the raw materials
        const bom = await prisma.bOM.findUnique({
            where: { id: bomId },
            include: { items: true }
        });

        // Resolve Employee ID from User ID (Indents require Employee relation)
        let employee = await prisma.employee.findUnique({
            where: { userId: req.user.id }
        });

        // SELF-HEAL: If no employee record, create one on the fly
        if (!employee) {
            const code = await generateUniqueCode({
                prisma,
                model: 'employee',
                field: 'employeeCode',
                prefix: 'EMP',
                separator: '-',
                length: 6
            });
            employee = await prisma.employee.create({
                data: {
                    employeeCode: code,
                    name: req.user.name || 'Admin',
                    email: req.user.email,
                    userId: req.user.id,
                    department: 'GENERAL',
                    designation: req.user.role || 'ADMIN',
                    salary: 0,
                    phone: '0000000000',
                    joiningDate: new Date(),
                    isActive: true
                }
            });
        }

        if (employee) {
            const indentNo = await generateUniqueCode({
                prisma,
                model: 'indent',
                field: 'indentNo',
                prefix: 'IND-PRD',
                separator: '-',
                length: 6
            });
            await prisma.indent.create({
                data: {
                    indentNo,
                    indentType: 'PRODUCTION',
                    requestedById: employee.id,
                    orderId: data.id,
                    items: {
                        create: bom.items.map(item => ({
                            itemId: item.itemId,
                            requestQty: item.qty * parseFloat(plannedQty)
                        }))
                    }
                }
            });
        }

        req.app.get('io')?.emit('workorder:updated', { woNo, type: 'CREATED' });
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.recordProduction = async (req, res) => {
    try {
        const { woId, itemId, storeId, quantity, batchNo, rate, qcReportId } = req.body;

        const product = await prisma.product.create({
            data: {
                itemId,
                storeId,
                barcode: `PRD-${Date.now()}`,
                batchNo,
                quantity: parseFloat(quantity),
                rate: parseFloat(rate),
                mfgDate: new Date()
            }
        });

        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                itemId,
                toStoreId: storeId,
                movementType: 'IN',
                quantity: parseFloat(quantity),
                remark: `Production Output from WO ${woId}`,
                createdBy: req.user.name || 'SYSTEM'
            }
        });

        req.app.get('io')?.emit('production:recorded', { woId, product: product.barcode });
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMaterialIssues = async (req, res) => {
    try {
        const data = await prisma.materialIssue.findMany({
            include: { 
                workOrder: { include: { bom: true } },
                issuedBy: true,
                items: { include: { item: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.issueMaterial = async (req, res) => {
    try {
        const { woId, items, issuedById } = req.body;
        const targetUserId = issuedById || req.user.id;

        let employee = await prisma.employee.findFirst({ 
            where: { OR: [{ id: targetUserId }, { userId: targetUserId }] } 
        });
        
        // SELF-HEAL
        if (!employee) {
            const code = await generateUniqueCode({
                prisma,
                model: 'employee',
                field: 'employeeCode',
                prefix: 'EMP',
                separator: '-',
                length: 6
            });
            employee = await prisma.employee.create({
                data: {
                    employeeCode: code,
                    name: req.user.name || 'Admin',
                    email: req.user.email,
                    userId: req.user.id,
                    department: 'GENERAL',
                    designation: req.user.role || 'ADMIN',
                    salary: 0,
                    phone: '0000000000',
                    joiningDate: new Date(),
                    isActive: true
                }
            });
        }

        const issueNo = `ISS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        const issue = await prisma.$transaction(async (tx) => {
            const createdIssue = await tx.materialIssue.create({
                data: {
                    issueNo,
                    woId,
                    issuedById: employee.id,
                    items: {
                        create: items.map(it => ({
                            itemId: it.itemId,
                            issueQty: parseFloat(it.qty)
                        }))
                    }
                }
            });

            for (const it of items) {
                const qty = parseFloat(it.qty);
                const product = await tx.product.findFirst({
                    where: { itemId: it.itemId, storeId: it.storeId, quantity: { gte: qty } }
                });
                if (!product) throw new Error('Insufficient stock for item in selected store');

                await tx.product.update({
                    where: { id: product.id },
                    data: { quantity: { decrement: qty } }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        itemId: it.itemId,
                        fromStoreId: it.storeId,
                        movementType: 'OUT',
                        quantity: qty,
                        remark: `Issued to Work Order ${woId}`,
                        createdBy: req.user.name || 'SYSTEM'
                    }
                });
            }

            return createdIssue;
        });
        req.app.get('io')?.emit('issue:updated', { issueNo: issue.issueNo, woId });
        res.json({ success: true, data: issue });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getWorkOrderQC = async (req, res) => {
    try {
        const data = await prisma.qCReport.findMany({
            where: { woId: req.params.woId },
            include: { template: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.recordWorkOrderQC = async (req, res) => {
    try {
        const { woId, templateId, parameters, result, passOrFail } = req.body;
        const qcNo = await generateUniqueCode({
            prisma,
            model: 'qCReport',
            field: 'qcNo',
            prefix: 'QC-PRC',
            separator: '-',
            length: 6
        });

        const data = await prisma.qCReport.create({
            data: {
                qcNo, woId, templateId, stage: 'PROCESS', parameters, result, passOrFail,
                status: 'APPROVED', createdBy: req.user.name
            }
        });
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.convertSFGtoFG = async (req, res) => {
    try {
        const { sourceProductId, targetItemId, targetStoreId, sourceQty, targetQty, batchNo } = req.body;

        // 1. Consume Source SFG
        const sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });
        if (sourceProduct.quantity < sourceQty) throw new Error('Insufficient source quantity');

        await prisma.product.update({
            where: { id: sourceProductId },
            data: { quantity: { decrement: parseFloat(sourceQty) } }
        });

        await prisma.stockMovement.create({
            data: {
                productId: sourceProductId,
                itemId: sourceProduct.itemId,
                fromStoreId: sourceProduct.storeId,
                movementType: 'OUT',
                quantity: parseFloat(sourceQty),
                remark: `Consumed for Conversion to FG`,
                createdBy: req.user.name || 'SYSTEM'
            }
        });

        // 2. Add Target FG
        const fgProduct = await prisma.product.create({
            data: {
                itemId: targetItemId,
                storeId: targetStoreId,
                barcode: `FG-${Date.now()}`,
                batchNo,
                quantity: parseFloat(targetQty),
                rate: sourceProduct.rate * (sourceQty / targetQty) // Distributed rate
            }
        });

        await prisma.stockMovement.create({
            data: {
                productId: fgProduct.id,
                itemId: targetItemId,
                toStoreId: targetStoreId,
                movementType: 'IN',
                quantity: parseFloat(targetQty),
                remark: `Conversion Output from ${sourceProduct.barcode}`,
                createdBy: req.user.name || 'SYSTEM'
            }
        });

        res.json({ success: true, data: fgProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateIndent = async (req, res) => {
    try {
        const { woId } = req.body;
        const wo = await prisma.workOrder.findUnique({ where: { id: woId }, include: { bom: { include: { items: true } } } });
        if (!wo) return res.status(404).json({ success: false, message: 'Work Order not found' });

        const existing = await prisma.indent.findFirst({ where: { orderId: woId } });
        if (existing) return res.status(400).json({ success: false, message: 'Demand already raised for this Work Order' });

        const employee = await prisma.employee.findFirst({ where: { OR: [{ id: req.user.id }, { userId: req.user.id }] } });
        
        const indentNo = await generateUniqueCode({
            prisma,
            model: 'indent',
            field: 'indentNo',
            prefix: 'IND-PRD',
            separator: '-',
            length: 6
        });
        const indent = await prisma.indent.create({
            data: {
                indentNo,
                indentType: 'PRODUCTION',
                requestedById: employee?.id || 'SYSTEM',
                orderId: wo.id,
                items: {
                    create: wo.bom.items.map(it => ({
                        itemId: it.itemId,
                        requestQty: it.qty * wo.plannedQty
                    }))
                }
            }
        });

        res.json({ success: true, data: indent });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.recordDailyOutput = async (req, res) => {
    try {
        const { woId, processId, processName, qtyProduced, qtyRejected, operatorName, shift, remarks } = req.body;
        
        const output = await prisma.$transaction(async (tx) => {
            const daily = await tx.dailyOutput.create({
                data: {
                    woId,
                    processName,
                    qtyProduced: parseFloat(qtyProduced),
                    qtyRejected: parseFloat(qtyRejected) || 0,
                    operatorName,
                    shift,
                    remarks
                }
            });

            if (processId) {
                await tx.workOrderProcess.update({
                    where: { id: processId },
                    data: {
                        actualQty: { increment: parseFloat(qtyProduced) },
                        rejectQty: { increment: parseFloat(qtyRejected) || 0 },
                        status: 'IN_PROGRESS'
                    }
                });

                // Also update WO status if it was PENDING
                const wo = await tx.workOrder.findUnique({ where: { id: woId } });
                if (wo.status === 'PENDING') {
                    await tx.workOrder.update({
                        where: { id: woId },
                        data: { status: 'APPROVED' } // APPROVED acts as IN_PROGRESS here based on Badge mapping
                    });
                }
            }
            return daily;
        });
        req.app.get('io')?.emit('production:output', { woId, qtyProduced });
        res.json({ success: true, data: output });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateProcessStatus = async (req, res) => {
    try {
        const { processId, status, woId } = req.body;
        const data = await prisma.workOrderProcess.update({
            where: { id: processId },
            data: { status }
        });

        // If all processes are COMPLETED, maybe mark WO as COMPLETED?
        if (status === 'COMPLETED' && woId) {
            const all = await prisma.workOrderProcess.findMany({ where: { woId } });
            if (all.every(p => p.status === 'COMPLETED')) {
                const wo = await prisma.workOrder.update({
                    where: { id: woId },
                    data: { status: 'COMPLETED' },
                    include: { bom: true }
                });

                // INTEGRATION: Move to Finished Goods Inventory
                const fgStore = await prisma.store.findFirst({ where: { storeType: 'FINISHED' } });
                if (fgStore) {
                    // Try to find if this item is already in Items master, otherwise use product name
                    const productItem = await prisma.item.findFirst({ 
                        where: { itemName: wo.bom.productName, itemType: 'FINISHED' } 
                    });

                    if (productItem) {
                        const product = await prisma.product.create({
                            data: {
                                itemId: productItem.id,
                                storeId: fgStore.id,
                                barcode: `FG-${wo.woNo}-${Date.now()}`,
                                quantity: wo.plannedQty,
                                rate: 0, // Cost calculation can be added later
                                remark: `Production output from WO: ${wo.woNo}`
                            }
                        });

                        await prisma.stockMovement.create({
                            data: {
                                productId: product.id,
                                itemId: productItem.id,
                                toStoreId: fgStore.id,
                                movementType: 'IN',
                                quantity: wo.plannedQty,
                                remark: `Manufactured via WO: ${wo.woNo}`,
                                createdBy: 'SYSTEM'
                            }
                        });
                    }
                }
            }
        }

        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
