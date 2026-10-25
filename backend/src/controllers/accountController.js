const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Admin changes their own email.
const changeEmail = async (req, res) => {
  const { new_email, current_password } = req.body;
  if (!new_email || !current_password) {
    return res.status(400).json({ error: 'new_email and current_password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [new_email, user.id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [new_email.toLowerCase(), user.id]);
    res.json({ message: 'Email updated successfully.', email: new_email.toLowerCase() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update email.' });
  }
};

// Admin or student changes their own password.
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
};

module.exports = { changeEmail, changePassword };
