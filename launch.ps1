#!/usr/bin/env powershell

# Script pour démarrer le projet Cloud Cartes Antananarivo
# Exécutez ce script : powershell -ExecutionPolicy Bypass -File launch.ps1

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🗺️  Lancement du Projet Cloud Cartes Antananarivo" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est lancé
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
if (-not (docker --version 2>&1)) {
    Write-Host "❌ Docker n'est pas installé ou n'est pas en cours d'exécution" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker est lancé" -ForegroundColor Green
Write-Host ""

# Aller au dossier du projet
cd projet-cloud-s5
Write-Host "📂 Dossier de travail: $(pwd)" -ForegroundColor Yellow
Write-Host ""

# Arrêter les conteneurs existants
Write-Host "🛑 Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "✅ Conteneurs arrêtés" -ForegroundColor Green
Write-Host ""

# Construire les images
Write-Host "🔨 Construction des images Docker..." -ForegroundColor Yellow
Write-Host "   ⏳ Cela peut prendre 2-5 minutes..." -ForegroundColor Gray
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Images construites" -ForegroundColor Green
Write-Host ""

# Lancer les services
Write-Host "🚀 Lancement des services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Services lancés" -ForegroundColor Green
Write-Host ""

# Attendre que les services démarrent
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Vérifier l'état
Write-Host ""
Write-Host "📊 État des services:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Afficher les URLs d'accès
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Services disponibles:" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎨 Web App (Interface Leaflet)" -ForegroundColor Green
Write-Host "   👉 http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Auth API" -ForegroundColor Green
Write-Host "   👉 http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🗺️  Tile Server" -ForegroundColor Green
Write-Host "   👉 http://localhost:8082" -ForegroundColor Cyan
Write-Host ""

# Conseils
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💡 Commandes utiles:" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Voir les logs:"
Write-Host "  docker-compose logs -f web-app" -ForegroundColor Gray
Write-Host "  docker-compose logs -f tile-server" -ForegroundColor Gray
Write-Host ""
Write-Host "Arrêter les services:"
Write-Host "  docker-compose stop" -ForegroundColor Gray
Write-Host ""
Write-Host "Redémarrer les services:"
Write-Host "  docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Arrêter et supprimer:"
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""

# Derniers conseils
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚠️  Important!" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le tile-server affiche 'No tileset':" -ForegroundColor Yellow
Write-Host "  1. Générez le fichier antananarivo.mbtiles" -ForegroundColor Gray
Write-Host "  2. Placez-le dans tile-server/" -ForegroundColor Gray
Write-Host "  3. Redémarrez le service: docker-compose restart tile-server" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Prêt ! Ouvrez votre navigateur et visitez http://localhost:8080" -ForegroundColor Green
Write-Host ""
