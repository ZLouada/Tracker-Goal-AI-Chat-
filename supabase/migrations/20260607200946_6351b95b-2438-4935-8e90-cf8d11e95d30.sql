
-- Drop old event tables
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP FUNCTION IF EXISTS public.get_registration_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.register_for_event(uuid, jsonb) CASCADE;
DROP TYPE IF EXISTS public.event_status CASCADE;
DROP TYPE IF EXISTS public.registration_status CASCADE;

-- Enums
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'archived', 'paused');
CREATE TYPE public.goal_priority AS ENUM ('low', 'medium', 'high');

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_goals_user ON public.goals(user_id, status);

-- Time entries
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own time entries" ON public.time_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_entries_user_goal ON public.time_entries(user_id, goal_id, started_at DESC);

-- Active timers (one per user)
CREATE TABLE public.active_timers (
  user_id UUID PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_timers TO authenticated;
GRANT ALL ON public.active_timers TO service_role;
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own active timer" ON public.active_timers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily streaks
CREATE TABLE public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_logged_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_streaks TO authenticated;
GRANT ALL ON public.daily_streaks TO service_role;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streaks" ON public.daily_streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_streaks_updated BEFORE UPDATE ON public.daily_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
