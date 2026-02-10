<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Carte des Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFilter">
            <ion-icon :icon="filterOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="map" ref="mapContainer"></div>

      <!-- Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openCreateModal" color="primary">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Stats Recap Card -->
      <ion-card class="stats-card">
        <ion-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ signalements.length }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getCountByStatus('nouveau') }}</div>
              <div class="stat-label">Nouveau</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getCountByStatus('en_cours') }}</div>
              <div class="stat-label">En cours</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getCountByStatus('termine') }}</div>
              <div class="stat-label">Terminé</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFab, IonFabButton, IonCard, IonCardContent,
  alertController, onIonViewWillEnter
} from '@ionic/vue';
import { addOutline, filterOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import signalementService, { Signalement } from '@/services/signalementService';
import authService from '@/services/authService';

const router = useRouter();
const mapContainer = ref<HTMLElement>();
const signalements = ref<Signalement[]>([]);
const showOnlyMine = ref(false);
let map: L.Map | null = null;
let markers: L.Marker[] = [];
let unsubscribe: (() => void) | null = null;

const getCountByStatus = (status: string) => {
  return signalements.value.filter(s => s.status === status).length;
};

const initMap = () => {
  if (!mapContainer.value) return;

  // Centre sur Antananarivo
  map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
};

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'nouveau': return 'red';
    case 'en_cours': return 'orange';
    case 'termine': return 'green';
    default: return 'gray';
  }
};

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12]
  });
};

const updateMarkers = () => {
  if (!map) return;

  // Clear existing markers
  markers.forEach(marker => marker.remove());
  markers = [];

  // Add new markers
  signalements.value.forEach(signalement => {
    const marker = L.marker(
      [signalement.latitude, signalement.longitude],
      { icon: createMarkerIcon(getMarkerColor(signalement.status)) }
    ).addTo(map!);

    const createdAt = signalement.createdAt
      ? new Date(signalement.createdAt).toLocaleDateString('fr-FR')
      : 'N/A';
    const userEmail = signalement.userEmail || 'N/A';

    marker.bindPopup(`
      <strong>Statut:</strong> ${signalement.status}<br>
      <strong>Par:</strong> ${userEmail}<br>
      ${signalement.description ? `<strong>Description:</strong> ${signalement.description}<br>` : ''}
      <strong>Date:</strong> ${createdAt}
    `);

    markers.push(marker);
  });
};

const loadSignalements = async () => {
  if (showOnlyMine.value) {
    signalements.value = await signalementService.getMySignalements();
  } else {
    signalements.value = await signalementService.getAll();
  }
  updateMarkers();
};

const toggleFilter = async () => {
  showOnlyMine.value = !showOnlyMine.value;
  const filterText = showOnlyMine.value ? 'Mes signalements' : 'Tous les signalements';
  
  const alert = await alertController.create({
    header: 'Filtre',
    message: `Affichage: ${filterText}`,
    buttons: ['OK']
  });
  
  await alert.present();
  await loadSignalements();
};

const openCreateModal = () => {
  router.push('/create-signalement');
};

onMounted(async () => {
  if (!authService.isAuthenticated()) {
    router.push('/login');
    return;
  }

  initMap();
  await loadSignalements();

  // Listen to changes for my signalements
  unsubscribe = signalementService.listenToMySignalements((updated) => {
    if (showOnlyMine.value) {
      signalements.value = updated;
      updateMarkers();
    }
  });
});

onIonViewWillEnter(async () => {
  if (!authService.isAuthenticated()) {
    router.push('/login');
    return;
  }
  await loadSignalements();
  if (map) {
    map.invalidateSize();
  }
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (map) map.remove();
});
</script>

<style scoped>
#map {
  width: 100%;
  height: calc(100% - 120px);
}

.stats-card {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  margin: 0;
  z-index: 1000;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  text-align: center;
}

.stat-item {
  padding: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}
</style>
