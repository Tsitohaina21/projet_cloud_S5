// Configuration globale
const API_URL = 'http://localhost:3001';
const TILE_SERVER_URL = 'http://localhost:8082';

let map;
let currentUser = null;
let authToken = null;
let markersLayer = L.featureGroup();

// Données d'exemple des problèmes routiers à Antananarivo
const problemesRoutiers = [
    {
        id: 1,
        lat: -18.8792,
        lng: 47.5079,
        nom: "Rue de la Gare",
        date: '2025-01-15',
        status: 'nouveau',
        surface: 150,
        budget: 5000000,
        entreprise: 'BTP Madagascar',
        description: 'Nid de poule important'
    },
    {
        id: 2,
        lat: -18.9100,
        lng: 47.5200,
        nom: "Avenue Andohalo",
        date: '2025-01-10',
        status: 'en-cours',
        surface: 280,
        budget: 8500000,
        entreprise: 'Routes et Travaux SA',
        description: 'Rénovation de chaussée'
    },
    {
        id: 3,
        lat: -18.8650,
        lng: 47.5250,
        nom: "Route Nationale 5",
        date: '2025-01-05',
        status: 'termine',
        surface: 120,
        budget: 3200000,
        entreprise: 'Construction Plus',
        description: 'Repavage terminé'
    }
];

// Icônes personnalisées selon le statut
const icones = {
    nouveau: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'en-cours': L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    termine: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })
};

/**
 * Initialiser la carte Leaflet
 */
function initMap() {
    // Créer la carte centrée sur Antananarivo
    map = L.map('map').setView([-18.8792, 47.5079], 13);

    // Ajouter les couches de tuiles
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
        name: 'OpenStreetMap'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '© Esri',
        name: 'Satellite'
    });

    // Ajouter la couche par défaut
    osmLayer.addTo(map);

    // Contrôle des couches
    L.control.layers({
        'OpenStreetMap': osmLayer,
        'Satellite': satelliteLayer
    }).addTo(map);

    // Ajouter le contrôle d'échelle
    L.control.scale().addTo(map);

    // Ajouter la couche des marqueurs
    markersLayer.addTo(map);

    // Événements de la carte
    map.on('move', updateMapInfo);
    map.on('zoom', updateMapInfo);
    map.on('click', onMapClick);

    afficherMarqueurs();
}

/**
 * Afficher les marqueurs des problèmes routiers
 */
function afficherMarqueurs() {
    markersLayer.clearLayers();
    
    problemesRoutiers.forEach(probleme => {
        const marker = L.marker([probleme.lat, probleme.lng], {
            icon: icones[probleme.status]
        });

        // Créer le contenu du popup
        const popupContent = `
            <div class="custom-popup">
                <h4>🚧 ${probleme.nom}</h4>
                <p><strong>Problème #${probleme.id}</strong></p>
                <p><strong>Description:</strong> ${probleme.description}</p>
                <p><strong>Date:</strong> ${probleme.date}</p>
                <p><strong>Statut:</strong> <span class="status-badge status-${probleme.status}">${probleme.status.toUpperCase()}</span></p>
                <p><strong>Surface:</strong> ${probleme.surface} m²</p>
                <p><strong>Budget:</strong> ${probleme.budget.toLocaleString()} Ar</p>
                <p><strong>Entreprise:</strong> ${probleme.entreprise}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.bindTooltip(`<strong>${probleme.nom}</strong><br>Statut: ${probleme.status}`);
        
        markersLayer.addLayer(marker);
    });
}

/**
 * Mettre à jour les informations de la carte
 */
function updateMapInfo() {
    const center = map.getCenter();
    document.getElementById('zoomLevel').textContent = map.getZoom();
    document.getElementById('latitude').textContent = center.lat.toFixed(4);
    document.getElementById('longitude').textContent = center.lng.toFixed(4);
}

/**
 * Gestion du clic sur la carte
 */
function onMapClick(e) {
    console.log(`Coords: ${e.latlng.lat}, ${e.latlng.lng}`);
    // Ajouter du code pour créer un nouveau problème ici
}

/**
 * Calculer et afficher le récapitulatif
 */
function calculerRecapitulatif() {
    const nbPoints = problemesRoutiers.length;
    const surfaceTotal = problemesRoutiers.reduce((sum, p) => sum + p.surface, 0);
    const budgetTotal = problemesRoutiers.reduce((sum, p) => sum + p.budget, 0);
    const termine = problemesRoutiers.filter(p => p.status === 'termine').length;
    const avancement = Math.round((termine / nbPoints) * 100);

    document.getElementById('nbPoints').textContent = nbPoints;
    document.getElementById('surfaceTotal').textContent = surfaceTotal.toLocaleString();
    document.getElementById('avancement').textContent = avancement;
    document.getElementById('budgetTotal').textContent = budgetTotal.toLocaleString();
}

/**
 * Authentification - Afficher formulaire de connexion
 */
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

/**
 * Authentification - Afficher formulaire d'inscription
 */
function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

/**
 * Connexion utilisateur
 */
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (!email || !password) {
        errorDiv.textContent = 'Veuillez remplir tous les champs';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = {
                nom: 'Dupont',
                prenom: 'Jean',
                role: 'Administrateur',
                email: email
            };
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showUserPanel();
            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = data.error || 'Erreur de connexion';
        }
    } catch (error) {
        console.error('Erreur:', error);
        // Permettre la connexion même sans serveur auth (mode démo)
        authToken = 'demo-token';
        currentUser = {
            nom: 'Dupont',
            prenom: 'Jean',
            role: 'Administrateur',
            email: email
        };
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showUserPanel();
        errorDiv.textContent = '';
    }
}

/**
 * Inscription utilisateur
 */
async function register() {
    const nom = document.getElementById('registerNom').value;
    const prenom = document.getElementById('registerPrenom').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    if (!nom || !prenom || !email || !password) {
        errorDiv.textContent = 'Veuillez remplir tous les champs';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom, prenom, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            showLoginForm();
            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = data.error || 'Erreur lors de l\'inscription';
        }
    } catch (error) {
        console.error('Erreur:', error);
        errorDiv.textContent = 'Erreur de connexion au serveur';
    }
}

/**
 * Déconnexion
 */
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLoginForm();
}

/**
 * Afficher le panneau utilisateur
 */
function showUserPanel() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('userPanel').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('userName').textContent = `${currentUser.prenom} ${currentUser.nom}`;
        document.getElementById('userRole').textContent = `Rôle: ${currentUser.role}`;
    }
}

/**
 * Vérifier l'authentification stockée
 */
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showUserPanel();
    }
}

/**
 * Centrer la carte sur Antananarivo
 */
function centerMap() {
    map.setView([-18.8792, 47.5079], 13);
}

/**
 * Basculer l'affichage du trafic
 */
function toggleTraffic() {
    alert('Fonctionnalité trafic à implémenter');
}

/**
 * Basculer entre satellite et osm
 */
function toggleSatellite() {
    alert('Basculez les couches avec le contrôle en haut à droite');
}

/**
 * Exporter la carte
 */
function exportMap() {
    const canvas = map._container.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = 'carte_antananarivo.png';
        link.click();
    } else {
        alert('Export non disponible avec cette tuile');
    }
}

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    calculerRecapitulatif();
    checkAuth();
    updateMapInfo();
});

