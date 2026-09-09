# BURKINAWATCH — RAPPORT PHASE 2.0
## Audit complet Authentification, Sessions, Sécurité Backend et Préparation Mobile

**Date de l’audit :** 9 septembre 2026  
**Mode :** audit en lecture seule  
**Périmètre :** authentification Web, sessions, OTP, refresh tokens, CORS, CSRF, autorisation, middleware de sécurité, validation, uploads/médias, secrets et compatibilité avec une future application Expo native.

> **Règle respectée.** Aucun fichier source, route, configuration, variable d’environnement, secret, table PostgreSQL, migration, cookie ou mécanisme d’authentification n’a été modifié pour cet audit. Aucune application Expo/React Native, API mobile ou stratégie OTA n’a été commencée.

## 1. Résumé exécutif

BurkinaWatch dispose aujourd’hui d’une authentification Web fonctionnelle fondée sur un OTP envoyé par email, puis sur une session Passport persistée dans PostgreSQL avec un cookie HttpOnly. Le parcours Web principal est cohérent et les contrôles de base sont présents : OTP aléatoire, durée limitée, hachage HMAC, compteur de tentatives, consommation après succès, rate limiting, session serveur et contrôle d’authentification côté backend.

Cette base n’est toutefois pas encore suffisamment propre pour lancer directement une application mobile native partageant le même backend. Le point bloquant principal est l’absence de flux mobile Bearer complet : aucun access token n’est émis, aucune route `/refresh` n’existe, aucune rotation ou détection de réutilisation n’est branchée, et le client Web n’envoie pas de header CSRF explicite. La table `refresh_tokens` et les helpers cryptographiques existent, mais leur présence ne constitue pas une implémentation fonctionnelle.

Les contrôles d’autorisation sont globalement sérieux pour les contributions StreetView et la surveillance des caméras, avec des vérifications d’ownership côté serveur. Ils ne sont cependant pas uniformes sur toutes les routes. Plusieurs mutations publiques ou semi-publiques peuvent être utilisées pour du spam, du stockage abusif ou l’exposition de médias : upload StreetView legacy anonyme, création de tours virtuels publique, points Mapillary publics et points StreetView publics. L’endpoint Mapillary renvoie en outre directement un token configuré côté serveur.

### Verdict de synthèse

| Domaine | État | Conclusion |
|---|---|---|
| Authentification Web | Fonctionnelle mais à durcir | Le parcours OTP/session fonctionne ; plusieurs corrections restent nécessaires |
| Session | Opérationnelle | PostgreSQL, TTL 7 jours, cookie HttpOnly ; compatible avec le Web HTTPS |
| OTP | Bon niveau de base | HMAC, 5 minutes, 5 tentatives, consommation ; validation de route perfectible |
| Refresh token | Non implémenté | Helpers et table présents, aucun cycle runtime |
| CORS | Non configuré explicitement | Le Web same-origin fonctionne ; le cross-origin mobile n’est pas contractualisé |
| CSRF | Partiel | Protection des mutations authentifiées, bypass same-origin et non-authentifié |
| Autorisation | Globalement correcte mais hétérogène | Ownership robuste sur plusieurs domaines, couverture inégale |
| Secrets | Backend correctement séparé dans le bundle contrôlé | Un token Mapillary est néanmoins exposé par une route publique |
| Mobile natif | Partiel | Backend réutilisable, contrat Bearer/refresh manquant |
| Phase 2.1 | Bloquée | À préparer après corrections A/B et définition du contrat mobile |

## 2. Architecture d’authentification actuelle

### Architecture réelle observée

```text
Navigateur Web
    |
    | POST /api/auth/send-otp
    | POST /api/auth/verify-otp
    v
Express
    |
    +-- hybridAuthService / otpSecurity
    +-- storage PostgreSQL
    +-- req.login() / Passport
    v
express-session + connect-pg-simple
    |
    v
Cookie HttpOnly connect.sid
    |
    v
API protégée par req.isAuthenticated()
```

Le dépôt utilise Passport pour sérialiser l’identifiant utilisateur dans la session et le désérialiser depuis PostgreSQL (`server/replitAuth.ts:41-68`). Il n’y a pas de stratégie OAuth/OIDC active dans le parcours analysé. Les visiteurs non connectés restent des invités ; la vérification OTP crée ou transforme un utilisateur en compte non anonyme.

### Cartographie des routes d’authentification

| Méthode | Route | Middleware / contrôle | Entrées principales | Sortie | Auth requise |
|---|---|---|---|---|---|
| GET | `/api/auth/csrf` | Émission du cookie/token CSRF | Aucun | `{ csrfToken }` | Non |
| POST | `/api/auth/send-otp` | `authLimiter` | `identifier`, `type` | Succès ou message d’erreur | Non |
| POST | `/api/auth/verify-otp` | `authLimiter` | `identifier`, `code`, `type` | Utilisateur connecté via session | Non avant vérification |
| GET | `/api/auth/check-sms-availability` | Aucun spécifique | Aucun | `{ available: false }` actuellement | Non |
| POST | `/api/auth/logout` | `req.logout`, destruction session | Cookie session éventuel | Succès de déconnexion | Non, comportement idempotent attendu |
| GET | `/api/auth/user` | `req.isAuthenticated()` | Cookie session | Profil utilisateur | Oui |
| POST | `/api/auth/magic-link` | Contrôle manuel `req.user` | `email` | Création d’un lien | Oui |
| GET | `/api/auth/verify` | Lookup/consommation magic link | `token` en query string | Redirection | Non, token requis |
| PATCH | `/api/auth/user` | `isAuthenticated`, Zod | Champs de profil | Utilisateur mis à jour | Oui |
| POST | `/api/auth/user/sync-points` | `isAuthenticated` | Aucun | Points synchronisés | Oui |

