const pool = require('../config/db');

// All fees with student name and computed outstanding balance.
const getAllFees = () =>
  pool.query(
    `SELECT f.id, f.student_id, f.description, f.amount_due, f.due_date, f.created_at,
            s.full_name AS student_name, s.student_code,
            COALESCE(p.paid, 0) AS amount_paid,
            f.amount_due - COALESCE(p.paid, 0) AS outstanding
       FROM fees f
       JOIN students s ON s.id = f.student_id
       LEFT JOIN (
         SELECT fee_id, SUM(amount) AS paid FROM payments GROUP BY fee_id
       ) p ON p.fee_id = f.id
      ORDER BY f.due_date ASC`
  );

const getFeesByStudent = (studentId) =>
  pool.query(
    `SELECT f.id, f.description, f.amount_due, f.due_date, f.created_at,
            COALESCE(p.paid, 0) AS amount_paid,
            f.amount_due - COALESCE(p.paid, 0) AS outstanding
       FROM fees f
       LEFT JOIN (
         SELECT fee_id, SUM(amount) AS paid FROM payments GROUP BY fee_id
       ) p ON p.fee_id = f.id
      WHERE f.student_id = $1
      ORDER BY f.due_date ASC`,
    [studentId]
  );

const createFee = ({ student_id, description, amount_due, due_date }) =>
  pool.query(
    `INSERT INTO fees (student_id, description, amount_due, due_date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [student_id, description, amount_due, due_date]
  );

module.exports = { getAllFees, getFeesByStudent, createFee };
