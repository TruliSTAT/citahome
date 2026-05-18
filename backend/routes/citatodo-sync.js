const express = require('express');
const { getDb } = require('../database');
const { normalize, parseComponents } = require('../lib/address-match');
const { authenticateInternal } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/sync/citatodo
 * Pulls permit data from CitaTodo and upserts as service_records.
 * If CitaTodo is unavailable, returns a graceful "not available" response.
 */
router.post('/', authenticateInternal, async (req, res) => {
  const CITATODO_URL = process.env.CITATODO_API_URL;

  if (!CITATODO_URL) {
    return res.json({
      ok: false,
      message: 'CitaTodo API URL not configured — skipping permit sync (v1 behavior)',
      inserted: 0,
    });
  }

  const db = getDb();
  const lastSync = db.prepare(`
    SELECT MAX(created_at) as last FROM service_records WHERE source = 'citatodo'
  `).get();
  const since = lastSync?.last || '1970-01-01';

  const SYNC_KEY = process.env.CITAHOME_SYNC_KEY || 'citahome-sync-dev-key';

  let permits = [];
  try {
    const resp = await fetch(`${CITATODO_URL}/api/citahome/permits?since=${encodeURIComponent(since)}`, {
      headers: { 'x-sync-key': SYNC_KEY },
    });
    if (!resp.ok) throw new Error(`CitaTodo API returned ${resp.status}`);
    permits = await resp.json();
  } catch (err) {
    console.warn('[CitaTodo Sync] Unavailable:', err.message);
    return res.json({ ok: false, message: `CitaTodo unavailable: ${err.message}`, inserted: 0 });
  }

  let inserted = 0;
  let skipped = 0;

  for (const permit of permits) {
    if (!permit.address) { skipped++; continue; }

    const norm = normalize(permit.address);
    const { city, state, zip } = parseComponents(permit.address);

    // Upsert property
    let property = db.prepare('SELECT id FROM properties WHERE address_norm = ?').get(norm);
    if (!property) {
      const r = db.prepare(`
        INSERT INTO properties (address_raw, address_norm, city, state, zip)
        VALUES (?, ?, ?, ?, ?)
      `).run(permit.address, norm, city, state, zip);
      property = { id: r.lastInsertRowid };
    }

    // Skip if already imported
    const existing = db.prepare(`
      SELECT id FROM service_records WHERE source = 'citatodo' AND source_id = ?
    `).get(String(permit.id));
    if (existing) { skipped++; continue; }

    db.prepare(`
      INSERT INTO service_records
        (property_id, source, record_type, trade, description, permit_number, permit_status, service_date, source_id)
      VALUES (?, 'citatodo', 'permit', ?, ?, ?, ?, ?, ?)
    `).run(
      property.id,
      permit.trade || permit.work_type || null,
      permit.description || null,
      permit.permit_number || null,
      permit.status || 'open',
      permit.issue_date ? permit.issue_date.slice(0, 10) : null,
      String(permit.id)
    );
    inserted++;
  }

  console.log(`[CitaTodo Sync] inserted=${inserted} skipped=${skipped}`);
  res.json({ ok: true, inserted, skipped, total: permits.length });
});

/**
 * GET /api/sync/citatodo/status
 */
router.get('/status', authenticateInternal, (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT COUNT(*) as total, MAX(created_at) as last_import
    FROM service_records WHERE source = 'citatodo'
  `).get();
  res.json({ source: 'citatodo', ...stats });
});

module.exports = router;
