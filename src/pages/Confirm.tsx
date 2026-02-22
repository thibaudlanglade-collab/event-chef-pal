import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSession, usePublicConfirmationRequests } from "@/hooks/useConfirmations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, CalendarDays, MapPin, Clock } from "lucide-react";
import logoText from "@/assets/logo-text.png";

type ConfirmState = "form" | "confirmed" | "declined" | "expired" | "already_responded";

/* Grain texture SVG as inline background */
const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
};

const ConfirmStatusCard = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4" style={grainStyle}>
    <Card className="w-full max-w-md text-center rounded-2xl border-border/50 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardContent className="p-10 space-y-4">
        {icon}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </div>
);

const Confirm = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading: loadingSession } = usePublicSession(sessionId);
  const { data: requests } = usePublicConfirmationRequests(sessionId);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [state, setState] = useState<ConfirmState>("form");
  const [submitting, setSubmitting] = useState(false);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={grainStyle}>
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return <ConfirmStatusCard icon={<XCircle className="h-12 w-12 mx-auto text-destructive" />} title="Lien invalide" subtitle="Ce lien de confirmation n'existe pas ou a été supprimé." />;
  }

  const isExpired = new Date(session.expires_at) < new Date();
  if (isExpired && state === "form") {
    return <ConfirmStatusCard icon={<Clock className="h-12 w-12 mx-auto text-muted-foreground" />} title="Lien expiré" subtitle="Ce lien n'est plus valide. Contactez directement l'organisateur." />;
  }

  const event = session.events as any;

  const handleRespond = async (response: "confirmed" | "declined") => {
    if (!firstname.trim() || !lastname.trim()) return;
    setSubmitting(true);
    try {
      const normalizedFirst = firstname.trim().toLowerCase();
      const normalizedLast = lastname.trim().toLowerCase();
      const match = requests?.find((r) => {
        const memberName = (r.team_members as any)?.name?.toLowerCase() || "";
        return memberName.includes(normalizedFirst) || memberName.includes(normalizedLast);
      });
      if (match) {
        if (match.status !== "pending") { setState("already_responded"); return; }
        await supabase.from("confirmation_requests").update({ status: response, responded_at: new Date().toISOString(), respondent_firstname: firstname.trim(), respondent_lastname: lastname.trim() }).eq("id", match.id);
      } else {
        await supabase.from("confirmation_requests").insert({ session_id: sessionId!, team_member_id: null, respondent_firstname: firstname.trim(), respondent_lastname: lastname.trim(), status: response, responded_at: new Date().toISOString() });
      }
      setState(response === "confirmed" ? "confirmed" : "declined");
    } catch { /* silently handle */ } finally { setSubmitting(false); }
  };

  if (state === "already_responded") {
    return <ConfirmStatusCard icon={<CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--status-confirmed))]" />} title="Déjà répondu" subtitle="Vous avez déjà répondu à cette demande. Merci !" />;
  }
  if (state === "confirmed") {
    return <ConfirmStatusCard icon={<CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--status-confirmed))]" />} title={`Parfait ${firstname} !`} subtitle="L'organisateur a été notifié. À bientôt !" />;
  }
  if (state === "declined") {
    return <ConfirmStatusCard icon={<XCircle className="h-12 w-12 mx-auto text-muted-foreground" />} title={`Pas de problème ${firstname} !`} subtitle="Merci d'avoir répondu !" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={grainStyle}>
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <CardContent className="p-8 space-y-6">
          {/* Header with new logo */}
          <div className="flex items-center justify-center">
            <img src={logoText} alt="Sur le Passe" className="h-8 object-contain" />
          </div>

          {/* Event info */}
          <div className="bg-muted/50 rounded-xl p-5 space-y-2 border border-border/30">
            <h2 className="text-lg font-bold text-center text-foreground">{event?.name}</h2>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {event?.date ? new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—"}
              </span>
              {event?.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </span>
              )}
            </div>
          </div>

          {/* Name fields */}
          <div className="space-y-3">
            <div>
              <Label>Votre prénom *</Label>
              <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="Prénom" className="mt-1" />
            </div>
            <div>
              <Label>Votre nom *</Label>
              <Input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Nom" className="mt-1" />
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full min-h-[64px] text-lg gap-2 bg-[hsl(var(--status-confirmed))] hover:bg-[hsl(var(--status-confirmed))]/90 text-white"
              onClick={() => handleRespond("confirmed")}
              disabled={!firstname.trim() || !lastname.trim() || submitting}
            >
              <CheckCircle className="h-5 w-5" /> Je suis disponible
            </Button>
            <Button
              variant="outline"
              className="w-full min-h-[64px] text-lg gap-2 border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => handleRespond("declined")}
              disabled={!firstname.trim() || !lastname.trim() || submitting}
            >
              <XCircle className="h-5 w-5" /> Je ne suis pas disponible
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirm;
