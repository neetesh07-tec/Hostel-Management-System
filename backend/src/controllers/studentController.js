const bcrypt = require('bcryptjs');
const studentModel = require('../models/studentModel');

const VALID_GENDERS = ['male', 'female', 'other'];

const list = async (req, res) => {
  try {
    const result = await studentModel.getAllStudents();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

const getOne = async (req, res) => {
  try {
    const result = await studentModel.getStudentById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student.' });
  }
};

const create = async (req, res) => {
  const {
    full_name,
    student_code,
    email,
    phone,
    gender,
    password,
    account_status,
  } = req.body;

  // --- Validation ---
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (gender && !VALID_GENDERS.includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value.' });
  }

  // Student code: if not provided, auto-generate one based on the next sequence.
  let finalCode = student_code;
  if (!finalCode) {
    try {
      const seq = await require('../config/db').query(
        "SELECT COALESCE(MAX(SUBSTRING(student_code FROM '\\d+')::int), 0) + 1 AS next_num FROM students"
      );
      const nextNum = parseInt(seq.rows[0].next_num, 10);
      finalCode = 'STU' + String(nextNum).padStart(3, '0');
    } catch {
      finalCode = 'STU' + Date.now().toString().slice(-3);
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const student = await studentModel.createStudentWithUser(
      {
        full_name: full_name.trim(),
        student_code: finalCode,
        email: email.trim().toLowerCase(),
        phone,
        gender,
        account_status: account_status || 'active',
      },
      passwordHash
    );

    res.status(201).json(student);
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      if (detail.includes('student_code')) {
        return res.status(409).json({ error: 'This student code already exists.' });
      }
      if (detail.includes('email')) {
        return res.status(409).json({ error: 'A student with this email already exists.' });
      }
      return res.status(409).json({ error: 'Duplicate value violates a unique constraint.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create student.' });
  }
};

const update = async (req, res) => {
  const { full_name, student_code, email, phone, gender } = req.body;

  if (!full_name || !full_name.trim() || !student_code || !email) {
    return res.status(400).json({ error: 'Full name, student code, and email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (gender && !VALID_GENDERS.includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value.' });
  }

  try {
    const result = await studentModel.updateStudent(req.params.id, {
      full_name: full_name.trim(),
      student_code,
      email: email.trim().toLowerCase(),
      phone,
      gender,
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      if (detail.includes('student_code')) {
        return res.status(409).json({ error: 'This student code already exists.' });
      }
      if (detail.includes('email')) {
        return res.status(409).json({ error: 'A student with this email already exists.' });
      }
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update student.' });
  }
};

// Deactivate instead of deleting — preserves booking & payment history.
const deactivate = async (req, res) => {
  try {
    const result = await studentModel.deactivateStudent(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate student.' });
  }
};

module.exports = { list, getOne, create, update, deactivate };
