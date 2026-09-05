
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

### Street View Phase 3

Street View est réactivé avec un premier flux de contribution vidéo authentifié :

```text
Street View → Ajouter → choisir une vidéo → vérifier → localiser → envoyer
→ validation préparatoire → attente de reconstruction 3D
```

La Phase 3 ne lance aucun moteur de reconstruction 3D. Les vidéos ne sont pas
stockées dans PostgreSQL : la base conserve uniquement les métadonnées et une
référence de stockage. L’adaptateur actuel utilise `STREETVIEW_STORAGE_DIR`
pour le développement ; un volume persistant Railway ou un Object Storage devra
être configuré avant une utilisation de production.

En production, le stockage objet S3-compatible est obligatoire par défaut. Le
client demande une session multipart à Express, envoie directement les parties
vers le bucket via des URLs présignées, puis Express vérifie l'objet final. Le
filesystem reste réservé au développement. La configuration et le runbook sont
documentés dans [`docs/STREETVIEW_STORAGE.md`](docs/STREETVIEW_STORAGE.md).

La préparation asynchrone est découplée de l'API : la finalisation crée un job
PostgreSQL, puis un worker Railway séparé le verrouille avec
`FOR UPDATE SKIP LOCKED`. Il valide l'objet, met à jour la progression et
s'arrête à `WAITING_FOR_3D`; aucun moteur 3D n'est lancé. Construire avec
`npm run build`, puis exécuter le service worker avec `npm run start:worker`.

Les migrations additives sont `migrations/0008_streetview_contributions.sql` et
`migrations/0009_streetview_processing_queue.sql`. La Phase 5 s'applique après
la migration initiale avec :

```bash
ALLOW_RAILWAY_STREETVIEW_MIGRATION=true \
  npm run db:railway:apply-streetview-phase5
```

La migration CPU-first Street View `migrations/0010_streetview_cpu_first.sql`
reste forward-only et n'est pas appliquée par le workflow de développement.
Après sauvegarde, précontrôle et validation humaine de Railway, elle doit être
appliquée séparément. Le worker Phase 14 reste bloqué tant que
`STREETVIEW_PHASE14_ENABLED=true` n'est pas défini explicitement après cette
application et une vérification des tables/colonnes.

Après sauvegarde et validation de la cible, elle peut être appliquée avec :

```bash
ALLOW_RAILWAY_STREETVIEW_MIGRATION=true \
  npm run db:railway:apply-streetview
```

### Migrations

Pour créer une nouvelle migration :
```bash
npm run db:generate
```

Avant toute revue de migration Railway, exécuter le précontrôle en lecture seule :
```bash
npm run db:railway:preflight
```

Il vérifie les 33 tables attendues, les compteurs concernés, les index de `0004`
et du module surveillance, le défaut UUID, la fonction PostgreSQL et l’existence
du journal Drizzle. Il ne modifie jamais la base.

`npm run db:push` est volontairement bloqué. Les migrations historiques ne doivent
pas être rejouées sur Railway. Les migrations `0004` à `0007` ont été appliquées
avec le runner transactionnel contrôlé suivant, après sauvegarde logique :

```bash
ALLOW_RAILWAY_SURVEILLANCE_MIGRATION=true \
  npm run db:railway:apply-surveillance
```

Le runner cible uniquement `RAILWAY_DATABASE_URL`, refuse les schémas partiels,
utilise un verrou PostgreSQL et annule toute la transaction si la vérification
finale échoue. Le journal `__drizzle_migrations` reste absent volontairement :
ne pas lancer `drizzle-kit migrate` avec le dossier historique actuel.

La procédure complète de sauvegarde, application et vérification est documentée
dans [`docs/RAILWAY_SURVEILLANCE_MIGRATION.md`](docs/RAILWAY_SURVEILLANCE_MIGRATION.md).
Le runbook historique de baseline reste disponible dans
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
