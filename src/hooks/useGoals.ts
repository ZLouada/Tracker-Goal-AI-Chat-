import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Goal = Tables<"goals">;
export type TimeEntry = Tables<"time_entries">;
export type ActiveTimer = Tables<"active_timers">;

export function useGoals(status?: Goal["status"]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id, status],
    queryFn: async () => {
      let q = supabase.from("goals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) {
        console.error("Failed to fetch goals:", error.message);
        return [] as Goal[];
      }
      return data as Goal[];
    },
    enabled: !!user,
  });
}

export function useGoal(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goal", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").eq("id", id!).single();
      if (error) {
        console.error("Failed to fetch goal:", error.message);
        return null;
      }
      return data as Goal;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"goals">, "user_id">) => {
      const { data, error } = await supabase.from("goals").insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (error) => {
      console.error("Failed to create goal:", error.message);
      toast.error("Failed to create goal. Please try again.");
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"goals"> }) => {
      const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal", vars.id] });
    },
    onError: (error) => {
      console.error("Failed to update goal:", error.message);
      toast.error("Failed to update goal. Please try again.");
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (error) => {
      console.error("Failed to delete goal:", error.message);
      toast.error("Failed to delete goal. Please try again.");
    },
  });
}

export function useTimeEntries(goalId?: string, limit = 200) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["time_entries", user?.id, goalId],
    queryFn: async () => {
      let q = supabase.from("time_entries").select("*").eq("user_id", user!.id).order("started_at", { ascending: false }).limit(limit);
      if (goalId) q = q.eq("goal_id", goalId);
      const { data, error } = await q;
      if (error) {
        console.error("Failed to fetch time entries:", error.message);
        return [] as TimeEntry[];
      }
      return data as TimeEntry[];
    },
    enabled: !!user,
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"time_entries">, "user_id">) => {
      const { data, error } = await supabase.from("time_entries").insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      console.error("Failed to create time entry:", error.message);
      toast.error("Failed to save time entry. Please try again.");
    },
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
    onError: (error) => {
      console.error("Failed to delete time entry:", error.message);
      toast.error("Failed to delete time entry. Please try again.");
    },
  });
}

export function useActiveTimer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["active_timer", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("active_timers").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) {
        console.error("Failed to fetch active timer:", error.message);
        return null;
      }
      return data as ActiveTimer | null;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ goal_id, note }: { goal_id: string; note?: string }) => {
      await supabase.from("active_timers").delete().eq("user_id", user!.id);
      const { data, error } = await supabase.from("active_timers")
        .insert({ user_id: user!.id, goal_id, note: note ?? null, started_at: new Date().toISOString() })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active_timer"] }),
    onError: (error) => {
      console.error("Failed to start timer:", error.message);
      toast.error("Failed to start timer. Please try again.");
    },
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (timer: ActiveTimer) => {
      const ended = new Date();
      const started = new Date(timer.started_at);
      const duration = Math.max(1, Math.floor((ended.getTime() - started.getTime()) / 1000));
      const { error: e1 } = await supabase.from("time_entries").insert({
        user_id: user!.id,
        goal_id: timer.goal_id,
        started_at: timer.started_at,
        ended_at: ended.toISOString(),
        duration_seconds: duration,
        note: timer.note,
      });
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from("active_timers").delete().eq("user_id", user!.id);
      if (e2) throw new Error(e2.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active_timer"] });
      qc.invalidateQueries({ queryKey: ["time_entries"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      console.error("Failed to stop timer:", error.message);
      toast.error("Failed to save timer session. Please try again.");
    },
  });
}

export function useCancelTimer() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("active_timers").delete().eq("user_id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active_timer"] }),
    onError: (error) => {
      console.error("Failed to cancel timer:", error.message);
      toast.error("Failed to cancel timer. Please try again.");
    },
  });
}

// ─── Tasks ───

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  duration_minutes: number | null;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

export function useTasks(goalId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", goalId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").order("due_date", { ascending: true });
      if (goalId) q = q.eq("goal_id", goalId);
      const { data, error } = await q;
      if (error) {
        console.error("Failed to fetch tasks:", error.message);
        return [] as Task[];
      }
      return data as Task[];
    },
    enabled: !!user && !!goalId,
  });
}

export function useToggleTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "completed" }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Failed to update task status:", error.message);
      toast.error("Failed to update task. Please try again.");
    },
  });
}

