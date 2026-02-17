import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Lightbulb, FileDown, Link2, Save, Users, Calendar } from "lucide-react";
import { mockClients, mockEvents, type QuoteItem } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const tvaOptions = [
  { label: "5,5%", value: 5.5 },
  { label: "10%", value: 10 },
  { label: "20%", value: 20 },
];

const Quotes = () => {
  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", name: "Menu cocktail dinatoire", qty: 1, unitPrice: 45 },
    { id: "2", name: "Personnel de service (h)", qty: 8, unitPrice: 18 },
  ]);
  const [tva, setTva] = useState(20);
  const [selectedClient, setSelectedClient] = useState("1");
  const [selectedEvent, setSelectedEvent] = useState("3");
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tvaAmount = subtotal * (tva / 100);
  const totalTTC = subtotal + tvaAmount;

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const event = mockEvents.find((e) => e.id === selectedEvent);

  // Upsell suggestions
  const suggestions: { condition: boolean; text: string; price: string; addItem: QuoteItem }[] = [
    {
      condition: !!event && event.guestCount > 50,
      text: "Ajouter 1 serveur supplémentaire",
      price: "+180 €",
      addItem: { id: Date.now().toString() + "a", name: "Serveur supplémentaire", qty: 1, unitPrice: 180 },
    },
    {
      condition: !!event && event.type === "wedding",
      text: "Cocktail champagne de bienvenue",
      price: `+${event ? event.guestCount * 8 : 0} €`,
      addItem: { id: Date.now().toString() + "b", name: "Cocktail champagne", qty: event?.guestCount || 1, unitPrice: 8 },
    },
    {
      condition: !!event && new Date(event.date).getDay() >= 5,
      text: "Supplément week-end",
      price: "+250 €",
      addItem: { id: Date.now().toString() + "c", name: "Supplément week-end", qty: 1, unitPrice: 250 },
    },
  ];

  const activeSuggestions = suggestions.filter((s) => s.condition);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Devis Express</h1>
        <p className="text-muted-foreground text-sm">Créez et envoyez un devis en quelques minutes</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Quote form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & event */}
          <Card>
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <select
                  className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  {mockClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Événement lié</Label>
                <select
                  className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">— Aucun —</option>
                  {mockEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lignes du devis</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Désignation</th>
                      <th className="text-right py-2 font-medium w-20">Qté</th>
                      <th className="text-right py-2 font-medium w-28">Prix unit.</th>
                      <th className="text-right py-2 font-medium w-28">Sous-total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            placeholder="Nom du service…"
                            className="h-9"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                            className="h-9 text-right"
                            min={1}
                          />
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                            className="h-9 text-right"
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums">
                          {(item.qty * item.unitPrice).toLocaleString("fr-FR")} €
                        </td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </Button>

              {/* Totals */}
              <div className="mt-4 border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium tabular-nums">{subtotal.toLocaleString("fr-FR")} €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">TVA</span>
                    <div className="flex gap-1">
                      {tvaOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTva(opt.value)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                            tva === opt.value
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="font-medium tabular-nums">{tvaAmount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total TTC</span>
                  <span className="tabular-nums">{totalTTC.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-5">
              <Label className="text-sm font-medium">Notes (affichées sur le PDF)</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Conditions particulières, détails de prestation…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" className="gap-2">
              <FileDown className="h-4 w-4" /> Générer PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText("https://caterpilot.app/q/abc123");
                toast({ title: "Lien copié !", description: "Le lien du devis a été copié dans le presse-papier." });
              }}
            >
              <Link2 className="h-4 w-4" /> Envoyer par lien
            </Button>
            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" /> Sauvegarder brouillon
            </Button>
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="space-y-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                Suggestions d'upsell
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un événement pour voir les suggestions personnalisées.
                </p>
              ) : (
                activeSuggestions.map((s, i) => (
                  <div key={i} className="bg-card rounded-lg p-3 border border-accent/20 space-y-2">
                    <p className="text-sm font-medium">{s.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-accent font-semibold">{s.price}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs border-accent/30 hover:bg-accent/10"
                        onClick={() => setItems([...items, { ...s.addItem, id: Date.now().toString() }])}
                      >
                        <Plus className="h-3 w-3" /> Ajouter
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Event summary */}
          {event && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Événement lié</p>
                <h3 className="font-semibold">{event.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{new Date(event.date).toLocaleDateString("fr-FR")}</p>
                  <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{event.guestCount} convives</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quotes;
