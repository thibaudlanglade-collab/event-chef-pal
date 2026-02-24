import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  value: string;
  origin: "auto" | "user" | "vide";
}

export interface TemplateSection {
  titre: string;
  champs: TemplateField[];
}

export interface TemplateStructure {
  titre: string;
  sections: TemplateSection[];
}

export type TemplateType = "client" | "traiteur" | "maitreHotel";

const DEFAULT_TEMPLATES: Record<TemplateType, TemplateStructure> = {
  client: {
    titre: "Dossier Événement — Vue Client",
    sections: [
      {
        titre: "L'expérience gastronomique",
        champs: [
          { id: "menu", label: "Menu & Prestations", type: "textarea", value: "", origin: "vide" },
          { id: "boissons", label: "Boissons & Bar", type: "textarea", value: "", origin: "vide" },
          { id: "ambiance", label: "Ambiance & Style", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Informations pratiques",
        champs: [
          { id: "lieu", label: "Lieu de réception", type: "text", value: "", origin: "vide" },
          { id: "horaires", label: "Horaires", type: "text", value: "", origin: "vide" },
          { id: "convives", label: "Nombre de convives", type: "number", value: "", origin: "vide" },
          { id: "acces", label: "Accès & Parking", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Notes spéciales",
        champs: [
          { id: "allergies", label: "Allergies & Régimes", type: "textarea", value: "", origin: "vide" },
          { id: "demandes", label: "Demandes particulières", type: "textarea", value: "", origin: "vide" },
        ],
      },
    ],
  },
  traiteur: {
    titre: "Fiche de Pilotage — Vue Gérant",
    sections: [
      {
        titre: "Données financières",
        champs: [
          { id: "subtotal_ht", label: "Sous-total HT", type: "text", value: "", origin: "vide" },
          { id: "tva", label: "TVA", type: "text", value: "", origin: "vide" },
          { id: "total_ttc", label: "Total TTC", type: "text", value: "", origin: "vide" },
          { id: "marge", label: "Marge estimée", type: "text", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Logistique",
        champs: [
          { id: "lieu", label: "Lieu", type: "text", value: "", origin: "vide" },
          { id: "horaires", label: "Horaires", type: "text", value: "", origin: "vide" },
          { id: "acces", label: "Accès & Livraison", type: "textarea", value: "", origin: "vide" },
          { id: "materiel", label: "Matériel nécessaire", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Équipe",
        champs: [
          { id: "staff_count", label: "Effectif total", type: "number", value: "", origin: "vide" },
          { id: "staff_details", label: "Détail par poste", type: "textarea", value: "", origin: "vide" },
          { id: "notes_staff", label: "Notes staff", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Vigilance",
        champs: [
          { id: "allergies", label: "Allergies & Régimes", type: "textarea", value: "", origin: "vide" },
          { id: "notes_logistique", label: "Notes logistique", type: "textarea", value: "", origin: "vide" },
        ],
      },
    ],
  },
  maitreHotel: {
    titre: "Brief Maître d'Hôtel",
    sections: [
      {
        titre: "Informations prioritaires",
        champs: [
          { id: "vigilance", label: "Allergies & Vigilance", type: "textarea", value: "", origin: "vide" },
          { id: "vip", label: "Invités VIP / Notes spéciales", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Service",
        champs: [
          { id: "menu_resume", label: "Résumé du menu", type: "textarea", value: "", origin: "vide" },
          { id: "service_style", label: "Style de service", type: "text", value: "", origin: "vide" },
          { id: "nombre_couverts", label: "Nombre de couverts", type: "number", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Équipe du jour",
        champs: [
          { id: "equipe", label: "Composition équipe", type: "textarea", value: "", origin: "vide" },
          { id: "postes", label: "Attribution des postes", type: "textarea", value: "", origin: "vide" },
        ],
      },
      {
        titre: "Checklist",
        champs: [
          { id: "checklist", label: "Points de vérification", type: "textarea", value: "", origin: "vide" },
        ],
      },
    ],
  },
};

export const getDefaultTemplate = (type: TemplateType): TemplateStructure => {
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[type]));
};

export function useCustomTemplate(type: TemplateType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["custom-template", type, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("custom_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("template_type", type)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAllCustomTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["custom-templates-all", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("custom_templates")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useSaveTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, structure, sourceFilename }: { type: TemplateType; structure: TemplateStructure; sourceFilename?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("custom_templates")
        .select("id, version")
        .eq("user_id", user.id)
        .eq("template_type", type)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("custom_templates")
          .update({
            structure: structure as any,
            version: (existing.version || 1) + 1,
            source_filename: sourceFilename || null,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_templates")
          .insert({
            user_id: user.id,
            template_type: type,
            structure: structure as any,
            source_filename: sourceFilename || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-template"] });
      qc.invalidateQueries({ queryKey: ["custom-templates-all"] });
      toast.success("Template sauvegardé");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
}

export function useDeleteTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: TemplateType) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("user_id", user.id)
        .eq("template_type", type);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-template"] });
      qc.invalidateQueries({ queryKey: ["custom-templates-all"] });
      toast.success("Template réinitialisé");
    },
  });
}

export function useAiFillTemplate() {
  return useMutation({
    mutationFn: async ({ template, dataset }: { template: TemplateStructure; dataset: any }) => {
      const { data, error } = await supabase.functions.invoke("ai-template-fill", {
        body: { template, dataset },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.template as TemplateStructure;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur IA"),
  });
}
