# BURKINAWATCH — PHASE 1.1
## Validation et mise en service de la production Railway

**Date :** 9 septembre 2026  
**Mode :** vérification non destructive  
**Résultat :** phase bloquée par l’absence d’accès au service Railway de production

## 1. État Railway avant intervention

### Accès disponible

L’environnement actuel permet :

- d’inspecter le dépôt Git ;
- d’exécuter le build local ;
- d’exécuter le précontrôle PostgreSQL en lecture seule avec la variable
  présente dans l’environnement courant ;
- d’observer le workflow Replit de développement.

L’environnement actuel ne permet pas :

- d’ouvrir le projet Railway ;
- d’identifier le service Railway exact ;
- d’identifier l’environnement Railway de production ;
- de vérifier les variables dans l’interface Railway ;
- de consulter les logs Railway ;
- de vérifier le domaine public Railway ;
- de modifier les variables Railway ;
- de déclencher ou confirmer un déploiement Railway.

Constats locaux :

- branche Git courante : `main` ;
- dépôt GitHub configuré : `https://github.com/BurkinaWatch/Burkina-Watch-Pro.git` ;
- aucun CLI `railway` disponible ;
- aucune configuration `railway.json` ou `railway.toml` dans le dépôt ;
- le statut de publication Replit est `isDeployed=false` ;
- le domaine Railway, le service Railway et la branche réellement déployée
  sont donc **NON VÉRIFIABLES** depuis cet environnement.

L’état Git avant l’intervention ne présentait aucune modification source
existante. Le cahier des charges attaché est apparu comme fichier non suivi
dans `attached_assets/`; il n’a pas été modifié ni supprimé.

## 2. Variables vérifiées

### Statut dans le service Railway de production

La lecture des variables du service Railway de production n’est pas accessible.
Le statut de chaque variable Railway est donc :

| Variable | Statut Railway |
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

### Contrôle de présence dans l’environnement Replit courant

Ce contrôle ne prouve pas la configuration Railway. Il a uniquement vérifié
la présence des noms dans l’environnement local, sans lire ni afficher les
valeurs :

| Variable | Statut local |
| --- | --- |
| `NODE_ENV` | ABSENTE |
| `PORT` | PRÉSENTE |
| `RAILWAY_DATABASE_URL` | PRÉSENTE |
| `SESSION_SECRET` | PRÉSENTE |
| `REFRESH_TOKEN_SALT` | ABSENTE |
| `KMS_ENABLED` | PRÉSENTE |
| `MASTER_ENCRYPTION_KEY` | PRÉSENTE |
| `KMS_PROJECT_ID` | ABSENTE |
| `KMS_LOCATION_ID` | PRÉSENTE |
| `KMS_KEY_RING_ID` | ABSENTE |
| `KMS_CRYPTO_KEY_ID` | ABSENTE |
| `STREETVIEW_STORAGE_PROVIDER` | ABSENTE |
| `STREETVIEW_S3_BUCKET` | ABSENTE |
| `STREETVIEW_S3_ACCESS_KEY_ID` | ABSENTE |
| `STREETVIEW_S3_SECRET_ACCESS_KEY` | ABSENTE |
| `STREETVIEW_S3_REGION` | ABSENTE |
| `STREETVIEW_S3_ENDPOINT` | ABSENTE |
| `STREETVIEW_STORAGE_DURABLE` | ABSENTE |

Le dernier démarrage production local connu s’est donc arrêté sur :

```text
REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.
```

Cette observation confirme le blocage du runtime local de production, mais ne
permet pas de conclure seule sur la valeur configurée dans Railway.

## 3. Actions effectuées

| Action | Emplacement | Résultat |
| --- | --- | --- |
| Vérification Git | dépôt local | PASS — branche `main`, aucun fichier source modifié |
| Vérification du service Railway | environnement disponible | NON VÉRIFIABLE — aucun accès Railway |
| Recherche de CLI/config Railway | dépôt et outils locaux | aucun CLI et aucune configuration Railway locale trouvés |
| Vérification des noms de variables | environnement local, sans valeurs | réalisée avec statuts uniquement |
| Précontrôle PostgreSQL | `npm run db:railway:preflight` | PASS — lecture seule, aucune modification |
| Vérification de publication Replit | service de publication Replit | aucune publication Replit active |
| Déploiement Railway | non exécuté | accès insuffisant et variables non validées |
| Modification du code | dépôt | aucune |
| Modification des secrets | Railway/Replit | aucune |

