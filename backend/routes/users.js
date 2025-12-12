require('dotenv').config();
const express = require('express');
const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
// Configuration Multer pour upload de signature
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', 'signatures');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Format d\'image non supporté'));
    cb(null, true);
  }
});

// Utilitaire: vérifier si une colonne existe
async function doesColumnExist(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0]?.cnt > 0;
}


// Middleware pour vérifier l'authentification admin (SANS JWT - pour les tests)
const requireAdmin = async (req, res, next) => {
  try {
    // Pour les tests, on accepte toutes les requêtes admin
    // TODO: Restaurer l'authentification JWT avant l'hébergement
    console.log('⚠️  Mode test: authentification admin désactivée');
    req.user = { id: 1, role: 'admin' }; // Utilisateur admin fictif pour les tests
    next();
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    return res.status(401).json({ success: false, error: 'Erreur d\'authentification' });
  }
};

// Route d'inscription publique supprimée : création d'utilisateur réservée aux admins via POST /api/users

// GET /api/users - Récupérer tous les utilisateurs
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Vérifier quelles colonnes existent dans la table users
    const hasUsername = await doesColumnExist('users', 'username');
    const hasCreatedAt = await doesColumnExist('users', 'created_at');
    const hasDateCreation = await doesColumnExist('users', 'date_creation');
    const hasSignatureUrl = await doesColumnExist('users', 'signature_url');
    const hasNom = await doesColumnExist('users', 'nom');
    const hasPrenom = await doesColumnExist('users', 'prenom');

    // Construire la requête SELECT dynamiquement selon les colonnes disponibles
    let columns = ['id'];

    // Ajouter username si elle existe
    if (hasUsername) {
      columns.push('username');
    }

    // Toujours ajouter nom et prenom si elles existent (pour l'affichage)
    if (hasNom) columns.push('nom');
    if (hasPrenom) columns.push('prenom');

    columns.push('role');

    if (hasSignatureUrl) columns.push('signature_url');

    // Utiliser la colonne de date qui existe
    const dateColumn = hasCreatedAt ? 'created_at' : (hasDateCreation ? 'date_creation' : null);
    if (dateColumn) {
      columns.push(`${dateColumn} as date_creation`);
    }

    const selectQuery = `SELECT ${columns.join(', ')} FROM users ORDER BY ${dateColumn || 'id'} DESC`;
    console.log('Requête SQL:', selectQuery);
    const [users] = await pool.execute(selectQuery);

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    console.error('Détails de l\'erreur:', error.message);
    console.error('Code SQL:', error.sql);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs',
      details: error.message
    });
  }
});

// GET /api/users/employes - liste simple des caissiers (employés)
router.get('/employes', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username FROM users WHERE role = "caissier" ORDER BY username ASC'
    );
    res.json({ success: true, employes: rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/users - Créer un nouvel utilisateur
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validation des données
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    if (!['admin', 'caissier'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
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

    // Créer l'utilisateur avec mot de passe en texte clair (pour les tests)
    console.log('Création d\'utilisateur:', { username, role });
    const [result] = await pool.execute(
      'INSERT INTO users (username, mdp, role) VALUES (?, ?, ?)',
      [username, password, role]
    );

    res.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id - Modifier un utilisateur
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    // Validation des données
    if (!username || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur et rôle sont requis'
      });
    }

    if (!['admin', 'caissier'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le nom d'utilisateur est déjà pris par un autre utilisateur
    const [duplicateUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );

    if (duplicateUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur'
      });
    }

    // Préparer la requête de mise à jour
    let updateQuery = 'UPDATE users SET username = ?, role = ?';
    let updateParams = [username, role];

    // Si un nouveau mot de passe est fourni, l'ajouter (en texte clair pour les tests)
    if (password && password.trim() !== '') {
      console.log('Mise à jour du mot de passe pour l\'utilisateur:', id);
      updateQuery += ', mdp = ?';
      updateParams.push(password);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification de l\'utilisateur'
    });
  }
});

// Endpoint d'upload de signature supprimé (retour à l'état initial)

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT id, username, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const user = existingUsers[0];

    // Empêcher la suppression du dernier admin
    if (user.role === 'admin') {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );

      if (adminCount[0].count <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Impossible de supprimer le dernier administrateur'
        });
      }
    }

    // Supprimer l'utilisateur
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'utilisateur'
    });
  }
});

module.exports = router;
