# Phase 16 — laboratoire CPU COLMAP isolé

Ce dossier prépare un runner externe temporaire pour valider uniquement :

```text
12 JPEG synthétiques → COLMAP feature extraction
                    → matching
                    → mapper
                    → modèle sparse
```

Il n'est pas connecté à BurkinaWatch, PostgreSQL, Railway, Object Storage, la
queue Street View ou le worker de production.

## État dans ce workspace

```text
BLOCKED_EXTERNAL_CPU_RUNNER_REQUIRED
```

Le workspace Replit ne dispose pas de COLMAP et aucun runner externe n'est
accessible automatiquement. Le Dockerfile ci-dessous est une recette
candidate à valider dans un environnement externe ; aucune image n'a été
construite ou téléchargée ici.

Le fournisseur, le coût, la disponibilité et les versions finales restent
`UNSET`. Aucun serveur permanent et aucune dépense n'ont été engagés.

## Dataset autorisé

Copier uniquement ce dossier vers le laboratoire :

```text
experiments/streetview-3d/runs/phase7b-on-synthetic-v2/frames/
```

Il contient 12 JPEG synthétiques, 640×360, pour 295617 octets cumulés.
Ne jamais copier le workspace complet, une vidéo utilisateur, un fichier `.env`,
un secret, une URL signée ou une base de données.

Créer une archive minimale depuis la racine du dépôt :

```bash
tar -czf /tmp/phase16-cpu-images.tgz \
  -C experiments/streetview-3d/runs/phase7b-on-synthetic-v2 frames
sha256sum /tmp/phase16-cpu-images.tgz
```

Transférer cette archive manuellement vers un runner externe approuvé, puis
extraire uniquement son contenu dans `input/`.

## Méthode candidate Docker

Le Dockerfile utilise un paquet COLMAP distribué par Ubuntu avec des outils
CPU. Il doit être construit et vérifié dans le runner externe avant toute
conclusion :

```bash
docker build --tag burkinawatch-cpu-sfm:phase16 ./cpu-lab
```

Si le paquet n'est pas disponible ou si sa version ne peut pas être vérifiée,
arrêter la tentative et documenter `INSTALLATION_BLOCKED`. Ne pas utiliser
`NIXPKGS_ALLOW_INSECURE=1` et ne pas désactiver une protection de sécurité.

## Préflight externe

Depuis `cpu-lab/` dans le runner :

```bash
bash verify.sh
```

Le préflight doit consigner `uname`, architecture, CPU, RAM, disque, Docker,
Python, FFmpeg, FFprobe, SQLite et `colmap -h`. Il ne lance pas SfM sans
`RUN_SFM=true`.

## Test SfM 1

Après un préflight réussi uniquement :

```bash
mkdir -p phase16-cpu-sfm/input phase16-cpu-sfm/output
tar -xzf /tmp/phase16-cpu-images.tgz -C phase16-cpu-sfm/input --strip-components=1

docker run --rm \
  -e RUN_SFM=true \
  -e COLMAP_THREADS=4 \
  -v "$PWD/phase16-cpu-sfm/input:/lab/input:ro" \
  -v "$PWD/phase16-cpu-sfm/output:/lab/output" \
  burkinawatch-cpu-sfm:phase16
```

Le script lance uniquement `feature_extractor`, `exhaustive_matcher` puis
`mapper`. Il conserve stdout, stderr, durées et sortie sparse. Il s'arrête
immédiatement si une étape échoue.

Les paramètres sont volontairement conservateurs :

- CPU uniquement ;
- 4 threads par défaut ;
- caméra unique ;
- SIFT CPU ;
- matching exhaustif adapté à 12 images ;
- aucun MVS, meshing, 3DGS, NeRF ou viewer.

## Provider et coût

Aucun fournisseur n'est choisi automatiquement. Avant toute dépense, le
propriétaire doit comparer sur les pages officielles actuelles :

| Option | Coût horaire | CPU/RAM | Docker | Destruction | État |
| --- | --- | --- | --- | --- | --- |
| VM CPU temporaire approuvée | À vérifier | À vérifier | À vérifier | À vérifier | Non provisionnée |
| Runner batch CPU temporaire | À vérifier | À vérifier | À vérifier | À vérifier | Non provisionné |
| Machine externe déjà disponible | À vérifier | À vérifier | À vérifier | Manuel | Non accessible |

Aucun prix n'est inventé et aucune carte bancaire ou authentification humaine
ne doit être contournée.

## Artefacts attendus

Conserver les résultats uniquement dans un répertoire de laboratoire ignoré :

```text
phase16-cpu-sfm/
├── input/
├── output/
│   ├── logs/
│   ├── database/
│   ├── sparse/
│   └── metrics.json
└── report/
```

Après le test, détruire le runner externe et conserver uniquement les logs et
mesures nécessaires au rapport. Ne pas importer les résultats dans
`streetview_scenes` et ne pas connecter l'expérience à l'application.