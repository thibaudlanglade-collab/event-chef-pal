import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays, FileText, Plus, AlertTriangle, Users,
  Clock, MapPin, UserCheck, TrendingUp, X, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents, useStockItems, useQuotes, useTeamMembers } from "@/hooks/useSupabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useVersion } from "@/contexts/VersionContext";
import { cn } from "@/lib/utils";

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
const typeLabels: Record<string, string> = {
  wedding: "Mariage", corporate: "Entreprise", private: "Privé", other: "Autre",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { isDeveloped } = useVersion();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: stockItems, isLoading: stockLoading } = useStockItems();
  const { data: quotes } = useQuotes();
  const { data: teamMembers } = useTeamMembers();

  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    localStorage.getItem("onboarding_dismissed") === "true"
  );
  const [celebrationShown, setCelebrationShown] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayEvents = events?.filter((e) => e.date === today) || [];
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const weekEvents = events?.filter((e) => {
    const d = new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  }) || [];

  // Alerts
  const staleQuotes = quotes?.filter((q) => {
    if (q.status !== "draft" && q.status !== "sent") return false;
    const created = new Date(q.created_at);
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 2;
  }) || [];

  const lowStock = stockItems?.filter((s) => (s.current_qty || 0) < (s.min_threshold || 0)) || [];

  const weekRevenue = weekEvents
    .filter((e) => ["confirmed", "in_progress", "completed"].includes(e.status))
    .reduce((sum, e) => sum + (e.guest_count || 0) * 45, 0);

  // Onboarding steps
  const hasEvents = (events?.length || 0) > 0;
  const hasTeam = (teamMembers?.length || 0) > 0;
  const hasQuotes = (quotes?.length || 0) > 0;
  const allComplete = hasEvents && hasTeam && hasQuotes;

  useEffect(() => {
    if (allComplete && !onboardingDismissed && !celebrationShown) {
      setCelebrationShown(true);
      const timer = setTimeout(() => {
        setOnboardingDismissed(true);
        localStorage.setItem("onboarding_dismissed", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, onboardingDismissed, celebrationShown]);

  const showOnboarding = !onboardingDismissed && !allComplete;
  const showCelebration = !onboardingDismissed && allComplete;

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    localStorage.setItem("onboarding_dismissed", "true");
  };

  const firstName = profile?.first_name || "";
  const greeting = firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋";

  if (eventsLoading || stockLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{greeting}</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activité : événements du jour, alertes et chiffres clés.</p>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {isDeveloped && (
          <Card className="px-4 py-2 flex items-center gap-2 border-primary/20 bg-primary/5 rounded-xl">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Revenu semaine</p>
              <p className="text-lg font-bold">{weekRevenue.toLocaleString("fr-FR")} €</p>
            </div>
          </Card>
        )}
      </div>

      {/* Onboarding banner */}
      {showOnboarding && (
        <Card className="rounded-2xl border-primary/30 bg-primary/5 relative">
          <button onClick={dismissOnboarding} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <CardContent className="p-5">
            <h2 className="text-lg font-bold mb-1">🎉 Bienvenue ! Par où commencer ?</h2>
            <p className="text-sm text-muted-foreground mb-4">Suivez ces 3 étapes pour configurer votre espace en 5 minutes</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className={cn("rounded-xl border p-4 space-y-2", hasEvents ? "border-primary/30 bg-primary/5" : "border-border")}>
                <div className="flex items-center gap-2">
                  {hasEvents ? <Check className="h-5 w-5 text-primary" /> : <CalendarDays className="h-5 w-5 text-muted-foreground" />}
                  <span className="font-semibold text-sm">Créer un événement</span>
                </div>
                <p className="text-xs text-muted-foreground">Ajoutez un mariage, un anniversaire ou tout autre prestation</p>
                {!hasEvents && <Button variant="outline" size="sm" onClick={() => navigate("/calendar")} className="w-full mt-1">Créer un événement →</Button>}
              </div>
              <div className={cn("rounded-xl border p-4 space-y-2", hasTeam ? "border-primary/30 bg-primary/5" : "border-border")}>
                <div className="flex items-center gap-2">
                  {hasTeam ? <Check className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                  <span className="font-semibold text-sm">Ajouter votre équipe</span>
                </div>
                <p className="text-xs text-muted-foreground">Enregistrez vos serveurs, chefs et autre personnel</p>
                {!hasTeam && <Button variant="outline" size="sm" onClick={() => navigate("/my-teams")} className="w-full mt-1">Ajouter un employé →</Button>}
              </div>
              <div className={cn("rounded-xl border p-4 space-y-2", hasQuotes ? "border-primary/30 bg-primary/5" : "border-border")}>
                <div className="flex items-center gap-2">
                  {hasQuotes ? <Check className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  <span className="font-semibold text-sm">Envoyer un devis</span>
                </div>
                <p className="text-xs text-muted-foreground">Créez et envoyez un devis professionnel en quelques clics</p>
                {!hasQuotes && <Button variant="outline" size="sm" onClick={() => navigate("/quotes")} className="w-full mt-1">Créer un devis →</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {showCelebration && (
        <Card className="rounded-2xl border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-5 text-center">
            <p className="text-lg font-bold">✅ Vous êtes prêt ! Votre espace est configuré.</p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="accent" onClick={() => navigate("/calendar")} className="gap-2">
          <Plus className="h-4 w-4" /> Créer un événement
        </Button>
        {isDeveloped ? (
          <Button variant="outline" onClick={() => navigate("/quotes")} className="gap-2">
            <FileText className="h-4 w-4" /> Nouveau devis
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate("/announcements")} className="gap-2">
            <CalendarDays className="h-4 w-4" /> Consulter planning
          </Button>
        )}
      </div>

      {/* Today's events */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Événements du jour
          <span className="text-sm font-normal text-muted-foreground ml-1">— {todayEvents.length} événement{todayEvents.length > 1 ? "s" : ""}</span>
        </h2>
        {todayEvents.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl">
            <p className="text-muted-foreground">Aucun événement aujourd'hui — profitez-en pour préparer la suite !</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {todayEvents.map((event, i) => (
              <Card key={event.id} className="hover:shadow-card-hover transition-all cursor-pointer animate-fade-in rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} onClick={() => navigate("/calendar")}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-1 self-stretch rounded-full shrink-0", `bg-status-${event.status.replace("_", "-")}`)} />
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {event.time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>}
                        {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.venue}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.guest_count} convives</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[event.status] || "")}>{statusLabels[event.status] || event.status}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{typeLabels[event.type] || event.type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* This week — only in developed mode */}
      {isDeveloped && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Cette semaine</h2>
          {weekEvents.filter((e) => e.date !== today).length === 0 ? (
            <Card className="p-6 text-center rounded-2xl"><p className="text-muted-foreground text-sm">Pas d'autre événement cette semaine.</p></Card>
          ) : (
            <div className="grid gap-2">
              {weekEvents.filter((e) => e.date !== today).sort((a, b) => a.date.localeCompare(b.date)).map((event) => (
                <Card key={event.id} className="hover:shadow-sm transition-shadow cursor-pointer rounded-xl" onClick={() => navigate("/calendar")}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1 h-8 rounded-full shrink-0", `bg-status-${event.status.replace("_", "-")}`)} />
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} — {event.guest_count} convives
                        </p>
                      </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[event.status] || "")}>{statusLabels[event.status] || event.status}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Alerts */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alertes urgentes
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-destructive rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-destructive" />Devis sans réponse</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {staleQuotes.length === 0 ? <p className="text-sm text-muted-foreground">Aucun devis en attente</p> : staleQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{q.events?.name || "Sans événement"}</span>
                  <span className="text-destructive text-xs font-medium">{Math.floor((Date.now() - new Date(q.created_at).getTime()) / 86400000)}j</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" />Staff manquant</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Vérifiez les affectations dans l'onglet Équipe</p></CardContent>
          </Card>
          <Card className="border-l-4 border-l-status-in-progress rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-status-in-progress" />Stock bas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Tout est en ordre</p> : lowStock.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-status-in-progress text-xs font-medium">{s.current_qty}/{s.min_threshold} {s.unit}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
