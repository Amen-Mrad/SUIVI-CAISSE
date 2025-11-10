import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function ClientDepensesByBeneficiairePage() {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);

    useEffect(() => {
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

    const handleShowDepenses = () => {
        // Définir les variables globales pour le filtrage
        window.currentDepensesClientId = id;
        window.currentDepensesType = 'client';

        setShowModal(true);
    };

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .client-depenses-beneficiaire-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .depenses-header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .depenses-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .depenses-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); color: white; text-decoration: none; }
                .client-info-card { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid #2196f3; }
                .client-info-title { color: #1976d2; font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; }
                .client-info-text { color: #424242; font-size: 1rem; margin-bottom: 0.5rem; }
                .action-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; text-align: center; }
                .action-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; }
                .action-description { color: #6c757d; font-size: 1rem; margin-bottom: 2rem; line-height: 1.6; }
                .show-btn { background: linear-gradient(45deg, #2196f3, #1976d2); border: none; color: white; border-radius: 15px; padding: 15px 30px; font-weight: 600; font-size: 1.1rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; min-width: 200px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(33, 150, 243, 0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .info-card { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 1.5rem; border-left: 4px solid #2196f3; transition: all 0.3s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .info-card-icon { font-size: 2rem; color: #2196f3; margin-bottom: 1rem; }
                .info-card-title { color: #2c3e50; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .info-card-text { color: #6c757d; font-size: 0.9rem; line-height: 1.5; }
                .modern-spinner { width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #2196f3; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) { .depenses-title { font-size: 2rem; } .depenses-header, .action-container { margin: 1rem; padding: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="client-depenses-beneficiaire-page">
                <div className="container">
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title"><i className="fas fa-users me-3"></i>Dépenses Client - Par Bénéficiaire</h1>
                                <p className="depenses-subtitle">Consultez les dépenses du client filtrées par bénéficiaire</p>
                            </div>
                            <Link to={`/client/${id}`} className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    {clientInfo && (
                        <div className="client-info-card">
                            <div className="client-info-title"><i className="fas fa-user me-2"></i>Informations du client</div>
                            <div className="client-info-text"><strong>Nom :</strong> {clientInfo.nom} {clientInfo.prenom}</div>
                            <div className="client-info-text"><strong>Téléphone :</strong> {clientInfo.telephone}</div>
                            <div className="client-info-text"><strong>Email :</strong> {clientInfo.email}</div>
                        </div>
                    )}

                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-user-friends"></i></div>
                            <div className="info-card-title">Filtrage par bénéficiaire</div>
                            <div className="info-card-text">Consultez toutes les dépenses de ce client organisées par bénéficiaire.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-user"></i></div>
                            <div className="info-card-title">Dépenses client</div>
                            <div className="info-card-text">Visualisez toutes les dépenses spécifiques à ce client par bénéficiaire.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-chart-pie"></i></div>
                            <div className="info-card-title">Analyse détaillée</div>
                            <div className="info-card-text">Analysez les dépenses de ce client par bénéficiaire avec des statistiques détaillées.</div>
                        </div>
                    </div>

                    <div className="action-container">
                        <h5 className="action-title"><i className="fas fa-eye me-2"></i>Consulter les dépenses par bénéficiaire</h5>

                        <p className="action-description">
                            Cliquez sur le bouton ci-dessous pour afficher toutes les dépenses de ce client
                            organisées par bénéficiaire. Vous pourrez filtrer et analyser les données.
                        </p>

                        <button className="show-btn" onClick={handleShowDepenses} disabled={loading}>
                            {loading ? (<><div className="modern-spinner"></div>Chargement...</>) : (<><i className="fas fa-list me-2"></i>Afficher les Dépenses</>)}
                        </button>
                    </div>
                </div>

                {showModal && (
                    <AllDepensesModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="client"
                        filterType="beneficiaire"
                        clientId={id}
                    />
                )}
            </div>
        </>
    );
}
