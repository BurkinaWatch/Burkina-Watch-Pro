# Diagnostic Railway — npm / Vite / environnement de build

**Date :** 5 septembre 2026  
**Mode :** lecture seule  
**Verdict :** `INSUFFICIENT EVIDENCE`

## Résumé exécutif

Le projet contient correctement Vite dans `devDependencies` et dans
`package-lock.json`. Le workspace local dispose bien de Vite :

```text
vite@5.4.20
```

Le dernier log Railway indique pourtant :

```text
npm install --legacy-peer-deps --include=dev --no-audit --no-fund
npm warn config production Use `--omit=dev` instead.
npm error Exit handler never called!
npm error This is an error with npm itself.
sh: 1: vite: not found
```

La présence explicite de `--include=dev` signifie que la simple omission
volontaire des `devDependencies` ne suffit plus à expliquer le problème.

La cause la plus probable est une installation npm interrompue ou partielle
dans l’environnement Railway, mais le code de sortie npm, le debug log Railway,
les versions Node/npm Railway et l’état du cache ne sont pas accessibles depuis
Replit.

---

## A. Dépendances

### `package.json`

Vite est présent :

```json
"devDependencies": {
  "vite": "^5.4.20"
}
```

Vite n’est pas présent dans `dependencies`.

### `package-lock.json`

Vite est présent et verrouillé :

```text
lockfileVersion : 3
version         : 5.4.20
dev             : true
resolved        : true
```

### Vérification locale

```text
npm ls vite --depth=0
└── vite@5.4.20
```

Résultats :

```text
Vite présent dans package.json       : OUI
Vite présent dans package-lock.json : OUI
Vite présent après npm install Railway : INACCESSIBLE
node_modules/.bin/vite local         : OUI
```

Vite n’est pas marqué comme `extraneous` localement.

---

## B. Environnement Railway

Les versions réellement utilisées par Railway ne sont pas présentes dans le
log fourni :

```text
Node         : INACCESSIBLE
npm          : INACCESSIBLE
NODE_ENV     : INDETERMINÉ
npm production : INDETERMINÉ
npm omit     : INDETERMINÉ
npm include   : INDETERMINÉ
npm only      : INDETERMINÉ
```

### Versions locales

```text
Node : v20.20.0
npm  : 10.8.2
```

Le projet contient également :

```text
.nvmrc              : 20.20.0
packageManager      : npm@10.8.2
engines.node        : 20.x
engines.npm         : 10.8.x
```

Ces valeurs locales ne prouvent pas les versions utilisées par Railway.

---

## C. Variables de configuration pertinentes

### Variables locales observées

```text
NPM_CONFIG_REGISTRY=http://package-firewall.replit.local/npm/
npm_config_prefix=/home/runner/workspace/.config/npm/node_global
npm_config_audit=false
```

Aucune variable locale ne force :

```text
NPM_CONFIG_PRODUCTION
NPM_CONFIG_OMIT
NPM_CONFIG_INCLUDE
NPM_CONFIG_ONLY
npm_config_production
npm_config_omit
npm_config_include
npm_config_only
```

### Configuration du dépôt

Les fichiers de configuration présents à la racine sont :

```text
.nvmrc
package.json
package-lock.json
nixpacks.toml
.replit
```

Les fichiers suivants ne sont pas présents à la racine :

```text
.npmrc
railway.json
railway.toml
nixpacks.json
Dockerfile
```

`NODE_ENV=production` apparaît uniquement dans les scripts de démarrage :

```json
"start": "NODE_ENV=production node dist/index.js",
"start:worker": "NODE_ENV=production node dist/streetview-worker.js"
```

Cette utilisation est légitime pour le runtime et ne prouve pas que le build
Railway l’utilise comme variable globale.

---

## D. Installation npm

### Commande Railway observée

```bash
npm install --legacy-peer-deps --include=dev --no-audit --no-fund
```

