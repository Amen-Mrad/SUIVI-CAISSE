import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatBureauByMonthPage() {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const currentMonth = new Date().getMonth() + 1;
        setSelectedMonth(currentMonth.toString().padStart(2, '0'));
    }, []);

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowEtat = () => {
        if (!selectedMonth) {
            alert('Veuillez sélectionner un mois');
            return;
        }
        setShowModal(true);
    };

    const months = [
        { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' }, { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' }, { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' }, { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' }, { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .etat-bureau-month-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .etat-header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .etat-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .etat-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); color: white; text-decoration: none; }
                .month-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
                .month-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .month-input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-label { color: #495057; font-weight: 600; font-size: 1rem; }
                .month-select, .year-select { border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 16px; font-size: 1rem; transition: all 0.3s ease; background: #f8f9fa; }
                .month-select:focus, .year-select:focus { outline: none; border-color: #ffc107; background: white; box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1); }
                .show-btn { background: linear-gradient(45deg, #ffc107, #e0a800); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; min-width: 150px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255, 193, 7, 0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .info-card { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 1.5rem; border-left: 4px solid #ffc107; transition: all 0.3s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .info-card-icon { font-size: 2rem; color: #ffc107; margin-bottom: 1rem; }
                .info-card-title { color: #2c3e50; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .info-card-text { color: #6c757d; font-size: 0.9rem; line-height: 1.5; }
                .modern-spinner { width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #ffc107; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) { .etat-title { font-size: 2rem; } .month-input-group { grid-template-columns: 1fr; } .etat-header, .month-selector-container { margin: 1rem; padding: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="etat-bureau-month-page">
                <div className="container">
                    <div className="etat-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="etat-title"><i className="fas fa-calendar-alt me-3"></i>État Bureau - Par Mois</h1>
                                <p className="etat-subtitle">Consultez l'état du bureau pour un mois spécifique</p>
                            </div>
                            <Link to="/" className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-calendar-week"></i></div>
                            <div className="info-card-title">Sélection mensuelle</div>
                            <div className="info-card-text">Choisissez le mois et l'année pour consulter l'état du bureau.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-building"></i></div>
                            <div className="info-card-title">État bureau</div>
                            <div className="info-card-text">Visualisez l'état complet du bureau avec honoraires et dépenses.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-chart-bar"></i></div>
                            <div className="info-card-title">Vue mensuelle</div>
                            <div className="info-card-text">Analysez l'état mensuel avec des calculs et synthèses détaillés.</div>
                        </div>
                    </div>

                    <div className="month-selector-container">
                        <h5 className="month-selector-title"><i className="fas fa-calendar-alt me-2"></i>Sélectionner un mois</h5>

                        <div className="month-input-group">
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar me-2"></i>Mois :</label>
                                <select className="month-select" value={selectedMonth} onChange={handleMonthChange}>
                                    <option value="">Sélectionner un mois</option>
                                    {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar-year me-2"></i>Année :</label>
                                <select className="year-select" value={selectedYear} onChange={handleYearChange}>
                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="text-center">
                            <button className="show-btn" onClick={handleShowEtat} disabled={loading || !selectedMonth}>
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
                        filterType="mois"
                        mois={selectedMonth}
                        annee={selectedYear}
                    />
                )}
            </div>
        </>
    );
}
