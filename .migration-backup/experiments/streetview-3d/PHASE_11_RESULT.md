# Phase 11 — Validation réelle du moteur 3D sur GPU cloud

## Verdict

```text
NO-GO
```

La preuve expérimentale complète demandée par cette phase n'a pas pu être
obtenue dans l'environnement disponible.

Le pipeline suivant reste non démontré :

```text
VIDEO → FRAMES → COLMAP / SfM → MVS → 3DGS → SCÈNE 3D INSPECTABLE
```

La cause est opérationnelle et non une conclusion scientifique sur la
technologie :

- aucun GPU cloud n'est attaché ou provisionné ;
- aucun GPU NVIDIA n'est disponible localement ;
- CUDA et PyTorch CUDA ne sont pas disponibles ;
- COLMAP n'est pas installé ;
- aucune implémentation 3DGS versionnée n'est installée ;
- aucune vidéo réelle de rue n'est disponible dans le projet.

Conformément au protocole, aucune étape suivante n'a été simulée ou déclarée
réussie.

## 1. Résumé des phases précédentes

### Ce qui fonctionne réellement

- génération d'une vidéo synthétique contrôlée ;
- inspection avec FFprobe ;
- extraction paramétrée des frames avec FFmpeg ;
- conservation des métadonnées et manifests ;
- isolation des artefacts dans `experiments/streetview-3d/` ;
- arrêt explicite lorsque COLMAP est indisponible.

### Ce qui n'a jamais été testé avec succès

- COLMAP sur les frames ;
- feature extraction COLMAP ;
- feature matching COLMAP ;
- mapper / SfM ;
- poses caméra estimées ;
- nuage sparse ;
- MVS ;
- 3D Gaussian Splatting ;
- viewer d'une reconstruction réelle ;
- consommation VRAM ;
- coût GPU ;
- vidéo réelle de rue.

### Artefacts disponibles

```text
experiments/streetview-3d/runner.mjs
experiments/streetview-3d/generate-controlled-scene.mjs
experiments/streetview-3d/config.example.json
experiments/streetview-3d/runs/phase7c-synthetic/
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
experiments/streetview-3d/PHASE_8_RESULT.md
experiments/streetview-3d/PHASE_9_RESULT.md
experiments/streetview-3d/PHASE_10_RESULT.md
```

## 2. Environnement GPU

### Environnement local audité

- OS : Linux x64
- Node.js : `v20.20.0`
- Python : `3.13.11`
- FFmpeg : `6.1.2`
- FFprobe : `6.1.2`
- RAM : environ `7.8 GiB`
- disque disponible : environ `254 GiB`
- Docker : serveur `27.5.1`
- GPU NVIDIA : non détecté
- `nvidia-smi` : indisponible
- CUDA : indisponible
- PyTorch CUDA : non disponible
- COLMAP : absent
- 3DGS : absent

### Environnement cloud

```text
Aucune instance GPU cloud sélectionnée ou lancée.
```

Aucun accès fournisseur, endpoint de provisioning, terminal distant ou
stockage cloud expérimental n'a été configuré. Aucune donnée utilisateur n'a
été envoyée vers un fournisseur externe.

## 3. Comparaison de dimensionnement

Cette comparaison est préparatoire. Elle ne contient aucune mesure de coût ou
de performance, car aucune instance n'a été créée.

| Configuration | SfM | MVS | 3DGS | Risque principal | Décision |
|---|---|---|---|---|---|
| Environ 16 Go VRAM | Devrait être testable sur petit dataset, à vérifier | À mesurer | Possible seulement avec paramètres réduits, à vérifier | OOM pendant densification ou entraînement | Minimum expérimental |
| Environ 24 Go VRAM | Devrait offrir davantage de marge, à vérifier | Cible préférable, à vérifier | Cible recommandée pour le premier test complet, à vérifier | Dépendance à la résolution et au nombre de frames | Meilleur compromis à tester |
| Plus de 24 Go VRAM | Non nécessaire avant mesure | Réserve pour scènes plus grandes | Utile seulement après mesure d'un besoin réel | Surdimensionnement prématuré | À réserver |

Les compatibilités COLMAP, CUDA, PyTorch et 3DGS doivent être vérifiées dans
l'instance réellement choisie. Elles ne peuvent pas être déduites de la seule
classe de VRAM.

## 4. Versions

### Versions réellement disponibles

```text
Node.js  v20.20.0
Python   3.13.11
FFmpeg   6.1.2
FFprobe  6.1.2
Docker   27.5.1
```

### Versions non disponibles

