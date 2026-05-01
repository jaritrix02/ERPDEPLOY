const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { prisma } = require('../db');
const { getSalesDashboard } = require('../controllers/salesOrdersController');
const { getCostingDashboard } = require('../controllers/costingController');
router.use(protect);
router.get('/', async (req,res) => {
  try {
    const [totalEmployees, pendingIndents, pendingPOs, totalProducts, activeWorkOrders, criticalQCFailures, recentIndents] = await Promise.all([
      prisma.employee.count({where:{isActive:true}}),
      prisma.indent.count({where:{status:'PENDING'}}),
      prisma.purchaseOrder.count({where:{status:'PENDING'}}),
      prisma.product.count(),
      prisma.workOrder.count({where:{status:'APPROVED'}}),
      prisma.qCReport.count({where:{passOrFail:false, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }}}),
      prisma.indent.findMany({take:5,orderBy:{createdAt:'desc'},include:{requestedBy:{select:{name:true}}}})
    ]);
    res.json({success:true,data:{totalEmployees,pendingIndents,pendingPOs,totalProducts,activeWorkOrders,criticalQCFailures,recentIndents}});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
});

router.get('/purchase', async (req, res) => {
  try {
    const currentYear = parseInt(req.query.year || new Date().getFullYear());
    const previousYear = currentYear - 1;

    // Fetch all POs for current and previous year
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: new Date(previousYear, 0, 1), lte: new Date(currentYear, 11, 31, 23, 59, 59) },
        status: { notIn: ['REJECTED'] }
      },
      include: {
        vendor: true,
        items: {
          include: { item: true }
        }
      }
    });

    let currentYearTotal = 0;
    let previousYearTotal = 0;
    
    // Grouping for charts
    const byQuarter = { CY: [0,0,0,0], PY: [0,0,0,0] };
    const byTrend = new Array(12).fill(0); // For CY months
    
    const bySupplierMap = {};
    const byMaterialGroupMap = {};
    const byPlantMap = {}; // We'll mock/distribute based on departments or random for demo since we don't have explicit Plant on PO
    
    pos.forEach(po => {
       const date = new Date(po.createdAt);
       const year = date.getFullYear();
       const month = date.getMonth();
       const quarter = Math.floor(month / 3);
       const amount = po.totalAmount || 0;

       if (year === currentYear) {
           currentYearTotal += amount;
           byQuarter.CY[quarter] += amount;
           byTrend[month] += amount;

           // Supplier aggregations
           const vendorName = po.vendor?.companyName || 'Unknown Supplier';
           bySupplierMap[vendorName] = (bySupplierMap[vendorName] || 0) + amount;

           // Material Group aggregations (using itemType or item name as proxy)
           po.items.forEach(pi => {
               const group = pi.item?.itemType || 'General';
               byMaterialGroupMap[group] = (byMaterialGroupMap[group] || 0) + (pi.amount || 0);
           });
       } else if (year === previousYear) {
           previousYearTotal += amount;
           byQuarter.PY[quarter] += amount;
       }
    });

    const variance = previousYearTotal ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100 : 100;

    // Helper to format top 5
    const getTop5 = (map) => Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name, value]) => ({ name, value }));

    const topSuppliers = getTop5(bySupplierMap);
    const topMaterialGroups = getTop5(byMaterialGroupMap);

    res.json({
       success: true, 
       data: {
         overview: {
           currentYearTotal: currentYearTotal / 1000000, // Format as Millions
           previousYearTotal: previousYearTotal / 1000000,
           variance: variance
         },
         charts: {
           byQuarter: [
             { name: '1', CY: byQuarter.CY[0]/1000000, PY: byQuarter.PY[0]/1000000 },
             { name: '2', CY: byQuarter.CY[1]/1000000, PY: byQuarter.PY[1]/1000000 },
             { name: '3', CY: byQuarter.CY[2]/1000000, PY: byQuarter.PY[2]/1000000 },
             { name: '4', CY: byQuarter.CY[3]/1000000, PY: byQuarter.PY[3]/1000000 },
           ],
           byTrend: byTrend.map((v, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], value: v/1000000 })),
           topSuppliers: topSuppliers.map(s => ({ name: s.name, value: s.value/1000000 })),
           topMaterialGroups: topMaterialGroups.map(s => ({ name: s.name, value: s.value/1000000 }))
         }
       }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales', checkPermission('sales_orders', 'read'), getSalesDashboard);
router.get('/costing', checkPermission('costing_analysis', 'read'), getCostingDashboard);

module.exports = router;
