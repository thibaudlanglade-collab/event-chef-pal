import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  FileText,
  Plus,
  Package,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  UserCheck,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockEvents, mockStockItems, statusLabels, statusColors, typeLabels } from "@/data/mockData";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();

  // Today's events
  const today = "2026-02-17";
  const todayEvents = mockEvents.filter((e) => e.date === today);
  const weekEvents = mockEvents.filter((e) => {
    const d = new Date(e.date);
    const start = new Date("2026-02-16");
    const end = new Date("2026-02-22");
    return d >= start && d <= end;
  });

  // Alerts
  const staleQuotes = mockEvents.filter(
    (e) => e.status === "quote_sent" && new Date(e.date) < new Date("2026-02-17")
  );
  const missingStaff = mockEvents.filter(
    (e) =>
      (e.status === "confirmed" || e.status === "appointment") &&
      e.assignedTeam.length < Math.ceil(e.guestCount / 30)
  );
  const lowStock = mockStockItems.filter((s) => s.currentQty < s.minThreshold);

  // Weekly revenue estimate
  const weekRevenue = weekEvents
    .filter((e) => e.status === "confirmed" || e.status === "in_progress" || e.status === "completed")
    .reduce((sum, e) => sum + e.guestCount * 45, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Bonjour, Marc 👋</h1>
          <p className="text-muted-foreground mt-1">
            Mardi 17 février 2026 — {todayEvents.length} événement{todayEvents.length > 1 ? "s" : ""} aujourd'hui
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="px-4 py-2 flex items-center gap-2 border-accent/30 bg-accent/5">
            <TrendingUp className="h-4 w-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Revenu semaine</p>
              <p className="text-lg font-bold">{weekRevenue.toLocaleString("fr-FR")} €</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="accent" onClick={() => navigate("/quotes")} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau devis
        </Button>
        <Button variant="outline" onClick={() => navigate("/calendar")} className="gap-2">
          <CalendarDays className="h-4 w-4" /> Nouvel événement
        </Button>
        <Button variant="outline" onClick={() => navigate("/stock")} className="gap-2">
          <Package className="h-4 w-4" /> Mouvement stock
        </Button>
      </div>

      {/* Today's events */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-accent" />
          Événements du jour
        </h2>
        {todayEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun événement aujourd'hui — profitez-en pour préparer la suite !</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {todayEvents.map((event, i) => (
              <Card
                key={event.id}
                className="hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate("/calendar")}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-1 self-stretch rounded-full shrink-0",
                        event.status === "confirmed" && "bg-status-confirmed",
                        event.status === "in_progress" && "bg-status-in-progress",
                        event.status === "quote_sent" && "bg-status-quote-sent",
                        event.status === "prospect" && "bg-status-prospect"
                      )}
                    />
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {event.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {event.guestCount} convives
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        statusColors[event.status]
                      )}
                    >
                      {statusLabels[event.status]}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {typeLabels[event.type]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* This week preview */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Cette semaine</h2>
        <div className="grid gap-2">
          {weekEvents
            .filter((e) => e.date !== today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((event) => (
              <Card key={event.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("/calendar")}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-1 h-8 rounded-full shrink-0",
                        event.status === "confirmed" && "bg-status-confirmed",
                        event.status === "in_progress" && "bg-status-in-progress",
                        event.status === "quote_sent" && "bg-status-quote-sent",
                        event.status === "prospect" && "bg-status-prospect",
                        event.status === "appointment" && "bg-status-appointment",
                        event.status === "completed" && "bg-status-completed"
                      )}
                    />
                    <div>
                      <p className="font-medium text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        — {event.guestCount} convives
                      </p>
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[event.status])}>
                    {statusLabels[event.status]}
                  </span>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent" />
          Alertes urgentes
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Stale quotes */}
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-destructive" />
                Devis sans réponse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {staleQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun devis en attente</p>
              ) : (
                staleQuotes.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-destructive text-xs font-medium">
                      3 jours
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Missing staff */}
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-accent" />
                Staff manquant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {missingStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tous les événements sont staffés</p>
              ) : (
                missingStaff.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-accent text-xs font-medium">
                      {Math.ceil(e.guestCount / 30) - e.assignedTeam.length} rôle(s)
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Low stock */}
          <Card className="border-l-4 border-l-status-in-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-status-in-progress" />
                Stock bas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tout est en ordre</p>
              ) : (
                lowStock.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-status-in-progress text-xs font-medium">
                      {s.currentQty}/{s.minThreshold} {s.unit}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
