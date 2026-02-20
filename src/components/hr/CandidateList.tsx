import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import CandidateCard from "./CandidateCard";

interface CandidateListProps {
  categories: {
    key: string;
    label: string;
    icon: string;
    members: any[];
    staffEntries: any[];
    needed: number;
    confirmed: number;
  }[];
  stats: Record<string, any>;
  onConfirm: (staffId: string) => void;
  onRefuse: (staffId: string) => void;
  onWhatsApp: (member: any, role: string) => void;
  onAdd: (memberId: string, role: string) => void;
}

const CandidateList = ({ categories, stats, onConfirm, onRefuse, onWhatsApp, onAdd }: CandidateListProps) => {
  return (
    <Accordion type="multiple" defaultValue={categories.map((c) => c.key)} className="space-y-2">
      {categories.map((cat) => {
        if (cat.needed === 0) return null;
        const assignedMemberIds = cat.staffEntries.map((s: any) => s.team_member_id);
        // Show assigned first, then unassigned with matching role
        const assignedMembers = cat.staffEntries.map((s: any) => ({
          ...s,
          member: cat.members.find((m: any) => m.id === s.team_member_id) || { name: "Inconnu", id: s.team_member_id },
        }));
        const unassignedMembers = cat.members.filter((m: any) => !assignedMemberIds.includes(m.id));

        return (
          <AccordionItem key={cat.key} value={cat.key} className="border border-[#2D3148] rounded-xl bg-[#0F1117]/50 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#1A1D27]/50">
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-semibold text-sm text-slate-200 uppercase tracking-wide">{cat.label}</span>
                <Badge className={`border-0 text-xs ${cat.confirmed >= cat.needed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {cat.confirmed}/{cat.needed} confirmés
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {/* Assigned members */}
                {assignedMembers.map((entry: any) => (
                  <CandidateCard
                    key={entry.id}
                    member={entry.member}
                    staffEntry={entry}
                    stats={stats[entry.team_member_id]}
                    isAssigned={true}
                    onConfirm={() => onConfirm(entry.id)}
                    onRefuse={() => onRefuse(entry.id)}
                    onWhatsApp={() => onWhatsApp(entry.member, cat.key)}
                  />
                ))}
                {/* Unassigned members */}
                {unassignedMembers.map((member: any) => (
                  <CandidateCard
                    key={member.id}
                    member={member}
                    stats={stats[member.id]}
                    isAssigned={false}
                    onAdd={() => onAdd(member.id, cat.key)}
                  />
                ))}
              </div>
              {assignedMembers.length === 0 && unassignedMembers.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Aucun employé avec ce rôle</p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default CandidateList;
