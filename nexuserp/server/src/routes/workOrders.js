const express = require('express');
const router = express.Router();
const controller = require('../controllers/manufacturingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', controller.getWorkOrders);
router.post('/', controller.createWorkOrder);
router.get('/issue', controller.getMaterialIssues);
router.post('/issue', controller.issueMaterial);
router.get('/qc/:woId', controller.getWorkOrderQC);
router.post('/qc', controller.recordWorkOrderQC);
router.post('/production', controller.recordProduction);
router.post('/daily-output', controller.recordDailyOutput);
router.put('/process-status', controller.updateProcessStatus);
router.post('/generate-indent', controller.generateIndent);
router.post('/convert', controller.convertSFGtoFG);

module.exports = router;
