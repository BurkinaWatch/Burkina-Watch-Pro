# Phase 9 — Premier test réel de reconstruction 3D sur GPU cloud

## Verdict

```text
NO-GO
```

Le premier test réel sur GPU cloud n'a pas pu être lancé dans cet
environnement. Aucun GPU cloud n'est attaché ou provisionné ici, et aucune
instance externe n'a été démarrée sans sélection explicite d'un environnement
et validation de ses conditions d'accès.

Ce verdict ne signifie pas que le pipeline `vidéo → SfM → MVS → 3DGS` est
infaisable. Il signifie que cette Phase 9 n'a produit aucune mesure SfM, MVS
ou 3DGS permettant de le démontrer.

La vidéo synthétique et son extraction restent valides comme préparation
reproductible, mais elles ne constituent pas une reconstruction 3D.

## 1. Environnement

### Environnement réellement audité

- OS : Linux x64
- Node.js : `v20.20.0`
- Python : `3.13.11`
- FFmpeg : `6.1.2`
- FFprobe : `6.1.2`
- RAM : environ `7.8 GiB`
- espace disque disponible : environ `254 GiB`
- Docker : serveur `27.5.1`
- GPU NVIDIA : non détecté
- `nvidia-smi` : indisponible
- CUDA : non disponible dans l'environnement observé
- PyTorch : non installé pour CUDA
- COLMAP : absent
- implémentation 3DGS : absente

### Environnement GPU requis, comparaison préalable

| Classe cible | Usage expérimental | Avantage | Limite | Décision |
|---|---|---|---|---|
| NVIDIA, environ 16 Go VRAM | COLMAP et petit test 3DGS | Suffisant pour une première chaîne réduite si les données restent petites | Risque de manquer de VRAM pendant l'entraînement ou la densification | Minimum à tester |
| NVIDIA, environ 24 Go VRAM | Premier test complet recommandé | Marge plus raisonnable pour SfM/MVS/3DGS et plusieurs variantes | Toujours dépendant de la résolution et du nombre de frames | Cible recommandée |
| NVIDIA, plus de 24 Go VRAM | Scènes plus grandes ou paramètres plus ambitieux | Réduit les risques de saturation mémoire | Inutile avant d'avoir mesuré le besoin réel | À réserver après mesure |

Cette comparaison est une recommandation de préparation, pas une mesure de
performance. Aucun fournisseur, aucune instance et aucun coût réel n'ont été
sélectionnés ou engagés.

### Choix d'architecture

Le prototype GPU doit rester :

- temporaire ;
- isolé du dépôt d'exécution BurkinaWatch ;
- sans accès à PostgreSQL de production ;
- sans accès au stockage de production ;
- sans accès aux secrets de l'application ;
- destructible après export des artefacts expérimentaux.

L'option recommandée reste une machine GPU temporaire avec Docker et versions
figées, mais elle n'a pas été provisionnée durant cette phase.

## 2. Dataset

Dataset utilisé pour la préparation :

```text
experiments/streetview-3d/runs/phase7c-synthetic/
```

Vidéo :

- fichier : `synthetic-streetview-phase7c.mp4`
- taille : `394452` octets
- durée : `6` secondes
- résolution : `640×360`
- FPS source : `24`
- nombre de frames source : `144`
- codec : H.264 / `libx264`
- audio : absent
- scène : synthétique, statique, trajectoire connue
- objets mobiles : aucun
- GPS réel : absent

Cette scène est adaptée à la validation de tuyauterie technique. Elle ne
permet pas de conclure sur la qualité d'une vidéo smartphone de rue.

## 3. Extraction des frames

