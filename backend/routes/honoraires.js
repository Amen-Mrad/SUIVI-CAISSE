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

// Récupérer le total de la Caisse CGM (somme des HONORAIRES REÇU uniquement)
router.get('/caisse-total', async (req, res) => {
    try {
        const [result] = await pool.execute(`
            SELECT COALESCE(SUM(GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0))), 0) AS total_caisse
            FROM charges_mensuelles ch
            WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
            AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
        `);

        const totalCaisse = result[0]?.total_caisse || 0;

        res.json({
            success: true,
            total_caisse: parseFloat(totalCaisse),
            message: 'Total de la caisse CGM récupéré avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du total de la caisse:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du total de la caisse',
            message: error.message
        });
    }
});

// Récupérer la Caisse CGM en temps réel = Somme des HONORAIRES REÇU uniquement
router.get('/caisse-live', async (req, res) => {
    try {
        // Total honoraires reçus (libellé contient HONORAIRES REÇU)
        // Utiliser avance en priorité, sinon montant, pour capturer tous les honoraires
        const [sumRows] = await pool.execute(`
            SELECT COALESCE(SUM(GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0))), 0) AS total_honoraires
            FROM charges_mensuelles ch
            WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
            AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
        `);

        const totalHonoraires = parseFloat(sumRows[0]?.total_honoraires || 0);

        // Log pour déboguer
        console.log('Caisse CGM Live - Total honoraires calculé:', totalHonoraires);

        // Derniers mouvements (honoraires reçus) avec infos de base
        const [recentRows] = await pool.execute(`
            SELECT ch.id, ch.date, ch.libelle, ch.avance, ch.montant, ch.client_id,
                   COALESCE(CONCAT(cl.prenom, ' ', cl.nom), '') AS client_name,
                   GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0)) AS montant_total
            FROM charges_mensuelles ch
            LEFT JOIN client cl ON cl.id = ch.client_id
            WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
            AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
            ORDER BY ch.date DESC, ch.date_creation DESC
            LIMIT 10
        `);

        // Log pour déboguer
        console.log('Caisse CGM Live - Nombre d\'honoraires trouvés:', recentRows.length);
        if (recentRows.length > 0) {
            console.log('Exemples de libellés trouvés:', recentRows.map(r => ({ libelle: r.libelle, avance: r.avance })));
        }

        res.json({
            success: true,
            total_caisse: totalHonoraires,
            total_honoraires: totalHonoraires,
            count: recentRows.length,
            recent: recentRows
        });
    } catch (error) {
        console.error('Erreur lors du calcul de la caisse live:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du calcul de la caisse live',
            message: error.message
        });
    }
});

// Récupérer tous les honoraires avec filtres optionnels
router.get('/', async (req, res) => {
    try {
        const {
            type,
            client_id,
            libelle,
            date_debut,
            date_fin,
            date,
            mois,
            annee,
            limit = 100,
            offset = 0
        } = req.query;

        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        let query = `
            SELECT 
                ch.id,
                ch.date as date,
                ch.libelle as libelle,
                ch.montant,
                ch.avance as avance,
                0 as solde_restant,
                c.nom as client_nom,
                ${selectPrenom},
                c.username as client_username
            FROM charges_mensuelles ch
            JOIN client c ON ch.client_id = c.id
            WHERE 1=1`;
        const params = [];

        // Filtrer par libellé (pour les honoraires reçus)
        if (libelle) {
            query += ' AND ch.libelle LIKE ?';
            params.push(`%${libelle}%`);
        }

        // Filtrer par client
        if (client_id) {
            query += ' AND ch.client_id = ?';
            params.push(client_id);
        }

        // Filtrer par type (pour la compatibilité future)
        if (type) {
            // Pour l'instant, on ne filtre pas par type car les honoraires n'ont pas de type
            // Cette condition est là pour la compatibilité future
        }

        // Filtrer par période
        if (date_debut && date_fin) {
            query += ' AND DATE(ch.date) >= ? AND DATE(ch.date) <= ?';
            params.push(date_debut, date_fin);
        } else if (date) {
            query += ' AND DATE(ch.date) = ?';
            params.push(date);
        } else if (mois && annee) {
            query += ' AND MONTH(ch.date) = ? AND YEAR(ch.date) = ?';
            params.push(mois, annee);
        } else if (annee) {
            query += ' AND YEAR(ch.date) = ?';
            params.push(annee);
        }

        query += ' ORDER BY ch.date DESC, c.nom ASC, client_prenom ASC';

        // Ajouter LIMIT et OFFSET si spécifiés
        if (limit && offset) {
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
        }

        const [honoraires] = await pool.execute(query, params);

        // Calculer le total des montants
        const totalMontant = honoraires.reduce((sum, h) => sum + parseFloat(h.montant || 0), 0);

        res.json({
            success: true,
            honoraires,
            total: totalMontant,
            count: honoraires.length
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires',
            message: error.message
        });
    }
});

