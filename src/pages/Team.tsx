import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Phone, UserCheck, MessageSquare, Download, X } from "lucide-react";
import { useTeamMembers, useEvents, useCreateTeamMember, useEventStaff, useAssignStaff, useWebhookConfigs } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Team = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [newMember, setNewMember] = useState({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" });

  const { data: members, isLoading } = useTeamMembers();
  const { data: events } = useEvents();
  const { data: eventStaff } = useEventStaff(selectedEvent || undefined);
  const { data: webhooks } = useWebhookConfigs();
  const createMember = useCreateTeamMember();
  const assignStaff = useAssignStaff();

  const activeEvents = events?.filter((e) => ["confirmed", "appointment", "in_progress"].includes(e.status)) || [];
  const assignedIds = eventStaff?.map((s) => s.team_member_id) || [];
  const whatsappWebhook = webhooks?.find((w) => w.feature_name === "whatsapp_team");

  const handleAddMember = () => {
    if (!newMember.name) return;
    createMember.mutate({
      name: newMember.name, phone: newMember.phone || null, role: newMember.role || null,
      hourly_rate: newMember.hourly_rate, skills: newMember.skills ? newMember.skills.split(",").map((s) => s.trim()) : [],
    }, { onSuccess: () => { setShowAddModal(false); setNewMember({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" }); } });
  };

  const handleAssign = (memberId: string) => {
    if (!selectedEvent) return;
    const member = members?.find((m) => m.id === memberId);
    assignStaff.mutate({ event_id: selectedEvent, team_member_id: memberId, role_assigned: member?.role || null });
  };

  const handleWhatsApp = async () => {
    if (!whatsappWebhook?.webhook_url) {
      toast.error("Configurez le webhook WhatsApp dans les Paramètres d'abord.");
      return;
    }
    const event = events?.find((e) => e.id === selectedEvent);
    const staff = eventStaff?.map((s) => ({ name: s.team_members?.name, phone: s.team_members?.phone, role: s.role_assigned }));
    try {
      await fetch(whatsappWebhook.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: selectedEvent, event_name: event?.name, event_date: event?.date, event_venue: event?.venue, staff }),
      });
      toast.success("✅ Invitations envoyées via WhatsApp");
    } catch { toast.error("Erreur lors de l'envoi WhatsApp"); }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Équipe</h1><p className="text-muted-foreground text-sm">Gérez vos collaborateurs et affectez-les aux événements</p></div>
        <Button variant="accent" className="gap-2" onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4" /> Ajouter un membre</Button>
      </div>

      <Card className="rounded-2xl"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Label className="text-sm font-medium shrink-0">Affecter à un événement :</Label>
          <select className="w-full sm:w-72 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">— Choisir un événement —</option>
            {activeEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.date).toLocaleDateString("fr-FR")})</option>)}
          </select>
        </div>
      </CardContent></Card>

      {(!members || members.length === 0) ? (
        <Card className="p-8 text-center rounded-2xl"><p className="text-muted-foreground">Aucun membre d'équipe. Ajoutez votre premier collaborateur !</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => {
            const isAssigned = assignedIds.includes(member.id);
            return (
              <Card key={member.id} className={cn("transition-all animate-fade-in rounded-2xl", isAssigned && "ring-2 ring-primary/40")} style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between"><div><h3 className="font-semibold">{member.name}</h3><p className="text-sm text-muted-foreground">{member.role}</p></div></div>
                  {member.skills && member.skills.length > 0 && <div className="flex flex-wrap gap-1">{member.skills.map((skill) => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}</div>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone || "—"}</span>
                    <span className="font-medium">{member.hourly_rate} €/h</span>
                  </div>
                  {selectedEvent && (
                    <div className="flex gap-2 pt-1 border-t">
                      <Button variant={isAssigned ? "accent" : "outline"} size="sm" className="flex-1 gap-1 text-xs" onClick={() => !isAssigned && handleAssign(member.id)} disabled={isAssigned}>
                        <UserCheck className="h-3.5 w-3.5" /> {isAssigned ? "Affecté" : "Affecter"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleWhatsApp} disabled={!whatsappWebhook?.is_active}>
            <MessageSquare className="h-4 w-4" /> Envoyer invitations WhatsApp
          </Button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-md animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Nouveau membre</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom *</Label><Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Prénom Nom" className="mt-1" /></div>
              <div><Label>Téléphone</Label><Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="06 XX XX XX XX" className="mt-1" /></div>
              <div><Label>Rôle</Label><Input value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} placeholder="Serveur, Chef…" className="mt-1" /></div>
              <div><Label>Taux horaire (€)</Label><Input type="number" value={newMember.hourly_rate} onChange={(e) => setNewMember({ ...newMember, hourly_rate: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Compétences (séparées par des virgules)</Label><Input value={newMember.skills} onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })} placeholder="service, cuisine…" className="mt-1" /></div>
              <Button variant="accent" className="w-full" onClick={handleAddMember} disabled={createMember.isPending}>{createMember.isPending ? "Ajout..." : "Ajouter"}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Team;
