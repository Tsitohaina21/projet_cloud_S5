function getConfigValue(key, fallback) {
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(key);
    if (value) {
      return decodeURIComponent(value);
    }
  } catch (e) {
    // ignore
  }

  if (window.APP_CONFIG && window.APP_CONFIG[key]) {
    return window.APP_CONFIG[key];
  }

  return fallback;
}

const API_URL = getConfigValue('api', 'http://10.0.2.2:8080/api');
const TILE_SERVER_URL = getConfigValue('tiles', 'http://10.0.2.2:8082');

let map;
let currentUser = null;
let authToken = null;
let markersLayer = L.featureGroup();
let reportMode = false;
let pendingCoords = null;

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
    lat: -18.91,
    lng: 47.52,
    nom: "Avenue Andohalo",
    date: '2025-01-10',
    status: 'en-cours',
    surface: 280,
    budget: 8500000,
    entreprise: 'Routes et Travaux SA',
    description: 'Renovation de chaussee'
  },
  {
    id: 3,
    lat: -18.865,
    lng: 47.525,
    nom: "Route Nationale 5",
    date: '2025-01-05',
    status: 'termine',
    surface: 120,
    budget: 3200000,
    entreprise: 'Construction Plus',
    description: 'Repavage termine'
  }
];

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

function initMap() {
  map = L.map('map').setView([-18.8792, 47.5079], 13);

  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap',
    name: 'OpenStreetMap'
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Esri',
    name: 'Satellite'
  });

  const offlineLayer = L.tileLayer(`${TILE_SERVER_URL}/styles/basic-preview/{z}/{x}/{y}.png`, {
    maxZoom: 19,
    attribution: 'Offline Tiles',
    name: 'Offline'
  });

  osmLayer.addTo(map);

  L.control.layers({
    'OpenStreetMap': osmLayer,
    'Satellite': satelliteLayer,
    'Offline (local)': offlineLayer
  }).addTo(map);

  L.control.scale().addTo(map);

  markersLayer.addTo(map);

  map.on('move', updateMapInfo);
  map.on('zoom', updateMapInfo);
  map.on('click', onMapClick);

  afficherMarqueurs();
}

function afficherMarqueurs() {
  markersLayer.clearLayers();

  problemesRoutiers.forEach(probleme => {
    const marker = L.marker([probleme.lat, probleme.lng], {
      icon: icones[probleme.status]
    });

    const popupContent = `
      <div class="custom-popup">
        <h4>${probleme.nom}</h4>
        <p><strong>Probleme #${probleme.id}</strong></p>
        <p><strong>Description:</strong> ${probleme.description}</p>
        <p><strong>Date:</strong> ${probleme.date}</p>
        <p><strong>Statut:</strong> <span class="status-badge status-${probleme.status}">${probleme.status.toUpperCase()}</span></p>
        <p><strong>Surface:</strong> ${probleme.surface} m2</p>
        <p><strong>Budget:</strong> ${probleme.budget.toLocaleString()} Ar</p>
        <p><strong>Entreprise:</strong> ${probleme.entreprise}</p>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.bindTooltip(`<strong>${probleme.nom}</strong><br>Statut: ${probleme.status}`);

    markersLayer.addLayer(marker);
  });
}

function updateMapInfo() {
  const center = map.getCenter();
  const zoomEl = document.getElementById('zoomLevel');
  const latEl = document.getElementById('latitude');
  const lonEl = document.getElementById('longitude');

  if (zoomEl) zoomEl.textContent = map.getZoom();
  if (latEl) latEl.textContent = center.lat.toFixed(4);
  if (lonEl) lonEl.textContent = center.lng.toFixed(4);
}

function onMapClick(e) {
  if (!reportMode) {
    console.log(`Coords: ${e.latlng.lat}, ${e.latlng.lng}`);
    return;
  }

  pendingCoords = {
    lat: e.latlng.lat,
    lng: e.latlng.lng
  };

  openReportModal();
}

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

function toggleReportMode() {
  reportMode = !reportMode;
  const btn = document.querySelector('.control-panel .btn-control');
  if (btn) {
    btn.textContent = reportMode ? 'Touchez la carte...' : 'Signaler un probleme';
  }
}

function openReportModal() {
  const modal = document.getElementById('reportModal');
  const error = document.getElementById('reportError');
  if (error) error.textContent = '';
  if (modal) modal.classList.remove('hidden');
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.add('hidden');
}

function cancelReport() {
  pendingCoords = null;
  closeReportModal();
  if (reportMode) toggleReportMode();
}

function submitReport() {
  const nom = document.getElementById('reportNom').value.trim();
  const description = document.getElementById('reportDescription').value.trim();
  const surface = Number(document.getElementById('reportSurface').value || 0);
  const budget = Number(document.getElementById('reportBudget').value || 0);
  const entreprise = document.getElementById('reportEntreprise').value.trim();
  const status = document.getElementById('reportStatus').value;
  const errorDiv = document.getElementById('reportError');

  if (!pendingCoords) {
    errorDiv.textContent = 'Touchez la carte pour choisir un emplacement.';
    return;
  }

  if (!nom || !description) {
    errorDiv.textContent = 'Veuillez renseigner un lieu et une description.';
    return;
  }

  const newId = problemesRoutiers.length
    ? Math.max(...problemesRoutiers.map(p => p.id)) + 1
    : 1;

  const today = new Date();
  const date = today.toISOString().slice(0, 10);

  problemesRoutiers.push({
    id: newId,
    lat: pendingCoords.lat,
    lng: pendingCoords.lng,
    nom,
    date,
    status,
    surface,
    budget,
    entreprise: entreprise || 'Non specifie',
    description
  });

  afficherMarqueurs();
  calculerRecapitulatif();
  closeReportModal();
  pendingCoords = null;
  if (reportMode) toggleReportMode();
}

function showLoginForm() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  if (!email || !password) {
    errorDiv.textContent = 'Veuillez remplir tous les champs';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    const token = data && data.data ? data.data.token : data.token;
    const user = data && data.data ? data.data.user : null;

    if (response.ok && token) {
      authToken = token;
      currentUser = user || {
        prenom: 'Utilisateur',
        nom: '',
        role: 'Utilisateur',
        email: email
      };
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showUserPanel();
      errorDiv.textContent = '';
    } else {
      errorDiv.textContent = (data && data.message) || (data && data.error) || 'Erreur de connexion';
    }
  } catch (error) {
    console.error('Erreur:', error);
    errorDiv.textContent = 'Erreur de connexion au serveur';
  }
}

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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        first_name: prenom,
        last_name: nom
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Compte cree avec succes. Vous pouvez vous connecter.');
      showLoginForm();
      errorDiv.textContent = '';
    } else {
      errorDiv.textContent = (data && data.message) || (data && data.error) || 'Erreur lors de inscription';
    }
  } catch (error) {
    console.error('Erreur:', error);
    errorDiv.textContent = 'Erreur de connexion au serveur';
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  showLoginForm();
}

function showUserPanel() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('userPanel').classList.remove('hidden');

  if (currentUser) {
    const prenom = currentUser.first_name || currentUser.prenom || '';
    const nom = currentUser.last_name || currentUser.nom || '';
    document.getElementById('userName').textContent = `${prenom} ${nom}`.trim();
    document.getElementById('userRole').textContent = 'Role: Utilisateur';
  }
}

function checkAuth() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');

  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    showUserPanel();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initMap();
  calculerRecapitulatif();
  checkAuth();
  updateMapInfo();
});
