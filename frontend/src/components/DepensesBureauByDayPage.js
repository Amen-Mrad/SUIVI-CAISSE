import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function DepensesBureauByDayPage() {
    const [selectedDate, setSelectedDate] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [mode, setMode] = useState('jour');
    const [loading, setLoading] = useState(false);
    const [depenses, setDepenses] = useState([]);

    useEffect(() => {
        // Définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleShowDepenses = async () => {
        if (mode === 'jour') {
            if (!selectedDate) {
                alert('Veuillez sélectionner une date');
                return;
            }
        } else {
            if (!dateDebut || !dateFin) {
                alert('Veuillez sélectionner une période (début et fin)');
                return;
            }
        }

        try {
            setLoading(true);
            let d1, d2;
            if (mode === 'jour') {
                d1 = selectedDate;
                d2 = selectedDate;
            } else {
                d1 = dateDebut;
                d2 = dateFin;
            }
            const url = `/api/depenses/bureau/par-periode?date_debut=${encodeURIComponent(d1)}&date_fin=${encodeURIComponent(d2)}`;
            const r = await fetch(url);
            const data = await r.json();
            if (data.success) setDepenses(data.depenses || []); else setDepenses([]);
        } catch (_) {
            setDepenses([]);
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .depenses-bureau-day-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 0.75rem 0; }
                
                .depenses-header { display: none; }
                
                .depenses-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .depenses-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-bottom: 2rem;
                }
                
                .modern-back-btn {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    border: none;
                    color: white;
                    border-radius: 12px;
                    padding: 10px 20px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .modern-back-btn:hover {
                    background: linear-gradient(45deg, #5a6268, #343a40);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                    color: white;
                    text-decoration: none;
                }
                
                .date-selector-container { background: white; border-radius: 14px; padding: 1rem; box-shadow: 0 6px 16px rgba(0,0,0,0.06); border: 1px solid #edf0f3; backdrop-filter: none; margin-bottom: 0.75rem; max-width: 700px; margin-left: auto; margin-right: auto; }
                
                .date-selector-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .date-input-group {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                
                .date-label {
                    color: #495057;
                    font-weight: 600;
                    font-size: 1.1rem;
                    min-width: 120px;
                }
                
                .date-input {
                    flex: 1;
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 12px 20px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .date-input:focus {
                    outline: none;
                    border-color: #dc3545;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #dc3545, #c82333);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 150px;
                }
                
                .show-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s;
                }
                
                .show-btn:hover::before {
                    left: 100%;
                }
                
                .show-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(220, 53, 69, 0.4);
                }
                
                .show-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .info-cards { display: none; }
                
                .info-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #dc3545;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #dc3545;
                    margin-bottom: 1rem;
                }
                
                .info-card-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                
                .info-card-text {
                    color: #6c757d;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #dc3545;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .filter-bar { background: white; border: 1px solid #edf0f3; border-radius: 10px; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; gap: 0.5rem; align-items: center; justify-content: center; max-width: 900px; margin: 0 auto 0.75rem auto; flex-wrap: wrap; }
                .filter-bar label { margin-bottom: 0; color: #2c3e50; font-weight: 600; }
                .filter-bar input[type="date"]{ border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .filter-bar .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; }
                
                .inline-results-card { background: white; border-radius: 12px; border: 1px solid #edf0f3; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 1rem; }
                .inline-table { width: 100%; border-collapse: collapse; }
                .inline-table thead th { background: #FFB5FC; color: #2c3e50; border-bottom: 2px solid #e6ebf1; font-weight: 700; }
                .inline-table th, .inline-table td { padding: 0.6rem; border-bottom: 1px solid #eef2f7; text-align: left; }
                .inline-table tbody tr:hover { background: #fafcff; }
                .inline-table tfoot td { background: #FFB5FC; color: #2c3e50; font-weight: 700; border-top: 2px solid #e6ebf1; }
                
                @media (max-width: 768px) {
                    .depenses-title {
                        font-size: 2rem;
                    }
                    
                    .date-input-group {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .date-label {
                        min-width: auto;
                        text-align: center;
                    }
                    
                    .depenses-header,
                    .date-selector-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="depenses-bureau-day-page">
                <div className="container">
                    {/* Header */}
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title">
                                    <i className="fas fa-calendar-day me-3"></i>
                                    Dépenses Bureau - Par Jour
                                </h1>
                                <p className="depenses-subtitle">
                                    Consultez les dépenses du bureau pour une date spécifique
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Informations */}
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <div className="info-card-title">Sélection de date</div>
                            <div className="info-card-text">
                                Choisissez la date pour laquelle vous souhaitez consulter les dépenses du bureau.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="info-card-title">Dépenses bureau</div>
                            <div className="info-card-text">
                                Visualisez toutes les dépenses administratives et opérationnelles du bureau.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="info-card-title">Analyse quotidienne</div>
                            <div className="info-card-text">
                                Analysez les dépenses quotidiennes avec des détails complets.
                            </div>
                        </div>
                    </div>

                    {/* Barre de filtres compacte (comme par mois) */}
                    <div className="filter-bar">
                        <label className="mb-0 me-2"><i className="fas fa-toggle-on me-1"></i>Mode</label>
                        <div className="form-check me-2">
                            <input className="form-check-input" type="radio" id="modeJour" name="mode" checked={mode === 'jour'} onChange={() => setMode('jour')} />
                            <label className="form-check-label" htmlFor="modeJour">Par jour</label>
                        </div>
                        <div className="form-check me-3">
                            <input className="form-check-input" type="radio" id="modePeriode" name="mode" checked={mode === 'periode'} onChange={() => setMode('periode')} />
                            <label className="form-check-label" htmlFor="modePeriode">Par période</label>
                        </div>

                        {mode === 'jour' ? (
                            <>
                                <label className="mb-0 me-2"><i className="fas fa-calendar me-1"></i>Date</label>
                                <input type="date" value={selectedDate} onChange={handleDateChange} />
                            </>
                        ) : (
                            <>
                                <label className="mb-0 me-2"><i className="fas fa-calendar me-1"></i>De</label>
                                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                                <label className="mb-0 ms-2 me-2">à</label>
                                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                            </>
                        )}

                        <button className="btn-search" onClick={handleShowDepenses}>Rechercher</button>
                    </div>
                    {loading && (
                        <div className="text-center my-3"><div className="spinner-border text-danger" role="status"><span className="visually-hidden">Chargement...</span></div></div>
                    )}

                    {!loading && depenses && depenses.length > 0 && (
                        <div className="inline-results-card mt-3">
                            <div className="table-responsive">
                                <table className="inline-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Bénéficiaire</th>
                                            <th>Libellé</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {depenses.map((depense, index) => {
                                            const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                            const isCgmDepense = rawText.includes('[CGM]') || rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
                                            const clientName = isCgmDepense ? 'CGM' : (depense.beneficiaire || depense.client);
                                            const originalClientName = depense.beneficiaire || depense.client;
                                            let baseLibelle = depense.libelle || depense.description || '-';
                                            // Remplacer [CGM] par [PAYÉ PAR CGM] dans l'affichage
                                            baseLibelle = baseLibelle.replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');
                                            const libelleText = originalClientName ? `${baseLibelle} (${originalClientName})` : baseLibelle;
                                            const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
                                            const formatDate = (ds) => {
                                                const d = new Date(ds);
                                                const y = d.getUTCFullYear();
                                                const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                                                const day = String(d.getUTCDate()).padStart(2, '0');
                                                return `${day}/${m}/${y}`;
                                            };
                                            const formatMontant = (montant) => {
                                                const v = parseFloat(montant || 0);
                                                return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
                                            };
                                            return (
                                                <tr key={index}>
                                                    <td>{formatDate(depense.date)}</td>
                                                    <td>{clientName}</td>
                                                    <td>{libelleText}</td>
                                                    <td style={{ color: isHonoraire ? '#198754' : '#dc3545', fontWeight: 700 }}>{formatMontant(depense.montant)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3">TOTAL</td>
                                            <td>{depenses.reduce((s,d)=> s + parseFloat(d.montant||0),0).toLocaleString('fr-FR', {minimumFractionDigits:3, maximumFractionDigits:3})} TND</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
