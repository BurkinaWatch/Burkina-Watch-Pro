#!/bin/bash

# ==============================================
# BURKINA WATCH - SCRIPT DE DÉMARRAGE
# ==============================================

set -e  # Arrête le script en cas d'erreur

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Vérifier que .env existe
check_environment() {
    if [ ! -f ".env" ]; then
        print_error "Fichier .env introuvable !"
        echo ""
        echo "Veuillez créer un fichier .env à partir de .env.example :"
        echo "  cp .env.example .env"
        echo ""
        echo "Puis configurez les variables nécessaires."
        exit 1
    fi
    print_success "Fichier .env détecté"
}

# Vérifier que node_modules existe
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_error "Dépendances non installées !"
        echo ""
        echo "Installez les dépendances avec :"
        echo "  npm install"
        echo ""
        echo "Ou lancez le script d'installation :"
        echo "  ./setup.sh"
        exit 1
    fi
    print_success "Dépendances installées"
}

# Vérifier que le build existe (pour mode production)
check_build() {
    if [ ! -d "dist" ]; then
        print_warning "Build de production introuvable"
        echo ""
        echo "Compilez le projet avec :"
        echo "  npm run build"
        echo ""
        return 1
    fi
    print_success "Build de production trouvé"
    return 0
}

# Menu de sélection du mode
show_menu() {
    clear
    echo "╔════════════════════════════════════════════════╗"
    echo "║                                                ║"
    echo "║        🇧🇫 BURKINA WATCH - DÉMARRAGE           ║"
    echo "║                                                ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Choisissez un mode de démarrage :"
    echo ""
    echo "  1) Mode Développement (npm run dev)"
    echo "     - Hot reload activé"
    echo "     - Idéal pour le développement"
    echo "     - Port : 5000"
    echo ""
    echo "  2) Mode Production (npm start)"
    echo "     - Version optimisée"
    echo "     - Nécessite npm run build"
    echo "     - Port : 5000"
    echo ""
    echo "  3) Compiler uniquement (npm run build)"
    echo "     - Créer le build sans lancer"
    echo ""
    echo "  4) Vérifier les types (npm run check)"
    echo "     - Vérification TypeScript"
    echo ""
    echo "  5) Quitter"
    echo ""
}

# Démarrer en mode développement
start_dev() {
    print_message "Démarrage en mode DÉVELOPPEMENT..."
    echo ""
    print_info "L'application sera accessible sur : http://localhost:5000"
    print_info "Appuyez sur Ctrl+C pour arrêter"
    echo ""
    sleep 2
    npm run dev
}

# Démarrer en mode production
start_prod() {
    print_message "Démarrage en mode PRODUCTION..."
    echo ""
    
    # Vérifier que le build existe
    if ! check_build; then
        read -p "Compiler maintenant ? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run build
        else
            print_error "Build requis pour le mode production"
            exit 1
        fi
    fi
    
    print_info "L'application sera accessible sur : http://localhost:5000"
    print_info "Appuyez sur Ctrl+C pour arrêter"
    echo ""
    sleep 2
    npm start
}

# Compiler le projet
build_only() {
    print_message "Compilation du projet..."
    echo ""
    npm run build
    echo ""
    print_success "Compilation terminée !"
    print_info "Fichiers générés dans : /dist"
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

# Vérifier les types
check_types() {
    print_message "Vérification TypeScript..."
    echo ""
    npm run check
    echo ""
    print_success "Vérification terminée !"
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

# Fonction principale avec menu interactif
main() {
    # Vérifications préliminaires
    check_environment
    check_dependencies
    echo ""
    
    # Si un argument est passé, démarrer directement
    case "$1" in
        dev)
            start_dev
            exit 0
            ;;
        prod|production)
            start_prod
            exit 0
            ;;
        build)
            build_only
            exit 0
            ;;
        check)
            check_types
            exit 0
            ;;
    esac
    
    # Sinon, afficher le menu
    while true; do
        show_menu
        read -p "Votre choix : " choice
        
        case $choice in
            1)
                start_dev
                break
                ;;
            2)
                start_prod
                break
                ;;
            3)
                build_only
                ;;
            4)
                check_types
                ;;
            5)
                print_message "Au revoir !"
                exit 0
                ;;
            *)
                print_error "Choix invalide"
                sleep 1
                ;;
        esac
    done
}

# Gérer l'interruption (Ctrl+C)
trap 'echo ""; print_warning "Application arrêtée"; exit 0' INT

# Lancer le script
main "$@"
