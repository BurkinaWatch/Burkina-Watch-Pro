# Phase 9 — Réseau WebRTC

Date : 4 septembre 2026  
Statut : **NOT TESTED — réseau distant requis**

## Politique actuelle

Le projet n’impose pas STUN ou TURN par défaut. Cette décision est
intentionnelle : il faut observer les candidats ICE et le comportement réel
avant d’ajouter un relais TURN.

## Preuves disponibles

- Le lecteur frontend utilise WHEP/WebRTC avec un token viewer temporaire.
- Le prototype MediaMTX local expose ses ports sur loopback.
- Aucun test WAN/CGNAT n’a été exécuté dans cet environnement.
- Aucun candidat ICE, temps de connexion, chemin direct ou relay TURN n’a été
  capturé.

## Test requis

Depuis un navigateur desktop moderne sur un réseau différent du serveur :

1. relever le type de candidat ICE ;
2. mesurer le temps jusqu’à la première image ;
3. vérifier la stabilité pendant plusieurs minutes ;
4. couper puis restaurer le réseau de l’agent ;
5. répéter derrière réseau mobile/hotspot si possible ;
6. classer le résultat `DIRECT`, `STUN` ou `TURN`.

Jusqu’à cette mesure, toute affirmation de compatibilité CGNAT est
**BLOCKED**.