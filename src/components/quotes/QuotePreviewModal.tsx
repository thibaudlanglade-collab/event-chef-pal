import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Mail, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const CAT_LABELS: Record<string, string> = {
  restauration: "Restauration",
  boissons: "Boissons",
  boissons_alcool: "Alcools",
  personnel: "Personnel",
  logistique: "Logistique",
  options: "Options",
};

export interface PreviewQuoteItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pricingType: string;
  qty: number;
  unitPrice: number;
  tva: number;
}

interface CompanyInfo {
  companyName?: string;
  address?: string;
  siret?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  quoteValidityDays?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: PreviewQuoteItem[];
  onItemsChange: (items: PreviewQuoteItem[]) => void;
  clientName?: string;
  eventName?: string;
  eventDate?: string;
  guestCount?: number;
  notes?: string;
  onNotesChange: (notes: string) => void;
  depositPercent: number;
  discountPercent: number;
  company: CompanyInfo;
  onDownloadPdf: () => void;
  onSendEmail: () => void;
  pdfLoading: boolean;
}

export default function QuotePreviewModal({
  open, onClose, items, onItemsChange, clientName, eventName, eventDate,
  guestCount, notes, onNotesChange, depositPercent, discountPercent,
  company, onDownloadPdf, onSendEmail, pdfLoading,
}: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { companyName, address, siret, phone, email, logoUrl, quoteValidityDays = 30 } = company;
  const displayName = companyName || "CaterPilot";
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + quoteValidityDays);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Group by category
  const grouped = items.reduce<Record<string, PreviewQuoteItem[]>>((acc, item) => {
    const cat = item.category || "options";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calculations
  const totalHT = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const discountAmount = totalHT * (discountPercent / 100);
  const totalHTAfterDiscount = totalHT - discountAmount;
  const tvaBreakdown: Record<number, number> = {};
  items.forEach((i) => {
    const lineHT = i.qty * i.unitPrice;
    tvaBreakdown[i.tva] = (tvaBreakdown[i.tva] ?? 0) + lineHT * (i.tva / 100);
  });
  const totalTva = Object.values(tvaBreakdown).reduce((s, v) => s + v, 0) * (1 - discountPercent / 100);
  const totalTTC = totalHTAfterDiscount + totalTva;
  const deposit = totalTTC * (depositPercent / 100);

  const startEdit = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValue(currentValue);
  };

  const commitEdit = (itemId: string, field: keyof PreviewQuoteItem) => {
    const updated = items.map((i) => {
      if (i.id !== itemId) return i;
      if (field === "qty" || field === "unitPrice" || field === "tva") {
        return { ...i, [field]: Number(editValue) || 0 };
      }
      return { ...i, [field]: editValue };
    });
    onItemsChange(updated);
    setEditingField(null);
  };

  const EditableText = ({ value, fieldKey, itemId, field, className }: {
    value: string; fieldKey: string; itemId: string; field: keyof PreviewQuoteItem; className?: string;
  }) => {
    if (editingField === fieldKey) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(itemId, field)}
          onKeyDown={(e) => e.key === "Enter" && commitEdit(itemId, field)}
          className={cn("bg-primary/5 border border-primary/30 rounded px-1.5 py-0.5 text-sm outline-none", className)}
        />
      );
    }
    return (
      <span
        onClick={() => startEdit(fieldKey, value)}
        className={cn("cursor-pointer hover:bg-primary/5 rounded px-1 py-0.5 transition-colors group inline-flex items-center gap-1", className)}
        title="Cliquer pour modifier"
      >
        {value}
        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
          <h2 className="text-lg font-bold">Aperçu du devis</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 bg-background">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-wider uppercase text-foreground">DEVIS</h1>
                <p className="text-sm font-bold mt-1">{displayName}</p>
                {address && <p className="text-xs text-muted-foreground">{address}</p>}
                {siret && <p className="text-xs text-muted-foreground">SIRET : {siret}</p>}
                {phone && <p className="text-xs text-muted-foreground">Tél : {phone}</p>}
                {email && <p className="text-xs text-muted-foreground">{email}</p>}
              </div>
              {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 object-contain" />}
            </div>

            <hr className="border-foreground border-t-2" />

            {/* Meta */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Devis N°</p>
                <p className="font-bold">DEV-{new Date().getFullYear()}-XXXXX</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Date d'émission</p>
                <p className="font-bold">{new Date().toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Valable jusqu'au</p>
                <p className="font-bold">{validityDate.toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {/* Client */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pour</p>
              <p className="font-bold mt-1">{clientName || "—"}</p>
              {eventName && <p className="text-xs text-muted-foreground">Événement : {eventName}</p>}
              {eventDate && <p className="text-xs text-muted-foreground">Date : {eventDate}</p>}
              {guestCount ? <p className="text-xs text-muted-foreground">Convives : {guestCount}</p> : null}
            </div>

            {/* Table by category */}
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2">
                  {CAT_LABELS[cat] || cat}
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-foreground text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left py-1 font-medium">Description</th>
                      <th className="text-center py-1 font-medium w-14">Qté</th>
                      <th className="text-right py-1 font-medium w-24">PU HT</th>
                      <th className="text-right py-1 font-medium w-24">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map((item, i) => (
                      <tr key={item.id} className={cn("border-b border-border/50", i % 2 === 1 && "bg-muted/30")}>
                        <td className="py-2 pr-2">
                          <EditableText value={item.name} fieldKey={`name-${item.id}`} itemId={item.id} field="name" className="font-medium" />
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              <EditableText value={item.description} fieldKey={`desc-${item.id}`} itemId={item.id} field="description" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          <EditableText value={String(item.qty)} fieldKey={`qty-${item.id}`} itemId={item.id} field="qty" className="w-12 text-center" />
                        </td>
                        <td className="py-2 text-right">
                          <EditableText value={fmt(item.unitPrice)} fieldKey={`price-${item.id}`} itemId={item.id} field="unitPrice" className="w-20 text-right" />
                        </td>
                        <td className="py-2 text-right font-bold tabular-nums">{fmt(item.qty * item.unitPrice)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="tabular-nums">{fmt(totalHT)} €</span>
                </div>
                {discountPercent > 0 && (
                  <>
                    <div className="flex justify-between text-destructive">
                      <span>Remise ({discountPercent}%)</span>
                      <span className="tabular-nums">-{fmt(discountAmount)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total HT après remise</span>
                      <span className="tabular-nums">{fmt(totalHTAfterDiscount)} €</span>
                    </div>
                  </>
                )}
                {Object.entries(tvaBreakdown).map(([rate, amount]) => (
                  <div key={rate} className="flex justify-between">
                    <span className="text-muted-foreground">TVA {rate}%</span>
                    <span className="tabular-nums">{fmt(amount * (1 - discountPercent / 100))} €</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-foreground">
                  <span>Total TTC</span>
                  <span className="tabular-nums">{fmt(totalTTC)} €</span>
                </div>
              </div>
            </div>

            {/* Deposit */}
            <div className="bg-accent/30 border border-accent rounded-lg p-3">
              <div className="flex justify-between font-bold text-sm">
                <span>Acompte à la commande ({depositPercent}%)</span>
                <span>{fmt(deposit)} €</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Solde dû le jour de l'événement : {fmt(totalTTC - deposit)} €</p>
            </div>

            {/* Notes */}
            {notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Notes</p>
                <p
                  className="text-sm cursor-pointer hover:bg-primary/5 rounded p-1 transition-colors"
                  onClick={() => {
                    const newNotes = prompt("Modifier les notes :", notes);
                    if (newNotes !== null) onNotesChange(newNotes);
                  }}
                  title="Cliquer pour modifier"
                >
                  {notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="accent" className="gap-2" onClick={onDownloadPdf} disabled={pdfLoading}>
            <FileDown className="h-4 w-4" /> {pdfLoading ? "Génération…" : "Télécharger PDF"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={onSendEmail}>
            <Mail className="h-4 w-4" /> Envoyer par Mail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
