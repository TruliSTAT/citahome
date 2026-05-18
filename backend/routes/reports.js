const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const PLANS = {
  single: { price: 3900, label: 'Single Report — $39', expires_days: 30 },
  agent_monthly: { price: 14900, label: 'Agent Monthly — $149/mo', expires_days: 30 },
};

/**
 * POST /api/reports/purchase
 * Creates a Stripe Checkout session for report access.
 * Body: { property_id, email, plan }
 */
router.post('/purchase', async (req, res) => {
  const { property_id, email, plan } = req.body;

  if (!property_id || !email || !plan) {
    return res.status(400).json({ error: 'property_id, email, and plan are required' });
  }
  if (!PLANS[plan]) {
    return res.status(400).json({ error: `Invalid plan. Must be: ${Object.keys(PLANS).join(', ')}` });
  }

  const db = getDb();
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    // Dev mode — return mock session
    const mockToken = jwt.sign(
      { property_id: parseInt(property_id), type: 'report_access', plan, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    db.prepare(`
      INSERT INTO report_purchases (property_id, email, plan, status, expires_at, access_token, stripe_session)
      VALUES (?, ?, ?, 'paid', ?, ?, 'dev_mock')
    `).run(property_id, email, plan, expiresAt, mockToken);

    return res.json({
      mode: 'dev',
      message: 'Dev mode — purchase auto-approved (no Stripe key set)',
      access_token: mockToken,
      property_id,
      plan,
    });
  }

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(STRIPE_SECRET_KEY);

    const planConfig = PLANS[plan];
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: plan === 'agent_monthly' ? 'subscription' : 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planConfig.label, description: `CitaHome report for ${property.address_raw}` },
          unit_amount: planConfig.price,
          ...(plan === 'agent_monthly' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      metadata: { property_id: String(property_id), email, plan },
      success_url: `${baseUrl}/report/${property_id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/report/${property_id}`,
    });

    // Create pending purchase record
    db.prepare(`
      INSERT INTO report_purchases (property_id, email, plan, status, stripe_session)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(property_id, email, plan, session.id);

    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    console.error('[Reports] Stripe error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/reports/webhook
 * Stripe webhook — marks purchase paid, generates signed access token.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  res.status(200).json({ received: true });

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = process.env.STRIPE_WEBHOOK_SECRET && sig
        ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
        : JSON.parse(req.body.toString('utf8'));
    } catch (_) {
      event = JSON.parse(req.body.toString('utf8'));
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { property_id, email, plan } = session.metadata || {};

      if (property_id) {
        const db = getDb();
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        const accessToken = jwt.sign(
          { property_id: parseInt(property_id), type: 'report_access', plan, email },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        db.prepare(`
          UPDATE report_purchases
          SET status = 'paid', expires_at = ?, access_token = ?
          WHERE stripe_session = ?
        `).run(expiresAt, accessToken, session.id);

        console.log(`[Reports] Purchase confirmed for property ${property_id} — plan: ${plan}`);
      }
    }
  } catch (err) {
    console.error('[Reports] Webhook error:', err.message);
  }
});

/**
 * GET /api/reports/verify?token=<jwt>
 * Validates a purchase token.
 */
router.get('/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'report_access') throw new Error('Wrong token type');

    const db = getDb();
    const purchase = db.prepare(`
      SELECT * FROM report_purchases
      WHERE access_token = ? AND status = 'paid'
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(token);

    if (!purchase) {
      return res.json({ valid: false, reason: 'Purchase not found or expired' });
    }

    res.json({
      valid: true,
      property_id: payload.property_id,
      plan: payload.plan,
      expires_at: purchase.expires_at,
    });
  } catch (err) {
    res.json({ valid: false, reason: err.message });
  }
});

module.exports = router;
