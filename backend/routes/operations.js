const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Obtenir les opérations d'un client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier que le client existe
    const [clientCheck] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [clientId]
    );

    if (clientCheck.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Récupérer les opérations du client
    const [operations] = await pool.execute(`
      SELECT 
        o.id,
        o.type_operation,
        o.montant,
        o.description,
        o.date_operation,
        o.statut,
        o.reference,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.code_client
      FROM operations o
      JOIN clients c ON o.client_id = c.id
      WHERE o.client_id = ?
      ORDER BY o.date_operation DESC
      LIMIT ? OFFSET ?
    `, [clientId, parseInt(limit), parseInt(offset)]);

    // Compter le total des opérations
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM operations WHERE client_id = ?',
      [clientId]
    );

    res.json({
      success: true,
      operations,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des opérations:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération',
      message: error.message 
    });
  }
});

// Ajouter une nouvelle opération
router.post('/', async (req, res) => {
  try {
    const { 
      client_id, 
      type_operation, 
      montant, 
      description, 
      reference 
    } = req.body;

    // Vérifier que le client existe
    const [clientCheck] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [client_id]
    );

    if (clientCheck.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Insérer la nouvelle opération
    const [result] = await pool.execute(`
      INSERT INTO operations (
        client_id, type_operation, montant, description, reference, date_operation, statut
      ) VALUES (?, ?, ?, ?, ?, NOW(), 'en_cours')
    `, [client_id, type_operation, montant, description, reference]);

    res.status(201).json({
      success: true,
      message: 'Opération ajoutée avec succès',
      operationId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'opération:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout',
      message: error.message 
    });
  }
});

// Obtenir toutes les opérations
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, type_operation } = req.query;

    let query = `
      SELECT 
        o.id,
        o.type_operation,
        o.montant,
        o.description,
        o.date_operation,
        o.statut,
        o.reference,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.code_client
      FROM operations o
      JOIN clients c ON o.client_id = c.id
    `;

    const params = [];

    if (type_operation) {
      query += ' WHERE o.type_operation = ?';
      params.push(type_operation);
    }

    query += ' ORDER BY o.date_operation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [operations] = await pool.execute(query, params);

    res.json({
      success: true,
      operations,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des opérations:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération',
      message: error.message 
    });
  }
});

module.exports = router;
