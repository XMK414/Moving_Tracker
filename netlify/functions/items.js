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
  const action = event.queryStringParameters?.action;

  if (method === 'GET') {
    const rows = await db`
      SELECT i.*,
             COUNT(ii.id)::int AS interest_count
      FROM   items i
      LEFT JOIN item_interests ii ON ii.item_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;
    return ok(rows);
  }

  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }

    if (action === 'bulk') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) return ok([]);
      if (items.length > 200) return err('Max 200 items per bulk import');
      const results = [];
      for (const item of items) {
        if (!item.name?.trim()) continue;
        const [row] = await db`
          INSERT INTO items (name, price_type, price_amount, price_max, notes, location)
          VALUES (
            ${item.name.trim()},
            ${item.price_type || 'priced'},
            ${item.price_amount ?? null},
            ${item.price_max ?? null},
            ${item.notes?.trim() || null},
            ${item.location?.trim() || null}
          )
          RETURNING *
        `;
        results.push({ ...row, interest_count: 0 });
      }
      return ok(results, 201);
    }

    // Single item
    if (!body.name?.trim()) return err('name is required');
    const [row] = await db`
      INSERT INTO items (name, price_type, price_amount, price_max, notes, location)
      VALUES (
        ${body.name.trim()},
        ${body.price_type || 'priced'},
        ${body.price_amount ?? null},
        ${body.price_max ?? null},
        ${body.notes?.trim() || null},
        ${body.location?.trim() || null}
      )
      RETURNING *
    `;
    return ok({ ...row, interest_count: 0 }, 201);
  }

  if (method === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.id) return err('id required');

    const [row] = await db`
      UPDATE items SET
        name           = ${body.name},
        price_type     = ${body.price_type},
        price_amount   = ${body.price_amount ?? null},
        price_max      = ${body.price_max ?? null},
        notes          = ${body.notes ?? null},
        status         = ${body.status},
        location       = ${body.location ?? null},
        claimed_by     = ${body.claimed_by ?? null},
        claim_platform = ${body.claim_platform ?? null},
        claim_notes    = ${body.claim_notes ?? null},
        reminder_at    = ${body.reminder_at ?? null},
        reminder_sent  = ${body.reminder_sent ?? false},
        updated_at     = NOW()
      WHERE id = ${body.id}
      RETURNING *
    `;
    if (!row) return err('Item not found', 404);

    const [{ interest_count }] = await db`
      SELECT COUNT(*)::int AS interest_count FROM item_interests WHERE item_id = ${body.id}
    `;
    return ok({ ...row, interest_count });
  }

  if (method === 'DELETE') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return err('Bad JSON'); }
    if (!body.id) return err('id required');

    await db`DELETE FROM items WHERE id = ${body.id}`;
    return ok({ success: true });
  }

  return err('Method not allowed', 405);
};
