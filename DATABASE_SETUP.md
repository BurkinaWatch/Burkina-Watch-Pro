
# Configuration de la Base de Données

## Pour conserver vos données lors du téléchargement

Votre application utilise PostgreSQL via Neon Database. Voici comment configurer:

### 1. Créer une base de données Neon (Gratuit)

1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez la `Connection String` fournie

### 2. Configuration dans Replit

1. Allez dans l'onglet "Secrets" (icône de cadenas)
2. Ajoutez une variable: `DATABASE_URL`
3. Collez votre connection string Neon

### 3. Configuration en local (après téléchargement)

1. Créez un fichier `.env` à la racine du projet
2. Copiez le contenu de `.env.example`
3. Remplacez `DATABASE_URL` par votre connection string Neon
4. Exécutez les migrations:
   ```bash
   npm install
   npm run db:push
   ```

### Alternative: Autres providers PostgreSQL

Vous pouvez aussi utiliser:
- **Supabase** (gratuit): https://supabase.com
- **Railway** (gratuit): https://railway.app
- **Render** (gratuit): https://render.com

Tous fournissent une DATABASE_URL compatible.

## Migration des données existantes

Si vous avez déjà des données dans Replit:

1. Exportez depuis la console Replit:
   ```bash
   npm run db:studio
   ```
2. Utilisez Drizzle Studio pour exporter/importer les données
3. Ou utilisez `pg_dump` pour une sauvegarde complète

## Important

⚠️ Ne commitez JAMAIS votre fichier `.env` avec les vrais identifiants!
Le fichier `.gitignore` est déjà configuré pour l'ignorer.
