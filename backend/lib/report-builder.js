/**
 * CitaHome Report Builder
 * Assembles a CitaHomeReport from raw service_records for a property.
 */

// ── Predictive Maintenance Engine ───────────────────────────────────────────

const SYSTEM_LIFESPANS = {
  hvac:         { lifespan: 15, cost_low: 3500,  cost_high: 7500,  trade: 'hvac',               label: 'HVAC System Replacement' },
  roof:         { lifespan: 25, cost_low: 8000,  cost_high: 18000, trade: 'roofing',            label: 'Roof Replacement' },
  water_heater: { lifespan: 12, cost_low: 800,   cost_high: 1800,  trade: 'plumbing',           label: 'Water Heater Replacement' },
  electrical:   { lifespan: 40, cost_low: 3000,  cost_high: 8000,  trade: 'electrical',         label: 'Electrical Panel Upgrade' },
  plumbing:     { lifespan: 50, cost_low: 2000,  cost_high: 6000,  trade: 'plumbing',           label: 'Plumbing Repiping' },
  appliances:   { lifespan: 10, cost_low: 500,   cost_high: 2500,  trade: 'appliance',          label: 'Appliance Replacement' },
  flooring:     { lifespan: 20, cost_low: 3000,  cost_high: 9000,  trade: 'flooring',           label: 'Flooring Replacement' },
  siding:       { lifespan: 20, cost_low: 6000,  cost_high: 14000, trade: 'siding',             label: 'Siding Replacement' },
  windows:      { lifespan: 20, cost_low: 4000,  cost_high: 12000, trade: 'window-replacement', label: 'Window Replacement' },
};

const ANNUAL_MAINTENANCE = [
  { label: 'HVAC Annual Tune-Up',  trade: 'hvac',      cost_low: 150, cost_high: 300, every_years: 1 },
  { label: 'Roof Inspection',      trade: 'roofing',   cost_low: 150, cost_high: 400, every_years: 3 },
  { label: 'Pest Inspection',      trade: 'pest',      cost_low: 100, cost_high: 250, every_years: 1 },
  { label: 'Gutter Cleaning',      trade: 'gutters',   cost_low: 100, cost_high: 200, every_years: 1 },
  { label: 'Chimney Inspection',   trade: 'chimney',   cost_low: 150, cost_high: 300, every_years: 2 },
  { label: 'Water Heater Flush',   trade: 'plumbing',  cost_low: 75,  cost_high: 150, every_years: 1 },
];

/**
 * Build a 3-year maintenance + replacement forecast.
 * @param {Object} systemAges  - { hvac: 2018, roof: 2015, ... } install years as integers
 * @param {number} currentYear - typically new Date().getFullYear()
 * @returns {Array} forecast items sorted by urgency (years_until_due asc)
 */
function buildForecast(systemAges, currentYear) {
  const items = [];
  const now = currentYear || new Date().getFullYear();

  for (const [system, info] of Object.entries(SYSTEM_LIFESPANS)) {
    const installYear = systemAges[system];
    if (!installYear) continue;

    const age = now - installYear;
    const years_until_due = Math.max(0, info.lifespan - age);
    const urgency =
      years_until_due <= 0 ? 'overdue' :
      years_until_due <= 2 ? 'soon' :
      years_until_due <= 5 ? 'watch' : 'ok';

    if (urgency !== 'ok') {
      items.push({
        system,
        label: info.label,
        trade: info.trade,
        install_year: installYear,
        age_years: age,
        lifespan: info.lifespan,
        years_until_due,
        urgency,
        cost_low: info.cost_low,
        cost_high: info.cost_high,
        citapros_url: `https://${info.trade}.citapros.com`,
      });
    }
  }

  // Add recurring annual maintenance items
  for (const item of ANNUAL_MAINTENANCE) {
    items.push({
      system: 'maintenance',
      label: item.label,
      trade: item.trade,
      years_until_due: item.every_years,
      urgency: 'recurring',
      cost_low: item.cost_low,
      cost_high: item.cost_high,
      citapros_url: `https://${item.trade}.citapros.com`,
    });
  }

  return items.sort((a, b) => a.years_until_due - b.years_until_due);
}

// ── System Pattern Matching ──────────────────────────────────────────────────

const SYSTEM_PATTERNS = {
  hvac: /hvac|heating|cooling|air.?condition|furnace|ac\b/i,
  roof: /roof|shingle/i,
  water_heater: /water.?heat|plumb/i,
  electrical: /electric|panel/i,
};

/**
 * Compute system ages from service records.
 * Returns { hvac: "~3 years", roof: "Unknown", ... } — human-readable labels
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
 * Compute raw install years from service records.
 * Returns { hvac: 2018, roof: null, ... } — integer years for forecast engine
 */
function computeSystemAgesRaw(records) {
  const result = {};

  for (const [system, pattern] of Object.entries(SYSTEM_PATTERNS)) {
    const matches = records
      .filter(r => r.trade && pattern.test(r.trade))
      .filter(r => r.service_date)
      .sort((a, b) => new Date(a.service_date) - new Date(b.service_date));

    if (matches.length === 0) {
      result[system] = null;
    } else {
      result[system] = new Date(matches[0].service_date).getFullYear();
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
  const systemAgesRaw = computeSystemAgesRaw(records);

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
      system_ages_raw: systemAgesRaw,
    },
    timeline,
    open_permits: openPermits,
    red_flags: redFlags,
    preview_only: previewOnly,
    total_records: records.length,
  };
}

module.exports = { buildReport, buildForecast, detectRedFlags, computeSystemAges, computeSystemAgesRaw };
