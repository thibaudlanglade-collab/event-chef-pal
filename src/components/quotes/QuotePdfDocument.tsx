import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf", fontWeight: "bold" },
  ],
});

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  headerLeft: {},
  headerRight: { alignItems: "flex-end" },
  title: { fontSize: 24, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" },
  companyName: { fontSize: 11, fontWeight: "bold", marginTop: 2 },
  companyDetail: { fontSize: 8, color: "#666", marginTop: 1 },
  logo: { width: 80, height: 40, objectFit: "contain" },
  // Divider
  divider: { borderBottomWidth: 1, borderColor: "#e0e0e0", marginVertical: 12 },
  dividerBold: { borderBottomWidth: 2, borderColor: "#1a1a1a", marginVertical: 12 },
  // Meta
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metaBlock: {},
  metaLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 9, fontWeight: "bold", marginTop: 2 },
  // Client box
  clientBox: { backgroundColor: "#f7f7f7", padding: 12, borderRadius: 4, marginBottom: 16 },
  clientLabel: { fontSize: 7, color: "#999", textTransform: "uppercase", fontWeight: "bold", letterSpacing: 1 },
  clientName: { fontSize: 10, fontWeight: "bold", marginTop: 4 },
  // Table
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderColor: "#1a1a1a", paddingBottom: 4, marginBottom: 6, fontWeight: "bold", fontSize: 7, textTransform: "uppercase", color: "#999", letterSpacing: 0.5 },
  row: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderColor: "#eee" },
  rowAlt: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderColor: "#eee", backgroundColor: "#fafafa" },
  colDesc: { flex: 3.5 },
  colQty: { flex: 0.8, textAlign: "center" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colAmount: { flex: 1.2, textAlign: "right", fontWeight: "bold" },
  itemName: { fontSize: 9 },
  itemSub: { fontSize: 7, color: "#888", marginTop: 1 },
  // Category
  catHeader: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: "#1a1a1a", marginTop: 14, marginBottom: 4, paddingBottom: 3, borderBottomWidth: 1, borderColor: "#ddd" },
  // Summary
  summaryBox: { marginTop: 16, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 3, width: 220 },
  summaryLabel: { flex: 1, textAlign: "right", fontSize: 8, color: "#666", paddingRight: 12 },
  summaryValue: { width: 80, textAlign: "right", fontSize: 9 },
  summaryTotalRow: { flexDirection: "row", justifyContent: "flex-end", width: 220, paddingTop: 6, marginTop: 4, borderTopWidth: 2, borderColor: "#1a1a1a" },
  summaryTotalLabel: { flex: 1, textAlign: "right", fontSize: 11, fontWeight: "bold", paddingRight: 12 },
  summaryTotalValue: { width: 80, textAlign: "right", fontSize: 11, fontWeight: "bold" },
  // Discount
  discountRow: { flexDirection: "row", justifyContent: "flex-end", width: 220, marginBottom: 3 },
  discountLabel: { flex: 1, textAlign: "right", fontSize: 8, color: "#c0392b", paddingRight: 12 },
  discountValue: { width: 80, textAlign: "right", fontSize: 9, color: "#c0392b" },
  // Deposit
  depositBox: { marginTop: 10, padding: 10, backgroundColor: "#fff8f0", borderRadius: 4, borderWidth: 1, borderColor: "#fde1c3" },
  // Notes
  notesBox: { marginTop: 16, padding: 10, backgroundColor: "#f7f7f7", borderRadius: 4 },
  notesTitle: { fontSize: 8, fontWeight: "bold", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  // CGV
  cgv: { marginTop: 16, fontSize: 7, color: "#aaa", lineHeight: 1.5 },
  // Signature
  signatureBlock: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "45%", borderTopWidth: 1, borderColor: "#ccc", paddingTop: 8 },
  signatureLabel: { fontSize: 7, color: "#999", textTransform: "uppercase" },
  // Footer
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#bbb", textAlign: "center", borderTopWidth: 0.5, borderColor: "#eee", paddingTop: 6 },
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

export interface CompanyInfo {
  companyName?: string;
  address?: string;
  siret?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  quoteValidityDays?: number;
}

interface Props {
  items: PdfQuoteItem[];
  clientName?: string;
  eventName?: string;
  eventDate?: string;
  guestCount?: number;
  notes?: string;
  depositPercent?: number;
  discountPercent?: number;
  company?: CompanyInfo;
}

const CAT_LABELS: Record<string, string> = {
  restauration: "Restauration",
  boissons: "Boissons",
  boissons_alcool: "Alcools",
  personnel: "Personnel",
  logistique: "Logistique",
  options: "Options",
};

