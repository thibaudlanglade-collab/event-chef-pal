import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft, Copy, ExternalLink, CalendarDays, MapPin, Users, Clock,
  Send, Bell, ChevronRight, Plus, Phone, CheckCircle, XCircle, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAnnouncementByEvent, useCreateAnnouncement, useUpdateAnnouncement,
  useFormResponses,
} from "@/hooks/useAnnouncements";
import { useRhSettings, calculateStaffNeeds } from "@/hooks/useHrModule";
import { useTeamMembers } from "@/hooks/useSupabase";
import { useTeamStats } from "@/hooks/useHrModule";

const typeLabels: Record<string, string> = {
  wedding: "Mariage", mariage: "Mariage", corporate: "Corporate",
  birthday: "Anniversaire", anniversaire: "Anniversaire", other: "Événement",
};

const ROLE_LABELS: Record<string, { label: string; icon: string }> = {
  serveurs: { label: "Serveurs", icon: "🍽" },
  chefs: { label: "Chefs", icon: "👨‍🍳" },
  barmans: { label: "Barmans", icon: "🍸" },
  maitre_hotel: { label: "Maître d'hôtel", icon: "🎩" },
};

const VARIABLES = [
  { key: "{{date}}", label: "Date" },
  { key: "{{lieu}}", label: "Lieu" },
  { key: "{{type}}", label: "Type" },
  { key: "{{horaire}}", label: "Horaire" },
  { key: "{{convives}}", label: "Convives" },
  { key: "{{lien_formulaire}}", label: "Lien formulaire" },
];

interface AnnouncementManagerProps {
  event: any;
  quote: any;
  onBack: () => void;
  onOpenAdvanced: () => void;
  previewUrl: string;
}

