import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const defaultDelayHours = 24;

    // Find pending requests older than delay
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - defaultDelayHours);

    const { data: pendingRequests, error: pErr } = await supabase
      .from("confirmation_requests")
      .select("id, session_id, team_member_id, created_at, team_members(name), confirmation_sessions(user_id, event_id, events(name))")
      .eq("status", "pending")
      .lt("created_at", cutoff.toISOString());

    if (pErr) throw pErr;
    if (!pendingRequests?.length) {
      return new Response(JSON.stringify({ message: "No pending requests to remind" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Group by session
    const bySession: Record<string, typeof pendingRequests> = {};
    for (const req of pendingRequests) {
      const sid = req.session_id;
      if (!bySession[sid]) bySession[sid] = [];
      bySession[sid].push(req);
    }

    // Create notifications
    const notifications: any[] = [];
    for (const [sessionId, reqs] of Object.entries(bySession)) {
      const session = (reqs[0] as any).confirmation_sessions;
      if (!session) continue;
      const eventName = session.events?.name || "un événement";
      const userId = session.user_id;
      const eventId = session.event_id;

      notifications.push({
        user_id: userId,
        type: "pending_confirmations",
        message: `${reqs.length} personne${reqs.length > 1 ? "s" : ""} n'${reqs.length > 1 ? "ont" : "a"} pas encore répondu pour "${eventName}"`,
        action_url: `/team?event=${eventId}`,
      });
    }

    if (notifications.length > 0) {
      const { error: nErr } = await supabase.from("notifications").insert(notifications);
      if (nErr) throw nErr;
    }

    return new Response(
      JSON.stringify({ message: `Created ${notifications.length} notification(s)` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
