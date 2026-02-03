<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Controllers\AuthController;
use App\Controllers\UserController;
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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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