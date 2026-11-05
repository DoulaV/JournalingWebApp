# Journal

A calm, private journaling app for one person. Write a feeling and a sentence in 30 seconds, or keep going in a full editor. Forgiving streaks, gentle reminders, looking back, and insights. English and Arabic, light and dark, installable on your phone, works offline.

Built with Next.js 16 (App Router, TypeScript), Tailwind CSS 4, TipTap, Supabase (Postgres, Auth, Storage, Row Level Security), Recharts and Web Push. Hosted on Vercel.

- `CLAUDE.md` is the product spec. `PROGRESS.md` tracks what is built and every decision made along the way.

---

## What you need to do (first deploy)

You need three free accounts: GitHub (you have it), [Supabase](https://supabase.com) and [Vercel](https://vercel.com). Allow about 20 minutes.

### 1. Generate your secrets

On your computer, in this repository:

```bash
pnpm install
```

```bash
pnpm gen:vapid
```

This prints `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET`. Keep them for step 3. They are random values that only you have; never commit them.

### 2. Create the Supabase project

1. In Supabase, create a new project (pick a region near you, for example Frankfurt or Mumbai for Dubai). Save the database password.
2. Apply the database schema from your computer:

   ```bash
   pnpm exec supabase login
   ```

   ```bash
   pnpm exec supabase link --project-ref YOUR_PROJECT_REF
   ```

   ```bash
   pnpm exec supabase db push
   ```

   The project ref is the part of the project URL after `/project/`. `db push` creates every table, the Row Level Security policies, search, and the private `attachments` and `backups` storage buckets.
3. **Authentication > URL Configuration**: set Site URL to your Vercel URL (for example `https://my-journal.vercel.app`) and add `https://my-journal.vercel.app/auth/confirm` to Redirect URLs. You will know the exact URL after step 3; come back and update it.
4. **Authentication > Email Templates > Magic Link**: replace the link in the template with:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in to your journal</a>
   ```

   (The same template is in `supabase/templates/magic_link.html`.)
5. **Authentication > Sign In / Providers > Passkeys** (if shown): turn passkeys on, and set the WebAuthn relying party ID to your domain (for example `my-journal.vercel.app`) and the origin to `https://my-journal.vercel.app`.
6. **Project Settings > API**: copy the Project URL, the `anon` public key and the `service_role` key for step 3.
7. Optional but recommended: Supabase's built-in email sender is rate limited (a few emails per hour). Magic links are only needed now and then, but if you want more, add your own SMTP under **Authentication > Emails**.

Only the email in `ALLOWED_EMAIL` can ever create an account. This is enforced in the app and inside the database itself, so nobody else can sign up even with your public keys.

### 3. Create the Vercel project

1. In Vercel, **Add New > Project**, import this GitHub repository. Framework preset: Next.js. Build settings: defaults.
2. Add these environment variables (Production and Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
   | `ALLOWED_EMAIL` | the one email that may sign in |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, for example `https://my-journal.vercel.app` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | from `pnpm gen:vapid` |
   | `VAPID_PRIVATE_KEY` | from `pnpm gen:vapid` (secret) |
   | `VAPID_SUBJECT` | `mailto:` plus your email |
   | `CRON_SECRET` | from `pnpm gen:vapid` (secret) |
   | `OPENAI_API_KEY` | optional, enables voice note transcription |
   | `ANTHROPIC_API_KEY` | optional, enables the AI weekly reflection |

3. Deploy. In **Settings > Git**, make sure the production branch is the branch you merge into (usually `main`).
4. Vercel Cron runs two daily-or-slower jobs from `vercel.json`: the nightly streak recompute and the weekly backup. They use `CRON_SECRET` automatically.

### 4. Turn on the 15-minute reminder schedule

Vercel's free plan only runs cron jobs once a day, so reminders are triggered by GitHub Actions instead (`.github/workflows/reminders.yml`). In GitHub, **Settings > Secrets and variables > Actions > New repository secret**, add:

- `APP_URL`: your Vercel URL, no trailing slash
- `CRON_SECRET`: the same value as in Vercel

GitHub runs it every 15 minutes (sometimes a few minutes late, which the app tolerates). On Vercel Pro you can instead add `{ "path": "/api/cron/reminders", "schedule": "*/15 * * * *" }` to `vercel.json`.

### 5. Sign in and install on your phone

1. Open your Vercel URL on your phone, enter your email, and tap the link in the email **on the same phone**.
2. Install it:
   - **iPhone or iPad (Safari)**: Share, then **Add to Home Screen**. Open the journal from the Home Screen icon. **Notifications only work when opened from the Home Screen** (iOS 16.4 or later).
   - **Android (Chrome)**: menu, then **Install app** (or Add to Home screen).
3. Optional: in **Settings > Privacy and lock**, add a passkey so you can sign in with Face ID or your fingerprint, and set a PIN.

### 6. Turn on reminders

In **Settings > Reminders** on the installed app:

1. Tap **Turn on notifications on this device** and allow them.
2. Tap **Send a test notification**. You should see it within a few seconds.
3. Turn on **Daily reminder**, pick a time (default 21:30), and optionally write the habit it follows ("after dinner"). The one gentle follow-up (default 23:00) is only sent if you haven't written. Never more than two a day.

---

## Local development

Requirements: Node 22, pnpm 10, Docker (for the local Supabase stack).

```bash
pnpm install
```

```bash
pnpm db:start
```

`db:start` runs Supabase locally (Postgres, Auth, Storage and a mail catcher at http://127.0.0.1:54324). Then create `.env.local` from `.env.example`, using the values printed by `pnpm exec supabase status` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`), `ALLOWED_EMAIL=you@example.com`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, and the output of `pnpm gen:vapid`.

```bash
pnpm dev
```

Open http://localhost:3000, enter your `ALLOWED_EMAIL`, and open the link from the mail catcher.

| Command | What it does |
|---|---|
| `pnpm typecheck` | TypeScript, strict |
| `pnpm lint` | ESLint, zero warnings allowed |
| `pnpm test` | Vitest unit tests (streak engine, reminders, prompts, emotions, insights, i18n) |
| `pnpm e2e` | Playwright end-to-end tests at a 390px phone viewport (needs local Supabase running) |
| `E2E_BUILD=1 pnpm e2e` | the same against a production build |
| `pnpm db:reset` | rebuild the local database from `supabase/migrations` |
| `pnpm db:types` | regenerate `lib/data/database.types.ts` after a schema change |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests, and the e2e suite against a fresh local Supabase on every push.

---

## Backups and restore

**Automatic**: every Sunday the backup job writes a full JSON copy of your journal to the private `backups` storage bucket in Supabase and keeps the newest 8. You can also tap **Back up now** in Settings.

**Manual exports** (Settings > Your data):
- **Markdown (zip)**: one `.md` file per day with feelings and tags in the header, your photos and voice notes in `attachments/`, and everything again as `journal.json`.
- **JSON**: the complete journal as one file.
- **Print or save as PDF**: any date range, or a single entry from its page. The therapy summary is under Insights.

**Restore from a backup** (for example into a brand new Supabase project after following steps 2 and 3 above):

1. Get a backup file: in Supabase, **Storage > backups > (your user id)**, download the newest `backup-....json`, or use a `journal.json` from an export.
2. Put the new project's values in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAIL`).
3. Run:

   ```bash
   node scripts/restore.mjs path/to/backup.json
   ```

   Or, to restore the newest backup already in the project's `backups` bucket:

   ```bash
   node scripts/restore.mjs --latest
   ```

The script creates your account if needed and restores settings, tags, entries with feelings and tags, letters (still sealed until their date) and attachment records. It is safe to run twice. Photo and voice files live in storage, not in the JSON: to bring them over, upload the `attachments/` folder from a Markdown export, or copy the `attachments` bucket in the Supabase dashboard. Open the app once afterwards and the streak recomputes from your history.

---

## How it works

```
app/
  (auth)/login            magic link and passkey sign-in
  (app)/today             default landing: check-in, editor, streak, on this day
  (app)/entry/[date]      a past day
  (app)/entries           all entries
  (app)/calendar          month view and year heatmap
  (app)/search            full-text search with filters
  (app)/insights          trends, triggers, weekday pattern, recap, weekly review
  (app)/letters           letters to future you
  (app)/milestones        unlocks, day one next to today, year review
  (app)/settings          everything configurable, exports and backups
  (print)/print           printable range and therapy summary
  lock                    PIN lock screen
  api/cron/*              reminders, streaks, backup (CRON_SECRET protected)
  api/export/*            JSON and Markdown zip
components/               editor, emotion picker, charts, streak, ui
lib/
  data/                   the only code that talks to Supabase (swap point for future encryption)
  streak.ts               pure streak engine (grace, freezes, at-risk, reset, milestones)
  reminders.ts            pure reminder scheduling (max 2 a day, never after writing)
  emotions.ts prompts.ts  the feelings wheel and prompts, English and Arabic
  insights.ts dates.ts    pure aggregations and timezone-safe dates
  i18n.ts                 all UI copy, English and Arabic
supabase/migrations/      schema, RLS, storage, search
public/sw.js              service worker: offline shell and push
```

Privacy, in short: one allowed email, Row Level Security on every table, private storage with short-lived signed URLs, no analytics or trackers, a server-enforced PIN lock, secrets only in environment variables, and AI features off unless you turn them on and tap the button.
