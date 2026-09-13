# Sources publiques pour Burkina Pratique

Burkina Pratique utilise OpenStreetMap et les contributions BurkinaWatch comme sources principales. Des sources publiques RSS/Atom ou JSON peuvent être ajoutées sans migration de base et sans exposer de clé dans le navigateur.

## Configuration

Définir la variable d’environnement `BURKINAWATCH_PUBLIC_SOURCES` avec un tableau JSON :

```json
[
  {
    "name": "Annuaire partenaire",
    "url": "https://exemple.org/places.json",
    "format": "json",
    "defaultPlaceType": "shop"
  },
  {
    "name": "Actualités du partenaire",
    "url": "https://exemple.org/feed.xml",
    "format": "rss"
  }
]
```

`format` vaut `json` ou `rss`. Le format RSS couvre aussi Atom. `defaultPlaceType` est utilisé pour les éléments JSON qui possèdent des coordonnées mais pas de type, avec `shop` comme valeur par défaut.

## Formats acceptés

Un élément JSON peut utiliser les champs suivants :

- identité : `id`, `name` ou `title` ;
- coordonnées : `latitude` / `longitude`, `lat` / `lng`, ou `geo:lat` / `geo:long` ;
- adresse : `address`, `adresse`, `quartier`, `ville`, `region` ;
- contact : `telephone`, `phone`, `email`, `website` ;
- lieu : `placeType`, `type`, `category` ;
- publication : `description`, `summary`, `content`, `publishedAt`, `date`, `url`.

Le JSON peut être un tableau direct ou contenir un tableau sous `items`, `results` ou `places`.

Les éléments RSS/Atom avec coordonnées deviennent des lieux externes. Les autres restent des publications dans la section **Sources publiques** et conservent leur lien d’origine.

## Route et garanties

La route publique est :

```text
GET /api/pratique/public-sources?search=boucherie
```

Le serveur :

- interroge les sources uniquement lorsqu’elles sont configurées ;
- limite à 8 sources et 100 éléments par source ;
- applique un délai maximum de 8 secondes par source ;
- met les réponses en cache pendant 10 minutes ;
- ignore les URLs non HTTP(S) ou locales ;
- ne bloque pas les résultats OSM lorsqu’un flux est indisponible ;
- affiche la source et la date de publication ;
- ne transforme pas une publication sans coordonnées en lieu géolocalisé.

Les données externes ne doivent pas être présentées comme une disponibilité, un prix ou un horaire confirmé sans vérification complémentaire.