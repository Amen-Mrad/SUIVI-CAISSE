const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Détection paresseuse des colonnes optionnelles de la table client
let clientColsCache = null;
async function getClientCols() {
    if (clientColsCache) return clientColsCache;
    try {
        const [rows] = await pool.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client'`
        );
        const set = new Set(rows.map(r => r.COLUMN_NAME));
        clientColsCache = { hasPrenom: set.has('prenom') };
    } catch (_) {
        clientColsCache = { hasPrenom: false };
    }
    return clientColsCache;
}

// Récupérer les statistiques des honoraires reçus (Chiffre d'affaires)
router.get('/honoraires-chiffre-affaires', async (req, res) => {
    try {
        const {
            period = 'mois',
            year,
            month,
            startDate,
            endDate
        } = req.query;

        let dateFormat, groupBy, whereClause = '';
        const params = [];

        // Construire la clause WHERE selon les paramètres
        if (year && month) {
            // Filtre par mois spécifique
            whereClause = 'WHERE YEAR(date) = ? AND MONTH(date) = ?';
            params.push(year, month);
        } else if (year) {
            // Filtre par année
            whereClause = 'WHERE YEAR(date) = ?';
            params.push(year);
        } else if (startDate && endDate) {
            // Filtre par période
            whereClause = 'WHERE DATE(date) >= ? AND DATE(date) <= ?';
            params.push(startDate, endDate);
        }

        // Déterminer le groupement selon la période
        if (period === 'jour') {
            dateFormat = '%Y-%m-%d';
            groupBy = 'DATE(date)';
        } else if (period === 'annee') {
            dateFormat = '%Y';
            groupBy = 'YEAR(date)';
        } else { // Default to 'mois'
            dateFormat = '%Y-%m';
            groupBy = 'DATE_FORMAT(date, "%Y-%m")';
        }

        // Construire la clause WHERE pour filtrer uniquement les honoraires reçus
        let honorairesWhereClause = whereClause;
        if (honorairesWhereClause) {
            honorairesWhereClause += ` AND UPPER(TRIM(libelle)) LIKE '%HONORAIRES RE%' AND (COALESCE(avance, 0) > 0 OR COALESCE(montant, 0) > 0)`;
        } else {
            honorairesWhereClause = `WHERE UPPER(TRIM(libelle)) LIKE '%HONORAIRES RE%' AND (COALESCE(avance, 0) > 0 OR COALESCE(montant, 0) > 0)`;
        }

        // Requête SQL avec filtres - Utiliser GREATEST pour prendre avance ou montant
        const query = `
            SELECT
                ${groupBy} AS period,
                SUM(GREATEST(COALESCE(avance, 0), COALESCE(montant, 0))) AS total_honoraires
            FROM charges_mensuelles
            ${honorairesWhereClause}
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `;

        const [results] = await pool.execute(query, params);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du chiffre d\'affaires (honoraires):', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération du chiffre d\'affaires (honoraires)',
            message: error.message
        });
    }
});

// Récupérer les honoraires reçus par client
router.get('/honoraires-par-client', async (req, res) => {
    try {
        const {
            period = 'mois',
            year,
            month,
            startDate,
            endDate,
            clientId
        } = req.query;

        let dateFormat, groupBy, whereClause = '';
        const params = [];

        // Construire la clause WHERE selon les paramètres
        if (year && month) {
            // Filtre par mois spécifique
            whereClause = 'WHERE YEAR(cm.date) = ? AND MONTH(cm.date) = ?';
            params.push(year, month);
        } else if (year) {
            // Filtre par année
            whereClause = 'WHERE YEAR(cm.date) = ?';
            params.push(year);
        } else if (startDate && endDate) {
            // Filtre par période
            whereClause = 'WHERE DATE(cm.date) >= ? AND DATE(cm.date) <= ?';
            params.push(startDate, endDate);
        }

        // Ajouter le filtre par client si spécifié
        if (clientId) {
            if (whereClause) {
                whereClause += ' AND cm.client_id = ?';
            } else {
                whereClause = 'WHERE cm.client_id = ?';
            }
            params.push(clientId);
        }

        // Déterminer le groupement selon la période
        if (period === 'jour') {
            dateFormat = '%Y-%m-%d';
            groupBy = 'DATE(cm.date)';
        } else if (period === 'annee') {
            dateFormat = '%Y';
            groupBy = 'YEAR(cm.date)';
        } else { // Default to 'mois'
            dateFormat = '%Y-%m';
            groupBy = 'DATE_FORMAT(cm.date, "%Y-%m")';
        }

        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';

        // Construire la clause WHERE pour filtrer uniquement les honoraires reçus
        let honorairesWhereClause = whereClause;
        if (honorairesWhereClause) {
            honorairesWhereClause += ` AND UPPER(TRIM(cm.libelle)) LIKE '%HONORAIRES RE%' AND (COALESCE(cm.avance, 0) > 0 OR COALESCE(cm.montant, 0) > 0)`;
        } else {
            honorairesWhereClause = `WHERE UPPER(TRIM(cm.libelle)) LIKE '%HONORAIRES RE%' AND (COALESCE(cm.avance, 0) > 0 OR COALESCE(cm.montant, 0) > 0)`;
        }

        // Requête SQL pour honoraires par client - Utiliser GREATEST pour prendre avance ou montant
        const query = `
            SELECT
                c.id as client_id,
                c.nom as client_nom,
                ${selectPrenom},
                ${groupBy} AS period,
                SUM(GREATEST(COALESCE(cm.avance, 0), COALESCE(cm.montant, 0))) AS total_honoraires,
                COUNT(cm.id) AS nombre_charges
            FROM charges_mensuelles cm
            JOIN client c ON cm.client_id = c.id
            ${honorairesWhereClause}
            GROUP BY c.id, c.nom, ${groupBy}
            ORDER BY c.nom ASC, period ASC
        `;

        const [results] = await pool.execute(query, params);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires par client:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires par client',
            message: error.message
        });
    }
});

