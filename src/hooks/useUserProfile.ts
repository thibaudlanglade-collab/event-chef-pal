import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pricing_range: string | null;
  address: string;
  siret: string;
  logo_url: string | null;
  quote_validity_days: number;
}

export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { error } = await supabase
        .from("user_profiles")
        .update(updates as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profile"] });
      toast.success("Profil mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/logo.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("company-logos").getPublicUrl(path);
      const { error } = await supabase
        .from("user_profiles")
        .update({ logo_url: publicUrl } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
      return publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profile"] });
      toast.success("Logo mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