Il n’existe pas de route d’émission d’access token, de route `/refresh`, de route de révocation de refresh token, ni de callback d’authentification mobile.

## 3. Flux Login

Le login Web est passwordless :

1. L’utilisateur saisit un email dans `client/src/pages/Connexion.tsx:28-31`.
2. Le client appelle `POST /api/auth/send-otp` avec `credentials: "include"` via `apiRequest`.
3. Le backend vérifie la présence de `identifier` et valide `type` parmi `email` et `sms` (`server/routes.ts:752-780`).
4. Le chemin SMS répond actuellement indisponible (`server/hybridAuthService.ts:62-67`).
5. Pour l’email, un code aléatoire à six chiffres est créé, haché et stocké avant l’envoi email.
6. L’utilisateur saisit le code.
7. Le client appelle `POST /api/auth/verify-otp` (`Connexion.tsx:59-63`).
8. En cas de succès, le serveur consomme l’OTP, crée ou met à jour l’utilisateur, appelle `req.login`, sauvegarde la session et renvoie un profil filtré (`server/routes.ts:782-823`).
9. Le navigateur réutilise ensuite le cookie de session pour les appels API.

Le client met à jour le cache React Query avec l’utilisateur renvoyé, mais ne manipule aucun access token et ne met en place aucun renouvellement de session côté navigateur.

### Observations

- Les routes vérifient la présence des champs, mais le format email, la longueur de l’identifiant, le format exact du code et la cohérence stricte du type ne sont pas entièrement délégués à un schéma Zod au niveau route.
- Le rate limit d’authentification est appliqué par IP à 10 requêtes par heure (`server/securityHardening.ts:18-25`), en plus du verrouillage OTP par enregistrement.
- Un message de log de login contient l’identifiant interne utilisateur (`server/routes.ts:809`). Il ne contient pas le code OTP, ce qui est positif, mais les identifiants doivent rester traités comme des données personnelles.

## 4. Flux OTP

### Génération et stockage

- Génération cryptographiquement aléatoire via `crypto.randomInt(100000, 1000000)` (`server/otpSecurity.ts:14-16`).
- TTL de 5 minutes (`OTP_TTL_MS`, `server/otpSecurity.ts:5-6`).
- Hachage HMAC-SHA-256 incluant le type et l’identifiant (`server/otpSecurity.ts:18-26`).
- Suppression des OTP expirés avant la création d’un nouvel OTP (`server/hybridAuthService.ts:43-52`).
- Vérification en comparaison résistante au timing pour les valeurs hachées (`otpSecurity.ts:29-35`).
- Compatibilité résiduelle avec d’anciens OTP à six chiffres stockés en clair (`otpSecurity.ts:44-50`). Cette branche augmente la surface de risque tant que d’anciens enregistrements existent.

### Tentatives et réutilisation

- Maximum de cinq tentatives (`OTP_MAX_ATTEMPTS = 5`).
- Après dépassement, l’enregistrement est supprimé.
- Un OTP expiré ou déjà vérifié est refusé.
- Après succès, `consumeOtpCode` est appelé puis l’enregistrement est supprimé (`hybridAuthService.ts:111-115`).
- La concurrence entre deux vérifications simultanées dépend de l’atomicité de `consumeOtpCode` côté stockage ; ce comportement doit être couvert par un test d’intégration avant une exposition plus large.

### Risques OTP

- Le rate limit est essentiellement IP et peut être contourné par distribution d’adresses ou provoquer un déni de service partagé pour des utilisateurs derrière la même IP.
- Le endpoint `send-otp` ne montre pas de quota explicite par identifiant/email.
- Les validations de format et de longueur au niveau route sont incomplètes.
- Les logs ne journalisent pas le code OTP, ce qui est conforme à l’objectif de sécurité ; les logs d’erreur restent à surveiller pour éviter la propagation d’entrées utilisateur.
- La compatibilité avec d’anciens codes en clair doit être éliminée après migration contrôlée des enregistrements concernés.

## 5. Flux Session

### Création et persistance

`server/replitAuth.ts:17-39` configure :

- `express-session` ;
- `connect-pg-simple` ;
- table PostgreSQL `sessions` ;
- TTL de sept jours ;
- `resave: false` ;
- `saveUninitialized: false` ;
- cookie `httpOnly: true` ;
- `secure: true` en production ;
- `sameSite: "lax"` en production hors environnement Replit ;
- `sameSite: "none"` dans l’environnement Replit ;
- `maxAge` de sept jours.

Le schéma attendu est compatible avec le store (`shared/schema.ts:6-14`) et `createTableIfMissing` est désactivé. La session ne doit donc pas créer silencieusement de table en production.

### Vérification et désérialisation

Passport est initialisé après le middleware de session (`replitAuth.ts:41-45`). La sérialisation conserve l’identifiant utilisateur. La désérialisation recharge l’utilisateur depuis le stockage et refuse les comptes anonymes (`replitAuth.ts:47-68`). `isAuthenticated` s’appuie sur le principal authentifié et renvoie HTTP 401 lorsque la session n’est pas valide.

### Destruction et logout

`POST /api/auth/logout` appelle `req.logout`, détruit la session PostgreSQL, efface `connect.sid` et renvoie un succès (`server/routes.ts:834-847`). Le flux ne révoque aucun refresh token, mais il n’existe actuellement aucun refresh token émis par le système.

