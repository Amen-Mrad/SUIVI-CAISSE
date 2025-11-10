require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const router = express.Router();

// Clé secrète pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_jwt_changez_moi_en_production';

// Route de connexion par username/password avec JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Rechercher l'utilisateur dans la base de données par username
    console.log('Recherche de l\'utilisateur:', username);
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé pour:', username);
      return res.status(401).json({
        success: false,
        error: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    // Support pour les deux formats : mdp en texte clair (ancien) et password_hash (nouveau)
    let isPasswordValid = false;
    
    if (user.password_hash) {
      // Utiliser bcrypt pour vérifier le hash
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else if (user.mdp) {
      // Compatibilité avec l'ancien système (texte clair)
      // Si le mot de passe correspond, on le hash pour la prochaine fois
      if (password === user.mdp) {
        isPasswordValid = true;
        // Mettre à jour avec un hash pour la prochaine fois
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
      }
    }

    if (!isPasswordValid) {
      console.log('Mot de passe incorrect pour:', username);
      return res.status(401).json({
        success: false,
        error: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Token valide pendant 24 heures
    );

    // Connexion réussie avec JWT
    console.log('✅ Connexion réussie pour:', username);
    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        nom: user.nom || '',
        prenom: user.prenom || '',
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// Route d'inscription avec JWT
router.post('/regst', async (req, res) => {
  try {
    const { username, password, nom, prenom, email, role } = req.body;

    // Validation des champs requis
    if (!username || !password || !nom || !prenom) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur, mot de passe, nom et prénom sont requis'
      });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation de la longueur du nom d'utilisateur
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce nom d\'utilisateur existe déjà'
      });
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (email) {
      const [existingEmails] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé'
        });
      }
    }

    // Hasher le mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Déterminer le rôle (par défaut 'caissier' si non spécifié)
    const userRole = role && ['admin', 'caissier'].includes(role) ? role : 'caissier';

    // Insérer le nouvel utilisateur dans la base de données
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, nom, prenom, email, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, nom, prenom, email || null, userRole]
    );

    const newUserId = result.insertId;

    // Générer un token JWT pour l'utilisateur nouvellement créé
    const token = jwt.sign(
      {
        id: newUserId,
        username: username,
        role: userRole
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Nouvel utilisateur créé:', username);

    // Retourner les informations de l'utilisateur avec le token
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token: token,
      user: {
        id: newUserId,
        username: username,
        nom: nom,
        prenom: prenom,
        email: email || null,
        role: userRole
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// Route de connexion par SMS
router.post('/login-sms', async (req, res) => {
  try {
    const { num_tel, sms_code } = req.body;

    if (!num_tel || !sms_code) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone et code SMS requis'
      });
    }

    // Rechercher l'utilisateur par numéro de téléphone (non disponible dans cette version)
    return res.status(400).json({
      success: false,
      error: 'Connexion par SMS non disponible dans cette version'
    });

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Numéro de téléphone non reconnu'
      });
    }

    const user = users[0];

    // Vérifier le code SMS (pour l'instant, code fixe pour les tests)
    if (sms_code !== '123456') {
      return res.status(401).json({
        success: false,
        error: 'Code SMS incorrect'
      });
    }

    // Connexion SMS réussie (sans JWT pour les tests)
    res.json({
      success: true,
      message: 'Connexion SMS réussie',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour envoyer un code SMS (simulation)
router.post('/send-sms', async (req, res) => {
  try {
    const { num_tel } = req.body;

    if (!num_tel) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    // Vérifier si le numéro existe (non disponible dans cette version)
    return res.status(400).json({
      success: false,
      error: 'Envoi SMS non disponible dans cette version'
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Numéro de téléphone non reconnu'
      });
    }

    // Simulation d'envoi SMS
    console.log(`SMS envoyé au ${num_tel} avec le code: 123456`);

    res.json({
      success: true,
      message: 'Code SMS envoyé avec succès',
      sms_code: '123456' // Pour les tests seulement
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

// Route pour vérifier l'authentification avec JWT
router.get('/verify', verifyToken, async (req, res) => {
  try {
    // Récupérer les informations complètes de l'utilisateur depuis la base de données
    const [users] = await pool.execute(
      'SELECT id, username, nom, prenom, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// Exporter le router et le middleware
router.verifyToken = verifyToken;
module.exports = router;
