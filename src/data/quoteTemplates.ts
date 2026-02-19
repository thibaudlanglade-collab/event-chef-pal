export interface TemplateItem {
  name: string;
  category: string;
  pricing_type: string;
  qty: number;
  unitPrice: number;
  tva: number;
  description?: string;
}

export interface QuoteTemplate {
  key: string;
  label: string;
  icon: string;
  items: TemplateItem[];
}

export const quoteTemplates: QuoteTemplate[] = [
  {
    key: "anniversaire",
    label: "Anniversaire",
    icon: "🎂",
    items: [
      { name: "Cocktail dinatoire", category: "restauration", pricing_type: "per_person", qty: 15, unitPrice: 35, tva: 10, description: "Assortiment de verrines et pièces cocktail" },
      { name: "Gâteau d'anniversaire", category: "restauration", pricing_type: "flat", qty: 1, unitPrice: 120, tva: 10, description: "Pièce montée ou gâteau personnalisé" },
      { name: "Forfait boissons soft", category: "boissons", pricing_type: "flat", qty: 1, unitPrice: 90, tva: 10, description: "Jus, sodas, eaux" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 8, unitPrice: 22, tva: 20, description: "Service et débarrassage" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 8, unitPrice: 22, tva: 20, description: "Service et débarrassage" },
      { name: "Vaisselle standard", category: "logistique", pricing_type: "per_person", qty: 15, unitPrice: 5, tva: 20, description: "Assiettes, couverts, verres" },
    ],
  },
  {
    key: "mariage",
    label: "Mariage",
    icon: "💍",
    items: [
      { name: "Vin d'honneur cocktail", category: "restauration", pricing_type: "per_person", qty: 80, unitPrice: 18, tva: 10, description: "Canapés, verrines, pièces salées" },
      { name: "Dîner assis 3 plats", category: "restauration", pricing_type: "per_person", qty: 80, unitPrice: 65, tva: 10, description: "Entrée, plat, dessert" },
      { name: "Vin & Champagne", category: "boissons_alcool", pricing_type: "per_person", qty: 80, unitPrice: 25, tva: 20, description: "Vin blanc, rouge + coupe champagne" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 10, unitPrice: 22, tva: 20, description: "Service complet" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 10, unitPrice: 22, tva: 20, description: "Service complet" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 10, unitPrice: 22, tva: 20, description: "Service complet" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 10, unitPrice: 22, tva: 20, description: "Service complet" },
      { name: "Maître d'hôtel", category: "personnel", pricing_type: "hourly", qty: 10, unitPrice: 35, tva: 20, description: "Coordination du service" },
      { name: "Vaisselle premium", category: "logistique", pricing_type: "per_person", qty: 80, unitPrice: 12, tva: 20, description: "Porcelaine blanche, verrerie cristal" },
    ],
  },
  {
    key: "corporate",
    label: "Corporate",
    icon: "🏢",
    items: [
      { name: "Buffet déjeunatoire", category: "restauration", pricing_type: "per_person", qty: 30, unitPrice: 28, tva: 10, description: "Buffet froid et chaud" },
      { name: "Soft & Café", category: "boissons", pricing_type: "flat", qty: 1, unitPrice: 120, tva: 10, description: "Café, thé, jus, eaux" },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 6, unitPrice: 22, tva: 20 },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 6, unitPrice: 22, tva: 20 },
      { name: "Livraison & installation", category: "logistique", pricing_type: "flat", qty: 1, unitPrice: 180, tva: 20, description: "Transport, mise en place, repli" },
    ],
  },
  {
    key: "bapteme",
    label: "Baptême",
    icon: "👶",
    items: [
      { name: "Buffet froid", category: "restauration", pricing_type: "per_person", qty: 25, unitPrice: 22, tva: 10, description: "Assortiment de salades, charcuterie, fromages" },
      { name: "Gâteau de baptême", category: "restauration", pricing_type: "flat", qty: 1, unitPrice: 90, tva: 10 },
      { name: "Forfait boissons soft", category: "boissons", pricing_type: "flat", qty: 1, unitPrice: 75, tva: 10 },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 6, unitPrice: 22, tva: 20 },
      { name: "Serveur", category: "personnel", pricing_type: "hourly", qty: 6, unitPrice: 22, tva: 20 },
    ],
  },
];
