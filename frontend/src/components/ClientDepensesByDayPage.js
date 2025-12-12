import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function ClientDepensesByDayPage() {
    const { id } = useParams(); // Récupérer l'ID du client depuis l'URL
    const [selectedDate, setSelectedDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);

    useEffect(() => {
        // Définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);

        // Récupérer les informations du client
        fetchClientInfo();
    }, [id]);

    const fetchClientInfo = async () => {
        try {
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();
            if (data.success) {
                setClientInfo(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations du client:', error);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleShowDepenses = () => {
        if (!selectedDate) {
            alert('Veuillez sélectionner une date');
            return;
        }
        // Définir le type de dépenses et l'ID du client pour le modal
        window.currentDepensesType = 'client';
        window.currentDepensesClientId = id;
        setShowModal(true);
    };



    return (
        <>
            <style jsx global>{`
                body, html {
                    background: rgb(187, 187, 187) !important;
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .client-depenses-day-page {
                    background: transparent;
                    min-height: 100vh;
                    padding: 0.5rem 0;
                }
                
                .depenses-header { display: none; }
                
                .client-info-card {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    border: 1px solid #d5dbe3;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    max-width: 1100px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .client-info-title {
                    color: #0b5796;
                    font-weight: 700;
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                }
                
                .client-info-text {
                    color: #2c3e50;
                    font-size: 0.9rem;
                    margin-bottom: 0.3rem;
                }
                
                .action-container { 
                    background: #ffffff; 
                    border-radius: 12px; 
                    padding: 1rem 1.5rem; 
                    box-shadow: 0 6px 16px rgba(0,0,0,0.08); 
                    border: 1px solid #d5dbe3; 
                    max-width: 1100px; 
                    margin: 0 auto 1rem auto; 
                }
                
                .filter-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: #ffffff;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
                
                .filter-row { 
                    display: flex; 
                    gap: 0.75rem; 
                    align-items: center; 
                    justify-content: center; 
                    flex-wrap: wrap; 
                }
                
                .filter-row label { 
                    margin-bottom: 0; 
                    color: #2c3e50; 
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .filter-row input[type="date"], 
                .filter-row select { 
                    border: 1px solid #d5dbe3; 
                    border-radius: 8px; 
                    padding: 6px 12px; 
                    font-size: 0.9rem;
                    background: #ffffff;
                    transition: all 0.2s ease;
                }
                
                .filter-row input[type="date"]:focus, 
                .filter-row select:focus {
                    outline: none;
                    border-color: #0b5796;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
                }
                
                .btn-search { 
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%); 
                    color: #fff; 
                    border: none; 
                    border-radius: 8px; 
                    padding: 8px 20px; 
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .btn-search:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(46, 125, 50, 0.3);
                }
                
                .btn-search:disabled {
                    opacity: 0.7;
                    transform: none;
                    cursor: not-allowed;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #2E7D32;
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
                    .action-container {
                        margin: 0.5rem;
                        padding: 1rem;
                    }
                }
            `}</style>

            <div className="client-depenses-day-page">
                <div className="container">
                    {/* Informations du client */}
                    {clientInfo && (
                        <div className="client-info-card">
                            <div className="client-info-title">
                                <i className="fas fa-user me-2"></i>
                                Informations du client
                            </div>
                            <div className="client-info-text">
                                <strong>Nom :</strong> {clientInfo.nom} {clientInfo.prenom}
                            </div>
                            <div className="client-info-text">
                                <strong>Téléphone :</strong> {clientInfo.telephone || 'Non renseigné'}
                            </div>
                            <div className="client-info-text">
                                <strong>Email :</strong> {clientInfo.email || 'Non renseigné'}
                            </div>
                        </div>
                    )}

                    {/* Filtres */}
                    <div className="action-container text-center">
                        <div className="filter-title">Filtrer les dépenses client - Par Jour</div>
                        <div className="filter-row" style={{ marginTop: '0.25rem' }}>
                            <label className="mb-0 me-1">Date</label>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={handleDateChange}
                            />
                            <button 
                                className="btn-search" 
                                onClick={handleShowDepenses} 
                                disabled={loading || !selectedDate}
                            >
                                {loading ? (
                                    <>
                                        <div className="modern-spinner"></div>
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-eye me-2"></i>
                                        Afficher les Dépenses
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
                        type="client"
                        filterType="jour"
                        date={selectedDate}
                        client_id={id}
                    />
                )}
            </div>
        </>
    );
}
