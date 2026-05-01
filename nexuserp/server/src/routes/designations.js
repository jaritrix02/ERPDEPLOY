const express = require('express');
const router = express.Router();
const c = require('../controllers/designationsController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', c.getDesignations);
router.post('/', checkPermission('hr_designations', 'write'), c.createDesignation);
router.put('/:id', checkPermission('hr_designations', 'write'), c.updateDesignation);
router.delete('/:id', checkPermission('hr_designations', 'write'), c.deleteDesignation);

module.exports = router;
