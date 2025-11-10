import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function DepensesClientByMonthPage() {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const currentMonth = new Date().getMonth() + 1;
        setSelectedMonth(currentMonth.toString().padStart(2, '0'));
    }, []);

    const months = [
        { value: '01', label: 'Janvier' },
        { value: '02', label: 'Février' },
        { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' },
        { value: '05', label: 'Mai' },
        { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' },
        { value: '08', label: 'Août' },
        { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' },
        { value: '12', label: 'Décembre' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    const handleShowDepenses = () => {
        if (!selectedMonth) {
            alert('Veuillez sélectionner un mois');
            return;
        }
        setShowModal(true);
    };

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .depenses-client-month-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .depenses-header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .depenses-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .depenses-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); color: white; text-decoration: none; }
                .month-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
                .month-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .month-input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-label { color: #495057; font-weight: 600; font-size: 1rem; }
                .month-select, .year-select { border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 16px; font-size: 1rem; transition: all 0.3s ease; background: #f8f9fa; }
                .month-select:focus, .year-select:focus { outline: none; border-color: #dc3545; background: white; box-shadow: 0 0 0 3px rgba(220,53,69,0.1); }
                .show-btn { background: linear-gradient(45deg, #dc3545, #c82333); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; min-width: 150px; }
            `}</style>

            <div className="depenses-client-month-page">
                <div className="container">
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title"><i className="fas fa-calendar-alt me-3"></i>Dépenses Client - Par Mois (Global)</h1>
                                <p className="depenses-subtitle">Toutes les dépenses client pour un mois donné</p>
                            </div>
                            <Link to="/" className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    <div className="month-selector-container">
                        <h5 className="month-selector-title"><i className="fas fa-calendar-alt me-2"></i>Sélectionner un mois</h5>
                        <div className="month-input-group">
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar me-2"></i>Mois :</label>
                                <select className="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                    <option value="">Sélectionner un mois</option>
                                    {months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar-year me-2"></i>Année :</label>
                                <select className="year-select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="text-center">
                            <button className="show-btn" onClick={handleShowDepenses} disabled={loading || !selectedMonth}>
                                {loading ? 'Chargement...' : (<><i className="fas fa-eye me-2"></i>Afficher les Dépenses</>)}
                            </button>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <AllDepensesModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="client"
                        filterType="mois"
                        mois={selectedMonth}
                        annee={selectedYear}
                    />
                )}
            </div>
        </>
    );
}


