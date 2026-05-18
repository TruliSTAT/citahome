/**
 * Address normalization for CitaHome fuzzy matching.
 * Strips punctuation, expands abbreviations, uppercases — good enough for v1.
 */
function normalize(address) {
  if (!address) return '';
  return address
    .toUpperCase()
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bCIRCLE\b/g, 'CIR')
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse address string into components (best-effort for v1).
 * Returns { city, state, zip } extracted from the end of the string.
 */
function parseComponents(address) {
  if (!address) return { city: null, state: null, zip: null };
  // Match "City, ST 12345" or "City, ST" at end of string
  const match = address.match(/,?\s*([A-Za-z\s]+),?\s*([A-Z]{2})\s*(\d{5})?$/);
  if (match) {
    return {
      city: match[1] ? match[1].trim() : null,
      state: match[2] || null,
      zip: match[3] || null,
    };
  }
  return { city: null, state: null, zip: null };
}

module.exports = { normalize, parseComponents };
