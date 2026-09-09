# Phase 9 — Décision d’infrastructure

Date : 4 septembre 2026  
Statut : **READY WITH CONDITIONS**

## Décisions retenues

- PostgreSQL Railway reste la base de référence.
- BurkinaWatch/Express est le control plane.
- MediaMTX reste indépendant et constitue le media plane.
- Le Camera Agent établit une connexion sortante ; aucun port RTSP entrant
  n’est requis pour le modèle NAT/CGNAT.
- Le transport de publication retenu pour la phase 8.2 est RTSP sur TCP.
- Le navigateur reçoit le flux par WHEP/WebRTC.
- Aucun port RTSP 554 public, DMZ, UPnP ou désactivation firewall ne doit être
  utilisé.

## État de preuve

**VERIFIED**

- Le prototype local phase 8.2 a démontré source synthétique → relay agent →
  RTSP publish TCP → MediaMTX → lecture FFprobe.
- La configuration actuelle lie les ports du prototype à loopback.
- Le control plane contient les contrôles d’ownership, binding et session média.

**NOT TESTED**

- caméra IP physique ;
- réseau mobile ou résidentiel distinct ;
- CGNAT ;
- navigateur distant recevant une image vidéo réelle ;
- TURN.

## Conditions avant promotion

La promotion est bloquée jusqu’à la preuve d’une chaîne distante complète et
à la validation de la baseline PostgreSQL Railway. Aucun changement
d’infrastructure de production n’est autorisé dans cette phase.