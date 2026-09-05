# Railway Build Diagnosis — 2026-09-05

## Verdict

Le build échoue avant toute compilation applicative parce que Railway installe
les dépendances dans un contexte npm production qui omet les
`devDependencies`. Le script `build` utilise pourtant `vite`, `esbuild` et
TypeScript, qui sont déclarés dans `devDependencies`.

La chaîne observée est donc :

```text
npm ci avec devDependencies omises
  → npm run build
  → vite build
  → vite: not found
```

La cause exacte du réglage de production côté Railway (variable d'environnement
Railway, configuration de build ou autre réglage de plateforme) n'est pas
présente dans le dépôt et n'a pas été modifiée ni interrogée. Le mécanisme
responsable de l'échec est toutefois démontré par le log fourni.

## Cause principale

**`vite` est installé comme `devDependency`, mais le contexte npm production
de Railway l'exclut pendant `npm ci`.**

Preuve directe fournie par le log Railway :

```text
npm warn config production Use `--omit=dev` instead.
...
sh: 1: vite: not found
```

Preuves dans le dépôt :

- `package.json:14` appelle `vite build` au début de `npm run build` ;
- `package.json:140-163` place `vite`, `esbuild` et TypeScript dans
  `devDependencies` ;
- `nixpacks.toml:6` exécute `npm ci` ;
- `nixpacks.toml:9` exécute ensuite `npm run build`.

Lorsque npm reçoit `production=true`, `NODE_ENV=production` pendant
l'installation ou `omit=dev`, il n'installe pas `vite` et son binaire
`node_modules/.bin/vite` n'existe pas dans l'environnement de build.

## Causes secondaires

### Runtime npm potentiellement distinct

Le dépôt déclare Node `20.x`, npm `10.8.x` et `npm@10.8.2` dans
`package.json:6-10`. Le workspace local utilise bien Node `v20.20.0` et npm
`10.8.2`.

Le log fourni ne contient pas la version Node/npm de Railway. Il est donc
impossible de confirmer dans ce rapport un écart de runtime pour ce déploiement
précis. L'écart de runtime est un risque séparé, pas la cause nécessaire de
`vite: not found`.

### `Exit handler never called!`

Cette ligne apparaît avant le script de build :

```text
npm error Exit handler never called!
```

Elle peut être un symptôme ou une conséquence de l'installation npm qui s'est
terminée anormalement, et elle a déjà été associée à des installations npm
Railway sensibles au runtime. Avec le log fourni, elle ne prouve pas une
seconde cause indépendante. L'erreur déterminante et reproductible pour le
build est `vite: not found`.

## Evidence

### Log Railway fourni

```text
npm warn config production Use `--omit=dev` instead.

npm error Exit handler never called!

> rest-express@1.0.0 build
> vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && esbuild server/streetviewWorkerMain.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/streetview-worker.js

sh: 1: vite: not found
```

### Vérifications locales en lecture seule

Résultats observés dans ce workspace :

```text
npm config get production → null
npm config get omit       → null
npm config get include    → null
npm config get only       → null
test -x node_modules/.bin/vite → PASS
npm ls vite --depth=0 → vite@5.4.20
```

Le workspace local installe donc les `devDependencies` et n'est pas une
reproduction du contexte Railway qui a produit le log.

## package.json

### Scripts concernés

`package.json:14` :

```json
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && esbuild server/streetviewWorkerMain.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/streetview-worker.js"
```

Le premier processus de cette chaîne est `vite build`. Comme la chaîne utilise
`&&`, les deux commandes esbuild ne sont pas lancées si Vite est absent.

`package.json:15-16` définissent `NODE_ENV=production` uniquement dans les
commandes de démarrage, après le build :

```json
"start": "NODE_ENV=production node dist/index.js",
"start:worker": "NODE_ENV=production node dist/streetview-worker.js"
```

Ces scripts ne peuvent pas expliquer à eux seuls l'omission des
`devDependencies` pendant `npm ci`, sauf si une configuration externe Railway
réutilise également `NODE_ENV=production` au stade de l'installation.

### Dépendances

Dans `package.json:140-163` :

```json
"devDependencies": {
  ...
  "esbuild": "^0.25.0",
  ...
  "typescript": "5.6.3",
  "vite": "^5.4.20"
}
```

Les outils nécessaires au script `build` sont donc présents, mais dans la
catégorie qui est omise en mode production :

