const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/stats', getStats);

module.exports = router;
