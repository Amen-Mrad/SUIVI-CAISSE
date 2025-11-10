import React, { useState, useEffect } from 'react';

export default function AllHonorairesModal({ show, onClose }) {
    const [honoraires, setHonoraires] = useState([]);
    const [filteredHonoraires, setFilteredHonoraires] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (show) {
            fetchAllHonoraires();
        }
    }, [show]);

    // Filtrage en temps réel des honoraires par client
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredHonoraires(honoraires);
        } else {
            const filtered = honoraires.filter(honoraire => {
                const clientName = `${honoraire.client_nom || ''} ${honoraire.client_prenom || ''}`.toLowerCase();
                const clientUsername = (honoraire.client_username || '').toLowerCase();
                const query = searchQuery.toLowerCase();

                // Recherche par nom, prénom ou username
                return clientName.includes(query) ||
                    clientUsername.includes(query) ||
                    (honoraire.client_nom && honoraire.client_nom.toLowerCase().includes(query)) ||
                    (honoraire.client_prenom && honoraire.client_prenom.toLowerCase().includes(query));
            });
            setFilteredHonoraires(filtered);
        }
    }, [searchQuery, honoraires]);

    const fetchAllHonoraires = async () => {
        setLoading(true);
        setError('');

        try {
            let url = '/api/honoraires?libelle=Honoraires reçu';

            // Ajouter l'ID du client si disponible (pour les pages de détails client)
            if (window.currentHonorairesClientId) {
                url = `/api/honoraires/par-client?client_id=${window.currentHonorairesClientId}&libelle=Honoraires reçu`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                const honorairesData = data.honoraires || [];
                setHonoraires(honorairesData);
                setFilteredHonoraires(honorairesData);
            } else {
                setError(data.error || 'Erreur lors du chargement des honoraires');
            }
        } catch (err) {
            setError('Erreur lors du chargement des honoraires');
        } finally {
            setLoading(false);
        }
    };

    const formatMontant = (montant) => {
        const value = parseFloat(montant);
        if (isNaN(value)) return '0,00';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'TND'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const totalHonoraires = filteredHonoraires.reduce((sum, h) => sum + parseFloat(h.avance || 0), 0);

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-list-alt me-2"></i>
                            Tous les Honoraires Reçus
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Barre de recherche par client */}
                        <div className="mb-4">
                            <label htmlFor="clientSearch" className="form-label">
                                <i className="fas fa-search me-1"></i>
                                Rechercher par client (nom, prénom ou username)
                            </label>
                            <input
                                type="text"
                                id="clientSearch"
                                className="form-control form-control-lg"
                                placeholder="Tapez le nom, prénom ou username du client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <small className="text-muted">
                                    {filteredHonoraires.length} honoraires trouvés sur {honoraires.length} total
                                </small>
                            )}
                        </div>

                        {/* Statistiques */}
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <div className="card bg-primary text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-list me-2"></i>
                                            Total Honoraires
                                        </h5>
                                        <h3>{honoraires.length}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-success text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-filter me-2"></i>
                                            Affichés
                                        </h5>
                                        <h3>{filteredHonoraires.length}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-warning text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-money-bill-wave me-2"></i>
                                            Montant Total
                                        </h5>
                                        <h3>{formatMontant(totalHonoraires)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tableau des honoraires */}
                        {loading && (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement des honoraires...</p>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {!loading && !error && filteredHonoraires.length > 0 && (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th>Username</th>
                                            <th>Libellé</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHonoraires.map((honoraire, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(honoraire.date)}</td>
                                                <td>
                                                    <strong>{honoraire.client_nom} {honoraire.client_prenom}</strong>
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {honoraire.client_username || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>{honoraire.libelle}</td>
                                                <td className="text-success fw-bold">{formatMontant(honoraire.avance || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-dark">
                                        <tr>
                                            <th colSpan="4">TOTAL</th>
                                            <th className="text-success">{formatMontant(totalHonoraires)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {!loading && !error && filteredHonoraires.length === 0 && (
                            <div className="alert alert-info text-center">
                                <i className="fas fa-info-circle me-2"></i>
                                {searchQuery.trim() ?
                                    `Aucun honoraires trouvé pour "${searchQuery}".` :
                                    'Aucun honoraires reçu trouvé.'
                                }
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={fetchAllHonoraires}
                            disabled={loading}
                        >
                            <i className="fas fa-sync-alt me-2"></i>
                            Actualiser
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            <i className="fas fa-times me-2"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}