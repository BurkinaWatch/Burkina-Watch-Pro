# 🇧🇫 Burkina Watch - Documentation Technique

## Table des matières

1. [Architecture](#architecture)
2. [Technologies](#technologies)
3. [Structure du projet](#structure-du-projet)
4. [Base de données](#base-de-données)
5. [API Routes](#api-routes)
6. [Authentification](#authentification)
7. [Frontend](#frontend)
8. [Fonctionnalités clés](#fonctionnalités-clés)
9. [Déploiement](#déploiement)
10. [Maintenance](#maintenance)

---

## Architecture

Burkina Watch suit une architecture **full-stack moderne** avec une séparation claire entre frontend et backend.

### Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **Backend** : Node.js + Express.js + TypeScript
- **Base de données** : PostgreSQL 14+ avec Drizzle ORM
- **Authentification** : Replit Auth (OIDC)
- **Email** : Resend
- **Maps** : Google Maps API

### Architecture des données

```
┌─────────────────┐
│   React App     │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Express API    │
│   (Backend)     │
└────────┬────────┘
         │ Drizzle ORM
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

---

## Technologies

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Build tool |
| Wouter | 3.x | Routing |
| TanStack Query | 5.x | Data fetching |
| Tailwind CSS | 3.x | Styling |
| Shadcn/ui | Latest | Components |
| React Hook Form | 7.x | Forms |
| Zod | 3.x | Validation |

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | Server |
| Drizzle ORM | Latest | Database |
| Passport.js | 0.7.x | Auth middleware |
| openid-client | 5.x | OIDC client |
| Resend | 3.x | Email service |

### Outils de développement

- **TypeScript** : Typage statique
- **ESBuild** : Compilation backend
- **Drizzle Kit** : Database migrations
- **Prettier** : Code formatting (optionnel)

---

## Structure du projet

```
burkina-watch/
│
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   │   ├── ui/           # Shadcn/ui components
│   │   │   ├── SignalementCard.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   ├── pages/            # Pages de l'application
│   │   │   ├── Home.tsx
│   │   │   ├── Feed.tsx
│   │   │   ├── Carte.tsx
│   │   │   ├── Publier.tsx
│   │   │   ├── SOSPublier.tsx
│   │   │   ├── SignalementDetail.tsx
│   │   │   └── ...
│   │   ├── hooks/            # Custom hooks
│   │   │   ├── use-toast.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── ...
│   │   ├── lib/              # Utilitaires
│   │   │   ├── queryClient.ts
│   │   │   ├── utils.ts
│   │   │   ├── authUtils.ts
│   │   │   └── messagesDuJour.ts
│   │   ├── App.tsx           # Point d'entrée
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
│
├── server/                    # Backend Node.js
│   ├── index.ts              # Point d'entrée serveur
│   ├── routes.ts             # Routes API
│   ├── storage.ts            # Interface d'accès aux données
│   ├── replitAuth.ts         # Configuration Replit Auth (OIDC)
│   ├── vite.ts               # Middleware Vite
│   ├── resend.ts             # Service email (Resend)
│   ├── geocoding.ts          # Service de géocodage
│   ├── aiVerification.ts     # Vérification AI
│   ├── db.ts                 # Configuration base de données
│   └── migrate.ts            # Utilitaire de migration
│
├── shared/                    # Code partagé
│   └── schema.ts             # Schémas Drizzle + Zod
│
├── attached_assets/           # Assets statiques
│   └── ...
│
├── dist/                      # Build de production
│   ├── public/               # Frontend compilé
│   └── index.js              # Backend compilé
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .env.example
├── README_PORTABLE.md
├── DOCUMENTATION_TECHNIQUE.md
├── setup.sh
└── start.sh
```

---

## Base de données

### Schéma

#### Table : `users`

| Colonne | Type | Description |
|---------|------|-------------|
| id | serial | ID unique |
| email | varchar | Email de l'utilisateur |
| full_name | varchar | Nom complet |
| role | varchar | Rôle (citoyen, institution) |
| profile_picture | text | URL photo de profil |
| created_at | timestamp | Date de création |

#### Table : `signalements`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| user_id | integer | Référence à `users.id` |
| titre | varchar | Titre du signalement |
| description | text | Description détaillée |
| categorie | varchar | Catégorie (accident, corruption, etc.) |
| lieu | varchar | Localisation textuelle |
| latitude | numeric | Coordonnée GPS |
| longitude | numeric | Coordonnée GPS |
| photo | text | Image base64 |
| statut | varchar | État (en_attente, en_cours, resolu) |
| urgence | integer | Niveau d'urgence (1-3) |
| is_sos | boolean | Si c'est un SOS |
| sos_type | varchar | Type de SOS |
| anonymous | boolean | Publication anonyme |
| likes_count | integer | Nombre de likes |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

#### Table : `signalement_likes`

| Colonne | Type | Description |
|---------|------|-------------|
| id | serial | ID unique |
| user_id | integer | Référence à `users.id` |
| signalement_id | varchar | Référence à `signalements.id` |
| created_at | timestamp | Date de création |

**Contrainte unique** : `(user_id, signalement_id)` pour éviter les doublons.

#### Table : `commentaires`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| signalement_id | varchar | Référence à `signalements.id` |
| user_id | integer | Référence à `users.id` |
| contenu | text | Contenu du commentaire |
| created_at | timestamp | Date de création |

#### Table : `notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| user_id | integer | Référence à `users.id` |
| type | varchar | Type de notification |
| message | text | Message |
| link | varchar | Lien associé |
| read | boolean | État de lecture |
| created_at | timestamp | Date de création |

**Index** : `(user_id, read, created_at)` pour optimiser les requêtes.

#### Table : `tracking_sessions`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| user_id | integer | Référence à `users.id` |
| started_at | timestamp | Début du tracking |
| ended_at | timestamp | Fin du tracking |
| is_active | boolean | Session active |

#### Table : `location_points`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| session_id | varchar | Référence à `tracking_sessions.id` |
| latitude | numeric | Coordonnée GPS |
| longitude | numeric | Coordonnée GPS |
| recorded_at | timestamp | Moment de l'enregistrement |

#### Table : `emergency_contacts`

| Colonne | Type | Description |
|---------|------|-------------|
| id | varchar | ID unique (UUID) |
| user_id | integer | Référence à `users.id` |
| name | varchar | Nom du contact |
| phone | varchar | Numéro de téléphone |
| relationship | varchar | Relation |
| created_at | timestamp | Date de création |

### Migrations

Le projet utilise **Drizzle Kit** pour gérer le schéma :

```bash
# Pousser les modifications vers la DB
npm run db:push

# Forcer en cas de conflit
npm run db:push --force
```

**Important** : Pas de migrations SQL manuelles. Drizzle génère tout automatiquement.

---

## API Routes

### Authentification

#### `GET /api/auth/status`
Vérifier si l'utilisateur est authentifié.

**Response**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### `GET /api/auth/login`
Initie le flow OIDC.

#### `GET /api/auth/callback`
Callback OIDC après authentification.

#### `POST /api/auth/logout`
Déconnexion de l'utilisateur.

---

### Signalements

#### `GET /api/signalements`
Récupérer tous les signalements.

**Query params**
- `categorie` : Filtrer par catégorie
- `urgence` : Filtrer par urgence
- `statut` : Filtrer par statut

**Response**
```json
[
  {
    "id": "uuid",
    "titre": "Route endommagée",
    "description": "...",
    "categorie": "infrastructure",
    "latitude": 12.3714,
    "longitude": -1.5197,
    "urgence": 2,
    "likes_count": 5,
    "user": { "full_name": "John Doe" }
  }
]
```

#### `GET /api/signalements/:id`
Récupérer un signalement par ID.

#### `POST /api/signalements`
Créer un nouveau signalement.

**Body**
```json
{
  "titre": "Accident de la route",
  "description": "...",
  "categorie": "accident",
  "lieu": "Ouagadougou",
  "latitude": 12.3714,
  "longitude": -1.5197,
  "photo": "data:image/jpeg;base64,...",
  "urgence": 3,
  "is_sos": false,
  "anonymous": false
}
```

#### `PATCH /api/signalements/:id`
Modifier un signalement (auteur uniquement).

#### `DELETE /api/signalements/:id`
Supprimer un signalement (auteur uniquement).

---

### Likes

#### `POST /api/signalements/:id/toggle-like`
Liker ou unliker un signalement.

**Response**
```json
{
  "liked": true,
  "likes_count": 6
}
```

---

### Commentaires

#### `GET /api/signalements/:id/commentaires`
Récupérer les commentaires d'un signalement.

#### `POST /api/signalements/:id/commentaires`
Ajouter un commentaire.

**Body**
```json
{
  "contenu": "Merci pour ce signalement !"
}
```

---

### Notifications

#### `GET /api/notifications`
Récupérer les notifications de l'utilisateur.

#### `PATCH /api/notifications/:id/read`
Marquer une notification comme lue.

#### `GET /api/notifications/unread-count`
Compter les notifications non lues.

---

### Profil utilisateur

#### `GET /api/user/profile`
Récupérer le profil de l'utilisateur.

#### `PATCH /api/user/profile`
Modifier le profil.

**Body**
```json
{
  "full_name": "Jane Doe",
  "profile_picture": "data:image/jpeg;base64,..."
}
```

---

### Tracking de localisation

#### `POST /api/location-tracking/start`
Démarrer une session de tracking.

#### `POST /api/location-tracking/stop`
Arrêter la session active.

#### `POST /api/location-tracking/point`
Enregistrer un point GPS.

**Body**
```json
{
  "latitude": 12.3714,
  "longitude": -1.5197
}
```

#### `GET /api/location-tracking/current`
Récupérer la session active.

---

### Contacts d'urgence

#### `GET /api/emergency-contacts`
Récupérer les contacts d'urgence.

#### `POST /api/emergency-contacts`
Ajouter un contact.

#### `DELETE /api/emergency-contacts/:id`
Supprimer un contact.

---

## Authentification

### OIDC (Replit Auth)

Le projet utilise **OpenID Connect** via Replit Auth.

**Flow** :
1. Utilisateur clique sur "Se connecter"
2. Redirection vers Replit Auth
3. Utilisateur s'authentifie (Google, GitHub, email, etc.)
4. Callback sur `/api/auth/callback`
5. Création/récupération de l'utilisateur dans la DB
6. Session créée et stockée dans PostgreSQL

**Variables requises** :
- `ISSUER_URL` : URL de l'émetteur OIDC
- `CLIENT_ID` : ID client
- `CLIENT_SECRET` : Secret client
- `REDIRECT_URI` : URL de callback

### Sessions

Les sessions sont stockées dans PostgreSQL via `connect-pg-simple`.

**Durée** : 7 jours par défaut.

---

## Frontend

### Routing (Wouter)

**Pages principales** :
- `/` : Landing page
- `/accueil` : Home (authentifié)
- `/publier` : Publier un signalement
- `/sos/publier` : Publier un SOS
- `/carte` : Carte interactive
- `/flux` : Feed de signalements
- `/signalement/:id` : Détail d'un signalement
- `/profil` : Profil utilisateur
- `/notifications` : Notifications
- `/a-propos` : À propos
- `/conditions` : Conditions d'utilisation
- `/contribuer` : Page de contribution

### Data Fetching (TanStack Query)

**Exemple** :
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['/api/signalements'],
});
```

**Mutations** :
```typescript
const mutation = useMutation({
  mutationFn: async (data) => apiRequest('/api/signalements', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/signalements'] });
  },
});
```

### Formulaires (React Hook Form + Zod)

**Exemple** :
```typescript
const form = useForm({
  resolver: zodResolver(insertSignalementSchema),
  defaultValues: { ... },
});

const onSubmit = form.handleSubmit(async (data) => {
  await apiRequest('/api/signalements', 'POST', data);
});
```

---

## Fonctionnalités clés

### 1. Système de like transactionnel

- **Unique constraint** sur `(user_id, signalement_id)`
- Toggle atomique : `INSERT ... ON CONFLICT DO DELETE`
- Compteur `likes_count` mis à jour automatiquement

### 2. Notifications en temps réel

- Notifications asynchrones via batch processing
- Index sur `(user_id, read, created_at)` pour performance
- Types : `new_post`, `sos_alert`, `like`, `comment`, `share`

### 3. Tracking de localisation

- Enregistrement GPS toutes les 30 secondes
- Génération automatique de lien Google Maps
- Email avec adresse reverse-geocodée (Geocoding API + fallback Nominatim)

### 4. SEO & Open Graph

- React Helmet Async pour méta tags dynamiques
- OG tags pour partage social optimisé
- URLs canoniques

### 5. Compression d'images

- Resize automatique à 1200x1200px
- Qualité JPEG 80%
- Limite : 20 MB avant compression

---

## Déploiement

### Sur Replit

1. Créez un nouveau Repl
2. Importez le projet (GitHub ou ZIP)
3. Ajoutez les secrets dans l'onglet "Secrets"
4. Cliquez sur "Run"

### Sur un serveur (VPS, AWS, etc.)

1. Installer Node.js 18+ et PostgreSQL 14+
2. Cloner le projet
3. Copier `.env.example` vers `.env`
4. Configurer les variables d'environnement
5. Installer les dépendances : `npm install`
6. Initialiser la DB : `npm run db:push`
7. Compiler : `npm run build`
8. Lancer : `npm start`

**Reverse proxy (Nginx)** :
```nginx
server {
    listen 80;
    server_name burkinawatch.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Maintenance

### Logs

Les logs sont gérés par Express :
```bash
# En production, redirigez vers un fichier
npm start > logs/app.log 2>&1
```

### Backup de la DB

```bash
# Dump PostgreSQL
pg_dump -U postgres burkina_watch > backup_$(date +%Y%m%d).sql

# Restauration
psql -U postgres burkina_watch < backup_20231110.sql
```

### Monitoring

Utilisez des outils comme :
- **PM2** : Gestionnaire de processus Node.js
- **Sentry** : Suivi des erreurs
- **Datadog** : Monitoring infrastructure

### Mise à jour des dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour (avec prudence)
npm update

# Maj majeure
npm install package@latest
```

---

## Licence

MIT

---

## Support

Pour toute question technique :
- **GitHub Issues** : [Votre repo]
- **Email** : [votre_email@example.com]

---

**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2025
