<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SignalementController;
use App\Controllers\SyncController;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', $_ENV['APP_DEBUG'] ?? '0');

set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize router
$router = new Router();
$request = new Request();
$response = new Response();

// Health check
$router->get('/api/health', function () use ($response) {
    $response->json([
        'status' => 'ok',
        'timestamp' => time(),
        'service' => 'Identity Provider API'
    ]);
});

// Test route for debugging
$router->get('/api/test/users', function () use ($response) {
    $response->success([
        ['id' => 1, 'email' => 'test@example.com', 'first_name' => 'Test', 'last_name' => 'User'],
        ['id' => 2, 'email' => 'admin@example.com', 'first_name' => 'Admin', 'last_name' => 'User'],
    ], 'Test users list');
});

// Get all users directly from PostgreSQL
$router->get('/api/users/all', function ($request) use ($response) {
    try {
        // Check token
        $token = $request->bearerToken();
        if (!$token) {
            $response->error('No token provided', 401);
            return;
        }
        
        // Connect to database
        $dsn = 'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'];
        $pdo = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD']);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        // Get users
        $sql = "SELECT id, email, first_name, last_name, role, is_active, created_at,
                (SELECT locked_until FROM account_lockouts WHERE email = users.email LIMIT 1) as locked_until
                FROM users ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $response->success($users, 'Users retrieved');
    } catch (Exception $e) {
        $response->error($e->getMessage(), 400);
    }
});

// Auth routes
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);
$router->post('/api/auth/refresh', [AuthController::class, 'refresh']);

// User routes (protected)
$router->get('/api/user/profile', [UserController::class, 'getProfile']);
$router->put('/api/user/profile', [UserController::class, 'updateProfile']);
$router->delete('/api/user/account', [UserController::class, 'deleteAccount']);

// Admin routes
$router->post('/api/admin/unlock-user', [UserController::class, 'unlockUser']);
$router->post('/api/admin/users/create', [UserController::class, 'createUser']);
$router->get('/api/admin/users-list', [UserController::class, 'listUsers']);
$router->get('/api/users/list', [UserController::class, 'listUsers']);
$router->get('/api/admin/users', [UserController::class, 'getAllUsers']);
$router->put('/api/admin/users/{id}/role', [UserController::class, 'updateUserRole']);

// Signalement routes (PUBLIC - accessible sans authentification pour la carte)
$router->get('/api/signalements', function ($request) use ($response) {
    try {
        // Connect to database
        $dsn = 'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'];
        $pdo = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD']);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        // Get all signalements
        $sql = "SELECT id, firebase_id, latitude, longitude, description, status, surface, niveau, niveau_modifie, budget, 
                entreprise, user_email, synced, created_at, updated_at, date_en_cours, date_termine, photos, photo 
                FROM signalements 
                ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $signalements = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Décoder les JSONB
        foreach ($signalements as &$sig) {
            if (isset($sig['photos']) && is_string($sig['photos'])) {
                $sig['photos'] = json_decode($sig['photos'], true) ?? [];
            }
        }
        
        $response->json([
            'success' => true,
            'data' => $signalements,
            'count' => count($signalements)
        ]);
    } catch (Exception $e) {
        $response->status(500)->json([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});
$router->post('/api/signalements', [SignalementController::class, 'create']);
$router->get('/api/signalements/{id}', [SignalementController::class, 'getById']);
$router->put('/api/signalements/{id}', [SignalementController::class, 'update']);
$router->patch('/api/signalements/{id}/status', [SignalementController::class, 'updateStatus']);
$router->delete('/api/signalements/{id}', [SignalementController::class, 'delete']);
$router->get('/api/stats', [SignalementController::class, 'getStats']);
$router->get('/api/stats/delays', [SignalementController::class, 'getDelayStats']);

// Sync routes
$router->post('/api/sync/firebase', [SyncController::class, 'syncWithFirebase']);

// Settings routes (manager only)
$router->get('/api/settings', function ($request) use ($response) {
    try {
        $dsn = 'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'];
        $pdo = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD']);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->query("SELECT key, value, description, updated_at FROM settings ORDER BY key");
        $settings = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Convert to key-value object
        $result = [];
        foreach ($settings as $s) {
            $result[$s['key']] = [
                'value' => $s['value'],
                'description' => $s['description'],
                'updated_at' => $s['updated_at']
            ];
        }
        
        $response->json([
            'success' => true,
            'data' => $result
        ]);
    } catch (Exception $e) {
        $response->status(500)->json(['success' => false, 'error' => $e->getMessage()]);
    }
});

$router->put('/api/settings/{key}', function ($request) use ($response) {
    try {
        $token = $request->bearerToken();
        if (!$token) {
            $response->error('No token provided', 401);
            return;
        }
        
        $authService = new \App\Services\AuthService();
        $userId = $authService->validateToken($token);
        $userModel = new \App\Models\User();
        $user = $userModel->findById($userId);
        
        if ($user['role'] !== 'manager') {
            $response->error('Access denied. Manager only.', 403);
            return;
        }
        
        $key = $request->param('key');
        $data = $request->body();
        $value = $data['value'] ?? null;
        
        if ($value === null) {
            $response->error('Value is required', 400);
            return;
        }
        
        $dsn = 'pgsql:host=' . $_ENV['DB_HOST'] . ';port=' . $_ENV['DB_PORT'] . ';dbname=' . $_ENV['DB_NAME'];
        $pdo = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD']);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("INSERT INTO settings (key, value, updated_at) VALUES (:key, :value, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = :value2, updated_at = CURRENT_TIMESTAMP");
        $stmt->execute([':key' => $key, ':value' => $value, ':value2' => $value]);
        
        $response->json([
            'success' => true,
            'message' => 'Setting updated',
            'data' => ['key' => $key, 'value' => $value]
        ]);
    } catch (Exception $e) {
        $response->error($e->getMessage(), 500);
    }
});

// Documentation
$router->get('/api/docs', function () use ($response) {
    $response->json([
        'message' => 'API Documentation available at http://localhost:8081',
        'swagger_ui' => 'http://localhost:8081'
    ]);
});

// Handle the request
try {
    $router->dispatch($request, $response);
} catch (Exception $e) {
    $response->status(500)->json([
        'error' => 'Internal Server Error',
        'message' => $_ENV['APP_DEBUG'] ? $e->getMessage() : 'An error occurred'
    ]);
}