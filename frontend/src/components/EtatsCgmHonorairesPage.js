import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatsCgmHonorairesPage() {
    const { id } = useParams(); // ID du client
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState(null);

    useEffect(() => {
        fetchClientData();
        // Ne plus ouvrir automatiquement le modal au chargement de la page
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
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .etat-cgm-honoraires-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                .etat-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .etat-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .etat-subtitle {
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
                
                .client-info {
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .client-info h5 {
                    color: #667eea;
                    margin-bottom: 1rem;
                }
                
                .client-info-item {
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 2rem;
                }
                
                .modern-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                }
                
                .btn-primary {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                
                .btn-success {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }
                
                .btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
                }
                
                @media (max-width: 768px) {
                    .etat-cgm-honoraires-page {
                        padding: 1rem 0;
                    }
                    
                    .etat-header {
                        padding: 1.5rem;
                        margin-left: 1rem;
                        margin-right: 1rem;
                    }
                    
                    .etat-title {
                        font-size: 2rem;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .modern-btn {
                        width: 100%;
                        max-width: 250px;
                        justify-content: center;
                    }
                }
            `}</style>
            
            <div className="etat-cgm-honoraires-page">
                <div className="container">
                    <div className="etat-header">
                        <h1 className="etat-title">
                            <i className="fas fa-chart-line me-3"></i>
                            Voir tous les États
                        </h1>
                        <p className="etat-subtitle">
                            Consultez tous les états (honoraires et dépenses) pour le client
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

                    <div className="action-buttons">
                        <button className="modern-btn btn-success" onClick={handleShowEtat}>
                            <i className="fas fa-eye"></i>
                            Afficher tous les États
                        </button>
                    </div>
                </div>
            </div>
            
            {showModal && (
                <EtatCgmModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    type="client"
                    filterType="honoraires"
                />
            )}
        </>
    );
}
