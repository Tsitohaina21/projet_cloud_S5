@echo off
REM Script pour demarrer le serveur tile-server

title Demarrage du Serveur de Tuiles

cls
echo.
echo ════════════════════════════════════════════════════════════
echo   DEMARRAGE DU SERVEUR DE TUILES
echo ════════════════════════════════════════════════════════════
echo.

REM Verifier si le fichier existe
if not exist "tiles\antananarivo.mbtiles" (
    echo ERREUR: Fichier manquant!
    echo.
    echo Attendu: tiles\antananarivo.mbtiles
    echo.
    echo 1. Executez d'abord: 1-TELECHARGER.bat
    echo 2. Telechargez depuis BBBike Extract ou OpenMapTiles
    echo 3. Placez le fichier dans le dossier tiles\
    echo.
    pause
    exit /b 1
)

echo [OK] Fichier antananarivo.mbtiles trouve
echo.
echo Demarrage du serveur...
echo.

docker compose up -d tile-server

if errorlevel 1 (
    echo.
    echo ERREUR lors du demarrage!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Serveur demarrage!
echo.
echo Le serveur est accessible sur: http://localhost:8082
echo.
timeout /t 5 /nobreak

exit /b 0
