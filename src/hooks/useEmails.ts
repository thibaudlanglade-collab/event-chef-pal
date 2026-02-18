import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Fetch unread emails from provider ───
export function useFetchUnreadEmails() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread_emails", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-unread-emails");
      if (error) throw error;
      return data as {
        emails: any[];
        connected: boolean;
        provider?: string;
        email_address?: string;
        error?: string;
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}

// ─── Analyze an email with AI ───
export function useAnalyzeEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emailData: {
      email_id: string;
      sender_email: string;
      sender_name: string;
      subject: string;
      body: string;
      received_at: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("analyze-email", {
        body: emailData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread_emails"] });
      qc.invalidateQueries({ queryKey: ["email_history"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error("Erreur d'analyse : " + e.message),
  });
}

// ─── Send email response ───
export function useSendEmailResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email_provider_id: string;
      reply_to_email: string;
      subject: string;
      body: string;
      original_message_id?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("send-email-response", {
        body: data,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread_emails"] });
      qc.invalidateQueries({ queryKey: ["email_history"] });
      toast.success("✅ Réponse envoyée");
    },
    onError: (e) => toast.error("Erreur d'envoi : " + e.message),
  });
}

// ─── Email history (treated emails) ───
export function useEmailHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email_history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails")
        .select("*, clients(name)")
        .eq("response_sent", true)
        .order("response_sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ─── Email settings ───
export function useEmailSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: { auto_triage_enabled: boolean }) => {
      const { error } = await supabase
        .from("email_settings")
        .upsert({ user_id: user!.id, ...settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_settings"] });
      toast.success("Paramètres email mis à jour");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── OAuth token status ───
export function useOAuthToken() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["oauth_token", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oauth_tokens")
        .select("provider, email_address, expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDeleteOAuthToken() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("oauth_tokens").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oauth_token"] });
      qc.invalidateQueries({ queryKey: ["unread_emails"] });
      toast.success("Boîte mail déconnectée");
    },
  });
}

// ─── Checklist Templates ───
export function useChecklistTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["checklist_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertChecklistTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ event_type, tasks }: { event_type: string | null; tasks: any[] }) => {
      // Check if template exists
      let query = supabase.from("checklist_templates").select("id").eq("user_id", user!.id);
      if (event_type === null) {
        query = query.is("event_type", null);
      } else {
        query = query.eq("event_type", event_type);
      }
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("checklist_templates")
          .update({ tasks, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("checklist_templates")
          .insert({ user_id: user!.id, event_type, tasks });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist_templates"] });
      toast.success("Template sauvegardé");
    },
    onError: (e) => toast.error(e.message),
  });
}
