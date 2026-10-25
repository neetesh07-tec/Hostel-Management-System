const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  list, getOne, create, update, confirm, cancel, checkIn, checkOut,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/confirm', confirm);
router.patch('/:id/cancel', cancel);
router.patch('/:id/check-in', checkIn);
router.patch('/:id/check-out', checkOut);

module.exports = router;
