const { getDB, ensureInit } = require('./lib/db');
const { requireAuth } = require('./lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

function ok(data, status = 200) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(data) };
}
function err(msg, status = 400) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error: msg }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (!requireAuth(event)) return err('Unauthorized', 401);

  const db = getDB();
  await ensureInit();

  const method = event.httpMethod;

  if (method === 'GET') {
    const itemId = event.queryStringParameters?.item_id;
    if (!itemId) return err('item_id required');
    const rows = await db`
      SELECT * FROM item_interests WHERE item_id = ${itemId} ORDER BY created_at DESC
    `;
    return ok(rows);
  }

  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.item_id) return err('item_id required');
    if (!body.name?.trim()) return err('name required');

    const [row] = await db`
      INSERT INTO item_interests (item_id, name, platform, notes, status)
      VALUES (
        ${body.item_id},
        ${body.name.trim()},
        ${body.platform ?? null},
        ${body.notes?.trim() || null},
        ${'interested'}
      )
      RETURNING *
    `;
    return ok(row, 201);
  }

  if (method === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.id) return err('id required');

    const [row] = await db`
      UPDATE item_interests SET
        name     = ${body.name},
        platform = ${body.platform ?? null},
        notes    = ${body.notes ?? null},
        status   = ${body.status}
      WHERE id = ${body.id}
      RETURNING *
    `;
    if (!row) return err('Not found', 404);
    return ok(row);
  }

  if (method === 'DELETE') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.id) return err('id required');
    await db`DELETE FROM item_interests WHERE id = ${body.id}`;
    return ok({ success: true });
  }

  return err('Method not allowed', 405);
};
