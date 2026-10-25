const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    const queries = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM students WHERE account_status = 'active'"),
      pool.query('SELECT COUNT(*) AS count FROM buildings'),
      pool.query('SELECT COUNT(*) AS count FROM floors'),
      pool.query('SELECT COUNT(*) AS count FROM rooms'),
      pool.query('SELECT COALESCE(SUM(capacity), 0) AS total FROM rooms'),
      pool.query(
        `SELECT COUNT(*) AS count FROM bookings
          WHERE status IN ('confirmed', 'checked_in')
            AND check_in_date <= CURRENT_DATE
            AND (expected_check_out >= CURRENT_DATE)
            AND (actual_check_out IS NULL OR actual_check_out > CURRENT_DATE)`
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM bookings
          WHERE status = 'confirmed'
            AND check_in_date > CURRENT_DATE`
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM bookings
          WHERE status IN ('confirmed', 'checked_in')
            AND expected_check_out >= CURRENT_DATE
            AND expected_check_out <= CURRENT_DATE + INTERVAL '7 days'
            AND (actual_check_out IS NULL OR actual_check_out > CURRENT_DATE)`
      ),
      pool.query(
        `SELECT COALESCE(SUM(f.amount_due - COALESCE(p.paid, 0)), 0) AS outstanding
           FROM fees f
           LEFT JOIN (SELECT fee_id, SUM(amount) AS paid FROM payments GROUP BY fee_id) p ON p.fee_id = f.id
          WHERE f.amount_due - COALESCE(p.paid, 0) > 0`
      ),
    ]);

    const totalCapacity = parseFloat(queries[4].rows[0].total);
    const occupiedBeds = parseInt(queries[5].rows[0].count, 10);

    res.json({
      active_students: parseInt(queries[0].rows[0].count, 10),
      total_buildings: parseInt(queries[1].rows[0].count, 10),
      total_floors: parseInt(queries[2].rows[0].count, 10),
      total_rooms: parseInt(queries[3].rows[0].count, 10),
      total_bed_capacity: totalCapacity,
      occupied_beds: occupiedBeds,
      available_beds: totalCapacity - occupiedBeds,
      upcoming_bookings: parseInt(queries[6].rows[0].count, 10),
      expected_checkouts: parseInt(queries[7].rows[0].count, 10),
      outstanding_fees: parseFloat(queries[8].rows[0].outstanding),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
};

module.exports = { getStats };
