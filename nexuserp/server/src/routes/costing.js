const express = require('express');
const router = express.Router();
const c = require('../controllers/costingController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', checkPermission('costing_analysis', 'read'), c.getCostingJobs);
router.post('/', checkPermission('costing_analysis', 'write'), c.createCostingJob);
router.put('/:id', checkPermission('costing_analysis', 'write'), c.updateCostingJob);
router.delete('/:id', checkPermission('costing_analysis', 'execute'), c.deleteCostingJob);

module.exports = router;
