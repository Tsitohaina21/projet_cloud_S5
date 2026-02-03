# Projet Cloud - Carte

Application multi-plateforme pour la gestion et visualisation de cartes géographiques.

## Structure du Projet

```
projet-cloud-s5/
├── auth-api/              # API d'authentification
│   ├── src/               # Code source
│   ├── package.json       # Dépendances Node.js
│   └── Dockerfile         # Configuration Docker
│
├── web-app/               # Application web (carte)
│   ├── index.html         # Page HTML principale
│   ├── css/               # Feuilles de style
│   ├── js/                # Scripts JavaScript
│   └── Dockerfile         # Configuration Docker
│
├── mobile-app/            # Application mobile
│   └── (Flutter ou React Native)
│
├── docker-compose.yml     # Orchestration des services
└── README.md              # Ce fichier
```

## Services

### Auth API
- **Port**: 3001
- **Description**: API d'authentification et gestion des tokens JWT
- **Endpoints**:
  - `GET /health` - Vérification de l'état
  - `POST /login` - Connexion utilisateur

### Web App
- **Port**: 8080
- **Description**: Application web de visualisation de carte
- **Stack**: HTML/CSS/JavaScript

### Mobile App
- **Description**: À développer (Flutter ou React Native)

## Démarrage Rapide

### Avec Docker Compose

```bash
# Lancer tous les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f
```

### Développement Local

#### Auth API
```bash
cd auth-api
npm install
npm run dev
```

#### Web App
```bash
cd web-app
npm install -g http-server
http-server . -p 8080
```

## Configuration

### Variables d'Environnement

Créer un fichier `.env` dans le répertoire `auth-api`:

```
PORT=3001
JWT_SECRET=votre-secret-jwt-change-en-production
```

## Accès aux Services

- **Web App**: http://localhost:8080
- **Auth API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Développement

### Prérequis
- Node.js 18+
- Docker et Docker Compose (optionnel)
- Git

### Installation des Dépendances

```bash
# Auth API
cd auth-api && npm install

# Web App (si utilisation d'un build tool)
cd ../web-app && npm install
```

## Contribution

1. Créer une branche (`git checkout -b feature/amazing-feature`)
2. Commiter vos changements (`git commit -m 'Add amazing feature'`)
3. Pousser vers la branche (`git push origin feature/amazing-feature`)
4. Ouvrir une Pull Request

## License

MIT
