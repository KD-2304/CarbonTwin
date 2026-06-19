/**
 * Cookie Helper — Utility function for parsing HTTP cookie headers.
 */

/**
 * Parses the raw HTTP Cookie header into a key-value object.
 * @param {string|undefined} cookieHeader - The raw Cookie header from req.headers.cookie
 * @returns {Object} An object mapping cookie names to decoded values.
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  return cookieHeader.split(';').reduce((acc, c) => {
    const eqIdx = c.indexOf('=');
    if (eqIdx !== -1) {
      const key = c.slice(0, eqIdx).trim();
      const val = c.slice(eqIdx + 1).trim();
      if (key) {
        try {
          acc[key] = decodeURIComponent(val);
        } catch (e) {
          // If decoding fails, fallback to raw value
          acc[key] = val;
        }
      }
    }
    return acc;
  }, {});
}

module.exports = {
  parseCookies
};
