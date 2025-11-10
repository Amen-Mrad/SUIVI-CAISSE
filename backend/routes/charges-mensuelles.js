const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Détection paresseuse des colonnes optionnelles dans la table client
let clientColumnsCache = null;
async function getClientColumns() {
    if (clientColumnsCache) return clientColumnsCache;
    try {
        const [rows] = await pool.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client'`
        );
        const set = new Set(rows.map(r => r.COLUMN_NAME));
        clientColumnsCache = {
            hasPrenom: set.has('prenom'),
            hasEmail: set.has('email'),
            hasUsername: set.has('username')
        };
    } catch (_) {
        clientColumnsCache = { hasPrenom: false, hasEmail: false, hasUsername: false };
    }
    return clientColumnsCache;
}

// Détection paresseuse de la colonne optionnelle is_cgm_retrait_processed dans charges_mensuelles
let chargesColumnsCache = null;
async function getChargesColumns() {
    if (chargesColumnsCache) return chargesColumnsCache;
    try {
        const [rows] = await pool.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'charges_mensuelles'`
        );
        const set = new Set(rows.map(r => r.COLUMN_NAME));
        chargesColumnsCache = {
            hasCgmRetraitProcessed: set.has('is_cgm_retrait_processed')
        };
    } catch (_) {
        chargesColumnsCache = { hasCgmRetraitProcessed: false };
    }
    return chargesColumnsCache;
}

// Fonction pour recalculer tous les soldes d'un client pour une année
async function recalculerSoldes(clientId, annee) {
    try {
        // Récupérer toutes les charges triées par mois
        const [charges] = await pool.execute(`
            SELECT id, mois, montant, avance 
            FROM charges_mensuelles 
            WHERE client_id = ? AND annee = ?
            ORDER BY mois ASC
        `, [clientId, annee]);

        // Récupérer le solde de l'année précédente
        const anneePrecedente = annee - 1;
        const [soldePrecedent] = await pool.execute(`
            SELECT solde_restant 
            FROM charges_mensuelles 
            WHERE client_id = ? AND annee = ? AND mois = 12
            ORDER BY date_creation DESC 
            LIMIT 1
        `, [clientId, anneePrecedente]);

        // Si pas de solde en décembre, chercher la dernière charge de l'année précédente
        let soldeCumulatif = 0;
        if (soldePrecedent.length > 0) {
            soldeCumulatif = parseFloat(soldePrecedent[0].solde_restant);
        } else {
            // Chercher la dernière charge de l'année précédente (n'importe quel mois)
            const [derniereCharge] = await pool.execute(`
                SELECT solde_restant 
                FROM charges_mensuelles 
                WHERE client_id = ? AND annee = ?
                ORDER BY mois DESC, date_creation DESC 
                LIMIT 1
            `, [clientId, anneePrecedente]);

            if (derniereCharge.length > 0) {
                soldeCumulatif = parseFloat(derniereCharge[0].solde_restant);
            }
        }

        // Recalculer chaque solde
        for (const charge of charges) {
            const montant = parseFloat(charge.montant);
            const avance = parseFloat(charge.avance || 0);

            // Appliquer la logique cumulative selon les règles :
            // MONTANT : augmente la dette (solde devient plus négatif)
            // AVANCE : diminue la dette (solde devient moins négatif ou plus positif)
            // Logique correcte : solde_précédent + montant - avance
            soldeCumulatif = soldeCumulatif - montant + avance;

            // Mettre à jour le solde dans la base
            await pool.execute(`
                UPDATE charges_mensuelles 
                SET solde_restant = ? 
                WHERE id = ?
            `, [soldeCumulatif, charge.id]);
        }
    } catch (error) {
        console.error('Erreur lors du recalcul des soldes:', error);
    }
}

// Obtenir les charges mensuelles d'un client
router.get('/client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { annee = new Date().getFullYear(), all = false } = req.query;

        // Vérifier que le client existe
        const { hasPrenom, hasEmail } = await getClientColumns();
        const selectPrenom = hasPrenom ? 'prenom' : 'NULL AS prenom';
        const selectEmail = hasEmail ? 'email' : 'NULL AS email';
        const [clientCheck] = await pool.execute(
            `SELECT id, nom, ${selectPrenom}, ${selectEmail}, telephone FROM client WHERE id = ?`,
            [clientId]
        );

        if (clientCheck.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        // Récupérer les charges mensuelles
        const { hasCgmRetraitProcessed } = await getChargesColumns();
        const selectCgmRetrait = hasCgmRetraitProcessed
            ? 'COALESCE(is_cgm_retrait_processed, FALSE) as is_cgm_retrait_processed'
            : 'FALSE as is_cgm_retrait_processed';

        let charges;
        if (all === 'true') {
            // Récupérer toutes les charges du client
            [charges] = await pool.execute(`
                SELECT 
                    id,
                    date,
                    libelle,
                    mois,
                    annee,
                    montant,
                    avance,
                    solde_restant,
                    date_creation,
                    ${selectCgmRetrait}
                FROM charges_mensuelles 
                WHERE client_id = ?
                ORDER BY annee ASC, mois ASC
            `, [clientId]);
        } else {
            // Récupérer les charges de l'année sélectionnée
            [charges] = await pool.execute(`
                SELECT 
                    id,
                    date,
                    libelle,
                    mois,
                    annee,
                    montant,
                    avance,
                    solde_restant,
                    date_creation,
                    ${selectCgmRetrait}
                FROM charges_mensuelles 
                WHERE client_id = ? AND annee = ?
                ORDER BY annee ASC, mois ASC
            `, [clientId, annee]);
        }

        // Récupérer le solde de fin d'année de l'année précédente
        const anneePrecedente = parseInt(annee) - 1;

        // Chercher d'abord le solde de décembre de l'année précédente
        const [soldePrecedent] = await pool.execute(`
            SELECT solde_restant 
            FROM charges_mensuelles 
            WHERE client_id = ? AND annee = ? AND mois = 12
            ORDER BY date_creation DESC 
            LIMIT 1
        `, [clientId, anneePrecedente]);

        // Si pas de solde en décembre, chercher la dernière charge de l'année précédente
        let soldeFinAnneePrecedente = 0;
        if (soldePrecedent.length > 0) {
            soldeFinAnneePrecedente = parseFloat(soldePrecedent[0].solde_restant);
        } else {
            // Chercher la dernière charge de l'année précédente (n'importe quel mois)
            const [derniereCharge] = await pool.execute(`
                SELECT solde_restant 
                FROM charges_mensuelles 
                WHERE client_id = ? AND annee = ?
                ORDER BY mois DESC, date_creation DESC 
                LIMIT 1
            `, [clientId, anneePrecedente]);

            if (derniereCharge.length > 0) {
                soldeFinAnneePrecedente = parseFloat(derniereCharge[0].solde_restant);
            }
        }

        // Ajouter le solde reporté comme première ligne (même s'il est 0)
        if (soldeFinAnneePrecedente !== undefined) {
            const lignePrecedente = {
                id: `precedent_${anneePrecedente}`,
                mois: 12,
                annee: anneePrecedente,
                montant: 0,
                avance: 0,
                solde_restant: soldeFinAnneePrecedente,
                date_creation: new Date(anneePrecedente, 11, 31).toISOString(),
                isPrecedent: true // Flag pour identifier cette ligne spéciale
            };

            // Insérer cette ligne au début du tableau
            charges.unshift(lignePrecedente);
        }

        // Calculer le total des charges
        const totalMontant = charges.reduce((sum, c) => sum + parseFloat(c.montant), 0);

        res.json({
            success: true,
            client: clientCheck[0],
            charges,
            totaux: {
                totalMontant,
                nombreCharges: charges.length
            },
            annee: parseInt(annee)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des charges:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération',
            message: error.message
        });
    }
});

// Ajouter une nouvelle charge mensuelle
router.post('/', async (req, res) => {
    try {
        const {
            client_id,
            date,
            libelle,
            montant,
            avance
        } = req.body;

        // Vérifier que le client existe
        const [clientCheck] = await pool.execute(
            'SELECT id FROM client WHERE id = ?',
            [client_id]
        );

        if (clientCheck.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        // Extraire mois et année de la date pour la logique de calcul
        const dateObj = new Date(date);
        const mois = dateObj.getMonth() + 1; // getMonth() retourne 0-11, on veut 1-12
        const annee = dateObj.getFullYear();

        // Calculer le solde restant selon la logique mathématique
        let soldePrecedent = 0;

        // 1. Tenter de récupérer le solde de la dernière charge de l'année en cours (mois précédent)
        const [lastChargeCurrentYear] = await pool.execute(
            'SELECT solde_restant FROM charges_mensuelles WHERE client_id = ? AND annee = ? AND mois < ? ORDER BY mois DESC LIMIT 1',
            [client_id, annee, mois]
        );

        if (lastChargeCurrentYear.length > 0) {
            soldePrecedent = parseFloat(lastChargeCurrentYear[0].solde_restant);
        } else {
            // 2. Si aucune charge n'existe pour les mois précédents de l'année en cours,
            //    tenter de récupérer le solde de décembre de l'année précédente
            const [lastChargePreviousYear] = await pool.execute(
                'SELECT solde_restant FROM charges_mensuelles WHERE client_id = ? AND annee = ? AND mois = 12 ORDER BY date_creation DESC LIMIT 1',
                [client_id, annee - 1]
            );
            if (lastChargePreviousYear.length > 0) {
                soldePrecedent = parseFloat(lastChargePreviousYear[0].solde_restant);
            }
        }

        // Logique mathématique selon les règles :
        // MONTANT : ajouter au solde précédent
        // AVANCE : soustraire du solde précédent
        // Cas mixte : solde_précédent + montant - avance
        const soldeRestant = soldePrecedent - parseFloat(montant) + parseFloat(avance || 0);

        // Insérer la nouvelle charge
        const [result] = await pool.execute(`
            INSERT INTO charges_mensuelles (
                client_id, date, libelle, mois, annee, montant, avance, solde_restant
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [client_id, date, libelle, mois, annee, montant, avance || 0, soldeRestant]);

        // Recalculer tous les soldes pour ce client et cette année
        await recalculerSoldes(client_id, annee);

        // Si c'est une charge avec carte bancaire (dépense), créer automatiquement un retrait CGM
        const libelleUpper = (libelle || '').toUpperCase();
        const isCarteBancaire = libelleUpper.includes('[CARTE BANCAIRE]') || libelleUpper.includes('[CARTE]');
        const isDepense = parseFloat(montant) > 0 && parseFloat(avance || 0) === 0;

        if (isCarteBancaire && isDepense) {
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

                // Calculer le solde actuel de la caisse CGM
                // Solde initial = somme des honoraires reçus
                const [soldeInitial] = await pool.execute(`
                    SELECT COALESCE(SUM(GREATEST(COALESCE(ch.avance, 0), COALESCE(ch.montant, 0))), 0) AS total_caisse
                    FROM charges_mensuelles ch
                    WHERE UPPER(TRIM(ch.libelle)) LIKE '%HONORAIRES RE%'
                    AND (COALESCE(ch.avance, 0) > 0 OR COALESCE(ch.montant, 0) > 0)
                `);
                const soldeBase = parseFloat(soldeInitial[0]?.total_caisse || 0);

                // Calculer les retraits existants
                const [retraits] = await pool.execute(`
                    SELECT COALESCE(SUM(montant), 0) AS total_retraits
                    FROM caisse_cgm_operations
                    WHERE type_operation IN ('retrait', 'paiement_client')
                `);
                const totalRetraits = parseFloat(retraits[0]?.total_retraits || 0);

                // Calculer les dépôts existants
                const [depots] = await pool.execute(`
                    SELECT COALESCE(SUM(montant), 0) AS total_depots
                    FROM caisse_cgm_operations
                    WHERE type_operation = 'depot'
                `);
                const totalDepots = parseFloat(depots[0]?.total_depots || 0);

                // Solde actuel avant l'opération
                const montantAvant = soldeBase + totalDepots - totalRetraits;
                const montantOperation = parseFloat(montant);
                const montantApres = montantAvant - montantOperation;

                // Récupérer le user_id depuis les headers si disponible
                const userId = req.body.user_id || req.headers['user-id'] || null;

                // Créer l'opération de retrait
                await pool.execute(`
                    INSERT INTO caisse_cgm_operations 
                    (type_operation, montant, montant_avant, montant_apres, commentaire, user_id, client_id, operation_sign)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'moins')
                `, [
                    'retrait',
                    montantOperation,
                    montantAvant,
                    montantApres,
                    `Retrait carte bancaire: ${libelle} (Charge ID: ${result.insertId})`,
                    userId,
                    client_id
                ]);

                // Marquer la charge comme traitée (si la colonne existe)
                try {
                    const { hasCgmRetraitProcessed } = await getChargesColumns();
                    if (hasCgmRetraitProcessed) {
                        await pool.execute(`
                            UPDATE charges_mensuelles 
                            SET is_cgm_retrait_processed = TRUE 
                            WHERE id = ?
                        `, [result.insertId]);
                    }
                } catch (updateError) {
                    // Ne pas faire échouer si la colonne n'existe pas
                    console.warn('Erreur lors de la mise à jour de is_cgm_retrait_processed:', updateError.message);
                }

                console.log(`Retrait CGM créé automatiquement pour la charge ${result.insertId} (carte bancaire)`);
            } catch (caisseError) {
                // Logger l'erreur mais ne pas bloquer l'ajout de la charge
                console.error('Erreur lors de la création de l\'opération CGM pour la charge carte bancaire:', caisseError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Charge mensuelle ajoutée avec succès',
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

// Modifier une charge mensuelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, libelle, montant, avance } = req.body;

        // Vérifier que la charge existe
        const [existingCharge] = await pool.execute(
            'SELECT * FROM charges_mensuelles WHERE id = ?',
            [id]
        );

        if (existingCharge.length === 0) {
            return res.status(404).json({ error: 'Charge non trouvée' });
        }

        const charge = existingCharge[0];

        // Extraire mois et année de la date pour la logique de calcul
        const dateObj = new Date(date);
        const mois = dateObj.getMonth() + 1; // getMonth() retourne 0-11, on veut 1-12
        const annee = dateObj.getFullYear();

        // Recalculer le solde restant selon la logique mathématique
        let soldePrecedent = 0;

        // 1. Tenter de récupérer le solde de la dernière charge de l'année en cours (mois précédent)
        const [lastChargeCurrentYear] = await pool.execute(
            'SELECT solde_restant FROM charges_mensuelles WHERE client_id = ? AND annee = ? AND mois < ? AND id != ? ORDER BY mois DESC LIMIT 1',
            [charge.client_id, annee, mois, id]
        );

        if (lastChargeCurrentYear.length > 0) {
            soldePrecedent = parseFloat(lastChargeCurrentYear[0].solde_restant);
        } else {
            // 2. Si aucune charge n'existe pour les mois précédents de l'année en cours,
            //    tenter de récupérer le solde de décembre de l'année précédente
            const [lastChargePreviousYear] = await pool.execute(
                'SELECT solde_restant FROM charges_mensuelles WHERE client_id = ? AND annee = ? AND mois = 12 ORDER BY date_creation DESC LIMIT 1',
                [charge.client_id, annee - 1]
            );
            if (lastChargePreviousYear.length > 0) {
                soldePrecedent = parseFloat(lastChargePreviousYear[0].solde_restant);
            }
        }

        // Logique mathématique selon les règles :
        // MONTANT : ajouter au solde précédent
        // AVANCE : soustraire du solde précédent
        // Cas mixte : solde_précédent + montant - avance
        const soldeRestant = soldePrecedent - parseFloat(montant) + parseFloat(avance || 0);

        // Mettre à jour la charge
        await pool.execute(`
            UPDATE charges_mensuelles 
            SET date = ?, libelle = ?, mois = ?, annee = ?, montant = ?, avance = ?, solde_restant = ?
            WHERE id = ?
        `, [date, libelle, mois, annee, montant, avance || 0, soldeRestant, id]);

        // Recalculer tous les soldes pour ce client et cette année
        await recalculerSoldes(charge.client_id, annee);

        res.json({
            success: true,
            message: 'Charge mensuelle modifiée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la modification de la charge:', error);
        res.status(500).json({
            error: 'Erreur lors de la modification',
            message: error.message
        });
    }
});

// Supprimer une charge mensuelle
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que la charge existe
        const [existingCharge] = await pool.execute(
            'SELECT * FROM charges_mensuelles WHERE id = ?',
            [id]
        );

        if (existingCharge.length === 0) {
            return res.status(404).json({ error: 'Charge non trouvée' });
        }

        // Supprimer la charge
        await pool.execute('DELETE FROM charges_mensuelles WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Charge mensuelle supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la charge:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression',
            message: error.message
        });
    }
});

