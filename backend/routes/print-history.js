const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Enregistrer une impression de reçu
router.post('/', async (req, res) => {
    try {
        const {
            client_id,
            client_nom,
            client_prenom,
            montant,
            caissier_username,
            type_reçu = 'honoraires'
        } = req.body;

        // Validation des champs obligatoires
        if (!client_id || !client_nom || !client_prenom || !montant || !caissier_username) {
            return res.status(400).json({
                error: 'Tous les champs sont obligatoires'
            });
        }

        // Insérer l'enregistrement d'impression
        const [result] = await pool.execute(`
            INSERT INTO print_history (client_id, client_nom, client_prenom, montant, caissier_username, type_reçu)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [client_id, client_nom, client_prenom, montant, caissier_username, type_reçu]);

        res.json({
            success: true,
            message: 'Impression enregistrée avec succès',
            print_id: result.insertId
        });

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'impression:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'enregistrement de l\'impression',
            message: error.message
        });
    }
});

// Récupérer l'historique des impressions
router.get('/', async (req, res) => {
    try {
        const {
            limit = 100,
            offset = 0,
            client_id,
            caissier_username,
            date_debut,
            date_fin,
            type_reçu
        } = req.query;

        let query = `
            SELECT 
                id,
                date_impression,
                client_id,
                client_nom,
                client_prenom,
                montant,
                caissier_username,
                type_reçu,
                created_at
            FROM print_history
            WHERE 1=1
        `;
        const params = [];

        // Filtres optionnels
        if (client_id) {
            query += ' AND client_id = ?';
            params.push(client_id);
        }

        if (caissier_username) {
            query += ' AND caissier_username = ?';
            params.push(caissier_username);
        }

        if (date_debut && date_fin) {
            query += ' AND DATE(date_impression) >= ? AND DATE(date_impression) <= ?';
            params.push(date_debut, date_fin);
        }

        if (type_reçu) {
            query += ' AND type_reçu = ?';
            params.push(type_reçu);
        }

        query += ' ORDER BY date_impression DESC';

        // Ajouter LIMIT et OFFSET
        if (limit && offset) {
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
        }

        const [results] = await pool.execute(query, params);

        // Récupérer le total des enregistrements
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM print_history 
            WHERE 1=1
        `;
        const countParams = [];

        if (client_id) {
            countQuery += ' AND client_id = ?';
            countParams.push(client_id);
        }

        if (caissier_username) {
            countQuery += ' AND caissier_username = ?';
            countParams.push(caissier_username);
        }

        if (date_debut && date_fin) {
            countQuery += ' AND DATE(date_impression) >= ? AND DATE(date_impression) <= ?';
            countParams.push(date_debut, date_fin);
        }

        if (type_reçu) {
            countQuery += ' AND type_reçu = ?';
            countParams.push(type_reçu);
        }

        const [countResult] = await pool.execute(countQuery, countParams);

        res.json({
            success: true,
            data: results,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des impressions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'historique des impressions',
            message: error.message
        });
    }
});

// Supprimer une ligne d'historique
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM print_history WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Enregistrement non trouvé' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'historique:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Supprimer en masse selon filtres optionnels (année/mois/caissier)
router.delete('/', async (req, res) => {
    try {
        const { caissier_username, date_debut, date_fin } = req.query;

        let query = 'DELETE FROM print_history WHERE 1=1';
        const params = [];

        if (caissier_username) {
            query += ' AND caissier_username = ?';
            params.push(caissier_username);
        }
        if (date_debut && date_fin) {
            query += ' AND DATE(date_impression) >= ? AND DATE(date_impression) <= ?';
            params.push(date_debut, date_fin);
        }

        const [result] = await pool.execute(query, params);
        res.json({ success: true, deleted: result.affectedRows });
    } catch (error) {
        console.error('Erreur lors de la suppression en masse:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Récupérer les statistiques des impressions
router.get('/statistics', async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        let whereClause = '';
        const params = [];

        if (date_debut && date_fin) {
            whereClause = 'WHERE DATE(date_impression) >= ? AND DATE(date_impression) <= ?';
            params.push(date_debut, date_fin);
        }

        // Statistiques générales
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_impressions,
                COUNT(DISTINCT client_id) as clients_uniques,
                COUNT(DISTINCT caissier_username) as caissiers_uniques,
                SUM(montant) as montant_total
            FROM print_history
            ${whereClause}
        `, params);

        // Top 5 des clients les plus imprimés
        const [topClients] = await pool.execute(`
            SELECT 
                client_id,
                client_nom,
                client_prenom,
                COUNT(*) as nombre_impressions,
                SUM(montant) as montant_total
            FROM print_history
            ${whereClause}
            GROUP BY client_id, client_nom, client_prenom
            ORDER BY nombre_impressions DESC
            LIMIT 5
        `, params);

        // Top 5 des caissiers
        const [topCaissiers] = await pool.execute(`
            SELECT 
                caissier_username,
                COUNT(*) as nombre_impressions,
                SUM(montant) as montant_total
            FROM print_history
            ${whereClause}
            GROUP BY caissier_username
            ORDER BY nombre_impressions DESC
            LIMIT 5
        `, params);

        res.json({
            success: true,
            data: {
                general: stats[0],
                top_clients: topClients,
                top_caissiers: topCaissiers
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques',
            message: error.message
        });
    }
});

module.exports = router;
