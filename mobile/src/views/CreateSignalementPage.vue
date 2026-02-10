<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/map"></ion-back-button>
        </ion-buttons>
        <ion-title>Nouveau Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleSubmit">
        <!-- Sélection de localisation sur la carte -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Localisation</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p style="color: var(--ion-color-medium); font-size: 0.9rem;">
              Cliquez sur la carte pour sélectionner l'emplacement
            </p>
            <div id="map-selector" ref="mapContainer" style="height: 300px; border-radius: 8px; margin-bottom: 1rem;"></div>

            <ion-item v-if="location">
              <ion-label>
                <p><strong>Latitude:</strong> {{ location.latitude.toFixed(6) }}</p>
                <p><strong>Longitude:</strong> {{ location.longitude.toFixed(6) }}</p>
              </ion-label>
            </ion-item>

            <ion-text color="danger" v-if="!location">
              <p style="font-size: 0.9rem;">⚠️ Veuillez sélectionner un emplacement sur la carte</p>
            </ion-text>
          </ion-card-content>
        </ion-card>

        <!-- Description & Surface -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Détails</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Description du problème</ion-label>
              <ion-textarea 
                v-model="form.description" 
                :rows="4"
                placeholder="Décrivez le problème routier..."
              ></ion-textarea>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Surface estimée (m²)</ion-label>
              <ion-input 
                v-model.number="form.surface" 
                type="number"
                placeholder="Ex: 50"
                min="0"
                step="0.1"
              ></ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Photos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Photos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" @click="takePhoto">
              <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
              Prendre une photo
            </ion-button>

            <div class="photos-preview" v-if="photos.length > 0">
              <div v-for="(photo, index) in photos" :key="index" class="photo-item">
                <img :src="photo" alt="Photo">
                <ion-button size="small" color="danger" @click="removePhoto(index)">
                  <ion-icon :icon="closeOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Submit -->
        <ion-button 
          expand="block" 
          type="submit" 
          color="primary"
          :disabled="!canSubmit || submitting"
          class="ion-margin-top"
        >
          <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
          <span v-else>Envoyer le signalement</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonTextarea, IonInput, IonButton, IonIcon,
  IonSpinner, IonText, toastController, onIonViewDidEnter
} from '@ionic/vue';
import { cameraOutline, closeOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import signalementService from '@/services/signalementService';

const router = useRouter();
const mapContainer = ref<HTMLElement>();
const location = ref<{ latitude: number; longitude: number } | null>(null);
const photos = ref<string[]>([]);
const submitting = ref(false);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const form = ref({
  description: '',
  surface: null as number | null
});

const canSubmit = computed(() => {
  return location.value !== null && form.value.description.trim().length > 0;
});

const initMap = () => {
  if (!mapContainer.value) return;

  // Centre sur Antananarivo
  map = L.map(mapContainer.value).setView([-18.8792, 47.5079], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Événement de clic sur la carte
  map.on('click', (e: L.LeafletMouseEvent) => {
    location.value = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    };

    // Ajouter/mettre à jour le marqueur
    if (marker) {
      marker.remove();
    }

    marker = L.marker([e.latlng.lat, e.latlng.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map!);

    marker.bindPopup(`
      <strong>Emplacement sélectionné</strong><br>
      Latitude: ${e.latlng.lat.toFixed(6)}<br>
      Longitude: ${e.latlng.lng.toFixed(6)}
    `).openPopup();

    // Centrer la vue sur le marqueur
    map!.setView([e.latlng.lat, e.latlng.lng], map!.getZoom());

    const toast = toastController.create({
      message: '✅ Emplacement sélectionné',
      duration: 1500,
      color: 'success'
    });
    toast.then(t => t.present());
  });

  // Afficher le curseur spécial au survol
  const container = mapContainer.value;
  if (container) {
    container.style.cursor = 'pointer';
  }
};

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 60,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    if (image.dataUrl) {
      photos.value.push(image.dataUrl);
    }
  } catch (error) {
    console.error('Error taking photo:', error);
  }
};

const removePhoto = (index: number) => {
  photos.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    const signalementData = {
      latitude: location.value!.latitude,
      longitude: location.value!.longitude,
      description: form.value.description,
      surface: form.value.surface || 0,
      status: 'nouveau' as const,
      photos: photos.value
    };

    const result = await signalementService.create(signalementData, true);

    if (result.success) {
      if (photos.value.length > 0) {
        const infoToast = await toastController.create({
          message: 'Signalement créé. Photos en cours d\'envoi…',
          duration: 2000,
          color: 'medium'
        });
        await infoToast.present();
      }
      const toast = await toastController.create({
        message: 'Signalement créé avec succès',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      router.push('/tabs/map');
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error('Error:', error);
    const toast = await toastController.create({
      message: error.message || 'Erreur lors de la création',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  initMap();
  await nextTick();
  if (map) {
    map.invalidateSize();
  }
});

onIonViewDidEnter(() => {
  if (map) {
    map.invalidateSize();
  }
});

onUnmounted(() => {
  if (map) map.remove();
});
</script>

<style scoped>
#map-selector {
  border: 2px solid var(--ion-color-primary);
  border-radius: 8px;
  width: 100%;
  height: 300px;
  min-height: 300px;
}

#map-selector .leaflet-container {
  width: 100%;
  height: 100%;
}

.photos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.photo-item ion-button {
  position: absolute;
  top: 5px;
  right: 5px;
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
}

ion-item {
  --min-height: 62px;
  --padding-top: 10px;
  --padding-bottom: 10px;
}

ion-label[position="floating"] {
  margin-bottom: 6px;
  font-size: 0.92rem;
}

ion-input,
ion-textarea {
  padding-top: 6px;
}
</style>
