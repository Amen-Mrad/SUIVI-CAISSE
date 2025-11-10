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
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .all-depenses-client-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 0.75rem 0; }
                
                .depenses-header { display: none; }
                
                .depenses-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .depenses-subtitle {
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
                
                .client-info-card {
                    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    border-left: 4px solid #2196f3;
                }
                
                .client-info-title {
                    color: #1976d2;
                    font-weight: 700;
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                }
                
                .client-info-text {
                    color: #424242;
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                }
                
                .filter-bar { background: white; border: 1px solid #edf0f3; border-radius: 10px; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; gap: 0.5rem; align-items: center; justify-content: center; max-width: 900px; margin: 0 auto 0.75rem auto; flex-wrap: wrap; }
                .filter-bar label { margin-bottom: 0; color: #2c3e50; font-weight: 600; }
                .filter-bar input[type="date"], .filter-bar select { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .tabs { display: inline-flex; background: #f1f5f9; border-radius: 999px; padding: 4px; }
                .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 999px; font-weight: 700; color: #334155; }
                .tab-btn.active { background: #0d6efd; color: white; box-shadow: 0 4px 10px rgba(13,110,253,.3); }
                .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; }

                .inline-results-card { background: white; border-radius: 12px; border: 1px solid #edf0f3; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 1rem; }
                .inline-table { width: 100%; border-collapse: collapse; }
                .inline-table thead th { background: #FFB5FC; color: #2c3e50; border-bottom: 2px solid #e6ebf1; font-weight: 700; }
                .inline-table th, .inline-table td { padding: 0.6rem; border-bottom: 1px solid #eef2f7; text-align: left; }
                .inline-table tbody tr:hover { background: #fafcff; }
                .inline-table tfoot td { background: #FFB5FC; color: #2c3e50; font-weight: 700; border-top: 2px solid #e6ebf1; }
                
                .date-selector-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .date-input-group {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                
                .date-label {
                    min-width: 100px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .date-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: white;
                }
                
                .date-input:focus {
                    outline: none;
                    border-color: #2196f3;
                    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #2196f3, #1976d2);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 15px 30px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 200px;
                    width: 100%;
                }
                
                .show-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.6s;
                }
                
                .show-btn:hover::before {
                    left: 100%;
                }
                
                .show-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(33, 150, 243, 0.4);
                }
                
                .show-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .info-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .info-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #2196f3;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #2196f3;
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
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #2196f3;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 8px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 768px) {
                    .depenses-title {
                        font-size: 2rem;
                    }
                    
                    .date-input-group {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .date-label {
                        min-width: auto;
                        text-align: center;
                    }
                    
                    .depenses-header,
                    .date-selector-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
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

                    {/* Sélecteur d'action */}
                    {/* Barre de filtres (identique à Dépenses CGM) */}
                    <div className="filter-bar">
                        <div className="tabs">
                            <button className={`tab-btn ${filterType === 'jour' ? 'active' : ''}`} onClick={() => setFilterType('jour')}>Jour</button>
                            <button className={`tab-btn ${filterType === 'mois' ? 'active' : ''}`} onClick={() => setFilterType('mois')}>Mois</button>
                            <button className={`tab-btn ${filterType === 'annee' ? 'active' : ''}`} onClick={() => setFilterType('annee')}>Année</button>
                        </div>

                        {/* Sélecteur de client (uniquement si pas d'ID client dans l'URL) */}
                        {!id && (
                            <>
                                <label style={{marginBottom: 0, fontWeight: 600, color: '#2c3e50'}}>
                                    <i className="fas fa-user me-2"></i>Client:
                                </label>
                                <select
                                    value={selectedClient?.id || ''}
                                    onChange={(e) => {
                                        const clientId = e.target.value;
                                        const client = allClients.find(c => c.id === parseInt(clientId));
                                        setSelectedClient(client || null);
                                    }}
                                    style={{
                                        border: '1px solid #e2e6ea',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        minWidth: '200px'
                                    }}
                                >
                                    <option value="">Tous les clients</option>
                                    {allClients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom} {client.prenom} ({client.username})
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === 'jour' && (
                            <>
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jDate" name="jmode" checked={jourMode === 'date'} onChange={() => setJourMode('date')} />
                                    <label className="form-check-label" htmlFor="jDate">Par date</label>
                                </div>
                                <div className="form-check me-2">
                                    <input className="form-check-input" type="radio" id="jPeriode" name="jmode" checked={jourMode === 'periode'} onChange={() => setJourMode('periode')} />
                                    <label className="form-check-label" htmlFor="jPeriode">Par période</label>
                                </div>
                                {jourMode === 'date' ? (
                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                ) : (
                                    <>
                                        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                                        <label className="mb-0 ms-1 me-1">à</label>
                                        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                                    </>
                                )}
                            </>
                        )}

                        {filterType === 'mois' && (
                            <>
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>{String(m).padStart(2, '0')}</option>))}
                                </select>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (<option key={y} value={y}>{y}</option>))}
                                </select>
                            </>
                        )}

                        {filterType === 'annee' && (
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (<option key={y} value={y}>{y}</option>))}
                            </select>
                        )}

                        <button className="btn-search" onClick={handleSearchByFilters}>Rechercher</button>
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
                                                    libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '');
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