// Récupérer les statistiques des dépenses totales
router.get('/depenses-totales', async (req, res) => {
    try {
        const {
            period = 'mois',
            year,
            month,
            startDate,
            endDate
        } = req.query;

        let dateFormat, groupBy, whereClause = '';
        const params = [];

        // Construire la clause WHERE selon les paramètres
        if (year && month) {
            // Filtre par mois spécifique
            whereClause = 'WHERE YEAR(date) = ? AND MONTH(date) = ?';
            params.push(year, month);
        } else if (year) {
            // Filtre par année
            whereClause = 'WHERE YEAR(date) = ?';
            params.push(year);
        } else if (startDate && endDate) {
            // Filtre par période
            whereClause = 'WHERE DATE(date) >= ? AND DATE(date) <= ?';
            params.push(startDate, endDate);
        }

        // Déterminer le groupement selon la période
        if (period === 'jour') {
            dateFormat = '%Y-%m-%d';
            groupBy = 'DATE(date)';
        } else if (period === 'annee') {
            dateFormat = '%Y';
            groupBy = 'YEAR(date)';
        } else { // Default to 'mois'
            dateFormat = '%Y-%m';
            groupBy = 'DATE_FORMAT(date, "%Y-%m")';
        }

        // Requête SQL pour les dépenses totales
        const query = `
            SELECT
                ${groupBy} AS period,
                SUM(montant) AS total_depenses
            FROM depenses_client
            ${whereClause}
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `;

        const [results] = await pool.execute(query, params);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses totales:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses totales',
            message: error.message
        });
    }
});

// Récupérer l'évolution de la caisse CGM (retraits et dépôts)
router.get('/caisse-cgm-evolution', async (req, res) => {
    try {
        const {
            period = 'mois',
            year,
            month,
            startDate,
            endDate
        } = req.query;

        let groupBy, whereClause = '';
        const params = [];

        // Construire la clause WHERE selon les paramètres
        if (year && month) {
            // Filtre par mois spécifique
            whereClause = 'WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?';
            params.push(year, month);
        } else if (year) {
            // Filtre par année
            whereClause = 'WHERE YEAR(created_at) = ?';
            params.push(year);
        } else if (startDate && endDate) {
            // Filtre par période
            whereClause = 'WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?';
            params.push(startDate, endDate);
        }

        // Déterminer le groupement selon la période
        if (period === 'jour') {
            groupBy = 'DATE(created_at)';
        } else if (period === 'annee') {
            groupBy = 'YEAR(created_at)';
        } else { // Default to 'mois'
            groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        }

        // Requête SQL pour récupérer les retraits et dépôts par période
        const query = `
            SELECT
                ${groupBy} AS period,
                COALESCE(SUM(CASE WHEN type_operation IN ('retrait', 'paiement_client') THEN montant ELSE 0 END), 0) AS total_retraits,
                COALESCE(SUM(CASE WHEN type_operation = 'depot' THEN montant ELSE 0 END), 0) AS total_depots
            FROM caisse_cgm_operations
            ${whereClause}
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `;

        const [results] = await pool.execute(query, params);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'évolution de la caisse CGM:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'évolution de la caisse CGM',
            message: error.message
        });
    }
});

