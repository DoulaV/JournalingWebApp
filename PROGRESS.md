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
- [x] Calendar view colored by emotion
- [x] Year heatmap
- [x] On this day
- [x] Full-text search with filters
- [x] Photos and voice notes (transcription behind flag)

### Phase 3 summary
- Built: month calendar colored by each day's strongest feeling (shaded by intensity), year heatmap laid out month by month so it fits a phone without horizontal scroll, on this day (1 week, 1 month, 6 months, 1 year), full-text search (Postgres `simple` config, works for Arabic and English, plus substring fallback) with tag, feeling, date range, photo and audio filters, photo upload with client-side compression and voice notes recorded in the browser, stored in a private bucket and served by signed URLs. Whisper transcription runs only when the user turns it on and `OPENAI_API_KEY` is set.
- Tested: unit tests for dominant feeling, colors, pleasantness, trends, triggers, weekday pattern and recap. Playwright at 390px: calendar color, heatmap, on this day, English and Arabic search with filters, photo upload and a voice note with a fake microphone, attachment filters.
- Known issues: transcription is not exercised in tests (needs a real OpenAI key).

## Phase 4: Insights and rewards
- [x] Emotion trends, triggers, day-of-week charts
- [x] Milestones and unlocks
- [x] Monthly recap and Friday weekly review
- [x] Letters to future you
- [x] Therapy export PDF

### Phase 4 summary
- Built: insights page with feelings over time (weeks or months, stacked by core, with a table view), life areas and feelings, weekday pleasantness, monthly recap (unlocks at a 30-day streak), Friday weekly review prompt (on Today and Insights), milestones page with every unlock, calm milestone dialog (soft glow, no confetti), Dusk palette at 7 days, letters at 50 days (sealed by RLS until their date, push when they open), day one next to today at 100 days, year review at 365, and a one-page therapy summary where the user picks which excerpts print.
- Tested: Playwright for charts and table view, the 7-day celebration and Dusk unlock, recap and letters with a 55-day history including sealing and opening, 100-day look back, and the summary printing only chosen excerpts.
- Known issues: the spec's Angry and Fearful colors are almost identical (and fail colorblind checks). They are kept as specified, never stacked next to each other in charts, and every chart has a legend, labeled tooltips and text values.

## Phase 5: Hardening and polish
- [x] PIN lock with inactivity timeout
- [x] Markdown, JSON and PDF export
- [x] Automatic weekly backup cron
- [x] Optional AI weekly reflection behind flag
- [x] Accessibility pass (keyboard, screen reader labels, contrast)
- [x] Performance pass (Lighthouse 90+ on mobile for performance, accessibility, best practices, PWA) (see Phase 5 summary for measured scores; re-run on Vercel after deploy)
- [x] Empty states, loading states and error states on every page
- [x] README with setup, deployment, and how to restore from backup

### Phase 5 summary
- Built: PIN lock (4 to 6 digits, scrypt hash, inactivity timeout, 5-try throttle) enforced inside `requireUser()` so pages, server actions and exports all refuse while locked; JSON export, Markdown zip (one file per day plus attachments), PDF via print pages for a range or one entry; weekly JSON backup to the private bucket keeping 8, plus "Back up now"; `scripts/restore.mjs` (file or `--latest`); optional AI weekly reflection with Claude Opus 5.5, off by default, clearly labeled, only on tap, with refusal fallback; skip link, focus rings, labeled controls, 44px targets, calm reduced-motion; loading skeletons, error boundary, global error and not-found pages; README.
- Tested: Playwright for the PIN lock (locked HTML contains no entry text, wrong and right PIN), JSON and Markdown exports including Arabic, 9 backup runs keeping 8 then a full restore into an empty journal, AI reflection off by default, and axe (WCAG 2.1 AA, no serious or critical issues) on Today, Calendar month and year, Entries, Search, Insights, Letters, Milestones and Settings. 34 e2e tests and 76 unit tests pass on a production build.
- Lighthouse (mobile emulation, Lighthouse 12, local production build in this container): accessibility 100 and best practices 100 on every page; performance Calendar 97 to 99, Entries 96 to 99, Letters 98, Search 95 to 99, Login 95 to 97, Milestones 95, Settings 93, Today 88 to 92, Insights 84 to 92 (noisy run to run on this shared machine). Lighthouse 12 no longer has a PWA category; installability is covered by the manifest, icons (including maskable) and service worker.
- Performance fixes made: Arabic fonts not preloaded, Latin fonts use `display: optional`, TipTap and Recharts load as separate chunks, the weekday chart mounts on scroll, chart animations off, Supabase client loaded only when uploading, no page-level skeleton on pages where streaming hurt LCP.
- Known issues: Lighthouse should be re-run on the real Vercel deployment (edge caching and real CPU usually score higher). Real-phone push delivery and passkeys need the deployed HTTPS site.

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
- The PIN lock check lives in `requireUser()` rather than only in the layout: Next.js renders pages in parallel with layouts, so a layout-only gate would still send page data.
- Lighthouse performance work kept Recharts (as specified) but loads it lazily with animations off.
- The owner can't run commands on their laptop, so setup is browser-only: secrets are generated in the build session and handed over privately, the database is created by pasting the migration into the Supabase SQL Editor, and two manual GitHub Actions cover future migrations ("Database migrations") and restores ("Restore from backup").
- Supabase only lets you edit email templates with custom SMTP, so `/auth/confirm` accepts both the custom `token_hash` link and the default template's PKCE `code` link. The local template now uses the default `{{ .ConfirmationURL }}` so e2e tests the production path.
- After first use: taps felt slow. The proxy now forwards the verified user to pages (saving an auth round trip per request; RLS still protects data), Today runs its queries in two parallel batches, duplicate entry reads are cached per request, autosave no longer reloads the page on every save, and a loading skeleton appears instantly on every tap. Vercel's function region should match the Supabase region (see README).
- Today's check-in now says how to start, offers "Skip feelings and just write" (the day counts for the streak once a feeling is added), and writing for yesterday shows a clear banner with a way back.
- Arabic prompts are written in the first person ("ما الذي كنت أحتاجه") to read naturally and avoid gendered "you".
