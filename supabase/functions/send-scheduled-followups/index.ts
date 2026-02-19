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

    const now = new Date().toISOString();

    // Get pending followups that are due
    const { data: followups, error: fetchErr } = await supabase
      .from("scheduled_followups")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (fetchErr) throw fetchErr;

    let processed = 0;

    for (const followup of followups || []) {
      // Get current card state
      const { data: card } = await supabase
        .from("pipeline_cards")
        .select("stage_id, last_contacted_at")
        .eq("id", followup.card_id)
        .single();

      // Cancel if card doesn't exist or there was a recent interaction
      if (!card || (card.last_contacted_at && new Date(card.last_contacted_at) > new Date(followup.created_at))) {
        await supabase
          .from("scheduled_followups")
          .update({ status: "cancelled", cancelled_at: now })
          .eq("id", followup.id);
        continue;
      }

      // Get OAuth token for sending
      const { data: token } = await supabase
        .from("oauth_tokens")
        .select("*")
        .eq("user_id", followup.user_id)
        .single();

      if (!token) {
        console.log(`No OAuth token for user ${followup.user_id}, skipping`);
        continue;
      }

      // Send via Gmail API
      if (token.provider === "google") {
        const rawEmail = [
          `To: ${followup.email_to}`,
          `Subject: ${followup.email_subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          "",
          followup.email_body,
        ].join("\r\n");

        const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encoded }),
        });

        if (!gmailRes.ok) {
          console.error(`Gmail send failed: ${await gmailRes.text()}`);
          continue;
        }
      }

      // Mark as sent
      await supabase
        .from("scheduled_followups")
        .update({ status: "sent", sent_at: now })
        .eq("id", followup.id);

      // Update card
      await supabase
        .from("pipeline_cards")
        .update({ last_contacted_at: now })
        .eq("id", followup.card_id);

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          user_id: followup.user_id,
          type: "scheduled_followup_sent",
          message: `✅ Relance auto envoyée à ${followup.email_to}`,
          action_url: `/crm`,
        });

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
