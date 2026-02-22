import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Copy, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface BulkMessageModalProps {
  open: boolean;
  onClose: () => void;
  members: any[];
  event: any;
}

const VARIABLES = [
  { key: "{{prenom}}", label: "Prénom" },
  { key: "{{date}}", label: "Date" },
  { key: "{{lieu}}", label: "Lieu" },
  { key: "{{type_evenement}}", label: "Type" },
  { key: "{{poste}}", label: "Poste" },
  { key: "{{horaire}}", label: "Horaire" },
  { key: "{{nombre_convives}}", label: "Convives" },
];

const DEFAULT_TEMPLATE = `Bonjour {{prenom}} 👋

Nous organisons un {{type_evenement}} le {{date}} à {{lieu}}.
Horaires : {{horaire}}
Poste : {{poste}}
Convives : {{nombre_convives}}

Es-tu disponible ? Réponds OUI/NON 🙏`;

const typeLabels: Record<string, string> = {
  wedding: "Mariage", corporate: "Corporate", birthday: "Anniversaire",
  mariage: "Mariage", other: "Événement",
};

const BulkMessageModal = ({ open, onClose, members, event }: BulkMessageModalProps) => {
  const [message, setMessage] = useState(DEFAULT_TEMPLATE);
  const [previewIndex, setPreviewIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessage(DEFAULT_TEMPLATE);
    setPreviewIndex(0);
  }, [open]);

  if (!open || members.length === 0) return null;

  const currentMember = members[previewIndex];
  const dateStr = event ? new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";

  const resolveFor = (member: any, text: string) => {
    const firstName = member?.name?.split(" ")[0] || "";
    return text
      .replace(/\{\{prenom\}\}/g, firstName)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{lieu\}\}/g, event?.venue || "Lieu à confirmer")
      .replace(/\{\{type_evenement\}\}/g, typeLabels[event?.type] || event?.type || "")
      .replace(/\{\{poste\}\}/g, member?.role || "—")
      .replace(/\{\{horaire\}\}/g, event?.time || "À confirmer")
      .replace(/\{\{nombre_convives\}\}/g, String(event?.guest_count || 0));
  };

  const preview = resolveFor(currentMember, message);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMsg = message.substring(0, start) + variable + message.substring(end);
    setMessage(newMsg);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + variable.length, start + variable.length); }, 0);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(preview);
    toast.success("Message copié !");
  };

  const copyAll = () => {
    const all = members.map((m) => `— ${m.name} —\n${resolveFor(m, message)}`).join("\n\n");
    navigator.clipboard.writeText(all);
    toast.success(`${members.length} messages copiés !`);
  };

  const openWhatsApp = () => {
    const phone = currentMember?.phone?.replace(/\s/g, "").replace(/^0/, "33");
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(preview)}`, "_blank");
    else toast.error("Pas de numéro de téléphone");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              📱 Message groupé — {members.length} employé{members.length > 1 ? "s" : ""}
            </h3>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Variables */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Variables disponibles :</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Message :</p>
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] font-mono text-sm resize-none"
              />
            </div>

            {/* Preview with member navigation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Prévisualisation — {currentMember?.name}
                </p>
                {members.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))} disabled={previewIndex === 0}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{previewIndex + 1}/{members.length}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewIndex((i) => Math.min(members.length - 1, i + 1))} disabled={previewIndex === members.length - 1}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">
                {preview}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-border">
            <Button variant="outline" className="flex-1 gap-2" onClick={copyAll}>
              <Copy className="h-4 w-4" /> Copier tous ({members.length})
            </Button>
            <Button variant="outline" className="gap-2" onClick={copyMessage}>
              <Copy className="h-4 w-4" /> Copier
            </Button>
            <Button className="flex-1 gap-2 bg-primary text-primary-foreground" onClick={openWhatsApp}>
              <ExternalLink className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkMessageModal;
