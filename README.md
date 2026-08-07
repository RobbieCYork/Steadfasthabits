# Steadfast

Build habits that compound. Track streaks solo, or invite family and friends into a
friendly points competition — one small day at a time.

React 19 + Vite + TypeScript, backed by Supabase (Postgres + Auth + Realtime), same
stack pattern as [Bible Atlas](https://bible-atlas-alpha.vercel.app/). Deploys to Vercel.

## How scoring works

- Day 1 of a streak earns 1 point, day 2 earns 2, day *N* earns *N*.
- Miss exactly one day (or week/month, for non-daily habits) and the streak survives —
  no points for that period, but you keep your progress.
- Miss two in a row and the streak resets to zero; the next completion starts back at 1.
- Habits can be **daily**, **weekly**, or **monthly** — the same grace/reset rule applies
  at whichever cadence you pick.
- Badges unlock at meaningful streak lengths (scaled per frequency) — 2, 5, 10, 15, 30
  days, 3/6/12 months for daily habits; proportionally further out for weekly/monthly ones.

## One-time setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's provisioned, open **SQL Editor** → New query, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables,
   row-level-security policies, and the `join_competition` function.
3. In **Authentication → Providers**, email/password is on by default — that's all this
   app uses. (Optional: turn off "Confirm email" under Authentication → Settings if you
   want sign-up to work without an email round-trip while testing.)
4. Go to **Settings → API** and copy the **Project URL** and **anon public** key.

### 2. Configure the app

```bash
cp .env.example .env.local
# paste your Project URL and anon key into .env.local
npm install
npm run dev
```

### 3. Deploy (Vercel)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), "Add New Project" → import the repo. Framework
   preset: Vite (auto-detected).
3. Add the two env vars from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   under Project Settings → Environment Variables.
4. Deploy. Every push to `main` auto-deploys from then on.

## Data model

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema. Briefly:

- **profiles** — one row per user, auto-created on sign-up via a DB trigger.
- **competitions** — name, points goal, `public`/`private` visibility, invite code.
- **competition_members** — who's in which competition.
- **habits** — scoped either to a `solo` profile or a `competition`; has a name, icon,
  category, and frequency (`daily`/`weekly`/`monthly`).
- **entries** — "this profile completed this habit in this period" rows; the scoring
  engine (`src/lib/scoring.ts`) derives streaks, points, and badges from these.

Realtime is enabled on all four mutable tables, so marking a habit done on one device
shows up on a teammate's scoreboard within a second, no refresh needed.

## Known limitations (rough draft)

- No password reset flow yet.
- No friends/social graph beyond competition membership.
- No push notifications / reminders.
