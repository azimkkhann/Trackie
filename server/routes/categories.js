const express = require('express');
const { validationResult } = require('express-validator');
const { queryAll, queryGet, queryRun } = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { categoryValidation } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

// GET /api/categories
router.get('/', (req, res) => {
  const categories = queryAll(
    `SELECT c.*, COUNT(e.id) as expense_count
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id
     WHERE c.user_id = ?
     GROUP BY c.id
     ORDER BY c.is_default DESC, c.name ASC`,
    [req.user.id]
  );
  res.json({ categories });
});

// POST /api/categories
router.post('/', categoryValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, icon, color } = req.body;
  const userId = req.user.id;

  const existing = queryGet('SELECT id FROM categories WHERE user_id = ? AND name = ?', [userId, name]);
  if (existing) {
    return res.status(409).json({ error: 'A category with this name already exists' });
  }

  const result = queryRun(
    'INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
    [userId, name, icon || '📁', color || '#6c757d']
  );

  const category = queryGet('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ category, message: 'Category created' });
});

// PUT /api/categories/:id
router.put('/:id', categoryValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, icon, color } = req.body;
  const userId = req.user.id;
  const catId = parseInt(req.params.id);

  const existing = queryGet('SELECT id FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const duplicate = queryGet('SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?',
    [userId, name, catId]);
  if (duplicate) {
    return res.status(409).json({ error: 'A category with this name already exists' });
  }

  queryRun('UPDATE categories SET name = ?, icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ? AND user_id = ?',
    [name, icon, color, catId, userId]);

  const category = queryGet('SELECT * FROM categories WHERE id = ?', [catId]);
  res.json({ category, message: 'Category updated' });
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const catId = parseInt(req.params.id);

  const category = queryGet('SELECT * FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const countResult = queryGet('SELECT COUNT(*) as count FROM expenses WHERE category_id = ? AND user_id = ?',
    [catId, userId]);
  const expenseCount = countResult ? countResult.count : 0;

  if (expenseCount > 0) {
    return res.status(409).json({
      error: `Cannot delete: ${expenseCount} expense${expenseCount > 1 ? 's' : ''} use this category. Reassign them first.`,
      expense_count: expenseCount,
    });
  }

  queryRun('DELETE FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
