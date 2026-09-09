# Prompt 8 — Audit avant modification

Date de l’audit : 4 septembre 2026

## 1. État initial observé

### Control plane

- BurkinaWatch/Express gère l’authentification utilisateur, les caméras,
  l’ownership par `owner_id`, les tokens viewer et l’audit.
- Les credentials caméra sont chiffrés en AES-256-GCM.
- Les sessions viewer sont courtes, liées à l’utilisateur, à la caméra et au
  path MediaMTX.
- Les grants viewer et les paths enregistrés sont stockés en mémoire.
- Aucun modèle d’agent local, d’identité d’agent, d’enrôlement ou de
  révocation n’existe.

### Media plane

- MediaMTX 1.12.3 est séparé d’Express.
- Express configure les paths et MediaMTX sert RTSP/WebRTC.
- Le navigateur utilise WHEP/WebRTC.
- Express ne proxyfie pas le flux vidéo.
- Le chemin réel utilise une source RTSP contrôlée et un path HMAC opaque.

### Réseau

- Le prototype disponible est local.
- Aucune caméra physique ni réseau WAN/NAT/CGNAT n’est disponible pour test.
- Aucune preuve ne permet de conclure que STUN suffit.
- TURN n’est pas configuré.
- La caméra distante derrière CGNAT nécessite donc une architecture avec
  connexion sortante depuis un agent local.

### Production et infrastructure

- Le workflow actuel ne démarre que BurkinaWatch sur le port 5000.
- Le compose MediaMTX est un environnement de test séparé.
- Le compose publiait les ports RTSP 8554, API admin 9997 et WebRTC 8889 sur
  toutes les interfaces.
- `mediamtx/phase5.yml` écoutait l’API admin sur `0.0.0.0:9997`.
- Cette configuration est acceptable uniquement comme prototype local contrôlé,
  mais elle ne satisfait pas la règle Prompt 8 d’inaccessibilité publique de
  l’API admin.
- Aucun déploiement MediaMTX Railway, DNS média ou serveur TURN n’est prouvé.

### Sécurité et tests

- SSRF, ownership, IDOR caméra directe, tokens viewer, redaction et rate
  limiting sont couverts par les phases précédentes.
- 52 tests backend passaient après le Prompt 7.
- Les tests NAT/CGNAT, coupure réseau, redémarrage, charge contrôlée et
  multi-instance n’existent pas.
- Aucun test d’identité/enrôlement/révocation d’agent n’existe.

## 2. Gaps bloquants Prompt 8

1. API admin MediaMTX exposable par la configuration de test.
2. Pas d’agent local pour les caméras derrière NAT/CGNAT.
3. Pas d’identité d’agent distincte du `cameraId`.
4. Pas d’enrôlement temporaire, rotation ou révocation d’agent.
5. État des paths et grants non persistant, donc mono-instance.
6. Pas de preuve STUN/TURN, NAT/CGNAT ou WebRTC distant.
7. Pas de métriques opérationnelles partagées.

## 3. Décision avant modification

L’agent local est nécessaire pour l’objectif WAN/CGNAT, mais un agent média
complet ne doit pas être déployé sans environnement réseau réel et sans
infrastructure média privée.

La phase peut donc préparer :

- le modèle d’identité et d’enrôlement réversible ;
- les frontières agent/utilisateur/caméra ;
- le protocole sortant minimal et documenté ;
- le durcissement du compose MediaMTX ;
- les tests de non-régression et de sécurité.

Elle ne doit pas :

- exposer RTSP publiquement ;
- ouvrir une API MediaMTX admin publique ;
- implémenter un tunnel réseau général ;
- déployer TURN ou une nouvelle infrastructure payante ;
- appliquer une migration à Railway.

## 4. Verdict avant modification

### NOT READY FOR PHASE 9

La base Prompt 7 est exploitable pour une préproduction locale contrôlée,
mais les bloqueurs ci-dessus doivent être traités et documentés avant toute
progression vers une phase de production distante.
