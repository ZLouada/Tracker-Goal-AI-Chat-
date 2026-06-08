import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Profile = Tables<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) {
        console.error("Failed to fetch profile:", error.message);
        return null;
      }
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: TablesUpdate<"profiles">) => {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user!.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: (error) => {
      console.error("Failed to update profile:", error.message);
      toast.error("Failed to update profile. Please try again.");
    },
  });
}
