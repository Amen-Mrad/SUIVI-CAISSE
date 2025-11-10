import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientAddForm from './ClientAddForm';
import ClientEditForm from './ClientEditForm';

export default function ClientSearch() {
  const [username, setUsername] = useState('');
  const [results, setResults] = useState([]);
  const [allClients, setAllClients] = useState([]); // Liste complète des clients
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showListOnly, setShowListOnly] = useState(false); // cacher recherche/ajout quand on affiche tout
  const [deleteMode, setDeleteMode] = useState(false); // afficher bouton supprimer uniquement
  const [editMode, setEditMode] = useState(false); // afficher bouton modifier uniquement
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Écouter les événements personnalisés du header
  useEffect(() => {
    const handleAddClient = () => {
      setShowListOnly(false);
      setShowAddForm(true);
      setShowEditForm(false);
      setResults([]);
      setAllClients([]);
      setUsername('');
      setError('');
      setDeleteMode(false);
      setEditMode(false);
    };

    const handleShowAllClients = () => {
      // Afficher l'interface de recherche avec tous les clients
      setShowListOnly(false);
      setShowAddForm(false);
      setShowEditForm(false);
      setUsername('');
      setError('');
      setDeleteMode(false);
      setEditMode(false);
      // Charger tous les clients automatiquement
      handleShowAllClientsAction();
      // Focus sur la barre de recherche
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    };

    const handleSearchClient = () => {
      // Afficher la barre de recherche avec tous les clients
      setShowListOnly(false);
      setShowAddForm(false);
      setShowEditForm(false);
      setUsername('');
      setError('');
      setDeleteMode(false);
      setEditMode(false);
      // Charger tous les clients automatiquement
      handleShowAllClientsAction();
      // Focus sur la barre de recherche
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    };

    const handleEditClientOpen = () => {
      // Afficher la recherche avec tous les clients puis le formulaire d'édition après sélection
      setShowListOnly(false);
      setShowAddForm(false);
      setShowEditForm(false);
      setUsername('');
      setError('');
      setDeleteMode(false);
      setEditMode(true);
      // Charger tous les clients automatiquement
      handleShowAllClientsAction();
      // Focus sur la barre de recherche
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    };

    const handleDeleteClientOpen = () => {
      // Afficher la recherche avec tous les clients pour supprimer ensuite depuis la liste
      setShowListOnly(false);
      setShowAddForm(false);
      setShowEditForm(false);
      setUsername('');
      setError('');
      setDeleteMode(true);
      setEditMode(false);
      // Charger tous les clients automatiquement
      handleShowAllClientsAction();
      // Focus sur la barre de recherche
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    };

    window.addEventListener('header-add-client', handleAddClient);
    window.addEventListener('header-show-all-clients', handleShowAllClients);
    window.addEventListener('header-search-client', handleSearchClient);
    window.addEventListener('header-edit-client', handleEditClientOpen);
    window.addEventListener('header-delete-client', handleDeleteClientOpen);

    return () => {
      window.removeEventListener('header-add-client', handleAddClient);
      window.removeEventListener('header-show-all-clients', handleShowAllClients);
      window.removeEventListener('header-search-client', handleSearchClient);
      window.removeEventListener('header-edit-client', handleEditClientOpen);
      window.removeEventListener('header-delete-client', handleDeleteClientOpen);
    };
  }, []);

  // Afficher par défaut l'interface de recherche au chargement et charger tous les clients
  useEffect(() => {
    setShowListOnly(false);
    setShowAddForm(false);
    setShowEditForm(false);
    setError('');
    setUsername('');

    // Charger automatiquement tous les clients au démarrage
    handleShowAllClientsAction();

    // Donner le focus à la barre de recherche
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  }, []);

  // Filtrage en temps réel de la liste locale
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si le champ est vide, afficher tous les clients
    if (username.trim() === '') {
      setResults(allClients);
      setError('');
      return;
    }

    // Débouncer le filtrage (attendre 100ms après la dernière frappe pour une meilleure réactivité)
    searchTimeoutRef.current = setTimeout(() => {
      setError('');

      // Filtrer la liste locale des clients
      const filteredClients = allClients.filter(client => {
        const searchTerm = username.toLowerCase();
        return (
          client.username.toLowerCase().includes(searchTerm) ||
          client.nom.toLowerCase().includes(searchTerm) ||
          (client.telephone || '').includes(searchTerm)
        );
      });

      setResults(filteredClients);

      // Si aucun résultat trouvé, afficher un message
      if (filteredClients.length === 0) {
        setError('Aucun client trouvé');
      }
    }, 100);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [username, allClients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowListOnly(false);
    setError('');

    // Validation: champ vide
    if (username.trim() === '') {
      setResults(allClients);
      setError('Entrer username');
      return;
    }

    // Le filtrage se fait automatiquement via useEffect
    // Pas besoin de logique supplémentaire ici
  };

  const handleShowAllClientsAction = async () => {
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data && data.clients) {
        setAllClients(data.clients);
        setResults(data.clients);
      } else {
        setAllClients([]);
        setResults([]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des clients');
      setAllClients([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllClients = async () => {
    await handleShowAllClientsAction();
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
    setShowEditForm(true);
    setShowAddForm(false);
    setResults([]);
    setError('');
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
        setShowEditForm(false);
        setEditingClient(null);
        alert('Client modifié avec succès');
      } else {
        setError(data.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      setError('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  // Edition via menu uniquement: pas de bouton Modifier dans les résultats

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
          setResults(updatedClients);
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

  return (
    <>
      <style jsx global>{`
        .container, .container-fluid {
          height: auto !important;
          overflow: visible !important;
        }
        
        .modern-search-container {
          background: white;
          border-radius: 14px;            /* plus petit */
          padding: 1rem;                  /* plus compact */
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          border: 1px solid #edf0f3;      /* simple bordure */
          backdrop-filter: none;
          min-height: auto;
          height: auto;
          overflow: visible;
        }
        
        .modern-search-title {
          color: #2c3e50;
          font-weight: 700;
          font-size: 1.1rem;              /* plus petit */
          margin-bottom: 0.75rem;         /* plus compact */
          text-align: center;
        }
        
        .modern-search-form {
          display: flex;
          gap: 0.5rem;                    /* plus serré */
          margin-bottom: 0.75rem;         /* plus compact */
          justify-content: center;         /* centrer l'ensemble */
        }
        
        .modern-search-input {
          flex: 0 1 420px;                 /* un peu plus étroit */
          border: 1px solid #e2e6ea;       /* plus fin */
          border-radius: 10px;
          padding: 6px 10px;               /* compact */
          font-size: 0.85rem;              /* compact */
          transition: all 0.2s ease;
          background: #fafbfc;
          max-width: 460px;
        }
        
        .modern-search-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }
        
        .modern-search-btn {
          background: linear-gradient(45deg, #667eea, #764ba2);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 6px 12px;              /* compact */
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          min-width: 86px;                 /* compact */
        }
        
        .modern-search-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .modern-search-btn:hover::before {
          left: 100%;
        }
        
        .modern-search-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .modern-search-btn:disabled {
          opacity: 0.7;
          transform: none;
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
        
        .modern-table-container {
          background: white;
          border-radius: 14px;            /* plus petit */
          padding: 0.75rem;               /* compact */
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          border: 1px solid #edf0f3;
          backdrop-filter: none;
          margin-top: 0.75rem;            /* compact */
          min-height: auto;
          height: auto;
          overflow: visible;
        }
        
        .modern-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;         /* compact */
          padding-bottom: 0.5rem;         /* compact */
          border-bottom: 1px solid #eef1f4;
        }
        
        .modern-table-title {
          color: #2c3e50;
          font-weight: 700;
          font-size: 1rem;                /* plus petit */
          margin: 0;
        }
        
        .modern-table {
          margin: 0;
          border-radius: 10px;            /* plus petit */
          overflow: hidden;
          box-shadow: none;               /* table simple */
          border: 2px solid #b8bfc7;      /* plus lisible */
        }
        
        .modern-table thead {
          background: linear-gradient(45deg, #667eea, #764ba2);
        }
        
        .modern-table thead th {
          border: 2px solid rgba(255,255,255,0.35); /* plus visible */
          color: white;
          font-weight: 600;
          padding: 0.6rem;               /* compact */
          text-align: center;
        }
        
        .modern-table tbody tr {
          transition: background 0.2s ease;
          border-bottom: 2px solid #cfd6dd; /* séparateur plus lisible */
        }
        
        .modern-table tbody tr:hover {
          background: linear-gradient(45deg, #f8f9fa, #e9ecef);
          transform: scale(1.01);
        }
        
        .modern-table tbody td {
          border-right: 2px solid #cfd6dd; /* colonnes visibles */
          padding: 0.65rem;              /* compact */
          text-align: center;
          vertical-align: middle;
          font-weight: 500;
          font-size: 0.95rem;             /* lisible mais compact */
        }

        .modern-table tbody tr:last-child {
          border-bottom: none; /* pas de bordure après la dernière ligne */
        }

        .modern-table tbody td:last-child {
          border-right: none; /* pas de bordure après la dernière colonne */
        }
        
        .modern-action-btn {
          border-radius: 10px;
          padding: 8px 16px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          min-width: 100px;
          position: relative;
          overflow: hidden;
        }
        
        .modern-action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .modern-action-btn:hover::before {
          left: 100%;
        }
        
        .modern-action-btn-success {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
        }
        
        .modern-action-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
        }
        
        .modern-action-btn-primary {
          background: linear-gradient(45deg, #007bff, #0056b3);
          color: white;
        }
        
        .modern-action-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 123, 255, 0.4);
        }
        
        .modern-action-btn-danger {
          background: linear-gradient(45deg, #dc3545, #c82333);
          color: white;
        }
        
        .modern-action-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(220, 53, 69, 0.4);
        }
        
        .modern-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modern-form-container {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          margin-top: 1.5rem;
        }
        
        .modern-form-title {
          color: #2c3e50;
          font-weight: 700;
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .modern-form-group {
          margin-bottom: 1.5rem;
        }
        
        .modern-form-label {
          color: #495057;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
        }
        
        .modern-form-input {
          width: 100%;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }
        
        .modern-form-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .modern-form-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }
        
        .modern-form-btn {
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          min-width: 120px;
        }
        
        .modern-form-btn-secondary {
          background: linear-gradient(45deg, #6c757d, #495057);
          color: white;
        }
        
        .modern-form-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
        }
        
        .modern-form-btn-primary {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
        }
        
        .modern-form-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .modern-form-btn:disabled {
          opacity: 0.7;
          transform: none;
        }
        
        @media (max-width: 768px) {
          .modern-search-form {
            flex-direction: column;
          }
          
          .modern-form-buttons {
            flex-direction: column;
          }
          
          .modern-table-container,
          .modern-form-container {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="modern-search-container">
        {!showListOnly && !showAddForm && (
          <>
            <h5 className="modern-search-title">
              <i className="fas fa-search me-2"></i>
              Rechercher client
            </h5>

            {successMessage && (
              <div className="modern-alert modern-alert-success">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSearch} className="modern-search-form">
              <input
                type="text"
                className="modern-search-input"
                placeholder="Tapez pour filtrer (username, nom, téléphone)..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                ref={searchInputRef}
              />
              <button
                type="submit"
                className="modern-search-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="modern-spinner me-2"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search me-2"></i>
                    Chercher
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="modern-alert modern-alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
          </>
        )}

        {/* Formulaire d'ajout de client */}
        {showAddForm && !showListOnly && (
          <div className="modern-form-container">
            <h5 className="modern-form-title">
              <i className="fas fa-user-plus me-2"></i>
              Ajouter un nouveau client
            </h5>
            <ClientAddForm
              onClientAdded={() => {
                setShowAddForm(false);
                setSuccessMessage('Client ajouté avec succès !');
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Formulaire de modification de client */}
        {showEditForm && editingClient && (
          <div className="modern-form-container">
            <h5 className="modern-form-title">
              <i className="fas fa-edit me-2"></i>
              Modifier le client
            </h5>

            {error && (
              <div className="modern-alert modern-alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitEdit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="modern-form-group">
                    <label className="modern-form-label">Nom et Prénom *</label>
                    <input
                      type="text"
                      className="modern-form-input"
                      name="nom_complet"
                      value={editingClient.nom_complet || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="modern-form-group">
                    <label className="modern-form-label">Username *</label>
                    <input
                      type="text"
                      className="modern-form-input"
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
                  <div className="modern-form-group">
                    <label className="modern-form-label">Téléphone *</label>
                    <input
                      type="text"
                      className="modern-form-input"
                      name="telephone"
                      value={editingClient.telephone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>


              <div className="modern-form-buttons">
                <button
                  type="button"
                  className="modern-form-btn modern-form-btn-secondary"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingClient(null);
                  }}
                >
                  <i className="fas fa-times me-2"></i>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="modern-form-btn modern-form-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="modern-spinner me-2"></div>
                      Modification...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Modifier le client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {results.length > 0 && !showAddForm && !showEditForm && (
          <div className="modern-table-container">
            <div className="modern-table-header">
              <h6 className="modern-table-title">
                <i className="fas fa-users me-2"></i>
                {username.trim() ? `Résultats (${results.length})` : `Tous les clients (${results.length})`}
              </h6>
              {loading && (
                <div className="modern-spinner" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              )}
            </div>

            <div className="table-responsive">
              <table className="table modern-table">
                <thead>
                  <tr>
                    <th>
                      <i className="fas fa-user me-2"></i>
                      Nom
                    </th>
                    <th>
                      <i className="fas fa-phone me-2"></i>
                      Téléphone
                    </th>
                    <th>
                      <i className="fas fa-cogs me-2"></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.nom}</strong>
                        <br />
                        <small className="text-muted">@{c.username}</small>
                      </td>
                      <td>
                        <i className="fas fa-phone me-2 text-primary"></i>
                        {c.telephone}
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center" role="group">
                          {deleteMode ? (
                            <button
                              className="modern-action-btn modern-action-btn-danger"
                              onClick={() => handleDeleteClient(c.id, c.nom, '')}
                              title="Supprimer client"
                            >
                              <i className="fas fa-trash me-1"></i>
                              Supprimer
                            </button>
                          ) : editMode ? (
                            <button
                              className="modern-action-btn modern-action-btn-primary"
                              onClick={() => handleEditClient(c)}
                              title="Modifier client"
                            >
                              <i className="fas fa-edit me-1"></i>
                              Modifier
                            </button>
                          ) : (
                            <button
                              className="modern-action-btn modern-action-btn-success"
                              onClick={() => navigate(`/client/${c.id}/charges`)}
                              title="Voir les charges"
                            >
                              <i className="fas fa-chart-line me-1"></i>
                              Détails
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


