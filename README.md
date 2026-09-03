
# Burkina Watch

Application nationale de veille citoyenne et d'alerte sociale pour le Burkina Faso.

## 📁 Structure du Projet

```
.
├── client/              # Application React frontend
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── hooks/       # Hooks personnalisés
│   │   └── lib/         # Utilitaires et configuration
│   └── index.html
│
├── server/              # Backend Express
│   ├── db.ts           # Configuration base de données
│   ├── routes.ts       # Routes API
│   ├── storage.ts      # Couche d'accès aux données
│   ├── replitAuth.ts   # Authentification Replit
│   └── index.ts        # Point d'entrée serveur
│
├── shared/              # Code partagé client/serveur
│   └── schema.ts       # Schémas de données Drizzle
│
└── migrations/          # Migrations base de données

```

## 🚀 Démarrage

1. Les dépendances sont installées automatiquement
2. Cliquez sur le bouton "Run" pour démarrer l'application
3. L'application sera disponible sur le port 5000

## 🗄️ Base de Données

Le projet utilise PostgreSQL Railway comme base de production avec Drizzle ORM.
`RAILWAY_DATABASE_URL` est prioritaire ; `DATABASE_URL` reste un fallback réservé au
développement local.

### Migrations

Pour créer une nouvelle migration :
```bash
npm run db:generate
```

Avant toute revue de migration Railway, exécuter le précontrôle en lecture seule :
```bash
npm run db:railway:preflight
```

Il vérifie les 29 tables attendues, les cinq compteurs concernés, les index de
`0004`, le défaut UUID, la fonction PostgreSQL et l’existence du journal Drizzle.
Il ne modifie jamais la base.

`npm run db:push` est volontairement bloqué. Les migrations historiques ne doivent
pas être rejouées sur Railway. La migration
`migrations/0004_runtime_alignment_draft.sql` reste en attente tant qu’un snapshot
restaurable et une baseline Drizzle validée n’existent pas.

Le runbook de baseline, les preuves de restauration et les conditions de revue
humaine sont documentés dans
[`docs/RAILWAY_DRIZZLE_BASELINE.md`](docs/RAILWAY_DRIZZLE_BASELINE.md).

## 📱 Fonctionnalités

- **Signalements** : Création et gestion de signalements citoyens
- **SOS** : Système d'alerte d'urgence
- **Tracking GPS** : Suivi de localisation en temps réel
- **Commentaires** : Discussion sur les signalements
- **Carte interactive** : Visualisation géographique
- **Statistiques** : Tableaux de bord

## 🔐 Authentification

L'application utilise Replit Auth pour l'authentification des utilisateurs.

## 🛠️ Technologies

- **Frontend** : React, TanStack Query, TailwindCSS, shadcn/ui
- **Backend** : Express, Drizzle ORM
- **Base de données** : PostgreSQL (Neon)
- **Maps** : Google Maps API
- **Authentification** : Replit Auth