// Route pour recalculer manuellement les soldes d'un client
router.post('/recalculer-soldes/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { annee = new Date().getFullYear() } = req.body;

        // Vérifier que le client existe
        const [clientCheck] = await pool.execute(
            'SELECT id FROM client WHERE id = ?',
            [clientId]
        );

        if (clientCheck.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        // Recalculer les soldes
        await recalculerSoldes(clientId, annee);

        res.json({
            success: true,
            message: `Soldes recalculés avec succès pour le client ${clientId} et l'année ${annee}`
        });

    } catch (error) {
        console.error('Erreur lors du recalcul des soldes:', error);
        res.status(500).json({
            error: 'Erreur lors du recalcul des soldes',
            message: error.message
        });
    }
});


// Route pour récupérer toutes les charges carte bancaire avec infos client et caissier
router.get('/cartes-bancaires', async (req, res) => {
    try {
        const { hasPrenom, hasUsername } = await getClientColumns();
        const selectPrenom = hasPrenom ? 'c.prenom AS client_prenom' : 'NULL AS client_prenom';
        const selectUsername = hasUsername ? 'c.username AS client_username' : 'NULL AS client_username';

        // Récupérer toutes les charges avec [CARTE BANCAIRE] ou [CARTE] dans le libellé
        const [charges] = await pool.execute(`
            SELECT 
                cm.id,
                cm.date,
                cm.date_creation,
                cm.libelle,
                cm.montant,
                cm.avance,
                c.id AS client_id,
                c.nom AS client_nom,
                ${selectPrenom},
                ${selectUsername}
            FROM charges_mensuelles cm
            INNER JOIN client c ON cm.client_id = c.id
            WHERE cm.libelle LIKE '%[CARTE BANCAIRE]%' OR cm.libelle LIKE '%[CARTE]%'
            ORDER BY cm.date_creation DESC, cm.date DESC
        `);

        // Pour chaque charge, essayer de récupérer l'info du caissier depuis la table users
        // Note: Si la table charges_mensuelles n'a pas de champ user_id, on ne peut pas récupérer le caissier
        // On va donc retourner les charges avec les infos disponibles
        const chargesWithInfo = charges.map(charge => ({
            id: charge.id,
            date: charge.date,
            date_creation: charge.date_creation,
            libelle: charge.libelle,
            montant: charge.montant,
            avance: charge.avance,
            client_id: charge.client_id,
            client_nom: charge.client_nom,
            client_prenom: charge.client_prenom,
            client_username: charge.client_username,
            caissier_nom: null, // Pas disponible sans champ user_id dans charges_mensuelles
            caissier_username: null
        }));

        res.json({
            success: true,
            charges: chargesWithInfo
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des charges carte bancaire:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération',
            message: error.message
        });
    }
});