### Compatibilité production HTTPS

La configuration `secure` et `trust proxy` est compatible avec un déploiement HTTPS derrière le proxy Railway. Le cookie `SameSite=Lax` convient au Web same-origin ou navigation de premier niveau. En revanche, une application mobile native ne doit pas dépendre de ce cookie : elle a besoin d’un contrat Bearer explicite et d’un stockage sécurisé local.

## 6. Flux Refresh Token

### Éléments présents

- Table `refresh_tokens` (`shared/schema.ts:306-318`) avec utilisateur, expiration, révocation, IP et user-agent.
- `generateRefreshToken` utilisant 64 octets aléatoires (`server/encryptionService.ts:390-393`).
- `hashRefreshToken` utilisant SHA-256 avec `REFRESH_TOKEN_SALT` (`encryptionService.ts:376-387`).
- `verifyRefreshTokenHash` (`encryptionService.ts:395-397`).
- Validation de présence de `REFRESH_TOKEN_SALT` en production (`server/securityConfig.ts:35-39`).

### Éléments absents

La recherche du dépôt ne montre :

- aucune émission lors du login OTP ;
- aucun access token signé ou opaque ;
- aucune route `/refresh` ;
- aucune lecture runtime de `refresh_tokens` ;
- aucune rotation ;
- aucune révocation lors du logout ;
- aucune détection de réutilisation ;
- aucun binding par device ;
- aucune réponse ou en-tête mobile documenté ;
- aucune gestion `Authorization: Bearer` pour les utilisateurs.

La colonne `refresh_tokens.token` est également nommée comme une valeur de token et non explicitement comme un hash. Les helpers de hachage existent mais ne prouvent pas que la valeur persistée serait toujours hachée.

### Rôle exact de `REFRESH_TOKEN_SALT`

`REFRESH_TOKEN_SALT` est un secret serveur stable utilisé comme composant supplémentaire pour produire le hash SHA-256 du refresh token avant stockage ou comparaison. Sa valeur ne doit jamais être envoyée au navigateur, inscrite dans un bundle, ajoutée aux logs ou révélée dans un rapport. Sa rotation invaliderait les hashes dérivés de l’ancien salt ; elle doit donc être traitée comme une opération de migration et de révocation planifiée, pas comme une variable interchangeable.

### Conclusion

Le refresh token est **NON IMPLÉMENTÉ** au niveau du produit. Il existe une préparation technique partielle, mais aucun flux utilisable par Web ou Mobile.

## 7. Logout

Le logout Web actuel est une déconnexion de session :

```text
POST /api/auth/logout
    -> req.logout()
    -> req.session.destroy()
    -> clearCookie("connect.sid")
```

Le client Web utilise cet endpoint dans le profil et le menu. Le serveur gère les erreurs de logout et de destruction de session.

Limites :

- aucun refresh token n’est révoqué, car aucun n’est actuellement émis ;
- aucune révocation par appareil n’existe ;
- aucune invalidation globale de toutes les sessions utilisateur n’est exposée ;
- le client ne purge pas explicitement toutes les données React Query persistées après logout. Une partie des requêtes privées est exclue de la persistance (`queryClient.ts:79-92`), mais cette politique doit rester vérifiée à chaque ajout de route.

## 8. CORS

Aucun middleware `cors` ni configuration `CORS_ORIGINS` active n’a été trouvé dans le backend audité. Le fonctionnement actuel repose donc principalement sur le same-origin :

- le client Web appelle des chemins relatifs ;
- les cookies sont envoyés avec `credentials: "include"` ;
- aucun contrat d’origine, méthode ou header autorisé n’est déclaré pour un client externe.

### Conséquences

- Le Web actuel peut fonctionner correctement lorsqu’il est servi par le même hôte que l’API.
- Une application Expo native n’est pas bloquée par CORS de la même manière qu’un navigateur, mais elle a tout de même besoin d’un contrat HTTP stable, d’une authentification Bearer et d’une gestion claire des erreurs.
- Un futur Web hébergé sur une origine distincte ne pourra pas compter sur le comportement actuel pour les cookies cross-origin.
- L’ajout ultérieur d’un `Access-Control-Allow-Origin: *` avec des credentials serait dangereux et incorrect.

`CORS_ORIGINS` n’est pas consommé par le middleware de l’application identifié dans cet audit. Toute introduction de CORS doit utiliser une allowlist exacte, sans wildcard avec credentials, et distinguer les origines Web autorisées des clients natifs.

## 9. CSRF

Le middleware est installé après la route d’émission du token (`server/routes.ts:721-722`). Il :

- ignore `GET`, `HEAD` et `OPTIONS` ;
- ne vérifie pas les mutations d’un visiteur non authentifié ;
- accepte directement une mutation authentifiée same-origin ;
- exige sinon un header `x-csrf-token`, le cookie `csrf_token` correspondant et une signature liée à la session.

Le cookie CSRF est créé par `GET /api/auth/csrf` avec `Path=/`, durée de sept jours, `Secure` en production et `SameSite=Lax` hors Replit (`csrfProtection.ts:81-89`).

### Évaluation

Pour le Web same-origin, le contrôle d’origine fait fonctionner les appels internes sans nécessiter que le client ajoute le header. Les appels cross-origin authentifiés doivent fournir le double-submit token correctement. Le client Web actuel n’ajoute pas explicitement `x-csrf-token` dans `apiRequest`, ce qui rend les futurs appels cross-origin fragiles.

