const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login attempt for:', email);
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('User query completed, found:', rows.length);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison completed, match:', isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3d' });

    console.log('Login successful for:', email);
    res.json({
      token,
      refreshToken,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    console.log('Refresh token attempt for:', refreshToken);
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const user = rows[0];
    const newToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.register = async (req, res) => {
  const { full_name, email, password, role } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (full_name, email, password, role) VALUES (?,?,?,?)', [full_name, email, hashedPassword, role]);
    res.json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { full_name, email } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM users WHERE email = ? AND id != ?', [email, req.params.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already in use by another account.' });
    }
    await db.query(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [full_name, email, req.params.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePasswordWithVerification = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};