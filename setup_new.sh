#!/bin/bash

# ============================================
# BURKINA WATCH PRO - SCRIPT D'INSTALLATION
# Pour Linux et macOS
# ============================================

set -e

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
echo "============================================"
echo "   BURKINA WATCH PRO - Installation"
echo "   Plateforme Citoyenne du Burkina Faso"
echo "============================================"
echo -e "${NC}"

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour afficher un message de succès
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher un message d'information
info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Fonction pour afficher un message d'avertissement
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Fonction pour afficher un message d'erreur
error() {
    echo -e "${RED}✗ $1${NC}"
}

# ============================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ============================================

info "Vérification des prérequis..."

# Vérifier Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    success "Node.js est installé: $NODE_VERSION"
else
    error "Node.js n'est pas installé!"
    echo "Veuillez installer Node.js >= 18.0.0 depuis https://nodejs.org/"
    exit 1
fi

# Vérifier npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    success "npm est installé: v$NPM_VERSION"
else
    error "npm n'est pas installé!"
    exit 1
fi

# Vérifier PostgreSQL
if command_exists psql; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    success "PostgreSQL est installé: $PSQL_VERSION"
else
    warning "PostgreSQL n'est pas détecté. L'installation continuera mais vous devrez le configurer manuellement."
    echo "Installation recommandée:"
    echo "  - Ubuntu/Debian: sudo apt install postgresql"
    echo "  - macOS: brew install postgresql"
fi

echo ""

# ============================================
# 2. CONFIGURATION DU FICHIER .ENV
# ============================================

info "Configuration des variables d'environnement..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        success "Fichier .env créé depuis .env.example"
        
        # Générer un SESSION_SECRET aléatoire
        if command_exists node; then
            SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
            # Remplacer dans .env
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
            else
                # Linux
                sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
            fi
            success "SESSION_SECRET généré automatiquement"
        fi
        
        warning "Veuillez éditer le fichier .env pour configurer:"
        echo "  - DATABASE_URL (connexion PostgreSQL)"
        echo "  - OPENAI_API_KEY (pour le chatbot IA)"
        echo "  - RESEND_API_KEY (pour les emails)"
        echo "  - VITE_GOOGLE_MAPS_API_KEY (pour la carte)"
        echo ""
        read -p "Appuyez sur Entrée après avoir configuré .env..."
    else
        error "Fichier .env.example introuvable!"
        exit 1
    fi
else
    info "Fichier .env existe déjà, configuration conservée"
fi

echo ""

# ============================================
# 3. INSTALLATION DES DÉPENDANCES
# ============================================

info "Installation des dépendances npm..."

# Vérifier si node_modules existe déjà
if [ -d "node_modules" ]; then
    warning "node_modules existe déjà. Réinstallation..."
    npm install
else
    npm install
fi

success "Dépendances installées"
echo ""

# ============================================
# 4. CONFIGURATION DE LA BASE DE DONNÉES
# ============================================

info "Configuration de la base de données PostgreSQL..."

if command_exists psql; then
    read -p "Voulez-vous créer automatiquement la base de données? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        read -p "Nom de la base de données (défaut: burkina_watch): " DB_NAME
        DB_NAME=${DB_NAME:-burkina_watch}
        
        read -p "Utilisateur PostgreSQL (défaut: postgres): " DB_USER
        DB_USER=${DB_USER:-postgres}
        
        info "Création de la base de données $DB_NAME..."
        createdb -U $DB_USER $DB_NAME 2>/dev/null && success "Base de données créée" || warning "La base existe déjà ou erreur de création"
    fi
else
    warning "PostgreSQL non détecté. Créez manuellement la base de données:"
    echo "  1. Installez PostgreSQL"
    echo "  2. Créez la base: createdb burkina_watch"
    echo "  3. Configurez DATABASE_URL dans .env"
fi

echo ""

# ============================================
# 5. MIGRATION DU SCHÉMA
# ============================================

warning "Migration automatique du schéma désactivée."
info "Aucune commande db:push, y compris --force, ne sera exécutée."
info "Préparez et validez une migration forward-only séparément."

echo ""

# ============================================
# 6. BUILD DE PRODUCTION (optionnel)
# ============================================

read -p "Voulez-vous builder pour la production maintenant? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    info "Build de production en cours..."
    npm run build
    success "Build terminé. Fichiers dans ./dist/"
fi

echo ""

# ============================================
# 7. RÉSUMÉ ET PROCHAINES ÉTAPES
# ============================================

echo -e "${GREEN}"
echo "============================================"
echo "   ✓ INSTALLATION TERMINÉE AVEC SUCCÈS!"
echo "============================================"
echo -e "${NC}"

echo ""
echo -e "${BLUE}Prochaines étapes:${NC}"
echo ""
echo "1. Vérifiez et complétez la configuration dans .env"
echo "2. Lancez l'application:"
echo ""
echo -e "   ${GREEN}Mode développement:${NC}"
echo "   npm run dev"
echo ""
echo -e "   ${GREEN}Mode production:${NC}"
echo "   NODE_ENV=production node dist/index.js"
echo ""
echo "3. Accédez à l'application:"
echo "   http://localhost:5000"
echo ""
echo -e "${YELLOW}Documentation complète:${NC}"
echo "   - README_PORTABLE.md (guide d'installation)"
echo "   - replit.md (documentation technique)"
echo ""
echo -e "${BLUE}Support:${NC}"
echo "   📱 +226 65511323 | 💬 +226 70019540"
echo ""
echo -e "${GREEN}Burkina Watch - Voir. Agir. Protéger.${NC}"
echo ""

# Demander si l'utilisateur veut lancer l'application
read -p "Voulez-vous lancer l'application maintenant? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    info "Démarrage de Burkina Watch..."
    npm run dev
fi
