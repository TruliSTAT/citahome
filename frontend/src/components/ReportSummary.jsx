import React from 'react';

function StatBadge({ label, value, variant = 'default' }) {
  const styles = {
    default: { bg: '#0e1118',                     border: '#161c28',                    val: '#e2e8f0',    lbl: '#6b7280' },
    teal:    { bg: 'rgba(75,189,181,0.08)',        border: 'rgba(75,189,181,0.25)',       val: '#4BBDB5',    lbl: '#4BBDB5' },
    green:   { bg: 'rgba(34,197,94,0.08)',         border: 'rgba(34,197,94,0.2)',         val: '#4ade80',    lbl: '#4ade80' },
    red:     { bg: 'rgba(239,68,68,0.08)',         border: 'rgba(239,68,68,0.2)',         val: '#f87171',    lbl: '#f87171' },
    gold:    { bg: 'rgba(212,168,58,0.08)',        border: 'rgba(212,168,58,0.2)',        val: '#D4A83A',    lbl: '#D4A83A' },
  };
  const s = styles[variant] || styles.default;
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl p-4 border"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <span className="text-2xl font-extrabold" style={{ color: s.val }}>{value}</span>
      <span className="text-xs font-medium mt-1 text-center" style={{ color: s.lbl }}>{label}</span>
    </div>
  );
}

export default function ReportSummary({ summary }) {
  if (!summary) return null;

  const { total_jobs, verified_operators, open_permits, last_service, system_ages } = summary;

  return (
    <div className="space-y-4">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="Service Records"    value={total_jobs}          variant="teal"  />
        <StatBadge label="Verified Operators" value={verified_operators}  variant="green" />
        <StatBadge
          label="Open Permits"
          value={open_permits}
          variant={open_permits > 0 ? 'red' : 'green'}
        />
        <StatBadge
          label="Last Service"
          value={last_service
            ? new Date(last_service).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Unknown'}
          variant="default"
        />
      </div>

      {/* System ages */}
      {system_ages && Object.keys(system_ages).length > 0 && (
        <div className="card">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">System Age Estimates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(system_ages).map(([system, age]) => (
              <div key={system} className="text-center">
                <div className="text-sm font-bold text-[#e2e8f0]">{age}</div>
                <div className="text-xs text-gray-500 capitalize mt-0.5">{system.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
