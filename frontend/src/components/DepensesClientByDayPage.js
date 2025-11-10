import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function DepensesClientByDayPage() {
    const [selectedDate, setSelectedDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleShowDepenses = () => {
        if (!selectedDate) {
            alert('Veuillez sélectionner une date');
            return;
        }
        setShowModal(true);
    };

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .depenses-client-day-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .depenses-header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .depenses-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .depenses-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); color: white; text-decoration: none; }
                .date-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
                .date-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .date-input-group { display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem; }
                .date-label { color: #495057; font-weight: 600; font-size: 1.1rem; min-width: 120px; }
                .date-input { flex: 1; border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 20px; font-size: 1rem; transition: all 0.3s ease; background: #f8f9fa; }
                .date-input:focus { outline: none; border-color: #dc3545; background: white; box-shadow: 0 0 0 3px rgba(220,53,69,0.1); }
                .show-btn { background: linear-gradient(45deg, #dc3545, #c82333); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; min-width: 150px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(220,53,69,0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                @media (max-width: 768px) { .depenses-title { font-size: 2rem; } .date-input-group { flex-direction: column; align-items: stretch; } .date-label { min-width: auto; text-align: center; } .depenses-header, .date-selector-container { margin: 1rem; padding: 1.5rem; } }
            `}</style>

            <div className="depenses-client-day-page">
                <div className="container">
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title">
                                    <i className="fas fa-calendar-day me-3"></i>
                                    Dépenses Client - Par Jour (Global)
                                </h1>
                                <p className="depenses-subtitle">Toutes les dépenses client pour une date donnée</p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    <div className="date-selector-container">
                        <h5 className="date-selector-title"><i className="fas fa-calendar-alt me-2"></i>Sélectionner une date</h5>
                        <div className="date-input-group">
                            <label className="date-label"><i className="fas fa-calendar me-2"></i>Date :</label>
                            <input type="date" className="date-input" value={selectedDate} onChange={handleDateChange} />
                        </div>
                        <div className="text-center">
                            <button className="show-btn" onClick={handleShowDepenses} disabled={loading || !selectedDate}>
                                {loading ? (<><div className="modern-spinner"></div>Chargement...</>) : (<><i className="fas fa-eye me-2"></i>Afficher les Dépenses</>)}
                            </button>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <AllDepensesModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="client"
                        filterType="jour"
                        date={selectedDate}
                    />
                )}
            </div>
        </>
    );
}


