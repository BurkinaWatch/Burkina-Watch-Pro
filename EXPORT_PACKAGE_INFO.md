# 📦 Burkina Watch Pro - Package d'Exportation

## ✅ Package Créé avec Succès

**Fichier:** `BurkinaWatch_Pro_Export.tar.gz`  
**Taille:** 7.5 MB  
**Format:** tar.gz (compatible Linux, macOS, Windows)  
**Date:** 2025-11-12  
**Version:** 1.0.0

---

## 📋 Contenu du Package

### ✅ Sources Complètes
- `client/` - Application React (Frontend)
- `server/` - API Express (Backend)
- `shared/` - Schémas et types TypeScript partagés

### ✅ Build de Production
- `dist/` - **Build compilé prêt à déployer** (89 KB backend + assets frontend)
  - `dist/index.js` - Serveur backend compilé
  - `dist/public/` - Assets statiques (HTML, CSS, JS 860 KB, images 3 MB)

### ✅ Assets & Ressources
- `attached_assets/` - Images, logos et ressources statiques

### ✅ Configuration Complète
- `package.json` + `package-lock.json` - Gestion des dépendances
- `tsconfig.json` - Configuration TypeScript
- `vite.config.ts` - Configuration du bundler Vite
- `tailwind.config.ts` - Configuration Tailwind CSS
- `drizzle.config.ts` - Configuration ORM Drizzle
- `.env.example` - Template variables d'environnement avec toutes les clés API

### ✅ Documentation
- `README_PORTABLE.md` - **Guide d'installation complet** (10 KB)
- `replit.md` - Documentation technique architecture (8 KB)
- `MANIFEST.txt` - Liste détaillée du contenu

### ✅ Scripts d'Installation Automatique
- `setup.sh` - Installation Linux/macOS (7 KB, exécutable)
- `install.bat` - Installation Windows (6 KB)

---

## 🚀 Utilisation du Package

### Extraction

**Linux / macOS:**
```bash
tar -xzf BurkinaWatch_Pro_Export.tar.gz
cd BurkinaWatch_Pro_Export
```

**Windows (avec tar inclus dans Windows 10+):**
```cmd
tar -xzf BurkinaWatch_Pro_Export.tar.gz
cd BurkinaWatch_Pro_Export
```

**Windows (avec 7-Zip, WinRAR, etc.):**
- Clic droit sur le fichier → Extraire ici
- Ouvrir le dossier `BurkinaWatch_Pro_Export`

### Installation Rapide

**Option 1: Automatique (Recommandé)**

Linux/macOS:
```bash
chmod +x setup.sh
./setup.sh
```

Windows:
```cmd
install.bat
```

**Option 2: Manuelle**

1. Installer Node.js >= 18.0.0
2. Installer PostgreSQL >= 14.0
3. Configurer `.env` (copier `.env.example`)
4. Exécuter:
```bash
npm install
npm run db:push
npm run dev
```

### Lancement en Production

```bash
# Mode production (utilise le build pré-compilé dans dist/)
NODE_ENV=production node dist/index.js
```

L'application sera accessible sur http://localhost:5000

---

## 🔧 Configuration Requise

### Logiciels
- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0
- ✅ PostgreSQL >= 14.0

### Clés API (obligatoires)
Configurez dans `.env`:

1. **DATABASE_URL** - Connexion PostgreSQL
   ```
   postgresql://user:password@localhost:5432/burkina_watch
   ```

