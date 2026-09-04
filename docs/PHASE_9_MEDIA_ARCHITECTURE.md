# Phase 9 — Architecture média

Date de constat : 4 septembre 2026  
Statut : **VERIFIED pour l’architecture contrôlée, NOT TESTED pour le réseau réel**

## Séparation des responsabilités

```text
BurkinaWatch / Express
  control plane : identité, ownership, agents, bindings, sessions média,
                 tokens viewer et audit

Camera Agent
  composant sortant : authentification control plane, heartbeat,
                      demande d’une session média, relais RTSP local

MediaMTX
  media plane : réception RTSP publish, état du path, WHEP/WebRTC

Navigateur
  viewer authentifié : grant temporaire puis connexion WHEP directe
```

Express ne transporte pas les frames vidéo. Les credentials caméra restent
chiffrés au repos et ne sont pas envoyés au frontend. Les paths réels sont
opaques et dérivés de l’identité agent/caméra/stream.

## Autorisation de publication

Une publication réelle doit posséder simultanément :

- un agent authentifié et non révoqué ;
- un binding actif pour la caméra ;
- une session média courte, scoped à agent + caméra + stream ;
- le path opaque attendu ;
- le credential média correspondant.

Le bearer d’administration du gateway ne constitue pas un credential de
publication. Les lectures WebRTC utilisent un grant viewer temporaire,
scoped à l’utilisateur, la caméra et le path.

## Limites connues

- Les grants viewer et les paths enregistrés restent en mémoire.
- Le lanceur `agent/runMediaRelay.ts` reste un prototype local ; il ne
  constitue pas encore un packaging de production.
- La topologie WAN, le comportement CGNAT et le choix STUN/TURN sont
  **NOT TESTED**.