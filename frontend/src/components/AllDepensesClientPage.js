import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AllDepensesModal from './AllDepensesModal';

export default function AllDepensesClientPage() {
    const { id } = useParams();
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [depenses, setDepenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [clientInfo, setClientInfo] = useState(null);
    const [allClients, setAllClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);

    // UI de filtrage (comme Dépenses CGM)
    const [filterType, setFilterType] = useState('mois'); // 'jour' | 'mois' | 'annee'
    const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
    const [selectedDate, setSelectedDate] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (id) {
            fetchClientInfo();
        } else {
            // Si pas d'ID client, récupérer tous les clients pour la recherche
            fetchAllClients();
        }
    }, [id]);

    useEffect(() => {
        // Date par défaut (aujourd'hui)
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    // Filtrage des clients en temps réel
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClients(allClients);
        } else {
            const filtered = allClients.filter(client => {
                const query = searchQuery.toLowerCase();
                const nom = (client.nom || '').toLowerCase();
                const prenom = (client.prenom || '').toLowerCase();
                const username = (client.username || '').toLowerCase();
                const telephone = (client.telephone || '').toLowerCase();

                return nom.includes(query) ||
                    prenom.includes(query) ||
                    username.includes(query) ||
                    telephone.includes(query);
            });
            setFilteredClients(filtered);
        }
    }, [searchQuery, allClients]);

    const fetchClientInfo = async () => {
        try {
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();
            if (data.success) {
                setClientInfo(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations du client:', error);
        }
    };

    const fetchAllClients = async () => {
        try {
            const response = await fetch('/api/clients');
            const data = await response.json();
            if (data.success) {
                setAllClients(data.clients || []);
                setFilteredClients(data.clients || []);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
        }
    };

    const handleShowAllDepenses = async () => {
        setLoading(true);
        setError('');

        try {
            // Si on a un ID client spécifique, récupérer les dépenses de ce client
            // Sinon, récupérer toutes les dépenses (client + bureau)
            let url;
            if (id) {
                url = `/api/depenses/par-client?client_id=${id}`;
            } else {
                url = '/api/depenses?all=true';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setDepenses(data.depenses || []);
                setShowTable(true);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
            }
        } catch (err) {
            setError('Erreur réseau lors du chargement des dépenses');
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setSearchQuery(`${client.nom} ${client.prenom} (${client.username})`);
    };

    const handleShowClientDepenses = async () => {
        if (!selectedClient) {
            setError('Veuillez sélectionner un client');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/depenses/par-client?client_id=${selectedClient.id}`);
            const data = await response.json();

            if (data.success) {
                setDepenses(data.depenses || []);
                setShowTable(true);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
            }
        } catch (err) {
            setError('Erreur réseau lors du chargement des dépenses');
        } finally {
            setLoading(false);
        }
    };

    // Fonctions utilitaires
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const formatMontant = (montant) => {
        const value = parseFloat(montant || 0);
        if (isNaN(value)) return '0,000 TND';
        return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
    };

    const handleReturnToCharge = async (depense) => {
        try {
            if (!window.confirm(`Retirer la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) des dépenses client ?`)) {
                return;
            }

            const response = await fetch('/api/depenses/retirer-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    depense_id: depense.id
                })
            });

            const data = await response.json();
            if (data.success) {
                // Recharger les dépenses
                handleShowAllDepenses();
            } else {
                alert('Erreur lors de la suppression: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleDeleteDepense = async (depense) => {
        try {
            if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) ?\n\nCette action est irréversible !`)) {
                return;
            }

            const response = await fetch(`/api/depenses/${depense.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.success) {
                alert('Dépense supprimée définitivement avec succès');
                // Recharger les dépenses
                handleShowAllDepenses();
            } else {
                alert('Erreur lors de la suppression: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // Filtrer les dépenses selon la recherche
    const filteredDepenses = depenses.filter(depense => {
        if (!searchQuery.trim()) return true;
        const clientName = (depense.client || depense.beneficiaire || '').toLowerCase();
        return clientName.includes(searchQuery.toLowerCase());
    });

    const handleSearchByFilters = async () => {
        try {
            setLoading(true);
            setError('');

            const targetClientId = id || selectedClient?.id || null;
            let url = '';
            const params = new URLSearchParams();

            if (targetClientId) {
                // Filtrer les dépenses d'un client précis
                params.append('client_id', targetClientId);
                if (filterType === 'jour' && jourMode === 'date' && selectedDate) {
                    params.append('date', selectedDate);
                } else if (filterType === 'jour' && jourMode === 'periode' && dateDebut && dateFin) {
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                } else if (filterType === 'mois') {
                    params.append('mois', String(selectedMonth));
                    params.append('annee', String(selectedYear));
                } else if (filterType === 'annee') {
                    params.append('annee', String(selectedYear));
                }
                url = `/api/depenses/par-client?${params.toString()}`;
            } else {
                // Vue globale: toutes les dépenses côté client
                params.append('type', 'client');
                if (filterType === 'jour' && jourMode === 'date' && selectedDate) {
                    params.append('date', selectedDate);
                    url = `/api/depenses?${params.toString()}`;
                } else if (filterType === 'jour' && jourMode === 'periode' && dateDebut && dateFin) {
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                    url = `/api/depenses/par-periode?${params.toString()}`;
                } else if (filterType === 'mois') {
                    params.append('mois', String(selectedMonth));
                    params.append('annee', String(selectedYear));
                    url = `/api/depenses?${params.toString()}`;
                } else if (filterType === 'annee') {
                    params.append('annee', String(selectedYear));
                    url = `/api/depenses?${params.toString()}`;
                } else {
                    url = `/api/depenses?${params.toString()}`;
                }
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setDepenses(data.depenses || []);
                setShowTable(true);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
                setDepenses([]);
                setShowTable(true);
            }
        } catch (e) {
            setError('Erreur réseau lors du chargement des dépenses');
            setDepenses([]);
            setShowTable(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style jsx global>{`
                body, html { 
                    background: rgb(187, 187, 187) !important;
                    height: auto !important; 
                    overflow-x: hidden; 
                    overflow-y: auto; 
                }
                
                .all-depenses-client-page { 
                    background: transparent; 
                    min-height: 100vh; 
                    padding: 0.5rem 0; 
                }
                
                .depenses-header { display: none; }
                
                .client-info-card {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    border: 1px solid #d5dbe3;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    max-width: 1100px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .client-info-title {
                    color: #0b5796;
                    font-weight: 700;
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                }
                
                .client-info-text {
                    color: #2c3e50;
                    font-size: 0.9rem;
                    margin-bottom: 0.3rem;
                }
                
                .action-container { 
                    background: #ffffff; 
                    border-radius: 12px; 
                    padding: 1rem 1.5rem; 
                    box-shadow: 0 6px 16px rgba(0,0,0,0.08); 
                    border: 1px solid #d5dbe3; 
                    max-width: 1100px; 
                    margin: 0 auto 1rem auto; 
                }
                
                .filter-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    color: #ffffff;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
                
                .filter-row { 
                    display: flex; 
                    gap: 0.75rem; 
                    align-items: center; 
                    justify-content: center; 
                    flex-wrap: wrap; 
                }
                
                .filter-row label { 
                    margin-bottom: 0; 
                    color: #2c3e50; 
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .filter-row input[type="date"], 
                .filter-row select { 
                    border: 1px solid #d5dbe3; 
                    border-radius: 8px; 
                    padding: 6px 12px; 
                    font-size: 0.9rem;
                    background: #ffffff;
                    transition: all 0.2s ease;
                }
                
                .filter-row input[type="date"]:focus, 
                .filter-row select:focus {
                    outline: none;
                    border-color: #0b5796;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
                }
                
                .tabs { 
                    display: inline-flex; 
                    background: #f4f6f8; 
                    border-radius: 8px; 
                    padding: 4px; 
                    margin: 0 auto 1rem auto; 
                    border: 1px solid #d5dbe3;
                }
                
                .tab-btn { 
                    border: none; 
                    background: transparent; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-weight: 600; 
                    color: #495057;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                
                .tab-btn:hover {
                    background: rgba(11, 87, 150, 0.1);
                }
                
                .tab-btn.active { 
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%); 
                    color: #fff; 
                    box-shadow: 0 4px 10px rgba(11, 87, 150, 0.25); 
                }
                
                .btn-search { 
                    background: linear-gradient(135deg, #2E7D32 0%, #256528 100%); 
                    color: #fff; 
                    border: none; 
                    border-radius: 8px; 
                    padding: 8px 20px; 
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .btn-search:hover {
                    background: linear-gradient(135deg, #256528 0%, #1e5e22 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(46, 125, 50, 0.3);
                }
                
                .btn-search:disabled {
                    opacity: 0.7;
                    transform: none;
                    cursor: not-allowed;
                }

                .inline-results-card { 
                    background: #ffffff; 
                    border-radius: 12px; 
                    border: 1px solid #d5dbe3; 
                    box-shadow: 0 6px 16px rgba(0,0,0,0.08); 
                    padding: 0.75rem; 
                    max-width: 1100px;
                    margin: 0 auto;
                }
                
                .inline-table { 
                    width: 100%; 
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .inline-table thead th { 
                    background: #0b5796; 
                    color: #ffffff; 
                    border-bottom: 1px solid rgba(213, 219, 227, 0.8);
                    border-right: 1px solid rgba(213, 219, 227, 0.8);
                    font-weight: 750;
                    padding: 0.7rem;
                    text-align: left;
                    font-size: 0.88rem;
                }
                
                .inline-table thead th:last-child {
                    border-right: none;
                }
                
                .inline-table th, .inline-table td { 
                    padding: 0.6rem 0.7rem; 
                    border-bottom: 1px solid rgba(227, 231, 238, 0.8);
                    border-right: 1px solid rgba(227, 231, 238, 0.8);
                    text-align: left; 
                    font-size: 0.85rem;
                }
                
                .inline-table td:last-child {
                    border-right: none;
                }
                
                .inline-table tbody tr {
                    background-color: transparent;
                }
                
                .inline-table tbody tr:hover { 
                    background: #f0f6ff; 
                }
                
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .inline-table tfoot td { 
                    background: #0b5796; 
                    color: #ffffff; 
                    font-weight: 700; 
                    border-top: 1px solid rgba(213, 219, 227, 0.8);
                    border-right: 1px solid rgba(213, 219, 227, 0.8);
                    padding: 0.7rem;
                    font-size: 0.88rem;
                }
                
                .inline-table tfoot td:last-child {
                    border-right: none;
                }
                
                .form-check {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .form-check-input {
                    width: 18px;
                    height: 18px;
                    margin: 0;
                    cursor: pointer;
                    accent-color: #0b5796;
                }
                
                .form-check-label {
                    margin: 0;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #2c3e50;
                    font-weight: 500;
                }
                
                .modern-spinner {
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
                
                .alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    max-width: 1100px;
                    margin: 0 auto 1rem auto;
                }
                
                @media (max-width: 768px) {
                    .action-container {
                        margin: 0.5rem;
                        padding: 1rem;
                    }
                    
                    .inline-results-card {
                        margin: 0 0.5rem;
                    }
                }
            `}</style>

            <div className="all-depenses-client-page">
                <div className="container">
                    {/* Header */}
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title">
                                    <i className="fas fa-list me-3"></i>
                                    Toutes les Dépenses Client
                                </h1>
                                <p className="depenses-subtitle">
                                    Consultez toutes les dépenses du client avec filtres et recherche
                                </p>
                            </div>
                            <Link to={`/client/${id}`} className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Informations du client */}
                    {clientInfo && (
                        <div className="client-info-card">
                            <div className="client-info-title">
                                <i className="fas fa-user me-2"></i>
                                Informations du client
                            </div>
                            <div className="client-info-text">
                                <strong>Nom :</strong> {clientInfo.nom} {clientInfo.prenom}
                            </div>
                            <div className="client-info-text">
                                <strong>Téléphone :</strong> {clientInfo.telephone || 'Non renseigné'}
                            </div>
                            <div className="client-info-text">
                                <strong>Email :</strong> {clientInfo.email || 'Non renseigné'}
                            </div>
                        </div>
                    )}

                    {/* Informations - supprimées */}

                    {/* Filtres */}
                    <div className="action-container text-center">
                        <div className="filter-title">Filtrer les dépenses client</div>
                        <div className="tabs">
                            <button className={`tab-btn ${filterType === 'jour' ? 'active' : ''}`} onClick={() => setFilterType('jour')}>Jour</button>
                            <button className={`tab-btn ${filterType === 'mois' ? 'active' : ''}`} onClick={() => setFilterType('mois')}>Mois</button>
                            <button className={`tab-btn ${filterType === 'annee' ? 'active' : ''}`} onClick={() => setFilterType('annee')}>Année</button>
                        </div>
                        
                        {/* Sélecteur de client (uniquement si pas d'ID client dans l'URL) */}
                        {!id && (
                            <div className="filter-row" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                <label>
                                    <i className="fas fa-user me-2"></i>Client:
                                </label>
                                <select
                                    value={selectedClient?.id || ''}
                                    onChange={(e) => {
                                        const clientId = e.target.value;
                                        const client = allClients.find(c => c.id === parseInt(clientId));
                                        setSelectedClient(client || null);
                                    }}
                                >
                                    <option value="">Tous les clients</option>
                                    {allClients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom} {client.prenom} ({client.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterType === 'jour' && (
                            <div className="filter-row" style={{ marginTop: '0.25rem' }}>
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jDate" name="jmode" checked={jourMode === 'date'} onChange={() => setJourMode('date')} />
                                    <label className="form-check-label" htmlFor="jDate">Par date</label>
                                </div>
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jPeriode" name="jmode" checked={jourMode === 'periode'} onChange={() => setJourMode('periode')} />
                                    <label className="form-check-label" htmlFor="jPeriode">Par période</label>
                                </div>
                                {jourMode === 'date' ? (
                                    <>
                                        <label className="mb-0 ms-2 me-1">Date</label>
                                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                    </>
                                ) : (
                                    <>
                                        <label className="mb-0 ms-2 me-1">De</label>
                                        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                                        <label className="mb-0 ms-2 me-1">à</label>
                                        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                                    </>
                                )}
                                <button className="btn-search" onClick={handleSearchByFilters} disabled={loading}>Rechercher</button>
                            </div>
                        )}

                        {filterType === 'mois' && (
                            <div className="filter-row" style={{ marginTop: '0.25rem' }}>
                                <label className="mb-0 me-1">Mois</label>
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <label className="mb-0 ms-2 me-1">Année</label>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button className="btn-search" onClick={handleSearchByFilters} disabled={loading}>Rechercher</button>
                            </div>
                        )}

                        {filterType === 'annee' && (
                            <div className="filter-row" style={{ marginTop: '0.25rem' }}>
                                <label className="mb-0 me-1">Année</label>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button className="btn-search" onClick={handleSearchByFilters} disabled={loading}>Rechercher</button>
                            </div>
                        )}
                    </div>

                    {showTable ? (
                        <div className="container mt-3">
                            {loading ? (
                                <div className="text-center my-3"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Chargement...</span></div></div>
                            ) : (
                                <div className="inline-results-card">
                                    <div className="table-responsive">
                                        <table className="inline-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Client</th>
                                                    <th>Libellé</th>
                                                    <th>Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredDepenses.map((depense, index) => {
                                                    const clientName = depense.client || depense.beneficiaire;
                                                    let libelleText = depense.libelle || depense.description || '-';
                                                    // Remplacer [CGM] ou [CGM PAYÉ] par [PAYÉ PAR CGM] dans l'affichage
                                                    libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '[PAYÉ PAR CGM] ').replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');
                                                    const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                                    const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
                                                    const montantStyle = { color: isHonoraire ? '#198754' : '#dc3545', fontWeight: 700 };
                                                    return (
                                                        <tr key={index}>
                                                            <td>{formatDate(depense.date)}</td>
                                                            <td>{clientName}</td>
                                                            <td>{libelleText}</td>
                                                            <td style={montantStyle}>{formatMontant(depense.montant)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="3">TOTAL</td>
                                                    <td>{filteredDepenses.reduce((s, d) => s + parseFloat(d.montant || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}



