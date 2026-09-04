# Phase 9.1 — Railway preflight

Date d’exécution : 4 septembre 2026  
Mode : **lecture seule**

Commande exécutée :

```text
npm run db:railway:preflight
```

## VERIFIED

- 29/29 tables publiques attendues.
- Structure exacte : `PASS`.
- `gen_random_uuid()` disponible et exécutable.
- SQL de `0004_runtime_alignment_draft.sql` : `PASS` pour les opérations
  autorisées par le script.
- Compteurs observés :
  - `commentaires` : 0
  - `notifications` : 0
  - `online_sessions` : 6
  - `signalements` : 0
  - `tracking_sessions` : 0
- Les neuf index attendus par 0004 sont absents.
- `online_sessions.id` est de type `text` sans default.
- La commande a conclu : `Précontrôle lecture seule: PASS — aucune
  modification exécutée`.

## Présence des variables observée

Contrôle effectué sans afficher de valeur :

| Variable ou groupe | Résultat |
|---|---|
| `RAILWAY_DATABASE_URL` | `PRESENT` |
| `DATABASE_URL` | `PRESENT` |
| `SESSION_SECRET` | `PRESENT` |
| `MASTER_ENCRYPTION_KEY` | `PRESENT` |
| `REFRESH_TOKEN_SALT` | `ABSENT` |
| Variables Media Gateway | `ABSENT` — gateway inactive dans l’environnement |
| Variables STUN/TURN | `ABSENT` — aucun transport relay activé |

## NOT VERIFIED / BLOCKED

- Le journal `__drizzle_migrations` est absent.
- Aucun snapshot restaurable n’a été fourni ou vérifié par cette commande.
- La baseline Drizzle n’est pas validée.
- La présence des tables des migrations 0005, 0006 et 0007 n’est pas établie
  dans cette base ; la structure exacte observée ne les inclut pas.
- Service Railway, healthcheck, domaine, ports, runtime et logs de déploiement :
  **NOT VERIFIED** dans ce preflight.
- Le workflow local a confirmé l’écart runtime : `GET
  /api/surveillance/cameras` retourne `500` avec `relation
  "surveillance_cameras" does not exist`.

## Décision

Ne pas appliquer 0004, 0005, 0006 ou 0007. Ne pas lancer `db:push`, reset ou
DDL. Une revue humaine doit d’abord établir un snapshot restaurable et une
baseline Drizzle cohérente.