const AnnouncementManager = ({ event, quote, onBack, onOpenAdvanced, previewUrl }: AnnouncementManagerProps) => {
  const { data: rhSettings } = useRhSettings();
  const { data: announcement, isLoading: annLoading } = useAnnouncementByEvent(event.id);
  const { data: responses } = useFormResponses(announcement?.id);
  const { data: allMembers } = useTeamMembers();
  const { data: teamStats } = useTeamStats();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // View: "edit" (creation/edit) or "tracking" (after sent)
  const [view, setView] = useState<"edit" | "tracking">("edit");
  const [showAdvancedMessages, setShowAdvancedMessages] = useState(false);

  // Staff needs — editable
  const autoNeeds = useMemo(() => {
    if (!event || !rhSettings) return { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    return calculateStaffNeeds(event.guest_count || 0, event.type, rhSettings, quote);
  }, [event, rhSettings, quote]);

  const [staffNeeds, setStaffNeeds] = useState<Record<string, number>>({});
  const [customRoles, setCustomRoles] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (announcement?.staff_needs && Object.keys(announcement.staff_needs as object).length > 0) {
      const saved = announcement.staff_needs as Record<string, number>;
      const standard: Record<string, number> = {};
      const custom: { name: string; count: number }[] = [];
      Object.entries(saved).forEach(([k, v]) => {
        if (ROLE_LABELS[k]) standard[k] = v;
        else custom.push({ name: k, count: v });
      });
      setStaffNeeds({ ...(autoNeeds as any), ...standard });
      setCustomRoles(custom);
    } else {
      setStaffNeeds({ ...(autoNeeds as any) });
    }
  }, [autoNeeds, announcement]);

  // Determine initial view
  useEffect(() => {
    if (announcement?.status === "sent") setView("tracking");
  }, [announcement]);

  const allStaffNeeds = useMemo(() => {
    const result = { ...staffNeeds };
    customRoles.forEach((cr) => { if (cr.name && cr.count > 0) result[cr.name] = cr.count; });
    return result;
  }, [staffNeeds, customRoles]);

  const totalNeeded = Object.values(allStaffNeeds).reduce((a, b) => a + b, 0);

  // Default message template
  const defaultTemplate = `👋 Bonjour l'équipe !

Nous avons besoin de personnel pour :
📅 {{date}}
📍 {{lieu}}
⏰ {{horaire}}
👥 {{convives}} convives

Postes recherchés :
${Object.entries(allStaffNeeds).filter(([, v]) => v > 0).map(([k, v]) => `• ${v} ${ROLE_LABELS[k]?.label || k}`).join("\n")}

👇 Cliquez ici pour confirmer votre disponibilité :
{{lien_formulaire}}`;

  const [message, setMessage] = useState("");
  useEffect(() => {
    if (announcement?.message_content) setMessage(announcement.message_content);
    else setMessage(defaultTemplate);
  }, [announcement]);

  // Recalc default template when staff needs change (only if no custom message yet)
  useEffect(() => {
    if (!announcement?.message_content) setMessage(defaultTemplate);
  }, [allStaffNeeds]);

  const dateStr = new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const formUrl = announcement ? `${previewUrl}/repondre/${announcement.token}` : "{{lien_formulaire}}";

  const resolveMessage = (text: string) => {
    return text
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{lieu\}\}/g, event?.venue || "Lieu à confirmer")
      .replace(/\{\{type\}\}/g, typeLabels[event?.type] || event?.type || "")
      .replace(/\{\{horaire\}\}/g, event?.time || "À confirmer")
      .replace(/\{\{convives\}\}/g, String(event?.guest_count || 0))
      .replace(/\{\{lien_formulaire\}\}/g, formUrl);
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMsg = message.substring(0, start) + variable + message.substring(end);
    setMessage(newMsg);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + variable.length, start + variable.length); }, 0);
  };

  const handleSave = async () => {
    if (announcement) {
      await updateAnnouncement.mutateAsync({
        id: announcement.id,
        message_content: message,
        staff_needs: allStaffNeeds,
      });
      toast.success("Annonce mise à jour");
    } else {
      await createAnnouncement.mutateAsync({
        event_id: event.id,
        message_content: message,
        staff_needs: allStaffNeeds,
        status: "draft",
      });
      toast.success("Annonce créée en brouillon");
    }
  };

  const handleSend = async () => {
    if (announcement) {
      await updateAnnouncement.mutateAsync({
        id: announcement.id,
        message_content: message,
        staff_needs: allStaffNeeds,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } else {
      await createAnnouncement.mutateAsync({
        event_id: event.id,
        message_content: message,
        staff_needs: allStaffNeeds,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }
    // Copy resolved message
    navigator.clipboard.writeText(resolveMessage(message));
    toast.success("Message copié ! L'annonce est maintenant envoyée.");
    setView("tracking");
  };

  const openWhatsApp = () => {
    const resolved = resolveMessage(message);
    window.open(`https://wa.me/?text=${encodeURIComponent(resolved)}`, "_blank");
  };

  // ── Responses data ──
  const responsesByRole = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    Object.keys(allStaffNeeds).forEach((k) => { grouped[k] = []; });
    responses?.forEach((r: any) => {
      // Try to match role key
      const roleKey = Object.keys(allStaffNeeds).find((k) =>
        (ROLE_LABELS[k]?.label || k).toLowerCase() === r.role?.toLowerCase() || k === r.role
      ) || r.role;
      if (!grouped[roleKey]) grouped[roleKey] = [];
      grouped[roleKey].push(r);
    });
    return grouped;
  }, [responses, allStaffNeeds]);

  const confirmedByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(responsesByRole).forEach(([k, rs]) => {
      counts[k] = rs.filter((r: any) => r.available).length;
    });
    return counts;
  }, [responsesByRole]);

  const totalConfirmed = Object.values(confirmedByRole).reduce((a, b) => a + b, 0);

  // Follow-up logic
  const hoursAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 3600000);
  };

  const getFollowUpTone = (hours: number): { label: string; emoji: string; color: string } => {
    if (hours < 12) return { label: "Neutre", emoji: "💬", color: "text-muted-foreground" };
    if (hours < 24) return { label: "Normal", emoji: "📢", color: "text-[hsl(var(--status-quote-sent))]" };
    if (hours < 48) return { label: "Urgent", emoji: "⚠️", color: "text-[hsl(var(--status-in-progress))]" };
    return { label: "Très urgent", emoji: "🔴", color: "text-destructive" };
  };

  const missingRoles = Object.entries(allStaffNeeds)
    .filter(([k, needed]) => (confirmedByRole[k] || 0) < needed)
    .map(([k, needed]) => ({
      key: k,
      label: ROLE_LABELS[k]?.label || k,
      icon: ROLE_LABELS[k]?.icon || "📋",
      needed,
      confirmed: confirmedByRole[k] || 0,
      missing: needed - (confirmedByRole[k] || 0),
    }));

  // ══════════════════════════════════════
  // VIEW: TRACKING (after sent)
  // ══════════════════════════════════════
  if (view === "tracking" && announcement) {
    const sentHours = announcement.sent_at ? hoursAgo(announcement.sent_at) : 0;
    const tone = getFollowUpTone(sentHours);

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Retour aux événements
          </Button>
        </div>

        {/* Event header */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
              {typeLabels[event.type] || event.type} — {event.name}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {dateStr}</span>
              {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.venue}</span>}
              {event.time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>}
              {event.guest_count > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.guest_count} convives</span>}
            </div>
          </CardContent>
        </Card>

        {/* Gauges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jauges temps réel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(allStaffNeeds).filter(([, v]) => v > 0).map(([key, needed]) => {
              const confirmed = confirmedByRole[key] || 0;
              const pct = Math.min(100, Math.round((confirmed / needed) * 100));
              const isFull = confirmed >= needed;
              const roleInfo = ROLE_LABELS[key] || { label: key, icon: "📋" };
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{roleInfo.icon} {roleInfo.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{confirmed}/{needed}</span>
                      {isFull ? (
                        <Badge className="text-[10px] bg-[hsl(var(--status-confirmed))]/10 text-[hsl(var(--status-confirmed))] border-0">✅ Complet</Badge>
                      ) : confirmed === 0 ? (
                        <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">🔴 Non pourvu</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-[hsl(var(--status-quote-sent))]/10 text-[hsl(var(--status-quote-sent))] border-0">⚠️ {needed - confirmed} manquant{needed - confirmed > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className="h-2.5"
                    style={{ "--progress-color": isFull ? "hsl(var(--status-confirmed))" : confirmed === 0 ? "hsl(var(--destructive))" : "hsl(var(--status-quote-sent))" } as any}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {missingRoles.length > 0 && (
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" /> Relancer les non-confirmés ({missingRoles.reduce((a, r) => a + r.missing, 0)})
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => setView("edit")}>
            ✏️ Modifier l'annonce
          </Button>
          <Button variant="outline" className="gap-2" onClick={onOpenAdvanced}>
            Vue avancée
          </Button>
        </div>

        {/* Responses by role (accordion) */}
        <Accordion type="multiple" defaultValue={Object.keys(allStaffNeeds)} className="space-y-2">
          {Object.entries(allStaffNeeds).filter(([, v]) => v > 0).map(([key, needed]) => {
            const roleResponses = responsesByRole[key] || [];
            const confirmed = roleResponses.filter((r: any) => r.available).length;
            const roleInfo = ROLE_LABELS[key] || { label: key, icon: "📋" };
            return (
              <AccordionItem key={key} value={key} className="border rounded-xl overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {roleInfo.icon} {roleInfo.label}
                    <span className="text-muted-foreground">({confirmed} confirmés / {needed} requis)</span>
                    {confirmed >= needed && <span className="text-[hsl(var(--status-confirmed))]">✅</span>}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-2">
                  {roleResponses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Aucune réponse pour ce poste.</p>
                  ) : (
                    roleResponses.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.available ? (
                            <CheckCircle className="h-4 w-4 text-[hsl(var(--status-confirmed))]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{r.first_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Répondu {new Date(r.submitted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              {" à "}{new Date(r.submitted_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {r.phone}
                            </span>
                          )}
                          {r.available ? (
                            <Badge className="text-[10px] bg-[hsl(var(--status-confirmed))]/10 text-[hsl(var(--status-confirmed))] border-0">OUI</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">NON</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {confirmed < needed && (
                    <div className="text-sm text-muted-foreground pt-2 flex items-center gap-2">
                      <span>+ {needed - confirmed} poste{needed - confirmed > 1 ? "s" : ""} non pourvu{needed - confirmed > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Confirmed team summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">✅ Équipe confirmée ({totalConfirmed}/{totalNeeded})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(allStaffNeeds).filter(([, v]) => v > 0).map(([key, needed]) => {
                const confirmed = (responsesByRole[key] || []).filter((r: any) => r.available);
                const roleInfo = ROLE_LABELS[key] || { label: key, icon: "📋" };
                return (
                  <div key={key}>
                    <p className="text-sm font-medium mb-1">
                      {roleInfo.icon} {roleInfo.label} ({confirmed.length}/{needed})
                      {confirmed.length >= needed && " ✅"}
                    </p>
                    {confirmed.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun confirmé</p>
                    ) : (
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {confirmed.map((r: any) => (
                          <li key={r.id}>• {r.first_name} {r.phone && `— ${r.phone}`}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up section */}
        {missingRoles.length > 0 && announcement.sent_at && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🔔 Relances — Ton : <span className={tone.color}>{tone.emoji} {tone.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {missingRoles.map((role) => {
                const followUpMsg = sentHours < 12
                  ? `📢 Rappel : nous cherchons encore ${role.missing} ${role.label.toLowerCase()} pour le ${dateStr}. Répondez via le lien ci-dessous !\n\n🔗 ${formUrl}`
                  : sentHours < 24
                    ? `⚠️ Il nous manque encore ${role.missing} ${role.label.toLowerCase()} pour le ${dateStr}. Merci de répondre rapidement !\n\n🔗 ${formUrl}`
                    : `🔴 URGENT — ${role.missing} ${role.label.toLowerCase()} manquant${role.missing > 1 ? "s" : ""} pour le ${dateStr} ! Répondez immédiatement svp !\n\n🔗 ${formUrl}`;

                return (
                  <div key={role.key} className="border border-border rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium">{role.icon} Poste non pourvu : {role.missing} {role.label}</p>
                    <div className="bg-muted/40 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap font-mono">
                      {followUpMsg}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText(followUpMsg); toast.success("Copié !"); }}>
                        <Copy className="h-3 w-3" /> Copier
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(followUpMsg)}`, "_blank")}>
                        <ExternalLink className="h-3 w-3" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Advanced messages mode */}
        {showAdvancedMessages && responses && responses.filter((r: any) => r.available).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">💬 Messages individuels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {responses.filter((r: any) => r.available).map((r: any) => {
                const individualMsg = `Bonjour ${r.first_name} ! Ta participation est confirmée pour le ${dateStr} à ${event.venue || "lieu à confirmer"}. Rendez-vous à ${event.time || "l'heure indiquée"}. À bientôt ! 👋`;
                return (
                  <div key={r.id} className="border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.first_name} — {ROLE_LABELS[r.role]?.label || r.role}</p>
                      {r.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {r.phone}</span>}
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-sm whitespace-pre-wrap">{individualMsg}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText(individualMsg); toast.success("Copié !"); }}>
                        <Copy className="h-3 w-3" /> Copier
                      </Button>
                      {r.phone && (
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                          const phone = r.phone.replace(/\s/g, "").replace(/^0/, "33");
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(individualMsg)}`, "_blank");
                        }}>
                          <ExternalLink className="h-3 w-3" /> WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {responses && responses.filter((r: any) => r.available).length > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => setShowAdvancedMessages(!showAdvancedMessages)}>
            <MessageCircle className="h-4 w-4" /> {showAdvancedMessages ? "Masquer" : "Mode avancé — Messages individuels"}
          </Button>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════
  // VIEW: EDIT (creation / modification)
  // ══════════════════════════════════════
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          {announcement ? "Modifier l'annonce" : "Créer une annonce"}
        </h2>
      </div>

      {/* Section A — Event data */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
            {typeLabels[event.type] || event.type} — {event.name}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" /> {dateStr}</span>
            {event.venue && <span className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5"><MapPin className="h-3.5 w-3.5" /> {event.venue}</span>}
            {event.time && <span className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5"><Clock className="h-3.5 w-3.5" /> {event.time}</span>}
            {event.guest_count > 0 && <span className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5"><Users className="h-3.5 w-3.5" /> {event.guest_count} convives</span>}
          </div>
        </CardContent>
      </Card>

      {/* Section B — Staff needs (editable) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Postes requis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(ROLE_LABELS).map(([key, info]) => (
              <div key={key} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
                <span className="text-lg">{info.icon}</span>
                <div className="flex-1">
                  <Label className="text-sm">{info.label}</Label>
                  <p className="text-[10px] text-muted-foreground">Auto: {autoNeeds[key as keyof typeof autoNeeds]}</p>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={staffNeeds[key] || 0}
                  onChange={(e) => setStaffNeeds({ ...staffNeeds, [key]: Number(e.target.value) })}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>

          {/* Custom roles */}
          {customRoles.map((cr, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <span className="text-lg">📋</span>
              <Input
                value={cr.name}
                onChange={(e) => {
                  const next = [...customRoles];
                  next[i].name = e.target.value;
                  setCustomRoles(next);
                }}
                placeholder="Nom du poste"
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                value={cr.count}
                onChange={(e) => {
                  const next = [...customRoles];
                  next[i].count = Number(e.target.value);
                  setCustomRoles(next);
                }}
                className="w-20 text-center"
              />
            </div>
          ))}

          <Button variant="ghost" size="sm" className="gap-1 text-sm" onClick={() => setCustomRoles([...customRoles, { name: "", count: 1 }])}>
            <Plus className="h-3 w-3" /> Ajouter un poste personnalisé
          </Button>
        </CardContent>
      </Card>

      {/* Section C — Gauges preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Confirmations en cours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(allStaffNeeds).filter(([, v]) => v > 0).map(([key, needed]) => {
            const confirmed = confirmedByRole[key] || 0;
            const pct = Math.min(100, Math.round((confirmed / needed) * 100));
            const isFull = confirmed >= needed;
            const roleInfo = ROLE_LABELS[key] || { label: key, icon: "📋" };
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{roleInfo.icon} {roleInfo.label}</span>
                  <span className="text-muted-foreground">{confirmed}/{needed}</span>
                </div>
                <Progress
                  value={pct}
                  className="h-2"
                  style={{ "--progress-color": isFull ? "hsl(var(--status-confirmed))" : confirmed === 0 ? "hsl(var(--destructive))" : "hsl(var(--status-quote-sent))" } as any}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Message editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💬 Message groupe WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variables */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Variables cliquables :</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => insertVariable(v.key)}
                >
                  {v.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Editor */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[180px] font-mono text-sm resize-none"
          />

          {/* Preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Prévisualisation :</p>
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">
              {resolveMessage(message)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2" onClick={handleSave} disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>
          💾 Sauvegarder en brouillon
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(resolveMessage(message)); toast.success("Copié !"); }}>
          <Copy className="h-4 w-4" /> Copier le message
        </Button>
        <Button className="gap-2" onClick={handleSend} disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>
          <Send className="h-4 w-4" /> {announcement?.status === "sent" ? "Mettre à jour et copier" : "Envoyer l'annonce"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={openWhatsApp}>
          <ExternalLink className="h-4 w-4" /> Ouvrir WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementManager;
