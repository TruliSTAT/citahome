/**
 * CitaHome History Routes
 * POST /api/history/add            — submit a new home history entry
 * GET  /api/history/:propertyId    — list history entries for a property
 * POST /api/history/:entryId/verify — trigger verification (admin/system)
 */

const express = require('express');
const router  = express.Router();
const path    = require('path');
const crypto  = require('crypto');
const { getDb } = require('../database');

// ── Multer setup (lazy init so missing dep doesn't crash startup) ────────────
let upload;
function getUpload() {
  if (upload) return upload;
  const multer = require('multer');
  const fs     = require('fs');
  const dir    = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename:    (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = crypto.randomBytes(12).toString('hex');
      cb(null, `${safe}${ext}`);
    },
  });
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  };
  upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });
  return upload;
}

// ── Coin award logic ─────────────────────────────────────────────────────────
function calcCoins({ permit_number, proof_file_path, proof_payment_path, self_reported }) {
  if (permit_number)    return { coins: 50, status: 'permit_verified' };
  if (proof_file_path)  return { coins: 30, status: 'doc_verified'    };
  if (self_reported)    return { coins: 10, status: 'self_reported'   };
  return { coins: 0, status: 'pending' };
}

// ── POST /api/history/add ───────────────────────────────────────────────────
router.post('/add', (req, res, next) => {
  getUpload().fields([
    { name: 'proof',         maxCount: 1 },
    { name: 'proof_payment', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const db = getDb();
      const {
        property_id,
        category,
        description,
        year_completed,
        contractor_name,
        permit_number,
        self_reported,
      } = req.body;

      if (!property_id) return res.status(400).json({ error: 'property_id is required' });
      if (!category)    return res.status(400).json({ error: 'category is required' });
      if (!description) return res.status(400).json({ error: 'description is required' });

      const proofPath   = req.files?.proof?.[0]?.filename
        ? path.join('uploads', req.files.proof[0].filename)
        : null;
      const paymentPath = req.files?.proof_payment?.[0]?.filename
        ? path.join('uploads', req.files.proof_payment[0].filename)
        : null;

      const { coins, status } = calcCoins({
        permit_number:     permit_number || '',
        proof_file_path:   proofPath,
        proof_payment_path: paymentPath,
        self_reported:     self_reported === '1' || self_reported === 'true',
      });

      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO history_entries
          (id, property_id, category, description, year_completed, contractor_name,
           permit_number, proof_file_path, proof_payment_path, self_reported,
           verification_status, citacoin_awarded)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        property_id,
        category,
        description,
        year_completed ? parseInt(year_completed) : null,
        contractor_name || null,
        permit_number   || null,
        proofPath       || null,
        paymentPath     || null,
        (self_reported === '1' || self_reported === 'true') ? 1 : 0,
        status,
        coins,
      );

      // Log to CitaCoin ledger
      if (coins > 0) {
        db.prepare(`
          INSERT INTO citacoin_ledger (id, property_id, amount, reason, entry_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          property_id,
          coins,
          `history_entry:${category}:${status}`,
          id,
        );
      }

      const entry = db.prepare('SELECT * FROM history_entries WHERE id = ?').get(id);
      res.status(201).json({ success: true, entry, citacoin_awarded: coins });
    } catch (e) {
      console.error('[history/add]', e);
      next(e);
    }
  });
});

// ── GET /api/history/:propertyId ────────────────────────────────────────────
router.get('/:propertyId', (req, res) => {
  try {
    const db      = getDb();
    const entries = db.prepare(
      'SELECT * FROM history_entries WHERE property_id = ? ORDER BY created_at DESC'
    ).all(req.params.propertyId);

    const ledger = db.prepare(
      'SELECT SUM(amount) as total FROM citacoin_ledger WHERE property_id = ?'
    ).get(req.params.propertyId);

    res.json({ entries, total_citacoin: ledger?.total || 0 });
  } catch (e) {
    console.error('[history/get]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/history/:entryId/verify ───────────────────────────────────────
router.post('/:entryId/verify', (req, res) => {
  try {
    const db    = getDb();
    const entry = db.prepare('SELECT * FROM history_entries WHERE id = ?').get(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const newStatus = req.body.status || 'doc_verified';
    const coins     = newStatus === 'permit_verified' || newStatus === 'doc_verified' ? 50 : entry.citacoin_awarded;

    // Upgrade coins if self-reported and now verified
    const coinDelta = coins - entry.citacoin_awarded;

    db.prepare(`
      UPDATE history_entries
      SET verification_status = ?, citacoin_awarded = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, coins, entry.id);

    if (coinDelta > 0) {
      db.prepare(`
        INSERT INTO citacoin_ledger (id, property_id, amount, reason, entry_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        entry.property_id,
        coinDelta,
        `verification_upgrade:${newStatus}`,
        entry.id,
      );
    }

    res.json({ success: true, entry_id: entry.id, new_status: newStatus, citacoin_delta: coinDelta });
  } catch (e) {
    console.error('[history/verify]', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
