<?php

declare(strict_types=1);

namespace App\Services;

use Kreait\Firebase\Contract\Database;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\AuthException;

/**
 * FirebaseService
 * 
 * Responsabilités:
 * 1. Authentification: Créer/gérer les comptes Firebase pour les utilisateurs mobiles
 * 2. Synchronisation: Synchroniser les signalements entre PostgreSQL et Realtime DB
 * 3. Notifications: Déclencher les notifications FCM lors de changements
 * 4. Mode offline: Stocker les données dans Firebase pour accès hors ligne
 */
class FirebaseService
{
    private ?Database $database = null;
    private ?FirebaseAuth $auth = null;

    public function __construct()
    {
        try {
            // Initialiser le SDK Firebase Admin avec le fichier de service account
            $serviceAccountPath = __DIR__ . '/../../firebase-service-account.json';
            
            if (!file_exists($serviceAccountPath)) {
                error_log("ATTENTION: Fichier service account Firebase introuvable à {$serviceAccountPath}");
                error_log("Téléchargez-le depuis: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk");
                return;
            }

            $factory = (new \Kreait\Firebase\Factory())
                ->withServiceAccount($serviceAccountPath)
                ->withDatabaseUri('https://cloud-s5-d8158-default-rtdb.europe-west1.firebasedatabase.app');
            
            $this->database = $factory->createDatabase();
            $this->auth = $factory->createAuth();
            
            error_log("✅ Firebase Admin SDK initialisé avec succès");
        } catch (\Exception $e) {
            error_log("❌ Erreur initialisation Firebase: " . $e->getMessage());
        }
    }

