const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initializeDatabase, createDefaultCategories, queryAll, queryGet, queryRun, saveDb } = require('./db');

async function seed() {
  console.log('Initializing database...');
  await initializeDatabase();

  // Check if demo user already exists
  const existing = queryGet('SELECT id FROM users WHERE email = ?', ['demo@example.com']);
  if (existing) {
    console.log('Demo data already exists. Skipping seed.');
    process.exit(0);
  }

  console.log('Seeding demo data...');

  // Create demo user
  const passwordHash = bcrypt.hashSync('demo1234', 10);
  const result = queryRun(
    'INSERT INTO users (name, email, phone, password_hash, currency) VALUES (?, ?, ?, ?, ?)',
    ['Ameya Sharma', 'demo@example.com', '9876543210', passwordHash, '₹']
  );
  const userId = result.lastInsertRowid;

  // Create default categories
  createDefaultCategories(userId);

  // Get category IDs
  const categories = queryAll('SELECT id, name FROM categories WHERE user_id = ?', [userId]);
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c.id; });

  // Generate realistic expenses for the last 3 months
  const now = new Date();

  const templates = [
    { desc: 'College canteen', cat: 'Food', min: 50, max: 200, method: 'UPI' },
    { desc: 'Swiggy order', cat: 'Food', min: 150, max: 500, method: 'UPI' },
    { desc: 'Grocery store', cat: 'Food', min: 400, max: 1500, method: 'Cash' },
    { desc: 'Tea and snacks', cat: 'Food', min: 20, max: 80, method: 'Cash' },
    { desc: 'Weekend dinner', cat: 'Food', min: 300, max: 900, method: 'Card' },
    { desc: 'Zomato order', cat: 'Food', min: 200, max: 600, method: 'UPI' },
    { desc: 'Uber ride', cat: 'Travel', min: 80, max: 350, method: 'UPI' },
    { desc: 'Auto rickshaw', cat: 'Travel', min: 30, max: 120, method: 'Cash' },
    { desc: 'Metro card recharge', cat: 'Travel', min: 200, max: 500, method: 'UPI' },
    { desc: 'Bus pass', cat: 'Travel', min: 100, max: 300, method: 'Cash' },
    { desc: 'Amazon order', cat: 'Shopping', min: 300, max: 3000, method: 'Card' },
    { desc: 'Flipkart purchase', cat: 'Shopping', min: 200, max: 2500, method: 'UPI' },
    { desc: 'Stationery supplies', cat: 'Shopping', min: 50, max: 300, method: 'Cash' },
    { desc: 'Clothes shopping', cat: 'Shopping', min: 500, max: 4000, method: 'Card' },
    { desc: 'Electricity bill', cat: 'Bills', min: 500, max: 1500, method: 'Net Banking' },
    { desc: 'Mobile recharge', cat: 'Bills', min: 199, max: 599, method: 'UPI' },
    { desc: 'Internet bill', cat: 'Bills', min: 500, max: 999, method: 'UPI' },
    { desc: 'Water bill', cat: 'Bills', min: 100, max: 400, method: 'Net Banking' },
    { desc: 'Movie ticket', cat: 'Entertainment', min: 150, max: 400, method: 'UPI' },
    { desc: 'Netflix subscription', cat: 'Entertainment', min: 199, max: 649, method: 'Card' },
    { desc: 'Spotify subscription', cat: 'Entertainment', min: 59, max: 119, method: 'Card' },
    { desc: 'Gaming purchase', cat: 'Entertainment', min: 200, max: 1500, method: 'Card' },
    { desc: 'Haircut', cat: 'Other', min: 100, max: 400, method: 'Cash' },
    { desc: 'Medicine', cat: 'Other', min: 50, max: 500, method: 'Cash' },
    { desc: 'Gift for friend', cat: 'Other', min: 200, max: 1500, method: 'UPI' },
  ];

  function randomAmount(min, max) {
    return Math.round((Math.random() * (max - min) + min) / 10) * 10;
  }

  function randomDate(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  let expenseCount = 0;
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const count = 15 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      queryRun(
        `INSERT INTO expenses (user_id, category_id, amount, description, date, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, catMap[template.cat], randomAmount(template.min, template.max), template.desc, randomDate(year, month), template.method, '']
      );
      expenseCount++;
    }
  }
  console.log(`  Inserted ${expenseCount} expenses.`);

  // Add income entries
  let incomeCount = 0;
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    queryRun(
      'INSERT INTO income (user_id, amount, source, date, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, 25000 + Math.floor(Math.random() * 10000), 'Salary', `${year}-${String(month + 1).padStart(2, '0')}-01`, 'Monthly salary']
    );
    incomeCount++;
    if (Math.random() > 0.5) {
      queryRun(
        'INSERT INTO income (user_id, amount, source, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 1000 + Math.floor(Math.random() * 4000), 'Freelance', `${year}-${String(month + 1).padStart(2, '0')}-15`, 'Freelance project']
      );
      incomeCount++;
    }
  }
  console.log(`  Inserted ${incomeCount} income entries.`);

  // Set budgets
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    queryRun('INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)', [userId, monthStr, 15000]);
  }
  console.log('  Set budgets for 3 months.');

  saveDb();
  console.log('Seed complete!');
  console.log('Demo login: demo@example.com / demo1234');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
