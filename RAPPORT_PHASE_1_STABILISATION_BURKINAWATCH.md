# BURKINAWATCH — Rapport final de Phase 1
## Stabilisation et vérification de l’infrastructure existante

**Date de vérification :** 9 septembre 2026  
**Mode :** inspection et vérifications non destructives  
**Périmètre :** Web React/Vite, backend Express/TypeScript, PostgreSQL Railway, Drizzle, build et démarrage production  
**Règle appliquée :** aucune migration, aucun déploiement et aucune modification du produit Web

## 1. État initial

Le projet contient une application Web React/Vite existante, un backend Express/TypeScript et une couche PostgreSQL via Drizzle ORM.

Éléments effectivement présents :

- Node.js 20.20.0 via `.nvmrc` ;
- npm 10.8.2 via `packageManager` ;
- frontend Vite dans `client/` ;
- backend dans `server/` ;
- schéma partagé dans `shared/schema.ts` ;
- migrations SQL `0000` à `0011` dans `migrations/` ;
- configuration Drizzle dans `drizzle.config.ts` ;
- commande de build `npm run build` ;
- commande de démarrage production `npm start` ;
- workflow Replit `Start application` actif sur le port 5000 ;
- absence de `railway.json`, `railway.toml` et Dockerfile ;
- détection Railway/Railpack laissée à la plateforme ;
- aucune application Expo ou React Native créée ;
- aucun fichier EAS ou pipeline mobile ajouté.

La configuration de connexion choisit `RAILWAY_DATABASE_URL` en priorité, puis
`DATABASE_URL` comme repli destiné au développement local.

L’état Git observé avant les vérifications était une branche `main` en avance
sur `origin/main`, avec le rapport Web/Mobile précédent déjà présent dans
l’historique. Aucune modification applicative utilisateur n’a été supprimée.

## 2. Problèmes détectés

### CRITIQUE

1. **Démarrage production bloqué par l’absence de `REFRESH_TOKEN_SALT`.**
   Le lancement réel de `node dist/index.js` avec `NODE_ENV=production` s’arrête
   avant `server.listen()` avec :

   ```text
   REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.
   ```

   Le processus sort avec le code 1 et aucune réponse HTTP production ne peut
   donc être servie.

2. **Configuration StreetView S3 production non démontrée.**
   Le code choisit S3 par défaut en production. Les variables suivantes étaient
   absentes de l’environnement d’audit :

   - `STREETVIEW_S3_BUCKET`
   - `STREETVIEW_S3_ACCESS_KEY_ID`
   - `STREETVIEW_S3_SECRET_ACCESS_KEY`

   Cette vérification n’a pas pu être atteinte au démarrage, car
   `REFRESH_TOKEN_SALT` échoue avant elle. Elle doit être corrigée ou la
   politique de stockage durable explicitement configurée avant de considérer
   Railway comme prêt.

### ÉLEVÉ

3. **Historique Drizzle non standard sur la base Railway.**
   Le précontrôle confirme que `__drizzle_migrations` est absent. La structure
   SQL est correcte et les migrations contrôlées sont déjà représentées, mais
   la provenance standard Drizzle n’est pas enregistrée dans la base.

   Conséquence : il ne faut pas lancer aveuglément `drizzle-kit migrate`,
   rejouer les migrations historiques ou utiliser `db:push`. Toute prochaine
   évolution doit continuer à passer par le précontrôle, le snapshot Railway et
   une procédure forward-only explicitement validée.

4. **Configuration KMS conditionnelle incomplète dans l’environnement d’audit.**
   `KMS_ENABLED` est présent, mais sa valeur n’a pas été affichée. Les variables
   KMS suivantes sont absentes de l’environnement inspecté :

   - `KMS_PROJECT_ID`
   - `KMS_KEY_RING_ID`
   - `KMS_CRYPTO_KEY_ID`

   Si `KMS_ENABLED=true` en production, cette configuration est insuffisante.
   Si `KMS_ENABLED=false`, `MASTER_ENCRYPTION_KEY` est présent dans
   l’environnement d’audit.

