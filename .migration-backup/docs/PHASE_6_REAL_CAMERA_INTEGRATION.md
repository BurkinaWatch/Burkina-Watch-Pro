# Phase 6 — Intégration contrôlée d’une caméra IP réelle

## 1. Architecture finale

```text
Caméra IP privée
      │ RTSP (sortie uniquement depuis le gateway)
      ▼
MediaMTX 1.12.3
      │ WHEP / WebRTC
      ▼
Navigateur authentifié
      ▲
      │ contrôle, ownership, tokens temporaires
BurkinaWatch / Express
```

Express reste le control plane. Il ne transporte aucun paquet vidéo. MediaMTX
reste le media plane et reçoit la configuration du path uniquement depuis le
control plane.

## 2. Audit avant codage

L’audit a confirmé que le projet possédait déjà :

- le CRUD des caméras avec filtre `owner_id` ;
- le chiffrement AES-256-GCM existant ;
- la redaction des réponses et des logs ;
- les grants vidéo temporaires liés à l’utilisateur et à la caméra ;
- l’adaptateur MediaMTX et le lecteur WebRTC/WHEP Phase 5 ;
- la protection CSRF, CSP, CORS et SSRF existante.

Les écarts étaient l’absence de test RTSP réel, l’absence de déchiffrement
serveur pour la connexion, l’absence d’enregistrement des paths réels et
l’absence de lecteur pour les caméras persistées.

## 3. Fichiers modifiés

- `.env.example`
- `client/src/pages/Surveillance.tsx`
- `server/mediaMtxGateway.ts`
- `server/routes.ts`
- `server/ssrfProtection.ts`
- `server/surveillancePrototype.ts`
- `server/surveillanceService.ts`
- `server/videoGateway.ts`
- `server/__tests__/mediaMtxGateway.test.ts`
- `server/__tests__/phase1Security.test.ts`
- `server/__tests__/videoGateway.test.ts`

## 4. Fichiers créés

- `server/rtspConnection.ts`
- `server/__tests__/rtspConnection.test.ts`
- `docs/PHASE_6_REAL_CAMERA_INTEGRATION.md`

## 5. Fonctionnalités livrées

### Test de connexion

`POST /api/surveillance/cameras/:id/test-connection` :

1. exige une session authentifiée ;
2. charge la caméra avec `owner_id` dans la requête ;
3. refuse ONVIF tant qu’aucun connecteur ONVIF contrôlé n’est nécessaire ;
4. déchiffre le mot de passe uniquement en mémoire côté serveur ;
5. applique la validation SSRF ;
6. effectue un `DESCRIBE` RTSP avec timeout ;
7. supporte Basic et Digest lorsque la caméra le demande ;
8. retourne uniquement `success` et `status`.

Le mot de passe, l’URL RTSP et les détails du protocole ne sont pas retournés.

### Live réel

`GET /api/surveillance/cameras/:id/live` est maintenant partagé entre :

- la caméra virtuelle locale Phase 5 ;
- une caméra persistée RTSP lorsque le flag réel est activé hors production.

Le path MediaMTX réel est opaque, stable pour une caméra donnée et calculé par
HMAC. Le token viewer reste temporaire, lié à l’utilisateur et à la caméra,
et révocable.

### UI

Chaque caméra persistée dispose maintenant de :

- un lecteur WebRTC réutilisant le composant existant ;
- les états connexion, direct, hors ligne, erreur et reconnexion ;
- arrêt et révocation de session ;
- un bouton de test de connexion ;
- un statut mis à jour après le test.

## 6. Base de données

- Table utilisée : `surveillance_cameras`.
- Aucun changement de schéma n’a été exécuté.
- La migration `0005_surveillance_cameras.sql` reste en attente conformément
  à la protection Railway déjà en place.
- Aucune migration destructive, reset ou `db:push` n’a été exécuté.
- L’association path MediaMTX reste en mémoire dans l’adaptateur pour cette
  phase contrôlée ; elle devra devenir partagée avant le multi-instance.

## 7. Sécurité

- Authentication : requise sur les routes caméra.
- Authorization / ownership : chaque lecture et mutation utilise l’utilisateur
  authentifié dans la requête de stockage.
