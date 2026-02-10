import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { database } from '@/firebase.config';
import { ref, set } from 'firebase/database';
import authService from './authService';
import firebaseRealtimeService from './firebaseRealtimeService';

class NotificationService {
  private initialized = false;
  private unreadCount = 0;

  async initialize() {
    if (this.initialized) return;

    try {
      // Demander permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await PushNotifications.register();

        // Écouter l'enregistrement du token
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('✓ FCM Token reçu:', token.value);
          await this.saveTokenToFirebase(token.value);
        });

        // Écouter les notifications reçues
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('📬 Notification reçue:', notification);
          this.handleNotification(notification);
        });

        // Écouter les actions sur les notifications
        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('👆 Action notification:', action);
          this.handleNotificationAction(action);
        });

        // S'abonner aux notifications Firebase Realtime DB
        const userEmail = authService.getUserEmail();
        if (userEmail) {
          firebaseRealtimeService.subscribeToNotifications(
            userEmail,
            (notifications) => {
              this.unreadCount = notifications.length;
              console.log(`📊 Notifications non lues: ${this.unreadCount}`);
            }
          );
        }

        this.initialized = true;
        console.log('✓ Service de notification initialisé');
      } else {
        console.warn('⚠ Permission notification refusée');
      }
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  }

  /**
   * Enregistrer le token FCM dans Firebase
   */
  private async saveTokenToFirebase(token: string) {
    const userEmail = authService.getUserEmail();
    const userId = authService.getUserId();
    
    if (!userEmail) {
      console.warn('⚠ Email utilisateur non disponible');
      return;
    }

    try {
      // Stocker le token pour que le backend puisse envoyer des notifications
      const tokenRef = ref(database, `fcm_tokens/${userEmail.replace(/@/g, '_at_').replace(/\./g, '_')}`);
      await set(tokenRef, {
        token,
        platform: 'mobile',
        userId,
        registeredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      });
      console.log('✓ Token FCM sauvegardé');
    } catch (error) {
      console.error('❌ Erreur sauvegarde token:', error);
    }
  }

  /**
   * Traiter une notification reçue
   */
  private handleNotification(notification: any) {
    const data = notification.data || {};
    
    // Afficher une notification système
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || 'Notification', {
        body: data.body || 'Vous avez une nouvelle notification',
        icon: '/assets/icon.png',
        badge: '/assets/badge.png'
      });
    }

    // Si c'est un changement de statut, mettre à jour Firebase
    if (data.type === 'status_change') {
      this.handleStatusChange(data);
    }
  }

  /**
   * Traiter une action sur notification
   */
  private handleNotificationAction(action: ActionPerformed) {
    const data = action.notification.data || {};
    
    // Marquer comme lue
    const userEmail = authService.getUserEmail();
    if (data.notification_key && userEmail) {
      firebaseRealtimeService.markNotificationAsRead(
        userEmail,
        data.notification_key
      ).catch(err => console.error('Erreur marquage notification:', err));
    }

    // Naviguer si une action est spécifiée
    if (data.action === 'view_signalement' && data.signalement_id) {
      // TODO: Naviguer vers le signalement
      console.log('Naviguer vers signalement:', data.signalement_id);
    }
  }

  /**
   * Traiter un changement de statut
   */
  private handleStatusChange(data: any) {
    console.log(`📊 Statut du signalement #${data.signalement_id} changé:`, 
                `${data.old_status} → ${data.new_status}`);
    
    // Rafraîchir les données du signalement depuis Firebase
    if (data.signalement_id) {
      firebaseRealtimeService.getSignalement(data.signalement_id.toString())
        .then(signalement => {
          if (signalement) {
            console.log('✓ Signalement mis à jour:', signalement);
          }
        })
        .catch(err => console.error('Erreur récupération signalement:', err));
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Désabonner des notifications
   */
  async unregister() {
    try {
      const userEmail = authService.getUserEmail();
      if (userEmail) {
        firebaseRealtimeService.unsubscribeFromNotifications(userEmail);
      }
      await PushNotifications.removeAllListeners();
      this.initialized = false;
      console.log('✓ Service de notification arrêté');
    } catch (error) {
      console.error('❌ Erreur arrêt service:', error);
    }
  }

  /**
   * Forcer la synchronisation des notifications
   */
  async synchronizeNotifications() {
    const userEmail = authService.getUserEmail();
    if (!userEmail) return;

    try {
      const data = await firebaseRealtimeService.getLocalData(userEmail);
      console.log('📊 Données locales synchronisées');
      return data;
    } catch (error) {
      console.error('❌ Erreur sync notifications:', error);
      return null;
    }  }
}

export default new NotificationService();