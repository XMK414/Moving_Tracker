const { neon } = require('@neondatabase/serverless');

let _sql = null;
let _initialized = false;

function getDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Run via `netlify dev` or provision Netlify Database.');
  }
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

async function ensureInit() {
  if (_initialized) return;
  const db = getDB();
  await db`
    CREATE TABLE IF NOT EXISTS items (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT        NOT NULL,
      price_type  TEXT        NOT NULL DEFAULT 'priced' CHECK (price_type IN ('priced','free')),
      price_amount NUMERIC,
      price_max   NUMERIC,
      notes       TEXT,
      status      TEXT        NOT NULL DEFAULT 'available' CHECK (status IN ('available','claimed','picked_up')),
      location    TEXT,
      claimed_by  TEXT,
      claim_platform TEXT     CHECK (claim_platform IN ('nextdoor','facebook_marketplace','offerup','craigslist','other')),
      claim_notes TEXT,
      reminder_at TIMESTAMPTZ,
      reminder_sent BOOLEAN   DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint    TEXT  NOT NULL UNIQUE,
      keys_p256dh TEXT  NOT NULL,
      keys_auth   TEXT  NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS item_interests (
      id        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id   UUID  NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      name      TEXT  NOT NULL,
      platform  TEXT  CHECK (platform IN ('nextdoor','facebook_marketplace','offerup','craigslist','other')),
      notes     TEXT,
      status    TEXT  NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','went_quiet','declined')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  _initialized = true;
}

module.exports = { getDB, ensureInit };
