@echo off
REM Script simple pour télécharger Antananarivo depuis BBBike Extract

title Installation Carte Offline - Antananarivo

cls
echo.
echo ════════════════════════════════════════════════════════════
echo   INSTALLATION CARTE OFFLINE - ANTANANARIVO
echo ════════════════════════════════════════════════════════════
echo.
echo ETAPE 1: TELECHARGER LES DONNEES
echo ──────────────────────────────────
echo.
echo Methode 1 (Rapide) - BBBike Extract:
echo   1. Allez sur: https://extract.bbbike.org/
echo   2. Cherchez "Antananarivo" 
echo   3. Format: Mbtiles
echo   4. Email: votre@email.com
echo   5. Cliquez "Extract"
echo   6. Recevez le lien par email (5-15 min)
echo   7. Telechargez le fichier
echo.
echo Coordonnees si recherche manuelle:
echo   West: 47.3   East: 47.7
echo   South: -18.95 North: -18.75
echo.
echo ETAPE 2: PLACER LE FICHIER
echo ──────────────────────────
echo.
echo Renommez en: antananarivo.mbtiles
echo Placez dans: identity-provider\tiles\
echo.
echo ETAPE 3: DEMARRER LE SERVEUR
echo ──────────────────────────────
echo.
echo Executez:
echo   docker compose up -d tile-server
echo.
echo ETAPE 4: VERIFIER
echo ─────────────────
echo.
echo Ouvrez: http://localhost:8082
echo.
echo ════════════════════════════════════════════════════════════
echo.

pause
