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

// Exemple : remplacer la requête qui récupère les honoraires par ceci
router.get('/honoraires', async (req, res) => {
  try {
    const { hasPrenom } = await getClientColumns();
    const prenomField = hasPrenom ? 'c.prenom' : 'NULL';
    const query = 
      'SELECT ' +
      'h.id, ' +
      "DATE_FORMAT(h.date, '%d/%m/%Y') AS date, " +
      "CONCAT( " +
      "  'HONORAIRES REÇU ', " +
      "  DATE_FORMAT(h.date, '%m/%y'), " +
      "  COALESCE(CONCAT(' - ', TRIM(CONCAT(c.nom, ' ', IFNULL(" + prenomField + ", '')))), '') " +
      ") AS libelle, " +
      'h.montant, ' +
      'h.client_id, ' +
      "TRIM(CONCAT(c.nom, ' ', IFNULL(" + prenomField + ", ''))) AS client_name " +
      'FROM honoraires h ' +
      'LEFT JOIN client c ON c.id = h.client_id ' +
      'WHERE /* vos filtres existants, ex: YEAR(h.date)=? */ ' +
      'ORDER BY h.date DESC';
    const [rows] = await pool.execute(query, [/* params */]);

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