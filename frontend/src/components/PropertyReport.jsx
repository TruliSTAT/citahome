import React from 'react';
import ReportSummary from './ReportSummary.jsx';
import ReportTimeline from './ReportTimeline.jsx';
import GrowingReportNote from './GrowingReportNote.jsx';
import PaywallGate from './PaywallGate.jsx';

function RedFlagCard({ flag }) {
  const icons = {
    open_permit: '⚠️',
    recurring_issue: '🔁',
    unverified_operator: '❓',
  };
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
      <span className="text-xl mt-0.5">{icons[flag.type] || '⚠️'}</span>
      <p className="text-red-800 text-sm">{flag.message}</p>
    </div>
  );
}

export default function PropertyReport({ report, onUnlocked }) {
  if (!report) return null;

  const { property, summary, timeline, red_flags, open_permits, preview_only, total_records } = report;

  const address = [property.address, property.city, property.state, property.zip]
    .filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Address header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{property.address}</h1>
            {(property.city || property.state) && (
              <p className="text-gray-500 mt-1">
                {[property.city, property.state, property.zip].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          {open_permits && open_permits.length > 0 && (
            <span className="bg-red-100 text-red-800 border border-red-300 text-sm font-semibold px-3 py-1 rounded-full">
              {open_permits.length} Open Permit{open_permits.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Growing note if sparse */}
      <GrowingReportNote recordCount={total_records} />

      {/* Summary stats + system ages */}
      <ReportSummary summary={summary} />

      {/* Red flags */}
      {red_flags && red_flags.length > 0 && (
        <div className="card border-red-200">
          <h2 className="text-base font-bold text-red-800 mb-3 flex items-center gap-2">
            <span>🚩</span> Red Flags ({red_flags.length})
          </h2>
          <div className="space-y-2">
            {red_flags.map((flag, i) => (
              <RedFlagCard key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Service Timeline */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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

      {/* Paywall for locked records */}
      {preview_only && total_records > 3 && (
        <PaywallGate
          propertyId={property.id}
          address={address}
          onUnlocked={onUnlocked}
        />
      )}

      {/* CTA if no records */}
      {total_records === 0 && !preview_only && (
        <div className="text-center py-6">
          <p className="text-gray-500">No service records found for this property.</p>
          <p className="text-sm text-gray-400 mt-1">Records appear here as CitaPros operators complete verified jobs at this address.</p>
        </div>
      )}
    </div>
  );
}
