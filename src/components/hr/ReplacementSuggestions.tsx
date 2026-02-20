import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Calendar, Timer } from "lucide-react";

interface ReplacementSuggestionsProps {
  refusedOrExpired: any[];
  allMembers: any[];
  assignedIds: string[];
  stats: Record<string, any>;
  onAdd: (memberId: string, role: string) => void;
}

const ReplacementSuggestions = ({ refusedOrExpired, allMembers, assignedIds, stats, onAdd }: ReplacementSuggestionsProps) => {
  if (refusedOrExpired.length === 0) return null;

  return (
    <div className="space-y-3">
      {refusedOrExpired.map((s: any) => {
        const memberName = s.team_members?.name || "Inconnu";
        const role = s.role_assigned || s.team_members?.role || "";

        // Find replacements: same role, not already assigned, sorted by reliability
        const candidates = allMembers
          .filter((m: any) => {
            const mRole = (m.role || "").toLowerCase();
            const targetRole = role.toLowerCase();
            return !assignedIds.includes(m.id) && (
              mRole.includes(targetRole) ||
              targetRole.includes(mRole) ||
              mRole === targetRole
            );
          })
          .map((m: any) => ({
            ...m,
            reliability: stats[m.id]?.reliability ?? 50,
            events_month: stats[m.id]?.events_month ?? 0,
            avg_response: stats[m.id]?.avg_response_minutes ?? 0,
          }))
          .sort((a: any, b: any) => {
            // Sort by: reliability DESC, events_month ASC, avg_response ASC
            if (b.reliability !== a.reliability) return b.reliability - a.reliability;
            if (a.events_month !== b.events_month) return a.events_month - b.events_month;
            return a.avg_response - b.avg_response;
          })
          .slice(0, 3);

        if (candidates.length === 0) return null;

        return (
          <div key={s.id} className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="text-sm text-slate-200 font-medium">
                Remplaçants suggérés pour <span className="text-red-400">{memberName}</span> ({role})
              </p>
            </div>

            <div className="space-y-2">
              {candidates.map((c: any, i: number) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-[#0F1117] border border-[#2D3148] p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200">
                      {i + 1}. {c.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400" /> {c.reliability}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {c.events_month} ce mois
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {c.avg_response > 0 ? `${Math.round(c.avg_response)} min` : "—"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => onAdd(c.id, role)}
                  >
                    + Ajouter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReplacementSuggestions;
