const feeModel = require('../models/feeModel');
const studentModel = require('../models/studentModel');

const list = async (req, res) => {
  try {
    const result = await feeModel.getAllFees();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fees.' });
  }
};

const listByStudent = async (req, res) => {
  try {
    const result = await feeModel.getFeesByStudent(req.params.studentId);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fees.' });
  }
};

const create = async (req, res) => {
  const { student_id, description, amount_due, due_date } = req.body;
  if (!student_id || !description || !amount_due || !due_date) {
    return res.status(400).json({ error: 'student_id, description, amount_due, and due_date are required.' });
  }
  if (amount_due < 0) {
    return res.status(400).json({ error: 'Amount due cannot be negative.' });
  }
  try {
    const student = await studentModel.getStudentById(student_id);
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const result = await feeModel.createFee({
      student_id,
      description,
      amount_due,
      due_date,
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create fee.' });
  }
};

module.exports = { list, listByStudent, create };
