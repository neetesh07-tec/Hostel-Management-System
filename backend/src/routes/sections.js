const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listByFloor, create, update } = require('../controllers/sectionController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/floor/:floorId', listByFloor);
router.post('/floor/:floorId', create);
router.put('/:id', update);

module.exports = router;
