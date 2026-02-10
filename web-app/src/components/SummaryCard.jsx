import React from 'react';

const SummaryCard = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="placeholder-glow">
            <div className="placeholder col-12 mb-2"></div>
            <div className="placeholder col-10 mb-2"></div>
            <div className="placeholder col-9 mb-2"></div>
            <div className="placeholder col-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted">Aucune donnée disponible</div>;
  }

  return (
    <div className="card h-auto">
      <div className="card-body">
        <h6 className="card-title">Récapitulatif</h6>
        
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
            <span className="detail-label">Signalements</span>
            <span className="badge bg-primary">{stats.totalCount}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
            <span className="detail-label">Surface totale</span>
            <span className="fw-semibold">{(stats.totalSurface / 1000).toFixed(1)} km²</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
            <span className="detail-label">Budget total</span>
            <span className="fw-semibold">{(stats.totalBudget / 1000000).toFixed(1)}M Ar</span>
          </li>
        </ul>

        <div className="progress-container">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="detail-label">Avancement</span>
            <span className="fw-bold text-success">{stats.progressPercentage}%</span>
          </div>
          <div className="progress">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: `${stats.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
