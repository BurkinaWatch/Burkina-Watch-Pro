# BURKINAWATCH — PHASE 1.2
## Validation finale de la production Railway

**Date :** 9 septembre 2026  
**Périmètre :** validation opérationnelle Railway uniquement  
**Règle appliquée :** aucune modification du code, de la base, des secrets ou de la chaîne de build

```text
PHASE 1.2 BLOQUÉE — ACCÈS RAILWAY INDISPONIBLE
```

L’environnement courant permet d’inspecter le dépôt Git, d’exécuter des
contrôles locaux et de joindre le PostgreSQL sélectionné par l’environnement
courant en lecture seule. Il ne fournit pas d’accès au projet Railway, à son
service Production, à ses variables, à ses déploiements, à son domaine public
ou à ses logs.

Conformément au cahier des charges, aucune simulation de production Railway
n’a été effectuée et la phase s’arrête après le constat d’accès.

## 1. Projet Railway identifié

**NON VÉRIFIABLE**

Aucun accès au tableau de bord, au projet ou à l’API Railway n’est disponible.
Le dépôt GitHub local est :

```text
https://github.com/BurkinaWatch/Burkina-Watch-Pro.git
```

La présence de ce dépôt ne prouve pas quel projet Railway le déploie.

## 2. Service Production identifié

**NON VÉRIFIABLE**

Le service backend Railway correspondant à BurkinaWatch ne peut pas être
identifié depuis l’environnement courant.

## 3. Branche GitHub déployée

**NON VÉRIFIABLE**

La branche locale est `main`, mais cela ne prouve pas que Railway déploie
`main`. La branche configurée dans Railway n’est pas accessible.

## 4. Domaine Railway

**NON VÉRIFIABLE**

Aucun domaine public Railway n’est disponible dans l’environnement courant.
Le domaine de développement Replit ne doit pas être utilisé comme substitut.

Le statut de publication Replit vérifié séparément est :

```text
isDeployed = false
```

Cela ne donne aucun domaine Railway.

## 5. Variables d'environnement

Les statuts ci-dessous concernent exclusivement le **service Railway
Production**. Comme ce service n’est pas accessible, aucune valeur n’a été
lue et chaque statut est `NON VÉRIFIABLE`.

| Variable | Statut |
| --- | --- |
| `NODE_ENV` | NON VÉRIFIABLE |
| `PORT` | NON VÉRIFIABLE |
| `RAILWAY_DATABASE_URL` | NON VÉRIFIABLE |
| `SESSION_SECRET` | NON VÉRIFIABLE |
| `REFRESH_TOKEN_SALT` | NON VÉRIFIABLE |
| `KMS_ENABLED` | NON VÉRIFIABLE |
| `MASTER_ENCRYPTION_KEY` | NON VÉRIFIABLE |
| `KMS_PROJECT_ID` | NON VÉRIFIABLE |
| `KMS_LOCATION_ID` | NON VÉRIFIABLE |
| `KMS_KEY_RING_ID` | NON VÉRIFIABLE |
| `KMS_CRYPTO_KEY_ID` | NON VÉRIFIABLE |
| `STREETVIEW_STORAGE_PROVIDER` | NON VÉRIFIABLE |
| `STREETVIEW_S3_BUCKET` | NON VÉRIFIABLE |
| `STREETVIEW_S3_ACCESS_KEY_ID` | NON VÉRIFIABLE |
| `STREETVIEW_S3_SECRET_ACCESS_KEY` | NON VÉRIFIABLE |
| `STREETVIEW_S3_REGION` | NON VÉRIFIABLE |
| `STREETVIEW_S3_ENDPOINT` | NON VÉRIFIABLE |
| `STREETVIEW_S3_FORCE_PATH_STYLE` | NON VÉRIFIABLE |
| `STREETVIEW_S3_SESSION_TOKEN` | NON VÉRIFIABLE |
| `STREETVIEW_S3_SIGNED_URL_TTL_SECONDS` | NON VÉRIFIABLE |
| `STREETVIEW_S3_MULTIPART_PART_SIZE_MB` | NON VÉRIFIABLE |

