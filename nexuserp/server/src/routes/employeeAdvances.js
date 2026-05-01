const express = require('express');
const router = express.Router();
const { getAdvances, createAdvance, deleteAdvance, importAdvances, updateAdvance } = require('../controllers/advanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getAdvances);
router.post('/bulk', importAdvances);
router.post('/', createAdvance);
router.put('/:id', updateAdvance);
router.delete('/:id', adminOnly, deleteAdvance);

module.exports = router;
