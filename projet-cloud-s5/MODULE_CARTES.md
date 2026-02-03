# 📍 Module Cartes - Récapitulatif Complet

Configuration complète du module de gestion des cartes pour le projet cloud.

## ✅ Ce qui a été configuré

### 1. **Serveur de Cartes Offline (Tile Server GL)**
- ✅ Dockerfile créé
- ✅ Prêt à servir des tuiles MBTiles
- ✅ Script de conversion OSM→MBTiles inclus
- 📍 Port : 8082
- 🗂️ Localisation : `tile-server/`

### 2. **Application Web avec Leaflet**
- ✅ Interface HTML5 moderne
- ✅ Intégration Leaflet complète
- ✅ Marqueurs personnalisés par statut
- ✅ Système d'authentification
- ✅ Affichage de statistiques
- ✅ Popups et tooltips informatifs
- ✅ Plusieurs couches (OSM + Satellite)
- 📍 Port : 8080
- 🗂️ Localisation : `web-app/`

### 3. **Données Géographiques**
- ✅ Fichier OSM d'Antananarivo préparé
- ✅ Coordonnées : 47.303°E à 47.737°E, -19.047°S à -18.775°S
- 🗂️ Localisation : `data/planet_47.303,-19.047_47.737,-18.775.osm`

### 4. **Documentation Complète**
- ✅ Guide Leaflet et configuration
- ✅ Instructions de conversion OSM
- ✅ README du projet
- 📄 Fichiers : `CARTES.md`, `CONVERSION_OSM.md`

## 🚀 Démarrage rapide

### Étape 1 : Préparer les données (Une seule fois)

```bash
cd projet-cloud-s5/tile-server
bash convert-osm.sh
```

**Cela génère** : `antananarivo.mbtiles` (~100-200 MB)

### Étape 2 : Lancer les services

```bash
cd projet-cloud-s5
docker-compose up -d
```

### Étape 3 : Accéder à l'application

| Service | URL | Détails |
|---------|-----|---------|
| **Web App** | http://localhost:8080 | 🎨 Interface interactive |
| **Auth API** | http://localhost:3001 | 🔐 Authentification |
| **Tile Server** | http://localhost:8082 | 🗺️ Admin des tuiles |

## 🗺️ Fonctionnalités Leaflet

### Affichage
- ✅ Carte centrée sur Antananarivo (lat -18.8792, lng 47.5079)
- ✅ Zoom par défaut : 13
- ✅ Zoom min/max : 0-19
- ✅ Deux couches disponibles : OpenStreetMap et Satellite

### Interactions
- ✅ Clic pour afficher les coordonnées
- ✅ Marqueurs cliquables avec popups détaillés
- ✅ Tooltips au survol des marqueurs
- ✅ Contrôles de zoom et de pan
- ✅ Échelle kilométrique

### Données affichées
```javascript
{
  id: int,                    // Identifiant unique
  lat: float,                 // Latitude
  lng: float,                 // Longitude
  nom: string,                // Nom du lieu
  date: date,                 // Date du problème
  status: 'nouveau'|'en-cours'|'termine',
  surface: int,               // Surface en m²
  budget: int,                // Budget en Ar
  entreprise: string,         // Entreprise responsable
  description: string         // Description
}
```

## 🎨 Marqueurs et Icônes

| Statut | Couleur | Icône |
|--------|---------|-------|
| Nouveau | 🟠 Orange | Marqueur orange |
| En cours | 🔵 Bleu | Marqueur bleu |
| Terminé | 🟢 Vert | Marqueur vert |

## 📊 Affichages statistiques

L'application affiche en temps réel :
- Nombre de points d'intervention
- Surface totale à réparer (m²)
- Pourcentage d'avancement (%)
- Budget total engagé (Ar)

## 🔧 Architecture Docker

```yaml
Services:
├── auth-api         (Port 3001)
│   └── Express.js, JWT, Node.js
├── web-app          (Port 8080)
│   └── HTML5, Leaflet, JavaScript
└── tile-server      (Port 8082)
    └── Tile Server GL, MBTiles

Network:
└── app-network      (Bridge)
```

## 📁 Structure de fichiers

