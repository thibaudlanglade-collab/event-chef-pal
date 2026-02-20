import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, FileCheck } from "lucide-react";

interface EventHeaderProps {
  event: any;
  quote?: any;
}

const EventHeader = ({ event, quote }: EventHeaderProps) => {
  const typeLabels: Record<string, string> = {
    wedding: "Mariage", corporate: "Corporate", birthday: "Anniversaire",
    mariage: "Mariage", other: "Autre",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
    sent: { label: "Envoyé", color: "bg-amber-500/20 text-amber-400" },
    accepted: { label: "Validé ✅", color: "bg-emerald-500/20 text-emerald-400" },
    confirmed: { label: "Validé ✅", color: "bg-emerald-500/20 text-emerald-400" },
  };

  const quoteStatus = quote ? statusLabels[quote.status] || statusLabels.draft : null;

  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 font-semibold">
            {typeLabels[event.type] || event.type}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>{event.venue}</span>
          </div>
        )}
        {event.time && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{event.time}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Users className="h-3.5 w-3.5 text-slate-500" />
          <span>{event.guest_count || 0} convives</span>
        </div>
        {quoteStatus && (
          <div className="flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-slate-500" />
            <Badge className={`${quoteStatus.color} border-0 text-xs`}>{quoteStatus.label}</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventHeader;
