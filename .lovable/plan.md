

# Plan : Refonte du module Annonces RH (Steps 1-3 + polish Step 4)

## Objectif
Ajouter 3 nouvelles interfaces au module Annonces RH sans toucher au tableau de staffing existant (Step 5). Polir legèrement la page de confirmation employé (Step 4).

---

## STEP 1 — Liste des annonces (nouvelle vue principale)

Transformer la page `Announcements.tsx` pour afficher une **liste de cartes d'annonces** au lieu du sélecteur d'événement actuel. Chaque carte affiche :

- **Infos événement** : nom, date, lieu, client — en chips/badges stylisés (inspiré de l'image de référence avec des boites arrondies et icones)
- **Résumé du devis** : montant TTC, statut (Brouillon/Envoyé/Validé)
- **Prestations du devis** : liste des items du champ `items` (jsonb) du devis lié
- **Notes du devis** : affichées si présentes
- **Bouton CTA** : "Gérer le staffing" qui ouvre l'interface de staffing (Step 2)

L'architecture de la page devient un `viewMode` state : `"list"` (nouvelle vue par défaut) vs `"staffing"` (vue existante actuelle, inchangée).

### Fichiers modifiés
- `src/pages/Announcements.tsx` — Ajout d'un state `viewMode` + rendu conditionnel. La vue "list" montre les cartes d'annonces. La vue "staffing" montre tout le contenu existant tel quel.
- `src/components/hr/AnnouncementCard.tsx` — **Nouveau composant** : carte d'annonce stylisée

---

## STEP 2 — Interface de staffing (modale/vue au clic)

Quand on clique sur une annonce, on passe en mode staffing pour cet événement avec une nouvelle interface intermédiaire de **sélection d'employés** :

- **En-tête** : détails événement + compteurs de staff requis par role ("10 serveurs nécessaires", "2 bartenders nécessaires")
- **Tabs de filtre** en haut : Tous / Serveur / Bartender / Cuisine / Maitre d'hotel
- **Liste d'employés** : chaque employé est sélectionnable via checkbox. Design carte compacte (nom, role, fiabilité)
- **Compteur live** : "2/10 serveurs sélectionnés" qui se met à jour en temps réel
- **Bouton "Envoyer le message"** : apparait quand au moins 1 employé est sélectionné, ouvre le Step 3

### Fichiers créés
- `src/components/hr/StaffingSelector.tsx` — **Nouveau composant** : interface de sélection avec tabs, checkboxes, compteurs live

---

## STEP 3 — Compositeur de message

Au clic sur "Envoyer le message" :

- **Modale de composition** : réutilise le style du `WhatsAppEditorModal` existant
- Message pré-rempli avec les détails de l'événement (date, lieu, role, convives)
- Variables dynamiques cliquables (comme l'éditeur existant)
- Zone d'édition + prévisualisation en temps réel
- Boutons : Copier / Ouvrir WhatsApp
- Envoi groupé : le message est personnalisé pour chaque employé sélectionné (le prenom change)

### Fichiers créés
- `src/components/hr/BulkMessageModal.tsx` — **Nouveau composant** : compositeur de message pour envoi groupé, basé sur le design de `WhatsAppEditorModal`

---

## STEP 4 — Polish de la page de confirmation (existante)

Améliorations purement visuelles sur `src/pages/Confirm.tsx` :

- Remplacer le logo "CaterPilot" par le logo "Sur le Passe" (`logo-text.png`)
- Ajouter une texture de fond subtile (grain) cohérente avec la DA beige
- Améliorer le spacing et les bordures des cartes
- Ajouter une animation d'entrée douce (fade-in)
- Garder 100% de la logique existante intacte

### Fichiers modifiés
- `src/pages/Confirm.tsx` — Mise à jour du logo + polish UI

---

## STEP 5 — Inchangé

Le tableau de staffing existant (jauges, candidats, équipe confirmée, relances, remplacements) reste 100% intact. Il est accessible soit depuis le bouton CTA d'une annonce, soit via un toggle "Vue avancée".

---

## Details techniques

### Flux utilisateur

```text
Liste annonces (Step 1)
    |
    v  [Clic "Gérer le staffing"]
Interface sélection (Step 2)
    |
    v  [Clic "Envoyer le message"]
Compositeur message (Step 3)
    |
    v  [Retour ou "Vue avancée"]
Tableau staffing existant (Step 5 - inchangé)
```

### Design system
- Fond : `bg-background` (beige 30 25% 97%) — PAS le dark #0F1117 qui est spécifique au module RH existant. On utilise la DA globale beige du site.
- Cards : `bg-card` avec `border` standard
- Accents : `primary` (charcoal) et emerald pour les CTA
- Typo : Plus Jakarta Sans (corps) + Syne (titres)
- Les composants existants (Badge, Button, Card, Accordion) sont réutilisés

### Aucune modification de base de données requise
Toutes les données nécessaires existent déjà :
- `events` + `clients` pour les infos événement
- `quotes` (champ `items` jsonb) pour les prestations
- `team_members` pour la liste d'employés
- `event_staff` pour les affectations
- `rh_settings` pour les calculs de besoins

### Fichiers impactés (résumé)

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/Announcements.tsx` |
| Modifier | `src/pages/Confirm.tsx` |
| Creer | `src/components/hr/AnnouncementCard.tsx` |
| Creer | `src/components/hr/StaffingSelector.tsx` |
| Creer | `src/components/hr/BulkMessageModal.tsx` |

