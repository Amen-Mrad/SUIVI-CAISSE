import React, { useState, useEffect } from 'react';

export default function UserManagementPage() {
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

    const getAuthToken = () => {
        // Désactivé pour les tests (SANS JWT)
        return '';
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAllUsers]);

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
        setFormData(prev => ({ ...prev, [name]: value }));
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
        setFormData({ username: user.username, password: '', role: user.role });
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

    return (
        <div className="user-management-page">
            <style jsx global>{`
                body, html { 
                    height: auto !important; 
                    overflow-x: hidden; 
                    overflow-y: auto; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: rgb(187, 187, 187);
                }
                
                .user-management-page { 
                    background: transparent;
                    min-height: 100vh; 
                    padding: 0.5rem 0;
                    position: relative;
                }
                
                .user-management-page::before {
                    display: none;
                }
                
                .users-actions {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    margin: 0 auto 0.75rem auto;
                    max-width: 1100px;
                    animation: slideInUp 0.5s ease-out 0.1s both;
                }
                
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .action-btn {
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                    border: none;
                    position: relative;
                    overflow: hidden;
                    margin: 0 5px;
                }
                
                .action-btn-primary {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: white;
                }
                
                .action-btn-success {
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%);
                    color: white;
                }
                
                .action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .action-btn-primary:hover {
                    background: linear-gradient(135deg, #0a4a7d 0%, #0b5ed6 100%);
                }
                
                .action-btn-success:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                }
                
                .users-table-container {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    animation: slideInUp 0.5s ease-out 0.2s both;
                    position: relative;
                    overflow: hidden;
                    max-width: 1100px;
                    margin: 0 auto;
                }
                
                .users-table-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                }
                
                .users-table-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 1rem;
                    padding: 0.5rem 0.75rem;
                    margin: -0.75rem -1rem 0.75rem -1rem;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                
                .users-count-badge {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    margin-left: 10px;
                }
                
                .modern-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                }
                
                .modern-table thead {
                    background: #0b5796;
                }
                
                .modern-table th {
                    color: #ffffff;
                    font-weight: 700;
                    padding: 0.75rem 0.5rem;
                    text-align: center;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.2);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .modern-table th:last-child {
                    border-right: none;
                }
                
                .modern-table tbody tr {
                    background: transparent;
                    transition: all 0.2s ease;
                }
                
                .modern-table tbody tr:nth-child(even) {
                    background: rgba(248, 249, 250, 0.5);
                }
                
                .modern-table tbody tr:hover {
                    background: rgba(11, 87, 150, 0.05);
                }
                
                .modern-table td {
                    padding: 0.75rem 0.5rem;
                    text-align: center;
                    vertical-align: middle;
                    border-bottom: 1px solid rgba(213, 219, 227, 0.5);
                    border-right: 1px solid rgba(213, 219, 227, 0.5);
                    font-weight: 500;
                    font-size: 0.85rem;
                }
                
                .modern-table td:last-child {
                    border-right: none;
                }
                
                .modern-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .role-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: inline-block;
                }
                
                .role-admin {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    color: white;
                }
                
                .role-caissier {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: white;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 6px;
                    justify-content: center;
                    align-items: center;
                }
                
                .btn-modify {
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%);
                    border: none;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.75rem;
                    transition: all 0.2s ease;
                    min-width: 70px;
                    cursor: pointer;
                }
                
                .btn-modify:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3);
                }
                
                .btn-delete {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    border: none;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.75rem;
                    transition: all 0.2s ease;
                    min-width: 70px;
                    cursor: pointer;
                }
                
                .btn-delete:hover {
                    background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
                }
                
                .modern-alert {
                    border-radius: 6px;
                    border: none;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    font-weight: 500;
                    font-size: 0.85rem;
                }
                
                .modern-alert-success {
                    background: #d4edda;
                    color: #155724;
                    border-left: 3px solid #28a745;
                }
                
                .modern-alert-danger {
                    background: #f8d7da;
                    color: #721c24;
                    border-left: 3px solid #dc3545;
                }
                
                .modern-alert-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border-left: 3px solid #17a2b8;
                }
                
                .form-container {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 1rem 1.25rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    margin-bottom: 1rem;
                    animation: slideInUp 0.8s ease-out 0.6s both;
                }
                
                .form-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 0.95rem;
                    padding: 0.5rem 0.75rem;
                    margin: -1rem -1.25rem 1rem -1.25rem;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-label {
                    color: #2c3e50;
                    font-weight: 600;
                    font-size: 0.8rem;
                    margin-bottom: 0.3rem;
                    display: block;
                }
                
                .form-input {
                    width: 100%;
                    border: 1px solid #d5dbe3;
                    border-radius: 4px;
                    padding: 6px 10px;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                    background: #ffffff;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #0b5796;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
                }
                
                .form-buttons {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: center;
                    margin-top: 1rem;
                }
                
                .form-btn {
                    border-radius: 4px;
                    padding: 6px 16px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                    border: none;
                    min-width: 100px;
                    cursor: pointer;
                }
                
                .form-btn-secondary {
                    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
                    color: white;
                }
                
                .form-btn-primary {
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%);
                    color: white;
                }
                
                .form-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
                
                .form-btn-primary:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                }
                
                .form-btn-secondary:hover {
                    background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
                }
                
                .form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                    cursor: not-allowed;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #6c757d;
                }
                
                .empty-state i {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                .empty-state h5 {
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                
                .empty-state p {
                    margin-bottom: 2rem;
                    opacity: 0.8;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #0b5796;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem 2rem;
                    color: #6c757d;
                }
                
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                .empty-state h5 {
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                
                .empty-state p {
                    margin-bottom: 2rem;
                    opacity: 0.8;
                }
                
                @media (max-width: 992px) {
                    .users-table-container,
                    .users-actions {
                        margin: 0.5rem;
                        padding: 0.75rem;
                    }
                    
                    .table-responsive {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        width: 100%;
                    }
                    
                    .modern-table {
                        min-width: 600px;
                        font-size: 0.85rem;
                    }
                    
                    .modern-table th,
                    .modern-table td {
                        padding: 0.75rem 0.5rem;
                        white-space: nowrap;
                    }
                }
                
                @media (max-width: 768px) {
                    .form-buttons {
                        flex-direction: column;
                    }
                    
                    .users-actions,
                    .users-table-container,
                    .form-container {
                        margin: 0.5rem;
                        padding: 0.75rem;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .modern-table {
                        font-size: 0.75rem;
                        min-width: 500px;
                    }
                    
                    .modern-table th,
                    .modern-table td {
                        padding: 0.5rem 0.4rem;
                        font-size: 0.75rem;
                    }
                    
                    .btn-modify,
                    .btn-delete {
                        padding: 6px 12px;
                        font-size: 0.75rem;
                        min-width: 70px;
                    }
                }
                
                @media (max-width: 480px) {
                    .users-actions,
                    .users-table-container,
                    .form-container {
                        margin: 0.25rem;
                        padding: 0.5rem;
                    }
                    
                    .modern-table {
                        font-size: 0.7rem;
                        min-width: 450px;
                    }
                    
                    .modern-table th,
                    .modern-table td {
                        padding: 0.4rem 0.3rem;
                        font-size: 0.7rem;
                    }
                    
                    .btn-modify,
                    .btn-delete {
                        padding: 5px 10px;
                        font-size: 0.7rem;
                        min-width: 60px;
                    }
                    
                    .action-btn {
                        padding: 8px 12px;
                        font-size: 0.85rem;
                        width: 100%;
                        margin: 0.25rem 0;
                    }
                }
            `}</style>

            <div className="users-actions">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <button
                            className={`action-btn ${showAllUsers ? 'action-btn-primary' : 'action-btn-primary'}`}
                            onClick={() => setShowAllUsers(!showAllUsers)}
                        >
                            <i className={`fas ${showAllUsers ? 'fa-eye-slash' : 'fa-eye'} me-2`}></i>
                            {showAllUsers ? 'Voir employés seulement' : 'Voir tous les utilisateurs'}
                        </button>
                    </div>
                    <button className="action-btn action-btn-success" onClick={() => setShowAddForm(true)}>
                        <i className="fas fa-plus me-2"></i>Ajouter un utilisateur
                    </button>
                </div>
            </div>

            <div className="users-table-container">
                <h2 className="users-table-title">
                    <i className="fas fa-users me-2"></i>
                    Liste des utilisateurs
                  
                </h2>

                {error && (
                    <div className="modern-alert modern-alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="modern-alert modern-alert-success">
                        <i className="fas fa-check-circle me-2"></i>
                        {success}
                    </div>
                )}

                {showAddForm && (
                    <div className="form-container">
                        <h3 className="form-title">
                            <i className="fas fa-user-plus me-2"></i>Ajouter un utilisateur
                        </h3>
                        <form onSubmit={handleAddUser}>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Nom d'utilisateur</label>
                                        <input type="text" className="form-input" name="username" value={formData.username} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Mot de passe</label>
                                        <input type="password" className="form-input" name="password" value={formData.password} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Rôle</label>
                                        <select className="form-input" name="role" value={formData.role} onChange={handleInputChange} required>
                                            <option value="caissier">Caissier</option>
                                            <option value="admin">Administrateur</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="form-btn form-btn-primary" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer'}
                                </button>
                                <button type="button" className="form-btn form-btn-secondary" onClick={resetForm}>Annuler</button>
                            </div>
                        </form>
                    </div>
                )}

                {showEditForm && (
                    <div className="form-container">
                        <h3 className="form-title">
                            <i className="fas fa-user-edit me-2"></i>Modifier l'utilisateur
                        </h3>
                        <form onSubmit={handleEditUser}>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Nom d'utilisateur</label>
                                        <input type="text" className="form-input" name="username" value={formData.username} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Nouveau mot de passe (laisser vide)</label>
                                        <input type="password" className="form-input" name="password" value={formData.password} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label className="form-label">Rôle</label>
                                        <select className="form-input" name="role" value={formData.role} onChange={handleInputChange} required>
                                            <option value="caissier">Caissier</option>
                                            <option value="admin">Administrateur</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="form-btn form-btn-primary" disabled={loading}>
                                    {loading ? 'Modification...' : 'Modifier'}
                                </button>
                                <button type="button" className="form-btn form-btn-secondary" onClick={resetForm}>Annuler</button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="modern-spinner"></div>
                        <p className="mt-3">Chargement des utilisateurs...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-users"></i>
                        <h5>{!showAllUsers ? 'Aucun employé trouvé' : 'Aucun utilisateur trouvé'}</h5>
                        <p>{!showAllUsers ? 'Il n\'y a pas encore d\'employés dans le système.' : 'Il n\'y a pas encore d\'utilisateurs dans le système.'}</p>
                        <button className="action-btn action-btn-success" onClick={() => setShowAddForm(true)}>
                            <i className="fas fa-plus me-2"></i>Ajouter le premier utilisateur
                        </button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>
                                        <i className="fas fa-user me-2"></i>
                                        Nom d'utilisateur
                                    </th>
                                    <th>
                                        <i className="fas fa-user-tag me-2"></i>
                                        Rôle
                                    </th>
                                    <th>
                                        <i className="fas fa-calendar me-2"></i>
                                        Date de création
                                    </th>
                                    <th>
                                        <i className="fas fa-cogs me-2"></i>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td><strong>{user.username || `${user.nom || ''} ${user.prenom || ''}`.trim() || 'N/A'}</strong></td>
                                        <td>
                                            <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-caissier'}`}>
                                                {user.role === 'admin' ? 'Administrateur' : 'Employé'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.date_creation || user.created_at || new Date()).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-modify" onClick={() => openEditForm(user)}>
                                                    <i className="fas fa-edit me-1"></i>Modifier
                                                </button>
                                                <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>
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
        </div>
    );
}


