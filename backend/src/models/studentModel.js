const pool = require('../config/db');

// List all students with their linked user email/role, a count of bookings,
// and their currently-allocated room (building/floor/section/room_number) if
// they have an active confirmed/checked-in stay.
const getAllStudents = () =>
  pool.query(
    `SELECT s.id, s.full_name, s.student_code, s.email, s.phone, s.gender,
            s.account_status, s.created_at,
            u.email AS user_email, u.status AS user_status,
            (SELECT COUNT(*) FROM bookings b WHERE b.student_id = s.id) AS booking_count,
            cur.room_number AS current_room,
            cur.building_name AS current_building,
            cur.floor_number AS current_floor,
            cur.section_name AS current_section
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN LATERAL (
         SELECT r.room_number, bld.name AS building_name,
                fl.floor_number, sec.name AS section_name
           FROM bookings b
           JOIN rooms r ON r.id = b.room_id
           JOIN sections sec ON sec.id = r.section_id
           JOIN floors fl ON fl.id = sec.floor_id
           JOIN buildings bld ON bld.id = fl.building_id
          WHERE b.student_id = s.id
            AND b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= CURRENT_DATE
            AND (b.expected_check_out >= CURRENT_DATE)
            AND (b.actual_check_out IS NULL OR b.actual_check_out > CURRENT_DATE)
          ORDER BY b.check_in_date DESC
          LIMIT 1
       ) cur ON true
      ORDER BY s.full_name`
  );

const getStudentById = (id) =>
  pool.query(
    `SELECT s.*, u.email AS user_email, u.status AS user_status
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
      WHERE s.id = $1`,
    [id]
  );

const getStudentByCode = (code) =>
  pool.query('SELECT * FROM students WHERE student_code = $1', [code]);

const getStudentByEmail = (email) =>
  pool.query('SELECT * FROM students WHERE email = $1', [email]);

// Create the linked user account first, then the student record.
// Returns the new student row.
const createStudentWithUser = async (studentData, passwordHash) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'student', $3)
       RETURNING id`,
      [studentData.email, passwordHash, studentData.account_status || 'active']
    );
    const userId = userResult.rows[0].id;

    const studentResult = await client.query(
      `INSERT INTO students (user_id, full_name, student_code, email, phone, gender, account_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        studentData.full_name,
        studentData.student_code,
        studentData.email,
        studentData.phone || null,
        studentData.gender || null,
        studentData.account_status || 'active',
      ]
    );

    await client.query('COMMIT');
    return studentResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Update student profile fields. Does NOT change the linked user's email/password here
// (those are handled by dedicated account settings endpoints).
const updateStudent = (id, { full_name, student_code, email, phone, gender }) =>
  pool.query(
    `UPDATE students
        SET full_name = $1, student_code = $2, email = $3, phone = $4, gender = $5
      WHERE id = $6
      RETURNING *`,
    [full_name, student_code, email, phone || null, gender || null, id]
  );

// Deactivate a student: set account_status to inactive and also deactivate the
// linked user so they can no longer log in. Booking/payment history is preserved.
const deactivateStudent = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentResult = await client.query(
      `UPDATE students
          SET account_status = 'inactive'
        WHERE id = $1
        RETURNING user_id`,
      [id]
    );

    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const userId = studentResult.rows[0].user_id;
    if (userId) {
      await client.query(
        `UPDATE users SET status = 'inactive' WHERE id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');
    return { id, account_status: 'inactive' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByCode,
  getStudentByEmail,
  createStudentWithUser,
  updateStudent,
  deactivateStudent,
};
