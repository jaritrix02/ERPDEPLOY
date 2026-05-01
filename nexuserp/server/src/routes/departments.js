const express = require('express');
const router = express.Router();
const c = require('../controllers/departmentsController');
const { protect, adminOnly, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', c.getDepartments);
router.post('/bulk', checkPermission('hr_departments', 'write'), c.importDepartments);
router.post('/', checkPermission('hr_departments', 'write'), c.createDepartment);
router.put('/:id', checkPermission('hr_departments', 'write'), c.updateDepartment);
router.delete('/:id', checkPermission('hr_departments', 'write'), c.deleteDepartment);

module.exports = router;
