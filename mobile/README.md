# Module Mobile - Travaux Routiers Antananarivo

Application mobile Ionic Vue pour signaler et suivre les travaux routiers.

## 🚀 Fonctionnalités

### ✅ Authentification
- Connexion via Firebase Authentication
- Les comptes sont créés uniquement par le manager via l'application web
- Déconnexion sécurisée

### 📍 Signalement de problèmes
- Localisation GPS automatique
- Carte interactive avec Leaflet + OpenStreetMap
- Ajout de photos (appareil photo ou galerie)
- Description du problème
- Surface estimée

### 🗺️ Visualisation
- Carte avec tous les signalements
- Marqueurs colorés par statut :
  - 🔴 Rouge = Nouveau
  - 🟠 Orange = En cours
  - 🟢 Vert = Terminé
- Statistiques récapitulatives (total, nouveau, en cours, terminé)

### 📋 Mes signalements
- Liste de tous vos signalements
- Filtre "Mes signalements uniquement"
- Détails complets de chaque signalement
- Mise à jour en temps réel

### 🔔 Notifications Push
- Notification à chaque changement de statut
- Enregistrement du token sur Firebase
- Support iOS et Android

## 📦 Installation

```bash
cd mobile
npm install
```

## ⚙️ Configuration

1. Créer un projet Firebase (https://console.firebase.google.com)
2. Activer Authentication (Email/Password)
3. Activer Realtime Database
4. Activer Storage
5. Copier les credentials dans `.env`

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 🏃 Démarrage

### Mode développement (navigateur)
```bash
ionic serve
```

### Build pour Android
```bash
ionic capacitor add android
ionic capacitor build android
ionic capacitor open android
```

### Build pour iOS
```bash
ionic capacitor add ios
ionic capacitor build ios
ionic capacitor open ios
```

## 📱 Structure

```
mobile/src/
├── views/
│   ├── LoginPage.vue              # Authentification
│   ├── MapPage.vue                # Carte principale
│   ├── CreateSignalementPage.vue  # Création signalement
│   ├── MySignalementsPage.vue     # Liste mes signalements
│   └── Tab3Page.vue               # Profil
├── services/
│   ├── authService.ts             # Firebase Auth
│   ├── signalementService.ts      # CRUD signalements
│   └── notificationService.ts     # Push notifications
├── firebase.config.ts             # Config Firebase
└── router/
    └── index.ts                   # Routes + guards
```

## 🔐 Permissions requises

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Pour localiser vos signalements</string>
<key>NSCameraUsageDescription</key>
<string>Pour prendre des photos des problèmes routiers</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Pour ajouter des photos</string>
```

## 📊 Base de données Firebase

### Structure Realtime Database
```
signalements/
  - signalementId
    - latitude: number
    - longitude: number
    - status: "nouveau" | "en_cours" | "termine"
    - description: string
    - surface: number
    - photos: string[]
    - userId: string
    - userEmail: string
    - createdAt: string
    - updatedAt: string

userTokens/
  - userId
    - token: string
    - platform: "mobile"
    - updatedAt: string
```

## 🔄 Synchronisation

L'app mobile fonctionne avec Firebase Realtime Database pour :
- Stocker les signalements créés sur mobile
- Recevoir les mises à jour de statut du web
- Synchroniser en temps réel

Le backend PHP synchronise périodiquement :
- Import des signalements depuis Firebase → PostgreSQL
- Export des signalements PostgreSQL → Firebase
- Envoi des comptes créés → Firebase Auth

## 🎨 Personnalisation

Les couleurs sont dans `src/theme/variables.css` :
```css
--ion-color-primary: #3880ff;
--ion-color-secondary: #3dc2ff;
--ion-color-tertiary: #5260ff;
```

## 📝 Notes

- Les comptes ne peuvent PAS être créés depuis l'app mobile
- Seul le manager peut créer des comptes via l'app web
- Les signalements sont d'abord sauvegardés sur Firebase
- La synchronisation avec PostgreSQL se fait via l'API backend
