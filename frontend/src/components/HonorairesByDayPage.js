import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import HonorairesModal from './HonorairesModal';

export default function HonorairesByDayPage() {
    const { id } = useParams(); // ID du client si on est dans les détails client
    const [selectedDate, setSelectedDate] = useState('');
    const [mode, setMode] = useState('jour'); // 'jour' | 'periode'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showModal, setShowModal] = useState(false); // conservé si besoin ailleurs
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState(null);
    const [annee, setAnnee] = useState(new Date().getFullYear());
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [inlineLoading, setInlineLoading] = useState(false);

    useEffect(() => {
        // Définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);

        // Charger les données du client si on est dans les détails client
        if (id) {
            fetchClientData();
        }
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();

            if (data.success) {
                setClient(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données du client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleShowHonoraires = async () => {
        if (mode === 'jour') {
            if (!selectedDate) {
                alert('Veuillez sélectionner une date');
                return;
            }
        } else {
            if (!startDate || !endDate) {
                alert('Veuillez sélectionner la période (date début et date fin)');
                return;
            }
        }
        try {
            setInlineLoading(true);
            const params = new URLSearchParams();
            params.append('libelle', 'HONORAIRES REÇU');
            let endpoint = '/api/honoraires/par-jour';
            if (mode === 'jour') {
                params.append('date', selectedDate);
            } else {
                endpoint = '/api/honoraires/par-periode';
                params.append('date_debut', startDate);
                params.append('date_fin', endDate);
            }
            const r = await fetch(`${endpoint}?${params.toString()}`);
            const d = await r.json();
            if (d && d.success) {
                setResults(d.honoraires || []);
                const t = (d.honoraires || []).reduce((s, h) => s + parseFloat((h.avance ?? h.montant) || 0), 0);
                setTotal(t);
            } else {
                setResults([]);
                setTotal(0);
            }
        } catch (_) {
            setResults([]);
            setTotal(0);
        } finally {
            setInlineLoading(false);
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
                
                .honoraires-by-day-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 0.75rem 0; /* compact */
                }
                
                .honoraires-header { display: none; } /* supprimer le gros en-tête */
                
                .honoraires-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .honoraires-subtitle {
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
                
                .date-selector-container {
                    background: white;
                    border-radius: 14px;
                    padding: 1rem; /* compact */
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    border: 1px solid #edf0f3;
                    backdrop-filter: none;
                    margin-bottom: 0.75rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .date-selector-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem; /* compact */
                    margin-bottom: 0.75rem; /* compact */
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
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #28a745, #20c997);
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
                    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.4);
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
                    border-left: 4px solid #667eea;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #667eea;
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
                    border-top: 2px solid #28a745;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 768px) {
                    .honoraires-title {
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
                    
                    .honoraires-header,
                    .date-selector-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
                
                .client-info-card { 
                    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(30, 136, 229, 0.05));
                    backdrop-filter: blur(10px);
                    border-radius: 20px; 
                    padding: 2rem; 
                    margin-bottom: 2rem; 
                    border: 1px solid rgba(33, 150, 243, 0.2);
                    box-shadow: 0 10px 25px rgba(33, 150, 243, 0.1);
                    animation: slideInUp 0.8s ease-out 0.2s both;
                    position: relative;
                    overflow: hidden;
                }
                
                .client-info-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(180deg, #2196f3, #1976d2);
                }
                
                .client-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                
                .client-info-item {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 15px;
                    padding: 1.5rem;
                    text-align: center;
                    border: 1px solid rgba(33, 150, 243, 0.1);
                    transition: all 0.3s ease;
                }
                
                .client-info-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(33, 150, 243, 0.15);
                    background: rgba(255, 255, 255, 0.95);
                }
                
                .client-info-label {
                    color: #1976d2;
                    font-weight: 700;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .client-info-value {
                    color: #333;
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .inline-results-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #edf0f3;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    padding: 1rem;
                    margin-top: 0.75rem;
                }
                .inline-table { width: 100%; border-collapse: collapse; }
                .inline-table thead th {
                    background: #FFB5FC;
                    color: #2c3e50;
                    border-bottom: 2px solid #e6ebf1;
                    font-weight: 700;
                }
                .inline-table th, .inline-table td { padding: 0.6rem; border-bottom: 1px solid #eef2f7; text-align: left; }
                .inline-table tbody tr:hover { background: #fafcff; }
                .inline-table tfoot td { background: #FFB5FC; color: #2c3e50; font-weight: 700; border-top: 2px solid #e6ebf1; }

                .filter-bar {
                    background: white;
                    border: 1px solid #edf0f3;
                    border-radius: 10px;
                    padding: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    display: flex; gap: 0.5rem; align-items: center; justify-content: center;
                    max-width: 600px; margin: 0 auto 0.75rem auto;
                }
                .filter-bar input[type="date"] { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .filter-bar .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; }

                .mode-toggle { display: flex; gap: 8px; justify-content: center; margin: 0.25rem auto 0.5rem auto; }
                .mode-btn { border: 1px solid #dfe3e7; background: #fff; padding: 6px 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .mode-btn.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
            `}</style>

            <div className="honoraires-by-day-page">
                <div className="container">
                    {/* Header */}
                    <div className="honoraires-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="honoraires-title">
                                    <i className="fas fa-calendar-day me-3"></i>
                                    Honoraires par Jour
                                </h1>
                                <p className="honoraires-subtitle">
                                    Consultez les honoraires reçus pour une date spécifique
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Informations du client - visible uniquement dans les détails client */}
                    {id && client && (
                        <div className="client-info-card">
                            <div className="client-info-grid">
                                <div className="client-info-item">
                                    <div className="client-info-label">
                                        <i className="fas fa-user me-2"></i>
                                        NOM ET PRENOM
                                    </div>
                                    <div className="client-info-value">{client?.nom} {client?.prenom}</div>
                                </div>
                                <div className="client-info-item">
                                    <div className="client-info-label">
                                        <i className="fas fa-phone me-2"></i>
                                        TÉLÉPHONE
                                    </div>
                                    <div className="client-info-value">{client?.telephone}</div>
                                </div>
                                <div className="client-info-item">
                                    <div className="client-info-label">
                                        <i className="fas fa-calendar me-2"></i>
                                        ANNÉE
                                    </div>
                                    <select
                                        className="form-select"
                                        value={annee}
                                        onChange={(e) => setAnnee(parseInt(e.target.value))}
                                        style={{
                                            border: '2px solid #e9ecef',
                                            borderRadius: '10px',
                                            padding: '8px 12px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: '#495057',
                                            background: '#f8f9fa',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const year = new Date().getFullYear() - 5 + i;
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Résultats inline */}
                                <div className="container">
                                    {/* Barre de filtre compacte */}
                                    <div className="filter-bar">
                                        <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Date</label>
                                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                        <button className="btn-search" onClick={handleShowHonoraires}>Rechercher</button>
                                    </div>

                                    {(inlineLoading) && (
                                        <div className="text-center my-3">
                                            <div className="spinner-border text-success" role="status">
                                                <span className="visually-hidden">Chargement...</span>
                                            </div>
                                        </div>
                                    )}
                                    {!inlineLoading && results && results.length > 0 && (
                                        <div className="inline-results-card">
                                            <div className="table-responsive">
                                                <table className="inline-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Client</th>
                                                            <th>Libellé</th>
                                                            <th>Montant</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {results.map((h, idx) => (
                                                            <tr key={idx}>
                                                                <td>{new Date(h.date).toLocaleDateString('fr-FR')}</td>
                                                                <td>{h.client_nom || h.client || ''}</td>
                                                                <td>{h.libelle || 'HONORAIRES REÇU'}</td>
                                                                <td style={{ color: '#198754', fontWeight: 700 }}>{Number((h.avance ?? h.montant) || 0).toLocaleString('fr-FR')} TND</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <td colSpan="3">TOTAL</td>
                                                            <td>{total.toLocaleString('fr-FR')} TND</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Sélecteur de mode et filtres */}
                    <div className="container">
                        <div className="mode-toggle">
                            <button className={`mode-btn ${mode === 'jour' ? 'active' : ''}`} onClick={() => setMode('jour')}>Par jour</button>
                            <button className={`mode-btn ${mode === 'periode' ? 'active' : ''}`} onClick={() => setMode('periode')}>Par période</button>
                        </div>

                        {mode === 'jour' ? (
                            <div className="filter-bar" style={{ marginTop: '0.25rem' }}>
                                <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Date</label>
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                <button className="btn-search" onClick={handleShowHonoraires}>Rechercher</button>
                            </div>
                        ) : (
                            <div className="filter-bar" style={{ marginTop: '0.25rem' }}>
                                <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>De</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                <label className="ms-2 me-2 mb-0">à</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                <button className="btn-search" onClick={handleShowHonoraires}>Rechercher</button>
                            </div>
                        )}

                        {(inlineLoading) && (
                            <div className="text-center my-3">
                                <div className="spinner-border text-success" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        )}
                        {!inlineLoading && results && results.length > 0 && (
                            <div className="inline-results-card">
                                <div className="table-responsive">
                                    <table className="inline-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Client</th>
                                                <th>Libellé</th>
                                                <th>Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((h, idx) => (
                                                <tr key={idx}>
                                                    <td>{new Date(h.date).toLocaleDateString('fr-FR')}</td>
                                                    <td>{h.client_nom || h.client || ''}</td>
                                                    <td>{h.libelle || 'HONORAIRES REÇU'}</td>
                                                    <td style={{ color: '#198754', fontWeight: 700 }}>{Number((h.avance ?? h.montant) || 0).toLocaleString('fr-FR')} TND</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3">TOTAL</td>
                                                <td>{total.toLocaleString('fr-FR')} TND</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Informations */}
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <div className="info-card-title">Sélection de date</div>
                            <div className="info-card-text">
                                Choisissez la date pour laquelle vous souhaitez consulter les honoraires reçus.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="info-card-title">Données détaillées</div>
                            <div className="info-card-text">
                                Visualisez tous les honoraires reçus avec les détails des clients et montants.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-print"></i>
                            </div>
                            <div className="info-card-title">Impression</div>
                            <div className="info-card-text">
                                Imprimez facilement les reçus et états des honoraires pour la date sélectionnée.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal des honoraires */}
                {showModal && (
                    <HonorairesModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="jour"
                        date={selectedDate}
                    />
                )}
            </div>
        </>
    );
}
