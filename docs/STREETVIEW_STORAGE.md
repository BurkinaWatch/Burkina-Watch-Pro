# Stockage vidéo StreetView en production

## Décision

BurkinaWatch utilise un adaptateur **S3-compatible** pour la production. Cloudflare
R2 est le choix recommandé pour démarrer : il sépare les fichiers du serveur Railway,
propose des URLs présignées, le multipart et une tarification de sortie réseau
prévisible. AWS S3 reste une alternative compatible sans changement de code.

Le filesystem reste disponible uniquement en développement. En production, si
`STREETVIEW_STORAGE_PROVIDER` n'est pas défini, l'application sélectionne `s3` et
refuse de démarrer si les paramètres du bucket sont incomplets. Cela empêche un
redeploy de basculer silencieusement vers un disque éphémère.

## Audit de l'implémentation précédente

Avant cette migration :

- le client envoyait toute la vidéo à `PUT /api/streetview/contributions/:id/upload` ;
- Express utilisait `express.raw` et conservait le fichier complet en mémoire pendant
  la requête ;
- `server/streetviewStorage.ts` écrivait ensuite dans
  `STREETVIEW_STORAGE_DIR`, par défaut `uploads/streetview` ;
- PostgreSQL ne contenait pas les binaires, seulement la clé, la taille, le MIME et
  les métadonnées ;
- les retries réécrivaient le même fichier local ;
- les miniatures utilisaient le même adapter, mais leur lecture passait auparavant
  directement par le filesystem ;
- aucune URL signée, reprise multipart ou suppression de contribution n'existait.

Le disque local d'un déploiement autoscale Railway/Replit ne doit pas être considéré
comme un stockage partagé ou durable. Un Railway Volume améliore la persistance
d'une instance, mais reste attaché à un service/volume et ne constitue pas un
bucket partagé adapté à plusieurs instances web et workers. Un redeploy ou un
scaling horizontal ne doit donc jamais être la source de vérité des originaux.

## Flux actuel

```text
Client authentifié
  -> Express : crée la contribution et autorise une session multipart courte
  -> Express : présigne chaque partie, sans exposer de credentials
  -> Client : PUT direct de chaque partie vers le bucket
  -> Express : complète le multipart et vérifie HEAD (taille/MIME)
  -> Express : lance la préparation et lit seulement un range d'en-tête
  -> PostgreSQL : conserve les métadonnées et la référence de stockage
```

Express ne transporte plus l'intégralité d'une vidéo en mode objet. Les parties
échouées sont retentées trois fois côté client. Une nouvelle session peut remplacer
proprement une tentative échouée, avec une clé déterministe par contribution.

Les routes objet sont :

- `POST .../:id/upload-session` : démarre un multipart autorisé par le propriétaire ;
- `POST .../:id/upload-session/part-url` : présigne une seule partie ;
- `POST .../:id/upload-session/complete` : vérifie les parties et la taille finale ;
- `POST .../:id/upload-session/abort` : annule une tentative ;
- `GET .../:id/video` : accès authentifié, redirigé vers une URL GET signée en S3 ;
- `DELETE .../:id` : supprime les objets puis la contribution du propriétaire.

## Convention de clés

```text
contributions/{uuid}/source/original.mp4
contributions/{uuid}/source/original.webm
contributions/{uuid}/source/original.mov
contributions/{uuid}/thumbnail.jpg
```

Les noms fournis par l'utilisateur ne construisent jamais une clé. L'original reste
séparé des futures étapes `processing/`, `keyframes/` et `scenes/`.

## Variables de déploiement

À configurer dans les secrets/environnements de production, jamais dans le frontend :

