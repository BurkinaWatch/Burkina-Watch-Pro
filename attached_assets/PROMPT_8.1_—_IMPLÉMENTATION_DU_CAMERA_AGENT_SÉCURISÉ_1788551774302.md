# PROMPT 8.1 — IMPLÉMENTATION DU CAMERA AGENT SÉCURISÉ

## CONTEXTE

BurkinaWatch dispose maintenant d’une architecture de surveillance vidéo séparant clairement :

- le **Control Plane** : BurkinaWatch / Express ;
- le **Media Plane** : MediaMTX / WebRTC ;
- les caméras IP des utilisateurs.

Le Prompt 8 a confirmé que les caméras situées derrière NAT/CGNAT nécessiteront un **Camera Agent local** capable de communiquer avec l’infrastructure BurkinaWatch par une connexion sortante sécurisée.

L’architecture cible est :

```text
┌──────────────────────────┐
│     CAMÉRA IP LOCALE     │
│      RTSP / ONVIF        │
└────────────┬─────────────┘
             │
             │ LAN
             ▼
┌──────────────────────────┐
│       CAMERA AGENT       │
│                          │
│ identité propre          │
│ authentification         │
│ reconnexion               │
│ heartbeat                 │
│ credentials protégés     │
└────────────┬─────────────┘
             │
             │ HTTPS/TLS OUTBOUND
             ▼
┌──────────────────────────┐
│ INFRASTRUCTURE BURKINAWATCH│
│                          │
│ Control Plane            │
│ Media Plane / MediaMTX   │
└────────────┬─────────────┘
             │
             │ WebRTC
             ▼
┌──────────────────────────┐
│ Navigateur / Application │
│      BurkinaWatch        │
└──────────────────────────┘
```

## OBJECTIF DE CETTE PHASE

Implémenter et sécuriser le **Camera Agent** ainsi que son protocole d’enrôlement et de communication avec BurkinaWatch.

Cette phase doit préparer l’architecture réelle pour les caméras derrière NAT/CGNAT.

### IMPORTANT

Cette phase n’est PAS une mise en production.

Ne déployez aucune infrastructure réelle chez des utilisateurs.

Ne demandez pas à l’utilisateur d’ouvrir le port RTSP 554 sur Internet.

Ne configurez aucune DMZ.

Ne désactivez aucun firewall.

N’utilisez pas UPnP pour ouvrir automatiquement des ports.

Ne rendez jamais une caméra directement accessible depuis Internet.

---

# 1. COMMENCER PAR UN AUDIT

Avant de modifier le code :

1. inspecter l’état réel du repository ;
2. lire les documents :

```text
docs/PHASE_8_AUDIT_INITIAL.md
docs/PHASE_8_ARCHITECTURE_PRODUCTION.md
```

3. inspecter :
   - backend Express ;
   - authentification ;
   - autorisations ;
   - modèle Camera ;
   - VideoGateway ;
   - MediaMTX ;
   - configuration Docker/Compose ;
   - gestion des secrets ;
   - chiffrement AES-256-GCM ;
   - migrations Drizzle ;
   - tests existants ;
   - variables d’environnement ;
   - logs ;
   - système d’audit.

4. rechercher toute implémentation existante liée à :

```text
camera
agent
stream
mediamtx
webrtc
rtsp
onvif
heartbeat
token
enrollment
device
gateway
```

### RÈGLE

Ne pas recréer une fonctionnalité déjà présente.

Réutiliser les abstractions existantes lorsqu’elles sont sécurisées.

Ne pas modifier inutilement le frontend existant.

Ne pas casser les fonctionnalités déjà fonctionnelles.

---

# 2. DÉFINIR CLAIREMENT LES RESPONSABILITÉS

Le Camera Agent doit être un composant spécialisé.

Il ne doit PAS devenir un serveur généraliste.

## Le Camera Agent PEUT :

- s’identifier auprès de BurkinaWatch ;
- maintenir une connexion sortante sécurisée ;
- recevoir uniquement les instructions nécessaires à son fonctionnement vidéo ;
- vérifier l’état des caméras qui lui sont explicitement associées ;
- établir/relaisser le flux caméra selon l’architecture MediaMTX retenue ;
- envoyer des heartbeats ;
- signaler son état ;
- se reconnecter automatiquement après une coupure ;
- être révoqué.

