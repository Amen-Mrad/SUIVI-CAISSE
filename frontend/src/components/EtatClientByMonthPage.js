import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatClientByMonthPage() {
    const { id } = useParams(); // ID du client
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState(null);

    useEffect(() => {
        const currentMonth = new Date().getMonth() + 1;
        setSelectedMonth(currentMonth.toString().padStart(2, '0'));
        fetchClientData();
    }, [id]);

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
        // Définir les variables globales pour le client spécifique
        window.currentEtatClientId = id;
        window.currentEtatType = 'client';
        setShowModal(true);
    };

    const fetchClientData = async () => {
        try {
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();
            if (data.success) {
                setClient(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données client:', error);
        }
    };

    const handleBack = () => {
        navigate(`/client/${id}/charges`);
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
                .month-selector-title { color: #495057; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; text-align: center; }
                .month-input-group { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
                .month-label { color: #6c757d; font-weight: 500; font-size: 1rem; }
                .month-input, .year-input { padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 12px; font-size: 1rem; transition: all 0.3s ease; background: rgba(255, 255, 255, 0.9); min-width: 200px; }
                .month-input:focus, .year-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
                .action-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem; }
                .modern-btn { border: none; border-radius: 12px; padding: 12px 24px; font-weight: 600; font-size: 1rem; transition: all 0.3s ease; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
                .btn-primary { background: linear-gradient(45deg, #667eea, #764ba2); color: white; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
                .btn-success { background: linear-gradient(45deg, #28a745, #20c997); color: white; }
                .btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4); }
                .client-info { background: rgba(102, 126, 234, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; text-align: center; }
                .client-info h5 { color: #667eea; margin-bottom: 1rem; }
                .client-info-item { margin-bottom: 0.5rem; font-weight: 500; }
                @media (max-width: 768px) {
                    .etat-bureau-month-page { padding: 1rem 0; }
                    .etat-header, .month-selector-container { padding: 1.5rem; margin-left: 1rem; margin-right: 1rem; }
                    .etat-title { font-size: 2rem; }
                    .action-buttons { flex-direction: column; align-items: center; }
                    .modern-btn { width: 100%; max-width: 250px; justify-content: center; }
                }
            `}</style>

            <div className="etat-bureau-month-page">
                <div className="container">
                    <div className="etat-header">
                        <h1 className="etat-title">
                            <i className="fas fa-chart-line me-3"></i>
                            État Client - Par Mois
                        </h1>
                        <p className="etat-subtitle">
                            Consultez l'état du client pour un mois spécifique
                        </p>
                        <button className="modern-back-btn" onClick={handleBack}>
                            <i className="fas fa-arrow-left"></i>
                            Retour
                        </button>
                    </div>

                    {/* Informations du client */}
                    {client && (
                        <div className="client-info">
                            <h5><i className="fas fa-user me-2"></i>Informations du client</h5>
                            <div className="client-info-item"><strong>Nom :</strong> {client.nom} {client.prenom}</div>
                            <div className="client-info-item"><strong>Téléphone :</strong> {client.telephone}</div>
                            <div className="client-info-item"><strong>Email :</strong> {client.email || 'Non renseigné'}</div>
                        </div>
                    )}

                    <div className="action-container" style={{ maxWidth: '900px', margin: '0 auto 1rem auto', background: 'white', borderRadius: '16px', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #edf0f3', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#334155', marginBottom: '0.5rem' }}>Filtrer l'état client</div>
                        <div className="filter-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            <label className="mb-0 me-1" style={{ marginBottom: 0, color: '#2c3e50', fontWeight: 600 }}>Mois</label>
                            <select value={selectedMonth} onChange={handleMonthChange} style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}>
                                <option value="">Sélectionner un mois</option>
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                            <label className="mb-0 ms-2 me-1" style={{ marginBottom: 0, color: '#2c3e50', fontWeight: 600 }}>Année</label>
                            <select value={selectedYear} onChange={handleYearChange} style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <button className="btn-search" onClick={handleShowEtat} disabled={loading} style={{ background: 'linear-gradient(45deg, #28a745, #20c997)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Rechercher</button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <EtatCgmModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    type="client"
                    filterType="mois"
                    mois={selectedMonth}
                    annee={selectedYear}
                />
            )}
        </>
    );
}