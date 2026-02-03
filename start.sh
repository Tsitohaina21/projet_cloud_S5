#!/bin/bash

# Identity Provider - Script de démarrage rapide
# Usage: ./start.sh

set -e

echo "🚀 Identity Provider - Démarrage"
echo "================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Docker
echo -e "\n${BLUE}[1/5]${NC} Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installé"

# Vérifier Docker Compose
echo -e "\n${BLUE}[2/5]${NC} Vérification de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose installé"

# Créer .env si nécessaire
echo -e "\n${BLUE}[3/5]${NC} Configuration de l'environnement..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠${NC}  Création du fichier .env..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Fichier .env créé"
    echo -e "${YELLOW}⚠${NC}  N'oubliez pas de modifier JWT_SECRET et les mots de passe !"
else
    echo -e "${GREEN}✓${NC} Fichier .env existe déjà"
fi

# Arrêter les conteneurs existants
echo -e "\n${BLUE}[4/5]${NC} Nettoyage des conteneurs existants..."
docker-compose down 2>/dev/null || true

# Construire et démarrer
echo -e "\n${BLUE}[5/5]${NC} Démarrage de l'application..."
docker-compose up -d --build

# Attendre que les services soient prêts
echo -e "\n${YELLOW}⏳${NC} Attente du démarrage des services..."
sleep 10

# Vérifier l'état
echo -e "\n${BLUE}Vérification de l'état des services...${NC}"
docker-compose ps

# Installer les dépendances PHP
echo -e "\n${BLUE}Installation des dépendances PHP...${NC}"
docker-compose exec -T app composer install --no-interaction --optimize-autoloader 2>/dev/null || true

# Tests de santé
echo -e "\n${BLUE}Test de l'API...${NC}"
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:8080/api/health || echo "failed")
if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✓${NC} API accessible"
else
    echo -e "${RED}❌ API non accessible${NC}"
fi

# Afficher les informations
echo -e "\n${GREEN}================================="
echo -e "✅ Identity Provider démarré !${NC}"
echo -e "================================="
echo ""
echo -e "${BLUE}📍 URLs disponibles:${NC}"
echo -e "   API:     ${GREEN}http://localhost:8080/api${NC}"
echo -e "   Swagger: ${GREEN}http://localhost:8081${NC}"
echo -e "   Health:  ${GREEN}http://localhost:8080/api/health${NC}"
echo ""
echo -e "${BLUE}📊 Base de données:${NC}"
echo -e "   Host: localhost:5432"
echo -e "   DB:   identity_db"
echo ""
echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo -e "   Logs:      ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Stop:      ${YELLOW}docker-compose stop${NC}"
echo -e "   Restart:   ${YELLOW}docker-compose restart${NC}"
echo -e "   Shell:     ${YELLOW}docker-compose exec app bash${NC}"
echo ""
echo -e "${BLUE}📚 Test rapide:${NC}"
echo -e "   ${YELLOW}curl http://localhost:8080/api/health${NC}"
echo ""