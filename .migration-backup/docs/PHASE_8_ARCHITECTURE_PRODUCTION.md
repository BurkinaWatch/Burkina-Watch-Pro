# Prompt 8 — Architecture de production et caméras distantes

Date : 4 septembre 2026

## 1. État initial

Le Prompt 7 a livré un control plane Express capable de gérer des caméras
directes, leurs credentials chiffrés, les tests RTSP, les paths MediaMTX,
les grants viewer temporaires, les révocations, l’ownership et l’audit.

Le media plane reste séparé :

```text
BurkinaWatch / Express / PostgreSQL
        control plane
              │
              ▼
          MediaMTX
        media plane
              │
              ▼
        WebRTC / WHEP
              │
              ▼
        navigateur authentifié
```

Les grants viewer et les associations de paths restent en mémoire. Cette
limite est acceptable pour le prototype mono-instance, mais pas pour un
déploiement multi-instance ou une reprise après redémarrage.

## 2. Architecture retenue

### Caméra directement accessible

```text
Caméra IP privée
      │ RTSP
      ▼
MediaMTX privé
      │ WHEP / WebRTC
      ▼
Navigateur
```

Express configure et autorise ; il ne relaie pas la vidéo.

### Caméra derrière NAT/CGNAT

```text
Caméra IP locale
      │ RTSP local
      ▼
BurkinaWatch Camera Agent
      │ connexion sortante TLS
      ▼
Infrastructure média privée
      │
      ▼
MediaMTX → WebRTC → navigateur
```

Le serveur n’a pas besoin d’ouvrir une connexion entrante vers le domicile.
L’agent n’est pas un VPN général, un scanner LAN ou un proxy : son seul rôle
futur est `caméra → flux vidéo → infrastructure BurkinaWatch`.

## 3. Control plane

Express conserve la responsabilité de :

- utilisateurs et authentification ;
- ownership ;
- caméras directes et caméras liées à un agent ;
- configuration ;
- enrôlement et révocation d’agents à implémenter avant usage distant ;
- tokens viewer temporaires ;
- audit et rate limiting.

Les paths MediaMTX, credentials caméra et tokens ne sont pas des informations
frontend persistantes.

## 4. Media plane

MediaMTX reste un composant séparé pour :

- ingestion RTSP ;
- publication contrôlée ;
- lecture WebRTC/WHEP ;
- contrôle d’accès callback.

L’API admin MediaMTX n’est pas une API publique BurkinaWatch. Le compose local
lie désormais ses ports à `127.0.0.1`. En production, MediaMTX doit être placé
sur un réseau privé ou derrière un firewall autorisant uniquement le control
plane et les flux média nécessaires.

## 5. Caméras LAN

Une caméra directement accessible peut être utilisée uniquement si :

- son endpoint est techniquement atteignable depuis le gateway ;
- la validation SSRF l’autorise explicitement ;
- l’environnement n’est pas la production par défaut ;
- les credentials sont chiffrés ;
- le flux n’est jamais rendu public.

Il ne faut pas demander à l’utilisateur :

- d’ouvrir le port 554 sur Internet ;
- de configurer une DMZ ;
- de désactiver son firewall ;
- d’activer UPnP ;
- de publier l’API admin MediaMTX.

## 6. Caméras WAN/NAT/CGNAT

La caméra distante ne doit pas être jointe par une connexion entrante depuis
Railway. La solution retenue est un agent local établissant une connexion
sortante TLS vers une infrastructure média privée.

Cette partie est préparée architecturalement mais non activée, car aucun
réseau CGNAT ni caméra physique n’est disponible dans l’environnement actuel.

## 7. Agent local

### Nécessité

L’agent est nécessaire pour les caméras derrière CGNAT ou les réseaux où le
gateway ne peut pas joindre directement l’endpoint RTSP.

### État d’implémentation

L’agent média n’est pas encore déployé. Son implémentation complète est
intentionnellement différée jusqu’à la disponibilité d’un environnement de
test LAN/WAN/CGNAT et d’une destination média privée.

### Identité prévue

L’agent devra posséder :

- un `agentId` aléatoire propre ;
- une identité distincte du `cameraId` ;
- un secret rotatif stocké uniquement sous forme hashée côté serveur ;
- un état `pending`, `enrolled`, `online`, `offline` ou `revoked` ;
- une association explicite à un utilisateur ;
- des caméras autorisées explicitement.

### Enrôlement prévu

1. Un utilisateur authentifié demande un enrôlement.
2. BurkinaWatch génère un code temporaire et à usage unique.
3. L’agent échange ce code via TLS.
4. Le serveur délivre une identité et un credential initial une seule fois.
5. L’agent ouvre ensuite uniquement une connexion sortante.

Le code d’enrôlement ne sera jamais permanent, prédictible ou réutilisable.

### Révocation prévue

La révocation devra empêcher immédiatement les heartbeats et publications
futures. Les caméras associées passeront dans un état cohérent, sans supprimer
leurs credentials chiffrés ni leurs données de configuration.

### Permissions

Un agent compromis ne devra pas pouvoir :

- lire une autre caméra ;
- accéder à PostgreSQL ;
- appeler l’API admin MediaMTX ;
- exécuter une commande serveur ;
- accéder aux données d’un autre utilisateur.

## 8. WebRTC, STUN et TURN

Le viewer actuel utilise WHEP et `RTCPeerConnection` sans serveur ICE imposé.

