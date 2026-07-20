# Moving Sale Tracker

Two-person internal tool for Kyle & Mel's moving sale. Tracks items, claims, DM conversations, and pickup reminders.

## Stack

- **Frontend:** React + Vite (cream/dark palette, mobile-first)
- **Backend:** Netlify Functions (Node) + Netlify Database (Neon Postgres)
- **Push alerts:** Web Push API + Netlify Scheduled Function (every 15 min)
- **Auth:** Single shared passcode, checked server-side only

## Setup

### 1. Netlify project

Connect this repo to a new Netlify site. Enable **Netlify Database** in the Netlify dashboard (Integrations → Database). This auto-provisions a Neon Postgres instance and injects `DATABASE_URL` as an environment variable.

### 2. Environment variables (Netlify dashboard → Site config → Environment variables)

| Variable | Value |
|---|---|
| `PASSCODE` | Your shared passcode (pick something strong) |
| `VITE_VAPID_PUBLIC_KEY` | Generated below |
| `VAPID_PUBLIC_KEY` | Same value |
| `VAPID_PRIVATE_KEY` | Generated below |
| `VAPID_EMAIL` | `mailto:your@email.com` |

**Generate VAPID keys (one-time):**
```bash
npm install
node scripts/generate-vapid.js
```
Copy the output into the Netlify env vars above.

### 3. Database schema

The tables are created automatically on first API call via `CREATE TABLE IF NOT EXISTS`. No manual migration needed.

### 4. Local development

```bash
npm install
netlify dev       # runs Vite + Functions together on :8888
```

Requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and a `.env` file:
```
DATABASE_URL=<your neon connection string>
PASSCODE=yourpasscode
VITE_VAPID_PUBLIC_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:you@example.com
```

## Seeding items (bulk paste)

Open the site, click **⬆ Bulk Import**, and paste this list:

```
55" Flat Screen TV - $70
42" Flat Screen TV - $30
32" Flat Screen TV - $20
19-50" Full Motion TV Mount - $15 - - Open box, unused
Refrigerator - $150 - - Stainless/Black
Dehumidifier - $250 - - High-capacity
Dresser - $50 - Main Room
Small Dresser - $15
Desk - $35 - - Solid wood
White Desk - $25 - Basement
Bookshelf - $35 - - Solid wood
8-Section Cubby Style Stand - $35
Coffee Table - $30 - - Solid wood
End Tables - $35 - - Pair
End Tables / TV Stand - $50
TV Stand - $20 - Basement - Not on flyer
Glass High-Top Pub Table + 2 Chairs - $45 - - Table + 2 wooden chairs
Kitchen Table / Chairs - $35 - Kitchen
Small Hutch - $40 - Kitchen
Shelf - $20 - Kitchen
Small Half Table - $5
Night Stand - $15 - Boys Room
Rocking Chair - $20
3-Panel Wall Divider - $15
Mirror Set (Big & Small) - $15 - - Set of 2
Outdoor Table / Frame & 4 Chairs - $50 - Outside
Small Glass Tables - $15 - Outside - Pair, price is for both
Black Swirl Lamp - $10
Black Computer Lamp - $5
Blue Shades - $10 - - Set of 2, new
White Accordion Shade - $5 - - New
Kitchen Faucet - $25 - Kitchen - New
Noodle Maker - $15 - - Vintage
Stainless Steel Pots - $15 - - Big, set of 2
Canon Pixma Printer - $10
Casserole Dishes - $5 - - White, set of 2
Wine Glasses - $5 - - Set of 6
Spice Holder - $5 - Kitchen
```

## Features

- **Add / Bulk Import** — one item or paste a whole list with preview before committing
- **Filter tabs** — All / Available / Claimed / Picked Up with live counts
- **Claim flow** — who claimed it, which platform the DM came from, notes, optional follow-up reminder
- **Interest log** — track everyone who's asked (not just the winner), mark as Interested / Went Quiet / Declined
- **Edit & delete** — edit any field at any time; delete shows interest count and requires confirmation
- **Push alerts** — tap "Enable Alerts" on each phone; a scheduled function checks every 15 min and fires a native push when a reminder comes due
- **Reminder badge** — items with reminders due within 1 hour (or overdue) float to the top and show a visual badge, even without push enabled

## Build decisions

- No accounts, no role split, no analytics — single passcode gate is intentional and sufficient for two users
- Last-write-wins for concurrent edits (two users, not needed)
- `CREATE TABLE IF NOT EXISTS` runs on every cold start — negligible overhead, avoids a separate migration step
- VAPID keypair generated once at setup, never re-generated (changes would invalidate existing subscriptions)
- iOS Web Push requires the site to be added to Home Screen; Android works with a backgrounded tab
- Reminder `reminder_sent` is never auto-reset — if a claim is rescheduled, edit the `reminder_at` and set `reminder_sent = false` via the Edit modal
