<?php
require_once __DIR__ . '/vendor/autoload.php';

$factory = (new \Kreait\Firebase\Factory())
    ->withServiceAccount(__DIR__ . '/firebase-service-account.json')
    ->withDatabaseUri('https://cloud-s5-d8158-default-rtdb.europe-west1.firebasedatabase.app');

$database = $factory->createDatabase();

// Supprimer tous les signalements
try {
    $database->getReference('signalements')->remove();
    echo "✅ Signalements supprimés de Firebase\n";
} catch (Exception $e) {
    echo "❌ Erreur suppression signalements: " . $e->getMessage() . "\n";
}

// Supprimer les signalements utilisateur
try {
    $database->getReference('user_signalements')->remove();
    echo "✅ Signalements utilisateur supprimés de Firebase\n";
} catch (Exception $e) {
    echo "❌ Erreur suppression user signalements: " . $e->getMessage() . "\n";
}

// Vérifier qu'il n'y a rien
$check = $database->getReference('signalements')->getSnapshot();
echo "Contenu Firebase: " . ($check->exists() ? "NON VIDE ⚠️" : "VIDE ✅") . "\n";
echo "Vérification user_signalements: " . (($database->getReference('user_signalements')->getSnapshot())->exists() ? "NON VIDE ⚠️" : "VIDE ✅") . "\n";
?>
