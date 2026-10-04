const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { createDefaultCategories, queryAll, queryGet, queryRun } = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password } = req.body;

  try {
    const existing = queryGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = queryRun(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, passwordHash]
    );

    const userId = result.lastInsertRowid;
    createDefaultCategories(userId);

    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: userId, name, email, phone: phone || null, currency: '₹' },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = queryGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, (req, res) => {
  const user = queryGet(
    'SELECT id, name, email, phone, currency, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone, currency, currentPassword, newPassword } = req.body;

  try {
    const user = queryGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      queryRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newHash, req.user.id]);
    }

    if (name || phone !== undefined || currency) {
      queryRun(
        `UPDATE users SET 
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          currency = COALESCE(?, currency),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [name || null, phone !== undefined ? phone : null, currency || null, req.user.id]
      );
    }

    const updated = queryGet(
      'SELECT id, name, email, phone, currency FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: updated, message: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
