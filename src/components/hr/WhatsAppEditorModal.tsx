import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppEditorModalProps {
  open: boolean;
  onClose: () => void;
  member: any;
  event: any;
  role: string;
  defaultTemplate?: string;
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

const roleLabels: Record<string, string> = {
  serveurs: "Serveur", chefs: "Chef", barmans: "Barman", maitre_hotel: "Maître d'hôtel",
  Serveur: "Serveur", Serveuse: "Serveuse", Chef: "Chef", Cuisinier: "Cuisinier",
};

const WhatsAppEditorModal = ({ open, onClose, member, event, role, defaultTemplate }: WhatsAppEditorModalProps) => {
  const [message, setMessage] = useState(defaultTemplate || DEFAULT_TEMPLATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessage(defaultTemplate || DEFAULT_TEMPLATE);
  }, [defaultTemplate, open]);

  if (!open) return null;

  const firstName = member?.name?.split(" ")[0] || "";
  const dateStr = event ? new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";

  const typeLabels: Record<string, string> = {
    wedding: "Mariage", corporate: "Corporate", birthday: "Anniversaire",
    mariage: "Mariage", other: "Événement",
  };

  const resolveVariables = (text: string) => {
    return text
      .replace(/\{\{prenom\}\}/g, firstName)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{lieu\}\}/g, event?.venue || "Lieu à confirmer")
      .replace(/\{\{type_evenement\}\}/g, typeLabels[event?.type] || event?.type || "")
      .replace(/\{\{poste\}\}/g, roleLabels[role] || role || "")
      .replace(/\{\{horaire\}\}/g, event?.time || "À confirmer")
      .replace(/\{\{nombre_convives\}\}/g, String(event?.guest_count || 0));
  };

  const preview = resolveVariables(message);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMsg = message.substring(0, start) + variable + message.substring(end);
    setMessage(newMsg);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(preview);
    toast.success("Message copié !");
  };

  const openWhatsApp = () => {
    const phone = member?.phone?.replace(/\s/g, "").replace(/^0/, "33");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(preview)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#1A1D27] border border-[#2D3148] rounded-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D3148]">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            📱 Éditeur Message — {member?.name}
          </h3>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Variables */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Variables disponibles :</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors text-xs"
                  onClick={() => insertVariable(v.key)}
                >
                  {v.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5 font-medium">Message :</p>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[160px] bg-[#0F1117] border-[#2D3148] text-slate-200 font-mono text-sm resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5 font-medium">PRÉVISUALISATION :</p>
            <div className="bg-[#0F1117] border border-[#2D3148] rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap">
              {preview}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-[#2D3148]">
          <Button className="flex-1 bg-[#22263A] hover:bg-[#2D3148] text-slate-200 gap-2" onClick={copyMessage}>
            <Copy className="h-4 w-4" /> Copier
          </Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={openWhatsApp}>
            <ExternalLink className="h-4 w-4" /> Ouvrir WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppEditorModal;
