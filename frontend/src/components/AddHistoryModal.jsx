import React, { useState, useRef } from 'react';

const CATEGORIES = [
  { value: 'hvac',                label: 'HVAC (Heating / Cooling)' },
  { value: 'roof',                label: 'Roof' },
  { value: 'electrical',          label: 'Electrical' },
  { value: 'plumbing',            label: 'Plumbing' },
  { value: 'water_heater',        label: 'Water Heater' },
  { value: 'appliance',           label: 'Appliance' },
  { value: 'general_improvement', label: 'General Improvement' },
  { value: 'other',               label: 'Other' },
];

const VERIFICATION_STATUSES = {
  pending:          { label: 'Pending Review',    color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  permit_verified:  { label: 'Permit Verified',   color: 'text-brand',      bg: 'bg-brand/10'      },
  doc_verified:     { label: 'Doc Verified',      color: 'text-brand',      bg: 'bg-brand/10'      },
  self_reported:    { label: 'Self-Reported',     color: 'text-gray-400',   bg: 'bg-gray-400/10'   },
};

// Drop zone component
function DropZone({ label, hint, file, onChange, inputRef }) {
  return (
    <div>
      <div
        className="border-2 border-dashed border-brand-border rounded-xl p-5 text-center cursor-pointer hover:border-brand/40 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-brand text-lg">✓</span>
            <span className="text-sm text-brand font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-xs text-gray-600 mt-1">{hint}</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => onChange(e.target.files[0] || null)}
      />
    </div>
  );
}

export default function AddHistoryModal({ propertyId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    category: '',
    description: '',
    year_completed: new Date().getFullYear(),
    contractor_name: '',
    permit_number: '',
    self_reported: false,
  });
  const [proofFile, setProofFile]     = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const proofRef   = useRef();
  const paymentRef = useRef();

  // Determine coin preview
  const coinPreview = form.permit_number
    ? { coins: 50, label: 'Permit auto-verification — instant', status: 'permit_verified' }
    : (proofFile && paymentFile)
    ? { coins: 30, label: 'Invoice + payment doc verified (1–3 days)', status: 'doc_verified' }
    : proofFile
    ? { coins: 30, label: 'Document verified (1–3 business days)', status: 'doc_verified' }
    : form.self_reported
    ? { coins: 10, label: 'Self-reported · auto-upgrades to 50 CC when verified', status: 'self_reported' }
    : null;

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category)    return setError('Please select a category.');
    if (!form.description) return setError('Please enter a description.');
    setError(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('property_id',    propertyId);
      fd.append('category',       form.category);
      fd.append('description',    form.description);
      fd.append('year_completed', form.year_completed);
      fd.append('contractor_name', form.contractor_name);
      fd.append('permit_number',  form.permit_number);
      fd.append('self_reported',  form.self_reported ? '1' : '0');
      if (proofFile)   fd.append('proof',         proofFile);
      if (paymentFile) fd.append('proof_payment', paymentFile);

      const resp = await fetch('/api/history/add', { method: 'POST', body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to submit');
      onSuccess && onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl border border-brand-border shadow-2xl" style={{ background: '#0e1118' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-brand-border">
          <div>
            <h2 className="text-xl font-bold text-[#e2e8f0]">Add Home History</h2>
            <p className="text-sm text-gray-400 mt-1">Document improvements to earn CitaCoins</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-300 transition-colors ml-4 mt-0.5"
          >×</button>
        </div>

        {/* CitaCoin preview banner */}
        {coinPreview && (
          <div className="mx-6 mt-5 flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ background: 'rgba(75,189,181,0.08)', borderColor: 'rgba(75,189,181,0.25)' }}>
            <span className="text-3xl">🪙</span>
            <div>
              <p className="text-sm font-bold text-brand">You'll earn {coinPreview.coins} CitaCoins</p>
              <p className="text-xs text-gray-400 mt-0.5">{coinPreview.label}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Category <span className="text-red-400">*</span></label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="input-dark"
              required
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Work Description <span className="text-red-400">*</span></label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Replaced entire HVAC system with Carrier 5-ton unit, installed by ABC HVAC LLC"
              className="input-dark min-h-[90px] resize-none"
              required
            />
          </div>

          {/* Year + Contractor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Year Completed</label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={form.year_completed}
                onChange={e => set('year_completed', e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Contractor Name</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.contractor_name}
                onChange={e => set('contractor_name', e.target.value)}
                className="input-dark"
              />
            </div>
          </div>

          {/* Permit number */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Permit Number
              <span className="ml-2 text-xs font-normal text-brand">→ earns 50 CC · auto-verified instantly</span>
            </label>
            <input
              type="text"
              placeholder="e.g. BLD-2023-04821 (optional)"
              value={form.permit_number}
              onChange={e => set('permit_number', e.target.value)}
              className="input-dark"
            />
            <p className="text-xs text-gray-600 mt-1.5">We'll check public records automatically</p>
          </div>

          {/* File uploads */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proof of Work
              <span className="ml-2 text-xs font-normal text-brand">→ earns 30 CC</span>
            </label>
            <DropZone
              label="Invoice, receipt, or permit screenshot"
              hint="PDF, JPG, PNG accepted"
              file={proofFile}
              onChange={setProofFile}
              inputRef={proofRef}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proof of Payment
              <span className="ml-2 text-xs font-normal text-gray-500">Optional — increases verification confidence</span>
            </label>
            <DropZone
              label="Receipt, bank statement, or check image"
              hint="Pairs with invoice for stronger verification"
              file={paymentFile}
              onChange={setPaymentFile}
              inputRef={paymentRef}
            />
          </div>

          {/* Self-reported */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.self_reported}
              onChange={e => set('self_reported', e.target.checked)}
              className="mt-0.5 rounded border-brand-border text-brand focus:ring-brand focus:ring-offset-0"
              style={{ background: '#0a0d14', accentColor: '#4BBDB5' }}
            />
            <div>
              <p className="text-sm text-gray-300 font-medium group-hover:text-[#e2e8f0] transition-colors">No documents available yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Earn 10 CC now — auto-upgraded to 50 CC once verified later</p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-3">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </span>
              ) : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