// Route pour récupérer le solde reporté d'un client
router.get('/solde-reporte/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { annee = new Date().getFullYear() } = req.query;

        // Vérifier que le client existe
        const [clientCheck] = await pool.execute(
            'SELECT id, nom, prenom FROM client WHERE id = ?',
            [clientId]
        );

        if (clientCheck.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        const anneePrecedente = parseInt(annee) - 1;

        // Chercher d'abord le solde de décembre de l'année précédente
        const [soldePrecedent] = await pool.execute(`
            SELECT solde_restant 
            FROM charges_mensuelles 
            WHERE client_id = ? AND annee = ? AND mois = 12
            ORDER BY date_creation DESC 
            LIMIT 1
        `, [clientId, anneePrecedente]);

        // Si pas de solde en décembre, chercher la dernière charge de l'année précédente
        let soldeFinAnneePrecedente = 0;
        if (soldePrecedent.length > 0) {
            soldeFinAnneePrecedente = parseFloat(soldePrecedent[0].solde_restant);
        } else {
            // Chercher la dernière charge de l'année précédente (n'importe quel mois)
            const [derniereCharge] = await pool.execute(`
                SELECT solde_restant 
                FROM charges_mensuelles 
                WHERE client_id = ? AND annee = ?
                ORDER BY mois DESC, date_creation DESC 
                LIMIT 1
            `, [clientId, anneePrecedente]);

            if (derniereCharge.length > 0) {
                soldeFinAnneePrecedente = parseFloat(derniereCharge[0].solde_restant);
            }
        }

        res.json({
            success: true,
            client: clientCheck[0],
            soldeReporte: soldeFinAnneePrecedente,
            anneePrecedente: anneePrecedente,
            anneeCourante: parseInt(annee)
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du solde reporté:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération du solde reporté',
            message: error.message
        });
    }
});

module.exports = router;
