import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePipelineHistory, useUpdatePipelineCard } from "@/hooks/usePipeline";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardList, Calendar, Link2, Edit, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ClientDrawerProps {
  card: any;
  stages: any[];
  open: boolean;
  onClose: () => void;
}

export function ClientDrawer({ card, stages, open, onClose }: ClientDrawerProps) {
  const { data: history } = usePipelineHistory(card?.id);
  const updateCard = useUpdatePipelineCard();
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  if (!card) return null;

  const client = card.clients;
  const event = card.events;
  const amount = card.amount ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(card.amount)) : "—";

  const totalDays = Math.floor((Date.now() - new Date(card.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const existingNotes = card.notes || "";
    const dateStr = format(new Date(), "dd MMM", { locale: fr });
    const updatedNotes = `${dateStr} : ${newNote.trim()}\n${existingNotes}`;
    updateCard.mutate({ id: card.id, notes: updatedNotes }, {
      onSuccess: () => { setNewNote(""); setAddingNote(false); toast.success("Note ajoutée"); },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{client?.name || card.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Info */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Informations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              {event?.type && <p><span className="text-muted-foreground">Type :</span> {event.type}</p>}
              {event?.date && <p><span className="text-muted-foreground">Date :</span> {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>}
              {event?.venue && <p><span className="text-muted-foreground">Lieu :</span> {event.venue}</p>}
              {event?.guest_count && <p><span className="text-muted-foreground">Couverts :</span> {event.guest_count}</p>}
              <p><span className="text-muted-foreground">Montant :</span> {amount}</p>
              {client?.email && <p><span className="text-muted-foreground">Email :</span> {client.email}</p>}
              {client?.phone && <p><span className="text-muted-foreground">Tél :</span> {client.phone}</p>}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Historique du pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history?.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: h.pipeline_stages?.color || "#9CA3AF" }} />
                    <span className="font-medium">{h.pipeline_stages?.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {format(new Date(h.moved_at), "dd MMM", { locale: fr })} · {formatDistanceToNow(new Date(h.moved_at), { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Temps total : {totalDays} jours</p>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Edit className="h-4 w-4" /> Notes & échanges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {card.notes ? (
                <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{card.notes}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune note pour l'instant.</p>
              )}
              {addingNote ? (
                <div className="space-y-2">
                  <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ajouter une note..." rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote}>Ajouter</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingNote(false)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddingNote(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Ajouter une note
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> Liens rapides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {card.quote_id && <Button variant="outline" size="sm" asChild><a href="/quotes">Voir le devis</a></Button>}
              {card.event_id && <Button variant="outline" size="sm" asChild><a href="/calendar">Voir l'événement</a></Button>}
              <Button variant="outline" size="sm" asChild><a href="/my-teams">Voir l'équipe</a></Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
