import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Copy, ExternalLink, Phone } from "lucide-react";
import { toast } from "sonner";

interface FollowUpPanelProps {
  pendingStaff: any[];
  event: any;
  onWhatsApp: (member: any) => void;
}

function getUrgencyTone(hoursAgo: number): { label: string; color: string; tone: string } {
  if (hoursAgo < 12) return { label: "Neutre", color: "text-slate-400", tone: "simple rappel poli" };
  if (hoursAgo < 24) return { label: "Normal", color: "text-amber-400", tone: "rappel avec légère urgence" };
  if (hoursAgo < 48) return { label: "🔴 URGENT", color: "text-red-400", tone: "ton direct" };
  return { label: "🔴 TRÈS URGENT", color: "text-red-500", tone: "message impératif" };
}

function generateFollowUpMessage(name: string, eventName: string, hoursAgo: number): string {
  const firstName = name.split(" ")[0];
  if (hoursAgo < 12) {
    return `Bonjour ${firstName} 👋 Petit rappel concernant ${eventName}. Pourrais-tu confirmer ta disponibilité quand tu as un moment ? Merci !`;
  }
  if (hoursAgo < 24) {
    return `${firstName}, nous avons besoin de ta confirmation pour ${eventName}. Merci de répondre rapidement OUI ou NON 🙏`;
  }
  if (hoursAgo < 48) {
    return `${firstName}, nous avons besoin de ta confirmation urgente pour ${eventName} ! Réponds OUI ou NON rapidement svp 🙏`;
  }
  return `${firstName}, URGENT — Nous devons absolument avoir ta réponse pour ${eventName}. Sans retour de ta part, nous devrons trouver un remplaçant. Merci de confirmer IMMÉDIATEMENT.`;
}

const FollowUpPanel = ({ pendingStaff, event, onWhatsApp }: FollowUpPanelProps) => {
  if (pendingStaff.length === 0) return null;

  const copyAll = () => {
    const messages = pendingStaff.map((s) => {
      const name = s.team_members?.name || "Inconnu";
      const hoursAgo = s.sent_at ? Math.round((Date.now() - new Date(s.sent_at).getTime()) / 3600000) : 0;
      return `${name}:\n${generateFollowUpMessage(name, event?.name || "", hoursAgo)}\n`;
    });
    navigator.clipboard.writeText(messages.join("\n---\n"));
    toast.success("Tous les messages de relance copiés !");
  };

  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          Relances intelligentes
        </h3>
        <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
          {pendingStaff.length} en attente
        </Badge>
      </div>

      <div className="space-y-3">
        {pendingStaff.map((s: any) => {
          const member = s.team_members;
          const name = member?.name || "Inconnu";
          const phone = member?.phone || "";
          const hoursAgo = s.sent_at ? Math.round((Date.now() - new Date(s.sent_at).getTime()) / 3600000) : 0;
          const urgency = getUrgencyTone(hoursAgo);
          const message = generateFollowUpMessage(name, event?.name || "", hoursAgo);

          return (
            <div key={s.id} className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{name} — {member?.role || "—"}</p>
                  {phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {phone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Envoyé il y a {hoursAgo}h</p>
                  <p className={`text-xs font-semibold ${urgency.color}`}>{urgency.label}</p>
                </div>
              </div>
              <div className="bg-[#1A1D27] rounded-lg p-2.5 text-xs text-slate-400 whitespace-pre-wrap">
                {message}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-300 hover:text-slate-100 gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    toast.success("Message copié !");
                  }}
                >
                  <Copy className="h-3 w-3" /> Copier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                  onClick={() => {
                    const ph = phone.replace(/\s/g, "").replace(/^0/, "33");
                    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                >
                  <ExternalLink className="h-3 w-3" /> WhatsApp
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#2D3148]">
        <Button size="sm" className="flex-1 bg-[#22263A] hover:bg-[#2D3148] text-slate-200 gap-1 text-xs" onClick={copyAll}>
          <Copy className="h-3 w-3" /> Copier tous
        </Button>
      </div>
    </div>
  );
};

export default FollowUpPanel;
