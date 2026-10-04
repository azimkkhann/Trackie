const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initializeDatabase } = require('./database/db');

async function start() {
  // Initialize database tables (async for sql.js)
  await initializeDatabase();

  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/expenses', require('./routes/expenses'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/budget', require('./routes/budget'));
  app.use('/api/income', require('./routes/income'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/reports', require('./routes/reports'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const PORT = process.env.PORT || 5500;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
