import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      // Récupérer le user mis à jour depuis le store
      const currentUser = useAuthStore.getState().user;
      
      // Rediriger vers /dashboard si manager, sinon vers /
      if (currentUser?.role === 'manager') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="page-shell d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="card form-card p-4">
              <div className="text-center mb-4">
                <h1 className="h4 fw-bold text-dark">🛣️ Travaux Routiers</h1>
                <p className="text-muted mb-0">Connectez-vous à votre compte</p>
              </div>

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    placeholder="nom@exemple.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="form-label">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary fw-semibold"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <div className="mt-4 text-center text-muted">
                Vous n'avez pas de compte ?{' '}
                <Link to="/register" className="fw-semibold text-decoration-none">
                  S'inscrire
                </Link>
              </div>

              <div className="mt-2 text-center text-muted small">
                <Link to="/" className="text-decoration-none">
                  ← Continuer en tant que visiteur
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
