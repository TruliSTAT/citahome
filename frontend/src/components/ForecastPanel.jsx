import React, { useMemo } from 'react';

// ── Urgency config ────────────────────────────────────────────────────────────
const URGENCY = {
  overdue:   { label: '🔴 Overdue',        border: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
  soon:      { label: '🟡 Next 2 Years',   border: '#d97706', bg: 'rgba(217,119,6,0.06)' },
  watch:     { label: '🟠 Watch (3–5 yr)', border: '#ca8a04', bg: 'rgba(202,138,4,0.06)' },
  recurring: { label: '🔁 Annual',         border: '#4BBDB5', bg: 'rgba(75,189,181,0.06)' },
};

function formatCost(low, high) {
  const fmt = n => '$' + n.toLocaleString();
  return `${fmt(low)} – ${fmt(high)}`;
}

// ── Single forecast card ──────────────────────────────────────────────────────
function ForecastCard({ item }) {
  const u = URGENCY[item.urgency] || URGENCY.recurring;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: u.bg, border: `1px solid ${u.border}` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: u.border + '22', color: u.border }}
          >
            {u.label}
          </span>
          <p className="text-sm font-bold text-[#e2e8f0] mt-1.5">{item.label}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">Est. cost</p>
          <p className="text-sm font-bold text-[#e2e8f0]">{formatCost(item.cost_low, item.cost_high)}</p>
        </div>
      </div>

      {/* Age info — only for major systems */}
      {item.install_year && (
        <p className="text-xs text-gray-500">
          Installed ~{item.install_year} · Age: ~{item.age_years} yr{item.age_years !== 1 ? 's' : ''} · Typical lifespan: {item.lifespan} yrs
        </p>
      )}

      {/* CTA button */}
      <a
        href={item.citapros_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center rounded-lg py-2 text-xs font-extrabold transition-opacity hover:opacity-80"
        style={{ background: '#D4A83A', color: '#0a0d14' }}
      >
        Get a CitaPros Quote →
      </a>
    </div>
  );
}

// ── Teaser when no system ages are documented ─────────────────────────────────
function ForecastTeaser({ onAddHistory }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: '#0e1118', border: '1px dashed rgba(75,189,181,0.3)' }}
    >
      <div className="text-4xl mb-3">🔮</div>
      <h3 className="text-base font-bold text-[#e2e8f0] mb-2">Unlock Your Maintenance Forecast</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
        Complete your system history to unlock your personalized maintenance forecast and 3-year cost estimate.
      </p>
      <button
        onClick={onAddHistory}
        className="rounded-xl px-6 py-2.5 text-sm font-extrabold transition-opacity hover:opacity-80"
        style={{ background: '#4BBDB5', color: '#0a0d14' }}
      >
        Add Your First System →
      </button>
    </div>
  );
}

// ── Main ForecastPanel ────────────────────────────────────────────────────────
export default function ForecastPanel({ items, onAddHistory }) {
  // Separate urgency buckets for layout
  const urgentItems = useMemo(
    () => items.filter(i => i.urgency !== 'recurring'),
    [items]
  );
  const recurringItems = useMemo(
    () => items.filter(i => i.urgency === 'recurring'),
    [items]
  );

  // 3-year budget: overdue + soon items only
  const budgetItems = items.filter(i => i.urgency === 'overdue' || i.urgency === 'soon');
  const budgetLow  = budgetItems.reduce((sum, i) => sum + i.cost_low, 0);
  const budgetHigh = budgetItems.reduce((sum, i) => sum + i.cost_high, 0);

  const hasSystemData = urgentItems.length > 0;

  if (!hasSystemData && recurringItems.length === 0) {
    return <ForecastTeaser onAddHistory={onAddHistory} />;
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0e1118', border: '1px solid rgba(75,189,181,0.2)' }}
    >
      {/* Section header */}
      <div className="px-6 py-4" style={{ background: 'rgba(75,189,181,0.08)', borderBottom: '1px solid rgba(75,189,181,0.15)' }}>
        <h2 className="text-lg font-extrabold text-[#e2e8f0]">🔮 What's Coming Next</h2>
        <p className="text-sm text-gray-400 mt-0.5">Based on your documented system history</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Budget summary bar */}
        {budgetItems.length > 0 && (
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            style={{ background: 'rgba(212,168,58,0.08)', border: '1px solid rgba(212,168,58,0.25)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#D4A83A' }}>
                Estimated 3-Year Maintenance Budget
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Overdue + next 2 years combined</p>
            </div>
            <p className="text-xl font-extrabold" style={{ color: '#D4A83A' }}>
              {formatCost(budgetLow, budgetHigh)}
            </p>
          </div>
        )}

        {/* Major system replacements */}
        {urgentItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Major Systems</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentItems.map((item, i) => (
                <ForecastCard key={`${item.system}-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Annual maintenance */}
        {recurringItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Recurring Maintenance</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recurringItems.map((item, i) => (
                <ForecastCard key={`maint-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* No urgent items teaser */}
        {urgentItems.length === 0 && (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(75,189,181,0.06)', border: '1px solid rgba(75,189,181,0.2)' }}
          >
            <p className="text-sm text-[#4BBDB5] font-bold">✅ No major replacements due in the next 5 years</p>
            <p className="text-xs text-gray-500 mt-1">Keep up with your annual maintenance below to stay ahead.</p>
          </div>
        )}
      </div>
    </div>
  );
}
