import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, ArrowRight } from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const typeLabels: Record<string, string> = {
  wedding: "Mariage", mariage: "Mariage", corporate: "Corporate",
  birthday: "Anniversaire", anniversaire: "Anniversaire", other: "Événement",
};

interface MonthEventListProps {
  events: any[];
  month: number;
  year: number;
  announcements: any[];
  formResponsesByAnnouncement: Record<string, any[]>;
  onBack: () => void;
  onSelectEvent: (eventId: string) => void;
}

const MonthEventList = ({ events, month, year, announcements, formResponsesByAnnouncement, onBack, onSelectEvent }: MonthEventListProps) => {
  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getAnnouncementStatus = (eventId: string) => {
    const ann = announcements?.find((a: any) => a.event_id === eventId);
    if (!ann) return { label: "Non créée", color: "bg-muted text-muted-foreground", icon: "⚫" };
    if (ann.status === "sent") {
      const responses = formResponsesByAnnouncement[ann.id] || [];
      const confirmed = responses.filter((r: any) => r.available).length;
      const staffNeeds = (ann.staff_needs || {}) as Record<string, number>;
      const totalNeeded = Object.values(staffNeeds).reduce((a: number, b: number) => a + b, 0);
      return {
        label: `Envoyée`,
        detail: `${confirmed}/${totalNeeded} confirmés`,
        color: "bg-[hsl(var(--status-confirmed))]/10 text-[hsl(var(--status-confirmed))]",
        icon: "🟢",
      };
    }
    return { label: "Brouillon", color: "bg-[hsl(var(--status-quote-sent))]/10 text-[hsl(var(--status-quote-sent))]", icon: "🟡" };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          {MONTH_NAMES[month]} {year} — {monthEvents.length} événement{monthEvents.length > 1 ? "s" : ""}
        </h2>
      </div>

      {monthEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Aucun événement ce mois-ci.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monthEvents.map((ev) => {
            const dateStr = new Date(ev.date).toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            });
            const clientName = (ev.clients as any)?.name;
            const annStatus = getAnnouncementStatus(ev.id);
            const ann = announcements?.find((a: any) => a.event_id === ev.id);

            return (
              <Card key={ev.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => onSelectEvent(ev.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground capitalize">📅 {dateStr}</p>
                      <h3 className="text-lg font-semibold text-foreground mt-0.5" style={{ fontFamily: "Syne, sans-serif" }}>
                        {typeLabels[ev.type] || ev.type} {clientName || ev.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {typeLabels[ev.type] || ev.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {ev.venue && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {ev.venue}
                      </span>
                    )}
                    {ev.time && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5" /> {ev.time}
                      </span>
                    )}
                    {ev.guest_count > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
                        <Users className="h-3.5 w-3.5" /> {ev.guest_count} convives
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${annStatus.color}`}>
                        {annStatus.icon} {annStatus.label}
                      </span>
                      {annStatus.detail && (
                        <span className="text-xs text-muted-foreground">| {annStatus.detail}</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                      {ann ? "Ouvrir l'annonce" : "Créer l'annonce"} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonthEventList;
