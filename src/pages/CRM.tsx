import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { usePipelineStages, usePipelineCards, useMovePipelineCard, useUpdatePipelineCard, useScheduledFollowups } from "@/hooks/usePipeline";
import { PipelineCardComponent } from "@/components/crm/PipelineCard";
import { PipelineStats } from "@/components/crm/PipelineStats";
import { ClientDrawer } from "@/components/crm/ClientDrawer";
import { FollowUpModal } from "@/components/crm/FollowUpModal";
import { AddCardModal } from "@/components/crm/AddCardModal";
import { LostReasonModal } from "@/components/crm/LostReasonModal";
import { toast } from "sonner";

function DroppableColumn({ stage, children, count }: { stage: any; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] rounded-xl transition-colors ${isOver ? "bg-accent/30" : "bg-muted/30"}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="font-semibold text-sm">{stage.name}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-320px)]">
        {children}
      </div>
    </div>
  );
}

const CRM = () => {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: cards, isLoading: cardsLoading } = usePipelineCards();
  const { data: followups } = useScheduledFollowups();
  const moveCard = useMovePipelineCard();
  const updateCard = useUpdatePipelineCard();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeCard, setActiveCard] = useState<any>(null);
  const [draggingCard, setDraggingCard] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Modals
  const [viewCard, setViewCard] = useState<any>(null);
  const [followUpCard, setFollowUpCard] = useState<any>(null);
  const [scheduleCard, setScheduleCard] = useState<any>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addCardStageId, setAddCardStageId] = useState<string | undefined>();
  const [lostCard, setLostCard] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    return cards.filter((c: any) => {
      const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.clients?.name?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || c.events?.type?.toLowerCase() === filterType;
      return matchSearch && matchType;
    });
  }, [cards, search, filterType]);

  const getCardsForStage = (stageId: string) => filteredCards.filter((c: any) => c.stage_id === stageId);

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards?.find((c: any) => c.id === event.active.id);
    setDraggingCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingCard(null);
    const { active, over } = event;
    if (!over || !stages) return;

    const card = cards?.find((c: any) => c.id === active.id);
    if (!card) return;

    // Check if dropped on a stage column
    const targetStage = stages.find((s: any) => s.id === over.id);
    if (!targetStage || targetStage.id === card.stage_id) return;

    // Check for "Perdu" stage
    const lostStage = stages.find((s: any) => s.name === "Perdu");
    if (targetStage.id === lostStage?.id) {
      setLostCard({ card, toStageId: targetStage.id });
      return;
    }

    moveCard.mutate({
      cardId: card.id,
      fromStageId: card.stage_id,
      toStageId: targetStage.id,
    });
  };

  const handleMoveNext = (card: any) => {
    if (!stages) return;
    const currentStage = stages.find((s: any) => s.id === card.stage_id);
    if (!currentStage) return;
    const nextStage = stages.find((s: any) => s.position === currentStage.position + 1);
    if (!nextStage) { toast.info("Dernière étape atteinte"); return; }

    const lostStage = stages.find((s: any) => s.name === "Perdu");
    if (nextStage.id === lostStage?.id) {
      setLostCard({ card, toStageId: nextStage.id });
      return;
    }

    moveCard.mutate({ cardId: card.id, fromStageId: card.stage_id, toStageId: nextStage.id });
  };

  const handleMoveTo = (card: any, stageId: string) => {
    if (stageId === card.stage_id) return;
    const lostStage = stages?.find((s: any) => s.name === "Perdu");
    if (stageId === lostStage?.id) {
      setLostCard({ card, toStageId: stageId });
      return;
    }
    moveCard.mutate({ cardId: card.id, fromStageId: card.stage_id, toStageId: stageId });
  };

  const handleLostConfirm = (reason: string) => {
    if (!lostCard) return;
    const note = reason ? `Raison : ${reason}` : undefined;
    moveCard.mutate({ cardId: lostCard.card.id, fromStageId: lostCard.card.stage_id, toStageId: lostCard.toStageId, note });
    // Update event status if linked
    if (lostCard.card.event_id) {
      updateCard.mutate({ id: lostCard.card.id, notes: `${lostCard.card.notes || ""}\n❌ Perdu${reason ? ` — ${reason}` : ""}` });
    }
    setLostCard(null);
  };

  const getFollowupForCard = (cardId: string) => followups?.find((f: any) => f.card_id === cardId);

  if (stagesLoading || cardsLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-96 w-72" />)}
        </div>
      </div>
    );
  }

  const sortedStages = stages?.slice().sort((a: any, b: any) => a.position - b.position) || [];

  return (
    <div className="p-4 lg:p-6 space-y-4 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">📊 CRM — Pipeline Commercial</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("kanban")} className="rounded-none">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="rounded-none">
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="accent" onClick={() => { setAddCardStageId(undefined); setAddCardOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nouveau client
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client ou événement..." className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="mariage">Mariages</SelectItem>
            <SelectItem value="entreprise">Entreprises</SelectItem>
            <SelectItem value="anniversaire">Anniversaires</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {cards && stages && <PipelineStats cards={cards} stages={stages} />}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {sortedStages.map((stage: any) => {
              const stageCards = getCardsForStage(stage.id);
              return (
                <DroppableColumn key={stage.id} stage={stage} count={stageCards.length}>
                  <SortableContext items={stageCards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                    {stageCards.map((card: any) => (
                      <PipelineCardComponent
                        key={card.id}
                        card={card}
                        scheduledFollowup={getFollowupForCard(card.id)}
                        onView={setViewCard}
                        onFollowUp={setFollowUpCard}
                        onSchedule={setScheduleCard}
                        onMoveNext={handleMoveNext}
                        onMoveTo={handleMoveTo}
                        onArchive={(c) => {
                          const lost = stages?.find((s: any) => s.name === "Perdu");
                          if (lost) setLostCard({ card: c, toStageId: lost.id });
                        }}
                        stages={sortedStages}
                      />
                    ))}
                  </SortableContext>
                  <Button variant="ghost" size="sm" className="w-full mt-1 text-xs text-muted-foreground" onClick={() => { setAddCardStageId(stage.id); setAddCardOpen(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Ajouter
                  </Button>
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {draggingCard && (
              <div className="opacity-80 rotate-2 w-[280px]">
                <PipelineCardComponent
                  card={draggingCard}
                  onView={() => {}}
                  onFollowUp={() => {}}
                  onSchedule={() => {}}
                  onMoveNext={() => {}}
                  onMoveTo={() => {}}
                  onArchive={() => {}}
                  stages={[]}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Étape</TableHead>
                <TableHead className="font-semibold">Date événement</TableHead>
                <TableHead className="font-semibold">Couverts</TableHead>
                <TableHead className="font-semibold">Montant</TableHead>
                <TableHead className="font-semibold">Jours dans l'étape</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStages.map((stage: any) => {
                const stageCards = getCardsForStage(stage.id);
                if (stageCards.length === 0) return null;
                return stageCards.map((card: any, idx: number) => {
                  const daysSince = Math.floor((Date.now() - new Date(card.entered_stage_at).getTime()) / (1000 * 60 * 60 * 24));
                  const eventType = card.events?.type || "Événement";
                  const eventDate = card.events?.date ? new Date(card.events.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
                  const guestCount = card.events?.guest_count || 0;
                  const amount = card.amount ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(card.amount)) : "—";
                  return (
                    <TableRow key={card.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setViewCard(card)}>
                      <TableCell className="font-medium">{card.clients?.name || card.title}</TableCell>
                      <TableCell>{eventType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: stage.color, color: stage.color }} className="text-xs">
                          {stage.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{eventDate}</TableCell>
                      <TableCell>{guestCount}</TableCell>
                      <TableCell className="font-medium">{amount}</TableCell>
                      <TableCell>
                        <span className={daysSince > 10 ? "text-destructive font-bold" : daysSince > 5 ? "text-orange-500" : "text-muted-foreground"}>
                          {daysSince}j
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFollowUpCard(card)}>Relancer</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMoveNext(card)}>→</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                });
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <ClientDrawer card={viewCard} stages={sortedStages} open={!!viewCard} onClose={() => setViewCard(null)} />
      <FollowUpModal
        card={followUpCard}
        stage={stages?.find((s: any) => s.id === followUpCard?.stage_id)}
        open={!!followUpCard}
        onClose={() => setFollowUpCard(null)}
      />
      <FollowUpModal
        card={scheduleCard}
        stage={stages?.find((s: any) => s.id === scheduleCard?.stage_id)}
        open={!!scheduleCard}
        onClose={() => setScheduleCard(null)}
        scheduleMode
      />
      <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} stages={sortedStages} defaultStageId={addCardStageId} />
      <LostReasonModal
        open={!!lostCard}
        onClose={() => setLostCard(null)}
        onConfirm={handleLostConfirm}
        clientName={lostCard?.card?.clients?.name || lostCard?.card?.title || ""}
      />
    </div>
  );
};

export default CRM;
