import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CatalogItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  pricing_type: string;
  internal_cost: number;
  margin_percent: number;
  sale_price: number;
  default_tva: number;
  unit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CATALOG_CATEGORIES = [
  { value: "restauration", label: "Restauration", defaultTva: 10 },
  { value: "boissons", label: "Boissons", defaultTva: 10 },
  { value: "boissons_alcool", label: "Alcools", defaultTva: 20 },
  { value: "personnel", label: "Personnel", defaultTva: 20 },
  { value: "logistique", label: "Logistique", defaultTva: 20 },
  { value: "options", label: "Options", defaultTva: 20 },
] as const;

export const PRICING_TYPES = [
  { value: "per_person", label: "Par personne" },
  { value: "flat", label: "Forfait" },
  { value: "hourly", label: "Horaire" },
  { value: "quantity", label: "Quantité" },
] as const;

export function useCatalogItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["catalog_items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_items")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data as CatalogItem[];
    },
    enabled: !!user,
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<CatalogItem, "id" | "user_id" | "sale_price" | "created_at" | "updated_at" | "is_active">) => {
      const { data, error } = await supabase
        .from("catalog_items")
        .insert({ ...item, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog_items"] });
      toast.success("Prestation ajoutée au catalogue");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CatalogItem> & { id: string }) => {
      const { error } = await supabase
        .from("catalog_items")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog_items"] });
      toast.success("Prestation mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("catalog_items")
        .update({ is_active: false } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog_items"] });
      toast.success("Prestation retirée du catalogue");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function getTvaForCategory(category: string): number {
  const cat = CATALOG_CATEGORIES.find((c) => c.value === category);
  return cat?.defaultTva ?? 20;
}
