-- Personal journal: initial schema.
-- Every table carries user_id and is protected by Row Level Security so rows are
-- only visible to and writable by their owner.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Only the email(s) listed here can create an account. The app keeps this in
-- sync with the ALLOWED_EMAIL environment variable through
-- public.sync_allowed_email(), which only the service role may call.
create table private.allowed_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.sync_allowed_email(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.allowed_emails where email <> lower(p_email);
  insert into private.allowed_emails (email) values (lower(p_email))
  on conflict (email) do nothing;
end;
$$;

revoke all on function public.sync_allowed_email(text) from public, anon, authenticated;
grant execute on function public.sync_allowed_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Dubai',
  language text not null default 'en' check (language in ('en', 'ar')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  palette text not null default 'calm',
  font_size smallint not null default 19 check (font_size between 14 and 28),
  pin_hash text,
  lock_timeout_minutes smallint not null default 5 check (lock_timeout_minutes between 1 and 240),
  show_streak boolean not null default true,
  emotion_depth_unlocked smallint not null default 1 check (emotion_depth_unlocked between 1 and 3),
  show_prompts boolean not null default true,
  body_check_enabled boolean not null default false,
  -- reminders
  reminders_enabled boolean not null default false,
  reminder_time time not null default '21:30',
  reminder_anchor text not null default '',
  nudge_enabled boolean not null default true,
  nudge_time time not null default '23:00',
  morning_reminder_enabled boolean not null default false,
  morning_reminder_time time not null default '08:00',
  notifications_sent_on date,
  notifications_sent_count smallint not null default 0,
  notifications_sent_kinds text,
  -- feature flags (anything that sends text to an AI service is off by default)
  transcription_enabled boolean not null default false,
  ai_reflection_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Today's date in the user's timezone.
create or replace function public.user_today(p_user uuid default auth.uid())
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select p.timezone from public.profiles p where p.user_id = p_user),
    'Asia/Dubai'))::date;
$$;

-- ---------------------------------------------------------------------------
-- entries and emotions
-- ---------------------------------------------------------------------------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  body jsonb,
  body_text text not null default '',
  mood_valence smallint check (mood_valence between 1 and 5),
  word_count integer not null default 0,
  ritual text not null default 'free' check (ritual in ('morning', 'evening', 'free')),
  is_backfilled boolean not null default false,
  prompt_id text,
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body_text, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index entries_search_idx on public.entries using gin (search);
create index entries_user_date_idx on public.entries (user_id, entry_date desc);
create trigger entries_updated_at before update on public.entries
  for each row execute function public.set_updated_at();

create table public.entry_emotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  core text not null check (core in ('happy', 'sad', 'angry', 'fearful', 'bad', 'surprised', 'disgusted')),
  middle text,
  precise text,
  intensity smallint not null default 3 check (intensity between 1 and 5),
  position smallint not null default 1 check (position between 1 and 3),
  body_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, position),
  check (precise is null or middle is not null)
);

create index entry_emotions_entry_idx on public.entry_emotions (entry_id);
create trigger entry_emotions_updated_at before update on public.entry_emotions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
create trigger tags_updated_at before update on public.tags
  for each row execute function public.set_updated_at();

create table public.entry_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, tag_id)
);
create index entry_tags_tag_idx on public.entry_tags (tag_id);

-- ---------------------------------------------------------------------------
-- attachments
-- ---------------------------------------------------------------------------

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  kind text not null check (kind in ('photo', 'audio')),
  storage_path text not null,
  mime_type text,
  size_bytes integer,
  transcript text,
  duration_seconds numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attachments_entry_idx on public.attachments (entry_id);
create trigger attachments_updated_at before update on public.attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- streaks
-- ---------------------------------------------------------------------------

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  current_length integer not null default 0,
  longest_length integer not null default 0,
  total_days_written integer not null default 0,
  freezes_available smallint not null default 0 check (freezes_available between 0 and 3),
  at_risk boolean not null default false,
  last_counted_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger streaks_updated_at before update on public.streaks
  for each row execute function public.set_updated_at();

create table public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  type text not null check (type in ('written', 'freeze_used', 'at_risk', 'reset', 'milestone')),
  value integer,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, type)
);
create index streak_events_user_date_idx on public.streak_events (user_id, date desc);

-- ---------------------------------------------------------------------------
-- letters to future you
-- ---------------------------------------------------------------------------

