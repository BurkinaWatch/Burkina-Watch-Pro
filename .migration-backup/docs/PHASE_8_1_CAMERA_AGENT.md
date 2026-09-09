# Phase 8.1 — Camera Agent sécurisé

Date : 4 septembre 2026

## 1. Architecture

```text
Caméra IP locale
      │ RTSP local
      ▼
Camera Agent
      │ HTTPS/TLS sortant
      ▼
BurkinaWatch Control Plane
      │
      ├── PostgreSQL : identité, enrôlement, bindings, révocation
      └── Media Plane séparé : MediaMTX / WebRTC
```

L’agent ne reçoit aucune connexion entrante et ne transforme pas BurkinaWatch
en proxy vidéo. Le client livré dans `agent/cameraAgent.ts` implémente le
control plane minimal : enrôlement, credential dédié, heartbeat et backoff.

Le transport `RTSP local → MediaMTX` n’est pas encore activé : sa méthode
exacte doit être validée avec un MediaMTX distant et un réseau NAT/CGNAT réel.

## 2. Responsabilités et interdits

L’agent peut :

- s’enrôler avec un code temporaire ;
- maintenir un heartbeat sortant ;
- signaler sa version ;
- se reconnecter avec un backoff borné.

L’agent ne peut pas :

- scanner le LAN ou Internet ;
- exécuter un shell ou une commande distante ;
- accéder à PostgreSQL ;
- recevoir `MASTER_ENCRYPTION_KEY` ou `SESSION_SECRET` ;
- ouvrir un port entrant ;
- utiliser UPnP ou DMZ ;
- devenir un proxy réseau général.

## 3. Identité et enrôlement

La migration `0006_camera_agents.sql` ajoute :

- `camera_agents` ;
- `agent_camera_bindings`.

Chaque agent possède un identifiant propre. Le code d’enrôlement est :

- aléatoire ;
- expirant après 10 minutes ;
- à usage unique ;
- stocké sous forme hashée ;
- invalidé au premier claim.

Routes ajoutées :

```text
POST /api/surveillance/agents/enrollments
POST /api/surveillance/agents/enroll
GET  /api/surveillance/agents
POST /api/surveillance/agents/:id/revoke
POST /api/surveillance/agents/:id/bind-camera/:cameraId
DELETE /api/surveillance/agents/:id/bind-camera/:cameraId
POST /api/surveillance/agents/heartbeat
```

Le credential délivré après enrôlement est opaque et hashé côté serveur. Il
n’est jamais dérivé de `SESSION_SECRET`, `MASTER_ENCRYPTION_KEY` ou
`REFRESH_TOKEN_SALT`.

## 4. Heartbeat et états

Le heartbeat contient uniquement :

- `agentId` ;
- version optionnelle ;
- timestamp côté serveur.

Seuils :

- `ONLINE` : heartbeat reçu depuis au plus 90 secondes ;
- `STALE` : plus de 90 secondes et au plus 5 minutes ;
- `OFFLINE` : plus de 5 minutes ;
- `REVOKED` : révocation persistée ;
- `PENDING` : enrôlement non encore consommé.

Le serveur ne confond pas les états agent, caméra, stream et viewer.

## 5. Authentification et TLS

Le MVP utilise un token opaque long aléatoire, transmis en `Authorization:
Bearer` et stocké hashé côté serveur. mTLS n’est pas prétendu implémenté.

Le client agent :

- exige HTTPS en production ;
- n’autorise HTTP qu’à `localhost`, `127.0.0.1` ou `::1` en développement ;
- n’utilise jamais `rejectUnauthorized: false`.

La reconnexion utilise un backoff de 1 seconde jusqu’à 60 secondes.

## 6. User → Agent → Camera

Les bindings sont vérifiés par :

```text
utilisateur authentifié
        ↓
ownership de l’agent
        ↓
ownership de la caméra
        ↓
binding explicite
```

Un utilisateur ne peut pas lier l’agent ou la caméra d’un autre utilisateur.
Les identifiants de route sont validés comme UUID avant accès.

## 7. Révocation

La révocation :

- marque l’agent `revoked` ;
- écrit `revoked_at` ;
- empêche les heartbeats ultérieurs ;
- empêche une réutilisation automatique de l’ancien credential.

Les opérations sensibles auditées incluent :

- `agent.created` ;
- `agent.enrolled` ;
- `agent.authentication_failed` ;
- `agent.revoked` ;
- `agent.camera_bound` ;
- `agent.camera_unbound`.

Les logs excluent enrollment codes, credentials, passwords, clés et URLs RTSP
complètes.

## 8. Credentials caméra et MediaMTX

Les credentials caméra restent protégés par le chiffrement AES-256-GCM
existant. Cette phase ne transmet pas encore de credentials caméra à l’agent.
La méthode de transport média doit être arrêtée avant cette transmission.

MediaMTX reste séparé. L’API admin du compose local est liée à loopback et ne
doit pas être exposée en production.

## 9. Base de données

```text
migration créée : OUI — migrations/0006_camera_agents.sql
migration exécutée : NON
db:push exécuté : NON
db:push --force exécuté : NON
reset effectué : NON
```

Index créés dans la migration :

- agent par owner/status ;
- agent par owner/last_seen ;
- binding par owner ;
- binding par camera ;
- unicité agent/camera.

## 10. Tests effectués

- `npm run check` : réussi.
- `npm run build` : réussi.
- Suite backend : **60 tests réussis, 0 échec**.
- Tests du protocole agent :
  - hash et vérification de credential ;
  - seuils online/stale/offline ;
  - backoff borné.
- Tests du client agent :
  - HTTPS obligatoire en production ;
  - HTTP limité à localhost en développement ;
  - enrôlement et bearer credential ;
  - absence du credential dans le body heartbeat.
- Tests d’architecture :
  - ports MediaMTX liés à loopback ;
  - décisions STUN/TURN et agent documentées.
- `git diff --check` : réussi.

## 11. Non testé

- caméra physique ;
- vrai LAN ;
- WAN ;
- NAT/CGNAT réel ;
- réseaux 4G/5G ;
- NAT symétrique ;
- STUN ;
- TURN ;
- MediaMTX distant ;
- transport média agent → MediaMTX ;
- coupure Internet réelle ;
- redémarrage réel de l’agent ;
- rotation opérationnelle du credential ;
- charge réelle multi-agents ;
- multi-instance avec état partagé.

## 12. Risques restants

1. La migration 0006 n’est pas appliquée.
2. Le client agent conserve son credential en mémoire dans ce MVP ; le packaging
   final devra utiliser le trousseau du système ou un gestionnaire sécurisé.
3. Aucun flux vidéo ne transite encore par l’agent.
4. Les paths MediaMTX et grants viewer restent mono-instance.
5. STUN/TURN ne sont pas choisis sur la base d’un test réseau réel.
6. Les routes agent ne doivent pas être activées en production avant migration,
   revue et test de concurrence d’enrôlement.

## 13. Prochaine étape

Après validation humaine :

1. prévisualiser la migration 0006 contre la base réelle sans l’exécuter ;
2. tester l’enrôlement avec deux utilisateurs isolés ;
3. tester la révocation et la reconnexion ;
4. tester un agent derrière NAT/CGNAT réel ;
5. choisir le protocole agent → MediaMTX ;
6. décider STUN/TURN avec mesures.

## 14. Verdict

### READY WITH CONDITIONS

Le control plane sécurisé de l’agent est implémenté et testé. La phase n’est
pas une mise en production : le transport média, la caméra physique, le réseau
CGNAT et la migration contrôlée restent obligatoires avant activation distante.
