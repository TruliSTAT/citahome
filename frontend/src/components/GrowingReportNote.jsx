import React from 'react';

export default function GrowingReportNote({ recordCount = 0 }) {
  if (recordCount >= 5) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl p-4 text-sm border" style={{ background: 'rgba(75,189,181,0.07)', borderColor: 'rgba(75,189,181,0.2)' }}>
      <span className="text-2xl mt-0.5 flex-shrink-0" aria-hidden>🌱</span>
      <div>
        <p className="font-semibold text-brand mb-1">This report is still growing</p>
        <p className="text-gray-400 leading-relaxed">
          Your CitaHome report grows as verified work is completed at this address.
          As more operators complete jobs through CitaPros and permits are filed through CitaTodo,
          your property history gets richer and more complete.
        </p>
        {recordCount === 0 && (
          <p className="mt-2 text-brand font-medium">
            No records yet — be the first to add verified work at this address.
          </p>
        )}
      </div>
    </div>
  );
}
