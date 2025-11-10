import React from 'react';
import logoImage from '../assets/logo.png';
import cachetImage from '../assets/cachet.png';

export default function RecuTemplate({ show, onClose, data = null }) {
    if (!show) return null;

    const todayDate = new Date().toLocaleDateString('fr-FR');

    const cabinetInfo = {
        matricule: '1408941/H/A/P/000',
        rib: 'RIB : 25047000000039870129',
        membre: 'Membre de la compagnie des comptables de Tunisie',
        adresse: '62 Avenue de France, bureau N°3, 1er étage 2013 Ben Arous',
        tel: '(+216) 79 410 028',
        email: 'contact@ccgm.com.tn',
        banque: 'Banque Zitouna Agence Ben Arous',
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        // **MODIFIED HTML FOR PRINT: LOGO CENTERED & 3 SIGNATURE BOXES**
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
                        
                        /* EN-TÊTE AVEC LOGO CENTRÉ ET INFOS GAUCHE/DROITE */
                        .header-top {
                            margin-bottom: 20px;
                            border-bottom: 1px solid #ccc; /* Séparateur */
                            padding-bottom: 15px;
                        }
                        .header-logo-container {
                            text-align: center; 
                            margin-bottom: 15px;
                        }
                        .header-logo-img {
                            max-width: 180px;
                            height: auto;
                            object-fit: contain;
                        }
                        .header-info-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                        }
                        .header-info-left, .header-info-right {
                            font-size: 10px;
                            line-height: 1.4;
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
                            margin-bottom: 20px;
                        }
                        .receipt-title {
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .receipt-date-box {
                            text-align: right;
                            font-size: 14px;
                        }
                        .receipt-date-label {
                            font-size: 12px;
                            color: #666;
                        }
                        .receipt-date {
                            min-width: 120px;
                            font-weight: bold;
                        }

                        /* Champs */
                        .fields {
                            margin-top: 20px;
                            margin-bottom: 30px;
                        }
                        .field-item {
                            width: 100%;
                            margin-bottom: 15px;
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
                        
                        /* Nouvelle Section Signature avec 3 blocs */
                        .signature-section {
                            display: flex;
                            justify-content: space-between; /* Distribuer les 3 blocs */
                            align-items: flex-end;
                            margin-top: 40px;
                        }
                        .signature-box { 
                            text-align: center; 
                            width: 30%; /* Pour répartir les 3 éléments */
                            min-width: 100px;
                        }
                        .signature-img { 
                            max-height: 100px; 
                            max-width: 100%; 
                            object-fit: contain; 
                            /* Pour aligner le cachet avec les signatures vides */
                            margin-bottom: 10px; 
                        }
                        .signature-placeholder {
                            height: 100px; /* Espace pour le cachet/la signature manuelle */
                            display: block;
                        }
                        .signature-line { 
                            margin-top: 5px; 
                            padding-top: 5px; 
                            font-size: 12px;
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
                                <img src="${logoImage}" alt="Logo CGM" class="header-logo-img" />
                            </div>
                            <div class="header-info-row">
                                <div class="header-info-left">
                                    <div>Matricule fiscale: ${cabinetInfo.matricule}</div>
                                    <div>${cabinetInfo.banque}</div>
                                    <div>${cabinetInfo.rib}</div>
                                </div>
                                <div class="header-info-right">
                                    <div>${cabinetInfo.membre}</div>
                                    <div>${cabinetInfo.adresse}</div>
                                    <div>${cabinetInfo.tel}</div>
                                    <div>${cabinetInfo.email}</div>
                                </div>
                            </div>
                        </div>

                        <div class="receipt-title-date-row">
             
                           
                        </div>

                        <div class="fields">
                            <div class="field-item">
                                <div class="field-label">SOCIÉTÉ</div>
                                <div class="field-value">${data?.societe || ''}</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">MONTANT</div>
                                <div class="field-value">${data?.montant || ''}</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">BÉNÉFICIAIRE</div>
                                <div class="field-value">${data?.beneficiaire || 'CGM'}</div>
                            </div>
                            
                            <div class="field-item">
                                <div class="field-label">OBJET</div>
                                <div class="field-value">${data?.objet || ''}</div>
                            </div>
                        </div>

                        <div class="signature-section">
                            
                            <div class="signature-box">
                                <span class="signature-placeholder"></span>
                                <div class="signature-line">SIGNATURE CLIENT</div>
                            </div>

                            <div class="signature-box">
                                <span class="signature-placeholder"></span>
                                <div class="signature-line">SIGNATURE CAISSIER</div>
                            </div>
                            
                            <div class="signature-box">
                                <img src="${cachetImage}" alt="Cachet Admin" class="signature-img" />
                                <div class="signature-line">CACHET ET SIGNATURE</div>
                            </div>
                        </div>
                        
                    </div>
                    
                    <script>
                        window.onload = () => { 
                            setTimeout(() => { window.print(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    };

    // --- Reste du composant React (Prévisualisation dans la modale) ---

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Prévisualisation du Reçu</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <div className="modal-body">
                        <div className="container" style={{ maxWidth: 600 }}>
                            <div className="border p-4">

                                {/* EN-TÊTE POUR LA PRÉVISUALISATION (LOGO CENTRÉ) */}
                                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #ccc' }}>
                                    <div className="text-center mb-3">
                                        <img src={logoImage} alt="Logo CGM" style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain' }} />
                                    </div>
                                    <div className="d-flex justify-content-between align-items-start" style={{ fontSize: '10px', lineHeight: '1.4', color: '#666' }}>
                                        <div style={{ width: '48%' }}>
                                            <div>Matricule fiscale: {cabinetInfo.matricule}</div>
                                            <div>{cabinetInfo.banque}</div>
                                            <div>{cabinetInfo.rib}</div>
                                        </div>
                                        <div className="text-end" style={{ width: '48%' }}>
                                            <div>{cabinetInfo.membre}</div>
                                            <div>{cabinetInfo.adresse}</div>
                                            <div>{cabinetInfo.tel}</div>
                                            <div>{cabinetInfo.email}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIGNE DU TITRE ET DATE (Corrigée pour inclure le titre) */}
                                <div className="d-flex justify-content-between align-items-center mb-4 pb-3">

                                    <div className="small text-end pt-1">
                                        <div className="text-muted small">DATE</div>
                                        <div style={{ borderBottom: '1px dotted #333', minWidth: '100px', fontWeight: 'bold' }}>{todayDate}</div>
                                    </div>
                                </div>

                                {/* Détails du reçu */}
                                <div className="row g-3">
                                    <div className="col-12 mb-3">
                                        <div className="small text-muted" >SOCIÉTÉ</div>
                                        <div style={{ borderBottom: '1px dotted #333', height: 28, fontWeight: 'bold' }}>
                                            {data?.societe || ''}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="small text-muted">MONTANT</div>
                                        <div style={{ borderBottom: '1px dotted #333', height: 28, fontWeight: 'bold' }}>
                                            {data?.montant || ''}
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="small text-muted">BÉNÉFICIAIRE</div>
                                        <div style={{ borderBottom: '1px dotted #333', height: 28, fontWeight: 'bold' }}>
                                            {data?.beneficiaire || 'CGM'}
                                        </div>
                                    </div>
                                    <div className="col-12 mb-4">
                                        <div className="small text-muted">OBJET</div>
                                        <div style={{ borderBottom: '1px dotted #333', height: 28, fontWeight: 'bold' }}>
                                            {data?.objet || ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Section Signature MODIFIÉE avec 3 blocs pour la prévisualisation */}
                                <div className="d-flex justify-content-between align-items-end mt-5">

                                    {/* Signature 1: Client (Vide) */}
                                    <div className="text-center" style={{ width: '30%' }}>
                                        <div style={{ minHeight: 60 }}>
                                            {/* Espace vide pour la signature manuelle */}
                                        </div>
                                        <div style={{ borderTop: '1px solid #333', marginTop: 5, paddingTop: 5, fontSize: '12px' }}>SIGNATURE CLIENT</div>
                                    </div>

                                    {/* Signature 2: Caissier (Vide) */}
                                    <div className="text-center" style={{ width: '30%' }}>
                                        <div style={{ minHeight: 60 }}>
                                            {/* Espace vide pour la signature manuelle */}
                                        </div>
                                        <div style={{ borderTop: '1px solid #333', marginTop: 5, paddingTop: 5, fontSize: '12px' }}>SIGNATURE CAISSIER</div>
                                    </div>

                                    {/* Signature 3: Cabinet/Cachet (CGM) */}
                                    <div className="text-center" style={{ width: '30%' }}>
                                        <div style={{ minHeight: 60 }}>
                                            <img src={cachetImage} alt="Cachet Admin" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ borderTop: '1px solid #333', marginTop: 5, paddingTop: 5, fontSize: '12px' }}>CACHET ET SIGNATURE</div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handlePrint}
                        >
                            Imprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}