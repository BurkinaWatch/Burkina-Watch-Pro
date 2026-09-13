# Garde-fou des opérations Railway

Cette procédure s'applique à toute opération qui peut modifier l'environnement
Railway, la base de production ou la disponibilité du service.

## Règle non négociable

Un diagnostic en lecture seule peut être exécuté sans confirmation. Toute
opération d'écriture, de migration, de modification de configuration, de
secret, de redéploiement ou de suppression doit être proposée puis confirmée
explicitement dans le tour courant.

Une confirmation générale, ancienne ou implicite ne vaut pas confirmation pour
une autre opération. En cas de doute, l'opération n'est pas exécutée.

## Phase 1 — Diagnostic obligatoire en lecture seule

Avant toute proposition d'écriture, recueillir et afficher sans modifier
Railway :

1. le projet ciblé ;
2. l'environnement (`production`, `staging`, etc.) ;
3. le service ;
4. le commit ou la version concernée ;
5. l'état actuel du déploiement et les logs nécessaires ;
6. l'état du schéma attendu par le code et les éventuelles divergences ;
7. les variables nécessaires, sans afficher de secret.

Cette phase ne doit effectuer aucune migration, aucun `push`, aucun changement
de variable, aucun redéploiement et aucune suppression.

La cible doit être vérifiée par son identifiant et son environnement, jamais
déduite uniquement d'un nom de domaine ou d'un contexte précédent. Conserver
la cible diagnostiquée comme une empreinte immuable composée du projet, de
l'environnement et du service. Juste avant toute proposition ou action
mutante, comparer cette empreinte à la cible reçue dans la confirmation.

Si le projet, l'environnement ou le service ne correspond pas à la cible
diagnostiquée, arrêter immédiatement, avant d'appeler la commande d'écriture,
la migration, le redéploiement ou toute autre action mutante. Une confirmation
de la nouvelle cible ne réautorise pas l'action : elle exige un nouveau
diagnostic complet et une nouvelle proposition.


### Opérations longues ou asynchrones

Une opération longue conserve l'empreinte capturée au diagnostic pendant toute
sa durée. Elle ne remplace jamais cette empreinte par une cible relue en cours
d'opération.

Avant chaque étape mutante, relire la cible Railway par identifiant de projet,
d'environnement et de service, puis comparer cette lecture à l'empreinte
diagnostiquée. Cette relecture est obligatoire même si l'étape précédente a
réussi, si l'opération est asynchrone ou si la confirmation initiale est
toujours valide.

À la première divergence, arrêter l'opération avant l'écriture de l'étape
concernée et ne lancer aucune étape suivante. Le rapport doit distinguer les
étapes déjà exécutées de l'étape bloquée, indiquer l'empreinte diagnostiquée et
la cible relue, puis demander un nouveau diagnostic complet avant toute reprise.

## Phase 2 — Proposition obligatoire avant écriture

Présenter une proposition complète avant d'appeler une action mutante. Elle
doit contenir exactement les informations utiles à la décision :

| Élément | Valeur à présenter |
| --- | --- |
| Projet | Nom et identifiant Railway |
| Environnement | Nom et identifiant |
| Service | Nom et identifiant |
| Action | Opération précise et commande prévue |
| Diff attendu | Fichiers, schéma, variables ou version qui changent |
| Risques | Indisponibilité, perte ou transformation de données, exposition |
| Préconditions | Snapshot, sauvegarde, validation, accès et fenêtre |
| Retour arrière | Procédure réellement disponible et limite connue |
| Vérification | Contrôles à exécuter après l'action |

Si le diff attendu, la cible ou le retour arrière ne peuvent pas être décrits,
ne pas exécuter l'action. Une action destructive sans retour arrière vérifiable
est refusée jusqu'à ce qu'une procédure séparée soit définie.

## Point d'arrêt et confirmation explicite

Après la proposition, s'arrêter et demander une confirmation qui reprend la
cible et l'action. Utiliser une demande non ambiguë, par exemple :

> Confirmez-vous l'action Railway suivante : `[action]` sur
> `[projet] / [environnement] / [service]`, avec le diff `[diff]` et les
> risques `[risques]` ?

N'exécuter qu'après une réponse explicite qui confirme cette action précise.
Une réponse vague, une absence de réponse, une nouvelle cible ou une demande
de diagnostic supplémentaire signifie : ne pas exécuter.

## Opérations toujours protégées

Les opérations suivantes nécessitent leur propre confirmation explicite :

- migration, DDL, `db push`, écriture ou suppression de données ;
- modification, ajout ou suppression de variable d'environnement ou de secret ;
- redéploiement, changement de commande de build ou de démarrage ;
- suppression, renommage, reset, restauration ou remplacement d'un service ;
- `push --force`, réécriture d'historique ou action équivalente ;
- changement de projet, d'environnement ou de service par rapport au diagnostic.

Les suppressions, renommages inattendus, diffs destructifs et divergences de
cible imposent un arrêt immédiat. Ils ne peuvent pas être couverts par une
confirmation générale.

### Contrôle de cohérence de cible

Le contrôle compare toujours les trois valeurs suivantes :

| Valeur | Source |
| --- | --- |
| Projet | Identifiant capturé pendant le diagnostic |
| Environnement | Identifiant capturé pendant le diagnostic |
| Service | Identifiant capturé pendant le diagnostic |

En cas de divergence, l'opération mutante est bloquée avant toute écriture.
Le rapport ne doit pas s'arrêter à la première divergence. Il doit indiquer,
sans secret, chaque valeur comparée :

- la cible diagnostiquée (projet, environnement, service) ;
- la cible reçue (projet, environnement, service) ;
- chaque valeur divergente et la raison de l'arrêt ;
- la confirmation que l'action a été bloquée avant toute écriture.
- pour une opération longue, les étapes déjà exécutées et l'étape bloquée avant
  sa mutation.

Quand plusieurs identifiants divergent dans la même opération, le rapport les
énumère tous dans la même cause de blocage. Une correction partielle ou un
rapport qui ne signale que le premier écart est insuffisant.

## Règles spécifiques au schéma et au démarrage

- `DATABASE_URL` est la seule variable PostgreSQL prise en charge par l'API,
  Drizzle, les sessions et les contrôles de production.
- Le démarrage Railway ne lance pas de migration : `scripts/pre-start.sh` doit
  rester un wrapper de démarrage uniquement.
- Le build Railway défini dans `railway.json` ne doit pas être remplacé par une
  commande qui écrit dans la base.
- `pnpm --filter @workspace/db run push` est réservé au développement et ne
  constitue pas une procédure de production.
- Ne jamais exécuter de DDL directement sur la base de production sans la
  procédure de confirmation, sauvegarde, validation et retour arrière ci-dessus.

## Rapport obligatoire

Toute intervention, y compris un diagnostic sans écriture, se termine par un
rapport structuré qui distingue clairement :

### Actions exécutées

- action ;
- cible ;
- résultat ;
- vérification effectuée.

### Actions proposées mais non exécutées

- action ;
- raison de la non-exécution : confirmation absente, refus, précondition
  manquante ou arrêt de sécurité.
- en cas de divergence : cible diagnostiquée, cible reçue et valeur qui ne
  correspond pas.

### Risques et suite

- divergences restantes ;
- retour arrière disponible ou non ;
- prochaine action nécessitant une nouvelle confirmation.

Ne jamais présenter une action proposée comme si elle avait été exécutée.
