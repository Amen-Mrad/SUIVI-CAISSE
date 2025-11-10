import React, { useState, useEffect } from 'react';

export default function AllClientsModal({ show, onClose }) {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            setClients([]);
            setFilteredClients([]);
            setSearchQuery('');
            setError('');
            fetchAllClients();
        }
    }, [show]);

    // Filtrage en temps réel par nom ou username
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClients(clients);
        } else {
            const filtered = clients.filter(client =>
                (client.nom || '').toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                (client.username || '').toLowerCase().startsWith(searchQuery.toLowerCase())
            );
            setFilteredClients(filtered);
        }
    }, [searchQuery, clients]);

    const fetchAllClients = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/clients');
            const data = await response.json();

            if (data.success) {
                setClients(data.clients || []);
                setFilteredClients(data.clients || []);
            } else {
                setError(data.error || 'Erreur lors du chargement des clients');
            }
        } catch (err) {
            setError('Erreur lors du chargement des clients');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-users me-2"></i>
                            Tous les clients
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {/* Barre de recherche */}
                        <div className="mb-3">
                            <label htmlFor="clientSearch" className="form-label">
                                <i className="fas fa-search me-2"></i>
                                Rechercher par nom ou username
                            </label>
                            <input
                                type="text"
                                id="clientSearch"
                                className="form-control"
                                placeholder="Tapez le nom du client"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement des clients...</p>
                            </div>
                        ) : filteredClients.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Prénom</th>
                                            <th>Username</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client, index) => (
                                            <tr key={index} style={{ cursor: 'pointer' }} onClick={() => {
                                                window.dispatchEvent(new CustomEvent('client-selected-for-etat', { detail: client }));
                                            }}>
                                                <td>{client.nom}</td>
                                                <td>{client.prenom}</td>
                                                <td className="fw-bold text-primary">{client.username}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                {searchQuery.trim() === ''
                                    ? 'Aucun client trouvé.'
                                    : `Aucun client trouvé pour "${searchQuery}".`
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
