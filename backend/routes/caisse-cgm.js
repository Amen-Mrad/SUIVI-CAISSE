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

// Middleware pour obtenir l'utilisateur actuel (à adapter selon votre système d'auth)
const getCurrentUser = (req) => {
    // Pour l'instant, on récupère depuis les headers ou le body
    // À adapter selon votre système d'authentification
    return req.body.user_id || req.headers['user-id'] || null;
};

// Récupérer le solde actuel de la caisse CGM (somme des honoraires reçus)
async function getCaisseSolde() {
    try {
        const [result] = await pool.execute(`
            SELECT COALESCE(SUM(GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0))), 0) AS total_caisse
            FROM charges_mensuelles ch
            WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
            AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
        `);
        return parseFloat(result[0]?.total_caisse || 0);
    } catch (error) {
        console.error('Erreur lors du calcul du solde de la caisse:', error);
        return 0;
    }
}

// Vérifier si la table existe
async function tableExists() {
    try {
        await pool.execute('SELECT 1 FROM caisse_cgm_operations LIMIT 1');
        return true;
    } catch (error) {
        return false;
    }
}

// Créer la table si elle n'existe pas
async function ensureTableExists() {
    const exists = await tableExists();
    if (!exists) {
        try {
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
            console.log('Table caisse_cgm_operations créée avec succès');
        } catch (createError) {
            console.error('Erreur lors de la création de la table:', createError);
            throw createError;
        }
    }

    // Assurer la présence de la colonne operation_sign pour compatibilité
    try {
        await pool.execute("ALTER TABLE caisse_cgm_operations ADD COLUMN IF NOT EXISTS operation_sign ENUM('plus','moins') DEFAULT 'moins'");
    } catch (_) { /* ignore si déjà présente ou MySQL < 8.0 */ }
}

// Calculer le solde après toutes les opérations
async function getSoldeApresOperations() {
    try {
        // S'assurer que la table existe
        await ensureTableExists();

        const soldeInitial = await getCaisseSolde();

        // Calculer la somme de tous les retraits
        const [retraits] = await pool.execute(`
            SELECT COALESCE(SUM(montant), 0) AS total_retraits
            FROM caisse_cgm_operations
            WHERE type_operation IN ('retrait', 'paiement_client')
        `);

        const totalRetraits = parseFloat(retraits[0]?.total_retraits || 0);

        // Calculer la somme de tous les dépôts
        const [depots] = await pool.execute(`
            SELECT COALESCE(SUM(montant), 0) AS total_depots
            FROM caisse_cgm_operations
            WHERE type_operation = 'depot'
        `);

        const totalDepots = parseFloat(depots[0]?.total_depots || 0);

        // Calculer les dépenses bureau qui n'ont pas encore d'opération correspondante
        // (pour les anciennes dépenses bureau créées avant cette fonctionnalité)
        let totalDepensesBureauSansOperation = 0;
        try {
            // Compter le total des dépenses bureau
            const [totalBureau] = await pool.execute(`
                SELECT COALESCE(SUM(montant), 0) AS total_depenses_bureau
                FROM beneficiaires_bureau
            `);
            const totalDepensesBureau = parseFloat(totalBureau[0]?.total_depenses_bureau || 0);

            // Compter les opérations de retrait qui correspondent à des dépenses bureau
            // (on identifie les opérations bureau par leur commentaire qui contient le libellé)
            // Note: Cette méthode n'est pas parfaite, mais c'est la meilleure approximation
            // Pour une solution plus précise, on pourrait ajouter un champ depense_bureau_id dans caisse_cgm_operations
            const [opsBureau] = await pool.execute(`
                SELECT COALESCE(SUM(montant), 0) AS total_ops_bureau
                FROM caisse_cgm_operations
                WHERE type_operation = 'retrait'
                AND commentaire LIKE '%BUREAU%'
            `);
            const totalOpsBureau = parseFloat(opsBureau[0]?.total_ops_bureau || 0);

            // Si le total des dépenses bureau est supérieur aux opérations, on soustrait la différence
            // Cela couvre le cas des anciennes dépenses bureau sans opération
            if (totalDepensesBureau > totalOpsBureau) {
                totalDepensesBureauSansOperation = totalDepensesBureau - totalOpsBureau;
            }
        } catch (err) {
            // Si la table beneficiaires_bureau n'existe pas, ignorer
            console.warn('Table beneficiaires_bureau non trouvée, ignorée dans le calcul du solde');
        }

        return soldeInitial + totalDepots - totalRetraits - totalDepensesBureauSansOperation;
    } catch (error) {
        console.error('Erreur lors du calcul du solde après opérations:', error);
        // Si la table n'existe pas encore, retourner seulement le solde initial
        if (error.message && error.message.includes("doesn't exist")) {
            return await getCaisseSolde();
        }
        return 0;
    }
}

