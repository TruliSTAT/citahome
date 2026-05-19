const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://citahome.com',
    'https://www.citahome.com',
    /\.up\.railway\.app$/,
  ],
  credentials: true,
}));

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Request logging (errors only) ────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.log(`[${res.statusCode}] ${req.method} ${req.path} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// ── Stripe webhook MUST receive raw body — register BEFORE express.json ───────
app.use('/api/reports/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// ── Database init ──────────────────────────────────────────────────────────────
initDb();

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/property', require('./routes/property'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/sync/citapros', require('./routes/citapros-sync'));
app.use('/api/sync/citatodo', require('./routes/citatodo-sync'));
app.use('/api/history',      require('./routes/history'));
app.use('/api/citacoin',     require('./routes/citacoin'));
app.use('/api/offers',       require('./routes/offers'));
app.use('/uploads',          express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  try {
    const db = require('./database').getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime(), ts: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', error: e.message });
  }
});

// ── Serve frontend build (prod) ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[CitaHome Error]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CitaHome API running on http://localhost:${PORT}`);
});
