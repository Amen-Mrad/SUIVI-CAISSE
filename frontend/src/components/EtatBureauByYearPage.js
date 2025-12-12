import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatBureauByYearPage() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [tab, setTab] = useState('annee'); // 'jour' | 'mois' | 'annee'
    const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowEtat = () => {
        // Réinitialiser les variables globales pour l'état bureau
        window.currentEtatClientId = null;
        window.currentEtatType = 'bureau';
        setShowModal(true);
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .etat-bureau-year-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .etat-header { display: none; }
                .etat-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .etat-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); color: white; text-decoration: none; }
                .year-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 700px; margin-left: auto; margin-right: auto; }
                .year-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .year-input-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
                .input-label { color: #495057; font-weight: 600; font-size: 1.1rem; text-align: center; }
                .year-select { border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 20px; font-size: 1.1rem; transition: all 0.3s ease; background: #f8f9fa; text-align: center; }
                .year-select:focus { outline: none; border-color: #ffc107; background: white; box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1); }
                .show-btn { background: linear-gradient(45deg, #ffc107, #e0a800); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; min-width: 150px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255, 193, 7, 0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                .tabs { display: inline-flex; background: #f1f5f9; border-radius: 999px; padding: 4px; margin-bottom: 10px; }
                .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 999px; font-weight: 700; color: #334155; }
                .tab-btn.active { background: #0d6efd; color: white; box-shadow: 0 4px 10px rgba(13,110,253,.3); }
                .filter-row { display: flex; gap: 0.5rem; align-items: center; justify-content: center; flex-wrap: wrap; }
                .filter-row input[type="date"], .filter-row select { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .info-cards { display: none; }
                .info-card { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 1.5rem; border-left: 4px solid #ffc107; transition: all 0.3s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .info-card-icon { font-size: 2rem; color: #ffc107; margin-bottom: 1rem; }
                .info-card-title { color: #2c3e50; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .info-card-text { color: #6c757d; font-size: 0.9rem; line-height: 1.5; }
                .modern-spinner { width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #ffc107; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) { .etat-title { font-size: 2rem; } .etat-header, .year-selector-container { margin: 1rem; padding: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="etat-bureau-year-page">
                <div className="container">
                    <div className="etat-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="etat-title"><i className="fas fa-calendar me-3"></i>État Bureau - Par Année</h1>
                                <p className="etat-subtitle">Consultez l'état du bureau pour une année complète</p>
                            </div>
                            <Link to="/" className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-calendar-year"></i></div>
                            <div className="info-card-title">Vue annuelle</div>
                            <div className="info-card-text">Consultez l'état du bureau au cours d'une année complète.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-building"></i></div>
                            <div className="info-card-title">État bureau</div>
                            <div className="info-card-text">Visualisez l'état complet du bureau avec honoraires et dépenses.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-chart-pie"></i></div>
                            <div className="info-card-title">Analyse complète</div>
                            <div className="info-card-text">Analysez les tendances et performances sur toute l'année.</div>
                        </div>
                    </div>

                    <div className="year-selector-container text-center">
                        <h5 className="year-selector-title"><i className="fas fa-filter me-2"></i>Filtrer l'état CGM</h5>
                        <div className="tabs">
                            <button className={`tab-btn ${tab === 'jour' ? 'active' : ''}`} onClick={() => setTab('jour')}>Jour</button>
                            <button className={`tab-btn ${tab === 'mois' ? 'active' : ''}`} onClick={() => setTab('mois')}>Mois</button>
                            <button className={`tab-btn ${tab === 'annee' ? 'active' : ''}`} onClick={() => setTab('annee')}>Année</button>
                        </div>
                        {tab === 'jour' && (
                            <div className="filter-row">
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jDate" name="jmode" checked={jourMode === 'date'} onChange={() => setJourMode('date')} />
                                    <label className="form-check-label" htmlFor="jDate">Par date</label>
                                </div>
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jPeriode" name="jmode" checked={jourMode === 'periode'} onChange={() => setJourMode('periode')} />
                                    <label className="form-check-label" htmlFor="jPeriode">Par période</label>
                                </div>
                                {jourMode === 'date' ? (
                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                ) : (
                                    <>
                                        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                                        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                                    </>
                                )}
                            </div>
                        )}
                        {tab === 'mois' && (
                            <div className="filter-row">
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{String(m).padStart(2, '0')}</option>))}
                                </select>
                                <select value={selectedYear} onChange={handleYearChange}>
                                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                                </select>
                            </div>
                        )}
                        {tab === 'annee' && (
                            <div className="filter-row">
                                <select value={selectedYear} onChange={handleYearChange}>
                                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                                </select>
                            </div>
                        )}
                        <div className="text-center" style={{ marginTop: '10px' }}>
                            <button className="show-btn" onClick={handleShowEtat} disabled={loading}>
                                {loading ? (<><div className="modern-spinner"></div>Chargement...</>) : (<><i className="fas fa-chart-line me-2"></i>Afficher l'État</>)}
                            </button>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <EtatCgmModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="bureau"
                        filterType={tab === 'jour' ? (jourMode === 'date' ? 'jour' : 'periode') : tab}
                        date={tab === 'jour' && jourMode === 'date' ? selectedDate : null}
                        dateDebut={tab === 'jour' && jourMode === 'periode' ? dateDebut : null}
                        dateFin={tab === 'jour' && jourMode === 'periode' ? dateFin : null}
                        mois={tab === 'mois' ? selectedMonth : null}
                        annee={tab === 'mois' || tab === 'annee' ? selectedYear : null}
                    />
                )}
            </div>
        </>
    );
}
