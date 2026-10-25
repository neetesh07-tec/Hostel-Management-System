const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() AS server_time');
    res.json({
      status: 'ok',
      service: 'hostel-management-api',
      database: 'connected',
      serverTime: dbResult.rows[0].server_time,
    });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).json({
      status: 'error',
      service: 'hostel-management-api',
      database: 'disconnected',
      error: err.message,
    });
  }
});

module.exports = router;
