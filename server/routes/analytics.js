const express = require('express');
const { queryAll, queryGet } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/analytics/summary?month=YYYY-MM
router.get('/summary', (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const userId = req.user.id;

  const spentResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const total_spent = spentResult ? spentResult.total_spent : 0;

  const incomeResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as total_income FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const total_income = incomeResult ? incomeResult.total_income : 0;

  const countResult = queryGet(
    `SELECT COUNT(*) as transaction_count FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const transaction_count = countResult ? countResult.transaction_count : 0;

  const categoryBreakdown = queryAll(
    `SELECT c.id, c.name, c.icon, c.color,
       COUNT(e.id) as count,
       COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
     WHERE c.user_id = ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY total DESC`,
    [month, userId]
  );

  categoryBreakdown.forEach(cat => {
    cat.percentage = total_spent > 0 ? Math.round((cat.total / total_spent) * 100) : 0;
  });

  const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const budget = queryGet('SELECT * FROM budgets WHERE user_id = ? AND month = ?', [userId, month]);

  const dailySpending = queryAll(
    `SELECT date, SUM(amount) as total
     FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?
     GROUP BY date ORDER BY date ASC`,
    [userId, month]
  );

  res.json({
    month,
    total_spent,
    total_income,
    balance: total_income - total_spent,
    transaction_count,
    category_breakdown: categoryBreakdown,
    highest_category: highestCategory,
    budget: budget ? budget.amount : 0,
    budget_percentage: budget ? Math.round((total_spent / budget.amount) * 100) : 0,
    daily_spending: dailySpending,
  });
});

// GET /api/analytics/trend?months=6
router.get('/trend', (req, res) => {
  const months = Math.min(parseInt(req.query.months) || 6, 12);
  const userId = req.user.id;

  const trend = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const spentResult = queryGet(
      `SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
      [userId, monthStr]
    );

    const incomeResult = queryGet(
      `SELECT COALESCE(SUM(amount), 0) as total_income FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
      [userId, monthStr]
    );

    const budget = queryGet('SELECT amount FROM budgets WHERE user_id = ? AND month = ?', [userId, monthStr]);

    trend.push({
      month: monthStr,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      spent: spentResult ? spentResult.total_spent : 0,
      income: incomeResult ? incomeResult.total_income : 0,
      budget: budget ? budget.amount : 0,
    });
  }

  res.json({ trend });
});

// GET /api/analytics/comparison?month=YYYY-MM
router.get('/comparison', (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const userId = req.user.id;

  const currentResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as current_spent FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, month]
  );
  const current_spent = currentResult ? currentResult.current_spent : 0;

  const d = new Date(month + '-01');
  d.setMonth(d.getMonth() - 1);
  const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const prevResult = queryGet(
    `SELECT COALESCE(SUM(amount), 0) as prev_spent FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    [userId, prevMonth]
  );
  const prev_spent = prevResult ? prevResult.prev_spent : 0;

  const currentCats = queryAll(
    `SELECT c.name, COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
     WHERE c.user_id = ? GROUP BY c.id HAVING total > 0 ORDER BY total DESC`,
    [month, userId]
  );

  const prevCats = queryAll(
    `SELECT c.name, COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND strftime('%Y-%m', e.date) = ?
     WHERE c.user_id = ? GROUP BY c.id HAVING total > 0 ORDER BY total DESC`,
    [prevMonth, userId]
  );

  const change = prev_spent > 0
    ? Math.round(((current_spent - prev_spent) / prev_spent) * 100)
    : current_spent > 0 ? 100 : 0;

  res.json({
    current: { month, spent: current_spent, categories: currentCats },
    previous: { month: prevMonth, spent: prev_spent, categories: prevCats },
    change_percentage: change,
    change_direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
  });
});

module.exports = router;
