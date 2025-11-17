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
                }
                
                .user-management-page { 
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh; 
                    padding: 1.25rem 0;
                    position: relative;
                    overflow: hidden;
                }
                
                .user-management-page::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.3;
                    pointer-events: none;
                }
                
                .users-header { 
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 25px; 
                    padding: 3rem; 
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
                    margin-bottom: 2rem;
                    position: relative;
                    overflow: hidden;
                    animation: slideInDown 0.8s ease-out;
                }
                
                .users-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                }
                
                @keyframes slideInDown {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .users-title { 
                    background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                    background-clip: text; 
                    font-size: 3rem; 
                    font-weight: 900; 
                    margin-bottom: 1rem; 
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    animation: titleGlow 2s ease-in-out infinite alternate;
                    position: relative;
                }
                
                @keyframes titleGlow {
                    from { filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.3)); }
                    to { filter: drop-shadow(0 0 20px rgba(118, 75, 162, 0.5)); }
                }
                
                .users-subtitle { 
                    color: #6c757d; 
                    font-size: 1.2rem; 
                    font-weight: 500; 
                    margin-bottom: 2rem;
                    opacity: 0.9;
                }
                
                .users-actions {
                    background: #ffffff;
                    border-radius: 14px;
                    padding: 0.75rem 1rem;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                    border: 1px solid #edf0f3;
                    margin: 0 0 1rem 0;
                    animation: slideInUp 0.5s ease-out 0.1s both;
                }
                
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .action-btn {
                    border-radius: 12px;
                    padding: 12px 20px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    position: relative;
                    overflow: hidden;
                    margin: 0 5px;
                }
                
                .action-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .action-btn:hover::before {
                    left: 100%;
                }
                
                .action-btn-primary {
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    color: white;
                }
                
                .action-btn-success {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }
                
                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }
                
                .users-table-container {
                    background: #ffffff;
                    border-radius: 14px;
                    padding: 1rem;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                    border: 1px solid #edf0f3;
                    animation: slideInUp 0.5s ease-out 0.2s both;
                    position: relative;
                    overflow: hidden;
                }
                
                .users-table-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                }
                
                .users-table-title {
                    color: #2c3e50;
                    font-weight: 800;
                    font-size: 1.25rem;
                    margin: 0 0 1rem 0;
                    text-align: center;
                }
                
                .users-count-badge {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-left: 10px;
                    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
                }
                
                .modern-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: 1px solid #000;
                }
                
                .modern-table thead {
                    background: #FFB5FC;
                }
                
                .modern-table th {
                    color: #2c3e50;
                    font-weight: 700;
                    padding: 1rem;
                    text-align: center;
                    border-bottom: 2px solid #000;
                    border-right: 1px solid #000;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .modern-table th:last-child {
                    border-right: none;
                }
                
                .modern-table tbody tr {
                    background: rgba(255, 255, 255, 0.9);
                    transition: all 0.3s ease;
                }
                
                .modern-table tbody tr:nth-child(even) {
                    background: rgba(248, 249, 250, 0.9);
                }
                
                .modern-table tbody tr:hover {
                    background: rgba(33, 150, 243, 0.05);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                
                .modern-table td {
                    padding: 1rem;
                    text-align: center;
                    vertical-align: middle;
                    border-bottom: 1px solid #000;
                    border-right: 1px solid #000;
                    font-weight: 500;
                }
                
                .modern-table td:last-child {
                    border-right: none;
                }
                
                .modern-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .role-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .role-admin {
                    background: linear-gradient(45deg, #dc3545, #c82333);
                    color: white;
                }
                
                .role-caissier {
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    color: white;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    align-items: center;
                }
                
                .btn-modify {
                    background: linear-gradient(45deg, #ff9800, #f57c00);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    min-width: 80px;
                    position: relative;
                    overflow: hidden;
                }
                
                .btn-modify::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .btn-modify:hover::before {
                    left: 100%;
                }
                
                .btn-delete {
                    background: linear-gradient(45deg, #f44336, #d32f2f);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    min-width: 80px;
                    position: relative;
                    overflow: hidden;
                }
                
                .btn-delete::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .btn-delete:hover::before {
                    left: 100%;
                }
                
                .btn-modify:hover, .btn-delete:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
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
                
                .form-container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    margin-bottom: 2rem;
                    animation: slideInUp 0.8s ease-out 0.6s both;
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
                
                @media (max-width: 992px) {
                    .users-table-container {
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
                    .users-title {
                        font-size: 2rem;
                    }
                    
                    .form-buttons {
                        flex-direction: column;
                    }
                    
                    .users-header,
                    .users-actions,
                    .users-table-container,
                    .form-container {
                        margin: 0.5rem;
                        padding: 1rem;
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
                    .users-title {
                        font-size: 1.5rem;
                    }
                    
                    .users-header,
                    .users-actions,
                    .users-table-container,
                    .form-container {
                        margin: 0.25rem;
                        padding: 0.75rem;
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