Les mutations non authentifiées sont bypassées. C’est acceptable uniquement pour les routes réellement publiques et protégées par des contrôles spécifiques ; c’est insuffisant pour des endpoints publics qui créent des ressources, écrivent des médias ou déclenchent des opérations coûteuses. Dans ces cas, la priorité doit être l’authentification ou une protection anti-abus adaptée, en plus d’une analyse CSRF.

## 10. Autorisation / rôles

### Rôles présents

Le schéma utilisateur prévoit notamment `guest`, `user`, `admin` et des usages de `moderateur` dans le code (`shared/schema.ts:16-37`, `server/riskAnalysisService.ts:305`). Le login OTP crée un compte avec le rôle `user` et transforme un utilisateur `guest` en `user` (`hybridAuthService.ts:124-145`). Aucun rôle n’est élevé par le client lors du parcours OTP.

### Mécanismes

- `requireAuthenticatedUser` vérifie l’existence d’un principal authentifié.
- `requireRole` compare le rôle serveur à une liste autorisée.
- `requireResourceOwnership` compare l’utilisateur authentifié à `userId`, `ownerId` ou `ownerUserId`, avec exception explicite pour certains rôles (`server/authorization.ts:58-118`).
- Plusieurs routes administratives effectuent aussi un contrôle direct `user.role === "admin"`.
- Les contributions StreetView récupèrent les ressources avec l’identifiant authentifié ; les sessions multipart vérifient contribution, utilisateur et session.
- La surveillance filtre les caméras, agents et sessions médias par propriétaire.

### Points positifs

Les routes de profil, signalements privés, notifications, tracking et StreetView utilisent `isAuthenticated`. Les contrôles d’ownership des caméras et des contributions StreetView sont globalement robustes et ne reposent pas uniquement sur l’ID fourni par le client.

### Points à surveiller

- La couverture n’est pas homogène : plusieurs endpoints publics créent ou servent des médias.
- Certaines routes admin utilisent des contrôles inline plutôt qu’un middleware de rôle uniforme, ce qui augmente le risque d’oubli lors d’une nouvelle route.
- Toute route recevant un `:id` doit continuer à charger la ressource avec le propriétaire attendu, et non charger par ID seul puis vérifier tardivement.
- Les tokens de partage de tracking et URLs publiques doivent être considérés comme des capacités d’accès sensibles, avec expiration et révocation explicites.

## 11. Middleware sécurité

### Présent

- Helmet, avec HSTS en configuration (`server/securityHardening.ts:89-119`).
- HPP contre la pollution des paramètres.
- `xss-clean` pour un nettoyage basique des entrées.
- Rate limit global : 100 requêtes par IP sur 15 minutes.
- Rate limit auth : 10 requêtes par IP sur une heure.
- Rate limit signalements : 5 par heure.
- Rate limits spécifiques à la surveillance.
- Session PostgreSQL avec cookie HttpOnly.
- Passport et middleware d’authentification.
- CSRF conditionnel.
- Validation Zod sur plusieurs domaines.
- Service de redaction de secrets dans certaines sorties/logs.

### Manquant ou partiel

- Pas de CORS explicite et documenté.
- Pas de politique uniforme d’authentification pour les mutations publiques.
- CSP autorisant `unsafe-inline` et `unsafe-eval` (`securityHardening.ts:95-109`), ce qui réduit la protection XSS.
- Rate limits parfois uniquement IP, sans clé par compte, identifiant ou ressource.
- Pas de cycle access/refresh pour les clients natifs.
- Pas de matrice centralisée démontrant que chaque route sensible possède authentification, rôle, ownership et limite adaptée.

## 12. Validation des entrées

La validation est mixte :

- Zod et `fromZodError` sont utilisés pour les signalements et le profil (`routes.ts:911-918`, zone signalements autour de `1094-1128`).
- Le service de surveillance utilise des schémas Zod (`server/surveillanceService.ts:92-111`).
- Certaines routes utilisent des validations manuelles.
- Les routes OTP vérifient principalement la présence des champs et le type.
- Les uploads vérifient taille, coordonnées et préfixe MIME, mais pas toujours le nombre global d’objets, la profondeur de payload ou le coût total.

### Domaines sensibles inspectés

- **Profil :** Zod, champs protégés comme `id`, email, rôle et timestamps omis du schéma de mise à jour.
- **Signalements/SOS :** authentification, rate limit et validation du schéma ; les médias sont retirés de la réponse volumineuse.
- **Commentaires/messages :** routes authentifiées pour les mutations, schémas dédiés sur certains messages.
- **Notifications/push :** plusieurs routes authentifiées, mais les abonnements push possèdent aussi des opérations publiques à examiner.
- **Surveillance :** validation et chiffrement présents, ownership côté stockage.
- **StreetView :** routes modernes authentifiées et sessions multipart liées à l’utilisateur ; une route legacy reste anonyme.
- **Tours virtuels :** validation manuelle de quelques champs et tailles, mais création publique.
- **Routes refresh de données publiques :** certaines routes de rafraîchissement sont publiques et peuvent déclencher des opérations coûteuses.

### Conclusion

Les contrôles ne sont pas absents, mais leur application par route n’est pas uniforme. Le risque le plus élevé vient des endpoints publics qui acceptent des données coûteuses ou persistantes, plutôt que des routes de profil déjà protégées par Zod.

## 13. Uploads / médias

### Uploads correctement encadrés

Le nouveau flux StreetView utilise un utilisateur authentifié, des sessions multipart signées/expirables, un stockage S3-compatible privé et des clés liées à la contribution. Les routes de part URL, finalisation et abandon revérifient la contribution et l’utilisateur (`server/routes.ts:4372-4570`). La suppression vérifie également l’ownership avant de supprimer les objets (`routes.ts:4573-4590`).