### Contexte local, sans valeur secrète

Un contrôle de présence a été effectué dans l’environnement Replit courant,
mais il ne constitue pas une vérification Railway :

- `RAILWAY_DATABASE_URL` : `PRÉSENTE` localement ;
- `SESSION_SECRET` : `PRÉSENTE` localement ;
- `REFRESH_TOKEN_SALT` : `ABSENTE` localement ;
- `MASTER_ENCRYPTION_KEY` : `PRÉSENTE` localement ;
- `KMS_ENABLED` : `PRÉSENTE` localement ;
- identifiants KMS complémentaires : présence partielle localement ;
- variables S3 principales : `ABSENTES` localement.

Ces statuts locaux ne doivent pas être extrapolés au service Railway.

## 6. Backup / Snapshot

```text
BACKUP = NON ACCESSIBLE
```

L’interface et les données de backup/snapshot Railway ne sont pas accessibles.
Aucun snapshot Railway n’est déclaré confirmé dans ce rapport.

Aucune restauration, suppression ou modification de backup n’a été effectuée.

## 7. Déploiement

```text
DEPLOYMENT = NON EXÉCUTÉ
```

Le déploiement Railway n’a pas été déclenché parce que :

1. le projet Railway n’est pas accessible ;
2. le service Production ne peut pas être identifié ;
3. les variables critiques ne peuvent pas être validées ;
4. le domaine public et les logs ne peuvent pas être contrôlés.

La chaîne de build, la commande de démarrage, la branche, Railpack/Nixpacks et
la configuration du projet n’ont pas été modifiés.

## 8. Logs

```text
LOGS RAILWAY = NON ACCESSIBLES
```

Les logs Railway ne peuvent pas être analysés. Il n’est donc pas possible de
confirmer ou d’exclure sur Railway :

- crash ;
- boucle de redémarrage ;
- erreur PostgreSQL ;
- erreur de session ou de refresh token ;
- erreur KMS ;
- erreur S3/StreetView ;
- erreur de port ou de binding ;
- erreur CORS ;
- erreur fatale au démarrage.

Les logs du workflow Replit de développement sont distincts et ne sont pas
utilisés comme preuve de production Railway.

## 9. Démarrage du processus

```text
PROCESS = NON VÉRIFIABLE SUR RAILWAY
```

Le démarrage `dist/index.js` sur Railway ne peut pas être observé.

Contexte du contrôle Phase 1 précédent, exécuté localement avec le build
actuel, sans prétendre qu’il s’agissait de Railway :

```text
PORT=5050 NODE_ENV=production node dist/index.js
EXIT_CODE=1
REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.
```

Ce résultat local confirme une garde de configuration, mais ne permet pas de
conclure sur la valeur de `REFRESH_TOKEN_SALT` dans Railway.

```text
server.listen() = NON VÉRIFIÉ SUR RAILWAY
process stable  = NON VÉRIFIÉ SUR RAILWAY
```

## 10. HTTP production

Le domaine public Railway n’étant pas identifié, aucun test HTTP Railway n’a
été effectué :

```text
GET /            = NON VÉRIFIABLE
GET /api/stats   = NON VÉRIFIABLE
```

Le workflow Replit de développement répondait précédemment en HTTP 200 sur la
racine et `/api/stats`, mais ce résultat est explicitement exclu de la
validation production Railway.

## 11. Web → Backend Railway

```text
WEB PRODUCTION = NOT VERIFIED
```

Le chemin suivant ne peut pas être confirmé :

```text
Web
  ↓
Railway Backend
  ↓
PostgreSQL
```

Le Web observé dans le workflow Replit ne permet pas de prouver que le frontend
utilise le backend Railway de production.

Aucun composant frontend, aucune route Web, aucune PWA et aucune
fonctionnalité utilisateur n’a été modifié.

