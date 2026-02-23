import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, CalendarDays, MapPin, Clock, Users, Loader2 } from "lucide-react";
import { usePublicAnnouncement, useSubmitFormResponse } from "@/hooks/useAnnouncements";
import logoText from "@/assets/logo-text.png";

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
};

type FormState = "form" | "success" | "error" | "invalid";

const Repondre = () => {
  const { token } = useParams<{ token: string }>();
  const { data: announcement, isLoading } = usePublicAnnouncement(token);
  const submitResponse = useSubmitFormResponse();

  const [firstName, setFirstName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [formState, setFormState] = useState<FormState>("form");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={grainStyle}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" style={grainStyle}>
        <Card className="w-full max-w-md text-center rounded-2xl border-border/50 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <CardContent className="p-10 space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold text-foreground">Lien invalide</h2>
            <p className="text-muted-foreground">Ce lien n'existe pas ou a été supprimé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = announcement.events as any;
  const staffNeeds = (announcement.staff_needs || {}) as Record<string, number>;
  const roles = Object.entries(staffNeeds).filter(([, v]) => v > 0).map(([k]) => k);

  const dateStr = event?.date
    ? new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  const handleSubmit = async () => {
    if (!firstName.trim() || !selectedRole || available === null) return;
    try {
      await submitResponse.mutateAsync({
        announcement_id: announcement.id,
        first_name: firstName,
        role: selectedRole,
        available,
        phone: available ? phone : undefined,
      });
      setFormState("success");
    } catch {
      setFormState("error");
    }
  };

  if (formState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" style={grainStyle}>
        <Card className="w-full max-w-md text-center rounded-2xl border-border/50 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <CardContent className="p-10 space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--status-confirmed))]" />
            <h2 className="text-xl font-bold text-foreground">Merci {firstName} !</h2>
            <p className="text-muted-foreground">
              {available
                ? "Ta réponse a bien été enregistrée. Tu recevras une confirmation de l'équipe."
                : "Merci d'avoir répondu. On se retrouve pour un prochain événement !"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    serveurs: "Serveur",
    chefs: "Chef",
    barmans: "Barman",
    maitre_hotel: "Maître d'hôtel",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={grainStyle}>
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <CardContent className="p-8 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <img src={logoText} alt="Sur le Passe" className="h-8 object-contain" />
          </div>

          {/* Event info */}
          <div className="bg-muted/50 rounded-xl p-5 space-y-3 border border-border/30">
            <h2 className="text-lg font-bold text-center text-foreground">{event?.name}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {dateStr}
              </span>
              {event?.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.venue}
                </span>
              )}
              {event?.time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" />
                  {event.time}
                </span>
              )}
              {event?.guest_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  {event.guest_count} convives
                </span>
              )}
            </div>
          </div>

          {/* First name */}
          <div>
            <Label>Quel est votre prénom ? *</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              className="mt-1.5"
            />
          </div>

          {/* Role selection */}
          {roles.length > 0 && (
            <div>
              <Label>Pour quel poste postulez-vous ? *</Label>
              <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="mt-2 space-y-2">
                {roles.map((role) => (
                  <div key={role} className="flex items-center gap-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value={role} id={`role-${role}`} />
                    <Label htmlFor={`role-${role}`} className="cursor-pointer flex-1">
                      {roleLabels[role] || role}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Availability */}
          <div>
            <Label>Êtes-vous disponible ? *</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                type="button"
                variant={available === true ? "default" : "outline"}
                className={`min-h-[56px] text-base gap-2 ${available === true ? "bg-[hsl(var(--status-confirmed))] hover:bg-[hsl(var(--status-confirmed))]/90 text-white" : ""}`}
                onClick={() => setAvailable(true)}
              >
                <CheckCircle className="h-5 w-5" /> OUI
              </Button>
              <Button
                type="button"
                variant={available === false ? "default" : "outline"}
                className={`min-h-[56px] text-base gap-2 ${available === false ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                onClick={() => setAvailable(false)}
              >
                <XCircle className="h-5 w-5" /> NON
              </Button>
            </div>
          </div>

          {/* Phone (if available) */}
          {available === true && (
            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <Label>Votre numéro de téléphone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 XX XX XX XX"
                className="mt-1.5"
              />
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full min-h-[48px] gap-2"
            onClick={handleSubmit}
            disabled={!firstName.trim() || !selectedRole || available === null || submitResponse.isPending}
          >
            {submitResponse.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
            ) : (
              "Envoyer ma réponse →"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Repondre;
