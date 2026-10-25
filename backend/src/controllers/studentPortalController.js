const pool = require('../config/db');

// A student can only view their own data. We look up their student record
// via the session's userId, so they can never access another student's data.
const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.email AS user_email
         FROM students s
         JOIN users u ON u.id = s.user_id
        WHERE s.user_id = $1`,
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

const getMyBooking = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, r.room_number, r.capacity,
              sec.name AS section_name, fl.floor_number, bld.name AS building_name
         FROM bookings b
         JOIN students s ON s.id = b.student_id
         JOIN rooms r ON r.id = b.room_id
         JOIN sections sec ON sec.id = r.section_id
         JOIN floors fl ON fl.id = sec.floor_id
         JOIN buildings bld ON bld.id = fl.building_id
        WHERE s.user_id = $1
        ORDER BY b.check_in_date DESC
        LIMIT 1`,
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
};

const getMyFees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.description, f.amount_due, f.due_date, f.created_at,
              COALESCE(p.paid, 0) AS amount_paid,
              f.amount_due - COALESCE(p.paid, 0) AS outstanding
         FROM fees f
         JOIN students s ON s.id = f.student_id
         LEFT JOIN (SELECT fee_id, SUM(amount) AS paid FROM payments GROUP BY fee_id) p ON p.fee_id = f.id
        WHERE s.user_id = $1
        ORDER BY f.due_date ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fees.' });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, f.description AS fee_description
         FROM payments p
         JOIN fees f ON f.id = p.fee_id
         JOIN students s ON s.id = p.student_id
        WHERE s.user_id = $1
        ORDER BY p.payment_date DESC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
};

module.exports = { getMyProfile, getMyBooking, getMyFees, getMyPayments };
