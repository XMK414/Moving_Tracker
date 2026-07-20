const webpush = require('web-push');
const { getDB, ensureInit } = require('./lib/db');

// Netlify Scheduled Function — runs every 15 minutes.
exports.handler = async () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured — skipping push check');
    return { statusCode: 200 };
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const db = getDB();
  await ensureInit();

  const dueItems = await db`
    SELECT * FROM items
    WHERE reminder_at <= NOW()
      AND reminder_sent = false
      AND status = 'claimed'
  `;

  if (dueItems.length === 0) return { statusCode: 200 };

  const subs = await db`SELECT * FROM push_subscriptions`;
  if (subs.length === 0) {
    // Still mark sent so we don't spam on next tick
    for (const item of dueItems) {
      await db`UPDATE items SET reminder_sent = true WHERE id = ${item.id}`;
    }
    return { statusCode: 200 };
  }

  for (const item of dueItems) {
    const payload = JSON.stringify({
      title: 'Moving Sale Reminder',
      body: `${item.name}${item.claimed_by ? ` — ${item.claimed_by}` : ''} needs follow-up!`,
      tag: `reminder-${item.id}`,
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
          payload
        );
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Subscription gone — clean it up
          await db`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        } else {
          console.error('Push send failed:', e.message);
        }
      }
    }

    await db`UPDATE items SET reminder_sent = true WHERE id = ${item.id}`;
  }

  return { statusCode: 200 };
};
