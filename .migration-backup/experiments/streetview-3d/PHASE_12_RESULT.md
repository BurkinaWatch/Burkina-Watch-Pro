# Phase 12 — Provisionnement du laboratoire GPU 3D temporaire

## Verdict

```text
NO-GO
```

Le laboratoire GPU cloud n'a pas été provisionné.

Cette décision est volontaire et conforme au protocole :

- aucun fournisseur n'a été sélectionné ;
- aucune instance payante n'a été lancée ;
- aucun credential cloud n'est disponible pour un provisioning sûr ;
- les prix et la disponibilité n'ont pas pu être vérifiés en direct ;
- aucun GPU NVIDIA n'est disponible dans le workspace actuel ;
- aucune donnée utilisateur réelle n'a été traitée.

La phase a toutefois préparé un préflight reproductible et isolé sous :

```text
experiments/streetview-3d/gpu-lab/
```

## 1. Fournisseur

```text
Aucun fournisseur sélectionné.
```

Une tentative de recherche publique des offres et tarifs actuels a échoué avec
`402 Payment Required`. Aucun prix n'est donc reporté ou inventé.

La sélection devra comparer, sur les pages officielles au moment du
provisionnement :

- GPU NVIDIA disponible ;
- VRAM ;
- CPU et RAM ;
- stockage temporaire ;
- tarif horaire et minimum de facturation ;
- disponibilité ;
- terminal ou SSH ;
- Docker ;
- compatibilité CUDA, PyTorch, COLMAP et 3DGS ;
- suppression immédiate de l'instance.

Aucune dépense ne doit être engagée avant cette vérification et une validation
humaine explicite.

## 2. GPU

```text
Non provisionné.
```

La cible préparatoire reste un GPU NVIDIA d'environ 24 Go de VRAM pour le
premier laboratoire. Une configuration d'environ 16 Go pourra être testée
ultérieurement si le petit dataset synthétique le permet. Un GPU plus grand
ne sera envisagé qu'après mesure réelle d'un besoin.

## 3. VRAM

```text
Non mesurée.
```

La seule recommandation actuelle est une cible d'environ 24 Go, sans prétendre
qu'elle constitue une exigence démontrée.

## 4. CPU

```text
Non provisionné.
```

Le CPU devra être documenté après sélection du fournisseur. Aucun traitement
CPU distant n'a été lancé.

## 5. RAM

```text
Non provisionnée.
```

L'environnement local audité dispose d'environ 7,8 GiB de RAM, mais cette
valeur ne constitue pas la configuration du futur laboratoire GPU.

## 6. CUDA

```text
Non disponible dans le workspace actuel.
```

`nvidia-smi` est absent et aucun runtime CUDA utilisable n'a été identifié.

## 7. Python

Version locale observée :

```text
Python 3.13.11
```

Cette version n'est pas imposée au futur laboratoire. La version devra être
choisie avec la matrice de compatibilité CUDA, PyTorch, COLMAP et 3DGS, puis
mesurée et figée dans `gpu-lab/versions.env.example`.

## 8. PyTorch

```text
PyTorch CUDA non disponible.
```

Aucun calcul CUDA n'a été exécuté depuis Python.

## 9. COLMAP

```text
Non installé.
```

Les tests suivants n'ont pas été exécutés :

- `colmap --help` ;
- version ;
- extraction de features ;
- matching ;
- première reconstruction SfM.

L'installation Nix précédemment tentée reste bloquée par une dépendance
FreeImage marquée vulnérable. Cette protection n'a pas été contournée.

## 10. Docker

Docker est disponible localement :

```text
Docker server 27.5.1
```

La seule image locale observée concerne MediaMTX :

```text
bluenviron/mediamtx:1.12.3
```

Aucune image COLMAP, CUDA ou 3DGS n'est disponible localement.

Aucun Dockerfile GPU n'a été ajouté, car aucune combinaison de versions
réellement testée n'est encore validée. Le créer maintenant donnerait une
fausse impression de reproductibilité.

## 11. Test GPU

```text
NON EXÉCUTÉ
```

Le script préparé est :

```text
experiments/streetview-3d/gpu-lab/verify.sh
```

Il vérifie sans installer :

- `nvidia-smi` ;
- modèle GPU et VRAM ;
- Python ;
- PyTorch ;
- `torch.cuda.is_available()` ;
- création d'un petit tenseur CUDA ;
- `colmap --help`.

Le script doit être exécuté dans une future instance GPU. Il échouera
intentionnellement dans le workspace actuel.

## 12. Test COLMAP

```text
NON EXÉCUTÉ
```

Aucune instance de laboratoire n'est disponible pour installer COLMAP ou
tester ses sous-commandes.

## 13. Premier SfM

```text
NON EXÉCUTÉ
```

Il n'existe actuellement :

- aucune caméra estimée ;
- aucune pose ;
- aucun point 3D ;
- aucun taux d'alignement ;
- aucun artefact sparse ;
- aucune mesure de temps ou de mémoire.

