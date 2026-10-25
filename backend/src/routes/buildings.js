const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { list, create, update } = require('../controllers/buildingController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/', list);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
