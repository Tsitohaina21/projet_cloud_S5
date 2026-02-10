<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card>
        <ion-card-header>
          <div class="profile-header">
            <ion-icon :icon="personCircleOutline" size="large" color="primary"></ion-icon>
            <ion-card-title>{{ userEmail }}</ion-card-title>
          </div>
        </ion-card-header>
        
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
              <ion-label>Notifications activées</ion-label>
              <ion-toggle checked></ion-toggle>
            </ion-item>
            
            <ion-item button>
              <ion-icon :icon="helpCircleOutline" slot="start"></ion-icon>
              <ion-label>Aide</ion-label>
            </ion-item>
            
            <ion-item button>
              <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
              <ion-label>À propos</ion-label>
            </ion-item>
          </ion-list>
          
          <ion-button 
            expand="block" 
            color="danger" 
            class="ion-margin-top"
            @click="handleLogout"
          >
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Se déconnecter
          </ion-button>
        </ion-card-content>
      </ion-card>
      
      <div class="app-info">
        <p>Travaux Routiers Antananarivo</p>
        <p>Version 1.0.0</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonToggle
} from '@ionic/vue';
import { 
  personCircleOutline, notificationsOutline, helpCircleOutline,
  informationCircleOutline, logOutOutline
} from 'ionicons/icons';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';

const router = useRouter();
const userEmail = ref(authService.getUserEmail());

const handleLogout = async () => {
  try {
    await notificationService.unregister();
  } catch (error) {
    console.error('Notification unregister failed:', error);
  }

  const result = await authService.logout();
  if (!result.success) {
    console.error('Logout failed:', result.error);
  }

  router.replace('/login');
};
</script>

<style scoped>
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.profile-header ion-icon {
  font-size: 80px;
}

.app-info {
  text-align: center;
  margin-top: 2rem;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.app-info p {
  margin: 0.25rem 0;
}
</style>
