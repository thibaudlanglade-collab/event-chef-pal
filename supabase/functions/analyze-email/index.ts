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

    const { email_id, sender_email, sender_name, subject, body, received_at } = await req.json();

    // Get user context
    const [clientsRes, eventsRes] = await Promise.all([
      supabase.from("clients").select("id, name, email").eq("email", sender_email).maybeSingle(),
      supabase
        .from("events")
        .select("name, date, time, venue, status, guest_count")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date"),
    ]);

    const existingClient = clientsRes.data;
    const upcomingEvents = eventsRes.data || [];

    const systemPrompt = `Tu es l'assistant intelligent d'un service traiteur professionnel.
Analyse cet email et retourne UNIQUEMENT un JSON structuré valide, sans texte avant ou après.

CONTEXTE :
- Client récurrent : ${existingClient ? "Oui - " + existingClient.name : "Non"}
- Événements déjà réservés : ${upcomingEvents.map((e: any) => `${e.name} le ${e.date} (${e.status})`).join(", ") || "Aucun"}

EMAIL À ANALYSER :
Expéditeur : ${sender_name} <${sender_email}>
Objet : ${subject}
Corps :
${body}

Retourne ce JSON exact :
{
  "category": "new_lead" | "modification" | "cancellation" | "question",
  "is_urgent": boolean,
  "extracted_info": {
    "sender_name": "${sender_name || ""}",
    "event_type": "wedding" | "birthday" | "corporate" | "private" | "other",
    "guest_count": number | null,
    "budget": number | null,
    "budget_per_person": number | null,
    "date_period": string | null
  },
  "is_recurring_client": ${!!existingClient},
  "calendar_check": {
    "has_conflict": boolean,
    "conflicting_events": []
  },
  "upsell_suggestions": [],
  "suggested_response": string
}

Instructions pour suggested_response :
- Ton professionnel mais chaleureux
- Si conflit détecté : mentionner indisponibilité et proposer alternatives
- Si client récurrent : personnaliser
- Si urgent : proposer rappel rapide
- Si >100 couverts : suggérer serveur supplémentaire
- Si mariage : suggérer cocktail accueil
- Terminer par proposition appel/rdv
- 10-15 lignes max`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu retournes uniquement du JSON valide." },
          { role: "user", content: systemPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "{}";

    // Clean and parse JSON
    let analysis;
    try {
      const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        category: "question",
        is_urgent: false,
        extracted_info: { sender_name: sender_name || "", event_type: "other", guest_count: null, budget: null, budget_per_person: null, date_period: null },
        is_recurring_client: !!existingClient,
        calendar_check: { has_conflict: false, conflicting_events: [] },
        upsell_suggestions: [],
        suggested_response: "Merci pour votre message. Nous revenons vers vous rapidement.",
      };
    }

    // Insert into emails table
    const { data: emailRecord, error: insertErr } = await supabase
      .from("emails")
      .insert({
        user_id: userId,
        email_provider_id: email_id,
        sender_email,
        sender_name: sender_name || analysis.extracted_info?.sender_name,
        subject,
        body,
        received_at: received_at || new Date().toISOString(),
        category: analysis.category,
        is_urgent: analysis.is_urgent,
        extracted_info: analysis.extracted_info,
        calendar_check: analysis.calendar_check,
        upsell_suggestions: analysis.upsell_suggestions,
        suggested_response: analysis.suggested_response,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
    }

    // Auto-create client + event for new leads
    if (analysis.category === "new_lead") {
      let clientId = existingClient?.id;

      if (!clientId) {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            user_id: userId,
            name: analysis.extracted_info?.sender_name || sender_name || "Prospect",
            email: sender_email,
          })
          .select()
          .single();
        clientId = newClient?.id;
      }

      if (clientId) {
        const { data: newEvent } = await supabase
          .from("events")
          .insert({
            user_id: userId,
            client_id: clientId,
            name: `${analysis.extracted_info?.event_type || "Événement"} - ${analysis.extracted_info?.sender_name || sender_name}`,
            type: analysis.extracted_info?.event_type || "other",
            date: new Date().toISOString().split("T")[0],
            status: "prospect",
            guest_count: analysis.extracted_info?.guest_count || 0,
            notes: `Budget: ${analysis.extracted_info?.budget || "Non précisé"}€ - Période: ${analysis.extracted_info?.date_period || "Non précisée"}`,
          })
          .select()
          .single();

        if (emailRecord?.id && clientId) {
          await supabase.from("emails").update({ client_id: clientId, event_id: newEvent?.id }).eq("id", emailRecord.id);
        }

        analysis.client_id = clientId;
        analysis.event_id = newEvent?.id;
      }
    }

    // Notification if urgent
    if (analysis.is_urgent) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "urgent_email",
        message: `🔥 Email urgent de ${sender_name || sender_email} — ${analysis.extracted_info?.date_period || "Demande urgente"}`,
        action_url: "/mail",
      });
    }

    return new Response(JSON.stringify({ ...analysis, email_record_id: emailRecord?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
