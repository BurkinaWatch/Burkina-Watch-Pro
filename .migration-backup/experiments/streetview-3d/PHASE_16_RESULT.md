# Phase 16 — Validation réelle du SfM CPU sur un runner externe isolé

## 1. Décision

```text
BLOCKED_EXTERNAL_CPU_RUNNER_REQUIRED
```

Le SfM CPU réel n'a pas pu être validé dans cette phase, car aucun runner
externe n'est accessible depuis ce workspace et aucun COLMAP exécutable n'est
présent localement.

Ce résultat ne signifie pas que COLMAP/SfM CPU est impossible. Il signifie que
la validation doit être réalisée dans un environnement externe, isolé,
reproductible et approuvé manuellement.

## 2. Objectif

Valider uniquement la chaîne suivante sur les 12 images synthétiques :

```text
12 JPEG
  → COLMAP feature extraction
  → matching
  → mapper
  → modèle sparse réel
```

La phase devait s'arrêter après le SfM sparse. Aucun MVS, meshing, 3DGS, NeRF,
géoréférencement, fusion ou publication n'était autorisé.

## 3. Règle de non-impact production

La phase n'a pas :

- modifié l'application ou le frontend ;
- modifié l'API ou PostgreSQL ;
- appliqué la migration 0010 ;
- modifié Railway, les secrets ou les variables de production ;
- connecté un worker externe à la queue ;
- créé de scène `streetview_scenes` ;
- publié de scène ou modifié la carte ;
- envoyé de donnée utilisateur vers un laboratoire ;
- lancé MVS ou 3DGS.

Le seul dataset autorisé est le dataset synthétique existant.

## 4. Environnement observé dans ce workspace

Cet environnement n'est pas le runner externe demandé :

| Élément | Valeur observée |
| --- | --- |
| OS | Linux x86_64, noyau `6.18.49 #Replit-Linux` |
| CPU | 4 vCPU, Intel Xeon Platinum 8581C @ 2.30 GHz |
| RAM totale | 7.8 GiB |
| RAM disponible pendant l'audit | 3.6 GiB |
| Swap | 0 B |
| Disque workspace | 256 GB, 254 GB disponibles |
| Disque `/tmp` | 32 GB, 32 GB disponibles |
| Architecture | `x86_64` |
| Node.js | `v20.20.0` |
| Python | `3.13.11` |
| FFmpeg | `6.1.2` |
| FFprobe | `6.1.2` |
| Docker | `27.5.1` |
| COLMAP | absent |

`command -v colmap` échoue et `colmap -h` ne peut donc pas être exécuté.
L'unique image Docker locale est `bluenviron/mediamtx:1.12.3`; aucune image
COLMAP n'est disponible.

## 5. Fournisseur et runner

```text
Fournisseur : aucun
Runner externe : non provisionné et non accessible
Identifiant de runner : UNSET
```

Aucun credential, accès SSH, compte cloud ou connexion fournisseur n'a été
inventé. Aucune carte bancaire ou authentification humaine n'a été demandée ou
contournée.

Comparaison préparatoire, sans prix inventé :

| Option | Coût horaire | CPU/RAM | Docker | Destruction | État |
| --- | --- | --- | --- | --- | --- |
| VM CPU temporaire approuvée | À vérifier officiellement | À vérifier | À vérifier | À vérifier | Non provisionnée |
| Runner batch CPU temporaire | À vérifier officiellement | À vérifier | À vérifier | À vérifier | Non provisionné |
| Machine externe déjà disponible | À vérifier humainement | À vérifier | À vérifier | Manuelle | Non accessible |

La sélection finale doit rester temporaire, sans dépense récurrente, et être
validée humainement avant création.

## 6. Coût et durée

```text
Coût externe : 0
Durée de laboratoire externe : non mesurée, aucun runner créé
```

La durée de l'audit local n'est pas une durée de calcul SfM et n'est pas
rapportée comme telle.

## 7. Versions et méthode d'installation COLMAP

COLMAP n'a pas été installé dans ce workspace.

La méthode Nix documentée lors des phases précédentes reste bloquée par une
dépendance FreeImage marquée vulnérable. La protection n'a pas été contournée :

```text
NIXPKGS_ALLOW_INSECURE=1 : non utilisé
```

Un Dockerfile candidat a été préparé dans `cpu-lab/Dockerfile`. Il utilise un
paquet COLMAP Ubuntu et des outils CPU, mais il n'a pas été construit ni
validé ici. Il ne constitue donc pas une preuve de reproductibilité ou de
disponibilité du paquet.

Les versions finales doivent être relevées dans le runner externe avec de
vraies commandes et consignées dans :

```text
experiments/streetview-3d/cpu-lab/versions.env.example
```

## 8. Dataset

