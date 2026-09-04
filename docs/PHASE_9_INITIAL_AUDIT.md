# Phase 9 — Rapport d'audit initial

Date : 4 septembre 2026  
Périmètre : état réellement présent dans le repository avant l'intégration
production.

## Verdict de l'audit

La Phase 8.2 est **suffisamment validée pour poursuivre l'intégration
contrôlée**, mais elle ne constitue pas une validation de production.

Le prototype local démontre :

```text
source FFmpeg synthétique
  → relais FFmpeg du Camera Agent
  → RTSP publish TCP
  → MediaMTX 1.12.3
  → flux RTSP lisible par FFprobe
```

Il ne démontre pas encore :

```text
agent enrôlé et lié à une caméra persistée
  → MediaMTX distant avec TLS
  → navigateur authentifié WHEP sur réseau réel
```

## A. Ce qui fonctionne réellement

### Control plane

- Les caméras sont gérées par des routes Express authentifiées et
  owner-scoped.
- Les lectures, modifications et suppressions utilisent l'utilisateur de la
  session côté serveur ; un `userId` fourni par le frontend n'est pas la source
  d'autorisation.
- Les credentials caméra sont chiffrés avec AES-256-GCM et absents des DTO
  publics.
- Les routes d'enrollment, claim, heartbeat, listing, révocation et binding
  Camera Agent existent.
- Le code d'enrollment est expirant, à usage unique et stocké hashé.
- Les credentials d'agent sont hashés côté serveur.
- Les heartbeats d'un agent révoqué sont refusés.
- Les événements sensibles du control plane sont audités sans secrets.

### Media plane

- `VideoGateway` sépare le contrat de contrôle de l'adaptateur MediaMTX.
- Express ne transporte pas les frames vidéo.
- Les grants viewer sont courts, scoped à l'utilisateur, la caméra et le path,
  expirants et révocables.
- Les paths MediaMTX sont opaques.
- Le lecteur frontend construit une offre WebRTC et appelle directement le
  endpoint WHEP avec un bearer viewer temporaire.
- Les états de lecteur `idle`, `connecting`, `live`, `reconnecting`,
  `offline` et `error` existent.

### Preuve Phase 8.2

- MediaMTX `1.12.3` démarre via Compose local.
- La source synthétique est publiée.
- Le relais agent publie en RTSP TCP.
- MediaMTX expose le path opaque comme prêt.
- FFprobe lit réellement H.264 1280×720 à 25 fps et AAC sur le path de sortie.

### Qualité logicielle

- `npm run check` passe.
- `npm run build` passe.
- La suite backend actuelle compte 63 tests réussis.
- `git diff --check` passe.

## B. Ce qui est partiellement implémenté

- Le client `CameraAgentClient` gère le control plane, mais le lanceur média
  `agent/runMediaRelay.ts` est encore un prototype indépendant ; il ne lit pas
  encore la liste des bindings persistés et ne demande pas au control plane une
  autorisation de publication par flux.
- Le relay média ne fonctionne actuellement qu'en `testMode` local et refuse
  explicitement le mode production.
- Les sessions viewer et les chemins enregistrés par l'adaptateur restent en
  mémoire ; ils ne sont donc pas compatibles avec plusieurs instances sans
  mécanisme de coordination.
- Le frontend ne possède pas encore un état dédié `access_denied`. Une erreur
  d'autorisation est actuellement regroupée avec les erreurs générales.
- La lecture WHEP dans un navigateur authentifié n'a pas été automatisée.
- Les statuts agent, caméra, stream et viewer sont séparés dans le modèle, mais
  leur agrégation opérationnelle et leur exposition monitoring restent
  incomplètes.
- La rotation opérationnelle des credentials d'agent et publisher n'est pas
  livrée.

## C. Ce qui est simulé

- La caméra de test est une source FFmpeg `testsrc2` avec une piste audio
  synthétique.
- Le relais local utilise un credential publisher de test fourni par
  l'environnement du script.
- Le path configurable du test représente l'identité média ; aucune caméra
  physique ne produit encore ce flux.
- La preuve FFprobe valide le chemin média et les codecs, mais ne remplace pas
  une preuve de lecture WHEP dans un navigateur.

## D. Ce qui fonctionne uniquement en local

- Compose MediaMTX lie RTSP, API et WHEP à loopback.
- Le callback d'authentification MediaMTX utilise une URL HTTP locale.
- Le relay impose une source et une destination RTSP locales.
- Le script de bout en bout active `VIDEO_GATEWAY_TEST_MODE=true`.
- Les credentials publisher de test ne constituent pas une configuration de
  production.
- Aucun test WAN, CGNAT, réseau mobile, NAT symétrique, STUN ou TURN n'a été
  exécuté.
- Aucun TLS média distant n'a été configuré.

## E. Ce qui est prêt pour préproduction sous conditions

