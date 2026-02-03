@echo off
REM Script de lancement pour Windows - Projet Cloud Cartes

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo 🗺️  Lancement du Projet Cloud Cartes Antananarivo
echo ════════════════════════════════════════════════════════════
echo.

REM Vérifier Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé ou n'est pas en cours d'exécution
    echo 👉 Installez Docker Desktop : https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker est lancé
echo.

REM Aller au dossier du projet
cd /d "%~dp0projet-cloud-s5"
echo 📂 Dossier de travail: %cd%
echo.

REM Arrêter les conteneurs existants
echo 🛑 Arrêt des conteneurs existants...
docker-compose down >nul 2>&1
echo ✅ Conteneurs arrêtés
echo.

REM Construire les images
echo 🔨 Construction des images Docker...
echo    ⏳ Cela peut prendre 2-5 minutes...
docker-compose build --no-cache
if errorlevel 1 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
echo ✅ Images construites
echo.

REM Lancer les services
echo 🚀 Lancement des services...
docker-compose up -d
echo ✅ Services lancés
echo.

REM Attendre que les services démarrent
echo ⏳ Attente du démarrage des services (5 secondes)...
timeout /t 5 /nobreak >nul

REM Vérifier l'état
echo.
echo 📊 État des services:
docker-compose ps
echo.

REM Afficher les URLs d'accès
echo ════════════════════════════════════════════════════════════
echo ✨ Services disponibles:
echo ════════════════════════════════════════════════════════════
echo.
echo 🎨 Web App (Interface Leaflet)
echo    👉 http://localhost:8080
echo.
echo 🔐 Auth API
echo    👉 http://localhost:3001
echo.
echo 🗺️  Tile Server
echo    👉 http://localhost:8082
echo.

REM Conseils
echo ════════════════════════════════════════════════════════════
echo 💡 Commandes utiles:
echo ════════════════════════════════════════════════════════════
echo.
echo Voir les logs:
echo   docker-compose logs -f web-app
echo   docker-compose logs -f tile-server
echo.
echo Arrêter les services:
echo   docker-compose stop
echo.
echo Redémarrer les services:
echo   docker-compose restart
echo.
echo Arrêter et supprimer:
echo   docker-compose down
echo.

REM Derniers conseils
echo ════════════════════════════════════════════════════════════
echo 🎉 Prêt !
echo ════════════════════════════════════════════════════════════
echo.
echo Ouvrez votre navigateur et visitez:
echo   http://localhost:8080
echo.
pause
