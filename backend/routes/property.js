const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { normalize, parseComponents } = require('../lib/address-match');
const { buildReport, buildForecast } = require('../lib/report-builder');
const { checkAddress } = require('../lib/forclos-lookup');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/property/search?address=<query>
 * Fuzzy-search properties by normalized address.
 * Creates a stub if no match found.
 */
router.get('/search', (req, res) => {
  const { address } = req.query;
  if (!address || address.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a full address (minimum 5 characters)' });
  }

  const db = getDb();
  const norm = normalize(address);

  // Fuzzy search using LIKE
  const matches = db.prepare(`
    SELECT p.id, p.address_raw, p.city, p.state, p.zip, p.last_synced,
      COUNT(sr.id) as record_count,
      MAX(sr.service_date) as last_service_date
    FROM properties p
    LEFT JOIN service_records sr ON sr.property_id = p.id
    WHERE p.address_norm LIKE ?
    GROUP BY p.id
    ORDER BY record_count DESC
    LIMIT 10
  `).all(`%${norm}%`);

  if (matches.length > 0) {
    return res.json(matches);
  }

  // No match — create stub property
  const { city, state, zip } = parseComponents(address);
  const insert = db.prepare(`
    INSERT INTO properties (address_raw, address_norm, city, state, zip)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insert.run(address.trim(), norm, city, state, zip);
  const stub = {
    id: result.lastInsertRowid,
    address_raw: address.trim(),
    city,
    state,
    zip,
    record_count: 0,
    last_service_date: null,
    last_synced: null,
  };

  res.json([stub]);
});

/**
 * GET /api/property/:id/report
 * Returns preview (first 3 records) without auth.
 * Returns full report if valid purchase token is provided.
 */
router.get('/:id/report', async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const records = db.prepare(`
    SELECT * FROM service_records
    WHERE property_id = ?
    ORDER BY service_date DESC
  `).all(id);

  // Check for valid purchase token
  let previewOnly = true;
  const tokenHeader = req.headers['authorization'];
  const tokenQuery = req.query.token;
  const rawToken = (tokenHeader && tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : null) || tokenQuery;

  if (rawToken) {
    try {
      const payload = jwt.verify(rawToken, JWT_SECRET);
      if (payload.property_id === parseInt(id) && payload.type === 'report_access') {
        // Verify purchase is still valid in DB
        const purchase = db.prepare(`
          SELECT * FROM report_purchases
          WHERE access_token = ? AND property_id = ? AND status = 'paid'
          AND (expires_at IS NULL OR expires_at > datetime('now'))
        `).get(rawToken, parseInt(id));
        if (purchase) {
          previewOnly = false;
        }
      }
    } catch (err) {
      // Invalid token — fall through to preview only
    }
  }

  const report = buildReport(property, records, previewOnly);

  // Predictive Maintenance Forecast
  report.forecast = buildForecast(
    report.summary.system_ages_raw,
    new Date().getFullYear()
  );

  // Forclos bridge — check for distress records (foreclosures, liens, deeds)
  // Use address_raw for the lookup; falls back to null on any error (never blocks report)
  const forclosData = await checkAddress(property.address_raw || property.address_norm);
  report.distress_flags = forclosData?.found
    ? {
        found: true,
        count: forclosData.count,
        records: forclosData.records,
        message: forclosData.count === 1
          ? 'Public records show a foreclosure or tax lien filing on this property.'
          : `Public records show ${forclosData.count} foreclosure or tax lien filings on this property.`,
      }
    : { found: false };

  res.json(report);
});

module.exports = router;