### Uploads ou médias à risque

1. **Upload StreetView legacy anonyme**  
   `POST /api/streetview/upload` ne demande pas d’authentification (`routes.ts:4703-4748`). Il limite la chaîne image à environ 2 MiB et accepte JPEG/base64, mais ne montre pas de rate limit dédié, de quota par IP, de limite explicite sur `thumbnailData` ou de contrôle de volume cumulé. Risques : spam, coût PostgreSQL, saturation mémoire et pollution des données.

2. **Points StreetView publics**  
   `GET /api/streetview/map-points` renvoie notamment `thumbnailData` et `imageData` (`routes.ts:4682-4700`). Une route publique peut donc exposer des payloads médias volumineux ou des données dont le niveau de confidentialité n’est pas explicitement établi.

3. **Tours virtuels publics**  
   `POST /api/virtual-tours` est public et accepte plusieurs photos en base64. La route contrôle quelques champs et plafonds par photo, mais l’absence d’identité forte et de quota dédié crée un risque d’abus de stockage et de traitement.

4. **Token Mapillary**  
   `GET /api/config/mapillary-token` renvoie directement `MAPILLARY_ACCESS_TOKEN` (`routes.ts:4672-4679`). Même si le fournisseur prévoit un token client dans certains usages, cette exposition doit être traitée comme volontaire uniquement après vérification des scopes, de la restriction par domaine et de la capacité de révocation.

### Autres propriétés vérifiées

Les routes modernes n’utilisent pas le nom de fichier client comme chemin de stockage et la préparation StreetView utilise des clés de stockage générées. Aucun signe de traversée de chemin par nom de fichier n’a été retenu comme vulnérabilité démontrée dans le périmètre.

## 14. Gestion des secrets

### Variables recherchées

L’audit a vérifié les usages de `SESSION_SECRET`, `REFRESH_TOKEN_SALT`, `MASTER_ENCRYPTION_KEY`, variables `KMS_*`, `DATABASE_URL` et `RAILWAY_DATABASE_URL`, sans afficher aucune valeur.

- `SESSION_SECRET` est requis en production et doit mesurer au moins 32 caractères (`securityConfig.ts:17-27`).
- `RAILWAY_DATABASE_URL` est exigée par la vérification de configuration de production (`securityConfig.ts:29-33`).
- `REFRESH_TOKEN_SALT` est requis en production, mais n’est utilisé que par des helpers non branchés au flux runtime.
- `MASTER_ENCRYPTION_KEY` ou les paramètres KMS sont exigés selon le mode d’encryption (`securityConfig.ts:41-54`).
- Les secrets d’encryption sont chargés côté serveur.

### Vérifications d’exposition

- Aucun secret backend de cette famille n’a été trouvé dans le bundle `dist/public` lors du contrôle réalisé.
- Les valeurs n’ont pas été affichées.
- Aucun secret n’a été écrit dans le rapport.
- Les logs OTP ne contiennent pas le code généré.
- Le code prévoit une redaction de paramètres sensibles dans certains contextes (`server/securityRedaction.ts`).

### Réserve importante

La route Mapillary renvoie un token serveur configuré à un client public. Ce point doit être classé comme exposition de credential/token jusqu’à preuve qu’il s’agit d’un token public à scopes et restrictions minimaux. Il ne faut pas assimiler cette exposition à l’absence de secrets dans le bundle : la route rend le token disponible à l’exécution.

## 15. Exposition frontend

Les références `import.meta.env` côté client identifiées sont :

- `VITE_VAPID_PUBLIC_KEY` dans `client/src/lib/pushNotifications.ts` : clé publique attendue pour Web Push, non secrète par conception.
- `import.meta.env.PROD` dans `client/src/main.tsx` : indicateur de build.

Le fichier `.env.example` documente aussi une clé Google Maps préfixée `VITE_`. Toute variable `VITE_*` est par définition accessible au navigateur et ne doit contenir aucun secret, mot de passe, clé privée, credential de base, secret KMS ou secret S3.

Le client Web utilise `credentials: "include"` pour les cookies (`client/src/lib/queryClient.ts:17-22`, `34-36`) et ne met pas de Bearer token dans ses requêtes. La persistance React Query utilise `localStorage` pendant jusqu’à sept jours (`queryClient.ts:68-95`). Les familles privées importantes sont exclues, mais toute nouvelle route sensible doit être ajoutée à cette exclusion et le logout devrait purger les données privées persistées.

## 16. Compatibilité Mobile

### Ce qui est réutilisable

- Le même backend Express peut servir Web et Mobile.
- Le même utilisateur PostgreSQL peut être utilisé.
- L’OTP email peut devenir un facteur de connexion commun, avec une réponse différente selon le client.
- Les services d’autorisation et d’ownership peuvent rester côté serveur.
- Les données métier ne nécessitent pas un second backend.

### Ce qui manque pour Expo natif

- émission d’un access token ;
- validation du header `Authorization: Bearer <access_token>` pour un utilisateur ;
- émission d’un refresh token ;
- stockage du hash du refresh token et métadonnées d’appareil ;
- rotation à chaque refresh ;
- révocation lors du logout ou d’une compromission ;
- détection d’une réutilisation d’un refresh token ;
- expiration documentée ;
- contrat d’erreurs `401` et renouvellement côté client ;
- séparation nette entre session Web cookie et session Mobile Bearer.

### Évaluation

