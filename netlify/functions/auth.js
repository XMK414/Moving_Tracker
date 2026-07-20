const { isRateLimited, clearAttempts, makeToken } = require('./lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: '{}' };

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: CORS,
      body: JSON.stringify({ error: 'Too many attempts. Try again in 15 minutes.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const { passcode } = body;
  if (!passcode || typeof passcode !== 'string') {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Passcode required' }) };
  }

  const expected = process.env.PASSCODE;
  if (!expected) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const pass = Buffer.from(passcode.slice(0, 256));
  const exp = Buffer.from(expected.slice(0, 256));
  const match =
    pass.length === exp.length &&
    require('crypto').timingSafeEqual(
      Buffer.concat([pass, Buffer.alloc(Math.max(0, 256 - pass.length))]).slice(0, 256),
      Buffer.concat([exp, Buffer.alloc(Math.max(0, 256 - exp.length))]).slice(0, 256)
    );

  if (!match) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Wrong passcode' }) };
  }

  clearAttempts(ip);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ token: makeToken() }) };
};