## 12. PostgreSQL

```text
POSTGRESQL = UNCHANGED
```

Le contrôle PostgreSQL autorisé a été strictement en lecture seule :

- aucun `db:push` ;
- aucun `drizzle-kit migrate` ;
- aucune migration ;
- aucune création de `__drizzle_migrations` ;
- aucune table modifiée ;
- aucune colonne modifiée ;
- aucun index créé ;
- aucune donnée insérée, supprimée ou déplacée.

Le précontrôle disponible confirme :

```text
37/37 tables publiques
Structure exacte: PASS
Schéma surveillance: PASS
StreetView Phase 3/5: PASS
StreetView Phase 14: PRÉSENTE — vérification uniquement
Précontrôle lecture seule: PASS
```

Cette vérification confirme la structure de la base sélectionnée par
l’environnement courant, mais ne permet pas d’identifier l’association
officielle avec le service Railway Production sans accès Railway.

## 13. StreetView

```text
STREETVIEW PRODUCTION = NOT VALIDATED
```

Le fournisseur effectivement configuré dans Railway ne peut pas être vérifié.
La présence des variables S3 Railway ne peut pas être confirmée.

Aucune clé fictive n’a été créée, aucun fournisseur n’a été remplacé, aucun
fichier StreetView n’a été déplacé et aucune donnée StreetView n’a été modifiée.

## 14. Anomalies restantes

### Anomalie 1

```text
Niveau : BLOQUANT
Symptôme : le projet/service Railway Production n’est pas accessible
Cause probable : absence d’intégration, de CLI ou d’autorisation Railway dans l’environnement courant
Impact : impossible de vérifier les variables, le déploiement, les logs, le domaine et le processus réel
Action nécessaire : ouvrir le projet Railway et fournir un accès de consultation au projet/service Production
```

### Anomalie 2

```text
Niveau : BLOQUANT
Symptôme : REFRESH_TOKEN_SALT est absente de l’environnement local de production contrôlé
Cause probable : variable non configurée dans l’environnement testé
Impact : le processus local de production quitte avant server.listen()
Action nécessaire : vérifier directement la variable dans Railway et l’ajouter si elle est absente, sans modifier le code
```

### Anomalie 3

```text
Niveau : BLOQUANT
Symptôme : la configuration KMS effective n’est pas vérifiable dans Railway
Cause probable : accès Railway indisponible
Impact : impossible de confirmer que la branche de chiffrement de production est complète
Action nécessaire : vérifier KMS_ENABLED et la branche correspondante dans Railway, sans afficher les valeurs
```

### Anomalie 4

```text
Niveau : BLOQUANT
Symptôme : le stockage StreetView production n’est pas vérifiable
Cause probable : accès Railway indisponible
Impact : impossible de confirmer le stockage durable requis en production
Action nécessaire : vérifier le fournisseur et les variables S3 dans Railway
```

### Anomalie 5

```text
Niveau : BLOQUANT
Symptôme : le backup/snapshot Railway n’est pas accessible
Cause probable : accès Railway indisponible
Impact : aucun point de restauration Railway géré ne peut être confirmé
Action nécessaire : confirmer un snapshot identifiable dans l’interface Railway avant toute opération
```

## Verdict final

```text
RAILWAY PRODUCTION        = NOT READY
BACKEND PRODUCTION        = NOT OPERATIONAL
POSTGRESQL                = UNCHANGED
WEB PRODUCTION            = NOT VERIFIED
STREETVIEW PRODUCTION     = NOT VALIDATED
BACKUP                    = NOT ACCESSIBLE
PHASE 2                   = BLOCKED
```

La Phase 1.2 s’arrête ici conformément à la consigne :

```text
PHASE 1.2 BLOQUÉE — ACCÈS RAILWAY INDISPONIBLE
```

Aucune Phase 2, application mobile, Expo, React Native, EAS ou OTA n’a été
commencée.