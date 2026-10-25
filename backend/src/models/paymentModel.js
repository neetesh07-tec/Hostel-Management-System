const pool = require('../config/db');

// All payments with student name and fee description.
const getAllPayments = () =>
  pool.query(
    `SELECT p.id, p.fee_id, p.student_id, p.amount, p.payment_date, p.payment_method, p.created_at,
            s.full_name AS student_name, s.student_code,
            f.description AS fee_description
       FROM payments p
       JOIN students s ON s.id = p.student_id
       JOIN fees f ON f.id = p.fee_id
      ORDER BY p.payment_date DESC`
  );

const getPaymentsByStudent = (studentId) =>
  pool.query(
    `SELECT p.*, f.description AS fee_description
       FROM payments p
       JOIN fees f ON f.id = p.fee_id
      WHERE p.student_id = $1
      ORDER BY p.payment_date DESC`,
    [studentId]
  );

const getPaymentsByFee = (feeId) =>
  pool.query('SELECT * FROM payments WHERE fee_id = $1 ORDER BY payment_date DESC', [feeId]);

const createPayment = ({ fee_id, student_id, amount, payment_date, payment_method }) =>
  pool.query(
    `INSERT INTO payments (fee_id, student_id, amount, payment_date, payment_method)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
     RETURNING *`,
    [fee_id, student_id, amount, payment_date || null, payment_method || 'cash']
  );

module.exports = { getAllPayments, getPaymentsByStudent, getPaymentsByFee, createPayment };
