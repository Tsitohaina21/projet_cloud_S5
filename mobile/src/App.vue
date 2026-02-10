<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import notificationService from '@/services/notificationService';
import authService from '@/services/authService';

onMounted(async () => {
  // Initialize notifications if user is authenticated
  if (authService.isAuthenticated()) {
    await notificationService.initialize();
  }
});
</script>
