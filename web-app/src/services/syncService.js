import apiClient from './authService';

export const syncService = {
  /**
   * Synchronise les données entre PostgreSQL et Firebase
   * 1. Importe les signalements Firebase → PostgreSQL
   * 2. Exporte les signalements PostgreSQL → Firebase
   * 3. Synchronise les comptes utilisateurs créés
   */
  syncWithFirebase: async () => {
    try {
      console.log('🔄 [syncService] Starting synchronization...');
      
      const response = await apiClient.post('/sync/firebase', {});
      
      console.log('✅ [syncService] Sync response:', response);
      
      if (response.data.success) {
        const results = response.data.data;
        console.log('✅ [syncService] Sync completed:');
        console.log(`   - Imported: ${results.imported}`);
        console.log(`   - Updated: ${results.updated}`);
        console.log(`   - Exported: ${results.exported}`);
        console.log(`   - Accounts synced: ${results.accounts_synced}`);
        console.log(`   - Failures: ${results.failed}`);
        
        return {
          success: true,
          imported: results.imported || 0,
          updated: results.updated || 0,
          exported: results.exported || 0,
          accountsSynced: results.accounts_synced || 0,
          failed: results.failed || 0,
          message: results.message || 'Synchronisation réussie',
        };
      }
      
      return {
        success: false,
        error: response.data.error || 'Synchronization failed',
      };
    } catch (error) {
      console.error('❌ [syncService] Sync error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Synchronization error',
      };
    }
  },

  /**
   * Format a sync result for display
   */
  formatSyncResult: (result) => {
    if (!result.success) {
      return {
        type: 'error',
        title: '❌ Synchronisation échouée',
        message: result.error || 'Une erreur est survenue',
      };
    }

    const total = result.imported + result.updated + result.exported + result.accountsSynced;
    
    if (total === 0) {
      return {
        type: 'info',
        title: '✅ Synchronisation terminée',
        message: 'Aucune nouvelle donnée à synchroniser',
      };
    }

    const details = [];
    if (result.imported > 0) {
      details.push(`📥 ${result.imported} signalement(s) importé(s)`);
    }
    if (result.updated > 0) {
      details.push(`🔄 ${result.updated} signalement(s) mis à jour`);
    }
    if (result.exported > 0) {
      details.push(`📤 ${result.exported} signalement(s) exporté(s)`);
    }
    if (result.accountsSynced > 0) {
      details.push(`👤 ${result.accountsSynced} compte(s) utilisateur synchronisé(s)`);
    }
    if (result.failed > 0) {
      details.push(`⚠️ ${result.failed} erreur(s)`);
    }

    return {
      type: 'success',
      title: '✅ Synchronisation réussie',
      message: details.join(' • '),
      details: result,
    };
  },
};

export default syncService;