## Le Camera Agent NE DOIT PAS :

- fournir un shell distant ;
- exécuter des commandes arbitraires ;
- scanner le réseau local ;
- scanner Internet ;
- devenir un proxy général ;
- accéder directement à PostgreSQL ;
- recevoir les credentials PostgreSQL ;
- recevoir `MASTER_ENCRYPTION_KEY` ;
- recevoir `SESSION_SECRET` ;
- accéder aux comptes utilisateurs ;
- modifier les permissions ;
- accéder aux fichiers arbitraires du serveur ;
- exposer une API d’administration publique ;
- ouvrir automatiquement des ports entrants ;
- utiliser UPnP ;
- configurer une DMZ.

---

# 3. IDENTITÉ DISTINCTE

Créer une identité propre au Camera Agent.

Ne jamais utiliser simplement :

```text
cameraId
```

comme identité d’authentification.

Le modèle conceptuel doit être :

```text
User
  │
  └── Agent
        │
        ├── Camera A
        ├── Camera B
        └── Camera C
```

Un Agent possède au minimum :

```text
agentId
userId
status
createdAt
lastSeenAt
revokedAt
```

Ajouter d’autres champs uniquement s’ils sont réellement nécessaires.

---

# 4. ENRÔLEMENT SÉCURISÉ

Créer un mécanisme d’enrôlement contrôlé.

Le principe :

```text
Utilisateur authentifié
        ↓
BurkinaWatch génère un code/token temporaire
        ↓
Installation/configuration de l'Agent
        ↓
Agent présente le code
        ↓
BurkinaWatch vérifie le code
        ↓
Agent reçoit une identité permanente
        ↓
Code d'enrôlement invalidé
```

## Contraintes

Le code d’enrôlement doit être :

- temporaire ;
- à usage unique ;
- non réutilisable ;
- suffisamment aléatoire ;
- stocké de manière sécurisée ;
- associé à l’utilisateur qui l’a généré ;
- révocable ;
- journalisé sans exposer le secret.

Ne jamais stocker inutilement le secret d’enrôlement en clair.

Préférer un hash si compatible avec le protocole choisi.

---

# 5. AUTHENTIFICATION DE L’AGENT

Après l’enrôlement, l’Agent doit posséder une authentification propre.

Ne pas utiliser :

```text
SESSION_SECRET
MASTER_ENCRYPTION_KEY
REFRESH_TOKEN_SALT
```

comme credential d’Agent.

L’Agent doit disposer d’un credential dédié.

Étudier les options suivantes :

- token opaque long aléatoire stocké sous forme hashée ;
- clé publique/clé privée ;
- certificat client mTLS.

Choisir la solution la plus robuste et réaliste pour l’architecture actuelle.

Documenter le choix.

Si mTLS n’est pas encore réaliste dans l’infrastructure actuelle, ne pas faire semblant qu’il est implémenté.

Utiliser alors une authentification dédiée suffisamment robuste et documenter l’évolution future vers mTLS.

---

# 6. COMMUNICATION SORTANTE UNIQUEMENT

Le principe réseau fondamental est :

```text
Camera Agent
      │
      │ connexion SORTANTE TLS
      ▼
BurkinaWatch
```

et jamais :

```text
Internet
   │
   └──► Camera Agent
```

L’Agent ne doit pas nécessiter de port entrant public.

Il doit fonctionner derrière :

- NAT ;
- routeur domestique ;
- 4G ;
- 5G ;
- CGNAT.

---

# 7. TLS

Toute communication Agent ↔ Infrastructure doit utiliser TLS en production.

Ne jamais implémenter :

```text
http://
```

pour une communication de production contenant une authentification.

Le développement local peut éventuellement utiliser HTTP uniquement si cela est explicitement limité à `localhost` et clairement séparé de la configuration production.

Refuser les configurations de production qui désactivent la vérification TLS.

Ne jamais ajouter :

```text
rejectUnauthorized: false
```

dans le chemin production.

---

# 8. HEARTBEAT

