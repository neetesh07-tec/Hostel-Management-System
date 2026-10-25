const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listByBuilding, create, update } = require('../controllers/floorController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/building/:buildingId', listByBuilding);
router.post('/building/:buildingId', create);
router.put('/:id', update);

module.exports = router;
