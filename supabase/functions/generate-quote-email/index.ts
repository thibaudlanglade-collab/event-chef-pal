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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { companyName, clientName, eventName, eventDate, totalTTC, guestCount } = await req.json();

    const prompt = `Tu es l'assistant d'un traiteur professionnel français. Rédige un email court et professionnel pour accompagner l'envoi d'un devis.

Contexte :
- Entreprise : ${companyName}
- Client : ${clientName}
- Événement : ${eventName || "non précisé"}
- Date de l'événement : ${eventDate || "non précisée"}
- Montant TTC : ${totalTTC} €
- Nombre de convives : ${guestCount || "non précisé"}

Consignes :
- Ton chaleureux mais professionnel
- Maximum 6 phrases pour le corps du mail
- Inclure le montant et la date si disponibles
- Terminer par une formule d'invitation à revenir vers toi
- Ne pas inclure de signature (elle sera ajoutée automatiquement)

Réponds UNIQUEMENT avec un JSON valide au format :
{"subject": "...", "body": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu es un assistant spécialisé dans la rédaction d'emails commerciaux pour les traiteurs. Réponds uniquement en JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques secondes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response (handle markdown code blocks)
    let parsed: { subject: string; body: string };
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        subject: `Devis ${companyName} — ${eventName || "votre événement"}`,
        body: content,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-quote-email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
