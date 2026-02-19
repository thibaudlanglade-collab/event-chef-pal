import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Webhook, CheckCircle, XCircle, LogOut, Mail, HelpCircle, Shield, Package, Building2 } from "lucide-react";
import { useWebhookConfigs, useUpsertWebhook } from "@/hooks/useSupabase";
import { useOAuthToken, useDeleteOAuthToken, useEmailSettings, useUpdateEmailSettings } from "@/hooks/useEmails";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CatalogSettings from "@/components/settings/CatalogSettings";
import CompanySettings from "@/components/settings/CompanySettings";

const webhookFeatures = [
  { key: "mail_triage", label: "Triage des mails (legacy)", description: "Ancien système via webhook n8n" },
  { key: "whatsapp_team", label: "WhatsApp Équipe", description: "Envoi d'invitations WhatsApp aux membres de l'équipe" },
  { key: "stock_alerts", label: "Alertes Stock", description: "Notification automatique quand un article passe sous le seuil" },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { data: webhooks, isLoading } = useWebhookConfigs();
  const upsertWebhook = useUpsertWebhook();
  const navigate = useNavigate();

  const { data: oauthToken } = useOAuthToken();
  const deleteOAuth = useDeleteOAuthToken();
  const { data: emailSettings } = useEmailSettings();
  const updateEmailSettings = useUpdateEmailSettings();

  const [urls, setUrls] = useState<Record<string, string>>({});
  const [showTriageInfo, setShowTriageInfo] = useState(false);

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

  const handleOAuthConnect = (provider: "google" | "microsoft") => {
    const clientId = provider === "google"
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : import.meta.env.VITE_MICROSOFT_CLIENT_ID;

    if (!clientId) {
      toast.error(`La connexion ${provider === "google" ? "Gmail" : "Outlook"} nécessite la configuration des clés OAuth. Contactez l'administrateur.`);
      return;
    }

    const redirectUri = provider === "google"
      ? "https://event-chef-pal.lovable.app/auth/callback/google"
      : `${window.location.origin}/auth/callback/${provider}`;
    const scopes = provider === "google"
      ? "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify"
      : "Mail.Read Mail.Send offline_access";

    const authUrl = provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`
      : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&response_mode=query`;

    window.location.href = authUrl;
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Paramètres</h1><p className="text-muted-foreground text-sm">Configurez votre compte, votre catalogue, vos webhooks et vos automatisations.</p></div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="gap-1.5"><SettingsIcon className="h-3.5 w-3.5" /> Général</TabsTrigger>
          <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Entreprise</TabsTrigger>
          <TabsTrigger value="catalog" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="catalog">
          <CatalogSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">

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

      {/* Email Connection */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Connexion boîte mail</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {oauthToken ? (
            <div className="flex items-center justify-between p-3 bg-status-confirmed/5 border border-status-confirmed/20 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-status-confirmed" />
                <div>
                  <p className="text-sm font-medium">
                    ✅ {oauthToken.provider === "google" ? "Gmail" : "Outlook"} connecté
                  </p>
                  <p className="text-xs text-muted-foreground">{oauthToken.email_address}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteOAuth.mutate()}>
                Déconnecter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 gap-3 justify-start" onClick={() => handleOAuthConnect("google")}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                <span>Connecter avec Gmail</span>
              </Button>
              <Button variant="outline" className="h-14 gap-3 justify-start" onClick={() => handleOAuthConnect("microsoft")}>
                <Shield className="h-5 w-5 text-[#00a4ef]" />
                <span>Connecter avec Outlook</span>
              </Button>
            </div>
          )}

          {/* Auto triage toggle */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold">Triage automatique</p>
                <p className="text-xs text-muted-foreground">L'IA analyse automatiquement chaque email reçu</p>
              </div>
              <Dialog open={showTriageInfo} onOpenChange={setShowTriageInfo}>
                <DialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-4 w-4" /></button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Comment fonctionne le triage automatique ?</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm space-y-4">
                    <div>
                      <p className="font-semibold">MODE MANUEL (OFF - par défaut) :</p>
                      <p className="text-muted-foreground">Vous voyez tous vos emails non lus dans CaterPilot. Pour chaque email, vous décidez si vous voulez l'analyser en cliquant sur "🤖 Analyser".</p>
                    </div>
                    <div>
                      <p className="font-semibold">MODE AUTOMATIQUE (ON) :</p>
                      <p className="text-muted-foreground">Tous vos emails non lus sont analysés automatiquement dès réception. Vous gardez toujours le contrôle — aucune réponse n'est envoyée sans votre validation.</p>
                    </div>
                    <div>
                      <p className="font-semibold">QUE FAIT L'INTELLIGENCE ARTIFICIELLE ?</p>
                      <ul className="text-muted-foreground list-disc pl-4 space-y-1">
                        <li>Catégorise l'email (Nouvelle demande / Modification / Annulation / Question)</li>
                        <li>Extrait les infos clés (nom, type, date, couverts, budget)</li>
                        <li>Calcule le budget par couvert</li>
                        <li>Vérifie votre disponibilité dans votre calendrier</li>
                        <li>Détecte les conflits de planning</li>
                        <li>Reconnaît vos clients récurrents</li>
                        <li>Analyse le ton (urgent ou non)</li>
                        <li>Suggère des opportunités d'upsell</li>
                        <li>Génère une réponse personnalisée</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-3">
                      <p className="font-semibold">VOUS RESTEZ TOUJOURS MAÎTRE :</p>
                      <p className="text-muted-foreground">Vous pouvez modifier la réponse suggérée avant envoi, ou même écrire la vôtre de zéro. CaterPilot vous fait juste gagner un temps précieux.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Switch
              checked={emailSettings?.auto_triage_enabled || false}
              onCheckedChange={(checked) => updateEmailSettings.mutate({ auto_triage_enabled: checked })}
            />
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
