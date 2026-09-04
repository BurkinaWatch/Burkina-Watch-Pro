# BurkinaWatch — Phase 2

## Surveillance — audit et préparation de l’architecture caméras IP

Date du rapport : 4 septembre 2026

Ce document clôt uniquement la phase d’audit et de préparation. Aucun flux
vidéo, aucune caméra réelle, aucun gateway et aucune migration de base n’ont
été activés.

## A. État actuel

BurkinaWatch est une application web React/Vite avec un backend Node.js /
Express, PostgreSQL via Drizzle ORM, authentification par session et
déploiement HTTP prévu sur Railway.

L’audit du dépôt ne trouve pas de media plane existant : aucun RTSP, ONVIF,
WebRTC, HLS, MJPEG, MediaMTX, Janus, LiveKit, FFmpeg, GStreamer, go2rtc,
STUN/TURN ou serveur de signaling n’est actuellement raccordé.

Les seules fonctions vidéo existantes concernent :

- la capture locale du navigateur dans `client/src/pages/StreetView.tsx`,
  désactivée et destinée aux signalements ;
- les pièces jointes photo/vidéo Base64 des signalements ;
- le tracking GPS HTTP avec polling, qui n’est pas un transport vidéo.

La base Railway reste la source de vérité de production. La résolution
`RAILWAY_DATABASE_URL || DATABASE_URL` et les garde-fous de migration restent
inchangés.

## B. Ce qui existe déjà

Les fondations réutilisables sont :

- `server/authorization.ts` : authentification, rôles, permissions,
  ownership et accès à la ressource ;
- `server/ssrfProtection.ts` : blocage des adresses privées, loopback,
  metadata cloud, link-local, CGNAT, multicast et IPv6 sensibles ;
- `server/encryptionService.ts` : AES-256-GCM, enveloppe KMS ou clé locale,
  rotation et hash de tokens ;
- `server/securityConfig.ts` : vérification de la configuration de sécurité ;
- `server/securityRedaction.ts` : redaction des credentials, tokens,
  paramètres sensibles et URLs authentifiées ;
- `server/securityHardening.ts` : Helmet/CSP, HPP, XSS et rate limits ;
- `server/replitAuth.ts` : session PostgreSQL et cookies HTTP-only ;
- `client/src/lib/queryClient.ts` et `client/public/sw.js` : les préfixes
  `/api/surveillance`, `/api/video` et `/api/media` ne sont pas persistés ni
  mis en cache ;
- les tests de `server/__tests__/phase1Security.test.ts` et
  `server/__tests__/encryptionService.test.ts`.

Ces mécanismes devront être réutilisés plutôt que remplacés. Ils ne valent
pas, à eux seuls, une intégration vidéo : la vérification effective de
l’endpoint doit aussi être faite au niveau du futur gateway.

## C. Ce qui manque

Il manque encore :

- le modèle de données caméra et sa migration revue ;
- les APIs de gestion caméra avec ownership dans chaque requête ;
- la gestion chiffrée des credentials caméra réellement utilisée ;
- un media gateway séparé du backend Express ;
- la conversion RTSP/ONVIF vers WebRTC/WHEP ;
- le signaling, la politique ICE et le choix STUN/TURN ;
- la stratégie d’accès pour les caméras derrière NAT/CGNAT ;
- les tokens vidéo courts, scoped par utilisateur et caméra, et leur révocation ;
- l’interface Surveillance lazy et protégée ;
- l’état de connexion `online` / `offline`, les timeouts et reconnexions ;
- les quotas, limites de bande passante, observabilité et procédure d’incident.

## D. Architecture recommandée

```text
Caméra IP
   ↓ RTSP / ONVIF privé
Agent ou gateway vidéo séparé
   ↓ WebRTC / WHEP
Frontend BurkinaWatch
   ↑ HTTPS
Backend Express (control plane)
```

