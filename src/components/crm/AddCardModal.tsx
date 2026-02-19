import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useClients, useCreateClient } from "@/hooks/useSupabase";
import { useEvents } from "@/hooks/useSupabase";
import { useCreatePipelineCard } from "@/hooks/usePipeline";

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
  stages: any[];
  defaultStageId?: string;
}

export function AddCardModal({ open, onClose, stages, defaultStageId }: AddCardModalProps) {
  const { data: clients } = useClients();
  const { data: events } = useEvents();
  const createCard = useCreatePipelineCard();
  const createClient = useCreateClient();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");
  const [stageId, setStageId] = useState(defaultStageId || "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  // New client fields
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  useEffect(() => {
    if (open) {
      const def = stages.find((s) => s.is_default);
      setStageId(defaultStageId || def?.id || stages[0]?.id || "");
      setMode("existing");
      setClientId("");
      setEventId("");
      setTitle("");
      setAmount("");
    }
  }, [open, stages, defaultStageId]);

  const handleSubmit = async () => {
    let finalClientId = clientId;

    if (mode === "new") {
      if (!newClientName) return;
      const result = await createClient.mutateAsync({ name: newClientName, email: newClientEmail || null, phone: newClientPhone || null });
      finalClientId = result.id;
    }

    if (!finalClientId || !stageId) return;

    const selectedEvent = events?.find((e: any) => e.id === eventId);
    const cardTitle = title || selectedEvent?.name || `Client ${clients?.find((c: any) => c.id === finalClientId)?.name || ""}`;

    createCard.mutate({
      stage_id: stageId,
      client_id: finalClientId,
      event_id: eventId || undefined,
      title: cardTitle,
      amount: amount ? parseFloat(amount) : undefined,
    }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un client au pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "existing" ? "default" : "outline"} size="sm" onClick={() => setMode("existing")}>Client existant</Button>
            <Button variant={mode === "new" ? "default" : "outline"} size="sm" onClick={() => setMode("new")}>Nouveau client</Button>
          </div>

          {mode === "existing" ? (
            <div>
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div><Label>Nom</Label><Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} type="email" /></div>
              <div><Label>Téléphone</Label><Input value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} /></div>
            </div>
          )}

          <div>
            <Label>Événement (optionnel)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {events?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} — {new Date(e.date).toLocaleDateString("fr-FR")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Étape</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Titre</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mariage Dupont" /></div>
            <div><Label>Montant (€)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0" /></div>
          </div>

          <Button className="w-full" variant="accent" onClick={handleSubmit} disabled={createCard.isPending}>
            Ajouter au pipeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
