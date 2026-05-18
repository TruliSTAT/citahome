/**
 * CitaHome Report Builder
 * Assembles a CitaHomeReport from raw service_records for a property.
 */

const SYSTEM_PATTERNS = {
  hvac: /hvac|heating|cooling|air.?condition|furnace|ac\b/i,
  roof: /roof|shingle/i,
  water_heater: /water.?heat|plumb/i,
  electrical: /electric|panel/i,
};

/**
 * Compute system ages from service records.
 * Returns { hvac: "~3 years", roof: "Unknown", ... }
 */
function computeSystemAges(records) {
  const now = new Date();
  const result = {};

  for (const [system, pattern] of Object.entries(SYSTEM_PATTERNS)) {
    const matches = records
      .filter(r => r.trade && pattern.test(r.trade))
      .filter(r => r.service_date)
      .sort((a, b) => new Date(a.service_date) - new Date(b.service_date));

    if (matches.length === 0) {
      result[system] = 'Unknown';
    } else {
      const earliest = new Date(matches[0].service_date);
      const years = Math.floor((now - earliest) / (365.25 * 24 * 3600 * 1000));
      result[system] = years === 0 ? '< 1 year' : `~${years} year${years !== 1 ? 's' : ''}`;
    }
  }

  return result;
}

/**
 * Detect red flags in a set of service records.
 * Returns array of { type, message, record_id? }
 */
function detectRedFlags(records) {
  const flags = [];
  const now = new Date();
  const ninetyDaysAgo = new Date(now - 90 * 24 * 3600 * 1000);
  const oneYearAgo = new Date(now - 365 * 24 * 3600 * 1000);

  // Open permits older than 90 days
  for (const r of records) {
    if (r.permit_status === 'open' && r.service_date) {
      const svcDate = new Date(r.service_date);
      if (svcDate < ninetyDaysAgo) {
        flags.push({
          type: 'open_permit',
          message: `Open permit (${r.permit_number || 'unknown'}) on ${r.trade || 'unknown trade'} from ${r.service_date}`,
          record_id: r.id,
        });
      }
    }
  }

  // Same trade 3+ times in 12 months (recurring issue)
  const tradeCounts = {};
  for (const r of records) {
    if (r.trade && r.service_date && new Date(r.service_date) >= oneYearAgo) {
      const trade = r.trade.toLowerCase();
      tradeCounts[trade] = (tradeCounts[trade] || 0) + 1;
    }
  }
  for (const [trade, count] of Object.entries(tradeCounts)) {
    if (count >= 3) {
      flags.push({
        type: 'recurring_issue',
        message: `${trade} has been serviced ${count} times in the last 12 months — possible recurring issue`,
      });
    }
  }

  // Unverified operators (no rating)
  const unverified = records.filter(r => r.source === 'citapros' && !r.operator_rating);
  if (unverified.length > 0) {
    flags.push({
      type: 'unverified_operator',
      message: `${unverified.length} service record${unverified.length !== 1 ? 's' : ''} from unverified or unrated operator${unverified.length !== 1 ? 's' : ''}`,
    });
  }

  return flags;
}

/**
 * Build the full CitaHome report object.
 * @param {Object} property  - property row from DB
 * @param {Array}  records   - all service_records for this property
 * @param {boolean} previewOnly - if true, return only first 3 records
 */
function buildReport(property, records, previewOnly = false) {
  const sorted = [...records].sort((a, b) => {
    if (!a.service_date) return 1;
    if (!b.service_date) return -1;
    return new Date(b.service_date) - new Date(a.service_date);
  });

  const openPermits = records.filter(r => r.permit_status === 'open');
  const redFlags = detectRedFlags(records);
  const systemAges = computeSystemAges(records);

  const verifiedOperators = new Set(
    records.filter(r => r.operator_name && r.operator_rating).map(r => r.operator_name)
  );

  const lastService = sorted.find(r => r.service_date)?.service_date || null;

  const timeline = previewOnly ? sorted.slice(0, 3) : sorted;

  return {
    property: {
      id: property.id,
      address: property.address_raw,
      city: property.city,
      state: property.state,
      zip: property.zip,
    },
    summary: {
      total_jobs: records.length,
      verified_operators: verifiedOperators.size,
      open_permits: openPermits.length,
      last_service: lastService,
      system_ages: systemAges,
    },
    timeline,
    open_permits: openPermits,
    red_flags: redFlags,
    preview_only: previewOnly,
    total_records: records.length,
  };
}

module.exports = { buildReport, detectRedFlags, computeSystemAges };
