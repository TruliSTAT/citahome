import React, { useState } from 'react';

export default function PaywallGate({ propertyId, address, onUnlocked }) {
  const [email, setEmail]   = useState('');
  const [plan, setPlan]     = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [devToken, setDevToken] = useState(null);

  async function handlePurchase(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch('/api/reports/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, email: email.trim(), plan }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Purchase failed');

      if (data.mode === 'dev') {
        if (onUnlocked) onUnlocked(data.access_token);
        setDevToken(data.access_token);
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (devToken) {
    return (
      <div className="rounded-xl p-6 text-center border" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}>
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-400">Dev mode — full report unlocked!</p>
        <p className="text-green-600 text-sm mt-1">In production, this redirects to Stripe checkout.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 rounded-xl z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(10,13,20,0.7) 40%, rgba(10,13,20,0.98) 100%)' }} />

      {/* Paywall card */}
      <div className="relative z-20 card border-brand/30 shadow-teal max-w-md mx-auto mt-4" style={{ borderColor: 'rgba(75,189,181,0.3)' }}>
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🔒</div>
          <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">Unlock Full Report</h3>
          <p className="text-gray-400 text-sm">
            See the complete service history for <span className="font-semibold text-[#e2e8f0]">{address}</span>
          </p>
        </div>

        {/* Plan selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { id: 'single',        price: '$39',       label: 'Single Report',   sub: 'One-time · 30-day access' },
            { id: 'agent_monthly', price: '$149/mo',   label: 'Agent Plan',      sub: 'Unlimited reports' },
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                background:   plan === p.id ? 'rgba(75,189,181,0.1)' : '#0a0d14',
                borderColor:  plan === p.id ? '#4BBDB5' : '#161c28',
              }}
            >
              <div className="font-extrabold text-[#e2e8f0] text-lg">{p.price}</div>
              <div className="text-sm text-gray-300 mt-0.5">{p.label}</div>
              <div className="text-xs text-gray-600 mt-1">{p.sub}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handlePurchase} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input-dark"
            required
          />
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : `Unlock Report — ${plan === 'single' ? '$39' : '$149/mo'}`}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-gray-600">
          <span>🔒 Secure checkout</span>
          <span>💳 Powered by Stripe</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}
