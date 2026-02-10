import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import syncService from '../services/syncService';

const SyncPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);

  React.useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    console.log('🔄 Starting synchronization...');
    const startTime = new Date();
    
    const result = await syncService.syncWithFirebase();
    const formatted = syncService.formatSyncResult(result);
    
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    setSyncResult({ ...formatted, duration });
    setIsSyncing(false);
    
    // Add to history
    const historyEntry = {
      timestamp: endTime,
      ...formatted,
      duration,
    };
    setSyncHistory([historyEntry, ...syncHistory.slice(0, 9)]); // Keep last 10
  };

  return (
    <div className="page-shell">
      <div className="container py-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔄 Synchronisation Firebase</h1>
            <p className="page-subtitle">
              Synchronisez les données entre PostgreSQL et Firebase
            </p>
          </div>
        </div>

        {/* Sync Actions Card */}
        <div className="card panel-card mb-4">
          <div className="card-body">
            <h2 className="card-title mb-3">Actions de synchronisation</h2>
            
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <h6 className="text-muted small mb-2">📥 IMPORT</h6>
                    <p className="mb-0 small">
                      Récupère les signalements depuis Firebase vers PostgreSQL
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <h6 className="text-muted small mb-2">📤 EXPORT</h6>
                    <p className="mb-0 small">
                      Envoie les signalements modifiés vers Firebase
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-light border-0 h-100">
                  <div className="card-body">
                    <h6 className="text-muted small mb-2">👤 COMPTES</h6>
                    <p className="mb-0 small">
                      Synchronise les comptes mobiles créés
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn btn-primary btn-lg w-100 fw-semibold"
            >
              {isSyncing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  Lancer la synchronisation
                </>
              )}
            </button>

          </div>
        </div>

        {/* Current Sync Result */}
        {syncResult && (
          <div className="card panel-card mb-4">
            <div className="card-body">
              <div className={`alert ${
                syncResult.type === 'success' ? 'alert-success' : 
                syncResult.type === 'error' ? 'alert-danger' : 
                'alert-info'
              } mb-0`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="alert-heading mb-2">{syncResult.title}</h5>
                    <p className="mb-2">{syncResult.message}</p>
                    {syncResult.details && (
                      <div className="mt-3">
                        <div className="row g-3">
                          <div className="col-6 col-md-3">
                            <div className="small text-muted">Importés</div>
                            <div className="h5 mb-0">{syncResult.details.imported || 0}</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="small text-muted">Mis à jour</div>
                            <div className="h5 mb-0">{syncResult.details.updated || 0}</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="small text-muted">Exportés</div>
                            <div className="h5 mb-0">{syncResult.details.exported || 0}</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="small text-muted">Comptes</div>
                            <div className="h5 mb-0">{syncResult.details.accountsSynced || 0}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-muted small">
                    {syncResult.duration}s
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="card panel-card">
            <div className="card-body">
              <h2 className="card-title mb-3">Historique des synchronisations</h2>
              
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date et Heure</th>
                      <th>Résultat</th>
                      <th>Importés</th>
                      <th>Exportés</th>
                      <th>Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.map((entry, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(entry.timestamp).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${
                            entry.type === 'success' ? 'bg-success' : 
                            entry.type === 'error' ? 'bg-danger' : 
                            'bg-info'
                          }`}>
                            {entry.type === 'success' ? '✅ Réussi' : 
                             entry.type === 'error' ? '❌ Erreur' : 
                             'ℹ️ Info'}
                          </span>
                        </td>
                        <td>
                          {entry.details ? 
                            `${entry.details.imported || 0} + ${entry.details.updated || 0}` : 
                            '-'}
                        </td>
                        <td>
                          {entry.details?.exported || '-'}
                        </td>
                        <td className="text-muted">
                          {entry.duration}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="card panel-card mt-4">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">📖 À propos de la synchronisation</h6>
            <ul className="mb-0 small text-muted">
              <li className="mb-2">
                <strong>Import Firebase → PostgreSQL</strong> : Récupère les nouveaux signalements créés sur mobile
              </li>
              <li className="mb-2">
                <strong>Export PostgreSQL → Firebase</strong> : Envoie les modifications effectuées sur le web
              </li>
              <li className="mb-2">
                <strong>Anti-doublons</strong> : Utilise les identifiants Firebase pour éviter les duplications
              </li>
              <li>
                <strong>Comptes mobiles</strong> : Synchronise les utilisateurs créés pour l'accès mobile
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPage;
