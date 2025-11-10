const jwt = require('jsonwebtoken');

// Clé secrète pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_jwt_changez_moi_en_production';

/**
 * Middleware pour vérifier le token JWT
 */
const authenticateToken = (req, res, next) => {
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification manquant'
    });
  }

  // Vérifier le token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = user;
    next();
  });
};

/**
 * Générer un token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' } // Token valide pendant 24 heures
  );
};

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};