- Les primitives de control plane peuvent être revues en préproduction après
  validation non destructive du schéma réel.
- Le contrat `VideoGateway` et l'adaptateur MediaMTX peuvent servir de base
  d'intégration.
- Le lecteur WHEP peut être conservé sans réécriture d'architecture.
- Le compose local peut servir de fixture d'intégration et de smoke test.
- Les protections d'ownership, de SSRF, de chiffrement et de redaction
  constituent une base exploitable.

Conditions nécessaires :

1. vérifier le schéma PostgreSQL réel et la provenance des migrations ;
2. appliquer uniquement des migrations SQL explicites après snapshot,
   baseline et validation humaine ;
3. relier la publication média au binding agent↔caméra côté serveur ;
4. déployer MediaMTX sur un réseau privé séparé avec TLS/authentification ;
5. tester WHEP avec une session utilisateur réelle ;
6. ajouter les tests de révocation, reconnexion, multi-caméras et réseau.

## F. Ce qui est encore dangereux pour la production

- Les tables `surveillance_cameras`, `camera_agents` et
  `agent_camera_bindings` sont décrites par les migrations 0005 et 0006, mais
  leur application sur Railway n'est pas confirmée.
- `0004_runtime_alignment_draft.sql` reste une migration de préparation et ne
  doit pas être appliquée automatiquement.
- Activer les routes dépendantes de ces tables avant confirmation du schéma
  provoquerait des erreurs ou une incohérence de runtime.
- Exposer les ports RTSP 8554, API 9997 ou WHEP 8889 publiquement serait
  interdit.
- Activer `VIDEO_GATEWAY_REAL_CAMERA_ENABLED` sans architecture média distante,
  TLS et tests SSRF/réseau complets serait prématuré.
- Un agent révoqué est refusé par le control plane, mais le chemin exact
  « agent authentifié + binding actif → publication média » n'est pas encore
  imposé dans le relay prototype.
- Les maps de grants viewer et de paths ne sont pas partagées entre instances.
- Les credentials d'agent sont conservés en mémoire dans le MVP ; le packaging
  final doit utiliser un stockage secret de l'OS.

## G. Dépendances critiques

- PostgreSQL Railway, comme source de vérité des données et du schéma.
- `MASTER_ENCRYPTION_KEY` pour les credentials caméra.
- Node.js 20 et npm 10 conformément aux métadonnées du projet.
- MediaMTX 1.12.3.
- FFmpeg pour le relay et les fixtures locales.
- HTTPS pour le control plane de l'agent.
- Un réseau privé et une politique firewall pour le media plane distant.
- Un mécanisme d'état partagé si le backend ou gateway devient multi-instance.
- Un navigateur supportant WebRTC pour la validation WHEP.

## H. Risques d'architecture

1. **Autorisation media incomplète** : la persistance du binding existe au
   control plane, mais le relay média local n'en consomme pas encore la preuve.
2. **Divergence migration/runtime** : le code et le schéma TypeScript supposent
   les tables surveillance, alors que leur présence en production n'est pas
   établie.
3. **État mono-instance** : une session viewer créée par une instance peut ne
   pas être visible par une autre.
4. **Réseau WebRTC inconnu** : sans test réseau réel, il est impossible de
   conclure que les candidats ICE locaux suffiront derrière CGNAT.
5. **Observabilité incomplète** : les transitions existent dans le code, mais
   il manque des métriques opérationnelles consolidées.
6. **Documentation historique** : certains documents 8.1 décrivent l'état
   précédent la validation 8.2 et doivent être réconciliés.

## I. Éléments à corriger avant intégration production

### Bloquants

- Ne pas activer les migrations ni les routes production avant un preflight
  lecture seule contre la base réelle.
- Construire une autorisation de publication qui vérifie simultanément agent,
  propriétaire, caméra, binding actif et statut non révoqué.
- Séparer les credentials du control plane et du media plane, avec rotation
  documentée.
- Remplacer la configuration loopback par une topologie média privée et
  authentifiée avant toute caméra distante.

### Nécessaires avant préproduction

- Ajouter les tests d'IDOR et de révocation sur les routes agent/caméra/stream.
- Ajouter un test d'intégration navigateur WHEP authentifié.
- Tester les scénarios de coupure et de reconnexion.
- Vérifier au moins deux caméras et plusieurs viewers.
- Ajouter l'état utilisateur `access_denied` et des messages non techniques.
- Définir les métriques minimales agent/caméra/stream/viewer/gateway.
- Réconcilier les documents 8.1 avec l'état actuel.

## Conclusion

Il n'y a pas de raison d'abandonner l'intégration : le transport retenu est
réellement démontré en local. Il n'y a en revanche pas de base sûre pour
déployer la chaîne distante en production tant que l'autorisation de
publication, le schéma PostgreSQL, le réseau privé/TLS et la validation WHEP
réelle ne sont pas traités.