// Récupérer les honoraires par jour
router.get('/par-jour', async (req, res) => {
    try {
        const { libelle, date, client_id } = req.query;

        if (!libelle || !date) {
            return res.status(400).json({
                error: 'Paramètres manquants: libelle, date requis'
            });
        }

        // Récupérer les honoraires du jour spécifique pour tous les clients
        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        let query = `
      SELECT 
        ch.id,
        ch.date as date,
        ch.libelle as libelle,
        ch.montant,
        ch.avance as avance,
        0 as solde_restant,
        c.nom as client_nom,
        ${selectPrenom}
      FROM charges_mensuelles ch
      JOIN client c ON ch.client_id = c.id
      WHERE ch.libelle LIKE ?
        AND DATE(ch.date) = ?`;
        const params = [`%${libelle}%`, date];
        if (client_id) { query += ' AND ch.client_id = ?'; params.push(client_id); }
        query += ' ORDER BY c.nom ASC, client_prenom ASC, ch.date ASC';
        const [honoraires] = await pool.execute(query, params);

        res.json({
            success: true,
            honoraires,
            total: honoraires.reduce((sum, h) => sum + parseFloat(h.montant || 0), 0)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires par jour:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires',
            message: error.message
        });
    }
});

// Récupérer les honoraires par mois
router.get('/par-mois', async (req, res) => {
    try {
        const { libelle, mois, annee, client_id } = req.query;

        if (!libelle || !mois || !annee) {
            return res.status(400).json({
                error: 'Paramètres manquants: libelle, mois, annee requis'
            });
        }

        // Récupérer les honoraires du mois spécifique pour tous les clients
        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        let query = `
      SELECT 
        ch.id,
        ch.date as date,
        ch.libelle as libelle,
        ch.montant,
        ch.avance as avance,
        0 as solde_restant,
        c.nom as client_nom,
        ${selectPrenom}
      FROM charges_mensuelles ch
      JOIN client c ON ch.client_id = c.id
      WHERE ch.libelle LIKE ?
        AND MONTH(ch.date) = ?
        AND YEAR(ch.date) = ?`;
        const params = [`%${libelle}%`, mois, annee];
        if (client_id) { query += ' AND ch.client_id = ?'; params.push(client_id); }
        query += ' ORDER BY c.nom ASC, client_prenom ASC, ch.date ASC';
        const [honoraires] = await pool.execute(query, params);

        res.json({
            success: true,
            honoraires,
            total: honoraires.reduce((sum, h) => sum + parseFloat(h.montant || 0), 0)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires par mois:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires',
            message: error.message
        });
    }
});

// Récupérer les honoraires par année
router.get('/par-annee', async (req, res) => {
    try {
        const { libelle, annee, client_id } = req.query;

        if (!libelle || !annee) {
            return res.status(400).json({
                error: 'Paramètres manquants: libelle, annee requis'
            });
        }

        // Récupérer les honoraires de l'année spécifique pour tous les clients
        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        let query = `
      SELECT 
        ch.id,
        ch.date as date,
        ch.libelle as libelle,
        ch.montant,
        ch.avance as avance,
        0 as solde_restant,
        c.nom as client_nom,
        ${selectPrenom}
      FROM charges_mensuelles ch
      JOIN client c ON ch.client_id = c.id
      WHERE ch.libelle LIKE ?
        AND YEAR(ch.date) = ?`;
        const params = [`%${libelle}%`, annee];
        if (client_id) { query += ' AND ch.client_id = ?'; params.push(client_id); }
        query += ' ORDER BY c.nom ASC, client_prenom ASC, ch.date ASC';
        const [honoraires] = await pool.execute(query, params);

        res.json({
            success: true,
            honoraires,
            total: honoraires.reduce((sum, h) => sum + parseFloat(h.montant || 0), 0)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires par année:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires',
            message: error.message
        });
    }
});

