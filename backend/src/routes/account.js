const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { changeEmail, changePassword } = require('../controllers/accountController');

const router = express.Router();

router.use(requireAuth);

router.patch('/email', changeEmail);
router.patch('/password', changePassword);

module.exports = router;
