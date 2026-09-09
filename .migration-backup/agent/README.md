# BurkinaWatch Camera Agent

Ce répertoire contient le client minimal du Camera Agent. Il ne constitue pas
encore un package déployable chez un utilisateur.

## Responsabilité actuelle

Le client sait :

- présenter un code d’enrôlement à usage unique ;
- conserver le credential dédié en mémoire ;
- envoyer un heartbeat sortant vers BurkinaWatch ;
- appliquer un backoff progressif après une coupure ;
- refuser HTTP hors localhost en développement ;
- exiger HTTPS en production.

Il ne sait volontairement pas encore :

- scanner le LAN ;
- exécuter des commandes ;
- ouvrir un port entrant ;
- accéder à PostgreSQL ;
- recevoir une clé serveur ;
- relayer le flux vidéo vers MediaMTX.

Le transport média `RTSP local → infrastructure MediaMTX` sera ajouté
uniquement après un test contrôlé de compatibilité MediaMTX et un réseau
NAT/CGNAT réel.

## Configuration

Le binaire final devra utiliser un stockage de secrets du système d’exploitation
ou un gestionnaire dédié pour le credential. Il ne faut pas copier le `.env`
du serveur dans l’agent.

Configuration conceptuelle :

```text
BURKINAWATCH_CONTROL_URL=https://control.example
BURKINAWATCH_AGENT_ID=<identité locale>
BURKINAWATCH_AGENT_CREDENTIAL=<credential dédié>
BURKINAWATCH_AGENT_VERSION=<version>
```

Le credential n’est jamais le `SESSION_SECRET`, le
`MASTER_ENCRYPTION_KEY` ou le `REFRESH_TOKEN_SALT`.

## Sécurité processus

Le futur packaging doit fonctionner avec un utilisateur système sans privilège,
un répertoire de configuration privé et aucune API locale d’administration.