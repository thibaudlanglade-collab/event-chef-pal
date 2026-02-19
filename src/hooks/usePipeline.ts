import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Pipeline Stages ───
export function usePipelineStages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pipeline_stages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertPipelineStage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (stage: { id?: string; name: string; color: string; position: number; alert_threshold_days: number; is_default: boolean }) => {
      const payload = { ...stage, user_id: user!.id };
      const { data, error } = await supabase.from("pipeline_stages").upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pipeline_stages"] }); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pipeline_stages"] }); toast.success("Étape supprimée"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Pipeline Cards ───
export function usePipelineCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pipeline_cards", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_cards")
        .select("*, clients(name, email, phone), events(name, date, type, guest_count, venue, status), quotes(total_ttc, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreatePipelineCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (card: { stage_id: string; client_id: string; event_id?: string; quote_id?: string; title: string; amount?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("pipeline_cards")
        .insert({ ...card, user_id: user!.id })
        .select("*, clients(name, email, phone), events(name, date, type, guest_count, venue, status), quotes(total_ttc, status)")
        .single();
      if (error) throw error;
      // Create initial history entry
      await supabase.from("pipeline_history").insert({
        card_id: data.id,
        to_stage_id: card.stage_id,
        moved_by: user!.id,
        note: "Carte créée",
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline_cards"] });
      qc.invalidateQueries({ queryKey: ["pipeline_history"] });
      toast.success("Client ajouté au pipeline");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdatePipelineCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; stage_id?: string; title?: string; amount?: number; notes?: string; last_contacted_at?: string; entered_stage_at?: string }) => {
      const { error } = await supabase.from("pipeline_cards").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pipeline_cards"] }); },
    onError: (e) => toast.error(e.message),
  });
}

export function useMovePipelineCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ cardId, fromStageId, toStageId, note }: { cardId: string; fromStageId: string; toStageId: string; note?: string }) => {
      // Update card
      const { error } = await supabase.from("pipeline_cards").update({
        stage_id: toStageId,
        entered_stage_at: new Date().toISOString(),
      }).eq("id", cardId);
      if (error) throw error;
      // Record history
      await supabase.from("pipeline_history").insert({
        card_id: cardId,
        from_stage_id: fromStageId,
        to_stage_id: toStageId,
        moved_by: user!.id,
        note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline_cards"] });
      qc.invalidateQueries({ queryKey: ["pipeline_history"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePipelineCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pipeline_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pipeline_cards"] }); toast.success("Carte supprimée"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Pipeline History ───
export function usePipelineHistory(cardId?: string) {
  return useQuery({
    queryKey: ["pipeline_history", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_history")
        .select("*, pipeline_stages!pipeline_history_to_stage_id_fkey(name, color)")
        .eq("card_id", cardId!)
        .order("moved_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });
}

// ─── Followup Templates ───
export function useFollowupTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followup_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_followup_templates")
        .select("*, pipeline_stages(name, position)")
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertFollowupTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (template: { id?: string; stage_id: string; subject_template: string; body_template: string }) => {
      const { error } = await supabase.from("pipeline_followup_templates").upsert({ ...template, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["followup_templates"] }); toast.success("Template sauvegardé"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Scheduled Followups ───
export function useScheduledFollowups(cardId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scheduled_followups", cardId || "all"],
    queryFn: async () => {
      let query = supabase.from("scheduled_followups").select("*").eq("status", "pending").order("scheduled_at");
      if (cardId) query = query.eq("card_id", cardId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateScheduledFollowup() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (followup: { card_id: string; scheduled_at: string; email_to: string; email_subject: string; email_body: string }) => {
      const { error } = await supabase.from("scheduled_followups").insert({ ...followup, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_followups"] }); toast.success("Relance programmée"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useCancelScheduledFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_followups").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled_followups"] }); toast.success("Relance annulée"); },
    onError: (e) => toast.error(e.message),
  });
}