Run préparé :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
```

Paramètres :

- sampling : `2 FPS`
- largeur maximale : `640`
- frames extraites : `12`
- résolution des frames : `640×360`
- format : JPEG
- première frame : `frame_000001.jpg`
- dernière frame : `frame_000012.jpg`

Le manifeste `experiment.json` confirme que l'application, la base, le
stockage objet et le workflow de production n'ont pas été touchés.

## 4. SfM / COLMAP

### Statut

```text
NON EXÉCUTÉ
```

COLMAP n'est pas installé dans l'environnement courant et aucun GPU cloud
n'est disponible.

Mesures non disponibles :

- features détectées ;
- correspondances ;
- images alignées ;
- caméras estimées ;
- points 3D sparse ;
- erreurs de reprojection ;
- temps de calcul ;
- RAM et VRAM pendant SfM ;
- stabilité de la trajectoire.

Aucune commande COLMAP n'a été considérée comme réussie par simple présence
d'un binaire. Aucun résultat SfM n'existe à inspecter.

## 5. MVS / reconstruction dense

### Statut

```text
NON EXÉCUTÉ
```

MVS a correctement été bloqué, conformément au protocole, car aucun résultat
SfM exploitable n'est disponible.

Mesures non disponibles :

- nuage dense ;
- mesh ;
- textures ;
- densité ;
- qualité ;
- taille des sorties ;
- temps CPU/GPU ;
- consommation RAM/VRAM.

## 6. 3D Gaussian Splatting

### Statut

```text
NON EXÉCUTÉ
```

Aucune implémentation 3DGS versionnée n'a été choisie ou installée. Aucun
résultat visuel n'a été simulé et aucun viewer n'a été intégré.

Mesures non disponibles :

- implémentation et version ;
- paramètres ;
- nombre d'itérations ;
- poses d'entrée ;
- temps d'entraînement ;
- GPU et VRAM ;
- nombre de primitives ;
- taille du modèle ;
- qualité visuelle ;
- stabilité.

## 7. Temps de calcul

Les seules opérations réellement exécutées concernent la génération et
l'extraction de la vidéo synthétique des phases précédentes.

Il n'y a aucune mesure Phase 9 pour :

- durée de démarrage d'un GPU cloud ;
- durée de COLMAP ;
- durée MVS ;
- durée 3DGS ;
- durée totale de reconstruction ;
- temps CPU/GPU séparés.

## 8. Ressources et stockage

Ressources réellement observées localement :

- RAM totale : environ `7.8 GiB`
- RAM disponible au moment de l'audit : environ `5.1 GiB`
- disque disponible : environ `254 GiB`
- GPU : aucun
- VRAM : aucune
- CUDA : indisponible

Artefacts disponibles :

- vidéo source : environ `385 KiB`
- frames extraites : environ `316 KiB` d'après le rapport Phase 7B
- manifeste et métadonnées conservés

La taille d'un nuage dense, d'un mesh ou d'un modèle Gaussian Splat n'a pas
été mesurée.

## 9. Coût

```text
Non mesuré.
```

Aucune instance cloud n'a été lancée. Il n'existe donc ni durée GPU réelle,
ni coût réel, ni base suffisamment solide pour extrapoler à 1, 10, 100 ou
1000 vidéos.

Une estimation ne sera produite qu'après un premier run GPU traçable, avec :

- type exact de GPU ;
- durée de démarrage ;
- temps actif ;
- stockage temporaire ;
- volume entrant et sortant ;
- temps de chaque étape.

## 10. Qualité

```text
Non évaluée.
```

Aucun résultat de reconstruction n'a été produit. La scène synthétique
possède une géométrie connue, mais cette information ne doit pas être
confondue avec une géométrie estimée par SfM/MVS/3DGS.

Il n'est donc pas possible de conclure sur :

- couverture ;
- trous ;
- artefacts ;
- qualité des textures ;
- cohérence géométrique ;
- cohérence visuelle ;
- robustesse aux surfaces réelles ;
- comportement autour de la scène.

## 11. Limites et incidents

- aucun GPU NVIDIA local ;
- aucune instance GPU cloud provisionnée ;
- `nvidia-smi` absent ;
- CUDA indisponible ;
- COLMAP absent ;
- installation Nix de COLMAP bloquée par une dépendance FreeImage marquée
  vulnérable ;
- aucune image Docker COLMAP disponible localement ;
- aucune implémentation 3DGS validée ;
- aucune vidéo réelle de rue disponible ;
- aucune mesure de coût ;
- aucune mesure de qualité 3D.

La protection contre le paquet vulnérable n'a pas été contournée.

## 12. Reproductibilité

Artefacts et commandes déjà vérifiés :

```text
experiments/streetview-3d/generate-controlled-scene.mjs
experiments/streetview-3d/runner.mjs
experiments/streetview-3d/config.example.json
experiments/streetview-3d/runs/phase7c-synthetic/
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/
```

Prétraitement reproduisible :

```bash
node experiments/streetview-3d/runner.mjs \
  --input experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4 \
  --sample-fps 2 \
  --max-width 640 \
  --output experiments/streetview-3d/runs/phase9-synthetic-preflight
```

Cette commande prépare l'entrée et ne prétend pas exécuter COLMAP.

Les versions GPU, CUDA, PyTorch, COLMAP et 3DGS restent à figer dans un
environnement externe avant tout vrai run.

## 13. Protection de la production

Vérifications de périmètre :

- frontend non modifié ;
- API non modifiée ;
- routes Street View non modifiées ;
- PostgreSQL non modifié ;
- migrations non exécutées ;
- stockage de production non utilisé ;
- authentification non modifiée ;
- Railway non modifié ;
- aucun déploiement ;
- aucun worker GPU permanent ;
- aucun viewer public ;
- aucun traitement massif ;
- aucune facturation GPU permanente.

## 14. Recommandation Phase 10

La Phase 10 ne doit pas commencer automatiquement.

La prochaine étape recommandée est une nouvelle tentative expérimentale sur
une instance GPU temporaire, après sélection et validation humaine du
fournisseur. Elle devra exécuter, dans cet ordre :

1. inventaire GPU, VRAM, driver et CUDA ;
2. validation de Python et PyTorch CUDA ;
3. validation de `COLMAP --help` et de sa version ;
4. test des sous-commandes feature extraction, matching et mapper ;
5. exécution sur les 12 frames synthétiques ;
6. inspection des poses et du nuage sparse ;
7. arrêt si le SfM est classé `FAIL` ;
8. MVS uniquement après un SfM exploitable ;
9. choix et validation d'une implémentation 3DGS compatible ;
10. mesure du temps, des ressources, de la taille et de la qualité ;
11. destruction de l'instance temporaire après export des artefacts.

Après ce test seulement, une décision pourra être prise sur la faisabilité
technique pour BurkinaWatch.