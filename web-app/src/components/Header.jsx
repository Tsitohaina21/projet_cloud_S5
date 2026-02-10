import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-navbar navbar navbar-dark">
        <div className="container-fluid px-4">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold">
            <span style={{ fontSize: '1.5rem' }}>🛣️</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>Travaux Routiers</div>
              <div style={{ fontSize: '0.75rem', opacity: '0.8', fontWeight: '400' }}>Antananarivo</div>
            </div>
          </Link>

          <nav className="d-none d-lg-flex align-items-center gap-1">
            <Link to="/" className={`nav-link text-white px-2 py-2 position-relative ${isActive('/') ? 'fw-semibold' : ''}`}
              style={{ transition: 'all 0.2s ease' }}>
              Carte
              {isActive('/') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#fff' }}></div>}
            </Link>
            {user && user.role === 'manager' && (
              <>
                <Link to="/dashboard" className={`nav-link text-white px-2 py-2 position-relative ${isActive('/dashboard') ? 'fw-semibold' : ''}`}
                  style={{ transition: 'all 0.2s ease' }}>
                  Signalements
                  {isActive('/dashboard') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#fff' }}></div>}
                </Link>
                <Link to="/manage-users" className={`nav-link text-white px-2 py-2 position-relative ${isActive('/manage-users') ? 'fw-semibold' : ''}`}
                  style={{ transition: 'all 0.2s ease' }}>
                  Utilisateurs
                  {isActive('/manage-users') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#fff' }}></div>}
                </Link>
                <Link to="/statistics" className={`nav-link text-white px-2 py-2 position-relative ${isActive('/statistics') ? 'fw-semibold' : ''}`}
                  style={{ transition: 'all 0.2s ease' }}>
                  Statistiques
                  {isActive('/statistics') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#fff' }}></div>}
                </Link>
                <Link to="/sync" className={`nav-link text-white px-2 py-2 position-relative ${isActive('/sync') ? 'fw-semibold' : ''}`}
                  style={{ transition: 'all 0.2s ease' }}>
                  Sync
                  {isActive('/sync') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#fff' }}></div>}
                </Link>
              </>
            )}
          </nav>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {user ? (
              <>
                <div className="d-none d-sm-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark fw-semibold" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                    {user.email || 'manager1@example.com'}
                  </span>
                  <span className="text-white-50" style={{ fontSize: '0.8rem' }}>
                    {user.role === 'manager' ? '👨‍💼 Manager' : '👤 App'}
                  </span>
                </div>
                <button className="btn btn-outline-light btn-sm">
                  Profil
                </button>
                <button onClick={handleLogout} className="btn btn-light btn-sm fw-semibold">
                  Quitter
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-light btn-sm fw-semibold">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
  );
};

export default Header;
