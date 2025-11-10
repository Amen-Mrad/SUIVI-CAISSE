import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DepensesModal({ show, onClose, action }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10),
        beneficiaire: '',
        montant: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [beneficiaires, setBeneficiaires] = useState([]);
    const [beneficiaireMode, setBeneficiaireMode] = useState('existing'); // 'existing' | 'new'

    useEffect(() => {
        if (show) {
            // Réinitialiser le formulaire
            setFormData({
                date: new Date().toISOString().slice(0, 10),
                beneficiaire: '',
                montant: '',
                description: ''
            });
            setError('');
            setSuccess('');
            setBeneficiaireMode('existing');
            // Charger la liste des bénéficiaires bureau
            fetch('/api/depenses/bureau/beneficiaires')
                .then(res => res.json())
                .then(data => {
                    if (data && data.success && Array.isArray(data.beneficiaires)) {
                        const list = data.beneficiaires
                            .map((b) => (typeof b === 'string' ? b : (b && b.beneficiaire)))
                            .filter(Boolean)
                            .sort();
                        setBeneficiaires(list);
                    } else {
                        setBeneficiaires([]);
                    }
                })
                .catch(() => setBeneficiaires([]));
        }
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validation simple selon le mode
            if (beneficiaireMode === 'existing' && !formData.beneficiaire) {
                setError('Veuillez sélectionner un bénéficiaire existant.');
                setLoading(false);
                return;
            }
            if (beneficiaireMode === 'new' && !formData.beneficiaire.trim()) {
                setError('Veuillez saisir le nom du nouveau bénéficiaire.');
                setLoading(false);
                return;
            }
            
            // Déterminer le type de dépense selon le contexte
            const depensesType = window.currentDepensesType || 'bureau';
            const effectiveClientId = window.currentDepensesClientId || null;
            
            // Préparer les données avec le type
            const dataToSend = {
                ...formData,
                type: depensesType === 'bureau' ? 'bureau' : 'client',
                client_id: depensesType === 'client' ? effectiveClientId : null,
                user_id: user?.id || null
            };
            
            const response = await fetch('/api/depenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Dépense ajoutée avec succès !');
                // Notifier la mise à jour de la caisse live SEULEMENT si c'est une dépense bureau
                if (depensesType === 'bureau') {
                    try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) {}
                }
                // Réinitialiser le formulaire
                setFormData({
                    date: new Date().toISOString().slice(0, 10),
                    beneficiaire: '',
                    montant: '',
                    description: ''
                });
                // Fermer le modal après 2 secondes
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(data.error || 'Erreur lors de l\'ajout de la dépense');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const formatMontant = (value) => {
        // Supprimer tous les caractères non numériques sauf le point
        const numericValue = value.replace(/[^0-9.]/g, '');
        return numericValue;
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-credit-card me-2"></i>
                            Ajouter une dépense
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
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

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="date" className="form-label">
                                        <i className="fas fa-calendar me-2"></i>Date *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label d-block">
                                        <i className="fas fa-user me-2"></i>Bénéficiaire *
                                    </label>

                                    <div className="d-flex gap-3 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="beneficiaireMode"
                                                id="benefModeExisting"
                                                checked={beneficiaireMode === 'existing'}
                                                onChange={() => { setBeneficiaireMode('existing'); setFormData(prev => ({ ...prev, beneficiaire: '' })); }}
                                            />
                                            <label className="form-check-label" htmlFor="benefModeExisting">
                                                Bénéficiaire déjà existant
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="beneficiaireMode"
                                                id="benefModeNew"
                                                checked={beneficiaireMode === 'new'}
                                                onChange={() => { setBeneficiaireMode('new'); setFormData(prev => ({ ...prev, beneficiaire: '' })); }}
                                            />
                                            <label className="form-check-label" htmlFor="benefModeNew">
                                                Nouveau bénéficiaire
                                            </label>
                                        </div>
                                    </div>

                                    {beneficiaireMode === 'existing' ? (
                                        <select
                                            className="form-select"
                                            id="beneficiaireSelect"
                                            value={formData.beneficiaire}
                                            onChange={(e) => setFormData(prev => ({ ...prev, beneficiaire: e.target.value }))}
                                            required
                                        >
                                            <option value="">-- Sélectionner un bénéficiaire --</option>
                                            {beneficiaires.map((b, idx) => (
                                                <option key={idx} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="beneficiaire"
                                            name="beneficiaire"
                                            value={formData.beneficiaire}
                                            onChange={handleInputChange}
                                            placeholder="Nom du nouveau bénéficiaire"
                                            required
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="montant" className="form-label">
                                        <i className="fas fa-money-bill-wave me-2"></i>Montant (TND) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control"
                                        id="montant"
                                        name="montant"
                                        value={formData.montant}
                                        onChange={(e) => {
                                            const value = formatMontant(e.target.value);
                                            setFormData(prev => ({
                                                ...prev,
                                                montant: value
                                            }));
                                        }}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="description" className="form-label">
                                        <i className="fas fa-file-text me-2"></i>Description *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Description de la dépense"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Note :</strong> Les champs marqués d'un * sont obligatoires.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                <i className="fas fa-times me-2"></i>Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Ajout en cours...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save me-2"></i>Ajouter la dépense
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
