const express = require('express');
const router = express.Router();
const c = require('../controllers/employeeCategoriesController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', c.getCategories);
router.post('/', checkPermission('hr_categories', 'write'), c.createCategory);
router.put('/:id', checkPermission('hr_categories', 'write'), c.updateCategory);
router.delete('/:id', checkPermission('hr_categories', 'write'), c.deleteCategory);

module.exports = router;
