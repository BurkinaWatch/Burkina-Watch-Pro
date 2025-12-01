# 🎉 Export Portable Terminé !

## Récapitulatif de l'exportation

Votre projet **Burkina Watch** a été empaqueté avec succès et est prêt pour une installation portable sur n'importe quel système !

---

## 📦 Fichier d'archive créé

**Fichier** : `burkina-watch-portable.tar.gz`  
**Taille** : 6.9 MB (180 fichiers)  
**Format** : Archive TAR compressée (GZIP)  

---

## 📄 Fichiers de documentation inclus

### 1. **README_PORTABLE.md**
Guide complet d'installation et d'utilisation avec :
- Instructions d'installation (automatique et manuelle)
- Prérequis système
- Configuration des variables d'environnement
- Déploiement sur Replit, VPS, ou serveur local
- Dépannage et FAQ

### 2. **DOCUMENTATION_TECHNIQUE.md**
Documentation technique approfondie incluant :
- Architecture complète du système
- Schéma de base de données détaillé
- Liste complète des routes API
- Exemples de code
- Guide de déploiement et maintenance

### 3. **MANIFEST.txt**
Liste exhaustive de tous les fichiers inclus dans l'archive

### 4. **.env.example**
Modèle de configuration avec toutes les variables d'environnement nécessaires

---

## 🛠️ Scripts d'installation et de démarrage

### **setup.sh** (exécutable)
Script d'installation automatique qui :
- Vérifie les prérequis (Node.js, PostgreSQL, npm)
- Installe les dépendances npm
- Configure l'environnement (.env)
- Crée la base de données
- Initialise le schéma
- Compile le projet

**Utilisation** :
```bash
chmod +x setup.sh
./setup.sh
```

### **start.sh** (exécutable)
Script de démarrage avec menu interactif pour :
- Lancer en mode développement
- Lancer en mode production
- Compiler uniquement
- Vérifier les types TypeScript

**Utilisation** :
```bash
chmod +x start.sh
./start.sh
```

Ou en ligne de commande directe :
```bash
./start.sh dev        # Mode développement
./start.sh prod       # Mode production
./start.sh build      # Compiler uniquement
./start.sh check      # Vérifier les types
```

---

## 📂 Contenu de l'archive

### Code source complet
- ✅ Frontend React (TypeScript, Vite)
- ✅ Backend Express.js (TypeScript)
- ✅ Schémas de base de données (Drizzle ORM)
- ✅ Configuration complète (Vite, Tailwind, TypeScript, etc.)

### Build de production
- ✅ Frontend compilé dans `/dist/public`
- ✅ Backend compilé dans `/dist/index.js`
- ✅ Assets optimisés

### Fichiers de configuration
- ✅ `.replit` pour déploiement sur Replit
- ✅ `package.json` avec toutes les dépendances
- ✅ Configuration TypeScript, Vite, Tailwind, Drizzle

### Assets
- ✅ Logo de l'application
- ✅ Images d'illustration
- ✅ Autres ressources statiques

---

## 🚀 Étapes d'installation rapide

### 1. Extraire l'archive

```bash
tar -xzf burkina-watch-portable.tar.gz
cd burkina-watch
```

### 2. Lancer l'installation automatique

```bash
./setup.sh
```

### 3. Configurer les variables d'environnement

Éditez le fichier `.env` créé par le script :

```bash
nano .env  # ou vim, code, etc.
```

Remplissez au minimum :
- `DATABASE_URL` : Connexion PostgreSQL
- `SESSION_SECRET` : Secret aléatoire
- `RESEND_API_KEY` : Clé API Resend (optionnel mais recommandé)

### 4. Lancer l'application

```bash
./start.sh
```

Choisissez l'option 1 (développement) ou 2 (production).

L'application sera accessible sur : **http://localhost:5000**

---

## 🌍 Déploiement sur différentes plateformes

### Sur Replit (Recommandé)

