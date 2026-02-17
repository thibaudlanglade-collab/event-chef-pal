import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Users, Clock, Phone } from "lucide-react";
import { mockEvents, statusLabels, statusColors, typeLabels, type CaterEvent } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, addMonths, subMonths
} from "date-fns";
import { fr } from "date-fns/locale";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 17));
  const [selectedEvent, setSelectedEvent] = useState<CaterEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (d: Date) =>
    mockEvents.filter((e) => isSameDay(new Date(e.date), d));

  const statusDotColor: Record<string, string> = {
    prospect: "bg-status-prospect",
    quote_sent: "bg-status-quote-sent",
    appointment: "bg-status-appointment",
    confirmed: "bg-status-confirmed",
    in_progress: "bg-status-in-progress",
    completed: "bg-status-completed",
    cancelled: "bg-status-cancelled",
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground text-sm">Visualisez tous vos événements</p>
        </div>
        <Button variant="accent" className="gap-2">
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {days.map((d, i) => {
              const evts = getEventsForDay(d);
              const isToday = isSameDay(d, new Date(2026, 1, 17));
              const isCurrentMonth = isSameMonth(d, currentDate);
              return (
                <div
                  key={i}
                  className={cn(
                    "bg-card min-h-[80px] lg:min-h-[100px] p-1.5 transition-colors",
                    !isCurrentMonth && "opacity-40"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                      isToday && "bg-accent text-accent-foreground"
                    )}
                  >
                    {format(d, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {evts.slice(0, 3).map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={cn(
                          "w-full text-left text-[10px] lg:text-xs px-1.5 py-0.5 rounded truncate font-medium transition-colors",
                          statusColors[evt.status]
                        )}
                      >
                        {evt.name}
                      </button>
                    ))}
                    {evts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        +{evts.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2.5 h-2.5 rounded-full", statusDotColor[key])} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Event detail drawer */}
        {selectedEvent && (
          <Card className="w-80 shrink-0 hidden lg:block animate-fade-in self-start sticky top-8">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium mt-1 inline-block", statusColors[selectedEvent.status])}>
                    {statusLabels[selectedEvent.status]}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  {new Date(selectedEvent.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {selectedEvent.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {selectedEvent.venue}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  {selectedEvent.guestCount} convives
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {selectedEvent.clientName} — {selectedEvent.clientPhone}
                </div>
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                <p className="text-sm">{typeLabels[selectedEvent.type]}</p>
              </div>
              {selectedEvent.notes && (
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedEvent.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Calendar;
