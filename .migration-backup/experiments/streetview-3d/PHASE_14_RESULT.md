# Phase 14 — Préparation CPU-first Street View et frontière de reconstruction

## Verdict

```text
GO pour la préparation CPU contrôlée
NO-GO pour la reconstruction 3D et toute publication de scène
```

Cette phase valide uniquement la préparation locale et réversible des vidéos
Street View. Elle ne valide ni COLMAP/SfM, ni MVS, ni 3DGS, ni NeRF, ni un
fournisseur GPU.

## 1. Ce qui est effectivement exécuté

Le worker peut maintenant :

```text
objet privé → inspection FFprobe → métriques observées
           → extraction FFmpeg optionnelle de keyframes
           → stockage privé des keyframes
           → attente explicite d'un moteur validé
```

Les keyframes sont des artefacts réels produits par FFmpeg. Les métadonnées
enregistrées comprennent notamment le format, le codec, les dimensions, la
durée, la fréquence d'image et le nombre de keyframes effectivement produites.
Les sorties sont limitées par une fréquence et un nombre maximal configurables.

## 2. États et idempotence

Les résultats de préparation sont explicites :

- `READY` : métadonnées et au moins une keyframe ont été produites ;
- `PARTIAL` : métadonnées disponibles, mais keyframes désactivées, impossibles
  ou absentes ;
- `UNAVAILABLE` : FFprobe n'est pas disponible sur le worker.

Après la préparation, la contribution passe à :

- `WAITING_FOR_GPU` si aucun moteur SfM CPU validé n'est activé ;
- `WAITING_FOR_RECONSTRUCTION` si le moteur de reconstruction reste
  indisponible ou non validé.

Une contribution déjà terminée avec un de ces états, ou avec l'ancien état
`WAITING_FOR_3D`, est traitée de manière idempotente et ne relance pas la
préparation.

## 3. Frontière de reconstruction

L'abstraction `ReconstructionEngine` existe pour isoler un futur adaptateur.
La détection de COLMAP seule ne suffit pas : même si le binaire est présent,
aucun résultat n'est marqué disponible tant qu'un adaptateur validé sur le
dataset cible n'existe pas.

En conséquence :

- aucune ligne `streetview_scenes` n'est créée par cette phase ;
- aucun artefact GLB, 3D Tiles, nuage de points ou splat n'est simulé ;
- l'endpoint des scènes reconstruites ne renvoie que les scènes publiées ;
- l'ancien endpoint Ouaga 3D reste séparé pour compatibilité.

## 4. Validation automatisée

Les tests Phase 14 couvrent :

- extraction de métadonnées et stockage de keyframes produites ;
- absence de FFprobe ;
- absence de FFmpeg ;
- nettoyage du répertoire temporaire ;
- transitions d'attente ;
- idempotence des contributions déjà préparées ;
- absence de moteur de reconstruction validé ;
- sélection des keyframes à supprimer avec une contribution ;
- caractère forward-only de la migration `0010`.

Les contrôles à exécuter avant livraison sont :

```bash
npm run check
npm run test:streetview
git diff --check
npm run build
```

## 5. Migration et production

Le 5 septembre 2026, une sauvegarde logique PostgreSQL Railway a été créée avec
`pg_dump` 17.5 et vérifiée avec `pg_restore --list`, puis le précontrôle
lecture seule a confirmé la structure complète avant toute écriture. La
migration `0009` manquante a d'abord été appliquée et vérifiée dans sa
transaction contrôlée. La migration
`0010_streetview_cpu_first.sql` a ensuite été appliquée une seule fois avec le
runner Phase 14.

Le précontrôle post-migration a confirmé :

- 37/37 tables publiques, structure exacte ;
- les six colonnes de queue Phase 5 et les sept colonnes CPU-first ;
- les tables `streetview_scenes` et `streetview_scene_artifacts` ainsi que
  leurs trois index ;
- zéro perte sur les compteurs Street View existants ;
- aucune entrée `streetview_scenes` ou `streetview_scene_artifacts` créée par
  la migration.

Le worker dédié refuse désormais de démarrer sans :

```text
STREETVIEW_PHASE14_ENABLED=true
```

Après la vérification post-migration, cette variable est désormais activée dans
l'environnement partagé. Elle ne doit être retirée ou réactivée qu'après une
nouvelle sauvegarde, un précontrôle lecture-seule et une vérification complète
du schéma. `db:push` reste interdit.

## 6. Limites et décision suivante

La Phase 14 ne mesure pas de reconstruction réelle et ne doit pas déclencher
la Phase 15 automatiquement. Aucun GPU permanent, viewer public, traitement
automatique utilisateur ou moteur non validé ne doit être ajouté avant une
validation séparée sur un dataset approprié.