import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

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
                    background:rgb(187, 187, 187);
                }
                
                .all-clients-page {
                    background: transparent;
                    min-height: 100vh;
                    padding: 0;
                    margin: 0;
                }

                .page-shell {
                    max-width: 100%;
                    margin: 0;
                    padding: 0 1.25rem;
                }
                
                .all-clients-header { display: none; } /* supprimer le gros header */
                
                .container {
                    padding-top: 0.3rem;
                    margin-top: 0;
                }
                
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
                
                .container {
                    position: relative;
                }

                
                .actions-grid {
                    display: flex;
                    flex-direction: row;
                    gap: 0.5rem;
                    margin: 0;
                    flex: 0 0 auto;
                    align-items: center;
                }
                
                .action-btn {
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-weight: 500;
                    font-size: 0.75rem;
                    transition: all 0.12s ease;
                    border: 1px solid transparent;
                    position: relative;
                    overflow: hidden;
                    min-width: 0;
                    box-shadow: none;
                    letter-spacing: 0.01px;
                    cursor: pointer;
                }
                
                .action-btn i {
                    font-size: 0.7rem;
                    margin-right: 4px;
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
                
                /* Ajouter / Modifier = vert */
                .action-btn-primary,
                .action-btn-warning,
                .action-btn-success {
                    background: #2E7D32;
                    color: white;
                    border-color: #2E7D32;
                }
                
                .action-btn-primary:hover,
                .action-btn-warning:hover,
                .action-btn-success:hover {
                    background: #256528;
                    border-color: #256528;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(46, 125, 50, 0.2);
                }
                
                /* Supprimer = rouge */
                .action-btn-danger {
                    background: #C62828; /* rouge sérieux */
                    color: white;
                    border-color: #C62828;
                }
                
                .action-btn-danger:hover {
                    background: #a32121;
                    border-color: #a32121;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(198, 40, 40, 0.2);
                }
                
                .action-btn:active {
                    transform: translateY(-2px) scale(0.98);
                }
                
                .search-container {
                    background: transparent;
                    border-radius: 0;
                    padding: 0.1rem 0;
                    box-shadow: none;
                    border: none;
                    backdrop-filter: none;
                    margin: 0.3rem auto 0.3rem auto;
                    display: flex;
                    justify-content: center;
                    max-width: 520px;
                    width: 100%;
                }
                
                .search-input {
                    width: 100%;
                    border: 1px solid #d5dbe3;
                    border-radius: 5px;
                    padding: 6px 10px;
                    font-size: 0.9rem;
                    transition: all 0.12s ease;
                    background: #ffffff;
                    display: block;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .table-container {
                    background: transparent;
                    border-radius: 0;
                    padding: 0;
                    box-shadow: none;
                    border: none;
                    backdrop-filter: none;
                    max-width: 520px;
                    margin: 0 auto;
                    padding-top: 0;
                }
                
                .table-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 0.9rem;
                    margin-bottom: 0.15rem;
                    text-align: center;
                }
                
                .modern-table {
                    margin: 0;
                    border-radius: 0;
                    overflow: visible;
                    box-shadow: none;
                    border-collapse: collapse;
                    width: 100%;
                    table-layout: fixed;
                }
                
                 .modern-table thead {
                     background:rgb(11, 87, 150);/
                 }
                 
                 .modern-table thead th {
                     background-color:rgb(11, 87, 150);
                     border: 1px solid #000000;
                     color: #ffffff;
                     font-weight: 800;
                     padding: 0.35rem 0.4rem;
                     text-align: left;
                     vertical-align: middle;
                     font-size: 1rem;
                     letter-spacing: 0.2px;
                     font-family: 'Segoe UI', 'Roboto', sans-serif;
                 }
                 
                .modern-table tbody td {
                    border: 1px solid #000000;
                    color: #1f2933;
                    font-weight: 500;
                    padding: 0.2rem 0.3rem;
                    text-align: left;
                    vertical-align: middle;
                    font-size: 0.88rem;
                    line-height: 1.15;
                }

                /* Largeurs de colonnes et alignement */
                .modern-table thead th:first-child,
                .modern-table tbody td:first-child {
                    width: 35%;
                    text-align: center;
                }

                .modern-table thead th:nth-child(2),
                .modern-table tbody td:nth-child(2) {
                    width: 65%;
                }
                
                .modern-table tbody tr {
                    transition: background 0.1s ease;
                    cursor: pointer;
                }
                
                .modern-table tbody tr:hover td {
                    background: #e3f2fd !important; /* bleu ciel au survol */
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
                
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                
                .form-container {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: modalSlideIn 0.3s ease-out;
                }
                
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .form-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: #ffffff;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
                
                .form-group {
                    margin-bottom: 0.7rem;
                }
                
                .form-label {
                    color: #2c3e50;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    display: block;
                    font-size: 0.9rem;
                }
                
                .form-input {
                    width: 100%;
                    border: 1px solid #d5dbe3;
                    border-radius: 8px;
                    padding: 8px 11px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background: #ffffff;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #0b5796;
                    background: white;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
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
                        margin: 0.5rem;
                        padding: 0.75rem;
                    }
                    
                    .search-input {
                        max-width: 100%;
                        width: 100%;
                    }
                    
                    .table-container {
                        max-width: 100%;
                    }
                }
                
                @media (max-width: 480px) {
                    .search-input {
                        max-width: 100%;
                        width: 100%;
                        font-size: 0.85rem;
                        padding: 5px 8px;
                    }
                    
                    .table-container {
                        max-width: 100%;
                        overflow-x: auto;
                    }
                    
                    .modern-table {
                        font-size: 0.8rem;
                        min-width: 300px;
                    }
                    
                    .modern-table thead th,
                    .modern-table tbody td {
                        padding: 0.3rem 0.25rem;
                        font-size: 0.8rem;
                    }
                }
            `}</style>

            <div className="all-clients-page" style={{ paddingTop: '0', marginTop: '0' }}>
                <div className="container" style={{ paddingTop: '0.2rem', marginTop: '0' }}>
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

                    {/* Formulaire d'ajout - Modal */}
                    {showAddForm && (
                        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                            <div className="form-container" onClick={(e) => e.stopPropagation()}>
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
                        <div className="d-flex justify-content-between align-items-center mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div className="actions-grid" style={{ marginRight: 'auto' }}>
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
                            </div>
                            <button
                                className="action-btn action-btn-danger"
                                onClick={() => {
                                    setDeleteMode(true);
                                    setShowAddForm(false);
                                    setEditMode(false);
                                }}
                                style={{ marginLeft: 'auto' }}
                            >
                                <i className="fas fa-trash me-2"></i>
                                Supprimer Client
                            </button>
                        </div>

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
                                            <th style={{ width: deleteMode || editMode ? '20%' : '35%' }}>
                                                <i className="fas fa-user me-2"></i>
                                                Username
                                            </th>
                                            <th style={{ width: deleteMode || editMode ? '60%' : '65%' }}>
                                                <i className="fas fa-user me-2"></i>
                                                Nom
                                            </th>
                                            {(deleteMode || editMode) && (
                                                <th style={{ width: '20%' }}>
                                                    <i className="fas fa-cogs me-2"></i>
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client) => {
                                            const actionsVisible = deleteMode || editMode;
                                            return (
                                                <tr
                                                    key={client.id}
                                                    onClick={() => {
                                                        if (!actionsVisible) navigate(`/client/${client.id}/charges`);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (!actionsVisible && e.key === 'Enter') navigate(`/client/${client.id}/charges`);
                                                    }}
                                                    tabIndex={0}
                                                    style={{ cursor: actionsVisible ? 'default' : 'pointer' }}
                                                >
                                                    <td style={{ width: actionsVisible ? '20%' : '35%' }}>
                                                        <i className="fas fa-user me-2 text-primary"></i>
                                                        {client.username}
                                                    </td>
                                                    <td style={{ width: actionsVisible ? '60%' : '65%' }}>{client.nom}</td>
                                                    {actionsVisible && (
                                                        <td style={{ width: '20%' }}>
                                                            <div className="d-flex gap-2 justify-content-center" role="group">
                                                                {deleteMode ? (
                                                                    <button
                                                                        className="action-btn action-btn-danger"
                                                                        onClick={() =>
                                                                            handleDeleteClient(client.id, client.nom, '')
                                                                        }
                                                                        title="Supprimer client"
                                                                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                                    >
                                                                        <i className="fas fa-trash me-1"></i>
                                                                        Supprimer
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="action-btn action-btn-warning"
                                                                        onClick={() => handleEditClient(client)}
                                                                        title="Modifier client"
                                                                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                                    >
                                                                        <i className="fas fa-edit me-1"></i>
                                                                        Modifier
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
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

