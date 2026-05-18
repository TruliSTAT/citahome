/**
 * CitaPros Export Route for CitaHome Integration
 *
 * ADD THIS FILE to /Users/zues/projects/citapros/backend/routes/citahome-export.js
 * and mount it in citapros/backend/server.js:
 *   app.use('/api/citahome', require('./routes/citahome-export'));
 *
 * Also add to citapros/.env:
 *   CITAHOME_SYNC_KEY=<same shared secret as citahome backend>
 */

const express = require('express');
const router = express.Router();

function authenticateInternal(req, res, next) {
  const key = req.headers['x-sync-key'] || req.query.sync_key;
  const expected = process.env.CITAHOME_SYNC_KEY || 'citahome-sync-dev-key';
  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * GET /api/citahome/jobs?since=<ISO date>
 * Returns completed jobs with address, trade, operator info for CitaHome sync.
 */
router.get('/jobs', authenticateInternal, (req, res) => {
  const { getDb } = require('../database');
  const db = getDb();
  const since = req.query.since || '1970-01-01';

  try {
    const jobs = db.prepare(`
      SELECT j.id, j.address, j.trade_type, j.description, j.completed_at,
             u.name as operator_name,
             AVG(r.rating) as operator_rating
      FROM jobs j
      LEFT JOIN users u ON j.assigned_to = u.id
      LEFT JOIN reviews r ON r.operator_id = u.id
      WHERE j.status = 'completed' AND j.completed_at > ?
        AND j.address IS NOT NULL AND j.address != ''
      GROUP BY j.id
      ORDER BY j.completed_at DESC
      LIMIT 1000
    `).all(since);
    res.json(jobs);
  } catch (err) {
    console.error('[CitaHome Export] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
