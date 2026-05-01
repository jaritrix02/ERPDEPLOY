const express = require('express');
const router = express.Router();
const c = require('../controllers/leaveController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

// Leave Types (Admin/HR only)
router.get('/types', c.getLeaveTypes);
router.post('/types', checkPermission('hr_employees', 'write'), c.createLeaveType);
router.put('/types/:id', checkPermission('hr_employees', 'write'), c.updateLeaveType);
router.delete('/types/:id', checkPermission('hr_employees', 'write'), c.deleteLeaveType);

// Leave Balances
router.get('/balance', c.getLeaveBalances);
router.post('/balance/update', c.updateLeaveBalance);

// Leave Requests
router.get('/requests', c.getLeaveRequests);
router.post('/requests', c.createLeaveRequest);
router.put('/requests/:id', c.updateLeaveRequest);
router.delete('/requests/:id', c.deleteLeaveRequest);
router.post('/requests/:id/approve', c.approveLeaveRequest);
router.post('/requests/:id/reject', c.rejectLeaveRequest);

module.exports = router;