- SSRF : les loopbacks, metadata endpoints, link-local, multicast et réservés
  restent bloqués. Les réseaux privés ne sont autorisés que si
  `VIDEO_GATEWAY_ALLOW_PRIVATE_NETWORK=true` et uniquement hors production.
- Encryption : mot de passe stocké via le service AES-256-GCM existant.
- Token security : TTL de 60 secondes, scope, utilisateur, caméra et
  révocation vérifiés.
- Secret redaction : les réponses, logs techniques et erreurs ne contiennent
  pas les credentials caméra.
- CSP/CORS : les origines MediaMTX restent explicitement configurées ; aucune
  origine générique n’est ajoutée.
- Express ne devient pas un proxy vidéo.

## 8. Variables d’environnement

Le gateway reste désactivé par défaut.

Pour un test local contrôlé avec MediaMTX :

```text
VIDEO_GATEWAY_ENABLED=true
VIDEO_GATEWAY_PROVIDER=mediamtx
VIDEO_GATEWAY_TEST_MODE=false
VIDEO_GATEWAY_REAL_CAMERA_ENABLED=true
VIDEO_GATEWAY_ALLOW_PRIVATE_NETWORK=true
VIDEO_GATEWAY_API_URL=http://127.0.0.1:9997
VIDEO_GATEWAY_PUBLIC_ORIGIN=http://127.0.0.1:8889
VIDEO_GATEWAY_API_TOKEN=<secret du gestionnaire de secrets>
VIDEO_GATEWAY_PATH_SECRET=<secret du gestionnaire de secrets>
```

Les deux dernières valeurs doivent rester dans le gestionnaire de secrets.
Pour une préproduction, utiliser des origines HTTPS et une MediaMTX non
exposée publiquement. Ne pas activer ces flags en production dans cette phase.

## 9. Caméra réelle et infrastructure

La chaîne avec une caméra physique n’a pas pu être exécutée dans cet
environnement faute de caméra et de réseau privé contrôlé disponibles.

Avant le test préproduction, il faut fournir :

- une caméra RTSP de test ;
- un réseau privé ou VPN entre MediaMTX et la caméra ;
- un firewall autorisant uniquement la sortie RTSP nécessaire ;
- les credentials transmis au formulaire sécurisé, jamais dans un ticket, un
  log ou une URL partagée ;
- une terminaison HTTPS pour l’origine WHEP hors local.

TURN n’est pas ajouté. Il ne sera étudié qu’après un test réseau distant qui
montre qu’un chemin ICE direct/STUN est insuffisant.

## 10. Tests exécutés

- `npm run check` : réussi.
- `node --import tsx --test server/__tests__/*.test.ts` : 51 tests réussis.
- `git diff --check` : réussi.
- Tests ajoutés : sonde RTSP, Basic auth, timeout abstrait, source réelle
  opaque, configuration caméra réelle et réseau privé explicitement autorisé.
- Test caméra physique, lecture navigateur authentifiée d’une vraie caméra,
  NAT/TURN et mesure de latence réelle : non exécutables ici, faute
  d’infrastructure physique.

## 11. Problèmes restant à résoudre

1. Appliquer séparément et après validation la migration caméra sur
   l’environnement de développement/préproduction.
2. Exécuter les dix scénarios de la caméra physique, notamment A/B, token
   expiré, caméra hors ligne et reconnexion.
3. Vérifier le comportement du codec fourni par le modèle de caméra.
4. Remplacer l’état des paths et grants en mémoire avant plusieurs instances.
5. Réévaluer STUN/TURN sur un réseau de staging HTTPS.
6. Définir la politique finale de déchiffrement et d’adresses privées avant
   toute caméra réelle en production.

## 12. Verdict

### READY WITH CONDITIONS

La chaîne logicielle est prête pour un test de caméra réelle uniquement dans
un environnement de développement/préproduction contrôlé, avec :

- migration appliquée séparément sur cet environnement ;
- MediaMTX joignable sur un réseau privé/VPN ;
- flags caméra réelle activés explicitement hors production ;
- `VIDEO_GATEWAY_API_TOKEN` et `VIDEO_GATEWAY_PATH_SECRET` fournis par le
  gestionnaire de secrets ;
- HTTPS pour un accès navigateur non local ;
- validation complète des scénarios ownership, tokens, offline/reconnexion,
  codecs et réseau avant toute promotion.
