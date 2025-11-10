const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Ajouter une nouvelle dépense
router.post('/', async (req, res) => {
    try {
        const { date, beneficiaire, montant, description, type, client_id, charge_id } = req.body;

        // Validation des champs obligatoires
        if (!beneficiaire || !montant) {
            return res.status(400).json({
                error: 'Beneficiaire et montant sont obligatoires'
            });
        }

        // Validation du montant
        if (isNaN(montant) || parseFloat(montant) <= 0) {
            return res.status(400).json({
                error: 'Le montant doit être un nombre positif'
            });
        }

        const depenseType = (type === 'client' ? 'client' : 'bureau');

        // Protection contre doublons côté CLIENT: (client_id, charge_id) uniques
        if (depenseType === 'client' && client_id && charge_id) {
            const [existing] = await pool.execute(
                'SELECT id FROM depenses_client WHERE client_id = ? AND charge_id = ? LIMIT 1',
                [client_id, charge_id]
            );
            if (existing.length > 0) {
                return res.json({
                    success: true,
                    message: 'Dépense client déjà enregistrée pour cette charge',
                    depense: { id: existing[0].id, client_id, charge_id }
                });
            }
        }

        if (depenseType === 'bureau') {
            // Protection légère contre doublons bureau: même jour, même bénéficiaire, même libellé et montant
            if (beneficiaire && (description || '') && montant) {
                const [dup] = await pool.execute(`
                    SELECT id FROM beneficiaires_bureau 
                    WHERE nom_beneficiaire = ? 
                      AND libelle = ? 
                      AND montant = ? 
                      AND DATE(date_operation) = DATE(?)
                    LIMIT 1
                `, [beneficiaire, description || null, parseFloat(montant), (date || new Date().toISOString().slice(0, 10))]);
                if (dup.length > 0) {
                    return res.json({
                        success: true,
                        message: 'Dépense bureau déjà enregistrée (même jour/libellé/montant/bénéficiaire)',
                        depense: { id: dup[0].id }
                    });
                }
            }
            // Stocker uniquement dans beneficiaires_bureau (pas dans depenses)
            const [resBureau] = await pool.execute(`
                INSERT INTO beneficiaires_bureau (nom_beneficiaire, libelle, montant, date_operation)
                VALUES (?, ?, ?, ?)
            `, [
                beneficiaire,
                description || null,
                parseFloat(montant),
                (date || new Date().toISOString().slice(0, 10))
            ]);

            // Créer automatiquement une opération de retrait dans la caisse CGM
            try {
                // S'assurer que la table caisse_cgm_operations existe
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS caisse_cgm_operations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        type_operation ENUM('retrait', 'depot', 'paiement_client', 'autre') NOT NULL DEFAULT 'retrait',
                        montant DECIMAL(10, 3) NOT NULL,
                        montant_avant DECIMAL(10, 3) NOT NULL,
                        montant_apres DECIMAL(10, 3) NOT NULL,
                        commentaire TEXT,
                        user_id INT,
                        client_id INT NULL,
                        operation_sign ENUM('plus','moins') DEFAULT 'moins',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_type_operation (type_operation),
                        INDEX idx_user_id (user_id),
                        INDEX idx_client_id (client_id),
                        INDEX idx_created_at (created_at),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                        FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                `);

                // Calculer le solde actuel (honoraires reçus + dépôts - retraits)
                // Note: on exclut les dépenses bureau du calcul car on va créer une opération pour celle-ci
                const [soldeInitial] = await pool.execute(`
                    SELECT COALESCE(SUM(GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0))), 0) AS total_caisse
                    FROM charges_mensuelles ch
                    WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
                    AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
                `);
                const soldeBase = parseFloat(soldeInitial[0]?.total_caisse || 0);

                const [retraits] = await pool.execute(`
                    SELECT COALESCE(SUM(montant), 0) AS total_retraits
                    FROM caisse_cgm_operations
                    WHERE type_operation IN ('retrait', 'paiement_client')
                `);
                const totalRetraits = parseFloat(retraits[0]?.total_retraits || 0);

                const [depots] = await pool.execute(`
                    SELECT COALESCE(SUM(montant), 0) AS total_depots
                    FROM caisse_cgm_operations
                    WHERE type_operation = 'depot'
                `);
                const totalDepots = parseFloat(depots[0]?.total_depots || 0);

                // Calculer le solde actuel AVANT cette nouvelle dépense bureau
                const soldeActuel = soldeBase + totalDepots - totalRetraits;
                const montantAvant = soldeActuel;
                const montantOperation = parseFloat(montant);
                const montantApres = montantAvant - montantOperation;

                // Créer l'opération de retrait pour la dépense bureau
                // Format: "BUREAU - [bénéficiaire] - [description]" pour identification facile
                const commentaireDepense = description 
                    ? `BUREAU - ${beneficiaire || ''} - ${description}`.trim()
                    : `BUREAU - ${beneficiaire || 'Dépense bureau'}`;

                // Récupérer le user_id depuis req.body ou req.headers
                const userId = req.body.user_id || req.headers['user-id'] || null;
                
                await pool.execute(`
                    INSERT INTO caisse_cgm_operations 
                    (type_operation, montant, montant_avant, montant_apres, commentaire, user_id, operation_sign)
                    VALUES (?, ?, ?, ?, ?, ?, 'moins')
                `, [
                    'retrait',
                    montantOperation,
                    montantAvant,
                    montantApres,
                    commentaireDepense,
                    userId
                ]);
            } catch (caisseError) {
                // Logger l'erreur mais ne pas bloquer l'ajout de la dépense bureau
                console.error('Erreur lors de la création de l\'opération CGM pour la dépense bureau:', caisseError);
            }

            return res.json({
                success: true,
                message: 'Dépense bureau ajoutée avec succès et retrait CGM créé automatiquement',
                depense: {
                    id: resBureau.insertId,
                    date: date || new Date().toISOString().slice(0, 10),
                    beneficiaire,
                    montant: parseFloat(montant),
                    description: description || null,
                    type: 'bureau'
                }
            });
        }

        // Cas client: on stocke dans depenses_client (nouvelle table)
        const [result] = await pool.execute(`
            INSERT INTO depenses_client (date, libelle, client, montant, notes, type, client_id, charge_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            date || new Date().toISOString().slice(0, 10),
            description || null,
            beneficiaire,
            parseFloat(montant),
            null,
            'client',
            client_id || null,
            charge_id || null
        ]);

        res.json({
            success: true,
            message: 'Dépense ajoutée avec succès',
            depense: {
                id: result.insertId,
                date: date || new Date().toISOString().slice(0, 10),
                beneficiaire,
                montant: parseFloat(montant),
                description: description || null,
                type: 'client',
                client_id: client_id || null,
                charge_id: charge_id || null
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de la dépense:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'ajout de la dépense',
            message: error.message
        });
    }
});

