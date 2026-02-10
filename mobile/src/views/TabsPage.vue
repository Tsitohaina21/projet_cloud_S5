<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="map" href="/tabs/map">
          <ion-icon aria-hidden="true" :icon="mapIcon" />
          <ion-label>Carte</ion-label>
        </ion-tab-button>
          
        <ion-tab-button tab="signalements" href="/tabs/signalements">
          <ion-icon aria-hidden="true" :icon="list" />
          <ion-label>Mes signalements</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="notifications" href="/tabs/notifications">
          <ion-icon aria-hidden="true" :icon="notificationsIcon" />
          <ion-label>Notifications</ion-label>
          <ion-badge v-if="unreadCount > 0" color="danger">{{ unreadCount }}</ion-badge>
        </ion-tab-button>
        
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet, IonBadge } from '@ionic/vue';
import { map as mapIcon, list, person, notifications as notificationsIcon } from 'ionicons/icons';
import { database } from '@/firebase.config';
import { ref as dbRef, onValue, off } from 'firebase/database';
import authService from '@/services/authService';

const unreadCount = ref(0);
let listener: any = null;

const encodeEmail = (email: string): string => {
  return email.replace(/@/g, '_at_').replace(/\./g, '_');
};

onMounted(() => {
  const userEmail = authService.getUserEmail();
  if (userEmail) {
    const encodedEmail = encodeEmail(userEmail);
    const notifRef = dbRef(database, `notifications/${encodedEmail}`);
    listener = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifs = Object.values(data) as any[];
        unreadCount.value = notifs.filter((n: any) => !n.read).length;
      } else {
        unreadCount.value = 0;
      }
    });
  }
});

onUnmounted(() => {
  const userEmail = authService.getUserEmail();
  if (userEmail && listener) {
    const encodedEmail = encodeEmail(userEmail);
    off(dbRef(database, `notifications/${encodedEmail}`), 'value', listener);
  }
});
</script>