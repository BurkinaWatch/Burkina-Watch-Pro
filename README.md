
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

Le projet utilise PostgreSQL (Neon) avec Drizzle ORM.

### Migrations

Pour créer une nouvelle migration :
```bash
npx drizzle-kit generate
```

Pour appliquer les migrations :
```bash
npx tsx server/migrate.ts
```

## 📱 Fonctionnalités

- **Signalements** : Création et gestion de signalements citoyens
- **SOS** : Système d'alerte d'urgence
- **Tracking GPS** : Suivi de localisation en temps réel
- **Commentaires** : Discussion sur les signalements
- **Carte interactive** : Visualisation géographique (OpenStreetMap + Leaflet)
- **Statistiques** : Tableaux de bord

## 🔐 Authentification

L'application utilise Replit Auth pour l'authentification des utilisateurs.

## 🛠️ Technologies

- **Frontend** : React, TanStack Query, TailwindCSS, shadcn/ui
- **Backend** : Express, Drizzle ORM
- **Base de données** : PostgreSQL (Neon)
- **Maps** : Google Maps API
- **Authentification** : Replit Auth
