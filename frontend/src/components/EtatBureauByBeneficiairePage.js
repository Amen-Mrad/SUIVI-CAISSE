import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatBureauByBeneficiairePage() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedBeneficiaire, setSelectedBeneficiaire] = useState('');
    const [beneficiaires, setBeneficiaires] = useState([]);
    const [filteredBeneficiaires, setFilteredBeneficiaires] = useState([]);

    useEffect(() => {
        fetchBeneficiaires();
    }, []);

    const fetchBeneficiaires = async () => {
        try {
            // Récupérer les bénéficiaires distincts (CGM) depuis l'API dédiée
            const res = await fetch('/api/depenses/bureau/beneficiaires');
            const data = await res.json();
            if (data && data.success && Array.isArray(data.beneficiaires)) {
                const list = (data.beneficiaires || [])
                    .map((b) => (typeof b === 'string' ? b : (b && b.beneficiaire)))
                    .filter(Boolean)
                    .sort();
                setBeneficiaires(list);
                setFilteredBeneficiaires(list);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des bénéficiaires:', error);
        }
    };

    const handleBeneficiaireSearch = (e) => {
        const query = e.target.value.toLowerCase();
        if (query === '') {
            setFilteredBeneficiaires(beneficiaires);
        } else {
            const filtered = beneficiaires.filter(beneficiaire =>
                beneficiaire.toLowerCase().includes(query)
            );
            setFilteredBeneficiaires(filtered);
        }
    };

    const handleBeneficiaireSelect = (beneficiaire) => {
        setSelectedBeneficiaire(beneficiaire);
    };

    const handleShowEtat = () => {
        if (!selectedBeneficiaire) {
            alert('Veuillez sélectionner un bénéficiaire');
            return;
        }
        setShowModal(true);
    };

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .etat-bureau-beneficiaire-page {
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
                
                .action-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                    text-align: center;
                }
                
                .action-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                }
                
                .action-description {
                    color: #6c757d;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #ffc107, #e0a800);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 15px 30px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 200px;
                }
                
                .show-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s;
                }
                
                .show-btn:hover::before {
                    left: 100%;
                }
                
                .show-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(255, 193, 7, 0.4);
                }
                
                .show-btn:disabled {
                    opacity: 0.7;
                    transform: none;
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
                    border-left: 4px solid #ffc107;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #ffc107;
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
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #ffc107;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .beneficiaire-selector-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .beneficiaire-selector-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .search-input {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 12px 20px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                    margin-bottom: 1rem;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #ffc107;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
                }

                .beneficiaires-list {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                    background: white;
                }

                .beneficiaire-item {
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid #f8f9fa;
                    transition: all 0.2s ease;
                }

                .beneficiaire-item:hover {
                    background: #f8f9fa;
                }

                .beneficiaire-item:last-child {
                    border-bottom: none;
                }

                .beneficiaire-item.selected {
                    background: #ffc107;
                    color: white;
                    font-weight: 600;
                }

                .selected-beneficiaire {
                    background: #e3f2fd;
                    border: 2px solid #ffc107;
                    border-radius: 10px;
                    padding: 10px 15px;
                    margin-bottom: 1rem;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                @media (max-width: 768px) {
                    .etat-title {
                        font-size: 2rem;
                    }
                    
                    .etat-header,
                    .action-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="etat-bureau-beneficiaire-page">
                <div className="container">
                    {/* Header */}
                    <div className="etat-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="etat-title">
                                    <i className="fas fa-chart-line me-3"></i>
                                    État Bureau - Par Bénéficiaire
                                </h1>
                                <p className="etat-subtitle">
                                    Consultez l'état du bureau filtré par bénéficiaire
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
                                <i className="fas fa-user-friends"></i>
                            </div>
                            <div className="info-card-title">Filtrage par bénéficiaire</div>
                            <div className="info-card-text">
                                Consultez l'état du bureau organisé par bénéficiaire avec calculs détaillés.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="info-card-title">État bureau</div>
                            <div className="info-card-text">
                                Visualisez l'état complet du bureau avec honoraires et dépenses.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-calculator"></i>
                            </div>
                            <div className="info-card-title">Calculs automatiques</div>
                            <div className="info-card-text">
                                Bénéficiez de calculs automatiques et de synthèses détaillées.
                            </div>
                        </div>
                    </div>

                    {/* Sélecteur de bénéficiaire */}
                    <div className="beneficiaire-selector-container">
                        <h5 className="beneficiaire-selector-title">
                            <i className="fas fa-user-friends me-2"></i>
                            Sélectionner un bénéficiaire
                        </h5>

                        <input
                            list="beneficiairesOptions"
                            type="text"
                            className="search-input"
                            placeholder="Rechercher / choisir un bénéficiaire..."
                            onChange={(e) => { handleBeneficiaireSearch(e); setSelectedBeneficiaire(e.target.value); }}
                        />
                        <datalist id="beneficiairesOptions">
                            {filteredBeneficiaires.map((b, idx) => (
                                <option key={idx} value={b} />
                            ))}
                        </datalist>

                        {/* Sélecteur explicite sous forme de liste d'options */}
                        <div className="mt-3">
                            <select
                                className="form-select"
                                value={selectedBeneficiaire || ''}
                                onChange={(e) => setSelectedBeneficiaire(e.target.value)}
                            >
                                <option value="">-- Sélectionner un bénéficiaire --</option>
                                {filteredBeneficiaires.map((b, idx) => (
                                    <option key={idx} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {selectedBeneficiaire && (
                            <div className="selected-beneficiaire">
                                <i className="fas fa-check-circle me-2"></i>
                                Bénéficiaire sélectionné : <strong>{selectedBeneficiaire}</strong>
                            </div>
                        )}

                        {/* Liste sous forme d'options (datalist ci-dessus), on garde la section pour compat mobile si besoin */}
                    </div>

                    {/* Action principale */}
                    <div className="action-container">
                        <h5 className="action-title">
                            <i className="fas fa-eye me-2"></i>
                            Consulter l'état par bénéficiaire
                        </h5>

                        <p className="action-description">
                            Cliquez sur le bouton ci-dessous pour afficher l'état du bureau
                            organisé par bénéficiaire. Vous pourrez voir les calculs et synthèses.
                        </p>

                        <button
                            className="show-btn"
                            onClick={handleShowEtat}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="modern-spinner"></div>
                                    Chargement...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-chart-line me-2"></i>
                                    Afficher l'État
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Modal de l'état */}
                {showModal && (
                    <EtatCgmModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        type="bureau"
                        filterType="beneficiaire"
                        beneficiaire={selectedBeneficiaire}
                    />
                )}
            </div>
        </>
    );
}
