# Progress

Source of truth for the build is `CLAUDE.md`. This file tracks what is done.

## Phase 0: Setup
- [x] Next.js + TypeScript + Tailwind + pnpm project initialized, ESLint and Prettier configured
- [x] Supabase client set up, migrations folder created
- [x] `.env.example` committed, `.gitignore` covers secrets
- [x] `PROGRESS.md` created with all checklists
- [ ] One message to the user listing exactly what they must do (sent at the end of the session, see "User action needed" in README)

## Phase 1: MVP, daily writing works
- [ ] Magic link auth restricted to `ALLOWED_EMAIL`
- [ ] Tables: profiles, entries, entry_emotions, streaks with RLS
- [ ] Today page, quick check-in with core-ring emotion picker
- [ ] Editor with autosave and `dir="auto"`
- [ ] Entry list and single entry view
- [ ] Basic streak counter (current, longest, total)
- [ ] Deployed to Vercel and working on a phone browser

## Phase 2: Habit engine
- [ ] Full 3-ring emotion picker with recents, "Not sure", intensity, up to 3 emotions, gradual unlock
- [ ] Full streak engine with grace, freezes, at-risk, reset, all unit tests passing
- [ ] Tags
- [ ] Prompts with no-repeat rule
- [ ] PWA: installable, offline drafts with sync
- [ ] Web Push reminders with cron and follow-up nudge
- [ ] Morning and evening rituals
- [ ] Dark mode, font size, Arabic UI with RTL

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
- Arabic prompts are written in the first person ("ما الذي كنت أحتاجه") to read naturally and avoid gendered "you".
