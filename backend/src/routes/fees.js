const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { list, listByStudent, create } = require('../controllers/feeController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/', list);
router.get('/student/:studentId', listByStudent);
router.post('/', create);

module.exports = router;
