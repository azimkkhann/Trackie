const express = require('express');
const { validationResult } = require('express-validator');
const { queryAll, queryGet, queryRun } = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { incomeValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/income
router.get('/', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;

  let query = 'SELECT * FROM income WHERE user_id = ?';
  const params = [userId];

  if (month) {
    query += ` AND strftime('%Y-%m', date) = ?`;
    params.push(month);
  }
  query += ' ORDER BY date DESC';

  const entries = queryAll(query, params);
  const totalIncome = entries.reduce((sum, e) => sum + e.amount, 0);
  res.json({ income: entries, total: totalIncome });
});

// POST /api/income
router.post('/', incomeValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, source, date, notes } = req.body;
  const result = queryRun(
    'INSERT INTO income (user_id, amount, source, date, notes) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, amount, source, date, notes || '']
  );

  const entry = queryGet('SELECT * FROM income WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ income: entry, message: 'Income added' });
});

// DELETE /api/income/:id
router.delete('/:id', (req, res) => {
  const existing = queryGet('SELECT id FROM income WHERE id = ? AND user_id = ?',
    [parseInt(req.params.id), req.user.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Income entry not found' });
  }

  queryRun('DELETE FROM income WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  res.json({ message: 'Income deleted' });
});

module.exports = router;
