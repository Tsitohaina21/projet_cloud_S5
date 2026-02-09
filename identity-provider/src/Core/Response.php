<?php

declare(strict_types=1);

namespace App\Core;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];

    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function json(array $data, int $code = null): void
    {
        if ($code !== null) {
            $this->status($code);
        }

        http_response_code($this->statusCode);
        
        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }

        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public function error(string $message, int $code = 400): void
    {
        $this->json([
            'error' => true,
            'message' => $message,
            'code' => $code
        ], $code);
    }

    public function success($data = null, string $message = 'Success'): void
    {
        $response = [
            'success' => true,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        $this->json($response, 200);
    }
}