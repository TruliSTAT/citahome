import React from 'react';

function StatBadge({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-4 ${colors[color]}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium mt-1 text-center">{label}</span>
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
        <StatBadge label="Service Records" value={total_jobs} color="blue" />
        <StatBadge label="Verified Operators" value={verified_operators} color="green" />
        <StatBadge
          label="Open Permits"
          value={open_permits}
          color={open_permits > 0 ? 'red' : 'green'}
        />
        <StatBadge
          label="Last Service"
          value={last_service ? new Date(last_service).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
          color="gray"
        />
      </div>

      {/* System ages */}
      {system_ages && Object.keys(system_ages).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">System Age Estimates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(system_ages).map(([system, age]) => (
              <div key={system} className="text-center">
                <div className="text-sm font-bold text-gray-800">{age}</div>
                <div className="text-xs text-gray-500 capitalize">{system.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
