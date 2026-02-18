import { useState, useEffect, useCallback } from "react";
import { CheckCircle, ArrowRight, Trophy, Trash2, Search, FileSpreadsheet, Store, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Supplier { id: string; name: string; franco_threshold: number; delivery_info: string | null; }
interface MasterProduct { id: string; name: string; category: string | null; reference_unit: string; }
interface SupplierProduct { id: string; supplier_id: string; master_product_id: string | null; raw_label: string; raw_unit: string | null; current_price: number | null; conversion_factor: number; }
interface ComparisonRow { masterProduct: MasterProduct; prices: { supplierId: string; supplierName: string; normalizedPrice: number; originalPrice: number; rawUnit: string }[]; }

const extractConversionFactor = (label: string): number => {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*(kg|l|g|unité|unite|pce|pièce)/i);
  if (!match) return 1;
  const value = parseFloat(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  if (unit === "g") return value / 1000;
  return value;
};

const CATEGORIES = ["Viandes", "Poissons", "Fruits & Légumes", "Épicerie", "Produits laitiers", "Boissons", "Surgelés", "Autre"];

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [search, setSearch] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", franco_threshold: 0, delivery_info: "" });
  const [newProduct, setNewProduct] = useState({ name: "", category: "", reference_unit: "kg" });
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importData, setImportData] = useState<Record<string, any>[]>([]);
  const [importMapping, setImportMapping] = useState({ label: "", price: "", unit: "" });
  const [importStep, setImportStep] = useState(1);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [s, mp, sp] = await Promise.all([
      supabase.from("suppliers").select("*").eq("user_id", user.id),
      supabase.from("master_products").select("*").eq("user_id", user.id),
      supabase.from("supplier_products").select("*"),
    ]);
    if (s.data) setSuppliers(s.data as Supplier[]);
    if (mp.data) setMasterProducts(mp.data as MasterProduct[]);
    if (sp.data) setSupplierProducts(sp.data as SupplierProduct[]);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addSupplier = async () => {
    if (!user || !newSupplier.name.trim()) return;
    const { error } = await supabase.from("suppliers").insert({ user_id: user.id, name: newSupplier.name, franco_threshold: newSupplier.franco_threshold, delivery_info: newSupplier.delivery_info || null });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fournisseur ajouté" });
    setNewSupplier({ name: "", franco_threshold: 0, delivery_info: "" });
    setShowAddSupplier(false);
    fetchAll();
  };

  const addMasterProduct = async () => {
    if (!user || !newProduct.name.trim()) return;
    const { error } = await supabase.from("master_products").insert({ user_id: user.id, name: newProduct.name, category: newProduct.category || null, reference_unit: newProduct.reference_unit });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produit référence ajouté" });
    setNewProduct({ name: "", category: "", reference_unit: "kg" });
    setShowAddProduct(false);
    fetchAll();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];
      setImportData(json);
      setImportStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const saveImport = async () => {
    if (!importSupplierId || !importMapping.label || !importMapping.price) return;
    const rows = importData.map((row) => ({
      supplier_id: importSupplierId,
      raw_label: String(row[importMapping.label] || ""),
      current_price: parseFloat(row[importMapping.price]) || 0,
      raw_unit: importMapping.unit ? String(row[importMapping.unit] || "") : null,
      conversion_factor: extractConversionFactor(String(row[importMapping.label] || "")),
    }));
    const { error } = await supabase.from("supplier_products").insert(rows);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${rows.length} produits importés !` });
    setImportStep(1);
    setImportData([]);
    fetchAll();
  };

  const comparisonRows: ComparisonRow[] = masterProducts
    .filter((mp) => !search || mp.name.toLowerCase().includes(search.toLowerCase()) || (mp.category || "").toLowerCase().includes(search.toLowerCase()))
    .map((mp) => {
      const prices = supplierProducts
        .filter((sp) => sp.master_product_id === mp.id)
        .map((sp) => {
          const supplier = suppliers.find((s) => s.id === sp.supplier_id);
          const factor = sp.conversion_factor || 1;
          return { supplierId: sp.supplier_id, supplierName: supplier?.name || "?", normalizedPrice: (sp.current_price || 0) / factor, originalPrice: sp.current_price || 0, rawUnit: sp.raw_unit || "" };
        });
      return { masterProduct: mp, prices };
    })
    .filter((r) => r.prices.length > 0);

  const allSupplierIds = [...new Set(supplierProducts.map((sp) => sp.supplier_id))];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Comparaison Fournisseurs</h1>
        <div className="flex gap-2">
          <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Store className="h-4 w-4" /> Fournisseur</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau Fournisseur</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nom</Label><Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} /></div>
                <div><Label>Franco (€)</Label><Input type="number" value={newSupplier.franco_threshold} onChange={(e) => setNewSupplier({ ...newSupplier, franco_threshold: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Infos livraison</Label><Input value={newSupplier.delivery_info} onChange={(e) => setNewSupplier({ ...newSupplier, delivery_info: e.target.value })} /></div>
                <Button onClick={addSupplier} className="w-full">Ajouter</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Package className="h-4 w-4" /> Produit Réf.</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau Produit Référence</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nom</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unité de référence</Label>
                  <Select value={newProduct.reference_unit} onValueChange={(v) => setNewProduct({ ...newProduct, reference_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="unité">Unité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addMasterProduct} className="w-full">Ajouter</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="compare" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compare">Comparateur</TabsTrigger>
          <TabsTrigger value="import">Import Tarifs</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs ({suppliers.length})</TabsTrigger>
          <TabsTrigger value="products">Produits ({masterProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un produit..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {comparisonRows.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="p-12 text-center space-y-4">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Importez des tarifs et associez-les à vos produits référence pour comparer.</p>
            </CardContent></Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead><tr className="bg-foreground text-background">
                  <th className="p-4 text-left font-bold">Produit</th>
                  <th className="p-4 text-center font-bold">Unité</th>
                  {allSupplierIds.map((sid) => <th key={sid} className="p-4 text-center font-bold">{suppliers.find((s) => s.id === sid)?.name}</th>)}
                  <th className="p-4 text-center font-bold">Écart</th>
                </tr></thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const sorted = [...row.prices].sort((a, b) => a.normalizedPrice - b.normalizedPrice);
                    const bestPrice = sorted[0]?.normalizedPrice || 0;
                    const worstPrice = sorted[sorted.length - 1]?.normalizedPrice || 0;
                    const ecart = bestPrice > 0 ? Math.round(((worstPrice - bestPrice) / bestPrice) * 100) : 0;
                    return (
                      <tr key={row.masterProduct.id} className="border-t hover:bg-secondary/50">
                        <td className="p-4"><p className="font-semibold">{row.masterProduct.name}</p>{row.masterProduct.category && <p className="text-xs text-muted-foreground">{row.masterProduct.category}</p>}</td>
                        <td className="p-4 text-center text-muted-foreground italic">{row.masterProduct.reference_unit}</td>
                        {allSupplierIds.map((sid) => {
                          const entry = row.prices.find((p) => p.supplierId === sid);
                          if (!entry) return <td key={sid} className="p-4 text-center text-muted-foreground">—</td>;
                          const isBest = entry.normalizedPrice === bestPrice && row.prices.length > 1;
                          return (<td key={sid} className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold ${isBest ? "bg-emerald-100 text-emerald-700" : ""}`}>
                              {isBest && <Trophy className="h-3.5 w-3.5" />}{entry.normalizedPrice.toFixed(2)} €
                            </span>
                            {entry.rawUnit && <p className="text-xs text-muted-foreground mt-0.5">{entry.originalPrice}€ / {entry.rawUnit}</p>}
                          </td>);
                        })}
                        <td className="p-4 text-center">{row.prices.length > 1 && <span className={`font-bold ${ecart > 10 ? "text-destructive" : "text-muted-foreground"}`}>+{ecart}%</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Importer un fichier tarif</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Fournisseur</Label>
                <Select value={importSupplierId} onValueChange={setImportSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!importSupplierId ? <p className="text-sm text-muted-foreground">Sélectionnez d'abord un fournisseur.</p>
              : importStep === 1 ? (
                <div className="flex flex-col items-center border-2 border-dashed border-muted-foreground/20 p-12 rounded-xl">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Fichier Excel ou CSV</p>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="block w-full max-w-xs text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
              ) : importStep === 2 ? (
                <div className="space-y-4">
                  <h3 className="font-bold">Relier les colonnes</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(["label", "price", "unit"] as const).map((field) => (
                      <div key={field}><Label className="uppercase text-xs">{field === "label" ? "Désignation" : field === "price" ? "Prix" : "Unité"}</Label>
                        <Select value={importMapping[field]} onValueChange={(v) => setImportMapping({ ...importMapping, [field]: v })}>
                          <SelectTrigger><SelectValue placeholder="Colonne..." /></SelectTrigger>
                          <SelectContent>{importData[0] && Object.keys(importData[0]).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setImportStep(3)} disabled={!importMapping.label || !importMapping.price} className="gap-2">Prévisualiser <ArrowRight className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-bold">Aperçu ({importData.length} lignes)</h3><Button variant="ghost" size="sm" onClick={() => { setImportStep(1); setImportData([]); }}><X className="h-4 w-4 mr-1" />Annuler</Button></div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-secondary"><th className="p-3 text-left">Produit</th><th className="p-3 text-right">Prix</th><th className="p-3">Unité</th></tr></thead>
                      <tbody>{importData.slice(0, 8).map((row, i) => <tr key={i} className="border-t"><td className="p-3">{row[importMapping.label]}</td><td className="p-3 text-right font-bold">{row[importMapping.price]} €</td><td className="p-3 text-muted-foreground">{importMapping.unit ? row[importMapping.unit] : "—"}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <Button onClick={saveImport} className="w-full gap-2"><CheckCircle className="h-4 w-4" />Valider ({importData.length} produits)</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {suppliers.length === 0 ? <Card className="rounded-2xl"><CardContent className="p-12 text-center"><p className="text-muted-foreground">Aucun fournisseur.</p></CardContent></Card> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((s) => (
                <Card key={s.id} className="rounded-2xl"><CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-bold text-lg">{s.name}</h3>{s.franco_threshold > 0 && <p className="text-sm text-muted-foreground">Franco : {s.franco_threshold} €</p>}{s.delivery_info && <p className="text-sm text-muted-foreground mt-1">{s.delivery_info}</p>}</div>
                    <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("suppliers").delete().eq("id", s.id); fetchAll(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{supplierProducts.filter((sp) => sp.supplier_id === s.id).length} produit(s)</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {masterProducts.length === 0 ? <Card className="rounded-2xl"><CardContent className="p-12 text-center"><p className="text-muted-foreground">Aucun produit référence.</p></CardContent></Card> : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary"><th className="p-3 text-left">Nom</th><th className="p-3 text-left">Catégorie</th><th className="p-3 text-center">Unité</th><th className="p-3 w-10"></th></tr></thead>
                <tbody>{masterProducts.map((mp) => (
                  <tr key={mp.id} className="border-t hover:bg-secondary/50">
                    <td className="p-3 font-medium">{mp.name}</td><td className="p-3 text-muted-foreground">{mp.category || "—"}</td><td className="p-3 text-center">{mp.reference_unit}</td>
                    <td className="p-3"><Button variant="ghost" size="icon" onClick={async () => { await supabase.from("master_products").delete().eq("id", mp.id); fetchAll(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Suppliers;
