import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AddDepensePage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10), // Date du jour par défaut
        client: '',
        libelle: '',
        montant: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // États pour l'affichage des dépenses
    const [filterType, setFilterType] = useState('jour'); // 'jour', 'mois', 'annee'
    const [dateMode, setDateMode] = useState('date'); // 'date', 'periode'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [depenses, setDepenses] = useState([]);
    const [totalDepenses, setTotalDepenses] = useState(0);
    const [loadingDepenses, setLoadingDepenses] = useState(false);

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
            // Validation des champs requis
            if (!formData.date || !formData.client || !formData.libelle || !formData.montant) {
                throw new Error('Tous les champs sont obligatoires');
            }

            // Validation du montant
            const montant = parseFloat(formData.montant);
            if (isNaN(montant) || montant <= 0) {
                throw new Error('Le montant doit être un nombre positif');
            }

            // Préparer les données pour l'API
            const dataToSend = {
                date: formData.date,
                beneficiaire: formData.client,
                description: `[CGM] ${formData.libelle}`,
                montant: montant,
                type: 'bureau',
                user_id: user?.id || null
            };

            // Envoyer la requête à l'API
            const response = await fetch('/api/depenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Dépense ajoutée avec succès !');
                // Réinitialiser le formulaire
                setFormData({
                    date: new Date().toISOString().slice(0, 10),
                    client: '',
                    libelle: '',
                    montant: ''
                });

                // Forcer la mise à jour de la caisse live immédiatement et plusieurs fois pour s'assurer
                console.log('Dépense CGM ajoutée, mise à jour de la caisse...');

                // Mise à jour immédiate
                try {
                    window.dispatchEvent(new CustomEvent('caisse-updated'));
                } catch (e) {
                    console.error('Erreur dispatch événement:', e);
                }

                // Mise à jour après 500ms
                setTimeout(() => {
                    try {
                        window.dispatchEvent(new CustomEvent('caisse-updated'));
                        console.log('Événement caisse-updated déclenché (500ms)');
                    } catch (e) {
                        console.error('Erreur dispatch événement:', e);
                    }
                }, 500);

                // Mise à jour après 1.5s pour être sûr
                setTimeout(() => {
                    try {
                        window.dispatchEvent(new CustomEvent('caisse-updated'));
                        console.log('Événement caisse-updated déclenché (1.5s)');
                    } catch (e) {
                        console.error('Erreur dispatch événement:', e);
                    }
                }, 1500);

                // Recharger les dépenses après ajout
                fetchDepenses();
            } else {
                throw new Error(data.error || 'Erreur lors de l\'ajout de la dépense');
            }
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'ajout de la dépense');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour récupérer les dépenses bureau selon le filtre
    const fetchDepenses = async () => {
        setLoadingDepenses(true);
        try {
            let url = '/api/depenses/bureau/par-periode';
            const params = new URLSearchParams();

            if (dateMode === 'date') {
                // Par date unique
                if (filterType === 'jour' && selectedDate) {
                    params.append('date_debut', selectedDate);
                    params.append('date_fin', selectedDate);
                } else if (filterType === 'mois' && selectedMonth && selectedYear) {
                    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                    const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
                    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    params.append('date_debut', start);
                    params.append('date_fin', end);
                } else if (filterType === 'annee' && selectedYear) {
                    params.append('date_debut', `${selectedYear}-01-01`);
                    params.append('date_fin', `${selectedYear}-12-31`);
                }
            } else {
                // Par période (date début et date fin)
                if (startDate && endDate) {
                    params.append('date_debut', startDate);
                    params.append('date_fin', endDate);
                }
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            } else {
                // Si pas de paramètres, retourner toutes les dépenses
                url = '/api/depenses/bureau';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setDepenses(data.depenses || []);
                setTotalDepenses(data.total || 0);
            } else {
                setDepenses([]);
                setTotalDepenses(0);
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des dépenses:', err);
            setDepenses([]);
            setTotalDepenses(0);
        } finally {
            setLoadingDepenses(false);
        }
    };

    // Formatage des montants avec 3 décimales
    const formatMontant = (montant) => {
        const v = parseFloat(montant || 0);
        return v.toLocaleString('fr-FR', { 
            minimumFractionDigits: 3, 
            maximumFractionDigits: 3 
        });
    };

    // Formatage des dates
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Fonction pour créer un retrait dans la caisse CGM
    const handleRetraitCaisseCgm = async (depense) => {
        try {
            const response = await fetch('/api/caisse-cgm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type_operation: 'retrait',
                    montant: parseFloat(depense.montant || 0),
                    commentaire: `${depense.beneficiaire || depense.client || 'CGM'} - ${depense.libelle || depense.description || 'Dépense bureau'}`,
                    client_id: null,
                    user_id: null
                })
            });

            const result = await response.json();
            if (result.success) {
                setSuccess('Retrait créé dans la caisse CGM avec succès');
                setTimeout(() => setSuccess(''), 3000);
                // Mettre à jour la caisse live
                try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
                // Recharger les dépenses
                fetchDepenses();
            } else {
                setError(result.error || 'Erreur lors de la création du retrait');
                setTimeout(() => setError(''), 3000);
            }
        } catch (e) {
            setError('Erreur réseau lors de la création du retrait');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Fonction pour supprimer une dépense bureau
    const handleDeleteDepense = async (depenseId, beneficiaire) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la dépense de ${beneficiaire || 'CGM'} ?`)) {
            try {
                const response = await fetch(`/api/depenses/bureau/${depenseId}`, { method: 'DELETE' });
                const data = await response.json();

                if (data.success) {
                    setSuccess('Dépense supprimée avec succès');
                    setTimeout(() => setSuccess(''), 3000);
                    // Recharger les dépenses
                    fetchDepenses();
                    // Mettre à jour la caisse live
                    try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
                } else {
                    setError(data.error || 'Erreur lors de la suppression');
                    setTimeout(() => setError(''), 3000);
                }
            } catch (err) {
                setError('Erreur lors de la suppression');
                setTimeout(() => setError(''), 3000);
            }
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
                
                .add-depense-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                .add-depense-header { display: none; }
                
                .add-depense-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .add-depense-subtitle {
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
                
                .form-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .form-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.5rem;
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .form-description {
                    color: #6c757d;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    line-height: 1.6;
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
                
                .info-cards { display: none; }
                
                .info-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #667eea;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #667eea;
                    margin-bottom: 1rem;
                }
                
                .info-card-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                
                .info-card-text {
                    color: #6c757d;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .inline-results-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #000;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    padding: 1rem;
                    margin-top: 0.75rem;
                }
                .inline-table { 
                    width: 100%; 
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid #000;
                }
                .inline-table thead th {
                    background: #FFB5FC;
                    color: #2c3e50;
                    border-bottom: 2px solid #000;
                    border-right: 1px solid #000;
                    font-weight: 700;
                    padding: 0.6rem;
                    text-align: left;
                }
                .inline-table thead th:last-child {
                    border-right: none;
                }
                .inline-table th, .inline-table td { 
                    padding: 0.6rem; 
                    border-bottom: 1px solid #000;
                    border-right: 1px solid #000;
                    text-align: left; 
                }
                .inline-table td:last-child {
                    border-right: none;
                }
                .inline-table tbody tr:hover { background: #fafcff; }
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .inline-table tfoot td { 
                    background: #FFB5FC; 
                    color: #2c3e50; 
                    font-weight: 700; 
                    border-top: 2px solid #000;
                    border-right: 1px solid #000;
                    padding: 0.6rem;
                }
                .inline-table tfoot td:last-child {
                    border-right: none;
                }

                .filter-bar {
                    background: white;
                    border: 1px solid #edf0f3;
                    border-radius: 10px;
                    padding: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    display: flex; gap: 0.5rem; align-items: center; justify-content: center;
                    max-width: 600px; margin: 0 auto 0.75rem auto;
                }
                .filter-bar input[type="date"], .filter-bar input[type="number"] { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .filter-bar .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; }
                .filter-bar .btn-search:hover { background: #0b5ed7; }
                .filter-bar .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }

                .mode-toggle { display: flex; gap: 8px; justify-content: center; margin: 0.25rem auto 0.5rem auto; }
                .mode-btn { border: 1px solid #dfe3e7; background: #fff; padding: 6px 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .mode-btn:hover { background: #f8f9fa; }
                .mode-btn.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
                
                @media (max-width: 768px) {
                    .add-depense-title {
                        font-size: 2rem;
                    }
                    
                    .modern-add-form .modern-form-buttons {
                        flex-direction: column;
                    }
                    
                    .add-depense-header,
                    .form-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="add-depense-page">
                <div className="container">
                    {/* Header et cartes d'infos supprimés pour épurer la page */}

                    {/* Formulaire */}
                    <div className="form-container">
                        {/* Titre et description retirés pour garder uniquement le formulaire */}

                        <div className="modern-add-form">
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

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-calendar me-1"></i>
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                className="modern-form-input"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-user me-1"></i>
                                                Client *
                                            </label>
                                            <input
                                                type="text"
                                                className="modern-form-input"
                                                name="client"
                                                value={formData.client}
                                                onChange={handleInputChange}
                                                placeholder="Nom du client"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-tag me-1"></i>
                                                Libellé *
                                            </label>
                                            <input
                                                type="text"
                                                className="modern-form-input"
                                                name="libelle"
                                                value={formData.libelle}
                                                onChange={handleInputChange}
                                                placeholder="Description de la dépense"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-money-bill me-1"></i>
                                                Montant *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                className="modern-form-input"
                                                name="montant"
                                                value={formData.montant}
                                                onChange={handleInputChange}
                                                placeholder="0.000"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modern-form-buttons">
                                    <Link
                                        to="/"
                                        className="modern-form-btn modern-form-btn-secondary"
                                        disabled={loading}
                                    >
                                        <i className="fas fa-arrow-left me-1"></i>
                                        Annuler
                                    </Link>
                                    <button
                                        type="submit"
                                        className="modern-form-btn modern-form-btn-success"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="modern-spinner"></span>
                                                Ajout en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i>
                                                Ajouter la dépense
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Section d'affichage des dépenses bureau */}
                    <div className="form-container mt-4">
                        <h5 className="form-title mb-3" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <i className="fas fa-list me-2"></i>
                            Filtrer les dépenses bureau
                        </h5>

                        {/* Boutons Jour/Mois/Année */}
                        <div className="mode-toggle">
                            <button
                                className={`mode-btn ${filterType === 'jour' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('jour');
                                    setDepenses([]);
                                    setTotalDepenses(0);
                                }}
                            >
                                Jour
                            </button>
                            <button
                                className={`mode-btn ${filterType === 'mois' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('mois');
                                    setDepenses([]);
                                    setTotalDepenses(0);
                                }}
                            >
                                Mois
                            </button>
                            <button
                                className={`mode-btn ${filterType === 'annee' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('annee');
                                    setDepenses([]);
                                    setTotalDepenses(0);
                                }}
                            >
                                Année
                            </button>
                        </div>

                        {/* Radio buttons Par date / Par période */}
                        <div className="d-flex justify-content-center gap-4 mb-3">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="dateMode"
                                    value="date"
                                    checked={dateMode === 'date'}
                                    onChange={(e) => {
                                        setDateMode(e.target.value);
                                        setDepenses([]);
                                        setTotalDepenses(0);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span>Par date</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="dateMode"
                                    value="periode"
                                    checked={dateMode === 'periode'}
                                    onChange={(e) => {
                                        setDateMode(e.target.value);
                                        setDepenses([]);
                                        setTotalDepenses(0);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span>Par période</span>
                            </label>
                        </div>

                        {/* Barre de filtre */}
                        <div className="filter-bar">
                            {dateMode === 'date' ? (
                                <>
                                    {filterType === 'jour' && (
                                        <>
                                            <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Date</label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                            />
                                        </>
                                    )}
                                    {filterType === 'mois' && (
                                        <>
                                            <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Mois</label>
                                            <select
                                                style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px', marginRight: '8px' }}
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                            >
                                                <option value="">Sélectionner</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <label className="me-2 mb-0">Année</label>
                                            <input
                                                type="number"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                min="2020"
                                                max="2100"
                                                style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px', width: '100px' }}
                                            />
                                        </>
                                    )}
                                    {filterType === 'annee' && (
                                        <>
                                            <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Année</label>
                                            <input
                                                type="number"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                min="2020"
                                                max="2100"
                                                style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px', width: '100px' }}
                                            />
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <label className="me-2 mb-0"><i className="fas fa-calendar me-1"></i>Date début</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <label className="me-2 mb-0 ms-2">Date fin</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </>
                            )}
                            <button className="btn-search" onClick={fetchDepenses} disabled={loadingDepenses}>
                                {loadingDepenses ? 'Chargement...' : 'Rechercher'}
                            </button>
                        </div>

                        {/* Tableau des dépenses */}
                        {loadingDepenses ? (
                            <div className="text-center my-3">
                                <div className="spinner-border text-success" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        ) : depenses.length > 0 ? (
                            <div className="inline-results-card">
                                <div className="table-responsive">
                                    <table className="inline-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Client</th>
                                                <th>Libellé</th>
                                                <th>Montant</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {depenses.map((depense, index) => {
                                                const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                                const isCgmDepense = rawText.includes('[CGM]') || rawText.includes('HONORAIRES REÇU');
                                                const clientName = isCgmDepense ? 'CGM' : (depense.beneficiaire || depense.client || 'CGM');
                                                let libelleText = depense.libelle || depense.description || '-';
                                                libelleText = libelleText.replace(/^\[CGM\]\s*/, '');
                                                const originalClientName = depense.beneficiaire || depense.client;
                                                if (originalClientName && !isCgmDepense) {
                                                    libelleText = `${libelleText} (${originalClientName})`;
                                                }
                                                const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('AVANCE DE DECLARATION');

                                                return (
                                                    <tr key={index}>
                                                        <td>{formatDate(depense.date || depense.date_operation)}</td>
                                                        <td>{clientName}</td>
                                                        <td>{libelleText}</td>
                                                        <td style={{ color: isHonoraire ? '#198754' : '#dc3545', fontWeight: 700 }}>
                                                            {formatMontant(depense.montant)}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleDeleteDepense(depense.id, depense.beneficiaire || depense.client)}
                                                                    title="Supprimer"
                                                                    style={{ minWidth: '80px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                                >
                                                                    <i className="fas fa-trash me-1"></i>
                                                                    Supprimer
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3">TOTAL</td>
                                                <td style={{ color: '#2c3e50', fontWeight: 700 }}>{formatMontant(totalDepenses)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ) : depenses.length === 0 && !loadingDepenses ? (
                            <div className="alert alert-info" style={{ borderRadius: '12px', textAlign: 'center', marginTop: '1rem' }}>
                                <i className="fas fa-info-circle me-2"></i>
                                Aucune dépense trouvée pour la période sélectionnée.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
