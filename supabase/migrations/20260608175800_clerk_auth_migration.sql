-- ============================================================
-- Migration: Adapt Supabase tables for Clerk authentication
-- 
-- Clerk user IDs are text strings (e.g. "user_2abc..."), not UUIDs.
-- Since Clerk handles auth (not Supabase Auth), we need to:
--   1. Change user_id columns from UUID to TEXT
--   2. Grant anon role access (no Supabase session exists)
--   3. Replace auth.uid()-based RLS with open policies
--      (client-side filtering by user_id is already applied)
-- ============================================================

-- ---- 1. GOALS ----

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;

-- Drop indexes that reference user_id (will recreate after type change)
DROP INDEX IF EXISTS idx_goals_user;

-- Change user_id from UUID to TEXT
ALTER TABLE public.goals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Grant anon role access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO anon;

-- Create new permissive RLS policy (client filters by user_id)
CREATE POLICY "Allow all access to goals" ON public.goals
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Recreate index
CREATE INDEX idx_goals_user ON public.goals(user_id, status);


-- ---- 2. TIME ENTRIES ----

DROP POLICY IF EXISTS "Users manage own time entries" ON public.time_entries;
DROP INDEX IF EXISTS idx_entries_user_goal;

ALTER TABLE public.time_entries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO anon;

CREATE POLICY "Allow all access to time_entries" ON public.time_entries
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_entries_user_goal ON public.time_entries(user_id, goal_id, started_at DESC);


-- ---- 3. ACTIVE TIMERS ----

DROP POLICY IF EXISTS "Users manage own active timer" ON public.active_timers;

ALTER TABLE public.active_timers ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_timers TO anon;

CREATE POLICY "Allow all access to active_timers" ON public.active_timers
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);


-- ---- 4. DAILY STREAKS ----

DROP POLICY IF EXISTS "Users manage own streaks" ON public.daily_streaks;

ALTER TABLE public.daily_streaks ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_streaks TO anon;

CREATE POLICY "Allow all access to daily_streaks" ON public.daily_streaks
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);


-- ---- 5. PROFILES ----

-- Profiles use id (not user_id) as the user identifier
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;

CREATE POLICY "Allow all access to profiles" ON public.profiles
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);


-- ---- 6. USER ROLES ----

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO anon;

CREATE POLICY "Allow all access to user_roles" ON public.user_roles
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