create table public.future_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null,
  sealed_until date not null,
  opened_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger future_letters_updated_at before update on public.future_letters
  for each row execute function public.set_updated_at();

-- Sealed letters are listed without their contents.
create or replace function public.letters_overview()
returns table (
  id uuid,
  title text,
  sealed_until date,
  opened_at timestamptz,
  created_at timestamptz,
  is_open boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id,
         case when l.sealed_until <= public.user_today(auth.uid()) then l.title else '' end,
         l.sealed_until, l.opened_at, l.created_at,
         l.sealed_until <= public.user_today(auth.uid())
  from public.future_letters l
  where l.user_id = auth.uid()
  order by l.sealed_until asc;
$$;
revoke all on function public.letters_overview() from public, anon;
grant execute on function public.letters_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- push subscriptions, prompt history, AI reflections
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  device_label text not null default '',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create table public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt_id text not null,
  shown_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_id, shown_on)
);

create table public.ai_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'entries', 'entry_emotions', 'tags', 'entry_tags', 'attachments',
    'streaks', 'streak_events', 'push_subscriptions', 'prompt_history', 'ai_reflections'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_owner', t);
  end loop;
end;
$$;

-- Letters: the owner can always create and delete, but can only read or edit a
-- letter once its open date has arrived.
alter table public.future_letters enable row level security;
alter table public.future_letters force row level security;
create policy future_letters_insert on public.future_letters for insert to authenticated
  with check (user_id = (select auth.uid()) and sealed_until > public.user_today((select auth.uid())));
create policy future_letters_select on public.future_letters for select to authenticated
  using (user_id = (select auth.uid()) and sealed_until <= public.user_today((select auth.uid())));
create policy future_letters_update on public.future_letters for update to authenticated
  using (user_id = (select auth.uid()) and sealed_until <= public.user_today((select auth.uid())))
  with check (user_id = (select auth.uid()));
create policy future_letters_delete on public.future_letters for delete to authenticated
  using (user_id = (select auth.uid()));

-- Streaks are written by the server, but RLS still scopes reads to the owner.
-- (The owner policy above allows the server action, running as the user, to upsert.)

-- ---------------------------------------------------------------------------
-- New user bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from private.allowed_emails a where a.email = lower(new.email)) then
    raise exception 'This journal is private.';
  end if;

  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  insert into public.streaks (user_id) values (new.id) on conflict do nothing;
  insert into public.tags (user_id, name, is_default)
  select new.id, n, true
  from unnest(array['work', 'family', 'health', 'money', 'relationships', 'friends', 'self', 'ideas', 'gratitude']) as n
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Search
-- ---------------------------------------------------------------------------

create or replace function public.search_entries(
  p_query text default null,
  p_tag uuid default null,
  p_core text default null,
  p_from date default null,
  p_to date default null,
  p_has_photo boolean default false,
  p_has_audio boolean default false,
  p_limit integer default 50
)
returns setof public.entries
language sql
stable
security invoker
set search_path = ''
as $$
  select e.*
  from public.entries e
  where e.user_id = auth.uid()
    and (p_query is null or p_query = '' or e.search @@ websearch_to_tsquery('simple', p_query)
         or e.body_text ilike '%' || p_query || '%' or e.title ilike '%' || p_query || '%')
    and (p_from is null or e.entry_date >= p_from)
    and (p_to is null or e.entry_date <= p_to)
    and (p_tag is null or exists (select 1 from public.entry_tags t where t.entry_id = e.id and t.tag_id = p_tag))
    and (p_core is null or exists (select 1 from public.entry_emotions m where m.entry_id = e.id and m.core = p_core))
    and (not p_has_photo or exists (select 1 from public.attachments a where a.entry_id = e.id and a.kind = 'photo'))
    and (not p_has_audio or exists (select 1 from public.attachments a where a.entry_id = e.id and a.kind = 'audio'))
  order by e.entry_date desc
  limit least(greatest(p_limit, 1), 200);
$$;
grant execute on function public.search_entries(text, uuid, text, date, date, boolean, boolean, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private buckets, objects live under "<user_id>/..."
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('attachments', 'attachments', false, 26214400),
  ('backups', 'backups', false, 104857600)
on conflict (id) do nothing;

create policy "attachments owner read" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "attachments owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "attachments owner update" on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "attachments owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "backups owner read" on storage.objects for select to authenticated
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = (select auth.uid())::text);
