import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamMembers, useEvents, useCreateTeamMember, useQuotes } from "@/hooks/useSupabase";
import {
  useRhSettings, useEventStaffExtended, useAddEventStaff,
  useUpdateEventStaffStatus, useTeamStats, calculateStaffNeeds, useMarkStaffSent,
} from "@/hooks/useHrModule";
import EventHeader from "@/components/hr/EventHeader";
import HrGauges from "@/components/hr/HrGauges";
import CandidateList from "@/components/hr/CandidateList";
import ConfirmedTeam from "@/components/hr/ConfirmedTeam";
import WhatsAppEditorModal from "@/components/hr/WhatsAppEditorModal";
import FollowUpPanel from "@/components/hr/FollowUpPanel";
import ReplacementSuggestions from "@/components/hr/ReplacementSuggestions";
import { toast } from "sonner";

const ROLES_MAP = [
  { key: "serveurs", label: "Serveurs", icon: "🍽", matchRoles: ["serveur", "serveuse"] },
  { key: "chefs", label: "Chefs", icon: "👨‍🍳", matchRoles: ["chef", "cuisinier"] },
  { key: "barmans", label: "Barmans", icon: "🍸", matchRoles: ["barman", "barmaid"] },
  { key: "maitre_hotel", label: "Maître d'hôtel", icon: "🎩", matchRoles: ["maître d'hôtel", "maitre", "maître"] },
];

const ROLE_OPTIONS = ["Serveur", "Serveuse", "Chef", "Cuisinier", "Barman", "Maître d'hôtel", "Décorateur", "Autre"];

