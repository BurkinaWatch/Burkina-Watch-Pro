# Burkina Watch - Fiche Technique

## Présentation Générale

**Burkina Watch** est une plateforme web citoyenne de veille et d'engagement pour le Burkina Faso. Elle permet aux citoyens de :
- Signaler anonymement des incidents
- Demander/offrir de l'aide via le système SOS
- Visualiser les signalements en temps réel sur une carte interactive
- Accéder à des informations pratiques (pharmacies, stations-service, banques, restaurants, gares, météo)

**Slogan** : "Voir. Agir. Protéger."

---

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Routing** | Wouter |
| **State Management** | TanStack Query v5 (avec persistance offline) |
| **UI Components** | Shadcn/ui (Radix UI + Tailwind CSS) |
| **Backend** | Node.js, Express.js, TypeScript |
| **Base de données** | PostgreSQL (Neon serverless) |
| **ORM** | Drizzle ORM |
| **Authentification** | Replit Auth (OIDC - Google, GitHub, X, Apple, email) |
| **IA** | OpenAI GPT-4o-mini (chatbot assistant) |
| **Cartographie** | Leaflet.js, Google Maps API, Mapillary, OpenStreetMap/Overpass API |
| **Email** | Resend |
| **Notifications** | Web Push API (VAPID) |

---

## Fonctionnalités Principales

### Signalements & SOS
- Création de signalements avec géolocalisation automatique
- Système de catégories et niveaux d'urgence (feu tricolore)
- Mode SOS pour demandes d'aide urgentes
- Système de likes, commentaires et partage
- Points et niveaux utilisateurs

### Carte Interactive
- Visualisation temps réel des signalements
- Clustering de marqueurs
- Filtres par catégorie, urgence, période
- Suivi de position en direct avec trajectoire

### Mode Hors-Ligne
- Stockage IndexedDB des signalements
- Synchronisation automatique au retour de connexion
- Indicateur visuel d'état réseau

### Assistant IA
- Chatbot multilingue (gpt-4o-mini)
- Historique de conversation persistant
- FAQ et conseils de sécurité

### Recherche Vocale
- Web Speech API (français fr-FR)
- Feedback visuel animé
- Intégré sur : Accueil, Banques, Pharmacies, Restaurants, Stations

### Notifications Push
- Ciblage géographique (rayon 1-50 km)
- Service Worker pour notifications en arrière-plan
- Gestion des abonnements utilisateur

---

## Pages de l'Application

| Page | Description |
|------|-------------|
| **Accueil** | Statistiques, signalements récents, zones à risque, recommandations |
| **Feed** | Fil d'actualité des signalements |
| **Carte** | Carte interactive avec tous les signalements |
| **Nouveau Signalement** | Formulaire de création |
| **SOS** | Demandes d'aide urgentes |
| **Profil** | Gestion du compte utilisateur |
| **Pharmacies** | 167+ pharmacies avec gardes 24h |
| **Stations-Service** | 90+ stations (TotalEnergies, Shell, Barka Energies...) |
| **Banques** | 102 établissements (16 banques + 40 caisses populaires) |
| **Restaurants** | 65+ restaurants vérifiés |
| **Boutiques** | 60+ commerces (Marina Market, KIABI...) |
| **Marchés** | Marchés traditionnels par région |
| **Gares Routières** | Compagnies, gares, SITARAIL, SOTRACO |
| **Météo** | Alertes météo pour 13 villes |
| **Actualités** | Agrégation RSS (Lefaso.net, Sidwaya, BBC Africa...) |

---

## Données Géolocalisées

### Sources de Données
| Source | Utilisation | Score de Confiance |
|--------|-------------|-------------------|
| **OpenStreetMap** (Overpass API) | Source principale | 0.6 |
| **Données officielles** | Banques, pharmacies | 0.85-0.9 |
| **Communauté** | Vérifications utilisateurs | Variable |
| **Google Maps** | Navigation externe uniquement | - |

### Couverture
- **13 régions** du Burkina Faso
- **450+ lieux** vérifiés avec GPS
- Synchronisation OSM automatique au démarrage

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| **Chiffrement** | AES-256-GCM (envelope encryption) |
| **Sessions** | PostgreSQL-backed, TTL 7 jours |
| **Middlewares** | Helmet, rate-limit, xss-clean, hpp, CORS strict |
| **Protection brute-force** | Rate limiting par endpoint |
| **Tokens** | Hachage SHA-256 |
| **Audit** | Logging des opérations sensibles |

---

## Design & Accessibilité

- **Palette écologique** : Vert primaire (HSL 142° 65% 45%)
- **Couleurs nationales** : Rouge (#E30613), Jaune (#FFD100), Vert (#007A33)
- **Mode sombre/clair** : Détection automatique + toggle
- **Accessibilité** : WCAG AA compliant
- **Police** : Inter
- **Responsive** : Optimisé mobile avec barre de navigation bottom

### Composants StatCard
- Fond dégradé avec variantes de couleur
- Effet d'élévation au survol (shadow + translate)
- Animation de lumière balayante
- Armoiries du Burkina Faso en arrière-plan
- Bande tricolore nationale

---

## API Endpoints Principaux

```
GET  /api/auth/user          - Utilisateur connecté
GET  /api/signalements       - Liste des signalements
POST /api/signalements       - Créer un signalement
GET  /api/pharmacies         - Pharmacies avec gardes
GET  /api/stations           - Stations-service
GET  /api/banques            - Banques et caisses
GET  /api/restaurants        - Restaurants
GET  /api/boutiques          - Boutiques
GET  /api/transport          - Gares et compagnies
GET  /api/weather-alerts     - Alertes météo
GET  /api/articles           - Actualités RSS
POST /api/chat               - Assistant IA
```

---

## Commandes

```bash
npm run dev          # Développement (Vite + Express)
npm run build        # Build production
npm run db:push      # Sync schéma DB
npm run db:studio    # Interface Drizzle Studio
```

---

## Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `RESEND_API_KEY` | Clé API Resend |
| `VAPID_PUBLIC_KEY` | Clé publique push |
| `VAPID_PRIVATE_KEY` | Clé privée push |
| `VITE_GOOGLE_MAPS_API_KEY` | Clé Google Maps |

---

## Dernières Mises à Jour (Décembre 2024)

- Infrastructure de migration OSM avec traçabilité des sources
- Composant SourceBadge pour afficher la provenance des données
- Design unifié des cartes statistiques avec animations
- Page Gares Routières avec SITARAIL et SOTRACO
- Synchronisation automatique OpenStreetMap au démarrage

---

**Version** : 1.0.0  
**Licence** : Propriétaire  
**Contact** : help-burkinawatch@outlook.fr  
**Date** : 30 Décembre 2024