// Récupérer toutes les dépenses bureau depuis beneficiaires_bureau
router.get('/bureau', async (req, res) => {
    try {
        // Récupérer uniquement les dépenses bureau de beneficiaires_bureau
        // Ne plus injecter automatiquement les HONORAIRES REÇU ici.
        const [rows] = await pool.execute(`
            SELECT id, date_operation as date, libelle as description, nom_beneficiaire as beneficiaire, montant
            FROM beneficiaires_bureau
            ORDER BY date_operation DESC, nom_beneficiaire ASC
        `);

        const totalMontant = rows.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({ success: true, depenses: rows, total: totalMontant, count: rows.length });
    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses bureau:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des dépenses bureau', message: error.message });
    }
});

// Récupérer les dépenses bureau par période
router.get('/bureau/par-periode', async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        if (!date_debut || !date_fin) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres manquants: date_debut, date_fin requis'
            });
        }

        // Valider le format des dates (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date_debut) || !dateRegex.test(date_fin)) {
            return res.status(400).json({
                success: false,
                error: 'Format de date invalide. Utilisez le format YYYY-MM-DD (ex: 2025-11-03)'
            });
        }

        // Vérifier que date_debut <= date_fin
        if (new Date(date_debut) > new Date(date_fin)) {
            return res.status(400).json({
                success: false,
                error: 'La date de début doit être antérieure ou égale à la date de fin'
            });
        }

        // Récupérer uniquement les dépenses bureau de beneficiaires_bureau
        // Ne plus injecter automatiquement les HONORAIRES REÇU ici.
        const [rows] = await pool.execute(`
            SELECT 
                bb.id, 
                bb.date_operation as date, 
                bb.libelle as description, 
                bb.nom_beneficiaire as beneficiaire, 
                bb.montant,
                bb.nom_beneficiaire as client
            FROM beneficiaires_bureau bb
            WHERE DATE(bb.date_operation) >= ? AND DATE(bb.date_operation) <= ?
            ORDER BY bb.date_operation ASC, bb.nom_beneficiaire ASC
        `, [date_debut, date_fin]);

        const totalMontant = rows.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({
            success: true,
            depenses: rows,
            total: totalMontant,
            count: rows.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses bureau par période:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la récupération des dépenses bureau', 
            message: error.message 
        });
    }
});

