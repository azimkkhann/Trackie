const { body, param, query } = require('express-validator');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const expenseValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('category_id').isInt({ gt: 0 }).withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 200 }),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('payment_method').optional().trim().isIn(['Cash', 'UPI', 'Card', 'Net Banking']).withMessage('Invalid payment method'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 50 }),
  body('icon').optional().trim(),
  body('color').optional().trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid color format'),
];

const budgetValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Budget amount must be greater than zero'),
];

const incomeValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('source').trim().notEmpty().withMessage('Source is required').isLength({ max: 100 }),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

module.exports = {
  registerValidation,
  loginValidation,
  expenseValidation,
  categoryValidation,
  budgetValidation,
  incomeValidation,
};
