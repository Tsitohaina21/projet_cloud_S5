#!/bin/bash

# Script pour convertir le fichier OSM en MBTiles
# Ce script doit être exécuté dans le répertoire tile-server

set -e

OSM_FILE="../../../data/planet_47.303,-19.047_47.737,-18.775.osm"
GEOJSON_FILE="antananarivo.geojson"
MBTILES_FILE="antananarivo.mbtiles"

echo "🗺️  Conversion du fichier OSM en MBTiles..."

# Vérifier que le fichier OSM existe
if [ ! -f "$OSM_FILE" ]; then
    echo "❌ Erreur: Le fichier OSM n'existe pas à: $OSM_FILE"
    exit 1
fi

# Vérifier les dépendances
if ! command -v tippecanoe &> /dev/null; then
    echo "❌ Erreur: tippecanoe n'est pas installé"
    echo "Installation sur macOS: brew install tippecanoe"
    echo "Installation sur Linux: voir https://github.com/mapbox/tippecanoe"
    exit 1
fi

if ! command -v osmium &> /dev/null; then
    echo "❌ Erreur: osmium n'est pas installé"
    echo "Installation: https://osmcode.org/osmium-tool/manual.html"
    exit 1
fi

echo "📥 Conversion OSM → GeoJSON..."
osmium cat "$OSM_FILE" -o "$GEOJSON_FILE"

echo "🔨 Création des tuiles MBTiles..."
tippecanoe -o "$MBTILES_FILE" -z 14 -Z 0 -c 1000 "$GEOJSON_FILE"

echo "✅ Succès! Fichier créé: $MBTILES_FILE"
echo "🚀 Démarrez le serveur avec: docker-compose up tile-server"