// Résoudre le client_id à partir de client_id direct ou d'un username
async function resolveClientId(client_id, client_username) {
    try {
        if (client_username) {
            const uname = String(client_username).trim();
            const [rows] = await pool.execute(
                'SELECT id FROM client WHERE username = ? OR id = ? LIMIT 1',
                [uname, uname]
            );
            if (rows.length > 0) return rows[0].id;
            return null;
        }
        return client_id || null;
    } catch (_) {
        return null;
    }
}

// GET - Récupérer toutes les opérations de caisse
router.get('/', async (req, res) => {
    try {
        // S'assurer que la table existe
        await ensureTableExists();

        const { hasPrenom } = await getClientColumns();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        const [operations] = await pool.execute(`
            SELECT 
                cco.id,
                cco.type_operation,
                cco.montant,
                cco.montant_avant,
                cco.montant_apres,
                cco.operation_sign,
                cco.commentaire,
                cco.client_id,
                cco.created_at,
                cco.updated_at,
                u.nom as user_nom,
                u.prenom as user_prenom,
                c.nom as client_nom,
                ${selectPrenom}
            FROM caisse_cgm_operations cco
            LEFT JOIN users u ON u.id = cco.user_id
            LEFT JOIN client c ON c.id = cco.client_id
            ORDER BY cco.created_at DESC
            LIMIT 100
        `);

        const soldeActuel = await getSoldeApresOperations();

        res.json({
            success: true,
            operations,
            solde_actuel: soldeActuel,
            count: operations.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des opérations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des opérations',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET - Récupérer le solde actuel
router.get('/solde', async (req, res) => {
    try {
        const soldeActuel = await getSoldeApresOperations();
        res.json({
            success: true,
            solde_actuel: soldeActuel
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du solde:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du solde',
            message: error.message
        });
    }
});

// POST - Ajouter une nouvelle opération (retrait/paiement client)
router.post('/', async (req, res) => {
    try {
        const { type_operation, montant, commentaire, client_id, client_username, operation_sign = 'moins', user_id, charge_id } = req.body;

        // Validation
        if (!type_operation || !montant || montant <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Type d\'opération et montant requis (montant > 0)'
            });
        }

        // Calculer le solde actuel
        const soldeActuel = await getSoldeApresOperations();
        const montantAvant = soldeActuel;
        const montantOperation = parseFloat(montant);

        // Vérifier si c'est un retrait ou un dépôt
        let montantApres;
        const isAddition = (type_operation === 'depot') || (type_operation === 'autre' && operation_sign === 'plus');
        if (isAddition) {
            montantApres = montantAvant + montantOperation;
        } else {
            // Pour retrait/paiement_client/"autre -", soustraire
            montantApres = montantAvant - montantOperation;

            // Vérifier que le solde est suffisant
            if (montantApres < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Solde insuffisant',
                    message: `Le solde actuel (${montantAvant.toFixed(3)} TND) est insuffisant pour effectuer cette opération.`
                });
            }
        }

        // Résoudre le client_id si username fourni
        const resolvedClientId = await resolveClientId(client_id, client_username);

        if (client_username && !resolvedClientId) {
            return res.status(400).json({
                success: false,
                error: 'Client introuvable avec ce username'
            });
        }

        // Insérer l'opération
        const [result] = await pool.execute(`
            INSERT INTO caisse_cgm_operations 
            (type_operation, montant, montant_avant, montant_apres, commentaire, user_id, client_id, operation_sign)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            type_operation,
            montantOperation,
            montantAvant,
            montantApres,
            commentaire || null,
            user_id || null,
            resolvedClientId || null,
            operation_sign === 'plus' ? 'plus' : 'moins'
        ]);

        // Si un charge_id est fourni et que c'est un retrait, marquer la charge comme traitée
        // ET créer une dépense dans beneficiaires_bureau avec le préfixe [CGM]
        if (charge_id && type_operation === 'retrait') {
            try {
                // Marquer la charge comme traitée
                await pool.execute(`
                    UPDATE charges_mensuelles 
                    SET is_cgm_retrait_processed = TRUE 
                    WHERE id = ?
                `, [charge_id]);

                // Récupérer les informations de la charge pour créer la dépense bureau
                const [chargeRows] = await pool.execute(`
                    SELECT ch.libelle, ch.date, ch.montant, ch.avance, c.nom as client_nom
                    FROM charges_mensuelles ch
                    LEFT JOIN client c ON c.id = ch.client_id
                    WHERE ch.id = ?
                `, [charge_id]);

                if (chargeRows.length > 0) {
                    const charge = chargeRows[0];
                    // Déterminer le montant : pour les dépenses (montant > 0, avance = 0), utiliser montant, sinon avance
                    const chargeLibelle = (charge.libelle || '').toUpperCase();
                    const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('AVANCE DE DECLARATION');
                    const depenseMontant = isHonoraireRecu ? parseFloat(charge.avance || 0) : parseFloat(charge.montant || 0);
                    
                    // Ne créer la dépense que si c'est une vraie dépense (pas un honoraire reçu)
                    if (!isHonoraireRecu && depenseMontant > 0) {
                        // Vérifier si la dépense n'existe pas déjà (éviter les doublons)
                        const [existing] = await pool.execute(`
                            SELECT id FROM beneficiaires_bureau 
                            WHERE libelle = ? 
                            AND nom_beneficiaire = ? 
                            AND montant = ? 
                            AND DATE(date_operation) = DATE(?)
                            LIMIT 1
                        `, [
                            `[CGM] ${charge.libelle || 'Dépense liée à charge'}`,
                            charge.client_nom || 'Client',
                            depenseMontant,
                            charge.date || new Date().toISOString().slice(0, 10)
                        ]);

                        // Créer la dépense seulement si elle n'existe pas déjà
                        if (existing.length === 0) {
                            await pool.execute(`
                                INSERT INTO beneficiaires_bureau (nom_beneficiaire, libelle, montant, date_operation)
                                VALUES (?, ?, ?, ?)
                            `, [
                                charge.client_nom || 'Client',
                                `[CGM] ${charge.libelle || 'Dépense liée à charge'}`,
                                depenseMontant,
                                charge.date || new Date().toISOString().slice(0, 10)
                            ]);
                            console.log(`✅ Dépense bureau créée automatiquement pour charge_id ${charge_id}`);
                        }
                    }
                }
            } catch (updateError) {
                // Ne pas faire échouer la requête principale si la colonne n'existe pas encore
                console.warn('Erreur lors de la mise à jour de is_cgm_retrait_processed ou création dépense bureau:', updateError.message);
            }
        }

        res.json({
            success: true,
            operation: {
                id: result.insertId,
                type_operation,
                montant: montantOperation,
                montant_avant: montantAvant,
                montant_apres: montantApres,
                commentaire,
                client_id,
                user_id
            },
            solde_actuel: montantApres,
            message: 'Opération enregistrée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'opération:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'ajout de l\'opération',
            message: error.message
        });
    }
});

// GET - Récupérer une opération par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hasPrenom } = await getClientColumns();
        const selectPrenom = hasPrenom ? 'c.prenom as client_prenom' : 'NULL as client_prenom';
        const [operations] = await pool.execute(`
            SELECT 
                cco.*,
                u.nom as user_nom,
                u.prenom as user_prenom,
                c.nom as client_nom,
                ${selectPrenom}
            FROM caisse_cgm_operations cco
            LEFT JOIN users u ON u.id = cco.user_id
            LEFT JOIN client c ON c.id = cco.client_id
            WHERE cco.id = ?
        `, [id]);

        if (operations.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Opération non trouvée'
            });
        }

        res.json({
            success: true,
            operation: operations[0]
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'opération:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de l\'opération',
            message: error.message
        });
    }
});

// PUT - Modifier une opération existante
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type_operation, montant, commentaire, client_id, client_username, operation_sign = 'moins', user_id } = req.body;

        // Validation
        if (!type_operation || !montant || montant <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Type d\'opération et montant requis (montant > 0)'
            });
        }

        // Vérifier que l'opération existe
        const [existing] = await pool.execute(
            'SELECT * FROM caisse_cgm_operations WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Opération non trouvée'
            });
        }

        const oldOperation = existing[0];

        // Recalculer le solde actuel en excluant l'ancienne opération
        const soldeActuel = await getSoldeApresOperations();

        // Annuler l'effet de l'ancienne opération pour recalculer le solde avant cette opération
        let soldeAvantOperation = soldeActuel;
        if (oldOperation.type_operation === 'depot') {
            soldeAvantOperation = soldeActuel - oldOperation.montant;
        } else {
            soldeAvantOperation = soldeActuel + oldOperation.montant;
        }

        const montantOperation = parseFloat(montant);
        const montantAvant = soldeAvantOperation;

        // Calculer le nouveau solde après
        let montantApres;
        const isAddition = (type_operation === 'depot') || (type_operation === 'autre' && operation_sign === 'plus');
        if (isAddition) {
            montantApres = montantAvant + montantOperation;
        } else {
            montantApres = montantAvant - montantOperation;

            // Vérifier que le solde est suffisant
            if (montantApres < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Solde insuffisant',
                    message: `Le solde actuel (${montantAvant.toFixed(3)} TND) est insuffisant pour effectuer cette opération.`
                });
            }
        }

        // Résoudre le client_id si username fourni
        const resolvedClientId = await resolveClientId(client_id, client_username);
        if (client_username && !resolvedClientId) {
            return res.status(400).json({ success: false, error: 'Client introuvable avec ce username' });
        }

        // Récupérer le user_id depuis req.body ou req.headers (utiliser celui du body s'il est fourni, sinon garder l'ancien)
        const userId = user_id || req.headers['user-id'] || null;
        
        // Mettre à jour l'opération
        await pool.execute(`
            UPDATE caisse_cgm_operations 
            SET type_operation = ?,
                montant = ?,
                montant_avant = ?,
                montant_apres = ?,
                commentaire = ?,
                client_id = ?,
                user_id = ?,
                operation_sign = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            type_operation,
            montantOperation,
            montantAvant,
            montantApres,
            commentaire || null,
            resolvedClientId || null,
            userId,
            operation_sign === 'plus' ? 'plus' : 'moins',
            id
        ]);

        // Recalculer les soldes de toutes les opérations suivantes
        await recalculateSubsequentOperations(id);

        const newSolde = await getSoldeApresOperations();

        res.json({
            success: true,
            message: 'Opération modifiée avec succès',
            solde_actuel: newSolde
        });
    } catch (error) {
        console.error('Erreur lors de la modification de l\'opération:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification de l\'opération',
            message: error.message
        });
    }
});

