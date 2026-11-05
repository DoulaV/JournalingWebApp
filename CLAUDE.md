# Personal Journal App: Build Spec

You are building a private, single-user journaling web app for Ahmed. Read this whole file before writing any code. This file is the source of truth. Keep it updated if decisions change.

## Your mission

Build the complete product described here, phase by phase, until every item in the Definition of Done is checked. Work autonomously:

- Do not stop after a phase to ask "should I continue?". Finish a phase, verify it, commit, update `PROGRESS.md`, and move straight to the next phase.
- Only stop and ask the user when you are truly blocked by something only they can do (creating accounts, pasting secret keys, approving a paid service). When that happens, batch every blocker into one clear message with exact steps, then keep working on anything that isn't blocked.
- If a decision isn't covered here, pick the simplest sensible option, write it under "Decisions log" in `PROGRESS.md`, and continue.
- Never mark something done without verifying it (see Verification rules).

## Start of every session

1. Read `CLAUDE.md` and `PROGRESS.md`.
2. Continue from the first unchecked item.
3. If `PROGRESS.md` doesn't exist, create it from the phase checklists below and start at Phase 0.

## Product vision

A calm, private place to journal emotions and thoughts every day, accessible from any device through the web. It does one thing: journaling. No social features, no task lists, no unrelated trackers.

The app has two jobs:
1. Make it effortless to write, including on hard days.
2. Build a long-lasting daily habit with forgiving streaks and meaningful look-backs.

Design principles:
- Writing comes first. Opening the app lands on today's entry with the cursor ready.
- The minimum valid entry is tiny: one emotion plus one sentence.
- Never guilt the user. All copy is warm and inviting, never scolding.
- Reward reflection, not word count.
- Calm visual design: soft neutral palette, generous whitespace, readable serif for entry text, sans for UI. Light and dark mode.
- Full Arabic and English support. Text direction is detected per paragraph (`dir="auto"`), so mixed Arabic/English entries render correctly.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router) + TypeScript (strict) |
| Styling | Tailwind CSS |
| Editor | TipTap with Markdown shortcuts |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security |
| Hosting | Vercel (auto deploy from GitHub `main`) |
| Scheduled jobs | Vercel Cron |
| Push notifications | Web Push (VAPID keys) via service worker |
| PWA | Web app manifest + service worker, installable, offline drafts |
| Charts | Recharts |
| Voice transcription | OpenAI Whisper API (optional, behind a feature flag; if no key, audio is stored without transcript) |
| Testing | Vitest for logic, Playwright for key end-to-end flows |
| Package manager | pnpm |

## Security and privacy (non-negotiable)

