<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\Session;
use App\Utils\JWT;
use Exception;
use PDO;

class AuthService
{
    private User $userModel;
    private Session $sessionModel;
    private DatabaseService $db;
    private int $maxAttempts;
    private int $lockoutDuration;
    private int $sessionLifetime;
    private bool $firebaseEnabled;
    private ?string $firebaseApiKey;

    public function __construct()
    {
        $this->userModel = new User();
        $this->sessionModel = new Session();
        $this->db = DatabaseService::getInstance();
        $this->maxAttempts = (int)($_ENV['MAX_LOGIN_ATTEMPTS'] ?? 3);
        $this->lockoutDuration = (int)($_ENV['LOCKOUT_DURATION'] ?? 900);
        $this->sessionLifetime = (int)($_ENV['SESSION_LIFETIME'] ?? 3600);
        $this->firebaseEnabled = filter_var($_ENV['FIREBASE_ENABLED'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
        $this->firebaseApiKey = $_ENV['FIREBASE_API_KEY'] ?? null;
    }

    public function register(string $email, string $password, ?string $firstName, ?string $lastName, ?string $role = 'user'): array
    {
        if ($this->userModel->exists($email)) {
            throw new Exception('Email already registered');
        }

        if ($this->shouldUseFirebase()) {
            $this->firebaseSignUp($email, $password);
        }

        $user = $this->userModel->create([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $role
        ]);

        if (!$user) {
            throw new Exception('Failed to create user');
        }

        unset($user['password_hash']);
        return $user;
    }

    public function login(string $email, string $password, string $ip, string $userAgent): array
    {
        // Check if account is locked
        if ($this->isAccountLocked($email)) {
            throw new Exception('Account is locked due to too many failed login attempts. Please try again later or contact support.');
        }

        if ($this->shouldUseFirebase()) {
            $this->firebaseSignIn($email, $password);
        }

        $user = $this->userModel->findByEmail($email);

        if (!$user && $this->shouldUseFirebase()) {
            $user = $this->userModel->create([
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_BCRYPT),
                'first_name' => null,
                'last_name' => null,
                'role' => 'user'
            ]);
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->recordLoginAttempt($email, $ip, false);
            $this->checkAndLockAccount($email);
            throw new Exception('Invalid credentials');
        }

        if (!$user['is_active']) {
            throw new Exception('Account is inactive');
        }

        // Vérifier que c'est un manager AVANT de créer le token
        if ($user['role'] !== 'manager') {
            $this->recordLoginAttempt($email, $ip, false);
            throw new Exception('Access reserved for managers only');
        }

        // Successful login - clear attempts
        $this->clearLoginAttempts($email);

        // Create session
        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + $this->sessionLifetime
        ]);

        $this->sessionModel->create([
            'user_id' => $user['id'],
            'token' => $token,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'expires_at' => date('Y-m-d H:i:s', time() + $this->sessionLifetime)
        ]);

        $this->recordLoginAttempt($email, $ip, true);

        unset($user['password_hash']);

