const { prisma } = require('../db');
const { calculateCostingSummary, FORMULA_LABELS } = require('../utils/costingCalculator');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const normalizePayload = (body = {}) => {
  const materialName = String(body.materialName || '').trim();
  const drawingNo = String(body.drawingNo || '').trim();

  return {
    drawingNo,
    departmentType: String(body.departmentType || 'RUBBER').trim().toUpperCase(),
    projectName: String(body.projectName || '').trim() || null,
    purchaseOrderId: String(body.purchaseOrderId || '').trim() || null,
    purchaseOrderNo: String(body.purchaseOrderNo || '').trim() || null,
    sourceItemId: String(body.sourceItemId || '').trim() || null,
    sourceItemCode: String(body.sourceItemCode || '').trim() || null,
    sourceItemName: String(body.sourceItemName || '').trim() || null,
    materialName,
    density: Number(body.density || 0),
    items: Array.isArray(body.items) ? body.items : [],
    sheetLength: Number(body.sheetLength || 900),
    sheetWidth: Number(body.sheetWidth || 600),
    sheetThickness: Number(body.sheetThickness || 8),
    sheetCostPerSheet: Number(body.sheetCostPerSheet || 0),
    packagingCost: Number(body.packagingCost || 0),
    wastagePct: Number(body.wastagePct ?? 0.25),
    profitPct: Number(body.profitPct ?? 0.10),
    designPct: Number(body.designPct ?? 0.10),
    holesPct: Number(body.holesPct ?? 0.05),
    rejectionPct: Number(body.rejectionPct ?? 0.03),
    notes: String(body.notes || '').trim() || null,
  };
};

const buildRecordData = (payload) => {
  const summary = calculateCostingSummary(payload);

  return {
    data: {
      ...payload,
      items: summary.items,
      ...summary.totals,
    },
    summary,
  };
};

const validatePayload = (payload) => {
  if (!payload.drawingNo) return 'Drawing number is required';
  if (!payload.departmentType) return 'Department is required';
  if (!payload.materialName) return 'Material name is required';
  if (!(payload.density > 0)) return 'Density must be greater than zero';
  if (!Array.isArray(payload.items) || payload.items.length === 0) return 'At least one line item is required';
  return null;
};

const emitUpdate = (req, payload) => {
  req.app.get('io')?.emit('costing:updated', payload);
};

