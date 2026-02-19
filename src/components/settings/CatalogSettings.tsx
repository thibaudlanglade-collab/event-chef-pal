import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { useCatalogItems, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem, CATALOG_CATEGORIES, PRICING_TYPES, type CatalogItem } from "@/hooks/useCatalog";
import { cn } from "@/lib/utils";

const emptyCatalogForm = {
  name: "",
  description: "",
  category: "restauration",
  pricing_type: "quantity",
  internal_cost: 0,
  margin_percent: 30,
  default_tva: 10,
  unit: "unité",
};

export default function CatalogSettings() {
  const { data: items, isLoading } = useCatalogItems();
  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const deleteItem = useDeleteCatalogItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCatalogForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCatalogForm);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      pricing_type: item.pricing_type,
      internal_cost: item.internal_cost,
      margin_percent: item.margin_percent,
      default_tva: item.default_tva,
      unit: item.unit ?? "unité",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateItem.mutate({ id: editingId, ...form } as any, { onSuccess: () => setDialogOpen(false) });
    } else {
      createItem.mutate(form as any, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id, { onSuccess: () => setDeleteConfirm(null) });
  };

  const salePrice = form.internal_cost * (1 + form.margin_percent / 100);

  // Group items by category
  const grouped = (items ?? []).reduce<Record<string, CatalogItem[]>>((acc, item) => {
    const cat = item.category || "options";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const getCatLabel = (cat: string) => CATALOG_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const getPricingLabel = (type: string) => PRICING_TYPES.find((p) => p.value === type)?.label ?? type;

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Catalogue de prestations</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune prestation dans le catalogue. Cliquez sur "Ajouter" pour commencer.</p>
        ) : (
          CATALOG_CATEGORIES.map((cat) => {
            const catItems = grouped[cat.value];
            if (!catItems?.length) return null;
            return (
              <div key={cat.value}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-semibold">{cat.label}</Badge>
                  <span className="text-xs text-muted-foreground">{catItems.length} prestation{catItems.length > 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-1.5">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <span className="text-xs text-muted-foreground">({getPricingLabel(item.pricing_type)})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>Coût: {item.internal_cost.toFixed(2)} €</span>
                          <span>•</span>
                          <span>Marge: {item.margin_percent}%</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">Vente: {item.sale_price.toFixed(2)} € / {item.unit}</span>
                          <span>•</span>
                          <span>TVA {item.default_tva}%</span>
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier la prestation" : "Nouvelle prestation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cocktail dinatoire" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description affichée sur le PDF…" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <select value={form.category} onChange={(e) => {
                  const cat = CATALOG_CATEGORIES.find((c) => c.value === e.target.value);
                  setForm({ ...form, category: e.target.value, default_tva: cat?.defaultTva ?? 20 });
                }} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  {CATALOG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Type de tarification</Label>
                <select value={form.pricing_type} onChange={(e) => setForm({ ...form, pricing_type: e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  {PRICING_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Coût interne (€)</Label>
                <Input type="number" min={0} step={0.01} value={form.internal_cost} onChange={(e) => setForm({ ...form, internal_cost: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Marge (%)</Label>
                <Input type="number" min={0} step={1} value={form.margin_percent} onChange={(e) => setForm({ ...form, margin_percent: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Prix de vente</Label>
                <div className="mt-1 h-10 px-3 rounded-lg border border-input bg-muted/50 flex items-center text-sm font-semibold tabular-nums">
                  {salePrice.toFixed(2)} €
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>TVA par défaut</Label>
                <select value={form.default_tva} onChange={(e) => setForm({ ...form, default_tva: Number(e.target.value) })} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  <option value={5.5}>5,5%</option>
                  <option value={10}>10%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
              <div>
                <Label>Unité</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="unité, heure, personne…" className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Enregistrement…" : editingId ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer cette prestation ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. La prestation sera retirée du catalogue.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteItem.isPending}>
              {deleteItem.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
