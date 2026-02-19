import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get all pipeline cards with their stages
    const { data: cards, error } = await supabase
      .from("pipeline_cards")
      .select("*, pipeline_stages!inner(name, alert_threshold_days)");

    if (error) throw error;

    let alertsCreated = 0;

    for (const card of cards || []) {
      const daysSinceEntered = Math.floor(
        (now.getTime() - new Date(card.entered_stage_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const threshold = (card as any).pipeline_stages?.alert_threshold_days || 999;
      const stageName = (card as any).pipeline_stages?.name || "";

      if (daysSinceEntered <= threshold) continue;

      // Check no recent alert
      const { data: existingAlert } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", card.user_id)
        .eq("action_url", `/crm`)
        .ilike("message", `%${card.title}%`)
        .gte("created_at", oneDayAgo)
        .maybeSingle();

      if (existingAlert) continue;

      // Special urgent for >15 days in "Devis envoyé"
      const isUrgent = stageName === "Devis envoyé" && daysSinceEntered > 15;

      await supabase.from("notifications").insert({
        user_id: card.user_id,
        type: isUrgent ? "urgent_action" : "pipeline_alert",
        message: isUrgent
          ? `🔴 URGENT — ${card.title} sans nouvelles depuis ${daysSinceEntered}j`
          : `⚠️ ${card.title} — ${stageName} depuis ${daysSinceEntered}j`,
        action_url: `/crm`,
      });

      alertsCreated++;
    }

    return new Response(JSON.stringify({ alerts: alertsCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
