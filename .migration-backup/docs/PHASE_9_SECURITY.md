# Phase 9 — Sécurité

## Contrôles vérifiés

- Authentification requise sur les routes de contrôle.
- Ownership appliqué côté serveur.
- Credentials caméra chiffrés en AES-256-GCM.
- Credentials et URLs sensibles absents des DTO publics.
- SSRF appliqué aux sources RTSP.
- Enrollment agent à usage unique et credential agent stocké hashé.
- Binding agent/caméra vérifié avant création de session média.
- Session média courte, scoped et révocable.
- Path média opaque.
- Grant viewer court, scoped et révocable.
- Le bearer d’administration du gateway ne contourne pas la publication agent.

## Contrôles non testés de bout en bout

- callback HTTP MediaMTX avec base de données réelle ;
- agent révoqué et caméra supprimée sur environnement intégré ;
- navigateur distant avec token viewer ;
- IDOR de chaque ressource sur instance déployée ;
- WAN, CGNAT et TURN.

## Interdictions maintenues

Ne pas ouvrir RTSP sur Internet, ne pas utiliser DMZ/UPnP, ne pas désactiver le
firewall et ne pas afficher de valeur de secret dans un rapport.