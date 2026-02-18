import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Code d'autorisation manquant.");
      return;
    }

    const exchange = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("exchange-google-oauth", {
          body: { code },
        });

        if (fnError || !data?.success) {
          setError(data?.error || fnError?.message || "Erreur lors de la connexion.");
          return;
        }

        navigate("/settings", { replace: true });
      } catch (e: any) {
        setError(e.message || "Erreur inattendue.");
      }
    };

    exchange();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">Erreur de connexion</h1>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <button onClick={() => navigate("/settings")} className="text-primary underline mt-4">
          Retour aux paramètres
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Connexion Gmail en cours…</p>
    </div>
  );
};

export default GoogleOAuthCallback;