### MOYEN

5. **Aucune validation HTTP production possible tant que les variables
   critiques ne sont pas renseignées.**
   Le code de démarrage utilise correctement `PORT` et écoute sur
   `0.0.0.0`, mais cette partie n’est pas atteinte dans le test production.

6. **Avertissements de build non bloquants.**

   - avertissement PostCSS concernant l’option `from` ;
   - modules importés à la fois statiquement et dynamiquement ;
   - chunks JavaScript supérieurs à 500 kB.

   Ces avertissements n’empêchent pas le build. Ils ne justifient pas un
   refactoring dans cette phase.

7. **Dépendances npm obsolètes signalées.**
   `npm ci` signale notamment des paquets dépréciés ou des branches anciennes.
   Aucune mise à jour de dépendance n’a été effectuée, conformément au périmètre
   minimal.

### FAIBLE

8. Des sources de données externes produisent occasionnellement des erreurs
   réseau ou XML dans les logs (`FasoZine`, `SIG`). Les routes concernées
   continuent toutefois à répondre dans le workflow actuel avec les mécanismes
   de repli existants.

9. La console navigateur contient une erreur liée au démarrage du tracking dans
   un état sans session active. Les routes générales du Web et les statistiques
   répondent correctement ; aucune correction de fonctionnalité n’a été
   entreprise dans cette phase.

## 3. Modifications effectuées

Aucune modification du code, de la configuration applicative, des migrations,
des secrets ou du déploiement n’a été effectuée.

Le seul livrable ajouté est ce rapport :

| Fichier | Zone | Modification | Raison | Impact |
| --- | --- | --- | --- | --- |
| `RAPPORT_PHASE_1_STABILISATION_BURKINAWATCH.md` | nouveau fichier | ajout du rapport final de Phase 1 | documenter les vérifications et les blocages | aucun impact sur l’exécution de l’application |

Les commandes `npm ci`, `npm run check`, `npm run build` et les tests ont pu
régénérer `node_modules` et `dist/`, qui ne sont pas des modifications du code
source suivies dans le livrable.

## 4. Variables Railway nécessaires

### Variables indispensables au démarrage production

Uniquement les noms sont indiqués, jamais les valeurs :

| Variable | Utilisation | Condition |
| --- | --- | --- |
| `NODE_ENV` | active la politique production | doit valoir `production` |
| `PORT` | port HTTP fourni par Railway | fourni par Railway |
| `RAILWAY_DATABASE_URL` | connexion PostgreSQL Railway | obligatoire en production |
| `SESSION_SECRET` | sessions et secrets applicatifs | au moins 32 caractères |
| `REFRESH_TOKEN_SALT` | dérivation stable des refresh tokens | obligatoire |
| `KMS_ENABLED` | sélection KMS ou clé locale | obligatoire pour choisir la branche |

### Chiffrement : une des deux branches

Si `KMS_ENABLED=false` :

- `MASTER_ENCRYPTION_KEY`

Si `KMS_ENABLED=true` :

- `KMS_PROJECT_ID`
- `KMS_LOCATION_ID`
- `KMS_KEY_RING_ID`
- `KMS_CRYPTO_KEY_ID`

### Stockage StreetView en production

La valeur par défaut du code est S3 en production. Variables nécessaires :

- `STREETVIEW_STORAGE_PROVIDER`
- `STREETVIEW_S3_BUCKET`
- `STREETVIEW_S3_ACCESS_KEY_ID`
- `STREETVIEW_S3_SECRET_ACCESS_KEY`
- `STREETVIEW_S3_REGION`
- `STREETVIEW_S3_ENDPOINT`
- `STREETVIEW_S3_FORCE_PATH_STYLE`
- `STREETVIEW_S3_SESSION_TOKEN`
- `STREETVIEW_S3_SIGNED_URL_TTL_SECONDS`
- `STREETVIEW_S3_MULTIPART_PART_SIZE_MB`

Les trois premières variables S3 sont obligatoires lorsque le fournisseur est
S3. Les autres sont optionnelles selon le fournisseur S3 utilisé.

