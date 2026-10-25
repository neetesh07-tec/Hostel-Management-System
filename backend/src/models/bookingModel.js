const pool = require('../config/db');

// All bookings with student name, room number, and building name joined in.
const getAllBookings = () =>
  pool.query(
    `SELECT b.id, b.student_id, b.room_id, b.status, b.check_in_date,
            b.expected_check_out, b.actual_check_in, b.actual_check_out, b.created_at,
            s.full_name AS student_name, s.student_code,
            r.room_number, r.capacity,
            fl.floor_number, sec.name AS section_name, bld.name AS building_name
       FROM bookings b
       JOIN students s ON s.id = b.student_id
       JOIN rooms r ON r.id = b.room_id
       JOIN sections sec ON sec.id = r.section_id
       JOIN floors fl ON fl.id = sec.floor_id
       JOIN buildings bld ON bld.id = fl.building_id
      ORDER BY b.check_in_date DESC`
  );

const getBookingById = (id) =>
  pool.query(
    `SELECT b.*, s.full_name AS student_name, s.student_code, s.email AS student_email,
            r.room_number, r.capacity
       FROM bookings b
       JOIN students s ON s.id = b.student_id
       JOIN rooms r ON r.id = b.room_id
      WHERE b.id = $1`,
    [id]
  );

// Count overlapping confirmed/checked_in bookings for a room in a date range.
// Used to enforce capacity on create/confirm.
const countOverlapping = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  const params = [roomId, checkIn, checkOut];
  let excludeSql = '';
  if (excludeBookingId) {
    params.push(excludeBookingId);
    excludeSql = 'AND id != $4';
  }
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt
       FROM bookings
      WHERE room_id = $1
        AND status IN ('confirmed', 'checked_in')
        AND check_in_date < $3
        AND expected_check_out > $2
        ${excludeSql}`,
    params
  );
  return parseInt(result.rows[0].cnt, 10);
};

const createBooking = ({ student_id, room_id, check_in_date, expected_check_out, status }) =>
  pool.query(
    `INSERT INTO bookings (student_id, room_id, status, check_in_date, expected_check_out)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [student_id, room_id, status || 'pending', check_in_date, expected_check_out]
  );

const updateBooking = (id, { room_id, check_in_date, expected_check_out }) =>
  pool.query(
    `UPDATE bookings
        SET room_id = $1, check_in_date = $2, expected_check_out = $3
      WHERE id = $4
      RETURNING *`,
    [room_id, check_in_date, expected_check_out, id]
  );

const updateStatus = (id, status) =>
  pool.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [status, id]);

const checkIn = (id) =>
  pool.query(
    `UPDATE bookings
        SET status = 'checked_in', actual_check_in = CURRENT_DATE
      WHERE id = $1
      RETURNING *`,
    [id]
  );

const checkOut = (id) =>
  pool.query(
    `UPDATE bookings
        SET status = 'completed', actual_check_out = CURRENT_DATE
      WHERE id = $1
      RETURNING *`,
    [id]
  );

module.exports = {
  getAllBookings,
  getBookingById,
  countOverlapping,
  createBooking,
  updateBooking,
  updateStatus,
  checkIn,
  checkOut,
};
