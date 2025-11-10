import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AllEtatBureauModal from './AllEtatBureauModal';

export default function AllEtatBureauPage() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [beneficiaires, setBeneficiaires] = useState([]);
    const [filteredBeneficiaires, setFilteredBeneficiaires] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBeneficiaire, setSelectedBeneficiaire] = useState(null);
    const [selectedBeneficiaireForDisplay, setSelectedBeneficiaireForDisplay] = useState(null);

    useEffect(() => {
        fetchBeneficiaires();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredBeneficiaires(beneficiaires);
        } else {
            const filtered = beneficiaires.filter(beneficiaire => {
                const searchTerm = searchQuery.toLowerCase();
                return beneficiaire.toLowerCase().includes(searchTerm);
            });
            setFilteredBeneficiaires(filtered);
        }
    }, [searchQuery, beneficiaires]);

    const fetchBeneficiaires = async () => {
        try {
            // Bénéficiaires distincts depuis beneficiaires_bureau
            const response = await fetch('/api/depenses/bureau/beneficiaires');
            const data = await response.json();
            if (data.success) {
                const list = (data.beneficiaires || []).map(b => b.beneficiaire);
                setBeneficiaires(list);
                setFilteredBeneficiaires(list);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des bénéficiaires:', err);
        }
    };

    const handleShowAllEtats = () => {
        setShowModal(true);
    };

    const handleBeneficiaireSelect = (beneficiaire) => {
        setSelectedBeneficiaireForDisplay(beneficiaire);
    };

    const showSelectedBeneficiaireEtat = () => {
        if (selectedBeneficiaireForDisplay) {
            // Ouvrir le modal avec le bénéficiaire sélectionné
            setSelectedBeneficiaire(selectedBeneficiaireForDisplay);
            setShowModal(true);
        }
    };

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .all-etat-bureau-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                .etat-bureau-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .etat-bureau-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .etat-bureau-subtitle {
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
                
                .search-card {
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
                
                .search-input {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 12px 20px;
                    background: #f8f9fa;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .beneficiaires-list {
                    margin-top: 1rem;
                }
                
                .beneficiaires-scroll {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                }
                
                .beneficiaire-item {
                    padding: 10px 15px;
                    border-bottom: 1px solid #f8f9fa;
                    color: #495057;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .beneficiaire-item:hover {
                    background: #f8f9fa;
                }
                
                .beneficiaire-item:last-child {
                    border-bottom: none;
                }
                
                .beneficiaire-item.selected {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                }
                
                .show-beneficiaire-btn {
                    background: linear-gradient(45deg, #2196f3, #1976d2);
                    border: none;
                    color: white;
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                }
                
                .show-beneficiaire-btn:hover {
                    background: linear-gradient(45deg, #1976d2, #1565c0);
                }
                
                .show-beneficiaire-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
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
                    background: linear-gradient(45deg, #28a745, #20c997);
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
                    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.4);
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
                
                .modern-spinner {
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
                
                @media (max-width: 768px) {
                    .etat-bureau-title {
                        font-size: 2rem;
                    }
                    
                    .etat-bureau-header,
                    .action-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="all-etat-bureau-page">
                <div className="container">
                    {/* Header */}
                    <div className="etat-bureau-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="etat-bureau-title">
                                    <i className="fas fa-chart-line me-3"></i>
                                    Tous les États Bureau
                                </h1>
                                <p className="etat-bureau-subtitle">
                                    Consultez tous les états du bureau avec filtrage et recherche
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
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="info-card-title">Vue globale</div>
                            <div className="info-card-text">
                                Consultez tous les états du bureau incluant honoraires et dépenses.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-search"></i>
                            </div>
                            <div className="info-card-title">Recherche par bénéficiaire</div>
                            <div className="info-card-text">
                                Recherchez et filtrez les états par bénéficiaire spécifique.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="info-card-title">Filtres par date</div>
                            <div className="info-card-text">
                                Filtrez par jour, mois, année ou période spécifique.
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">
                                <i className="fas fa-balance-scale"></i>
                            </div>
                            <div className="info-card-title">Calculs automatiques</div>
                            <div className="info-card-text">
                                Bénéficiez de calculs automatiques et de synthèses détaillées.
                            </div>
                        </div>
                    </div>

                    {/* Section de recherche de bénéficiaire */}
                    <div className="search-card">
                        <h5 className="mb-3"><i className="fas fa-search me-2"></i>Rechercher / choisir un bénéficiaire</h5>
                        <input
                            list="beneficiairesOptions"
                            type="text"
                            className="search-input"
                            placeholder="Rechercher / choisir..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setSelectedBeneficiaireForDisplay(e.target.value); }}
                        />
                        <datalist id="beneficiairesOptions">
                            {filteredBeneficiaires.map((b, idx) => (
                                <option key={idx} value={b} />
                            ))}
                        </datalist>
                        {/* La datalist remplace la liste cliquable */}
                        <div className="text-center">
                            <button
                                className="show-beneficiaire-btn"
                                onClick={showSelectedBeneficiaireEtat}
                                disabled={!selectedBeneficiaireForDisplay}
                            >
                                <i className="fas fa-eye me-2"></i>Afficher l'état
                            </button>
                        </div>
                    </div>

                    {/* Action principale */}
                    <div className="action-container">
                        <h5 className="action-title">
                            <i className="fas fa-eye me-2"></i>
                            Consulter tous les états bureau
                        </h5>

                        <p className="action-description">
                            Cliquez sur le bouton ci-dessous pour afficher tous les états du bureau.
                            Vous pourrez ensuite rechercher par bénéficiaire, filtrer par date et analyser les données.
                        </p>

                        <button
                            className="show-btn"
                            onClick={handleShowAllEtats}
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
                                    Afficher Tous les États
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Modal des états */}
                {showModal && (
                    <AllEtatBureauModal
                        show={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setSelectedBeneficiaire(null);
                            setSelectedBeneficiaireForDisplay(null);
                        }}
                        selectedBeneficiaire={selectedBeneficiaire}
                    />
                )}
            </div>
        </>
    );
}
