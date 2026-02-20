import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── RH Settings ───
export function useRhSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rh_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rh_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || {
        guests_per_server: 25,
        guests_per_chef: 60,
        guests_per_bartender: 80,
        head_waiter_enabled: true,
        coeff_mariage: 1.2,
        coeff_corporate: 1.0,
        coeff_anniversaire: 1.1,
        auto_replace_after_hours: 12,
      };
    },
    enabled: !!user,
  });
}

export function useUpsertRhSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { error } = await supabase
        .from("rh_settings" as any)
        .upsert({ ...settings, user_id: user!.id }, { onConflict: "user_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rh_settings"] });
      toast.success("Paramètres RH sauvegardés");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── WhatsApp Templates ───
export function useWhatsappTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["whatsapp_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates" as any)
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });
}

export function useUpsertWhatsappTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (template: { id?: string; name: string; content: string; is_default?: boolean }) => {
      if (template.id) {
        const { error } = await supabase
          .from("whatsapp_templates" as any)
          .update({ name: template.name, content: template.content, is_default: template.is_default || false })
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_templates" as any)
          .insert({ ...template, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp_templates"] });
      toast.success("Template sauvegardé");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── HR Calculation ───
export interface StaffNeeds {
  serveurs: number;
  chefs: number;
  barmans: number;
  maitre_hotel: number;
}

export function calculateStaffNeeds(
  guestCount: number,
  eventType: string,
  settings: any,
  quoteStaff?: { staff_servers?: number | null; staff_chefs?: number | null; staff_bartenders?: number | null; staff_head_waiter?: number | null }
): StaffNeeds {
  // If quote has explicit staff, use those
  if (quoteStaff?.staff_servers != null || quoteStaff?.staff_chefs != null) {
    return {
      serveurs: quoteStaff.staff_servers || 0,
      chefs: quoteStaff.staff_chefs || 0,
      barmans: quoteStaff.staff_bartenders || 0,
      maitre_hotel: quoteStaff.staff_head_waiter || 0,
    };
  }

  // Auto-calculate
  const typeNorm = eventType?.toLowerCase() || "";
  let coeff = 1.0;
  if (typeNorm.includes("mariage") || typeNorm === "wedding") coeff = Number(settings.coeff_mariage) || 1.2;
  else if (typeNorm.includes("corporate") || typeNorm === "corporate") coeff = Number(settings.coeff_corporate) || 1.0;
  else if (typeNorm.includes("anniversaire") || typeNorm === "birthday") coeff = Number(settings.coeff_anniversaire) || 1.1;

  return {
    serveurs: Math.ceil((guestCount / (settings.guests_per_server || 25)) * coeff),
    chefs: Math.ceil(guestCount / (settings.guests_per_chef || 60)),
    barmans: Math.ceil(guestCount / (settings.guests_per_bartender || 80)),
    maitre_hotel: settings.head_waiter_enabled ? 1 : 0,
  };
}

// ─── Event Staff with extended data ───
export function useEventStaffExtended(eventId?: string) {
  return useQuery({
    queryKey: ["event_staff_extended", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_staff")
        .select("*, team_members(id, name, phone, role, hourly_rate, skills)")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

export function useAddEventStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (staff: { event_id: string; team_member_id: string; role_assigned: string }) => {
      const { error } = await supabase.from("event_staff").insert(staff);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_staff_extended"] });
      toast.success("Membre ajouté à l'équipe");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateEventStaffStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { confirmation_status: status };
      if (status === "confirmed" || status === "refused") {
        updates.responded_at = new Date().toISOString();
      }
      const { error } = await supabase.from("event_staff").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_staff_extended"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveEventStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_staff_extended"] });
      toast.success("Membre retiré");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useMarkStaffSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_staff")
        .update({ sent_at: new Date().toISOString(), confirmation_status: "pending" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_staff_extended"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Reliability Stats (computed from confirmation_requests) ───
export function useTeamStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team_stats", user?.id],
    queryFn: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: allStaff, error } = await supabase
        .from("event_staff")
        .select("team_member_id, confirmation_status, created_at, responded_at, sent_at")
        .gte("created_at", threeMonthsAgo.toISOString());
      if (error) throw error;

      const stats: Record<string, {
        reliability: number;
        events_total: number;
        events_confirmed: number;
        events_month: number;
        avg_response_minutes: number;
      }> = {};

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      allStaff?.forEach((s: any) => {
        const id = s.team_member_id;
        if (!stats[id]) stats[id] = { reliability: 0, events_total: 0, events_confirmed: 0, events_month: 0, avg_response_minutes: 0 };
        stats[id].events_total++;
        if (s.confirmation_status === "confirmed") stats[id].events_confirmed++;
        if (new Date(s.created_at) >= monthStart) stats[id].events_month++;

        // Calculate response time
        if (s.sent_at && s.responded_at) {
          const sentAt = new Date(s.sent_at).getTime();
          const respondedAt = new Date(s.responded_at).getTime();
          const minutes = (respondedAt - sentAt) / 60000;
          stats[id].avg_response_minutes = (stats[id].avg_response_minutes + minutes) / 2;
        }
      });

      // Calculate reliability
      Object.values(stats).forEach((s) => {
        s.reliability = s.events_total > 0 ? Math.round((s.events_confirmed / s.events_total) * 100) : 50;
      });

      return stats;
    },
    enabled: !!user,
  });
}
