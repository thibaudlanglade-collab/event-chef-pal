import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, X, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamMembers, useEvents, useCreateTeamMember, useQuotes } from "@/hooks/useSupabase";
import {
  useRhSettings, useEventStaffExtended, useAddEventStaff,
  useUpdateEventStaffStatus, useTeamStats, calculateStaffNeeds, useMarkStaffSent,
} from "@/hooks/useHrModule";
import { useAnnouncements, useFormResponses } from "@/hooks/useAnnouncements";
import EventHeader from "@/components/hr/EventHeader";
import HrGauges from "@/components/hr/HrGauges";
import CandidateList from "@/components/hr/CandidateList";
import ConfirmedTeam from "@/components/hr/ConfirmedTeam";
import WhatsAppEditorModal from "@/components/hr/WhatsAppEditorModal";
import FollowUpPanel from "@/components/hr/FollowUpPanel";
import ReplacementSuggestions from "@/components/hr/ReplacementSuggestions";
import MonthGrid from "@/components/hr/MonthGrid";
import MonthEventList from "@/components/hr/MonthEventList";
import AnnouncementManager from "@/components/hr/AnnouncementManager";
import { toast } from "sonner";

type ViewMode = "months" | "month-detail" | "announcement" | "staffing-advanced";

const ROLES_MAP = [
  { key: "serveurs", label: "Serveurs", icon: "🍽", matchRoles: ["serveur", "serveuse"] },
  { key: "chefs", label: "Chefs", icon: "👨‍🍳", matchRoles: ["chef", "cuisinier"] },
  { key: "barmans", label: "Barmans", icon: "🍸", matchRoles: ["barman", "barmaid"] },
  { key: "maitre_hotel", label: "Maître d'hôtel", icon: "🎩", matchRoles: ["maître d'hôtel", "maitre", "maître"] },
];

const ROLE_OPTIONS = ["Serveur", "Serveuse", "Chef", "Cuisinier", "Barman", "Maître d'hôtel", "Décorateur", "Autre"];