```text
CUDA              non disponible
PyTorch CUDA      non disponible
COLMAP            non installé
3DGS              aucune implémentation sélectionnée
Driver NVIDIA     non disponible
```

Il n'existe donc pas encore de manifest complet d'environnement GPU à figer.

## 5. Dataset

Le dataset synthétique retenu pour le futur test est :

```text
experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4
```

Caractéristiques :

- taille : `394452` octets ;
- durée : `6` secondes ;
- résolution : `640×360` ;
- FPS source : `24` ;
- frames source : `144` ;
- codec : H.264 / `libx264` ;
- audio : absent ;
- scène : synthétique et statique ;
- trajectoire : connue dans le référentiel synthétique ;
- objets mobiles : aucun ;
- GPS réel : absent.

Cette entrée valide uniquement la préparation technique. Elle ne constitue
pas une vidéo de rue réelle.

## 6. Prétraitement

Run disponible :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
```

Paramètres réellement exécutés :

- sampling : `2 FPS` ;
- frames extraites : `12` ;
- résolution : `640×360` ;
- largeur maximale : `640` ;
- format : JPEG ;
- taille totale rapportée des images : environ `316 KiB`.

Statut du manifeste :

```text
FRAMES_EXTRACTED_SFM_NOT_RUN
```

La commande de préflight reproductible est :

```bash
node experiments/streetview-3d/runner.mjs \
  --input experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4 \
  --sample-fps 2 \
  --max-width 640 \
  --output experiments/streetview-3d/runs/phase11-synthetic-preflight
