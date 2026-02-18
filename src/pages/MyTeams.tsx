import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Plus, Search, User, X } from "lucide-react";
import { useTeamMembers, useCreateTeamMember } from "@/hooks/useSupabase";
import { useTeamReliability } from "@/hooks/useConfirmations";
import { cn } from "@/lib/utils";

const ROLES = ["Serveur", "Serveuse", "Chef", "Cuisinier", "Décorateur", "Autre"];

const MyTeams = () => {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", phone: "", role: "", hourly_rate: 0, skills: "" });

  const { data: members, isLoading } = useTeamMembers();
  const { data: reliability } = useTeamReliability();
  const createMember = useCreateTeamMember();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      const matchesRole = !activeRole || m.role === activeRole;
      const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [members, activeRole, search]);

  const getReliabilityInfo = (memberId: string) => {
    const r = reliability?.[memberId];
    if (!r || r.total === 0) return { score: null, label: "Nouveau" };
    const score = Math.round((r.confirmed / r.total) * 100);
    return { score, label: `${score}%` };
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
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes équipes</h1>
          <p className="text-muted-foreground text-sm">Annuaire complet de vos collaborateurs</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Ajouter un employé
        </Button>
      </div>

      {/* Search + role filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un employé…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={activeRole === null ? "default" : "outline"} size="sm" onClick={() => setActiveRole(null)}>
            Tous ({members?.length || 0})
          </Button>
          {ROLES.map((role) => {
            const count = members?.filter((m) => m.role === role).length || 0;
            if (count === 0) return null;
            return (
              <Button key={role} variant={activeRole === role ? "default" : "outline"} size="sm" onClick={() => setActiveRole(role)}>
                {role} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Members list */}
      {filteredMembers.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl">
          <p className="text-muted-foreground">Aucun employé trouvé.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const rel = getReliabilityInfo(member.id);
            return (
              <Card
                key={member.id}
                className="rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {member.role && <Badge variant="secondary" className="text-xs">{member.role}</Badge>}
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{member.hourly_rate} €/h</p>
                    <p className="text-xs text-muted-foreground">Fiabilité: {rel.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Member detail sheet */}
      {selectedMember && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedMember(null)}>
          <Card className="w-full sm:max-w-md animate-fade-in rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Fiche employé</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                  {selectedMember.role && <Badge>{selectedMember.role}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{selectedMember.phone || "—"}</p></div>
                <div><p className="text-muted-foreground">Taux horaire</p><p className="font-medium">{selectedMember.hourly_rate} €/h</p></div>
                <div><p className="text-muted-foreground">Fiabilité</p><p className="font-medium">{getReliabilityInfo(selectedMember.id).label}</p></div>
              </div>
              {selectedMember.skills && selectedMember.skills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Compétences</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMember.skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                </div>
              )}
              {selectedMember.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedMember.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-md animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Nouvel employé</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></Button>
              </div>
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

export default MyTeams;