Le backend actuel est **PARTIAL** pour Mobile. Il peut accueillir le mobile après ajout d’un contrat Bearer/refresh, sans casser le Web si les deux modes sont introduits en parallèle. Il n’est pas prêt aujourd’hui pour qu’Expo s’authentifie de manière native et persistante.

Le mobile ne doit pas essayer de stocker ou reproduire `connect.sid` dans SecureStore. La session cookie doit rester le mécanisme Web ; SecureStore doit recevoir uniquement les tokens mobiles prévus à cet effet.

## 17. Architecture cible recommandée

La cible minimale recommandée est additive :

```text
WEB
  OTP email
      |
      v
  Cookie HttpOnly connect.sid
      |
      v
  Session PostgreSQL

MOBILE
  OTP email
      |
      v
  Access token courte durée
  +
  Refresh token longue durée, rotationné
      |
      v
  SecureStore Expo

WEB + MOBILE
      |
      v
  Même API Express
      |
      v
  Même user ID
      |
      v
  Même PostgreSQL
```

### Principes proposés

1. Conserver Express Session et le cookie pour le Web.
2. Ajouter une authentification Bearer distincte pour les clients natifs.
3. Ne jamais faire dépendre l’autorisation d’un rôle fourni par le client.
4. Émettre des access tokens courts, idéalement avec `sub`, audience, issuer et expiration vérifiables.
5. Générer un refresh token aléatoire, ne persister que son hash, et enregistrer un identifiant de famille/appareil.
6. Faire tourner le refresh token à chaque utilisation.
7. En cas de réutilisation d’un ancien token, révoquer la famille concernée et demander une nouvelle connexion.
8. Ajouter une route de révocation explicite et rendre le logout mobile idempotent.
9. Documenter les origines Web autorisées et ne pas traiter CORS comme une authentification.
10. Réutiliser les mêmes helpers d’ownership pour les requêtes cookie et Bearer.

Cette architecture est une recommandation uniquement. Elle n’a pas été implémentée pendant la Phase 2.0.

## 18. Vulnérabilités / risques

Les niveaux ci-dessous décrivent les risques observés dans le code actuel, sans prétendre à une exploitation en production. Aucun risque Critical n’a été démontré pendant cet audit.

### Risque H-01 — Refresh token absent

- **Niveau :** High
- **Fichier :** `server/encryptionService.ts:376-397`, `shared/schema.ts:306-318`
- **Fonction :** helpers et table `refresh_tokens`
- **Problème :** la structure existe, mais aucun endpoint ni émission runtime n’existe.
- **Impact :** impossible de fournir une authentification mobile persistante sûre ; tentation de réutiliser les cookies ou de stocker des credentials inadaptés.
- **Cause :** préparation de schéma non reliée au parcours login.
- **Correction recommandée :** concevoir puis implémenter un contrat access/refresh avec rotation, révocation et détection de réutilisation.
- **Risque de régression Web :** moyen si le flux est mélangé à la session ; faible si l’implémentation est additive et testée.
- **Impact Mobile :** bloquant.

### Risque H-02 — Exposition du token Mapillary

- **Niveau :** High à confirmer selon scopes fournisseur
- **Fichier :** `server/routes.ts:4672-4679`
- **Fonction :** `GET /api/config/mapillary-token`
- **Problème :** un token configuré côté serveur est renvoyé à tout appelant.
- **Impact :** réutilisation hors application, consommation de quota, accès à des scopes plus larges que nécessaire.
- **Cause :** usage direct d’un token backend pour alimenter le frontend.
- **Correction recommandée :** vérifier s’il s’agit d’un token public, le restreindre au minimum, préférer un proxy backend ou une clé client explicitement limitée, et prévoir rotation/révocation.
- **Risque de régression Web :** moyen ; vérifier la carte Mapillary avant retrait.
- **Impact Mobile :** un client natif ne doit pas recevoir un secret backend par défaut.

### Risque H-03 — Upload StreetView legacy anonyme

- **Niveau :** High
- **Fichier :** `server/routes.ts:4703-4748`
- **Fonction :** `POST /api/streetview/upload`
- **Problème :** écriture persistante de médias sans authentification ni rate limit dédié visible.
- **Impact :** spam, coût de stockage, saturation mémoire/base, pollution cartographique.
- **Cause :** ancienne route conservée à côté du flux StreetView authentifié.
- **Correction recommandée :** supprimer la route après migration contrôlée ou la rendre authentifiée, puis ajouter quotas, validation de payload et limitation par identité/IP.
- **Risque de régression Web :** moyen à élevé si un ancien client l’utilise.
- **Impact Mobile :** un nouveau client ne doit pas utiliser ce flux.

### Risque H-04 — Création publique de tours virtuels

- **Niveau :** High
- **Fichier :** `server/routes.ts:4786-4858`
- **Fonction :** `POST /api/virtual-tours`
- **Problème :** plusieurs photos base64 peuvent être persistées sans compte authentifié.
- **Impact :** abus de stockage et traitement, contenu non attribuable, spam.
- **Cause :** route publique avec limites locales mais sans identité forte ni quota utilisateur.
- **Correction recommandée :** authentifier ou appliquer un mécanisme anti-abus robuste, plafonner le payload total et associer chaque ressource à un propriétaire.
- **Risque de régression Web :** moyen.
- **Impact Mobile :** contrat à définir avant exposition mobile.

### Risque M-01 — CORS non contractualisé

