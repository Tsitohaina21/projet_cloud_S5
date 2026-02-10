import { database, storage } from '@/firebase.config';
import { ref as dbRef, push, onValue, off, set, update, get, query, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import authService from './authService';

/**
 * Service Firebase pour la synchronisation bidirectionnelle
 * 
 * Architecture:
 * 1. Mobile lit depuis Firebase Realtime Database (mode offline possible)
 * 2. Mobile upload les signalements via REST API au backend
 * 3. Backend synchronise PostgreSQL ↔ Firebase
 * 4. Les notifications arrivent via FCM
 */
class FirebaseRealtimeService {
  private signalementListeners = new Map();
  private notificationListeners = new Map();

  /**
   * S'abonne aux changements de signalements d'un utilisateur
   * Mode offline: Firebase sync les données localement
   */
  subscribeToUserSignalements(userEmail: string, callback: (signalements: any[]) => void) {
    try {
      const userKey = this.encodeEmail(userEmail);
      const ref = dbRef(database, `user_signalements/${userKey}`);

      const listener = onValue(ref, (snapshot) => {
        const data = snapshot.val();
        const signalements = data ? Object.values(data) : [];
        callback(signalements);
      });

      this.signalementListeners.set(userEmail, listener);
    } catch (error) {
      console.error('Erreur subscription signalements:', error);
    }
  }

  /**
   * S'abonne aux signalements publics (tous les signalements)
   * Pour affichage sur la carte web
   */
  subscribeToAllSignalements(callback: (signalements: any[]) => void) {
    try {
      const ref = dbRef(database, 'signalements');

      const listener = onValue(ref, (snapshot) => {
        const data = snapshot.val();
        const signalements = data ? Object.values(data) : [];
        callback(signalements);
      });

      this.signalementListeners.set('__all__', listener);
    } catch (error) {
      console.error('Erreur subscription tous signalements:', error);
    }
  }

  /**
   * Créé un signalement dans Firebase
   * (Pour le mode offline, sera sync au backend au retour en ligne)
   */
  async createSignalementInFirebase(signalement: any): Promise<string> {
    try {
      const userEmail = authService.getUserEmail();
      const userKey = this.encodeEmail(userEmail);
      
      // Générer un ID unique
      const newRef = dbRef(database, `user_signalements/${userKey}`);
      const newSignalementRef = push(newRef);
      
      // Upload vers Firebase Realtime Database
      await set(newSignalementRef, {
        ...signalement,
        user_email: userEmail,
        created_at: new Date().toISOString(),
        firebase_only: true // Marqué comme créé offline
      });

      return signalement.id || 'new';
    } catch (error) {
      console.error('Erreur création signalement Firebase:', error);
      throw error;
    }
  }

  /**
   * Met à jour un signalement dans Firebase
   */
  async updateSignalementInFirebase(signalementId: string, updates: any): Promise<void> {
    try {
      const userEmail = authService.getUserEmail();
      const userKey = this.encodeEmail(userEmail);
      
      const ref = dbRef(database, `user_signalements/${userKey}/${signalementId}`);
      await update(ref, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      // Mettre à jour aussi la version publique
      const publicRef = dbRef(database, `signalements/${signalementId}`);
      await update(publicRef, {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur mise à jour signalement Firebase:', error);
      throw error;
    }
  }

  /**
   * Upload une photo vers Firebase Storage
   * et retourne l'URL downloadable
   */
  async uploadPhoto(
    signalementId: string,
    photoBlob: Blob,
    filename: string
  ): Promise<string> {
    try {
      const userEmail = authService.getUserEmail();
      const timestamp = Date.now();
      const path = `signalements/${userEmail}/${signalementId}/${timestamp}-${filename}`;
      
      const ref = storageRef(storage, path);
      const snapshot = await uploadBytes(ref, photoBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Erreur upload photo:', error);
      throw error;
    }
  }

  /**
   * S'abonne aux notifications d'un utilisateur
   */
  subscribeToNotifications(userEmail: string, callback: (notifications: any[]) => void) {
    try {
      const userKey = this.encodeEmail(userEmail);
      const ref = dbRef(database, `notifications/${userKey}`);

      const listener = onValue(ref, (snapshot) => {
        const data = snapshot.val();
        const notifications = data ? Object.values(data) : [];
        // Filtre les non-lues
        const unread = notifications.filter((n: any) => !n.read);
        callback(unread);
      });

      this.notificationListeners.set(userEmail, listener);
    } catch (error) {
      console.error('Erreur subscription notifications:', error);
    }
  }

  /**
   * Marque une notification comme lue dans Firebase
   */
  async markNotificationAsRead(userEmail: string, notificationKey: string): Promise<void> {
    try {
      const userKey = this.encodeEmail(userEmail);
      const ref = dbRef(database, `notifications/${userKey}/${notificationKey}`);
      await update(ref, { read: true });
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      throw error;
    }
  }

  /**
   * Récupère un signalement spécifique depuis Firebase
   */
  async getSignalement(signalementId: string): Promise<any> {
    try {
      const ref = dbRef(database, `signalements/${signalementId}`);
      const snapshot = await get(ref);
      return snapshot.val();
    } catch (error) {
      console.error('Erreur récupération signalement:', error);
      return null;
    }
  }

  /**
   * Récupère les signalements d'un utilisateur qui n'ont pas été
   * synchronisés au backend (firebase_only === true)
   */
  async getPendingSyncSignalements(userEmail: string): Promise<any[]> {
    try {
      const userKey = this.encodeEmail(userEmail);
      const ref = dbRef(database, `user_signalements/${userKey}`);
      const snapshot = await get(ref);
      const data = snapshot.val();

      if (!data) return [];

      const pending = Object.entries(data)
        .filter(([_, s]: [string, any]) => s.firebase_only === true)
        .map(([_, s]) => s);

      return pending;
    } catch (error) {
      console.error('Erreur récupération pending signalements:', error);
      return [];
    }
  }

  /**
   * Marque un signalement comme synchronisé
   */
  async markSignalementAsSynced(signalementId: string): Promise<void> {
    try {
      const userEmail = authService.getUserEmail();
      const userKey = this.encodeEmail(userEmail);

      const ref = dbRef(database, `user_signalements/${userKey}/${signalementId}`);
      await update(ref, { firebase_only: false, synced_at: new Date().toISOString() });
    } catch (error) {
      console.error('Erreur marquage sync:', error);
      throw error;
    }
  }

  /**
   * Désabonne un listener
   */
  unsubscribeFromSignalements(userEmail: string): void {
    const listener = this.signalementListeners.get(userEmail);
    if (listener) {
      off(dbRef(database, `user_signalements/${this.encodeEmail(userEmail)}`), 'value', listener);
      this.signalementListeners.delete(userEmail);
    }
  }

  /**
   * Désabonne un listener de notifications
   */
  unsubscribeFromNotifications(userEmail: string): void {
    const listener = this.notificationListeners.get(userEmail);
    if (listener) {
      off(dbRef(database, `notifications/${this.encodeEmail(userEmail)}`), 'value', listener);
      this.notificationListeners.delete(userEmail);
    }
  }

  /**
   * Encode l'email pour util sation comme clé Firebase
   * Firebase n'aime pas les @ et .
   */
  private encodeEmail(email: string): string {
    return email.replace(/@/g, '_at_').replace(/\./g, '_');
  }

  /**
   * Récupère les données locales actuellement synchronisées
   * (Utilisé pour le mode offline)
   */
  async getLocalData(userEmail: string): Promise<any> {
    try {
      const userKey = this.encodeEmail(userEmail);
      const ref = dbRef(database, `user_signalements/${userKey}`);
      const snapshot = await get(ref);
      return snapshot.val();
    } catch (error) {
      console.error('Erreur récupération données locales:', error);
      return null;
    }
  }

  /**
   * Initialise la synchronisation offline
   * Permet au mobile de fonctionner hors ligne
   */
  enableOfflineSync(): void {
    try {
      // Firebase Realtime Database supporte natif le sync offline
      // Les changements sont automatiquement mis en file d'attente
      // et envoyés au recon nexion
      console.log('Offline sync activé (Firebase Realtime DB gère automatiquement)');
    } catch (error) {
      console.error('Erreur activation offline sync:', error);
    }
  }
}

export default new FirebaseRealtimeService();
