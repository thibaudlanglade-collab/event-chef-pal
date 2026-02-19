import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileDown, Link2, Save, Users, Calendar, Package, UserPlus, CalendarPlus, Eye, Mail } from "lucide-react";
import { useClients, useEvents, useCreateQuote } from "@/hooks/useSupabase";
import { CATALOG_CATEGORIES, PRICING_TYPES, type CatalogItem } from "@/hooks/useCatalog";
import CatalogModal from "@/components/quotes/CatalogModal";
import CreateClientModal from "@/components/quotes/CreateClientModal";
import CreateEventModal from "@/components/quotes/CreateEventModal";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import QuoteEmailModal from "@/components/quotes/QuoteEmailModal";
import CrmSaveDialog from "@/components/quotes/CrmSaveDialog";
import QuotePdfDocument, { type PdfQuoteItem, type CompanyInfo } from "@/components/quotes/QuotePdfDocument";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";

// ─── Types ───
interface QuoteItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pricingType: string;
  qty: number;
  unitPrice: number;
  tva: number;
}

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);

const emptyItem = (): QuoteItem => ({
  id: newId(), name: "", description: "", category: "restauration", pricingType: "quantity", qty: 1, unitPrice: 0, tva: 10,
});

// ─── Component ───
const Quotes = () => {
  const { data: clients, isLoading: cLoading } = useClients();
  const { data: events, isLoading: eLoading } = useEvents();
  const createQuote = useCreateQuote();
  const { data: profile } = useUserProfile();

  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [depositPercent, setDepositPercent] = useState(30);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const event = events?.find((e) => e.id === selectedEvent);

  // Sync guest count when event changes
  const handleEventChange = useCallback((eventId: string) => {
    setSelectedEvent(eventId);
    const ev = events?.find((e) => e.id === eventId);
    if (ev?.guest_count) setGuestCount(ev.guest_count);
  }, [events]);

  // Update items with per_person pricing when guest count changes
  const handleGuestCountChange = useCallback((count: number) => {
    setGuestCount(count);
    setItems((prev) =>
      prev.map((item) =>
        item.pricingType === "per_person" ? { ...item, qty: count || 1 } : item
      )
    );
  }, []);

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addCatalogItems = (catalogItems: CatalogItem[]) => {
    const newItems: QuoteItem[] = catalogItems.map((ci) => ({
      id: newId(),
      name: ci.name,
      description: ci.description ?? "",
      category: ci.category,
      pricingType: ci.pricing_type,
      qty: ci.pricing_type === "per_person" ? (guestCount || 1) : 1,
      unitPrice: ci.sale_price ?? 0,
      tva: ci.default_tva,
    }));
    setItems((prev) => [...prev, ...newItems]);
    toast.success(`${catalogItems.length} prestation(s) ajoutée(s)`);
  };

  // ─── Calculations ───
  const grouped = useMemo(() => {
    const g: Record<string, QuoteItem[]> = {};
    items.forEach((item) => {
      const cat = item.category || "options";
      if (!g[cat]) g[cat] = [];
      g[cat].push(item);
    });
    return g;
  }, [items]);

  const totalHT = useMemo(() => items.reduce((s, i) => s + i.qty * i.unitPrice, 0), [items]);

  const discountAmount = useMemo(() => totalHT * (discountPercent / 100), [totalHT, discountPercent]);
  const totalHTAfterDiscount = totalHT - discountAmount;

  const tvaBreakdown = useMemo(() => {
    const bd: Record<number, number> = {};
    items.forEach((i) => {
      const lineHT = i.qty * i.unitPrice;
      bd[i.tva] = (bd[i.tva] ?? 0) + lineHT * (i.tva / 100);
    });
    return bd;
  }, [items]);

  const totalTva = useMemo(() => Object.values(tvaBreakdown).reduce((s, v) => s + v, 0) * (1 - discountPercent / 100), [tvaBreakdown, discountPercent]);
  const totalTTC = totalHTAfterDiscount + totalTva;
  const deposit = totalTTC * (depositPercent / 100);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─── Save ───
  const handleSave = (status: string = "draft") => {
    const quoteItems = items.map(({ name, qty, unitPrice, tva, category, pricingType, description }) => ({
      name, qty, unitPrice, tva, category, pricingType, description,
    }));
    createQuote.mutate({
      client_id: selectedClient || null,
      event_id: selectedEvent || null,
      status,
      items: quoteItems as any,
      subtotal: totalHT,
      tva_rate: 0,
      total_ttc: totalTTC,
      notes: notes || null,
    });
  };

  // ─── PDF ───
  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const pdfItems: PdfQuoteItem[] = items.map((i) => ({
        name: i.name, description: i.description, category: i.category,
        qty: i.qty, unitPrice: i.unitPrice, tva: i.tva, pricingType: i.pricingType,
      }));
      const client = clients?.find((c) => c.id === selectedClient);
      const companyInfo: CompanyInfo = {
        companyName: profile?.company_name,
        address: profile?.address ?? undefined,
        siret: profile?.siret ?? undefined,
        phone: profile?.phone || undefined,
        email: profile?.email,
        logoUrl: profile?.logo_url ?? undefined,
        quoteValidityDays: profile?.quote_validity_days ?? 30,
      };
      const blob = await pdf(
        <QuotePdfDocument
          items={pdfItems}
          clientName={client?.name}
          eventName={event?.name}
          eventDate={event?.date ? new Date(event.date).toLocaleDateString("fr-FR") : undefined}
          guestCount={guestCount || undefined}
          notes={notes}
          depositPercent={depositPercent}
          discountPercent={discountPercent}
          company={companyInfo}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${client?.name?.replace(/\s/g, "-") || "nouveau"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF généré !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const getCatLabel = (cat: string) => CATALOG_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  if (cLoading || eLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Devis Express</h1>
        <p className="text-muted-foreground text-sm">Créez un devis professionnel en quelques clics avec catalogue et export PDF.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── LEFT COLUMN ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meta */}
          <Card className="rounded-2xl">
            <CardContent className="p-5 grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <div className="flex gap-1.5 mt-1.5">
                  <select className="flex-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                    <option value="">— Choisir —</option>
                    {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setClientModalOpen(true)} title="Nouveau client">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Événement lié</Label>
                <div className="flex gap-1.5 mt-1.5">
                  <select className="flex-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={selectedEvent} onChange={(e) => handleEventChange(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {events?.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setEventModalOpen(true)} title="Nouvel événement">
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Nb. convives</Label>
                <Input type="number" min={0} value={guestCount} onChange={(e) => handleGuestCountChange(Number(e.target.value))} className="mt-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* Quote Lines grouped by category */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lignes du devis</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCatalogOpen(true)}>
                    <Package className="h-3.5 w-3.5" /> Catalogue
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItems((p) => [...p, emptyItem()])}>
                    <Plus className="h-3.5 w-3.5" /> Ligne vide
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {Object.entries(grouped).map(([cat, catItems]) => {
                const catTotal = catItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                return (
                  <div key={cat} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">{getCatLabel(cat)}</Badge>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">{fmt(catTotal)} €</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1.5 font-medium text-xs">Désignation</th>
                            <th className="text-right py-1.5 font-medium text-xs w-14">Qté</th>
                            <th className="text-right py-1.5 font-medium text-xs w-24">PU HT</th>
                            <th className="text-right py-1.5 font-medium text-xs w-16">TVA</th>
                            <th className="text-right py-1.5 font-medium text-xs w-24">Total HT</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {catItems.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 group">
                              <td className="py-1.5 pr-2">
                                <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="Prestation…" className="h-8 text-sm" />
                                {item.pricingType === "per_person" && (
                                  <span className="text-[10px] text-primary font-medium">Par personne</span>
                                )}
                              </td>
                              <td className="py-1.5 px-1">
                                <Input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} className="h-8 text-right text-sm" min={0} />
                              </td>
                              <td className="py-1.5 px-1">
                                <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} className="h-8 text-right text-sm" min={0} step={0.01} />
                              </td>
                              <td className="py-1.5 px-1">
                                <select value={item.tva} onChange={(e) => updateItem(item.id, "tva", Number(e.target.value))} className="h-8 w-full rounded border border-input bg-background text-sm text-right px-1">
                                  <option value={5.5}>5,5%</option>
                                  <option value={10}>10%</option>
                                  <option value={20}>20%</option>
                                </select>
                              </td>
                              <td className="py-1.5 text-right font-medium tabular-nums text-sm">{fmt(item.qty * item.unitPrice)} €</td>
                              <td className="py-1.5 text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Ajoutez des lignes via le catalogue.</p>
              )}

              {/* Summary */}
              <div className="mt-4 border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium tabular-nums">{fmt(totalHT)} €</span>
                </div>
                {/* Discount */}
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Remise</span>
                    <Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="h-7 w-16 text-right text-xs" />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                  {discountPercent > 0 && <span className="font-medium tabular-nums text-destructive">-{fmt(discountAmount)} €</span>}
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT après remise</span>
                    <span className="font-medium tabular-nums">{fmt(totalHTAfterDiscount)} €</span>
                  </div>
                )}
                {Object.entries(tvaBreakdown).map(([rate, amount]) => (
                  <div key={rate} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA {rate}%</span>
                    <span className="tabular-nums">{fmt(amount * (1 - discountPercent / 100))} €</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total TTC</span>
                  <span className="tabular-nums">{fmt(totalTTC)} €</span>
                </div>
                <div className="flex justify-between text-sm items-center pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Acompte</span>
                    <Input type="number" min={0} max={100} value={depositPercent} onChange={(e) => setDepositPercent(Number(e.target.value))} className="h-7 w-16 text-right text-xs" />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                  <span className="font-medium tabular-nums">{fmt(deposit)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <Label className="text-sm font-medium">Notes (affichées sur le PDF)</Label>
              <Textarea className="mt-1.5" placeholder="Conditions particulières, allergies, remarques…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" className="gap-2" onClick={() => setPreviewOpen(true)} disabled={items.length === 0}>
              <Eye className="h-4 w-4" /> Voir le devis
            </Button>
            <Button variant="outline" className="gap-2" onClick={handlePdf} disabled={pdfLoading}>
              <FileDown className="h-4 w-4" /> {pdfLoading ? "Génération…" : "Générer PDF"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleSave("draft")} disabled={createQuote.isPending}>
              <Save className="h-4 w-4" /> {createQuote.isPending ? "Sauvegarde…" : "Sauvegarder brouillon"}
            </Button>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-4">
          {event && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Événement lié</p>
                <h3 className="font-semibold">{event.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{new Date(event.date).toLocaleDateString("fr-FR")}</p>
                  <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{event.guest_count} convives</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick summary card */}
          <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Résumé</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Lignes</span><span className="font-medium">{items.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total HT</span><span className="font-medium tabular-nums">{fmt(totalHT)} €</span></div>
                {discountPercent > 0 && <div className="flex justify-between text-destructive"><span>Remise ({discountPercent}%)</span><span className="tabular-nums">-{fmt(discountAmount)} €</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span className="font-medium tabular-nums">{fmt(totalTva)} €</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>TTC</span><span className="tabular-nums">{fmt(totalTTC)} €</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Acompte ({depositPercent}%)</span><span className="tabular-nums">{fmt(deposit)} €</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} onSelectMultiple={addCatalogItems} guestCount={guestCount} />
      <CreateClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} onCreated={(id) => setSelectedClient(id)} />
      <CreateEventModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} onCreated={(id, gc) => { setSelectedEvent(id); if (gc) handleGuestCountChange(gc); }} />
      
      <QuotePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        items={items}
        onItemsChange={setItems}
        clientName={clients?.find((c) => c.id === selectedClient)?.name}
        eventName={event?.name}
        eventDate={event?.date ? new Date(event.date).toLocaleDateString("fr-FR") : undefined}
        guestCount={guestCount || undefined}
        notes={notes}
        onNotesChange={setNotes}
        depositPercent={depositPercent}
        discountPercent={discountPercent}
        company={{
          companyName: profile?.company_name,
          address: profile?.address ?? undefined,
          siret: profile?.siret ?? undefined,
          phone: profile?.phone || undefined,
          email: profile?.email,
          logoUrl: profile?.logo_url ?? undefined,
          quoteValidityDays: profile?.quote_validity_days ?? 30,
        }}
        onDownloadPdf={() => { setPreviewOpen(false); handlePdf().then(() => setCrmOpen(true)); }}
        onSendEmail={() => { setPreviewOpen(false); setEmailOpen(true); }}
        pdfLoading={pdfLoading}
      />

      <QuoteEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        clientEmail={clients?.find((c) => c.id === selectedClient)?.email || ""}
        clientName={clients?.find((c) => c.id === selectedClient)?.name}
        companyName={profile?.company_name}
        eventName={event?.name}
        eventDate={event?.date ? new Date(event.date).toLocaleDateString("fr-FR") : undefined}
        totalTTC={totalTTC}
        guestCount={guestCount || undefined}
        onEmailSent={() => setCrmOpen(true)}
      />

      <CrmSaveDialog
        open={crmOpen}
        onClose={() => setCrmOpen(false)}
        onSave={() => { handleSave("sent"); setCrmOpen(false); }}
        saving={createQuote.isPending}
      />
    </div>
  );
};

export default Quotes;
