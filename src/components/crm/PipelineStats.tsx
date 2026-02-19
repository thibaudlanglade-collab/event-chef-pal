import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { useState } from "react";

interface PipelineStatsProps {
  cards: any[];
  stages: any[];
}

export function PipelineStats({ cards, stages }: PipelineStatsProps) {
  const [open, setOpen] = useState(false);

  const confirmedStage = stages.find((s) => s.name === "Confirmé");
  const lostStage = stages.find((s) => s.name === "Perdu");
  const negoStage = stages.find((s) => s.name === "Négociation");

  const confirmedCards = cards.filter((c) => c.stage_id === confirmedStage?.id);
  const lostCards = cards.filter((c) => c.stage_id === lostStage?.id);
  const negoCards = cards.filter((c) => c.stage_id === negoStage?.id);

  const totalExcludingLost = cards.filter((c) => c.stage_id !== lostStage?.id).length;
  const conversionRate = totalExcludingLost > 0 ? Math.round((confirmedCards.length / totalExcludingLost) * 100) : 0;

  const negoAmount = negoCards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const confirmedAmount = confirmedCards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const fmt = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="rounded-2xl">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4" /> Vue d'ensemble du pipeline
            </span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Taux de conversion</p>
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">{confirmedCards.length}/{totalExcludingLost} clients</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En négociation</p>
              <p className="text-2xl font-bold">{fmt(negoAmount)}</p>
              <p className="text-xs text-muted-foreground">{negoCards.length} clients</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmé</p>
              <p className="text-2xl font-bold text-primary">{fmt(confirmedAmount)}</p>
              <p className="text-xs text-muted-foreground">{confirmedCards.length} clients</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total pipeline</p>
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-muted-foreground">dont {lostCards.length} perdus</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
