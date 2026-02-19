import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Mail, Calendar, MoreVertical, ArrowRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PipelineCardProps {
  card: any;
  scheduledFollowup?: any;
  onView: (card: any) => void;
  onFollowUp: (card: any) => void;
  onSchedule: (card: any) => void;
  onMoveNext: (card: any) => void;
  onMoveTo: (card: any, stageId: string) => void;
  onArchive: (card: any) => void;
  stages: any[];
}

const eventTypeEmoji: Record<string, string> = {
  mariage: "💍",
  wedding: "💍",
  entreprise: "🏢",
  corporate: "🏢",
  anniversaire: "🎂",
  birthday: "🎂",
  other: "🎉",
};

function getDaysColor(days: number) {
  if (days <= 2) return "border-l-green-500";
  if (days <= 5) return "border-l-yellow-500";
  if (days <= 10) return "border-l-orange-500";
  return "border-l-red-500";
}

export function PipelineCardComponent({ card, scheduledFollowup, onView, onFollowUp, onSchedule, onMoveNext, onMoveTo, onArchive, stages }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const dragProps = { ...attributes, ...listeners };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const daysSinceEntered = Math.floor(
    (Date.now() - new Date(card.entered_stage_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const eventType = card.events?.type?.toLowerCase() || "other";
  const emoji = eventTypeEmoji[eventType] || "🎉";
  const eventDate = card.events?.date ? new Date(card.events.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
  const guestCount = card.events?.guest_count || 0;
  const amount = card.amount ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(card.amount)) : "";

  return (
    <div ref={setNodeRef} style={style} {...dragProps} className={cn("transition-opacity cursor-grab active:cursor-grabbing", isDragging && "opacity-50")}>
      <Card className={cn(
        "rounded-xl border-l-4 bg-card hover:shadow-md transition-shadow",
        getDaysColor(daysSinceEntered)
      )}>
        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm truncate">{card.clients?.name || card.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(card)}>Voir la fiche</DropdownMenuItem>
                  {stages.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => onMoveTo(card, s.id)}>
                      Déplacer → {s.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem className="text-destructive" onClick={() => onArchive(card)}>Archiver</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveNext(card)}>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{emoji} {card.events?.type || "Événement"} · {eventDate} · {guestCount} couverts</p>
            {amount && <p className="font-medium text-foreground">💰 {amount}</p>}
          </div>

          {/* Time indicator + urgency */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              📧 Dans cette étape depuis {daysSinceEntered}j
            </span>
            {daysSinceEntered > 10 && (
              <Badge variant="destructive" className={cn("text-[10px] px-1.5 py-0", daysSinceEntered > 15 && "animate-pulse")}>
                URGENT
              </Badge>
            )}
          </div>

          {/* Scheduled followup */}
          {scheduledFollowup && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Bell className="h-3 w-3" />
              <span>Relance {formatDistanceToNow(new Date(scheduledFollowup.scheduled_at), { locale: fr, addSuffix: true })}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1 px-2" onClick={() => onView(card)}>
              <Eye className="h-3 w-3 shrink-0" /><span className="hidden min-[320px]:inline ml-1">Voir</span>
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1 px-2" onClick={() => onFollowUp(card)}>
              <Mail className="h-3 w-3 shrink-0" /><span className="hidden min-[320px]:inline ml-1">Relancer</span>
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1 px-2" onClick={() => onSchedule(card)}>
              <Calendar className="h-3 w-3 shrink-0" /><span className="hidden min-[320px]:inline ml-1">Planifier</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
