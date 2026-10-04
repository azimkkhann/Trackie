const express = require('express');
const { validationResult } = require('express-validator');
const { queryGet, queryRun } = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { budgetValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/budget/:month
router.get('/:month', (req, res) => {
  const { month } = req.params;
  const userId = req.user.id;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
  }

  const budget = queryGet('SELECT * FROM budgets WHERE user_id = ? AND month = ?', [userId, month]);

  const spentResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as total_spent 
     FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const total_spent = spentResult ? spentResult.total_spent : 0;

  const budgetAmount = budget ? budget.amount : 0;
  const remaining = budgetAmount - total_spent;
  const percentage = budgetAmount > 0 ? Math.round((total_spent / budgetAmount) * 100) : 0;

  let status = 'no_budget';
  if (budgetAmount > 0) {
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';
    else status = 'healthy';
  }

  res.json({
    budget: budget || null,
    summary: { budget_amount: budgetAmount, total_spent, remaining, percentage, status },
  });
});

// PUT /api/budget/:month
router.put('/:month', budgetValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { month } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
  }

  const existing = queryGet('SELECT id FROM budgets WHERE user_id = ? AND month = ?', [userId, month]);

  if (existing) {
    queryRun('UPDATE budgets SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, existing.id]);
  } else {
    queryRun('INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)',
      [userId, month, amount]);
  }

  const spentResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as total_spent 
     FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const total_spent = spentResult ? spentResult.total_spent : 0;

  const remaining = amount - total_spent;
  const percentage = Math.round((total_spent / amount) * 100);

  let status = 'healthy';
  if (percentage >= 100) status = 'exceeded';
  else if (percentage >= 80) status = 'warning';

  res.json({
    message: existing ? 'Budget updated' : 'Budget set',
    summary: { budget_amount: amount, total_spent, remaining, percentage, status },
  });
});

module.exports = router;
