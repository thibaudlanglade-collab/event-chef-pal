import { StaffNeeds } from "@/hooks/useHrModule";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface HrGaugesProps {
  needs: StaffNeeds;
  confirmed: { serveurs: number; chefs: number; barmans: number; maitre_hotel: number };
}

const roles = [
  { key: "serveurs" as const, label: "Serveurs", icon: "🍽" },
  { key: "chefs" as const, label: "Chefs", icon: "👨‍🍳" },
  { key: "barmans" as const, label: "Barmans", icon: "🍸" },
  { key: "maitre_hotel" as const, label: "Maître d'hôtel", icon: "🎩" },
];

const HrGauges = ({ needs, confirmed }: HrGaugesProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {roles.map((role) => {
        const needed = needs[role.key];
        if (needed === 0) return null;
        const current = confirmed[role.key];
        const pct = needed > 0 ? Math.min((current / needed) * 100, 100) : 0;
        const isComplete = current >= needed;
        const isEmpty = current === 0;

        return (
          <div
            key={role.key}
            className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span className="text-lg">{role.icon}</span> {role.label}
              </span>
              {isComplete ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs gap-1">
                  <CheckCircle className="h-3 w-3" /> Complet
                </Badge>
              ) : isEmpty ? (
                <Badge className="bg-red-500/20 text-red-400 border-0 text-xs gap-1">
                  <XCircle className="h-3 w-3" /> Non pourvu
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" /> {needed - current} manquant{needed - current > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <Progress
                value={pct}
                className="h-2.5 bg-[#22263A]"
                style={{
                  // Override indicator color
                  ["--progress-color" as any]: isComplete ? "#10B981" : isEmpty ? "#EF4444" : "#F59E0B",
                }}
              />
              <p className="text-xs text-slate-400 text-right font-medium">{current}/{needed}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HrGauges;
