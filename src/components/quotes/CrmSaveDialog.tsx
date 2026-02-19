import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Database } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export default function CrmSaveDialog({ open, onClose, onSave, saving }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Enregistrer dans le CRM ?
          </DialogTitle>
          <DialogDescription>
            Souhaitez-vous sauvegarder ce devis, le client et l'événement associé dans votre CRM pour un suivi complet ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center pt-2">
          <Button variant="outline" onClick={onClose}>Non merci</Button>
          <Button variant="accent" className="gap-2" onClick={onSave} disabled={saving}>
            <Check className="h-4 w-4" /> {saving ? "Enregistrement…" : "Oui, enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