Implémenter un mécanisme de heartbeat.

L’Agent doit périodiquement signaler :

```text
agentId
timestamp
version
status
```

Ne transmettre que les informations nécessaires.

Le serveur doit pouvoir déterminer :

```text
ONLINE
OFFLINE
STALE
REVOKED
```

Définir clairement les seuils.

Exemple conceptuel :

```text
ONLINE
↓ absence de heartbeat
STALE
↓ délai supplémentaire
OFFLINE
```

Les valeurs doivent être configurables et documentées.

---

# 9. RECONNEXION

L’Agent doit pouvoir se reconnecter automatiquement après :

- coupure Internet ;
- redémarrage du routeur ;
- redémarrage du processus ;
- redémarrage de MediaMTX ;
- interruption temporaire du serveur.

Utiliser une stratégie de reconnexion avec backoff.

Éviter une boucle agressive :

```text
connect
fail
connect
fail
connect
fail
```

Le backoff doit augmenter progressivement puis revenir à une fréquence normale après réussite.

---

# 10. RÉVOCATION

Depuis BurkinaWatch, un administrateur/utilisateur autorisé doit pouvoir révoquer un Agent.

Après révocation :

```text
Agent → serveur
```

doit être refusé.

L’Agent ne doit pas pouvoir se réinscrire automatiquement avec ses anciens credentials.

Une révocation doit être immédiate ou quasi immédiate selon le protocole.

Tester notamment :

```text
Agent ONLINE
↓
REVOCATION
↓
tentative de reconnexion
↓
REFUS
```

---

# 11. ASSOCIATION USER → AGENT → CAMERA

Une caméra ne doit jamais être simplement associée à un Agent par :

```text
cameraId
```

fourni arbitrairement par le client.

Le serveur doit vérifier :

```text
authenticated user
        ↓
owns agent
        ↓
agent owns/binds camera
```

Toute opération doit respecter cette chaîne.

Tester explicitement les cas :

```text
User A → Agent A → Camera A
User B → Agent B → Camera B
```

et vérifier que :

```text
User A ❌ Camera B
User A ❌ Agent B
Agent A ❌ Camera B
Agent B ❌ Camera A
```

---

# 12. CAMERA CREDENTIALS

Les credentials RTSP/ONVIF des caméras restent des secrets.

Ils ne doivent jamais être :

- retournés au frontend ;
- affichés dans les réponses API ;
- écrits dans les logs ;
- inclus dans les erreurs ;
- stockés en clair si le système doit les récupérer pour établir le flux.

Réutiliser le système AES-256-GCM existant si celui-ci est déjà validé.

Le Camera Agent ne doit recevoir que les credentials nécessaires.

Ne jamais transmettre :

```text
MASTER_ENCRYPTION_KEY
```

à l’Agent.

---

# 13. RTSP

Le RTSP doit rester local à l’environnement de la caméra lorsque cela est possible.

Architecture :

```text
Camera
  │
  │ RTSP local
  ▼
Camera Agent
```

et non :

```text
Camera
  │
  │ RTSP Internet
  ▼
BurkinaWatch
```

Ne jamais demander à l’utilisateur :

```text
ouvrir le port 554
```

sur Internet.

---

# 14. MEDIA PLANE

Maintenir strictement la séparation :

### Control Plane

Express :

- utilisateur ;
- permissions ;
- agents ;
- caméras ;
- bindings ;
- tokens ;
- audit ;
- configuration.

### Media Plane

MediaMTX :

- RTSP ;
- WebRTC/WHEP ;
- flux vidéo.

Express ne doit pas devenir un proxy vidéo.

---

# 15. COMMUNICATION AGENT → MEDIA INFRASTRUCTURE

Étudier précisément comment l’Agent doit alimenter MediaMTX.

Ne pas inventer une solution.

Vérifier la compatibilité réelle avec l’architecture MediaMTX existante.

Évaluer notamment :

```text
Agent
  ↓
RTSP push
```

ou une autre méthode supportée.

Choisir une méthode réellement compatible avec MediaMTX.

Documenter :

- protocole ;
- authentification ;
- ports ;
- TLS ;
- flux entrant/sortant ;
- comportement après reconnexion.

