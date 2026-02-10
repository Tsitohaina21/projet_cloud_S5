<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Signalement;
use App\Services\FirebaseService;
use PDO;

class SignalementController
{
    private PDO $db;
    private Signalement $model;
    private FirebaseService $firebaseService;

    public function __construct()
    {
        $this->db = new PDO(
            'pgsql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_NAME'],
            $_ENV['DB_USER'],
            $_ENV['DB_PASSWORD']
        );
        $this->model = new Signalement($this->db);
        $this->firebaseService = new FirebaseService();
    }

    /**
     * Get all signalements
     */
    public function getAll(Request $request, Response $response): void
    {
        try {
            $signalements = $this->model->getAll();
            
            $response->json([
                'success' => true,
                'data' => $signalements,
                'count' => count($signalements)
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get signalement by id
     */
    public function getById(Request $request, Response $response): void
    {
        try {
            $id = (int)$request->param('id');
            $signalement = $this->model->getById($id);
            
            if (!$signalement) {
                $response->status(404)->json([
                    'success' => false,
                    'error' => 'Signalement not found'
                ]);
                return;
            }
            
            $response->json([
                'success' => true,
                'data' => $signalement
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create signalement
     * Synchronise automatiquement vers Firebase
     */
    public function create(Request $request, Response $response): void
    {
        try {
            $data = $request->json();
            
            if (!isset($data['latitude']) || !isset($data['longitude'])) {
                $response->status(400)->json([
                    'success' => false,
                    'error' => 'Missing required fields: latitude, longitude'
                ]);
                return;
            }
            
            $id = $this->model->create($data);
            $signalement = $this->model->getById($id);
            
            // Synchroniser automatiquement vers Firebase
            $this->firebaseService->updateSignalementInFirebase($signalement);
            
            $response->status(201)->json([
                'success' => true,
                'message' => 'Signalement created',
                'data' => $signalement
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update signalement
     */
    public function update(Request $request, Response $response): void
    {
        try {
            $id = (int)$request->param('id');
            $data = $request->json();
            
            if (!$this->model->getById($id)) {
                $response->status(404)->json([
                    'success' => false,
                    'error' => 'Signalement not found'
                ]);
                return;
            }
            
            $oldSignalement = $this->model->getById($id);
            $this->model->update($id, $data);
            $signalement = $this->model->getById($id);
            
            // Envoyer une notification à l'utilisateur
            $userEmail = $signalement['user_email'] ?? '';
            if ($userEmail) {
                $changes = [];
                
                // Changement de statut
                if (isset($data['status']) && ($oldSignalement['status'] ?? '') !== ($signalement['status'] ?? '')) {
                    $statusLabels = [
                        'nouveau' => 'Nouveau',
                        'en_cours' => 'En cours',
                        'termine' => 'Terminé'
                    ];
                    $oldStatus = $oldSignalement['status'] ?? 'nouveau';
                    $newStatus = $signalement['status'];
                    $changes[] = 'statut passé de ' . ($statusLabels[$oldStatus] ?? $oldStatus) . ' à ' . ($statusLabels[$newStatus] ?? $newStatus);
                }
                
                if (isset($data['niveau']) && ($oldSignalement['niveau'] ?? 1) != ($signalement['niveau'] ?? 1)) {
                    $changes[] = 'niveau passé à ' . $signalement['niveau'] . '/10';
                }
                if (isset($data['budget']) && ($oldSignalement['budget'] ?? 0) != ($signalement['budget'] ?? 0)) {
                    $changes[] = 'budget mis à jour à ' . number_format((float)$signalement['budget'], 0, ',', ' ') . ' Ar';
                }
                if (isset($data['entreprise']) && ($oldSignalement['entreprise'] ?? '') != ($signalement['entreprise'] ?? '')) {
                    $changes[] = 'entreprise assignée : ' . $signalement['entreprise'];
                }
                if (!empty($changes)) {
                    $this->firebaseService->sendChangeNotification(
                        $userEmail,
                        $signalement,
                        implode(', ', $changes)
                    );
                }
            }
            
            $response->json([
                'success' => true,
                'message' => 'Signalement updated',
                'data' => $signalement
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update signalement status
     * Déclenche une notification Firebase vers l'utilisateur
     */
    public function updateStatus(Request $request, Response $response): void
    {
        try {
            $id = (int)$request->param('id');
            $data = $request->json();
            
            if (!isset($data['status'])) {
                $response->status(400)->json([
                    'success' => false,
                    'error' => 'Missing required field: status'
                ]);
                return;
            }
            
            $oldSignalement = $this->model->getById($id);
            if (!$oldSignalement) {
                $response->status(404)->json([
                    'success' => false,
                    'error' => 'Signalement not found'
                ]);
                return;
            }
            
            $oldStatus = $oldSignalement['status'];
            $date = $data['date'] ?? null;
            
            // Mettre à jour dans PostgreSQL
            $this->model->updateStatus($id, $data['status'], $date);
            $signalement = $this->model->getById($id);
            
            // Envoyer une notification à l'utilisateur
            if ($oldStatus !== $data['status']) {
                $userEmail = $signalement['user_email'] ?? '';
                if ($userEmail) {
                    $this->firebaseService->sendStatusNotification(
                        $userEmail,
                        $signalement,
                        $oldStatus
                    );
                }
            }
            
            $response->json([
                'success' => true,
                'message' => 'Status updated',
                'data' => $signalement
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete signalement
     */
    public function delete(Request $request, Response $response): void
    {
        try {
            $id = (int)$request->param('id');
            
            if (!$this->model->getById($id)) {
                $response->status(404)->json([
                    'success' => false,
                    'error' => 'Signalement not found'
                ]);
                return;
            }
            
            $this->model->delete($id);
            
            $response->json([
                'success' => true,
                'message' => 'Signalement deleted'
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get statistics
     */
    public function getStats(Request $request, Response $response): void
    {
        try {
            $stats = $this->model->getStats();
            
            $response->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get delay statistics
     */
    public function getDelayStats(Request $request, Response $response): void
    {
        try {
            $stats = $this->model->getDelayStats();
            
            $response->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            $response->status(500)->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
