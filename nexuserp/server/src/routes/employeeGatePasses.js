const express = require('express');
const router = express.Router();
const { getGatePasses, createGatePass, updateGatePass, deleteGatePass, importGatePasses } = require('../controllers/employeeGatePassController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getGatePasses);
router.post('/bulk', importGatePasses);
router.post('/', createGatePass);
router.put('/:id', updateGatePass);
router.delete('/:id', adminOnly, deleteGatePass);

module.exports = router;
