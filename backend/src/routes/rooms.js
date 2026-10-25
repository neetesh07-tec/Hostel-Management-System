const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listAll, getOne, listBySection, create, update } = require('../controllers/roomController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/', listAll);
router.get('/:id', getOne);
router.get('/section/:sectionId', listBySection);
router.post('/section/:sectionId', create);
router.put('/:id', update);

module.exports = router;
