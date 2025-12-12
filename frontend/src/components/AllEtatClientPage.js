import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function AllEtatClientPage() {
    const { id } = useParams(); // ID du client
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState(null);

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const handleShowEtat = () => {
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

    return (
        <>
            <style jsx global>{`
                body, html {
                    background: rgb(187, 187, 187) !important;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                }
                
                .etat-client-page {
                    background: transparent;
                    min-height: 100vh;
                    padding: 0.5rem 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .etat-client-container {
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
                    border: 1px solid #d5dbe3;
                    padding: 1.5rem 2rem;
                    max-width: 1100px;
                    width: 100%;
                    margin: 0 auto;
                    position: relative;
                }
                
                .etat-client-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e9ecef;
                }
                
                .etat-client-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.8rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                
                .etat-client-subtitle {
                    color: #6c757d;
                    font-size: 1rem;
                    font-weight: 500;
                }
                
                .etat-client-info {
                    background: #f4f6f8;
                    border-radius: 8px;
                    padding: 1rem 1.25rem;
                    margin-bottom: 1.5rem;
                    border-left: 4px solid #0b5796;
                }
                
                .info-text {
                    color: #495057;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin: 0;
                }
                
                .etat-client-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .action-btn {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    border: none;
                    color: white;
                    border-radius: 8px;
                    padding: 10px 20px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                }
                
                .action-btn:hover {
                    background: linear-gradient(135deg, #0a4c83 0%, #0c5fa9 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(11, 87, 150, 0.3);
                }
                
                .action-btn-success {
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%);
                }
                
                .action-btn-success:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    box-shadow: 0 6px 14px rgba(46, 125, 50, 0.3);
                }
                
                @media (max-width: 768px) {
                    .etat-client-page {
                        padding: 0.5rem;
                    }
                    
                    .etat-client-container {
                        padding: 1.25rem;
                        margin: 0 0.5rem;
                    }
                    
                    .etat-client-title {
                        font-size: 1.5rem;
                    }
                    
                    .etat-client-actions {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .action-btn {
                        width: 100%;
                        max-width: 200px;
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="etat-client-page">
                <div className="etat-client-container">
                    <div className="etat-client-header">
                        <h1 className="etat-client-title">
                            <i className="fas fa-chart-line me-2"></i>
                            État Client - Toutes les Données
                        </h1>
                        <p className="etat-client-subtitle">Consultez l'état complet du client</p>
                    </div>

                    {/* Informations du client */}
                    {client && (
                        <div className="etat-client-info">
                            <h5><i className="fas fa-user me-2"></i>Informations du client</h5>
                            <div className="info-text">
                                <strong>Nom :</strong> {client.nom} {client.prenom}<br />
                                <strong>Téléphone :</strong> {client.telephone}<br />
                                <strong>Email :</strong> {client.email || 'Non renseigné'}
                            </div>
                        </div>
                    )}

                    <div className="etat-client-info">
                        <p className="info-text">
                            <i className="fas fa-info-circle me-2"></i>
                            Cette vue affiche toutes les données d'état du client, incluant tous les honoraires reçus et toutes les dépenses,
                            sans filtre de date. Vous pourrez voir un résumé complet de l'activité du client.
                        </p>
                    </div>

                    <div className="etat-client-actions">
                        <button className="action-btn action-btn-success" onClick={handleShowEtat}>
                            <i className="fas fa-eye"></i>
                            Afficher l'État
                        </button>
                        <button className="action-btn" onClick={handleBack}>
                            <i className="fas fa-arrow-left"></i>
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <EtatCgmModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    filteredData={{
                        filterType: 'toutes',
                        filterValue: 'Toutes les données',
                        clientId: id
                    }}
                />
            )}
        </>
    );
}
