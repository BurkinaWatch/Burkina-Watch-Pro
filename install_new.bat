@echo off
REM ============================================
REM BURKINA WATCH PRO - SCRIPT D'INSTALLATION
REM Pour Windows
REM ============================================

setlocal enabledelayedexpansion

color 0A
echo ============================================
echo    BURKINA WATCH PRO - Installation
echo    Plateforme Citoyenne du Burkina Faso
echo ============================================
echo.

REM ============================================
REM 1. VERIFICATION DES PREREQUIS
REM ============================================

echo [INFO] Verification des prerequis...
echo.

REM Verifier Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js est installe: !NODE_VERSION!
) else (
    echo [ERREUR] Node.js n'est pas installe!
    echo Veuillez installer Node.js ^>= 18.0.0 depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Verifier npm
where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm est installe: v!NPM_VERSION!
) else (
    echo [ERREUR] npm n'est pas installe!
    pause
    exit /b 1
)

REM Verifier PostgreSQL
where psql >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo [OK] PostgreSQL est installe: !PSQL_VERSION!
) else (
    echo [ATTENTION] PostgreSQL n'est pas detecte.
    echo Installation recommandee depuis: https://www.postgresql.org/download/windows/
)

echo.

REM ============================================
REM 2. CONFIGURATION DU FICHIER .ENV
REM ============================================

echo [INFO] Configuration des variables d'environnement...
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] Fichier .env cree depuis .env.example
        
        REM Generer un SESSION_SECRET aleatoire
        for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set SESSION_SECRET=%%i
        
        REM Remplacer dans .env (Windows)
        powershell -Command "(gc .env) -replace 'SESSION_SECRET=.*', 'SESSION_SECRET=!SESSION_SECRET!' | Out-File -encoding ASCII .env"
        echo [OK] SESSION_SECRET genere automatiquement
        
        echo.
        echo [ATTENTION] Veuillez editer le fichier .env pour configurer:
        echo   - DATABASE_URL (connexion PostgreSQL)
        echo   - OPENAI_API_KEY (pour le chatbot IA)
        echo   - RESEND_API_KEY (pour les emails)
        echo   - VITE_GOOGLE_MAPS_API_KEY (pour la carte)
        echo.
        pause
    ) else (
        echo [ERREUR] Fichier .env.example introuvable!
        pause
        exit /b 1
    )
) else (
    echo [INFO] Fichier .env existe deja, configuration conservee
)

echo.

REM ============================================
REM 3. INSTALLATION DES DEPENDANCES
REM ============================================

echo [INFO] Installation des dependances npm...
echo.

if exist "node_modules" (
    echo [ATTENTION] node_modules existe deja. Reinstallation...
)

call npm install
if %errorlevel% equ 0 (
    echo [OK] Dependances installees
) else (
    echo [ERREUR] Echec de l'installation des dependances
    pause
    exit /b 1
)

echo.

REM ============================================
REM 4. CONFIGURATION DE LA BASE DE DONNEES
REM ============================================

echo [INFO] Configuration de la base de donnees PostgreSQL...
echo.

where psql >nul 2>nul
if %errorlevel% equ 0 (
    set /p CREATE_DB="Voulez-vous creer automatiquement la base de donnees? (o/n) "
    if /i "!CREATE_DB!"=="o" (
        set /p DB_NAME="Nom de la base de donnees (defaut: burkina_watch): "
        if "!DB_NAME!"=="" set DB_NAME=burkina_watch
        
        set /p DB_USER="Utilisateur PostgreSQL (defaut: postgres): "
        if "!DB_USER!"=="" set DB_USER=postgres
        
        echo [INFO] Creation de la base de donnees !DB_NAME!...
        createdb -U !DB_USER! !DB_NAME! 2>nul
        if %errorlevel% equ 0 (
            echo [OK] Base de donnees creee
        ) else (
            echo [ATTENTION] La base existe deja ou erreur de creation
        )
    )
) else (
    echo [ATTENTION] PostgreSQL non detecte. Creez manuellement la base de donnees:
    echo   1. Installez PostgreSQL depuis https://www.postgresql.org/download/windows/
    echo   2. Creez la base avec pgAdmin ou: createdb burkina_watch
    echo   3. Configurez DATABASE_URL dans .env
)

echo.

REM ============================================
REM 5. MIGRATION DU SCHEMA
REM ============================================

echo [INFO] Migration du schema de base de donnees...
echo.

call npm run db:push
if %errorlevel% equ 0 (
    echo [OK] Schema migre avec succes
) else (
    echo [ATTENTION] Erreur lors de la migration. Tentative avec --force...
    call npm run db:push -- --force
    if %errorlevel% equ 0 (
        echo [OK] Schema migre avec --force
    ) else (
        echo [ERREUR] Impossible de migrer le schema. Verifiez DATABASE_URL dans .env
        pause
        exit /b 1
    )
)

echo.

REM ============================================
REM 6. BUILD DE PRODUCTION (optionnel)
REM ============================================

set /p BUILD_PROD="Voulez-vous builder pour la production maintenant? (o/n) "
if /i "!BUILD_PROD!"=="o" (
    echo [INFO] Build de production en cours...
    call npm run build
    if %errorlevel% equ 0 (
        echo [OK] Build termine. Fichiers dans .\dist\
    )
)

echo.

REM ============================================
REM 7. RESUME ET PROCHAINES ETAPES
REM ============================================

color 0A
echo ============================================
echo    OK INSTALLATION TERMINEE AVEC SUCCES!
echo ============================================
echo.
echo Prochaines etapes:
echo.
echo 1. Verifiez et completez la configuration dans .env
echo 2. Lancez l'application:
echo.
echo    Mode developpement:
echo    npm run dev
echo.
echo    Mode production:
echo    set NODE_ENV=production ^&^& node dist\index.js
echo.
echo 3. Accedez a l'application:
echo    http://localhost:5000
echo.
echo Documentation complete:
echo    - README_PORTABLE.md (guide d'installation)
echo    - replit.md (documentation technique)
echo.
echo Support:
echo    Tel: +226 65511323 ^| WhatsApp: +226 70019540
echo.
echo Burkina Watch - Voir. Agir. Proteger.
echo.

set /p LAUNCH_APP="Voulez-vous lancer l'application maintenant? (o/n) "
if /i "!LAUNCH_APP!"=="o" (
    echo [INFO] Demarrage de Burkina Watch...
    call npm run dev
)

pause
