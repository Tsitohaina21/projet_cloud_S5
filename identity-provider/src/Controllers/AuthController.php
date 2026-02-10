<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Utils\Validator;
use Exception;

class AuthController
{
    private AuthService $authService;
    private Validator $validator;

    public function __construct()
    {
        $this->authService = new AuthService();
        $this->validator = new Validator();
    }

    public function register(Request $request, Response $response): void
    {
        try {
            $data = $request->body();

            // Validation
            $errors = $this->validator->validate($data, [
                'email' => ['required', 'email'],
                'password' => ['required', 'min:8'],
                'first_name' => ['required'],
                'last_name' => ['required']
            ]);

            if (!empty($errors)) {
                $response->status(422)->json([
                    'error' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            $user = $this->authService->register(
                $data['email'],
                $data['password'],
                $data['first_name'] ?? null,
                $data['last_name'] ?? null,
                $data['role'] ?? 'user'
            );

            $response->status(201)->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'first_name' => $user['first_name'],
                        'last_name' => $user['last_name']
                    ]
                ]
            ]);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function login(Request $request, Response $response): void
    {
        try {
            $data = $request->body();

            $errors = $this->validator->validate($data, [
                'email' => ['required', 'email'],
                'password' => ['required']
            ]);

            if (!empty($errors)) {
                $response->status(422)->json([
                    'error' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            $ip = $request->ip();
            $userAgent = $request->userAgent();

            $result = $this->authService->login(
                $data['email'],
                $data['password'],
                $ip,
                $userAgent
            );

            $response->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $result
            ]);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 401);
        }
    }

    public function logout(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            $this->authService->logout($token);

            $response->success(null, 'Logged out successfully');
        } catch (Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function refresh(Request $request, Response $response): void
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                $response->error('No token provided', 401);
                return;
            }

            $result = $this->authService->refreshToken($token);

            $response->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            $response->error($e->getMessage(), 401);
        }
    }
}