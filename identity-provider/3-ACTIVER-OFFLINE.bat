@echo off
REM Script pour basculer de tuiles en ligne vers offline

title Basculer vers Carte Offline

cls
echo.
echo ════════════════════════════════════════════════════════════
echo   ACTIVATION CARTE OFFLINE
echo ════════════════════════════════════════════════════════════
echo.
echo PREREQUIS:
echo ───────────
echo 1. Le fichier antananarivo.mbtiles doit etre dans:
echo    identity-provider\tiles\antananarivo.mbtiles
echo.
echo 2. Le serveur doit etre en cours d'execution:
echo    docker compose up -d tile-server
echo.
echo PROCEDURE:
echo ──────────
echo.
echo Editez le fichier:
echo   web-app\src\components\Map\MapView.jsx
echo.
echo Trouvez la ligne ~98 avec les TileLayer et:
echo.
echo 1. COMMENTEZ les tuiles OpenStreetMap en ligne:
echo    /*
echo    ^<TileLayer
echo      attribution='...'
echo      url="https://...openstreetmap..."
echo    /^>
echo    */
echo.
echo 2. DECOMMENTEZ les tuiles locales:
echo    ^<TileLayer
echo      attribution='...'
echo      url="http://localhost:8082/data/antananarivo/{z}/{x}/{y}.pbf"
echo    /^>
echo.
echo 3. Sauvegardez (Ctrl+S)
echo.
echo 4. La carte va recharger automatiquement avec les tuiles offline!
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
