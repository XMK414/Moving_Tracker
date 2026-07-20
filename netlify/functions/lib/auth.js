const crypto = require('crypto');

// In-memory rate limit — per Lambda instance, resets on cold start.
const _attempts = new Map();
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  let rec = _attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    _attempts.set(ip, rec);
  }
  rec.count += 1;
  return rec.count > LIMIT;
}

function clearAttempts(ip) {
  _attempts.delete(ip);
}

function makeToken() {
  return crypto
    .createHmac('sha256', process.env.PASSCODE || '')
    .update('moving-tracker-v1')
    .digest('hex');
}

function validateToken(token) {
  if (!token || typeof token !== 'string' || token.length !== 64) return false;
  const expected = makeToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function requireAuth(event) {
  const auth = (event.headers.authorization || event.headers.Authorization || '').trim();
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return validateToken(token);
}

module.exports = { isRateLimited, clearAttempts, makeToken, requireAuth };
