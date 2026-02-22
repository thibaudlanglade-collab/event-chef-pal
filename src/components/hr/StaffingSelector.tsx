import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, CalendarDays, MapPin, Users, Check } from "lucide-react";
import { useTeamMembers } from "@/hooks/useSupabase";
import { useRhSettings, useTeamStats, calculateStaffNeeds, type StaffNeeds } from "@/hooks/useHrModule";

const ROLE_TABS = [
  { key: "all", label: "Tous" },
  { key: "serveur", label: "Serveurs", matchRoles: ["serveur", "serveuse"] },
  { key: "barman", label: "Bartenders", matchRoles: ["barman", "barmaid"] },
  { key: "chef", label: "Cuisine", matchRoles: ["chef", "cuisinier"] },
  { key: "maitre", label: "Maître d'hôtel", matchRoles: ["maître d'hôtel", "maitre", "maître"] },
];

const NEEDS_KEYS: Record<string, keyof StaffNeeds> = {
  serveur: "serveurs",
  barman: "barmans",
  chef: "chefs",
  maitre: "maitre_hotel",
};

interface StaffingSelectorProps {
  event: any;
  quote: any;
  onBack: () => void;
  onSendMessage: (selectedMembers: any[]) => void;
  onOpenAdvanced: () => void;
}

const StaffingSelector = ({ event, quote, onBack, onSendMessage, onOpenAdvanced }: StaffingSelectorProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: members } = useTeamMembers();
  const { data: rhSettings } = useRhSettings();
  const { data: teamStats } = useTeamStats();

  const staffNeeds = useMemo(() => {
    if (!event || !rhSettings) return { serveurs: 0, chefs: 0, barmans: 0, maitre_hotel: 0 };
    return calculateStaffNeeds(event.guest_count || 0, event.type, rhSettings, quote);
  }, [event, rhSettings, quote]);

  const getMemberRoleKey = (role: string): string => {
    const r = (role || "").toLowerCase();
    for (const tab of ROLE_TABS.slice(1)) {
      if (tab.matchRoles?.some((mr) => r.includes(mr))) return tab.key;
    }
    return "other";
  };

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (activeTab === "all") return members;
    const tab = ROLE_TABS.find((t) => t.key === activeTab);
    if (!tab?.matchRoles) return members;
    return members.filter((m: any) => {
      const role = (m.role || "").toLowerCase();
      return tab.matchRoles!.some((mr) => role.includes(mr));
    });
  }, [members, activeTab]);

  // Count selected per role
  const selectedCountByRole = useMemo(() => {
    const counts: Record<string, number> = { serveur: 0, barman: 0, chef: 0, maitre: 0 };
    members?.forEach((m: any) => {
      if (!selectedIds.has(m.id)) return;
      const key = getMemberRoleKey(m.role || "");
      if (counts[key] !== undefined) counts[key]++;
    });
    return counts;
  }, [selectedIds, members]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedMembers = members?.filter((m: any) => selectedIds.has(m.id)) || [];
  const dateStr = new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Retour aux annonces
      </Button>

      {/* Event header */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
            {event.name}
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="gap-1"><CalendarDays className="h-3 w-3" />{dateStr}</Badge>
            {event.venue && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{event.venue}</Badge>}
            {event.guest_count > 0 && <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{event.guest_count} convives</Badge>}
          </div>

          {/* Staff needs counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Serveurs", icon: "🍽", need: staffNeeds.serveurs, selected: selectedCountByRole.serveur },
              { label: "Chefs", icon: "👨‍🍳", need: staffNeeds.chefs, selected: selectedCountByRole.chef },
              { label: "Bartenders", icon: "🍸", need: staffNeeds.barmans, selected: selectedCountByRole.barman },
              { label: "Maître d'hôtel", icon: "🎩", need: staffNeeds.maitre_hotel, selected: selectedCountByRole.maitre },
            ].filter(r => r.need > 0).map((r) => (
              <div key={r.label} className="bg-muted/50 rounded-xl p-3 text-center">
                <span className="text-lg">{r.icon}</span>
                <p className="text-xs text-muted-foreground mt-1">{r.label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${r.selected >= r.need ? "text-[hsl(var(--status-confirmed))]" : "text-foreground"}`}>
                  {r.selected}/{r.need}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          {ROLE_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Employee list */}
      <div className="grid gap-2">
        {filteredMembers.map((member: any) => {
          const isSelected = selectedIds.has(member.id);
          const stats = teamStats?.[member.id];
          return (
            <Card
              key={member.id}
              className={`cursor-pointer transition-all duration-150 ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/30"}`}
              onClick={() => toggleSelect(member.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role || "—"} {member.hourly_rate ? `• ${member.hourly_rate}€/h` : ""}</p>
                </div>
                {stats && (
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    <span className={stats.reliability >= 80 ? "text-[hsl(var(--status-confirmed))]" : "text-[hsl(var(--status-quote-sent))]"}>
                      ⭐ {stats.reliability}%
                    </span>
                  </div>
                )}
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </CardContent>
            </Card>
          );
        })}
        {filteredMembers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun employé dans cette catégorie.</p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4 -mx-4 lg:-mx-8 px-4 lg:px-8 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size > 0 ? `${selectedIds.size} employé${selectedIds.size > 1 ? "s" : ""} sélectionné${selectedIds.size > 1 ? "s" : ""}` : "Sélectionnez des employés"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenAdvanced} className="text-sm">
            Vue avancée
          </Button>
          {selectedIds.size > 0 && (
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => onSendMessage(selectedMembers)}>
              <Send className="h-4 w-4" /> Envoyer le message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffingSelector;
