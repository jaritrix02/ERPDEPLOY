const express = require('express');
const router = express.Router();
const c = require('../controllers/itemsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', c.getItems);
router.post('/', c.createItem);
router.put('/:id', c.updateItem);
router.delete('/:id', adminOnly, c.deleteItem);

module.exports = router;