const Announcements = () => {
  const [searchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get("event") || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ member: any; role: string } | null>(null);
  const [newMember, setNewMember] = useState({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" });

  const { data: members, isLoading } = useTeamMembers();
  const { data: events } = useEvents();
  const { data: quotes } = useQuotes();
  const { data: rhSettings } = useRhSettings();
  const { data: eventStaff } = useEventStaffExtended(selectedEvent || undefined);
  const { data: teamStats } = useTeamStats();
  const addStaff = useAddEventStaff();
  const updateStatus = useUpdateEventStaffStatus();
  const markSent = useMarkStaffSent();
  const createMember = useCreateTeamMember();

  const selectedEventData = events?.find((e) => e.id === selectedEvent);
  const eventQuote = quotes?.find((q: any) => q.event_id === selectedEvent);

  // Calculate staff needs
  const staffNeeds = useMemo(() => {
    if (!selectedEventData || !rhSettings) return { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    return calculateStaffNeeds(
      selectedEventData.guest_count || 0,
      selectedEventData.type,
      rhSettings,
      eventQuote as any
    );
  }, [selectedEventData, rhSettings, eventQuote]);

  // Group staff by role
  const staffByRole = useMemo(() => {
    const grouped: Record<string, any[]> = { serveurs: [], chefs: [], barmans: [], maitre_hotel: [] };
    eventStaff?.forEach((s: any) => {
      const role = (s.role_assigned || s.team_members?.role || "").toLowerCase();
      for (const rm of ROLES_MAP) {
        if (rm.matchRoles.some((r) => role.includes(r))) {
          grouped[rm.key].push(s);
          return;
        }
      }
      // Default to serveurs
      grouped.serveurs.push(s);
    });
    return grouped;
  }, [eventStaff]);

  // Count confirmed per role
  const confirmedCounts = useMemo(() => {
    const counts: Record<string, number> = { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    Object.entries(staffByRole).forEach(([key, staff]) => {
      counts[key] = staff.filter((s: any) => s.confirmation_status === "confirmed").length;
    });
    return counts;
  }, [staffByRole]);

  // Members grouped by role for candidate list
  const membersByRole = useMemo(() => {
    if (!members) return {};
    const grouped: Record<string, any[]> = { serveurs: [], chefs: [], barmans: [], maitre_hotel: [] };
    members.forEach((m: any) => {
      const role = (m.role || "").toLowerCase();
      for (const rm of ROLES_MAP) {
        if (rm.matchRoles.some((r) => role.includes(r))) {
          grouped[rm.key].push(m);
          return;
        }
      }
    });
    return grouped;
  }, [members]);

  // Build categories for CandidateList
  const categories = ROLES_MAP.map((rm) => ({
    key: rm.key,
    label: rm.label,
    icon: rm.icon,
    members: membersByRole[rm.key] || [],
    staffEntries: staffByRole[rm.key] || [],
    needed: staffNeeds[rm.key as keyof typeof staffNeeds],
    confirmed: confirmedCounts[rm.key],
  }));

  // Confirmed team data
  const confirmedTeamCategories = ROLES_MAP.map((rm) => ({
    key: rm.key,
    label: rm.label,
    icon: rm.icon,
    needed: staffNeeds[rm.key as keyof typeof staffNeeds],
    confirmedMembers: (staffByRole[rm.key] || [])
      .filter((s: any) => s.confirmation_status === "confirmed")
      .map((s: any) => ({ id: s.team_member_id, name: s.team_members?.name || "Inconnu" })),
  }));
  const totalConfirmed = Object.values(confirmedCounts).reduce((a, b) => a + b, 0);
  const totalNeeded = Object.values(staffNeeds).reduce((a, b) => a + b, 0);

  // Pending staff for follow-ups
  const pendingStaff = eventStaff?.filter((s: any) => s.confirmation_status === "pending" && s.sent_at) || [];

  // Refused or expired staff for replacements
  const refusedStaff = eventStaff?.filter((s: any) =>
    s.confirmation_status === "refused" || s.confirmation_status === "declined"
  ) || [];
  const assignedIds = eventStaff?.map((s: any) => s.team_member_id) || [];

  const activeEvents = events?.filter((e) =>
    ["confirmed", "appointment", "in_progress", "prospect", "quote_sent"].includes(e.status)
  ) || [];

  const handleAddStaff = (memberId: string, role: string) => {
    if (!selectedEvent) return;
    const roleLabel = ROLES_MAP.find((r) => r.key === role)?.matchRoles[0] || role;
    addStaff.mutate({ event_id: selectedEvent, team_member_id: memberId, role_assigned: roleLabel });
  };

  const handleConfirm = (staffId: string) => {
    updateStatus.mutate({ id: staffId, status: "confirmed" });
  };

  const handleRefuse = (staffId: string) => {
    updateStatus.mutate({ id: staffId, status: "refused" });
  };

  const handleWhatsApp = (member: any, role: string) => {
    setWhatsAppTarget({ member, role });
    // Also mark as sent
    const staffEntry = eventStaff?.find((s: any) => s.team_member_id === member.id);
    if (staffEntry && !staffEntry.sent_at) {
      markSent.mutate(staffEntry.id);
    }
  };

  const handleAddMember = () => {
    if (!newMember.name) return;
    createMember.mutate({
      name: newMember.name, phone: newMember.phone || null, role: newMember.role || null,
      hourly_rate: newMember.hourly_rate, skills: newMember.skills ? newMember.skills.split(",").map((s) => s.trim()) : [],
    }, { onSuccess: () => { setShowAddModal(false); setNewMember({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" }); } });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="min-h-screen bg-[#0F1117] -m-4 lg:-m-8 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "Syne, sans-serif" }}>
              Centre RH
            </h1>
            <p className="text-slate-400 text-sm">Pilotez vos équipes événementielles en temps réel.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Ajouter un employé
          </Button>
        </div>

        {/* Event selector */}
        <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-sm font-medium text-slate-300 shrink-0">Événement :</Label>
            <select
              className="w-full sm:w-96 h-10 px-3 rounded-lg border border-[#2D3148] bg-[#0F1117] text-slate-200 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">— Choisir un événement —</option>
              {activeEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({new Date(ev.date).toLocaleDateString("fr-FR")}) — {ev.guest_count || 0} convives
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEventData && (
          <>
            {/* Event Header */}
            <EventHeader event={selectedEventData} quote={eventQuote} />

            {/* HR Gauges */}
            <HrGauges needs={staffNeeds} confirmed={confirmedCounts as any} />

            {/* Main content: Candidates + Confirmed Team */}
            <div className="grid lg:grid-cols-4 gap-5">
              {/* Candidates */}
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  <Users className="h-5 w-5 text-emerald-400" /> Candidats par poste
                </h2>
                <CandidateList
                  categories={categories}
                  stats={teamStats || {}}
                  onConfirm={handleConfirm}
                  onRefuse={handleRefuse}
                  onWhatsApp={(member, role) => handleWhatsApp(member, role)}
                  onAdd={handleAddStaff}
                />

                {/* Replacement Suggestions */}
                <ReplacementSuggestions
                  refusedOrExpired={refusedStaff}
                  allMembers={members || []}
                  assignedIds={assignedIds}
                  stats={teamStats || {}}
                  onAdd={handleAddStaff}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <ConfirmedTeam
                  categories={confirmedTeamCategories}
                  totalConfirmed={totalConfirmed}
                  totalNeeded={totalNeeded}
                />
                <FollowUpPanel
                  pendingStaff={pendingStaff}
                  event={selectedEventData}
                  onWhatsApp={(member) => handleWhatsApp(member, "")}
                />
              </div>
            </div>
          </>
        )}

        {!selectedEvent && members && members.length > 0 && (
          <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-8 text-center">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Sélectionnez un événement pour gérer les affectations RH.</p>
            <p className="text-slate-500 text-xs mt-1">{members.length} employé{members.length > 1 ? "s" : ""} dans votre équipe</p>
          </div>
        )}
      </div>

      {/* WhatsApp Editor Modal */}
      <WhatsAppEditorModal
        open={!!whatsAppTarget}
        onClose={() => setWhatsAppTarget(null)}
        member={whatsAppTarget?.member}
        event={selectedEventData}
        role={whatsAppTarget?.role || ""}
      />

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-[#1A1D27] border border-[#2D3148] rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#2D3148]">
              <h3 className="font-semibold text-slate-100">Nouvel employé</h3>
              <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Prénom + Nom *</Label>
                <Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Jean Dupont" className="mt-1 bg-[#0F1117] border-[#2D3148] text-slate-200" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Téléphone</Label>
                <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="06 XX XX XX XX" className="mt-1 bg-[#0F1117] border-[#2D3148] text-slate-200" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Rôle</Label>
                <select className="w-full h-10 px-3 rounded-lg border border-[#2D3148] bg-[#0F1117] text-slate-200 text-sm mt-1" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Taux horaire (€)</Label>
                <Input type="number" value={newMember.hourly_rate} onChange={(e) => setNewMember({ ...newMember, hourly_rate: Number(e.target.value) })} className="mt-1 bg-[#0F1117] border-[#2D3148] text-slate-200" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Compétences (virgules)</Label>
                <Input value={newMember.skills} onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })} placeholder="service, cuisine, bar…" className="mt-1 bg-[#0F1117] border-[#2D3148] text-slate-200" />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddMember} disabled={createMember.isPending}>
                {createMember.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
