# Phase 9 — Déploiement

## Règles

- Le live réel reste désactivé par défaut en production.
- Les migrations 0004 à 0007 restent préparatoires et non appliquées.
- `db:push` est bloqué par conception.
- Les secrets sont fournis par le gestionnaire de secrets et ne sont jamais
  écrits dans les logs ou les rapports.
- MediaMTX ne doit pas être remplacé par un proxy de frames Express.
- Les ports RTSP, API MediaMTX et WHEP ne doivent pas être exposés sans une
  topologie privée, TLS et authentification adaptées.

## État vérifié

Le workflow local `npm run dev` démarre sur le port 5000. `npm run build`
réussit. Le déploiement Railway, son healthcheck, son domaine et ses derniers
logs n’ont pas été audités par une API Railway dans cette phase :
**NOT VERIFIED**.

## Blocage

La présence d’un snapshot restaurable et d’une baseline Drizzle doit être
confirmée avant toute application de migration. La chaîne WAN/WebRTC réelle
doit également être testée hors production.