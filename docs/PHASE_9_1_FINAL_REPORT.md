# Phase 9.1 — Rapport final

Date : 4 septembre 2026

## 1. Objectif

Lever les quatre conditions de la Phase 9 sans modifier la production :
preflight Railway, validation WAN/CGNAT, documentation et test média
end-to-end.

## 2. Résultat synthétique

| Domaine | Résultat |
|---|---|
| Railway preflight lecture seule | **VERIFIED — PASS** |
| Snapshot et baseline Drizzle | **BLOCKED — non validés** |
| WAN distant | **NOT TESTED** |
| CGNAT | **NOT TESTED** |
| STUN/TURN | **NOT TESTED** |
| Caméra physique | **NOT TESTED** |
| Vidéo réelle dans navigateur | **NOT TESTED** |
| Contrôles automatisés locaux | **VERIFIED** |
| Build et workflow local | **VERIFIED** |

## 3. Railway

Le preflight a observé les 29 tables attendues, l’absence du journal
`__drizzle_migrations`, l’absence des neuf index 0004, un `online_sessions.id`
text sans default et des compteurs sans anomalie signalée par le script.
Aucune écriture n’a été exécutée.

La base n’est pas prête pour une migration : snapshot restaurable et
baseline Drizzle manquants.

## 4. Média et sécurité

Les contrôles de code validés localement incluent ownership, SSRF, chiffrement,
bindings agent/caméra, sessions média scoped, paths opaques et grants viewer
temporaires. Le bearer d’administration MediaMTX ne contourne pas la
publication agent.

La suite d’intégration HTTP complète du callback MediaMTX reste à réaliser ;
elle fait l’objet du suivi proposé séparément.

## 5. Réseau et WebRTC

Aucune preuve réelle WAN, CGNAT, STUN, TURN ou navigateur distant n’est
disponible. La chaîne physique caméra → agent → gateway → WHEP → navigateur
reste **BLOCKED** comme critère de promotion.

## 6. Documentation

Les rapports Phase 9 et Phase 9.1 sont désormais présents et classent chaque
affirmation selon la preuve disponible. Ils ne déclarent ni compatibilité CGNAT
ni readiness production sans test réel.

## 7. Actions restantes

1. Valider humainement un snapshot Railway et une baseline Drizzle.
2. Réaliser le test distant avec caméra physique et agent sortant.
3. Capturer le chemin ICE et la réception effective d’images.
4. Exécuter les scénarios de coupure, reconnexion, tokens et IDOR en
   environnement contrôlé.
5. Compléter les tests d’intégration du callback MediaMTX.

## 8. Verdict

**NOT READY**

Les blocages sont la baseline/snapshot Railway non validés et l’absence de
preuve WAN/CGNAT et vidéo réelle dans un navigateur. Aucune modification de
production n’a été effectuée.