1. Créez un nouveau Repl
2. Importez depuis GitHub ou uploadez l'archive
3. Ajoutez vos secrets dans l'onglet "Secrets"
4. Cliquez sur "Run"

### Sur un VPS (DigitalOcean, AWS, etc.)

1. Uploadez l'archive sur votre serveur
2. Installez Node.js 18+ et PostgreSQL 14+
3. Suivez les étapes d'installation rapide ci-dessus
4. Configurez un reverse proxy (Nginx) pour HTTPS

### Sur votre machine locale (Développement)

1. Installez Node.js et PostgreSQL
2. Extrayez l'archive
3. Lancez `./setup.sh`
4. Lancez `./start.sh dev`

---

## 📊 Prérequis système

### Logiciels requis

| Logiciel | Version minimale |
|----------|------------------|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x |

### Vérifier vos versions

```bash
node --version    # Doit être >= 18.x
npm --version     # Doit être >= 9.x
psql --version    # Doit être >= 14.x
```

---

## 🔑 Variables d'environnement essentielles

### Obligatoires

```env
DATABASE_URL=postgresql://user:password@localhost:5432/burkina_watch
SESSION_SECRET=votre_secret_tres_long_et_aleatoire
```

### Recommandées

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXX
```

### Optionnelles (pour Replit Auth)

```env
ISSUER_URL=https://replit.com/id/oidc
CLIENT_ID=votre_client_id
CLIENT_SECRET=votre_client_secret
```

---

## 📞 Support et aide

### Documentation complète

- **Installation** : Consultez `README_PORTABLE.md`
- **Technique** : Consultez `DOCUMENTATION_TECHNIQUE.md`
- **Contenu** : Consultez `MANIFEST.txt`

### En cas de problème

1. Vérifiez les prérequis système
2. Consultez la section "Dépannage" dans `README_PORTABLE.md`
3. Vérifiez les logs d'erreur
4. Assurez-vous que PostgreSQL est démarré
5. Vérifiez que `.env` est correctement configuré

### Commandes de dépannage

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Forcer la synchronisation de la base de données
npm run db:push --force

# Vérifier les types TypeScript
npm run check
```

---

## ✅ Checklist avant démarrage

- [ ] Node.js 18+ installé
- [ ] PostgreSQL 14+ installé et démarré
- [ ] Archive extraite
- [ ] Dépendances installées (`npm install` ou `./setup.sh`)
- [ ] Base de données créée
- [ ] Fichier `.env` configuré avec vos valeurs
- [ ] Schéma de base de données initialisé (`npm run db:push`)

Une fois tout coché, lancez : `./start.sh` 🚀

---

## 🎯 Fonctionnalités principales de l'application

### Pour les citoyens
- 📍 Publier des signalements géolocalisés
- 🚨 Envoyer des alertes SOS
- 🗺️ Visualiser les incidents sur une carte interactive
- 💬 Commenter et liker les signalements
- 📧 Recevoir des notifications
- 📱 Suivre sa position GPS en temps réel
- 👥 Gérer des contacts d'urgence

### Pour les institutions
- 👁️ Visualiser tous les signalements
- ✅ Répondre et résoudre les incidents
- 📊 Accéder à un tableau de bord d'urgences
- 🔔 Recevoir des alertes en temps réel

---

## 📜 Licence

Ce projet est distribué sous licence MIT.

---

## 🙏 Merci !

Merci d'utiliser **Burkina Watch** ! Cette plateforme a été créée pour renforcer l'engagement citoyen au Burkina Faso.

**Développé avec ❤️ pour la communauté burkinabè.**

---

## 📌 Informations du package

**Nom du projet** : Burkina Watch  
**Version** : 1.0.0  
**Date d'export** : Novembre 2025  
**Taille de l'archive** : 6.9 MB (180 fichiers)  
**Format** : `.tar.gz` (compatible Linux, macOS, Windows avec WSL)

---

**Bon déploiement ! 🚀**
