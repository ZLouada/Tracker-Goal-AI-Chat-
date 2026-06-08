-- ============================================================
-- TrackerGoal: Full schema for Clerk authentication
-- user_id is TEXT to accept Clerk IDs (e.g. "user_2abc...")
-- RLS is permissive (client filters by user_id)
-- ============================================================

-- Helper function for updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- ENUMS ----
DO $$ BEGIN
  CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'archived', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---- PROFILES ----
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  company_description TEXT,
  company_slug TEXT,
  website TEXT,
  social_links JSONB,
  theme_primary TEXT,
  theme_accent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ---- GOALS ----
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  target_minutes INTEGER,
  target_date DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_days INTEGER[],
  status public.goal_status NOT NULL DEFAULT 'active',
  priority public.goal_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO anon, authenticated;
CREATE POLICY "goals_all" ON public.goals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id, status);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- TIME ENTRIES ----
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO anon, authenticated;
CREATE POLICY "time_entries_all" ON public.time_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_entries_user_goal ON public.time_entries(user_id, goal_id, started_at DESC);

-- ---- ACTIVE TIMERS (one per user) ----
CREATE TABLE IF NOT EXISTS public.active_timers (
  user_id TEXT PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_timers TO anon, authenticated;
CREATE POLICY "active_timers_all" ON public.active_timers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ---- DAILY STREAKS ----
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_logged_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_id)
);
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_streaks TO anon, authenticated;
CREATE POLICY "daily_streaks_all" ON public.daily_streaks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_streaks_updated BEFORE UPDATE ON public.daily_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- USER ROLES ----
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role public.app_role NOT NULL
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO anon, authenticated;
CREATE POLICY "user_roles_all" ON public.user_roles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ---- has_role function ----
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE;
