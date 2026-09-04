# Phase 9.1 — Test média end-to-end

Date : 4 septembre 2026  
Statut : **NOT TESTED — BLOCKED pour la vidéo réelle**

## Preuves locales existantes

La preuve phase 8.2 couvre une source FFmpeg synthétique, le relay agent,
RTSP publish TCP, MediaMTX et une lecture FFprobe du média. Elle ne couvre
pas une caméra IP physique ni un navigateur WHEP recevant réellement une
image.

Les tests automatisés et contrôles exécutés pour cette reprise sont :

- `npm run check` : réussi ;
- `node --import tsx --test server/__tests__/*.test.ts` : 64 tests réussis ;
- `npm run build` : réussi ;
- `git diff --check` : réussi.

`npm test` ne peut pas être exécuté : aucun script `test` n’est défini dans
`package.json`.

## Non testé

- caméra IP réelle ;
- agent distant derrière NAT/CGNAT ;
- chaîne agent → MediaMTX distant ;
- navigateur desktop authentifié recevant des frames ;
- mesures de première image, latence, stabilité, CPU et réseau ;
- coupures caméra, agent et gateway ;
- multi-caméras et multi-viewers sur réseau réel ;
- client mobile.

## Critère de preuve

Un statut HTTP 200, un path `ready` ou la création d’une session WebRTC ne
suffit pas. Le test doit capturer la réception effective d’images vidéo dans
un navigateur autorisé.