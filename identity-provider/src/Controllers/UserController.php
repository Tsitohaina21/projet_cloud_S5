<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Models\User;
use App\Utils\Validator;
use Exception;

class UserController
{
    private AuthService $authService;
    private User $userModel;
    private Validator $validator;

    public function __construct()
    {
        $this->authService = new AuthService();
        $this->userModel = new User();
        $this->validator = new Validator();
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
}