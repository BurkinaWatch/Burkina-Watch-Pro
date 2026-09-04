# Application contrôlée du schéma surveillance Railway

Date de référence : 4 septembre 2026

Ce runbook décrit l’application forward-only des migrations `0004` à `0007`
sur PostgreSQL Railway. Il ne remplace pas une sauvegarde gérée Railway et ne
réactive pas `db:push`.

## État vérifié

- PostgreSQL Railway : serveur 17.11.
- Sauvegarde logique custom créée avec `pg_dump` 17.5 avant écriture et
  vérifiée avec `pg_restore --list`; le fichier est resté hors du dépôt.
- `0004_runtime_alignment_draft.sql`, `0005_surveillance_cameras.sql`,
  `0006_camera_agents.sql` et `0007_agent_media_sessions.sql` appliquées dans
  une transaction unique.
- Précontrôle post-migration : `33/33` tables, structure exacte PASS,
  `gen_random_uuid()` disponible, index `0004` présents, tables et index
  surveillance présents.
- Les migrations ne contiennent aucune suppression de données. Les tables
  surveillance ont été créées vides.
- `__drizzle_migrations` reste absent. La procédure active repose sur le runner
  contrôlé et non sur `drizzle-kit migrate`, afin de ne pas rejouer `0000` à
  `0003`.

## Procédure reproductible

### 1. Vérifier la cible sans afficher le secret

```bash
test -n "$RAILWAY_DATABASE_URL"
npm run db:railway:preflight
```

Le preflight doit être exécuté avant et après l’opération. Avant l’application,
il peut signaler l’absence des quatre tables surveillance et des neuf index de
`0004`; cela constitue l’état attendu de la base historique.

### 2. Créer une sauvegarde compatible avec le serveur

Le client `pg_dump` doit être de la même version majeure que le serveur ou plus
récent. Pour le serveur Railway 17.11 :

```bash
backup="$(mktemp /tmp/burkinawatch-railway-before-surveillance-XXXXXX.dump)"
pg_dump --format=custom --no-owner --no-privileges \
  --file "$backup" "$RAILWAY_DATABASE_URL"
pg_restore --list "$backup" >/tmp/burkinawatch-railway-before-surveillance.list
```

Conserver ce fichier hors dépôt pendant la fenêtre de vérification. Le runner
ne crée ni ne supprime de sauvegarde.

### 3. Appliquer les migrations

Cette commande est intentionnellement protégée par une variable d’autorisation
explicite :

```bash
ALLOW_RAILWAY_SURVEILLANCE_MIGRATION=true \
  npm run db:railway:apply-surveillance
```

Le runner :

1. exige `RAILWAY_DATABASE_URL` et `public.users` ;
2. prend un verrou advisory transactionnel ;
3. refuse une migration partiellement présente ;
4. exécute les quatre fichiers dans une transaction ;
5. vérifie les quatre tables et les 19 index attendus avant `COMMIT`.

Sans `ALLOW_RAILWAY_SURVEILLANCE_MIGRATION=true`, aucune connexion d’écriture
n’est tentée.

### 4. Vérifier puis laisser le service reprendre

```bash
npm run db:railway:preflight
npm run check
npm run build
```

Les compteurs `surveillance_cameras`, `camera_agents`,
`agent_camera_bindings` et `agent_media_sessions` doivent être à zéro tant
qu’aucune caméra ou agent n’a été enrôlé. Les compteurs des tables métier
existantes peuvent évoluer pendant que l’application tourne ; ils doivent être
interprétés avec l’heure de la sauvegarde, pas comparés à zéro.

## Interdictions

- Ne pas lancer `npm run db:push`, `drizzle-kit push` ou `drizzle-kit migrate`
  avec le dossier historique actuel.
- Ne pas rejouer `0000` à `0003`.
- Ne pas créer manuellement `__drizzle_migrations`.
- Ne pas ouvrir de port RTSP public, activer UPnP/DMZ ou activer STUN/TURN sans
  preuve réseau réelle.
- Ne pas restaurer le dump par-dessus Railway sans validation explicite de
  l’impact et du point de restauration.