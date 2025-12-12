import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/logo.png';
import cachetImage from '../assets/cachet.png';

export default function PrintReceiptPage() {
    const { id } = useParams(); // ID du client
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [client, setClient] = useState(null);
    const [charge, setCharge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [printRecorded, setPrintRecorded] = useState(false); // Pour éviter les doublons

    useEffect(() => {
        // Récupérer les données depuis l'URL
        const searchParams = new URLSearchParams(location.search);
        const chargeId = searchParams.get('chargeId');

        if (chargeId) {
            fetchChargeAndClient(chargeId);
        } else {
            setError('Aucun ID de charge fourni');
            setLoading(false);
        }
    }, [id, location.search]);

    const fetchChargeAndClient = async (chargeId) => {
        try {
            console.log('Récupération des données pour client ID:', id, 'charge ID:', chargeId);

            // Récupérer les informations du client
            const clientResponse = await fetch(`/api/clients/${id}`);
            const clientData = await clientResponse.json();
            console.log('Données client:', clientData);

            if (clientData.success) {
                setClient(clientData.client);
            } else {
                console.error('Erreur récupération client:', clientData.error);
                setError(`Erreur lors du chargement du client: ${clientData.error}`);
            }

            // Récupérer les charges mensuelles du client pour trouver la charge spécifique
            // Récupérer toutes les charges pour s'assurer de trouver la charge
            const chargesResponse = await fetch(`/api/charges-mensuelles/client/${id}?all=true`);
            const chargesData = await chargesResponse.json();
            console.log('Données charges:', chargesData);

            if (chargesData.success) {
                // Convertir chargeId en nombre pour la comparaison
                const chargeIdNum = parseInt(chargeId, 10);
                const foundCharge = chargesData.charges.find(c => {
                    const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
                    return cId === chargeIdNum;
                });
                console.log('Charge trouvée:', foundCharge);
                if (foundCharge) {
                    setCharge(foundCharge);
                } else {
                    console.error('Charge non trouvée avec ID:', chargeId);
                    console.error('Charges disponibles:', chargesData.charges.map(c => ({ id: c.id, libelle: c.libelle, date: c.date, avance: c.avance, montant: c.montant })));
                    setError(`Charge non trouvée avec l'ID: ${chargeId}`);
                }
            } else {
                console.error('Erreur récupération charges:', chargesData.error);
                setError(`Erreur lors du chargement des charges: ${chargesData.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setError(`Erreur lors de la récupération des données: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatMontant = (montant) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(montant);
    };

    // Normalise un montant venant d'une saisie ou d'un format fr-FR
    const parseMontantToNumber = (montant) => {
        if (typeof montant === 'number') {
            return isNaN(montant) ? 0 : montant;
        }
        if (montant === null || montant === undefined) return 0;

        const sanitized = String(montant)
            // supprime les espaces normaux, insécables et fines insécables
            .replace(/[ \u00A0\u202F]/g, '')
            // transforme la virgule en séparateur décimal
            .replace(/,/g, '.');

        const parsed = parseFloat(sanitized);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Convertir un nombre en lettres françaises
    const nombreEnLettres = (nombre) => {
        const valeur = Math.floor(parseFloat(nombre) || 0);

        if (valeur === 0) return 'zéro';

        const unites = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
        const dixaines10a19 = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
        const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

        const underHundred = (n) => {
            if (n < 10) return unites[n];
            if (n < 20) return dixaines10a19[n - 10];

            const d = Math.floor(n / 10);
            const u = n % 10;

            if (d === 7) {
                // 70 à 79 : soixante-dix, soixante et onze, ...
                if (u === 1) return 'soixante et onze';
                return `soixante-${u === 0 ? 'dix' : dixaines10a19[u]}`;
            }

            if (d === 8) {
                // 80 à 89
                if (u === 0) return 'quatre-vingts';
                return `quatre-vingt-${u === 1 ? 'un' : unites[u]}`;
            }

            if (d === 9) {
                // 90 à 99
                return `quatre-vingt-${u === 0 ? 'dix' : dixaines10a19[u]}`;
            }

            // 20 à 69
            const base = dizaines[d];
            if (u === 1) return `${base} et un`;
            return u === 0 ? base : `${base}-${unites[u]}`;
        };

        const underThousand = (n) => {
            if (n < 100) return underHundred(n);

            const c = Math.floor(n / 100);
            const reste = n % 100;

            let result = c === 1 ? 'cent' : `${unites[c]} cent`;
            if (reste === 0) {
                // "cent" prend un "s" uniquement quand il termine
                return c > 1 ? `${result}s` : result;
            }
            return `${result} ${underHundred(reste)}`;
        };

        // Gestion récursive des milliers / millions / milliards
        const convertLarge = (n) => {
            if (n < 1000) return underThousand(n);

            const scales = [
                { value: 1000000000, singular: 'milliard', plural: 'milliards' },
                { value: 1000000, singular: 'million', plural: 'millions' },
                { value: 1000, singular: 'mille', plural: 'mille' }
            ];

            for (const scale of scales) {
                if (n >= scale.value) {
                    const count = Math.floor(n / scale.value);
                    const reste = n % scale.value;
                    const prefixe = scale.value === 1000 && count === 1
                        ? 'mille'
                        : `${convertLarge(count)} ${count > 1 ? scale.plural : scale.singular}`;
                    return reste === 0 ? prefixe : `${prefixe} ${convertLarge(reste)}`;
                }
            }
            return '';
        };

        return convertLarge(valeur);
    };

    // Format complet avec "dinars" en majuscules, incluant les millimes
    const montantEnLettres = (montant) => {
        const montantComplet = parseMontantToNumber(montant);
        let partieEntiere = Math.floor(montantComplet);
        let partieDecimale = Math.round((montantComplet - partieEntiere) * 1000); // Extraire les 3 décimales (millimes)

        // Corriger le cas où l'arrondi des millimes fait passer à l'unité supérieure
        if (partieDecimale === 1000) {
            partieEntiere += 1;
            partieDecimale = 0;
        }

        let resultat = '';

        // Partie entière
        if (partieEntiere > 0) {
            const lettresEntiere = nombreEnLettres(partieEntiere);
            resultat = lettresEntiere + (partieEntiere > 1 ? ' dinars' : ' dinar');
        }

        // Partie décimale (millimes)
        if (partieDecimale > 0) {
            const lettresDecimale = nombreEnLettres(partieDecimale);
            if (resultat) {
                resultat += ' et ' + lettresDecimale + (partieDecimale > 1 ? ' millimes' : ' millime');
            } else {
                resultat = lettresDecimale + (partieDecimale > 1 ? ' millimes' : ' millime');
            }
        }

        // Si le montant est zéro
        if (!resultat) {
            resultat = 'zéro dinar';
        }

        return resultat.toUpperCase();
    };

    // Enregistrer l'impression dans l'historique
    const recordPrintHistory = async () => {
        // Enregistrer à chaque fois qu'on clique sur Imprimer (même si déjà enregistré)
        // Cela permet de tracer toutes les impressions
        console.log('recordPrintHistory appelé - Enregistrement de l\'impression...');

        try {
            // Vérifier que le client et la charge sont disponibles
            if (!client || !client.id || !charge) {
                console.error('❌ Client ou charge non disponible pour l\'enregistrement de l\'impression', {
                    client: client ? { id: client.id, nom: client.nom } : null,
                    charge: charge ? { id: charge.id, libelle: charge.libelle } : null
                });
                throw new Error('Client ou charge non disponible');
            }

            console.log('✅ Données disponibles - Client ID:', client.id, 'Charge ID:', charge.id);

            // Récupérer le nom d'utilisateur du caissier
            let caissierUsername = 'Caissier Inconnu';
            try {
                if (user && user.username) {
                    caissierUsername = user.username;
                } else {
                    const userStr = sessionStorage.getItem('user');
                    if (userStr) {
                        const userFromStorage = JSON.parse(userStr);
                        if (userFromStorage && userFromStorage.username) {
                            caissierUsername = userFromStorage.username;
                        }
                    }
                }
            } catch (e) {
                console.warn('Erreur lors de la récupération du nom d\'utilisateur:', e);
            }

            // Déterminer le montant : si c'est une avance (montant = 0 et avance > 0), utiliser avance, sinon utiliser montant
            // S'assurer que les valeurs sont correctement parsées même si elles sont des chaînes formatées
            const montantRaw = charge.montant || 0;
            const avanceRaw = charge.avance || 0;
            const montantParsed = parseMontantToNumber(montantRaw);
            const avanceParsed = parseMontantToNumber(avanceRaw);
            const isAdvance = montantParsed === 0 && avanceParsed > 0;
            const montant = isAdvance ? avanceParsed : montantParsed;

            if (isNaN(montant) || montant <= 0) {
                console.warn('Montant invalide pour l\'enregistrement de l\'impression:', montant);
                return;
            }

            const printData = {
                client_id: client.id,
                client_nom: client.nom || '',
                client_prenom: client.prenom || '',
                montant: montant,
                caissier_username: caissierUsername,
                type_reçu: 'honoraires'
            };

            // Envoyer les données au backend
            const response = await fetch('/api/print-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(printData)
            });

            const data = await response.json();

            console.log('Réponse API print-history:', { status: response.status, ok: response.ok, data });

            if (response.ok && data.success) {
                console.log('✅ Reçu enregistré avec succès dans l\'historique:', printData);
                setPrintRecorded(true);
                // Ne pas afficher d'alerte pour ne pas interrompre le flux d'impression
            } else {
                const errorMsg = data.error || data.message || response.statusText || 'Erreur lors de l\'enregistrement';
                console.error('❌ Erreur lors de l\'enregistrement de l\'impression:', errorMsg, printData);
                // Ne pas bloquer l'impression en cas d'erreur d'enregistrement
                console.warn('L\'impression continue malgré l\'erreur d\'enregistrement');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement de l\'impression:', error);
            // Ne pas bloquer l'impression en cas d'erreur
            console.warn('L\'impression continue malgré l\'erreur d\'enregistrement');
        }
    };

    const handlePrint = async () => {
        // Enregistrer l'impression dans l'historique avant d'imprimer
        console.log('Clic sur Imprimer - Enregistrement dans l\'historique...');
        try {
            await recordPrintHistory();
            console.log('Enregistrement terminé');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            // Continuer quand même avec l'impression même en cas d'erreur
        }

        const absoluteLogoUrl = `${window.location.origin}${logoImage}`;
        const absoluteCachetUrl = `${window.location.origin}${cachetImage}`;

        const toDataURL = async (url) => {
            try {
                const resp = await fetch(url, { cache: 'no-cache' });
                const blob = await resp.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (_) {
                return url; // fallback to original URL
            }
        };

        const [logoUrl, cachetUrl] = await Promise.all([
            toDataURL(absoluteLogoUrl),
            toDataURL(absoluteCachetUrl)
        ]);

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        // Calculer le montant formaté et en lettres - s'assurer que c'est un nombre
        const montantAvanceRaw = charge?.avance || 0;
        const montantAvance = parseMontantToNumber(montantAvanceRaw);
        const montantFormatePrint = formatMontant(montantAvance);
        const montantEnLettresPrint = montantEnLettres(montantAvance);
        const clientNomPrint = `${client?.nom || ''} ${client?.prenom || ''}`.trim();

        // Utiliser le même HTML que l'ancien reçu
        const receiptHTML = `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Reçu de Règlement en Espèces</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            background: white;
                            font-size: 14px; 
                            color: #333;
                        }
                        .receipt-container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            position: relative;
                        }
                        
                        /* EN-TÊTE COMPACT AVEC LOGO CENTRÉ ET INFOS GAUCHE/DROITE */
                        .header-top {
                            margin-bottom: 10px;
                            border-bottom: 1px solid #ccc; /* Séparateur */
                            padding-bottom: 8px;
                        }
                        .header-logo-container {
                            text-align: center; 
                            margin-bottom: 6px;
                        }
                        .header-logo-img {
                            max-width: 120px;
                            height: auto;
                            object-fit: contain;
                        }
                        .header-info-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                        }
                        .header-info-left, .header-info-right {
                            font-size: 9px;
                            line-height: 1.3;
                            color: #666;
                            width: 48%;
                        }
                        .header-info-right {
                            text-align: right;
                        }

                        /* Ligne de titre/date sous les informations du cabinet */
                        .receipt-title-date-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 12px;
                        }
                        .receipt-title {
                            font-size: 16px;
                            font-weight: bold;
                        }
                        .receipt-date-box {
                            text-align: right;
                            font-size: 12px;
                        }
                        .receipt-date-label {
                            font-size: 11px;
                            color: #666;
                        }
                        .receipt-date {
                            min-width: 110px;
                            font-weight: bold;
                        }

                        /* Champs */
                        .fields {
                            margin-top: 10px;
                            margin-bottom: 20px;
                        }
                        .field-item {
                            width: 100%;
                            margin-bottom: 5px;
                            display: flex;
                            flex-wrap: nowrap; 
                            gap: 10px;
                            align-items: center;
                        }
                        .row-fields {
                            display: flex;
                            width: 100%;
                            gap: 20px;
                        }
                        .col-6 {
                            flex: 1;
                            min-width: 45%; 
                        }
                        .field-label {
                            font-size: 12px;
                            color: #666;
                            margin-bottom: 5px;
                            min-width: 120px;
                            flex-shrink: 0;
                        }
                        .field-value {
                            height: 28px;
                            display: flex;
                            align-items: center;
                            font-weight: bold;
                            white-space: nowrap;
                            overflow: visible;
                            flex: 1;
                        }
                        
                        /* Phrase d'arrêt de note */
                        .arret-note {
                            margin-top: 25px;
                            margin-bottom: 20px;
                            text-align: left;
                            background-color: #f0f0f0;
                            padding: 10px 15px;
                            border-radius: 5px;
                        }
                        .arret-note p {
                            margin: 0;
                            font-size: 13px;
                            font-weight: normal;
                            color: #2c3e50;
                            line-height: 1.6;
                        }
                        .arret-note .montant-lettres {
                            font-weight: bold;
                        }
                        
                        /* Nouvelle Section Signature avec cachet au-dessus */
                        .signature-section {
                            margin-top: 20px;
                        }
                        .signature-boxes-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                        }
                        .signature-box { 
                            text-align: center; 
                            width: 30%; /* Pour répartir les 3 éléments */
                            min-width: 100px;
                            position: relative;
                        }
                        .cachet-container {
                            text-align: center;
                            margin-top: 15px; /* Espace après le texte "Cachet" */
                        }
                        .cachet-img {
                            max-height: 120px;
                            max-width: 100%;
                            object-fit: contain;
                            display: block;
                            margin: 0 auto;
                        }
                        .signature-placeholder {
                            display: none; /* Masquer les lignes horizontales */
                        }
                        .signature-line { 
                            font-size: 12px;
                            margin-top: 5px;
                            font-weight: 500;
                        }

                        /* Masquer le footer-info */
                        .footer-info {
                            display: none; 
                        }

                        @media print {
                            body { margin: 0; padding: 10px; }
                            .receipt-container { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        
                        <div class="header-top">
                            <div class="header-logo-container">
                                <img src="${logoUrl}" alt="Logo CGM" class="header-logo-img" />
                            </div>
                            <div class="header-info-row">
                                <div class="header-info-left">
                                    <div>Matricule fiscale: ${client?.matricule || '1835448D/A/M/000'}</div>
                                    <div>${client?.adresse || '62 Avenue de France, bureau N°3, 1er étage 2013 Ben Arous'}</div>
                                    <div>${client?.tel || '(+216) 79 410 028'}</div>
                                </div>
                                <div class="header-info-right">
                                    <div>${client?.rib || 'RIB : 25047000000039870129'}</div>
                                    <div>${client?.banque || 'Banque Zitouna Agence Ben Arous'}</div>
                                    <div>${client?.email || 'contact@ccgm.com.tn'}</div>
                                </div>
                            </div>
                        </div>


                        <div class="fields">
                            <div class="field-item">
                                <div class="field-label">Client:</div>
                                <div class="field-value">${clientNomPrint}</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">Bénéficiaire:</div>
                                <div class="field-value">CGM</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">Objet:</div>
                                <div class="field-value">${charge?.libelle || 'Honoraires reçu'}</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">Montant reçu:</div>
                                <div class="field-value">${montantFormatePrint} TND</div>
                            </div>
                        </div>

                        <div class="arret-note">
                            <p>ARRÊTÈE LA PRÈSENTE NOTE D'HONORAIRE À LA SOMME DE :<br><span class="montant-lettres">${montantEnLettresPrint}</span></p>
                        </div>

                        <div class="signature-section">
                            <div class="signature-boxes-row">
                                <div class="signature-box">
                                    <div class="signature-placeholder"></div>
                                    <div class="signature-line">Signature Client</div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-placeholder"></div>
                                    <div class="signature-line">Signature CGM</div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-placeholder"></div>
                                    <div class="signature-line">Cachet</div>
                                    <div class="cachet-container">
                                        <img src="${cachetUrl}" alt="Cachet CGM" class="cachet-img" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <script>
                        // Attendre le chargement complet (images incluses) avant d'imprimer
                        window.onload = () => {
                            setTimeout(() => { window.print(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        // L'impression est déclenchée depuis le script embarqué après chargement
    };

    const handleBack = () => {
        navigate(`/client/${id}/charges`);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #667eea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Chargement du reçu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    maxWidth: '500px'
                }}>
                    <h3 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Reçu non trouvé</h3>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    if (!client || !charge) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <h3>Reçu non trouvé</h3>
                    <p>Impossible de charger les données du reçu.</p>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    // Formater la date
    const dateStr = charge.date
        ? new Date(charge.date).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
        : new Date(charge.date_creation).toLocaleDateString('fr-FR');

    // Formater le montant - s'assurer que c'est un nombre
    // Si charge.avance est une chaîne formatée (ex: "100,000"), la convertir en nombre
    const montantAvanceRaw = charge.avance || 0;
    const montantAvanceNum = parseMontantToNumber(montantAvanceRaw);

    const montantFormate = formatMontant(montantAvanceNum);
    const montantEnLettresFormate = montantEnLettres(montantAvanceNum);

    // Nom complet du client
    const clientNom = `${client.nom || ''} ${client.prenom || ''}`.trim();

    return (
        <>
            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: #f5f5f5;
                    min-height: 100vh;
                }
                
                .print-receipt-page {
                    min-height: 100vh;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .receipt-container {
                    background: white;
                    border: 1px solid #ddd;
                    padding: 20px;
                    max-width: 600px;
                    width: 100%;
                    margin-bottom: 2rem;
                    position: relative;
                }
                
                /* EN-TÊTE COMPACT */
                .header-top {
                    margin-bottom: 10px;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 8px;
                }
                .header-logo-container {
                    text-align: center; 
                    margin-bottom: 6px;
                }
                .header-logo-img {
                    max-width: 120px;
                    height: auto;
                    object-fit: contain;
                }
                .header-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .header-info-left, .header-info-right {
                    font-size: 9px;
                    line-height: 1.3;
                    color: #666;
                    width: 48%;
                }
                .header-info-right {
                    text-align: right;
                }

                /* Ligne de titre/date sous les informations du cabinet */
                .receipt-title-date-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .receipt-title {
                    font-size: 16px;
                    font-weight: bold;
                }
                .receipt-date-box {
                    text-align: right;
                    font-size: 12px;
                }
                .receipt-date-label {
                    font-size: 11px;
                    color: #666;
                }
                .receipt-date {
                    border-bottom: 1px dotted #333;
                    min-width: 110px;
                    font-weight: bold;
                }

                /* Champs */
                .fields {
                    margin-top: 10px;
                    margin-bottom: 20px;
                }
                .field-item {
                    width: 100%;
                    margin-bottom: 5px;
                    display: flex;
                    flex-wrap: wrap; 
                    gap: 10px;
                }
                .row-fields {
                    display: flex;
                    width: 100%;
                    gap: 20px;
                }
                .col-6 {
                    flex: 1;
                    min-width: 45%; 
                }
                .field-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }
                .field-value {
                    border-bottom: 1px dotted #333;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    font-weight: bold;
                }
                
                /* Phrase d'arrêt de note */
                .arret-note {
                    margin-top: 25px;
                    margin-bottom: 20px;
                    text-align: left;
                    background-color: #f0f0f0;
                    padding: 10px 15px;
                    border-radius: 5px;
                }
                .arret-note p {
                    margin: 0;
                    font-size: 13px;
                    font-weight: normal;
                    color: #2c3e50;
                    line-height: 1.6;
                }
                .arret-note .montant-lettres {
                    font-weight: bold;
                }
                
                /* Section Signature avec cachet au-dessus */
                .signature-section {
                    margin-top: 20px;
                }
                .signature-boxes-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .signature-box { 
                    text-align: center; 
                    width: 30%;
                    min-width: 100px;
                    position: relative;
                }
                .cachet-container {
                    text-align: center;
                    margin-top: 15px;
                }
                .cachet-img {
                    max-height: 120px;
                    max-width: 100%;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                }
                .signature-placeholder {
                    display: none; /* Masquer les lignes horizontales */
                }
                .signature-line { 
                    font-size: 12px;
                    margin-top: 5px;
                    font-weight: 500;
                }
                
                .receipt-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .action-btn {
                    background: #007bff;
                    border: none;
                    color: white;
                    border-radius: 5px;
                    padding: 10px 20px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .action-btn:hover {
                    background: #0056b3;
                }
                
                .action-btn-success {
                    background: #28a745;
                }
                
                .action-btn-success:hover {
                    background: #1e7e34;
                }
                
                @media (max-width: 768px) {
                    .print-receipt-page {
                        padding: 1rem;
                    }
                    
                    .receipt-container {
                        padding: 15px;
                    }
                    
                    .receipt-actions {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .action-btn {
                        width: 100%;
                        max-width: 200px;
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="print-receipt-page">
                <div className="receipt-container">
                    <div className="header-top">
                        <div className="header-logo-container">
                            <img src={logoImage} alt="Logo CGM" className="header-logo-img" />
                        </div>
                        <div className="header-info-row">
                            <div className="header-info-left">
                                <div>Matricule fiscale: 1835448D/A/M/000</div>
                                <div>62 Avenue de France, bureau N°3, 1er étage 2013 Ben Arous</div>
                                <div>(+216) 79 410 028</div>
                            </div>
                            <div className="header-info-right">
                                <div>RIB : 25047000000039870129</div>
                                <div>Banque Zitouna Agence Ben Arous</div>
                                <div>contact@ccgm.com.tn</div>
                            </div>
                        </div>
                    </div>

                    <div className="receipt-title-date-row">
                        <div className="receipt-title">Reçu de Règlement en Espèces</div>
                        <div className="receipt-date-box">
                            <div className="receipt-date-label">Date:</div>
                            <div className="receipt-date">{dateStr}</div>
                        </div>
                    </div>

                    <div className="fields">
                        <div className="field-item">
                            <div className="row-fields">
                                <div className="col-6">
                                    <div className="field-label">Client:</div>
                                    <div className="field-value">{clientNom}</div>
                                </div>
                                <div className="col-6">
                                    <div className="field-label">Bénéficiaire:</div>
                                    <div className="field-value">CGM</div>
                                </div>
                            </div>
                        </div>

                        <div className="field-item">
                            <div className="field-label">Objet:</div>
                            <div className="field-value">{charge?.libelle || 'Honoraires reçu'}</div>
                        </div>

                        <div className="field-item">
                            <div className="field-label">Montant reçu:</div>
                            <div className="field-value">{montantFormate} TND</div>
                        </div>
                    </div>

                    <div className="arret-note">
                        <p>ARRÊTÈE LA PRÈSENTE NOTE D'HONORAIRE À LA SOMME DE :<br /><span className="montant-lettres">{montantEnLettresFormate}</span></p>
                    </div>

                    <div className="signature-section">
                        <div className="signature-boxes-row">
                            <div className="signature-box">
                                <div className="signature-placeholder"></div>
                                <div className="signature-line">Signature Client</div>
                            </div>
                            <div className="signature-box">
                                <div className="signature-placeholder"></div>
                                <div className="signature-line">Signature CGM</div>
                            </div>
                            <div className="signature-box">
                                <div className="signature-placeholder"></div>
                                <div className="signature-line">Cachet</div>
                                <div className="cachet-container">
                                    <img src={cachetImage} alt="Cachet CGM" className="cachet-img" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button className="action-btn action-btn-success" onClick={handlePrint}>
                        <i className="fas fa-print"></i>
                        Imprimer
                    </button>
                    <button className="action-btn" onClick={handleBack}>
                        <i className="fas fa-arrow-left"></i>
                        Retour
                    </button>
                </div>
            </div>
        </>
    );
}