        return [
            'token' => $token,
            'expires_in' => $this->sessionLifetime,
            'user' => $user
        ];       
    }

    private function shouldUseFirebase(): bool
    {
        if (!$this->firebaseEnabled || empty($this->firebaseApiKey)) {
            return false;
        }

        return $this->isInternetAvailable();
    }

    private function isInternetAvailable(): bool
    {
        $connected = @fsockopen('www.google.com', 80, $errno, $errstr, 1.5);
        if ($connected) {
            fclose($connected);
            return true;
        }

        return false;
    }

    private function firebaseSignUp(string $email, string $password): array
    {
        return $this->firebaseRequest('accounts:signUp', [
            'email' => $email,
            'password' => $password,
            'returnSecureToken' => true
        ]);
    }

    private function firebaseSignIn(string $email, string $password): array
    {
        return $this->firebaseRequest('accounts:signInWithPassword', [
            'email' => $email,
            'password' => $password,
            'returnSecureToken' => true
        ]);
    }

    private function firebaseRequest(string $endpoint, array $payload): array
    {
        if (empty($this->firebaseApiKey)) {
            throw new Exception('Firebase API key is missing');
        }

        $url = "https://identitytoolkit.googleapis.com/v1/{$endpoint}?key={$this->firebaseApiKey}";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 5
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new Exception('Firebase request failed: ' . $curlError);
        }

        $data = json_decode($response, true);

        if ($httpCode >= 400) {
            $message = $data['error']['message'] ?? 'Firebase request failed';
            
            // Si c'est une erreur de trop de tentatives, bloquer l'utilisateur localement
            if ($message === 'TOO_MANY_ATTEMPTS_TRY_LATER' && isset($payload['email'])) {
                $email = $payload['email'];
                $lockedUntil = date('Y-m-d H:i:s', time() + $this->lockoutDuration);
                
                $pdo = $this->db->getConnection();
                $sql = "INSERT INTO account_lockouts (email, locked_until, attempt_count) 
                        VALUES (:email, :locked_until, :attempts)
                        ON CONFLICT (email) 
                        DO UPDATE SET locked_until = :locked_until, attempt_count = :attempts";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'email' => $email,
                    'locked_until' => $lockedUntil,
                    'attempts' => 5
                ]);
            }
            
            throw new Exception($message);
        }

        return $data;
    }

    public function logout(string $token): bool
    {
        return $this->sessionModel->deleteByToken($token);
    }

    public function validateToken(string $token): int
    {
        $payload = JWT::decode($token);

        if (!isset($payload['user_id'])) {
            throw new Exception('Invalid token');
        }

        $session = $this->sessionModel->findByToken($token);

        if (!$session) {
            throw new Exception('Session expired or invalid');
        }

        return (int)$payload['user_id'];
    }

    public function refreshToken(string $oldToken): array
    {
        $userId = $this->validateToken($oldToken);
        $user = $this->userModel->findById($userId);

        if (!$user) {
            throw new Exception('User not found');
        }

        // Delete old session
        $this->sessionModel->deleteByToken($oldToken);

        // Create new token
        $newToken = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + $this->sessionLifetime
        ]);

        $session = $this->sessionModel->findByToken($oldToken);
        
        $this->sessionModel->create([
            'user_id' => $user['id'],
            'token' => $newToken,
            'ip_address' => $session['ip_address'] ?? '0.0.0.0',
            'user_agent' => $session['user_agent'] ?? '',
            'expires_at' => date('Y-m-d H:i:s', time() + $this->sessionLifetime)
        ]);

        unset($user['password_hash']);

        return [
            'token' => $newToken,
            'expires_in' => $this->sessionLifetime,
            'user' => $user
        ];
    }

    public function unlockAccount(string $email): bool
    {
        $pdo = $this->db->getConnection();
        $sql = "DELETE FROM account_lockouts WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute(['email' => $email]);
    }

    private function isAccountLocked(string $email): bool
    {
        $pdo = $this->db->getConnection();
        $sql = "SELECT locked_until FROM account_lockouts WHERE email = :email AND locked_until > NOW() LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    private function recordLoginAttempt(string $email, string $ip, bool $success): void
    {
        $pdo = $this->db->getConnection();
        $sql = "INSERT INTO login_attempts (email, ip_address, success) VALUES (:email, :ip, :success)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'email' => $email,
            'ip' => $ip,
            'success' => $success ? 'true' : 'false'
        ]);
    }

    private function checkAndLockAccount(string $email): void
    {
        $pdo = $this->db->getConnection();
        
        // Count failed attempts in last hour
        $sql = "SELECT COUNT(*) FROM login_attempts 
                WHERE email = :email 
                AND success = false 
                AND attempt_time > NOW() - INTERVAL '1 hour'";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        $attempts = $stmt->fetchColumn();

        if ($attempts >= $this->maxAttempts) {
            $lockedUntil = date('Y-m-d H:i:s', time() + $this->lockoutDuration);
            
            $sql = "INSERT INTO account_lockouts (email, locked_until, attempt_count) 
                    VALUES (:email, :locked_until, :attempts)
                    ON CONFLICT (email) 
                    DO UPDATE SET locked_until = :locked_until, attempt_count = :attempts";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'email' => $email,
                'locked_until' => $lockedUntil,
                'attempts' => $attempts
            ]);
        }
    }

    private function clearLoginAttempts(string $email): void
    {
        $pdo = $this->db->getConnection();
        
        // Clear failed attempts
        $sql = "DELETE FROM login_attempts WHERE email = :email AND success = false";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        
        // Remove lockout
        $sql = "DELETE FROM account_lockouts WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
    }
}