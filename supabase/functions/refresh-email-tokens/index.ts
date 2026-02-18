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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all tokens expiring in the next 10 minutes
    const { data: tokens } = await supabase
      .from("oauth_tokens")
      .select("*")
      .lt("expires_at", new Date(Date.now() + 10 * 60 * 1000).toISOString());

    let refreshed = 0;

    for (const token of tokens || []) {
      try {
        if (token.provider === "google") {
          const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
          const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
          if (!googleClientId || !googleClientSecret) continue;

          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: googleClientId,
              client_secret: googleClientSecret,
              refresh_token: token.refresh_token,
              grant_type: "refresh_token",
            }),
          });
          const data = await response.json();

          if (data.access_token) {
            await supabase
              .from("oauth_tokens")
              .update({
                access_token: data.access_token,
                expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", token.id);
            refreshed++;
          }
        } else if (token.provider === "microsoft") {
          const msClientId = Deno.env.get("MICROSOFT_CLIENT_ID");
          const msClientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
          if (!msClientId || !msClientSecret) continue;

          const response = await fetch(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: msClientId,
                client_secret: msClientSecret,
                refresh_token: token.refresh_token,
                grant_type: "refresh_token",
                scope: "Mail.Read Mail.Send offline_access",
              }),
            }
          );
          const data = await response.json();

          if (data.access_token) {
            await supabase
              .from("oauth_tokens")
              .update({
                access_token: data.access_token,
                expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", token.id);
            refreshed++;
          }
        }
      } catch (e) {
        console.error(`Error refreshing token ${token.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ refreshed, total: tokens?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refresh-email-tokens error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
