import React from 'react';
import { Link } from 'react-router-dom';
import ClientAddForm from './ClientAddForm';

export default function AddClientPage() {
    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .add-client-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                    .add-client-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .add-client-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .add-client-subtitle {
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
                
                .form-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .form-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.5rem;
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .form-description {
                    color: #6c757d;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    line-height: 1.6;
                }
                
                .modern-add-form {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }
                
                .modern-add-form .modern-alert {
                    border-radius: 12px;
                    border: none;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                }
                
                .modern-add-form .modern-alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .modern-add-form .modern-form-group {
                    margin-bottom: 1.5rem;
                }
                
                .modern-add-form .modern-form-label {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                
                .modern-add-form .modern-form-input {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .modern-add-form .modern-form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .modern-add-form .modern-form-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                }
                
                .modern-add-form .modern-form-btn {
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    min-width: 120px;
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-add-form .modern-form-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .modern-add-form .modern-form-btn:hover::before {
                    left: 100%;
                }
                
                .modern-add-form .modern-form-btn-secondary {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
                }
                
                .modern-add-form .modern-form-btn-success {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
                }
                
                .modern-add-form .modern-form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .modern-add-form .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #28a745;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .info-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .info-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #667eea;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #667eea;
                    margin-bottom: 1rem;
                }
                
                .info-card-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                
                .info-card-text {
                    color: #6c757d;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                @media (max-width: 768px) {
                    .add-client-title {
                        font-size: 2rem;
                    }
                    
                    .modern-add-form .modern-form-buttons {
                        flex-direction: column;
                    }
                    
                    .add-client-header,
                    .form-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="add-client-page">
                <div className="container">
                    {/* Header */}
                    <div className="add-client-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="add-client-title">
                                    <i className="fas fa-user-plus me-3"></i>
                                    Ajouter un Client
                                </h1>
                                <p className="add-client-subtitle">
                                    Enregistrez un nouveau client dans le système
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Informations */}
                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-info-circle"></i>
                            </div>
                            <div className="info-card-title">Informations requises</div>
                            <div className="info-card-text">
                                Tous les champs marqués d'un astérisque (*) sont obligatoires pour créer un nouveau client.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div className="info-card-title">Sécurité des données</div>
                            <div className="info-card-text">
                                Les informations du client sont stockées de manière sécurisée et ne sont accessibles qu'aux utilisateurs autorisés.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className="info-card-title">Validation automatique</div>
                            <div className="info-card-text">
                                Le système valide automatiquement les données saisies avant l'enregistrement.
                            </div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="form-container">
                        <h5 className="form-title">
                            <i className="fas fa-user-plus me-2"></i>
                            Formulaire d'ajout de client
                        </h5>
                        <p className="form-description">
                            Remplissez les informations ci-dessous pour ajouter un nouveau client à votre système de gestion.
                        </p>

                        <div className="modern-add-form">
                            <ClientAddForm
                                onClientAdded={() => {
                                    // Rediriger vers la page des clients après ajout
                                    window.location.href = '/clients';
                                }}
                                onCancel={() => {
                                    // Rediriger vers la page d'accueil
                                    window.location.href = '/';
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
