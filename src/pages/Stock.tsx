import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, X, Package } from "lucide-react";
import { useStockItems, useStockMovements, useCreateStockItem, useCreateStockMovement, useEvents } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";

const getStockStatus = (current: number, threshold: number) => {
  if (current < threshold) return { label: "Critique", color: "bg-destructive/12 text-destructive" };
  if (current < threshold * 1.3) return { label: "Attention", color: "bg-status-quote-sent/12 text-status-quote-sent" };
  return { label: "OK", color: "bg-status-confirmed/12 text-status-confirmed" };
};

const Stock = () => {
  const [showMovement, setShowMovement] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [movementType, setMovementType] = useState("in");
  const [movementData, setMovementData] = useState({ stock_item_id: "", qty: 0, event_id: "", note: "" });
  const [newItem, setNewItem] = useState({ name: "", category: "", unit: "", current_qty: 0, min_threshold: 0 });

  const { data: stockItems, isLoading } = useStockItems();
  const { data: movements } = useStockMovements();
  const { data: events } = useEvents();
  const createItem = useCreateStockItem();
  const createMovement = useCreateStockMovement();

  const lowStockCount = stockItems?.filter((s) => (s.current_qty || 0) < (s.min_threshold || 0)).length || 0;

  const handleAddItem = () => {
    if (!newItem.name) return;
    createItem.mutate(newItem, { onSuccess: () => { setShowAddItem(false); setNewItem({ name: "", category: "", unit: "", current_qty: 0, min_threshold: 0 }); } });
  };

  const handleMovement = () => {
    if (!movementData.stock_item_id || !movementData.qty) return;
    createMovement.mutate({
      stock_item_id: movementData.stock_item_id, movement_type: movementType,
      qty: movementData.qty, event_id: movementData.event_id || null, note: movementData.note || null,
    }, { onSuccess: () => { setShowMovement(false); setMovementData({ stock_item_id: "", qty: 0, event_id: "", note: "" }); } });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Stock</h1><p className="text-muted-foreground text-sm">Suivez votre inventaire et vos mouvements</p></div>
        <div className="flex gap-2">
          <Button variant="accent" className="gap-2" onClick={() => setShowMovement(true)}><Plus className="h-4 w-4" /> Mouvement</Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowAddItem(true)}><Package className="h-4 w-4" /> Nouvel article</Button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 rounded-2xl"><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive shrink-0" /><p className="text-sm font-medium">⚠️ {lowStockCount} article{lowStockCount > 1 ? "s" : ""} sous le seuil minimum</p></CardContent></Card>
      )}

      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        <button className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", tab === "stock" ? "bg-card shadow-sm" : "text-muted-foreground")} onClick={() => setTab("stock")}>Inventaire</button>
        <button className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", tab === "history" ? "bg-card shadow-sm" : "text-muted-foreground")} onClick={() => setTab("history")}>Historique</button>
      </div>

      {tab === "stock" ? (
        (!stockItems || stockItems.length === 0) ? (
          <Card className="p-8 text-center rounded-2xl"><p className="text-muted-foreground">Aucun article en stock. Ajoutez votre premier article !</p></Card>
        ) : (
          <Card className="rounded-2xl"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b bg-secondary/50"><th className="text-left py-3 px-4 font-medium">Article</th><th className="text-left py-3 px-4 font-medium">Catégorie</th><th className="text-right py-3 px-4 font-medium">Quantité</th><th className="text-left py-3 px-4 font-medium">Unité</th><th className="text-right py-3 px-4 font-medium">Seuil min.</th><th className="text-center py-3 px-4 font-medium">Statut</th></tr></thead>
            <tbody>{stockItems.map((item, i) => {
              const status = getStockStatus(item.current_qty || 0, item.min_threshold || 0);
              return (
                <tr key={item.id} className="border-b last:border-0 hover:bg-primary/3 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{item.category}</Badge></td>
                  <td className={cn("py-3 px-4 text-right font-semibold tabular-nums", (item.current_qty || 0) < (item.min_threshold || 0) && "text-destructive")}>{item.current_qty}</td>
                  <td className="py-3 px-4 text-muted-foreground">{item.unit}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">{item.min_threshold}</td>
                  <td className="py-3 px-4 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>{status.label}</span></td>
                </tr>
              );
            })}</tbody>
          </table></div></CardContent></Card>
        )
      ) : (
        <Card className="rounded-2xl"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b bg-secondary/50"><th className="text-left py-3 px-4 font-medium">Date</th><th className="text-left py-3 px-4 font-medium">Article</th><th className="text-center py-3 px-4 font-medium">Type</th><th className="text-right py-3 px-4 font-medium">Quantité</th><th className="text-left py-3 px-4 font-medium">Événement</th><th className="text-left py-3 px-4 font-medium">Note</th></tr></thead>
          <tbody>{(!movements || movements.length === 0) ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucun mouvement enregistré</td></tr> : movements.map((h) => (
            <tr key={h.id} className="border-b last:border-0 hover:bg-primary/3 transition-colors">
              <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(h.created_at).toLocaleDateString("fr-FR")}</td>
              <td className="py-3 px-4 font-medium">{(h as any).stock_items?.name || "—"}</td>
              <td className="py-3 px-4 text-center">{h.movement_type === "in" ? <span className="inline-flex items-center gap-1 text-status-confirmed text-xs font-medium"><ArrowDownRight className="h-3.5 w-3.5" /> Entrée</span> : h.movement_type === "out" ? <span className="inline-flex items-center gap-1 text-status-in-progress text-xs font-medium"><ArrowUpRight className="h-3.5 w-3.5" /> Sortie</span> : <span className="text-xs font-medium">Ajustement</span>}</td>
              <td className="py-3 px-4 text-right font-medium tabular-nums">{h.qty}</td>
              <td className="py-3 px-4 text-muted-foreground">{(h as any).events?.name || "—"}</td>
              <td className="py-3 px-4 text-muted-foreground">{h.note || "—"}</td>
            </tr>
          ))}</tbody>
        </table></div></CardContent></Card>
      )}

      {/* Movement modal */}
      {showMovement && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMovement(false)}>
          <Card className="w-full max-w-md animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Nouveau mouvement</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowMovement(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Article *</Label><select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={movementData.stock_item_id} onChange={(e) => setMovementData({ ...movementData, stock_item_id: e.target.value })}><option value="">— Choisir —</option>{stockItems?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><Label>Type</Label><div className="flex gap-2 mt-1">{[{ k: "in", l: "Entrée" }, { k: "out", l: "Sortie" }, { k: "adjustment", l: "Ajustement" }].map((t) => <Button key={t.k} variant={movementType === t.k ? "accent" : "outline"} size="sm" onClick={() => setMovementType(t.k)}>{t.l}</Button>)}</div></div>
              <div><Label>Quantité *</Label><Input type="number" value={movementData.qty} onChange={(e) => setMovementData({ ...movementData, qty: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Événement lié</Label><select className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-muted/30 text-sm" value={movementData.event_id} onChange={(e) => setMovementData({ ...movementData, event_id: e.target.value })}><option value="">— Aucun —</option>{events?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              <div><Label>Note</Label><Input value={movementData.note} onChange={(e) => setMovementData({ ...movementData, note: e.target.value })} placeholder="Optionnel…" className="mt-1" /></div>
              <Button variant="accent" className="w-full" onClick={handleMovement} disabled={createMovement.isPending}>{createMovement.isPending ? "Enregistrement..." : "Enregistrer"}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddItem(false)}>
          <Card className="w-full max-w-md animate-fade-in rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Nouvel article</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowAddItem(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom *</Label><Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Serviettes en tissu" className="mt-1" /></div>
              <div><Label>Catégorie</Label><Input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Linge, Vaisselle…" className="mt-1" /></div>
              <div><Label>Unité</Label><Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="pièces, litres…" className="mt-1" /></div>
              <div><Label>Quantité initiale</Label><Input type="number" value={newItem.current_qty} onChange={(e) => setNewItem({ ...newItem, current_qty: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Seuil minimum</Label><Input type="number" value={newItem.min_threshold} onChange={(e) => setNewItem({ ...newItem, min_threshold: Number(e.target.value) })} className="mt-1" /></div>
              <Button variant="accent" className="w-full" onClick={handleAddItem} disabled={createItem.isPending}>{createItem.isPending ? "Ajout..." : "Ajouter"}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stock;
