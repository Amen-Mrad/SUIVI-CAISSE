import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Au démarrage, restaurer la session depuis sessionStorage ou localStorage
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Vérifier d'abord sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        if (sessionUser && token) {
          // Vérifier que le token est toujours valide
          try {
            const response = await fetch('/api/auth/verify', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                const userData = JSON.parse(sessionUser);
                setUser(userData);
                setIsAuthenticated(true);
              } else {
                // Token invalide, nettoyer
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
                localStorage.removeItem('token');
              }
            } else {

              sessionStorage.removeItem('user');
              sessionStorage.removeItem('token');
              localStorage.removeItem('token');
            }
          } catch (error) {
            // Erreur de vérification, nettoyer
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Persister les données utilisateur et le token JWT
    sessionStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) {
      sessionStorage.setItem('token', userData.token);
      // Stocker aussi dans localStorage pour persistance entre sessions (optionnel)
      localStorage.setItem('token', userData.token);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isCaissier = () => {
    return user && user.role === 'caissier';
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    isAdmin,
    isCaissier
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
