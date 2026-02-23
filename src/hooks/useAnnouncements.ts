import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Announcements (authenticated) ───
export function useAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["announcements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAnnouncementByEvent(eventId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["announcement_by_event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!eventId,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      message_content: string;
      staff_needs: Record<string, number>;
      status?: string;
      sent_at?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("announcements")
        .insert({
          ...data,
          user_id: user!.id,
          staff_needs: data.staff_needs as any,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement_by_event"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; message_content?: string; staff_needs?: Record<string, number>; status?: string; sent_at?: string }) => {
      const { error } = await supabase
        .from("announcements")
        .update({
          ...updates,
          staff_needs: updates.staff_needs as any,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement_by_event"] });
      qc.invalidateQueries({ queryKey: ["form_responses"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Form responses (authenticated admin) ───
export function useFormResponses(announcementId?: string) {
  return useQuery({
    queryKey: ["form_responses", announcementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_responses")
        .select("*")
        .eq("announcement_id", announcementId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!announcementId,
  });
}

// ─── Public hooks (no auth) ───
export function usePublicAnnouncement(token?: string) {
  return useQuery({
    queryKey: ["public_announcement", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, events(id, name, date, venue, time, guest_count, type)")
        .eq("token", token!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

export function useSubmitFormResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      announcement_id: string;
      first_name: string;
      role: string;
      available: boolean;
      phone?: string;
    }) => {
      // Check for existing response (same name + role)
      const { data: existing } = await supabase
        .from("form_responses")
        .select("id")
        .eq("announcement_id", data.announcement_id)
        .ilike("first_name", data.first_name.trim())
        .eq("role", data.role)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("form_responses")
          .update({
            available: data.available,
            phone: data.phone || null,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("form_responses")
          .insert({
            announcement_id: data.announcement_id,
            first_name: data.first_name.trim(),
            role: data.role,
            available: data.available,
            phone: data.phone || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form_responses"] });
      qc.invalidateQueries({ queryKey: ["public_announcement"] });
    },
    onError: (e) => toast.error(e.message),
  });
}
