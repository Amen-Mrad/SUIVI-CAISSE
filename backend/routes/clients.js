const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Détection paresseuse des colonnes optionnelles dans la table client
let clientColumnsCache = null;
async function getClientColumns() {
  if (clientColumnsCache !== null) return clientColumnsCache;
  try {
    const [rows] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client'`
    );
    const set = new Set(rows.map(r => r.COLUMN_NAME));
    clientColumnsCache = {
      hasPrenom: set.has('prenom'),
      hasTelephone: set.has('telephone'),
      hasEmail: set.has('email'),
      hasAdresse: set.has('adresse')
    };
  } catch (_) {
    clientColumnsCache = { hasPrenom: false, hasTelephone: false, hasEmail: false, hasAdresse: false };
  }
  return clientColumnsCache;
}

// Fonctions de compatibilité pour l'ancien code
async function clientHasPrenomColumn() {
  const cols = await getClientColumns();
  return cols.hasPrenom;
}

// Rechercher un client par username
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Paramètre de recherche requis' });
    }

    const { hasPrenom, hasTelephone } = await getClientColumns();
    const selectPrenom = hasPrenom ? 'prenom' : 'NULL AS prenom';
    const selectTelephone = hasTelephone ? 'telephone' : 'NULL AS telephone';
    const [rows] = await pool.execute(
      `SELECT id, nom, ${selectPrenom}, username, ${selectTelephone}
       FROM client
       WHERE username LIKE ?
       ORDER BY nom${hasPrenom ? ', prenom' : ''}`,
      [`${query}%`]
    );

    res.json({
      success: true,
      clients: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de clients:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche',
      message: error.message
    });
  }
});

