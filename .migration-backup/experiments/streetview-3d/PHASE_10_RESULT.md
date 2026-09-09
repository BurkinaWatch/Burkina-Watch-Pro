# Phase 10 — Industrialisation contrôlée du pipeline Street View 3D

## Verdict

```text
NO-GO — industrialisation 3D suspendue
```

La Phase 9 est explicitement `NO-GO`. Conformément au protocole, aucune
industrialisation de COLMAP, SfM, MVS ou 3DGS n'a été effectuée.

La Phase 10 s'arrête donc après l'audit de décision. Le socle de contribution,
de stockage et de préparation asynchrone existant est conservé ; il ne doit
pas être présenté comme un pipeline de reconstruction 3D validé.

## 1. Architecture finale observée

L'architecture effectivement disponible est une architecture de préparation
de contribution :

```text
Utilisateur authentifié
        ↓
API BurkinaWatch
        ↓
upload vidéo contrôlé
        ↓
filesystem local en développement
ou stockage S3-compatible en production
        ↓
streetview_contributions
        ↓
streetview_processing_jobs
        ↓
worker Street View isolé
        ↓
validation de l'objet et de ses métadonnées
        ↓
WAITING_FOR_3D
```

Le chemin réel s'arrête avant :

```text
COLMAP → SfM → MVS → GPU worker → 3DGS → QUALITY_CHECK
```

Cette limite est intentionnelle et conforme au verdict Phase 9.

## 2. Composants modifiés

```text
Aucun.
```

Les composants applicatifs, routes, migrations, schémas, workers et workflows
existants n'ont pas été modifiés pendant cette Phase 10.

## 3. Composants créés

```text
experiments/streetview-3d/PHASE_10_RESULT.md
```

Aucun worker GPU, adaptateur COLMAP, module MVS, intégration 3DGS, viewer ou
nouvelle migration n'a été créé.

Les documents d'architecture opérationnelle demandés par une Phase 10
réussie sont volontairement différés : les contrats de calcul et les métriques
GPU ne sont pas validés par la Phase 9.

## 4. Jobs réellement disponibles

Le schéma actuel contient un job de préparation :

```text
PREPARE_CONTRIBUTION
```

Le job est lié à une contribution par `contribution_id` et possède notamment :

- `id` ;
- `type` ;
- `status` ;
- `progress` ;
- `attempts` ;
- `max_attempts` ;
- `available_at` ;
- `started_at` ;
- `completed_at` ;
- `locked_at` ;
- `lease_until` ;
- `locked_by` ;
- `error_code` ;
- `error_message` ;
- `created_at` ;
- `updated_at`.

Les jobs dédiés suivants ne sont pas encore implémentés :

```text
VIDEO_VALIDATE
FRAME_EXTRACTION
SFM_RECONSTRUCTION
MVS_RECONSTRUCTION
GAUSSIAN_SPLATTING
QUALITY_CHECK
```

Il serait incorrect de les ajouter à la production avant d'avoir un moteur
réel validé et un contrat d'artefacts mesuré.

## 5. Machine à états

### États actuellement déclarés pour les contributions

```text
DRAFT
UPLOADING
UPLOADED
VALIDATING
QUEUED
PROCESSING
WAITING_FOR_3D
UPLOAD_FAILED
VALIDATION_FAILED
PROCESSING_FAILED
```

### États actuellement déclarés pour les jobs

```text
QUEUED
PROCESSING
COMPLETED
FAILED
```

### État terminal actuel du worker

Le worker valide l'objet stocké, extrait les métadonnées disponibles et
termine avec :

```text
WAITING_FOR_3D
```

Cela signifie « préparation terminée, reconstruction 3D non exécutée », et
non « scène 3D prête ».

### États futurs non implémentés

Les états suivants restent une proposition d'architecture et ne doivent pas
être ajoutés par simple anticipation :

