# 🗺️ Guide d'Installation Rapide - Projet Cloud Cartes

Vous avez déjà téléchargé la carte Antananarivo. Voici les prochaines étapes.

## ✅ État actuel

- ✅ Fichier OSM téléchargé : `data/planet_47.303,-19.047_47.737,-18.775.osm` (423 MB)
- ✅ Projet structuré
- ✅ Docker-compose configuré
- ⏳ Services à lancer

## 🚀 Étape 1 : Lancer les services (FACILE)

### Méthode 1 : Script PowerShell (RECOMMANDÉ)

```powershell
cd d:\L3\ROJO\projet-cloud-carte
powershell -ExecutionPolicy Bypass -File launch.ps1
```

Le script fera automatiquement :
1. Arrêter les conteneurs existants
2. Construire les images Docker
3. Lancer tous les services
4. Afficher les URLs d'accès

### Méthode 2 : Manuelle

```powershell
cd d:\L3\ROJO\projet-cloud-carte\projet-cloud-s5

# Construire
docker-compose build

# Lancer
docker-compose up -d

# Vérifier
docker-compose ps
```

## 🗂️ Étape 2 : Préparer le Tile Server (IMPORTANT)

### Option A : Utiliser les données OSM existantes

L'application fonctionne déjà avec OpenStreetMap en ligne. Mais pour un **serveur offline**, vous devez générer les MBTiles.

**Sur votre machine (Windows):**

1. **Installer les outils (une seule fois)**

   - Installez GDAL/OGR : https://trac.osgeo.org/osgeo4w/
   - Ou utilisez WSL2 pour Linux
   - Ou utilisez Docker

2. **Générer le MBTiles** 

   ```bash
   cd projet-cloud-s5/tile-server
   
   # Avec osmium + tippecanoe
   osmium cat ../../data/planet_47.303,-19.047_47.737,-18.775.osm -o antananarivo.geojson
   tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson
   ```

3. **Redémarrer le service**

   ```powershell
   docker-compose restart tile-server
   ```

### Option B : Utiliser OpenStreetMap en ligne (PLUS FACILE)

L'application fonctionne **parfaitement** avec OpenStreetMap en ligne. Aucune configuration supplémentaire nécessaire !

## 📱 Accéder à l'application

Une fois les services lancés, ouvrez votre navigateur :

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:8080 | 🎨 Interface Leaflet |
| **Auth API** | http://localhost:3001 | 🔐 API d'authentification |
| **Tile Server** | http://localhost:8082 | 🗺️ Serveur de tuiles |

## ✨ Fonctionnalités prêtes à utiliser

✅ Carte affichée avec Leaflet
✅ 3 marqueurs d'exemple (Orange, Bleu, Vert)
✅ Statistiques en temps réel
✅ Authentification (Login/Register)
✅ Interface responsive (desktop/mobile)
✅ Popups détaillés au clic
✅ Zoom/Pan fluide
✅ Deux couches (OSM + Satellite)

## 🔍 Vérifier l'état

```powershell
# Voir l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f web-app
docker-compose logs -f tile-server
docker-compose logs -f auth-api

# Vérifier un service spécifique
docker-compose logs tile-server | tail -20
```

## ⚠️ Dépannage

### "Connection refused" sur port 8080
```powershell
# Vérifier les logs
docker-compose logs web-app

# Reconstruire
docker-compose restart web-app
```

### "No tileset" sur tile-server
Le serveur tile-server affiche un message "No tileset" ?
→ C'est normal ! Cela signifie que le fichier MBTiles n'est pas généré
→ L'application utilise OpenStreetMap en ligne par défaut
→ C'est parfaitement opérationnel !

### Port déjà utilisé
```powershell
# Trouver quel processus utilise le port
netstat -ano | findstr :8080

# Arrêter le processus
taskkill /PID <PID> /F

# Ou lancer sur un port différent
# Modifier docker-compose.yml
```

### Docker ne répond pas
```powershell
# Redémarrer Docker Desktop
# Ou depuis PowerShell (Admin)
Restart-Service Docker -Force
```

## 📝 Personnaliser

### Modifier les données

Les données d'exemple sont dans `web-app/js/app.js` :

```javascript
const problemesRoutiers = [
    {
        id: 1,
        lat: -18.8792,
        lng: 47.5079,
        nom: "Rue de la Gare",
        // ... autres données
    }
];
```

### Modifier le style

Les styles CSS sont dans `web-app/css/style.css`

### Modifier le port

Dans `docker-compose.yml` :

```yaml
web-app:
  ports:
    - "8080:8080"  # Changer le premier 8080
```

## 📚 Documentation

Pour plus de détails :

- **MODULE_CARTES.md** - Récapitulatif complet
- **CARTES.md** - Guide Leaflet détaillé
- **ARCHITECTURE.md** - Vue technique
- **CONVERSION_OSM.md** - Instructions de conversion OSM

## 🎯 Prochaines étapes

1. ✅ Lancer les services avec le script PowerShell
2. ✅ Ouvrir http://localhost:8080
3. ✅ Tester l'interface (marqueurs, popups, auth)
4. ⏭️ (Optionnel) Générer le MBTiles pour un serveur offline
5. ⏭️ (Optionnel) Ajouter vos propres données

## 💡 Conseil

**Commencez maintenant sans le MBTiles !** L'application fonctionne parfaitement avec OpenStreetMap en ligne. Vous pouvez ajouter le serveur offline plus tard si besoin.

---

**Prêt ?** 

Lancez le script :
```powershell
cd d:\L3\ROJO\projet-cloud-carte
powershell -ExecutionPolicy Bypass -File launch.ps1
```

Puis ouvrez : **http://localhost:8080** 🚀