// DELETE - Supprimer toutes les opérations
router.delete('/', async (req, res) => {
    try {
        // Compter le nombre d'opérations avant suppression
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM caisse_cgm_operations'
        );
        const totalOperations = countResult[0]?.total || 0;

        if (totalOperations === 0) {
            return res.json({
                success: true,
                message: 'Aucune opération à supprimer',
                solde_actuel: await getSoldeApresOperations()
            });
        }

        // Supprimer toutes les opérations
        await pool.execute('DELETE FROM caisse_cgm_operations');

        const newSolde = await getSoldeApresOperations();

        res.json({
            success: true,
            message: `Toutes les opérations (${totalOperations}) ont été supprimées avec succès`,
            solde_actuel: newSolde,
            operations_deleted: totalOperations
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de toutes les opérations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de toutes les opérations',
            message: error.message
        });
    }
});

// DELETE - Supprimer une opération
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que l'ID n'est pas vide (pour éviter les conflits avec la route DELETE '/')
        if (!id || id.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'ID d\'opération requis'
            });
        }

        // Vérifier que l'opération existe
        const [existing] = await pool.execute(
            'SELECT * FROM caisse_cgm_operations WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Opération non trouvée'
            });
        }

        // Supprimer l'opération
        await pool.execute('DELETE FROM caisse_cgm_operations WHERE id = ?', [id]);

        // Recalculer les soldes de toutes les opérations suivantes
        await recalculateSubsequentOperations(id);

        const newSolde = await getSoldeApresOperations();

        res.json({
            success: true,
            message: 'Opération supprimée avec succès',
            solde_actuel: newSolde
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'opération:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'opération',
            message: error.message
        });
    }
});

