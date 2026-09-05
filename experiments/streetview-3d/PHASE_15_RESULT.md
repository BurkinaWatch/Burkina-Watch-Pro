# Phase 15 — CPU SfM

## Décision

```text
NO-GO dans l'environnement CPU actuel
```

Ce verdict est limité au runner actuel : COLMAP n'est pas installé et aucune
méthode locale propre n'était disponible pour l'exécuter. Il ne signifie pas
que SfM CPU est techniquement impossible dans un environnement séparé et
reproductible.

Aucun résultat SfM, aucune caméra estimée et aucun point 3D ne sont déclarés.
La chaîne s'est arrêtée avant toute commande COLMAP.

## 1. Objectif

La Phase 15 devait répondre à une seule question :

```text
Une première reconstruction SfM réelle est-elle exécutable sur CPU
avec le dataset synthétique existant ?
```

La chaîne attendue était :

```text
images → COLMAP feature extraction → matching → mapper → modèle sparse
```

L'expérience est restée isolée sous `experiments/streetview-3d/`. Elle n'a
touché ni l'application, ni PostgreSQL, ni le stockage objet, ni Railway, ni
le worker de production, ni les secrets.

## 2. Environnement

Valeurs observées pendant l'audit :

| Élément | Valeur |
| --- | --- |
| OS | Linux x86_64, noyau `6.18.49 #Replit-Linux` |
| CPU | 4 vCPU, Intel Xeon Platinum 8581C @ 2.30 GHz |
| RAM totale | 7.8 GiB |
| RAM disponible pendant l'audit | 3.6 GiB |
| Swap | 0 B |
| Disque workspace | 256 GB, 254 GB disponibles |
| Disque `/tmp` | 32 GB, 32 GB disponibles |
| Node.js | `v20.20.0` |
| Python | `3.13.11` |
| FFmpeg | `6.1.2` |
| FFprobe | `6.1.2` |
| Docker | `27.5.1` |
| COLMAP | absent (`command -v colmap` échoue) |

Le seul conteneur Docker local est `bluenviron/mediamtx:1.12.3`. Aucune image
COLMAP n'est disponible localement.

La tentative Nix documentée dans les phases précédentes reste bloquée par une
dépendance FreeImage marquée vulnérable. La protection n'a pas été contournée :
`NIXPKGS_ALLOW_INSECURE=1` n'a pas été utilisé. Aucune installation système ou
Docker n'a été lancée pendant cette phase.

## 3. Dataset

### Source synthétique

```text
experiments/streetview-3d/runs/phase7c-synthetic/
```

Vidéo utilisée par le run préparatoire existant :

```text
experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4
```

Mesures observées par FFprobe :

- taille : `394452` octets ;
- durée : `6.000000` secondes ;
- résolution : `640×360` ;
- fréquence : `24 FPS` ;
- frames source : `144` ;
- codec : H.264 / `libx264` ;
- pixel format : `yuv420p` ;
- audio : absent.

La scène est contrôlée et synthétique : bâtiments et trajectoire sont générés
à partir de coordonnées artificielles connues. Elle ne représente pas une rue
réelle et ne permet pas de conclure seule sur la qualité terrain.

### Images de travail