Une alternative filesystem en production nécessite explicitement :

- `STREETVIEW_STORAGE_PROVIDER`
- `STREETVIEW_STORAGE_DIR`
- `STREETVIEW_STORAGE_DURABLE=true`

Cette alternative n’a pas été activée ni proposée comme contournement.

### Variables conditionnelles utilisées par les fonctionnalités

- Cartographie : `VITE_GOOGLE_MAPS_API_KEY`
- Notifications Web Push : `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`,
  `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY`
- Email Resend : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Email SMTP : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
  `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SMTP_SECURE`
- Gmail : `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- IA : `GROQ_API_KEY`, `GROQ_MODEL`, `OPENAI_API_KEY`,
  `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`,
  `GEMINI_API_KEY`, `GOOGLE_API_KEY`
- Météo : `OPENWEATHERMAP_API_KEY`
- Mapillary : `MAPILLARY_ACCESS_TOKEN`
- Médias et surveillance : `MEDIA_GATEWAY_ORIGINS`,
  `VIDEO_GATEWAY_PATH_SECRET`, `VIDEO_GATEWAY_PUBLISHER_USERNAME`,
  `VIDEO_GATEWAY_PUBLISHER_PASSWORD`, `BURKINAWATCH_MEDIA_RTSP_ORIGIN`,
  `BURKINAWATCH_LOCAL_RTSP_URL`, `CAMERA_ID`, `STREAM_ID`,
  `BURKINAWATCH_STREAM_ID`, `SURVEILLANCE_TEST_PATH_NAME`
- StreetView worker : `STREETVIEW_PHASE14_ENABLED`,
  `STREETVIEW_WORKER_ENABLED`, `STREETVIEW_WORKER_ID`,
  `STREETVIEW_WORKER_POLL_MS`, `STREETVIEW_WORKER_LEASE_MS`,
  `STREETVIEW_MAX_ATTEMPTS`, `STREETVIEW_RETRY_BASE_MS`,
  `STREETVIEW_RETRY_MAX_MS`, `STREETVIEW_CPU_KEYFRAMES_ENABLED`,
  `STREETVIEW_CPU_KEYFRAME_FPS`, `STREETVIEW_CPU_MAX_KEYFRAMES`,
  `STREETVIEW_CPU_SFM_ENABLED`

Les variables Replit (`REPL_ID`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN`) servent
au développement et au contexte Replit ; elles ne remplacent pas la
configuration Railway.

## 5. PostgreSQL

Le précontrôle Railway en lecture seule a réussi :

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

Compteurs observés dans les tables contrôlées :

| Table | Lignes |
| --- | ---: |
| `commentaires` | 0 |
| `notifications` | 0 |
| `online_sessions` | 68 |
| `signalements` | 0 |
| `tracking_sessions` | 0 |
| `surveillance_cameras` | 0 |
| `camera_agents` | 0 |
| `agent_camera_bindings` | 0 |
| `agent_media_sessions` | 0 |

Les index 0004 et surveillance attendus sont présents. Le schéma StreetView
Phase 3/5 et les objets Phase 14 sont présents.

### Cohérence code / schéma / migrations

- Cohérence structurelle vérifiée par le précontrôle : **PASS**.
- Migrations historiques `0000` à `0003` présentes dans le dépôt et non
  rejouées : **conforme à la procédure actuelle**.
- `0004` déjà appliquée et vérifiée sans nouvelle écriture : **PASS**.
- Migrations surveillance et StreetView représentées dans la base :
  **présentes**.
- Table standard `__drizzle_migrations` : **absente**.

Conclusion : la structure PostgreSQL actuelle correspond aux objets attendus,
mais la provenance standard Drizzle reste non enregistrée. La base est donc
structurellement cohérente, avec une réserve opérationnelle importante sur le
suivi des migrations.

Aucune donnée métier n’a été supprimée, déplacée ou modifiée par cette Phase 1.

## 6. Build

Versions utilisées :

```text
node v20.20.0
npm 10.8.2
```

