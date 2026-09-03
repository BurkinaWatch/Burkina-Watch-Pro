# Baseline Drizzle de Railway

**Statut au 3 septembre 2026 : READY WITH CONDITIONS**

Ce document décrit la baseline sûre de la base PostgreSQL Railway existante.
Il ne constitue pas une autorisation d'exécuter une migration de production.

## État vérifié avant toute modification

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

## Point de restauration et test de restauration

Un dump logique custom a été produit avec un client PostgreSQL 17.6, compatible
avec le serveur Railway PostgreSQL 17.11. Il a été vérifié avec `pg_restore
--list` et restauré avec `pg_restore --exit-on-error` dans une instance
PostgreSQL 17 éphémère locale, sans écriture sur Railway.

La restauration de test a confirmé :

- 29 tables publiques ;
- 63 index publics ;
- aucun journal Drizzle ;
- le même default absent sur `online_sessions.id`.

Ce test prouve que le dump logique est restaurable. Il **ne prouve pas**
l'existence d'un snapshot géré par Railway, ni la restauration d'un snapshot
Railway dans son interface. Le fichier de backup de test est resté hors du
dépôt et n'est pas une sauvegarde de production à conserver. Avant toute
écriture sur Railway, une personne habilitée doit donc encore :

1. créer ou sélectionner un snapshot/backup Railway ;
2. confirmer son identifiant, son horodatage et sa disponibilité dans Railway ;
3. effectuer ou valider un test de restauration selon la procédure Railway ;
4. conserver le point de restauration pendant toute l'opération.

Sans cette validation, `0004` ne doit pas être appliquée.

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

## Conditions d'application de `0004`

L'application exige une validation humaine explicite de la méthode ci-dessus et
du point de restauration. Une fois ces deux validations acquises, la procédure
doit être :

1. Rejouer `npm run db:railway:preflight` et conserver sa sortie.
2. Vérifier que la cible est `RAILWAY_DATABASE_URL`, sans afficher sa valeur.
3. Vérifier le snapshot/backup restaurable et les compteurs de référence.
4. Exécuter `0004_runtime_alignment_draft.sql` avec un mécanisme migrateur
   contrôlé approuvé lors de la revue, jamais avec `db:push`.
5. Vérifier immédiatement, en lecture seule :
   - les 29 tables ;
   - les compteurs des cinq tables ciblées ;
   - les 9 index attendus ;
   - `online_sessions.id` avec `DEFAULT gen_random_uuid()` ;
   - les 29 primary keys, 22 foreign keys et 6 contraintes uniques ;
   - le journal Drizzle créé par le migrateur, avec l'entrée de baseline
     attendue et sans entrée historique inventée.
6. En cas d'anomalie, arrêter l'opération et restaurer le point validé plutôt
   que tenter une réparation improvisée.

## Verdict

La structure Railway est stable et le dump logique de test est restaurable.
La baseline Drizzle a une méthode candidate démontrée sur une copie, mais elle
n'est pas appliquée. Le snapshot Railway restaurable et la revue humaine
restent des prérequis; le verdict est donc **READY WITH CONDITIONS**, et non
`READY`.