- **Niveau :** Medium
- **Fichier :** middleware serveur ; aucune configuration `cors`/`CORS_ORIGINS` active identifiée
- **Fonction :** accès cross-origin
- **Problème :** les origines, méthodes et headers autorisés ne sont pas explicitement définis.
- **Impact :** intégration Web séparée fragile ; risque de configuration wildcard incorrecte lors d’une future correction.
- **Cause :** architecture actuelle same-origin.
- **Correction recommandée :** documenter et configurer une allowlist exacte uniquement si le besoin cross-origin est réel.
- **Risque de régression Web :** moyen.
- **Impact Mobile :** faible pour le transport natif, mais le contrat API reste nécessaire.

### Risque M-02 — CSRF bypass sur mutations publiques

- **Niveau :** Medium
- **Fichier :** `server/csrfProtection.ts:92-114`
- **Fonction :** `csrfProtection`
- **Problème :** les requêtes non authentifiées passent sans token CSRF.
- **Impact :** les routes publiques mutantes restent exposées à l’abus ; la protection CSRF ne compense pas l’absence d’authentification ou de quota.
- **Cause :** choix de ne protéger que les sessions authentifiées.
- **Correction recommandée :** classer les routes publiques ; authentifier les écritures persistantes ou leur appliquer des anti-abus et validations dédiés.
- **Risque de régression Web :** faible à moyen.
- **Impact Mobile :** aucun impact direct sur Bearer, mais le découpage doit être documenté.

### Risque M-03 — Client Web sans header CSRF explicite

- **Niveau :** Medium
- **Fichier :** `client/src/lib/queryClient.ts:17-22`
- **Fonction :** `apiRequest`
- **Problème :** aucun `x-csrf-token` n’est ajouté par le client.
- **Impact :** le Web fonctionne actuellement grâce au bypass same-origin ; un déploiement cross-origin ou une évolution plus stricte casserait les mutations.
- **Cause :** confiance dans `Origin/Referer` et same-origin.
- **Correction recommandée :** définir un bootstrap CSRF et ajouter le header pour les mutations Web si le modèle reste double-submit.
- **Risque de régression Web :** moyen si l’ordre d’initialisation n’est pas maîtrisé.
- **Impact Mobile :** le client Bearer ne doit pas dépendre du token CSRF de session.

### Risque M-04 — Compatibilité OTP historique en clair

- **Niveau :** Medium
- **Fichier :** `server/otpSecurity.ts:44-50`
- **Fonction :** `matchesStoredOtp`
- **Problème :** compatibilité avec des codes six chiffres anciens stockés en clair.
- **Impact :** exposition accrue en cas de lecture de la table OTP.
- **Cause :** transition de format.
- **Correction recommandée :** expirer/supprimer les anciens enregistrements et retirer la branche après vérification de la migration des données.
- **Risque de régression Web :** faible si les OTP sont courts et expirés.
- **Impact Mobile :** faible.

### Risque M-05 — Validation OTP de route incomplète

- **Niveau :** Medium
- **Fichier :** `server/routes.ts:752-823`
- **Fonction :** send/verify OTP
- **Problème :** présence et enum contrôlés, mais format, taille et normalisation ne sont pas uniformément validés à l’entrée.
- **Impact :** consommation inutile de ressources, messages incohérents, surface de rate limit.
- **Cause :** validation manuelle partielle.
- **Correction recommandée :** schémas stricts par type, longueur maximale et messages non révélateurs.
- **Risque de régression Web :** faible à moyen.
- **Impact Mobile :** positif après stabilisation du contrat.

### Risque M-06 — Persistance locale de données métier

- **Niveau :** Medium
- **Fichier :** `client/src/lib/queryClient.ts:68-95`
- **Fonction :** persistance React Query
- **Problème :** `localStorage` conserve des requêtes jusqu’à sept jours ; la liste d’exclusion doit rester complète.
- **Impact :** exposition locale de données potentiellement privées sur un poste partagé ou après logout.
- **Cause :** mode offline et politique d’exclusion par préfixes.
- **Correction recommandée :** classification explicite des données privées, purge au logout et tests de déshydratation.
- **Risque de régression Web :** moyen pour le mode offline.
- **Impact Mobile :** le mobile doit utiliser SecureStore/SQLite avec une politique de cache distincte.

### Risque L-01 — CSP permissive

- **Niveau :** Low à Medium
- **Fichier :** `server/securityHardening.ts:95-109`
- **Fonction :** Helmet CSP
- **Problème :** `unsafe-inline` et `unsafe-eval` sont autorisés.
- **Impact :** réduction de la défense en profondeur contre XSS.
- **Cause :** compatibilité frontend/dépendances.
- **Correction recommandée :** réduire progressivement les exceptions après inventaire des scripts/styles.
- **Risque de régression Web :** moyen.
- **Impact Mobile :** nul directement.

### Risque L-02 — Rafraîchissements publics coûteux

- **Niveau :** Low à Medium
- **Fichier :** `server/routes.ts:3688`, `4011`, `4035`, `4087`
- **Fonction :** routes publiques de refresh de données
- **Problème :** opérations de synchronisation exposées sans contrôle d’authentification spécifique visible.
- **Impact :** surcharge de services externes ou du serveur.
- **Cause :** routes conçues pour rafraîchir des données publiques.
- **Correction recommandée :** réserver le refresh aux jobs/admin ou ajouter un rate limit dédié et une protection d’idempotence.
- **Risque de régression Web :** faible à moyen.
- **Impact Mobile :** le mobile doit consommer les données, pas déclencher ces refreshs.

## 19. Tests réalisés

Les vérifications autorisées et non mutantes réalisées pour cette phase sont :

| Vérification | Résultat |
|---|---|
| `npm run check` | Réussi |
| Tests sécurité/authentification existants | 27 tests réussis |
| `npm run build` | Réussi |
| Recherche de secrets backend dans `dist/public` | Aucun secret backend détecté dans le bundle contrôlé |
| `git diff --check` | Réussi |
| Inspection statique des routes, middleware, schémas, client et helpers | Réalisée |