Le backend Express doit rester le control plane : utilisateurs, permissions,
métadonnées, credentials chiffrés, état, audit et émission contrôlée de
tokens. Il ne doit pas devenir un proxy vidéo ni terminer les flux RTSP.

Le media plane doit être isolé, avec une authentification de gateway
distincte, des flux non publics et une politique de ressources indépendante.

## E. Media Gateway

MediaMTX est recommandé comme option à évaluer pour un gateway simple, car il
peut servir de pont entre des entrées RTSP et une sortie WebRTC/WHEP. Cette
recommandation n’est pas un déploiement : aucun MediaMTX n’est installé,
configuré ou exposé par cette phase.

Avant de retenir cette option, il faut valider la compatibilité des caméras,
la signalisation exacte, TLS, l’authentification entre control plane et media
plane, les limites de flux et la supervision. Le service Railway HTTP actuel
ne fournit aucune preuve de support configuré pour RTSP, UDP, ICE ou TURN ;
il ne doit donc pas être utilisé comme serveur vidéo par défaut.

## F. NAT / CGNAT

Une caméra derrière NAT ou CGNAT ne doit pas recevoir de port RTSP public.
L’option privilégiée est un agent/gateway local qui établit une connexion
sortante authentifiée vers le media plane. La caméra reste sur le réseau
privé et le service distant ne tente pas de sonder arbitrairement le LAN.

WebRTC nécessitera une politique ICE documentée : STUN pour la découverte
quand c’est suffisant, TURN relay lorsque les chemins directs échouent. Il
faut prévoir des quotas TURN, des timeouts, une limitation de débit et une
rotation des identifiants. Cette stratégie reste à décider et n’a pas été
activée.

## G. Database

Aucun schéma n’est créé dans cette phase. Le modèle proposé, à faire relire
avant migration, est une table caméra contenant au minimum :

- `id`, `owner_user_id` ou tenant strict ;
- nom et description ;
- protocole autorisé (`rtsp` ou `onvif`) ;
- hôte et port validés, chemin de flux séparé ;
- credentials chiffrés avec `server/encryptionService.ts` et version de clé ;
- statut (`pending`, `online`, `offline`, `disabled`) ;
- `last_seen_at`, `created_at`, `updated_at` ;
- identifiants d’audit et de gateway si le design final le justifie.

Les credentials ne doivent jamais être une colonne en clair, un champ de DTO
ou une valeur renvoyée au navigateur. Les futures requêtes doivent filtrer
sur `owner_user_id` directement dans le `WHERE`, en complément du middleware.
Les tokens vidéo doivent être stockés uniquement sous forme de hash si une
révocation côté serveur est retenue.

Toute migration future devra être forward-only, revue et précédée de la
validation du snapshot Railway et de la provenance Drizzle. Ni `0000` à
`0003`, ni `0004_runtime_alignment_draft.sql` ne sont rejouées par ce rapport.

## H. Security

Les exigences minimales de la prochaine phase sont :

- authentification obligatoire et permission dédiée, par exemple
  `camera:view` ;
- ownership vérifié pour chaque lecture, modification, suppression et émission
  de token ;
- validation du protocole, hôte, port et chemin sans credentials dans l’URL ;
- validation SSRF au point de connexion effectif, avec contrôle des
  redirections, DNS rebinding et adresse réellement connectée ;
- credentials chiffrés au repos, jamais dans le frontend, les logs, Git ou
  les URLs publiques ;
- tokens vidéo courts, scoped à un utilisateur et une caméra, expirables,
  non permanents et révocables si possible ;
- réponses et Service Worker en `no-store`, sans persistance TanStack Query ;
- rate limits séparés pour ajout de caméra, test de connexion, émission de
  token et accès au flux ;
- logs redacted, audit des actions sensibles et absence de secrets dans les
  erreurs ;
- limites de flux, durée, résolution, bande passante et nombre de sessions.

Le helper préparatoire `server/surveillancePreparation.ts` formalise ces
invariants sans les brancher à une route.

## I. Frontend

