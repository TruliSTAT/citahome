const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

// ── POST /api/offers — submit an offer on a property ─────────────────────────
router.post('/', (req, res) => {
  const {
    property_id,
    buyer_name,
    buyer_email,
    buyer_phone,
    offer_amount,
    financing_type,
    message,
    citaagent_requested,
  } = req.body;

  // Validation
  if (!property_id)    return res.status(400).json({ error: 'property_id is required' });
  if (!buyer_name)     return res.status(400).json({ error: 'buyer_name is required' });
  if (!buyer_email)    return res.status(400).json({ error: 'buyer_email is required' });
  if (!offer_amount)   return res.status(400).json({ error: 'offer_amount is required' });
  if (!financing_type) return res.status(400).json({ error: 'financing_type is required' });

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(buyer_email)) return res.status(400).json({ error: 'Invalid email address' });

  const validFinancing = ['cash', 'conventional', 'fha', 'va', 'other'];
  if (!validFinancing.includes(financing_type)) {
    return res.status(400).json({ error: 'Invalid financing_type' });
  }

  const amount = parseInt(offer_amount, 10);
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'offer_amount must be a positive number' });

  try {
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO property_offers
        (id, property_id, buyer_name, buyer_email, buyer_phone,
         offer_amount, financing_type, message, citaagent_requested)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(property_id),
      buyer_name,
      buyer_email,
      buyer_phone || null,
      amount,
      financing_type,
      message || null,
      citaagent_requested ? 1 : 0,
    );

    console.log(`[Offers] New offer ${id} on property ${property_id} — $${amount.toLocaleString()}`);

    return res.status(201).json({
      success: true,
      id,
      message: 'Your offer has been submitted. The homeowner will be notified.',
    });
  } catch (err) {
    console.error('[Offers] POST error:', err);
    return res.status(500).json({ error: 'Failed to submit offer' });
  }
});

// ── GET /api/offers/property/:propertyId — get all offers for a property ─────
//    (owner auth required — basic token check via Authorization: Bearer <token>)
router.get('/property/:propertyId', (req, res) => {
  const { propertyId } = req.params;
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization required' });

  // Verify the token belongs to a valid purchase for this property
  const db = getDb();
  const purchase = db.prepare(
    `SELECT id FROM report_purchases
     WHERE property_id = ? AND access_token = ? AND status = 'active'
     LIMIT 1`
  ).get(propertyId, authHeader.replace('Bearer ', '').trim());

  if (!purchase) return res.status(403).json({ error: 'Unauthorized' });

  const offers = db.prepare(`
    SELECT id, buyer_name, buyer_email, buyer_phone, offer_amount,
           financing_type, message, citaagent_requested, status, created_at, viewed_at
    FROM property_offers
    WHERE property_id = ?
    ORDER BY created_at DESC
  `).all(String(propertyId));

  return res.json({ offers, count: offers.length });
});

// ── PATCH /api/offers/:id/status — update offer status (owner auth required) ─
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization required' });

  const validStatuses = ['pending', 'viewed', 'accepted', 'declined', 'countered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const db = getDb();
    const offer = db.prepare('SELECT * FROM property_offers WHERE id = ?').get(id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    // Verify the token belongs to a valid purchase for this offer's property
    const purchase = db.prepare(
      `SELECT id FROM report_purchases
       WHERE property_id = ? AND access_token = ? AND status = 'active'
       LIMIT 1`
    ).get(offer.property_id, authHeader.replace('Bearer ', '').trim());

    if (!purchase) return res.status(403).json({ error: 'Unauthorized' });

    const viewedAt = status === 'viewed' && !offer.viewed_at
      ? new Date().toISOString()
      : offer.viewed_at;

    db.prepare(`
      UPDATE property_offers SET status = ?, viewed_at = ? WHERE id = ?
    `).run(status, viewedAt, id);

    return res.json({ success: true, id, status });
  } catch (err) {
    console.error('[Offers] PATCH error:', err);
    return res.status(500).json({ error: 'Failed to update offer status' });
  }
});

module.exports = router;