| Outil | Utilisation | Emplacement | Version déclarée |
| --- | --- | --- | --- |
| Vite | `vite build` | `devDependencies` | `^5.4.20` |
| esbuild | deux commandes esbuild | `devDependencies` | `^0.25.0` |
| TypeScript | `npm run check` / compilation de types | `devDependencies` | `5.6.3` |
| `@vitejs/plugin-react` | chargé par `vite.config.ts` | `devDependencies` | `^4.7.0` |

`vite.config.ts:1-19` importe également `@vitejs/plugin-react` et des plugins
Vite de développement. Le build doit donc conserver au minimum l'ensemble des
`devDependencies` jusqu'à la fin de `npm run build`.

## package-lock.json

`package-lock.json` existe et utilise `lockfileVersion: 3` à la ligne 4.

Le package racine du lockfile contient les mêmes déclarations de
`devDependencies` que `package.json` aux lignes `118-145` :

```json
"esbuild": "^0.25.0",
"typescript": "5.6.3",
"vite": "^5.4.20"
```

Versions effectivement verrouillées :

| Package | package.json | package-lock.json |
| --- | --- | --- |
| Vite | `^5.4.20` | `5.4.20` (`package-lock.json:12705-12717`) |
| esbuild | `^0.25.0` | `0.25.9` (`package-lock.json:7519-7527`) |
| TypeScript | `5.6.3` | `5.6.3` (`package-lock.json:12493-12501`) |

Le lockfile est cohérent avec `package.json` pour les outils du build. Aucun
lockfile n'a été régénéré et aucune dépendance n'a été installée pendant ce
diagnostic.

Le lockfile marque Vite comme `dev: true` à
`package-lock.json:12709`, ce qui confirme que `npm ci --omit=dev` l'exclurait.

## npm configuration

Aucun `.npmrc` de dépôt n'a été trouvé.

Les configurations npm locales inspectées ne contiennent pas de réglage
`production=true`, `omit=dev`, `only=production` ou équivalent. Les valeurs
effectives du workspace étaient :

```text
production = null
omit       = []
include    = []
only       = null
```

Les occurrences `NODE_ENV=production` trouvées dans le code sont limitées aux
commandes de démarrage de `package.json:15-16`. Aucun
`NPM_CONFIG_PRODUCTION`, `NPM_CONFIG_OMIT`, `npm_config_production` ou
`npm_config_omit` n'est configuré dans le dépôt.

Conclusion : le réglage npm production observé dans le log ne vient pas d'une
configuration versionnée du dépôt. Il est injecté ou activé par le contexte
Railway/Nixpacks utilisé pour ce build.

## Railway/Nixpacks/Docker

Aucun `railway.json`, `railway.toml`, `Dockerfile` ou autre configuration
Docker de déploiement n'a été trouvé à la racine du dépôt.

Le fichier versionné `nixpacks.toml` contient :

```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

La commande d'installation explicite est donc :

```text
npm ci
```

La commande de build explicite est :

```text
npm run build
```

La commande de démarrage est :

```text
npm run start
```

`nixpacks.toml` ne demande pas explicitement `--omit=dev`, mais `npm ci`
respecte les variables et configurations npm actives dans l'environnement de
build. Le message `npm warn config production` indique que cette configuration
était active au moment de l'installation Railway.

## Build chain

Chaîne conceptuelle actuelle :

```text
Nixpacks setup
  → nodejs-20_x
  → npm ci
  → npm run build
      → vite build
      → esbuild server/index.ts ...
      → esbuild server/streetviewWorkerMain.ts ...
  → npm run start
```

Avec toutes les dépendances de développement, cette chaîne est conceptuellement
correcte.

Avec les `devDependencies` omises, elle est incohérente :

```text
npm ci --omit=dev
  → node_modules/.bin/vite absent
  → npm run build
  → échec immédiat sur vite build
