import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface LostReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  clientName: string;
}

export function LostReasonModal({ open, onClose, onConfirm, clientName }: LostReasonModalProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Marquer comme perdu ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Vous allez déplacer <strong>{clientName}</strong> vers "Perdu".</p>
        <div>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (optionnelle) : Budget, concurrent, annulation..." rows={3} />
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" className="flex-1" onClick={() => { onConfirm(reason); setReason(""); }}>
            Confirmer
          </Button>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
