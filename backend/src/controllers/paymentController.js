const paymentModel = require('../models/paymentModel');
const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const result = await paymentModel.getAllPayments();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
};

const listByStudent = async (req, res) => {
  try {
    const result = await paymentModel.getPaymentsByStudent(req.params.studentId);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
};

const create = async (req, res) => {
  const { fee_id, student_id, amount, payment_date, payment_method } = req.body;
  if (!fee_id || !student_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'fee_id, student_id, and a positive amount are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify fee exists and belongs to the student.
    const feeResult = await client.query('SELECT * FROM fees WHERE id = $1 AND student_id = $2', [fee_id, student_id]);
    if (feeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Fee not found for this student.' });
    }

    // Calculate total paid so far for this fee.
    const paidResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE fee_id = $1',
      [fee_id]
    );
    const totalPaid = parseFloat(paidResult.rows[0].total);
    const amountDue = parseFloat(feeResult.rows[0].amount_due);

    if (totalPaid + parseFloat(amount) > amountDue + 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Payment would exceed the amount due. Outstanding: ${(amountDue - totalPaid).toFixed(2)}.`,
      });
    }

    const result = await paymentModel.createPayment({
      fee_id,
      student_id,
      amount,
      payment_date,
      payment_method,
    });

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment.' });
  } finally {
    client.release();
  }
};

module.exports = { list, listByStudent, create };
