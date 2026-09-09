# Phase 13 — Validation du laboratoire GPU et premier test COLMAP

## Verdict final

```text
NO-GO
```

La validation technique n'a pas pu commencer, car aucun laboratoire GPU cloud
n'a été provisionné.

Ce verdict reflète uniquement les faits observés :

- aucune instance NVIDIA réelle ;
- aucun fournisseur GPU choisi ;
- aucun prix actuel vérifié ;
- aucun credential de provisioning disponible ;
- aucun accès SSH ou terminal GPU ;
- aucune exécution CUDA ;
- aucun PyTorch CUDA ;
- aucun COLMAP ;
- aucune reconstruction SfM.

Le pipeline BurkinaWatch reste volontairement limité à :

```text
validation vidéo → préparation → WAITING_FOR_3D
```

## 1. Objectif

L'objectif de cette phase était de préparer et, si les moyens d'accès le
permettaient, lancer un laboratoire GPU cloud temporaire afin de valider :

```text
GPU → CUDA → PyTorch CUDA → COLMAP/SfM
```

La phase devait s'arrêter après un premier test SfM réussi ou échoué. MVS et
3DGS ne devaient pas être lancés automatiquement.

## 2. Fournisseur choisi

```text
Aucun.
```

La comparaison des fournisseurs et des tarifs actuels n'a pas pu être
confirmée par une source publique accessible dans cet environnement. Aucun
fournisseur n'est donc déclaré disponible et aucun choix n'est simulé.

Avant toute dépense, le propriétaire devra vérifier directement auprès de
plusieurs fournisseurs :

- disponibilité d'un GPU NVIDIA ;
- environ 24 Go de VRAM comme cible initiale ;
- CPU, RAM et stockage ;
- tarif horaire et minimum de facturation ;
- accès SSH ou terminal ;
- Docker ;
- compatibilité CUDA et PyTorch ;
- installation de COLMAP ;
- transfert des artefacts ;
- destruction immédiate de l'instance ;
- risques de facturation résiduelle.

## 3. GPU

```text
Non provisionné.
```

Profil recommandé pour le premier test :

- GPU NVIDIA ;
- environ 24 Go de VRAM ;
- Linux ;
- terminal ou SSH ;
- Docker facultatif mais préférable ;
- instance temporaire supprimable immédiatement.

Un GPU d'environ 16 Go pourra être évalué plus tard si un test minimal montre
qu'il suffit. Aucun GPU plus puissant ne doit être loué sans mesure justifiant
ce besoin.

## 4. VRAM

```text
Non mesurée.
```

La cible d'environ 24 Go est une recommandation de préparation et non une
exigence scientifiquement démontrée.

## 5. Prix

```text
Non vérifié.
```

Aucun prix n'est inventé. Aucun coût maximal réel ne peut être annoncé tant
qu'un fournisseur, une région, une classe GPU, un stockage et une durée ne
sont pas sélectionnés.

Le propriétaire doit fixer avant lancement :

```text
GPU cible              : environ 24 Go VRAM
Durée maximale         : test court uniquement
Plafond de dépense     : à confirmer humainement
Arrêt automatique      : obligatoire
Stockage               : temporaire et minimal
```

## 6. Durée

```text
Non mesurée.
```

Les temps de démarrage, d'installation, de vérification GPU et de test COLMAP
n'ont pas été observés.

## 7. Coût réel

```text
0 coût engagé dans cette phase.
```

Aucune instance payante n'a été lancée. Il n'existe donc aucun coût de GPU,
de stockage, de transfert ou de CPU à rapporter.

## 8. OS

### Workspace actuel

- Linux x64 ;
- environnement Replit ;
- Node.js `v20.20.0` ;
- Python `3.13.11` ;
- FFmpeg `6.1.2` ;
- FFprobe `6.1.2`.

### Laboratoire GPU

```text
Non provisionné.
```

L'OS et le kernel du laboratoire devront être consignés après création réelle
de l'instance.

## 9. Driver NVIDIA

```text
Non disponible.
```

`nvidia-smi` est absent du workspace actuel. Aucun driver NVIDIA n'a été
inspecté.

## 10. CUDA

