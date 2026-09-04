# Phase 8.2 — Décision de transport média

Date : 4 septembre 2026

## Décision

Le prototype local utilise :

```text
RTSP local
    ↓ pull TCP par FFmpeg dans le Camera Agent
RTSP publish TCP vers MediaMTX
    ↓
MediaMTX
    ↓ WHEP/WebRTC
Navigateur
```

La version du conteneur utilisée est **MediaMTX 1.12.3**.

## Pourquoi RTSP publish TCP ?

MediaMTX supporte les clients RTSP qui publient sur un path configuré en
`source: publisher`. Le handshake RTSP utilise TCP et le prototype force
également le transport média TCP avec `rtspTransports: [tcp]`.

Ce choix réutilise le support déjà présent dans le dépôt, évite d’ajouter une
librairie média dans Express et correspond au besoin Agent → MediaMTX. Le
Camera Agent initie la connexion vers MediaMTX ; aucun port entrant n’est
nécessaire du côté caméra/agent dans le prototype local.

## Comparaison

| Option | Support MediaMTX | Connexion | NAT/CGNAT futur | TLS/Auth | Décision |
|---|---|---|---|---|---|
| RTSP publish TCP | Oui | sortante de l’agent vers MediaMTX | possible si MediaMTX est une destination joignable | credentials RTSP + TLS à activer hors local | **retenu** |
| RTSP UDP | Oui, mais ports RTP/RTCP supplémentaires | sortante + flux UDP | fragile derrière NAT/CGNAT | plus complexe | non retenu |
| WebRTC publish | Oui selon client et ICE | dépend de la topologie ICE | nécessite tests STUN/TURN | possible | non retenu pour ce MVP |
| SRT publish | Supporté par MediaMTX | sortante | utile pour certains réseaux | autre chaîne opérationnelle | non retenu |
| RTMP/RTMPS | Supporté selon configuration | sortante | possible, mais conversion inutile ici | possible | non retenu |
| API MediaMTX | contrôle uniquement | sortante du control plane | ne transporte pas les frames | auth API | pas un transport média |

## Authentification

Le prototype utilise le callback HTTP MediaMTX vers :

```text
POST /api/surveillance/media-auth
```

Le publisher de test utilise un credential dédié fourni uniquement par
l’environnement local :

```text
VIDEO_GATEWAY_PUBLISHER_USERNAME
VIDEO_GATEWAY_PUBLISHER_PASSWORD
```

Ces valeurs ne sont pas les secrets serveur, ne sont pas incluses dans Git et
ne sont pas renvoyées au frontend. L’authentification est limitée aux paths de
test et au mode `VIDEO_GATEWAY_TEST_MODE=true`.

## Identité du flux

Le path de sortie est calculé par HMAC à partir de :

```text
agentId : cameraId : streamId
```

Le frontend ne reçoit jamais l’URL source locale ni les credentials publisher.

## TLS et limites NAT

Le prototype utilise HTTP/RTSP loopback. Cela est acceptable uniquement pour
le test local. En production :

- le control plane doit être HTTPS ;
- MediaMTX doit être placé sur un réseau privé ;
- le RTSP publisher devra utiliser une terminaison TLS adaptée ;
- la connectivité réelle NAT/CGNAT devra être mesurée ;
- STUN/TURN ne sont pas installés par cette phase.

## Conclusion

RTSP publish TCP est le mécanisme le plus simple réellement compatible avec la
version MediaMTX du projet et la séparation media plane/control plane. Il est
validé localement pour un flux synthétique ; il n’est pas encore validé sur
WAN/CGNAT ni pour une infrastructure MediaMTX distante.