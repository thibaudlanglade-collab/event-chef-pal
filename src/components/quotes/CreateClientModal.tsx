import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Save } from "lucide-react";
import { useCreateClient } from "@/hooks/useSupabase";

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (clientId: string) => void;
}

export default function CreateClientModal({ open, onClose, onCreated }: CreateClientModalProps) {
  const createClient = useCreateClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createClient.mutate(
      { name: form.name.trim(), email: form.email || null, phone: form.phone || null, notes: form.notes || null },
      {
        onSuccess: (data) => {
          onCreated(data.id);
          setForm({ name: "", email: "", phone: "", notes: "" });
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
            <UserPlus className="h-5 w-5" /> Nouveau client
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du client" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className="mt-1" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes…" className="mt-1" />
          </div>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createClient.isPending} className="w-full gap-2">
            <Save className="h-4 w-4" /> {createClient.isPending ? "Création…" : "Créer le client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