2. **SESSION_SECRET** - Secret de session (32+ caractères)
   ```bash
   # Générer avec:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **OPENAI_API_KEY** - Pour le chatbot IA
   - Obtenir sur: https://platform.openai.com/api-keys

4. **RESEND_API_KEY** - Pour l'envoi d'emails
   - Obtenir sur: https://resend.com/api-keys

5. **VITE_GOOGLE_MAPS_API_KEY** - Pour la carte interactive
   - Obtenir sur: https://console.cloud.google.com/

6. **Replit Auth** (optionnel si vous utilisez une autre méthode d'auth)
   - CLIENT_ID, CLIENT_SECRET, ISSUER_URL

---

## 📱 Fonctionnalités Incluses

### Pour les Citoyens
- ✅ Signalements anonymes (accidents, corruption, infrastructure)
- ✅ SOS d'urgence avec géolocalisation
- ✅ Carte interactive en temps réel
- ✅ Tracking GPS de sécurité
- ✅ Commentaires et likes
- ✅ Chatbot IA "Assistance Burkina Watch"
- ✅ Notifications en temps réel
- ✅ Profil utilisateur personnalisable

### Pour les Institutions
- ✅ Tableau de bord administrateur
- ✅ Gestion des signalements
- ✅ Statistiques et analytics
- ✅ Système de points et leaderboard

---

## 🌍 Portabilité

Ce package fonctionne sur:
- ✅ **Windows** 10/11 (64-bit)
- ✅ **macOS** 11+ (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu, Debian, Fedora, Arch, etc.)
- ✅ **Replit** (upload et run)
- ✅ **Docker** (peut être containerisé)
- ✅ **VPS/Cloud** (AWS, DigitalOcean, etc.)

---

## 📊 Statistiques du Build

```
Total fichiers sources: ~200 fichiers
Lignes de code: ~15,000 lignes
Taille sans node_modules: 7.5 MB
Taille avec node_modules: ~400 MB (installé localement)
Technologies: React, TypeScript, Express, PostgreSQL, Drizzle ORM
```

---

## ⚡ Performance

- ✅ Build optimisé avec Vite (production)
- ✅ Code splitting automatique
- ✅ Assets optimisés et compressés
- ✅ CSS minifié (103 KB → 16 KB gzip)
- ✅ JavaScript minifié (860 KB → 255 KB gzip)

---

## 🧪 Tests Recommandés

Après installation, testez:

1. ✅ Page d'accueil: http://localhost:5000
2. ✅ Authentification (connexion/déconnexion)
3. ✅ Créer un signalement: `/publier`
4. ✅ Publier un SOS: `/sos/publier`
5. ✅ Carte interactive: `/carte`
6. ✅ Chatbot IA (bouton flottant)
7. ✅ Tracking GPS (profil utilisateur)
8. ✅ Notifications (icône cloche)

---

## 📞 Support

En cas de problème lors de l'installation ou de l'utilisation:

**Contact:**
- 📧 Email: support@burkinawatch.com
- 📱 Téléphone: +226 65511323
- 💬 WhatsApp: +226 70019540

**Documentation:**
- `README_PORTABLE.md` - Guide complet d'installation
- `replit.md` - Documentation technique détaillée

**Problèmes courants:**
1. **Erreur base de données** → Vérifiez DATABASE_URL dans .env
2. **Port 5000 occupé** → Changez PORT dans .env
3. **Build échoue** → Essayez `npm run build -- --force`

---

## 📝 Notes Importantes

1. ⚠️ **node_modules NON INCLUS** - Pour réduire la taille, les dépendances seront installées via `npm install`

2. ✅ **Build de production INCLUS** - Fichiers compilés dans `dist/` prêts à lancer

3. 🔐 **Secrets NON INCLUS** - Configurez vos clés API dans `.env` (voir `.env.example`)

4. 📦 **Package autonome** - Tous les fichiers sources et configs nécessaires inclus

5. 🚀 **Prêt pour déploiement** - Utilisable immédiatement après configuration

---

## ✨ Prochaines Étapes

1. Extraire l'archive
2. Lire `README_PORTABLE.md`
3. Exécuter le script d'installation (`setup.sh` ou `install.bat`)
4. Configurer `.env` avec vos clés API
5. Lancer l'application avec `npm run dev`
6. Accéder à http://localhost:5000
7. Profiter de Burkina Watch! 🎉

---

**Burkina Watch Pro** - *Voir. Agir. Protéger.*

Version: 1.0.0 | Build Date: 2025-11-12 | Platform: Multi-platform