| Variable | Rôle |
| --- | --- |
| `STREETVIEW_STORAGE_PROVIDER` | `s3` en production ; `filesystem` seulement en développement |
| `STREETVIEW_S3_ENDPOINT` | Endpoint S3 ou R2 |
| `STREETVIEW_S3_REGION` | Région du fournisseur, `auto` pour R2 |
| `STREETVIEW_S3_BUCKET` | Bucket dédié StreetView |
| `STREETVIEW_S3_ACCESS_KEY_ID` | Identifiant privé du bucket |
| `STREETVIEW_S3_SECRET_ACCESS_KEY` | Secret privé du bucket |
| `STREETVIEW_S3_SESSION_TOKEN` | Optionnel, pour des credentials temporaires |
| `STREETVIEW_S3_FORCE_PATH_STYLE` | `true` seulement si le fournisseur l'exige |
| `STREETVIEW_S3_SIGNED_URL_TTL_SECONDS` | Durée des URLs GET et PUT signées |
| `STREETVIEW_S3_MULTIPART_PART_SIZE_MB` | Taille des parties, 8 Mo par défaut |

Le bucket doit autoriser seulement l'origine exacte de BurkinaWatch en CORS pour
`PUT`, `GET`, `HEAD` et `OPTIONS`, et exposer le header `ETag` au navigateur. Il ne
doit pas être public. La clé utilisée par l'application doit avoir uniquement les
droits nécessaires sur le préfixe `contributions/` : multipart, lecture, écriture
et suppression.

## Nettoyage et conservation

Le fournisseur objet doit avoir une règle lifecycle qui annule les multipart
incomplets après quelques jours et supprime les artefacts temporaires expirés. Les
originaux ne doivent pas être supprimés automatiquement tant qu'une contribution
peut être reconstruite avec une meilleure technologie. Les objets `processing/`,
`keyframes/` et `scenes/` pourront avoir des règles séparées lorsque le pipeline
3D sera défini.

## Comparaison des options

| Option | Coût et capacité | Multi-instance / workers | Upload direct et reprise | Décision |
| --- | --- | --- | --- | --- |
| Disque local Railway | Simple, mais capacité et persistance liées au service | Mauvais : non partagé et fragile au redeploy | Non | Développement seulement |
| Railway Volume | Coût de volume + service ; capacité limitée par le volume | Possible pour une instance attachée, mauvais bucket partagé | À coder soi-même | Ne pas utiliser comme source de vérité |
| AWS S3 | Pay-as-you-go, stockage objet très large, coût de requêtes et transfert à surveiller | Excellent | Présignées, multipart, lifecycle | Alternative compatible |
| Cloudflare R2 | Pay-as-you-go, sortie généralement sans frais de bande passante côté R2 | Excellent via API S3 | Présignées, multipart, lifecycle | Recommandé pour démarrer |

Les prix exacts dépendent de la région, du volume, des requêtes et du trafic. À
petite échelle, le stockage de quelques dizaines de vidéos de 100 Mo reste
généralement de l'ordre de quelques dollars par mois ou moins selon le fournisseur ;
la principale incertitude à grande échelle est le volume de lecture, les requêtes et
la reconstruction, pas PostgreSQL.

## Migration sans perte

Les contributions existantes utilisent encore le filesystem. La migration doit
être opérée en dehors de l'application :

1. sauvegarder et inventorier les clés locales et les lignes PostgreSQL ;
2. copier chaque original et miniature vers la même clé objet ;
3. vérifier taille, MIME, lecture et checksum/ETag ;
4. mettre à jour les références seulement après vérification ;
5. basculer `STREETVIEW_STORAGE_PROVIDER=s3` ;
6. conserver le filesystem en lecture seule jusqu'à la fin de la vérification ;
7. supprimer l'ancien stockage uniquement après une sauvegarde indépendante.

La base actuelle ne contient aucune contribution d'après le dernier contrôle ; il
n'y a donc pas de copie applicative à exécuter pour l'environnement de développement.

## Limites connues

- la reprise après fermeture complète du navigateur n'est pas encore persistée dans
  l'interface ; la session multipart est signée et temporaire ;
- la validation vidéo vérifie le conteneur et la taille, mais la durée/résolution
  proviennent encore des métadonnées client jusqu'à l'arrivée d'un worker média ;
- la configuration CORS et lifecycle doit être appliquée côté fournisseur ;
- le vrai worker de traitement 3D reste volontairement hors de cette étape.