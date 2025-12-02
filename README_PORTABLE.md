# 🇧🇫 Burkina Watch - Guide d'Installation Portable

## 📦 À propos

Burkina Watch est une plateforme citoyenne pour signaler des incidents, demander de l'aide via SOS, et visualiser les rapports en temps réel sur une carte interactive au Burkina Faso.

## 🎯 Contenu du package

Ce package contient :
- ✅ Code source complet (frontend React + backend Node.js)
- ✅ Build de production compilé dans `/dist`
- ✅ Toutes les dépendances listées dans `package.json`
- ✅ Configuration Replit (`.replit`)
- ✅ Fichiers de configuration (TypeScript, Vite, Tailwind, etc.)
- ✅ Assets et images
- ✅ Documentation complète

## 📋 Prérequis

### Minimal requis :
- **Node.js** : version 18.x ou supérieure
- **PostgreSQL** : version 14 ou supérieure
- **npm** : version 9.x ou supérieure

### Vérifier vos versions :
```bash
node --version    # Doit être >= 18.x
npm --version     # Doit être >= 9.x
psql --version    # Doit être >= 14.x
```

## 🚀 Installation Rapide

### Option 1 : Installation Automatique (Recommandée)

```bash
# Rendre le script exécutable
chmod +x setup.sh

# Lancer l'installation
./setup.sh
```

### Option 2 : Installation Manuelle

#### Étape 1 : Installer les dépendances

```bash
npm install
```

#### Étape 2 : Configurer la base de données

```bash
# Créer une base de données PostgreSQL
createdb burkina_watch

# Ou avec psql :
psql -U postgres
CREATE DATABASE burkina_watch;
\q
```

#### Étape 3 : Variables d'environnement

Copiez `.env.example` vers `.env` et remplissez les variables :

```bash
cp .env.example .env
```

Éditez `.env` :
```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/burkina_watch

# PostgreSQL direct
PGUSER=votre_utilisateur
PGPASSWORD=votre_mot_de_passe
PGDATABASE=burkina_watch
PGHOST=localhost
PGPORT=5432

# Session
SESSION_SECRET=votre_secret_tres_long_et_aleatoire

# OIDC Auth (Optionnel - pour Replit Auth)
ISSUER_URL=https://replit.com/id/oidc
CLIENT_ID=votre_client_id
CLIENT_SECRET=votre_client_secret

# Email (Resend)
RESEND_API_KEY=votre_cle_resend

# Google Maps (Optionnel)
VITE_GOOGLE_MAPS_API_KEY=votre_cle_google_maps
```

#### Étape 4 : Initialiser la base de données

```bash
npm run db:push
```

#### Étape 5 : Lancer l'application

**Mode développement :**
```bash
npm run dev
```

**Mode production :**
```bash
npm run build
npm start
```

L'application sera accessible sur `http://localhost:5000`

## 🐳 Installation avec Docker (Alternative)

Si vous préférez utiliser Docker :

```bash
# Construire l'image
docker build -t burkina-watch .

# Lancer avec docker-compose
docker-compose up -d
```

## 🌍 Déploiement sur Replit

### Méthode 1 : Import direct

1. Créez un nouveau Repl sur Replit.com
2. Choisissez "Import from GitHub" ou "Upload ZIP"
3. Uploadez ce dossier
4. Replit détectera automatiquement la configuration

### Méthode 2 : Fork

1. Décompressez le ZIP
2. Créez un repository GitHub avec ces fichiers
3. Sur Replit, faites "Import from GitHub"
4. Entrez l'URL de votre repository

### Configuration Replit

Le fichier `.replit` est déjà configuré. Il vous suffit :

1. D'ajouter vos secrets dans l'onglet "Secrets" :
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `RESEND_API_KEY`
   - Etc.

2. Cliquer sur "Run" - l'application se lancera automatiquement

## 📱 Utilisation

### Démarrage rapide