- Single user. Sign-in by email magic link and passkey. Only the email in `ALLOWED_EMAIL` can sign in; any other email is rejected server-side.
- Row Level Security on every table: rows are readable and writable only by their `user_id`.
- No secrets in the client bundle or in git. Use `.env.local` locally and Vercel environment variables in production. Commit a `.env.example` with every variable name and no values.
- App lock: optional 4 to 6 digit PIN, required after a configurable period of inactivity (default 5 minutes). Store only a salted hash.
- Private storage buckets for photos and audio, served through signed URLs.
- No analytics, no third-party trackers.
- Any feature that sends entry text to an external AI service is off by default and clearly labeled.
- Encryption: v1 relies on Supabase encryption at rest plus RLS. End-to-end encryption is out of scope unless the user asks for it; keep the data layer behind one module (`lib/data/`) so it can be added later.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_EMAIL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
OPENAI_API_KEY=            # optional, enables voice transcription
ANTHROPIC_API_KEY=         # optional, enables AI weekly reflection (Phase 5)
```

Generate VAPID keys and `CRON_SECRET` yourself and tell the user where to paste them.

## Data model

Use Supabase migrations in `supabase/migrations/`. All tables have `id uuid pk`, `user_id uuid` (references auth.users), `created_at`, `updated_at`, and RLS policies.

- **profiles**: user_id, display_name, timezone (default `Asia/Dubai`), language (`en` or `ar`), theme, pin_hash, lock_timeout_minutes, show_streak (bool, default true), emotion_depth_unlocked (1, 2 or 3), reminder settings.
- **entries**: entry_date (date in user timezone, unique per user), title, body (TipTap JSON), body_text (plain text for search), mood_valence (1 to 5, nullable), word_count, ritual (`morning`, `evening` or `free`), is_backfilled (bool).
- **entry_emotions**: entry_id, core, middle (nullable), precise (nullable), intensity (1 to 5), position (1 to 3). Always store the full path so precise feelings roll up to their core.
- **tags** and **entry_tags**: life areas (seed: work, family, health, money, relationships, friends, self, ideas, gratitude).
- **attachments**: entry_id, kind (`photo` or `audio`), storage_path, transcript (nullable), duration_seconds.
- **streaks**: current_length, longest_length, total_days_written, freezes_available (0 to 3), at_risk (bool), last_counted_date.
- **streak_events**: date, type (`written`, `freeze_used`, `at_risk`, `reset`, `milestone`).
- **future_letters**: body, sealed_until (date), opened_at.
- **push_subscriptions**: endpoint, keys, device_label.
- Full-text search: Postgres `tsvector` on `title` and `body_text` with a GIN index. Use the `simple` config so Arabic and English both work.

## Feature spec

### 1. Writing
- Opening the app routes to today's entry. If none exists, show the quick check-in first, then the editor.
- TipTap editor with Markdown shortcuts, headings, lists, quotes, bold, italic. Focus mode hides all chrome.
- Autosave every 3 seconds of inactivity and on blur. Show a subtle "Saved" indicator.
- Offline: drafts save to IndexedDB and sync when back online. Never lose text.
- Per-paragraph `dir="auto"` for Arabic/English.
- Adjustable font size. Serif for entry text.
- Optional rotating prompt shown above the editor, dismissible. Prompts are tied to the chosen emotion's core (see Prompts).

### 2. Quick check-in (30 seconds)
The minimum valid entry: at least one emotion and at least one non-empty sentence.
- Step A: emotion picker (below).
- Step B: one line "What's behind this feeling?"
- Step C (optional): tags.
- Save. Offer "Keep writing" to open the full editor, or "Done for today".

### 3. Emotion picker (simplified feelings wheel)
Based on the feelings wheel the user's therapist uses, simplified so it never overwhelms.

Rules:
- Show one ring at a time: core (7 options), then middle (4 to 9 options), then precise (2 options).
- The user can stop at any ring. Step 2 offers "Just [core]" and step 3 offers "Just [middle]". Step 3 is labeled optional.
- Up to 3 emotions per entry, each with an intensity slider from 1 (mild) to 5 (strong). One is enough.
- Back button and a breadcrumb (`Angry > Frustrated`).
- "Recent" row at the top with the user's 5 most used emotions as one-tap shortcuts.
- "Not sure" option: skips words and asks only for a pleasant/unpleasant slider (stored as mood_valence).
- Gradual unlock: week 1 shows only the core ring, from day 8 the middle ring, from day 22 the precise ring. User can unlock all in settings.
- Arabic labels toggle (translate all words in `lib/emotions.ts`, reviewed for natural Arabic).
- Each core has a color used everywhere (picker, heatmap, charts, recaps).
- Must be thumb-friendly on mobile: large tap targets, no horizontal scroll.

Emotion data (put in `lib/emotions.ts`):

| Core (color) | Middle: precise words |
|---|---|
| Happy (#EF9F27) | Content: Free, Joyful. Proud: Successful, Confident. Peaceful: Loving, Thankful. Optimistic: Hopeful, Inspired. Interested: Curious, Inquisitive. Accepted: Respected, Valued. Powerful: Courageous, Creative. Trusting: Sensitive, Intimate. Playful: Cheeky, Free |
| Sad (#378ADD) | Lonely: Isolated, Abandoned. Hurt: Disappointed, Embarrassed. Guilty: Ashamed, Remorseful. Depressed: Empty, Inferior. Vulnerable: Victimised, Fragile. Despair: Grief, Powerless |
| Angry (#E24B4A) | Frustrated: Annoyed, Infuriated. Let down: Resentful, Betrayed. Humiliated: Ridiculed, Disrespected. Bitter: Violated, Indignant. Mad: Jealous, Furious. Aggressive: Hostile, Provoked. Distant: Numb, Withdrawn. Critical: Dismissive, Sceptical |
| Fearful (#D85A30) | Anxious: Worried, Overwhelmed. Insecure: Inadequate, Inferior. Scared: Frightened, Helpless. Rejected: Excluded, Persecuted. Threatened: Nervous, Exposed. Weak: Worthless, Insignificant |
| Bad (#1D9E75) | Stressed: Overwhelmed, Out of control. Tired: Sleepy, Unfocused. Busy: Pressured, Rushed. Bored: Indifferent, Apathetic |
| Surprised (#7F77DD) | Excited: Eager, Energetic. Amazed: Astonished, Awe. Confused: Perplexed, Disillusioned. Startled: Shocked, Dismayed |
| Disgusted (#888780) | Disapproving: Judgmental, Embarrassed. Disappointed: Appalled, Revolted. Awful: Nauseated, Detestable. Repelled: Horrified, Hesitant |

Optional extras per emotion: "Where do you feel it?" body check (head, chest, stomach, shoulders, hands, nowhere specific).

### 4. Prompts
- Store prompts in `lib/prompts.ts`, at least 8 per core emotion plus 15 general ones, in English and Arabic.
- Examples: Frustrated: "What did you need that you didn't get?" Proud: "What did you do that made this possible?" Anxious: "What's the worst case, and how likely is it really?" Tired: "What drained you today, and what could refill you?"
- Morning ritual prompt: "How do I want to feel today?" Evening ritual prompt: "How did I actually feel today?"
- Never repeat the same prompt within 14 days.

### 5. Daily rituals and reminders
- Two optional rituals: morning intention and evening reflection. Either one counts for the streak.
- Reminders via Web Push at user-chosen times (default 21:30 in the user timezone), anchored to an existing habit label the user writes ("after dinner").
- One follow-up nudge only if nothing is written by a chosen time (default 23:00). Never more than 2 notifications a day.
- Copy rotates and is always warm ("A minute for yourself?"), never guilt ("You'll lose your streak!").
- Vercel Cron runs every 15 minutes, protected by `CRON_SECRET`, sends due notifications.
- Document the iOS requirement: the app must be added to the Home Screen for push to work.

### 6. Streak engine (put pure logic in `lib/streak.ts` with full unit tests)
All dates are computed in the user's timezone on the server.
- A day counts as written if it has a valid entry (at least one emotion and one non-empty sentence).
- Grace period: yesterday's entry can be written until 12:00 the next day and counts for yesterday (`is_backfilled = true`).
- Freezes: earn 1 freeze for every 7 consecutive written days, hold at most 3. A missed day automatically uses a freeze, and the streak continues (frozen days don't add length).
- Never miss twice: if a day is missed and no freeze is available, the streak is marked at risk (not broken, not extended). If the next day is also missed, the streak resets to 0.
- Writing on an at-risk day clears the at-risk state.
- Always track longest streak and total days written. A reset never hides history.
- Milestones at 7, 14, 30, 50, 100, 200, 365, 500, 1000 days.
- Streak counter can be hidden in settings.
- Recompute nightly via cron, and also on every entry save.
- Unit tests must cover: normal streak, grace backfill, freeze earn and use, freeze cap, at-risk then recovery, at-risk then reset, timezone boundary at midnight, traveling (timezone change), DST-free and DST zones.

### 7. Milestone rewards
- 7 days: unlock a new theme.
- 30 days: unlock monthly emotional recap.
- 50 days: unlock "Letters to future you".
- 100 days: show day 1 entry side by side with today ("Look how far you've come").
- 365 days: yearly review page.
- Celebrate with a calm, tasteful animation. No confetti overload.

### 8. Looking back
- **Calendar**: month view, each day colored by its dominant core emotion.
- **Year heatmap**: GitHub-style grid, colored by dominant emotion, shaded by intensity.
- **On this day**: entries from 1 week, 1 month, 6 months, 1 year ago, shown on the home screen when they exist.
- **Search**: full-text, with filters for tag, core emotion, date range, has photo, has audio.
- **Entry list**: reverse chronological, with emotion dots and first line preview.

### 9. Insights
- Emotion trends over weeks and months (stacked by core).
- Triggers: which tags appear most with which emotions.
- Day-of-week patterns.
- Monthly recap (after 30-day milestone): most common emotions, strongest days, life areas that lifted or drained.
- Weekly review prompt every Friday: "What pattern did you notice this week?"
- Therapy export: a clean one-page weekly or monthly summary (emotions, intensities, a few chosen excerpts the user selects) as PDF, so the user can bring it to a session if they want.

### 10. Attachments
- Photos: upload from camera or gallery, compress client-side, private bucket.
- Voice notes: record in browser, store audio, transcribe with Whisper if enabled, insert transcript into the entry.

### 11. Letters to future you
- Write a letter, choose an open date. Sealed and unreadable until then. Push notification when it opens.

### 12. Settings, export, backup
- Timezone, language (en/ar, with full RTL UI for Arabic), theme, font size, PIN lock, reminders, streak visibility, emotion depth, feature flags.
- Export everything as Markdown (one file per entry, zipped, with attachments) and as JSON.
- Export single entries or a date range as PDF.
- Automatic weekly backup: cron job exports JSON to a private Supabase storage bucket, keeps the last 8.

### 13. Optional AI reflection (Phase 5, off by default)
- Weekly reflection generated with the Claude API only when the user taps "Reflect on my week".
- Clearly labeled that entry text is sent to Anthropic. Never automatic.
- Output: gentle themes and questions, no diagnosis, no advice framed as clinical.

## App structure

```
app/
  (auth)/login
  (app)/today            # default landing
  (app)/entry/[date]
  (app)/calendar
  (app)/search
  (app)/insights
  (app)/letters
  (app)/settings
  api/cron/reminders
  api/cron/streaks
  api/cron/backup
