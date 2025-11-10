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
        }
        
        .login-page {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .login-page::before {
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
        
        .login-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          padding: 3rem;
          max-width: 450px;
          width: 90%;
          position: relative;
          z-index: 10;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .login-logo {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          position: relative;
          padding: 15px;
        }
        
        .login-logo::before {
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
          filter: blur(10px);
        }
        
        .login-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          /* filter: brightness(0) invert(1); */
          transition: all 0.3s ease;
          display: block;
          opacity: 1;
        }
        
        .login-logo:hover img {
          transform: scale(1.05);
        }
        
        .login-title {
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .login-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .modern-input-group {
          position: relative;
          margin-bottom: 1.5rem;
        }
        
        .modern-input {
          width: 100%;
          padding: 15px 20px 15px 50px;
          border: 2px solid #e9ecef;
          border-radius: 15px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
          color: #495057;
        }
        
        .modern-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }
        
        .modern-input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.1rem;
          z-index: 2;
        }
        
        .modern-login-btn {
          width: 100%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border: none;
          color: white;
          border-radius: 15px;
          padding: 15px 30px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          margin-top: 1rem;
        }
        
        .modern-login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .modern-login-btn:hover::before {
          left: 100%;
        }
        
        .modern-login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .modern-login-btn:disabled {
          opacity: 0.7;
          transform: none;
        }
        
        .modern-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #667eea;
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
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          color: #6c757d;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding: 2rem;
            margin: 1rem;
          }
          
          .login-title {
            font-size: 2rem;
          }
          
          .login-logo {
            width: 80px;
            height: 80px;
            padding: 12px;
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
            <h1 className="login-title">Caisse CGM</h1>
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
            <p>Vous n'avez pas de compte ? <Link to="/register">S'inscrire</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}