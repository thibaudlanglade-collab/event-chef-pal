import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, MessageSquare, Star, Calendar, Timer, BarChart3 } from "lucide-react";

interface CandidateCardProps {
  member: any;
  staffEntry?: any; // event_staff entry if assigned
  stats?: { reliability: number; events_total: number; events_month: number; events_confirmed: number; avg_response_minutes: number };
  onConfirm?: () => void;
  onRefuse?: () => void;
  onWhatsApp?: () => void;
  onAdd?: () => void;
  isAssigned: boolean;
}

const CandidateCard = ({ member, staffEntry, stats, onConfirm, onRefuse, onWhatsApp, onAdd, isAssigned }: CandidateCardProps) => {
  const status = staffEntry?.confirmation_status || "not_contacted";

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    confirmed: { label: "Confirmé", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle className="h-3 w-3" /> },
    pending: { label: "En attente", bg: "bg-amber-500/20", text: "text-amber-400", icon: <Clock className="h-3 w-3" /> },
    refused: { label: "Refusé", bg: "bg-red-500/20", text: "text-red-400", icon: <XCircle className="h-3 w-3" /> },
    declined: { label: "Refusé", bg: "bg-red-500/20", text: "text-red-400", icon: <XCircle className="h-3 w-3" /> },
    not_contacted: { label: "Non contacté", bg: "bg-slate-500/20", text: "text-slate-400", icon: <Clock className="h-3 w-3" /> },
  };

  const st = statusConfig[status] || statusConfig.not_contacted;
  const reliability = stats?.reliability ?? 50;
  const eventsMonth = stats?.events_month ?? 0;
  const eventsConfirmed = stats?.events_confirmed ?? 0;
  const eventsTotal = stats?.events_total ?? 0;
  const avgResponse = stats?.avg_response_minutes ?? 0;

  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 space-y-3 hover:border-emerald-500/30 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-100 text-sm">{member.name}</h4>
          <p className="text-xs text-slate-400">{member.role || "—"} | {member.hourly_rate || 0}€/h</p>
        </div>
        <Badge className={`${st.bg} ${st.text} border-0 text-xs gap-1`}>
          {st.icon} {st.label}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-amber-400" />
          <span>Fiabilité: <span className={reliability >= 80 ? "text-emerald-400" : reliability >= 50 ? "text-amber-400" : "text-red-400"}>{reliability}%</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>Ce mois: {eventsConfirmed}/{eventsMonth}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-3 w-3" />
          <span>Réponse: {avgResponse > 0 ? `${Math.round(avgResponse)} min` : "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" />
          <span>Total: {eventsTotal} événements</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {!isAssigned && onAdd && (
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={onAdd}>
            + Ajouter
          </Button>
        )}
        {isAssigned && status === "pending" && (
          <>
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={onConfirm}>
              <CheckCircle className="h-3 w-3" /> Confirmer
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1" onClick={onRefuse}>
              <XCircle className="h-3 w-3" /> Refuser
            </Button>
          </>
        )}
        {isAssigned && status !== "confirmed" && onWhatsApp && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 gap-1 ml-auto" onClick={onWhatsApp}>
            <MessageSquare className="h-3 w-3" /> WhatsApp
          </Button>
        )}
        {isAssigned && status === "not_contacted" && (
          <>
            {onConfirm && (
              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={onConfirm}>
                <CheckCircle className="h-3 w-3" /> Confirmer
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
