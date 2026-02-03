# Guide de Conversion OSM → MBTiles

Antananarivo a été téléchargée et stockée dans `data/planet_47.303,-19.047_47.737,-18.775.osm`

Voici comment convertir ce fichier en MBTiles pour le serveur de tuiles.

## Étape 1 : Installer les outils

### Sur macOS (avec Homebrew)

```bash
# Installer Tippecanoe et Osmium-tool
brew install tippecanoe osmium-tool

# Optionnel : vérifier l'installation
tippecanoe --version
osmium --version
```

### Sur Ubuntu/Debian

```bash
# Installez les dépendances
sudo apt-get update
sudo apt-get install build-essential zlib1g-dev osmium-tool

# Installez Tippecanoe
cd /tmp
git clone https://github.com/mapbox/tippecanoe.git
cd tippecanoe
make && sudo make install
```

### Sur Windows (avec WSL2 recommandé)

```bash
# Dans WSL2 Ubuntu
sudo apt-get install osmium-tool build-essential zlib1g-dev

# Compiler Tippecanoe
cd /tmp
git clone https://github.com/mapbox/tippecanoe.git
cd tippecanoe
make && sudo make install
```

## Étape 2 : Convertir les données

### Méthode 1 : Avec le script bash (Recommandé)

```bash
cd tile-server
bash convert-osm.sh
```

Le script fera automatiquement :
1. Convertir OSM → GeoJSON
2. Créer les MBTiles
3. Nettoyer les fichiers temporaires

### Méthode 2 : Manuellement

```bash
cd tile-server

# Étape 1 : Convertir OSM en GeoJSON
osmium cat ../../../data/planet_47.303,-19.047_47.737,-18.775.osm -o antananarivo.geojson

# Étape 2 : Créer les MBTiles avec Tippecanoe
tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson

# Optionnel : Nettoyer
rm antananarivo.geojson
```

### Méthode 3 : Avec Docker (si les outils ne s'installent pas)

```bash
# Créer une image Docker avec les outils
docker run --rm -it \
  -v $(pwd):/workspace \
  -w /workspace \
  ubuntu:22.04 \
  bash -c "
    apt-get update && \
    apt-get install -y osmium-tool build-essential zlib1g-dev && \
    cd /tmp && \
    git clone https://github.com/mapbox/tippecanoe.git && \
    cd tippecanoe && \
    make && \
    make install && \
    cd /workspace && \
    osmium cat data/planet_47.303,-19.047_47.737,-18.775.osm -o antananarivo.geojson && \
    tippecanoe -o tile-server/antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson
  "
```

## Étape 3 : Vérifier le résultat

```bash
# Vérifier que le fichier MBTiles existe
ls -lh tile-server/antananarivo.mbtiles

# Devrait afficher quelque chose comme :
# -rw-r--r-- 1 user staff 150M Jan 20 12:34 tile-server/antananarivo.mbtiles
```

## Étape 4 : Lancer le serveur

```bash
# Avec Docker Compose
docker-compose up tile-server

# Ou manuellement
docker build -t tile-server tile-server/
docker run -it -p 8082:8080 -v $(pwd)/tile-server:/data tile-server
```

Accédez à : http://localhost:8082

## Paramètres Tippecanoe importants

```bash
tippecanoe [OPTIONS] fichier.geojson

# Options principales :
-o, --output FILE       Fichier de sortie MBTiles
-z, --maximum-zoom N    Zoom maximum (défaut : 14)
-Z, --minimum-zoom N    Zoom minimum (défaut : 0)
-d, --drop-densest-as-needed  Supprimer des points si nécessaire
-r, --hilbert           Utiliser la courbe de Hilbert
-c, --cluster N         Regrouper les points (performance)
```

## Paramètres recommandés pour Antananarivo

```bash
# Qualité normale
tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson

# Qualité haute (fichier plus gros)
tippecanoe -o antananarivo.mbtiles -z 18 -Z 0 -d antananarivo.geojson

# Performance (fichier plus petit)
tippecanoe -o antananarivo.mbtiles -z 10 -Z 0 -c 1000 antananarivo.geojson
```

## Dépannage

### Erreur : "command not found: tippecanoe"

```bash
# Vérifiez l'installation
which tippecanoe

# Réinstallez
brew reinstall tippecanoe
# ou
sudo make install  # depuis le dossier tippecanoe
```

### Erreur : "command not found: osmium"

```bash
# Vérifiez l'installation
which osmium

# Réinstallez sur macOS
brew reinstall osmium-tool

# Réinstallez sur Linux
sudo apt-get install --reinstall osmium-tool
```

### Fichier MBTiles trop volumineux

Réduisez le zoom maximum :

```bash
tippecanoe -o antananarivo.mbtiles -z 12 -Z 0 antananarivo.geojson
```

### Conversion très lente

Utilisez l'option `-c` pour le clustering :

```bash
tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 -c 1000 antananarivo.geojson
```

### Le serveur affiche "No tileset"

Vérifiez que :
1. Le fichier MBTiles existe : `ls tile-server/antananarivo.mbtiles`
2. Le fichier n'est pas corrompu : `file tile-server/antananarivo.mbtiles`
3. Les permissions sont correctes : `chmod 644 tile-server/antananarivo.mbtiles`

## Après la conversion

1. ✅ Placer le fichier `antananarivo.mbtiles` dans `tile-server/`
2. ✅ Lancer le serveur avec Docker Compose
3. ✅ Vérifier que http://localhost:8082 affiche la carte
4. ✅ L'application web peut maintenant utiliser les tuiles offline

## Resources

- Tippecanoe : https://github.com/mapbox/tippecanoe
- Osmium Tool : https://osmcode.org/osmium-tool/
- MBTiles Spec : https://github.com/mapbox/mbtiles-spec
- Tile Server GL : https://tileserver.readthedocs.io/

---

**Estimation du temps** : 5-15 min (dépend de la vitesse du processeur et de la taille du fichier)
