const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Obtenir les charges d'un client
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

    // Récupérer les charges du client
    const [charges] = await pool.execute(`
      SELECT 
        ch.id,
        ch.type_charge,
        ch.montant,
        ch.description,
        ch.date_charge,
        ch.statut,
        ch.reference,
        ch.categorie,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.code_client
      FROM charges ch
      JOIN clients c ON ch.client_id = c.id
      WHERE ch.client_id = ?
      ORDER BY ch.date_charge DESC
      LIMIT ? OFFSET ?
    `, [clientId, parseInt(limit), parseInt(offset)]);

    // Compter le total des charges
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM charges WHERE client_id = ?',
      [clientId]
    );

    // Calculer le total des montants
    const [totalResult] = await pool.execute(
      'SELECT SUM(montant) as total_montant FROM charges WHERE client_id = ? AND statut = "actif"',
      [clientId]
    );

    res.json({
      success: true,
      charges,
      total: countResult[0].total,
      totalMontant: totalResult[0].total_montant || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des charges:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération',
      message: error.message
    });
  }
});

// Ajouter une nouvelle charge
router.post('/', async (req, res) => {
  try {
    const {
      client_id,
      type_charge,
      montant,
      description,
      reference,
      categorie
    } = req.body;

    // Vérifier que le client existe
    const [clientCheck] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [client_id]
    );

    if (clientCheck.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Insérer la nouvelle charge
    const [result] = await pool.execute(`
      INSERT INTO charges (
        client_id, type_charge, montant, description, reference, categorie, date_charge, statut
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'actif')
    `, [client_id, type_charge, montant, description, reference, categorie]);

    res.status(201).json({
      success: true,
      message: 'Charge ajoutée avec succès',
      chargeId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la charge:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'ajout',
      message: error.message
    });
  }
});

// Obtenir toutes les charges
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, type_charge, categorie } = req.query;

    let query = `
      SELECT 
        ch.id,
        ch.type_charge,
        ch.montant,
        ch.description,
        ch.date_charge,
        ch.statut,
        ch.reference,
        ch.categorie,
        c.nom as client_nom,
        c.prenom as client_prenom,
        c.code_client
      FROM charges ch
      JOIN clients c ON ch.client_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (type_charge) {
      query += ' AND ch.type_charge = ?';
      params.push(type_charge);
    }

    if (categorie) {
      query += ' AND ch.categorie = ?';
      params.push(categorie);
    }

    query += ' ORDER BY ch.date_charge DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [charges] = await pool.execute(query, params);

    res.json({
      success: true,
      charges,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des charges:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération',
      message: error.message
    });
  }
});

module.exports = router;
