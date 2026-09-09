# Phase 8.2 — Transport média et prototype local

Date : 4 septembre 2026

## 1. Architecture retenue

```text
FFmpeg TEST SOURCE
      │ RTSP local /phase8-2-source
      ▼
Camera Agent media relay
      │ RTSP publish TCP + credential dédié
      ▼
MediaMTX 1.12.3
      │ WHEP/WebRTC
      ▼
BurkinaWatch / navigateur
```

Express reste le control plane. Il ne reçoit aucune frame et ne proxyfie pas
la vidéo.

## 2. Implémentation

Fichiers ajoutés :

- `agent/mediaRelay.ts` — relais FFmpeg limité au mode test local ;
- `agent/runMediaRelay.ts` — lanceur local ;
- `mediamtx/phase8-2.yml` — configuration MediaMTX dédiée au test ;
- `docker-compose.phase8-2.yml` — compose local loopback ;
- `scripts/phase8-2-local-e2e.sh` — orchestration contrôlée ;
- `docs/PHASE_8_2_MEDIA_TRANSPORT_DECISION.md` ;
- ce rapport.

Fichiers modifiés :

- `server/routes.ts` — authentification publisher/read du test local ;
- `server/surveillancePrototype.ts` — path de test configurable et path source ;
- `scripts/phase5-test-source.sh` — path et credentials de test optionnels ;
- `.env.example` — variables publisher de test documentées.

Test ajouté :

- `server/__tests__/mediaRelay.test.ts`.

## 3. Configuration et ports

MediaMTX `1.12.3` :

```text
RTSP : 127.0.0.1:8554
API  : 127.0.0.1:9997
WHEP : 127.0.0.1:8889
App  : 127.0.0.1:5001 pendant le test 8.2
```

Tous les ports sont liés à loopback. Le compose 8.2 n’est pas une
configuration de production.

## 4. Source et codecs

La source est explicitement synthétique :

```text
TEST SOURCE
lavfi testsrc2 1280x720 à 25 fps
lavfi sine 48 kHz
```

FFmpeg encode :

```text
H.264 / yuv420p / ultrafast / zerolatency / GOP 50 / 1800 kbit/s
AAC / 48 kHz / 96 kbit/s
```

Le relais agent utilise `-c:v copy` et `-c:a copy` : il ne transcode pas
inutilement un flux déjà compatible.

## 5. Authentification et secrets

MediaMTX appelle le control plane pour vérifier :

- publication de la source de test ;
- lecture locale par le relais ;
- publication de l’agent vers le path opaque.

Le credential est généré dans le shell de test. Il n’est pas stocké dans Git,
ni imprimé par l’agent, ni inclus dans une URL frontend. Le test n’utilise
aucun credential de production.

## 6. Reconnexion

Le relais :

- détecte la sortie du processus FFmpeg ;
- passe par `disconnected` ou `error` ;
- applique un backoff borné de 1 à 60 secondes ;
- relance FFmpeg ;
- repasse à `published` après reconnexion.

Le test unitaire vérifie la construction de commande sans shell, les paths
HMAC et les refus d’origines non locales.

## 7. Résultats observés

Commande exécutée :

```text
VIDEO_GATEWAY_PUBLISHER_PASSWORD=<éphémère> \
bash scripts/phase8-2-local-e2e.sh
```

Résultats :

- MediaMTX 1.12.3 démarré ;
- source synthétique publiée ;
- agent lancé ;
- publication RTSP TCP acceptée ;
- path HMAC opaque observé comme `ready` par l’API MediaMTX ;
- lecture RTSP du path agent prévue par FFprobe dans le script ;
- arrêt automatique du compose à la fin du test.

## 8. Mesures

Le profil du flux est déterministe par la source :

```text
résolution : 1280x720
fps        : 25
bitrate    : environ 1800 kbit/s vidéo + 96 kbit/s audio
latence    : non mesurée
CPU/RAM    : non mesurés
```

Aucune promesse de latence ou de coût n’est faite sans mesure.

## 9. Sécurité confirmée

```text
RTSP public                  : NON
port 554 Internet public     : NON
API admin MediaMTX publique  : NON
UPnP                         : NON
DMZ                          : NON
credentials frontend         : NON
secrets dans les logs        : NON
secrets Git                  : NON
Express transporte la vidéo  : NON
```

## 10. Non testé

- lecture WHEP depuis un navigateur authentifié avec une session utilisateur ;
- WAN réel ;
- CGNAT ;
- NAT symétrique ;
- 4G/5G ;
- STUN ;
- TURN ;
- caméra physique ;
- MediaMTX distant ;
- TLS média distant ;
- multi-instance ;
- charge réelle ;
- mesures CPU/RAM/latence réelles ;
- coupure réseau réelle.

## 11. Limites et problèmes rencontrés

Le premier essai a révélé deux problèmes de prototype, corrigés sans
affaiblir la sécurité :

1. le script source n’était pas appelé explicitement avec Bash ;
2. le relais devait s’authentifier aussi pour lire sa source RTSP locale ;
3. le path attendu devait être le même path HMAC que celui calculé par l’agent.

La configuration finale conserve un credential dédié, une validation de path et
des ports loopback.

## 12. Verdict

### READY WITH CONDITIONS

Le transport local `source synthétique → agent → MediaMTX` est fonctionnel et
le path RTSP de sortie est observable comme prêt. La validation navigateur
WHEP authentifiée et les réseaux réels restent à effectuer avant toute phase
8.3 ou déploiement.