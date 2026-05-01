const express = require('express');
const router = express.Router();
const { getSalarySlips, saveSalarySlip, saveBulkSalarySlips, deleteSalarySlip, getEmpAttendanceStats } = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSalarySlips);
router.get('/attendance', getEmpAttendanceStats);
router.post('/bulk', saveBulkSalarySlips);
router.post('/', saveSalarySlip);
router.delete('/:id', deleteSalarySlip);

module.exports = router;
