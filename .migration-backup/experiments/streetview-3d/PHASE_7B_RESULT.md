# Phase 7B — Rapport de clôture du premier test

## Décision

**NO-GO pour l’industrialisation et pour une validation du moteur 3D.**

Cette décision ne réfute pas l’architecture COLMAP/SfM-MVS + 3DGS. Elle signifie
que cette expérience n’a pas pu atteindre l’étape SfM : l’environnement ne
contient pas COLMAP, aucun GPU NVIDIA n’est disponible et aucune vidéo réelle
de capture utilisateur n’a été fournie.

Une entrée synthétique contrôlée a été utilisée uniquement pour valider le
prétraitement du runner. Elle ne constitue pas une preuve de fonctionnement
sur une vidéo réelle.

## 1. Environnement

- OS : Linux x64
- Node.js : v20.20.0
- FFmpeg : 6.1.2
- FFprobe : 6.1.2
- COLMAP : absent
- GPU NVIDIA / `nvidia-smi` : absent
- RAM observée : environ 7,8 GiB au total
- Espace disponible observé : environ 254 GiB
- PostgreSQL utilisé : non
- Object Storage utilisé : non
- API et workflow StreetView utilisés : non

## 2. Vidéo utilisée

Fichier :

```text
experiments/streetview-3d/runs/phase7c-synthetic/
synthetic-streetview-phase7c.mp4
```

Caractéristiques mesurées avec FFprobe :

- format : MP4 / QuickTime
- codec : H.264
- résolution : 640×360
- FPS : 24
- durée : 6 secondes
- frames : 144
- taille : 394 452 octets
- pixel format : yuv420p
- audio : absent

Origine :

- scène synthétique déterministe ;
- géométrie fixe rendue image par image ;
- caméra virtuelle à trajectoire connue ;
- aucun GPS réel ;
- aucun objet mobile ;
- aucun changement d’éclairage.

## 3. Extraction des frames

Commande logique utilisée par le runner :

```text
sampleFps = 2
maxWidth = 640
```

Résultat :

- 12 frames extraites ;
- résolution : 640×360 ;
- premier fichier : `frame_000001.jpg` ;
- dernier fichier : `frame_000012.jpg` ;
- taille du répertoire d’images : environ 316 KiB ;
- rapport généré dans `experiment.json` ;
- sortie FFprobe conservée dans `ffprobe.json`.

Le runner est resté isolé du produit :

- aucune base de données touchée ;
- aucun stockage objet touché ;
- aucune API touchée ;
- aucun workflow de production touché.

## 4. SfM

### Résultat

**Non exécuté.**

Le runner a vérifié la disponibilité de COLMAP et a arrêté la progression avec :

```text
BLOCKED_COLMAP_NOT_INSTALLED
```

Il n’existe donc aucune métrique réelle concernant :

- les images alignées ;
- les caméras reconstruites ;
- les poses ;
- les points sparse ;
- l’erreur de reprojection ;
- le temps SfM ;
- la mémoire SfM.

## 5. MVS

**Non exécuté.**

Sans résultat SfM inspecté, lancer MVS aurait produit une expérience
ininterprétable. Aucun nuage dense, mesh ou texture n’a été fabriqué.

## 6. Gaussian Splatting

**Non exécuté.**

L’environnement ne contient pas de GPU NVIDIA détecté et aucune implémentation
3DGS n’est installée. Aucun résultat visuel de démonstration n’a été substitué.

## 7. Réparation effectuée dans le runner

Le premier lancement a révélé un défaut dans le filtre FFmpeg de limitation de
largeur. L’extraction s’arrêtait avant de produire les frames.

Le filtre a été corrigé dans le runner expérimental, puis l’extraction a été
relancée avec succès. Cette correction ne touche ni l’application principale,
ni son API, ni la base, ni le workflow StreetView.

## 8. Réponses aux questions de la Phase 7B

### Question 1 — La vidéo permet-elle une reconstruction SfM exploitable ?

**Non déterminé.**

La vidéo synthétique possède une trajectoire contrôlée et une profondeur
cohérente, mais COLMAP n’était pas disponible. Aucune conclusion SfM ne peut
être tirée.

### Question 2 — La reconstruction dense est-elle exploitable ?

**Non déterminé.**

MVS n’a pas été lancé.

### Question 3 — Le Gaussian Splatting fonctionne-t-il ?

**Non déterminé.**

3DGS n’a pas été lancé.

### Question 4 — Le résultat est-il visuellement et spatialement crédible ?

La **vidéo d’entrée synthétique** est cohérente visuellement et possède une
trajectoire connue. Aucun résultat reconstruit n’existe pour être évalué.

La crédibilité d’une reconstruction n’est donc pas démontrée.

### Question 5 — Principales limitations

- aucune vidéo réelle capturée par smartphone ;
- COLMAP absent ;
- aucun GPU NVIDIA détecté ;
- aucune implémentation 3DGS disponible ;
- aucune métrique de poses ;
- aucune métrique MVS ;
- aucune mesure de qualité 3D ;
- aucun géoréférencement réel ;
- vidéo synthétique limitée à une scène artificielle et statique.

### Question 6 — Quel matériel sera nécessaire ?

Il faudra au minimum :

- un environnement capable d’exécuter COLMAP ;
- suffisamment de CPU et de RAM pour le matching et la reconstruction ;
- un GPU compatible avec l’implémentation 3DGS choisie ;
- une VRAM adaptée à la résolution, au nombre de frames et au nombre de
  primitives ;
- un espace temporaire suffisant pour les frames et les artefacts.

Les capacités exactes doivent être mesurées sur l’implémentation retenue et une
vidéo réelle ; aucun chiffre de capacité n’est inventé ici.

### Question 7 — L’architecture reste-t-elle validée ?

**Architecture plausible, mais non validée expérimentalement.**

Le prétraitement et l’isolation du runner sont validés. La chaîne de
reconstruction reste à tester dans un environnement adapté.

## 9. Rapport d’incident et artefacts

Le run de prétraitement est conservé ici :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
```

Il contient :

```text
experiment.json
ffprobe.json
frames/
```

Le premier run ayant échoué à cause du filtre FFmpeg est conservé séparément
comme trace de diagnostic :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic/
```

## 10. Conclusion

La Phase 7B est clôturée avec le statut :

```text
NO-GO — prérequis de reconstruction indisponibles
```

Ce statut ne justifie pas d’intégrer un moteur dans BurkinaWatch, de créer un
GPU worker permanent, de modifier le flux utilisateur ou de déployer en
production.

Pour obtenir une preuve technique réelle, il faudra ultérieurement :

1. fournir une vidéo réelle de capture ;
2. sélectionner une infrastructure disposant de COLMAP ;
3. sélectionner et documenter une implémentation 3DGS ;
4. relancer SfM sur les frames extraites ;
5. inspecter les poses avant MVS ;
6. exécuter MVS puis 3DGS uniquement si SfM est concluant ;
7. produire un nouveau rapport fondé sur les métriques réellement mesurées.