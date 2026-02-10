<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mes Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refresh">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="loading" class="loading-container">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="signalements.length === 0" class="empty-state">
        <ion-icon :icon="documentOutline" size="large"></ion-icon>
        <h2>Aucun signalement</h2>
        <p>Vous n'avez pas encore créé de signalement</p>
      </div>

      <ion-list v-else>
        <ion-item 
          v-for="signalement in signalements" 
          :key="signalement.id"
          button
          @click="showDetails(signalement)"
        >
          <div class="signalement-content">
            <div class="status-indicator" :class="signalement.status"></div>
            <div class="signalement-info">
              <h3>{{ signalement.description || 'Signalement sans description' }}</h3>
              <p class="date">{{ formatDate(signalement.createdAt) }}</p>
              <p class="location">
                📍 {{ signalement.latitude.toFixed(5) }}, {{ signalement.longitude.toFixed(5) }}
              </p>
            </div>
            <div class="status-badge" :class="signalement.status">
              {{ getStatusLabel(signalement.status) }}
            </div>
          </div>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonSpinner, IonRefresher,
  IonRefresherContent, alertController
} from '@ionic/vue';
import { refreshOutline, documentOutline } from 'ionicons/icons';
import signalementService, { Signalement } from '@/services/signalementService';

const signalements = ref<Signalement[]>([]);
const loading = ref(true);
let unsubscribe: (() => void) | null = null;

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'nouveau': return 'Nouveau';
    case 'en_cours': return 'En cours';
    case 'termine': return 'Terminé';
    default: return status;
  }
};

const loadSignalements = async () => {
  loading.value = true;
  signalements.value = await signalementService.getMySignalements();
  loading.value = false;
};

const refresh = async () => {
  await loadSignalements();
};

const handleRefresh = async (event: CustomEvent) => {
  await loadSignalements();
  event.detail.complete();
};

const showDetails = async (signalement: Signalement) => {
  const alert = await alertController.create({
    header: 'Détails du signalement',
    message: `
      <strong>Statut:</strong> ${getStatusLabel(signalement.status)}<br>
      <strong>Description:</strong> ${signalement.description || 'N/A'}<br>
      <strong>Surface:</strong> ${signalement.surface ? signalement.surface + ' m²' : 'N/A'}<br>
      <strong>Date de création:</strong> ${formatDate(signalement.createdAt)}<br>
      ${signalement.updatedAt ? `<strong>Dernière mise à jour:</strong> ${formatDate(signalement.updatedAt)}<br>` : ''}
    `,
    buttons: ['Fermer']
  });

  await alert.present();
};

onMounted(async () => {
  await loadSignalements();

  // Listen to real-time updates
  unsubscribe = signalementService.listenToMySignalements((updated) => {
    signalements.value = updated;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  font-size: 64px;
  margin-bottom: 1rem;
}

.signalement-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.5rem 0;
}

.status-indicator {
  width: 4px;
  height: 50px;
  border-radius: 2px;
}

.status-indicator.nouveau {
  background-color: #eb445a;
}

.status-indicator.en_cours {
  background-color: #ffc409;
}

.status-indicator.termine {
  background-color: #2dd36f;
}

.signalement-info {
  flex: 1;
}

.signalement-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.signalement-info p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.nouveau {
  background-color: rgba(235, 68, 90, 0.2);
  color: #eb445a;
}

.status-badge.en_cours {
  background-color: rgba(255, 196, 9, 0.2);
  color: #ffc409;
}

.status-badge.termine {
  background-color: rgba(45, 211, 111, 0.2);
  color: #2dd36f;
}
</style>
