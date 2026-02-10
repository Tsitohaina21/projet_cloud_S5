import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import signalementService from '../services/signalementService';
import SignalementList from '../components/SignalementList';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prixParM2, setPrixParM2] = useState(5000);
  const [editingPrix, setEditingPrix] = useState(false);
  const [newPrix, setNewPrix] = useState('');
  const [savingPrix, setSavingPrix] = useState(false);

  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/');
    } else {
      loadData();
    }
  }, [user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    console.log('📋 [DashboardPage] Loading signalements & settings...');
    const [data, settings] = await Promise.all([
      signalementService.getAllSignalements(),
      signalementService.getSettings(),
    ]);
    console.log('📋 [DashboardPage] Loaded data:', data);
    console.log('⚙️ [DashboardPage] Settings:', settings);
    setSignalements(data || []);
    if (settings.prix_par_m2) {
      setPrixParM2(parseFloat(settings.prix_par_m2.value) || 5000);
    }
    setIsLoading(false);
  };

  const handleSavePrix = async () => {
    const val = parseFloat(newPrix);
    if (isNaN(val) || val <= 0) {
      alert('Veuillez entrer un prix valide');
      return;
    }
    setSavingPrix(true);
    const success = await signalementService.updateSetting('prix_par_m2', val);
    setSavingPrix(false);
    if (success) {
      setPrixParM2(val);
      setEditingPrix(false);
      setNewPrix('');
    } else {
      alert('Échec de la mise à jour du prix');
    }
  };

  return (
    <div className="page-shell">
      <div className="container py-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestion des signalements</h1>
            <p className="page-subtitle">Modifiez et supervisez les travaux en cours</p>
          </div>
        </div>

        {/* Settings Card - Prix par m² */}
        <div className="card panel-card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1">⚙️ Paramètres de calcul</h5>
                <p className="text-muted small mb-0">
                  Budget = <strong>prix/m²</strong> × <strong>niveau</strong> × <strong>surface</strong>
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                {editingPrix ? (
                  <>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: '140px' }}
                      value={newPrix}
                      onChange={(e) => setNewPrix(e.target.value)}
                      placeholder="Ex: 5000"
                      min="1"
                    />
                    <span className="text-muted small">Ar/m²</span>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSavePrix}
                      disabled={savingPrix}
                    >
                      {savingPrix ? '...' : '✓'}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => { setEditingPrix(false); setNewPrix(''); }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="badge bg-primary fs-6">{prixParM2.toLocaleString()} Ar/m²</span>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => { setEditingPrix(true); setNewPrix(String(prixParM2)); }}
                    >
                      ✏️ Modifier
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card panel-card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center text-muted py-4">Chargement...</div>
            ) : (
              <SignalementList
                signalements={signalements}
                isManager={true}
                onUpdate={loadData}
                prixParM2={prixParM2}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
