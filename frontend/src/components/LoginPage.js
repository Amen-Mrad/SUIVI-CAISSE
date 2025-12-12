import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      setError('Nom d\'utilisateur et mot de passe requis');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        const user = {
          ...data.user,
          loginMethod: 'username',
          token: data.token
        };
        login(user);
        navigate('/clients', { replace: true });
      } else {
        setError(data.error || 'Nom d\'utilisateur ou mot de passe incorrect');
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
          overflow: hidden;
          background: rgb(187, 187, 187);
        }
        
        .login-page {
          background: transparent;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 1rem;
        }
        
        .login-container {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          max-width: 400px;
          width: 100%;
          position: relative;
          z-index: 10;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .login-header-title {
          background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 400;
        }
        
        .login-logo {
          width: 120px;
          height: 80px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .login-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        
        .login-subtitle {
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 400;
          margin-top: 0.5rem;
        }
        
        .modern-input-group {
          position: relative;
          margin-bottom: 1rem;
        }
        
        .modern-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #495057;
        }
        
        .modern-input:focus {
          outline: none;
          border-color: #0b5796;
          box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.1);
        }
        
        .modern-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1rem;
          z-index: 2;
        }
        
        .modern-login-btn {
          width: 100%;
          background: #2E7D32;
          border: none;
          color: white;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 400;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        
        .modern-login-btn:hover {
          background: #256528;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(46, 125, 50, 0.3);
        }
        
        .modern-login-btn:disabled {
          opacity: 0.7;
          transform: none;
          cursor: not-allowed;
        }
        
        .modern-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-alert {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 15px;
          margin-bottom: 1rem;
          font-weight: 400;
          font-size: 0.85rem;
        }
        
        .login-footer {
          text-align: center;
          margin-top: 1rem;
          color: #6c757d;
          font-size: 0.85rem;
        }
        
        .login-footer a {
          color: #0b5796;
          text-decoration: none;
          font-weight: 400;
        }
        
        .login-footer a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding: 1.25rem;
            margin: 0.5rem;
            max-width: 100%;
          }
          
          .login-header-title {
            font-size: 1.3rem;
            padding: 0.6rem 0.8rem;
          }
          
          .login-logo {
            width: 100px;
            height: 70px;
          }
          
          .login-subtitle {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 1rem;
          }
          
          .login-header-title {
            font-size: 1.2rem;
            padding: 0.5rem 0.75rem;
          }
          
          .login-logo {
            width: 90px;
            height: 60px;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-container">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <img src="/logo.png" alt="Caisse CGM Logo" />
            </div>
            <h1 className="login-header-title">Caisse CGM</h1>
            <p className="login-subtitle">Veuillez vous connecter pour accéder à votre espace</p>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="error-alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Formulaire de connexion */}
          <form onSubmit={handleLogin}>
            {/* Nom d'utilisateur */}
            <div className="modern-input-group">
              <i className="fas fa-user modern-input-icon"></i>
              <input
                type="text"
                className="modern-input"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nom d'utilisateur"
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="modern-input-group">
              <i className="fas fa-lock modern-input-icon"></i>
              <input
                type="password"
                className="modern-input"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mot de passe"
                required
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              className="modern-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="modern-spinner"></div>
                  Connexion...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            {/*  <p>Vous n'avez pas de compte ? <Link to="/register">S'inscrire</Link></p> */}
          </div>
        </div>
      </div>
    </>
  );
}
