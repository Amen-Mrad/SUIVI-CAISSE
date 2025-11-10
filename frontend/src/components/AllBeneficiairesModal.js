import React, { useState, useEffect } from 'react';

export default function AllBeneficiairesModal({ show, onClose }) {
    const [beneficiaires, setBeneficiaires] = useState([]);
    const [filteredBeneficiaires, setFilteredBeneficiaires] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (show) {
            setBeneficiaires([]);
            setFilteredBeneficiaires([]);
            setError('');
            setSearchQuery('');
            fetchAllBeneficiaires();
        }
    }, [show]);

    // Filtrage en temps réel des bénéficiaires
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredBeneficiaires(beneficiaires);
        } else {
            const filtered = beneficiaires.filter(beneficiaire => {
                const query = searchQuery.toLowerCase();
                return beneficiaire.beneficiaire.toLowerCase().includes(query);
            });
            setFilteredBeneficiaires(filtered);
        }
    }, [searchQuery, beneficiaires]);

    const fetchAllBeneficiaires = async () => {
        setLoading(true);
        setError('');

        try {
            // Récupérer tous les bénéficiaires uniques des dépenses bureau
            const response = await fetch('/api/depenses/beneficiaires?type=bureau');
            const data = await response.json();

            if (data.success) {
                setBeneficiaires(data.beneficiaires || []);
                setFilteredBeneficiaires(data.beneficiaires || []);
            } else {
                setError(data.error || 'Erreur lors du chargement des bénéficiaires');
            }
        } catch (err) {
            setError('Erreur lors du chargement des bénéficiaires');
        } finally {
            setLoading(false);
        }
    };

    const handleBeneficiaireClick = (beneficiaire) => {
        // Fermer ce modal
        onClose();

        // Ouvrir l'état pour ce bénéficiaire spécifique
        const event = new CustomEvent('open-etat-bureau-for-beneficiaire', {
            detail: {
                beneficiaire: beneficiaire.beneficiaire,
                type: 'bureau'
            }
        });
        window.dispatchEvent(event);
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-users me-2"></i>
                            Sélectionner un bénéficiaire
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {/* Barre de recherche */}
                        <div className="mb-3">
                            <label htmlFor="beneficiaireSearch" className="form-label">
                                <i className="fas fa-search me-1"></i>
                                Rechercher un bénéficiaire
                            </label>
                            <input
                                type="text"
                                id="beneficiaireSearch"
                                className="form-control"
                                placeholder="Tapez le nom du bénéficiaire..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loading && (
                            <div className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        )}

                        {filteredBeneficiaires.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Bénéficiaire</th>
                                            <th>Nombre de dépenses</th>
                                            <th>Montant total</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBeneficiaires.map((beneficiaire, index) => (
                                            <tr key={index} style={{ cursor: 'pointer' }}>
                                                <td className="fw-bold">{beneficiaire.beneficiaire}</td>
                                                <td>{beneficiaire.count}</td>
                                                <td className="text-danger fw-bold">
                                                    {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'TND'
                                                    }).format(beneficiaire.total)}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleBeneficiaireClick(beneficiaire)}
                                                    >
                                                        <i className="fas fa-chart-line me-1"></i>
                                                        Voir l'état
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : !loading && (
                            <div className="alert alert-info">
                                {searchQuery.trim() ?
                                    `Aucun bénéficiaire trouvé pour "${searchQuery}".` :
                                    'Aucun bénéficiaire trouvé.'
                                }
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
