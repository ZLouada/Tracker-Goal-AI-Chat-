import { createClient } from "@supabase/supabase-js";

let supabaseInstance: any = null;

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.");
    }
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return supabaseInstance;
}

// ─── Goals ───

export async function createGoal(
  userId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    color?: string;
    priority?: string;
    target_minutes?: number;
    target_date?: string;
  }
) {
  const { data, error } = await getSupabase()
    .from("goals")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      color: input.color || "#6366f1",
      priority: input.priority || "medium",
      target_minutes: input.target_minutes || null,
      target_date: input.target_date || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create goal: ${error.message}`);
  return data;
}

export async function listGoals(userId: string, status: string = "active") {
  const { data, error } = await getSupabase()
    .from("goals")
    .select("id, title, category, status, priority, target_minutes, target_date, color, created_at")
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list goals: ${error.message}`);
  return data;
}

// ─── Tasks ───

export async function createTask(
  userId: string,
  input: {
    title: string;
    description?: string;
    due_date?: string;
    duration_minutes?: number;
    priority?: string;
    goal_id?: string;
  }
) {
  const { data, error } = await getSupabase()
    .from("tasks")
    .insert({
      user_id: userId,
      goal_id: input.goal_id || null,
      title: input.title,
      description: input.description || null,
      due_date: input.due_date || null,
      duration_minutes: input.duration_minutes || null,
      priority: input.priority || "medium",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
}

// ─── Plans (Goal + Tasks in one shot) ───

export async function createPlan(
  userId: string,
  input: {
    goal_title: string;
    goal_description?: string;
    category?: string;
    color?: string;
    target_date?: string;
    tasks: Array<{
      title: string;
      description?: string;
      due_date?: string;
      duration_minutes?: number;
      priority?: string;
    }>;
  }
) {
  // 1. Create the goal
  const goal = await createGoal(userId, {
    title: input.goal_title,
    description: input.goal_description,
    category: input.category,
    color: input.color,
    target_date: input.target_date,
    priority: "high",
  });

  // 2. Create all tasks linked to the goal
  const taskInserts = input.tasks.map((t) => ({
    user_id: userId,
    goal_id: goal.id,
    title: t.title,
    description: t.description || null,
    due_date: t.due_date || null,
    duration_minutes: t.duration_minutes || null,
    priority: t.priority || "medium",
  }));

  const { data: tasks, error } = await supabase
    .from("tasks")
    .insert(taskInserts)
    .select();

  if (error) throw new Error(`Failed to create tasks: ${error.message}`);

  return {
    goal,
    tasks,
    summary: `Created goal "${goal.title}" with ${tasks.length} tasks`,
  };
}

export async function updateGoalSummary(goalId: string, summaryText: string) {
  const { data, error } = await getSupabase()
    .from("goals")
    .update({ study_summary: summaryText })
    .eq("id", goalId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update goal summary: ${error.message}`);
  return data;
}

