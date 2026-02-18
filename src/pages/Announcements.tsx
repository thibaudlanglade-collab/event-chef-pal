import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Phone, UserCheck, MessageSquare, X, Copy, ExternalLink,
  CheckCircle, XCircle, Clock, AlertTriangle, Users, RefreshCw, User
} from "lucide-react";
import { useTeamMembers, useEvents, useCreateTeamMember, useEventStaff } from "@/hooks/useSupabase";
import {
  useTeamReliability, useCreateConfirmationSession, useConfirmationRequestsByEvent,
  useUpdateConfirmationStatus, useExistingConfirmations, useConfirmationSessions
} from "@/hooks/useConfirmations";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLES = ["Serveur", "Serveuse", "Chef", "Cuisinier", "Décorateur", "Autre"];

const Team = () => {
  const [searchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get("event") || "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [generatedSession, setGeneratedSession] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" });

  const { data: members, isLoading } = useTeamMembers();
  const { data: events } = useEvents();
  const { data: reliability } = useTeamReliability();
  const { data: confirmationRequests, refetch: refetchRequests } = useConfirmationRequestsByEvent(selectedEvent || undefined);
  const { data: sessions } = useConfirmationSessions(selectedEvent || undefined);
  const createMember = useCreateTeamMember();
  const createSession = useCreateConfirmationSession();
  const updateStatus = useUpdateConfirmationStatus();

  const selectedEventData = events?.find((e) => e.id === selectedEvent);
  const { data: existingConfirmations } = useExistingConfirmations(selectedEventData?.date);

  const activeEvents = events?.filter((e) => ["confirmed", "appointment", "in_progress", "prospect", "quote_sent"].includes(e.status)) || [];

  // Realtime subscription for confirmation_requests
  useEffect(() => {
    if (!selectedEvent) return;
    const channel = supabase
      .channel("confirmation_requests_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "confirmation_requests" }, () => {
        refetchRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedEvent, refetchRequests]);

  // Sort members by reliability
  const sortedMembers = useMemo(() => {
    if (!members) return [];
    return [...members].sort((a, b) => {
      const ra = reliability?.[a.id];
      const rb = reliability?.[b.id];
      const scoreA = ra && ra.total > 0 ? ra.confirmed / ra.total : 0.5;
      const scoreB = rb && rb.total > 0 ? rb.confirmed / rb.total : 0.5;
      return scoreB - scoreA;
    });
  }, [members, reliability]);

  // Conflict detection
  const getConflict = (memberId: string) => {
    if (!existingConfirmations || !selectedEvent) return null;
    const conflict = existingConfirmations.find(
      (c) => c.team_member_id === memberId && c.event_id !== selectedEvent
    );
    return conflict;
  };

  const getReliabilityInfo = (memberId: string) => {
    const r = reliability?.[memberId];
    if (!r || r.total === 0) return { score: null, color: "text-muted-foreground", label: "Nouveau" };
    const score = Math.round((r.confirmed / r.total) * 100);
    if (score >= 70) return { score, color: "text-[hsl(var(--status-confirmed))]", label: `${score}% fiable` };
    if (score >= 40) return { score, color: "text-[hsl(var(--status-quote-sent))]", label: `${score}% fiable` };
    return { score, color: "text-destructive", label: `${score}% fiable` };
  };

  const handleAddMember = () => {
    if (!newMember.name) return;
    createMember.mutate({
      name: newMember.name, phone: newMember.phone || null, role: newMember.role || null,
      hourly_rate: newMember.hourly_rate, skills: newMember.skills ? newMember.skills.split(",").map((s) => s.trim()) : [],
    }, { onSuccess: () => { setShowAddModal(false); setNewMember({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" }); } });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const handleGenerateWhatsApp = async () => {
    if (!selectedEvent || selectedMembers.length === 0) return;
    const session = await createSession.mutateAsync({ event_id: selectedEvent, team_member_ids: selectedMembers });
    setGeneratedSession(session);
    setShowWhatsAppModal(true);
  };

  const appUrl = window.location.origin;
  const confirmLink = generatedSession ? `${appUrl}/confirm/${generatedSession.id}` : "";
  const whatsappMessage = selectedEventData && generatedSession
    ? `Bonjour l'équipe 👋\n\nCaterPilot recherche du personnel pour :\n📅 ${new Date(selectedEventData.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}\n📍 ${selectedEventData.venue || "Lieu à confirmer"}\n🍽️ ${selectedEventData.name}\n\nConfirmez votre disponibilité ici (2 secondes) :\n👉 ${confirmLink}\n\nMerci !`
    : "";

  const copyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    toast.success("Message copié !");
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
  };

  // Tracking stats
  const confirmed = confirmationRequests?.filter((r) => r.status === "confirmed") || [];
  const declined = confirmationRequests?.filter((r) => r.status === "declined") || [];
  const pending = confirmationRequests?.filter((r) => r.status === "pending") || [];
  const unidentified = confirmationRequests?.filter((r) => !r.team_member_id && r.status !== "pending") || [];

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Annonces</h1>
          <p className="text-muted-foreground text-sm">Sélectionnez un événement et des employés, puis générez un message WhatsApp avec lien de confirmation. Suivez les réponses en temps réel.</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Ajouter un employé
        </Button>
      </div>

      {/* Event selector */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-sm font-medium shrink-0">Événement :</Label>
            <select
              className="w-full sm:w-80 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm"
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setSelectedMembers([]); }}
            >
              <option value="">— Choisir un événement —</option>
              {activeEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({new Date(ev.date).toLocaleDateString("fr-FR")})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout when event selected */}
      <div className={cn("grid gap-6", selectedEvent ? "lg:grid-cols-5" : "")}>
        {/* Left: Team members */}
        <div className={cn("space-y-4", selectedEvent ? "lg:col-span-3" : "")}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedEvent ? "Équipe suggérée" : "Tous les employés"}
            <Badge variant="secondary" className="text-xs">{members?.length || 0}</Badge>
          </h2>

          {(!members || members.length === 0) ? (
            <Card className="p-8 text-center rounded-2xl">
              <p className="text-muted-foreground">Aucun employé. Ajoutez votre premier collaborateur !</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {sortedMembers.map((member, i) => {
                const rel = getReliabilityInfo(member.id);
                const conflict = getConflict(member.id);
                const isSelected = selectedMembers.includes(member.id);
                const hasConflict = !!conflict;

                return (
                  <Card
                    key={member.id}
                    className={cn(
                      "transition-all animate-fade-in rounded-2xl cursor-pointer",
                      isSelected && "ring-2 ring-primary/60 bg-primary/5",
                      hasConflict && "opacity-60"
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => !hasConflict && selectedEvent && toggleMember(member.id)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {selectedEvent && (
                            <Checkbox
                              checked={isSelected}
                              disabled={hasConflict}
                              onCheckedChange={() => !hasConflict && toggleMember(member.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            {member.role && <Badge variant="secondary" className="text-xs mt-0.5">{member.role}</Badge>}
                          </div>
                        </div>
                        <span className={cn("text-xs font-medium", rel.color)}>{rel.label}</span>
                      </div>

                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {member.phone || "—"}
                        </span>
                        <span className="font-medium">{member.hourly_rate} €/h</span>
                      </div>

                      {hasConflict && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Conflit — déjà confirmé pour "{conflict.event_name}"</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Roles & actions */}
        {selectedEvent && (
          <div className="lg:col-span-2 space-y-4">
            {/* Selection summary */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sélection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedMembers.length} employé{selectedMembers.length > 1 ? "s" : ""} sélectionné{selectedMembers.length > 1 ? "s" : ""}
                </p>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedMembers.map((id) => {
                      const m = members?.find((m) => m.id === id);
                      return m ? (
                        <Badge key={id} className="gap-1 text-xs">
                          {m.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => toggleMember(id)} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                <Button
                  variant="accent"
                  className="w-full gap-2"
                  onClick={handleGenerateWhatsApp}
                  disabled={selectedMembers.length === 0 || createSession.isPending}
                >
                  <MessageSquare className="h-4 w-4" />
                  {createSession.isPending ? "Génération..." : "Générer le message WhatsApp"}
                </Button>
              </CardContent>
            </Card>

            {/* Tracking */}
            {confirmationRequests && confirmationRequests.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Suivi des confirmations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>✅ {confirmed.length} confirmé{confirmed.length > 1 ? "s" : ""}</span>
                      <span>⏳ {pending.length} en attente</span>
                      <span>❌ {declined.length} décliné{declined.length > 1 ? "s" : ""}</span>
                    </div>
                    <Progress value={confirmationRequests.length > 0 ? ((confirmed.length + declined.length) / confirmationRequests.length) * 100 : 0} />
                  </div>

                  {confirmed.length === confirmationRequests.filter(r => r.team_member_id).length && confirmed.length > 0 && (
                    <div className="bg-[hsl(var(--status-confirmed))]/10 text-[hsl(var(--status-confirmed))] rounded-lg px-3 py-2 text-sm font-medium text-center">
                      🎉 Équipe complète !
                    </div>
                  )}

                  {/* Individual statuses */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {confirmationRequests.map((req) => {
                      const name = (req.team_members as any)?.name || `${req.respondent_firstname || ""} ${req.respondent_lastname || ""}`.trim() || "Inconnu";
                      const role = (req.team_members as any)?.role;
                      return (
                        <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            {!req.team_member_id && <User className="h-3.5 w-3.5 text-[hsl(var(--status-quote-sent))]" />}
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              {role && <p className="text-xs text-muted-foreground">{role}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {req.status === "pending" && (
                              <>
                                <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" /> En attente</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateStatus.mutate({ id: req.id, status: "confirmed" })}>
                                  <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--status-confirmed))]" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateStatus.mutate({ id: req.id, status: "declined" })}>
                                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </>
                            )}
                            {req.status === "confirmed" && (
                              <Badge className="text-xs gap-1 bg-[hsl(var(--status-confirmed))] text-white"><CheckCircle className="h-3 w-3" /> Confirmé</Badge>
                            )}
                            {req.status === "declined" && (
                              <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" /> Décliné</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Relance section */}
                  {pending.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> À relancer ({pending.length})
                      </p>
                      {pending.map((req) => {
                        const name = (req.team_members as any)?.name || "Inconnu";
                        const hoursAgo = Math.round((Date.now() - new Date(req.created_at).getTime()) / 3600000);
                        const latestSession = sessions?.[0];
                        const relanceMsg = `Bonjour ${name.split(" ")[0]} 👋 Tu as reçu notre message pour ${selectedEventData?.name} ? N'oublie pas de confirmer ta dispo ici : ${appUrl}/confirm/${latestSession?.id}`;

                        return (
                          <div key={req.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{name} · {hoursAgo}h</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => { navigator.clipboard.writeText(relanceMsg); toast.success("Message de relance copié !"); }}
                            >
                              <Copy className="h-3 w-3" /> Relancer
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWhatsAppModal(false)}>
          <Card className="w-full max-w-lg animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Message WhatsApp</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowWhatsAppModal(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 text-sm whitespace-pre-wrap font-mono">
                {whatsappMessage}
              </div>
              <div className="flex gap-2">
                <Button variant="accent" className="flex-1 gap-2" onClick={copyMessage}>
                  <Copy className="h-4 w-4" /> Copier le message
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={openWhatsApp}>
                  <ExternalLink className="h-4 w-4" /> Ouvrir WhatsApp
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Lien de confirmation valide 7 jours : <span className="font-mono text-primary break-all">{confirmLink}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-md animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nouvel employé</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Prénom + Nom *</Label><Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Jean Dupont" className="mt-1" /></div>
              <div><Label>Téléphone</Label><Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="06 XX XX XX XX" className="mt-1" /></div>
              <div>
                <Label>Rôle principal</Label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm mt-1" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><Label>Taux horaire (€)</Label><Input type="number" value={newMember.hourly_rate} onChange={(e) => setNewMember({ ...newMember, hourly_rate: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Compétences (virgules)</Label><Input value={newMember.skills} onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })} placeholder="service, cuisine, bar…" className="mt-1" /></div>
              <Button variant="accent" className="w-full" onClick={handleAddMember} disabled={createMember.isPending}>{createMember.isPending ? "Ajout..." : "Ajouter"}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Team;
