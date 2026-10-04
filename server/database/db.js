const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(__dirname, 'expense_manager.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function saveDb() {
  if (!db) return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Auto-save periodically and on process exit
let saveInterval = null;

function startAutoSave() {
  if (saveInterval) return;
  saveInterval = setInterval(() => saveDb(), 5000);
  process.on('exit', () => saveDb());
  process.on('SIGINT', () => { saveDb(); process.exit(); });
  process.on('SIGTERM', () => { saveDb(); process.exit(); });
}

async function initializeDatabase() {
  const database = await getDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      currency TEXT DEFAULT '₹',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      description TEXT NOT NULL,
      date DATE NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      source TEXT NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, month)
    )
  `);

  // Create indexes
  try { database.run('CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)'); } catch(e) {}
  try { database.run('CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id)'); } catch(e) {}
  try { database.run('CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)'); } catch(e) {}
  try { database.run('CREATE INDEX IF NOT EXISTS idx_income_user ON income(user_id)'); } catch(e) {}
  try { database.run('CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month)'); } catch(e) {}

  saveDb();
  startAutoSave();

  return database;
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a query and return the first row as an object
function queryGet(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper: run an INSERT/UPDATE/DELETE and return info
function queryRun(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0];
  const changes = db.getRowsModified();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

// Create default categories for a new user
function createDefaultCategories(userId) {
  const defaults = [
    { name: 'Food', icon: '🍕', color: '#e67e22' },
    { name: 'Travel', icon: '🚕', color: '#3498db' },
    { name: 'Shopping', icon: '🛒', color: '#9b59b6' },
    { name: 'Bills', icon: '📄', color: '#e74c3c' },
    { name: 'Entertainment', icon: '🎬', color: '#2ecc71' },
    { name: 'Other', icon: '📦', color: '#95a5a6' },
  ];

  for (const cat of defaults) {
    queryRun(
      'INSERT INTO categories (user_id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 1)',
      [userId, cat.name, cat.icon, cat.color]
    );
  }
}

module.exports = { getDb, initializeDatabase, createDefaultCategories, queryAll, queryGet, queryRun, saveDb };
