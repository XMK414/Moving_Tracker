const { getDB, ensureInit } = require('./lib/db');
const { requireAuth } = require('./lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function ok(data) { return { statusCode: 200, headers: CORS, body: JSON.stringify(data) }; }
function err(msg, s = 400) { return { statusCode: s, headers: CORS, body: JSON.stringify({ error: msg }) }; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (!requireAuth(event)) return err('Unauthorized', 401);

  const db = getDB();
  await ensureInit();

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }

    const { subscription } = body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return err('Invalid push subscription object');
    }

    await db`
      INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth)
      VALUES (${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET keys_p256dh = EXCLUDED.keys_p256dh, keys_auth = EXCLUDED.keys_auth
    `;
    return ok({ success: true });
  }

  if (event.httpMethod === 'DELETE') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.endpoint) return err('endpoint required');
    await db`DELETE FROM push_subscriptions WHERE endpoint = ${body.endpoint}`;
    return ok({ success: true });
  }

  return err('Method not allowed', 405);
};
