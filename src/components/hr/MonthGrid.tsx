import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface MonthGridProps {
  events: any[];
  year: number;
  onSelectMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
}

const MonthGrid = ({ events, year, onSelectMonth, onChangeYear }: MonthGridProps) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const countsByMonth = useMemo(() => {
    const counts: number[] = Array(12).fill(0);
    events?.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year) counts[d.getMonth()]++;
    });
    return counts;
  }, [events, year]);

  return (
    <div className="space-y-6">
      {/* Year navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          📅 Annonces — {year}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeYear(year - 1)}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            ← {year - 1}
          </button>
          <button
            onClick={() => onChangeYear(year + 1)}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {year + 1} →
          </button>
        </div>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MONTH_NAMES.map((name, i) => {
          const count = countsByMonth[i];
          const isCurrent = i === currentMonth && year === currentYear;
          const isPast = year < currentYear || (year === currentYear && i < currentMonth);
          const isEmpty = count === 0;

          return (
            <button
              key={i}
              disabled={isEmpty}
              onClick={() => onSelectMonth(i)}
              className={`
                relative rounded-xl border p-5 text-left transition-all duration-200
                ${isEmpty
                  ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                  : isCurrent
                    ? "border-[hsl(var(--status-confirmed))] bg-card shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer"
                    : isPast
                      ? "border-border bg-card/70 hover:bg-card hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                      : "border-border bg-card hover:shadow-md hover:scale-[1.02] cursor-pointer"
                }
              `}
            >
              <div className="flex items-start justify-between">
                <p className={`text-sm font-semibold uppercase tracking-wide ${isPast && !isCurrent ? "text-muted-foreground" : "text-foreground"}`}>
                  {name}
                </p>
                {isCurrent && (
                  <Badge className="text-[10px] bg-[hsl(var(--status-confirmed))] text-white border-0">
                    Actuel
                  </Badge>
                )}
              </div>
              <p className={`text-xs mt-2 ${isEmpty ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                {count === 0 ? "Aucun événement" : `${count} événement${count > 1 ? "s" : ""}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;