### Résultats disponibles

```text
Code de sortie             : INCONNU
Installation complète      : INCONNUE
Exit handler never called  : OUI
Vite après installation    : INACCESSIBLE
```

### Contrôle du comportement `&&`

La commande attendue est :

```bash
npm install ... && npm run build
```

Un test local confirme le comportement normal du shell :

```bash
echo TEST_START
false && echo THIS_SHOULD_NOT_APPEAR
echo TEST_END
bash -c 'false && echo BUILD_SHOULD_NOT_RUN'
echo SHELL_EXIT=$?
```

Résultat :

```text
TEST_START
TEST_END
SHELL_EXIT=1
```

La commande située après `&&` n’est pas exécutée après un échec réel.

Le fait que `npm run build` apparaisse après l’erreur npm signifie donc que
l’une des situations suivantes est possible :

1. npm a affiché l’erreur mais retourné `0` ;
2. Railway a séparé l’installation et le build en deux phases ;
3. un wrapper Railway/Railpack a ignoré le code de sortie ;
4. le log combine plusieurs étapes ;
5. la commande affichée n’est pas la commande complète réellement exécutée.

Le log fourni ne permet pas de départager ces scénarios.

---

## E. Debug log

Le log Railway mentionne :

```text
/root/.npm/_logs/2026-09-05T09_39_06_667Z-debug-0.log
```

Ce fichier n’est pas accessible depuis Replit :

```text
RAILWAY_NPM_DEBUG_LOG_INACCESSIBLE
```

Résultat :

```text
Accessible          : NON
Erreur racine      : NON IDENTIFIABLE
```

Les logs npm locaux ne contiennent pas `Exit handler never called`. Ils ne sont
pas les logs privés du container Railway.

---

## F. Cache

### Cache local

```text
/home/runner/.npm
```

### Cache Railway

```text
Cache utilisé       : INACCESSIBLE
État                : CACHE_STATE_UNKNOWN
node_modules réutilisé : INACCESSIBLE
Couche persistante  : INACCESSIBLE
```

Le cache Railway n’a pas été supprimé, vidé ou désactivé.

Un cache pourrait conserver un état incomplet de `node_modules`, mais aucune
preuve ne permet de le retenir comme cause principale. Le message
`Exit handler never called!` indique d’abord une anomalie d’installation npm.

---

## G. Pourquoi Vite est absent

Catégorie retenue :

```text
8. indéterminé
```

### Hypothèse 1 — `devDependencies` omises

Cette hypothèse expliquait le premier déploiement, mais elle est insuffisante
pour le dernier log, car la commande contient explicitement :

```text
--include=dev
```

En comportement npm normal, `--include=dev` doit réinclure les dépendances de
développement malgré un contexte production.

### Hypothèse 2 — installation npm interrompue

C’est l’hypothèse la plus forte, car le log contient :

```text
npm error Exit handler never called!
```

Une installation interrompue peut laisser `node_modules` incomplet et rendre
Vite indisponible.

### Hypothèse 3 — installation partielle

Également possible, mais impossible à confirmer sans :

- le code de sortie ;
- la présence de `node_modules/vite` après installation ;
- le debug log npm Railway.

### Hypothèse 4 — cache incohérent

Possible, mais non démontrée.

### Hypothèse 5 — différence Node/npm

Possible, mais non démontrée. Les versions Railway ne sont pas visibles.

### Hypothèse 6 — wrapper Railway/Railpack

Possible si le wrapper ignore un échec npm ou exécute l’installation et le
build séparément. Aucun log complet ne permet de le confirmer.

---

## H. Cause racine

```text
CAUSE RACINE :
état final de l’installation npm Railway non vérifiable après
une erreur interne `Exit handler never called!`

NIVEAU DE CONFIANCE : FAIBLE
```

Ce qui est confirmé :

