<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="markAllAsRead" v-if="unreadNotifications.length > 0">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
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

      <div v-else-if="notifications.length === 0" class="empty-state">
        <ion-icon :icon="notificationsOffOutline" size="large"></ion-icon>
        <h2>Aucune notification</h2>
        <p>Vous serez notifié lorsqu'un de vos signalements sera modifié</p>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="notif in notifications" :key="notif.key">
          <ion-item 
            :class="{ 'unread': !notif.read }"
            button
            @click="openNotification(notif)"
          >
            <ion-icon 
              slot="start" 
              :icon="getNotifIcon(notif.type)" 
              :color="notif.read ? 'medium' : 'primary'"
            ></ion-icon>
            <ion-label>
              <h3 :class="{ 'fw-bold': !notif.read }">{{ notif.title }}</h3>
              <p>{{ notif.body }}</p>
              <p class="notif-date">{{ formatDate(notif.sent_at) }}</p>
            </ion-label>
            <div v-if="!notif.read" slot="end" class="unread-dot"></div>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteNotification(notif)">
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonSpinner,
  IonRefresher, IonRefresherContent, IonItemSliding, IonItemOptions,
  IonItemOption, alertController, toastController
} from '@ionic/vue';
import { 
  notificationsOffOutline, checkmarkDoneOutline, trashOutline,
  alertCircleOutline, swapHorizontalOutline, constructOutline
} from 'ionicons/icons';
import { database } from '@/firebase.config';
import { ref as dbRef, onValue, off, update, remove } from 'firebase/database';
import authService from '@/services/authService';

interface Notification {
  key: string;
  type: string;
  signalement_id: number;
  title: string;
  body: string;
  sent_at: string;
  read: boolean;
  old_status?: string;
  new_status?: string;
}

const notifications = ref<Notification[]>([]);
const loading = ref(true);
let listener: any = null;

const unreadNotifications = computed(() => notifications.value.filter(n => !n.read));

const encodeEmail = (email: string): string => {
  return email.replace(/@/g, '_at_').replace(/\./g, '_');
};

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'status_change': return swapHorizontalOutline;
    case 'signalement_update': return constructOutline;
    default: return alertCircleOutline;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadNotifications = () => {
  const userEmail = authService.getUserEmail();
  if (!userEmail) {
    loading.value = false;
    return;
  }

  const encodedEmail = encodeEmail(userEmail);
  const notifRef = dbRef(database, `notifications/${encodedEmail}`);

  listener = onValue(notifRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      notifications.value = Object.entries(data)
        .map(([key, value]: [string, any]) => ({
          key,
          ...value
        }))
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    } else {
      notifications.value = [];
    }
    loading.value = false;
  });
};

const openNotification = async (notif: Notification) => {
  // Marquer comme lue
  if (!notif.read) {
    const userEmail = authService.getUserEmail();
    if (userEmail) {
      const encodedEmail = encodeEmail(userEmail);
      const notifRef = dbRef(database, `notifications/${encodedEmail}/${notif.key}`);
      await update(notifRef, { read: true });
    }
  }

  const alert = await alertController.create({
    header: notif.title,
    message: `
      <p>${notif.body}</p>
      <p><small>Reçue le ${formatDate(notif.sent_at)}</small></p>
    `,
    buttons: ['Fermer']
  });
  await alert.present();
};

const markAllAsRead = async () => {
  const userEmail = authService.getUserEmail();
  if (!userEmail) return;

  const encodedEmail = encodeEmail(userEmail);
  const updates: Record<string, any> = {};
  
  unreadNotifications.value.forEach(notif => {
    updates[`notifications/${encodedEmail}/${notif.key}/read`] = true;
  });

  if (Object.keys(updates).length > 0) {
    await update(dbRef(database), updates);
    const toast = await toastController.create({
      message: 'Toutes les notifications marquées comme lues',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
};

const deleteNotification = async (notif: Notification) => {
  const userEmail = authService.getUserEmail();
  if (!userEmail) return;

  const encodedEmail = encodeEmail(userEmail);
  const notifRef = dbRef(database, `notifications/${encodedEmail}/${notif.key}`);
  await remove(notifRef);
};

const handleRefresh = async (event: CustomEvent) => {
  // Firebase realtime déjà en écoute, juste un petit délai
  setTimeout(() => event.detail.complete(), 500);
};

onMounted(() => {
  loadNotifications();
});

onUnmounted(() => {
  if (listener) {
    const userEmail = authService.getUserEmail();
    if (userEmail) {
      const encodedEmail = encodeEmail(userEmail);
      off(dbRef(database, `notifications/${encodedEmail}`), 'value', listener);
    }
  }
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
  font-size: 4rem;
  margin-bottom: 1rem;
}

.unread {
  --background: rgba(var(--ion-color-primary-rgb), 0.05);
}

.fw-bold {
  font-weight: 700 !important;
}

.notif-date {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ion-color-primary);
}
</style>
