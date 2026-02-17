import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSession, usePublicConfirmationRequests } from "@/hooks/useConfirmations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, CalendarDays, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

type ConfirmState = "form" | "confirmed" | "declined" | "expired" | "already_responded";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center rounded-2xl">
          <CardContent className="p-8 space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Lien invalide</h2>
            <p className="text-muted-foreground">Ce lien de confirmation n'existe pas ou a été supprimé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check expiry
  const isExpired = new Date(session.expires_at) < new Date();
  if (isExpired && state === "form") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center rounded-2xl">
          <CardContent className="p-8 space-y-4">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Lien expiré</h2>
            <p className="text-muted-foreground">Ce lien n'est plus valide. Contactez directement l'organisateur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = session.events as any;

  const handleRespond = async (response: "confirmed" | "declined") => {
    if (!firstname.trim() || !lastname.trim()) return;
    setSubmitting(true);

    try {
      // Fuzzy match: find a request with matching name
      const normalizedFirst = firstname.trim().toLowerCase();
      const normalizedLast = lastname.trim().toLowerCase();

      const match = requests?.find((r) => {
        const memberName = (r.team_members as any)?.name?.toLowerCase() || "";
        return memberName.includes(normalizedFirst) || memberName.includes(normalizedLast);
      });

      if (match) {
        // Check if already responded
        if (match.status !== "pending") {
          setState("already_responded");
          return;
        }
        // Update existing request
        await supabase
          .from("confirmation_requests")
          .update({ status: response, responded_at: new Date().toISOString(), respondent_firstname: firstname.trim(), respondent_lastname: lastname.trim() })
          .eq("id", match.id);
      } else {
        // Create unidentified request
        await supabase
          .from("confirmation_requests")
          .insert({
            session_id: sessionId!,
            team_member_id: null,
            respondent_firstname: firstname.trim(),
            respondent_lastname: lastname.trim(),
            status: response,
            responded_at: new Date().toISOString(),
          });
      }

      setState(response === "confirmed" ? "confirmed" : "declined");
    } catch {
      // Silently handle
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "already_responded") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center rounded-2xl">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--status-confirmed))]" />
            <h2 className="text-xl font-bold">Déjà répondu</h2>
            <p className="text-muted-foreground">Vous avez déjà répondu à cette demande. Merci !</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center rounded-2xl">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--status-confirmed))]" />
            <h2 className="text-xl font-bold">Parfait {firstname} !</h2>
            <p className="text-muted-foreground">L'organisateur a été notifié. À bientôt !</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center rounded-2xl">
          <CardContent className="p-8 space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Pas de problème {firstname} !</h2>
            <p className="text-muted-foreground">Merci d'avoir répondu !</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 justify-center">
            <img src={logo} alt="CaterPilot" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-lg font-bold">CaterPilot</span>
          </div>

          {/* Event info */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <h2 className="text-lg font-bold text-center">{event?.name}</h2>
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