const Announcements = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("months");
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get("event") || "");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ member: any; role: string } | null>(null);
  const [newMember, setNewMember] = useState({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" });

  const { data: members, isLoading } = useTeamMembers();
  const { data: events } = useEvents();
  const { data: quotes } = useQuotes();
  const { data: rhSettings } = useRhSettings();
  const { data: eventStaff } = useEventStaffExtended(selectedEvent || undefined);
  const { data: teamStats } = useTeamStats();
  const { data: announcements } = useAnnouncements();
  const addStaff = useAddEventStaff();
  const updateStatus = useUpdateEventStaffStatus();
  const markSent = useMarkStaffSent();
  const createMember = useCreateTeamMember();

  const selectedEventData = events?.find((e) => e.id === selectedEvent);
  const eventQuote = quotes?.find((q: any) => q.event_id === selectedEvent);

  // Build form responses map
  const formResponsesByAnnouncement = useMemo(() => {
    // We'll load these per-announcement in the manager, but for the list we provide empty
    return {} as Record<string, any[]>;
  }, []);

  // Calculate staff needs
  const staffNeeds = useMemo(() => {
    if (!selectedEventData || !rhSettings) return { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    return calculateStaffNeeds(selectedEventData.guest_count || 0, selectedEventData.type, rhSettings, eventQuote as any);
  }, [selectedEventData, rhSettings, eventQuote]);

  // Group staff by role
  const staffByRole = useMemo(() => {
    const grouped: Record<string, any[]> = { serveurs: [], chefs: [], barmans: [], maitre_hotel: [] };
    eventStaff?.forEach((s: any) => {
      const role = (s.role_assigned || s.team_members?.role || "").toLowerCase();
      for (const rm of ROLES_MAP) {
        if (rm.matchRoles.some((r) => role.includes(r))) { grouped[rm.key].push(s); return; }
      }
      grouped.serveurs.push(s);
    });
    return grouped;
  }, [eventStaff]);

  const confirmedCounts = useMemo(() => {
    const counts: Record<string, number> = { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    Object.entries(staffByRole).forEach(([key, staff]) => {
      counts[key] = staff.filter((s: any) => s.confirmation_status === "confirmed").length;
    });
    return counts;
  }, [staffByRole]);

  const membersByRole = useMemo(() => {
    if (!members) return {};
    const grouped: Record<string, any[]> = { serveurs: [], chefs: [], barmans: [], maitre_hotel: [] };
    members.forEach((m: any) => {
      const role = (m.role || "").toLowerCase();
      for (const rm of ROLES_MAP) {
        if (rm.matchRoles.some((r) => role.includes(r))) { grouped[rm.key].push(m); return; }
      }
    });
    return grouped;
  }, [members]);

  const categories = ROLES_MAP.map((rm) => ({
    key: rm.key, label: rm.label, icon: rm.icon,
    members: membersByRole[rm.key] || [], staffEntries: staffByRole[rm.key] || [],
    needed: staffNeeds[rm.key as keyof typeof staffNeeds], confirmed: confirmedCounts[rm.key],
  }));

  const confirmedTeamCategories = ROLES_MAP.map((rm) => ({
    key: rm.key, label: rm.label, icon: rm.icon,
    needed: staffNeeds[rm.key as keyof typeof staffNeeds],
    confirmedMembers: (staffByRole[rm.key] || [])
      .filter((s: any) => s.confirmation_status === "confirmed")
      .map((s: any) => ({ id: s.team_member_id, name: s.team_members?.name || "Inconnu" })),
  }));
  const totalConfirmed = Object.values(confirmedCounts).reduce((a, b) => a + b, 0);
  const totalNeeded = Object.values(staffNeeds).reduce((a, b) => a + b, 0);
  const pendingStaff = eventStaff?.filter((s: any) => s.confirmation_status === "pending" && s.sent_at) || [];
  const refusedStaff = eventStaff?.filter((s: any) => s.confirmation_status === "refused" || s.confirmation_status === "declined") || [];
  const assignedIds = eventStaff?.map((s: any) => s.team_member_id) || [];

  const handleAddStaff = (memberId: string, role: string) => {
    if (!selectedEvent) return;
    const roleLabel = ROLES_MAP.find((r) => r.key === role)?.matchRoles[0] || role;
    addStaff.mutate({ event_id: selectedEvent, team_member_id: memberId, role_assigned: roleLabel });
  };

  const handleConfirm = (staffId: string) => updateStatus.mutate({ id: staffId, status: "confirmed" });
  const handleRefuse = (staffId: string) => updateStatus.mutate({ id: staffId, status: "refused" });

  const handleWhatsApp = (member: any, role: string) => {
    setWhatsAppTarget({ member, role });
    const staffEntry = eventStaff?.find((s: any) => s.team_member_id === member.id);
    if (staffEntry && !staffEntry.sent_at) markSent.mutate(staffEntry.id);
  };

  const handleAddMember = () => {
    if (!newMember.name) return;
    createMember.mutate({
      name: newMember.name, phone: newMember.phone || null, role: newMember.role || null,
      hourly_rate: newMember.hourly_rate, skills: newMember.skills ? newMember.skills.split(",").map((s) => s.trim()) : [],
    }, { onSuccess: () => { setShowAddModal(false); setNewMember({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" }); } });
  };

  const previewUrl = window.location.origin;

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  // ═══════════════════════════════════════════════════
  // VIEW: MONTHS — 12-month grid
  // ═══════════════════════════════════════════════════
  if (viewMode === "months") {
    return (
      <div className="space-y-6">
        <MonthGrid
          events={events || []}
          year={selectedYear}
          onSelectMonth={(m) => { setSelectedMonth(m); setViewMode("month-detail"); }}
          onChangeYear={setSelectedYear}
        />
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: MONTH-DETAIL — Events in selected month
  // ═══════════════════════════════════════════════════
  if (viewMode === "month-detail" && selectedMonth !== null) {
    return (
      <div className="space-y-6">
        <MonthEventList
          events={events || []}
          month={selectedMonth}
          year={selectedYear}
          announcements={announcements || []}
          formResponsesByAnnouncement={formResponsesByAnnouncement}
          onBack={() => setViewMode("months")}
          onSelectEvent={(eventId) => { setSelectedEvent(eventId); setViewMode("announcement"); }}
        />
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: ANNOUNCEMENT — Creation/tracking per event
  // ═══════════════════════════════════════════════════
  if (viewMode === "announcement" && selectedEventData) {
    return (
      <div>
        <AnnouncementManager
          event={selectedEventData}
          quote={eventQuote}
          onBack={() => setViewMode("month-detail")}
          onOpenAdvanced={() => setViewMode("staffing-advanced")}
          previewUrl={previewUrl}
        />
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // VIEW: STAFFING-ADVANCED — Existing staffing board (UNTOUCHED)
  // ═══════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0F1117] -m-4 lg:-m-8 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "Syne, sans-serif" }}>
              Centre RH
            </h1>
            <p className="text-slate-400 text-sm">Pilotez vos équipes événementielles en temps réel.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-[#2D3148] text-slate-300 hover:bg-[#22263A]" onClick={() => setViewMode("announcement")}>
              ← Retour à l'annonce
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Ajouter un employé
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-sm font-medium text-slate-300 shrink-0">Événement :</Label>
            <select
              className="w-full sm:w-96 h-10 px-3 rounded-lg border border-[#2D3148] bg-[#0F1117] text-slate-200 text-sm focus:ring-1 focus:ring-emerald-500/50 outline-none"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">— Choisir un événement —</option>
              {(events || []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({new Date(ev.date).toLocaleDateString("fr-FR")}) — {ev.guest_count || 0} convives
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEventData && (
          <>
            <EventHeader event={selectedEventData} quote={eventQuote} />
            <HrGauges needs={staffNeeds} confirmed={confirmedCounts as any} />
            <div className="grid lg:grid-cols-4 gap-5">
              <div className="lg:col-span-3 space-y-4">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  <Users className="h-5 w-5 text-emerald-400" /> Candidats par poste
                </h2>
                <CandidateList categories={categories} stats={teamStats || {}} onConfirm={handleConfirm} onRefuse={handleRefuse} onWhatsApp={(member, role) => handleWhatsApp(member, role)} onAdd={handleAddStaff} />
                <ReplacementSuggestions refusedOrExpired={refusedStaff} allMembers={members || []} assignedIds={assignedIds} stats={teamStats || {}} onAdd={handleAddStaff} />
              </div>
              <div className="space-y-4">
                <ConfirmedTeam categories={confirmedTeamCategories} totalConfirmed={totalConfirmed} totalNeeded={totalNeeded} />
                <FollowUpPanel pendingStaff={pendingStaff} event={selectedEventData} onWhatsApp={(member) => handleWhatsApp(member, "")} />
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

      <WhatsAppEditorModal open={!!whatsAppTarget} onClose={() => setWhatsAppTarget(null)} member={whatsAppTarget?.member} event={selectedEventData} role={whatsAppTarget?.role || ""} />
      {showAddModal && renderAddModal()}
    </div>
  );

  function renderAddModal() {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Nouvel employé</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label className="text-sm">Prénom + Nom *</Label>
                <Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Jean Dupont" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Téléphone</Label>
                <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="06 XX XX XX XX" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Rôle</Label>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm mt-1" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Taux horaire (€)</Label>
                <Input type="number" value={newMember.hourly_rate} onChange={(e) => setNewMember({ ...newMember, hourly_rate: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Compétences (virgules)</Label>
                <Input value={newMember.skills} onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })} placeholder="service, cuisine, bar…" className="mt-1" />
              </div>
              <Button className="w-full" onClick={handleAddMember} disabled={createMember.isPending}>
                {createMember.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default Announcements;
