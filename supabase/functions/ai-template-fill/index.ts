import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { template, dataset } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un assistant IA spécialisé dans le remplissage automatique de templates pour traiteurs événementiels.

On te donne :
1. Un template JSON avec des sections et des champs (id, label, type, value, origin)
2. Un dataset contenant des données réelles (événement, devis, client, staff)

Ta tâche : remplir les champs du template en faisant un match sémantique entre les labels des champs et les données du dataset.

Règles :
- Si tu trouves une correspondance dans le dataset, remplis la value et mets origin = "auto"
- Si aucune correspondance, laisse value = "" et origin = "vide"  
- Ne change JAMAIS les champs où origin = "user"
- Sois intelligent dans le matching : "Menu choisi" peut correspondre aux items du devis, "Lieu" au venue de l'événement, etc.
- Pour les champs texte libre comme "Ambiance", génère un texte court et professionnel basé sur le type d'événement
- Retourne UNIQUEMENT le JSON du template mis à jour, rien d'autre`;

    const userPrompt = `Template à remplir :
${JSON.stringify(template, null, 2)}

Dataset disponible :
${JSON.stringify(dataset, null, 2)}

Remplis les champs et retourne le template JSON mis à jour.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fill_template",
              description: "Return the filled template structure",
              parameters: {
                type: "object",
                properties: {
                  titre: { type: "string" },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titre: { type: "string" },
                        champs: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              type: { type: "string" },
                              value: { type: "string" },
                              origin: { type: "string", enum: ["auto", "user", "vide"] },
                            },
                            required: ["id", "label", "type", "value", "origin"],
                          },
                        },
                      },
                      required: ["titre", "champs"],
                    },
                  },
                },
                required: ["titre", "sections"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "fill_template" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const filledTemplate = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
      return new Response(JSON.stringify({ template: filledTemplate }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to extract JSON from content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const filledTemplate = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify({ template: filledTemplate }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("ai-template-fill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
