import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf", fontWeight: "bold" },
  ],
});

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", color: "#312E81" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 4 },
  metaBlock: { marginBottom: 20, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metaLabel: { color: "#6b7280", fontSize: 8 },
  metaValue: { fontWeight: "bold", fontSize: 9 },
  catHeader: { backgroundColor: "#312E81", color: "#fff", padding: 6, borderRadius: 4, marginTop: 12, marginBottom: 4, fontSize: 10, fontWeight: "bold" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 4, marginBottom: 4, fontWeight: "bold", fontSize: 8, color: "#6b7280" },
  row: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderColor: "#f3f4f6" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTva: { flex: 0.8, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right", fontWeight: "bold" },
  catSubtotal: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderColor: "#e5e7eb" },
  summaryBox: { marginTop: 20, padding: 16, backgroundColor: "#f0f0ff", borderRadius: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderColor: "#312E81", fontSize: 14, fontWeight: "bold" },
  depositBox: { marginTop: 12, padding: 10, backgroundColor: "#fff7ed", borderRadius: 6, borderWidth: 1, borderColor: "#fed7aa" },
  notes: { marginTop: 20, padding: 10, backgroundColor: "#f9fafb", borderRadius: 6, fontSize: 8 },
  cgv: { marginTop: 20, fontSize: 7, color: "#9ca3af", lineHeight: 1.4 },
  signatureBlock: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "45%", borderTopWidth: 1, borderColor: "#d1d5db", paddingTop: 8 },
  signatureLabel: { fontSize: 8, color: "#6b7280" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#9ca3af", textAlign: "center" },
});

export interface PdfQuoteItem {
  name: string;
  description?: string;
  category: string;
  qty: number;
  unitPrice: number;
  tva: number;
  pricingType: string;
}

interface Props {
  items: PdfQuoteItem[];
  clientName?: string;
  eventName?: string;
  eventDate?: string;
  guestCount?: number;
  notes?: string;
  companyName?: string;
  depositPercent?: number;
}

const CAT_LABELS: Record<string, string> = {
  restauration: "Restauration",
  boissons: "Boissons",
  boissons_alcool: "Alcools",
  personnel: "Personnel",
  logistique: "Logistique",
  options: "Options",
};

export default function QuotePdfDocument({ items, clientName, eventName, eventDate, guestCount, notes, companyName, depositPercent = 30 }: Props) {
  // Group by category
  const grouped = items.reduce<Record<string, PdfQuoteItem[]>>((acc, item) => {
    const cat = item.category || "options";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // TVA breakdown
  const tvaBreakdown: Record<number, { ht: number; tva: number }> = {};
  let totalHT = 0;

  items.forEach((item) => {
    const lineHT = item.qty * item.unitPrice;
    totalHT += lineHT;
    if (!tvaBreakdown[item.tva]) tvaBreakdown[item.tva] = { ht: 0, tva: 0 };
    tvaBreakdown[item.tva].ht += lineHT;
    tvaBreakdown[item.tva].tva += lineHT * (item.tva / 100);
  });

  const totalTva = Object.values(tvaBreakdown).reduce((s, v) => s + v.tva, 0);
  const totalTTC = totalHT + totalTva;
  const deposit = totalTTC * (depositPercent / 100);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>DEVIS</Text>
            <Text style={s.subtitle}>{companyName || "CaterPilot"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.subtitle}>Date : {new Date().toLocaleDateString("fr-FR")}</Text>
            <Text style={s.subtitle}>Validité : 30 jours</Text>
          </View>
        </View>

        <View style={s.metaBlock}>
          <View style={s.metaRow}>
            <View><Text style={s.metaLabel}>Client</Text><Text style={s.metaValue}>{clientName || "—"}</Text></View>
            <View><Text style={s.metaLabel}>Événement</Text><Text style={s.metaValue}>{eventName || "—"}</Text></View>
          </View>
          <View style={s.metaRow}>
            <View><Text style={s.metaLabel}>Date</Text><Text style={s.metaValue}>{eventDate || "—"}</Text></View>
            <View><Text style={s.metaLabel}>Convives</Text><Text style={s.metaValue}>{guestCount || "—"}</Text></View>
          </View>
        </View>

        {Object.entries(grouped).map(([cat, catItems]) => {
          const catTotal = catItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
          return (
            <View key={cat} wrap={false}>
              <Text style={s.catHeader}>{CAT_LABELS[cat] || cat}</Text>
              <View style={s.tableHeader}>
                <Text style={s.colName}>Désignation</Text>
                <Text style={s.colQty}>Qté</Text>
                <Text style={s.colPrice}>PU HT</Text>
                <Text style={s.colTva}>TVA</Text>
                <Text style={s.colTotal}>Total HT</Text>
              </View>
              {catItems.map((item, i) => (
                <View key={i} style={s.row}>
                  <Text style={s.colName}>{item.name}</Text>
                  <Text style={s.colQty}>{item.qty}</Text>
                  <Text style={s.colPrice}>{fmt(item.unitPrice)} €</Text>
                  <Text style={s.colTva}>{item.tva}%</Text>
                  <Text style={s.colTotal}>{fmt(item.qty * item.unitPrice)} €</Text>
                </View>
              ))}
              <View style={s.catSubtotal}>
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>Sous-total {CAT_LABELS[cat]} : {fmt(catTotal)} €</Text>
              </View>
            </View>
          );
        })}

        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text>Total HT</Text>
            <Text style={{ fontWeight: "bold" }}>{fmt(totalHT)} €</Text>
          </View>
          {Object.entries(tvaBreakdown).map(([rate, { tva }]) => (
            <View key={rate} style={s.summaryRow}>
              <Text>TVA {rate}%</Text>
              <Text>{fmt(tva)} €</Text>
            </View>
          ))}
          <View style={s.summaryTotal}>
            <Text>Total TTC</Text>
            <Text>{fmt(totalTTC)} €</Text>
          </View>
        </View>

        <View style={s.depositBox}>
          <View style={s.summaryRow}>
            <Text style={{ fontWeight: "bold" }}>Acompte à la commande ({depositPercent}%)</Text>
            <Text style={{ fontWeight: "bold" }}>{fmt(deposit)} €</Text>
          </View>
          <Text style={{ fontSize: 7, color: "#92400e" }}>Solde dû le jour de l'événement : {fmt(totalTTC - deposit)} €</Text>
        </View>

        {notes && (
          <View style={s.notes}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Notes</Text>
            <Text>{notes}</Text>
          </View>
        )}

        <View style={s.cgv}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Conditions Générales de Vente</Text>
          <Text>1. Le présent devis est valable 30 jours à compter de sa date d'émission.</Text>
          <Text>2. Un acompte de {depositPercent}% est demandé à la commande. Le solde est dû le jour de la prestation.</Text>
          <Text>3. Toute annulation intervenant moins de 15 jours avant la date de prestation entraîne la facturation de 50% du montant total.</Text>
          <Text>4. Les prix s'entendent hors frais de livraison sauf mention contraire.</Text>
          <Text>5. Les quantités définitives doivent être confirmées au plus tard 7 jours avant l'événement.</Text>
        </View>

        <View style={s.signatureBlock}>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Le prestataire</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>{companyName || "CaterPilot"}</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Le client (bon pour accord)</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Date et signature :</Text>
          </View>
        </View>

        <Text style={s.footer}>{companyName || "CaterPilot"} — Devis généré automatiquement</Text>
      </Page>
    </Document>
  );
}
