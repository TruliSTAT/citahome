/**
 * CitaHome → Forclos Bridge
 * Checks a normalized address against the Forclos public records database.
 * Fails silently — a Forclos outage must never block a CitaHome report.
 */

const FORCLOS_API_URL = process.env.FORCLOS_API_URL || 'https://forclos.com';
const FORCLOS_INTERNAL_KEY = process.env.FORCLOS_INTERNAL_KEY || '';

/**
 * Check whether an address has any Forclos distress records.
 * @param {string} addressNorm - normalized address string (from property.address_norm or address_raw)
 * @returns {Promise<{found: boolean, count: number, records: Array}|null>}
 *          Returns null on any error (network, timeout, non-200) — caller should treat null as "no data".
 */
async function checkAddress(addressNorm) {
  if (!addressNorm) return null;

  try {
    const resp = await fetch(`${FORCLOS_API_URL}/api/internal/address-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': FORCLOS_INTERNAL_KEY,
      },
      body: JSON.stringify({ address: addressNorm }),
      signal: AbortSignal.timeout(3000), // never block a CitaHome report for more than 3s
    });

    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    // Timeout, network error, or parse failure — fail silently
    return null;
  }
}

module.exports = { checkAddress };