components/
  editor/ emotion-picker/ streak/ charts/ ui/
lib/
  data/ emotions.ts prompts.ts streak.ts dates.ts push.ts
supabase/migrations/
tests/ (vitest) e2e/ (playwright)
```

Mobile-first. Bottom navigation on mobile (Today, Calendar, Insights, Settings), sidebar on desktop.

## Phases and checklists

Copy these into `PROGRESS.md` and check them off as you go.

### Phase 0: Setup
- [ ] Next.js + TypeScript + Tailwind + pnpm project initialized, ESLint and Prettier configured
- [ ] Supabase client set up, migrations folder created
- [ ] `.env.example` committed, `.gitignore` covers secrets
- [ ] `PROGRESS.md` created with all checklists
- [ ] One message to the user listing exactly what they must do: create Supabase project, create Vercel project linked to GitHub, paste env vars. Continue building against local Supabase (`supabase start`) while waiting.

### Phase 1: MVP, daily writing works
- [ ] Magic link auth restricted to `ALLOWED_EMAIL`
- [ ] Tables: profiles, entries, entry_emotions, streaks with RLS
- [ ] Today page, quick check-in with core-ring emotion picker
- [ ] Editor with autosave and `dir="auto"`
- [ ] Entry list and single entry view
- [ ] Basic streak counter (current, longest, total)
- [ ] Deployed to Vercel and working on a phone browser

### Phase 2: Habit engine
- [ ] Full 3-ring emotion picker with recents, "Not sure", intensity, up to 3 emotions, gradual unlock
- [ ] Full streak engine with grace, freezes, at-risk, reset, all unit tests passing
- [ ] Tags
- [ ] Prompts with no-repeat rule
- [ ] PWA: installable, offline drafts with sync
- [ ] Web Push reminders with cron and follow-up nudge
- [ ] Morning and evening rituals
- [ ] Dark mode, font size, Arabic UI with RTL

### Phase 3: Looking back
- [ ] Calendar view colored by emotion
- [ ] Year heatmap
- [ ] On this day
- [ ] Full-text search with filters
- [ ] Photos and voice notes (transcription behind flag)

### Phase 4: Insights and rewards
- [ ] Emotion trends, triggers, day-of-week charts
- [ ] Milestones and unlocks
- [ ] Monthly recap and Friday weekly review
- [ ] Letters to future you
- [ ] Therapy export PDF

### Phase 5: Hardening and polish
- [ ] PIN lock with inactivity timeout
- [ ] Markdown, JSON and PDF export
- [ ] Automatic weekly backup cron
- [ ] Optional AI weekly reflection behind flag
- [ ] Accessibility pass (keyboard, screen reader labels, contrast)
- [ ] Performance pass (Lighthouse 90+ on mobile for performance, accessibility, best practices, PWA)
- [ ] Empty states, loading states and error states on every page
- [ ] README with setup, deployment, and how to restore from backup

## Verification rules

Before checking off any item:
- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass.
- For UI items, run the app and test the flow with Playwright, including a 390px mobile viewport and an Arabic entry.
- For each phase, add or extend at least one Playwright end-to-end test covering the main flow.
- Commit after each completed checklist item with a clear message. Push to `main` at the end of each phase so Vercel deploys.
- At the end of each phase, write a short summary in `PROGRESS.md`: what was built, what was tested, any known issues.

## Definition of Done

The product is finished when:
- Every checklist item in Phases 0 to 5 is checked and verified.
- The app is live on Vercel, installable on the user's phone, and sends a test reminder successfully.
- A full day can be journaled end to end on mobile in under 60 seconds via the quick check-in.
- All tests pass in CI (GitHub Actions running typecheck, lint, unit and e2e tests).
- The README lets the user redeploy from scratch.

When everything is done, send the user one final message: the live URL, how to install it on their phone, how to turn on reminders, and anything that still needs their action.

## Writing style for all UI copy

- Warm, short, sentence case, no exclamation marks in system messages.
- Never use em dashes. Use commas, full stops, or reword.
- Never guilt the user about missed days.
