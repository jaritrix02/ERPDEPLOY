const express = require('express');
const router = express.Router();
const c = require('../controllers/salesOrdersController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', checkPermission('sales_orders', 'read'), c.getSalesOrders);
router.post('/', checkPermission('sales_orders', 'write'), c.createSalesOrder);
router.put('/:id', checkPermission('sales_orders', 'write'), c.updateSalesOrder);
router.delete('/:id', checkPermission('sales_orders', 'execute'), c.deleteSalesOrder);

module.exports = router;
