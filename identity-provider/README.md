docker-compose up -d --build
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose exec --user root app composer install --no-interaction --optimize-autoloader
docker-compose exec --user root app chown -R identityuser:www-data /var/www/vendor
docker-compose down -v
docker-compose up -d
docker-compose logs -f postgres
docker cp database/init.sql identity_provider_db:/tmp/init.sql
docker exec -u postgres -i identity_provider_db psql -f /tmp/init.sql
docker exec -u postgres identity_provider_db psql -U postgres -d identity_db -c "\dt"
# Démarrage simple — Identity Provider API

Ce fichier montre la façon la plus simple pour lancer et tester l'API localement.

Prérequis
- Docker & Docker Compose

Lancer l'application
1. Depuis la racine du projet :

```bash
docker-compose up -d --build
```

2. Si l'endpoint `/api/health` renvoie une erreur liée à `vendor/autoload.php`, exécutez :

```powershell
# (PowerShell)
docker-compose exec --user root app composer install --no-interaction --optimize-autoloader
docker-compose exec --user root app chown -R identityuser:www-data /var/www/vendor
```

Initialiser la base de données (simple)
- Si vous n'avez pas de données importantes :

```bash
docker-compose down -v
docker-compose up -d
```

Tester rapidement (curl ou Postman)
- Health : GET http://localhost:8080/api/health
- Register : POST http://localhost:8080/api/auth/register
  Body (JSON):
  { "email": "test@example.com", "password": "password123", "first_name": "Test", "last_name": "User" }
- Login : POST http://localhost:8080/api/auth/login
  Body (JSON): { "email": "test@example.com", "password": "password123" }
  → récupérez le token dans la réponse et utilisez `Authorization: Bearer <token>` pour les routes protégées.

Fichiers utiles
- `docker-compose.yml`, `Dockerfile`, `database/init.sql`, `public/index.php`

Si vous voulez, je peux aussi :
- générer une collection Postman prête à l'import,
- ou créer un petit script curl pour automatiser les tests.

README simplifié créé par l'assistant.