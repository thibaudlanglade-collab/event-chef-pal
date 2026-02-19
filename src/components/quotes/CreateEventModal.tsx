import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarPlus, Save } from "lucide-react";
import { useCreateEvent } from "@/hooks/useSupabase";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (eventId: string, guestCount: number) => void;
}

export default function CreateEventModal({ open, onClose, onCreated }: CreateEventModalProps) {
  const createEvent = useCreateEvent();
  const [form, setForm] = useState({ name: "", date: "", venue: "", guest_count: 0 });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.date) return;
    createEvent.mutate(
      {
        name: form.name.trim(),
        date: form.date,
        venue: form.venue || null,
        guest_count: form.guest_count || 0,
        type: "other",
        status: "prospect",
      },
      {
        onSuccess: (data) => {
          onCreated(data.id, form.guest_count);
          setForm({ name: "", date: "", venue: "", guest_count: 0 });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" /> Nouvel événement
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nom de l'événement *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Mariage Dupont" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Nb. convives</Label>
              <Input type="number" min={0} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: Number(e.target.value) })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Lieu</Label>
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Adresse ou nom du lieu" className="mt-1" />
          </div>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.date || createEvent.isPending} className="w-full gap-2">
            <Save className="h-4 w-4" /> {createEvent.isPending ? "Création…" : "Créer l'événement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
