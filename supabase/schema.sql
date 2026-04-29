-- MindShift AI — Supabase schema
-- Run this once in Supabase SQL Editor (Project: rcekhfscmyuiohxhdkzf).
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text,
  role        text,
  goals       text,
  focus       text,
  onboarded_at timestamptz,
  updated_at  timestamptz default now()
);

-- ============================================================
-- 2. JOURNAL ENTRIES
-- ============================================================
create table if not exists public.journal_entries (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now()
);
create index if not exists journal_user_idx on public.journal_entries (user_id, created_at desc);

-- ============================================================
-- 3. PROGRESS / DAILY ACTIONS
-- ============================================================
create table if not exists public.progress_days (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null, -- ISO date YYYY-MM-DD
  built       boolean default false,
  revenue     boolean default false,
  content     boolean default false,
  outreach    boolean default false,
  health      boolean default false,
  notes       text,
  updated_at  timestamptz default now(),
  primary key (user_id, date)
);

-- ============================================================
-- 4. FITNESS LOGS
-- ============================================================
create table if not exists public.fitness_logs (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null, -- workout | sleep | body | energy
  payload     jsonb not null,
  created_at  timestamptz default now()
);
create index if not exists fitness_user_idx on public.fitness_logs (user_id, created_at desc);

-- ============================================================
-- 5. CHAT HISTORY (per-agent message log)
-- ============================================================
create table if not exists public.chat_history (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  agent       text not null,
  role        text not null, -- user | assistant
  content     text not null,
  meta        jsonb,
  created_at  timestamptz default now()
);
create index if not exists chat_user_agent_idx on public.chat_history (user_id, agent, created_at desc);

-- ============================================================
-- 6. AGENT MEMORY (persistent facts + behavioral patterns)
-- ============================================================
create table if not exists public.agent_memory (
  user_id     uuid not null references auth.users(id) on delete cascade,
  scope       text not null, -- 'persistent_facts' | 'behavioral' | 'team_brief' | agent_id
  payload     jsonb not null,
  updated_at  timestamptz default now(),
  primary key (user_id, scope)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.journal_entries  enable row level security;
alter table public.progress_days    enable row level security;
alter table public.fitness_logs     enable row level security;
alter table public.chat_history     enable row level security;
alter table public.agent_memory     enable row level security;

-- Drop existing policies before recreating (safe re-run)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','journal_entries','progress_days','fitness_logs','chat_history','agent_memory')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- profiles
create policy "own profile read"   on public.profiles for select using (auth.uid() = user_id);
create policy "own profile write"  on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on public.profiles for delete using (auth.uid() = user_id);

-- journal
create policy "own journal read"   on public.journal_entries for select using (auth.uid() = user_id);
create policy "own journal write"  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "own journal update" on public.journal_entries for update using (auth.uid() = user_id);
create policy "own journal delete" on public.journal_entries for delete using (auth.uid() = user_id);

-- progress
create policy "own progress read"   on public.progress_days for select using (auth.uid() = user_id);
create policy "own progress write"  on public.progress_days for insert with check (auth.uid() = user_id);
create policy "own progress update" on public.progress_days for update using (auth.uid() = user_id);
create policy "own progress delete" on public.progress_days for delete using (auth.uid() = user_id);

-- fitness
create policy "own fitness read"   on public.fitness_logs for select using (auth.uid() = user_id);
create policy "own fitness write"  on public.fitness_logs for insert with check (auth.uid() = user_id);
create policy "own fitness update" on public.fitness_logs for update using (auth.uid() = user_id);
create policy "own fitness delete" on public.fitness_logs for delete using (auth.uid() = user_id);

-- chat
create policy "own chat read"   on public.chat_history for select using (auth.uid() = user_id);
create policy "own chat write"  on public.chat_history for insert with check (auth.uid() = user_id);
create policy "own chat update" on public.chat_history for update using (auth.uid() = user_id);
create policy "own chat delete" on public.chat_history for delete using (auth.uid() = user_id);

-- memory
create policy "own memory read"   on public.agent_memory for select using (auth.uid() = user_id);
create policy "own memory write"  on public.agent_memory for insert with check (auth.uid() = user_id);
create policy "own memory update" on public.agent_memory for update using (auth.uid() = user_id);
create policy "own memory delete" on public.agent_memory for delete using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
