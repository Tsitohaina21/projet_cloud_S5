import { API_ENDPOINTS } from '@/config/api';
import apiService from './apiService';
import { storage, database } from '@/firebase.config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import authService from './authService';
import { ref, push, set, update, get } from 'firebase/database';

export interface Signalement {
  id?: string;
  latitude: number;
  longitude: number;
  status: 'nouveau' | 'en_cours' | 'termine';
  surface?: number;
  budget?: number;
  entreprise?: string;
  description?: string;
  photos?: string[];
  createdAt?: string;
  dateEnCours?: string;
  dateTermine?: string;
  updatedAt?: string;
  userEmail?: string;
  synced?: boolean;
}

class SignalementService {
  /**
   * Encode l'email pour l'utiliser comme clé Firebase
   * Remplace les caractères invalides: . et @
   */
  private encodeEmail(email: string | null): string {
    if (!email) return '';
    return email.replace(/\./g, '_').replace(/@/g, '_at_');
  }

  private normalize(signalement: any): Signalement {
    if (!signalement) return signalement;
    const latitude = typeof signalement.latitude === 'string'
      ? Number(signalement.latitude)
      : signalement.latitude;
    const longitude = typeof signalement.longitude === 'string'
      ? Number(signalement.longitude)
      : signalement.longitude;
    const surface = typeof signalement.surface === 'string'
      ? Number(signalement.surface)
      : signalement.surface;
    const budget = typeof signalement.budget === 'string'
      ? Number(signalement.budget)
      : signalement.budget;
    return {
      ...signalement,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      surface,
      budget,
      createdAt: signalement.createdAt || signalement.created_at,
      dateEnCours: signalement.dateEnCours || signalement.date_en_cours,
      dateTermine: signalement.dateTermine || signalement.date_termine,
      userEmail: signalement.userEmail || signalement.user_email
    } as Signalement;
  }

  /**
   * Crée un signalement en offline-first:
   * 1. D'abord sauvegarde dans Firebase Realtime DB (offline support)
   * 2. Ensuite envoie au backend (PostgreSQL)
   * 3. Sync firebase ↔ postgresql se fait manuellement via /sync
   */
  async create(signalement: Omit<Signalement, 'id'>, uploadPhotosAsync = true) {
    try {
      const userEmail = authService.getUserEmail();
      
      // 1. Créer d'abord dans Firebase Realtime DB (offline-first)
      const db = database;
      const newSignalementRef = push(ref(db, `signalements`));
      const firebaseId = newSignalementRef.key;

      const firebaseData = {
        latitude: signalement.latitude,
        longitude: signalement.longitude,
        description: signalement.description || '',
        surface: signalement.surface || 0,
        budget: signalement.budget || 0,
        entreprise: signalement.entreprise || null,
        user_email: userEmail,
        status: 'nouveau',
        photos: signalement.photos || [],
        created_at: new Date().toISOString(),
        synced: false // Pas encore synchronisé avec PostgreSQL
      };

      await set(newSignalementRef, firebaseData);
      console.log('Signalement créé dans Firebase Realtime DB:', firebaseId);

      // Ajouter aussi dans user_signalements pour accès rapide
      if (userEmail) {
        const encodedEmail = this.encodeEmail(userEmail);
        await set(ref(db, `user_signalements/${encodedEmail}/${firebaseId}`), firebaseData);
      }

      // NOTE: Photos stockées en base64 directement dans Realtime Database
      // Pour utiliser Firebase Storage (upload photos comme fichiers):
      // 1. Activer Storage dans Firebase Console (gratuit jusqu'à 5GB)
      // 2. Décommenter le code ci-dessous
      /*
      if (signalement.photos && signalement.photos.length > 0 && firebaseId) {
        const uploadTask = this.uploadPhotosInFirebase(firebaseId, signalement.photos, firebaseData);
        if (!uploadPhotosAsync) {
          await uploadTask;
        }
      }
      */

      return {
        success: true,
        id: firebaseId,
        data: firebaseData,
        message: 'Signalement créé localement. Utilisez le bouton "Synchroniser" dans la web pour synchroniser avec PostgreSQL.'
      };
    } catch (error: any) {
      console.error('Erreur création signalement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création'
      };
    }
  }

