# Script pour télécharger les tuiles d'Antananarivo depuis Geofabrik
# Télécharge les données OSM de Madagascar et extrait Antananarivo

Write-Host "=== Téléchargement des données OSM pour Antananarivo ===" -ForegroundColor Green

$tilesDir = "tiles"
$osmFile = "$tilesDir/madagascar-latest.osm.pbf"
$mbtilesFile = "$tilesDir/antananarivo.mbtiles"

# Créer le dossier tiles s'il n'existe pas
if (-not (Test-Path $tilesDir)) {
    New-Item -ItemType Directory -Path $tilesDir
    Write-Host "✓ Dossier tiles créé" -ForegroundColor Green
}

# URL de téléchargement
$url = "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"

Write-Host "`nOption 1: Télécharger les données OSM de Madagascar (200-300 MB)" -ForegroundColor Yellow
Write-Host "Fichier: $osmFile"
Write-Host "Source: $url"
Write-Host "`nAttention: Vous devrez ensuite convertir ce fichier en MBTiles avec un outil comme tilemaker ou tippecanoe`n" -ForegroundColor Cyan

$download = Read-Host "Voulez-vous télécharger maintenant? (o/n)"

if ($download -eq "o" -or $download -eq "O") {
    Write-Host "`nTéléchargement en cours..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $osmFile -UseBasicParsing
        Write-Host "✓ Téléchargement terminé: $osmFile" -ForegroundColor Green
        
        Write-Host "`n=== Prochaines étapes ===" -ForegroundColor Cyan
        Write-Host "1. Installez tilemaker ou tippecanoe pour convertir les données"
        Write-Host "2. Ou utilisez un service en ligne comme BBBike Extract: https://extract.bbbike.org/"
        Write-Host "3. Placez le fichier antananarivo.mbtiles dans le dossier tiles/"
        Write-Host "4. Démarrez le serveur: docker compose up -d tile-server`n"
    }
    catch {
        Write-Host "✗ Erreur lors du téléchargement: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "`n=== Instructions manuelles ===" -ForegroundColor Cyan
    Write-Host "Pour obtenir les tuiles d'Antananarivo, utilisez l'une de ces méthodes:`n"
    
    Write-Host "Méthode 1 - BBBike Extract (Recommandé, facile):" -ForegroundColor Yellow
    Write-Host "  1. Allez sur https://extract.bbbike.org/"
    Write-Host "  2. Sélectionnez la zone d'Antananarivo sur la carte"
    Write-Host "  3. Format: Mbtiles"
    Write-Host "  4. Email: votre@email.com"
    Write-Host "  5. Recevez le lien de téléchargement par email"
    Write-Host "  6. Téléchargez et renommez en antananarivo.mbtiles`n"
    
    Write-Host "Méthode 2 - OpenMapTiles (Qualité professionnelle):" -ForegroundColor Yellow
    Write-Host "  1. Créez un compte gratuit sur https://openmaptiles.com/"
    Write-Host "  2. Téléchargez la région de Madagascar"
    Write-Host "  3. Extrayez la zone d'Antananarivo`n"
    
    Write-Host "Méthode 3 - Protomaps (Moderne, léger):" -ForegroundColor Yellow
    Write-Host "  1. Visitez https://protomaps.com/downloads"
    Write-Host "  2. Téléchargez Madagascar ou créez un extrait personnalisé`n"
    
    Write-Host "Coordonnées d'Antananarivo:" -ForegroundColor Green
    Write-Host "  Latitude: -18.95 à -18.75"
    Write-Host "  Longitude: 47.3 à 47.7`n"
}

Write-Host "=== Fichier attendu ===" -ForegroundColor Cyan
Write-Host "Placez le fichier téléchargé ici: $mbtilesFile`n"

Write-Host "Appuyez sur Entrée pour continuer..."
$null = Read-Host
