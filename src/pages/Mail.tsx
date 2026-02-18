import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, CheckCircle, Clock, AlertCircle, Eye, Send, X, UserPlus } from "lucide-react";
import { useMailQueue, useUpdateMailStatus, useWebhookConfigs, useUpsertWebhook } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  "Nouvelle demande": "bg-status-confirmed/12 text-status-confirmed",
  "Modification": "bg-status-appointment/12 text-status-appointment",
  "Annulation": "bg-destructive/12 text-destructive",
  "Question": "bg-muted text-muted-foreground",
  "Autre": "bg-status-quote-sent/12 text-status-quote-sent",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-status-quote-sent" />,
  sent: <Send className="h-3.5 w-3.5 text-status-confirmed" />,
  treated: <CheckCircle className="h-3.5 w-3.5 text-status-completed" />,
};

const MailPage = () => {
  const { data: mails, isLoading } = useMailQueue();
  const { data: webhooks } = useWebhookConfigs();
  const updateStatus = useUpdateMailStatus();
  const upsertWebhook = useUpsertWebhook();

  const mailWebhook = webhooks?.find((w) => w.feature_name === "mail_triage");
  const [webhookUrl, setWebhookUrl] = useState(mailWebhook?.webhook_url || "");
  const [selectedMail, setSelectedMail] = useState<string | null>(null);

  const selectedMailData = mails?.find((m) => m.id === selectedMail);

  const testConnection = async () => {
    if (!webhookUrl) return;
    try {
      const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true }) });
      if (res.ok) toast.success("✅ Connexion réussie");
      else toast.error("❌ Erreur de connexion");
    } catch { toast.error("❌ Impossible de joindre le webhook"); }
  };

  const saveWebhook = () => {
    upsertWebhook.mutate({ feature_name: "mail_triage", webhook_url: webhookUrl, is_active: true });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Triage des mails</h1><p className="text-muted-foreground text-sm">Centralisez vos emails entrants via webhook. Triez-les par catégorie et suivez leur traitement en un coup d'œil.</p></div>

      {/* Webhook config */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Connexion mail (n8n)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://mon-n8n.com/webhook/mail-triage" className="flex-1" />
            <Button variant="outline" size="sm" onClick={testConnection}>Tester</Button>
            <Button variant="accent" size="sm" onClick={saveWebhook}>Sauvegarder</Button>
          </div>
          {mailWebhook && <p className="text-xs text-muted-foreground">Statut : {mailWebhook.is_active ? <span className="text-status-confirmed font-medium">Actif</span> : <span className="text-destructive font-medium">Inactif</span>}</p>}
        </CardContent>
      </Card>

      {/* Mail queue */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-secondary/50"><th className="text-left py-3 px-4 font-medium">Date</th><th className="text-left py-3 px-4 font-medium">Expéditeur</th><th className="text-left py-3 px-4 font-medium">Objet</th><th className="text-center py-3 px-4 font-medium">Catégorie</th><th className="text-center py-3 px-4 font-medium">Statut</th><th className="text-right py-3 px-4 font-medium">Actions</th></tr></thead>
              <tbody>
                {(!mails || mails.length === 0) ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun mail en file d'attente. Les mails apparaîtront ici quand n8n enverra des données.</td></tr> : mails.map((mail) => (
                  <tr key={mail.id} className="border-b last:border-0 hover:bg-primary/3 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(mail.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="py-3 px-4 font-medium">{mail.sender || "—"}</td>
                    <td className="py-3 px-4">{mail.subject || "—"}</td>
                    <td className="py-3 px-4 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", categoryColors[mail.category || "Autre"] || categoryColors["Autre"])}>{mail.category || "Non classé"}</span></td>
                    <td className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-1">{statusIcons[mail.status] || statusIcons.pending}<span className="text-xs">{mail.status === "pending" ? "En attente" : mail.status === "sent" ? "Réponse envoyée" : "Traité"}</span></div></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedMail(mail.id)}><Eye className="h-3 w-3 mr-1" /> Voir</Button>
                        {mail.status === "pending" && <Button variant="ghost" size="sm" className="h-7 text-xs text-status-confirmed" onClick={() => updateStatus.mutate({ id: mail.id, status: "sent" })}><Send className="h-3 w-3 mr-1" /> Valider</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mail detail drawer */}
      {selectedMailData && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedMail(null)}>
          <Card className="w-full max-w-lg animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Détail du mail</CardTitle><Button variant="ghost" size="icon" onClick={() => setSelectedMail(null)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><p className="text-xs text-muted-foreground">De : {selectedMailData.sender}</p><p className="text-xs text-muted-foreground">Objet : {selectedMailData.subject}</p></div>
              <div className="bg-secondary rounded-xl p-4 text-sm whitespace-pre-wrap">{selectedMailData.body || "Pas de contenu"}</div>
              {selectedMailData.auto_reply && <div><p className="text-xs font-medium text-muted-foreground mb-1">Réponse automatique proposée :</p><div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm whitespace-pre-wrap">{selectedMailData.auto_reply}</div></div>}
              <div className="flex gap-2">
                <Button variant="accent" className="flex-1" onClick={() => { updateStatus.mutate({ id: selectedMailData.id, status: "sent" }); setSelectedMail(null); }}><Send className="h-4 w-4 mr-2" /> Valider & envoyer</Button>
                {selectedMailData.category === "Nouvelle demande" && <Button variant="outline"><UserPlus className="h-4 w-4 mr-2" /> Créer prospect</Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MailPage;
