const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'citahome-dev-secret-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Validate an internal sync request using shared secret.
 * Used by citapros-sync and citatodo-sync routes.
 */
function authenticateInternal(req, res, next) {
  const key = req.headers['x-sync-key'] || req.query.sync_key;
  const expected = process.env.CITAHOME_SYNC_KEY || 'citahome-sync-dev-key';
  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized — invalid sync key' });
  }
  next();
}

module.exports = { JWT_SECRET, authenticateToken, authenticateInternal };