```text
Non disponible.
```

Aucun runtime CUDA n'est accessible dans l'environnement actuel.

## 11. Python

Version locale :

```text
Python 3.13.11
```

Cette version ne doit pas être imposée au futur laboratoire sans vérifier sa
compatibilité avec la version CUDA, PyTorch, COLMAP et l'implémentation 3DGS
retenue.

## 12. PyTorch

```text
PyTorch CUDA non disponible.
```

Aucun calcul CUDA depuis Python n'a été réalisé.

## 13. FFmpeg

Disponible localement :

```text
FFmpeg 6.1.2
FFprobe 6.1.2
```

Le prétraitement synthétique des phases précédentes a fonctionné avec ces
outils. Ils n'ont pas été exécutés dans un laboratoire GPU distant.

## 14. COLMAP

```text
Non installé.
```

Les commandes suivantes n'ont pas été exécutées :

```text
colmap --help
colmap feature_extractor
colmap exhaustive_matcher
colmap mapper
```

L'installation Nix précédemment essayée est bloquée par une dépendance
FreeImage marquée vulnérable. Cette protection n'a pas été contournée.

## 15. 3DGS

```text
Non installé et non testé.
```

Aucune implémentation n'a été choisie avant validation de COLMAP/SfM. Aucun
résultat 3DGS, viewer ou scène artificielle n'a été produit.

## 16. Dataset utilisé

Le dataset destiné au premier laboratoire est synthétique :

```text
experiments/streetview-3d/runs/phase7c-synthetic/
```

Vidéo :

- `synthetic-streetview-phase7c.mp4` ;
- `394452` octets ;
- 6 secondes ;
- `640×360` ;
- 24 FPS ;
- 144 frames ;
- H.264 ;
- audio absent ;
- scène statique et artificielle ;
- trajectoire synthétique connue ;
- GPS réel absent.

Prétraitement disponible :

- 12 frames JPEG ;
- sampling à 2 FPS ;
- résolution `640×360` ;
- environ `316 KiB` de frames ;
- manifeste `experiment.json` ;
- métadonnées FFprobe.

Aucune vidéo utilisateur ou vidéo réelle de rue n'a été utilisée.

## 17. Tests réalisés

### Tests déjà réalisés dans les phases précédentes

- lecture FFprobe de la vidéo synthétique ;
- extraction FFmpeg ;
- génération du manifeste ;
- contrôle d'isolation des artefacts ;
- vérification que COLMAP est absent.

### Tests Phase 13

```text
GPU réel              NON
nvidia-smi            NON
CUDA                  NON
PyTorch CUDA          NON
COLMAP                NON
traitement d'images   NON
SfM                   NON
```

Les contrôles locaux de Phase 12 n'ont pas été recommencés.

## 18. Résultats SfM

```text
NON DISPONIBLES
```

Il n'existe aucune mesure concernant :

- extraction de features ;
- matching ;
- nombre de caméras ;
- poses ;
- points 3D ;
- images alignées ;
- taux d'alignement ;
- erreurs ;
- temps ;
- RAM ;
- VRAM.

## 19. Temps de calcul

```text
Non mesuré.
```

Aucun GPU distant et aucune commande COLMAP n'ont été exécutés.

## 20. Erreurs éventuelles

Blocages observés :

1. aucun fournisseur GPU sélectionné ;
2. aucun accès de provisioning disponible ;
3. aucun credential utilisable ;
4. absence de GPU NVIDIA local ;
5. absence de CUDA ;
6. absence de PyTorch CUDA ;
7. absence de COLMAP ;
8. installation Nix bloquée par une dépendance vulnérable ;
9. absence de vidéo réelle.

Le paquet vulnérable n'a pas été autorisé de force et aucun credential n'a été
deviné ou demandé dans le chat.

## 21. Artefacts générés

Les artefacts de préparation existants sont :

```text
experiments/streetview-3d/runner.mjs
experiments/streetview-3d/generate-controlled-scene.mjs
experiments/streetview-3d/config.example.json
experiments/streetview-3d/runs/phase7c-synthetic/
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
experiments/streetview-3d/PHASE_8_RESULT.md
experiments/streetview-3d/PHASE_9_RESULT.md
experiments/streetview-3d/PHASE_10_RESULT.md
experiments/streetview-3d/PHASE_11_RESULT.md
experiments/streetview-3d/PHASE_12_RESULT.md
experiments/streetview-3d/gpu-lab/
```