Aucune commande `db:push`, `drizzle-kit migrate`, migration, écriture SQL ou modification de données n’a été exécutée. Aucun nouveau test n’a été créé. Les tests exécutés ne démontrent pas l’existence d’un flux refresh : ils valident principalement les helpers sécurité, CSRF, configuration et protections déjà présentes.

## 20. Matrice Web / Backend / Mobile

| Fonction | Web actuel | Backend | Mobile futur | Risque |
|---|---|---|---|---|
| Login | OTP email puis cookie session | Fonctionnel via Passport/session | Réutiliser OTP mais retourner un couple token selon client | Élevé tant que le contrat token n’existe pas |
| OTP | Email disponible, SMS indisponible | HMAC, TTL 5 min, 5 tentatives, rate limit | Compatible après contrat de réponse stable | Moyen |
| Logout | Destruction `connect.sid` | Fonctionnel pour session | Révocation token à ajouter | Élevé pour Mobile |
| Session | Cookie HttpOnly, PostgreSQL, 7 jours | Fonctionnelle | Ne pas réutiliser le cookie ; SecureStore pour tokens | Moyen |
| Refresh token | Aucun usage Web actuel | Table/helpers seulement | Indispensable à implémenter | Critique pour readiness mobile, non démontré comme Critical global |
| Profil | `PATCH` authentifié + Zod | Ownership via utilisateur courant | Bearer à brancher sur même principal | Faible à moyen |
| Autorisation | Rôles et ownership serveur | Présents mais couverture hétérogène | Réutiliser strictement les mêmes contrôles | Moyen |
| CORS | Same-origin implicite | Pas d’allowlist explicite | API native moins dépendante de CORS, Web séparé à définir | Moyen |
| CSRF | Middleware conditionnel, origin same-origin | Protection session authentifiée | Bearer non soumis au même risque CSRF | Moyen |
| Upload | Signalements et StreetView, route legacy publique | Contrôles variables selon route | Utiliser flux authentifié et quotas | Élevé |
| Notifications | Session Web et Web Push | Routes majoritairement protégées | Push natif et appareil à concevoir séparément | Moyen |

## 21. Corrections recommandées

### A — URGENT

1. Décider du traitement de l’upload StreetView legacy anonyme avant toute nouvelle intégration mobile : authentification obligatoire ou retrait contrôlé, avec vérification de l’impact Web.
2. Auditer et réduire l’exposition du token Mapillary ; confirmer ses scopes et restrictions, puis éviter de distribuer un credential backend non limité.
3. Ajouter des quotas et rate limits dédiés aux créations publiques coûteuses, en particulier tours virtuels et médias.
4. Ne pas déclarer le backend mobile prêt tant qu’un contrat access token/refresh token n’est pas spécifié et validé.

### B — IMPORTANT

1. Concevoir le flux Bearer/refresh séparé de la session Web : access token court, refresh token hashé, rotation, révocation, reuse detection et logout mobile.
2. Ajouter une stratégie de validation stricte pour les entrées OTP et les payloads publics.
3. Établir une matrice de routes indiquant pour chaque mutation : authentification, rôle, ownership, limite et validation.
4. Documenter et, si nécessaire, configurer une allowlist CORS sans wildcard avec credentials.
5. Définir un contrat CSRF explicite pour le Web, notamment si une seconde origine Web est prévue.
6. Purger les anciens OTP en clair ou expirés puis retirer la compatibilité legacy.
7. Vérifier la purge du cache React Query et la classification des données privées après logout.
8. Tester l’atomicité de consommation OTP et les scénarios de double vérification.

### C — AMÉLIORATION

1. Réduire progressivement `unsafe-inline` et `unsafe-eval` dans la CSP.
2. Centraliser les contrôles de rôle au lieu de multiplier les tests inline.
3. Ajouter une télémétrie d’abus sans journaliser les OTP, tokens, cookies ou secrets.
4. Documenter les tokens de partage de tracking : expiration, révocation et niveau de confidentialité.
5. Préparer des contrats DTO communs Web/Mobile sans créer encore l’application Expo.

### D — NON NÉCESSAIRE

1. Ne pas remplacer Express Session pour le Web actuel.
2. Ne pas créer un deuxième backend ou une deuxième base pour Mobile.
3. Ne pas ajouter une stratégie OAuth/OIDC uniquement pour préparer Expo.
4. Ne pas modifier les cookies Web tant que le flux Web actuel reste same-origin et que les corrections sont testées.
5. Ne pas lancer Expo, React Native, EAS ou OTA dans la Phase 2.0.

## VERDICT FINAL

```text
AUTH WEB ACTUELLE          = À CORRIGER

SESSION                   = OK

REFRESH TOKEN             = NON IMPLÉMENTÉ

CORS                      = À CORRIGER

CSRF                      = À CORRIGER

AUTORISATION              = À CORRIGER

SECRETS                   = À CORRIGER

BACKEND MOBILE READY      = PARTIAL

RISQUE WEB                = HIGH

PHASE 2.1                 = BLOCKED
```

**Conclusion opérationnelle :** le Web peut continuer à utiliser l’authentification OTP/session actuelle, sous réserve de corriger les risques A et B. Le même backend peut servir de fondation à Mobile, mais l’intégration native ne doit pas commencer avant la définition et la validation du flux Bearer/refresh, la fermeture des écritures publiques à risque et la clarification des secrets exposés au navigateur.