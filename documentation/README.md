# Projet Cloud S5 — Signalement de dégradation routière

## Structure du projet

```
├── identity-provider/   # API Backend (PHP 8.2 + PostgreSQL + Nginx)
├── web-app/             # Application web (React + Vite + Tailwind)
├── mobile/              # Application mobile (Ionic + Vue + Capacitor)
└── documentation/       # Documentation, collection Postman
```

---

## Prérequis

- **Docker** et **Docker Compose** installés
- **Node.js 18+** (pour le web-app en mode développement)
- **Android Studio** (pour générer l'APK mobile)

---

## 1. Lancer le Backend (Identity Provider API) avec Docker

Le backend inclut : API PHP, PostgreSQL, Nginx, Swagger UI, et un serveur de tuiles cartographiques.

```bash
cd identity-provider
docker-compose up -d --build
```

### Services démarrés

| Service        | URL                          | Description                     |
|----------------|------------------------------|---------------------------------|
| API            | http://localhost:8080/api     | API REST Identity Provider      |
| Swagger UI     | http://localhost:8081         | Documentation interactive API   |
| PostgreSQL     | localhost:5432                | Base de données                 |
| Tile Server    | http://localhost:8082         | Serveur de tuiles Antananarivo  |

### Vérifier que tout fonctionne

```bash
# Health check
curl http://localhost:8080/api/health

# Si erreur vendor/autoload.php, exécuter :
docker-compose exec --user root app composer install --no-interaction --optimize-autoloader
docker-compose exec --user root app chown -R identityuser:www-data /var/www/vendor
```

### Réinitialiser la base de données

```bash
docker-compose down -v
docker-compose up -d
```

### Variables d'environnement (identity-provider)

| Variable             | Défaut            | Description                    |
|----------------------|-------------------|--------------------------------|
| DB_NAME              | identity_db       | Nom de la base PostgreSQL      |
| DB_USER              | identity_user     | Utilisateur PostgreSQL         |
| DB_PASSWORD          | identity_pass     | Mot de passe PostgreSQL        |
| JWT_SECRET           | your-secret-key   | Clé secrète JWT                |
| FIREBASE_ENABLED     | false             | Activer Firebase               |
| SESSION_LIFETIME     | 3600              | Durée de vie session (sec)     |
| MAX_LOGIN_ATTEMPTS   | 3                 | Tentatives de connexion max    |

---

## 2. Lancer le Web App (React)

### Option A : Mode développement (sans Docker)

```bash
cd web-app
npm install
npm run dev
```

L'application sera disponible sur http://localhost:5173

### Option B : Docker (production)

```bash
cd web-app
docker build -t web-app .
docker run -d -p 3000:80 web-app
```

L'application sera disponible sur http://localhost:3000

### Configuration

Fichier `.env` dans `web-app/` :
```
VITE_API_URL=http://localhost:8080/api
```

---

## 3. Application Mobile (Ionic + Capacitor)

### Mode développement (navigateur)

```bash
cd mobile
npm install
npm run dev
```

### Générer l'APK Android

```bash
cd mobile
npm install
npm run build
npx cap add android      # (première fois uniquement)
npx cap sync android
npx cap open android     # Ouvre Android Studio
```

Dans Android Studio :
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. L'APK sera dans `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. Tester l'API avec Postman

1. Importer le fichier `documentation/Identity-Provider-API.postman_collection.json` dans Postman
2. Lancer le backend avec Docker (`docker-compose up -d --build` dans `identity-provider/`)
3. Exécuter les requêtes dans l'ordre :
   - **Health Check** : vérifier que l'API fonctionne
   - **Register** : créer un utilisateur
   - **Login** : se connecter et récupérer le token JWT
   - Le token est automatiquement enregistré dans la variable `{{token}}`
   - Les autres requêtes utilisent automatiquement ce token

### Endpoints principaux

| Méthode | URL                              | Auth   | Description                       |
|---------|----------------------------------|--------|-----------------------------------|
| GET     | /api/health                      | Non    | Health check                      |
| POST    | /api/auth/register               | Non    | Inscription                       |
| POST    | /api/auth/login                  | Non    | Connexion                         |
| POST    | /api/auth/logout                 | JWT    | Déconnexion                       |
| POST    | /api/auth/refresh                | JWT    | Rafraîchir le token               |
| GET     | /api/user/profile                | JWT    | Voir le profil                    |
| PUT     | /api/user/profile                | JWT    | Modifier le profil                |
| DELETE  | /api/user/account                | JWT    | Supprimer le compte               |
| GET     | /api/signalements                | Non    | Liste des signalements            |
| POST    | /api/signalements                | JWT    | Créer un signalement              |
| GET     | /api/signalements/{id}           | JWT    | Détail d'un signalement           |
| PUT     | /api/signalements/{id}           | JWT    | Modifier un signalement           |
| PATCH   | /api/signalements/{id}/status    | JWT    | Changer le statut                 |
| DELETE  | /api/signalements/{id}           | JWT    | Supprimer un signalement          |
| GET     | /api/stats                       | JWT    | Statistiques                      |
| GET     | /api/stats/delays                | JWT    | Statistiques des délais           |
| GET     | /api/settings                    | Non    | Paramètres                        |
| PUT     | /api/settings/{key}              | JWT    | Modifier un paramètre (manager)   |
| POST    | /api/admin/unlock-user           | JWT    | Débloquer un utilisateur          |
| POST    | /api/admin/users/create          | JWT    | Créer un utilisateur (admin)      |
| GET     | /api/admin/users                 | JWT    | Liste des utilisateurs (admin)    |
| PUT     | /api/admin/users/{id}/role       | JWT    | Changer le rôle d'un utilisateur  |

---

## 5. Arrêter les services

```bash
cd identity-provider
docker-compose down

# Pour supprimer aussi les données :
docker-compose down -v
```

---

## Technologies utilisées

- **Backend** : PHP 8.2, PostgreSQL 15, Nginx, JWT
- **Frontend Web** : React 19, Vite, Tailwind CSS, Leaflet
- **Mobile** : Ionic 8, Vue 3, Capacitor, Firebase
- **DevOps** : Docker, Docker Compose
- **API Docs** : Swagger / OpenAPI 3.0