// Récupérer tous les honoraires reçus d'un client (toutes dates)
router.get('/par-client', async (req, res) => {
    try {
        const { client_id } = req.query;
        if (!client_id) {
            return res.status(400).json({ error: 'Paramètre manquant: client_id' });
        }

        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        const [honoraires] = await pool.execute(`
      SELECT 
        ch.id,
        ch.date as date,
        ch.libelle as libelle,
        ch.montant,
        ch.avance as avance,
        0 as solde_restant,
        c.nom as client_nom,
        ${selectPrenom}
      FROM charges_mensuelles ch
      JOIN client c ON ch.client_id = c.id
      WHERE ch.client_id = ?
        AND (ch.libelle LIKE '%HONORAIRES REÇU%' OR ch.libelle LIKE '%AVANCE DE DECLARATION%')
      ORDER BY ch.date ASC
    `, [client_id]);

        res.json({ success: true, honoraires });
    } catch (error) {
        console.error('Erreur honoraires par client:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des honoraires' });
    }
});

// Récupérer les honoraires par période
router.get('/par-periode', async (req, res) => {
    try {
        const { libelle, date_debut, date_fin, client_id } = req.query;

        if (!libelle || !date_debut || !date_fin) {
            return res.status(400).json({
                error: 'Paramètres manquants: libelle, date_debut, date_fin requis'
            });
        }

        // Construire la requête avec filtre client optionnel
        const { hasPrenom } = await getClientCols();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        let query = `
            SELECT 
                ch.id,
                ch.date as date,
                ch.libelle as libelle,
                ch.montant,
                ch.avance as avance,
                0 as solde_restant,
                c.nom as client_nom,
                ${selectPrenom}
            FROM charges_mensuelles ch
            JOIN client c ON ch.client_id = c.id
            WHERE ch.libelle LIKE ?
                AND DATE(ch.date) >= ?
                AND DATE(ch.date) <= ?`;

        const params = [`%${libelle}%`, date_debut, date_fin];

        // Ajouter le filtre par client si spécifié
        if (client_id) {
            query += ' AND ch.client_id = ?';
            params.push(client_id);
        }

        query += ' ORDER BY c.nom ASC, client_prenom ASC, ch.date ASC';

        const [honoraires] = await pool.execute(query, params);

        res.json({
            success: true,
            honoraires,
            total: honoraires.reduce((sum, h) => sum + parseFloat(h.montant || 0), 0)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des honoraires par période:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des honoraires',
            message: error.message
        });
    }
});

// Cette route est maintenant gérée par la première route GET '/' ci-dessus
// Suppression de cette route dupliquée pour éviter les conflits

// Route de débogage pour vérifier les honoraires reçus dans la base
router.get('/debug-honoraires', async (req, res) => {
    try {
        // Récupérer toutes les charges avec leur libellé et avance
        const [allCharges] = await pool.execute(`
            SELECT ch.id, ch.libelle, ch.avance, ch.date, ch.client_id
            FROM charges_mensuelles ch
            ORDER BY ch.date DESC
            LIMIT 50
        `);

        // Filtrer celles qui pourraient être des honoraires reçus
        const possibleHonoraires = allCharges.filter(ch => {
            const libelleUpper = (ch.libelle || '').toUpperCase();
            return libelleUpper.includes('HONORAIRES') || libelleUpper.includes('HONO');
        });

        res.json({
            success: true,
            total_charges: allCharges.length,
            possible_honoraires: possibleHonoraires,
            message: 'Données de débogage'
        });
    } catch (error) {
        console.error('Erreur debug honoraires:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du débogage',
            message: error.message
        });
    }
});

module.exports = router;