### `npm ci --include=dev --legacy-peer-deps`

Résultat : **PASS**

```text
added 769 packages in 16s
```

Des avertissements de dépréciation npm ont été émis, sans échec d’installation.

Le lockfile ne contient plus de références `package-firewall.replit.local`
observées lors de l’audit précédent. Les résolutions contrôlées utilisent le
registre public npm.

### `npm run check`

Résultat : **PASS**

```text
tsc
```

Aucune erreur TypeScript n’a été retournée.

### `npm run build`

Résultat : **PASS**

Le build a produit :

- `dist/public/` avec le frontend ;
- `dist/index.js` ;
- `dist/streetview-worker.js`.

Tailles observées :

```text
dist/index.js              1 269 368 octets
dist/streetview-worker.js    110 740 octets
```

Les avertissements Vite/PostCSS et les chunks supérieurs à 500 kB sont
non bloquants et n’ont pas été corrigés dans cette phase.

## 7. Production

### Chaîne de démarrage vérifiée

```text
npm run build
  ↓
dist/index.js
  ↓
NODE_ENV=production node dist/index.js
  ↓
server.listen()
  ↓
PORT / 0.0.0.0
```

Le code utilise bien :

- `process.env.PORT` ;
- la valeur de repli 5000 uniquement si `PORT` est absente ;
- l’hôte `0.0.0.0` ;
- `dist/public` pour les fichiers statiques en production.

### Résultat du lancement réel

Commande exécutée sur un port de test :

```bash
PORT=5050 NODE_ENV=production node dist/index.js
```

Résultat :

```text
PRODUCTION_PROCESS=exited EXIT_CODE=1
REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.
```

Le processus quitte avant `server.listen()`. Il n’est donc pas possible de
déclarer le backend production disponible tant que les variables Railway
requises ne sont pas configurées.

### Résultat du Web actuel dans le workflow Replit

Le workflow `Start application` est resté actif. Les contrôles HTTP ont obtenu :

- racine Web : HTTP 200, `text/html` ;
- `/api/stats` : HTTP 200, réponse JSON ;
- les logs du workflow montrent également des réponses 200 pour
  l’authentification, les statistiques, les signalements, les notifications et
  les données métier.

Cela confirme le fonctionnement observable du mode développement/Replit, mais
ne remplace pas un démarrage production Railway réussi.

## 8. Tests

### Tests exécutés

| Test | Résultat |
| --- | --- |
| `npm ci --include=dev --legacy-peer-deps` | PASS |
| `npm run check` | PASS |
| `npm run build` | PASS |
| `npm run test:streetview` | PASS — 16 tests, 0 échec |
| `npm run db:railway:preflight` | PASS — lecture seule |
| HTTP `https://$REPLIT_DEV_DOMAIN/` | HTTP 200 |
| HTTP `https://$REPLIT_DEV_DOMAIN/api/stats` | HTTP 200 |
| lancement production sur port 5050 | BLOQUÉ par `REFRESH_TOKEN_SALT` absent |

### Routes/fonctionnalités préservées dans le code

Les familles suivantes restent présentes dans le backend :

- signalements ;
- SOS ;
- tracking/géolocalisation ;
- médias ;
- StreetView ;
- surveillance/caméras/vidéo.

La présence dans le code n’est pas présentée comme un test fonctionnel
exhaustif de chaque route. Les tests HTTP réalisés ont porté sur le Web actuel,
les statistiques et les contrôles disponibles sans modifier de données.

## 9. Risques restants

1. Configurer `REFRESH_TOKEN_SALT` dans le service et l’environnement Railway
   réellement utilisés par la production.
2. Configurer et vérifier le stockage S3 StreetView, ou documenter une
   alternative durable explicitement validée.
3. Vérifier la branche KMS effective en production :
   - si KMS est activé, fournir les quatre identifiants KMS ;
   - sinon conserver une clé maître de production stable.
4. Créer ou confirmer un snapshot/backup Railway géré, avec identifiant et
   horodatage, avant toute prochaine écriture de schéma.