Les images pré-extraites existantes ont été réutilisées sans modifier
l'original :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/frames/
```

Vérification effectuée :

- `12` images JPEG ;
- `640×360` pour les `12` images ;
- taille cumulée exacte : `295617` octets, soit environ `289 KiB` ;
- chaque fichier est reconnu comme une image JPEG valide par `identify` ;
- aucune image n'a été envoyée vers un stockage externe.

## 4. Configuration COLMAP

Aucune configuration COLMAP n'a été exécutée, car le binaire est absent.

La configuration prévue pour un futur runner séparé, à confirmer uniquement par
des valeurs réellement mesurées, serait :

- CPU uniquement ;
- 8 à 12 images pour le premier test ;
- nombre de threads limité pour respecter les 4 vCPU ;
- caméra et type de features conservateurs ;
- feature extraction, matching puis mapper uniquement ;
- aucun CUDA, MVS ou 3DGS.

Ces paramètres ne constituent pas un résultat expérimental de cette phase.

## 5. Test 1

### Préparation

Le run existant `phase7b-on-synthetic-v2` contient déjà le manifeste du
prétraitement :

```text
status: FRAMES_EXTRACTED_SFM_NOT_RUN
nextStage.status: BLOCKED_COLMAP_NOT_INSTALLED
```

Un audit indépendant a confirmé :

```text
command -v colmap → absent
```

### Exécution

Le test s'est arrêté avant :

- `colmap feature_extractor` ;
- `colmap exhaustive_matcher` ;
- `colmap mapper`.

Aucune commande COLMAP n'a donc échoué après démarrage : elle n'a pas pu être
appelée dans cet environnement.

## 6. Résultats Test 1

| Métrique | Résultat |
| --- | --- |
| images input | 12 images JPEG |
| images enregistrées | non mesuré, COLMAP absent |
| caméras | non mesuré |
| points 3D | non mesuré |
| observations | non mesuré |
| erreur de reprojection | non mesurée |
| durée SfM | non mesurée |
| RAM maximale du SfM | non mesurée |
| statut | `BLOCKED_COLMAP_NOT_INSTALLED` |

Il serait incorrect de convertir l'absence de COLMAP en zéro caméra ou zéro
point 3D : aucun modèle sparse n'a été produit.

## 7. Test 2

Non réalisé. Le deuxième test de 20 à 30 images ne peut commencer qu'après un
premier SfM réel réussi. MVS et 3DGS restent hors périmètre.

## 8. Robustesse

Des entrées invalides minimales ont été préparées uniquement dans `/tmp` pour
confirmer le contexte du blocage :

- dossier vide ;
- fichier JPEG contenant du texte ;
- fichier texte isolé.

Aucun pipeline COLMAP n'étant disponible, aucun test de robustesse COLMAP,
timeout, interruption ou manque d'espace n'a été déclaré réussi. Il faudra les
exécuter dans le futur runner CPU après installation vérifiée.

## 9. Artefacts

Artefacts réutilisés :

- vidéo synthétique source ;
- 12 JPEG pré-extraits ;
- `experiment.json` ;
- `ffprobe.json` ;
- métadonnées synthétiques contrôlées ;
- résultats et rapports des phases précédentes.

Le manifeste existant confirme :

- `applicationTouched: false` ;
- `databaseTouched: false` ;
- `objectStorageTouched: false` ;
- `productionWorkflowTouched: false`.

Aucun dossier `database/`, `sparse/` ou modèle COLMAP n'a été créé, car aucun
SfM n'a été exécuté.

## 10. Problèmes rencontrés

1. COLMAP n'est pas présent dans le runner CPU.
2. L'image Docker COLMAP n'est pas disponible localement.
3. L'installation Nix déjà évaluée est bloquée par FreeImage vulnérable.
4. Aucun contournement de sécurité n'est acceptable.
5. L'environnement courant n'a que 4 vCPU, 7.8 GiB de RAM et aucun swap, ce
   qui impose une configuration très conservatrice pour un futur test.

Aucune nouvelle tentative d'installation n'a été forcée après confirmation du
blocage.

## 11. Analyse

Le dataset synthétique est suffisamment petit pour servir de test de chaîne,
mais ses propriétés restent particulières :

- scène statique et artificielle ;
- géométrie connue par construction ;
- textures et objets simples ;
- trajectoire synthétique ;
- seulement 12 images dans l'entrée de travail.

Un échec futur sur ce dataset ne prouverait pas à lui seul que la
photogrammétrie CPU est impossible. Il faudrait distinguer un problème
d'installation, de version, de compilation, de paramètres, de texture, de
parallaxe ou de trajectoire.

Dans la phase présente, la cause est antérieure à ces questions : le moteur
COLMAP n'existe pas dans l'environnement.

## 12. Limites CPU

La Phase 15 ne mesure pas :

- le temps d'extraction de features COLMAP ;
- le temps de matching ;
- le temps du mapper ;
- la RAM maximale ;
- le nombre de caméras ou de points ;
- le taux d'images enregistrées ;
- la qualité ou l'erreur de reprojection.

Il est donc impossible d'extrapoler un coût ou une durée pour des milliers de
contributions à partir de cette phase.

## 13. Architecture ReconstructionEngine

L'application conserve l'abstraction `ReconstructionEngine` et son
`CpuReconstructionEngine`, mais aucun adaptateur COLMAP validé n'a été ajouté.
La simple détection d'un binaire ne devra pas suffire à publier un résultat :
il faudra valider une exécution réelle et ses métriques dans le laboratoire.

Le résultat expérimental ne doit pas être connecté à :

- la queue de production ;
- `streetview_scenes` ;
- l'API publique ;
- la carte ;
- un viewer ;
- un worker GPU.

## 14. Décision

```text
NO-GO pour le SfM CPU dans le runner actuel
```

Ce `NO-GO` est causé par une limitation d'environnement, pas par une preuve
d'impossibilité technique de COLMAP/SfM CPU.

Les règles suivantes ont été respectées :

- aucun GPU ;
- aucune donnée utilisateur ;
- aucune migration 0010 ;
- aucun accès Railway ou PostgreSQL de production ;
- aucune modification des secrets ;
- aucune publication ;
- aucun MVS, 3DGS, fusion de scènes ou viewer ;
- aucune métrique inventée.

## 15. Recommandation Phase 16

Ne pas lancer automatiquement la Phase 16.

La prochaine étape devrait être une validation humaine d'un runner CPU isolé
et reproductible, avec COLMAP réellement exécutable, par exemple une image
conteneur contrôlée ou une machine de laboratoire séparée. Avant tout test :

1. figer les versions d'OS, COLMAP et dépendances ;
2. vérifier `colmap -h` et une commande de version ;
3. copier uniquement les 12 images synthétiques ;
4. exécuter feature extraction, matching et mapper sur CPU limité ;
5. conserver les logs et métriques réels ;
6. détruire ou nettoyer le runner après l'expérience.

Même en cas de succès, le résultat devra rester expérimental : aucune scène de
production ne devra être créée et aucune migration ou activation du worker ne
devra être déclenchée automatiquement.