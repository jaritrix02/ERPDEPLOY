export const MATERIAL_PRESETS = [
  { name: 'NITRILE', density: 1.5 },
  { name: 'FVMQ', density: 1.65 },
  { name: 'FKM', density: 2.0 },
  { name: 'VITON', density: 2.0 },
  { name: 'SILICONE', density: 1.5 },
  { name: 'EPDM', density: 0.8 },
  { name: 'NBR/NEOPRENE', density: 1.25 },
  { name: 'CORK', density: 0.95 },
  { name: 'AIRCELL', density: 0.08 },
]

export const FORMULA_OPTIONS = [
  { value: 'A_OD_ID', label: 'A (OD x ID)', hint: 'Flat washer / ring = pi/4 x (OD2 - ID2)' },
  { value: 'B_OD_OD', label: 'B (OD x OD)', hint: 'Square pad = OD x OD' },
  { value: 'C_OIL_GAUGE', label: 'C (Oil Gauge)', hint: 'Rectangle = L x W' },
  { value: 'D_FRAME', label: 'D (Frame)', hint: 'Frame = (L + W) x 2 x built' },
  { value: 'E_CORD', label: 'Cord', hint: 'Tube/cord = cross section x length' },
  { value: 'F_ORING', label: 'O-Ring', hint: 'O-ring = section area x outer-dia circumference' },
  { value: 'G_MANUAL', label: 'Manual', hint: 'Manual area x thickness' },
]

export const DEPARTMENT_CONFIG = {
  RUBBER: {
    label: 'Rubber Department',
    defaultMaterial: 'NITRILE',
    materials: ['NITRILE', 'FVMQ', 'FKM', 'VITON', 'SILICONE', 'EPDM', 'NBR/NEOPRENE'],
    formulas: ['A_OD_ID', 'B_OD_OD', 'C_OIL_GAUGE', 'D_FRAME', 'E_CORD', 'F_ORING', 'G_MANUAL'],
    description: 'Rubber gasket, cord, O-ring, frame, and washer weight calculations',
  },
  CORK: {
    label: 'Cork Department',
    defaultMaterial: 'CORK',
    materials: ['CORK'],
    formulas: ['A_OD_ID', 'B_OD_OD', 'C_OIL_GAUGE', 'D_FRAME', 'G_MANUAL'],
    description: 'Cork sheet and gasket weight plus set costing',
  },
  AIRCELL: {
    label: 'Aircell Department',
    defaultMaterial: 'AIRCELL',
    materials: ['AIRCELL'],
    formulas: ['C_OIL_GAUGE', 'D_FRAME', 'G_MANUAL'],
    description: 'Aircell panel, conservator frame, and area-based sheet calculations',
  },
}

const PI = 3.14

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const round = (value, digits = 4) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

export const blankLine = () => ({
  formulaType: 'A_OD_ID',
  description: '',
  dim1: '',
  dim2: '',
  dim3: '',
  thickness: '',
  length: '',
  qty: 1,
})

export const blankCostingJob = () => ({
  drawingNo: '',
  departmentType: 'RUBBER',
  projectName: '',
  purchaseOrderId: '',
  purchaseOrderNo: '',
  sourceItemId: '',
  sourceItemCode: '',
  sourceItemName: '',
  materialName: 'NITRILE',
  density: 1.5,
  sheetLength: 900,
  sheetWidth: 600,
  sheetThickness: 8,
  sheetCostPerSheet: 0,
  packagingCost: 0,
  wastagePct: 0.25,
  profitPct: 0.10,
  designPct: 0.10,
  holesPct: 0.05,
  rejectionPct: 0.03,
  notes: '',
  items: [blankLine()],
})

export const toEditorState = (job) => ({
  drawingNo: job.drawingNo || '',
  departmentType: job.departmentType || 'RUBBER',
  projectName: job.projectName || '',
  purchaseOrderId: job.purchaseOrderId || '',
  purchaseOrderNo: job.purchaseOrderNo || '',
  sourceItemId: job.sourceItemId || '',
  sourceItemCode: job.sourceItemCode || '',
  sourceItemName: job.sourceItemName || '',
  materialName: job.materialName || 'NITRILE',
  density: job.density ?? 1.5,
  sheetLength: job.sheetLength ?? 900,
  sheetWidth: job.sheetWidth ?? 600,
  sheetThickness: job.sheetThickness ?? 8,
  sheetCostPerSheet: job.sheetCostPerSheet ?? 0,
  packagingCost: job.packagingCost ?? 0,
  wastagePct: job.wastagePct ?? 0.25,
  profitPct: job.profitPct ?? 0.10,
  designPct: job.designPct ?? 0.10,
  holesPct: job.holesPct ?? 0.05,
  rejectionPct: job.rejectionPct ?? 0.03,
  notes: job.notes || '',
  items: Array.isArray(job.items) && job.items.length
    ? job.items.map((item) => ({
        formulaType: item.formulaType || 'A_OD_ID',
        description: item.description || '',
        dim1: item.dim1 ?? '',
        dim2: item.dim2 ?? '',
        dim3: item.dim3 ?? '',
        thickness: item.thickness ?? '',
        length: item.length ?? '',
        qty: item.qty ?? 1,
      }))
    : [blankLine()],
})

