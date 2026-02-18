import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Webhook, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useWebhookConfigs, useUpsertWebhook } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const webhookFeatures = [
  { key: "mail_triage", label: "Triage des mails", description: "Réception et classification automatique des emails entrants" },
  { key: "whatsapp_team", label: "WhatsApp Équipe", description: "Envoi d'invitations WhatsApp aux membres de l'équipe" },
  { key: "stock_alerts", label: "Alertes Stock", description: "Notification automatique quand un article passe sous le seuil" },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { data: webhooks, isLoading } = useWebhookConfigs();
  const upsertWebhook = useUpsertWebhook();
  const navigate = useNavigate();

  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (webhooks) {
      const map: Record<string, string> = {};
      webhooks.forEach((w) => { map[w.feature_name] = w.webhook_url; });
      setUrls(map);
    }
  }, [webhooks]);

  const getWebhook = (key: string) => webhooks?.find((w) => w.feature_name === key);

  const testWebhook = async (key: string) => {
    const url = urls[key];
    if (!url) { toast.error("Entrez une URL d'abord"); return; }
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true, feature: key }) });
      if (res.ok) toast.success("✅ Connexion réussie");
      else toast.error("❌ Erreur de connexion");
    } catch { toast.error("❌ Impossible de joindre le webhook"); }
  };

  const saveWebhook = (key: string) => {
    const url = urls[key];
    if (!url) return;
    upsertWebhook.mutate({ feature_name: key, webhook_url: url, is_active: true });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Paramètres</h1><p className="text-muted-foreground text-sm">Configurez votre compte, vos webhooks et vos automatisations.</p></div>

      {/* Account */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Compte</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Email</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4" /> Déconnexion</Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhooks & Automatisations</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {webhookFeatures.map((feature) => {
            const existing = getWebhook(feature.key);
            return (
              <div key={feature.key} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  {existing?.is_active ? (
                    <span className="flex items-center gap-1 text-xs text-status-confirmed font-medium"><CheckCircle className="h-3.5 w-3.5" /> Actif</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Inactif</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input value={urls[feature.key] || ""} onChange={(e) => setUrls({ ...urls, [feature.key]: e.target.value })} placeholder="https://mon-n8n.com/webhook/..." className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => testWebhook(feature.key)}>Tester</Button>
                  <Button variant="accent" size="sm" onClick={() => saveWebhook(feature.key)}>Sauvegarder</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
