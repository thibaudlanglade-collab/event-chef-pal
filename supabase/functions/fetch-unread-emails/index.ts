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

    // Get OAuth token
    const { data: oauthToken } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!oauthToken) {
      return new Response(JSON.stringify({ emails: [], connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emails: any[] = [];

    if (oauthToken.provider === "google") {
      // Fetch Gmail unread emails
      const listRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=50",
        { headers: { Authorization: `Bearer ${oauthToken.access_token}` } }
      );
      const listData = await listRes.json();

      if (listData.error) {
        return new Response(JSON.stringify({ emails: [], error: "token_expired", connected: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch details for each message (max 20 to avoid timeout)
      const messages = (listData.messages || []).slice(0, 20);
      for (const msg of messages) {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            { headers: { Authorization: `Bearer ${oauthToken.access_token}` } }
          );
          const detail = await detailRes.json();

          const headers = detail.payload?.headers || [];
          const from = headers.find((h: any) => h.name === "From")?.value || "";
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
          const date = headers.find((h: any) => h.name === "Date")?.value || "";

          let body = "";
          if (detail.payload?.parts) {
            const textPart = detail.payload.parts.find((p: any) => p.mimeType === "text/plain");
            if (textPart?.body?.data) {
              body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
            }
          } else if (detail.payload?.body?.data) {
            body = atob(detail.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }

          emails.push({
            id: msg.id,
            sender_email: from.match(/<(.+)>/)?.[1] || from,
            sender_name: from.split("<")[0].trim().replace(/"/g, ""),
            subject,
            body: body.substring(0, 3000), // Limit body size
            received_at: new Date(date).toISOString(),
          });
        } catch (e) {
          console.error(`Error fetching message ${msg.id}:`, e);
        }
      }
    } else if (oauthToken.provider === "microsoft") {
      const res = await fetch(
        "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false&$top=50&$select=id,from,subject,body,receivedDateTime",
        { headers: { Authorization: `Bearer ${oauthToken.access_token}` } }
      );
      const data = await res.json();

      if (data.error) {
        return new Response(JSON.stringify({ emails: [], error: "token_expired", connected: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      emails = (data.value || []).map((msg: any) => ({
        id: msg.id,
        sender_email: msg.from?.emailAddress?.address || "",
        sender_name: msg.from?.emailAddress?.name || "",
        subject: msg.subject || "",
        body: (msg.body?.content || "").substring(0, 3000),
        received_at: msg.receivedDateTime,
      }));
    }

    // Check which emails are already analyzed
    const emailIds = emails.map((e) => e.id);
    const { data: existingEmails } = await supabase
      .from("emails")
      .select("email_provider_id, category, is_urgent, suggested_response, extracted_info, calendar_check, upsell_suggestions, response_sent, client_id, event_id")
      .in("email_provider_id", emailIds);

    const existingMap = new Map((existingEmails || []).map((e: any) => [e.email_provider_id, e]));

    const enrichedEmails = emails.map((email) => ({
      ...email,
      analysis: existingMap.get(email.id) || null,
    }));

    return new Response(
      JSON.stringify({ emails: enrichedEmails, connected: true, provider: oauthToken.provider, email_address: oauthToken.email_address }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-unread-emails error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
