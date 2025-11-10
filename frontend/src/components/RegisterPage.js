import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    email: '',
    role: 'caissier'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer les erreurs quand l'utilisateur tape
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validations
    if (!formData.username || !formData.password || !formData.nom || !formData.prenom) {
      setError('Tous les champs obligatoires doivent être remplis');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/regst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email || null,
          role: formData.role
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Inscription réussie ! Redirection...');
        const user = {
          ...data.user,
          loginMethod: 'register',
          token: data.token
        };
        login(user);
        // Rediriger vers la page d'accueil après 1 seconde
        setTimeout(() => {
          navigate('/clients', { replace: true });
        }, 1000);
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        body, html {
          height: 100vh;
          overflow: auto;
        }
        
        .register-page {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 20px;
        }
        
        .register-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .register-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 1;
        }
        
        .register-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .register-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          position: relative;
        }
        
        .register-logo::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          z-index: -1;
          opacity: 0.3;
        }
        
        .register-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }
        
        .register-logo:hover img {
          transform: scale(1.1);
        }
        
        .register-title {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 10px 0;
        }
        
        .register-subtitle {
          color: #718096;
          font-size: 14px;
          margin: 0;
        }
        
        .register-form {
          margin-top: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          color: #2d3748;
          font-weight: 600;
          font-size: 14px;
        }
        
        .form-label .required {
          color: #e53e3e;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
          cursor: pointer;
        }
        
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          border-left: 4px solid #c53030;
        }
        
        .success-message {
          background: #c6f6d5;
          color: #22543d;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          border-left: 4px solid #22543d;
        }
        
        .modern-register-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .modern-register-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .modern-register-btn:hover::before {
          left: 100%;
        }
        
        .modern-register-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .modern-register-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .register-footer {
          text-align: center;
          margin-top: 20px;
          color: #718096;
          font-size: 14px;
        }
        
        .register-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        
        .register-footer a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .register-container {
            padding: 30px 20px;
          }
          
          .register-title {
            font-size: 24px;
          }
        }
      `}</style>
      
      <div className="register-page">
        <div className="register-container">
          <div className="register-header">
            <div className="register-logo">
              <img src="/logo.png" alt="Logo" />
            </div>
            <h1 className="register-title">Créer un compte</h1>
            <p className="register-subtitle">Remplissez le formulaire pour vous inscrire</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label className="form-label">
                Nom d'utilisateur <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Entrez votre nom d'utilisateur"
                required
                minLength={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Nom <span className="required">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Entrez votre nom"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Prénom <span className="required">*</span>
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Entrez votre prénom"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Entrez votre email (optionnel)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Mot de passe <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Au moins 6 caractères"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirmer le mot de passe <span className="required">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Répétez le mot de passe"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Rôle
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="caissier">Caissier</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <button
              type="submit"
              className="modern-register-btn"
              disabled={loading}
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </form>

          <div className="register-footer">
            <p>Vous avez déjà un compte ? <Link to="/login">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

