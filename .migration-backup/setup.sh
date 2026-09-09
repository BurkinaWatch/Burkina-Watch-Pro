#!/bin/bash

# ==============================================
# BURKINA WATCH - SCRIPT D'INSTALLATION
# ==============================================

set -e  # Arrête le script en cas d'erreur

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message formaté
print_message() {
    echo -e "${BLUE}[Burkina Watch]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    print_message "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        echo "Veuillez installer Node.js 18.x ou supérieur : https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION détectée. Version 18+ requise."
        exit 1
    fi
    print_success "Node.js $(node --version) détecté"
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    print_success "npm $(npm --version) détecté"
    
    # Vérifier PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL CLI (psql) non détecté"
        echo "PostgreSQL est requis pour la base de données."
        echo "Installation : "
        echo "  - Ubuntu/Debian : sudo apt install postgresql"
        echo "  - macOS : brew install postgresql"
        echo "  - Windows : https://www.postgresql.org/download/windows/"
        read -p "Continuer sans PostgreSQL ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "PostgreSQL $(psql --version | awk '{print $3}') détecté"
    fi
}

# Fonction pour installer les dépendances
install_dependencies() {
    print_message "Installation des dépendances npm..."
    
    if [ -d "node_modules" ]; then
        print_warning "node_modules existe déjà"
        read -p "Réinstaller les dépendances ? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_message "Nettoyage de node_modules..."
            rm -rf node_modules package-lock.json
        else
            print_success "Utilisation des dépendances existantes"
            return
        fi
    fi
    
    npm install
    print_success "Dépendances installées"
}

# Fonction pour configurer l'environnement
setup_environment() {
    print_message "Configuration de l'environnement..."
    
    if [ -f ".env" ]; then
        print_warning "Le fichier .env existe déjà"
        read -p "Écraser avec .env.example ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "Conservation du fichier .env existant"
            return
        fi
    fi
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Fichier .env créé depuis .env.example"
        print_warning "⚠ IMPORTANT : Éditez .env et remplissez vos variables !"
        echo ""
        echo "Variables à configurer :"
        echo "  - DATABASE_URL (connexion PostgreSQL)"
        echo "  - SESSION_SECRET (secret aléatoire)"
        echo "  - RESEND_API_KEY (pour les emails)"
        echo "  - VITE_GOOGLE_MAPS_API_KEY (optionnel)"
        echo ""
    else
        print_error ".env.example introuvable"
        return 1
    fi
}

# Fonction pour créer la base de données
setup_database() {
    print_warning "Création automatique de base désactivée."
    print_message "Ce projet utilise une base PostgreSQL Railway existante comme source de vérité."
    print_message "Configurez la connexion dans le gestionnaire de secrets sans lancer createdb."
}

# Fonction pour initialiser le schéma
initialize_schema() {
    print_warning "Initialisation automatique du schéma désactivée."
    print_message "Aucune commande db:push ne sera exécutée par ce script."
    print_message "Préparez et validez une migration forward-only séparément."
}

# Fonction pour compiler le projet
build_project() {
    print_message "Compilation du projet..."
    
    read -p "Compiler pour la production ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Compilation ignorée"
        return
    fi
    
    npm run build
    print_success "Projet compilé dans /dist"
}

# Fonction principale
main() {
    clear
    echo "╔════════════════════════════════════════════════╗"
    echo "║                                                ║"
    echo "║        🇧🇫 BURKINA WATCH - INSTALLATION        ║"
    echo "║                                                ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    echo ""
    
    install_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    setup_database
    echo ""
    
    initialize_schema
    echo ""
    
    build_project
    echo ""
    
    echo "╔════════════════════════════════════════════════╗"
    echo "║                                                ║"
    echo "║        ✓ INSTALLATION TERMINÉE !               ║"
    echo "║                                                ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    print_message "Prochaines étapes :"
    echo ""
    echo "  1. Éditez le fichier .env avec vos configurations"
    echo "  2. Lancez l'application :"
    echo "     - Mode développement : npm run dev"
    echo "     - Mode production : npm start"
    echo ""
    echo "  3. Accédez à : http://localhost:5000"
    echo ""
    print_success "Bon développement ! 🚀"
    echo ""
}

# Exécuter le script
main
