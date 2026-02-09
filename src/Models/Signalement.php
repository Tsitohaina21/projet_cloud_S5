<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use Exception;

class Signalement
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Normaliser les signalement - décoder les colonnes JSONB
     */
    private function normalizeSignalement(array $signalement): array
    {
        // PDO retourne les colonnes JSONB comme strings, on doit les décoder
        if (isset($signalement['photos']) && is_string($signalement['photos'])) {
            $signalement['photos'] = json_decode($signalement['photos'], true) ?? [];
        }
        return $signalement;
    }

    /**
     * Get all signalements
     */
    public function getAll(): array
    {
        try {
            $query = "SELECT id, firebase_id, latitude, longitude, description, status, surface, budget, 
                      entreprise, user_email, synced, created_at, updated_at, date_en_cours, date_termine, photos, photo 
                      FROM signalements 
                      ORDER BY created_at DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Normaliser chaque signalement (décoder les JSONB)
            return array_map([$this, 'normalizeSignalement'], $results);
        } catch (Exception $e) {
            throw new Exception("Error fetching signalements: " . $e->getMessage());
        }
    }

    /**
     * Get signalement by id
     */
    public function getById(int $id): ?array
    {
        try {
            $query = "SELECT id, firebase_id, latitude, longitude, description, status, surface, budget, 
                      entreprise, user_email, synced, created_at, updated_at, date_en_cours, date_termine, photos, photo 
                      FROM signalements 
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$result) return null;
            
            return $this->normalizeSignalement($result);
        } catch (Exception $e) {
            throw new Exception("Error fetching signalement: " . $e->getMessage());
        }
    }

    /**
     * Create signalement
     */
    public function create(array $data): int
    {
        try {
            $query = "INSERT INTO signalements 
                      (firebase_id, latitude, longitude, description, status, surface, budget, entreprise, user_email, synced, created_at, photos, photo) 
                      VALUES 
                      (:firebase_id, :latitude, :longitude, :description, :status, :surface, :budget, :entreprise, :user_email, :synced, CURRENT_DATE, :photos, :photo)";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':firebase_id' => $data['firebase_id'] ?? null,
                ':latitude' => $data['latitude'] ?? null,
                ':longitude' => $data['longitude'] ?? null,
                ':description' => $data['description'] ?? '',
                ':status' => $data['status'] ?? 'nouveau',
                ':surface' => $data['surface'] ?? null,
                ':budget' => $data['budget'] ?? null,
                ':entreprise' => $data['entreprise'] ?? null,
                ':user_email' => $data['user_email'] ?? null,
                ':synced' => (bool)($data['synced'] ?? false) ? 'true' : 'false',
                ':photos' => json_encode($data['photos'] ?? []),
                ':photo' => $data['photo'] ?? null
            ]);
            
            return (int)$this->db->lastInsertId();
        } catch (Exception $e) {
            throw new Exception("Error creating signalement: " . $e->getMessage());
        }
    }

    /**
     * Update signalement
     */
    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = [':id' => $id];
            
            if (isset($data['firebase_id'])) {
                $fields[] = "firebase_id = :firebase_id";
                $params[':firebase_id'] = $data['firebase_id'];
            }
            if (isset($data['latitude'])) {
                $fields[] = "latitude = :latitude";
                $params[':latitude'] = $data['latitude'];
            }
            if (isset($data['longitude'])) {
                $fields[] = "longitude = :longitude";
                $params[':longitude'] = $data['longitude'];
            }
            if (isset($data['description'])) {
                $fields[] = "description = :description";
                $params[':description'] = $data['description'];
            }
            if (isset($data['status'])) {
                $fields[] = "status = :status";
                $params[':status'] = $data['status'];
            }
            if (isset($data['surface'])) {
                $fields[] = "surface = :surface";
                $params[':surface'] = $data['surface'];
            }
            if (isset($data['budget'])) {
                $fields[] = "budget = :budget";
                $params[':budget'] = $data['budget'];
            }
            if (isset($data['entreprise'])) {
                $fields[] = "entreprise = :entreprise";
                $params[':entreprise'] = $data['entreprise'];
            }
            if (isset($data['user_email'])) {
                $fields[] = "user_email = :user_email";
                $params[':user_email'] = $data['user_email'];
            }
            if (isset($data['synced'])) {
                $fields[] = "synced = :synced";
                $params[':synced'] = (bool)$data['synced'] ? 'true' : 'false';
            }
            if (isset($data['photos'])) {
                $fields[] = "photos = :photos";
                $params[':photos'] = json_encode($data['photos']);
            }
            if (isset($data['photo'])) {
                $fields[] = "photo = :photo";
                $params[':photo'] = $data['photo'];
            }
            
            if (empty($fields)) {
                return true;
            }
            
            $query = "UPDATE signalements SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute($params);
        } catch (Exception $e) {
            throw new Exception("Error updating signalement: " . $e->getMessage());
        }
    }

    /**
     * Update signalement status
     */
    public function updateStatus(int $id, string $status, ?string $date = null): bool
    {
        try {
            $fields = ["status = :status"];
            $params = [':id' => $id, ':status' => $status];
            
            if ($status === 'en_cours' && $date) {
                $fields[] = "date_en_cours = :date";
                $params[':date'] = $date;
            } elseif ($status === 'termine' && $date) {
                $fields[] = "date_termine = :date";
                $params[':date'] = $date;
            }
            
            $query = "UPDATE signalements SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute($params);
        } catch (Exception $e) {
            throw new Exception("Error updating signalement status: " . $e->getMessage());
        }
    }

    /**
     * Delete signalement
     */
    public function delete(int $id): bool
    {
        try {
            $query = "DELETE FROM signalements WHERE id = :id";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute([':id' => $id]);
        } catch (Exception $e) {
            throw new Exception("Error deleting signalement: " . $e->getMessage());
        }
    }

    /**
     * Get statistics
     */
    public function getStats(): array
    {
        try {
            $query = "SELECT 
                      COUNT(*) as total_points,
                      SUM(surface) as total_surface,
                      SUM(budget) as total_budget
                      FROM signalements";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Calculate progress
            $progressQuery = "SELECT 
                             SUM(CASE WHEN status = 'nouveau' THEN 0 
                                      WHEN status = 'en_cours' THEN 50 
                                      WHEN status = 'termine' THEN 100 
                                      ELSE 0 END) as total_progress,
                             COUNT(*) as count
                             FROM signalements";
            
            $progressStmt = $this->db->prepare($progressQuery);
            $progressStmt->execute();
            $progressResult = $progressStmt->fetch(PDO::FETCH_ASSOC);
            
            $avancement = $progressResult['count'] > 0 
                ? round(($progressResult['total_progress'] / ($progressResult['count'] * 100)) * 100, 2)
                : 0;
            
            return [
                'totalPoints' => (int)($result['total_points'] ?? 0),
                'totalSurface' => (float)($result['total_surface'] ?? 0),
                'totalBudget' => (float)($result['total_budget'] ?? 0),
                'avancement' => $avancement
            ];
        } catch (Exception $e) {
            throw new Exception("Error fetching stats: " . $e->getMessage());
        }
    }

    /**
     * Get delay statistics
     */
    public function getDelayStats(): array
    {
        try {
            $query = "SELECT 
                      COUNT(CASE WHEN status = 'termine' THEN 1 END) as total_completed,
                      COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as in_progress,
                      COUNT(CASE WHEN status = 'nouveau' THEN 1 END) as pending,
                      ROUND(AVG(EXTRACT(DAY FROM (date_termine::timestamp - created_at::timestamp)))::numeric, 0) as average_delay
                      FROM signalements
                      WHERE date_termine IS NOT NULL";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'totalCompleted' => (int)($result['total_completed'] ?? 0),
                'inProgress' => (int)($result['in_progress'] ?? 0),
                'pending' => (int)($result['pending'] ?? 0),
                'averageDelay' => (int)($result['average_delay'] ?? 0)
            ];
        } catch (Exception $e) {
            throw new Exception("Error fetching delay stats: " . $e->getMessage());
        }
    }
}
