import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClientSearch from './ClientSearch';
import AdminDashboard from './AdminDashboard';

export default function HomePage() {
    const { user } = useAuth();
    const [showDashboard, setShowDashboard] = useState(false);

    // Écouter les événements pour ouvrir le tableau de bord
    useEffect(() => {
        const handleOpenDashboard = () => {
            setShowDashboard(true);
        };

        window.addEventListener('open-admin-dashboard', handleOpenDashboard);

        return () => {
            window.removeEventListener('open-admin-dashboard', handleOpenDashboard);
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .modern-homepage {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 0.75rem 0; /* compact */
                    overflow-y: auto;
                    height: auto;
                }
                
                .modern-hero {
                    text-align: center;
                    margin-bottom: 1rem; /* compact */
                    padding: 0.5rem 0; /* compact */
                }
                
                .modern-hero h1 {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2rem; /* compact */
                    font-weight: 800;
                    margin-bottom: 0.25rem; /* compact */
                    text-shadow: none; /* cleaner */
                }
                
                .modern-hero p {
                    color: #6c757d;
                    font-size: 0.95rem; /* compact */
                    font-weight: 500;
                    margin-bottom: 0;
                }
                
                
                .modern-stats-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    border: none;
                    color: white;
                    border-radius: 20px;
                    padding: 15px 30px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .modern-stats-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    border-radius: 20px;
                }
                
                .modern-stats-btn::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
                    transition: all 0.6s ease;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .modern-stats-btn:hover::before {
                    opacity: 0.8;
                }
                
                .modern-stats-btn:hover::after {
                    width: 200px;
                    height: 200px;
                }
                
                .modern-stats-btn:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
                    color: white;
                }
                
                .modern-stats-btn:active {
                    transform: translateY(-2px) scale(1.02);
                }
                
                .modern-stats-btn i,
                .modern-stats-btn span {
                    position: relative;
                    z-index: 2;
                }
                
                .modern-stats-desc {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.95rem;
                    font-weight: 500;
                    margin-top: 1rem;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
                
                
                .modern-main-content {
                    background: white;
                    border-radius: 25px;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
                    padding: 1rem; /* compact */
                    margin-bottom: 1rem; /* compact */
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    min-height: auto;
                    height: auto;
                    overflow: visible;
                }
                
                .modern-modal {
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(10px);
                }
                
                .modern-modal-content {
                    background: white;
                    border-radius: 20px;
                    border: none;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }
                
                .modern-modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 1.5rem 2rem;
                }
                
                .modern-modal-title {
                    color: white;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .modern-modal-close {
                    background: #dc3545;
                    border: 2px solid #dc3545;
                    color: white;
                    border-radius: 10px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .modern-modal-close:hover {
                    background: #c82333;
                    border-color: #c82333;
                    transform: scale(1.1);
                }
                
                .modern-modal-footer {
                    background: #f8f9fa;
                    border: none;
                    padding: 1.5rem 2rem;
                }
                
                .modern-close-btn {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    border: none;
                    color: white;
                    border-radius: 12px;
                    padding: 10px 24px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                
                .modern-close-btn:hover {
                    background: linear-gradient(45deg, #5a6268, #343a40);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }
                
                @media (max-width: 768px) {
                    .modern-hero h1 {
                        font-size: 2.5rem;
                    }
                    
                    .modern-hero p {
                        font-size: 1rem;
                    }
                    
                    .modern-main-content {
                        padding: 1.5rem;
                        margin: 1rem;
                    }
                    
                    .modern-admin-card {
                        margin: 1rem;
                    }
                }
            `}</style>

            <div className="modern-homepage">
                <div className="container-fluid" style={{ height: 'auto', overflow: 'visible' }}>
                    {/* Hero supprimé pour afficher directement la recherche */}

                    <div className="row">
                        {/* Zone principale */}
                        <div className="col-12">
                            <div className="modern-main-content" style={{ marginTop: '0.5rem' }}>
                                <ClientSearch />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal du tableau de bord admin */}
                {showDashboard && (
                    <div className="modal fade show d-block modern-modal">
                        <div className="modal-dialog modal-xl">
                            <div className="modal-content modern-modal-content">
                                <div className="modal-header modern-modal-header">
                                    <h5 className="modal-title modern-modal-title">
                                        <i className="fas fa-chart-line me-2"></i>
                                        Tableau de Bord Admin - Statistiques
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close modern-modal-close"
                                        onClick={() => setShowDashboard(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="modal-body p-0">
                                    <AdminDashboard />
                                </div>
                                <div className="modal-footer modern-modal-footer">
                                    <button
                                        type="button"
                                        className="btn modern-close-btn"
                                        onClick={() => setShowDashboard(false)}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
