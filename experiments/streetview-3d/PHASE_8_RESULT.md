# Phase 8 — Rapport d'environnement de calcul et première reconstruction

## Décision

**NO-GO pour la première reconstruction dans l'environnement actuel.**

La préparation du runner et de l'entrée synthétique est réutilisable, mais
l'environnement ne permet pas encore d'exécuter une reconstruction COLMAP,
MVS ou 3D Gaussian Splatting de manière sûre et reproductible.

Cette décision est principalement opérationnelle :

- COLMAP n'est pas installé ;
- aucun GPU NVIDIA n'est disponible ;
- l'installation Nix de COLMAP est bloquée par une dépendance marquée
  vulnérable ;
- aucune implémentation 3DGS n'est installée ou validée.

La protection Nix n'a pas été contournée avec
`NIXPKGS_ALLOW_INSECURE=1`.

## 1. Audit du runner

Le runner isolé se trouve dans :

```text
experiments/streetview-3d/
```

Il contient notamment :

- `runner.mjs` ;
- `generate-controlled-scene.mjs` ;
- `config.example.json` ;
- `REPORT_TEMPLATE.md` ;
- les rapports de runs sous `runs/`.

Le runner :

- inspecte l'entrée avec FFprobe ;
- extrait les frames avec FFmpeg ;
- conserve les paramètres d'extraction ;
- produit `experiment.json` et `ffprobe.json` ;
- refuse une entrée absente ;
- arrête explicitement l'étape SfM si COLMAP est indisponible ;
- ne touche ni PostgreSQL, ni Object Storage, ni l'API, ni le frontend.

Un défaut de filtre FFmpeg découvert pendant la Phase 7B a été corrigé et
validé sur la vidéo synthétique.

## 2. Environnement observé

- OS : Linux x64
- Node.js : v20.20.0
- Python : 3.13.11
- FFmpeg : 6.1.2
- FFprobe : 6.1.2
- RAM : environ 7,8 GiB
- espace disque disponible : environ 254 GiB
- Docker client/daemon : disponible
- GPU NVIDIA : absent
- `nvidia-smi` : absent
- CUDA : non disponible dans l'environnement observé
- COLMAP : absent
- implémentation 3DGS : absente

Une seule image Docker était présente localement et concernait MediaMTX, pas la
reconstruction 3D.

## 3. Tentatives d'installation de COLMAP

### Installation système contrôlée

L'installation via l'index système autorisé a échoué car `colmap` n'est pas
présent dans l'index disponible.

### Nix

L'attribut `nixpkgs#colmap` existe, mais son évaluation échoue avant exécution :
COLMAP dépend d'une version de FreeImage marquée vulnérable par Nixpkgs.

Nix refuse donc le paquet par défaut. Le contournement consistant à autoriser
explicitement cette dépendance n'a pas été utilisé.

### Docker

Aucune image COLMAP n'était présente localement. Aucun téléchargement d'image
externe et aucune exécution Docker distante n'ont été lancés.

## 4. Comparaison des environnements

| Option | COLMAP | GPU | Reproductibilité | Persistance | Décision |
|---|---|---|---|---|---|
| Machine locale CPU actuelle | Bloqué par installation | Non | Bonne pour FFmpeg uniquement | Bonne | Insuffisante |
| Machine locale avec GPU | Non disponible | Dépend du matériel | Variable | Bonne | Non disponible ici |
| GPU cloud temporaire | À installer dans une image dédiée | Oui | Bonne si image/version figée | Temporaire | Recommandée pour le premier test |
| Worker GPU externe permanent | Possible | Oui | Bonne | Bonne | Trop tôt pour cette phase |
| Railway API | Non adapté | Non garanti | Mauvaise séparation | Variable | À ne pas utiliser |
| Docker local | Possible en théorie | Aucun GPU disponible | Bonne | Locale | Bloqué sans image adaptée |

## 5. Choix recommandé

Pour la première reconstruction réelle, l'option recommandée est :

```text
GPU cloud temporaire, isolé du projet principal
```

Car elle permettrait de conserver temporairement :

- l'API BurkinaWatch inchangée ;
- PostgreSQL inchangé ;
- le stockage de production inchangé ;
- un environnement dédié au calcul ;
- une image logicielle reproductible ;
- le téléchargement explicite des artefacts expérimentaux.

Il ne s'agit pas encore de créer le worker GPU de production.

L'environnement devra documenter avant exécution :

- OS ;
- CPU ;
- RAM ;
- GPU ;
- VRAM ;
- driver ;
- CUDA ;
- Python ;
- COLMAP ;
- implémentation 3DGS ;
- versions et commandes ;
- répertoire d'entrée et de sortie.

## 6. Implémentation 3DGS

Aucune implémentation précise n'a été installée ou validée durant cette phase.

Il serait prématuré d'en choisir une uniquement sur la base d'une démonstration.
Le choix doit être fait dans l'environnement GPU retenu, après avoir vérifié :

