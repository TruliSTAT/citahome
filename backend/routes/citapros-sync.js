const express = require('express');
const { getDb } = require('../database');
const { normalize, parseComponents } = require('../lib/address-match');
const { authenticateInternal } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/sync/citapros
 * Pulls completed jobs from CitaPros and upserts them as service_records.
 * Protected by shared internal sync key.
 */
router.post('/', authenticateInternal, async (req, res) => {
  const db = getDb();

  // Find the last sync time for citapros records
  const lastSync = db.prepare(`
    SELECT MAX(created_at) as last FROM service_records WHERE source = 'citapros'
  `).get();
  const since = lastSync?.last || '1970-01-01';

  const CITAPROS_URL = process.env.CITAPROS_API_URL || 'https://citapros-backend.up.railway.app';
  const SYNC_KEY = process.env.CITAHOME_SYNC_KEY || 'citahome-sync-dev-key';

  let jobs = [];
  try {
    const resp = await fetch(`${CITAPROS_URL}/api/citahome/jobs?since=${encodeURIComponent(since)}`, {
      headers: { 'x-sync-key': SYNC_KEY },
    });
    if (!resp.ok) throw new Error(`CitaPros API returned ${resp.status}`);
    jobs = await resp.json();
  } catch (err) {
    console.error('[CitaPros Sync] Fetch error:', err.message);
    return res.status(502).json({ error: `Failed to fetch from CitaPros: ${err.message}` });
  }

  let inserted = 0;
  let skipped = 0;

  for (const job of jobs) {
    if (!job.address) { skipped++; continue; }

    const norm = normalize(job.address);
    const { city, state, zip } = parseComponents(job.address);

    // Upsert property
    let property = db.prepare('SELECT id FROM properties WHERE address_norm = ?').get(norm);
    if (!property) {
      const r = db.prepare(`
        INSERT INTO properties (address_raw, address_norm, city, state, zip)
        VALUES (?, ?, ?, ?, ?)
      `).run(job.address, norm, city, state, zip);
      property = { id: r.lastInsertRowid };
    }

    // Skip if already imported
    const existing = db.prepare(`
      SELECT id FROM service_records WHERE source = 'citapros' AND source_id = ?
    `).get(String(job.id));
    if (existing) { skipped++; continue; }

    db.prepare(`
      INSERT INTO service_records
        (property_id, source, record_type, trade, description, operator_name, operator_rating, service_date, source_id)
      VALUES (?, 'citapros', 'job', ?, ?, ?, ?, ?, ?)
    `).run(
      property.id,
      job.trade_type || null,
      job.description || null,
      job.operator_name || null,
      job.operator_rating ? parseFloat(job.operator_rating) : null,
      job.completed_at ? job.completed_at.slice(0, 10) : null,
      String(job.id)
    );
    inserted++;
  }

  // Update last_synced on all properties that got new records
  db.prepare(`
    UPDATE properties SET last_synced = datetime('now')
    WHERE id IN (SELECT DISTINCT property_id FROM service_records WHERE source = 'citapros')
  `).run();

  console.log(`[CitaPros Sync] inserted=${inserted} skipped=${skipped}`);
  res.json({ ok: true, inserted, skipped, total: jobs.length });
});

/**
 * GET /api/sync/citapros/status
 * Returns sync status info.
 */
router.get('/status', authenticateInternal, (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT COUNT(*) as total, MAX(created_at) as last_import
    FROM service_records WHERE source = 'citapros'
  `).get();
  res.json({ source: 'citapros', ...stats });
});

module.exports = router;
