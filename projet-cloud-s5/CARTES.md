# Module Cartes - Guide Complet

Ce module gère l'affichage et la manipulation des cartes géographiques d'Antananarivo avec Leaflet.

## 📋 Vue d'ensemble

### Architecture

```
Module Cartes
├── Tile Server (Serveur de tuiles offline)
├── Web App (Interface Leaflet)
└── Données OSM (Antananarivo)
```

### Technologies

- **Leaflet** : Bibliothèque de cartographie interactive
- **Tile Server GL** : Serveur de tuiles vectorielles offline
- **OpenStreetMap** : Données géographiques
- **Docker** : Conteneurisation

## 🗺️ Composants

### 1. Tile Server (Tuiles Offline)

Service qui sert les tuiles de cartes en offline.

**Localisation** : `tile-server/`

**Port** : 8082

**Accès** : http://localhost:8082

#### Préparation des données

Les données OSM d'Antananarivo sont dans : `data/planet_47.303,-19.047_47.737,-18.775.osm`

Pour convertir le fichier OSM en MBTiles (format utilisé par Tile Server) :

##### Option 1 : Avec Tippecanoe (Recommandé)

```bash
# Installation des dépendances (sur votre machine hôte)
# macOS
brew install tippecanoe osmium-tool

# Ubuntu/Debian
sudo apt-get install tippecanoe osmium-tool

# Conversion
cd tile-server
bash convert-osm.sh
```

##### Option 2 : Avec Docker

```bash
# Créer une image avec les outils
docker run --rm -v $(pwd)/data:/data osgeo/gdal:latest \
  ogr2ogr -f GeoJSON /data/antananarivo.geojson \
  /data/planet_47.303,-19.047_47.737,-18.775.osm

# Puis utiliser tippecanoe dans un autre conteneur
```

##### Option 3 : Télécharger un MBTiles pré-généré

```bash
# Exemples publics :
# - https://maptiler.com/
# - https://data.openstreetmap.de/
```

#### Structure attendue

```
tile-server/
├── Dockerfile
├── antananarivo.mbtiles    ← À générer
├── convert-osm.sh
└── README.md
```

### 2. Web App avec Leaflet

Interface interactive pour afficher et manipuler la carte.

**Localisation** : `web-app/`

**Port** : 8080

**Accès** : http://localhost:8080

#### Fonctionnalités

✅ **Affichage de la carte** avec Leaflet
✅ **Marqueurs personnalisés** selon le statut des travaux
✅ **Authentification** utilisateur
✅ **Statistiques en temps réel** des problèmes routiers
✅ **Popups informatifs** au clic sur les marqueurs
✅ **Plusieurs couches** (OpenStreetMap, Satellite)
✅ **Contrôles interactifs** (zoom, pan, scale)

#### Structure des fichiers

```
web-app/
├── index.html          # Page principale
├── css/
│   └── style.css       # Styles personnalisés
├── js/
│   └── app.js          # Logique de l'application
└── Dockerfile
```

## 🚀 Démarrage rapide

### Avec Docker Compose

```bash
cd projet-cloud-s5

# Lancer tous les services
docker-compose up -d

# Afficher les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:8080 | Interface carte principale |
| Auth API | http://localhost:3001 | API d'authentification |
| Tile Server | http://localhost:8082 | Serveur de tuiles (admin) |

## 🎨 Utilisation de Leaflet

### Initialiser la carte

```javascript
const map = L.map('map').setView([-18.8792, 47.5079], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

### Ajouter des marqueurs

```javascript
const marker = L.marker([-18.8792, 47.5079]).addTo(map);
marker.bindPopup('Ceci est Antananarivo');
marker.bindTooltip('Tooltip');
```

### Ajouter des formes

```javascript
// Cercle
L.circle([-18.8792, 47.5079], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// Polygone
L.polygon([
    [-18.8792, 47.5079],
    [-18.8800, 47.5100],
    [-18.8780, 47.5100]
]).addTo(map);
```

### Événements

```javascript
map.on('click', function(e) {
    console.log('Clicked on:', e.latlng);
});

map.on('zoom', function() {
    console.log('Zoom level:', map.getZoom());
});
```

## 📊 Données des travaux routiers

L'application affiche des données de test avec les champs suivants :

```javascript
{
    id: 1,
    lat: -18.8792,          // Latitude
    lng: 47.5079,           // Longitude
    nom: "Rue de la Gare",   // Nom de la rue
    date: '2025-01-15',     // Date du signalement
    status: 'nouveau',      // Statut : nouveau | en-cours | termine
    surface: 150,           // Surface en m²
    budget: 5000000,        // Budget en Ar (Ariary)
    entreprise: 'BTP Mada', // Entreprise responsable
    description: '...'      // Description du problème
}
```

## 🔌 API Integration

### Endpoints attendus

L'application s'attend à ces endpoints de l'API d'authentification :

```
POST /login
{
    "email": "user@example.com",
    "password": "password"
}

POST /register
{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "user@example.com",
    "password": "password"
}
```

## 🛠️ Développement

### Ajouter une nouvelle fonctionnalité

1. Éditer `js/app.js` pour la logique
2. Éditer `css/style.css` pour le style
3. Éditer `index.html` pour l'HTML
4. Rafraîchir le navigateur (ou utiliser live reload)

### Debug avec la console du navigateur

```javascript
// Accéder à la carte
map.setView([-18.8792, 47.5079], 15);

// Vérifier les données
console.log(problemesRoutiers);

// Vérifier l'authentification
console.log(currentUser);
console.log(authToken);
```

## 📦 Installation des dépendances (optionnel)

Pour le développement local sans Docker :

```bash
# Web App (nécessite juste un serveur HTTP)
npm install -g http-server
cd web-app
http-server . -p 8080

# Auth API
cd auth-api
npm install
npm run dev

# Tile Server (nécessite tippecanoe)
brew install tippecanoe osmium-tool
```

## 🔗 Ressources

- **Leaflet Docs** : https://leafletjs.com/
- **OpenStreetMap** : https://www.openstreetmap.org/
- **Tile Server GL** : https://tileserver.readthedocs.io/
- **Tippecanoe** : https://github.com/mapbox/tippecanoe
- **GeoJSON Spec** : https://geojson.org/

## ⚠️ Notes importantes

1. **Données offline** : Assurez-vous que le fichier MBTiles est généré pour utiliser les cartes offline
2. **CORS** : Les requêtes cross-origin vers OpenStreetMap pourraient être bloquées
3. **Performance** : Avec beaucoup de marqueurs, considérez l'utilisation de clustering
4. **Zoom** : Le zoom par défaut est 13 pour Antananarivo (ajustable)

## 📝 Exemple d'intégration complète

```html
<!-- Index.html -->
<div id="map" style="height: 500px;"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    const map = L.map('map').setView([-18.8792, 47.5079], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Ajouter vos marqueurs et logique ici
</script>
```

## 📞 Support

Pour les problèmes :

1. Vérifier les logs Docker : `docker-compose logs tile-server`
2. Vérifier la console du navigateur (F12)
3. Vérifier que les ports ne sont pas déjà utilisés
4. Vérifier la connectivité réseau

---

**Dernière mise à jour** : 20 janvier 2026
