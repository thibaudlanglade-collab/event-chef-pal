import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { email_provider_id, reply_to_email, subject, body, original_message_id } = await req.json();

    // Get OAuth token
    const { data: oauthToken } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!oauthToken) {
      return new Response(JSON.stringify({ error: "No email connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email
    if (oauthToken.provider === "google") {
      const emailContent = [
        `To: ${reply_to_email}`,
        `Subject: Re: ${subject}`,
        `In-Reply-To: ${original_message_id || ""}`,
        `References: ${original_message_id || ""}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
      ].join("\r\n");

      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${oauthToken.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (!sendRes.ok) {
        const errData = await sendRes.json();
        console.error("Gmail send error:", errData);
        return new Response(JSON.stringify({ error: "Failed to send email", details: errData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (oauthToken.provider === "microsoft") {
      const sendRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${original_message_id}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${oauthToken.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: { body: { contentType: "Text", content: body } },
          }),
        }
      );

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error("Microsoft send error:", errText);
        return new Response(JSON.stringify({ error: "Failed to send email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update email record
    await supabase
      .from("emails")
      .update({
        response_sent: true,
        response_sent_at: new Date().toISOString(),
        final_response_text: body,
      })
      .eq("email_provider_id", email_provider_id)
      .eq("user_id", userId);

    // Get email record for checklist generation
    const { data: emailRecord } = await supabase
      .from("emails")
      .select("event_id, category")
      .eq("email_provider_id", email_provider_id)
      .eq("user_id", userId)
      .maybeSingle();

    // Generate checklist for new leads
    if (emailRecord?.category === "new_lead" && emailRecord?.event_id) {
      const { data: template } = await supabase
        .from("checklist_templates")
        .select("tasks")
        .eq("user_id", userId)
        .is("event_type", null)
        .maybeSingle();

      if (template?.tasks && Array.isArray(template.tasks)) {
        const { data: event } = await supabase
          .from("events")
          .select("date")
          .eq("id", emailRecord.event_id)
          .single();

        const eventDate = event?.date ? new Date(event.date) : null;

        for (const task of template.tasks as any[]) {
          let deadline = new Date();
          if (task.delay === "immediate") {
            deadline = new Date(Date.now() + 60 * 60 * 1000);
          } else if (eventDate) {
            const match = task.delay?.match(/J-(\d+)/);
            if (match) {
              deadline = new Date(eventDate.getTime() - parseInt(match[1]) * 24 * 60 * 60 * 1000);
            }
          }

          await supabase.from("event_tasks").insert({
            event_id: emailRecord.event_id,
            task_name: task.name,
            deadline: deadline.toISOString(),
            status: "pending",
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email-response error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
