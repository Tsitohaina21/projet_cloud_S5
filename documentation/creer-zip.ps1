<#
.SYNOPSIS
    Cree un fichier ZIP du projet pour la remise, sans les librairies.
.DESCRIPTION
    Ce script cree un ZIP contenant :
    - Les codes sources (sans node_modules, vendor, dist, .git, etc.)
    - Les instructions Docker (README)
    - La collection Postman
    - Un dossier vide 'apk/' ou placer l APK genere
#>

$projectRoot = Split-Path -Parent $PSScriptRoot
$zipName = "Mr-Rojo-S5.zip"
$outputZip = Join-Path $projectRoot $zipName
$tempDir = Join-Path $env:TEMP "projet-zip-$(Get-Random)"

Write-Host "=== Creation du ZIP de remise ===" -ForegroundColor Cyan
Write-Host ""

# Supprimer l'ancien ZIP s'il existe
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "[OK] Ancien ZIP supprime" -ForegroundColor Yellow
}

# Créer le dossier temporaire
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$destRoot = Join-Path $tempDir "Mr-Rojo-S5"
New-Item -ItemType Directory -Path $destRoot -Force | Out-Null

# Liste des exclusions (dossiers et fichiers à ne pas copier)
$excludeDirs = @(
    'node_modules',
    'vendor',
    '.git',
    '.vscode',
    'dist',
    'android',
    '.gradle',
    '.idea',
    'build',
    '__pycache__',
    '.cache',
    'coverage',
    'fonts'
)

$excludeFiles = @(
    '*.lock',
    'package-lock.json',
    'composer.lock',
    '*.zip',
    '*.mbtiles',
    'cloud-s5-d8158-firebase-adminsdk-*.json',
    'firebase-service-account.json'
)

function Copy-FilteredDirectory {
    param (
        [string]$Source,
        [string]$Destination
    )
    
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
    
    # Copier les fichiers (sauf exclus)
    Get-ChildItem -Path $Source -File | ForEach-Object {
        $skip = $false
        foreach ($pattern in $excludeFiles) {
            if ($_.Name -like $pattern) {
                $skip = $true
                break
            }
        }
        if (-not $skip) {
            Copy-Item $_.FullName -Destination $Destination
        }
    }
    
    # Copier les sous-dossiers (sauf exclus)
    Get-ChildItem -Path $Source -Directory | ForEach-Object {
        if ($excludeDirs -notcontains $_.Name) {
            $newDest = Join-Path $Destination $_.Name
            Copy-FilteredDirectory -Source $_.FullName -Destination $newDest
        }
    }
}

# === 1. Copier identity-provider ===
Write-Host "[1/5] Copie de identity-provider..." -ForegroundColor Green
$ipSrc = Join-Path $projectRoot "identity-provider"
$ipDest = Join-Path $destRoot "identity-provider"
Copy-FilteredDirectory -Source $ipSrc -Destination $ipDest

# === 2. Copier web-app ===
Write-Host "[2/5] Copie de web-app..." -ForegroundColor Green
$waSrc = Join-Path $projectRoot "web-app"
$waDest = Join-Path $destRoot "web-app"
Copy-FilteredDirectory -Source $waSrc -Destination $waDest

# === 3. Copier mobile ===
Write-Host "[3/5] Copie de mobile..." -ForegroundColor Green
$mobSrc = Join-Path $projectRoot "mobile"
$mobDest = Join-Path $destRoot "mobile"
Copy-FilteredDirectory -Source $mobSrc -Destination $mobDest

# === 4. Copier documentation ===
Write-Host "[4/5] Copie de la documentation..." -ForegroundColor Green
$docSrc = Join-Path $projectRoot "documentation"
$docDest = Join-Path $destRoot "documentation"
if (Test-Path $docSrc) {
    Copy-FilteredDirectory -Source $docSrc -Destination $docDest
}

# Créer le dossier apk (l'utilisateur devra y placer l'APK)
$apkDir = Join-Path $destRoot "apk"
New-Item -ItemType Directory -Path $apkDir -Force | Out-Null
Set-Content -Path (Join-Path $apkDir "LIRE-MOI.txt") -Value "=== APK Mobile ===`r`nPlacez ici le fichier APK genere depuis Android Studio.`r`n`r`nPour generer l APK :`r`n1. cd mobile`r`n2. npm install`r`n3. npm run build`r`n4. npx cap sync android`r`n5. npx cap open android`r`n6. Dans Android Studio : Build > Build Bundle(s) / APK(s) > Build APK(s)`r`n7. Copier le fichier app-debug.apk ici"

# Copier le README principal à la racine
Write-Host "[5/5] Finalisation..." -ForegroundColor Green
$readmeSrc = Join-Path $projectRoot "documentation\README.md"
if (Test-Path $readmeSrc) {
    Copy-Item $readmeSrc -Destination (Join-Path $destRoot "README.md")
}

# === Créer le ZIP ===
Write-Host ""
Write-Host "Compression en cours..." -ForegroundColor Cyan
Compress-Archive -Path $destRoot -DestinationPath $outputZip -Force

# Nettoyage
Remove-Item $tempDir -Recurse -Force

# Résultat
$zipSize = (Get-Item $outputZip).Length / 1MB
Write-Host ""
Write-Host "=== ZIP cree avec succes ===" -ForegroundColor Green
Write-Host "  Fichier : $outputZip" -ForegroundColor White
Write-Host "  Taille  : $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "Contenu du ZIP :" -ForegroundColor Yellow
Write-Host "  Mr-Rojo-S5/" -ForegroundColor White
Write-Host "    +-- identity-provider/    (Backend API + Docker)" -ForegroundColor White
Write-Host "    +-- web-app/              (Frontend React)" -ForegroundColor White
Write-Host "    +-- mobile/               (App Ionic/Capacitor)" -ForegroundColor White
Write-Host "    +-- documentation/        (README + Postman)" -ForegroundColor White
Write-Host "    +-- apk/                  (APK a placer ici)" -ForegroundColor White
Write-Host "    +-- README.md             (Instructions)" -ForegroundColor White
Write-Host ""
Write-Host "N oubliez pas de placer l APK dans le dossier apk/ du ZIP !" -ForegroundColor Yellow