    /**
     * Crée un compte Firebase pour un nouvel utilisateur
     * Appelé par le manager lors de la création d'utilisateur
     */
    public function createUserAccount(string $email, string $password, array $metadata = []): array
    {
        try {
            if (!$this->auth) {
                return [
                    'success' => false,
                    'error' => 'Firebase Auth non configuré',
                    'uid' => null
                ];
            }

            $user = $this->auth->createUserWithEmailAndPassword($email, $password);

            // Stocker les métadonnées utilisateur dans Realtime Database
            $this->database
                ->getReference('users/' . $user->uid)
                ->set(array_merge(
                    [
                        'email' => $email,
                        'created_at' => (new \DateTime())->format('Y-m-d H:i:s'),
                        'role' => $metadata['role'] ?? 'user'
                    ],
                    $metadata
                ));

            return [
                'success' => true,
                'uid' => $user->uid,
                'email' => $email
            ];
        } catch (AuthException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'uid' => null
            ];
        }
    }

    /**
     * Synchronise tous les signalements PostgreSQL vers Firebase Realtime Database
     * UPSERT: Utilise l'ID Firebase existant si présent, sinon utilise l'ID PostgreSQL
     * 
     * Structure Firebase:
     * /signalements/{firebaseIdOuPostgresId}/
     *   ├── id (PostgreSQL ID)
     *   ├── firebase_id (ID Firebase utilisé comme clé)
     *   ├── latitude, longitude, description, status
     *   └── ... autres champs
     */
    public function syncSignalementsToFirebase(array $signalements): array
    {
        if (!$this->database) {
            return [
                'synced' => 0,
                'failed' => 0,
                'error' => 'Firebase Database non configuré'
            ];
        }

        $synced = 0;
        $failed = 0;

        foreach ($signalements as $signalement) {
            try {
                // ⚠️ CRITIQUE: Vérifier que firebase_id existe et n'est pas vide
                $firebaseId = $signalement['firebase_id'] ?? null;
                $postgresId = $signalement['id'] ?? null;
                
                if (empty($firebaseId)) {
                    // Signalement sans firebase_id = créé localement, utiliser l'ID PostgreSQL
                    // MAIS SEULEMENT si c'est un nombre (pas une clé Firebase déjà existante)
                    if (!is_numeric($postgresId)) {
                        error_log("⚠️ Signalement {$postgresId} a un firebase_id vide/invalide - skipped pour éviter doublon");
                        $failed++;
                        continue;
                    }
                    $firebaseKey = (string)$postgresId;
                    error_log("ℹ️ Signalement {$postgresId} créé localement, utilisera PostgreSQL ID comme clé Firebase");
                } else {
                    // Signalement avec firebase_id = importé depuis Firebase
                    $firebaseKey = $firebaseId;
                    error_log("ℹ️ Signalement {$postgresId} importé, utilisera firebase_id: {$firebaseKey}");
                }
                $firebaseData = [
                    'id' => $signalement['id'], // ID PostgreSQL
                    'firebase_id' => $firebaseKey, // Clé utilisée dans Firebase
                    'latitude' => floatval($signalement['latitude']),
                    'longitude' => floatval($signalement['longitude']),
                    'description' => $signalement['description'] ?? '',
                    'status' => $signalement['status'],
                    'user_email' => $signalement['user_email'],
                    'created_at' => $signalement['created_at'],
                    'updated_at' => $signalement['updated_at'] ?? $signalement['created_at'] ?? date('Y-m-d H:i:s'),
                    'surface' => intval($signalement['surface'] ?? 0),
                    'budget' => floatval($signalement['budget'] ?? 0),
                    'entreprise' => $signalement['entreprise'] ?? '',
                    'photos' => $this->parsePhotosJson($signalement['photos'] ?? '[]')
                ];

                // Retry logic pour les erreurs réseau temporaires
                $maxRetries = 3;
                $retryDelay = 1; // secondes
                $success = false;
                
                for ($attempt = 1; $attempt <= $maxRetries && !$success; $attempt++) {
                    try {
                        // Sauvegarder à la clé Firebase correcte (/signalements/{firebaseKey})
                        // Utilise SET pour créer ou remplacer
                        $this->database
                            ->getReference('signalements/' . $firebaseKey)
                            ->set($firebaseData);

                        // Ajouter aussi aux données utilisateur pour mode offline
                        $userEmail = $signalement['user_email'];
                        if ($userEmail) {
                            $encodedEmail = $this->encodeEmail($userEmail);
                            $this->database
                                ->getReference('user_signalements/' . $encodedEmail . '/' . $firebaseKey)
                                ->set($firebaseData);
                        }

                        $success = true;
                        $synced++;
                    } catch (\Exception $e) {
                        $errorMsg = $e->getMessage();
                        if ($attempt < $maxRetries && (
                            strpos($errorMsg, 'SSL') !== false || 
                            strpos($errorMsg, 'cURL') !== false ||
                            strpos($errorMsg, 'timeout') !== false
                        )) {
                            error_log("⚠️ Tentative {$attempt}/{$maxRetries} échouée pour signalement {$signalement['id']}, retry dans {$retryDelay}s...");
                            sleep($retryDelay);
                            continue;
                        }
                        throw $e; // Erreur non-réseau, propager
                    }
                }
                
                if (!$success) {
                    throw new \Exception("Échec après {$maxRetries} tentatives");
                }
                
            } catch (\Exception $e) {
                error_log("Erreur sync signalement {$signalement['id']}: " . $e->getMessage());
                $failed++;
            }
        }

        return [
            'synced' => $synced,
            'failed' => $failed,
            'total' => count($signalements)
        ];
    }

    /**
     * Met à jour un signalement dans Firebase
     * Appelé après chaque modification
     */
    public function updateSignalementInFirebase(array $signalement): bool
    {
        if (!$this->database) {
            return false;
        }

        try {
            // ⚠️ CRITIQUE: Utiliser firebase_id comme clé pour éviter les doublons
            $firebaseKey = $signalement['firebase_id'] ?? (string)$signalement['id'];
            
            if (empty($firebaseKey)) {
                error_log("⚠️ Impossible de mettre à jour Firebase - firebase_id vide pour signalement {$signalement['id']}");
                return false;
            }
            
            $firebaseData = [
                'id' => $signalement['id'],
                'firebase_id' => $firebaseKey,  // Inclure firebase_id dans les données
                'latitude' => floatval($signalement['latitude']),
                'longitude' => floatval($signalement['longitude']),
                'description' => $signalement['description'] ?? '',
                'status' => $signalement['status'],
                'user_email' => $signalement['user_email'],
                'created_at' => $signalement['created_at'],
                'updated_at' => $signalement['updated_at'],
                'surface' => intval($signalement['surface'] ?? 0),
                'budget' => floatval($signalement['budget'] ?? 0),
                'entreprise' => $signalement['entreprise'] ?? '',
                'photos' => $this->parsePhotosJson($signalement['photos'] ?? '[]')
            ];

            // Mettre à jour à la bonne clé Firebase (firebase_id, pas l'ID PostgreSQL)
            error_log("🔄 Mise à jour Firebase: /signalements/{$firebaseKey} (PostgreSQL ID: {$signalement['id']})");
            $this->database
                ->getReference('signalements/' . $firebaseKey)
                ->update($firebaseData);

            // Mettre à jour la copie utilisateur
            $userEmail = $signalement['user_email'];
            if ($userEmail) {
                $encodedEmail = $this->encodeEmail($userEmail);
                $this->database
                    ->getReference('user_signalements/' . $encodedEmail . '/' . $firebaseKey)
                    ->update($firebaseData);
            }

            return true;
        } catch (\Exception $e) {
            error_log("Erreur update signalement: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification à un utilisateur lors du changement de statut
     * Via Firebase Cloud Messaging
     */
    public function sendStatusNotification(string $userEmail, array $signalement, string $oldStatus): bool
    {
        if (!$this->database) {
            return false;
        }

        try {
            $newStatus = $signalement['status'];
            $statusLabels = [
                'nouveau' => 'Nouveau',
                'en_cours' => 'En cours',
                'termine' => 'Terminé'
            ];

            $message = [
                'type' => 'status_change',
                'signalement_id' => $signalement['id'],
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'title' => 'Mise à jour du signalement',
                'body' => 'Le signalement #' . $signalement['id'] . ' est passé de ' .
                          $statusLabels[$oldStatus] . ' à ' . $statusLabels[$newStatus],
                'sent_at' => date('Y-m-d H:i:s'),
                'read' => false
            ];

            // Stocker la notification dans Firebase pour récupération
            $encodedEmail = $this->encodeEmail($userEmail);
            $notificationKey = $encodedEmail . '_' . time() . '_' . $signalement['id'];
            $this->database
                ->getReference('notifications/' . $encodedEmail . '/' . $notificationKey)
                ->set($message);

            return true;
        } catch (\Exception $e) {
            error_log("Erreur envoi notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification générique lors de la modification d'un signalement
     * (changement de niveau, budget, entreprise, etc.)
     */
    public function sendChangeNotification(string $userEmail, array $signalement, string $changeDescription): bool
    {
        if (!$this->database) {
            return false;
        }

        try {
            $message = [
                'type' => 'signalement_update',
                'signalement_id' => $signalement['id'],
                'title' => 'Signalement modifié',
                'body' => 'Le signalement #' . $signalement['id'] . ' a été modifié : ' . $changeDescription,
                'sent_at' => date('Y-m-d H:i:s'),
                'read' => false
            ];

            $encodedEmail = $this->encodeEmail($userEmail);
            $notificationKey = $encodedEmail . '_' . time() . '_change_' . $signalement['id'];
            $this->database
                ->getReference('notifications/' . $encodedEmail . '/' . $notificationKey)
                ->set($message);

            return true;
        } catch (\Exception $e) {
            error_log("Erreur envoi notification changement: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupère les signalements d'un utilisateur depuis Firebase
     * Utilisé par le mobile pour le mode offline
     */
    public function getUserSignalements(string $userEmail): array
    {
        if (!$this->database) {
            return [];
        }

        try {
            $encodedEmail = $this->encodeEmail($userEmail);
            $reference = $this->database
                ->getReference('user_signalements/' . $encodedEmail)
                ->getSnapshot();

            $value = $reference->getValue() ?? [];
            
            return is_array($value) ? array_values($value) : [];
        } catch (\Exception $e) {
            error_log("Erreur récupération signalements: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Récupère les notifications non lues d'un utilisateur
     */
    public function getUnreadNotifications(string $userEmail): array
    {
        if (!$this->database) {
            return [];
        }

        try {
            $reference = $this->database
                ->getReference('notifications/' . urlencode($userEmail))
                ->orderByChild('read')
                ->equalTo(false)
                ->getSnapshot();

            $value = $reference->getValue() ?? [];
            
            return is_array($value) ? array_values($value) : [];
        } catch (\Exception $e) {
            error_log("Erreur récupération notifications: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Marque une notification comme lue
     */
    public function markNotificationAsRead(string $userEmail, string $notificationKey): bool
    {
        if (!$this->database) {
            return false;
        }

        try {
            $this->database
                ->getReference('notifications/' . urlencode($userEmail) . '/' . $notificationKey)
                ->update(['read' => true]);

            return true;
        } catch (\Exception $e) {
            error_log("Erreur marquage notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Synchronise un nouveau signalement du mobile vers PostgreSQL
     * (Firebase → PostgreSQL)
     * Le mobile crée dans Firebase, le backend l'intègre dans PostgreSQL
     */
    public function listenForNewSignalements(callable $callback): void
    {
        if (!$this->database) {
            return;
        }

        try {
            // TODO: Configurer les listeners Firebase
            // $this->database
            //     ->getReference('mobile_uploads/signalements')
            //     ->on('child_added', $callback);
        } catch (\Exception $e) {
            error_log("Erreur listener signalements: " . $e->getMessage());
        }
    }

    /**
     * Parse les photos JSON depuis la base de données
     */
    private function parsePhotosJson($photosData): array
    {
        if (is_array($photosData)) {
            return $photosData;
        }

        if (is_string($photosData)) {
            try {
                $parsed = json_decode($photosData, true);
                return is_array($parsed) ? $parsed : [];
            } catch (\Exception $e) {
                return [];
            }
        }

        return [];
    }

    /**
     * Vérifie la connexion à Firebase
     */
    public function isConfigured(): bool
    {
        return $this->database !== null && $this->auth !== null;
    }

    /**
     * Récupère le service Database Firebase
     */
    public function getDatabase(): ?Database
    {
        return $this->database;
    }

    /**
     * Récupère le service Auth Firebase
     */
    public function getAuth(): ?FirebaseAuth
    {
        return $this->auth;
    }

    /**
     * Encode un email pour utilisation comme clé Firebase
     * Firebase n'autorise pas les caractères: . $ # [ ] /
     * 
     * @param string $email Email à encoder
     * @return string Email encodé (exemple: test@example.com → test_at_example_com)
     */
    private function encodeEmail(string $email): string
    {
        return str_replace(
            ['@', '.'],
            ['_at_', '_'],
            $email
        );
    }

    /**
     * Récupère tous les signalements depuis Firebase Realtime DB
     * 
     * @return array Tableau associatif [firebaseId => signalement]
     */
    public function getAllSignalements(): array
    {
        if (!$this->database) {
            error_log("❌ Firebase Database non configuré - impossible de récupérer les signalements");
            return [];
        }

        try {
            $snapshot = $this->database
                ->getReference('signalements')
                ->getSnapshot();

            if (!$snapshot->exists()) {
                return [];
            }

            return $snapshot->getValue() ?? [];
        } catch (\Exception $e) {
            error_log("❌ Erreur getAllSignalements: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Marque un signalement Firebase comme synchronisé avec PostgreSQL
     * 
     * @param string $firebaseId ID du signalement dans Firebase
     * @param int $postgresId ID du signalement dans PostgreSQL
     * @return bool Succès de l'opération
     */
    public function markAsSynced(string $firebaseId, int $postgresId): bool
    {
        if (!$this->database) {
            error_log("❌ Firebase Database non configuré - impossible de marquer comme synchronisé");
            return false;
        }

        try {
            error_log("🔄 Tentative de marquer {$firebaseId} comme synchronisé...");
            $this->database
                ->getReference("signalements/{$firebaseId}")
                ->update([
                    'synced' => true,
                    'postgres_id' => $postgresId,
                    'synced_at' => date('Y-m-d H:i:s')
                ]);

            error_log("✅ Signalement {$firebaseId} marqué avec synced=true");
            return true;
        } catch (\Exception $e) {
            error_log("❌ Erreur markAsSynced pour {$firebaseId}: " . $e->getMessage());
            return false;
        }
    }
}
