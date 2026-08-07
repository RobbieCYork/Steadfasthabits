-- Steadfast Habits — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: uses "if not exists" / "or replace" throughout.
--
-- Structured in two passes on purpose: all tables are created first (bare, no
-- policies), then all row-level-security policies and functions afterward.
-- Several policies reference sibling tables (e.g. the competitions policy
-- checks competition_members), so every table must exist before any policy
-- referencing it is created — Postgres validates policy expressions immediately.

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- One row per signed-up user. Mirrors auth.users, holds display info.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#2F6B4C',
  created_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal_points integer not null default 150,
  visibility text not null default 'private' check (visibility in ('public','private')),
  invite_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.competition_members (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (competition_id, profile_id)
);

-- scope_type = 'solo'        -> scope_id is the owning profile's id
-- scope_type = 'competition' -> scope_id is the competition's id
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⭐',
  category text not null default 'custom',
  frequency text not null default 'daily' check (frequency in ('daily','weekly','monthly')),
  scope_type text not null check (scope_type in ('solo','competition')),
  scope_id uuid not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists habits_scope_idx on public.habits (scope_type, scope_id);

-- One row = "this profile completed this habit in this period".
-- period_key is 'YYYY-MM-DD' (daily), 'YYYY-Www' (weekly, ISO), or 'YYYY-MM' (monthly).
create table if not exists public.entries (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  period_key text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, habit_id, period_key)
);

create index if not exists entries_habit_idx on public.entries (habit_id);

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_members enable row level security;
alter table public.habits enable row level security;
alter table public.entries enable row level security;
alter table public.friendships enable row level security;

-- ---------- profiles ----------

drop policy if exists "profiles are readable by any signed-in user" on public.profiles;
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------- competitions ----------

drop policy if exists "competitions visible if public or member" on public.competitions;
create policy "competitions visible if public or member"
  on public.competitions for select
  to authenticated
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.competition_members m
      where m.competition_id = competitions.id and m.profile_id = auth.uid()
    )
  );

drop policy if exists "users can create competitions" on public.competitions;
create policy "users can create competitions"
  on public.competitions for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owner can update competition" on public.competitions;
create policy "owner can update competition"
  on public.competitions for update
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "owner can delete competition" on public.competitions;
create policy "owner can delete competition"
  on public.competitions for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------- competition_members ----------

-- Membership check as a SECURITY DEFINER function: it bypasses RLS internally,
-- so it can be used inside the competition_members policy itself without the
-- self-referencing subquery that used to cause "infinite recursion detected"
-- (Postgres re-evaluates a table's own RLS policy for any subquery against
-- that same table, including subqueries inside its own policy).
create or replace function public.is_competition_member(p_competition_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.competition_members m
    where m.competition_id = p_competition_id and m.profile_id = auth.uid()
  );
$$;

drop policy if exists "members visible to other members or if public" on public.competition_members;
create policy "members visible to other members or if public"
  on public.competition_members for select
  to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.competitions c
      where c.id = competition_members.competition_id
        and (c.visibility = 'public' or c.owner_id = auth.uid())
    )
    or public.is_competition_member(competition_members.competition_id)
  );

drop policy if exists "self can leave competition" on public.competition_members;
create policy "self can leave competition"
  on public.competition_members for delete
  to authenticated
  using (profile_id = auth.uid());

-- Joining is done exclusively through the join_competition() function below
-- (security definer), so there is intentionally no direct insert policy here.

-- ---------- habits ----------

drop policy if exists "habits visible within their scope" on public.habits;
create policy "habits visible within their scope"
  on public.habits for select
  to authenticated
  using (
    (scope_type = 'solo' and scope_id = auth.uid())
    or (scope_type = 'competition' and exists (
      select 1 from public.competitions c
      where c.id = habits.scope_id
        and (c.visibility = 'public' or c.owner_id = auth.uid() or exists (
          select 1 from public.competition_members m where m.competition_id = c.id and m.profile_id = auth.uid()
        ))
    ))
  );

drop policy if exists "users can add habits to their own scope" on public.habits;
create policy "users can add habits to their own scope"
  on public.habits for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and (
      (scope_type = 'solo' and scope_id = auth.uid())
      or (scope_type = 'competition' and exists (
        select 1 from public.competition_members m where m.competition_id = habits.scope_id and m.profile_id = auth.uid()
      ))
    )
  );

drop policy if exists "owner can delete their habit" on public.habits;
create policy "owner can delete their habit"
  on public.habits for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------- entries ----------

drop policy if exists "entries visible to self and habit-mates" on public.entries;
create policy "entries visible to self and habit-mates"
  on public.entries for select
  to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.habits h
      where h.id = entries.habit_id
        and h.scope_type = 'competition'
        and exists (
          select 1 from public.competitions c
          where c.id = h.scope_id
            and (c.visibility = 'public' or c.owner_id = auth.uid() or exists (
              select 1 from public.competition_members m where m.competition_id = c.id and m.profile_id = auth.uid()
            ))
        )
    )
  );

drop policy if exists "users manage only their own entries" on public.entries;
create policy "users manage only their own entries"
  on public.entries for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------- friendships ----------

drop policy if exists "see friendships you're party to" on public.friendships;
create policy "see friendships you're party to"
  on public.friendships for select
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "send friend requests" on public.friendships;
create policy "send friend requests"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid());

drop policy if exists "respond to friend requests" on public.friendships;
create policy "respond to friend requests"
  on public.friendships for update
  to authenticated
  using (addressee_id = auth.uid());

drop policy if exists "remove a friendship you're party to" on public.friendships;
create policy "remove a friendship you're party to"
  on public.friendships for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ============================================================
-- FUNCTIONS / TRIGGERS
-- ============================================================

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    (array['#2F6B4C','#B9822E','#AD4A70','#4E4FA0','#276E71','#A8462E','#6B7F3E','#7A5AA6'])[1 + floor(random()*8)]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Join a competition by invite code, or by id if it's public. Returns the competition id.
create or replace function public.join_competition(p_code text default null, p_competition_id uuid default null)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_comp public.competitions;
begin
  if p_competition_id is not null then
    select * into v_comp from public.competitions where id = p_competition_id and visibility = 'public';
  elsif p_code is not null then
    select * into v_comp from public.competitions where invite_code = upper(trim(p_code));
  end if;

  if v_comp.id is null then
    raise exception 'Competition not found';
  end if;

  insert into public.competition_members (competition_id, profile_id)
  values (v_comp.id, auth.uid())
  on conflict do nothing;

  return v_comp.id;
end;
$$;

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.entries;
alter publication supabase_realtime add table public.competition_members;
alter publication supabase_realtime add table public.competitions;
alter publication supabase_realtime add table public.habits;
