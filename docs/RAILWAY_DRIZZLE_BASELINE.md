# Baseline Drizzle de Railway

**Statut au 4 septembre 2026 : SCHÉMA APPLIQUÉ — BASELINE DRIZZLE DISTINCTE NON CRÉÉE**

Ce document conserve l'analyse de baseline de la base PostgreSQL Railway
existante. L'application opérationnelle de `0004` à `0007` est documentée dans
[`RAILWAY_SURVEILLANCE_MIGRATION.md`](RAILWAY_SURVEILLANCE_MIGRATION.md).

## État post-migration vérifié le 4 septembre 2026

- 33/33 tables publiques attendues ; structure exacte : `PASS`.
- `0004` à `0007` ont été appliquées par le runner transactionnel contrôlé.
- Les neuf index de `0004`, les quatre tables surveillance et leurs dix index
  sont présents.
- Les quatre tables surveillance sont vides ; aucun enregistrement métier
  existant n'a été supprimé par ces migrations DDL.
- Un dump logique PostgreSQL 17.5 a été créé avant l'écriture et vérifié avec
  `pg_restore --list`, hors dépôt.
- `__drizzle_migrations` est toujours absent. Il n'a pas été créé
  artificiellement et les migrations historiques `0000` à `0003` n'ont pas été
  rejouées.

## État historique vérifié avant l'application

Le précontrôle lecture seule a été exécuté avec :

```bash
npm run db:railway:preflight
```

Résultats observés :

| Contrôle | Résultat |
| --- | --- |
| Tables publiques | 29/29, ensemble exact |
| Primary keys | 29 |
| Foreign keys | 22 |
| Contraintes uniques | 6 |
| Index publics | 63 au total |
| Index secondaires attendus par `0004` | 9 absents |
| Index secondaires inattendus sur les tables ciblées | Aucun |
| `gen_random_uuid()` | Disponible et exécutable |
| `online_sessions.id` | `text`, default absent |
| Lignes ciblées (`commentaires`, `notifications`, `online_sessions`, `signalements`, `tracking_sessions`) | Premier précontrôle : `0, 0, 0, 0, 0`; second précontrôle : `0, 0, 1, 0, 0` |
| `__drizzle_migrations` | Absent |
| Audit SQL de `0004` | PASS : 9 `CREATE INDEX IF NOT EXISTS`, puis un default; aucun `DROP`, `TRUNCATE` ou `DELETE` |

Les migrations historiques `0000` à `0003` restent dans le dépôt et ne doivent
pas être rejouées sur cette base existante. `npm run db:push` reste désactivé.

La différence sur `online_sessions` entre les deux lectures montre qu'une
écriture externe a eu lieu pendant cette phase. Les deux précontrôles étaient
en lecture seule; le compteur final à `1` doit donc être repris comme nouvelle
référence par la revue humaine, et non remplacé par l'ancienne valeur.

## Point de restauration

Un dump logique custom a été produit avec un client PostgreSQL 17.5, compatible
avec le serveur Railway PostgreSQL 17.11, puis vérifié avec `pg_restore --list`.
Le fichier est resté hors du dépôt. Cette vérification confirme l'intégrité de
l'archive, mais ne prouve pas l'existence d'un snapshot géré par Railway ni un
test de restauration dans l'interface Railway. Pour une prochaine opération,
une personne habilitée doit :

1. créer ou sélectionner un snapshot/backup Railway ;
2. confirmer son identifiant, son horodatage et sa disponibilité dans Railway ;
3. effectuer ou valider un test de restauration selon la procédure Railway ;
4. conserver le point de restauration pendant toute l'opération.

Cette exigence reste applicable à toute prochaine migration de production.

## Méthode de baseline retenue pour revue humaine

La méthode candidate est non destructive et ne fabrique pas le journal :

1. Générer une migration custom vide avec `drizzle-kit generate --custom`
   dans un dossier de migrations isolé dédié à la baseline.
2. Vérifier que le SQL généré est vide (commentaire uniquement) et que le
   dossier ne contient aucune migration historique.
3. Utiliser `drizzle-kit migrate` avec une configuration temporaire pointant
   exclusivement vers ce dossier.
4. Laisser le migrateur Drizzle créer son propre schéma `drizzle` et sa table
   `__drizzle_migrations`, puis enregistrer la migration custom via son chemin
   normal.
5. Utiliser ensuite ce dossier comme nouvelle racine des migrations
   incrémentales; conserver les fichiers `0000` à `0003` dans leur emplacement
   historique, sans les exécuter.

Cette méthode a été validée techniquement sur la copie locale restaurée :
`generate --custom` a produit un fichier SQL vide, puis `migrate` a créé
`drizzle.__drizzle_migrations` et laissé les 29 tables et 63 index publics
inchangés. Cette validation locale n'est pas une validation humaine de
production et n'a pas modifié la configuration active du projet.

### Interdictions

- Ne pas insérer directement une ligne dans `__drizzle_migrations`.
- Ne pas créer manuellement le schéma interne Drizzle.
- Ne pas lancer `drizzle-kit migrate` avec le dossier actuel `migrations/` tant
  que le journal est absent : cela tenterait de rejouer `0000` à `0003`.
- Ne pas utiliser `db:push`, `db:push --force` ou `drizzle-kit push`.
- Ne pas modifier les données métier, les clés existantes ou les migrations
  historiques.

## Conditions pour une prochaine migration

La procédure doit être :

1. Rejouer `npm run db:railway:preflight` et conserver sa sortie.
2. Vérifier que la cible est `RAILWAY_DATABASE_URL`, sans afficher sa valeur.
3. Vérifier le snapshot/backup restaurable et les compteurs de référence.
4. Ajouter une migration forward-only et l'exécuter avec un runner contrôlé,
   jamais avec `db:push`.
5. Vérifier immédiatement, en lecture seule :
   - les 33 tables actuelles ;
   - les compteurs des cinq tables ciblées ;
   - les 9 index attendus ;
   - `online_sessions.id` avec `DEFAULT gen_random_uuid()` ;
   - les 29 primary keys, 22 foreign keys et 6 contraintes uniques ;
   - l'absence ou la présence du journal Drizzle selon la stratégie de migration
     explicitement approuvée, sans entrée historique inventée.
6. En cas d'anomalie, arrêter l'opération et restaurer le point validé plutôt
   que tenter une réparation improvisée.

## Verdict

La structure Railway est stable, les migrations surveillance sont appliquées et
le preflight post-migration est `PASS`. La baseline Drizzle historique n'a pas
été fabriquée et reste une décision séparée pour les futures migrations.