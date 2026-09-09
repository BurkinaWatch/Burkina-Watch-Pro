# BURKINAWATCH — PHASE 1.2
## Validation Railway actualisée

**Date :** 9 septembre 2026  
**Périmètre :** accès et validation opérationnelle Railway en lecture seule  
**Règle appliquée :** aucune modification du code, de la base, des secrets ou de la configuration Railway

## 1. Résolution du blocage d’accès

Le blocage initial :

```text
PHASE 1.2 BLOQUÉE — ACCÈS RAILWAY INDISPONIBLE
```

est résolu pour l’accès technique. L’API Railway répond et permet d’inspecter
le projet, l’environnement, les services, le déploiement, les variables
présentes (sans lire leurs valeurs), le domaine et les logs.

## 2. Projet Railway effectivement accessible

```text
Projet       : Sotiss-App
Environnement: production
```

Services présents :

```text
Postgres
SOTISS
```

Le service applicatif `SOTISS` déploie :

```text
BurkinaWatch/SOTISS-Web-App
branche      : main
commit      : 4499740551f42e595bb46e55a905c89fc98c767c
```

Le workspace validé dans cette phase est différent :

```text
workspace local : BurkinaWatch/Burkina-Watch-Pro
remote local    : https://github.com/BurkinaWatch/Burkina-Watch-Pro.git
```

Il n’existe donc pas de preuve que le service Railway actuel déploie le
backend BurkinaWatch validé localement. Cette divergence est la cause réelle
du blocage restant.

## 3. Déploiement Railway

Le dernier déploiement du service `SOTISS` est :

```text
statut          : SUCCESS
déploiement     : non arrêté
réplicas        : 1
builder         : RAILPACK
runtime         : Node 24.20.0
package manager : pnpm 10.26.1
```

Le Build Command et le Start Command sont autodétectés et ne sont pas définis
explicitement dans la configuration du service.

Le déploiement possède un `snapshotId` Railway identifiable. Celui-ci est un
snapshot de déploiement ; il ne constitue pas une preuve d’un backup PostgreSQL
restaurable.

## 4. Logs et domaine

Le domaine Railway est actif :

```text
https://sotiss-production.up.railway.app
port cible : 8080
sync       : ACTIVE
```

Les logs du dernier déploiement contiennent notamment :

```text
Starting Container
Server listening
Public API route smoke check passed
```

Tests HTTP effectués sans mutation :

```text
GET /          = 200
GET /api/stats = 404
```

La racine sert l’application SOTISS. L’absence de `/api/stats` est cohérente
avec le fait que le service observé n’est pas le backend du workspace
BurkinaWatch validé dans ce projet.

## 5. Variables Railway — contrôle de présence uniquement

La liste des variables du service Railway contient notamment :

```text
DATABASE_URL   : PRÉSENTE
SESSION_SECRET : PRÉSENTE
```

Les variables suivantes attendues par le rapport BurkinaWatch ne sont pas
présentes sous ces noms dans le service observé :

```text
RAILWAY_DATABASE_URL
REFRESH_TOKEN_SALT
KMS_ENABLED
MASTER_ENCRYPTION_KEY
KMS_PROJECT_ID
KMS_LOCATION_ID
KMS_KEY_RING_ID
KMS_CRYPTO_KEY_ID
STREETVIEW_STORAGE_PROVIDER
STREETVIEW_S3_BUCKET
STREETVIEW_S3_ACCESS_KEY_ID
STREETVIEW_S3_SECRET_ACCESS_KEY
STREETVIEW_S3_REGION
STREETVIEW_S3_ENDPOINT
```

Cette observation ne doit pas être extrapolée au backend BurkinaWatch :
le service Railway identifié est SOTISS et peut suivre un contrat
d’environnement différent. Aucune valeur secrète n’a été affichée.

## 6. Verdict actualisé

```text
ACCÈS API RAILWAY         = OPERATIONAL
PROJET RAILWAY            = ACCESSIBLE
SERVICE SOTISS            = DEPLOYED / RUNNING
DOMAINE SOTISS            = HTTP 200
BACKEND BURKINAWATCH      = NON IDENTIFIÉ SUR CE SERVICE
WEB BURKINAWATCH          = NON VÉRIFIÉ
POSTGRESQL                = AUCUNE MODIFICATION
MIGRATIONS                = AUCUNE EXÉCUTION
PHASE 1.2 BURKINAWATCH    = BLOQUÉE PAR DIVERGENCE DE PROJET
```

Le blocage d’accès est donc levé. Le blocage de validation BurkinaWatch reste
volontairement ouvert tant que le service Railway cible n’est pas confirmé.

## 7. Action sûre requise

Deux architectures sont possibles, mais aucune ne doit être appliquée
automatiquement :

1. **BurkinaWatch est la cible :** rattacher le déploiement au dépôt
   `BurkinaWatch/Burkina-Watch-Pro`, puis revalider les commandes, les variables
   et le backend sans toucher au service PostgreSQL.
2. **SOTISS est la cible :** conserver le frontend actuel et déployer le
   package API SOTISS comme service séparé, puis vérifier le routage `/api`.

Une bascule silencieuse du service `SOTISS` vers un autre dépôt pourrait
interrompre l’application actuellement publique ; elle n’a pas été effectuée.