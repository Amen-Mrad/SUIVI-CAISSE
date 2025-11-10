import React, { useState, useEffect } from 'react';

export default function UserManagementModal({ show, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'caissier'
  });
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Récupérer le token depuis sessionStorage (fallback localStorage) - DÉSACTIVÉ POUR LES TESTS
  const getAuthToken = () => {
    return ''; // Désactivé pour les tests (SANS JWT)
  };

  // Charger les utilisateurs
  useEffect(() => {
    if (show) {
      loadUsers();
    }
  }, [show, showAllUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const response = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        // Par défaut, afficher seulement les caissiers
        if (!showAllUsers) {
          const employes = data.users.filter(user => user.role === 'caissier');
          setUsers(employes);
        } else {
          setUsers(data.users);
        }
      } else {
        setError(data.error || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Utilisateur créé avec succès');
        setFormData({ username: '', password: '', role: 'employe' });
        setShowAddForm(false);
        // Recharger avec le filtre actuel
        setTimeout(() => loadUsers(), 100);
      } else {
        setError(data.error || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Utilisateur modifié avec succès');
        setFormData({ username: '', password: '', role: 'employe' });
        setEditingUser(null);
        setShowEditForm(false);
        // Recharger avec le filtre actuel
        setTimeout(() => loadUsers(), 100);
      } else {
        setError(data.error || 'Erreur lors de la modification de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Utilisateur supprimé avec succès');
        // Recharger avec le filtre actuel
        setTimeout(() => loadUsers(), 100);
      } else {
        setError(data.error || 'Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'employe' });
    setEditingUser(null);
    setShowAddForm(false);
    setShowEditForm(false);
    setError('');
    setSuccess('');
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <style>
        {`
          .btn-action {
            transition: all 0.2s ease;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .btn-action:active {
            transform: translateY(0);
          }
        `}
      </style>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-user-cog me-2"></i>
              Gestion des comptes utilisateurs
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle me-2"></i>
                {success}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-3">
                <h6 className="mb-0">
                  {showAllUsers ? 'Tous les utilisateurs' : 'Employés seulement'}
                </h6>
                <button
                  className={`btn btn-sm ${showAllUsers ? 'btn-outline-primary' : 'btn-primary'}`}
                  onClick={() => {
                    setShowAllUsers(!showAllUsers);
                    loadUsers();
                  }}
                >
                  <i className={`fas ${showAllUsers ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i>
                  {showAllUsers ? 'Voir employés seulement' : 'Voir tous les utilisateurs'}
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                <i className="fas fa-plus me-2"></i>Ajouter un utilisateur
              </button>
            </div>

            {/* Formulaire d'ajout */}
            {showAddForm && (
              <div className="card mb-3">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-user-plus me-2"></i>Ajouter un utilisateur
                  </h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddUser}>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mot de passe</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Rôle</label>
                        <select
                          className="form-select"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="employe">Employé</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        type="submit"
                        className="btn btn-success me-2"
                        disabled={loading}
                      >
                        {loading ? 'Création...' : 'Créer'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForm}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Formulaire de modification */}
            {showEditForm && (
              <div className="card mb-3">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-user-edit me-2"></i>Modifier l'utilisateur
                  </h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleEditUser}>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Rôle</label>
                        <select
                          className="form-select"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="employe">Employé</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        type="submit"
                        className="btn btn-warning me-2"
                        disabled={loading}
                      >
                        {loading ? 'Modification...' : 'Modifier'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForm}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Indicateur du nombre d'utilisateurs */}
            {!loading && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                {users.length} utilisateur{users.length > 1 ? 's' : ''} affiché{users.length > 1 ? 's' : ''}
                {!showAllUsers && ' (employés seulement)'}
              </div>
            )}

            {/* Tableau des utilisateurs */}
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">
                  {!showAllUsers ? 'Aucun employé trouvé' : 'Aucun utilisateur trouvé'}
                </h5>
                <p className="text-muted">
                  {!showAllUsers
                    ? 'Il n\'y a pas encore d\'employés dans le système.'
                    : 'Il n\'y a pas encore d\'utilisateurs dans le système.'
                  }
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>Ajouter le premier utilisateur
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nom d'utilisateur</th>
                      <th>Rôle</th>
                      <th>Date de création</th>
                      <th style={{ width: '220px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                            {user.role === 'admin' ? 'Administrateur' : 'Employé'}
                          </span>
                        </td>
                        <td>
                          {new Date(user.date_creation || user.created_at || new Date()).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-warning btn-action"
                              onClick={() => openEditForm(user)}
                              title="Modifier cet utilisateur"
                              style={{ minWidth: '100px', height: '35px', fontSize: '12px' }}
                            >
                              <i className="fas fa-edit me-1"></i>Modifier
                            </button>
                            <button
                              className="btn btn-danger btn-action"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Supprimer cet utilisateur"
                              style={{ minWidth: '100px', height: '35px', fontSize: '12px' }}
                            >
                              <i className="fas fa-trash me-1"></i>Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