```
projet-cloud-s5/
├── CARTES.md                    # 📘 Guide complet Leaflet
├── docker-compose.yml           # 🐳 Orchestration Docker
├── README.md                    # 📖 Vue d'ensemble
│
├── auth-api/
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
│
├── web-app/
│   ├── Dockerfile
│   ├── index.html              # 🎨 Interface principale
│   ├── css/style.css           # 🎨 Styles
│   └── js/app.js               # ⚙️ Logique Leaflet
│
├── mobile-app/                 # (À développer)
│
└── tile-server/
    ├── Dockerfile
    ├── convert-osm.sh          # 🔄 Script de conversion
    ├── README.md
    └── antananarivo.mbtiles    # (À générer)

data/
└── planet_47.303,-19.047_47.737,-18.775.osm  # 🗺️ Données OSM
```

## 🔌 Intégration API

### Endpoints d'authentification

```javascript
// Login
POST /login
Body: { email: string, password: string }
Response: { token: string, user: object }

// Register
POST /register
Body: { nom: string, prenom: string, email: string, password: string }
Response: { success: boolean, message: string }
```

## 🛠️ Commandes utiles

```bash
# Lancer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f web-app

# Arrêter les services
docker-compose down

# Reconstruire les images
docker-compose build

# Exécuter une commande dans un conteneur
docker-compose exec web-app bash

# Afficher l'état des services
docker-compose ps
```

## 📦 Dépendances

### Frontend (Web App)
- Leaflet 1.9.4 (CDN)
- Font Awesome 6.4.0 (CDN)
- Vanilla JavaScript (ES6+)

### Backend (Auth API)
- Node.js 18+
- Express.js 4.18+
- JWT (jsonwebtoken)

### Cartes (Tile Server)
- Tile Server GL (Docker)
- MBTiles format

## 🎓 Exemples de code

### Ajouter un marqueur
```javascript
const marker = L.marker([-18.8792, 47.5079], {
    icon: L.icon({...})
}).addTo(map);

marker.bindPopup('Contenu du popup');
```

### Écouter un événement
```javascript
map.on('click', function(e) {
    console.log('Coordonnées:', e.latlng);
});
```

### Ajouter une forme
```javascript
L.circle([-18.8792, 47.5079], {
    radius: 500,
    color: 'red'
}).addTo(map);
```

## 🔒 Authentification

- ✅ Login/Register intégrés
- ✅ Tokens JWT
- ✅ LocalStorage pour persistance
- ✅ Gestion de session côté client

## 🐛 Dépannage

### "Le serveur tile-server n'affiche rien"
```bash
# Vérifiez que antananarivo.mbtiles existe
ls -la tile-server/antananarivo.mbtiles

# Si absent, lancez la conversion
cd tile-server && bash convert-osm.sh
```

### "CORS errors"
Les requêtes vers OpenStreetMap peuvent être bloquées. Solution :
- Utiliser un proxy CORS
- Ou passer par un tile server local

### "Port déjà utilisé"
```bash
# Vérifiez les processus
lsof -i :8080
lsof -i :3001
lsof -i :8082

# Tuez le processus
kill -9 <PID>
```

## 📈 Performance

- Tuiles pré-générées : ✅ Rapide
- Marqueurs multiples : ✅ Optimisé jusqu'à 1000
- Avec clustering : ✅ Jusqu'à 10000+

Pour plus de marqueurs, utilisez [Leaflet Markercluster](https://github.com/Leaflet/Leaflet.markercluster)

## 🔗 Ressources

- 📚 [Leaflet Documentation](https://leafletjs.com/)
- 🗺️ [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)
- 🔧 [Tile Server GL](https://tileserver.readthedocs.io/)
- 📊 [Tippecanoe](https://github.com/mapbox/tippecanoe)

## 📞 Prochaines étapes

- [ ] Générer le fichier antananarivo.mbtiles
- [ ] Lancer docker-compose up
- [ ] Tester l'interface à http://localhost:8080
- [ ] Ajouter des routes supplémentaires à l'API
- [ ] Implémenter la persistence de données
- [ ] Ajouter des couches WMS supplémentaires
- [ ] Optimiser avec clustering pour gros volumes

---

**Configuration terminée** ✅
**Prêt à démarrer** 🚀
**Date** : 20 janvier 2026
