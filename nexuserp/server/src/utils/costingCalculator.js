const PI = 3.14;

const FORMULA_LABELS = {
  A_OD_ID: 'A (OD x ID)',
  B_OD_OD: 'B (OD x OD)',
  C_OIL_GAUGE: 'C (Oil Gauge)',
  D_FRAME: 'D (Frame)',
  E_CORD: 'Cord',
  F_ORING: 'O-Ring',
  G_MANUAL: 'Manual',
};

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const computeLineMetrics = (line = {}, density = 0) => {
  const formulaType = String(line.formulaType || 'A_OD_ID').toUpperCase();
  const dim1 = numberValue(line.dim1);
  const dim2 = numberValue(line.dim2);
  const dim3 = numberValue(line.dim3);
  const thickness = numberValue(line.thickness);
  const length = numberValue(line.length);
  const qty = Math.max(numberValue(line.qty, 1), 0);

  let area = 0;
  let areaWithQty = 0;
  let volume = 0;

  switch (formulaType) {
    case 'A_OD_ID':
      area = (PI / 4) * ((dim1 ** 2) - (dim2 ** 2));
      area = Math.max(area, 0);
      areaWithQty = area * qty;
      volume = areaWithQty * thickness;
      break;
    case 'B_OD_OD':
      area = dim1 * dim1;
      areaWithQty = area * qty;
      volume = areaWithQty * thickness;
      break;
    case 'C_OIL_GAUGE':
      area = dim1 * dim2;
      areaWithQty = area * qty;
      volume = areaWithQty * thickness;
      break;
    case 'D_FRAME':
      area = 2 * (dim1 + dim2) * dim3;
      areaWithQty = area * qty;
      volume = areaWithQty * thickness;
      break;
    case 'E_CORD':
      area = (PI / 4) * ((dim1 ** 2) - (dim2 ** 2));
      area = Math.max(area, 0);
      areaWithQty = area * qty;
      volume = areaWithQty * length;
      break;
    case 'F_ORING': {
      const crossSectionArea = (PI / 4) * (dim2 ** 2);
      area = crossSectionArea;
      areaWithQty = area * qty;
      volume = crossSectionArea * (PI * dim1) * qty;
      break;
    }
    case 'G_MANUAL':
      area = dim1;
      areaWithQty = area * qty;
      volume = areaWithQty * thickness;
      break;
    default:
      area = 0;
      areaWithQty = 0;
      volume = 0;
  }

  const weight = volume * numberValue(density) / 1000000;

  return {
    formulaType,
    formulaLabel: FORMULA_LABELS[formulaType] || formulaType,
    description: String(line.description || '').trim(),
    dim1: round(dim1),
    dim2: round(dim2),
    dim3: round(dim3),
    thickness: round(thickness),
    length: round(length),
    qty: round(qty),
    area: round(area),
    areaWithQty: round(areaWithQty),
    volume: round(volume),
    weight: round(weight, 6),
  };
};

const calculateCostingSummary = (payload = {}) => {
  const density = numberValue(payload.density);
  const sheetLength = numberValue(payload.sheetLength, 900);
  const sheetWidth = numberValue(payload.sheetWidth, 600);
  const sheetThickness = numberValue(payload.sheetThickness, 8);
  const sheetCostPerSheet = numberValue(payload.sheetCostPerSheet);
  const packagingCost = numberValue(payload.packagingCost);
  const wastagePct = numberValue(payload.wastagePct, 0.25);
  const profitPct = numberValue(payload.profitPct, 0.10);
  const designPct = numberValue(payload.designPct, 0.10);
  const holesPct = numberValue(payload.holesPct, 0.05);
  const rejectionPct = numberValue(payload.rejectionPct, 0.03);

  const items = Array.isArray(payload.items) ? payload.items : [];
  const computedItems = items.map((item) => computeLineMetrics(item, density));
  const activeItems = computedItems.filter((item) => item.volume > 0 || item.areaWithQty > 0);

  const totalArea = activeItems.reduce((sum, item) => sum + item.areaWithQty, 0);
  const totalVolume = activeItems.reduce((sum, item) => sum + item.volume, 0);
  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
  const sheetCapacityVolume = sheetLength * sheetWidth * sheetThickness;
  const baseSheets = sheetCapacityVolume > 0 ? Math.ceil(totalVolume / sheetCapacityVolume) : 0;
  const addonPct = wastagePct + profitPct + designPct + holesPct + rejectionPct;
  const addonSheets = baseSheets * addonPct;
  const totalSheets = baseSheets + addonSheets;
  const utilizationPct = baseSheets > 0 && sheetCapacityVolume > 0
    ? (totalVolume / (baseSheets * sheetCapacityVolume)) * 100
    : 0;
  const totalSetCost = (totalSheets * sheetCostPerSheet) + packagingCost;

  return {
    items: activeItems,
    totals: {
      totalArea: round(totalArea, 2),
      totalVolume: round(totalVolume, 2),
      totalWeight: round(totalWeight, 4),
      totalLineItems: activeItems.length,
      sheetLength: round(sheetLength, 2),
      sheetWidth: round(sheetWidth, 2),
      sheetThickness: round(sheetThickness, 2),
      sheetCostPerSheet: round(sheetCostPerSheet, 2),
      packagingCost: round(packagingCost, 2),
      wastagePct: round(wastagePct, 4),
      profitPct: round(profitPct, 4),
      designPct: round(designPct, 4),
      holesPct: round(holesPct, 4),
      rejectionPct: round(rejectionPct, 4),
      baseSheets: round(baseSheets, 2),
      addonSheets: round(addonSheets, 2),
      totalSheets: round(totalSheets, 2),
      utilizationPct: round(utilizationPct, 2),
      totalSetCost: round(totalSetCost, 2),
    }
  };
};

module.exports = {
  FORMULA_LABELS,
  calculateCostingSummary,
};
