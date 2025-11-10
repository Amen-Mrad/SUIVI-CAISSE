import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function AllDepensesBureauPage() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('mois'); // 'jour' | 'mois' | 'annee'
    const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
    const [selectedDate, setSelectedDate] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // Date du jour par défaut
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    const handleSearch = () => {
        // Définir le type de dépenses pour le modal
        window.currentDepensesType = 'bureau';
        setShowModal(true);
    };

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .all-depenses-bureau-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 0.75rem 0; }
                
                .depenses-bureau-header { display: none; }
                
                .depenses-bureau-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .depenses-bureau-subtitle {
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
                
                .action-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                    text-align: center;
                }
                
                .action-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                }
                
                .action-description {
                    color: #6c757d;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 15px 30px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 200px;
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
                    .depenses-bureau-title {
                        font-size: 2rem;
                    }
                    
                    .depenses-bureau-header,
                    .action-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="all-depenses-bureau-page">
                <div className="container">
                    {/* Header */}
                    <div className="depenses-bureau-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-bureau-title">
                                    <i className="fas fa-credit-card me-3"></i>
                                    Toutes les Dépenses Bureau
                                </h1>
                                <p className="depenses-bureau-subtitle">
                                    Consultez toutes les dépenses du bureau avec filtrage et recherche
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
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="info-card-title">Vue globale</div>
                            <div className="info-card-text">
                                Consultez toutes les dépenses du bureau de tous les bénéficiaires.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-filter"></i>
                            </div>
                            <div className="info-card-title">Filtrage avancé</div>
                            <div className="info-card-text">
                                Filtrez les dépenses par bénéficiaire, date ou montant si nécessaire.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-download"></i>
                            </div>
                            <div className="info-card-title">Export complet</div>
                            <div className="info-card-text">
                                Exportez et imprimez toutes les dépenses avec options de filtrage.
                            </div>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="action-container">
                        <h5 className="action-title">
                            <i className="fas fa-filter me-2"></i>
                            Filtrer les dépenses CGM
                        </h5>

                        {/* Choix type de filtre */}
                        <div className="d-flex justify-content-center gap-2 mb-3">
                            <button className={`btn ${filterType === 'jour' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterType('jour')}>
                                <i className="fas fa-calendar-day me-1"></i> Jour
                            </button>
                            <button className={`btn ${filterType === 'mois' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterType('mois')}>
                                <i className="fas fa-calendar-alt me-1"></i> Mois
                            </button>
                            <button className={`btn ${filterType === 'annee' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterType('annee')}>
                                <i className="fas fa-calendar me-1"></i> Année
                            </button>
                        </div>

                        {/* Sous filtres */}
                        {filterType === 'jour' && (
                            <>
                                <div className="d-flex justify-content-center gap-3 mb-3">
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" id="modeDate" name="jourMode" checked={jourMode === 'date'} onChange={() => setJourMode('date')} />
                                        <label className="form-check-label" htmlFor="modeDate">Par date</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" id="modePeriode" name="jourMode" checked={jourMode === 'periode'} onChange={() => setJourMode('periode')} />
                                        <label className="form-check-label" htmlFor="modePeriode">Par période</label>
                                    </div>
                                </div>
                                {jourMode === 'date' ? (
                                    <div className="d-flex justify-content-center gap-2 mb-3">
                                        <input type="date" className="form-control" style={{ maxWidth: '260px' }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center gap-2 mb-3">
                                        <input type="date" className="form-control" style={{ maxWidth: '260px' }} value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                                        <span className="align-self-center">à</span>
                                        <input type="date" className="form-control" style={{ maxWidth: '260px' }} value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                                    </div>
                                )}
                            </>
                        )}

                        {filterType === 'mois' && (
                            <div className="d-flex justify-content-center gap-2 mb-3">
                                <select className="form-select" style={{ maxWidth: '200px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <select className="form-select" style={{ maxWidth: '200px' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 7 }, (_, i) => selectedYear - 3 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterType === 'annee' && (
                            <div className="d-flex justify-content-center gap-2 mb-3">
                                <select className="form-select" style={{ maxWidth: '200px' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="text-center">
                            <button
                                className="show-btn"
                                onClick={handleSearch}
                                disabled={loading || (filterType === 'jour' && (jourMode === 'date' ? !selectedDate : (!dateDebut || !dateFin)))}
                            >
                                {loading ? (
                                    <>
                                        <div className="modern-spinner"></div>
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-search me-2"></i>
                                        Rechercher
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal des dépenses */}
                {showModal && (
                    <AllDepensesModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="bureau"
                        filterType={filterType === 'jour' ? (jourMode === 'date' ? 'jour' : 'periode') : filterType}
                        date={filterType === 'jour' && jourMode === 'date' ? selectedDate : null}
                        date_debut={filterType === 'jour' && jourMode === 'periode' ? dateDebut : (filterType === 'periode' ? dateDebut : null)}
                        date_fin={filterType === 'jour' && jourMode === 'periode' ? dateFin : (filterType === 'periode' ? dateFin : null)}
                        mois={filterType === 'mois' ? selectedMonth : null}
                        annee={filterType === 'mois' || filterType === 'annee' ? selectedYear : null}
                        actionMode="delete"
                    />
                )}
            </div>
        </>
    );
}