  /**
   * Uploader les photos dans Firebase Storage
   */
  private async uploadPhotosInFirebase(signalementId: string, photos: string[], firebaseData: any) {
    try {
      const photoUrls = await Promise.all(
        photos.map(async (photoDataUrl) => {
          const blob = await this.dataUrlToBlob(photoDataUrl);
          return this.uploadPhoto(blob, signalementId);
        })
      );

      if (photoUrls.length > 0) {
        // Mettre à jour les photos dans Firebase
        const db = database;
        await set(ref(db, `signalements/${signalementId}/photos`), photoUrls);

        const userEmail = authService.getUserEmail();
        if (userEmail) {
          const encodedEmail = this.encodeEmail(userEmail);
          await set(ref(db, `user_signalements/${encodedEmail}/${signalementId}/photos`), photoUrls);
        }
      }
    } catch (error) {
      console.error('Erreur upload photos Firebase:', error);
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  }

  async uploadPhoto(file: Blob, signalementId: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `signalements/${signalementId}/${timestamp}.jpg`;
    const fileRef = storageRef(storage, fileName);

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  }

  /**
   * Récupère tous les signalements depuis Firebase Realtime DB
   * (Mode offline-first: lit depuis Firebase, pas depuis PostgreSQL)
   */
  async getAll(): Promise<Signalement[]> {
    try {
      console.log('🔍 [getAll] Récupération depuis Firebase Realtime DB...');
      const db = database;
      const signalementsRef = ref(db, 'signalements');
      const snapshot = await get(signalementsRef);
      
      if (!snapshot.exists()) {
        console.log('⚠️ [getAll] Aucun signalement trouvé dans Firebase');
        return [];
      }

      const data = snapshot.val();
      console.log('✅ [getAll] Données Firebase récupérées:', data);
      console.log('📊 [getAll] Nombre de signalements:', Object.keys(data).length);
      
      const signalements: Signalement[] = [];

      // Convertir l'objet Firebase en tableau
      Object.keys(data).forEach(key => {
        const signalement = data[key];
        console.log(`📍 [getAll] Traitement signalement ${key}:`, signalement);
        
        signalements.push({
          id: key,
          latitude: Number(signalement.latitude) || 0,
          longitude: Number(signalement.longitude) || 0,
          status: signalement.status || 'nouveau',
          surface: Number(signalement.surface) || 0,
          budget: Number(signalement.budget) || 0,
          entreprise: signalement.entreprise || null,
          description: signalement.description || '',
          photos: signalement.photos || [],
          createdAt: signalement.created_at,
          userEmail: signalement.user_email,
          synced: signalement.synced || false
        });
      });

      console.log('✅ [getAll] Signalements transformés:', signalements);
      console.log(`✅ [getAll] Total: ${signalements.length} signalements`);
      
      return signalements;
    } catch (error) {
      console.error('❌ [getAll] Error fetching signalements from Firebase:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Signalement | null> {
    try {
      const response = await apiService.get(API_ENDPOINTS.SIGNALEMENT_BY_ID(id));
      return this.normalize(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching signalement:', error);
      return null;
    }
  }

  async getMySignalements(): Promise<Signalement[]> {
    try {
      // Récupère tous les signalements et filtre par email utilisateur
      const allSignalements = await this.getAll();
      const userEmail = authService.getUserEmail();

      // Filtre les signalements créés par l'utilisateur
      // (TODO: implémenter un filtre côté serveur)
      if (!userEmail) return allSignalements;
      const hasUserEmailField = allSignalements.some((s) => !!s.userEmail);
      if (!hasUserEmailField) return allSignalements;
      return allSignalements.filter((s) => s.userEmail === userEmail);
    } catch (error) {
      console.error('Error fetching my signalements:', error);
      return [];
    }
  }

  listenToMySignalements(callback: (signalements: Signalement[]) => void) {
    // Polling toutes les 5 secondes (alternative au Realtime DB)
    const interval = setInterval(async () => {
      const signalements = await this.getMySignalements();
      callback(signalements);
    }, 5000);

    // Retourner une fonction pour arrêter le polling
    return () => clearInterval(interval);
  }

  /**
   * Met à jour le statut du signalement dans Firebase et PostgreSQL
   */
  async updateStatus(
    id: string,
    status: 'nouveau' | 'en_cours' | 'termine',
    date?: string
  ): Promise<boolean> {
    try {
      const timestamp = date || new Date().toISOString();
      
      // 1. Mettre à jour dans Firebase Realtime DB
      const db = database;
      const updateData: any = { status };
      
      if (status === 'en_cours') {
        updateData.date_en_cours = timestamp;
      } else if (status === 'termine') {
        updateData.date_termine = timestamp;
      }
      
      // Mettre à jour dans les deux emplacements Firebase
      await update(ref(db, `signalements/${id}`), updateData);
      
      const userEmail = authService.getUserEmail();
      if (userEmail) {
        const encodedEmail = this.encodeEmail(userEmail);
        await update(ref(db, `user_signalements/${encodedEmail}/${id}`), updateData);
      }

      return true;
    } catch (error) {
      console.error('Erreur updating signalement status:', error);
      return false;
    }
  }

  /**
   * Met à jour un signalement dans Firebase et PostgreSQL
   */
  async update(
    id: string,
    signalement: Partial<Signalement>
  ): Promise<boolean> {
    try {
      // 1. Mettre à jour dans Firebase
      const db = database;
      await update(ref(db, `signalements/${id}`), signalement);
      
      const userEmail = authService.getUserEmail();
      if (userEmail) {
        const encodedEmail = this.encodeEmail(userEmail);
        await update(ref(db, `user_signalements/${encodedEmail}/${id}`), signalement);
      }

      return true;
    } catch (error) {
      console.error('Erreur updating signalement:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiService.delete(API_ENDPOINTS.SIGNALEMENT_BY_ID(id));
      return true;
    } catch (error) {
      console.error('Error deleting signalement:', error);
      return false;
    }
  }
}

export default new SignalementService();