Artefacts non générés :

- modèle COLMAP ;
- reconstruction sparse ;
- nuage dense ;
- mesh ;
- modèle Gaussian Splat ;
- viewer ;
- logs GPU ;
- métriques VRAM.

## 22. Limites

- la faisabilité COLMAP/SfM n'est pas encore prouvée ;
- MVS et 3DGS restent entièrement non validés ;
- le dimensionnement VRAM est une recommandation, pas une mesure ;
- les tarifs cloud n'ont pas été vérifiés ;
- aucun coût par reconstruction n'est connu ;
- aucune vidéo réelle ne permet de mesurer l'écart synthétique/réel ;
- aucun test de reprise GPU n'est possible ;
- aucune intégration avec BurkinaWatch n'est autorisée ;
- aucun worker GPU permanent ne doit être créé.

## 23. Procédure manuelle pour le propriétaire du projet

Cette procédure est volontairement manuelle et ne demande aucun secret dans le
chat.

### A. Choisir et plafonner

1. Comparer plusieurs fournisseurs sur leurs pages officielles.
2. Choisir une instance NVIDIA d'environ 24 Go de VRAM.
3. Définir une durée de test courte.
4. Définir un plafond de dépense.
5. Activer l'arrêt automatique ou la destruction immédiate si disponible.

### B. Créer l'instance isolée

1. Créer une instance Linux temporaire.
2. Ne pas lui donner accès à PostgreSQL, S3, Railway ou aux secrets
   BurkinaWatch.
3. Ne pas exposer de port public.
4. Utiliser uniquement SSH ou le terminal privé du fournisseur.
5. Ne pas monter le workspace complet.

### C. Installer et vérifier

Installer uniquement dans l'instance :

```text
NVIDIA driver
CUDA
Python
PyTorch CUDA
FFmpeg
COLMAP
```

Puis copier uniquement le dataset synthétique et le dossier
`experiments/streetview-3d/gpu-lab/`.

Exécuter :

```bash
./experiments/streetview-3d/gpu-lab/verify.sh
```

Continuer seulement si le script affiche :

```text
PRECHECK PASS
```

### D. Tester COLMAP

1. Vérifier `colmap --help`.
2. Vérifier la version.
3. Utiliser quelques frames synthétiques.
4. Exécuter feature extraction.
5. Exécuter matching.
6. Exécuter une première reconstruction sparse.
7. Sauvegarder les métriques et artefacts.
8. Arrêter si le SfM échoue.

Ne pas lancer MVS ou 3DGS dans cette étape.

### E. Fermer l'instance

1. Exporter le rapport et les artefacts expérimentaux nécessaires.
2. Vérifier l'absence de secret dans les exports.
3. Supprimer les données temporaires.
4. Arrêter ou détruire l'instance.
5. Noter la durée et le coût réel.
6. Compléter un nouveau rapport avec les versions mesurées.

## 24. Sécurité et impact production

Cette phase n'a modifié :

- ni frontend ;
- ni backend ;
- ni API ;
- ni PostgreSQL ;
- ni Street View ;
- ni queue ;
- ni worker CPU ;
- ni stockage de production ;
- ni Railway ;
- ni authentification ;
- ni domaine ;
- ni déploiement.

Aucune donnée utilisateur réelle n'a été envoyée à un fournisseur GPU.
Aucun worker GPU permanent et aucun viewer public n'ont été créés.

## 25. Recommandation

Attendre une validation humaine du fournisseur, du GPU, du plafond de dépense
et de la procédure d'arrêt.

Après provisionnement manuel uniquement, la prochaine validation doit rester
limitée à :

```text
GPU → CUDA → PyTorch CUDA → COLMAP → premier SfM
```

Si un élément critique manque, le verdict devra rester `NO-GO`.

MVS, 3DGS, les vidéos réelles et toute intégration BurkinaWatch devront
attendre une réussite objective du premier SfM.