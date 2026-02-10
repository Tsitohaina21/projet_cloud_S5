# Importer les données OSM d'Antananarivo dans le serveur de tuiles

Write-Host "=== Import des données OSM d'Antananarivo ===" -ForegroundColor Green
Write-Host ""

# URL des données OSM pour Madagascar (Geofabrik)
$osmUrl = "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"
$tempFile = "$env:TEMP\madagascar-latest.osm.pbf"

Write-Host "Ce script va :" -ForegroundColor Cyan
Write-Host "1. Télécharger les données OSM de Madagascar (~200 MB)"
Write-Host "2. Les importer dans le serveur de tuiles Docker"
Write-Host "3. Générer les tuiles pour Antananarivo"
Write-Host ""

$confirm = Read-Host "Continuer? (o/n)"
if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "Opération annulée." -ForegroundColor Yellow
    exit
}

# Étape 1: Télécharger les données OSM
Write-Host "`n[1/3] Téléchargement des données OSM de Madagascar..." -ForegroundColor Yellow
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $osmUrl -OutFile $tempFile -UseBasicParsing
    Write-Host "✓ Téléchargement terminé" -ForegroundColor Green
}
catch {
    Write-Host "✗ Erreur lors du téléchargement: $_" -ForegroundColor Red
    exit 1
}

# Étape 2: Copier le fichier dans le container
Write-Host "`n[2/3] Copie des données dans le container..." -ForegroundColor Yellow
docker cp $tempFile tile_server_antananarivo:/data/region.osm.pbf
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Fichier copié dans le container" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de la copie" -ForegroundColor Red
    exit 1
}

# Étape 3: Importer les données
Write-Host "`n[3/3] Import des données (cela peut prendre 10-30 minutes)..." -ForegroundColor Yellow
Write-Host "Attendez que le serveur termine l'import..." -ForegroundColor Cyan

docker exec tile_server_antananarivo /bin/bash -c "osmium extract -b 47.3,-18.95,47.7,-18.75 /data/region.osm.pbf -o /data/antananarivo.osm.pbf && import /data/antananarivo.osm.pbf"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Import terminé avec succès!" -ForegroundColor Green
    Write-Host "`nLe serveur de tuiles est maintenant opérationnel sur http://localhost:8082" -ForegroundColor Green
    Write-Host "Rechargez votre application web pour voir la carte offline." -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Erreur lors de l'import" -ForegroundColor Red
    Write-Host "Vérifiez les logs avec: docker logs tile_server_antananarivo" -ForegroundColor Yellow
}

# Nettoyage
Write-Host "`nNettoyage du fichier temporaire..." -ForegroundColor Yellow
Remove-Item $tempFile -ErrorAction SilentlyContinue
Write-Host "✓ Terminé" -ForegroundColor Green
