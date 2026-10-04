const express = require('express');
const { queryAll, queryGet } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/reports/generate
router.get('/generate', (req, res) => {
  const { month, category_id, dateFrom, dateTo } = req.query;
  const userId = req.user.id;
  const targetMonth = month || getCurrentMonth();

  let expenseQuery = `
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  const params = [userId];

  if (dateFrom && dateTo) {
    expenseQuery += ` AND e.date >= ? AND e.date <= ?`;
    params.push(dateFrom, dateTo);
  } else {
    expenseQuery += ` AND strftime('%Y-%m', e.date) = ?`;
    params.push(targetMonth);
  }

  if (category_id) {
    expenseQuery += ` AND e.category_id = ?`;
    params.push(parseInt(category_id));
  }

  expenseQuery += ` ORDER BY e.date DESC`;
  const expenses = queryAll(expenseQuery, params);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const transactionCount = expenses.length;

  const catTotals = {};
  expenses.forEach(e => {
    if (!catTotals[e.category_name]) {
      catTotals[e.category_name] = { name: e.category_name, icon: e.category_icon, color: e.category_color, total: 0, count: 0 };
    }
    catTotals[e.category_name].total += e.amount;
    catTotals[e.category_name].count++;
  });
  const categoryBreakdown = Object.values(catTotals)
    .sort((a, b) => b.total - a.total)
    .map(c => ({ ...c, percentage: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0 }));

  const highestCategory = categoryBreakdown[0] || null;

  let incomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?';
  const incomeParams = [userId];
  if (dateFrom && dateTo) {
    incomeQuery += ' AND date >= ? AND date <= ?';
    incomeParams.push(dateFrom, dateTo);
  } else {
    incomeQuery += ` AND strftime('%Y-%m', date) = ?`;
    incomeParams.push(targetMonth);
  }
  const incomeResult = queryGet(incomeQuery, incomeParams);
  const totalIncome = incomeResult ? incomeResult.total : 0;

  const budget = queryGet('SELECT amount FROM budgets WHERE user_id = ? AND month = ?', [userId, targetMonth]);

  const paymentMethods = {};
  expenses.forEach(e => {
    if (!paymentMethods[e.payment_method]) {
      paymentMethods[e.payment_method] = { method: e.payment_method, total: 0, count: 0 };
    }
    paymentMethods[e.payment_method].total += e.amount;
    paymentMethods[e.payment_method].count++;
  });

  res.json({
    report: {
      period: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : targetMonth,
      total_spent: totalSpent,
      total_income: totalIncome,
      savings: totalIncome - totalSpent,
      transaction_count: transactionCount,
      budget_amount: budget ? budget.amount : 0,
      budget_status: budget
        ? (totalSpent >= budget.amount ? 'exceeded' : totalSpent >= budget.amount * 0.8 ? 'warning' : 'healthy')
        : 'no_budget',
      category_breakdown: categoryBreakdown,
      highest_category: highestCategory,
      payment_methods: Object.values(paymentMethods),
      expenses,
    },
  });
});

// GET /api/reports/export
router.get('/export', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  const targetMonth = month || getCurrentMonth();

  const expenses = queryAll(`
    SELECT e.date, e.description, c.name as category, e.payment_method, e.amount, e.notes
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? AND strftime('%Y-%m', e.date) = ?
    ORDER BY e.date ASC
  `, [userId, targetMonth]);

  const headers = ['Date', 'Description', 'Category', 'Payment Method', 'Amount', 'Notes'];
  const rows = expenses.map(e =>
    [e.date, `"${e.description}"`, e.category, e.payment_method, e.amount, `"${e.notes || ''}"`].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=expenses-${targetMonth}.csv`);
  res.send(csv);
});

module.exports = router;