```

## `vite: not found`

L'échec réel est la première commande du script :

```text
vite build
```

Un script npm résout normalement `vite` depuis `node_modules/.bin/vite`.
`vite` est bien déclaré et verrouillé, mais uniquement comme
`devDependency`. Si npm omet les dépendances de développement, aucun binaire
Vite n'est créé et le shell répond :

```text
sh: 1: vite: not found
```

Le worker Street View n'a aucune responsabilité dans l'erreur actuelle.
`server/streetviewWorkerMain.ts` est compilé par la troisième commande esbuild,
qui n'est jamais atteinte, car `vite build` échoue en premier.

## `Exit handler never called`

Cette erreur est analysée séparément :

```text
npm error Exit handler never called!
```

Avec les informations disponibles, elle est **probablement secondaire ou
indépendante** de l'erreur de résolution Vite :

- elle apparaît dans la phase npm avant l'exécution visible du script ;
- le log ne fournit pas de stack npm complète ni la version npm Railway ;
- le build échoue ensuite de façon déterministe avec `vite: not found` ;
- aucune preuve ne permet d'affirmer que cette ligne est la cause primaire du
  `vite: not found`.

Elle doit être surveillée après correction de l'installation des
`devDependencies`. Si elle persiste avec le runtime Node/npm attendu et un
lockfile intact, elle devra faire l'objet d'un diagnostic npm séparé.

## Recommended fix

Ne pas déplacer Vite dans `dependencies` simplement pour masquer le problème.
Les outils de compilation peuvent rester dans `devDependencies`; le build doit
les installer avant d'exécuter `npm run build`.

Correctif recommandé, à appliquer dans une prochaine étape seulement :

1. modifier la phase d'installation Nixpacks pour demander explicitement les
   dépendances de développement :

   ```toml
   [phases.install]
   cmds = ["npm ci --include=dev"]
   ```

2. supprimer ou neutraliser côté Railway toute configuration globale qui force
   `NPM_CONFIG_PRODUCTION=true`, `NPM_CONFIG_OMIT=dev` ou un équivalent pendant
   le build ;

3. ne pas définir `NODE_ENV=production` globalement pour la phase
   d'installation/build ; conserver `NODE_ENV=production` uniquement dans la
   commande de démarrage, comme le fait déjà `package.json:15` ;

4. vérifier dans les logs suivants les versions Node/npm et la présence de
   `vite` avant `npm run build`.

Commandes exactes proposées pour une prochaine étape, sans les exécuter dans
ce diagnostic :

```bash
# Vérifier les réglages locaux avant application
npm config get production
npm config get omit
npm config get include
npm config get only

# Après mise à jour de nixpacks.toml et du réglage Railway,
# exécuter localement dans un environnement de build propre
npm ci --include=dev
test -x node_modules/.bin/vite
npm ls vite --depth=0
npm run check
npm run build
```

Si la plateforme permet de définir une commande d'installation Railway
directement, utiliser l'équivalent :

```bash
npm ci --include=dev
```

La priorité est de corriger le contexte d'installation, pas de modifier le
code Street View.

## Risk assessment

Le correctif recommandé, limité à la phase d'installation/build, a le profil
suivant :

| Surface | Risque |
| --- | --- |
| Production runtime | Faible : cela ajoute les outils de build avant démarrage |
| PostgreSQL | Aucun accès ni modification |
| Migrations | Aucun changement |
| Street View | Aucun changement de code ou de worker |
| Worker | Aucun changement de code ; il sera seulement compilé après Vite |
| Secrets | Aucun changement |
| Runtime | À vérifier : conserver Node/npm alignés avec `package.json` |
| Taille/temps de build | Peut augmenter puisque les devDependencies sont conservées pendant le build |

Le correctif ne doit pas déplacer les outils de build dans les dépendances
runtime et ne doit pas déclencher `db:push`.

## Final verdict

```text
ROOT CAUSE CONFIRMED
```

La cause confirmée est l'incompatibilité entre :

```text
npm ci en contexte production, avec devDependencies omises
```

et :

```text
npm run build qui exige vite, esbuild et TypeScript
```

L'origine exacte du réglage production dans l'interface ou l'environnement
Railway n'est pas déterminable à partir des seuls fichiers du dépôt et du log
fourni. Elle doit être vérifiée dans Railway sans modifier la base ou les
migrations.

## Vérifications finales

Exécutées après le diagnostic, sans modification de fichiers :

```text
npm run check → PASS
git diff --check → PASS
```

Le workflow local a également produit une erreur distincte :

```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

Cette erreur concerne le port déjà occupé dans le workspace local et n'est pas
la cause du déploiement Railway décrit dans le fichier joint.

Confirmation :

- aucun fichier de production n'a été modifié ;
- aucune migration n'a été modifiée ;
- aucune base de données n'a été lue ou modifiée ;
- aucun secret ou variable d'environnement n'a été modifié ;
- aucun déploiement Railway n'a été lancé ;
- aucun correctif de code, Street View ou worker n'a été appliqué.