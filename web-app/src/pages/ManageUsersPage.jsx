import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import userService from '../services/userService';

const ManageUsersPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/');
    } else {
      loadUsers();
    }
  }, [user, navigate]);

  const loadUsers = async () => {
    setIsLoading(true);
    console.log('👥 [ManageUsersPage] Loading users...');
    const [allUsers, blockedData] = await Promise.all([
      userService.getAllUsers(),
      userService.getBlockedUsers(),
    ]);
    console.log('✅ [ManageUsersPage] All users:', allUsers);
    console.log('✅ [ManageUsersPage] Blocked users:', blockedData);
    setUsers(allUsers);
    setBlockedUsers(blockedData);
    setIsLoading(false);
  };

  const handleUnlock = async (email) => {
    setUnblockingId(email);
    const success = await userService.unlockUser(email);
    setUnblockingId(null);
    if (success) {
      await loadUsers();
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const newUser = await userService.createUser(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName
    );

    if (newUser) {
      alert('Utilisateur créé avec succès.');
      setFormData({ email: '', password: '', firstName: '', lastName: '' });
      setShowCreateForm(false);
      await loadUsers();
    } else {
      alert("Échec de la création de l'utilisateur");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="page-shell">
      <div className="container py-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestion des utilisateurs</h1>
            <p className="page-subtitle">Gérez les comptes et débloquez les utilisateurs</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary fw-semibold"
          >
            {showCreateForm ? '✕ Annuler' : '+ Créer un utilisateur'}
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="card panel-card mb-4">
            <div className="card-body">
              <h2 className="card-title">Créer un nouvel utilisateur</h2>
              <form onSubmit={handleCreateUser} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="form-control"
                    placeholder="Jean"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="form-control"
                    placeholder="Dupont"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="form-control"
                    placeholder="utilisateur@exemple.com"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="form-control"
                    placeholder="••••••••"
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-success fw-semibold w-100">
                    Créer l'utilisateur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              onClick={() => setActiveTab('all')}
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            >
              Tous les utilisateurs ({users.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => setActiveTab('blocked')}
              className={`nav-link ${activeTab === 'blocked' ? 'active' : ''}`}
            >
              Utilisateurs bloqués ({blockedUsers.length})
            </button>
          </li>
        </ul>

        {/* Users List */}
        <div className="card panel-card">
          {activeTab === 'all' ? (
            <div>
              {users.length === 0 ? (
                <div className="text-center py-4 text-muted">Aucun utilisateur trouvé</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.firstName} {u.lastName}</td>
                          <td>{u.email}</td>
                          <td className="text-muted">
                            {u.blockedUntil ? (
                              <span className="text-danger">Bloqué jusqu'au {u.blockedUntil}</span>
                            ) : (
                              'Actif'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              {blockedUsers.length === 0 ? (
                <div className="text-center py-4 text-muted">Aucun utilisateur bloqué</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Bloqué jusqu'au</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.firstName} {u.lastName}</td>
                          <td>{u.email}</td>
                          <td>
                            {u.blockedUntil ? (
                              new Date(u.blockedUntil).toLocaleString()
                            ) : (
                              'Inconnu'
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleUnlock(u.email)}
                              disabled={unblockingId === u.email}
                              className="btn btn-success btn-sm"
                            >
                              {unblockingId === u.email ? 'Déblocage...' : 'Débloquer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPage;
