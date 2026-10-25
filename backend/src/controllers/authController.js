const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This account is inactive.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let student = null;
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT id, full_name, student_code FROM students WHERE user_id = $1',
        [user.id]
      );
      student = studentResult.rows[0] || null;
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      student,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Server error during login.',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
};

const getMe = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    let student = null;
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT id, full_name, student_code FROM students WHERE user_id = $1',
        [user.id]
      );
      student = studentResult.rows[0] || null;
    }

    res.json({ ...user, student });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { login, logout, getMe };
