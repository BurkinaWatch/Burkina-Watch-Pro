# Phase 9.1 — WAN et CGNAT

Date : 4 septembre 2026  
Statut : **NOT TESTED — BLOCKED faute de réseau distant et caméra physique**

## Ce qui a été vérifié

- Le design utilise une connexion sortante du Camera Agent.
- Le prototype local reste lié à loopback.
- Aucun port RTSP entrant, DMZ, UPnP ou firewall désactivé n’a été demandé.
- Le transport local retenu est RTSP publish TCP.

## Ce qui n’a pas été vérifié

- réseau mobile, hotspot ou résidence distincte ;
- présence d’un CGNAT ;
- IPv4/IPv6 publique ;
- comportement NAT entrant/sortant ;
- chemin média complet ;
- nécessité de STUN ou TURN ;
- stabilité et reconnexion sur WAN.

## Procédure préproduction obligatoire

Utiliser une caméra de test et un Camera Agent derrière un réseau réellement
distinct. Documenter le type de réseau, l’IP publique éventuelle, l’absence
de port forwarding RTSP, les heartbeats, la publication, les candidats ICE et
la réception d’images dans un navigateur authentifié.

Tant que cette procédure n’est pas exécutée, le projet ne peut pas déclarer
le réseau compatible CGNAT.