---

# 16. NE PAS IMPLÉMENTER TURN À L’AVEUGLE

Le Prompt 8 a constaté que :

```text
STUN : non testé
TURN : non installé
CGNAT : non testé
```

Cette phase ne doit pas prétendre résoudre cela artificiellement.

Préparer l’architecture pour STUN/TURN mais ne pas installer une infrastructure TURN de production sans justification technique.

Documenter précisément :

```text
ce qui est nécessaire
ce qui reste à tester
ce qui devra être décidé après test réel
```

---

# 17. BASE DE DONNÉES

Avant toute migration :

1. inspecter les migrations existantes ;
2. vérifier l’état réel de la base Railway ;
3. vérifier les tables et index existants ;
4. déterminer exactement les nouvelles tables nécessaires.

Ne pas exécuter :

```text
db:push
db:push --force
```

Ne jamais faire de reset.

Ne jamais supprimer une table existante pour résoudre un problème.

Si une migration est nécessaire :

- créer une migration dédiée ;
- SQL explicite ;
- non destructif ;
- revue avant exécution ;
- aucune migration automatique forcée.

Les tables potentielles peuvent inclure :

```text
camera_agents
agent_enrollments
agent_camera_bindings
```

mais **ne créez pas ces trois tables automatiquement si certaines informations peuvent être intégrées proprement dans les tables existantes**.

Décider à partir du schéma réel.

---

# 18. INDEXES

Si de nouvelles relations sont créées, vérifier les indexes nécessaires.

Au minimum examiner :

```text
agent user_id
agent status
agent last_seen_at
binding agent_id
binding camera_id
enrollment user_id
enrollment expires_at
```

Ne pas créer des indexes inutiles.

---

# 19. AUDIT LOG

Toutes les opérations sensibles doivent pouvoir être auditées :

```text
agent.created
agent.enrolled
agent.authenticated
agent.revoked
agent.reconnected
agent.camera_bound
agent.camera_unbound
agent.authentication_failed
```

Les logs doivent être utiles sans contenir :

- credentials ;
- tokens ;
- RTSP URLs complètes ;
- mots de passe ;
- secrets cryptographiques.

Réutiliser le système de redaction existant.

---

# 20. API

Créer uniquement les endpoints réellement nécessaires.

Exemples conceptuels :

```text
POST /api/camera-agents/enroll
POST /api/camera-agents/auth
POST /api/camera-agents/heartbeat
POST /api/camera-agents/revoke
GET  /api/camera-agents
POST /api/camera-agents/:id/bind-camera
DELETE /api/camera-agents/:id/bind-camera/:cameraId
```

Ces routes sont des exemples.

Adapter les noms au routing existant.

Ne pas créer d’API inutile.

Les endpoints Agent doivent avoir :

- authentification ;
- autorisation ;
- validation stricte ;
- rate limiting adapté ;
- journalisation ;
- contrôle d’ownership ;
- protection contre IDOR.

---

# 21. RATE LIMITING

Prévoir des limites pour :

- enrôlement ;
- authentification Agent ;
- heartbeat ;
- reconnexion ;
- opérations de binding.

Attention à ne pas rendre le heartbeat inutilisable.

Le rate limiting doit être différent selon le type d’opération.

---

# 22. SSRF

Le système doit continuer à utiliser le validateur SSRF existant.

Toute adresse caméra fournie par un utilisateur doit être validée.

Ne pas introduire de bypass du type :

```text
localhost
127.0.0.1
169.254.169.254
private IP
IPv6 loopback
DNS rebinding
```

Le fait qu’une adresse soit fournie par un Agent ne doit pas automatiquement la rendre fiable.

---

# 23. PROTECTION CONTRE LE DNS REBINDING

Si le système résout des hostname de caméra :

- vérifier la résolution ;
- contrôler les adresses résolues ;
- empêcher qu’un hostname autorisé pointe vers une adresse interdite ;
- éviter les TOCTOU évidents entre validation et connexion.

Documenter la stratégie.

---

# 24. SÉCURITÉ DU BINAIRE/PROCESSUS AGENT

