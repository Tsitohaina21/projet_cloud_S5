#!/usr/bin/env bash

# 🗺️ GUIDE DE DÉMARRAGE RAPIDE - Module Cartes Antananarivo
# Ce fichier guide étape par étape le démarrage du module

echo "════════════════════════════════════════════════════════════"
echo "🗺️  Module de Cartes - Antananarivo"
echo "════════════════════════════════════════════════════════════"
echo ""

# Vérifications préalables
echo "📋 Vérifications préalables..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "   👉 Installez Docker Desktop : https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✅ Docker installé"

if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose n'est pas installé"
    echo "   👉 Installez Docker Compose ou utilisez 'docker compose'"
fi
echo "✅ Prérequis OK"
echo ""

# Étape 1 : Préparer les données
echo "════════════════════════════════════════════════════════════"
echo "📍 ÉTAPE 1 : Préparer les données OSM"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Le fichier OSM d'Antananarivo doit être converti en MBTiles."
echo ""
echo "Vous avez plusieurs options :"
echo ""
echo "  1️⃣  Conversion automatique (recommandé)"
echo "      cd projet-cloud-s5/tile-server"
echo "      bash convert-osm.sh"
echo ""
echo "  2️⃣  Conversion manuelle avec Tippecanoe"
echo "      brew install tippecanoe osmium-tool    # macOS"
echo "      apt-get install tippecanoe osmium-tool # Linux"
echo "      osmium cat ../../../data/*.osm -o antananarivo.geojson"
echo "      tippecanoe -o antananarivo.mbtiles -z 14 -Z 0 antananarivo.geojson"
echo ""
echo "  3️⃣  Télécharger un MBTiles pré-généré"
echo "      https://maptiler.com/ ou https://data.openstreetmap.de/"
echo ""
echo "⚠️  IMPORTANT : Sans le fichier MBTiles, le serveur tile-server"
echo "              affichera 'No tileset' dans son interface web"
echo ""

# Étape 2 : Lancer les services
echo "════════════════════════════════════════════════════════════"
echo "🚀 ÉTAPE 2 : Lancer les services Docker"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Voulez-vous lancer les services maintenant ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd projet-cloud-s5
    echo "Lancement des services..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Services lancés avec succès"
        echo ""
        sleep 2
        docker-compose ps
    else
        echo "❌ Erreur au lancement des services"
        exit 1
    fi
else
    echo "⏭️  Démarrage skippé"
    echo "Pour lancer manuellement :"
    echo "  cd projet-cloud-s5"
    echo "  docker-compose up -d"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🌐 ÉTAPE 3 : Accéder à l'application"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Services disponibles :"
echo ""
echo "  🎨 Web App (Interface carte principale)"
echo "     👉 http://localhost:8080"
echo ""
echo "  🔐 Auth API (Authentification)"
echo "     👉 http://localhost:3001"
echo ""
echo "  🗺️  Tile Server (Admin tuiles)"
echo "     👉 http://localhost:8082"
echo ""

# Étape 4 : Tester
echo "════════════════════════════════════════════════════════════"
echo "✅ ÉTAPE 4 : Tester l'application"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Checklist de test :"
echo ""
echo "  [ ] 1. Ouvrir http://localhost:8080 dans le navigateur"
echo "  [ ] 2. Voir la carte d'Antananarivo centrée"
echo "  [ ] 3. Voir 3 marqueurs colorés (Orange, Bleu, Vert)"
echo "  [ ] 4. Cliquer sur un marqueur → popup"
echo "  [ ] 5. Voir les statistiques à droite"
echo "  [ ] 6. Panneau d'auth à gauche → Se connecter"
echo "  [ ] 7. Zoomer/Déplacer la carte"
echo ""

# Étape 5 : Commandes utiles
echo "════════════════════════════════════════════════════════════"
echo "🛠️  COMMANDES UTILES"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Voir les logs :"
echo "  docker-compose logs -f web-app"
echo "  docker-compose logs -f tile-server"
echo "  docker-compose logs -f auth-api"
echo ""

echo "Arrêter les services :"
echo "  docker-compose stop"
echo ""

echo "Redémarrer les services :"
echo "  docker-compose restart"
echo ""

echo "Arrêter et supprimer :"
echo "  docker-compose down"
echo ""

echo "Reconstruire les images :"
echo "  docker-compose build"
echo ""

# Documentation
echo "════════════════════════════════════════════════════════════"
echo "📚 DOCUMENTATION"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Fichiers de documentation :"
echo ""
echo "  📘 MODULE_CARTES.md"
echo "     Récapitulatif complet du module"
echo "     👉 Lire en premier"
echo ""

echo "  📗 CARTES.md"
echo "     Guide détaillé Leaflet et configuration"
echo "     👉 Pour développement"
echo ""

echo "  📙 CONVERSION_OSM.md"
echo "     Instructions de conversion OSM → MBTiles"
echo "     👉 Pour préparer les données"
echo ""

echo "  📓 README.md"
echo "     Vue d'ensemble du projet"
echo "     👉 Contexte général"
echo ""

# Support
echo "════════════════════════════════════════════════════════════"
echo "⚠️  DÉPANNAGE"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Problème : 'Connexion refused' sur port 8080"
echo "Solution : docker-compose logs web-app"
echo ""

echo "Problème : 'No tileset' sur tile-server"
echo "Solution : Générer antananarivo.mbtiles"
echo "         : cd tile-server && bash convert-osm.sh"
echo ""

echo "Problème : Port déjà utilisé"
echo "Solution : lsof -i :8080"
echo "         : kill -9 <PID>"
echo ""

echo "Problème : Carte vide"
echo "Solution : Ouvrir la console du navigateur (F12)"
echo "         : Chercher les erreurs dans l'onglet 'Console'"
echo ""

# Ressources
echo "════════════════════════════════════════════════════════════"
echo "🔗 RESSOURCES"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Leaflet Documentation"
echo "  👉 https://leafletjs.com/"
echo ""

echo "OpenStreetMap"
echo "  👉 https://www.openstreetmap.org/"
echo ""

echo "Tile Server GL"
echo "  👉 https://tileserver.readthedocs.io/"
echo ""

echo "Tippecanoe (Tuiles)"
echo "  👉 https://github.com/mapbox/tippecanoe"
echo ""

# Finale
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✨ Prêt ! Votre application de cartes est configurée"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Prochaines étapes :"
echo ""
echo "  1. Générer le fichier MBTiles"
echo "  2. Lancer les services avec docker-compose"
echo "  3. Accéder à http://localhost:8080"
echo "  4. Profiter ! 🎉"
echo ""
echo "Bon développement ! 🚀"
echo ""
