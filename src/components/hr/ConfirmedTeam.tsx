import { Badge } from "@/components/ui/badge";
import { CheckCircle, User } from "lucide-react";

interface ConfirmedTeamProps {
  categories: {
    key: string;
    label: string;
    icon: string;
    needed: number;
    confirmedMembers: { id: string; name: string }[];
  }[];
  totalConfirmed: number;
  totalNeeded: number;
}

const ConfirmedTeam = ({ categories, totalConfirmed, totalNeeded }: ConfirmedTeamProps) => {
  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#1A1D27] p-4 space-y-4 sticky top-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          ÉQUIPE CONFIRMÉE
        </h3>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
          {totalConfirmed}/{totalNeeded}
        </Badge>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          if (cat.needed === 0) return null;
          const isComplete = cat.confirmedMembers.length >= cat.needed;
          return (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span>{cat.icon}</span>
                <span className="text-slate-400 font-medium">{cat.label} ({cat.confirmedMembers.length}/{cat.needed})</span>
                {isComplete && <CheckCircle className="h-3 w-3 text-emerald-400" />}
              </div>
              {cat.confirmedMembers.length > 0 ? (
                <div className="pl-5 space-y-1">
                  {cat.confirmedMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>{m.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pl-5 text-xs text-slate-600 italic">Aucun confirmé</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfirmedTeam;
