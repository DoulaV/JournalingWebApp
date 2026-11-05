# Progress

Source of truth for the build is `CLAUDE.md`. This file tracks what is done.

## Phase 0: Setup
- [x] Next.js + TypeScript + Tailwind + pnpm project initialized, ESLint and Prettier configured
- [x] Supabase client set up, migrations folder created
- [x] `.env.example` committed, `.gitignore` covers secrets
- [x] `PROGRESS.md` created with all checklists
- [ ] One message to the user listing exactly what they must do (sent at the end of the session, see "User action needed" in README)

## Phase 1: MVP, daily writing works
- [x] Magic link auth restricted to `ALLOWED_EMAIL`
- [x] Tables: profiles, entries, entry_emotions, streaks with RLS
- [x] Today page, quick check-in with core-ring emotion picker
- [x] Editor with autosave and `dir="auto"`
- [x] Entry list and single entry view
- [x] Basic streak counter (current, longest, total)
- [ ] Deployed to Vercel and working on a phone browser (blocked: needs the Supabase and Vercel projects, see README "What you need to do")

## Phase 2: Habit engine
- [x] Full 3-ring emotion picker with recents, "Not sure", intensity, up to 3 emotions, gradual unlock
- [x] Full streak engine with grace, freezes, at-risk, reset, all unit tests passing
- [x] Tags
- [x] Prompts with no-repeat rule
- [x] PWA: installable, offline drafts with sync
- [x] Web Push reminders with cron and follow-up nudge
- [x] Morning and evening rituals
- [x] Dark mode, font size, Arabic UI with RTL

### Phase 1 and 2 summary
- Built: owner-only magic link and passkey sign-in, full schema with RLS, quick check-in (feelings, one line, tags), TipTap editor with 3-second autosave, IndexedDB offline drafts that sync on reconnect, per-paragraph `dir="auto"`, focus mode and font size, entry list and entry view, live streak engine, three-ring picker with recents, "Not sure", intensity, up to three feelings and gradual unlock, prompts with the 14-day no-repeat rule, morning and evening rituals, settings (theme, palette, font, Arabic RTL, reminders, PIN, passkeys, features, data), service worker and manifest, Web Push with reminder and nudge cron.
- Tested: 69 unit tests (streak engine incl. grace, freezes, cap, at-risk recovery and reset, midnight, travel, DST and DST-free zones; reminders incl. 2-a-day cap and DST; i18n parity; entry rules; prompts; emotions). Playwright at 390px: check-in in under 60 seconds with an Arabic paragraph, Not sure, three-ring picker, core-only week one, offline draft sync, streak with a rest day, rituals, dark mode and Arabic RTL with no horizontal scroll, real magic link email, allow-list refusal, cron auth, and Web Push delivery to a local mock push service.
- Known issues: headless Chromium can't create real push subscriptions, so delivery to a real phone is verified only after deploy (the Settings page has "Send a test notification"). Vercel Hobby only runs daily crons, so the 15-minute reminder schedule runs from GitHub Actions (`.github/workflows/reminders.yml`).

## Phase 3: Looking back
- [ ] Calendar view colored by emotion
- [ ] Year heatmap
- [ ] On this day
- [ ] Full-text search with filters
- [ ] Photos and voice notes (transcription behind flag)

## Phase 4: Insights and rewards
- [ ] Emotion trends, triggers, day-of-week charts
- [ ] Milestones and unlocks
- [ ] Monthly recap and Friday weekly review
- [ ] Letters to future you
- [ ] Therapy export PDF

## Phase 5: Hardening and polish
- [ ] PIN lock with inactivity timeout
- [ ] Markdown, JSON and PDF export
- [ ] Automatic weekly backup cron
- [ ] Optional AI weekly reflection behind flag
- [ ] Accessibility pass (keyboard, screen reader labels, contrast)
- [ ] Performance pass (Lighthouse 90+ on mobile for performance, accessibility, best practices, PWA)
- [ ] Empty states, loading states and error states on every page
- [ ] README with setup, deployment, and how to restore from backup

## Decisions log
- Next.js 16 ships with Cache Components on by default. Turned off: every page is private and per-user, so plain dynamic rendering is simpler.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`; auth session refresh and the owner-only check live there.
- Passkeys use Supabase Auth's native passkey support (`signInWithPasskey`, `registerPasskey`) instead of a custom WebAuthn server.
- `ALLOWED_EMAIL` is enforced in three places: the sign-in server action, the proxy (any other session is signed out), and the database (`handle_new_user` trigger rejects any email not in `private.allowed_emails`, which the server syncs from the env var through a service-role-only function). So a direct call to the Supabase auth API with the public anon key still cannot create an account.
- "Not sure" check-ins (mood valence only, no words) count as the emotion part of a valid entry, so hard days still keep the streak.
- One entry per day (as in the data model). Morning and evening rituals are sections inside that day's entry; `ritual` records the first one used.
- The streak is recomputed from full history each time (pure function), so nightly cron and save-time updates always agree.
- Added `prompt_history` table (for the 14-day no-repeat rule), `ai_reflections` table, and `NEXT_PUBLIC_SITE_URL` + `VAPID_SUBJECT` env vars.
- Letters are sealed in the database: RLS hides rows until `sealed_until`, and `letters_overview()` lists sealed letters without their content.
- Reminders every 15 minutes run from a GitHub Actions schedule, because Vercel Hobby rejects crons more frequent than daily. Vercel Cron runs the nightly streak recompute (08:10 UTC, just after the Dubai grace period closes) and the weekly backup. On Vercel Pro, the reminders cron can move into `vercel.json`.
- The service worker caches only `/today` (plus static assets) for offline writing, and clears its caches on sign out.
- The PIN lock is enforced on the server: without a valid signed unlock cookie the app layout renders only the lock screen, so entry content is never sent to a locked browser.
- The displayed streak is computed live from history on each view; the stored `streaks` row is refreshed on save and nightly.
- PDF export uses a print-optimized page and the browser's "Save as PDF", which renders Arabic shaping correctly (server PDF libraries handle Arabic poorly).
- Arabic prompts are written in the first person ("ما الذي كنت أحتاجه") to read naturally and avoid gendered "you".
