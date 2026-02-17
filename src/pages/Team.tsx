import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Phone, UserCheck, MessageSquare, Download, X,
} from "lucide-react";
import { mockTeamMembers, mockEvents } from "@/data/mockData";
import { cn } from "@/lib/utils";

const Team = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");

  const event = mockEvents.find((e) => e.id === selectedEvent);
  const activeEvents = mockEvents.filter((e) =>
    ["confirmed", "appointment", "in_progress"].includes(e.status)
  );

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="text-muted-foreground text-sm">Gérez vos collaborateurs et affectez-les aux événements</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Ajouter un membre
        </Button>
      </div>

      {/* Event staffing selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-sm font-medium shrink-0">Affecter à un événement :</Label>
            <select
              className="w-full sm:w-72 h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">— Choisir un événement —</option>
              {activeEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({new Date(ev.date).toLocaleDateString("fr-FR")})
                </option>
              ))}
            </select>
            {event && (
              <span className="text-sm text-muted-foreground">
                {event.guestCount} convives · {event.assignedTeam.length} affecté(s)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team members grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTeamMembers.map((member, i) => {
          const isAssigned = event?.assignedTeam.includes(member.id);
          return (
            <Card
              key={member.id}
              className={cn(
                "transition-all animate-fade-in",
                isAssigned && "ring-2 ring-accent/50"
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5",
                    member.available ? "bg-status-confirmed" : "bg-status-cancelled"
                  )} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {member.phone}
                  </span>
                  <span className="font-medium">{member.hourlyRate} €/h</span>
                </div>

                {member.notes && (
                  <p className="text-xs text-muted-foreground bg-secondary rounded px-2 py-1">
                    {member.notes}
                  </p>
                )}

                {selectedEvent && (
                  <div className="flex gap-2 pt-1 border-t">
                    <Button
                      variant={isAssigned ? "accent" : "outline"}
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {isAssigned ? "Affecté" : "Affecter"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export button */}
      {selectedEvent && (
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exporter Excel
          </Button>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Envoyer invitations WhatsApp
          </Button>
        </div>
      )}

      {/* Add member modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nouveau membre</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom</Label><Input placeholder="Prénom Nom" className="mt-1" /></div>
              <div><Label>Téléphone (WhatsApp)</Label><Input placeholder="06 XX XX XX XX" className="mt-1" /></div>
              <div><Label>Rôle</Label><Input placeholder="Serveur, Chef, etc." className="mt-1" /></div>
              <div><Label>Taux horaire (€)</Label><Input type="number" placeholder="18" className="mt-1" /></div>
              <div><Label>Compétences</Label><Input placeholder="service, cuisine, bar…" className="mt-1" /></div>
              <Button variant="accent" className="w-full">Ajouter</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Team;
