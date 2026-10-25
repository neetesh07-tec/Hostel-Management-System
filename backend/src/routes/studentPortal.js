const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getMyProfile, getMyBooking, getMyFees, getMyPayments,
} = require('../controllers/studentPortalController');

const router = express.Router();

router.use(requireAuth, requireRole(['student']));

router.get('/profile', getMyProfile);
router.get('/booking', getMyBooking);
router.get('/fees', getMyFees);
router.get('/payments', getMyPayments);

module.exports = router;
