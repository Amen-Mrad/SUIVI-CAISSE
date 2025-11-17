import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientAddForm from './ClientAddForm';

export default function AllClientsPage() {
    const [allClients, setAllClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    // Charger tous les clients au montage du composant
    useEffect(() => {
        fetchAllClients();
    }, []);

    const fetchAllClients = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (data && data.clients) {
                setAllClients(data.clients);
            } else {
                setAllClients([]);
            }
        } catch (err) {
            setError('Erreur lors du chargement des clients');
            setAllClients([]);
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les clients selon le terme de recherche
    const filteredClients = allClients.filter(client => {
        const search = searchTerm.toLowerCase();
        return (
            client.username.toLowerCase().includes(search) ||
            client.nom.toLowerCase().includes(search) ||
            (client.telephone || '').includes(search)
        );
    });

    const handleDeleteClient = async (clientId, nom, prenom) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client ${nom} ${prenom} ?`)) {
            try {
                const response = await fetch(`/api/clients/${clientId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (data.success) {
                    setSuccessMessage('Client supprimé avec succès !');
                    // Mettre à jour la liste locale des clients
                    const updatedClients = allClients.filter(client => client.id !== clientId);
                    setAllClients(updatedClients);
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setError(data.error || 'Erreur lors de la suppression du client');
                }
            } catch (err) {
                console.error('Erreur lors de la suppression du client:', err);
                setError('Erreur lors de la suppression du client');
            }
        }
    };

    // Fonction pour splitter le nom complet en nom et prénom
    const splitNomComplet = (nomComplet) => {
        const trimmed = nomComplet.trim();
        if (!trimmed) return { nom: '', prenom: '' };

        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
            // Si un seul mot, mettre dans nom et prénom vide
            return { nom: parts[0], prenom: '' };
        } else {
            // Premier mot = nom, le reste = prénom
            return { nom: parts[0], prenom: parts.slice(1).join(' ') };
        }
    };

    const handleEditClient = (client) => {
        // Créer un objet avec nom_complet au lieu de nom et prenom séparés
        const clientWithNomComplet = {
            ...client,
            nom_complet: `${client.nom || ''} ${client.prenom || ''}`.trim()
        };
        setEditingClient(clientWithNomComplet);
        setEditMode(true);
        setShowAddForm(false);
        setDeleteMode(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingClient(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Splitter le nom complet en nom et prénom
        const { nom, prenom } = splitNomComplet(editingClient.nom_complet || '');
        const submitData = {
            ...editingClient,
            nom,
            prenom
        };
        // Supprimer nom_complet du submitData car il n'existe pas dans le backend
        delete submitData.nom_complet;

        try {
            const response = await fetch(`/api/clients/${editingClient.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (data.success) {
                setEditMode(false);
                setEditingClient(null);
                setSuccessMessage('Client modifié avec succès !');
                fetchAllClients(); // Recharger la liste
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.error || 'Erreur lors de la modification');
            }
        } catch (err) {
            setError('Erreur lors de la modification');
        } finally {
            setLoading(false);
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
                
                .all-clients-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 0.75rem 0; /* compact */
                }
                
                .all-clients-header { display: none; } /* supprimer le gros header */
                
                .all-clients-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .all-clients-subtitle {
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
                
                .all-clients-actions {
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    border-radius: 18px;
                    padding: 1.75rem;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.05);
                    border: 2px solid rgba(102, 126, 234, 0.1);
                    backdrop-filter: none;
                    margin-bottom: 1.5rem;
                    position: relative;
                    overflow: hidden;
                }
                
                .all-clients-actions::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #007bff, #ffc107, #dc3545);
                    border-radius: 18px 18px 0 0;
                }
                
                .actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.25rem;
                    margin-bottom: 0.5rem;
                }
                
                .action-btn {
                    border-radius: 14px;
                    padding: 16px 28px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    position: relative;
                    overflow: hidden;
                    min-width: 180px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    letter-spacing: 0.5px;
                    cursor: pointer;
                }
                
                .action-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transition: left 0.6s;
                }
                
                .action-btn:hover::before {
                    left: 100%;
                }
                
                .action-btn::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                
                .action-btn:active::after {
                    width: 300px;
                    height: 300px;
                }
                
                .action-btn-primary {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 50%, #004085 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
                }
                
                .action-btn-primary:hover {
                    background: linear-gradient(135deg, #0056b3 0%, #004085 50%, #003d7a 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(0, 123, 255, 0.5);
                }
                
                .action-btn-success {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                }
                
                .action-btn-success:hover {
                    background: linear-gradient(135deg, #20c997 0%, #17a2b8 50%, #138496 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.5);
                }
                
                .action-btn-warning {
                    background: linear-gradient(135deg, #ffc107 0%, #ff9800 50%, #f57c00 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
                }
                
                .action-btn-warning:hover {
                    background: linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(255, 193, 7, 0.5);
                }
                
                .action-btn-danger {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%);
                    color: white;
                    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
                }
                
                .action-btn-danger:hover {
                    background: linear-gradient(135deg, #c82333 0%, #bd2130 50%, #a71e2a 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(220, 53, 69, 0.5);
                }
                
                .action-btn:active {
                    transform: translateY(-2px) scale(0.98);
                }
                
                .search-container {
                    background: white;
                    border-radius: 14px;
                    padding: 1rem; /* compact */
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                    border: 1px solid #edf0f3;
                    backdrop-filter: none;
                    margin-bottom: 0.75rem; /* compact */
                }
                
                .search-input {
                    width: 100%;
                    border: 1px solid #e2e6ea;
                    border-radius: 10px;
                    padding: 8px 12px; /* compact */
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    background: #fafbfc;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .table-container {
                    background: white;
                    border-radius: 14px;
                    padding: 0.75rem; /* compact */
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    border: 1px solid #edf0f3;
                    backdrop-filter: none;
                }
                
                .table-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .modern-table {
                    margin: 0;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: none;
                    border: 1px solid #e6ebf1; /* style identique à honoraire */
                }
                
                .modern-table thead {
                    background: #FFB5FC; /* header rose comme honoraire */
                }
                
                .modern-table thead th {
                    border-bottom: 2px solid #e6ebf1;
                    color: #2c3e50;
                    font-weight: 700;
                    padding: 0.6rem; /* compact */
                    text-align: center;
                }
                
                .modern-table tbody tr {
                    transition: background 0.2s ease;
                    border-bottom: 2px solid #cfd6dd;
                }
                
                .modern-table tbody tr:hover {
                    background: #fafcff;
                }
                
                .modern-table tbody td {
                    border-right: 1px solid #eef2f7;
                    padding: 0.65rem; /* compact */
                    text-align: center;
                    vertical-align: middle;
                    font-weight: 500;
                }
                
                .modern-alert {
                    border-radius: 12px;
                    border: none;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                }
                
                .modern-alert-success {
                    background: linear-gradient(45deg, #d4edda, #c3e6cb);
                    color: #155724;
                    border-left: 4px solid #28a745;
                }
                
                .modern-alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .modern-alert-info {
                    background: linear-gradient(45deg, #d1ecf1, #bee5eb);
                    color: #0c5460;
                    border-left: 4px solid #17a2b8;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .form-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .form-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .form-group {
                    margin-bottom: 1.5rem;
                }
                
                .form-label {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                
                .form-input {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .form-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                }
                
                .form-btn {
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    min-width: 120px;
                }
                
                .form-btn-secondary {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: white;
                }
                
                .form-btn-primary {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                }
                
                .form-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }
                
                .form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                @media (max-width: 768px) {
                    .all-clients-title {
                        font-size: 2rem;
                    }
                    
                    .actions-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .form-buttons {
                        flex-direction: column;
                    }
                    
                    .all-clients-header,
                    .all-clients-actions,
                    .search-container,
                    .table-container,
                    .form-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                }
            `}</style>

            <div className="all-clients-page">
                <div className="container">
                    {/* Header */}
                    <div className="all-clients-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="all-clients-title">
                                    <i className="fas fa-users me-3"></i>
                                    Tous les Clients
                                </h1>
                                <p className="all-clients-subtitle">
                                    Gestion complète de tous les clients
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="all-clients-actions">
                        <div className="actions-grid">
                            <button
                                className="action-btn action-btn-primary"
                                onClick={() => {
                                    setShowAddForm(true);
                                    setEditMode(false);
                                    setDeleteMode(false);
                                }}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Ajouter Client
                            </button>
                            <button
                                className="action-btn action-btn-warning"
                                onClick={() => {
                                    setEditMode(true);
                                    setShowAddForm(false);
                                    setDeleteMode(false);
                                }}
                            >
                                <i className="fas fa-edit me-2"></i>
                                Modifier Client
                            </button>
                            <button
                                className="action-btn action-btn-danger"
                                onClick={() => {
                                    setDeleteMode(true);
                                    setShowAddForm(false);
                                    setEditMode(false);
                                }}
                            >
                                <i className="fas fa-trash me-2"></i>
                                Supprimer Client
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {successMessage && (
                        <div className="modern-alert modern-alert-success">
                            <i className="fas fa-check-circle me-2"></i>
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="modern-alert modern-alert-danger">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Formulaire d'ajout */}
                    {showAddForm && (
                        <div className="form-container">
                            <h5 className="form-title">
                                <i className="fas fa-user-plus me-2"></i>
                                Ajouter un nouveau client
                            </h5>
                            <ClientAddForm
                                onClientAdded={() => {
                                    setShowAddForm(false);
                                    setSuccessMessage('Client ajouté avec succès !');
                                    fetchAllClients();
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                }}
                                onCancel={() => setShowAddForm(false)}
                            />
                        </div>
                    )}

                    {/* Formulaire de modification */}
                    {editMode && editingClient && (
                        <div className="form-container">
                            <h5 className="form-title">
                                <i className="fas fa-edit me-2"></i>
                                Modifier le client
                            </h5>

                            <form onSubmit={handleSubmitEdit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">
                                                <i className="fas fa-user me-2"></i>
                                                Nom et Prénom *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="nom_complet"
                                                value={editingClient.nom_complet || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">
                                                <i className="fas fa-at me-2"></i>
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="username"
                                                value={editingClient.username}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">
                                                <i className="fas fa-phone me-2"></i>
                                                Téléphone *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                name="telephone"
                                                value={editingClient.telephone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div className="form-buttons">
                                    <button
                                        type="button"
                                        className="form-btn form-btn-secondary"
                                        onClick={() => {
                                            setEditMode(false);
                                            setEditingClient(null);
                                        }}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="form-btn form-btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="modern-spinner"></div>
                                                Modification...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Modifier
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Recherche */}
                    <div className="search-container">
                        <h5 className="form-title">
                            <i className="fas fa-search me-2"></i>
                            Rechercher un client
                        </h5>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tapez pour filtrer (username, nom, téléphone)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tableau des clients */}
                    <div className="table-container">
                        <h5 className="table-title">
                            <i className="fas fa-table me-2"></i>
                            Liste des Clients ({filteredClients.length})
                        </h5>

                        {loading ? (
                            <div className="text-center">
                                <div className="modern-spinner"></div>
                                <p>Chargement des clients...</p>
                            </div>
                        ) : filteredClients.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table modern-table">
                                    <thead>
                                        <tr>
                                             <th>
                                                <i className="fas fa-phone me-2"></i>
                                                Code
                                            </th>
                                            <th>
                                                <i className="fas fa-user me-2"></i>
                                                Nom
                                            </th>
                                            <th>
                                                <i className="fas fa-cogs me-2"></i>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client) => (
                                            <tr key={client.id}>
                                                <td>
                                                    <i className="fas fa-phone me-2 text-primary"></i>
                                                    {client.telephone}
                                                </td>
                                                <td>
                                                    <strong>{client.nom}</strong>
                                                    <br />
                                                </td>
                                                
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center" role="group">
                                                        {deleteMode ? (
                                                            <button
                                                                className="action-btn action-btn-danger"
                                                                onClick={() => handleDeleteClient(client.id, client.nom, '')}
                                                                title="Supprimer client"
                                                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                                            >
                                                                <i className="fas fa-trash me-1"></i>
                                                                Supprimer
                                                            </button>
                                                        ) : editMode ? (
                                                            <button
                                                                className="action-btn action-btn-warning"
                                                                onClick={() => handleEditClient(client)}
                                                                title="Modifier client"
                                                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                                            >
                                                                <i className="fas fa-edit me-1"></i>
                                                                Modifier
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                to={`/client/${client.id}/charges`}
                                                                className="action-btn action-btn-success"
                                                                style={{ padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none' }}
                                                            >
                                                                <i className="fas fa-chart-line me-1"></i>
                                                                Détails
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="modern-alert modern-alert-info">
                                <div className="text-center">
                                    <i className="fas fa-info-circle fa-3x mb-3 text-info"></i>
                                    <h6 className="mb-2">Aucun client trouvé</h6>
                                    <p className="mb-0">
                                        {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client enregistré dans le système.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
