<?php

declare(strict_types=1);

namespace App\Utils;

class Validator
{
    public function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $fieldRules) {
            foreach ($fieldRules as $rule) {
                $error = $this->applyRule($field, $data[$field] ?? null, $rule);
                if ($error) {
                    $errors[$field][] = $error;
                }
            }
        }

        return $errors;
    }

    private function applyRule(string $field, $value, string $rule): ?string
    {
        // Parse rule and parameter
        $parts = explode(':', $rule);
        $ruleName = $parts[0];
        $parameter = $parts[1] ?? null;

        switch ($ruleName) {
            case 'required':
                if (empty($value) && $value !== '0') {
                    return "The $field field is required";
                }
                break;

            case 'email':
                if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return "The $field must be a valid email address";
                }
                break;

            case 'min':
                if (!empty($value) && strlen($value) < (int)$parameter) {
                    return "The $field must be at least $parameter characters";
                }
                break;

            case 'max':
                if (!empty($value) && strlen($value) > (int)$parameter) {
                    return "The $field must not exceed $parameter characters";
                }
                break;

            case 'numeric':
                if (!empty($value) && !is_numeric($value)) {
                    return "The $field must be a number";
                }
                break;

            case 'alpha':
                if (!empty($value) && !ctype_alpha($value)) {
                    return "The $field must contain only letters";
                }
                break;

            case 'alphanumeric':
                if (!empty($value) && !ctype_alnum($value)) {
                    return "The $field must contain only letters and numbers";
                }
                break;
        }

        return null;
    }
}