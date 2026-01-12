# 🌍 Burkina Watch Pro - Package d'Exportation Portable

[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D14.0-blue.svg)](https://postgresql.org)

> **Plateforme citoyenne de veille et d'engagement pour le Burkina Faso**
> 
> Burkina Watch permet aux citoyens de signaler anonymement des incidents (accidents, corruption, problèmes d'infrastructure), de demander ou offrir de l'aide via un système SOS, et de visualiser les rapports en temps réel sur une carte interactive.

## 📦 Contenu du Package

Ce package d'exportation contient tout le nécessaire pour déployer Burkina Watch sur n'importe quel environnement:

```
BurkinaWatch_Pro_Export/
├── client/                 # Application React (Frontend)
├── server/                 # API Express (Backend)
├── shared/                 # Schémas et types partagés
├── dist/                   # Build de production compilé
│   ├── public/            # Assets statiques (HTML, CSS, JS, images)
│   └── index.js           # Serveur backend compilé
├── attached_assets/        # Ressources statiques (images, logos)
├── .env.example           # Template de configuration
├── package.json           # Définition du projet et dépendances
├── setup.sh               # Script d'installation Linux/macOS
├── install.bat            # Script d'installation Windows
├── MANIFEST.txt           # Liste du contenu du package
├── VERSION                # Version et date du build
├── README_PORTABLE.md     # Ce fichier
└── replit.md              # Documentation technique complète

Note: node_modules/ N'EST PAS inclus - installé automatiquement via npm install
```

---

## 🚀 Installation Rapide

### Option 1: Installation Automatique (Recommandé)

#### Sur Linux / macOS:
```bash
chmod +x setup.sh
./setup.sh
```

#### Sur Windows:
```cmd
install.bat
```

### Option 2: Installation Manuelle

#### Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- **Node.js** >= 18.0.0 ([télécharger](https://nodejs.org/))
- **PostgreSQL** >= 14.0 ([télécharger](https://www.postgresql.org/download/))
- **npm** ou **yarn** (inclus avec Node.js)

Vérifiez les versions installées:
```bash
node --version   # doit afficher v18.x.x ou supérieur
npm --version    # doit afficher 9.x.x ou supérieur
psql --version   # doit afficher PostgreSQL 14.x ou supérieur
```

---

## 📋 Installation Étape par Étape

### 1. Extraction du Package

```bash
# Extraire l'archive tar.gz
tar -xzf BurkinaWatch_Pro_Export.tar.gz
cd BurkinaWatch_Pro_Export
```

### 2. Configuration de la Base de Données

#### a) Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE burkina_watch;

# Créer un utilisateur (optionnel)
CREATE USER burkina_admin WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE burkina_watch TO burkina_admin;

# Quitter psql
\q
```

#### b) Configurer les variables d'environnement

```bash
# Copier le template .env.example vers .env
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env  # ou vim, code, notepad++, etc.
```

**Variables Obligatoires à configurer:**

```env
# Base de données
DATABASE_URL=postgresql://postgres:votre_password@localhost:5432/burkina_watch

# Secret de session (générer avec la commande ci-dessous)
SESSION_SECRET=votre_secret_aleatoire_32_caracteres

# OpenAI (pour le chatbot IA)
OPENAI_API_KEY=sk-proj-votre-cle-openai

# Resend (pour les emails)
RESEND_API_KEY=re_votre-cle-resend

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=votre-cle-google-maps
```

**Générer un SESSION_SECRET sécurisé:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Installation des Dépendances

```bash
# Les node_modules sont déjà inclus, mais vous pouvez réinstaller si nécessaire
npm install
```

### 4. Migration de la Base de Données

```bash
# Pousser le schéma vers PostgreSQL
npm run db:push

# Si vous avez des warnings de perte de données, forcez avec:
npm run db:push -- --force
```

### 5. Lancer l'Application

#### Mode Développement (avec Hot Reload)
```bash
npm run dev
```

#### Mode Production (utilise le build pré-compilé)
```bash
# Démarrer le serveur de production
NODE_ENV=production node dist/index.js
```

L'application sera accessible sur:
- **URL locale:** http://localhost:5000
- **Réseau local:** http://[votre-ip]:5000

---

## 🔐 Configuration des Services Externes

### 1. Replit Auth (Authentification OIDC)

Pour permettre aux utilisateurs de se connecter avec Google, GitHub, etc.:

1. Allez sur [Replit Account](https://replit.com/account)
2. Créez une nouvelle application OIDC
3. Configurez l'URL de redirection: `http://votre-domaine/api/auth/callback`
4. Copiez `CLIENT_ID` et `CLIENT_SECRET` dans `.env`

### 2. Google Maps API

Pour la carte interactive et la géolocalisation:

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Activez les APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Créez une clé API et copiez-la dans `VITE_GOOGLE_MAPS_API_KEY`

### 3. OpenAI API

Pour le chatbot "Assistance Burkina Watch":

1. Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Générez une clé API
3. Copiez-la dans `OPENAI_API_KEY`

### 4. Resend (Email)

Pour l'envoi d'emails (tracking de localisation):

1. Créez un compte sur [Resend](https://resend.com/)
2. Vérifiez votre domaine d'envoi
3. Générez une clé API et copiez-la dans `RESEND_API_KEY`
4. Configurez `FROM_EMAIL` avec votre email vérifié

---

## 🌐 Déploiement en Production

### Option 1: Sur un Serveur VPS (Ubuntu/Debian)

```bash
# 1. Installer Node.js et PostgreSQL
sudo apt update
sudo apt install nodejs npm postgresql

# 2. Créer un utilisateur système
sudo useradd -m -s /bin/bash burkina

# 3. Copier les fichiers
sudo cp -r BurkinaWatch_Pro /home/burkina/
sudo chown -R burkina:burkina /home/burkina/BurkinaWatch_Pro

# 4. Configurer PostgreSQL et .env
# (suivez les étapes 2 et 3 ci-dessus)

# 5. Installer PM2 pour gérer le processus
sudo npm install -g pm2

# 6. Démarrer l'application
cd /home/burkina/BurkinaWatch_Pro
pm2 start dist/index.js --name burkina-watch
pm2 save
pm2 startup
```

### Option 2: Avec Docker (recommandé pour la production)

Créez un `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

Puis:
```bash
docker build -t burkina-watch .
docker run -d -p 5000:5000 --env-file .env burkina-watch
```

### Option 3: Sur Replit

1. Créez un nouveau Repl
2. Uploadez tous les fichiers du package
3. Configurez les secrets dans l'onglet "Secrets"
4. Cliquez sur "Run"

---

## 🧪 Tests et Vérification

### Vérifier que l'application fonctionne:

```bash
# Tester la connexion à la base de données
npm run db:push

# Lancer les tests (si disponibles)
npm test

# Vérifier la compilation TypeScript
npm run check

# Builder pour la production
npm run build
```

### Points de test manuels:

1. ✅ **Page d'accueil**: http://localhost:5000
2. ✅ **Authentification**: Cliquer sur "Connexion"
3. ✅ **Créer un signalement**: Aller sur "/publier"
4. ✅ **Carte interactive**: Visualiser les signalements sur la carte
5. ✅ **Chatbot IA**: Cliquer sur le bouton flottant "IA"
6. ✅ **Tracking GPS**: Activer depuis le profil utilisateur

---

## 📱 Fonctionnalités Principales

### Pour les Citoyens

- 📝 **Signalements anonymes**: Rapporter des incidents (accidents, corruption, infrastructure)
- 🚨 **SOS d'urgence**: Demander de l'aide ou signaler une urgence
- 🗺️ **Carte interactive**: Visualiser les signalements en temps réel
- 📍 **Tracking GPS**: Enregistrer votre position pour la sécurité
- 💬 **Commentaires & Likes**: Interagir avec les signalements
- 🤖 **Chatbot IA**: Assistance intelligente en français
- 📧 **Notifications**: Recevoir des alertes en temps réel

### Pour les Institutions

- 📊 **Tableau de bord admin**: Vue d'ensemble des signalements
- 🔍 **Filtrage avancé**: Par catégorie, statut, urgence
- ✅ **Gestion des statuts**: Marquer comme résolu/en cours
- 📈 **Statistiques**: Visualiser les tendances

---

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Compiler pour la production
npm run check        # Vérifier TypeScript
npm run db:push      # Migrer la base de données
npm start            # Démarrer (après build)
```

---

## 🌍 Multi-Plateforme

Ce package fonctionne sur:

- ✅ **Windows** 10/11 (64-bit)
- ✅ **macOS** 11+ (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu, Debian, Fedora, Arch)
- ✅ **Replit** (déploiement cloud)
- ✅ **Docker** (containerisé)

---

## 📞 Support & Documentation

### Documentation Technique

Consultez `replit.md` pour la documentation technique complète incluant:
- Architecture du système
- Schéma de base de données
- API endpoints
- Guide de développement

### Problèmes Courants

**1. Erreur "Cannot connect to database"**
```bash
# Vérifiez que PostgreSQL est lancé
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Testez la connexion
psql -U postgres -d burkina_watch
```

**2. Erreur "Port 5000 already in use"**
```bash
# Changez le port dans .env
PORT=3000

# Ou tuez le processus qui utilise le port
sudo lsof -ti:5000 | xargs kill -9  # Linux/macOS
netstat -ano | findstr :5000        # Windows
```

**3. Build échoue avec des erreurs TypeScript**
```bash
# Ignorez les warnings et forcez le build
npm run build -- --force
```

### Contact

- 📧 Email: contact@burkinawatch.com
- 📱 Téléphone: +226 65511323
- 💬 WhatsApp: +226 70019540
- 🌐 Website: https://burkinawatch.com

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🙏 Remerciements

Merci à tous les contributeurs et à la communauté burkinabè pour leur engagement envers la sécurité et la transparence.

**Burkina Watch** - *Voir. Agir. Protéger.*

---

**Version:** 1.0.0  
**Date:** 2025-11-12  
**Auteur:** Équipe Burkina Watch
