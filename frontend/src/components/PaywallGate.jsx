import React, { useState } from 'react';

export default function PaywallGate({ propertyId, address, onUnlocked }) {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devToken, setDevToken] = useState(null);

  async function handlePurchase(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
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
        // Dev mode — auto unlocked
        if (onUnlocked) onUnlocked(data.access_token);
        setDevToken(data.access_token);
      } else if (data.checkout_url) {
        // Redirect to Stripe
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
      <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-green-800 font-semibold">Dev mode — full report unlocked!</p>
        <p className="text-green-600 text-sm mt-1">In production, this would redirect to Stripe checkout.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white rounded-xl z-10 pointer-events-none" />

      {/* Paywall card */}
      <div className="relative z-20 bg-white rounded-2xl border-2 border-brand-200 shadow-xl p-8 max-w-md mx-auto mt-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Full Report</h3>
          <p className="text-gray-600 text-sm">
            See the complete service history for <span className="font-medium">{address}</span>
          </p>
        </div>

        {/* Plan selection */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setPlan('single')}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              plan === 'single'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-bold text-gray-900 text-lg">$39</div>
            <div className="text-sm text-gray-600">Single Report</div>
            <div className="text-xs text-gray-400 mt-1">One-time, 30-day access</div>
          </button>
          <button
            type="button"
            onClick={() => setPlan('agent_monthly')}
            className={`rounded-xl border-2 p-4 text-left transition-colors ${
              plan === 'agent_monthly'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-bold text-gray-900 text-lg">$149<span className="text-sm font-normal">/mo</span></div>
            <div className="text-sm text-gray-600">Agent Plan</div>
            <div className="text-xs text-gray-400 mt-1">Unlimited reports</div>
          </button>
        </div>

        <form onSubmit={handlePurchase} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Unlock Report — ${plan === 'single' ? '$39' : '$149/mo'}`}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>🔒 Secure checkout</span>
          <span>💳 Powered by Stripe</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}