export const getPresetDensity = (materialName) => {
  const material = MATERIAL_PRESETS.find((entry) => entry.name === materialName)
  return material?.density ?? null
}

export const getDepartmentConfig = (departmentType = 'RUBBER') =>
  DEPARTMENT_CONFIG[String(departmentType || 'RUBBER').toUpperCase()] || DEPARTMENT_CONFIG.RUBBER

export const computeLineMetrics = (line = {}, density = 0) => {
  const formulaType = String(line.formulaType || 'A_OD_ID').toUpperCase()
  const dim1 = numberValue(line.dim1)
  const dim2 = numberValue(line.dim2)
  const dim3 = numberValue(line.dim3)
  const thickness = numberValue(line.thickness)
  const length = numberValue(line.length)
  const qty = Math.max(numberValue(line.qty, 1), 0)

  let area = 0
  let areaWithQty = 0
  let volume = 0

  switch (formulaType) {
    case 'A_OD_ID':
      area = (PI / 4) * ((dim1 ** 2) - (dim2 ** 2))
      area = Math.max(area, 0)
      areaWithQty = area * qty
      volume = areaWithQty * thickness
      break
    case 'B_OD_OD':
      area = dim1 * dim1
      areaWithQty = area * qty
      volume = areaWithQty * thickness
      break
    case 'C_OIL_GAUGE':
      area = dim1 * dim2
      areaWithQty = area * qty
      volume = areaWithQty * thickness
      break
    case 'D_FRAME':
      area = 2 * (dim1 + dim2) * dim3
      areaWithQty = area * qty
      volume = areaWithQty * thickness
      break
    case 'E_CORD':
      area = (PI / 4) * ((dim1 ** 2) - (dim2 ** 2))
      area = Math.max(area, 0)
      areaWithQty = area * qty
      volume = areaWithQty * length
      break
    case 'F_ORING': {
      const crossSectionArea = (PI / 4) * (dim2 ** 2)
      area = crossSectionArea
      areaWithQty = area * qty
      volume = crossSectionArea * (PI * dim1) * qty
      break
    }
    case 'G_MANUAL':
      area = dim1
      areaWithQty = area * qty
      volume = areaWithQty * thickness
      break
    default:
      area = 0
      areaWithQty = 0
      volume = 0
  }

  const weight = volume * numberValue(density) / 1000000

  return {
    ...line,
    formulaType,
    area: round(area),
    areaWithQty: round(areaWithQty),
    volume: round(volume),
    weight: round(weight, 6),
  }
}

export const calculateCostingSummary = (job) => {
  const density = numberValue(job.density)
  const computedItems = (job.items || []).map((item) => computeLineMetrics(item, density))
  const activeItems = computedItems.filter((item) => item.volume > 0 || item.areaWithQty > 0)

  const totalArea = activeItems.reduce((sum, item) => sum + item.areaWithQty, 0)
  const totalVolume = activeItems.reduce((sum, item) => sum + item.volume, 0)
  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0)
  const sheetLength = numberValue(job.sheetLength, 900)
  const sheetWidth = numberValue(job.sheetWidth, 600)
  const sheetThickness = numberValue(job.sheetThickness, 8)
  const sheetCostPerSheet = numberValue(job.sheetCostPerSheet)
  const packagingCost = numberValue(job.packagingCost)
  const wastagePct = numberValue(job.wastagePct, 0.25)
  const profitPct = numberValue(job.profitPct, 0.10)
  const designPct = numberValue(job.designPct, 0.10)
  const holesPct = numberValue(job.holesPct, 0.05)
  const rejectionPct = numberValue(job.rejectionPct, 0.03)

  const capacityVolume = sheetLength * sheetWidth * sheetThickness
  const baseSheets = capacityVolume > 0 ? Math.ceil(totalVolume / capacityVolume) : 0
  const addonSheets = baseSheets * (wastagePct + profitPct + designPct + holesPct + rejectionPct)
  const totalSheets = baseSheets + addonSheets
  const utilizationPct = baseSheets > 0 && capacityVolume > 0
    ? (totalVolume / (baseSheets * capacityVolume)) * 100
    : 0
  const totalSetCost = (totalSheets * sheetCostPerSheet) + packagingCost

  return {
    items: activeItems,
    totals: {
      totalArea: round(totalArea, 2),
      totalVolume: round(totalVolume, 2),
      totalWeight: round(totalWeight, 4),
      totalLineItems: activeItems.length,
      baseSheets: round(baseSheets, 2),
      addonSheets: round(addonSheets, 2),
      totalSheets: round(totalSheets, 2),
      utilizationPct: round(utilizationPct, 2),
      totalSetCost: round(totalSetCost, 2),
    },
  }
}
