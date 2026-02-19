import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package } from "lucide-react";
import { useCatalogItems, CATALOG_CATEGORIES, PRICING_TYPES, type CatalogItem } from "@/hooks/useCatalog";
import { cn } from "@/lib/utils";

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
  guestCount: number;
}

export default function CatalogModal({ open, onClose, onSelect, guestCount }: CatalogModalProps) {
  const { data: items, isLoading } = useCatalogItems();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = (items ?? []).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const getPricingLabel = (type: string) => PRICING_TYPES.find((p) => p.value === type)?.label ?? type;

  const getDisplayQty = (item: CatalogItem) => {
    if (item.pricing_type === "per_person") return guestCount || 1;
    return 1;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Catalogue de prestations
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une prestation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Tout
          </button>
          {CATALOG_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                activeCategory === cat.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune prestation trouvée. Ajoutez-en depuis le catalogue.</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {CATALOG_CATEGORIES.find((c) => c.value === item.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{item.sale_price.toFixed(2)} € / {item.unit ?? "unité"}</span>
                    <span>•</span>
                    <span>{getPricingLabel(item.pricing_type)}</span>
                    <span>•</span>
                    <span>TVA {item.default_tva}%</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onSelect(item)}
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
