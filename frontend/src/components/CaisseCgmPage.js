import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CaisseCgmPage() {
  const { user } = useAuth();
  const [operations, setOperations] = useState([]);
  const [soldeActuel, setSoldeActuel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formulaire pour ajouter/modifier une opération
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOperationId, setEditingOperationId] = useState(null);
  const [formData, setFormData] = useState({
    type_operation: 'retrait',
    montant: '',
    commentaire: '',
    client_username: '',
    operation_sign: 'moins'
  });

  // Charger les opérations et le solde
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); // Réinitialiser l'erreur

      const response = await fetch('/api/caisse-cgm');

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setOperations(data.operations || []);
        setSoldeActuel(data.solde_actuel || 0);
      } else {
        setError(data.error || data.message || 'Erreur lors du chargement des données');
        console.error('Erreur API:', data);
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur de connexion au serveur';
      setError(errorMessage);
      console.error('Erreur fetch:', err);

      // Vérifier si le serveur backend est accessible
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gérer le changement dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // S'assurer que le montant est toujours positif (la soustraction se fera automatiquement côté backend)
      [name]: name === 'montant' ? Math.abs(parseFloat(value || 0)) : value
    }));
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      type_operation: 'retrait',
      montant: '',
      commentaire: '',
      client_username: '',
      operation_sign: 'moins'
    });
    setIsEditing(false);
    setEditingOperationId(null);
  };

  const openFormFor = (type) => {
    resetForm();
    setFormData(prev => ({ ...prev, type_operation: type, operation_sign: type === 'depot' ? 'plus' : 'moins' }));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modifier une opération (pré-remplir le formulaire)
  const handleEditOperation = (operation) => {
    // Seules valeurs autorisées dans le sélecteur: 'retrait' | 'autre'
    const allowedTypes = ['retrait', 'autre'];
    const normalizedType = allowedTypes.includes(operation.type_operation)
      ? operation.type_operation
      : 'retrait';
    setFormData({
      type_operation: normalizedType,
      montant: operation.montant,
      commentaire: operation.commentaire || '',
      client_username: operation.client_username || '',
      operation_sign: operation.operation_sign || 'moins'
    });
    setIsEditing(true);
    setEditingOperationId(operation.id);
    setShowForm(true);
    // Scroller vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Supprimer une opération
  const handleDeleteOperation = async (operationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/caisse-cgm/${operationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Gérer les réponses non-JSON (ex: 404 HTML si backend non redémarré)
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur serveur ${response.status}: ${text.substring(0, 120)}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Opération supprimée avec succès');
        fetchData();
        // Rafraîchir la caisse dans le header
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('caisse-updated'));
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur:', err);
    }
  };

  // Soumettre une nouvelle opération ou modifier une existante
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // S'assurer que le montant est toujours positif
    const montantPositif = Math.abs(parseFloat(formData.montant || 0));

    if (!formData.montant || montantPositif <= 0) {
      setError('Le montant doit être supérieur à 0');
      setLoading(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/caisse-cgm/${editingOperationId}`
        : '/api/caisse-cgm';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          montant: montantPositif, // Toujours envoyer un montant positif, le backend gère la soustraction
          user_id: user?.id || null,
          client_username: formData.client_username || null,
          operation_sign: (formData.type_operation === 'depot') ? 'plus' : (formData.operation_sign || 'moins')
        })
      });

      // Si la route n'existe pas (backend non redémarré), la réponse peut être HTML -> éviter le crash
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur serveur ${response.status}: ${text.substring(0, 120)}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(isEditing ? 'Opération modifiée avec succès' : 'Opération enregistrée avec succès');
        resetForm();
        setShowForm(false);
        fetchData();
        // Rafraîchir la caisse dans le header
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('caisse-updated'));
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(montant);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeOperationLabel = (type) => {
    const labels = {
      'retrait': 'Retrait',
      'depot': 'Dépôt',
      'paiement_client': 'Paiement Client',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeOperationColor = (type) => {
    const colors = {
      'retrait': 'danger',
      'depot': 'success',
      'paiement_client': 'warning',
      'autre': 'info'
    };
    return colors[type] || 'secondary';
  };

  if (loading && operations.length === 0) {
    return (
      <div className="container-fluid mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <style>{`
        .caisse-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .solde-display {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffd700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        /* Styles modernes pour le formulaire */
        .form-container {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          max-width: 100%;
          margin: 0 auto;
        }
        
        .modern-add-form {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }
        
        .modern-add-form .modern-alert {
          border-radius: 12px;
          border: none;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        
        .modern-add-form .modern-alert-danger {
          background: linear-gradient(45deg, #f8d7da, #f5c6cb);
          color: #721c24;
          border-left: 4px solid #dc3545;
        }
        
        .modern-add-form .modern-alert-success {
          background: linear-gradient(45deg, #d4edda, #c3e6cb);
          color: #155724;
          border-left: 4px solid #28a745;
        }
        
        .modern-add-form .modern-form-group {
          margin-bottom: 1.5rem;
        }
        
        .modern-add-form .modern-form-label {
          color: #495057;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
        }
        
        .modern-add-form .modern-form-input {
          width: 100%;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }
        
        .modern-add-form .modern-form-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .modern-add-form .modern-form-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .modern-add-form .modern-form-btn {
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          min-width: 120px;
          position: relative;
          overflow: hidden;
        }
        
        .modern-add-form .modern-form-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .modern-add-form .modern-form-btn:hover::before {
          left: 100%;
        }
        
        .modern-add-form .modern-form-btn-secondary {
          background: linear-gradient(45deg, #6c757d, #495057);
          color: white;
        }
        
        .modern-add-form .modern-form-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
        }
        
        .modern-add-form .modern-form-btn-success {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
        }
        
        .modern-add-form .modern-form-btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
        }
        
        .modern-add-form .modern-form-btn:disabled {
          opacity: 0.7;
          transform: none;
        }
        
        .modern-add-form .modern-spinner {
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
      `}</style>

      {/* En-tête avec solde */}
      <div className="caisse-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">
              <i className="fas fa-wallet me-2"></i>
              Caisse CGM 
            </h2>
          </div>
          <div className="text-end">
            <div className="text-white-50 small mb-1">Solde Actuel</div>
            <div className="solde-display">
            LIVE🟢{formatMontant(soldeActuel)}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {/* Boutons d'accès rapide Retrait / Dépôt */}
      <div className="d-flex gap-2 mb-3 justify-content-end">
        <button className="btn btn-danger" onClick={() => openFormFor('retrait')}>
          <i className="fas fa-minus me-1"></i> Retrait
        </button>
        <button className="btn btn-success" onClick={() => openFormFor('depot')}>
          <i className="fas fa-plus me-1"></i> Dépôt
        </button>
        {showForm && (
          <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
            <i className="fas fa-times me-1"></i> Fermer
          </button>
        )}
      </div>

      {/* Formulaire moderne */}
      {showForm && (
        <div className="form-container mb-4">
          <div className="modern-add-form">
            {error && (
              <div className="modern-alert modern-alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="modern-alert modern-alert-success">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
              </div>
            )}

            {/* En-tête du formulaire */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              margin: '-2rem -2rem 2rem -2rem',
              fontWeight: '700',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className={`fas fa-${isEditing ? 'edit' : 'plus-circle'} me-2`}></i>
              {isEditing ? 'Modifier l\'Opération' : `Nouvelle Opération - ${formData.type_operation === 'depot' ? 'Dépôt' : 'Retrait'}`}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4">
                  <div className="modern-form-group">
                    <label className="modern-form-label">
                      <i className="fas fa-exchange-alt me-1"></i>
                      Type d'opération *
                    </label>
                    <select
                      className="modern-form-input"
                      value={formData.type_operation}
                      disabled
                      style={{ cursor: 'not-allowed', opacity: 0.7 }}
                    >
                      <option value="retrait">Retrait</option>
                      <option value="depot">Dépôt</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="modern-form-group">
                    <label className="modern-form-label">
                      <i className="fas fa-money-bill me-1"></i>
                      Montant *
                    </label>
                    <input
                      type="number"
                      className="modern-form-input"
                      name="montant"
                      value={formData.montant}
                      onChange={handleInputChange}
                      step="0.001"
                      min="0.001"
                      required
                      placeholder="0.000"
                      onKeyDown={(e) => {
                        // Empêcher la saisie du signe moins (-)
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <small style={{
                      color: '#6c757d',
                      fontSize: '0.85rem',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      {formData.type_operation === 'depot' ? 'Le montant sera ajouté au solde' : 'Le montant sera automatiquement soustrait du solde'}
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="modern-form-group">
                    <label className="modern-form-label">
                      <i className="fas fa-comment me-1"></i>
                      Commentaire
                    </label>
                    <input
                      type="text"
                      className="modern-form-input"
                      name="commentaire"
                      value={formData.commentaire}
                      onChange={handleInputChange}
                      placeholder="Description de l'opération..."
                    />
                  </div>
                </div>
              </div>

              <div className="modern-form-buttons">
                <button
                  type="button"
                  className="modern-form-btn modern-form-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="modern-form-btn modern-form-btn-success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="modern-spinner"></span>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className={`fas fa-${isEditing ? 'edit' : 'save'} me-1`}></i>
                      {isEditing ? 'Modifier l\'Opération' : 'Enregistrer l\'Opération'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des opérations - Tableau moderne */}
      <div className="form-container">
        <style>{`
          .modern-table-container {
            background: white;
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid #000;
            overflow: hidden;
          }
          
          .modern-table-header {
            background: #FFB5FC;
            color: #2c3e50;
            padding: 1rem 1.5rem;
            font-weight: 700;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #000;
          }
          
          .modern-table-header .header-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .modern-table-header .header-icon {
            color: #667eea;
          }
          
          .modern-table-header .counter {
            background: rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(44, 62, 80, 0.2);
            color: #2c3e50;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.9rem;
            font-weight: 700;
          }
          
          .modern-table-wrapper {
            padding: 0;
            overflow-x: auto;
          }
          
          .modern-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 0.95rem;
            border: 1px solid #000;
          }
          
          .modern-table thead th {
            background: #FFB5FC;
            color: #2c3e50;
            font-weight: 700;
            padding: 1rem;
            text-align: left;
            border-bottom: 2px solid #000;
            border-right: 1px solid #000;
            white-space: nowrap;
          }
          
          .modern-table thead th:last-child {
            border-right: none;
          }
          
          .modern-table tbody td {
            padding: 1rem;
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
            vertical-align: middle;
          }
          
          .modern-table tbody td:last-child {
            border-right: none;
          }
          
          .modern-table tbody tr {
            background: white;
            transition: all 0.2s ease;
          }
          
          .modern-table tbody tr:hover {
            background: #fafcff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .modern-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .modern-table tfoot td {
            background: #FFB5FC;
            color: #2c3e50;
            font-weight: 700;
            padding: 1rem;
            border-top: 2px solid #000;
            border-right: 1px solid #000;
          }
          
          .modern-table tfoot td:last-child {
            border-right: none;
          }
          
          .modern-type-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
          }
          
          .modern-type-badge.retrait {
            background: #dc3545;
            color: white;
          }
          
          .modern-type-badge.depot {
            background: #28a745;
            color: white;
          }
          
          .modern-type-badge.paiement {
            background: #ffc107;
            color: #212529;
          }
          
          .modern-type-badge.autre {
            background: #17a2b8;
            color: white;
          }
          
          .modern-action-btn {
            border-radius: 8px;
            padding: 6px 12px;
            font-weight: 600;
            font-size: 0.85rem;
            border: none;
            transition: all 0.2s ease;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          
          .modern-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          
          .modern-action-btn.edit {
            background: #ffc107;
            color: #212529;
          }
          
          .modern-action-btn.edit:hover {
            background: #e0a800;
          }
          
          .modern-action-btn.delete {
            background: #dc3545;
            color: white;
          }
          
          .modern-action-btn.delete:hover {
            background: #c82333;
          }
          
          .modern-amount {
            font-weight: 700;
            font-variant-numeric: tabular-nums;
          }
          
          .modern-amount.positive {
            color: #28a745;
          }
          
          .modern-amount.negative {
            color: #dc3545;
          }
          
          .modern-empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: #6c757d;
          }
          
          .modern-empty-state i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }
        `}</style>

        <div className="modern-table-container">
          <div className="modern-table-header">
            <div className="header-title">
              <i className="fas fa-history header-icon"></i>
              <span>Historique des opérations</span>
            </div>
            <span className="counter">{operations.length}</span>
          </div>

          <div className="modern-table-wrapper">
            {operations.length === 0 ? (
              <div className="modern-empty-state">
                <i className="fas fa-inbox"></i>
                <p>Aucune opération enregistrée</p>
              </div>
            ) : (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Commentaire</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => {
                    const isPositive = op.type_operation === 'depot' || (op.type_operation === 'autre' && op.operation_sign === 'plus');
                    const typeClass = op.type_operation === 'paiement_client' ? 'paiement' : op.type_operation;

                    return (
                      <tr key={op.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(op.created_at)}</td>
                        <td>
                          <span className={`modern-type-badge ${typeClass}`}>
                            {getTypeOperationLabel(op.type_operation)}
                          </span>
                        </td>
                        <td className={`modern-amount ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : '-'}
                          {formatMontant(op.montant)}
                        </td>
                        <td style={{
                          maxWidth: '400px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={op.commentaire || ''}>
                          {op.commentaire || '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="modern-action-btn edit"
                              onClick={() => handleEditOperation(op)}
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="modern-action-btn delete"
                              onClick={() => handleDeleteOperation(op.id)}
                              title="Supprimer"
                            >
                              <i className="fas fa-trash"></i>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

