import React, { useState } from 'react';

const FINANCING_OPTIONS = [
  { value: 'cash',         label: '💵 Cash' },
  { value: 'conventional', label: '🏦 Conventional' },
  { value: 'fha',          label: '🏛️ FHA' },
  { value: 'va',           label: '🪖 VA' },
  { value: 'other',        label: 'Other' },
];

function formatDollar(val) {
  const n = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(n)) return '';
  return n.toLocaleString('en-US');
}

export default function MakeOfferModal({ propertyId, address, onClose }) {
  const [form, setForm] = useState({
    offer_amount: '',
    financing_type: 'cash',
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    message: '',
    citaagent_requested: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, '');
    setForm(f => ({ ...f, offer_amount: raw }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.buyer_name.trim())  return setError('Please enter your name.');
    if (!form.buyer_email.trim()) return setError('Please enter your email.');
    if (!form.offer_amount)       return setError('Please enter an offer amount.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:          propertyId,
          buyer_name:           form.buyer_name.trim(),
          buyer_email:          form.buyer_email.trim(),
          buyer_phone:          form.buyer_phone.trim() || undefined,
          offer_amount:         parseInt(form.offer_amount, 10),
          financing_type:       form.financing_type,
          message:              form.message.trim() || undefined,
          citaagent_requested:  form.citaagent_requested,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto"
        style={{
          background: '#0e1118',
          border: '1px solid #161c28',
          maxHeight: '92vh',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-2xl leading-none z-10 transition-colors"
        >×</button>

        <div className="p-7">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-extrabold mb-1" style={{ color: '#4BBDB5' }}>
              🏠 Make an Offer on This Home
            </h2>
            {address && (
              <p className="text-sm font-semibold text-[#e2e8f0] mt-1 leading-snug">{address}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Even if it's not listed — the best deals often start with a letter.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Offer Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Offer Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.offer_amount ? parseInt(form.offer_amount, 10).toLocaleString('en-US') : ''}
                    onChange={handleAmountChange}
                    placeholder="450,000"
                    className="w-full rounded-xl py-4 pl-9 pr-4 text-2xl font-extrabold text-[#e2e8f0] outline-none focus:ring-2 transition-all"
                    style={{
                      background: '#161c28',
                      border: '1px solid #1e2535',
                      '--tw-ring-color': '#4BBDB5',
                    }}
                  />
                </div>
              </div>

              {/* Financing Type */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                  Financing Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {FINANCING_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold transition-all"
                      style={{
                        background: form.financing_type === opt.value ? 'rgba(75,189,181,0.15)' : '#161c28',
                        border: `1px solid ${form.financing_type === opt.value ? '#4BBDB5' : '#1e2535'}`,
                        color: form.financing_type === opt.value ? '#4BBDB5' : '#9ca3af',
                      }}
                    >
                      <input
                        type="radio"
                        name="financing_type"
                        value={opt.value}
                        checked={form.financing_type === opt.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={form.buyer_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl py-3 px-4 text-sm text-[#e2e8f0] outline-none focus:ring-2 transition-all"
                    style={{ background: '#161c28', border: '1px solid #1e2535', '--tw-ring-color': '#4BBDB5' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    name="buyer_email"
                    value={form.buyer_email}
                    onChange={handleChange}
                    placeholder="jane@email.com"
                    className="w-full rounded-xl py-3 px-4 text-sm text-[#e2e8f0] outline-none focus:ring-2 transition-all"
                    style={{ background: '#161c28', border: '1px solid #1e2535', '--tw-ring-color': '#4BBDB5' }}
                  />
                </div>
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Phone <span className="text-gray-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="buyer_phone"
                  value={form.buyer_phone}
                  onChange={handleChange}
                  placeholder="(512) 555-0100"
                  className="w-full rounded-xl py-3 px-4 text-sm text-[#e2e8f0] outline-none focus:ring-2 transition-all"
                  style={{ background: '#161c28', border: '1px solid #1e2535', '--tw-ring-color': '#4BBDB5' }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Message to Owner
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Hi, I've admired your home for years and would love to discuss purchasing it. I'm a serious buyer and can move quickly..."
                  className="w-full rounded-xl py-3 px-4 text-sm text-[#e2e8f0] outline-none focus:ring-2 resize-none transition-all"
                  style={{ background: '#161c28', border: '1px solid #1e2535', '--tw-ring-color': '#4BBDB5' }}
                />
              </div>

              {/* CitaAgent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    name="citaagent_requested"
                    checked={form.citaagent_requested}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{
                      background: form.citaagent_requested ? '#4BBDB5' : '#161c28',
                      border: `2px solid ${form.citaagent_requested ? '#4BBDB5' : '#2a3347'}`,
                    }}
                  >
                    {form.citaagent_requested && (
                      <svg className="w-3 h-3 text-[#0e1118]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-300 leading-snug">
                  Connect me with a <span className="font-bold" style={{ color: '#4BBDB5' }}>CitaAgent</span> broker to represent my offer
                </span>
              </label>

              {/* CitaAgent CTA block */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(75,189,181,0.06)', border: '1px solid rgba(75,189,181,0.15)' }}
              >
                <p className="text-xs font-bold text-gray-300 mb-2">🤝 Want an agent in your corner?</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  CitaAgent brokers specialize in off-market offers. They'll review comps, structure your offer,
                  and negotiate on your behalf — at no upfront cost.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://app.citaagent.com/signup?ref=citahome-offer&vertical=residential_agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(75,189,181,0.15)', color: '#4BBDB5', border: '1px solid rgba(75,189,181,0.3)' }}
                  >
                    Link My CitaAgent Account
                  </a>
                  <a
                    href="https://app.citaagent.com/signup?ref=citahome-offer&vertical=residential_agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: '#4BBDB5', color: '#0e1118' }}
                  >
                    Match Me With an Agent →
                  </a>
                </div>
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl text-base font-extrabold transition-all duration-200 disabled:opacity-60"
                style={{ background: '#D4A83A', color: '#0a0d14' }}
              >
                {submitting ? 'Submitting…' : 'Submit My Offer →'}
              </button>
            </form>
          ) : (
            /* ── Success State ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(75,189,181,0.15)' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#4BBDB5" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold mb-2" style={{ color: '#4BBDB5' }}>Offer Submitted!</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                The homeowner will be notified. We'll email you if they respond.
              </p>

              {/* CitaAgent CTA in success */}
              <div
                className="rounded-xl p-5 mb-6 text-left"
                style={{ background: 'rgba(75,189,181,0.06)', border: '1px solid rgba(75,189,181,0.2)' }}
              >
                <p className="text-sm font-bold text-gray-200 mb-1">🤝 Want an agent in your corner?</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  CitaAgent brokers specialize in off-market offers. They'll review comps, structure your offer,
                  and negotiate on your behalf — at no upfront cost.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://app.citaagent.com/signup?ref=citahome-offer&vertical=residential_agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl text-sm font-bold text-center transition-all"
                    style={{ background: '#4BBDB5', color: '#0e1118' }}
                  >
                    Match Me With an Agent →
                  </a>
                  <a
                    href="https://app.citaagent.com/signup?ref=citahome-offer&vertical=residential_agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all"
                    style={{ background: 'rgba(75,189,181,0.12)', color: '#4BBDB5', border: '1px solid rgba(75,189,181,0.25)' }}
                  >
                    Link My CitaAgent Account
                  </a>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: '#161c28', border: '1px solid #1e2535', color: '#9ca3af' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
