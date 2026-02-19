import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useCreateScheduledFollowup } from "@/hooks/usePipeline";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Clock } from "lucide-react";
import { format, addDays } from "date-fns";

interface FollowUpModalProps {
  card: any;
  stage: any;
  open: boolean;
  onClose: () => void;
  scheduleMode?: boolean;
}

function getDefaultTemplate(stageName: string, card: any, companyName: string) {
  const clientName = card?.clients?.name || "Client";
  const eventType = card?.events?.type || "événement";
  const eventDate = card?.events?.date ? new Date(card.events.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "[date]";
  const guestCount = card?.events?.guest_count || "[N]";

  const templates: Record<string, { subject: string; body: string }> = {
    "Devis envoyé": {
      subject: `Relance — Devis ${eventType} ${eventDate}`,
      body: `Bonjour ${clientName},\n\nJe me permets de revenir vers vous concernant le devis pour votre ${eventType} du ${eventDate} (${guestCount} couverts).\n\nAvez-vous eu l'occasion de le consulter ? Je reste à votre disposition pour toute question ou ajustement.\n\nBien cordialement,\n${companyName}`,
    },
    "Négociation": {
      subject: `Suite — ${eventType} ${eventDate}`,
      body: `Bonjour ${clientName},\n\nSuite à nos derniers échanges concernant votre ${eventType} du ${eventDate}, je souhaitais savoir si les ajustements proposés vous conviennent.\n\nN'hésitez pas si vous avez d'autres questions.\n\nBien cordialement,\n${companyName}`,
    },
    "Confirmé": {
      subject: `Confirmation — ${eventType} ${eventDate}`,
      body: `Bonjour ${clientName},\n\nVotre événement du ${eventDate} approche ! Je voulais confirmer avec vous les derniers détails et m'assurer que tout est en ordre de votre côté.\n\nPouvons-nous prévoir un point téléphonique cette semaine ?\n\nBien cordialement,\n${companyName}`,
    },
  };

  return templates[stageName] || {
    subject: `Relance — ${eventType} ${eventDate}`,
    body: `Bonjour ${clientName},\n\nJe me permets de revenir vers vous concernant votre ${eventType} prévu le ${eventDate}.\n\nN'hésitez pas à me contacter pour toute question.\n\nBien cordialement,\n${companyName}`,
  };
}

export function FollowUpModal({ card, stage, open, onClose, scheduleMode = false }: FollowUpModalProps) {
  const { data: profile } = useUserProfile();
  const createScheduled = useCreateScheduledFollowup();

  const companyName = profile?.company_name || "Notre équipe";
  const clientEmail = card?.clients?.email || "";

  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [wantSchedule, setWantSchedule] = useState(scheduleMode);
  const [scheduleDays, setScheduleDays] = useState(2);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && card && stage) {
      const template = getDefaultTemplate(stage.name, card, companyName);
      setTo(clientEmail);
      setSubject(template.subject);
      setBody(template.body);
      setWantSchedule(scheduleMode);
    }
  }, [open, card?.id, stage?.name]);

  const handleSendNow = async () => {
    if (!to) { toast.error("Entrez un destinataire"); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email-response", {
        body: { to, subject, body, inReplyTo: null },
      });
      if (error) throw error;
      toast.success("Relance envoyée !");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = () => {
    if (!to) { toast.error("Entrez un destinataire"); return; }
    createScheduled.mutate({
      card_id: card.id,
      scheduled_at: addDays(new Date(), scheduleDays).toISOString(),
      email_to: to,
      email_subject: subject,
      email_body: body,
    }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✉️ Relancer {card?.clients?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destinataire</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Objet</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="font-sans text-sm" />
          </div>

          {/* Schedule options */}
          <div className="border rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="schedule" checked={wantSchedule} onCheckedChange={(c) => setWantSchedule(!!c)} />
              <label htmlFor="schedule" className="text-sm cursor-pointer">
                Relancer automatiquement si pas de réponse dans :
              </label>
            </div>
            {wantSchedule && (
              <div className="flex items-center gap-2 pl-6">
                <Input type="number" min={1} max={30} value={scheduleDays} onChange={(e) => setScheduleDays(Number(e.target.value))} className="w-20" />
                <span className="text-sm text-muted-foreground">jours ({format(addDays(new Date(), scheduleDays), "dd/MM/yyyy")})</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {!wantSchedule ? (
              <Button className="flex-1" variant="accent" onClick={handleSendNow} disabled={sending}>
                <Send className="h-4 w-4 mr-2" /> {sending ? "Envoi..." : "Envoyer maintenant"}
              </Button>
            ) : (
              <Button className="flex-1" variant="accent" onClick={handleSchedule} disabled={createScheduled.isPending}>
                <Clock className="h-4 w-4 mr-2" /> Programmer la relance
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
