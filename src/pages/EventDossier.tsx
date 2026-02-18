import { useState, useEffect } from "react";
import { User, ShieldCheck, Printer, Edit3, Save, FileText, Users, Truck, TrendingUp, UtensilsCrossed, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type View = "client" | "manager";

interface QuoteItem {
  name: string;
  qty: number;
  unitPrice: number;
}

const EventDossier = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>("client");
  const [isEditing, setIsEditing] = useState(false);

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);

  // Editable fields
  const [menuDescription, setMenuDescription] = useState("");
  const [logistics, setLogistics] = useState("");
  const [allergies, setAllergies] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [ambiance, setAmbiance] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("events")
      .select("id, name, date, time, venue, guest_count, notes, status, type, client_id, end_date")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .then(({ data }) => { if (data) setEvents(data); });
  }, [user]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      setQuote(null);
      setStaff([]);
      setClient(null);
      return;
    }
    const ev = events.find((e) => e.id === selectedEventId);
    setSelectedEvent(ev);
    if (!ev) return;

    // Fetch quote
    supabase
      .from("quotes")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const q = data?.[0] || null;
        setQuote(q);
        if (q) {
          const items = (q.items as unknown as QuoteItem[]) || [];
          const desc = items.map((it) => `• ${it.name} (x${it.qty})`).join("\n");
          setMenuDescription(desc || "Menu à définir.");
        } else {
          setMenuDescription("Aucun devis associé à cet événement.");
        }
      });

    // Fetch staff
    supabase
      .from("event_staff")
      .select("*, team_members(name, role, phone)")
      .eq("event_id", selectedEventId)
      .then(({ data }) => { if (data) setStaff(data); });

    // Fetch client
    if (ev.client_id) {
      supabase.from("clients").select("*").eq("id", ev.client_id).single()
        .then(({ data }) => { if (data) setClient(data); });
    } else {
      setClient(null);
    }

    setLogistics(ev.notes || "");
    setAllergies("");
    setStaffNotes("");
    setAmbiance("Ambiance élégante et raffinée.");
  }, [selectedEventId, events]);

  const quoteItems: QuoteItem[] = quote ? (quote.items as unknown as QuoteItem[]) || [] : [];
  const subtotal = quote?.subtotal || 0;
  const tvaRate = quote?.tva_rate || 20;
  const totalTtc = quote?.total_ttc || 0;
  const margin = subtotal > 0 ? Math.round((subtotal * 0.3 / subtotal) * 100) : 0;

  const formatDate = (d: string) => {
    try { return format(new Date(d), "EEEE d MMMM yyyy", { locale: fr }); }
    catch { return d; }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="no-print space-y-4">
        <h1 className="text-2xl font-bold">Dossier Événement</h1>
        <p className="text-muted-foreground text-sm">Générez un résumé complet de votre événement. Basculez entre la vue Client (présentation élégante) et la vue Gérant (finances, logistique, staff). Modifiable et imprimable.</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setIsEditing(false); }}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Sélectionner un événement" />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>{ev.name} — {ev.date}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEvent && (
            <>
              {/* View toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => { setView("client"); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    view === "client" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <User className="h-4 w-4" /> Client
                </button>
                <button
                  onClick={() => { setView("manager"); setIsEditing(false); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    view === "manager" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" /> Gérant
                </button>
              </div>

              <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="gap-2">
                {isEditing ? <><Save className="h-4 w-4" /> Valider</> : <><Edit3 className="h-4 w-4" /> Modifier</>}
              </Button>
              <Button onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimer PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedEvent ? (
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour générer le dossier.</p>
        </div>
      ) : view === "client" ? (
        /* ============ VUE CLIENT ============ */
        <div className="printable-area bg-white text-black min-h-[800px] shadow-lg rounded-xl overflow-hidden">
          {/* Hero header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-10">
            <p className="text-sm uppercase tracking-[0.3em] font-medium opacity-70 mb-2">Votre réception</p>
            <h1 className="text-4xl font-black mb-2">{selectedEvent.name}</h1>
            <p className="text-lg opacity-80 capitalize">{formatDate(selectedEvent.date)}</p>
            {selectedEvent.venue && (
              <p className="flex items-center gap-2 mt-3 opacity-70"><MapPin className="h-4 w-4" />{selectedEvent.venue}</p>
            )}
          </div>

          <div className="p-10 space-y-10">
            {/* Infos clés */}
            <div className="grid grid-cols-3 gap-6 text-center">
              {selectedEvent.guest_count > 0 && (
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-3xl font-black">{selectedEvent.guest_count}</p>
                  <p className="text-sm text-slate-500 font-medium">Convives</p>
                </div>
              )}
              {selectedEvent.time && (
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-3xl font-black">{selectedEvent.time}</p>
                  <p className="text-sm text-slate-500 font-medium">Heure de début</p>
                </div>
              )}
              {totalTtc > 0 && (
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-3xl font-black">{totalTtc.toLocaleString("fr-FR")} €</p>
                  <p className="text-sm text-slate-500 font-medium">Total TTC</p>
                </div>
              )}
            </div>

            {/* Menu / expérience */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight mb-4">
                <UtensilsCrossed className="h-5 w-5" /> L'Expérience Gastronomique
              </h2>
              {isEditing ? (
                <Textarea className="min-h-[150px] text-base" value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} />
              ) : (
                <div className="whitespace-pre-line leading-relaxed text-slate-700 text-lg">{menuDescription}</div>
              )}
            </section>

            {/* Ambiance */}
            <section>
              <h2 className="text-xl font-black uppercase tracking-tight mb-4">Ambiance & Style</h2>
              {isEditing ? (
                <Textarea className="min-h-[80px] text-base" value={ambiance} onChange={(e) => setAmbiance(e.target.value)} />
              ) : (
                <p className="text-slate-700 text-lg leading-relaxed">{ambiance}</p>
              )}
            </section>

            {/* Footer */}
            <div className="border-t pt-6 text-center">
              <p className="text-sm text-slate-400">Document préparé avec soin par votre traiteur • CaterPilot</p>
            </div>
          </div>
        </div>
      ) : (
        /* ============ VUE GÉRANT ============ */
        <div className="printable-area bg-white text-black min-h-[800px] shadow-lg rounded-xl overflow-hidden">
          {/* Header gérant */}
          <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-50 mb-1">Fiche de pilotage</p>
              <h1 className="text-3xl font-black uppercase tracking-tight">{selectedEvent.name}</h1>
              <p className="opacity-60 mt-1">{formatDate(selectedEvent.date)} {selectedEvent.time && `• ${selectedEvent.time}`}</p>
            </div>
            {subtotal > 0 && (
              <div className="text-right">
                <span className="inline-block bg-emerald-500 px-4 py-1.5 rounded-full text-sm font-bold">
                  Marge estimée : ~{margin}%
                </span>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-2 border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{selectedEvent.guest_count || "—"}</p>
                <p className="text-xs uppercase font-bold text-slate-400">Couverts</p>
              </div>
              <div className="border-2 border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{subtotal > 0 ? `${subtotal.toLocaleString("fr-FR")} €` : "—"}</p>
                <p className="text-xs uppercase font-bold text-slate-400">Sous-total HT</p>
              </div>
              <div className="border-2 border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{totalTtc > 0 ? `${totalTtc.toLocaleString("fr-FR")} €` : "—"}</p>
                <p className="text-xs uppercase font-bold text-slate-400">Total TTC</p>
              </div>
              <div className="border-2 border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{staff.length}</p>
                <p className="text-xs uppercase font-bold text-slate-400">Staff assigné</p>
              </div>
            </div>

            {/* Détail devis */}
            {quoteItems.length > 0 && (
              <section>
                <h3 className="font-black text-sm uppercase text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Détail du Devis
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-left">
                      <th className="pb-2 font-bold">Désignation</th>
                      <th className="pb-2 font-bold text-center">Qté</th>
                      <th className="pb-2 font-bold text-right">P.U.</th>
                      <th className="pb-2 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-center">{item.qty}</td>
                        <td className="py-2 text-right">{item.unitPrice?.toLocaleString("fr-FR")} €</td>
                        <td className="py-2 text-right font-bold">{((item.qty || 0) * (item.unitPrice || 0)).toLocaleString("fr-FR")} €</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300">
                      <td colSpan={3} className="pt-2 text-right font-bold">Sous-total HT</td>
                      <td className="pt-2 text-right font-black">{subtotal.toLocaleString("fr-FR")} €</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right font-bold">TVA ({tvaRate}%)</td>
                      <td className="text-right font-bold">{(totalTtc - subtotal).toLocaleString("fr-FR")} €</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan={3} className="text-right font-black">Total TTC</td>
                      <td className="text-right font-black">{totalTtc.toLocaleString("fr-FR")} €</td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            )}

            {/* Logistique */}
            <section>
              <h3 className="font-black text-sm uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Logistique & Accès
              </h3>
              <div className="bg-slate-50 border rounded-xl p-4">
                {isEditing ? (
                  <Textarea className="min-h-[100px]" value={logistics} onChange={(e) => setLogistics(e.target.value)} />
                ) : (
                  <p className="font-medium whitespace-pre-line">{logistics || "Aucune note logistique."}</p>
                )}
              </div>
            </section>

            {/* Allergies */}
            <section>
              <h3 className="font-black text-sm uppercase text-slate-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Allergies & Régimes Spéciaux
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                {isEditing ? (
                  <Textarea className="min-h-[80px]" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                ) : (
                  <p className="font-medium whitespace-pre-line">{allergies || "Aucune allergie signalée."}</p>
                )}
              </div>
            </section>

            {/* Staff */}
            <section>
              <h3 className="font-black text-sm uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Équipe Assignée ({staff.length})
              </h3>
              {staff.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {staff.map((s) => (
                    <div key={s.id} className="bg-slate-50 border rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{(s.team_members as any)?.name}</p>
                        <p className="text-xs text-slate-500">{(s.team_members as any)?.role} • {s.confirmation_status}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        s.confirmation_status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        s.confirmation_status === "declined" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {s.confirmation_status === "confirmed" ? "Confirmé" : s.confirmation_status === "declined" ? "Décliné" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">Aucun staff assigné à cet événement.</p>
              )}
              {isEditing && (
                <div className="mt-3">
                  <Textarea placeholder="Notes staff supplémentaires..." value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} />
                </div>
              )}
            </section>

            {/* Client info */}
            {client && (
              <section className="bg-slate-50 border rounded-xl p-4">
                <h3 className="font-black text-sm uppercase text-slate-400 mb-2">Client</h3>
                <p className="font-bold">{client.name}</p>
                {client.email && <p className="text-sm text-slate-500">{client.email}</p>}
                {client.phone && <p className="text-sm text-slate-500">{client.phone}</p>}
              </section>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Fiche gérant — CaterPilot • Confidentiel</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDossier;
