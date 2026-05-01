const express = require('express');
const router = express.Router();
const c = require('../controllers/employeesController');
const { protect, adminOnly, checkPermission } = require('../middleware/auth');

const upload = require('../middleware/upload');

router.use(protect);

router.get('/', c.getEmployees);
router.post('/bulk', c.importEmployees);
router.post('/wipe', adminOnly, c.wipeAllData);
router.post('/', c.createEmployee);
router.put('/:id', c.updateEmployee);
router.delete('/:id', checkPermission('hr_employees', 'write'), c.deleteEmployee);

// Documents
router.get('/:id/documents', c.getEmployeeDocuments);
router.post('/documents', upload.single('file'), c.uploadDocument);
router.delete('/documents/:id', c.deleteDocument);

// Generic Upload (returns path)
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, path: `/uploads/${req.file.filename}` });
});

module.exports = router;
