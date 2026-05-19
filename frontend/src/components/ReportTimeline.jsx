import React from 'react';

const TRADE_ICONS = {
  hvac:      '❄️',
  heating:   '🔥',
  cooling:   '❄️',
  roof:      '🏠',
  plumb:     '🔧',
  electric:  '⚡',
  paint:     '🎨',
  landscap:  '🌿',
  pest:      '🐛',
  pool:      '🏊',
  flooring:  '🪵',
  default:   '🔨',
};

function getTradeIcon(trade) {
  if (!trade) return TRADE_ICONS.default;
  const t = trade.toLowerCase();
  for (const [key, icon] of Object.entries(TRADE_ICONS)) {
    if (key !== 'default' && t.includes(key)) return icon;
  }
  return TRADE_ICONS.default;
}

function PermitBadge({ status }) {
  if (!status) return null;
  const styles = {
    open:   { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.3)',   text: '#facc15' },
    closed: { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  text: '#4ade80' },
    failed: { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  text: '#f87171' },
  };
  const s = styles[status] || styles.open;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{ background: s.bg, borderColor: s.border, color: s.text }}>
      Permit: {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-gray-600">Unrated</span>;
  const full = Math.round(rating);
  return (
    <span className="text-sm">
      <span style={{ color: '#D4A83A' }}>{'★'.repeat(full)}</span>
      <span className="text-gray-700">{'☆'.repeat(5 - full)}</span>
      <span className="text-gray-500 text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function TimelineCard({ record, blurred }) {
  const date = record.service_date
    ? new Date(record.service_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date unknown';

  const sourceBadge = record.source === 'citapros'
    ? (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{ background: 'rgba(75,189,181,0.1)', borderColor: 'rgba(75,189,181,0.25)', color: '#4BBDB5' }}>
        CitaPros Verified
      </span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{ background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.25)', color: '#c084fc' }}>
        Permit Record
      </span>
    );

  return (
    <div
      className={`relative flex gap-4 ${blurred ? 'select-none pointer-events-none' : ''}`}
      style={blurred ? { filter: 'blur(5px)' } : {}}
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
          style={{ background: 'rgba(75,189,181,0.1)', borderColor: 'rgba(75,189,181,0.3)' }}
        >
          {getTradeIcon(record.trade)}
        </div>
        <div className="w-px flex-1 mt-2" style={{ background: '#161c28' }} />
      </div>

      {/* Card */}
      <div className="flex-1 card mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <span className="font-semibold text-[#e2e8f0] capitalize">
              {record.trade || 'General Service'}
            </span>
            <span className="ml-2 text-gray-500 text-sm">{date}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sourceBadge}
            {record.permit_status && <PermitBadge status={record.permit_status} />}
          </div>
        </div>

        {record.description && (
          <p className="text-gray-400 text-sm mb-3 leading-relaxed">{record.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {record.operator_name && (
            <span className="text-gray-400">
              <span className="font-medium text-gray-300">Operator:</span> {record.operator_name}
            </span>
          )}
          {record.operator_rating != null && (
            <StarRating rating={record.operator_rating} />
          )}
          {record.permit_number && (
            <span className="text-gray-600 text-xs">Permit #{record.permit_number}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportTimeline({ records, previewOnly, totalRecords }) {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-5xl mb-3">📋</div>
        <p>No service records found yet for this property.</p>
      </div>
    );
  }

  const lockedCount = previewOnly ? Math.max(0, totalRecords - records.length) : 0;

  return (
    <div>
      {records.map((record, i) => (
        <TimelineCard key={record.id || i} record={record} blurred={false} />
      ))}
      {previewOnly && lockedCount > 0 && (
        <>
          {[...Array(Math.min(lockedCount, 2))].map((_, i) => (
            <TimelineCard
              key={`ghost-${i}`}
              record={{
                trade:           'HVAC Service',
                description:     'Verified service record — unlock to view full details',
                service_date:    '2024-06-15',
                operator_name:   'Verified Operator',
                operator_rating: 4.8,
                source:          'citapros',
              }}
              blurred={true}
            />
          ))}
        </>
      )}
    </div>
  );
}
