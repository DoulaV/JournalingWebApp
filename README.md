# Journal

A calm, private journaling app for one person. Write a feeling and a sentence in 30 seconds, or keep going in a full editor. Forgiving streaks, gentle reminders, looking back, and insights. English and Arabic, light and dark, installable on your phone, works offline.

Built with Next.js 16 (App Router, TypeScript), Tailwind CSS 4, TipTap, Supabase (Postgres, Auth, Storage, Row Level Security), Recharts and Web Push. Hosted on Vercel.

- `CLAUDE.md` is the product spec. `PROGRESS.md` tracks what is built and every decision made along the way.

---

## What you need to do (first deploy)

Everything below happens in a web browser. No command line, no installing anything. You need three free accounts: GitHub (you have it), [Supabase](https://supabase.com) and [Vercel](https://vercel.com). Allow about 20 minutes.

You will paste three secret values: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET`. They were generated for you and sent separately (never commit them). To make new ones later, run the "Generate secrets" steps at the end of this file on any machine that allows it, or ask for them to be generated again.

### 1. Create the Supabase project and database

1. In Supabase, **New project**. Pick a region near you (for example Frankfurt or Mumbai for Dubai) and save the database password somewhere safe.
2. Set up the database: open [`supabase/migrations/20261105000000_init.sql`](supabase/migrations/20261105000000_init.sql) on GitHub, click **Copy raw file** (the copy icon above the file), then in Supabase open **SQL Editor > New query**, paste, and click **Run**. It should finish with "Success. No rows returned". This creates every table, the Row Level Security policies, search, and the private `attachments` and `backups` storage buckets.
3. **Authentication > URL Configuration**: set Site URL to your Vercel address (for example `https://my-journal.vercel.app`) and add `https://my-journal.vercel.app/auth/confirm` to Redirect URLs. You get the exact address in step 2; come back and fill it in then.
4. Email template: nothing to do. The app works with Supabase's default sign-in email. (Editing templates needs your own email service, which is optional, see 7.) Open the sign-in link on the same phone or browser where you asked for it.
5. Passkeys (optional, for Face ID or fingerprint sign-in): if your Supabase dashboard shows a **Passkeys** option under Authentication, turn it on and set the relying party ID to your domain (for example `my-journal.vercel.app`) and the origin to `https://my-journal.vercel.app`. Magic links work without this.
6. **Project Settings > API** (or **API Keys**): copy the Project URL, the `anon` public key and the `service_role` key for step 2.
7. Optional: Supabase's built-in email sender allows only a few emails per hour. That's enough for signing in now and then. For more, add your own SMTP under **Authentication > Emails**.

Only the email in `ALLOWED_EMAIL` can ever create an account. This is enforced in the app and inside the database itself, so nobody else can sign up even with your public keys.

### 2. Create the Vercel project

1. In Vercel, **Add New > Project**, import this GitHub repository. Leave the build settings as they are.
2. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
   | `ALLOWED_EMAIL` | the one email that may sign in |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel address, for example `https://my-journal.vercel.app` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | from your secrets |
   | `VAPID_PRIVATE_KEY` | from your secrets |
   | `VAPID_SUBJECT` | `mailto:` followed by your email |
   | `CRON_SECRET` | from your secrets |
   | `OPENAI_API_KEY` | optional, enables voice note transcription |
   | `ANTHROPIC_API_KEY` | optional, enables the AI weekly reflection |

3. Click **Deploy**. When it's done, copy your address (shown on the project page), go back to Supabase step 1.3 and fill it in. If you didn't know the address when you set `NEXT_PUBLIC_SITE_URL`, update it in Vercel and click **Redeploy**.
4. In **Settings > Git**, check that the production branch is the branch you merge into (usually `main`).
5. Speed: in Vercel **Settings > Functions > Function Region**, pick the region closest to your Supabase project's region (shown in Supabase under Project Settings > General). For example Supabase Mumbai (ap-south-1) goes with Vercel Mumbai (bom1), and Supabase Frankfurt (eu-central-1) goes with Vercel Frankfurt (fra1). Then redeploy. Without this, every page waits on a trip between continents.
6. Vercel Cron runs the nightly streak recompute and the weekly backup automatically (from `vercel.json`).

### 3. Turn on the 15-minute reminder schedule

Vercel's free plan only runs scheduled jobs once a day, so reminders are triggered by GitHub Actions instead. In this GitHub repository, **Settings > Secrets and variables > Actions > New repository secret**, add:

- `APP_URL`: your Vercel address, with no slash at the end
- `CRON_SECRET`: the same value you gave Vercel

That's it. GitHub calls the app every 15 minutes (sometimes a few minutes late, which the app allows for).

Optional, same screen: add `SUPABASE_ACCESS_TOKEN` (from supabase.com, **Account > Access Tokens**), `SUPABASE_PROJECT_REF` (the code in your project's URL after `/project/`) and `SUPABASE_DB_PASSWORD`. Then any future database changes are applied automatically when they reach `main` (the "Database migrations" workflow), so you never need the SQL Editor again.

### 4. Sign in and install on your phone

1. Open your Vercel address on your phone, enter your email, and tap the link in the email **on the same phone**.
2. Install it:
   - **iPhone or iPad (Safari)**: Share, then **Add to Home Screen**. Open the journal from the Home Screen icon. **Notifications only work when opened from the Home Screen** (iOS 16.4 or later).
   - **Android (Chrome)**: menu, then **Install app** (or Add to Home screen).
3. Optional: in **Settings > Privacy and lock**, add a passkey and set a PIN.

### 5. Turn on reminders

In **Settings > Reminders** on the installed app:

1. Tap **Turn on notifications on this device** and allow them.
2. Tap **Send a test notification**. It should arrive within a few seconds.
3. Turn on **Daily reminder**, pick a time (default 21:30), and optionally write the habit it follows ("after dinner"). The one gentle follow-up (default 23:00) only goes out if you haven't written. Never more than two a day.

---

## Local development

You only need this to change the code. It is not needed to set up or use the journal.

**Generate secrets**: `pnpm gen:vapid` prints new `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET` values.

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

**Restore from a backup, in the browser**: add the repository secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ALLOWED_EMAIL` (GitHub, **Settings > Secrets and variables > Actions**), then open the **Actions** tab, choose **Restore from backup**, click **Run workflow**, and type `restore`. It restores the newest backup in your project's `backups` bucket. If you moved to a brand new Supabase project, first upload the backup file into that project's `backups` bucket under a folder named after your new user id (sign in once to create it), or use the command line steps below.

**Restore from a backup, from a computer** (for example into a brand new Supabase project after following steps 1 and 2 above):

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