État de validation :

- STUN : non testé sur un réseau distant ;
- TURN : non installé ;
- ICE distant : non validé ;
- UDP bloqué / fallback TCP-TLS : non validé ;
- NAT symétrique / CGNAT : non validé.

TURN ne sera ajouté que si un test distant montre que STUN ou la connectivité
directe échoue. Il devra alors utiliser des credentials temporaires, des
limites d’usage et une mesure de bande passante.

## 9. Infrastructure et ports

### Control plane

- BurkinaWatch/Express : port HTTP(S) de l’application ;
- PostgreSQL : réseau privé uniquement ;
- secrets : gestionnaire de secrets Railway/environnement sécurisé.

### Media plane

- RTSP : interne au réseau média ;
- API MediaMTX : réseau de contrôle privé uniquement ;
- WebRTC/WHEP : exposition via l’origine média validée ;
- TURN éventuel : uniquement après preuve de nécessité.

Le compose de test utilise maintenant des bindings loopback :

- `127.0.0.1:8554` pour RTSP ;
- `127.0.0.1:9997` pour l’API admin ;
- `127.0.0.1:8889` pour WHEP/WebRTC.

Ce compose n’est pas une configuration de production. Railway reste le
control plane jusqu’à preuve qu’un hébergement média séparé est nécessaire.

## 10. Firewall et TLS

Principe : deny by default.

En production :

- API admin MediaMTX : pas d’exposition Internet ;
- RTSP caméra : réseau privé ou sortie agent ;
- control plane : HTTPS ;
- agent : connexion sortante TLS ;
- WebRTC : ports et origine strictement documentés ;
- TURN : ports minimaux seulement si activé.

Le développement local peut utiliser HTTP loopback. Cela ne constitue pas une
configuration acceptable pour un agent distant de production.

## 11. Database et migrations

Aucun changement de base n’a été appliqué.

Les migrations `0004` et `0005` restent contrôlées séparément. Une future
migration d’agents devra être explicite et forward-only, avec au minimum :

- table `camera_agents` ;
- identité hashée ;
- expiration d’enrôlement ;
- statut et `last_seen_at` ;
- révocation ;
- binding agent/caméra ;
- index owner/status/lastSeen/agent/camera.

Il ne faut pas utiliser `db:push --force` ni modifier Railway pour cette phase.

## 12. Monitoring et alertes futures

Indicateurs à préparer avant production distante :

- agents online/offline/revoked ;
- cameras online/offline/degraded ;
- streams active/failed/reconnecting ;
- viewers actifs ;
- erreurs WebRTC ;
- utilisation TURN ;
- CPU/RAM/bande passante du media plane.

Alertes candidates :

- agent offline prolongé ;
- caméra offline prolongée ;
- gateway inaccessible ;
- hausse des erreurs WebRTC ;
- usage anormal ;
- accès non autorisés.

Le système d’alertes n’est pas ajouté maintenant.

## 13. Tests réalisés ou non réalisés

Déjà validé par les phases précédentes :

- `npm run check` ;
- `npm run build` ;
- 52 tests backend ;
- ownership et isolation ;
- SSRF ;
- tokens temporaires ;
- révocation ;
- absence de secrets frontend ;
- limite viewers ;
- smoke test MediaMTX/FFmpeg synthétique.

Non testé :

- caméra physique ;
- WAN ;
- NAT/CGNAT ;
- STUN/TURN ;
- coupure et restauration d’Internet ;
- redémarrage agent/MediaMTX/backend ;
- charge multi-caméras réelle ;
- reprise multi-instance ;
- rotation et révocation d’une identité agent opérationnelle.

## 14. Coûts qualitatifs

- Control plane PostgreSQL/API : faible à modéré.
- MediaMTX : modéré, dépendant du nombre de flux et viewers.
- Bande passante vidéo : principal poste de coût.
- TURN : potentiellement élevé selon le trafic relayé.
- Stockage vidéo : volontairement nul dans le MVP live-only.
- Agents locaux : faible côté infrastructure centrale, mais coût de
  maintenance et support opérationnel.

## 15. Risques restants

1. La chaîne physique n’est pas validée.
2. Les sessions viewer et paths ne sont pas partagés entre instances.
3. L’identité et l’enrôlement agent ne sont pas encore implémentés.
4. STUN/TURN n’ont pas de décision fondée sur un test WAN.
5. Media plane production et firewall restent à déployer séparément.
6. Les métriques média ne sont pas encore persistantes.

## 16. Prochaine étape

La prochaine étape recommandée est un MVP d’agent minimal et limité :

1. migration contrôlée `camera_agents` et bindings ;
2. enrôlement temporaire à usage unique ;
3. credential hashé, rotation et révocation ;
4. heartbeat sortant TLS ;
5. test avec une caméra derrière NAT réel ;
6. seulement ensuite, transport média agent → MediaMTX ;
7. décision STUN/TURN basée sur les mesures.

Cette étape ne doit pas être lancée sur Railway sans validation de la migration
et sans réseau de test contrôlé.

## 17. Verdict

### READY WITH CONDITIONS

L’architecture control plane/media plane et la stratégie NAT/CGNAT sont
clarifiées, et l’exposition locale de l’API admin MediaMTX est durcie.

Le projet n’est pas encore prêt pour une caméra distante de production :
l’agent, l’enrôlement, la persistance multi-instance et les tests WAN restent
à réaliser dans une phase dédiée.
