<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Signalement;
use App\Models\User;
use App\Services\FirebaseService;
use PDO;

class SyncController
{
    private $signalementModel;
    private $userModel;
    private $firebaseService;
    private $db;

    public function __construct()
    {
        $this->db = new PDO(
            'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'],
            $_ENV['DB_USER'],
            $_ENV['DB_PASSWORD']
        );
        $this->signalementModel = new Signalement($this->db);
        $this->userModel = new User($this->db);
        $this->firebaseService = new FirebaseService();
    }

    /**
     * Synchronisation Firebase (POST /sync)
     * 
     * Nouvelle architecture:
     * 1. PostgreSQL reste la source officielle des données
     * 2. Firebase Realtime Database est la couche de synchronisation cloud
     * 3. Mobile lit depuis Firebase (mode offline), synchronise au retour en ligne
     * 4. Web affiche depuis PostgreSQL, reçoit les mises à jour via Firebase
     * 
     * Flux:
     * - Exportation: PostgreSQL → Firebase (tous les signalements)
     * - Notifications: Changements PostgreSQL → Firebase → Mobile (FCM)
     * - Authentification: Manager crée → Firebase Admin SDK
     */
    public function syncWithFirebase(Request $request, Response $response): void
    {
        try {
            // Augmenter le timeout pour les synchronisations longues
            set_time_limit(300); // 5 minutes
            ini_set('max_execution_time', '300');
            
            error_log('\n=== DÉBUT SYNCHRONISATION ===');
            error_log('📊 Vérification de la configuration Firebase...');
            
            // Vérifier que Firebase est configuré
            if (!$this->firebaseService->isConfigured()) {
                error_log('❌ Firebase non configuré - Service Account manquant!');
                $response->status(500)->json([
                    'success' => false,
                    'error' => 'Firebase non configuré. Téléchargez le fichier service account depuis Firebase Console.',
                    'help' => 'https://console.firebase.google.com/project/cloud-s5-d8158/settings/serviceaccounts/adminsdk',
                    'file_path' => 'identity-provider/firebase-service-account.json'
                ]);
                return;
            }
            
            error_log('✅ Firebase configuré correctement');
            
            $results = [
                'imported' => 0,
                'updated' => 0,
                'exported' => 0,
                'failed' => 0,
                'accounts_synced' => 0,
                'message' => ''
            ];

            // NOUVELLE ARCHITECTURE OFFLINE-FIRST:
            // Étape 1: IMPORTER les signalements Firebase → PostgreSQL
            // (Les signalements sont créés dans Firebase par le mobile)
            error_log('📥 Étape 1: Import Firebase → PostgreSQL...');
            $importResult = $this->importFromFirebase();
            $results['imported'] = $importResult['imported'];
            $results['updated'] = $importResult['updated'] ?? 0;
            $results['failed'] = $importResult['failed'];
            error_log("✅ Import terminé: {$results['imported']} importés, {$results['updated']} mis à jour, {$results['failed']} échecs");
            
            // Étape 2: EXPORTER les signalements PostgreSQL → Firebase
            // (Pour que le mobile puisse voir les signalements créés/modifiés via web)
            error_log('📤 Étape 2: Export PostgreSQL → Firebase...');
            $signalements = $this->signalementModel->getAll();
            error_log('📊 Nombre de signalements dans PostgreSQL: ' . count($signalements));
            $exportResult = $this->firebaseService->syncSignalementsToFirebase($signalements);
            $results['exported'] = $exportResult['synced'];
            $results['failed'] += $exportResult['failed'];
            error_log("✅ Export terminé: {$results['exported']} exportés");
            
            $results['message'] = "Import: {$results['imported']} nouveaux + {$results['updated']} mis à jour. Export: {$results['exported']} signalements PostgreSQL → Firebase";
            
            error_log('=== FIN SYNCHRONISATION ===\n');
            error_log('📊 RÉSULTATS:');
            error_log("   - Importés (nouveaux Firebase→PostgreSQL): {$results['imported']}");
            error_log("   - Mis à jour (existants Firebase→PostgreSQL): {$results['updated']}");
            error_log("   - Exportés (PostgreSQL→Firebase): {$results['exported']}");
            error_log("   - Échecs: {$results['failed']}");

            // Étape 3: Synchroniser les comptes utilisateurs vers Firebase
            $accountsSync = $this->syncUserAccountsToFirebase();
            $results['accounts_synced'] = $accountsSync;

            $response->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Importe les signalements depuis Firebase Realtime DB vers PostgreSQL
     * Utilise UPSERT pour éviter les doublons
     */
    private function importFromFirebase(): array
    {
        try {
            $imported = 0;
            $updated = 0;
            $failed = 0;

            // Récupérer tous les signalements depuis Firebase
            error_log('📡 Récupération des signalements depuis Firebase Realtime DB...');
            $firebaseSignalements = $this->firebaseService->getAllSignalements();
            error_log('📊 Signalements trouvés dans Firebase: ' . count($firebaseSignalements));

            foreach ($firebaseSignalements as $firebaseId => $signalement) {
                try {
                    // Convertir firebase_id en string pour assurer la cohérence
                    $firebaseId = (string)$firebaseId;
                    
                    error_log("🔄 Traitement du signalement Firebase {$firebaseId}...");

                    // Préparer les données
                    $data = [
                        'firebase_id' => $firebaseId,  // ⚠️ CRITIQUE: Ne jamais laisser NULL
                        'latitude' => $signalement['latitude'] ?? 0,
                        'longitude' => $signalement['longitude'] ?? 0,
                        'description' => $signalement['description'] ?? '',
                        'surface' => $signalement['surface'] ?? 0,
                        'budget' => $signalement['budget'] ?? 0,
                        'entreprise' => $signalement['entreprise'] ?? null,
                        'user_email' => $signalement['user_email'] ?? null,
                        'status' => $signalement['status'] ?? 'nouveau',
                        'photos' => $signalement['photos'] ?? [],  // Passer array, create() fera json_encode
                        'synced' => false // Marquer comme non synchronisé vers Firebase pour export
                    ];
                    
                    if (empty($data['firebase_id'])) {
                        throw new \Exception("firebase_id vide pour $firebaseId - risque de doublon!");
                    }

                    // UPSERT: Vérifier si le signalement existe déjà par firebase_id
                    $existingId = $this->findSignalementByFirebaseId($firebaseId);
                    
                    if ($existingId) {
                        // ⚠️ IMPORTANT: Ne PAS mettre à jour les signalements existants complètement
                        // Les modifications du manager dans PostgreSQL ne doivent PAS être écrasées
                        // par les anciennes valeurs de Firebase
                        // MAIS: Il faut synchroniser les photos qui sont ajoutées depuis le mobile
                        error_log("⏭️ Signalement {$firebaseId} existe déjà avec ID PostgreSQL: {$existingId}");
                        
                        // Vérifier si Firebase a des photos qui n'existent pas dans PostgreSQL
                        $postgresSignalement = $this->signalementModel->getById($existingId);
                        $postgresPhotos = $postgresSignalement['photos'] ?? '[]';
                        $postgresPhotosArray = is_string($postgresPhotos) ? json_decode($postgresPhotos, true) : $postgresPhotos;
                        $postgresPhotosArray = $postgresPhotosArray ?? [];
                        
                        $firebasePhotos = $signalement['photos'] ?? [];
                        
                        // Fusionner les photos: garder PostgreSQL + ajouter celles de Firebase qui manquent
                        $mergedPhotos = array_unique(array_merge($postgresPhotosArray, $firebasePhotos ?? []));
                        
                        // Si les photos ont changé, mettre à jour seulement le champ photos
                        if (json_encode($mergedPhotos) !== json_encode($postgresPhotosArray)) {
                            error_log("📸 Mise à jour des photos pour signalement {$firebaseId}: " . count($mergedPhotos) . " photos");
                            $this->signalementModel->update($existingId, ['photos' => $mergedPhotos]);
                            $updated++;
                        } else {
                            error_log("✅ Photos déjà synchronisées pour signalement {$firebaseId}");
                        }
                    } else {
                        // Créer un nouveau signalement
                        error_log("🆕 Nouveau signalement {$firebaseId}, création...");
                        $postgresId = $this->signalementModel->create($data);
                        error_log("✅ Signalement {$firebaseId} créé dans PostgreSQL avec ID: {$postgresId}");
                        $imported++;
                    }

                } catch (\Exception $e) {
                    error_log("❌ Erreur import signalement {$firebaseId}: " . $e->getMessage());
                    $failed++;
                }
            }

            return ['imported' => $imported, 'updated' => $updated, 'failed' => $failed];
        } catch (\Exception $e) {
            throw new \Exception("Erreur lors de l'import depuis Firebase: " . $e->getMessage());
        }
    }

    /**
     * Trouve un signalement PostgreSQL par son firebase_id
     * @return int|null L'ID PostgreSQL ou null s'il n'existe pas
     */
    private function findSignalementByFirebaseId($firebaseId): ?int
    {
        try {
            // Convertir en string si c'est un entier
            $firebaseIdStr = (string)$firebaseId;
            
            $query = "SELECT id FROM signalements WHERE firebase_id = :firebase_id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':firebase_id' => $firebaseIdStr]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ? (int)$result['id'] : null;
        } catch (\Exception $e) {
            error_log("Erreur recherche firebase_id {$firebaseId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Synchronise les comptes utilisateurs vers Firebase Authentication
     * 
     * Les comptes sont créés par le manager dans l'interface web,
     * puis synchronisés vers Firebase Authentication pour le mobile
     * Cette fonction est appelée lors de la synchronisation manuelle via le bouton "Synchroniser"
     */
    private function syncUserAccountsToFirebase(): int
    {
        try {
            error_log('👥 Étape 3: Sync comptes utilisateurs PostgreSQL → Firebase Auth...');
            
            // Récupère les utilisateurs qui n'ont pas encore un UID Firebase
            // Inclut temp_password pour utiliser le même mot de passe que l'utilisateur a saisi
            $query = "SELECT id, email, first_name, last_name, role, temp_password FROM users WHERE firebase_uid IS NULL AND is_active = true ORDER BY created_at DESC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            error_log('📊 Utilisateurs sans firebase_uid trouvés: ' . count($users));
            
            $synced = 0;
            foreach ($users as $user) {
                try {
                    error_log("👤 Traitement utilisateur: {$user['email']}...");
                    
                    // Utiliser le mot de passe temporaire stocké lors de la création
                    // Si temp_password est vide, générer un mot de passe aléatoire (fallback)
                    $password = !empty($user['temp_password']) 
                        ? $user['temp_password'] 
                        : bin2hex(random_bytes(12)); // 24 caractères
                    
                    if (empty($user['temp_password'])) {
                        error_log("⚠️ Pas de temp_password pour {$user['email']}, génération d'un mot de passe aléatoire");
                    }
                    
                    // Créer le compte Firebase
                    $result = $this->firebaseService->createUserAccount(
                        $user['email'],
                        $password,
                        [
                            'role' => $user['role'],
                            'name' => trim($user['first_name'] . ' ' . $user['last_name'])
                        ]
                    );

                    if ($result['success']) {
                        // Enregistrer l'UID Firebase et effacer temp_password pour sécurité
                        $updateQuery = "UPDATE users SET firebase_uid = :uid, temp_password = NULL WHERE id = :id";
                        $updateStmt = $this->db->prepare($updateQuery);
                        $updateStmt->execute([
                            ':uid' => $result['uid'],
                            ':id' => $user['id']
                        ]);
                        
                        error_log("✅ Utilisateur {$user['email']} synchronisé avec Firebase UID: {$result['uid']}");
                        $synced++;
                    } else {
                        error_log("⚠️ Erreur sync {$user['email']}: {$result['error']}");
                    }
                } catch (\Exception $e) {
                    error_log("❌ Erreur sync compte {$user['email']}: " . $e->getMessage());
                }
            }
            
            error_log("✅ Sync comptes terminée: {$synced} utilisateurs synchronisés");
            return $synced;
        } catch (\Exception $e) {
            error_log("❌ Erreur lors de la sync des comptes: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Récupère les signalements depuis Firebase (inverse sync)
     * 
     * Appelé periodiquement pour importer les signalements créés
     * par le mobile quand firebase était le seul backend disponible
     */
    public function importSignalementsFromFirebase(Request $request, Response $response): void
    {
        try {
            $userEmail = $request->query('email') ?? '';
            
            if (!$userEmail) {
                $response->status(400)->json([
                    'error' => 'Email requis'
                ]);
                return;
            }

            // Récupère les signalements de l'utilisateur depuis Firebase
            $firebaseSignalements = $this->firebaseService->getUserSignalements($userEmail);

            $response->json([
                'success' => true,
                'signalements' => $firebaseSignalements,
                'count' => count($firebaseSignalements)
            ]);

        } catch (\Exception $e) {
            $response->status(500)->json([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Récupère les notifications Firebase d'un utilisateur
     */
    public function getNotifications(Request $request, Response $response): void
    {
        try {
            $userEmail = $request->query('email') ?? '';
            
            if (!$userEmail) {
                $response->status(400)->json([
                    'error' => 'Email requis'
                ]);
                return;
            }

            $notifications = $this->firebaseService->getUnreadNotifications($userEmail);

            $response->json([
                'success' => true,
                'notifications' => $notifications,
                'count' => count($notifications)
            ]);

        } catch (\Exception $e) {
            $response->status(500)->json([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Marque une notification comme lue
     */
    public function markNotificationAsRead(Request $request, Response $response): void
    {
        try {
            $data = $request->json();
            $userEmail = $data['email'] ?? '';
            $notificationKey = $data['notification_key'] ?? '';

            if (!$userEmail || !$notificationKey) {
                $response->status(400)->json([
                    'error' => 'Email et notification_key requis'
                ]);
                return;
            }

            $success = $this->firebaseService->markNotificationAsRead($userEmail, $notificationKey);

            $response->json([
                'success' => $success
            ]);

        } catch (\Exception $e) {
            $response->status(500)->json([
                'error' => $e->getMessage()
            ]);
        }
    }
}