```

Elle ne lance pas de reconstruction.

## 7. COLMAP

```text
NON EXÉCUTÉ
```

Les contrôles demandés n'ont pas pu commencer :

- `colmap --help` : impossible, binaire absent ;
- version : non disponible ;
- feature extraction : non exécutée ;
- feature matching : non exécuté ;
- sparse reconstruction : non exécutée.

Il n'existe donc aucun résultat COLMAP à inspecter :

- aucune caméra ;
- aucune pose ;
- aucun point 3D ;
- aucune métrique d'alignement.

L'installation Nix précédemment testée a été bloquée par une dépendance
FreeImage marquée vulnérable. La protection n'a pas été contournée.

## 8. SfM

```text
NON EXÉCUTÉ
```

Mesures indisponibles :

- nombre d'images fournies au mapper ;
- images alignées ;
- taux d'alignement ;
- nombre de caméras ;
- nombre de points ;
- erreur de reprojection ;
- trajectoire ;
- dérive ;
- temps ;
- RAM ;
- VRAM.

Il n'existe aucun artefact de poses à inspecter.

## 9. Validation avant MVS

```text
NON ÉVALUÉE
```

Le classement `PASS`, `PASS WITH WARNINGS` ou `FAIL` ne peut pas être attribué
à un SfM qui n'a pas été exécuté.

MVS a été arrêté conformément au protocole.

## 10. MVS

```text
NON EXÉCUTÉ
```

Mesures indisponibles :

- durée ;
- RAM ;
- VRAM ;
- taille du nuage dense ;
- densité ;
- mesh ;
- textures ;
- qualité ;
- erreurs.

## 11. 3DGS

```text
NON EXÉCUTÉ
```

Aucune implémentation n'a été choisie, car l'étape COLMAP/SfM préalable est
bloquée.

Il n'existe aucun :

- modèle Gaussian Splat ;
- nombre de primitives ;
- checkpoint ;
- temps d'entraînement ;
- paramètre d'optimisation ;
- viewer ;
- test de vues nouvelles ;
- mesure VRAM.

Aucun résultat 2.5D ou artefact visuel simulé n'a été présenté comme une
reconstruction 3D.

## 12. Qualité

```text
NON ÉVALUÉE
```

Les critères suivants n'ont pas de valeur mesurée :

- cohérence géométrique ;
- vue proche ;
- vue latérale ;
- vue arrière ;
- vue hors entraînement ;
- couverture ;
- trous ;
- flou ;
- surfaces fantômes ;
- objets déformés ;
- qualité caméra.

## 13. Temps

Temps mesurés Phase 11 :

```text
Aucun temps GPU ou reconstruction.
```

Non mesurés :

- démarrage d'une instance ;
- installation ;
- COLMAP ;
- SfM ;
- MVS ;
- 3DGS ;
- export ;
- nettoyage.

## 14. RAM / VRAM

Ressources locales observées :

- RAM totale : environ `7.8 GiB` ;
- RAM disponible lors de l'audit : environ `5.1 GiB` ;
- VRAM : aucune ;
- GPU : aucun ;
- CUDA : indisponible.

La VRAM minimale réelle n'est pas déterminée.

## 15. Stockage

Artefacts réellement disponibles :

- vidéo synthétique : environ `385 KiB` ;
- frames extraites : environ `316 KiB` ;
- manifests et métadonnées : conservés.

Non mesurés :

- modèle COLMAP ;
- nuage MVS ;
- mesh ;
- textures ;
- modèle 3DGS ;
- previews ;
- logs GPU ;
- stockage temporaire cloud.

## 16. Coût

```text
Non mesuré.
```

Aucune instance n'a été lancée. Il n'est donc pas possible de calculer
honnêtement :

- coût GPU ;
- coût CPU ;
- coût stockage temporaire ;
- coût transfert ;
- coût par reconstruction ;
- projections pour 10, 100, 1 000 ou 10 000 contributions.

## 17. Limites

- absence d'instance GPU cloud ;
- absence de fournisseur sélectionné ;
- absence de COLMAP exécutable ;
- absence de CUDA ;
- absence de PyTorch CUDA ;
- absence d'implémentation 3DGS validée ;
- absence de vidéo réelle de rue ;
- absence de métriques SfM ;
- absence de métriques MVS ;
- absence de métriques 3DGS ;
- absence de mesure de coût ;
- absence de validation de vues nouvelles.

La scène synthétique connue ne peut pas remplacer une preuve de reconstruction
estimée par le pipeline.

## 18. Problèmes rencontrés

1. L'environnement Replit actuel expose FFmpeg, mais pas de GPU NVIDIA.
2. `nvidia-smi` et CUDA ne sont pas disponibles.
3. COLMAP n'est pas présent dans l'environnement système.
4. L'attribut Nix COLMAP est bloqué par une dépendance marquée vulnérable.
5. Aucune image Docker COLMAP n'est disponible localement.
6. Aucun provisioning cloud GPU n'est configuré.
7. La vidéo réelle requise par le test Street View n'est pas disponible.

Le paquet vulnérable n'a pas été autorisé de force.

## 19. Résultats synthétiques

Résultat réel de préparation :

```text
PASS — extraction et manifeste uniquement
```

Ce résultat signifie :

- la vidéo synthétique est lisible ;
- FFprobe fonctionne ;
- FFmpeg extrait les frames ;
- les métadonnées sont conservées ;
- l'expérience est isolée.

Il ne signifie pas :

- que SfM fonctionne ;
- que MVS fonctionne ;
- que 3DGS fonctionne ;
- qu'une scène 3D a été reconstruite.

## 20. Résultats réels

```text
NON DISPONIBLES
```

Aucune vidéo réelle Burkina Faso n'est présente dans le projet. Aucune vidéo
n'a été inventée ou substituée.

## 21. Recommandation technique

Le pipeline cible reste techniquement plausible, mais non validé.

La prochaine tentative doit être effectuée dans un laboratoire GPU temporaire
avec :

1. une cible d'environ 24 Go de VRAM pour le premier test complet ;
2. Docker ou un environnement versionné ;
3. versions explicites de l'OS, driver, CUDA, Python, PyTorch et COLMAP ;
4. un test GPU minimal avant toute vidéo ;
5. un test COLMAP sur quelques images avant MVS ou 3DGS ;
6. arrêt immédiat si SfM échoue ;
7. MVS uniquement après inspection des poses ;
8. choix documenté d'une implémentation 3DGS ;
9. export des artefacts et métriques ;
10. destruction de l'instance temporaire après l'expérience.

Tant que ce test n'est pas réalisé, l'architecture applicative doit rester
limitée à `WAITING_FOR_3D`.

## 22. Protection de la production

Cette phase n'a effectué aucune modification de production :

- frontend intact ;
- API intacte ;
- routes Street View intactes ;
- queue intacte ;
- worker CPU intact ;
- PostgreSQL intact ;
- stockage de production non utilisé ;
- authentification intacte ;
- Railway intact ;
- aucun déploiement ;
- aucun worker GPU permanent ;
- aucune donnée utilisateur envoyée à un fournisseur GPU ;
- aucun traitement massif ;
- aucun viewer public.

## 23. Étape suivante

Ne pas commencer automatiquement une nouvelle phase.

Une validation humaine est nécessaire pour choisir un environnement GPU
temporaire et autoriser une expérimentation isolée. Après cette validation
seulement, le test pourra reprendre à l'étape GPU, sans modifier BurkinaWatch.