- l'import d'un modèle sparse COLMAP ;
- la lecture des images ;
- la lecture des intrinsics ;
- la lecture des extrinsics ;
- le format de sortie ;
- la présence d'un viewer d'inspection ;
- la compatibilité avec la version CUDA disponible ;
- les besoins réels en VRAM.

Le contrat attendu reste :

```text
COLMAP sparse model
        ↓
conversion éventuellement nécessaire
        ↓
3DGS
        ↓
artefact visualisable
```

## 7. Entrée synthétique disponible

La vidéo synthétique Phase 7C est disponible ici :

```text
experiments/streetview-3d/runs/phase7c-synthetic/
```

Caractéristiques :

- MP4 H.264 ;
- 640×360 ;
- 24 FPS ;
- 6 secondes ;
- 144 frames ;
- trajectoire virtuelle connue ;
- scène statique ;
- aucun GPS réel.

Le runner a réussi son prétraitement avec :

- échantillonnage à 2 FPS ;
- 12 frames extraites ;
- résolution 640×360 ;
- environ 316 KiB de JPEGs ;
- `experiment.json` conservé.

Run correspondant :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
```

Cette entrée synthétique est adaptée à un futur test technique, mais elle ne
valide pas le comportement sur une vidéo smartphone réelle.

## 8. SfM

**Non exécuté.**

Le préflight a confirmé :

```text
COLMAP unavailable
GPU unavailable
```

Il n'existe donc aucune mesure réelle pour :

- features ;
- matches ;
- images reconstruites ;
- caméras ;
- points sparse ;
- poses ;
- erreur de reprojection ;
- temps SfM ;
- mémoire SfM.

## 9. MVS

**Non exécuté.**

MVS ne sera lancé qu'après inspection d'une reconstruction SfM réellement
produite.

## 10. Gaussian Splatting

**Non exécuté.**

Les prérequis suivants ne sont pas réunis :

- GPU ;
- VRAM ;
- implémentation choisie ;
- version CUDA ;
- conversion COLMAP vers le format attendu.

## 11. Performance et stockage

Seules les métriques de prétraitement sont disponibles :

- vidéo : 394 452 octets ;
- 144 frames synthétiques source ;
- 12 frames extraites ;
- sortie JPEG : environ 316 KiB ;
- temps de génération et d'extraction mesurables dans les runs locaux.

Il n'existe encore aucune mesure :

- temps GPU ;
- VRAM ;
- volume d'un nuage dense ;
- taille d'un mesh ;
- taille d'un Gaussian Splat ;
- temps de reconstruction.

Aucune extrapolation de coût ou de scalabilité n'est donc produite.

## 12. Réponses aux objectifs de Phase 8

### COLMAP fonctionne-t-il dans l'environnement actuel ?

**Non.**

Il est absent et son installation Nix est bloquée par une dépendance vulnérable.

### SfM fonctionne-t-il avec nos données ?

**Non déterminé.**

Aucun moteur SfM n'a pu être exécuté.

### MVS fonctionne-t-il ?

**Non déterminé.**

### 3DGS fonctionne-t-il ?

**Non déterminé.**

### Quel GPU est nécessaire ?

**Non déterminé expérimentalement.**

Un GPU compatible avec l'implémentation 3DGS choisie sera nécessaire, mais la
VRAM exacte dépendra de la résolution, du nombre de frames, du nombre de
primitives et des paramètres d'entraînement.

### Combien de temps prend une reconstruction ?

**Non mesuré.**

### Quelle quantité de stockage produit une scène ?

**Non mesurée.**

### Quelle qualité peut être obtenue ?

**Non mesurée.**

### Le pipeline est-il assez stable pour l'industrialisation ?

**Non.**

La chaîne n'a pas encore franchi l'étape SfM dans un environnement compatible.

## 13. Protection du produit

Durant cette phase :

- aucune API n'a été modifiée ;
- aucun frontend n'a été modifié ;
- aucune migration n'a été exécutée ;
- aucune base de production n'a été touchée ;
- aucun stockage de production n'a été touché ;
- aucun GPU worker permanent n'a été créé ;
- aucun viewer public n'a été créé ;
- aucun traitement massif n'a été lancé ;
- aucun déploiement n'a été effectué.

## 14. Recommandation finale

```text
NO-GO pour la reconstruction dans l'environnement actuel
```

La prochaine étape doit être une expérimentation isolée sur une machine GPU
temporaire avec versions figées, puis :

1. vérification de `COLMAP --help` ;
2. test minimal de sa base et de son matching ;
3. extraction des frames synthétiques ;
4. SfM ;
5. inspection de la trajectoire et des poses ;
6. MVS uniquement si SfM est exploitable ;
7. choix puis test d'une implémentation 3DGS ;
8. rapport de métriques réelles ;
9. arrêt avant toute intégration produit.