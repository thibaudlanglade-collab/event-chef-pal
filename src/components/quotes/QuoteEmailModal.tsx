import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  clientEmail?: string;
  clientName?: string;
  companyName?: string;
  eventName?: string;
  eventDate?: string;
  totalTTC: number;
  guestCount?: number;
  onEmailSent: () => void;
}

export default function QuoteEmailModal({
  open, onClose, clientEmail, clientName, companyName,
  eventName, eventDate, totalTTC, guestCount, onEmailSent,
}: Props) {
  const [to, setTo] = useState(clientEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Pre-fill when opening
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setTo(clientEmail || "");
      if (!subject && !body) generateWithAI();
    }
    if (!v) onClose();
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quote-email", {
        body: {
          companyName: companyName || "Notre société",
          clientName: clientName || "le client",
          eventName: eventName || "",
          eventDate: eventDate || "",
          totalTTC: fmt(totalTTC),
          guestCount: guestCount || 0,
        },
      });
      if (error) throw error;
      if (data?.subject) setSubject(data.subject);
      if (data?.body) setBody(data.body);
      toast.success("Email généré par IA ✨");
    } catch (e: any) {
      console.error("AI generation error:", e);
      // Fallback template
      setSubject(`Devis ${companyName || ""} — ${eventName || "votre événement"}`);
      setBody(
        `Bonjour${clientName ? ` ${clientName}` : ""},\n\nSuite à notre échange, veuillez trouver ci-joint notre devis d'un montant de ${fmt(totalTTC)} € TTC${eventName ? ` pour ${eventName}` : ""}${eventDate ? ` prévu le ${eventDate}` : ""}.\n\nNous restons à votre entière disposition pour toute question.\n\nCordialement,\n${companyName || ""}`
      );
      toast.error("Suggestion IA indisponible, modèle par défaut utilisé");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!to) { toast.error("Veuillez saisir un destinataire"); return; }
    setSending(true);
    try {
      // Use existing send-email-response edge function
      const { error } = await supabase.functions.invoke("send-email-response", {
        body: {
          email_provider_id: `quote-${Date.now()}`,
          reply_to_email: to,
          subject,
          body,
        },
      });
      if (error) throw error;
      toast.success("✅ Email envoyé avec succès !");
      onEmailSent();
      onClose();
    } catch (e: any) {
      console.error("Send error:", e);
      toast.error("Erreur d'envoi. Vérifiez que votre boîte mail est connectée dans les paramètres.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Envoyer le devis par email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium">Destinataire</Label>
            <Input
              type="email"
              placeholder="client@email.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Objet</Label>
              <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={generateWithAI} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {aiLoading ? "Génération…" : "Régénérer avec IA"}
              </Button>
            </div>
            <Input
              placeholder="Objet du mail…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Message</Label>
            <Textarea
              placeholder="Corps du mail…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-1.5"
            />
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              L'IA rédige votre email professionnel…
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button variant="accent" className="gap-2" onClick={handleSend} disabled={sending || !to}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