const getCostingJobs = async (req, res) => {
  try {
    const departmentType = String(req.query.departmentType || '').trim().toUpperCase();
    const jobs = await prisma.costingJob.findMany({
      where: departmentType ? { departmentType } : {},
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCostingJob = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const error = validatePayload(payload);
    if (error) return res.status(400).json({ success: false, message: error });

    const exists = await prisma.costingJob.findUnique({ where: { drawingNo: payload.drawingNo } });
    if (exists) return res.status(400).json({ success: false, message: 'Drawing number already exists' });

    const { data, summary } = buildRecordData(payload);
    if (!summary.items.length) {
      return res.status(400).json({ success: false, message: 'At least one valid line item is required' });
    }
    const job = await prisma.costingJob.create({ data });

    emitUpdate(req, { type: 'created', drawingNo: job.drawingNo });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCostingJob = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const error = validatePayload(payload);
    if (error) return res.status(400).json({ success: false, message: error });

    const existing = await prisma.costingJob.findFirst({
      where: {
        drawingNo: payload.drawingNo,
        NOT: { id: req.params.id }
      }
    });

    if (existing) return res.status(400).json({ success: false, message: 'Drawing number already exists' });

    const { data, summary } = buildRecordData(payload);
    if (!summary.items.length) {
      return res.status(400).json({ success: false, message: 'At least one valid line item is required' });
    }
    const job = await prisma.costingJob.update({
      where: { id: req.params.id },
      data
    });

    emitUpdate(req, { type: 'updated', drawingNo: job.drawingNo });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCostingJob = async (req, res) => {
  try {
    const job = await prisma.costingJob.delete({
      where: { id: req.params.id }
    });

    emitUpdate(req, { type: 'deleted', drawingNo: job.drawingNo });
    res.json({ success: true, message: 'Costing job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCostingDashboard = async (req, res) => {
  try {
    const jobs = await prisma.costingJob.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const monthlyTrend = MONTHS.map((month) => ({ month, setCost: 0, weight: 0 }));
    const materialMap = new Map();
    const formulaMap = new Map();
    const departmentMap = new Map();

    let totalWeight = 0;
    let totalSetCost = 0;
    let totalVolume = 0;
    let totalSheets = 0;
    let totalJobs = jobs.length;
    let totalLineItems = 0;

    jobs.forEach((job) => {
      const createdAt = new Date(job.createdAt);
      const monthIndex = createdAt.getMonth();
      monthlyTrend[monthIndex].setCost += Number(job.totalSetCost || 0);
      monthlyTrend[monthIndex].weight += Number(job.totalWeight || 0);

      totalWeight += Number(job.totalWeight || 0);
      totalSetCost += Number(job.totalSetCost || 0);
      totalVolume += Number(job.totalVolume || 0);
      totalSheets += Number(job.totalSheets || 0);
      totalLineItems += Number(job.totalLineItems || 0);

      const materialKey = String(job.materialName || 'UNKNOWN').toUpperCase();
      materialMap.set(materialKey, (materialMap.get(materialKey) || 0) + Number(job.totalSetCost || 0));
      const departmentKey = String(job.departmentType || 'RUBBER').toUpperCase();
      const departmentEntry = departmentMap.get(departmentKey) || {
        name: departmentKey,
        jobs: 0,
        totalWeight: 0,
        totalSetCost: 0,
      };
      departmentEntry.jobs += 1;
      departmentEntry.totalWeight += Number(job.totalWeight || 0);
      departmentEntry.totalSetCost += Number(job.totalSetCost || 0);
      departmentMap.set(departmentKey, departmentEntry);

      const items = Array.isArray(job.items) ? job.items : [];
      items.forEach((item) => {
        const label = FORMULA_LABELS[item.formulaType] || item.formulaType || 'Manual';
        formulaMap.set(label, (formulaMap.get(label) || 0) + 1);
      });
    });

    const topMaterials = Array.from(materialMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

    const designMix = Array.from(formulaMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
    const departmentBreakdown = Array.from(departmentMap.values()).map((entry) => ({
      name: entry.name,
      jobs: entry.jobs,
      totalWeight: Number(entry.totalWeight.toFixed(4)),
      totalSetCost: Number(entry.totalSetCost.toFixed(2)),
    }));

    const recentJobs = jobs.slice(0, 6);
    const averageSetCost = totalJobs ? totalSetCost / totalJobs : 0;
    const avgWeightPerJob = totalJobs ? totalWeight / totalJobs : 0;
    const avgUtilization = totalJobs
      ? jobs.reduce((sum, job) => sum + Number(job.utilizationPct || 0), 0) / totalJobs
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalJobs,
          totalWeight: Number(totalWeight.toFixed(4)),
          totalSetCost: Number(totalSetCost.toFixed(2)),
          totalVolume: Number(totalVolume.toFixed(2)),
          totalSheets: Number(totalSheets.toFixed(2)),
          totalLineItems,
          averageSetCost: Number(averageSetCost.toFixed(2)),
          avgWeightPerJob: Number(avgWeightPerJob.toFixed(4)),
          avgUtilization: Number(avgUtilization.toFixed(2)),
        },
        charts: {
          monthlyTrend: monthlyTrend.map((row) => ({
            month: row.month,
            setCost: Number(row.setCost.toFixed(2)),
            weight: Number(row.weight.toFixed(4)),
          })),
          topMaterials,
          designMix,
          departmentBreakdown,
        },
        lists: {
          recentJobs,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCostingJobs,
  createCostingJob,
  updateCostingJob,
  deleteCostingJob,
  getCostingDashboard,
};
