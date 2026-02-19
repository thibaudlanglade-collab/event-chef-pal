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

    const defaultSubject = `DEVIS ${(companyName || "").toUpperCase()}${eventName ? ` - ${eventName}` : ""}${eventDate ? ` - ${eventDate}` : ""}`;

    const prompt = `Tu es l'assistant d'un traiteur professionnel français. Rédige un email COURT, SOBRE et PROFESSIONNEL pour accompagner l'envoi d'un devis.

Contexte :
- Entreprise : ${companyName}
- Client : ${clientName}
- Événement : ${eventName || "non précisé"}
- Date : ${eventDate || "non précisée"}
- Montant TTC : ${totalTTC} €
- Convives : ${guestCount || "non précisé"}

Consignes STRICTES :
- Ton B2B factuel et direct. PAS de formules enthousiastes ("C'est un plaisir", "expérience culinaire mémorable", etc.)
- Maximum 4 phrases pour le corps du mail
- Commence par "Bonjour" suivi du nom du client si disponible
- Mentionne le montant et la date si disponibles
- Termine par "Nous restons à votre disposition pour tout ajustement." ou équivalent sobre
- NE PAS inclure de signature
- L'objet doit suivre le format : DEVIS [NOM_ENTREPRISE] - [NOM_EVENEMENT] - [DATE]
- Si l'événement ou la date ne sont pas précisés, les omettre de l'objet

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
          { role: "system", content: "Tu es un assistant de rédaction B2B sobre et efficace. Réponds uniquement en JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ subject: defaultSubject, body: "", error: "rate_limit" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ subject: defaultSubject, body: "", error: "credits" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed: { subject: string; body: string };
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        subject: defaultSubject,
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
