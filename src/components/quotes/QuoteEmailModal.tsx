import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  senderName?: string;
  onEmailSent: () => void;
}

export default function QuoteEmailModal({
  open, onClose, clientEmail, clientName, companyName,
  eventName, eventDate, totalTTC, guestCount, senderName, onEmailSent,
}: Props) {
  const [to, setTo] = useState(clientEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAiContent, setIsAiContent] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Auto-generate when modal opens
  useEffect(() => {
    if (open && !hasGenerated) {
      setTo(clientEmail || "");
      generateWithAI();
    }
    if (!open) {
      // Reset state when closing
      setHasGenerated(false);
      setSubject("");
      setBody("");
      setIsAiContent(false);
    }
  }, [open]);

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
          senderName: senderName || "",
        },
      });
      if (error) throw error;
      if (data?.subject) setSubject(data.subject);
      if (data?.body) setBody(data.body);
      setIsAiContent(true);
      setHasGenerated(true);
    } catch (e: any) {
      console.error("AI generation error:", e);
      const defaultSubject = `DEVIS ${(companyName || "").toUpperCase()}${eventName ? ` - ${eventName}` : ""}${eventDate ? ` - ${eventDate}` : ""}`;
      setSubject(defaultSubject);
      setBody(
        `Bonjour${clientName ? ` ${clientName}` : ""},\n\nVeuillez trouver ci-joint notre devis d'un montant de ${fmt(totalTTC)} € TTC${eventName ? ` pour ${eventName}` : ""}${eventDate ? ` prévu le ${eventDate}` : ""}.\n\nNous restons à votre disposition pour tout ajustement.\n\nCordialement,\n${senderName || companyName || ""}`
      );
      setIsAiContent(false);
      setHasGenerated(true);
      toast.error("Suggestion IA indisponible, modèle par défaut utilisé");
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearForManual = () => {
    setSubject("");
    setBody("");
    setIsAiContent(false);
  };

  const handleSend = async () => {
    if (!to) { toast.error("Veuillez saisir un destinataire"); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email-response", {
        body: {
          email_provider_id: `quote-${Date.now()}`,
          reply_to_email: to,
          subject,
          body,
        },
      });
      if (error) throw error;
      toast.success("Email envoyé avec succès");
      onEmailSent();
      onClose();
    } catch (e: any) {
      console.error("Send error:", e);
      toast.error("Erreur d'envoi. Vérifiez que votre boîte mail est connectée.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border border-border/50 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" /> Envoyer le devis par email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destinataire</Label>
            <Input
              type="email"
              placeholder="client@email.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objet</Label>
            <Input
              placeholder="Objet du mail…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={cn("mt-1.5 transition-colors", isAiContent && "text-primary")}
              onFocus={() => setIsAiContent(false)}
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</Label>
            <Textarea
              placeholder="Corps du mail…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setIsAiContent(false)}
              rows={10}
              className={cn("mt-1.5 transition-colors", isAiContent && "text-primary")}
            />
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Rédaction en cours…
            </div>
          )}

          {isAiContent && !aiLoading && (
            <p className="text-[11px] text-primary/70">
              ✨ Suggestion rédigée par IA — vous pouvez la modifier librement ou tout effacer ci-dessous.
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground h-8"
              onClick={handleClearForManual}
              disabled={aiLoading}
            >
              <PenLine className="h-3 w-3" /> Écrire manuellement
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button variant="accent" className="gap-2" onClick={handleSend} disabled={sending || !to}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
