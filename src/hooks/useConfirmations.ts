import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useConfirmationSessions(eventId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["confirmation_sessions", eventId],
    queryFn: async () => {
      let query = supabase.from("confirmation_sessions").select("*").order("created_at", { ascending: false });
      if (eventId) query = query.eq("event_id", eventId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!eventId,
  });
}

export function useCreateConfirmationSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ event_id, team_member_ids }: { event_id: string; team_member_ids: string[] }) => {
      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: session, error: sessionError } = await supabase
        .from("confirmation_sessions")
        .insert({ user_id: user!.id, event_id, expires_at: expiresAt.toISOString() })
        .select()
        .single();
      if (sessionError) throw sessionError;

      // Create requests for each team member
      const requests = team_member_ids.map((id) => ({
        session_id: session.id,
        team_member_id: id,
      }));
      const { error: reqError } = await supabase.from("confirmation_requests").insert(requests);
      if (reqError) throw reqError;

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["confirmation_sessions"] });
      qc.invalidateQueries({ queryKey: ["confirmation_requests"] });
      toast.success("Session de confirmation créée");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useConfirmationRequests(sessionId?: string) {
  return useQuery({
    queryKey: ["confirmation_requests", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmation_requests")
        .select("*, team_members(name, phone, role)")
        .eq("session_id", sessionId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useConfirmationRequestsByEvent(eventId?: string) {
  return useQuery({
    queryKey: ["confirmation_requests_event", eventId],
    queryFn: async () => {
      // Get all sessions for this event
      const { data: sessions, error: sErr } = await supabase
        .from("confirmation_sessions")
        .select("id")
        .eq("event_id", eventId!);
      if (sErr) throw sErr;
      if (!sessions?.length) return [];

      const sessionIds = sessions.map((s) => s.id);
      const { data, error } = await supabase
        .from("confirmation_requests")
        .select("*, team_members(name, phone, role)")
        .in("session_id", sessionIds)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useUpdateConfirmationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("confirmation_requests")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["confirmation_requests"] });
      qc.invalidateQueries({ queryKey: ["confirmation_requests_event"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

// Public hook for confirm page (no auth needed)
export function usePublicSession(sessionId?: string) {
  return useQuery({
    queryKey: ["public_session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmation_sessions")
        .select("*, events(name, date, venue, time)")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function usePublicConfirmationRequests(sessionId?: string) {
  return useQuery({
    queryKey: ["public_confirmation_requests", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmation_requests")
        .select("*, team_members(name)")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useConflicts(eventId?: string) {
  return useQuery({
    queryKey: ["conflicts", eventId],
    queryFn: async () => {
      let query = supabase.from("conflicts").select("*, events!conflicts_event_id_2_fkey(name, date)");
      if (eventId) query = query.eq("event_id_1", eventId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// Get reliability stats for team members (last 3 months)
export function useTeamReliability() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team_reliability", user?.id],
    queryFn: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error } = await supabase
        .from("confirmation_requests")
        .select("team_member_id, status, session_id, confirmation_sessions(created_at)")
        .gte("created_at", threeMonthsAgo.toISOString())
        .not("team_member_id", "is", null);
      if (error) throw error;

      // Calculate reliability per team member
      const stats: Record<string, { total: number; confirmed: number }> = {};
      data?.forEach((r) => {
        const id = r.team_member_id!;
        if (!stats[id]) stats[id] = { total: 0, confirmed: 0 };
        if (r.status !== "pending") {
          stats[id].total++;
          if (r.status === "confirmed") stats[id].confirmed++;
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}

// Check conflicts for a given date
export function useExistingConfirmations(date?: string) {
  return useQuery({
    queryKey: ["existing_confirmations", date],
    queryFn: async () => {
      if (!date) return [];
      // Find all confirmed requests for events on this date
      const { data: sessions, error: sErr } = await supabase
        .from("confirmation_sessions")
        .select("id, event_id, events(name, date)")
        .filter("events.date", "eq", date);
      if (sErr) throw sErr;

      const validSessions = sessions?.filter((s) => (s.events as any)?.date === date) || [];
      if (!validSessions.length) return [];

      const sessionIds = validSessions.map((s) => s.id);
      const { data: requests, error: rErr } = await supabase
        .from("confirmation_requests")
        .select("team_member_id, status, session_id")
        .in("session_id", sessionIds)
        .eq("status", "confirmed");
      if (rErr) throw rErr;

      // Map team_member_id -> event info
      return (requests || []).map((r) => {
        const session = validSessions.find((s) => s.id === r.session_id);
        return {
          team_member_id: r.team_member_id,
          event_name: (session?.events as any)?.name,
          event_id: session?.event_id,
        };
      });
    },
    enabled: !!date,
  });
}
