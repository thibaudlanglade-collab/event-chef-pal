import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Users, Clock, Phone } from "lucide-react";
import { useEvents, useClients, useCreateEvent } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  prospect: "Prospect", quote_sent: "Devis envoyé", appointment: "RDV fixé",
  confirmed: "Confirmé", in_progress: "En cours", completed: "Terminé", cancelled: "Annulé",
};
const statusColors: Record<string, string> = {
  prospect: "bg-status-prospect/15 text-status-prospect",
  quote_sent: "bg-status-quote-sent/15 text-status-quote-sent",
  appointment: "bg-status-appointment/15 text-status-appointment",
  confirmed: "bg-status-confirmed/15 text-status-confirmed",
  in_progress: "bg-status-in-progress/15 text-status-in-progress",
  completed: "bg-status-completed/15 text-status-completed",
  cancelled: "bg-status-cancelled/15 text-status-cancelled",
};
const typeLabels: Record<string, string> = { wedding: "Mariage", corporate: "Entreprise", private: "Privé", other: "Autre" };

type SelectedEvent = {
  id: string; name: string; date: string; time: string | null; status: string; type: string;
  venue: string | null; guest_count: number | null; notes: string | null;
  clients: { name: string; phone: string | null; email: string | null } | null;
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { data: events, isLoading } = useEvents();
  const { data: clients } = useClients();
  const createEvent = useCreateEvent();

  const [newEvent, setNewEvent] = useState({ name: "", date: "", time: "", type: "other", venue: "", guest_count: 0, notes: "", status: "prospect", client_id: "" });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) { days.push(day); day = addDays(day, 1); }

  const getEventsForDay = (d: Date) => events?.filter((e) => isSameDay(new Date(e.date), d)) || [];

  const handleCreate = () => {
    if (!newEvent.name || !newEvent.date) return;
    createEvent.mutate({
      name: newEvent.name, date: newEvent.date, time: newEvent.time || null,
      type: newEvent.type, venue: newEvent.venue || null, guest_count: newEvent.guest_count,
      notes: newEvent.notes || null, status: newEvent.status,
      client_id: newEvent.client_id || null,
    }, { onSuccess: () => { setShowModal(false); setNewEvent({ name: "", date: "", time: "", type: "other", venue: "", guest_count: 0, notes: "", status: "prospect", client_id: "" }); } });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground text-sm">Visualisez tous vos événements</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-5 w-5" /></Button>
            <h2 className="text-lg font-semibold capitalize">{format(currentDate, "MMMM yyyy", { locale: fr })}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {days.map((d, i) => {
              const evts = getEventsForDay(d);
              const isToday = isSameDay(d, new Date());
              const isCurrentMonth = isSameMonth(d, currentDate);
              return (
                <div key={i} className={cn("bg-card min-h-[80px] lg:min-h-[100px] p-1.5", !isCurrentMonth && "opacity-40")}>
                  <span className={cn("text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full", isToday && "bg-primary text-primary-foreground")}>{format(d, "d")}</span>
                  <div className="mt-1 space-y-0.5">
                    {evts.slice(0, 3).map((evt) => (
                      <button key={evt.id} onClick={() => setSelectedEvent(evt as any)} className={cn("w-full text-left text-[10px] lg:text-xs px-1.5 py-0.5 rounded truncate font-medium", statusColors[evt.status] || "")}>
                        {evt.name}
                      </button>
                    ))}
                    {evts.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{evts.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2.5 h-2.5 rounded-full", `bg-status-${key.replace("_", "-")}`)} /> {label}
              </div>
            ))}
          </div>
        </div>

        {selectedEvent && (
          <Card className="w-80 shrink-0 hidden lg:block animate-fade-in self-start sticky top-8 rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium mt-1 inline-block", statusColors[selectedEvent.status] || "")}>{statusLabels[selectedEvent.status]}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{new Date(selectedEvent.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} {selectedEvent.time && `à ${selectedEvent.time}`}</div>
                {selectedEvent.venue && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{selectedEvent.venue}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{selectedEvent.guest_count} convives</div>
                {selectedEvent.clients && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{selectedEvent.clients.name} {selectedEvent.clients.phone && `— ${selectedEvent.clients.phone}`}</div>}
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2"><p className="text-xs font-medium text-muted-foreground mb-1">Type</p><p className="text-sm">{typeLabels[selectedEvent.type] || selectedEvent.type}</p></div>
              {selectedEvent.notes && <div className="bg-secondary rounded-lg px-3 py-2"><p className="text-xs font-medium text-muted-foreground mb-1">Notes</p><p className="text-sm">{selectedEvent.notes}</p></div>}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create event modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-lg animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Nouvel événement</h2><Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Nom *</Label><Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="Mariage Dupont" className="mt-1" /></div>
                <div><Label>Client</Label><select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={newEvent.client_id} onChange={(e) => setNewEvent({ ...newEvent, client_id: e.target.value })}><option value="">— Aucun —</option>{clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><Label>Date *</Label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="mt-1" /></div>
                <div><Label>Heure</Label><Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="mt-1" /></div>
                <div><Label>Type</Label><select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}><option value="wedding">Mariage</option><option value="corporate">Entreprise</option><option value="private">Privé</option><option value="other">Autre</option></select></div>
                <div><Label>Convives</Label><Input type="number" value={newEvent.guest_count} onChange={(e) => setNewEvent({ ...newEvent, guest_count: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label>Lieu</Label><Input value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} placeholder="Château de..." className="mt-1" /></div>
                <div><Label>Statut</Label><select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={newEvent.status} onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div><Label>Notes</Label><Input value={newEvent.notes} onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} placeholder="Informations complémentaires..." className="mt-1" /></div>
              <Button variant="accent" className="w-full" onClick={handleCreate} disabled={createEvent.isPending}>{createEvent.isPending ? "Création..." : "Créer l'événement"}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Calendar;
