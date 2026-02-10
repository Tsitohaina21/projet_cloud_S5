import apiClient from './authService';
import { mockSignalements } from '../data/mockData';

// Helper function to transform database data to app format
const transformSignalement = (dbSignalement) => {
  console.log('🔍 RAW signalement from API:', dbSignalement);
  console.log('🔍 Available properties:', Object.keys(dbSignalement));
  
  // Handle both lowercase and uppercase property names from API
  const latProp = dbSignalement.latitude !== undefined ? 'latitude' : 'Latitude';
  const lonProp = dbSignalement.longitude !== undefined ? 'longitude' : 'Longitude';
  
  console.log('🔍 Using properties: ' + latProp + ', ' + lonProp);
  console.log('🔍 Raw values: ' + latProp + '=' + dbSignalement[latProp] + ', ' + lonProp + '=' + dbSignalement[lonProp]);
  
  // Ensure coordinates are valid numbers
  let latitude = dbSignalement[latProp] !== null && dbSignalement[latProp] !== undefined 
    ? parseFloat(dbSignalement[latProp])
    : null;
  let longitude = dbSignalement[lonProp] !== null && dbSignalement[lonProp] !== undefined 
    ? parseFloat(dbSignalement[lonProp])
    : null;
  
  console.log('🔍 After parseFloat:', {lat: latitude, lon: longitude});
  
  // FIX: Ensure latitude is negative for Madagascar (Southern hemisphere)
  if (latitude !== null && !isNaN(latitude) && latitude > 0) {
    latitude = -latitude;
    console.warn('⚠️ Converting positive latitude to negative for signalement #' + dbSignalement.id);
  }
  
  const transformed = {
    id: dbSignalement.id,
    title: `Chantier ${dbSignalement.entreprise || 'N/A'}`,
    createdDate: dbSignalement.created_at,
    surface: parseFloat(dbSignalement.surface) || 0,
    niveau: parseInt(dbSignalement.niveau) || 1,
    niveauModifie: dbSignalement.niveau_modifie === true || dbSignalement.niveau_modifie === 't' || dbSignalement.niveau_modifie === 'true',
    budget: parseFloat(dbSignalement.budget) || 0,
    status: dbSignalement.status || 'nouveau',
    company: dbSignalement.entreprise || 'N/A',
    latitude: !isNaN(latitude) ? latitude : null,
    longitude: !isNaN(longitude) ? longitude : null,
    description: dbSignalement.description || `Chantier de ${dbSignalement.entreprise || 'N/A'}`,
    photos: Array.isArray(dbSignalement.photos) ? dbSignalement.photos : [],
    photo: dbSignalement.photo || null,
  };
  
  console.log('✅ Transformed signalement #' + transformed.id + ':', {
    latitude: transformed.latitude,
    longitude: transformed.longitude,
    isValid: transformed.latitude !== null && transformed.longitude !== null
  });
  
  return transformed;
};

export const signalementService = {
  // Get all signalements from API
  getAllSignalements: async () => {
    try {
      console.log('📡 [getAllSignalements] Fetching from API...');
      const response = await apiClient.get('/signalements');
      console.log('✅ [getAllSignalements] Response:', response);
      const data = response.data.data || [];
      console.log('✅ [getAllSignalements] Data:', data);
      return Array.isArray(data) ? data.map(transformSignalement) : [];
    } catch (error) {
      console.error('❌ [getAllSignalements] Error:', error);
      console.warn('⚠️ [getAllSignalements] Using mock data as fallback');
      return mockSignalements;
    }
  },

  // Get signalements for current user (mobile)
  getMySignalements: async () => {
    try {
      const response = await apiClient.get('/signalements/my');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.map(transformSignalement) : [];
    } catch (error) {
      console.error('Failed to fetch user signalements:', error);
      return [];
    }
  },

  // Create new signalement (mobile)
  createSignalement: async (data) => {
    try {
      const response = await apiClient.post('/signalements', data);
      return response.data.data ? transformSignalement(response.data.data) : null;
    } catch (error) {
      console.error('Failed to create signalement:', error);
      return null;
    }
  },

  // Update signalement status
  updateSignalement: async (id, data) => {
    try {
      const response = await apiClient.put(`/signalements/${id}`, data);
      return response.data.data ? transformSignalement(response.data.data) : null;
    } catch (error) {
      console.error('Failed to update signalement:', error);
      return null;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/signalements/statistics');
      return response.data.data || null;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      return null;
    }
  },

  // Get signalements with stats - MAIN METHOD FOR DASHBOARD
  getSignalementsWithStats: async () => {
    try {
      console.log('📡 Fetching signalements from API...');
      const response = await apiClient.get('/signalements');
      
      const data = response.data.data || [];
      console.log('📊 Raw data from API:', data);
      
      const signalements = Array.isArray(data) ? data.map(transformSignalement) : [];
      
      console.log('✅ Transformed signalements:', signalements);
      console.log('✅ Loaded signalements:', signalements.length);

      // Calculate stats
      const totalCount = signalements.length;
      const totalSurface = signalements.reduce((sum, s) => sum + (s.surface || 0), 0);
      const totalBudget = signalements.reduce((sum, s) => sum + (s.budget || 0), 0);

      // Calculate progress percentage
      const statusWeights = {
        nouveau: 0,
        en_cours: 50,
        termine: 100,
      };

      const progressPercentage =
        totalCount > 0
          ? Math.round(
              signalements.reduce((sum, s) => {
                return sum + (statusWeights[s.status] || 0);
              }, 0) / totalCount
            )
          : 0;

      return {
        totalCount,
        totalSurface,
        totalBudget,
        progressPercentage,
        signalements,
      };
    } catch (error) {
      console.error('❌ Failed to fetch signalements from API:', error);
      console.warn('⚠️ Using mock data as fallback');
      
      // Return mock data as fallback
      const totalCount = mockSignalements.length;
      const totalSurface = mockSignalements.reduce((sum, s) => sum + s.surface, 0);
      const totalBudget = mockSignalements.reduce((sum, s) => sum + s.budget, 0);
      const statusWeights = { nouveau: 0, en_cours: 50, termine: 100 };
      const progressPercentage = Math.round(
        mockSignalements.reduce((sum, s) => sum + (statusWeights[s.status] || 0), 0) / totalCount
      );
      
      return {
        totalCount,
        totalSurface,
        totalBudget,
        progressPercentage,
        signalements: mockSignalements,
      };
    }
  },

  // Sync signalements
  syncSignalements: async () => {
    try {
      const response = await apiClient.post('/sync', {});
      return response.data || null;
    } catch (error) {
      console.error('Failed to sync signalements:', error);
      return null;
    }
  },

  // Upload photos
  uploadPhotos: async (signalementId, files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await apiClient.post(`/signalements/${signalementId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to upload photos:', error);
      return [];
    }
  },

  // Get settings (prix_par_m2, etc.)
  getSettings: async () => {
    try {
      const response = await apiClient.get('/settings');
      return response.data.data || {};
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return {};
    }
  },

  // Update a setting
  updateSetting: async (key, value) => {
    try {
      const response = await apiClient.put(`/settings/${key}`, { value: String(value) });
      return response.data.success || false;
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  },
};

export default signalementService;
