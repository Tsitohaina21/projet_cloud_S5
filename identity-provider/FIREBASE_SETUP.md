# Configuration Firebase Service Account

## ⚠️ IMPORTANT: Le backend nécessite un fichier JSON d'authentification

Le `FirebaseService.php` a besoin d'un fichier **service account JSON** pour communiquer avec Firebase Realtime Database depuis le backend PHP.

## 🔧 Étapes de configuration

### 1. Télécharger le fichier service account

1. Ouvrir la console Firebase: https://console.firebase.google.com/
2. Sélectionner votre projet: **cloud-s5-d8158**
3. Cliquer sur l'engrenage ⚙️ → **Paramètres du projet**
4. Aller dans l'onglet **Comptes de service**
5. Cliquer sur **Générer une nouvelle clé privée**
6. Télécharger le fichier JSON

### 2. Placer le fichier dans le projet

```bash
# Copier le fichier téléchargé ici:
identity-provider/firebase-service-account.json
```

**Chemin exact attendu par le code:**
```
c:\Users\Tsitohaina\Documents\L3\S5\web\firebase\cloud\
└── identity-provider/
    ├── firebase-service-account.json  ← ICI
    ├── src/
    ├── public/
    └── ...
```

### 3. Sécurité

⚠️ **NE JAMAIS committer ce fichier dans Git!**

Ajouter dans `.gitignore`:
```gitignore
firebase-service-account.json
*.json
!composer.json
!package.json
```

### 4. Vérifier la configuration

Le fichier JSON doit contenir:
```json
{
  "type": "service_account",
  "project_id": "cloud-s5-d8158",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-...@cloud-s5-d8158.iam.gserviceaccount.com",
  ...
}
```

### 5. Tester

Après avoir placé le fichier, redémarrer Docker:
```bash
docker-compose down
docker-compose up -d
```

Dans les logs, vous devriez voir:
```
✅ Firebase Admin SDK initialisé avec succès
```

Si le fichier est absent:
```
❌ ATTENTION: Fichier service account Firebase introuvable
```

## 🔍 Pourquoi ce fichier est nécessaire?

Le mobile utilise Firebase Auth (connexion utilisateur), mais le **backend PHP** a besoin d'un compte administrateur pour:
- Lire/écrire dans Realtime Database sans restriction
- Synchroniser PostgreSQL ↔ Firebase
- Gérer les signalements côté serveur

## 📊 Architecture finale

```
Mobile (offline) ──┐
                   ├──> Firebase Realtime DB ←──┐
                   │    (données en temps réel)  │
                   │                             │
                   └──> PostgreSQL ←─────────────┘
                        (via sync manuelle)      │
                                                 │
                        Backend PHP avec         │
                        Service Account ─────────┘
```

## ❓ Problèmes courants

### "0 signalements exportés"
→ Le fichier service account n'est pas présent ou invalide

### "Permission denied"
→ Vérifier les règles Firebase Realtime Database:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "signalements": {
      ".indexOn": ["user_email", "status", "synced"]
    }
  }
}
```

### "Database non configuré"
→ Vérifier que le fichier est au bon chemin et redémarrer Docker
