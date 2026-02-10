import React, { useState } from 'react';
import signalementService from '../services/signalementService';

const SignalementList = ({
  signalements,
  isManager = false,
  onUpdate,
  prixParM2 = 5000,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleStatusChange = async (signalementId, newStatus) => {
    setUpdatingId(signalementId);
    const success = await signalementService.updateSignalement(signalementId, {
      status: newStatus,
    });
    setUpdatingId(null);
    if (success && onUpdate) {
      onUpdate();
    }
  };

  const startEditing = (signalement) => {
    setEditingId(signalement.id);
    setEditData({
      surface: signalement.surface,
      niveau: signalement.niveau || 1,
      company: signalement.company,
      description: signalement.description,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => {
      const updated = {
        ...prev,
        [field]: field === 'surface' ? parseFloat(value) || 0 
               : field === 'niveau' ? parseInt(value) || 1
               : value,
      };
      return updated;
    });
  };

  // Auto-calculate budget: prix_par_m2 * niveau * surface
  const calculateBudget = (surface, niveau) => {
    return prixParM2 * (niveau || 1) * (surface || 0);
  };

  const handleSaveEdit = async (signalementId) => {
    setUpdatingId(signalementId);
    const computedBudget = calculateBudget(editData.surface, editData.niveau);
    const success = await signalementService.updateSignalement(signalementId, {
      budget: computedBudget,
      surface: editData.surface,
      niveau: editData.niveau,
      entreprise: editData.company,
      description: editData.description,
    });
    setUpdatingId(null);
    if (success) {
      setEditingId(null);
      setEditData({});
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nouveau':
        return 'bg-danger';
      case 'en_cours':
        return 'bg-warning text-dark';
      case 'termine':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case 'nouveau':
        return 0;
      case 'en_cours':
        return 50;
      case 'termine':
        return 100;
      default:
        return 0;
    }
  };

  if (!signalements || signalements.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        Aucun signalement trouvé
      </div>
    );
  }

  return (
    <div className="d-grid gap-3">
      {signalements.map((signalement) => (
        <div key={signalement.id} className="card">
          <div
            className="card-header d-flex justify-content-between align-items-center cursor-pointer"
            onClick={() =>
              setExpandedId(expandedId === signalement.id ? null : signalement.id)
            }
          >
            <div>
              <h3 className="h6 mb-1">{signalement.title}</h3>
              <div className="text-muted small">
                {new Date(signalement.createdDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <span className={`badge ${getStatusColor(signalement.status)}`}>
              {signalement.status.replace('_', ' ')}
            </span>
          </div>

          {expandedId === signalement.id && (
            <div className="card-body">
              {editingId === signalement.id ? (
                // Mode édition
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Surface (m²)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editData.surface || ''}
                      onChange={(e) => handleEditChange('surface', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">
                      Niveau de réparation : <strong>{editData.niveau || 1}</strong> / 10
                      {signalement.niveauModifie && (
                        <span className="badge bg-secondary ms-2">Verrouillé</span>
                      )}
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      min="1"
                      max="10"
                      step="1"
                      value={editData.niveau || 1}
                      onChange={(e) => handleEditChange('niveau', e.target.value)}
                      disabled={signalement.niveauModifie}
                    />
                    {signalement.niveauModifie ? (
                      <div className="text-warning" style={{ fontSize: '0.75rem' }}>
                        Le niveau a déjà été défini et ne peut plus être modifié.
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem' }}>
                        <span>1 (léger)</span>
                        <span>5 (moyen)</span>
                        <span>10 (critique)</span>
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <div className="alert alert-info py-2 mb-0">
                      <strong>Budget calculé automatiquement :</strong>{' '}
                      {calculateBudget(editData.surface, editData.niveau).toLocaleString()} Ar
                      <br />
                      <small className="text-muted">
                        Formule : {prixParM2.toLocaleString()} Ar/m² × niveau {editData.niveau || 1} × {editData.surface || 0} m²
                      </small>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Entreprise</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.company || ''}
                      onChange={(e) => handleEditChange('company', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editData.description || ''}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                    />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(signalement.id)}
                      disabled={updatingId === signalement.id}
                      className="btn btn-success flex-fill"
                    >
                      {updatingId === signalement.id ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updatingId === signalement.id}
                      className="btn btn-secondary flex-fill"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                // Mode affichage
                <>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <div className="text-muted small">Surface</div>
                      <div className="fw-semibold">{signalement.surface} m²</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Niveau</div>
                      <div className="fw-semibold">{signalement.niveau || 1} / 10</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Budget</div>
                      <div className="fw-semibold">{(signalement.budget || 0).toLocaleString()} Ar</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted small">Entreprise</div>
                      <div className="fw-semibold">{signalement.company}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted small mb-1">Description</div>
                    <div>{signalement.description}</div>
                  </div>

                  {signalement.photos && signalement.photos.length > 0 && (
                    <div className="mb-3">
                      <div className="text-muted small mb-2">Photos</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {signalement.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className="rounded"
                            style={{ width: 80, height: 80, objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="text-muted small mb-2">Progression</div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${getStatusProgress(signalement.status)}%` }}
                      />
                    </div>
                  </div>

                  {isManager && (
                    <>
                      <div className="d-flex gap-2 mb-3">
                        {['nouveau', 'en_cours', 'termine'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(signalement.id, status)}
                            disabled={updatingId === signalement.id}
                            className={`btn btn-sm flex-fill ${
                              signalement.status === status
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => startEditing(signalement)}
                        className="btn btn-warning w-100"
                      >
                        ✏️ Modifier les données
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SignalementList;
