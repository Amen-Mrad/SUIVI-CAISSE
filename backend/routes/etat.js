const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Exemple : remplacer la requête qui récupère les honoraires par ceci
router.get('/honoraires', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        h.id,
        DATE_FORMAT(h.date, '%d/%m/%Y') AS date,
        -- construire un libellé incluant la date, le mois/année et le nom du client
        CONCAT(
          'HONORAIRES REÇU ',
          DATE_FORMAT(h.date, '%m/%y'),
          COALESCE(CONCAT(' - ', TRIM(CONCAT(c.nom, ' ', IFNULL(c.prenom, '')))), '')
        ) AS libelle,
        h.montant,
        h.client_id,
        TRIM(CONCAT(c.nom, ' ', IFNULL(c.prenom, ''))) AS client_name
      FROM honoraires h
      LEFT JOIN client c ON c.id = h.client_id
      WHERE /* vos filtres existants, ex: YEAR(h.date)=? */
      ORDER BY h.date DESC
    `, [/* params */]);

    res.json({
      success: true,
      honoraires: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des honoraires:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération',
      message: error.message
    });
  }
});

module.exports = router;