export default function QuotePdfDocument({
  items, clientName, eventName, eventDate, guestCount, notes,
  depositPercent = 30, discountPercent = 0, company = {},
}: Props) {
  const { companyName, address, siret, phone, email, logoUrl, quoteValidityDays = 30 } = company;
  const displayName = companyName || "CaterPilot";
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + quoteValidityDays);

  // Group by category
  const grouped = items.reduce<Record<string, PdfQuoteItem[]>>((acc, item) => {
    const cat = item.category || "options";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calculations
  let totalHT = 0;
  const tvaBreakdown: Record<number, { ht: number; tva: number }> = {};
  items.forEach((item) => {
    const lineHT = item.qty * item.unitPrice;
    totalHT += lineHT;
    if (!tvaBreakdown[item.tva]) tvaBreakdown[item.tva] = { ht: 0, tva: 0 };
    tvaBreakdown[item.tva].ht += lineHT;
    tvaBreakdown[item.tva].tva += lineHT * (item.tva / 100);
  });

  const discountAmount = totalHT * (discountPercent / 100);
  const totalHTAfterDiscount = totalHT - discountAmount;

  // Recalculate TVA on discounted amount
  const totalTva = Object.values(tvaBreakdown).reduce((s, v) => s + v.tva, 0) * (1 - discountPercent / 100);
  const totalTTC = totalHTAfterDiscount + totalTva;
  const deposit = totalTTC * (depositPercent / 100);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const quoteNumber = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ─── HEADER ─── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.title}>DEVIS</Text>
            <Text style={s.companyName}>{displayName}</Text>
            {address ? <Text style={s.companyDetail}>{address}</Text> : null}
            {siret ? <Text style={s.companyDetail}>SIRET : {siret}</Text> : null}
            {phone ? <Text style={s.companyDetail}>Tél : {phone}</Text> : null}
            {email ? <Text style={s.companyDetail}>{email}</Text> : null}
          </View>
          <View style={s.headerRight}>
            {logoUrl ? <Image src={logoUrl} style={s.logo} /> : null}
          </View>
        </View>

        <View style={s.dividerBold} />

        {/* ─── META ─── */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Devis N°</Text>
            <Text style={s.metaValue}>{quoteNumber}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Date d'émission</Text>
            <Text style={s.metaValue}>{new Date().toLocaleDateString("fr-FR")}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Valable jusqu'au</Text>
            <Text style={s.metaValue}>{validityDate.toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        {/* ─── CLIENT ─── */}
        <View style={s.clientBox}>
          <Text style={s.clientLabel}>Pour</Text>
          <Text style={s.clientName}>{clientName || "—"}</Text>
          {eventName ? <Text style={s.companyDetail}>Événement : {eventName}</Text> : null}
          {eventDate ? <Text style={s.companyDetail}>Date : {eventDate}</Text> : null}
          {guestCount ? <Text style={s.companyDetail}>Convives : {guestCount}</Text> : null}
        </View>

        {/* ─── TABLE ─── */}
        {Object.entries(grouped).map(([cat, catItems]) => (
          <View key={cat} wrap={false}>
            <Text style={s.catHeader}>{CAT_LABELS[cat] || cat}</Text>
            <View style={s.tableHeader}>
              <Text style={s.colDesc}>Description</Text>
              <Text style={s.colQty}>Qté</Text>
              <Text style={s.colPrice}>PU HT (€)</Text>
              <Text style={s.colAmount}>Montant (€)</Text>
            </View>
            {catItems.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? s.row : s.rowAlt}>
                <View style={s.colDesc}>
                  <Text style={s.itemName}>{item.name}</Text>
                  {item.description ? <Text style={s.itemSub}>{item.description}</Text> : null}
                </View>
                <Text style={s.colQty}>{item.qty}</Text>
                <Text style={s.colPrice}>{fmt(item.unitPrice)}</Text>
                <Text style={s.colAmount}>{fmt(item.qty * item.unitPrice)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* ─── SUMMARY ─── */}
        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Sous-total HT</Text>
            <Text style={s.summaryValue}>{fmt(totalHT)} €</Text>
          </View>

          {discountPercent > 0 && (
            <View style={s.discountRow}>
              <Text style={s.discountLabel}>Remise ({discountPercent}%)</Text>
              <Text style={s.discountValue}>-{fmt(discountAmount)} €</Text>
            </View>
          )}

          {discountPercent > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Total HT après remise</Text>
              <Text style={s.summaryValue}>{fmt(totalHTAfterDiscount)} €</Text>
            </View>
          )}

          {Object.entries(tvaBreakdown).map(([rate, { tva }]) => (
            <View key={rate} style={s.summaryRow}>
              <Text style={s.summaryLabel}>TVA {rate}%</Text>
              <Text style={s.summaryValue}>{fmt(tva * (1 - discountPercent / 100))} €</Text>
            </View>
          ))}

          <View style={s.summaryTotalRow}>
            <Text style={s.summaryTotalLabel}>Total TTC</Text>
            <Text style={s.summaryTotalValue}>{fmt(totalTTC)} €</Text>
          </View>
        </View>

        {/* ─── DEPOSIT ─── */}
        <View style={s.depositBox}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>Acompte à la commande ({depositPercent}%)</Text>
            <Text style={{ fontWeight: "bold", fontSize: 9 }}>{fmt(deposit)} €</Text>
          </View>
          <Text style={{ fontSize: 7, color: "#92400e", marginTop: 2 }}>Solde dû le jour de l'événement : {fmt(totalTTC - deposit)} €</Text>
        </View>

        {/* ─── NOTES ─── */}
        {notes && (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* ─── CGV ─── */}
        <View style={s.cgv}>
          <Text style={{ fontWeight: "bold", marginBottom: 3, fontSize: 7, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Conditions Générales</Text>
          <Text>1. Le présent devis est valable {quoteValidityDays} jours à compter de sa date d'émission.</Text>
          <Text>2. Un acompte de {depositPercent}% est demandé à la commande. Le solde est dû le jour de la prestation.</Text>
          <Text>3. Toute annulation intervenant moins de 15 jours avant la date entraîne la facturation de 50% du montant total.</Text>
          <Text>4. Les prix s'entendent hors frais de livraison sauf mention contraire.</Text>
          <Text>5. Les quantités définitives doivent être confirmées au plus tard 7 jours avant l'événement.</Text>
        </View>

        {/* ─── SIGNATURES ─── */}
        <View style={s.signatureBlock}>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Le prestataire</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>{displayName}</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Le client (bon pour accord)</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Date et signature :</Text>
          </View>
        </View>

        <Text style={s.footer}>{displayName}{siret ? ` — SIRET ${siret}` : ""} — Devis généré automatiquement</Text>
      </Page>
    </Document>
  );
}
