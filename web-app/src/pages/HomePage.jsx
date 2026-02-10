import React, { useEffect, useState } from 'react';
import MapComponent from '../components/Map';
import SummaryCard from '../components/SummaryCard';
import signalementService from '../services/signalementService';

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const statsData = await signalementService.getSignalementsWithStats();
      console.log('🏠 HomePage received statsData:', statsData);
      setStats(statsData);
      if (statsData?.signalements && statsData.signalements.length > 0) {
        setSelectedSignalement(statsData.signalements[0]);
      }
      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nouveau': return 'bg-danger';
      case 'en_cours': return 'bg-warning text-dark';
      case 'termine': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-light">
      <div className="container-fluid py-3 app-shell">
        <div className="row g-3 h-100">
          {/* Carte à gauche */}
          <div className="col-lg-8 h-100">
            <div className="card map-card">
              {console.log('🏠 Passing signalements to Map:', stats?.signalements)}
              <MapComponent
                signalements={stats?.signalements || []}
                onSignalementSelect={setSelectedSignalement}
                onPhotoClick={setLightboxPhoto}
                className="map-container"
              />
            </div>
          </div>

          {/* Panneau de droite */}
          <div className="col-lg-4 h-100">
            <div className="h-100 d-flex flex-column gap-3 overflow-auto pe-2">
              {/* Récapitulatif */}
              <SummaryCard stats={stats} isLoading={isLoading} />

              {/* Légende */}
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Légende</h6>
                  <div className="legend-item">
                    <span className="legend-dot bg-danger"></span>
                    <span className="legend-text"><strong>Nouveau</strong> — Non commencés</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot bg-warning"></span>
                    <span className="legend-text"><strong>En cours</strong> — Travaux actifs</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot bg-success"></span>
                    <span className="legend-text"><strong>Terminé</strong> — Travaux finis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '36px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
          <img
            src={lightboxPhoto}
            alt="Photo agrandie"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="footer-bar text-white py-2 text-center small">
        © 2026 - Travaux Routiers Antananarivo - Projet Cloud S5
      </footer>
    </div>
  );
};

export default HomePage;