// Fonction pour recalculer les soldes des opérations suivantes
async function recalculateSubsequentOperations(operationId) {
    try {
        // Récupérer toutes les opérations après celle modifiée/supprimée
        const [subsequentOps] = await pool.execute(`
            SELECT * FROM caisse_cgm_operations 
            WHERE id > ?
            ORDER BY id ASC
        `, [operationId]);

        if (subsequentOps.length === 0) {
            return; // Pas d'opérations suivantes
        }

        // Récupérer le solde avant la première opération suivante
        const [previousOps] = await pool.execute(`
            SELECT montant_apres FROM caisse_cgm_operations 
            WHERE id < ?
            ORDER BY id DESC
            LIMIT 1
        `, [subsequentOps[0].id]);

        // Si pas d'opération précédente, calculer depuis le solde initial
        let currentSolde = previousOps.length > 0
            ? parseFloat(previousOps[0].montant_apres)
            : await getCaisseSolde();

        // Recalculer chaque opération suivante
        for (const op of subsequentOps) {
            const montantAvant = currentSolde;
            let montantApres;

            if (op.type_operation === 'depot' || (op.type_operation === 'autre' && op.operation_sign === 'plus')) {
                montantApres = montantAvant + parseFloat(op.montant);
            } else {
                montantApres = montantAvant - parseFloat(op.montant);
            }

            // Mettre à jour l'opération
            await pool.execute(`
                UPDATE caisse_cgm_operations 
                SET montant_avant = ?, montant_apres = ?
                WHERE id = ?
            `, [montantAvant, montantApres, op.id]);

            currentSolde = montantApres;
        }
    } catch (error) {
        console.error('Erreur lors du recalcul des opérations suivantes:', error);
        throw error;
    }
}

module.exports = router;

