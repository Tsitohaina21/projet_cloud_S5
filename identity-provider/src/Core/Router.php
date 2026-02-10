<?php

declare(strict_types=1);

namespace App\Core;

class Router
{
    private array $routes = [];

    public function get(string $path, $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    public function patch(string $path, $handler): void
    {
        $this->addRoute('PATCH', $path, $handler);
    }

    private function addRoute(string $method, string $path, $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function dispatch(Request $request, Response $response): void
    {
        $method = $request->method();
        $uri = $request->uri();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = $this->convertPathToRegex($route['path']);
            
            if (preg_match($pattern, $uri, $matches)) {
                array_shift($matches); // Remove full match
                $this->handleRoute($route['handler'], $request, $response, $matches);
                return;
            }
        }

        $response->status(404)->json([
            'error' => 'Not Found',
            'message' => 'The requested resource was not found'
        ]);
    }

    private function convertPathToRegex(string $path): string
    {
        $path = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $path . '$#';
    }

    private function handleRoute($handler, Request $request, Response $response, array $params): void
    {
        $request->setParams($params);

        if (is_callable($handler)) {
            call_user_func($handler, $request, $response);
        } elseif (is_array($handler)) {
            [$class, $method] = $handler;
            $controller = new $class();
            $controller->$method($request, $response);
        }
    }
}