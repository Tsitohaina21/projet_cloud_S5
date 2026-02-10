<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Services\FirebaseService;
use App\Models\User;
use App\Utils\Validator;
use Exception;

class UserController
{
    private AuthService $authService;
    private User $userModel;
    private Validator $validator;
    private FirebaseService $firebaseService;

    public function __construct()
    {
        $this->authService = new AuthService();
        $this->userModel = new User();
        $this->validator = new Validator();
        $this->firebaseService = new FirebaseService();
    }

    public function getProfile(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            $userId = $this->authService->validateToken($token);
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $response->error('User not found', 404);
                return;
            }

            unset($user['password_hash']);

            $response->success($user);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 401);
        }
    }

    public function updateProfile(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            $userId = $this->authService->validateToken($token);
            $data = $request->body();

            // Only allow updating specific fields
            $allowedFields = ['first_name', 'last_name', 'email'];
            $updateData = array_intersect_key($data, array_flip($allowedFields));

            if (empty($updateData)) {
                $response->error('No valid fields to update', 400);
                return;
            }

            // Validate email if provided
            if (isset($updateData['email'])) {
                $errors = $this->validator->validate(['email' => $updateData['email']], [
                    'email' => ['required', 'email']
                ]);

                if (!empty($errors)) {
                    $response->status(422)->json([
                        'error' => 'Validation failed',
                        'errors' => $errors
                    ]);
                    return;
                }
            }

            $updated = $this->userModel->update($userId, $updateData);

            if (!$updated) {
                $response->error('Failed to update profile', 500);
                return;
            }

            $user = $this->userModel->findById($userId);
            unset($user['password_hash']);

            $response->success($user, 'Profile updated successfully');
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function deleteAccount(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            $userId = $this->authService->validateToken($token);
            
            $deleted = $this->userModel->delete($userId);

            if (!$deleted) {
                $response->error('Failed to delete account', 500);
                return;
            }

            $response->success(null, 'Account deleted successfully');
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function unlockUser(Request $request, Response $response): void
    {
        try {
            $data = $request->body();

            $errors = $this->validator->validate($data, [
                'email' => ['required', 'email']
            ]);

            if (!empty($errors)) {
                $response->status(422)->json([
                    'error' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            $unlocked = $this->authService->unlockAccount($data['email']);

            if ($unlocked) {
                $response->success(null, 'Account unlocked successfully');
            } else {
                $response->error('Account not found or not locked', 404);
            }
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function getAllUsers(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            // Vérifier que l'utilisateur est manager
            $userId = $this->authService->validateToken($token);
            $user = $this->userModel->findById($userId);

            if ($user['role'] !== 'manager') {
                $response->error('Access denied. Manager only.', 403);
                return;
            }

            // Récupérer tous les utilisateurs avec les infos de blocage
            $pdo = $this->userModel->getConnection();
            $sql = "SELECT 
                      u.id, 
                      u.email, 
                      u.first_name, 
                      u.last_name, 
                      u.role, 
                      u.is_active, 
                      u.created_at,
                      al.locked_until
                    FROM users u
                    LEFT JOIN account_lockouts al ON u.email = al.email
                    ORDER BY u.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            
            $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $response->success($users, 'Users retrieved successfully');
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function listUsers(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            // Vérifier que l'utilisateur est manager
            $userId = $this->authService->validateToken($token);
            $user = $this->userModel->findById($userId);

            if ($user['role'] !== 'manager') {
                $response->error('Access denied. Manager only.', 403);
                return;
            }

            // Récupérer tous les utilisateurs depuis PostgreSQL
            $pdo = $this->userModel->getConnection();
            $sql = "SELECT 
                      id, 
                      email, 
                      first_name, 
                      last_name, 
                      role, 
                      is_active, 
                      created_at,
                      (SELECT locked_until FROM account_lockouts WHERE email = users.email LIMIT 1) as locked_until
                    FROM users
                    ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            
            $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $response->success($users);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function updateUserRole(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            // Vérifier que l'utilisateur est manager
            $userId = $this->authService->validateToken($token);
            $user = $this->userModel->findById($userId);

            if ($user['role'] !== 'manager') {
                $response->error('Access denied. Manager only.', 403);
                return;
            }

            $data = $request->body();

            $errors = $this->validator->validate($data, [
                'user_id' => ['required'],
                'role' => ['required']
            ]);

            if (!empty($errors)) {
                $response->status(422)->json([
                    'error' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            // Vérifier que le rôle est valide
            if (!in_array($data['role'], ['user', 'manager'])) {
                $response->error('Invalid role', 400);
                return;
            }

            $updated = $this->userModel->update((int)$data['user_id'], ['role' => $data['role']]);

            if (!$updated) {
                $response->error('Failed to update user role', 500);
                return;
            }

            $updatedUser = $this->userModel->findById((int)$data['user_id']);
            unset($updatedUser['password_hash']);

            $response->success($updatedUser, 'User role updated successfully');
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    /**
     * Créer un nouvel utilisateur (manager uniquement)
     * Synchronise automatiquement vers Firebase Authentication
     */
    public function createUser(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            // Vérifier que l'utilisateur est manager
            $userId = $this->authService->validateToken($token);
            $user = $this->userModel->findById($userId);

            if ($user['role'] !== 'manager') {
                $response->error('Access denied. Manager only.', 403);
                return;
            }

            $data = $request->body();

            // Validation des champs requis
            $errors = $this->validator->validate($data, [
                'email' => ['required', 'email'],
                'first_name' => ['required'],
                'last_name' => ['required'],
                'password' => ['required', 'min:8'],
                'role' => ['required']
            ]);

            if (!empty($errors)) {
                $response->status(422)->json([
                    'error' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            // Vérifier que l'email n'existe pas
            if ($this->userModel->findByEmail($data['email'])) {
                $response->status(400)->json([
                    'error' => 'Email already exists'
                ]);
                return;
            }

            // Vérifier que le rôle est valide
            if (!in_array($data['role'], ['user', 'manager'])) {
                $response->error('Invalid role', 400);
                return;
            }

            // Créer l'utilisateur UNIQUEMENT dans PostgreSQL
            // Stocker temporairement le mot de passe en clair pour la synchronisation Firebase
            // Le temp_password sera effacé après la synchronisation
            $newUser = $this->userModel->create([
                'email' => $data['email'],
                'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                'temp_password' => $data['password'], // Stockage temporaire pour Firebase sync
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'role' => $data['role'],
                'is_active' => true
            ]);

            unset($newUser['password_hash']);
            unset($newUser['temp_password']); // Ne pas exposer le mot de passe

            $response->status(201)->json([
                'success' => true,
                'message' => 'User created. Click "Synchroniser" to sync with Firebase',
                'data' => $newUser,
                'note' => 'This user will be available on mobile app after synchronization'
            ]);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }
}