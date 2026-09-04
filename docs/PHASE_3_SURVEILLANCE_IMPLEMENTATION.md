# BurkinaWatch — Phase 3

## Socle de gestion des caméras IP

Date du rapport : 4 septembre 2026

## A. Verdict

**READY WITH CONDITIONS**

Le control plane de gestion des caméras est implémenté et vérifié. La phase
reste volontairement limitée aux métadonnées et aux credentials chiffrés :
aucun flux live, gateway média, WebRTC, RTSP sortant ou caméra réelle n’est
activé.

La migration de données est forward-only et n’a pas été appliquée
automatiquement à Railway. Une validation séparée de la baseline, du snapshot,
de la restauration et de la cible de base doit précéder toute application de
`migrations/0005_surveillance_cameras.sql`.

## B. Périmètre livré

### Données et stockage

- Table Drizzle `surveillance_cameras` et migration SQL `0005`.
- Propriétaire obligatoire avec clé étrangère vers `users`.
- Types de connexion limités à `rtsp`, `onvif` et `gateway`.
- États préparés : `unknown`, `online`, `offline`, `disabled` et `error`.
- Contraintes de port et index par propriétaire.
- Méthodes de stockage pour lister, lire, créer, modifier et supprimer.
- Chaque lecture et mutation est filtrée par `ownerId`.

### Sécurité

- Validation Zod des entrées de création et de modification.
- `ownerId` fourni par le client rejeté ; le propriétaire vient de la session.
- Validation de l’endpoint avec le garde-fou SSRF existant, sans connexion
  réseau ni résolution de caméra en Phase 3.
- Mot de passe obligatoire à la création et facultatif à la modification.
- Mot de passe chiffré avec le service AES-256-GCM existant.
- DTO public sans `username` ni `encryptedPassword`, avec seulement
  `hasCredentials`.
- Réponses caméra marquées `no-store`.
- Limiteur dédié pour les mutations caméra.
- Audits pour création, modification, activation, désactivation et
  suppression.
- Aucun credential, URL vidéo ou token de flux n’est généré ou renvoyé.

### API et interface

Routes protégées ajoutées :

- `GET /api/surveillance/cameras`
- `POST /api/surveillance/cameras`
- `GET /api/surveillance/cameras/:id`
- `PATCH /api/surveillance/cameras/:id`
- `DELETE /api/surveillance/cameras/:id`

La page protégée `/surveillance` fournit :

- la liste et l’état vide ;
- l’ajout et la modification ;
- la suppression avec confirmation ;
- l’activation et la désactivation ;
- un champ de mot de passe masqué, jamais prérempli en modification ;
- un message explicite indiquant que le flux live sera livré ultérieurement.

La page est lazy-loadée et accessible depuis le menu Services. Aucun lecteur
vidéo n’est présent.

## C. Vérifications réalisées

- `npm run check` — **PASS**
- `npm run build` — **PASS** lors de la validation de l’implémentation
  (avertissements Vite non bloquants déjà connus)
- `git diff --check` — **PASS**
- `npx tsx --test server/__tests__/surveillanceService.test.ts
  server/__tests__/surveillancePreparation.test.ts` — **PASS**, 9 tests
- `npx tsx --test server/__tests__/*.test.ts` — **PASS**, 36 tests
- Workflow `Start application` — **RUNNING**
- Logs de démarrage — aucune erreur bloquante liée à la Phase 3

Le test caméra utilise uniquement une clé déterministe dans le processus de
test. Il ne modifie aucune clé d’environnement de production.

## D. Conditions et limites explicites

1. `0005_surveillance_cameras.sql` n’est pas appliquée à Railway. Tant qu’une
   base de développement autorisée ne possède pas cette table, les routes et
   l’interface peuvent recevoir une erreur de table absente ; ce comportement
   est préféré à une modification automatique de la production.
2. Les statuts `online` et `offline` sont des états de données préparés. Aucun
   worker, probe, timeout ou reconnexion réseau ne les met encore à jour.
3. Aucun gateway/agent, MediaMTX, FFmpeg, WebRTC, WHEP, TURN/STUN,
   enregistrement, IA, alerte ou proxy vidéo n’est inclus.
4. Les tests HTTP d’intégration des routes (authentification, ownership A/B,
   404, PATCH et DELETE) restent à ajouter avant une ouverture opérationnelle.
5. L’accès à des caméras privées devra être implémenté plus tard dans un
   gateway/agent contrôlé, en réutilisant la protection SSRF au point de
   connexion réelle et sans exception globale.

## E. Prochaine barrière de validation

Avant toute application de la migration ou implémentation vidéo :

- valider la baseline et le snapshot Railway ;
- confirmer la cible de base et la procédure de restauration ;
- appliquer `0005` uniquement sur l’environnement explicitement approuvé ;
- ajouter les tests HTTP d’ownership et d’anonymat des réponses ;
- définir séparément l’architecture du gateway, les tokens courts, NAT/CGNAT,
  TURN, les quotas et l’observabilité.

La Phase 4 ne démarre pas automatiquement à la clôture de ce rapport.