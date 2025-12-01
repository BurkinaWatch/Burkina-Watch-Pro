# 🔐 Burkina Watch - Documentation Sécurité

## Vue d'ensemble

BurkinaWatch implémente un système de sécurité multiniveaux pour protéger les données sensibles des citoyens burkinabés. Ce document décrit l'architecture de sécurité, les procédures de maintenance et les mesures d'urgence.

---

## Table des matières

1. [Architecture de sécurité](#architecture-de-sécurité)
2. [Chiffrement des données](#chiffrement-des-données)
3. [Authentification et autorisation](#authentification-et-autorisation)
4. [Protection contre les attaques](#protection-contre-les-attaques)
5. [Audit et traçabilité](#audit-et-traçabilité)
6. [Gestion des clés](#gestion-des-clés)
7. [Migration et rotation](#migration-et-rotation)
8. [Procédures d'urgence](#procédures-durgence)
9. [Checklist de déploiement](#checklist-de-déploiement)

---

## Architecture de sécurité

### Principes fondamentaux

1. **Défense en profondeur** : Multiples couches de protection
2. **Moindre privilège** : Accès minimum nécessaire
3. **Sécurité par défaut** : Configuration sécurisée dès l'installation
4. **Chiffrement partout** : En transit et au repos

### Composants

```
┌─────────────────────────────────────────┐
│         CLIENT (HTTPS/TLS)              │
└────────────┬────────────────────────────┘
             │
             │ TLS 1.3
             │
┌────────────▼────────────────────────────┐
│    MIDDLEWARE SÉCURITÉ                  │
│  - Helmet (CSP, HSTS)                   │
│  - Rate Limiting                        │
│  - Brute Force Protection               │
│  - CORS Strict                          │
│  - Input Sanitization                   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    AUTHENTIFICATION                     │
│  - JWT Access Tokens (15min)            │
│  - Refresh Tokens (hashed)              │
│  - OIDC (Replit Auth)                   │
│  - Session Management                   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    CHIFFREMENT DONNÉES                  │
│  - Envelope Encryption                  │
│  - AES-256-GCM                          │
│  - Field-level Encryption               │
│  - KMS (optionnel)                      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    BASE DE DONNÉES PostgreSQL           │
│  - Données chiffrées                    │
│  - Audit Logs                           │
│  - Tokens hachés                        │
└─────────────────────────────────────────┘
```

---

## Chiffrement des données

### Envelope Encryption Pattern

BurkinaWatch utilise le **pattern d'envelope encryption** pour sécuriser les données sensibles:

1. **Data Key (DEK)** : Clé unique AES-256 générée pour chaque champ chiffré
2. **Master Key (KEK)** : Clé principale qui chiffre les data keys
3. **Stockage sécurisé** : Seules les données chiffrées et les DEK chiffrées sont stockées

#### Processus de chiffrement

```typescript
// 1. Générer une clé de données unique
const dataKey = crypto.randomBytes(32); // 256 bits

// 2. Chiffrer les données avec la data key
const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
const encrypted = cipher.update(plaintext) + cipher.final();
const tag = cipher.getAuthTag();

// 3. Chiffrer la data key avec la master key (ou KMS)
const encryptedKey = encryptMasterKey(dataKey);

// 4. Stocker: {cipherText, encryptedKey, iv, tag}
```

#### Processus de déchiffrement

```typescript
// 1. Déchiffrer la data key avec la master key
const dataKey = decryptMasterKey(encryptedKey);

// 2. Déchiffrer les données avec la data key
const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, iv);
decipher.setAuthTag(tag);
const plaintext = decipher.update(encrypted) + decipher.final();
```

### Champs chiffrés

Les champs suivants sont chiffrés au repos:

- **Utilisateurs** :
  - Email (si l'utilisateur choisit l'anonymat complet)
  - Numéro de téléphone
  - Informations PII sensibles

- **Signalements** :
  - Localisation exacte (si demandé)
  - Identité du reporter (mode anonyme)
  - Médias sensibles (URLs signées)

### Configuration

```env
# Clé principale (32 bytes hex = 64 caractères)
MASTER_ENCRYPTION_KEY=<généré avec: openssl rand -hex 32>

# Optionnel: Google Cloud KMS
KMS_ENABLED=false
KMS_PROJECT_ID=your-project
KMS_LOCATION_ID=global
KMS_KEY_RING_ID=burkina-watch-keys
KMS_CRYPTO_KEY_ID=master-key
```

---

## Authentification et autorisation

### JWT Double Token Pattern

#### Access Tokens
- **Durée de vie** : 15 minutes
- **Stockage** : localStorage (frontend)
- **Contenu** : userId, email, role
- **Signature** : HS256 avec JWT_SECRET

#### Refresh Tokens
- **Durée de vie** : 7 jours
- **Stockage** : HttpOnly Secure Cookie
- **Base de données** : Hash SHA-256 avec salt
- **Rotation** : À chaque refresh

#### Flux d'authentification

```
1. Login → Access Token + Refresh Token
2. Access Token expire → Use Refresh Token
3. Refresh Token → New Access Token + New Refresh Token
4. Logout → Revoke Refresh Token
```

### Protection anti-brute force

```typescript
// Limite par IP/email
- 5 tentatives échouées
- Verrouillage 30 minutes
- Réinitialisation après 15 minutes d'inactivité
```

---

## Protection contre les attaques

### Helmet - Headers HTTP

```typescript
Content-Security-Policy (CSP)
Strict-Transport-Security (HSTS)
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/api/*` (général) | 100 req | 15 min |
| `/api/auth/login` | 5 req | 15 min |
| `/api/signalements` | 20 req | 1 heure |
| `/api/chatbot` | 15 req | 5 min |

### Input Sanitization

- **XSS** : xss-clean middleware
- **HPP** : HTTP Parameter Pollution protection
- **Validation** : Zod schemas côté serveur
- **Size limit** : 20MB max par requête

### CORS

```typescript
// Origins autorisées uniquement
allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.REPLIT_DOMAINS
]
```

---

## Audit et traçabilité

### Logs d'audit

Toutes les actions sensibles sont enregistrées dans `audit_logs`:

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMP NOT NULL
);
```

### Actions tracées

- **Authentification** : LOGIN, LOGOUT, LOGIN_FAILED
- **Signalements** : CREATE, UPDATE, DELETE, STATUS_CHANGE
- **Admin** : ADMIN_ACTION, KEY_ROTATION, USER_BAN
- **Sécurité** : BRUTE_FORCE_LOCKOUT, SUSPICIOUS_ACTIVITY

### Requête audit logs

```typescript
// Voir les actions d'un utilisateur
SELECT * FROM audit_logs 
WHERE user_id = 'user-id'
ORDER BY created_at DESC;

// Voir les actions critiques
SELECT * FROM audit_logs 
WHERE severity = 'critical'
ORDER BY created_at DESC;
```

---

## Gestion des clés

### Option 1: Fallback local (MVP/Dev)

```bash
# Générer une master key
openssl rand -hex 32

# Ajouter dans .env
MASTER_ENCRYPTION_KEY=<clé générée>
```

**Limitations**:
- Clé stockée localement dans secrets Replit
- Pas de rotation automatique
- Adapté pour dev/test uniquement

### Option 2: Google Cloud KMS (Production recommandée)

```bash
# 1. Créer un key ring
gcloud kms keyrings create burkina-watch-keys \
  --location global

# 2. Créer une clé de chiffrement
gcloud kms keys create master-key \
  --location global \
  --keyring burkina-watch-keys \
  --purpose encryption

# 3. Configurer .env
KMS_ENABLED=true
KMS_PROJECT_ID=your-project
KMS_LOCATION_ID=global
KMS_KEY_RING_ID=burkina-watch-keys
KMS_CRYPTO_KEY_ID=master-key
```

**Avantages**:
- Rotation automatique des clés
- Audit des accès aux clés
- Haute disponibilité
- Conformité RGPD/GDPR

---

## Migration et rotation

### Migration des données existantes

Script `migrate_encrypt.js` pour chiffrer les données non chiffrées:

```bash
# 1. Backup de la base de données
pg_dump burkina_watch > backup_$(date +%Y%m%d).sql

# 2. Activer le mode maintenance
export MAINTENANCE_MODE=true

# 3. Exécuter la migration
node scripts/migrate_encrypt.js

# 4. Vérifier l'intégrité
node scripts/verify_encryption.js

# 5. Désactiver le mode maintenance
export MAINTENANCE_MODE=false
```

### Rotation des clés

#### Rotation manuelle (fallback local)

```bash
# 1. Générer nouvelle master key
NEW_KEY=$(openssl rand -hex 32)

# 2. Exécuter endpoint de rotation
curl -X POST https://your-app/admin/rotate-key \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"newMasterKey\": \"$NEW_KEY\"}"

# 3. Mettre à jour .env
MASTER_ENCRYPTION_KEY=$NEW_KEY
```

#### Rotation automatique (KMS)

```bash
# Configurer rotation automatique (90 jours)
gcloud kms keys update master-key \
  --location global \
  --keyring burkina-watch-keys \
  --rotation-period 90d \
  --next-rotation-time $(date -d '+90 days' +%Y-%m-%dT%H:%M:%SZ)
```

---

## Procédures d'urgence

### Compromission de clé suspectée

1. **Immédiat** (< 5 minutes):
   ```bash
   # Activer mode maintenance
   export MAINTENANCE_MODE=true
   
   # Révoquer tous les refresh tokens
   psql -d burkina_watch -c "UPDATE refresh_tokens SET revoked_at = NOW()"
   ```

2. **Court terme** (< 1 heure):
   ```bash
   # Générer nouvelle master key
   NEW_KEY=$(openssl rand -hex 32)
   
   # Rotation d'urgence
   node scripts/emergency_rotate.js --new-key $NEW_KEY
   
   # Forcer déconnexion de tous les utilisateurs
   redis-cli FLUSHALL
   ```

3. **Moyen terme** (< 24 heures):
   ```bash
   # Audit complet
   node scripts/security_audit.js
   
   # Notifier les utilisateurs affectés
   node scripts/notify_users.js --incident security-breach
   
   # Rapport incident
   node scripts/generate_incident_report.js
   ```

### Fuite de données

1. **Identifier l'étendue**:
   ```sql
   SELECT action, resource_type, COUNT(*) 
   FROM audit_logs 
   WHERE created_at > '[timestamp_incident]'
   GROUP BY action, resource_type;
   ```

2. **Isolation**:
   - Bloquer l'IP source
   - Révoquer les credentials compromis
   - Activer alertes sur activités suspectes

3. **Conformité légale**:
   - Notification CNIL (72h)
   - Communication utilisateurs (si données personnelles)
   - Documentation complète incident

---

## Checklist de déploiement

### Avant le déploiement

- [ ] **Génération des clés**
  ```bash
  openssl rand -hex 32  # MASTER_ENCRYPTION_KEY
  openssl rand -hex 32  # JWT_SECRET
  openssl rand -hex 32  # JWT_REFRESH_SECRET
  openssl rand -hex 32  # REFRESH_TOKEN_SALT
  ```

- [ ] **Configuration KMS** (production)
  - [ ] Créer key ring Google Cloud
  - [ ] Créer clé de chiffrement
  - [ ] Configurer rotation automatique
  - [ ] Tester accès aux clés

- [ ] **Variables d'environnement**
  - [ ] Toutes les clés générées et configurées
  - [ ] DATABASE_URL sécurisée
  - [ ] HTTPS activé (NODE_ENV=production)
  - [ ] Domaines CORS configurés

- [ ] **Base de données**
  - [ ] Backup récent testé
  - [ ] Tables audit_logs et refresh_tokens créées
  - [ ] Index de performance ajoutés
  - [ ] Connexions SSL activées

### Tests de sécurité

- [ ] **TLS/HTTPS**
  ```bash
  curl -I https://your-app.com | grep "Strict-Transport-Security"
  ```

- [ ] **Headers de sécurité**
  ```bash
  curl -I https://your-app.com | grep -E "(X-Frame-Options|Content-Security-Policy)"
  ```

- [ ] **Rate limiting**
  ```bash
  # Tester limite de connexion
  for i in {1..10}; do curl -X POST https://your-app.com/api/auth/login; done
  ```

- [ ] **Chiffrement**
  ```bash
  # Vérifier données chiffrées en base
  psql -d burkina_watch -c "SELECT * FROM users LIMIT 1;"
  # Les champs sensibles doivent être illisibles
  ```

- [ ] **Audit logs**
  ```bash
  # Vérifier création logs
  psql -d burkina_watch -c "SELECT COUNT(*) FROM audit_logs;"
  ```

### Après le déploiement

- [ ] **Monitoring actif**
  - [ ] Alertes sur tentatives de brute force
  - [ ] Monitoring taux d'erreur 4xx/5xx
  - [ ] Alertes sur pics d'utilisation inhabituels

- [ ] **Documentation**
  - [ ] Procédures d'urgence accessibles
  - [ ] Contacts équipe sécurité
  - [ ] Plan de sauvegarde et restauration

- [ ] **Audit périodique**
  - [ ] npm audit (hebdomadaire)
  - [ ] Revue logs d'audit (quotidienne)
  - [ ] Test de pénétration (trimestriel)

---

## Contacts et support

### Équipe sécurité

- **Responsable sécurité** : security@burkinawatch.com
- **Incidents urgents** : +226 65511323
- **Rapports confidentiels** : security-reports@burkinawatch.com

### Ressources externes

- **CNIL** : https://www.cnil.fr (notification breaches)
- **CERT-FR** : https://www.cert.ssi.gouv.fr
- **OWASP** : https://owasp.org/www-project-top-ten

---

## Annexes

### A. Commandes utiles

```bash
# Générer clé de chiffrement
openssl rand -hex 32

# Exécuter les tests unitaires d'encryption
MASTER_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" \
REFRESH_TOKEN_SALT="test_salt_0123456789abcdef0123456789abcdef0123456789abcdef" \
tsx --test server/__tests__/encryptionService.test.ts

# Backup base de données
pg_dump burkina_watch > backup.sql

# Restaurer backup
psql burkina_watch < backup.sql

# Audit npm dependencies
npm audit

# Scanner vulnérabilités
npm audit fix

# Test connexion TLS
openssl s_client -connect your-app.com:443
```

### B. Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NIST Encryption Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-11-14  
**Maintenu par**: Équipe Sécurité Burkina Watch
