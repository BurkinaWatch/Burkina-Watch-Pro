# Phase 9 — Dépannage

## Agent non connecté

Vérifier l’URL HTTPS du control plane, le credential agent, le heartbeat et
le statut enregistré. Ne pas remplacer le credential par un secret de session
ou une clé maître.

## Publication refusée

Vérifier, dans cet ordre :

1. agent non révoqué ;
2. binding actif ;
3. caméra appartenant au même propriétaire ;
4. session média non expirée/révoquée ;
5. path opaque correspondant ;
6. credential média correspondant.

Un bearer d’administration MediaMTX ne doit pas être utilisé pour contourner
ces contrôles.

## Viewer hors ligne

Distinguer un refus d’accès d’une absence de média. Vérifier le grant viewer,
le path enregistré, l’état MediaMTX et la disponibilité WHEP. Un HTTP 200 ou
une session WebRTC créée ne prouve pas la réception d’images.

## Réseau distant

Ne pas ouvrir le port RTSP pour dépanner. Relever plutôt les candidats ICE,
le chemin direct/STUN/TURN et les journaux du Camera Agent et de MediaMTX.