const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { list, getOne, create, update, deactivate } = require('../controllers/studentController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/deactivate', deactivate);

module.exports = router;
