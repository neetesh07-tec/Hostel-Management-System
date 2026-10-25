const pool = require('../config/db');

// All rooms for a section, with occupancy computed from the room_occupancy view.
const getRoomsBySection = (sectionId) =>
  pool.query(
    `SELECT r.id, r.section_id, r.room_number, r.capacity, r.status,
            COALESCE(ro.occupied_beds, 0) AS occupied_beds,
            COALESCE(ro.available_beds, r.capacity) AS available_beds
       FROM rooms r
       LEFT JOIN room_occupancy ro ON ro.room_id = r.id
      WHERE r.section_id = $1
      ORDER BY r.room_number`,
    [sectionId]
  );

const getRoomById = (id) =>
  pool.query('SELECT * FROM rooms WHERE id = $1', [id]);

// All rooms across the hostel, with building/floor/section hierarchy and the
// list of currently-occupied students (confirmed/checked-in, stay active today)
// aggregated as a JSON array. Used by the room occupancy grid view.
const getAllRoomsWithOccupants = () =>
  pool.query(
    `SELECT r.id, r.room_number, r.capacity, r.status,
            sec.name AS section_name,
            fl.floor_number, fl.name AS floor_name,
            bld.name AS building_name,
            COALESCE(ro.occupied_beds, 0) AS occupied_beds,
            COALESCE(ro.available_beds, r.capacity) AS available_beds,
            COALESCE(occ.occupants_list, '[]'::json) AS occupants
       FROM rooms r
       JOIN sections sec ON sec.id = r.section_id
       JOIN floors fl ON fl.id = sec.floor_id
       JOIN buildings bld ON bld.id = fl.building_id
       LEFT JOIN room_occupancy ro ON ro.room_id = r.id
       LEFT JOIN (
         SELECT b.room_id,
                json_agg(json_build_object(
                  'booking_id', b.id,
                  'student_id', s.id,
                  'student_name', s.full_name,
                  'student_code', s.student_code,
                  'gender', s.gender,
                  'email', s.email,
                  'phone', s.phone,
                  'check_in_date', b.check_in_date,
                  'expected_check_out', b.expected_check_out,
                  'status', b.status,
                  'outstanding', COALESCE(fee.outstanding, 0)
                ) ORDER BY b.check_in_date) AS occupants_list
           FROM bookings b
           JOIN students s ON s.id = b.student_id
           LEFT JOIN (
             SELECT f.student_id,
                    SUM(f.amount_due - COALESCE(p.paid, 0)) AS outstanding
               FROM fees f
               LEFT JOIN (
                 SELECT fee_id, SUM(amount) AS paid
                   FROM payments GROUP BY fee_id
               ) p ON p.fee_id = f.id
              GROUP BY f.student_id
           ) fee ON fee.student_id = s.id
          WHERE b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= CURRENT_DATE
            AND (b.expected_check_out >= CURRENT_DATE)
            AND (b.actual_check_out IS NULL OR b.actual_check_out > CURRENT_DATE)
          GROUP BY b.room_id
       ) occ ON occ.room_id = r.id
      ORDER BY bld.name, fl.floor_number, sec.name, r.room_number`
  );

// Single room with hierarchy info and its current occupants as a JSON array.
// Used by the room detail modal.
const getRoomWithOccupants = (roomId) =>
  pool.query(
    `SELECT r.id, r.room_number, r.capacity, r.status,
            sec.name AS section_name,
            fl.floor_number, fl.name AS floor_name,
            bld.name AS building_name,
            COALESCE(ro.occupied_beds, 0) AS occupied_beds,
            COALESCE(ro.available_beds, r.capacity) AS available_beds,
            COALESCE(occ.occupants_list, '[]'::json) AS occupants
       FROM rooms r
       JOIN sections sec ON sec.id = r.section_id
       JOIN floors fl ON fl.id = sec.floor_id
       JOIN buildings bld ON bld.id = fl.building_id
       LEFT JOIN room_occupancy ro ON ro.room_id = r.id
       LEFT JOIN (
         SELECT b.room_id,
                json_agg(json_build_object(
                  'booking_id', b.id,
                  'student_id', s.id,
                  'student_name', s.full_name,
                  'student_code', s.student_code,
                  'gender', s.gender,
                  'email', s.email,
                  'phone', s.phone,
                  'check_in_date', b.check_in_date,
                  'expected_check_out', b.expected_check_out,
                  'status', b.status,
                  'outstanding', COALESCE(fee.outstanding, 0)
                ) ORDER BY b.check_in_date) AS occupants_list
           FROM bookings b
           JOIN students s ON s.id = b.student_id
           LEFT JOIN (
             SELECT f.student_id,
                    SUM(f.amount_due - COALESCE(p.paid, 0)) AS outstanding
               FROM fees f
               LEFT JOIN (
                 SELECT fee_id, SUM(amount) AS paid
                   FROM payments GROUP BY fee_id
               ) p ON p.fee_id = f.id
              GROUP BY f.student_id
           ) fee ON fee.student_id = s.id
          WHERE b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= CURRENT_DATE
            AND (b.expected_check_out >= CURRENT_DATE)
            AND (b.actual_check_out IS NULL OR b.actual_check_out > CURRENT_DATE)
          GROUP BY b.room_id
       ) occ ON occ.room_id = r.id
      WHERE r.id = $1`,
    [roomId]
  );

// Returns the peak number of overlapping confirmed/checked_in bookings
// for a room across all dates (used for capacity validation).
const getPeakOccupancy = async (roomId) => {
  const result = await pool.query(
    `WITH booking_ranges AS (
       SELECT check_in_date AS start_date,
              COALESCE(actual_check_out, expected_check_out) AS end_date
         FROM bookings
        WHERE room_id = $1
          AND status IN ('confirmed','checked_in')
          AND (actual_check_out IS NULL OR actual_check_out > CURRENT_DATE)
     ),
     daily_counts AS (
       SELECT d::date AS day, COUNT(*) AS concurrent
         FROM booking_ranges br
         JOIN generate_series(
                (SELECT MIN(start_date) FROM booking_ranges),
                (SELECT MAX(end_date) FROM booking_ranges),
                '1 day'
              ) AS d ON d::date BETWEEN br.start_date AND br.end_date
        GROUP BY d::date
     )
     SELECT COALESCE(MAX(concurrent), 0) AS peak
       FROM daily_counts`,
    [roomId]
  );
  return parseInt(result.rows[0].peak, 10);
};

const createRoom = (sectionId, roomNumber, capacity, status = 'operational') =>
  pool.query(
    `INSERT INTO rooms (section_id, room_number, capacity, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [sectionId, roomNumber, capacity, status]
  );

const updateRoom = (id, roomNumber, capacity, status) =>
  pool.query(
    `UPDATE rooms SET room_number = $1, capacity = $2, status = $3
     WHERE id = $4 RETURNING *`,
    [roomNumber, capacity, status, id]
  );

module.exports = {
  getRoomsBySection,
  getRoomById,
  getAllRoomsWithOccupants,
  getRoomWithOccupants,
  getPeakOccupancy,
  createRoom,
  updateRoom,
};