La future page Surveillance doit être lazy dans `client/src/App.tsx`,
protégée par `AuthGuard` et accessible depuis la section Services de
`client/src/components/HamburgerMenu.tsx`, à côté de Tracking Live.

L’interface devra séparer la liste des caméras, l’état de connexion, la
création/modification et la consultation live. Elle ne doit recevoir qu’un
DTO public et un mécanisme de session WebRTC à durée limitée : jamais de
credential, URL RTSP ou token permanent. Les états offline, timeout,
reconnexion et refus d’autorisation doivent être explicites.

Aucune route ou écran Surveillance n’est ajouté dans cette phase.

## J. Mobile

Le dépôt audité ne contient pas de dossier Expo/mobile opérationnel. Une
future application mobile pourra réutiliser le control plane HTTPS et un
lecteur WebRTC compatible, mais devra traiter les permissions réseau, le cycle
de vie en arrière-plan, la rotation des tokens et les limites de données
mobiles. La capture locale de `StreetView.tsx` ne constitue pas un client
pour caméra IP distante.

## K. Tests

Avant une implémentation, la suite devra couvrir :

- authentification absente → refus ;
- utilisateur A / caméra A → autorisé ;
- utilisateur A / caméra B et utilisateur B / caméra A → refus ;
- GET caméra sans mot de passe ni credentials ;
- protocoles et ports invalides ;
- SSRF vers loopback, privé, metadata, link-local, multicast et redirections ;
- DNS rebinding et contrôle de l’adresse réellement connectée ;
- token expiré → refus ;
- token de caméra A utilisé pour caméra B → refus ;
- token absent d’expiration ou dépassant la TTL maximale → refus ;
- secrets, URL RTSP et tokens absents des logs ;
- réponses et cache Service Worker en `no-store` ;
- caméra offline → état `offline` ;
- retour de caméra → état `online` ;
- timeouts, reconnexion, limites de sessions et quotas.

Les tests préparatoires ajoutés vérifient déjà le DTO sans credentials,
l’ownership A/B, les protocoles/ports, les tokens courts et scoped, la
redaction et les en-têtes anti-cache.

## L. Modifications réellement effectuées

Cette phase a ajouté uniquement :

- `server/surveillancePreparation.ts` : contrats et helpers préparatoires
  sans effet réseau, base, route ou gateway ;
- `server/__tests__/surveillancePreparation.test.ts` : tests unitaires des
  invariants de sécurité préparatoires ;
- `docs/PHASE_2_SURVEILLANCE_AUDIT.md` : présent rapport.

Aucune table, migration, donnée, route publique, configuration Railway,
workflow, caméra, port RTSP, gateway ou écran frontend n’a été modifié.

## M. Vérifications

À compléter après les modifications :

- `npm run check` — à exécuter ;
- `npm run build` — à exécuter ;
- tests de sécurité existants et préparatoires — à exécuter avec
  `npx tsx --test` ;
- `git diff --check` — à exécuter.

Le résultat réel sera reporté dans cette section avant livraison.

## N. Risques restants

Les risques critiques non résolus sont l’accès inter-utilisateur, la fuite de
credentials, le SSRF au niveau du connecteur réel, l’exposition RTSP,
l’accès sans authentification, les tokens permanents et la compromission du
gateway tant que les composants correspondants ne sont pas implémentés et
testés.

Restent également les risques de brute force caméra, reconnaissance réseau,
énumération d’identifiants, flux non chiffré, logs sensibles, abus de
bande passante, DoS, caméra offline, timeouts, reconnexion et quotas.

## O. Verdict

**READY WITH CONDITIONS**

La phase d’audit et de préparation est prête à être revue. La Phase 3 ne peut
commencer qu’après décision sur le gateway/media plane, NAT/CGNAT et TURN,
modèle de données et migration, politique de tokens, stratégie de test
end-to-end et plan de restauration Railway. Cette phase s’arrête ici :
aucune caméra réelle, aucun serveur vidéo et aucune modification de la base
de production ne sont activés automatiquement.