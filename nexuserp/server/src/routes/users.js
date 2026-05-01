const express = require('express');
const router = express.Router();
const c = require('../controllers/usersController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', c.getUsers);
router.post('/', adminOnly, c.createUser);
router.put('/:id', adminOnly, c.updateUser);
router.delete('/:id', adminOnly, c.deleteUser);

module.exports = router;
