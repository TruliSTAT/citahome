/**
 * CitaCoin Routes
 * POST /api/citacoin/award   — award CitaCoins (stub, logs to DB)
 * GET  /api/citacoin/balance/:propertyId — get balance for a property
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');

// ── POST /api/citacoin/award ─────────────────────────────────────────────────
router.post('/award', (req, res) => {
  try {
    const { property_id, user_id, amount, reason, entry_id } = req.body;
    if (!property_id) return res.status(400).json({ error: 'property_id is required' });
    if (!amount || isNaN(amount)) return res.status(400).json({ error: 'amount must be a number' });

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO citacoin_ledger (id, property_id, user_id, amount, reason, entry_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, property_id, user_id || null, parseInt(amount), reason || null, entry_id || null);

    res.json({ success: true, id, amount: parseInt(amount) });
  } catch (e) {
    console.error('[citacoin/award]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/citacoin/balance/:propertyId ────────────────────────────────────
router.get('/balance/:propertyId', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM citacoin_ledger WHERE property_id = ?'
    ).get(req.params.propertyId);
    const recent = db.prepare(
      'SELECT * FROM citacoin_ledger WHERE property_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(req.params.propertyId);
    res.json({ property_id: req.params.propertyId, balance: row.total, recent });
  } catch (e) {
    console.error('[citacoin/balance]', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
