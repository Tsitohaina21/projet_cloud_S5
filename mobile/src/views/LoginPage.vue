<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <ion-icon :icon="mapOutline" size="large" color="primary"></ion-icon>
          <h1>Travaux Routiers</h1>
          <p>Antananarivo</p>
        </div>

        <ion-card>
          <ion-card-content>
            <form @submit.prevent="handleLogin">
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input 
                  v-model="email" 
                  type="email" 
                  required
                  autocomplete="email"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Mot de passe</ion-label>
                <ion-input 
                  v-model="password" 
                  type="password" 
                  required
                  autocomplete="current-password"
                ></ion-input>
              </ion-item>

              <ion-button 
                expand="block" 
                type="submit" 
                class="ion-margin-top"
                :disabled="loading"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>Se connecter</span>
              </ion-button>
            </form>

            <ion-text color="danger" v-if="error" class="ion-margin-top">
              <p>{{ error }}</p>
            </ion-text>

            <ion-text color="medium" class="ion-margin-top">
              <p class="info-text">
                Les comptes sont créés par le manager via l'application web.
              </p>
            </ion-text>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonIcon, IonSpinner
} from '@ionic/vue';
import { mapOutline } from 'ionicons/icons';
import authService from '@/services/authService';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  const result = await authService.login(email.value, password.value);

  if (result.success) {
    router.push('/tabs/map');
  } else {
    error.value = result.error || 'Erreur de connexion';
  }

  loading.value = false;
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-section ion-icon {
  font-size: 64px;
  margin-bottom: 1rem;
}

.logo-section h1 {
  margin: 0.5rem 0;
  color: var(--ion-color-primary);
}

.logo-section p {
  margin: 0;
  color: var(--ion-color-medium);
}

.info-text {
  font-size: 0.85rem;
  text-align: center;
}

ion-item {
  --background: transparent;
  margin-bottom: 1rem;
}

ion-label[position="stacked"] {
  margin-bottom: 6px;
}
</style>
