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
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                
                .etat-client-page {
                    min-height: 100vh;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .etat-client-container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 3rem;
                    max-width: 600px;
                    width: 100%;
                    margin-bottom: 2rem;
                    position: relative;
                    overflow: hidden;
                }
                
                .etat-client-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
                }
                
                .etat-client-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e9ecef;
                }
                
                .etat-client-title {
                    font-size: 2rem;
                    font-weight: 800;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.5rem;
                }
                
                .etat-client-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                
                .etat-client-info {
                    background: linear-gradient(45deg, #e3f2fd, #f3e5f5);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    border-left: 4px solid #667eea;
                }
                
                .info-text {
                    color: #495057;
                    font-size: 1rem;
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
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 12px 24px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }
                
                .action-btn-success {
                    background: linear-gradient(45deg, #4caf50, #45a049);
                }
                
                .action-btn-success:hover {
                    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);
                }
                
                @media (max-width: 768px) {
                    .etat-client-page {
                        padding: 1rem;
                    }
                    
                    .etat-client-container {
                        padding: 2rem;
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
