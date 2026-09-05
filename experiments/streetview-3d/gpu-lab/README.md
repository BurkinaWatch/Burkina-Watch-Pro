# GPU Lab — laboratoire 3D temporaire

Ce dossier décrit le laboratoire GPU expérimental prévu pour le pipeline
Street View 3D. Il n'est pas connecté à BurkinaWatch, à PostgreSQL, au
stockage de production ou au workflow utilisateur.

## État actuel

```text
NON PROVISIONNÉ
```

Aucun fournisseur n'a été sélectionné, aucune instance n'a été lancée et
aucun coût n'a été engagé. Les valeurs de version restent volontairement
indéfinies tant qu'une image CUDA/PyTorch/COLMAP compatible n'a pas été
validée dans une instance temporaire.

Le service de recherche publique n'a pas permis de vérifier les tarifs actuels.
Les prix, la disponibilité et les conditions de facturation doivent être
confirmés sur la page officielle du fournisseur avant toute création
d'instance.

## Périmètre autorisé

Le laboratoire peut recevoir uniquement :

- `synthetic-streetview-phase7c.mp4` ;
- les frames synthétiques de test ;
- les manifests expérimentaux ;
- les artefacts produits par COLMAP ou les tests ultérieurs.

Il ne doit jamais recevoir :

- une vidéo utilisateur réelle sans validation humaine spécifique ;
- des secrets de l'application ;
- une URL signée de production ;
- un accès PostgreSQL ;
- une copie du stockage BurkinaWatch ;
- une clé privée ou un fichier `.env` contenant des credentials.

## Préflight local

Le script de vérification ne fait aucune installation et ne lance aucun
traitement long :

```bash
./verify.sh
```

Il inspecte :

- `nvidia-smi` ;
- GPU et VRAM ;
- Python ;
- PyTorch et `torch.cuda` ;
- CUDA visible ;
- COLMAP.

Il doit être exécuté dans l'instance GPU temporaire après installation. Un
échec est bloquant ; il ne faut pas poursuivre vers MVS ou 3DGS.

## Dataset synthétique

Depuis la racine du dépôt :

```bash
node experiments/streetview-3d/runner.mjs \
  --input experiments/streetview-3d/runs/phase7c-synthetic/synthetic-streetview-phase7c.mp4 \
  --sample-fps 2 \
  --max-width 640 \
  --output experiments/streetview-3d/runs/gpu-lab-preflight
```

Copier uniquement le résultat synthétique dans l'instance, dans un répertoire
de travail temporaire. Ne pas monter le workspace complet et ne pas connecter
le laboratoire à la production.

## Versions à figer

Compléter `versions.env.example` dans l'environnement expérimental, puis
copier les valeurs mesurées dans le rapport Phase 12. Ne pas remplir ces
valeurs avec des versions supposées.

Un Dockerfile sera ajouté seulement après validation d'une combinaison réelle
OS + driver + CUDA + Python + PyTorch + COLMAP. Une image générique non testée
donnerait une fausse impression de reproductibilité.

## Ordre de validation

1. vérifier le GPU et la VRAM ;
2. vérifier CUDA et PyTorch ;
3. vérifier `colmap --help` et la version ;
4. tester COLMAP sur quelques frames ;
5. confirmer un premier résultat SfM ;
6. arrêter et documenter si l'une de ces étapes échoue ;
7. ne pas lancer MVS ou 3DGS dans cette Phase 12.

## Arrêt

Après le test minimal, arrêter ou détruire l'instance immédiatement. Les
procédures dépendront du fournisseur retenu et devront être consignées avant
le lancement.