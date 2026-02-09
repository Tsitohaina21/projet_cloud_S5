<?php

declare(strict_types=1);

namespace App\Utils;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;
use Exception;

class JWT
{
    private static function getSecret(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'default-secret-key';
    }

    private static function getAlgorithm(): string
    {
        return $_ENV['JWT_ALGORITHM'] ?? 'HS256';
    }

    public static function encode(array $payload): string
    {
        return FirebaseJWT::encode($payload, self::getSecret(), self::getAlgorithm());
    }

    public static function decode(string $token): array
    {
        try {
            $decoded = FirebaseJWT::decode($token, new Key(self::getSecret(), self::getAlgorithm()));
            return (array) $decoded;
        } catch (Exception $e) {
            throw new Exception('Invalid or expired token: ' . $e->getMessage());
        }
    }

    public static function verify(string $token): bool
    {
        try {
            self::decode($token);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}