La règle `ACTION MANUELLE REQUISE DANS RAILWAY` s’applique.

## 4. PostgreSQL

```text
AUCUNE MODIFICATION
```

Le précontrôle a été exécuté deux fois au total dans les phases précédentes et
cette Phase 1.1, toujours en lecture seule. Le dernier résultat est :

```text
Tables publiques: 37/37
Structure exacte: PASS
gen_random_uuid(): DISPONIBLE
online_sessions.id: text / default=gen_random_uuid()
SQL de 0004: PASS
Schéma surveillance: PASS — tables et index présents
StreetView Phase 3/5: PASS — queue complète
StreetView Phase 14: PRÉSENTE — vérification uniquement
Précontrôle lecture seule: PASS — aucune modification exécutée
Application de 0004: DÉJÀ APPLIQUÉE — vérification lecture seule
```

La table `__drizzle_migrations` reste absente. Aucun journal n’a été créé,
aucune migration n’a été rejouée et aucune table, colonne ou donnée n’a été
modifiée.

Le compteur `online_sessions` observé lors du dernier précontrôle est 70.
Cette table est active dans l’application ; ce compteur n’a pas été modifié par
le précontrôle.

### Backup Railway

```text
BACKUP RAILWAY = NON VÉRIFIÉ
```

Le snapshot/backup géré Railway n’est pas visible depuis l’environnement actuel.
Le dump logique mentionné dans la documentation précédente ne remplace pas la
confirmation d’un snapshot géré dans l’interface Railway.

## 5. Build

Les résultats de la Phase 1 restent valides : aucun fichier source ou package
n’a changé depuis leur exécution.

```text
npm ci --include=dev --legacy-peer-deps = PASS
npm run check                              = PASS
npm run build                              = PASS
```

Versions vérifiées :

```text
Node.js v20.20.0
npm 10.8.2
```

Le build produit toujours :

- `dist/index.js` ;
- `dist/streetview-worker.js` ;
- `dist/public/`.

Les avertissements Vite/PostCSS, les imports statique/dynamique et les gros
chunks frontend restent non bloquants et n’ont pas été corrigés.

## 6. Démarrage production

```text
START = FAIL
server.listen = FAIL
process stable = FAIL
```

Test effectué précédemment avec le build actuel :

```bash
PORT=5050 NODE_ENV=production node dist/index.js
```

Résultat :

```text
EXIT_CODE=1
REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.
```

Le processus s’arrête avant `server.listen()`. Aucun test de stabilité,
d’écoute sur `0.0.0.0` ou de port Railway ne peut être validé.

Il est interdit de contourner ce blocage en modifiant `server/index.ts`,
`server/securityConfig.ts` ou un autre fichier source.

## 7. HTTP production

Les URLs et endpoints Railway publics ne sont pas accessibles ou identifiables
depuis l’environnement actuel.

```text
GET /                  = NON VÉRIFIABLE
GET /api/stats         = NON VÉRIFIABLE
```

Aucun domaine Railway n’a été inventé et aucun endpoint n’a été testé contre un
domaine qui ne serait pas confirmé.

Le contrôle du workflow Replit de développement reste distinct :

```text
GET https://$REPLIT_DEV_DOMAIN/          = HTTP 200
GET https://$REPLIT_DEV_DOMAIN/api/stats = HTTP 200
```

Ces résultats ne valident pas la production Railway.

## 8. PostgreSQL production

Vérifications réellement effectuées :

- connexion au PostgreSQL sélectionné par `RAILWAY_DATABASE_URL` dans
  l’environnement courant ;
- inventaire structurel en lecture seule ;
- 37/37 tables attendues ;
- index 0004 présents ;
- tables et index surveillance présents ;
- queue StreetView Phase 3/5 présente ;
- objets StreetView Phase 14 présents ;
- `gen_random_uuid()` disponible ;
- aucune modification exécutée.

Non vérifié :

- association officielle de cette base au bon service Railway de production ;
- snapshot/backup géré Railway ;
- test de restauration ;
- configuration visible dans l’interface Railway.

## 9. StreetView

```text
STORAGE = NON VALIDÉ
```

La configuration du service Railway n’est pas accessible. Le code choisit S3
par défaut lorsque `NODE_ENV=production`, mais la présence des variables S3
dans Railway n’a pas pu être vérifiée.

