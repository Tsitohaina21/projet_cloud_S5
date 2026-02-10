# Données de carte OSM pour Antananarivo

## Téléchargement des tuiles

Pour utiliser la carte offline, vous devez télécharger les données d'Antananarivo au format MBTiles.

### Option 1 : Téléchargement automatique (Recommandé)

Utilisez le script suivant pour télécharger automatiquement les tuiles :

```bash
cd tiles
# Télécharger les données d'Antananarivo depuis OpenMapTiles
wget https://download.maptiler.com/data/v3/antananarivo.mbtiles -O antananarivo.mbtiles
```

### Option 2 : Téléchargement manuel

1. Visitez https://openmaptiles.org/downloads/planet/
2. Recherchez "Madagascar" ou utilisez un extracteur comme https://extract.bbbike.org/
3. Téléchargez les données pour la région d'Antananarivo (coordonnées: lat -18.75 à -18.95, lon 47.3 à 47.7)
4. Placez le fichier `antananarivo.mbtiles` dans le dossier `tiles/`

### Option 3 : Générer avec tilemaker

Si vous voulez créer vos propres tuiles depuis des données OSM brutes :

```bash
# Télécharger les données OSM de Madagascar
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Installer tilemaker (si pas déjà fait)
# sudo apt install tilemaker

# Générer les tuiles pour Antananarivo
tilemaker --input madagascar-latest.osm.pbf \
  --output antananarivo.mbtiles \
  --bbox 47.3,-18.95,47.7,-18.75
```

### Option 4 : Utilisation de Protomaps (Moderne, recommandé)

Pour une meilleure performance et des tuiles plus légères :

```bash
# Télécharger depuis Protomaps (gratuit pour un usage modéré)
wget https://build.protomaps.com/antananarivo.pmtiles -O antananarivo.pmtiles
```

## Vérification

Une fois le fichier téléchargé, vérifiez qu'il se trouve bien dans :
```
identity-provider/tiles/antananarivo.mbtiles
```

Ensuite, démarrez le serveur avec :
```bash
docker compose up -d tile-server
```

Le serveur sera accessible sur http://localhost:8082

## Structure finale

```
tiles/
  ├── config.json              # Configuration du serveur
  ├── antananarivo.mbtiles     # Données de la carte (à télécharger)
  └── README.md                # Ce fichier
```

## URLs de téléchargement rapide

- **GeoFabrik Madagascar** : https://download.geofabrik.de/africa/madagascar-latest.osm.pbf
- **BBBike Extract** : https://extract.bbbike.org/ (personnalisé pour Antananarivo)
- **OpenMapTiles** : https://openmaptiles.org/ (nécessite un compte gratuit)

## Notes

- Le fichier MBTiles pour toute la ville d'Antananarivo fait environ 50-200 MB selon le niveau de zoom
- Le serveur supporte les formats : MBTiles, PMTiles
- Zoom recommandé : 10-18 (10 = vue d'ensemble, 18 = détails rues)
