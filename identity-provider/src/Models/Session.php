<?php

declare(strict_types=1);

namespace App\Models;

use App\Services\DatabaseService;
use PDO;

class Session
{
    private PDO $db;

    public function __construct()
    {
        $dbService = DatabaseService::getInstance();
        $this->db = $dbService->getConnection();
    }

    public function create(array $data): ?array
    {
        $sql = "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
                VALUES (:user_id, :token, :ip_address, :user_agent, :expires_at) 
                RETURNING *";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByToken(string $token): ?array
    {
        $sql = "SELECT * FROM sessions WHERE token = :token AND expires_at > NOW() LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['token' => $token]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function deleteByToken(string $token): bool
    {
        $sql = "DELETE FROM sessions WHERE token = :token";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute(['token' => $token]);
    }

    public function deleteByUserId(int $userId): bool
    {
        $sql = "DELETE FROM sessions WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute(['user_id' => $userId]);
    }

    public function deleteExpired(): int
    {
        $sql = "DELETE FROM sessions WHERE expires_at < NOW()";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->rowCount();
    }
}