```bash
# Lancer en mode développement (avec hot-reload)
npm run dev

# Lancer en mode production
npm run build
npm start
```

### Commandes disponibles

```bash
# Développement
npm run dev              # Démarre le serveur de développement
npm run check            # Vérification TypeScript

# Build
npm run build            # Compile pour production
npm start                # Démarre le serveur production

# Base de données
npm run db:push          # Applique les changements de schéma
npm run db:push --force  # Force l'application des changements

# Tests
npm test                 # Lance les tests (si configurés)
```

## 🗂️ Structure du projet

```
burkina-watch/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── hooks/       # Hooks React personnalisés
│   │   └── lib/         # Utilitaires
│   └── index.html
├── server/              # Backend Node.js/Express
│   ├── index.ts         # Point d'entrée
│   ├── routes.ts        # Routes API
│   ├── storage.ts       # Couche d'accès aux données
│   └── vite.ts          # Configuration Vite
├── shared/              # Code partagé
│   └── schema.ts        # Schémas Drizzle ORM
├── dist/                # Build de production
├── attached_assets/     # Assets statiques
├── package.json         # Dépendances
└── README_PORTABLE.md   # Ce fichier
```

## 🔧 Dépannage

### Erreur : "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion à la base de données

Vérifiez que :
1. PostgreSQL est démarré : `sudo service postgresql start`
2. La base de données existe : `psql -l`
3. Les credentials dans `.env` sont corrects

### Port déjà utilisé

Si le port 5000 est occupé :
```bash
# Trouver le processus
lsof -i :5000

# Ou changer le port dans server/index.ts
```

### Problème avec les images

Les images sont stockées en base64. Si elles ne s'affichent pas :
1. Vérifiez que la colonne `photo` dans la table `signalements` contient les données
2. Vérifiez les logs du navigateur (F12 > Console)

## 🔐 Sécurité

**Important pour la production :**

1. **Changez `SESSION_SECRET`** : Générez une clé aléatoire forte
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS uniquement** : Utilisez un reverse proxy (Nginx, Caddy) avec SSL

3. **Variables d'environnement** : Ne commitez JAMAIS le fichier `.env`

4. **Base de données** : Utilisez des credentials forts et limitez les accès

## 📊 Base de données

### Tables principales

- `users` - Utilisateurs de la plateforme
- `signalements` - Rapports/signalements
- `signalement_likes` - Système de likes
- `commentaires` - Commentaires
- `notifications` - Notifications utilisateurs
- `tracking_sessions` - Sessions de localisation en temps réel
- `location_points` - Points GPS enregistrés
- `emergency_contacts` - Contacts d'urgence

### Migrations

Le projet utilise Drizzle ORM avec une approche "schema-first" :

```bash
# Pousser les changements de schéma vers la DB
npm run db:push

# Forcer en cas de conflit
npm run db:push --force
```

## 🌐 APIs externes (Optionnelles)

### Cartographie
Le projet utilise OpenStreetMap avec Leaflet - aucune clé API n'est requise.

### Resend (Email)
Pour l'envoi d'emails :
1. Créez un compte sur [Resend.com](https://resend.com)
2. Obtenez votre clé API
3. Ajoutez-la dans `.env` : `RESEND_API_KEY`

## 📞 Support

Pour toute question :
- Documentation : voir `replit.md` pour l'architecture complète
- Issues : Créez une issue sur votre repository
- Email : [votre_email@example.com]

## 📄 Licence

Ce projet est distribué sous licence MIT.

## 🙏 Remerciements

Développé avec ❤️ pour la communauté burkinabè.

Technologies utilisées :
- React 18 + TypeScript
- Express.js
- PostgreSQL + Drizzle ORM
- Tailwind CSS + Shadcn/ui
- OpenStreetMap + Leaflet
- Replit Auth (OIDC)

---

**Version** : 1.0.0
**Dernière mise à jour** : Novembre 2025