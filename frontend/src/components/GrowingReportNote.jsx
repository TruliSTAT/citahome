import React from 'react';

export default function GrowingReportNote({ recordCount = 0 }) {
  if (recordCount >= 5) return null;

  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
      <span className="text-2xl mt-0.5" aria-hidden>🌱</span>
      <div>
        <p className="font-semibold text-blue-800 mb-1">This report is still growing</p>
        <p className="text-blue-700">
          Your CitaHome report grows as verified work is completed at this address.
          As more operators complete jobs through CitaPros and permits are filed through CitaTodo,
          your property history gets richer and more complete.
        </p>
        {recordCount === 0 && (
          <p className="mt-2 text-blue-600 font-medium">
            No records yet — be the first to add verified work at this address.
          </p>
        )}
      </div>
    </div>
  );
}
