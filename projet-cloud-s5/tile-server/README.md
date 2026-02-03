# Tile Server - Serveur de Cartes Offline

Service pour servir des tuiles de cartes offline pour Antananarivo.

## Prérequis

- Docker
- Fichier OSM d'Antananarivo (déjà présent : `data/planet_47.303,-19.047_47.737,-18.775.osm`)

## Préparation des données

### Option 1 : Utiliser tippecanoe (Recommandé)

```bash
# Installer tippecanoe (sur l'hôte)
brew install tippecanoe  # macOS
# ou sur Ubuntu
sudo apt-get install tippecanoe

# Convertir OSM en GeoJSON
osmium cat ../../../data/planet_47.303,-19.047_47.737,-18.775.osm -o antananarivo.geojson

# Créer le fichier MBTiles
tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson
```

### Option 2 : Utiliser ogr2ogr

```bash
# Installer GDAL/OGR2OGR
# Ubuntu: sudo apt-get install gdal-bin
# macOS: brew install gdal

ogr2ogr -f GeoJSON antananarivo.geojson ../../../data/planet_47.303,-19.047_47.737,-18.775.osm
```

### Option 3 : Utiliser osmium + node-mapnik

```bash
# Créer le fichier MBTiles avec osmium-tool
osmium export ../../../data/planet_47.303,-19.047_47.737,-18.775.osm -o antananarivo.geojson

# Puis utiliser mbtiles-tools ou tippecanoe
```

## Structure du dossier

```
tile-server/
├── Dockerfile
├── antananarivo.mbtiles    ← À générer avec les outils ci-dessus
└── style.json              ← (optionnel) Fichier de style personnalisé
```

## Utilisation

### Avec Docker Compose

```bash
cd ../
docker-compose up tile-server -d
```

### Manuellement

```bash
docker build -t tile-server-antananarivo .
docker run -it -p 8082:8080 -v $(pwd):/data tile-server-antananarivo
```

## Accès

- Interface web : http://localhost:8082
- API GeoJSON : http://localhost:8082/data/antananarivo

## Documentation

- [TileServer GL Documentation](https://tileserver.readthedocs.io/)
- [Tippecanoe](https://github.com/mapbox/tippecanoe)
- [GDAL/OGR](https://gdal.org/)

## Notes

- Les données OSM incluent les routes et les bâtiments
- Les tuiles sont mises en cache par le navigateur
- Le service fonctionne complètement offline une fois les tuiles générées
