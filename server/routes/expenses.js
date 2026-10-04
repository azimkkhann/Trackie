const express = require('express');
const { validationResult } = require('express-validator');
const { queryAll, queryGet, queryRun } = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { expenseValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/expenses
router.get('/', (req, res) => {
  const { month, category_id, search, dateFrom, dateTo, sort, limit, offset } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  const params = [userId];

  if (month) {
    query += ` AND strftime('%Y-%m', e.date) = ?`;
    params.push(month);
  }
  if (category_id) {
    query += ` AND e.category_id = ?`;
    params.push(parseInt(category_id));
  }
  if (search) {
    query += ` AND (e.description LIKE ? OR e.notes LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (dateFrom) {
    query += ` AND e.date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ` AND e.date <= ?`;
    params.push(dateTo);
  }

  const sortMap = {
    'date_desc': 'e.date DESC, e.created_at DESC',
    'date_asc': 'e.date ASC, e.created_at ASC',
    'amount_desc': 'e.amount DESC',
    'amount_asc': 'e.amount ASC',
  };
  query += ` ORDER BY ${sortMap[sort] || sortMap['date_desc']}`;

  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;
  query += ` LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const expenses = queryAll(query, params);

  // Count
  let countQuery = `SELECT COUNT(*) as total FROM expenses e WHERE e.user_id = ?`;
  const countParams = [userId];
  if (month) { countQuery += ` AND strftime('%Y-%m', e.date) = ?`; countParams.push(month); }
  if (category_id) { countQuery += ` AND e.category_id = ?`; countParams.push(parseInt(category_id)); }
  if (search) { countQuery += ` AND (e.description LIKE ? OR e.notes LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
  if (dateFrom) { countQuery += ` AND e.date >= ?`; countParams.push(dateFrom); }
  if (dateTo) { countQuery += ` AND e.date <= ?`; countParams.push(dateTo); }

  const countResult = queryGet(countQuery, countParams);
  const total = countResult ? countResult.total : 0;

  res.json({ expenses, total, limit: lim, offset: off });
});

// GET /api/expenses/:id
router.get('/:id', (req, res) => {
  const expense = queryGet(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ? AND e.user_id = ?
  `, [parseInt(req.params.id), req.user.id]);

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json({ expense });
});

// POST /api/expenses
router.post('/', expenseValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, category_id, description, date, payment_method, notes } = req.body;
  const userId = req.user.id;

  const cat = queryGet('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, userId]);
  if (!cat) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const result = queryRun(
    `INSERT INTO expenses (user_id, category_id, amount, description, date, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, category_id, amount, description, date, payment_method || 'Cash', notes || '']
  );

  const expense = queryGet(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `, [result.lastInsertRowid]);

  res.status(201).json({ expense, message: 'Expense added' });
});

// PUT /api/expenses/:id
router.put('/:id', expenseValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, category_id, description, date, payment_method, notes } = req.body;
  const userId = req.user.id;
  const expenseId = parseInt(req.params.id);

  const existing = queryGet('SELECT id FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const cat = queryGet('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, userId]);
  if (!cat) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  queryRun(
    `UPDATE expenses SET
      amount = ?, category_id = ?, description = ?, date = ?,
      payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?`,
    [amount, category_id, description, date, payment_method || 'Cash', notes || '', expenseId, userId]
  );

  const expense = queryGet(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `, [expenseId]);

  res.json({ expense, message: 'Expense updated' });
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const expenseId = parseInt(req.params.id);

  const existing = queryGet('SELECT id FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  queryRun('DELETE FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
  res.json({ message: 'Expense deleted' });
});

module.exports = router;