Dataset autorisé :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/frames/
```

Vérifications réelles :

- 12 images JPEG ;
- résolution `640×360` pour chaque image ;
- taille cumulée `295617` octets ;
- fichiers reconnus comme JPEG valides par `identify`.

Le dataset provient de la vidéo synthétique contrôlée :

```text
experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4
```

La vidéo source mesure 6 secondes, contient 144 frames à 24 FPS, en H.264
640×360, sans audio. Elle est artificielle et ne représente pas une capture
de rue réelle.

## 9. Laboratoire préparé

Les fichiers suivants ont été créés dans `experiments/streetview-3d/cpu-lab/` :

- `README.md` : transfert minimal, procédure externe, provider et arrêt ;
- `Dockerfile` : recette candidate CPU à vérifier manuellement ;
- `verify.sh` : audit du runner, validation des 12 images et pipeline COLMAP
  optionnel après `RUN_SFM=true` ;
- `versions.env.example` : valeurs à remplir uniquement après observation ;
- `.gitignore` : exclusion des archives et artefacts du laboratoire.

Le script de laboratoire conserve les logs et durées de feature extraction,
matching et mapper. Il vérifie les fichiers `cameras.bin`, `images.bin` et
`points3D.bin` avant de considérer un modèle sparse comme produit.

## 10. Test SfM n°1

```text
NON EXÉCUTÉ
```

Le test externe n'a pas démarré. Les commandes suivantes n'ont pas été
exécutées :

```text
colmap feature_extractor
colmap exhaustive_matcher
colmap mapper
```

La cause est antérieure à l'extraction :

```text
ENVIRONMENT_BLOCKED
BLOCKED_EXTERNAL_CPU_RUNNER_REQUIRED
```

## 11. Métriques du test n°1

Toutes les métriques SfM sont explicitement non mesurées :

| Métrique | Résultat |
| --- | --- |
| Images input | 12 images préparées |
| Images enregistrées | `NOT_MEASURED` |
| Ratio d'enregistrement | `NOT_MEASURED` |
| Caméras | `NOT_MEASURED` |
| Points 3D | `NOT_MEASURED` |
| Observations | `NOT_MEASURED` |
| Erreur de reprojection | `NOT_MEASURED` |
| Modèles sparse | `NOT_MEASURED` |
| Durée feature extraction | `NOT_MEASURED` |
| Durée matching | `NOT_MEASURED` |
| Durée mapper | `NOT_MEASURED` |
| Durée SfM totale | `NOT_MEASURED` |
| RAM maximale | `NOT_MEASURED` |
| CPU utilisé par COLMAP | `NOT_MEASURED` |

Aucun zéro n'est utilisé comme valeur de remplacement et aucun modèle sparse
n'est déclaré.

## 12. Test SfM n°2

```text
NON EXÉCUTÉ
```

Le test de 20 à 30 images est conditionné à la réussite réelle du test n°1.
Cette condition n'est pas remplie.

## 13. Robustesse

Les cas de robustesse COLMAP n'ont pas été lancés, car le binaire et le runner
externe sont absents :

- dossier vide : `NOT_MEASURED` ;
- JPEG invalide : `NOT_MEASURED` ;
- interruption de processus : `NOT_MEASURED`.

Le script externe prévu s'arrêtera avec une erreur explicite si le dossier
d'entrée n'existe pas, ne contient pas exactement 12 JPEG ou contient une
dimension inattendue.

## 14. Erreurs exactes et blocages

Blocage observé :

```text
colmap: command not found
```

État du runner :

```text
BLOCKED_EXTERNAL_CPU_RUNNER_REQUIRED
```

Le Dockerfile candidat n'a pas été téléchargé ou construit dans cet
environnement. Aucun échec COLMAP après démarrage n'a donc été observé.

## 15. Artefacts

Artefacts source conservés :

- 12 images synthétiques existantes ;
- manifeste et `ffprobe.json` du run préparatoire ;
- métadonnées de la scène synthétique ;
- rapports des phases précédentes.

Artefacts de laboratoire préparés :

```text
experiments/streetview-3d/cpu-lab/
```

Aucun `database/`, `sparse/`, log COLMAP ou modèle sparse de Phase 16 n'existe,
car aucun runner externe n'a été disponible.

## 16. Limites

Cette phase ne permet pas de conclure sur :

- la faisabilité technique de COLMAP/SfM CPU en général ;
- la stabilité d'un matching exhaustif ;
- le nombre d'images enregistrées ;
- le nombre de points 3D ;
- la consommation RAM ;
- le temps de calcul ;
- la qualité de reprojection ;
- le comportement sur 20 à 30 images.

Elle établit seulement que la validation ne peut pas être faite honnêtement
dans le runner actuel.

## 17. Analyse

Le dataset est volontairement réduit et synthétique, ce qui convient à un
premier laboratoire. Une validation externe réussie prouverait la chaîne
logicielle sur cette scène artificielle, mais ne suffirait pas à valider les
vidéos de rue réelles, le GPS, la qualité terrain, MVS ou 3DGS.

À l'inverse, un échec sur ce dataset devrait être analysé selon la version
COLMAP, les dépendances, les paramètres, la texture, la parallaxe et la
trajectoire avant toute conclusion sur le CPU.

## 18. Impact sur l'architecture

L'architecture applicative ne change pas :

- `ReconstructionEngine` reste la frontière d'abstraction ;
- `CpuReconstructionEngine` reste expérimental et non validé ;
- aucune queue de production n'appelle COLMAP ;
- aucune scène n'est créée ;
- aucune migration ou activation du worker n'est déclenchée ;
- aucun viewer public n'est ajouté.

Même si le futur test externe réussit, son résultat devra rester dans le
laboratoire jusqu'à une décision séparée.

## 19. Recommandation Phase 17

Ne pas lancer automatiquement la Phase 17.

La prochaine étape nécessite une validation humaine d'un runner CPU temporaire
disposant idéalement de 4 à 8 vCPU, 16 à 32 GB de RAM et au moins 20 GB de
disque. Dans ce runner :

1. relever l'OS, l'architecture, le CPU, la RAM, le disque, Docker et COLMAP ;
2. construire ou installer COLMAP selon une méthode vérifiable ;
3. exécuter `bash experiments/streetview-3d/cpu-lab/verify.sh` ;
4. transférer uniquement les 12 JPEG ;
5. lancer `RUN_SFM=true` après un preflight réussi ;
6. inspecter les logs et le modèle sparse réel ;
7. conserver les métriques observées et détruire le runner ;
8. attendre une validation humaine avant toute autre phase.

La suite ne devra toujours pas lancer MVS, 3DGS, fusion, publication ou
intégration production automatiquement.