// Supprimer une dépense bureau depuis beneficiaires_bureau
router.delete('/bureau/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool.execute('SELECT id FROM beneficiaires_bureau WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Dépense bureau non trouvée' });
        }
        await pool.execute('DELETE FROM beneficiaires_bureau WHERE id = ?', [id]);
        res.json({ success: true, message: 'Dépense bureau supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression dépense bureau:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression', message: error.message });
    }
});

// Retirer une dépense bureau (pour le bouton "Retour au charge")
router.post('/retirer-bureau', async (req, res) => {
    try {
        const { depense_id } = req.body;

        if (!depense_id) {
            return res.status(400).json({ error: 'ID de dépense manquant' });
        }

        // Vérifier que la dépense existe
        const [existing] = await pool.execute('SELECT id FROM beneficiaires_bureau WHERE id = ?', [depense_id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Dépense bureau non trouvée' });
        }

        // Supprimer la dépense
        await pool.execute('DELETE FROM beneficiaires_bureau WHERE id = ?', [depense_id]);

        res.json({ success: true, message: 'Dépense retirée des dépenses bureau avec succès' });
    } catch (error) {
        console.error('Erreur lors du retrait de la dépense bureau:', error);
        res.status(500).json({ error: 'Erreur lors du retrait de la dépense', message: error.message });
    }
});

// Liste des bénéficiaires (distinct) pour les dépenses bureau
router.get('/bureau/beneficiaires', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                nom_beneficiaire AS beneficiaire,
                COUNT(*) AS count,
                SUM(montant) AS total
            FROM beneficiaires_bureau
            WHERE nom_beneficiaire IS NOT NULL AND nom_beneficiaire <> ''
            GROUP BY nom_beneficiaire
            ORDER BY nom_beneficiaire ASC
        `);
        res.json({ success: true, beneficiaires: rows });
    } catch (error) {
        console.error('Erreur lors de la récupération des bénéficiaires bureau:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des bénéficiaires' });
    }
});
// Récupérer toutes les dépenses avec filtres optionnels
router.get('/', async (req, res) => {
    try {
        const {
            type,
            client_id,
            charge_id,
            date_debut,
            date_fin,
            date,
            mois,
            annee,
            limit = 100,
            offset = 0,
            all = false // Nouveau paramètre pour récupérer toutes les dépenses (client + bureau)
        } = req.query;

        // Si all=true, récupérer toutes les dépenses (client + bureau)
        if (all === 'true') {
            // Récupérer les dépenses client
            let clientQuery = `
                SELECT id, date, libelle, libelle as description, client, montant, notes, type, client_id, charge_id, 'client' as source
                FROM depenses_client
                WHERE 1=1`;
            const clientParams = [];

            if (type) {
                clientQuery += ' AND type = ?';
                clientParams.push(type);
            }
            if (client_id) {
                clientQuery += ' AND client_id = ?';
                clientParams.push(client_id);
            }
            if (charge_id) {
                clientQuery += ' AND charge_id = ?';
                clientParams.push(charge_id);
            }

            // Filtrer par période pour les dépenses client
            if (date_debut && date_fin) {
                clientQuery += ' AND DATE(date) >= ? AND DATE(date) <= ?';
                clientParams.push(date_debut, date_fin);
            } else if (date) {
                clientQuery += ' AND DATE(date) = ?';
                clientParams.push(date);
            } else if (mois && annee) {
                clientQuery += ' AND MONTH(date) = ? AND YEAR(date) = ?';
                clientParams.push(mois, annee);
            } else if (annee) {
                clientQuery += ' AND YEAR(date) = ?';
                clientParams.push(annee);
            }

            // Récupérer les dépenses bureau
            let bureauQuery = `
                SELECT id, date_operation as date, libelle as description, libelle, nom_beneficiaire as client, montant, notes, 'bureau' as type, null as client_id, null as charge_id, 'bureau' as source
                FROM beneficiaires_bureau
                WHERE 1=1`;
            const bureauParams = [];

            // Filtrer par période pour les dépenses bureau
            if (date_debut && date_fin) {
                bureauQuery += ' AND DATE(date_operation) >= ? AND DATE(date_operation) <= ?';
                bureauParams.push(date_debut, date_fin);
            } else if (date) {
                bureauQuery += ' AND DATE(date_operation) = ?';
                bureauParams.push(date);
            } else if (mois && annee) {
                bureauQuery += ' AND MONTH(date_operation) = ? AND YEAR(date_operation) = ?';
                bureauParams.push(mois, annee);
            } else if (annee) {
                bureauQuery += ' AND YEAR(date_operation) = ?';
                bureauParams.push(annee);
            }

            // Exécuter les deux requêtes
            const [clientDepenses] = await pool.execute(clientQuery, clientParams);
            const [bureauDepenses] = await pool.execute(bureauQuery, bureauParams);

            // Combiner les résultats
            const allDepenses = [...clientDepenses, ...bureauDepenses].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Tri décroissant par date
            });

            const totalMontant = allDepenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

            res.json({
                success: true,
                depenses: allDepenses,
                total: totalMontant,
                count: allDepenses.length
            });

        } else {
            // Comportement original : seulement les dépenses client
            let query = `
                SELECT id, date, libelle, libelle as description, client, montant, notes, type, client_id, charge_id
                FROM depenses_client
                WHERE 1=1`;
            const params = [];

            if (type) {
                query += ' AND type = ?';
                params.push(String(type));
            }
            if (client_id) {
                query += ' AND client_id = ?';
                params.push(parseInt(client_id));
            }
            if (charge_id) {
                query += ' AND charge_id = ?';
                params.push(parseInt(charge_id));
            }

            // Filtrer par période
            if (date_debut && date_fin) {
                query += ' AND DATE(date) >= ? AND DATE(date) <= ?';
                params.push(date_debut, date_fin);
            } else if (date) {
                query += ' AND DATE(date) = ?';
                params.push(date);
            } else if (mois && annee) {
                query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
                params.push(parseInt(mois), parseInt(annee));
            } else if (annee) {
                query += ' AND YEAR(date) = ?';
                params.push(parseInt(annee));
            }

            query += ' ORDER BY date DESC, client ASC';

            // Ajouter LIMIT et OFFSET si spécifiés
            if (limit && offset) {
                query += ' LIMIT ? OFFSET ?';
                params.push(parseInt(limit), parseInt(offset));
            }

            const [depenses] = await pool.execute(query, params);

            const totalMontant = depenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

            res.json({
                success: true,
                depenses,
                total: totalMontant,
                count: depenses.length
            });
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses',
            message: error.message
        });
    }
});

// Récupérer la liste des bénéficiaires uniques
router.get('/beneficiaires', async (req, res) => {
    try {
        const { type } = req.query;

        let query = `
            SELECT 
                client as beneficiaire,
                COUNT(*) as count,
                SUM(montant) as total
            FROM depenses_client
            WHERE client IS NOT NULL AND client != ''
        `;
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(String(type));
        }

        query += ' GROUP BY client ORDER BY client ASC';

        const [beneficiaires] = await pool.execute(query, params);

        res.json({
            success: true,
            beneficiaires
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des bénéficiaires:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des bénéficiaires',
            message: error.message
        });
    }
});

// Récupérer les dépenses par jour
router.get('/par-jour', async (req, res) => {
    try {
        const { date, client_id, type } = req.query;

        if (!date) {
            return res.status(400).json({
                error: 'Paramètre manquant: date requis'
            });
        }

        let query = `
            SELECT id, date, libelle, libelle as description, client, montant, notes
            FROM depenses_client
            WHERE DATE(date) = ?`;
        const params = [date];
        if (type) { query += ' AND type = ?'; params.push(type); }
        if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
        query += ' ORDER BY date ASC, client ASC';
        const [depenses] = await pool.execute(query, params);

        const totalMontant = depenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({
            success: true,
            depenses,
            total: totalMontant
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses par jour:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses',
            message: error.message
        });
    }
});

// Récupérer les dépenses par mois
router.get('/par-mois', async (req, res) => {
    try {
        const { mois, annee, client_id, type } = req.query;

        if (!mois || !annee) {
            return res.status(400).json({
                error: 'Paramètres manquants: mois, annee requis'
            });
        }

        let query = `
            SELECT id, date, libelle, libelle as description, client, montant, notes
            FROM depenses_client
            WHERE MONTH(date) = ? AND YEAR(date) = ?`;
        const params = [mois, annee];
        if (type) { query += ' AND type = ?'; params.push(type); }
        if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
        query += ' ORDER BY date ASC, client ASC';
        const [depenses] = await pool.execute(query, params);

        const totalMontant = depenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({
            success: true,
            depenses,
            total: totalMontant
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses par mois:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses',
            message: error.message
        });
    }
});

// Récupérer les dépenses par année
router.get('/par-annee', async (req, res) => {
    try {
        const { annee, client_id, type } = req.query;

        if (!annee) {
            return res.status(400).json({
                error: 'Paramètre manquant: annee requis'
            });
        }

        let query = `
            SELECT id, date, libelle, libelle as description, client, montant, notes
            FROM depenses_client
            WHERE YEAR(date) = ?`;
        const params = [annee];
        if (type) { query += ' AND type = ?'; params.push(type); }
        if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
        query += ' ORDER BY date ASC, client ASC';
        const [depenses] = await pool.execute(query, params);

        const totalMontant = depenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({
            success: true,
            depenses,
            total: totalMontant
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses par année:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses',
            message: error.message
        });
    }
});

// Récupérer les dépenses d'un client
router.get('/par-client', async (req, res) => {
    try {
        const {
            client_id,
            date,
            mois,
            annee,
            date_debut,
            date_fin
        } = req.query;

        if (!client_id) {
            return res.status(400).json({ error: 'Paramètre manquant: client_id' });
        }

        let query = `
            SELECT id, date, libelle, libelle as description, client, montant, notes
            FROM depenses_client
            WHERE type = 'client' AND client_id = ?`;
        const params = [client_id];

        // Ajouter les filtres de date selon le type de filtre
        if (date) {
            query += ' AND DATE(date) = ?';
            params.push(date);
        } else if (mois && annee) {
            query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
            params.push(mois, annee);
        } else if (annee) {
            query += ' AND YEAR(date) = ?';
            params.push(annee);
        } else if (date_debut && date_fin) {
            query += ' AND DATE(date) >= ? AND DATE(date) <= ?';
            params.push(date_debut, date_fin);
        }

        query += ' ORDER BY date ASC';

        const [depenses] = await pool.execute(query, params);

        res.json({ success: true, depenses });
    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses client:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
    }
});

// Cette route est maintenant gérée par la première route GET '/' ci-dessus
// Suppression de cette route dupliquée pour éviter les conflits

// Récupérer les dépenses par période
router.get('/par-periode', async (req, res) => {
    try {
        const { date_debut, date_fin, client_id, type } = req.query;

        if (!date_debut || !date_fin) {
            return res.status(400).json({
                error: 'Paramètres manquants: date_debut, date_fin requis'
            });
        }

        // Construire la requête avec filtres optionnels
        let query = `
            SELECT 
                id,
                date,
                libelle,
                libelle as description,
                client,
                montant,
                notes,
                type,
                client_id,
                charge_id
            FROM depenses_client
            WHERE DATE(date) >= ? AND DATE(date) <= ?`;

        const params = [date_debut, date_fin];

        // Ajouter le filtre par type si spécifié
        if (type) {
            query += ' AND type = ?';
            params.push(String(type));
        }

        // Ajouter le filtre par client si spécifié
        if (client_id) {
            query += ' AND client_id = ?';
            params.push(parseInt(client_id));
        }

        query += ' ORDER BY date ASC, client ASC';

        const [depenses] = await pool.execute(query, params);

        const totalMontant = depenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

        res.json({
            success: true,
            depenses,
            total: totalMontant
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des dépenses par période:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des dépenses',
            message: error.message
        });
    }
});

// Récupérer une dépense par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [depenses] = await pool.execute(`
            SELECT 
                id,
                date,
                libelle,
                libelle as description,
                client,
                montant,
                notes
            FROM depenses_client
            WHERE id = ?
        `, [id]);

        if (depenses.length === 0) {
            return res.status(404).json({
                error: 'Dépense non trouvée'
            });
        }

        res.json({
            success: true,
            depense: depenses[0]
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la dépense:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de la dépense',
            message: error.message
        });
    }
});

// Modifier une dépense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, beneficiaire, montant, description } = req.body;

        // Validation des champs obligatoires
        if (!beneficiaire || !montant) {
            return res.status(400).json({
                error: 'Beneficiaire et montant sont obligatoires'
            });
        }

        // Validation du montant
        if (isNaN(montant) || parseFloat(montant) <= 0) {
            return res.status(400).json({
                error: 'Le montant doit être un nombre positif'
            });
        }

        // Vérifier que la dépense existe
        const [existingDepense] = await pool.execute(`
            SELECT id FROM depenses_client WHERE id = ?
        `, [id]);

        if (existingDepense.length === 0) {
            return res.status(404).json({
                error: 'Dépense non trouvée'
            });
        }

        // Mettre à jour la dépense
        await pool.execute(`
            UPDATE depenses_client 
            SET date = ?, libelle = ?, client = ?, montant = ?, notes = ?
            WHERE id = ?
        `, [
            date,
            description,
            beneficiaire,
            parseFloat(montant),
            null,
            id
        ]);

        res.json({
            success: true,
            message: 'Dépense modifiée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la modification de la dépense:', error);
        res.status(500).json({
            error: 'Erreur lors de la modification de la dépense',
            message: error.message
        });
    }
});

// Supprimer une dépense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que la dépense existe
        const [existingDepense] = await pool.execute(`
            SELECT id FROM depenses_client WHERE id = ?
        `, [id]);

        if (existingDepense.length === 0) {
            return res.status(404).json({
                error: 'Dépense non trouvée'
            });
        }

        // Supprimer la dépense
        await pool.execute(`
            DELETE FROM depenses_client WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Dépense supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la dépense:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression de la dépense',
            message: error.message
        });
    }
});

module.exports = router;