MVS et 3DGS restent interdits à ce stade.

## 14. Dataset utilisé

Le dataset destiné au laboratoire est uniquement synthétique :

```text
experiments/streetview-3d/runs/phase7c-synthetic/
```

Vidéo :

- fichier : `synthetic-streetview-phase7c.mp4` ;
- taille : `394452` octets ;
- durée : `6` secondes ;
- résolution : `640×360` ;
- FPS source : `24` ;
- frames source : `144` ;
- codec : H.264 / `libx264` ;
- audio : absent ;
- scène : statique et artificielle ;
- GPS réel : absent.

Prétraitement déjà disponible :

- sampling : `2 FPS` ;
- frames extraites : `12` ;
- résolution : `640×360` ;
- sortie JPEG : environ `316 KiB`.

Aucune vidéo utilisateur ou vidéo réelle de rue n'a été copiée.

## 15. Temps

```text
Non mesuré pour le laboratoire.
```

Non disponibles :

- délai de démarrage ;
- installation CUDA ;
- installation COLMAP ;
- test GPU ;
- test SfM ;
- arrêt ou destruction d'une instance.

## 16. Coût

```text
Non mesuré.
```

Aucune instance n'a été lancée et les prix en direct n'ont pas pu être
vérifiés. Il n'est donc pas possible de fournir honnêtement :

- un coût horaire ;
- un minimum de facturation ;
- un coût de stockage ;
- un coût de transfert ;
- un coût maximal du test ;
- un coût par reconstruction.

## 17. Problèmes

1. Aucun fournisseur GPU cloud n'est configuré dans le workspace.
2. Aucun credential de provisioning n'est disponible.
3. La recherche publique des tarifs actuels a échoué.
4. Aucun GPU NVIDIA local n'est présent.
5. CUDA et PyTorch CUDA sont indisponibles.
6. COLMAP est absent.
7. L'installation Nix de COLMAP est bloquée par une dépendance vulnérable.
8. Aucune implémentation 3DGS n'est sélectionnée.
9. Aucune vidéo réelle de rue n'est disponible.

Ces problèmes bloquent le provisioning et non l'architecture applicative
BurkinaWatch.

## 18. Sécurité

Le laboratoire n'a eu accès à :

- aucun secret ;
- aucun credential cloud ;
- aucune clé privée ;
- aucune base de production ;
- aucun stockage de production ;
- aucun endpoint public ;
- aucune donnée utilisateur réelle.

Les règles suivantes sont documentées dans `gpu-lab/README.md` :

- utiliser uniquement la vidéo synthétique ;
- ne pas monter le workspace complet ;
- ne pas envoyer d'URL signée ;
- ne pas connecter PostgreSQL ;
- ne pas exposer de port public inutile ;
- détruire l'instance après le test ;
- ne jamais committer un `.env` ou une clé.

## 19. Procédure de reproduction

### Préparer le dataset

Depuis la racine du dépôt :

```bash
node experiments/streetview-3d/runner.mjs \
  --input experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4 \
  --sample-fps 2 \
  --max-width 640 \
  --output experiments/streetview-3d/runs/gpu-lab-preflight
```

### Vérifier l'instance

Dans l'instance GPU temporaire, après avoir copié uniquement les artefacts
synthétiques :

```bash
./experiments/streetview-3d/gpu-lab/verify.sh
```

Le script doit afficher un `PRECHECK PASS` avant toute installation ou
exécution de COLMAP. Un échec doit arrêter la procédure.

### Versions

Compléter uniquement avec des valeurs observées :

```text
experiments/streetview-3d/gpu-lab/versions.env.example
```

Aucun Dockerfile n'est fourni avant validation d'une matrice réelle de
versions.

## 20. Procédure d'arrêt

```text
Non exécutée — aucune instance n'a été créée.
```

La future procédure devra :

1. arrêter les processus de test ;
2. exporter uniquement les artefacts synthétiques utiles ;
3. vérifier qu'aucun secret n'a été copié ;
4. supprimer le stockage temporaire ;
5. arrêter ou détruire l'instance depuis le fournisseur ;
6. conserver l'identifiant de run et les métriques hors secret ;
7. consigner l'heure et la durée d'utilisation.

Ne jamais laisser l'instance allumée en attente de la phase suivante.

## 21. Vérifications de production

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

Aucun traitement 3D payant n'a été lancé.

## 22. Recommandation

La Phase 12 reste `NO-GO` pour le provisioning.

La prochaine action nécessite une validation humaine d'un fournisseur GPU
temporaire, de son prix actuel et d'un plafond de dépense. Une seule instance
devra être créée, avec une cible initiale d'environ 24 Go de VRAM, puis
strictement limitée à :

```text
GPU → CUDA → PyTorch → COLMAP → premier SfM
```

MVS et 3DGS ne doivent pas commencer dans cette phase.