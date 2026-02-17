import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ─── Events ───
export function useEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*, clients(name, phone, email)").order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: Omit<TablesInsert<"events">, "user_id">) => {
      const { data, error } = await supabase.from("events").insert({ ...event, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); toast.success("Événement créé"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"events"> & { id: string }) => {
      const { error } = await supabase.from("events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); toast.success("Événement mis à jour"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); toast.success("Événement supprimé"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Clients ───
export function useClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (client: Omit<TablesInsert<"clients">, "user_id">) => {
      const { data, error } = await supabase.from("clients").insert({ ...client, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client ajouté"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Quotes ───
export function useQuotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quotes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*, clients(name), events(name, date, guest_count, type)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (quote: Omit<TablesInsert<"quotes">, "user_id">) => {
      const { data, error } = await supabase.from("quotes").insert({ ...quote, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); toast.success("Devis sauvegardé"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"quotes"> & { id: string }) => {
      const { error } = await supabase.from("quotes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); toast.success("Devis mis à jour"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Team Members ───
export function useTeamMembers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team_members", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (member: Omit<TablesInsert<"team_members">, "user_id">) => {
      const { data, error } = await supabase.from("team_members").insert({ ...member, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team_members"] }); toast.success("Membre ajouté"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Event Staff ───
export function useEventStaff(eventId?: string) {
  return useQuery({
    queryKey: ["event_staff", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_staff").select("*, team_members(name, phone, role, hourly_rate)").eq("event_id", eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useAssignStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: TablesInsert<"event_staff">) => {
      const { error } = await supabase.from("event_staff").insert(assignment);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event_staff"] }); toast.success("Staff affecté"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateStaffStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("event_staff").update({ confirmation_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event_staff"] }); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Stock ───
export function useStockItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["stock_items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_items").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateStockItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<TablesInsert<"stock_items">, "user_id">) => {
      const { data, error } = await supabase.from("stock_items").insert({ ...item, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock_items"] }); toast.success("Article ajouté"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movement: TablesInsert<"stock_movements">) => {
      const { error } = await supabase.from("stock_movements").insert(movement);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_items"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Mouvement enregistré");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useStockMovements(stockItemId?: string) {
  return useQuery({
    queryKey: ["stock_movements", stockItemId],
    queryFn: async () => {
      let query = supabase.from("stock_movements").select("*, stock_items(name), events(name)").order("created_at", { ascending: false });
      if (stockItemId) query = query.eq("stock_item_id", stockItemId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Webhook Configs ───
export function useWebhookConfigs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["webhook_configs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_configs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertWebhook() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ feature_name, webhook_url, is_active }: { feature_name: string; webhook_url: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhook_configs").upsert(
        { user_id: user!.id, feature_name, webhook_url, is_active },
        { onConflict: "user_id,feature_name" }
      );
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhook_configs"] }); toast.success("Webhook sauvegardé"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Mail Queue ───
export function useMailQueue() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mail_queue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mail_queue").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateMailStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("mail_queue").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mail_queue"] }); },
    onError: (e) => toast.error(e.message),
  });
}
