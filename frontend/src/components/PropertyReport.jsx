import React from 'react';
import ReportSummary from './ReportSummary.jsx';
import ReportTimeline from './ReportTimeline.jsx';
import GrowingReportNote from './GrowingReportNote.jsx';
import PaywallGate from './PaywallGate.jsx';

function RedFlagCard({ flag }) {
  const icons = {
    open_permit:          '⚠️',
    recurring_issue:      '🔁',
    unverified_operator:  '❓',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
      <span className="text-xl mt-0.5 flex-shrink-0">{icons[flag.type] || '⚠️'}</span>
      <p className="text-red-300 text-sm leading-relaxed">{flag.message}</p>
    </div>
  );
}

function DistressFlag({ distressFlags }) {
  if (!distressFlags?.found) return null;
  return (
    <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-amber-400 text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">Distressed Property Alert</p>
          <p className="text-amber-200/80 text-sm mt-1">{distressFlags.message}</p>
          <p className="text-amber-200/60 text-xs mt-2">
            Source: Forclos public records database. Verify with a title company before making an offer.
          </p>
          <a
            href="https://forclos.com"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 text-xs underline mt-1 inline-block"
          >
            View full Forclos report →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PropertyReport({ report, onUnlocked }) {
  if (!report) return null;

  const { property, summary, timeline, red_flags, open_permits, preview_only, total_records, distress_flags } = report;

  const address = [property.address, property.city, property.state, property.zip]
    .filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Address header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#e2e8f0]">{property.address}</h1>
            {(property.city || property.state) && (
              <p className="text-gray-400 mt-1">
                {[property.city, property.state, property.zip].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          {open_permits && open_permits.length > 0 && (
            <span className="text-sm font-bold px-3 py-1 rounded-full border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
              {open_permits.length} Open Permit{open_permits.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Growing note */}
      <GrowingReportNote recordCount={total_records} />

      {/* Summary stats */}
      <ReportSummary summary={summary} />

      {/* Distress flags (Forclos bridge) */}
      <DistressFlag distressFlags={distress_flags} />

      {/* Red flags */}
      {red_flags && red_flags.length > 0 && (
        <div className="card">
          <h2 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
            <span>🚩</span> Red Flags ({red_flags.length})
          </h2>
          <div className="space-y-3">
            {red_flags.map((flag, i) => (
              <RedFlagCard key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Service Timeline */}
      <div>
        <h2 className="text-lg font-bold text-[#e2e8f0] mb-5 flex items-center gap-2">
          <span>📋</span> Service Timeline
          {total_records > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({preview_only ? `Showing 3 of ${total_records}` : `${total_records} records`})
            </span>
          )}
        </h2>
        <ReportTimeline
          records={timeline}
          previewOnly={preview_only}
          totalRecords={total_records}
        />
      </div>

      {/* Paywall */}
      {preview_only && total_records > 3 && (
        <PaywallGate
          propertyId={property.id}
          address={address}
          onUnlocked={onUnlocked}
        />
      )}

      {/* Empty state */}
      {total_records === 0 && !preview_only && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400">No service records found for this property yet.</p>
          <p className="text-sm text-gray-600 mt-2">Records appear here as CitaPros operators complete verified jobs at this address.</p>
        </div>
      )}
    </div>
  );
}