```text
QUEUED_PREPROCESSING
PREPROCESSING
QUEUED_SFM
SFM_PROCESSING
SFM_COMPLETED
QUEUED_MVS
MVS_PROCESSING
MVS_COMPLETED
QUEUED_3DGS
3DGS_PROCESSING
3DGS_COMPLETED
QUALITY_CHECK
READY_FOR_PUBLICATION
PUBLISHED
RETRY_PENDING
CANCELLED
```

## 6. Stockage

Le stockage binaire est séparé de PostgreSQL.

### Stockage applicatif actuel

- filesystem pour le développement ;
- S3-compatible pour la production ;
- multipart presigné en mode S3 ;
- URLs de téléchargement présignées ;
- TTL configurable ;
- stockage de production filesystem interdit sans volume durable explicite.

### Clés actuellement générées

Les sources et miniatures sont liées à l'identifiant de contribution. La
validation refuse les segments vides, `.` et `..`, les séparateurs inverses et
les chemins qui sortent de la racine locale.

### Artefacts 3D

Les préfixes futurs peuvent rester conceptuellement séparés par contribution :

```text
streetview/{contributionId}/original/
streetview/{contributionId}/frames/
streetview/{contributionId}/sfm/
streetview/{contributionId}/mvs/
streetview/{contributionId}/3dgs/
streetview/{contributionId}/preview/
streetview/{contributionId}/logs/
```

Ils ne sont pas encore activés, car les étapes qui les produiraient n'ont pas
été validées.

## 7. Sécurité observée

Les garde-fous existants comprennent notamment :

- routes de contribution protégées par authentification ;
- validation du type MIME autorisé ;
- validation de la taille ;
- validation de l'en-tête de conteneur vidéo ;
- clés de stockage liées à la contribution ;
- contrôle contre le path traversal ;
- séparation du stockage privé ;
- multipart S3 presigné ;
- URLs de lecture temporaires ;
- messages d'erreur publics distincts des détails techniques ;
- absence de secrets dans le rapport expérimental.

Le worker GPU futur devra recevoir des artefacts de travail limités et ne devra
pas avoir accès aux secrets, à PostgreSQL de production ou au stockage
applicatif complet.

## 8. Retry et idempotence

Le socle actuel comprend :

- queue PostgreSQL durable ;
- claim des jobs ;
- lease expirables ;
- récupération des jobs abandonnés ;
- identifiant de worker ;
- nombre maximal de tentatives ;
- backoff exponentiel borné ;
- distinction entre erreurs temporaires et permanentes ;
- traitement idempotent lorsqu'une contribution est déjà à
  `WAITING_FOR_3D` avec `processedAt`.

Ces garanties couvrent la préparation actuelle. Elles ne valident pas encore
la reprise partielle d'un SfM, d'un MVS ou d'un entraînement 3DGS.

## 9. Worker CPU

Le worker existant est un worker de préparation vidéo :

- il récupère un job ;
- récupère la contribution ;
- vérifie l'objet stocké ;
- valide le conteneur et le MIME ;
- conserve la taille, l'ETag et les métadonnées disponibles ;
- met à jour la progression ;
- termine en `WAITING_FOR_3D`.

Il n'exécute pas actuellement :

- FFmpeg de production pour l'extraction des frames ;
- COLMAP ;
- SfM ;
- MVS ;
- préparation d'un dataset GPU ;
- publication d'un artefact 3D.

## 10. Worker GPU

```text
Non créé.
```

Cette absence est obligatoire tant que la Phase 9 n'a pas démontré :

- un environnement GPU reproductible ;
- un résultat SfM exploitable ;
- un contrat MVS mesuré ;
- une implémentation 3DGS compatible ;
- des métriques de temps, mémoire, stockage et qualité.

Railway/API ne doit pas être transformé en worker GPU par défaut.

## 11. Observabilité

L'observabilité actuelle couvre principalement :

- progression du job ;
- timestamps ;
- tentatives ;
- worker propriétaire ;
- lease ;
- codes d'erreur ;
- message technique limité ;
- logs de démarrage, réussite, retry et échec.

Les métriques suivantes n'existent pas encore pour une reconstruction :

