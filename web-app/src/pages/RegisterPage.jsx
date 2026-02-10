import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    const success = await register(email, password, firstName, lastName);
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
      setError('Inscription échouée. L’email est peut-être déjà utilisé.');
    }
  };

  return (
    <div className="page-shell d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-6">
            <div className="card form-card p-4">
              <div className="text-center mb-4">
                <h1 className="h4 fw-bold text-dark">🛣️ Travaux Routiers</h1>
                <p className="text-muted mb-0">Créez votre compte</p>
              </div>

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                      placeholder="Jean"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                      placeholder="Dupont"
                      disabled={isLoading}
                    />
                  </div>
                </div>

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

                <div>
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? 'Création du compte...' : 'Créer mon compte'}
                </button>
              </form>

              <div className="mt-4 text-center text-muted">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="fw-semibold text-decoration-none">
                  Se connecter
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

export default RegisterPage;
