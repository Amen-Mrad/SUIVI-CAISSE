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
                const depensesData = data.depenses || [];
                console.log('📊 Dépenses récupérées dans AddDepensePage:', depensesData.length, depensesData);
                // S'assurer que toutes les dépenses ont les bons champs
                const depensesFormatees = depensesData.map(dep => ({
                    ...dep,
                    libelle: dep.libelle || dep.description || '',
                    description: dep.description || dep.libelle || '',
                    beneficiaire: dep.beneficiaire || dep.nom_beneficiaire || dep.client || '',
                    client: dep.client || dep.nom_beneficiaire || dep.beneficiaire || '',
                    date: dep.date || dep.date_operation || ''
                }));
                setDepenses(depensesFormatees);
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
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: rgb(187, 187, 187);
                }
                
                .add-depense-page {
                    background: transparent;
                    min-height: 100vh;
                    padding: 0.5rem 0;
                }
                
                .add-depense-header { display: none; }
                
                .form-container {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 1rem 1.25rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    max-width: 900px;
                    margin: 0 auto 0.75rem auto;
                    position: relative;
                    overflow: hidden;
                }
                
                .form-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
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
                
                .modern-add-form {
                    background: transparent;
                    padding: 0;
                }
                
                .modern-add-form .modern-alert {
                    border-radius: 6px;
                    border: none;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    font-weight: 500;
                    font-size: 0.85rem;
                }
                
                .modern-add-form .modern-alert-danger {
                    background: #f8d7da;
                    color: #721c24;
                    border-left: 3px solid #dc3545;
                }
                
                .modern-add-form .modern-alert-success {
                    background: #d4edda;
                    color: #155724;
                    border-left: 3px solid #28a745;
                }
                
                .modern-add-form .modern-form-group {
                    margin-bottom: 1rem;
                }
                
                .modern-add-form .modern-form-label {
                    color: #2c3e50;
                    font-weight: 600;
                    font-size: 0.8rem;
                    margin-bottom: 0.3rem;
                    display: block;
                }
                
                .modern-add-form .modern-form-input {
                    width: 100%;
                    border: 1px solid #d5dbe3;
                    border-radius: 4px;
                    padding: 6px 10px;
                    font-size: 0.85rem;
                    transition: all 0.2s ease;
                    background: #ffffff;
                }
                
                .modern-add-form .modern-form-input:focus {
                    outline: none;
                    border-color: #0b5796;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
                }
                
                .modern-add-form .modern-form-buttons {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: center;
                    margin-top: 1rem;
                }
                
                .modern-add-form .modern-form-btn {
                    border-radius: 4px;
                    padding: 6px 16px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                    border: none;
                    min-width: 100px;
                    cursor: pointer;
                }
                
                .modern-add-form .modern-form-btn-secondary {
                    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-secondary:hover {
                    background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(108, 117, 125, 0.3);
                }
                
                .modern-add-form .modern-form-btn-success {
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-success:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3);
                }
                
                .modern-add-form .modern-form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                    cursor: not-allowed;
                }
                
                .modern-add-form .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #2E7D32;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .inline-results-card {
                    background: #ffffff;
                    border-radius: 8px;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    padding: 0.75rem;
                    margin-top: 0.75rem;
                }
                .inline-table { 
                    width: 100%; 
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .inline-table thead th {
                    background: #0b5796;
                    color: #ffffff;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.2);
                    font-weight: 700;
                    padding: 0.6rem 0.5rem;
                    text-align: left;
                    font-size: 0.85rem;
                }
                .inline-table thead th:last-child {
                    border-right: none;
                }
                .inline-table th, .inline-table td { 
                    padding: 0.6rem 0.5rem; 
                    border-bottom: 1px solid rgba(213, 219, 227, 0.5);
                    border-right: 1px solid rgba(213, 219, 227, 0.5);
                    text-align: left;
                    font-size: 0.85rem;
                }
                .inline-table td:last-child {
                    border-right: none;
                }
                .inline-table tbody tr {
                    background: transparent;
                }
                .inline-table tbody tr:nth-child(even) {
                    background: rgba(248, 249, 250, 0.5);
                }
                .inline-table tbody tr:hover { 
                    background: rgba(11, 87, 150, 0.05);
                }
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .inline-table tfoot td { 
                    background: #0b5796; 
                    color: #ffffff; 
                    font-weight: 700; 
                    border-top: 2px solid rgba(255, 255, 255, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 0.6rem 0.5rem;
                }
                .inline-table tfoot td:last-child {
                    border-right: none;
                }

                .filter-bar {
                    background: #ffffff;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    border-radius: 8px;
                    padding: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    display: flex; gap: 0.5rem; align-items: center; justify-content: center;
                    max-width: 600px; margin: 0 auto 0.75rem auto;
                }
                .filter-bar input[type="date"], .filter-bar input[type="number"], .filter-bar select { 
                    border: 1px solid #d5dbe3; 
                    border-radius: 4px; 
                    padding: 6px 10px; 
                    font-size: 0.85rem;
                }
                .filter-bar .btn-search { 
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%); 
                    color: #fff; 
                    border: none; 
                    border-radius: 4px; 
                    padding: 6px 12px; 
                    font-weight: 600; 
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .filter-bar .btn-search:hover { 
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3);
                }
                .filter-bar .btn-search:disabled { 
                    opacity: 0.6; 
                    cursor: not-allowed;
                    transform: none;
                }

                .mode-toggle { 
                    display: flex; 
                    gap: 8px; 
                    justify-content: center; 
                    margin: 0.25rem auto 0.5rem auto; 
                }
                .mode-btn { 
                    border: 1px solid #d5dbe3; 
                    background: #fff; 
                    padding: 6px 12px; 
                    border-radius: 4px; 
                    font-weight: 600; 
                    font-size: 0.8rem;
                    cursor: pointer; 
                    transition: all 0.2s; 
                }
                .mode-btn:hover { 
                    background: #f8f9fa; 
                }
                .mode-btn.active { 
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%); 
                    color: #fff; 
                    border-color: #0b5796; 
                }
                
                @media (max-width: 768px) {
                    .modern-add-form .modern-form-buttons {
                        flex-direction: column;
                    }
                    
                    .form-container {
                        margin: 0.5rem;
                        padding: 0.75rem;
                    }
                    
                    .filter-bar {
                        flex-wrap: wrap;
                        margin: 0.5rem auto 0.75rem auto;
                    }
                }
            `}</style>

            <div className="add-depense-page">
                <div className="container">
                    {/* Header et cartes d'infos supprimés pour épurer la page */}

                    {/* Formulaire */}
                    <div className="form-container">
                        <div className="form-title">
                            Ajouter une nouvelle dépense
                        </div>

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
                        <div className="form-title">
                            Filtrer les dépenses bureau
                        </div>

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
                                                const clientName = isCgmDepense ? (depense.nom_beneficiaire || depense.beneficiaire || depense.client) : (depense.beneficiaire || depense.client);
                                                let libelleText = depense.libelle || depense.description || '-';
                                                // Remplacer [CGM] par [PAYÉ PAR CGM] dans l'affichage
                                                libelleText = libelleText.replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');
                                                const originalClientName = depense.beneficiaire || depense.client || depense.nom_beneficiaire;
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
                                                <td style={{ color: '#ffffff', fontWeight: 700 }}>{formatMontant(totalDepenses)}</td>
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