L’Agent doit être conçu pour fonctionner avec le moins de privilèges possible.

Documenter :

- utilisateur système ;
- permissions fichiers ;
- répertoire de configuration ;
- stockage local des credentials ;
- accès réseau ;
- ports locaux éventuels.

Éviter :

```text
root
```

si ce n’est pas nécessaire.

Si une permission élevée est réellement nécessaire, la documenter et la minimiser.

---

# 25. CONFIGURATION LOCALE

Les secrets de l’Agent doivent être séparés de ceux du serveur.

Ne jamais copier automatiquement :

```text
.env production
```

dans l’Agent.

Prévoir une configuration dédiée.

Exemple conceptuel :

```text
BURKINAWATCH_AGENT_ID
BURKINAWATCH_AGENT_CREDENTIAL
BURKINAWATCH_CONTROL_URL
BURKINAWATCH_MEDIA_URL
```

Ne pas imposer exactement ces noms si une meilleure convention existe déjà.

---

# 26. VERSIONNEMENT DE L’AGENT

Prévoir une version :

```text
agentVersion
```

Le serveur doit pouvoir savoir quelle version est connectée.

Ne pas encore implémenter un système d’auto-update distant si cela n’est pas nécessaire.

Surtout, ne jamais implémenter :

```text
remote shell
download arbitrary binary
execute arbitrary command
```

---

# 27. ÉTATS

Définir clairement les états Agent :

```text
PENDING
ENROLLING
ONLINE
STALE
OFFLINE
REVOKED
ERROR
```

Ne pas confondre :

```text
Agent status
Camera status
Stream status
Viewer status
```

Ces états doivent rester conceptuellement séparés.

---

# 28. TESTS UNITAIRES

Créer des tests couvrant au minimum :

### Enrôlement

- code valide ;
- code expiré ;
- code déjà utilisé ;
- code révoqué ;
- mauvais code ;
- tentative répétée.

### Authentification

- credential valide ;
- credential invalide ;
- Agent révoqué ;
- Agent inexistant.

### Ownership

- Agent A / User A ;
- Agent B / User B ;
- accès croisé refusé.

### Camera binding

- binding autorisé ;
- binding non autorisé ;
- caméra d’un autre utilisateur refusée ;
- Agent d’un autre utilisateur refusé.

### Heartbeat

- heartbeat valide ;
- Agent inexistant ;
- Agent révoqué ;
- timestamp invalide ;
- payload malformé.

### Révocation

- Agent actif ;
- révocation ;
- tentative de reconnexion refusée.

---

# 29. TESTS DE SÉCURITÉ

Créer explicitement des tests contre :

```text
IDOR
authentication bypass
ownership bypass
token replay
enrollment replay
credential leakage
log leakage
malformed payload
rate-limit bypass
revoked-agent access
cross-user camera access
cross-agent camera access
```

Si possible, ajouter des tests de :

```text
DNS rebinding
private IP bypass
IPv6 SSRF
```

en réutilisant le système de test SSRF déjà présent.

---

# 30. TESTS DE RECONNEXION

Simuler :

```text
Agent ONLINE
↓
connexion coupée
↓
STALE
↓
OFFLINE
↓
Internet rétabli
↓
RECONNECT
↓
ONLINE
```

Tester également :

```text
MediaMTX redémarre
Agent reste actif
Agent doit récupérer le flux
```

---

# 31. TEST DE RÉVOCATION RÉELLE

Tester :

```text
Agent A
   ↓
ONLINE
   ↓
REVOKE
   ↓
connexion interrompue
   ↓
tentative de reconnexion
   ↓
REFUS
```

Le test doit démontrer que la révocation n’est pas simplement cosmétique dans l’interface.

---

# 32. TEST MULTI-AGENTS

Créer au minimum :

```text
User A
 └── Agent A
      └── Camera A

User B
 └── Agent B
      └── Camera B
```

Vérifier tous les croisements interdits.

---

# 33. TESTS DE BUILD

Après implémentation :

```text
npm run check
npm run build
npm test
git diff --check
```

Si le projet utilise d’autres scripts de sécurité, les exécuter également.

Corriger les régressions introduites par cette phase.

---

# 34. DOCUMENTATION

