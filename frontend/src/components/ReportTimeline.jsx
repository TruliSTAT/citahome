import React from 'react';

const TRADE_ICONS = {
  hvac: '❄️',
  heating: '🔥',
  cooling: '❄️',
  roof: '🏠',
  plumb: '🔧',
  electric: '⚡',
  paint: '🎨',
  landscap: '🌿',
  pest: '🐛',
  pool: '🏊',
  flooring: '🪵',
  default: '🔨',
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
    open: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    closed: 'bg-green-100 text-green-800 border border-green-300',
    failed: 'bg-red-100 text-red-800 border border-red-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.open}`}>
      Permit: {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-gray-400">Unrated</span>;
  const full = Math.round(rating);
  return (
    <span className="text-yellow-500 text-sm">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span className="text-gray-500 text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function TimelineCard({ record, index, blurred }) {
  const date = record.service_date
    ? new Date(record.service_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date unknown';

  const sourceBadge = record.source === 'citapros'
    ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">CitaPros Verified</span>
    : <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Permit Record</span>;

  return (
    <div className={`relative flex gap-4 ${blurred ? 'select-none pointer-events-none' : ''}`}
      style={blurred ? { filter: 'blur(4px)' } : {}}>
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-brand-300 flex items-center justify-center text-lg flex-shrink-0">
          {getTradeIcon(record.trade)}
        </div>
        <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
      </div>

      {/* Card */}
      <div className="flex-1 card mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <span className="font-semibold text-gray-800 capitalize">
              {record.trade || 'General Service'}
            </span>
            <span className="ml-2 text-gray-500 text-sm">{date}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {sourceBadge}
            {record.permit_status && <PermitBadge status={record.permit_status} />}
          </div>
        </div>

        {record.description && (
          <p className="text-gray-600 text-sm mb-2">{record.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {record.operator_name && (
            <span className="text-gray-700">
              <span className="font-medium">Operator:</span> {record.operator_name}
            </span>
          )}
          {record.operator_rating !== null && record.operator_rating !== undefined && (
            <StarRating rating={record.operator_rating} />
          )}
          {record.permit_number && (
            <span className="text-gray-500 text-xs">Permit #{record.permit_number}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportTimeline({ records, previewOnly, totalRecords }) {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-gray-500">No service records found yet for this property.</p>
      </div>
    );
  }

  const lockedCount = previewOnly ? Math.max(0, totalRecords - records.length) : 0;

  return (
    <div>
      {records.map((record, i) => (
        <TimelineCard key={record.id || i} record={record} index={i} blurred={false} />
      ))}
      {/* Ghost blurred cards to show there's more */}
      {previewOnly && lockedCount > 0 && (
        <>
          {[...Array(Math.min(lockedCount, 2))].map((_, i) => (
            <TimelineCard
              key={`ghost-${i}`}
              record={{
                trade: 'HVAC Service',
                description: 'Verified service record — unlock to view details',
                service_date: '2024-06-15',
                operator_name: 'Verified Operator',
                operator_rating: 4.8,
                source: 'citapros',
              }}
              index={records.length + i}
              blurred={true}
            />
          ))}
        </>
      )}
    </div>
  );
}