// Récupérer les détails des honoraires d'un client spécifique pour une période donnée
router.get('/client-details', async (req, res) => {
    try {
        const {
            clientId,
            startDate,
            endDate
        } = req.query;

        // Vérifier que les paramètres requis sont fournis
        if (!clientId) {
            return res.status(400).json({
                error: 'Le paramètre clientId est requis'
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Les paramètres startDate et endDate sont requis'
            });
        }

        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';

        // Requête SQL pour récupérer les détails du client
        const query = `
            SELECT
                DATE(cm.date) as date,
                c.nom as client_nom,
                ${selectPrenom},
                cm.montant,
                cm.libelle as description,
                cm.id as charge_id
            FROM charges_mensuelles cm
            JOIN client c ON cm.client_id = c.id
            WHERE cm.client_id = ? 
            AND DATE(cm.date) >= ? 
            AND DATE(cm.date) <= ?
            ORDER BY cm.date ASC
        `;

        const [results] = await pool.execute(query, [clientId, startDate, endDate]);

        // Calculer le total
        const total = results.reduce((sum, row) => sum + parseFloat(row.montant), 0);

        res.json({
            success: true,
            data: {
                client: results.length > 0 ? {
                    id: clientId,
                    nom: results[0].client_nom,
                    prenom: results[0].client_prenom
                } : null,
                period: {
                    startDate,
                    endDate
                },
                transactions: results,
                total: total
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des détails du client:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des détails du client',
            message: error.message
        });
    }
});

// Récupérer l'état par bénéficiaire (Total honoraires - Dépenses du bénéficiaire)
router.get('/etat-beneficiaire', async (req, res) => {
    try {
        const { beneficiaire, startDate, endDate } = req.query;

        // Vérifier que les paramètres requis sont fournis
        if (!beneficiaire) {
            return res.status(400).json({
                error: 'Le paramètre beneficiaire est requis'
            });
        }

        // Récupérer le total des honoraires reçus
        let honorairesQuery = `
            SELECT 
                SUM(cm.avance) as total_honoraires,
                COUNT(cm.id) as nombre_honoraires
            FROM charges_mensuelles cm
            WHERE (cm.libelle LIKE '%Honoraires reçu%' OR cm.libelle LIKE '%AVANCE DE DECLARATION%')
        `;
        const honorairesParams = [];

        // Ajouter le filtre par période si spécifié
        if (startDate && endDate) {
            honorairesQuery += ' AND DATE(cm.date) >= ? AND DATE(cm.date) <= ?';
            honorairesParams.push(startDate, endDate);
        }

        const [honorairesResult] = await pool.execute(honorairesQuery, honorairesParams);
        const totalHonoraires = honorairesResult[0].total_honoraires || 0;
        const nombreHonoraires = honorairesResult[0].nombre_honoraires || 0;

        // Récupérer les dépenses du bénéficiaire depuis beneficiaires_bureau
        let depensesQuery = `
            SELECT 
                SUM(montant) as total_depenses,
                COUNT(id) as nombre_depenses
            FROM beneficiaires_bureau
            WHERE nom_beneficiaire = ?
        `;
        const depensesParams = [beneficiaire];

        // Ajouter le filtre par période si spécifié
        if (startDate && endDate) {
            depensesQuery += ' AND DATE(date_operation) >= ? AND DATE(date_operation) <= ?';
            depensesParams.push(startDate, endDate);
        }

        const [depensesResult] = await pool.execute(depensesQuery, depensesParams);
        const totalDepenses = depensesResult[0].total_depenses || 0;
        const nombreDepenses = depensesResult[0].nombre_depenses || 0;

        // Récupérer les détails des dépenses du bénéficiaire
        let depensesDetailsQuery = `
            SELECT 
                id,
                date_operation as date,
                libelle as description,
                nom_beneficiaire as beneficiaire,
                montant
            FROM beneficiaires_bureau
            WHERE nom_beneficiaire = ?
        `;
        const depensesDetailsParams = [beneficiaire];

        // Ajouter le filtre par période si spécifié
        if (startDate && endDate) {
            depensesDetailsQuery += ' AND DATE(date_operation) >= ? AND DATE(date_operation) <= ?';
            depensesDetailsParams.push(startDate, endDate);
        }

        depensesDetailsQuery += ' ORDER BY date_operation DESC';

        const [depensesDetails] = await pool.execute(depensesDetailsQuery, depensesDetailsParams);

        // Calculer le solde (Total honoraires - Dépenses du bénéficiaire)
        const solde = totalHonoraires - totalDepenses;

        res.json({
            success: true,
            data: {
                beneficiaire: beneficiaire,
                period: startDate && endDate ? { startDate, endDate } : null,
                honoraires: {
                    total: totalHonoraires,
                    count: nombreHonoraires
                },
                depenses: {
                    total: totalDepenses,
                    count: nombreDepenses,
                    details: depensesDetails
                },
                solde: solde
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'état par bénéficiaire:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'état par bénéficiaire',
            message: error.message
        });
    }
});

module.exports = router;