- Vite est correctement déclaré dans le projet ;
- Vite est correctement présent dans le lockfile ;
- Vite est disponible localement ;
- Railway reçoit une commande contenant `--include=dev` ;
- Railway affiche une erreur interne npm ;
- Vite est absent au moment du build.

Ce qui reste indéterminé :

- le code de sortie npm ;
- la complétude de l’installation ;
- le comportement exact du wrapper Railway/Railpack ;
- les versions Node/npm Railway ;
- le rôle du cache ;
- la présence de Vite après l’installation.

---

## I. Diagnostic temporaire recommandé

Aucun correctif permanent ne doit être appliqué à ce stade.

Le diagnostic suivant peut être exécuté manuellement dans l’environnement de
build Railway, sans lancer le build :

```bash
echo "===== ENVIRONMENT ====="
echo "NODE_ENV=$NODE_ENV"

echo "===== VERSIONS ====="
node --version
npm --version

echo "===== NPM CONFIG ====="
npm config get production
npm config get omit
npm config get include
npm config get only
npm config get prefix
npm config get cache

echo "===== NPM ENVIRONMENT VARIABLES ====="
env | sort | grep -Ei '^(NODE|NPM_CONFIG|npm_config)' || true

echo "===== PROJECT ====="
pwd
ls -la

echo "===== PACKAGE ====="
node -p "require('./package.json').packageManager || 'packageManager not defined'"
node -p "require('./package.json').engines || 'engines not defined'"
node -p "require('./package.json').devDependencies?.vite || 'vite not in devDependencies'"

echo "===== LOCKFILE ====="
node -p "require('./package-lock.json').lockfileVersion"

echo "===== BEFORE INSTALL ====="
if [ -x node_modules/.bin/vite ]; then
  echo "VITE_PRESENT_BEFORE_INSTALL"
else
  echo "VITE_ABSENT_BEFORE_INSTALL"
fi
```

Après collecte de ces informations, le test d’installation peut être exécuté
séparément, sans lancer le build :

```bash
echo "===== INSTALL START ====="

npm install --legacy-peer-deps --include=dev --no-audit --no-fund
INSTALL_EXIT=$?

echo "===== INSTALL EXIT CODE ====="
echo "INSTALL_EXIT=$INSTALL_EXIT"

echo "===== AFTER INSTALL ====="
if [ -x node_modules/.bin/vite ]; then
  echo "VITE_PRESENT_AFTER_INSTALL"
  node_modules/.bin/vite --version
else
  echo "VITE_ABSENT_AFTER_INSTALL"
fi

echo "===== NODE_MODULES CHECK ====="
if [ -d node_modules ]; then
  echo "NODE_MODULES_PRESENT"
else
  echo "NODE_MODULES_ABSENT"
fi

echo "===== VITE PACKAGE CHECK ====="
if [ -d node_modules/vite ]; then
  echo "VITE_PACKAGE_PRESENT"
else
  echo "VITE_PACKAGE_ABSENT"
fi

echo "===== END ====="
exit "$INSTALL_EXIT"
```

Ce test doit être réalisé manuellement dans Railway. Il n’a pas été exécuté
depuis Replit et aucun fichier de diagnostic temporaire n’a été ajouté au
dépôt.

---

## J. Changements effectués

```text
AUCUNE MODIFICATION EFFECTUÉE
```

Pendant ce diagnostic :

- aucun fichier du projet n’a été modifié ;
- `package.json` n’a pas été modifié ;
- `package-lock.json` n’a pas été modifié ;
- `nixpacks.toml` n’a pas été modifié ;
- aucune installation npm n’a été lancée ;
- aucun cache n’a été supprimé ;
- aucune variable Railway n’a été modifiée ;
- aucune migration n’a été lancée ;
- aucune base de données n’a été touchée ;
- aucun code Street View ou worker n’a été touché ;
- aucun commit ou push n’a été effectué ;
- aucun déploiement n’a été lancé.