<?php
require_once __DIR__ . '/vendor/autoload.php';

$factory = (new \Kreait\Firebase\Factory())
    ->withServiceAccount(__DIR__ . '/firebase-service-account.json')
    ->withDatabaseUri('https://cloud-s5-d8158-default-rtdb.europe-west1.firebasedatabase.app');

$database = $factory->createDatabase();

// Supprimer TOUS les doublons avec clés numériques
echo "Recherche de doublons...\n";
$snapshot = $database->getReference('signalements')->getSnapshot();
$data = $snapshot->getValue();

$deletedCount = 0;
if ($data) {
    foreach ($data as $key => $value) {
        // Si la clé est numérique (ID PostgreSQL), c'est un doublon
        if (is_numeric($key)) {
            echo "🗑️ Suppression doublon: /signalements/{$key} (id={$value['id']})\n";
            $database->getReference("signalements/{$key}")->remove();
            $deletedCount++;
        }
    }
}

echo "\n✅ {$deletedCount} doublon(s) supprimé(s)\n\n";

// Afficher les clés restantes
echo "Clés Firebase restantes:\n";
$snapshot = $database->getReference('signalements')->getSnapshot();
$data = $snapshot->getValue();
if ($data) {
    foreach ($data as $key => $value) {
        echo "  - {$key} → id={$value['id']}, status={$value['status']}\n";
    }
}
?>