Le contrôle local montre les noms S3 requis absents de l’environnement Replit
courant. Aucune clé inventée n’a été utilisée, aucun fichier StreetView n’a été
déplacé et aucune donnée StreetView n’a été modifiée.

Action manuelle nécessaire dans Railway :

1. vérifier `STREETVIEW_STORAGE_PROVIDER` ;
2. si la valeur effective est `s3`, vérifier
   `STREETVIEW_S3_BUCKET`, `STREETVIEW_S3_ACCESS_KEY_ID` et
   `STREETVIEW_S3_SECRET_ACCESS_KEY` ;
3. vérifier les paramètres optionnels du fournisseur ;
4. ne lancer le déploiement qu’après validation de cette configuration.

## 10. Logs Railway

```text
LOGS RAILWAY = NON VÉRIFIABLES
```

Les logs Railway ne sont pas accessibles depuis l’environnement actuel.

Logs réellement observés dans le workflow Replit, qui ne sont pas des logs
Railway :

- réponses HTTP 200 de l’application Web et des API principales ;
- erreur réseau externe `FasoZine` non bloquante ;
- erreur de parsing XML d’une source `SIG` non bloquante ;
- données météo simulées lorsque la clé météo n’est pas utilisée ;
- aucune boucle de crash observée dans le workflow Replit.

Ces observations ne permettent pas de déclarer le service Railway sain.

## 11. Web

```text
Web via la production Railway = NOT VERIFIED
```

Le Web actuel fonctionne dans le workflow Replit de développement :

- page racine : HTTP 200 ;
- `/api/stats` : HTTP 200 ;
- logs actifs sur l’authentification, les statistiques, les notifications et
  les routes métier.

Le chemin demandé `Web → Backend Railway → PostgreSQL` ne peut pas être validé,
car le domaine et le service Railway de production ne sont pas accessibles.

Aucune fonctionnalité Web, aucun composant, aucune route et aucune PWA n’a été
modifié.

## 12. Fichiers modifiés

```text
AUCUN FICHIER SOURCE MODIFIÉ
```

Rapport ajouté pour cette phase :

```text
RAPPORT_PHASE_1_1_VALIDATION_RAILWAY_BURKINAWATCH.md
```

Le fichier de cahier des charges attaché dans `attached_assets/` n’a pas été
modifié. Aucun commit ni push automatique n’a été effectué.

## 13. Verdict

### Railway production

`NOT READY`

### PostgreSQL

`UNCHANGED`

### Backend production

`NOT OPERATIONAL`

### Web

`NOT VERIFIED`

### StreetView production

`NOT VALIDATED`

### Phase 2

`BLOCKED`

## 14. Blocages restants

1. **Accès Railway requis :** ouvrir le projet Railway et identifier le service
   backend, l’environnement production, la branche déployée, les commandes,
   les logs et le domaine public.
2. **`REFRESH_TOKEN_SALT` :** vérifier sa présence dans Railway. Si absente,
   créer une valeur cryptographiquement aléatoire et stable directement dans
   Railway, sans l’afficher, la committer ou la placer dans le dépôt.
3. **Chiffrement :** vérifier `KMS_ENABLED`, puis la branche correspondante :
   `MASTER_ENCRYPTION_KEY` si KMS est désactivé, ou les quatre variables KMS si
   KMS est activé.
4. **StreetView :** valider le fournisseur et les variables S3 requises.
5. **Backup :** confirmer un snapshot/backup Railway identifiable avant toute
   opération de configuration susceptible de déclencher un déploiement.
6. **Déploiement normal :** après configuration, relancer le mécanisme normal
   Railway sans modifier la chaîne de build.
7. **Validation production :** confirmer que `server.listen()` est atteint, que
   le processus reste actif, puis tester le domaine Railway réel sur `/` et
   `/api/stats`.
8. **Logs :** vérifier l’absence de crash, erreur PostgreSQL, erreur de session,
   erreur KMS, erreur S3 et boucle de redémarrage.

## Action manuelle immédiate

```text
ACTION MANUELLE REQUISE DANS RAILWAY
```

Cette phase s’arrête ici. Aucune partie de la Phase 2 — mobile, bearer tokens,
CORS mobile, contrats partagés, Expo, React Native, EAS ou OTA — n’est commencée.