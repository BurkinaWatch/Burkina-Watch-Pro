# Configuration Render - BurkinaWatch

## 📋 Variables à Configurer sur Render

### Étape 1: Obtenir vos Credentials Replit OIDC

**Sur Replit:**
1. Allez à votre profil → **Settings**
2. Cliquez sur **Connected Applications** (ou **OAuth Applications**)
3. Cherchez une application "BurkinaWatch" ou créez-en une si nécessaire
4. Notez votre:
   - `CLIENT_ID` (ex: `abc123xyz...`)
   - `CLIENT_SECRET` (ex: `secret_xyz...`)

---

## 🚀 Variables à Ajouter sur Render Dashboard

### Accédez à votre service Render:
1. Rendez-vous sur [render.com](https://render.com)
2. Sélectionnez votre service (Web Service)
3. Allez à l'onglet **Environment**
4. Cliquez sur **Add Environment Variable**

### Ajoutez ces 4 variables (IMPORTANT: Respectez la casse exactement):

| Variable | Valeur | Notes |
|----------|--------|-------|
| `CLIENT_ID` | `votre_id_client_replit_ici` | Obtenez depuis Replit Settings → Applications |
| `CLIENT_SECRET` | `votre_secret_client_replit_ici` | Obtenez depuis Replit Settings → Applications |
| `REDIRECT_URI` | `https://votre-app-name.onrender.com/api/auth/callback` | Remplacez `votre-app-name` par le nom de votre service Render |
| `ISSUER_URL` | `https://replit.com/id/oidc` | (Laissez tel quel - c'est la valeur par défaut) |

---

## 📝 Format de Copie Rapide

Voici comment remplir le formulaire sur Render:

```
Variable Name: CLIENT_ID
Value: [VOTRE_ID_CLIENT_REPLIT]

---

Variable Name: CLIENT_SECRET
Value: [VOTRE_SECRET_CLIENT_REPLIT]

---

Variable Name: REDIRECT_URI
Value: https://votre-app-name.onrender.com/api/auth/callback

---

Variable Name: ISSUER_URL
Value: https://replit.com/id/oidc
```

---

## ✅ Autres Variables Requises

Ces variables doivent aussi être configurées (selon votre guide précédent):

```
DATABASE_URL = [from Render PostgreSQL]
NODE_ENV = production
PORT = 3000
SESSION_SECRET = [generate: openssl rand -hex 32]
MASTER_ENCRYPTION_KEY = [generate: openssl rand -hex 32]
REFRESH_TOKEN_SALT = [generate: openssl rand -hex 32]
JWT_SECRET = [generate: openssl rand -hex 32]
JWT_REFRESH_SECRET = [generate: openssl rand -hex 32]
BASE_URL = https://votre-app-name.onrender.com
```

---

## 🔐 Attention Sécurité

- **Ne partagez JAMAIS votre `CLIENT_SECRET`** avec quiconque
- Ne le commettez **JAMAIS** dans Git
- Ces variables sont chiffrées sur Render
- Après l'ajout, Render redéploiera automatiquement votre app

---

## ✨ Après la Configuration

1. Une fois les variables ajoutées sur Render
2. Cliquez sur **Save** ou **Deploy**
3. Render redéploiera automatiquement l'application
4. Attendez le redéploiement (visible dans l'onglet Deployments)
5. Testez la connexion via votre URL Render

---

## 🆘 Si ça ne marche pas

Vérifiez dans les logs Render:
- Dashboard → **Logs**
- Cherchez `clientId must be a non-empty string`
- Assurez-vous que `CLIENT_ID` et `CLIENT_SECRET` sont bien définis
- Vérifiez la casse exacte des noms de variables