// Recherche par username exact
router.get('/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username requis' });
    }

    const { hasPrenom, hasTelephone } = await getClientColumns();
    const selectPrenom = hasPrenom ? 'prenom' : 'NULL AS prenom';
    const selectTelephone = hasTelephone ? 'telephone' : 'NULL AS telephone';
    const [rows] = await pool.execute(
      `SELECT id, nom, ${selectPrenom}, username, ${selectTelephone} FROM client WHERE username = ? LIMIT 5`,
      [username]
    );

    res.json({ success: true, clients: rows, count: rows.length });
  } catch (error) {
    console.error('Erreur lors de la recherche par username:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche', message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { hasPrenom, hasTelephone } = await getClientColumns();
    const selectPrenom = hasPrenom ? 'prenom' : 'NULL AS prenom';
    const selectTelephone = hasTelephone ? 'telephone' : 'NULL AS telephone';
    const [rows] = await pool.execute(
      `SELECT id, nom, ${selectPrenom}, username, ${selectTelephone} FROM client WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({
      success: true,
      client: rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération',
      message: error.message
    });
  }
});

// Obtenir tous les clients (nom et téléphone seulement)
router.get('/', async (req, res) => {
  try {
    const { hasPrenom, hasTelephone } = await getClientColumns();
    const selectPrenom = hasPrenom ? 'prenom' : 'NULL AS prenom';
    const selectTelephone = hasTelephone ? 'telephone' : 'NULL AS telephone';
    const [rows] = await pool.execute(
      `SELECT id, nom, ${selectPrenom}, username, ${selectTelephone} FROM client ORDER BY nom${hasPrenom ? ', prenom' : ''}`
    );

    res.json({
      success: true,
      clients: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération',
      message: error.message
    });
  }
});


// Créer un nouveau client
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      username,
      telephone
    } = req.body;

    // Validation champs requis (prenom et téléphone deviennent optionnels)
    if (!nom || !username) {
      return res.status(400).json({ error: 'Les champs nom et username sont obligatoires' });
    }

    // Normaliser (trim)
    const nomTrim = String(nom).trim();
    const prenomTrim = String(prenom || '').trim();
    const usernameTrim = String(username).trim();
    // email supprimé
    const telephoneTrim = telephone ? String(telephone).trim() : '';

    // Vérifier si le username existe déjà
    if (usernameTrim) {
      const [existingUsername] = await pool.execute(
        'SELECT id FROM client WHERE username = ?',
        [usernameTrim]
      );

      if (existingUsername.length > 0) {
        return res.status(400).json({
          error: 'Ce username est déjà utilisé'
        });
      }
    }

    // plus de contrôle email

    // Convertir prenom vide en NULL
    const prenomFinal = prenomTrim === '' ? null : prenomTrim;
    // Convertir telephone vide en NULL
    const telephoneFinal = telephoneTrim === '' ? null : telephoneTrim;

    // Récupérer les colonnes disponibles
    const { hasPrenom, hasTelephone } = await getClientColumns();

    // Vérifier si le téléphone existe déjà (seulement si la colonne existe)
    if (hasTelephone && telephoneTrim !== '') {
      const [existingTel] = await pool.execute(
        'SELECT id FROM client WHERE telephone = ?',
        [telephoneTrim]
      );
      if (existingTel.length > 0) {
        return res.status(400).json({ error: 'Ce téléphone est déjà utilisé' });
      }
    }
    let result;
    if (hasPrenom && hasTelephone) {
      [result] = await pool.execute(`
        INSERT INTO client (
          nom, prenom, username, telephone
        ) VALUES (?, ?, ?, ?)
      `, [nomTrim, prenomFinal, usernameTrim, telephoneFinal]);
    } else if (hasPrenom && !hasTelephone) {
      [result] = await pool.execute(`
        INSERT INTO client (
          nom, prenom, username
        ) VALUES (?, ?, ?)
      `, [nomTrim, prenomFinal, usernameTrim]);
    } else if (!hasPrenom && hasTelephone) {
      [result] = await pool.execute(`
        INSERT INTO client (
          nom, username, telephone
        ) VALUES (?, ?, ?)
      `, [nomTrim, usernameTrim, telephoneFinal]);
    } else {
      [result] = await pool.execute(`
        INSERT INTO client (
          nom, username
        ) VALUES (?, ?)
      `, [nomTrim, usernameTrim]);
    }

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      clientId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    if (error && error.code === 'ER_DUP_ENTRY') {
      // Message plus clair selon la contrainte unique
      const msg = (error.sqlMessage || '').toLowerCase();
      if (msg.includes('username')) {
        return res.status(400).json({ error: 'Ce username est déjà utilisé' });
      }
      // email supprimé
      if (msg.includes('telephone') || msg.includes('téléphone')) {
        return res.status(400).json({ error: 'Ce téléphone est déjà utilisé' });
      }
    }
    res.status(500).json({ error: 'Erreur lors de la création', message: error.message });
  }
});

// Modifier un client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, username, telephone } = req.body;

    // Validation des champs obligatoires (prenom et téléphone deviennent optionnels)
    if (!nom || !username) {
      return res.status(400).json({ error: 'Les champs nom et username sont obligatoires' });
    }

    // Normaliser (trim)
    const nomTrim = String(nom).trim();
    const prenomTrim = String(prenom || '').trim();
    const usernameTrim = String(username).trim();
    // email supprimé
    const telephoneTrim = telephone ? String(telephone).trim() : '';

    // email supprimé

    // Vérifier que le client existe
    const [existingClient] = await pool.execute(
      'SELECT id FROM client WHERE id = ?',
      [id]
    );

    if (existingClient.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Vérifier si le username existe déjà pour un autre client
    if (usernameTrim) {
      const [duplicateUsername] = await pool.execute(
        'SELECT id FROM client WHERE username = ? AND id != ?',
        [usernameTrim, id]
      );

      if (duplicateUsername.length > 0) {
        return res.status(400).json({
          error: 'Ce username est déjà utilisé par un autre client'
        });
      }
    }

    // plus de vérification email

    // Mettre à jour le client
    // Convertir prenom vide en NULL
    const prenomFinal = prenomTrim === '' ? null : prenomTrim;
    // Convertir telephone vide en NULL
    const telephoneFinal = telephoneTrim === '' ? null : telephoneTrim;

    // Récupérer les colonnes disponibles
    const { hasPrenom, hasTelephone } = await getClientColumns();

    // Vérifier si le téléphone existe déjà pour un autre client (seulement si la colonne existe)
    if (hasTelephone && telephoneTrim !== '') {
      const [duplicateTelephone] = await pool.execute(
        'SELECT id FROM client WHERE telephone = ? AND id != ?',
        [telephoneTrim, id]
      );

      if (duplicateTelephone.length > 0) {
        return res.status(400).json({
          error: 'Ce téléphone est déjà utilisé par un autre client'
        });
      }
    }
    if (hasPrenom && hasTelephone) {
      await pool.execute(`
        UPDATE client 
        SET nom = ?, prenom = ?, username = ?, telephone = ?
        WHERE id = ?
      `, [nomTrim, prenomFinal, usernameTrim, telephoneFinal, id]);
    } else if (hasPrenom && !hasTelephone) {
      await pool.execute(`
        UPDATE client 
        SET nom = ?, prenom = ?, username = ?
        WHERE id = ?
      `, [nomTrim, prenomFinal, usernameTrim, id]);
    } else if (!hasPrenom && hasTelephone) {
      await pool.execute(`
        UPDATE client 
        SET nom = ?, username = ?, telephone = ?
        WHERE id = ?
      `, [nomTrim, usernameTrim, telephoneFinal, id]);
    } else {
      await pool.execute(`
        UPDATE client 
        SET nom = ?, username = ?
        WHERE id = ?
      `, [nomTrim, usernameTrim, id]);
    }

    res.json({
      success: true,
      message: 'Client modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la modification du client:', error);
    res.status(500).json({
      error: 'Erreur lors de la modification',
      message: error.message
    });
  }
});

// Supprimer un client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le client existe
    const [existingClient] = await pool.execute(
      'SELECT id FROM client WHERE id = ?',
      [id]
    );

    if (existingClient.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Exécuter en transaction pour garantir l'intégrité
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Supprimer les dépendances du client
      await conn.execute('DELETE FROM depenses_client WHERE client_id = ?', [id]);
      await conn.execute('DELETE FROM charges_mensuelles WHERE client_id = ?', [id]);
      await conn.execute('DELETE FROM print_history WHERE client_id = ?', [id]);

      // Enfin supprimer le client
      await conn.execute('DELETE FROM client WHERE id = ?', [id]);

      await conn.commit();
    } catch (innerErr) {
      try { await conn.rollback(); } catch (_) { }
      throw innerErr;
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      message: 'Client et données associées supprimés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      message: error.message
    });
  }
});

module.exports = router;