5. Ne pas utiliser `db:push`, ne pas rejouer `0000` à `0003` et ne pas lancer
   `drizzle-kit migrate` sans procédure de baseline/provenance validée.
6. Après configuration Railway, relancer le déploiement et tester une réponse
   HTTP sur `0.0.0.0:$PORT`.
7. Les warnings de build, les dépendances npm dépréciées, les gros chunks
   frontend et les erreurs ponctuelles de sources externes restent à traiter
   dans une phase dédiée, pas par un refactoring de Phase 1.

## 10. Fichiers modifiés

Fichier ajouté par cette phase :

```text
RAPPORT_PHASE_1_STABILISATION_BURKINAWATCH.md
```

Aucun fichier applicatif existant n’a été modifié.

Les répertoires générés `node_modules/` et `dist/` ont été régénérés pour les
vérifications mais ne constituent pas des changements source suivis.

## 11. Ce qui n’a PAS été modifié

Confirmation explicite :

- frontend Web conservé ;
- design conservé ;
- fonctionnalités conservées ;
- PWA conservée ;
- backend conservé ;
- PostgreSQL conservé ;
- aucune application Expo créée ;
- aucun code React Native créé ;
- aucun EAS configuré ;
- aucune configuration OTA créée ;
- aucun nouvel endpoint mobile créé ;
- aucune migration destructive effectuée ;
- aucune migration existante supprimée ;
- aucune donnée métier déplacée ou supprimée ;
- aucun secret affiché, copié ou committé ;
- aucun déploiement Railway déclenché par l’agent ;
- aucun commit ou push automatique effectué pour cette phase.

## 12. Verdict

### A. Le BurkinaWatch Web actuel est-il stable ?

**Partiellement.**

Le Web est fonctionnel dans le workflow Replit/de développement : le frontend
répond en HTTP 200, `/api/stats` répond en HTTP 200 et les logs montrent des
routes métier actives.

La production Railway ne peut pas encore être déclarée stable, car le
processus production s’arrête avant `listen()` faute de `REFRESH_TOKEN_SALT`.

### B. Le backend peut-il être considéré comme une base fiable pour accueillir ultérieurement une application mobile ?

**Structurellement oui, opérationnellement pas encore pour la production.**

Les contrats backend existants, le schéma PostgreSQL et le build sont
réutilisables. Il faut d’abord rendre le démarrage production fiable et
formaliser la provenance des migrations avant d’ajouter une application mobile.

### C. PostgreSQL est-il cohérent avec le code et les migrations ?

**La structure actuelle est cohérente avec les contrôles attendus, avec une réserve importante.**

Le précontrôle confirme 37/37 tables, les index attendus, les objets
surveillance et StreetView ainsi que les objets Phase 14. En revanche,
`__drizzle_migrations` est absent ; la cohérence structurelle est donc bonne,
mais la traçabilité standard Drizzle n’est pas complète.

### D. Railway est-il prêt pour la prochaine phase ?

**Non.**

Railway n’est pas prêt tant que les variables de sécurité, de base PostgreSQL
et de stockage StreetView n’ont pas été vérifiées dans le bon service et le bon
environnement, puis qu’un démarrage HTTP production réussi n’a pas été observé.

### E. Quels problèmes doivent impérativement être réglés avant la Phase 2 ?

1. Ajouter `REFRESH_TOKEN_SALT` dans Railway.
2. Vérifier la branche KMS effective et fournir sa configuration complète.
3. Configurer le stockage StreetView production durable, notamment les
   variables S3 requises si S3 est le fournisseur retenu.
4. Relancer et valider le démarrage production sur le port Railway.
5. Confirmer le snapshot/backup Railway géré.
6. Conserver une procédure forward-only pour les migrations et ne pas utiliser
   `db:push`.
7. Revoir la stratégie de provenance Drizzle avant toute nouvelle migration.

**Arrêt de Phase 1.**  
La Phase 2 — authentification mobile, contrats partagés, Expo, React Native,
EAS, OTA ou nouveaux endpoints — n’est pas commencée.