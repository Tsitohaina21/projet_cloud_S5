import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import signalementService from '../services/signalementService';

const StatisticsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/');
    } else {
      loadStatistics();
    }
  }, [user, navigate]);

  const loadStatistics = async () => {
    setIsLoading(true);
    const data = await signalementService.getSignalementsWithStats();
    setStats(data);

    // Calculate processing time statistics
    if (data?.signalements) {
      const statusGroups = {
        nouveau: [],
        en_cours: [],
        termine: [],
      };

      data.signalements.forEach((sig) => {
        if (sig.status === 'termine' && sig.completedDate) {
          const created = new Date(sig.createdDate).getTime();
          const completed = new Date(sig.completedDate).getTime();
          const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
          statusGroups[sig.status].push(days);
        } else {
          const status = sig.status;
          statusGroups[status].push(0);
        }
      });

      const averageTimes = Object.entries(statusGroups).map(([status, times]) => ({
        status,
        averageDays: times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0,
        count: times.length,
      }));

      setStatistics({
        averageProcessingTimes: averageTimes,
        totalSignalements: data.signalements.length,
        totalCompleted: data.signalements.filter((s) => s.status === 'termine').length,
      });
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="page-shell">
      <div className="container py-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Statistiques des travaux</h1>
            <p className="page-subtitle">Analyse des délais et tendances des signalements</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="stat-card p-4">
              <div className="stat-label">Total signalements</div>
              <div className="stat-value text-primary mt-2">
              {statistics?.totalSignalements || 0}
            </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="stat-card p-4">
              <div className="stat-label">Travaux terminés</div>
              <div className="stat-value text-success mt-2">
              {statistics?.totalCompleted || 0}
            </div>
            {statistics && statistics.totalSignalements > 0 && (
              <div className="text-muted mt-2">
                {Math.round((statistics.totalCompleted / statistics.totalSignalements) * 100)}% terminés
              </div>
            )}
            </div>
          </div>

          <div className="col-md-4">
            <div className="stat-card p-4">
              <div className="stat-label">Taux d’achèvement</div>
              <div className="stat-value text-primary mt-2">
              {statistics && statistics.totalSignalements > 0
                ? Math.round((statistics.totalCompleted / statistics.totalSignalements) * 100)
                : 0}
              %
            </div>
            </div>
          </div>
        </div>

        <div className="card panel-card mb-4">
          <div className="card-body">
            <h2 className="card-title">Temps moyen de traitement</h2>

            {statistics?.averageProcessingTimes && statistics.averageProcessingTimes.length > 0 ? (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Statut</th>
                      <th>Jours moyens</th>
                      <th>Nombre</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.averageProcessingTimes.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-capitalize">{item.status.replace('_', ' ')}</td>
                        <td className="fw-semibold">{item.averageDays} jours</td>
                        <td>{item.count} éléments</td>
                        <td>
                          <div className="progress" style={{ maxWidth: 160 }}>
                            <div
                              className={`progress-bar ${
                                item.status === 'termine'
                                  ? 'bg-success'
                                  : item.status === 'en_cours'
                                    ? 'bg-warning'
                                    : 'bg-danger'
                              }`}
                              style={{
                                width: `${Math.min(
                                  ((item.status === 'termine' ? 100 : item.status === 'en_cours' ? 50 : 0) / 100) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* Signalements by Status */}
        {stats && (
          <div className="card panel-card">
            <div className="card-body">
              <h2 className="card-title">Signalements par statut</h2>

              <div className="row g-3">
                {['nouveau', 'en_cours', 'termine'].map((status) => {
                const count = stats.signalements.filter((s) => s.status === status).length;
                const percentage =
                  stats.signalements.length > 0
                    ? Math.round((count / stats.signalements.length) * 100)
                    : 0;

                const colors = {
                  nouveau: 'border-danger text-danger',
                  en_cours: 'border-warning text-warning',
                  termine: 'border-success text-success',
                };

                return (
                  <div
                    key={status}
                    className="col-md-4"
                  >
                    <div className={`card h-100 ${colors[status]}`}>
                      <div className="card-body">
                        <div className="text-capitalize fw-semibold">{status.replace('_', ' ')}</div>
                        <div className="stat-value mt-2">{count}</div>
                        <div className="text-muted">{percentage}% du total</div>
                        <div className="progress mt-3">
                          <div
                            className={`progress-bar ${
                              status === 'nouveau'
                                ? 'bg-danger'
                                : status === 'en_cours'
                                  ? 'bg-warning'
                                  : 'bg-success'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
