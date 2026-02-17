export type EventStatus = 'prospect' | 'quote_sent' | 'appointment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type EventType = 'wedding' | 'corporate' | 'private' | 'other';

export interface CaterEvent {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  type: EventType;
  status: EventStatus;
  venue: string;
  guestCount: number;
  notes: string;
  assignedTeam: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  hourlyRate: number;
  skills: string[];
  available: boolean;
  notes: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQty: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const mockClients: Client[] = [
  { id: '1', name: 'Sophie Dupont', email: 'sophie@email.com', phone: '06 12 34 56 78' },
  { id: '2', name: 'TechCorp SA', email: 'contact@techcorp.fr', phone: '01 23 45 67 89' },
  { id: '3', name: 'Pierre Martin', email: 'pierre.m@email.com', phone: '06 98 76 54 32' },
  { id: '4', name: 'Marie Lefebvre', email: 'marie.l@email.com', phone: '06 55 44 33 22' },
  { id: '5', name: 'Entreprise Gala X', email: 'events@galax.fr', phone: '01 44 55 66 77' },
];

export const mockEvents: CaterEvent[] = [
  {
    id: '1', name: 'Mariage Dupont-Moreau', clientName: 'Sophie Dupont', clientPhone: '06 12 34 56 78',
    date: '2026-02-21', time: '14:00', type: 'wedding', status: 'confirmed',
    venue: 'Château de Versigny', guestCount: 120,
    notes: 'Menu sans gluten pour 8 invités. Décoration florale incluse.',
    assignedTeam: ['1', '2', '4'],
  },
  {
    id: '2', name: 'Séminaire TechCorp', clientName: 'TechCorp SA', clientPhone: '01 23 45 67 89',
    date: '2026-02-17', time: '09:00', type: 'corporate', status: 'in_progress',
    venue: 'Hôtel Mercure Lyon', guestCount: 45,
    notes: 'Pause café matin + après-midi. Déjeuner buffet.',
    assignedTeam: ['1', '3'],
  },
  {
    id: '3', name: 'Anniversaire Martin', clientName: 'Pierre Martin', clientPhone: '06 98 76 54 32',
    date: '2026-02-19', time: '19:00', type: 'private', status: 'quote_sent',
    venue: 'Salle des Fêtes Belleville', guestCount: 30,
    notes: 'Thème années 80. Cocktail + dîner assis.',
    assignedTeam: [],
  },
  {
    id: '4', name: 'Cocktail Lefebvre', clientName: 'Marie Lefebvre', clientPhone: '06 55 44 33 22',
    date: '2026-02-22', time: '18:30', type: 'private', status: 'prospect',
    venue: 'À définir', guestCount: 60,
    notes: '', assignedTeam: [],
  },
  {
    id: '5', name: 'Gala Entreprise X', clientName: 'Entreprise Gala X', clientPhone: '01 44 55 66 77',
    date: '2026-02-14', time: '20:00', type: 'corporate', status: 'quote_sent',
    venue: 'Pavillon Gabriel Paris', guestCount: 200,
    notes: 'Devis envoyé il y a 3 jours, en attente de réponse.',
    assignedTeam: [],
  },
  {
    id: '6', name: 'Brunch Dominical', clientName: 'Pierre Martin', clientPhone: '06 98 76 54 32',
    date: '2026-02-15', time: '10:00', type: 'other', status: 'completed',
    venue: 'Restaurant Le Jardin', guestCount: 25,
    notes: '', assignedTeam: ['1', '2'],
  },
  {
    id: '7', name: 'Soirée Corporate Printemps', clientName: 'TechCorp SA', clientPhone: '01 23 45 67 89',
    date: '2026-02-28', time: '19:00', type: 'corporate', status: 'appointment',
    venue: 'Loft Bastille', guestCount: 80,
    notes: 'Rendez-vous fixé pour valider le menu.', assignedTeam: [],
  },
];

export const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Lucas Petit', phone: '06 11 22 33 44', role: 'Chef cuisinier', hourlyRate: 35, skills: ['cuisine française', 'pâtisserie'], available: true, notes: '' },
  { id: '2', name: 'Emma Garcia', phone: '06 22 33 44 55', role: 'Serveuse', hourlyRate: 18, skills: ['service', 'sommellerie'], available: true, notes: '' },
  { id: '3', name: 'Hugo Bernard', phone: '06 33 44 55 66', role: 'Serveur', hourlyRate: 18, skills: ['service', 'bar'], available: true, notes: '' },
  { id: '4', name: 'Léa Moreau', phone: '06 44 55 66 77', role: 'Décoratrice', hourlyRate: 25, skills: ['décoration', 'floral'], available: false, notes: 'Indisponible du 20 au 25 février' },
  { id: '5', name: 'Nathan Roux', phone: '06 55 66 77 88', role: 'Commis', hourlyRate: 15, skills: ['préparation', 'plonge'], available: true, notes: '' },
];

export const mockStockItems: StockItem[] = [
  { id: '1', name: 'Serviettes en tissu', category: 'Linge', unit: 'pièces', currentQty: 12, minThreshold: 20, lastUpdated: '2026-02-15' },
  { id: '2', name: 'Assiettes plates 27cm', category: 'Vaisselle', unit: 'pièces', currentQty: 150, minThreshold: 100, lastUpdated: '2026-02-16' },
  { id: '3', name: 'Verres à vin', category: 'Vaisselle', unit: 'pièces', currentQty: 95, minThreshold: 80, lastUpdated: '2026-02-16' },
  { id: '4', name: 'Nappes blanches', category: 'Linge', unit: 'pièces', currentQty: 18, minThreshold: 15, lastUpdated: '2026-02-14' },
  { id: '5', name: 'Huile d\'olive (5L)', category: 'Alimentaire', unit: 'bidons', currentQty: 2, minThreshold: 3, lastUpdated: '2026-02-13' },
  { id: '6', name: 'Bougies décoratives', category: 'Décoration', unit: 'pièces', currentQty: 45, minThreshold: 20, lastUpdated: '2026-02-10' },
  { id: '7', name: 'Couverts argent', category: 'Vaisselle', unit: 'sets', currentQty: 80, minThreshold: 60, lastUpdated: '2026-02-16' },
  { id: '8', name: 'Champagne (bouteilles)', category: 'Boissons', unit: 'bouteilles', currentQty: 8, minThreshold: 12, lastUpdated: '2026-02-15' },
];

export const statusLabels: Record<EventStatus, string> = {
  prospect: 'Prospect',
  quote_sent: 'Devis envoyé',
  appointment: 'RDV fixé',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const statusColors: Record<EventStatus, string> = {
  prospect: 'bg-status-prospect/15 text-status-prospect',
  quote_sent: 'bg-status-quote-sent/15 text-status-quote-sent',
  appointment: 'bg-status-appointment/15 text-status-appointment',
  confirmed: 'bg-status-confirmed/15 text-status-confirmed',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  completed: 'bg-status-completed/15 text-status-completed',
  cancelled: 'bg-status-cancelled/15 text-status-cancelled',
};

export const typeLabels: Record<EventType, string> = {
  wedding: 'Mariage',
  corporate: 'Entreprise',
  private: 'Privé',
  other: 'Autre',
};