- version COLMAP ;
- version 3DGS ;
- nombre de frames ;
- images alignées ;
- points sparse ;
- erreur de reprojection ;
- densité MVS ;
- nombre de primitives ;
- VRAM ;
- temps GPU ;
- taille des artefacts intermédiaires ;
- score de qualité.

## 12. Tests réalisés

Pendant cette phase de contrôle :

- audit du rapport Phase 9 ;
- audit des artefacts synthétiques ;
- audit des migrations Street View ;
- audit des statuts et du worker ;
- vérification `npm run check` ;
- vérification `git diff --check`.

Les tests de reconstruction ne peuvent pas être déclarés réussis, car aucun
moteur de reconstruction n'a été exécuté.

Les tests d'end-to-end GPU, de reprise GPU et de charge contrôlée restent
bloqués par la décision Phase 9.

## 13. Test end-to-end

```text
NON EXÉCUTÉ
```

Le seul chemin démontré est :

```text
vidéo stockée
→ validation
→ job de préparation
→ métadonnées vérifiées
→ WAITING_FOR_3D
```

Le chemin suivant n'est pas démontré :

```text
upload
→ CPU
→ SfM
→ MVS
→ GPU
→ 3DGS
→ quality check
→ artefact final
```

## 14. Test de reprise

### Préparation actuelle

La queue possède les mécanismes nécessaires à la récupération des jobs
abandonnés : lease, worker ID et récupération après expiration.

### Reconstruction 3D

```text
NON EXÉCUTÉ
```

Il n'existe aucun test réel d'arrêt/redémarrage pendant COLMAP, MVS ou 3DGS.
Une reprise au milieu d'une reconstruction ne doit pas être supposée
idempotente avant la définition de checkpoints et d'artefacts atomiques.

## 15. Coût estimatif

```text
Non déterminé.
```

La Phase 9 n'a lancé aucune instance GPU. Il n'existe donc pas de mesure
réelle du coût par reconstruction, du temps GPU, du stockage temporaire ou du
nombre de jobs simultanés.

Toute estimation prématurée serait une hypothèse non vérifiée.

## 16. Risques restants

- la faisabilité réelle de SfM n'est pas mesurée ;
- la qualité de MVS n'est pas mesurée ;
- aucune implémentation 3DGS n'est validée ;
- la consommation VRAM est inconnue ;
- les contrats d'artefacts ne sont pas stabilisés ;
- les checkpoints de reconstruction ne sont pas définis ;
- les erreurs GPU ne sont pas classifiées ;
- le coût par scène n'est pas connu ;
- la capacité de concurrence n'est pas connue ;
- une vidéo synthétique ne représente pas une vidéo de rue réelle ;
- aucun géoréférencement précis n'est démontré ;
- aucune scène ne peut être publiée automatiquement.

## 17. Impact production

```text
Aucun impact applicatif introduit par cette Phase 10.
```

Vérifications :

- frontend intact ;
- API intacte ;
- authentification intacte ;
- fonctionnalités Signalements, SOS et carte intactes ;
- PostgreSQL intact ;
- aucune migration exécutée ;
- stockage existant intact ;
- déploiement Railway intact ;
- aucun secret ou credential ajouté ;
- aucun worker GPU permanent lancé ;
- aucun viewer public créé.

## 18. Recommandation Phase 11

La Phase 11 ne doit pas commencer automatiquement.

Avant toute nouvelle industrialisation, il faut :

1. sélectionner et valider humainement une instance GPU temporaire ;
2. exécuter le premier test Phase 9 sur les frames synthétiques ;
3. obtenir une classification SfM objective ;
4. exécuter MVS seulement si le SfM est exploitable ;
5. sélectionner et valider une implémentation 3DGS ;
6. mesurer les ressources et la qualité ;
7. définir les contrats d'artefacts ;
8. revenir ensuite à une proposition d'industrialisation minimale et réversible.

Tant que ces conditions ne sont pas réunies, `WAITING_FOR_3D` doit rester la
limite explicite du traitement applicatif.