import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, X, Package,
} from "lucide-react";
import { mockStockItems, mockEvents } from "@/data/mockData";
import { cn } from "@/lib/utils";

const getStockStatus = (current: number, threshold: number) => {
  if (current < threshold) return { label: "Critique", color: "bg-destructive/15 text-destructive" };
  if (current < threshold * 1.3) return { label: "Attention", color: "bg-status-quote-sent/15 text-status-quote-sent" };
  return { label: "OK", color: "bg-status-confirmed/15 text-status-confirmed" };
};

const Stock = () => {
  const [showMovement, setShowMovement] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [tab, setTab] = useState<"stock" | "history">("stock");

  const lowStockCount = mockStockItems.filter((s) => s.currentQty < s.minThreshold).length;

  const mockHistory = [
    { id: "1", item: "Serviettes en tissu", type: "OUT" as const, qty: 30, date: "2026-02-15", event: "Brunch Dominical", note: "" },
    { id: "2", item: "Champagne", type: "OUT" as const, qty: 6, date: "2026-02-15", event: "Brunch Dominical", note: "" },
    { id: "3", item: "Assiettes plates 27cm", type: "IN" as const, qty: 50, date: "2026-02-14", event: "", note: "Réapprovisionnement fournisseur" },
    { id: "4", item: "Huile d'olive (5L)", type: "OUT" as const, qty: 1, date: "2026-02-13", event: "", note: "Usage cuisine" },
    { id: "5", item: "Verres à vin", type: "IN" as const, qty: 20, date: "2026-02-12", event: "", note: "Nouveau lot" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-muted-foreground text-sm">Suivez votre inventaire et vos mouvements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="accent" className="gap-2" onClick={() => setShowMovement(true)}>
            <Plus className="h-4 w-4" /> Mouvement
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowAddItem(true)}>
            <Package className="h-4 w-4" /> Nouvel article
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium">
              ⚠️ {lowStockCount} article{lowStockCount > 1 ? "s" : ""} sous le seuil minimum
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        <button
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "stock" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("stock")}
        >
          Inventaire
        </button>
        <button
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "history" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("history")}
        >
          Historique
        </button>
      </div>

      {tab === "stock" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left py-3 px-4 font-medium">Article</th>
                    <th className="text-left py-3 px-4 font-medium">Catégorie</th>
                    <th className="text-right py-3 px-4 font-medium">Quantité</th>
                    <th className="text-left py-3 px-4 font-medium">Unité</th>
                    <th className="text-right py-3 px-4 font-medium">Seuil min.</th>
                    <th className="text-center py-3 px-4 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 font-medium">Maj.</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStockItems.map((item, i) => {
                    const status = getStockStatus(item.currentQty, item.minThreshold);
                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        </td>
                        <td className={cn(
                          "py-3 px-4 text-right font-semibold tabular-nums",
                          item.currentQty < item.minThreshold && "text-destructive"
                        )}>
                          {item.currentQty}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{item.unit}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">{item.minThreshold}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(item.lastUpdated).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Article</th>
                    <th className="text-center py-3 px-4 font-medium">Type</th>
                    <th className="text-right py-3 px-4 font-medium">Quantité</th>
                    <th className="text-left py-3 px-4 font-medium">Événement</th>
                    <th className="text-left py-3 px-4 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHistory.map((h) => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 px-4 font-medium">{h.item}</td>
                      <td className="py-3 px-4 text-center">
                        {h.type === "IN" ? (
                          <span className="inline-flex items-center gap-1 text-status-confirmed text-xs font-medium">
                            <ArrowDownRight className="h-3.5 w-3.5" /> Entrée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-status-in-progress text-xs font-medium">
                            <ArrowUpRight className="h-3.5 w-3.5" /> Sortie
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums">{h.qty}</td>
                      <td className="py-3 px-4 text-muted-foreground">{h.event || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{h.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement modal */}
      {showMovement && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMovement(false)}>
          <Card className="w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nouveau mouvement</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowMovement(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Article</Label>
                <select className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {mockStockItems.map((s) => <option key={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <div className="flex gap-2 mt-1">
                  {["Entrée", "Sortie", "Ajustement"].map((t) => (
                    <Button key={t} variant="outline" size="sm">{t}</Button>
                  ))}
                </div>
              </div>
              <div><Label>Quantité</Label><Input type="number" placeholder="0" className="mt-1" /></div>
              <div>
                <Label>Événement lié (optionnel)</Label>
                <select className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">— Aucun —</option>
                  {mockEvents.map((e) => <option key={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div><Label>Note</Label><Input placeholder="Optionnel…" className="mt-1" /></div>
              <Button variant="accent" className="w-full">Enregistrer</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddItem(false)}>
          <Card className="w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nouvel article</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddItem(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom</Label><Input placeholder="Ex: Serviettes en tissu" className="mt-1" /></div>
              <div><Label>Catégorie</Label><Input placeholder="Linge, Vaisselle, etc." className="mt-1" /></div>
              <div><Label>Unité</Label><Input placeholder="pièces, litres, kg…" className="mt-1" /></div>
              <div><Label>Quantité initiale</Label><Input type="number" placeholder="0" className="mt-1" /></div>
              <div><Label>Seuil minimum</Label><Input type="number" placeholder="0" className="mt-1" /></div>
              <Button variant="accent" className="w-full">Ajouter</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stock;