Créer ou mettre à jour :

```text
docs/PHASE_8_1_CAMERA_AGENT.md
```

Le document doit expliquer :

1. architecture ;
2. rôle de l’Agent ;
3. enrôlement ;
4. authentification ;
5. heartbeat ;
6. révocation ;
7. reconnexion ;
8. User → Agent → Camera ;
9. MediaMTX ;
10. sécurité réseau ;
11. TLS ;
12. secrets ;
13. NAT/CGNAT ;
14. limites actuelles ;
15. tests effectués ;
16. prochaines étapes.

Inclure un diagramme ASCII clair.

---

# 35. CE QUI EST STRICTEMENT INTERDIT

Ne pas :

- déployer en production ;
- exposer RTSP sur Internet ;
- ouvrir le port 554 publiquement ;
- utiliser DMZ ;
- désactiver firewall ;
- utiliser UPnP ;
- créer un scanner réseau ;
- créer un proxy réseau général ;
- créer un shell distant ;
- donner accès PostgreSQL à l’Agent ;
- transmettre `MASTER_ENCRYPTION_KEY` ;
- exposer les credentials caméra ;
- mettre des secrets dans Git ;
- mettre des secrets dans le frontend ;
- ajouter `rejectUnauthorized: false` en production ;
- exécuter `db:push --force` ;
- faire un reset DB ;
- supprimer des tables existantes ;
- déployer un TURN public sans test/justification ;
- implémenter de l’enregistrement vidéo ;
- implémenter de l’analyse IA ;
- implémenter du partage public de caméra.

---

# 36. RÈGLE DE NON-RÉGRESSION

Avant chaque modification importante :

1. comprendre le code existant ;
2. identifier les dépendances ;
3. modifier le minimum nécessaire ;
4. exécuter les tests concernés ;
5. vérifier que les fonctionnalités existantes fonctionnent toujours.

Ne pas réécrire massivement le backend.

Ne pas remplacer une architecture fonctionnelle simplement parce qu’une autre paraît plus élégante.

---

# 37. RAPPORT FINAL OBLIGATOIRE

À la fin, produire un rapport précis contenant :

## A. Fichiers créés

Liste exacte.

## B. Fichiers modifiés

Liste exacte.

## C. Base de données

Indiquer :

```text
migration créée : OUI/NON
migration exécutée : OUI/NON
db:push exécuté : OUI/NON
db:push --force exécuté : OUI/NON
reset effectué : OUI/NON
```

## D. Camera Agent

Indiquer ce qui est réellement implémenté :

```text
identité
enrôlement
authentification
heartbeat
révocation
reconnexion
camera binding
TLS
```

## E. Tests

Donner les résultats exacts :

```text
npm run check
npm run build
npm test
tests sécurité
tests Agent
tests ownership
tests révocation
tests reconnexion
```

## F. Ce qui n’a PAS été testé

Être totalement explicite concernant :

```text
vrai LAN
WAN
CGNAT réel
4G
5G
NAT symétrique
STUN
TURN
caméra physique
MediaMTX distant
coupure Internet réelle
multi-instance
charge réelle
```

## G. Risques restants

Lister les risques techniques non résolus.

## H. Verdict final

Le verdict doit être exactement l’un des trois suivants :

```text
READY FOR PHASE 8.2
```

ou

```text
READY WITH CONDITIONS
```

ou

```text
NOT READY
```

Ne pas déclarer `READY FOR PHASE 8.2` si des éléments critiques de sécurité ne sont pas réellement implémentés.

---

# 38. PHASE SUIVANTE

Ne pas commencer automatiquement la Phase 8.2.

Cette phase doit se terminer par un rapport.

Attendre ensuite une validation humaine avant de poursuivre.

## PRINCIPE FINAL

Le but n’est pas de produire beaucoup de code.

Le but est de construire un Camera Agent :

- minimal ;
- sécurisé ;
- révocable ;
- identifiable ;
- observable ;
- capable de fonctionner derrière NAT/CGNAT ;
- incapable de devenir un accès distant dangereux au réseau de l’utilisateur.

**La sécurité et l’architecture priment sur la vitesse d’implémentation.**