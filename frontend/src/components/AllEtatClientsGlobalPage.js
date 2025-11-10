import React, { useState, useEffect } from 'react';
import EtatCgmModal from './EtatCgmModal';

export default function AllEtatClientsGlobalPage() {
    const [showModal, setShowModal] = useState(false);
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedClientForDisplay, setSelectedClientForDisplay] = useState(null);

    // UI de filtrage (comme Dépenses CGM)
    const [filterType, setFilterType] = useState('mois'); // 'jour' | 'mois' | 'annee'
    const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
    const [selectedDate, setSelectedDate] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchClients();
        // Date par défaut (aujourd'hui)
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClients(clients);
        } else {
            const filtered = clients.filter(client => {
                const searchTerm = searchQuery.toLowerCase();
                return (
                    client.username?.toLowerCase().includes(searchTerm) ||
                    client.nom?.toLowerCase().includes(searchTerm) ||
                    (client.telephone || '').includes(searchTerm)
                );
            });
            setFilteredClients(filtered);
        }
    }, [searchQuery, clients]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            const data = await response.json();
            if (data.success) {
                setClients(data.clients || []);
                setFilteredClients(data.clients || []);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des clients:', err);
        }
    };

    const handleShowEtat = () => {
        // Déterminer le filterType et les paramètres selon la sélection
        let finalFilterType = filterType;
        let finalDate = null;
        let finalDateDebut = null;
        let finalDateFin = null;
        let finalMois = null;
        let finalAnnee = null;

        if (filterType === 'jour') {
            if (jourMode === 'date') {
                if (!selectedDate) {
                    alert('Veuillez sélectionner une date');
                    return;
                }
                finalDate = selectedDate;
            } else {
                // période
                if (!dateDebut || !dateFin) {
                    alert('Veuillez sélectionner une période (début et fin)');
                    return;
                }
                if (new Date(dateDebut) > new Date(dateFin)) {
                    alert('La date de début doit être antérieure à la date de fin');
                    return;
                }
                finalFilterType = 'periode';
                finalDateDebut = dateDebut;
                finalDateFin = dateFin;
            }
        } else if (filterType === 'mois') {
            finalMois = selectedMonth;
            finalAnnee = selectedYear;
        } else if (filterType === 'annee') {
            finalAnnee = selectedYear;
        }

        // Vue globale: pas de client_id, type = 'client' pour agréger côté API
        window.currentEtatClientId = null;
        window.currentEtatType = 'client';
        setSelectedClient(null);
        setShowModal(true);
    };

    const openAll = () => {
        // Ancienne fonction pour compatibilité, maintenant on utilise handleShowEtat
        handleShowEtat();
    };

    const openForClient = (client) => {
        // Vue pour un client spécifique
        console.log('Opening for client:', client);
        window.currentEtatClientId = client.id;
        window.currentEtatType = 'client';
        console.log('Set global variables:', { clientId: client.id, type: 'client' });
        setSelectedClient(client);
        setShowModal(true);
    };

    const handleClientSelect = (client) => {
        setSelectedClientForDisplay(client);
    };

    const showSelectedClientEtat = () => {
        if (selectedClientForDisplay) {
            openForClient(selectedClientForDisplay);
        }
    };

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .all-etat-client-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 1rem 0; }
                .search-card { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 1rem; max-width: 500px; margin-left: auto; margin-right: auto; }
                .search-card h5 { font-size: 1rem; margin-bottom: 0.75rem; color: #495057; }
                .search-input { width: 100%; border: 1px solid #e9ecef; border-radius: 6px; padding: 8px 12px; background: #f8f9fa; font-size: 0.9rem; }
                .search-input:focus { outline: none; border-color: #667eea; background: white; }
                .clients-list { margin-top: 0.75rem; }
                .clients-scroll { max-height: 150px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 6px; }
                .client-item { padding: 6px 12px; border-bottom: 1px solid #f8f9fa; color: #495057; cursor: pointer; font-size: 0.85rem; }
                .client-item:hover { background: #f8f9fa; }
                .client-item:last-child { border-bottom: none; }
                .client-item.selected { background: #e3f2fd; border-left: 3px solid #2196f3; }
                .show-client-btn { background: #2196f3; border: none; color: white; border-radius: 6px; padding: 6px 14px; font-weight: 500; font-size: 0.85rem; margin-top: 0.75rem; cursor: pointer; }
                .show-client-btn:hover { background: #1976d2; }
                .show-client-btn:disabled { background: #ccc; cursor: not-allowed; }
                .filter-bar { background: white; border: 1px solid #edf0f3; border-radius: 10px; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; gap: 0.5rem; align-items: center; justify-content: center; max-width: 900px; margin: 0 auto; flex-wrap: wrap; }
                .tabs { display: inline-flex; background: #f1f5f9; border-radius: 999px; padding: 4px; }
                .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 999px; font-weight: 700; color: #334155; cursor: pointer; }
                .tab-btn.active { background: #0d6efd; color: white; box-shadow: 0 4px 10px rgba(13,110,253,.3); }
                .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; }
                .btn-search:hover { background: #0b5ed7; }
            `}</style>

            <div className="all-etat-client-page">
                <div className="container">
                    {/* Section de recherche de client */}
                    <div className="search-card">
                        <h5><i className="fas fa-search me-2"></i>Rechercher un client</h5>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Filtrer par nom, username, téléphone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="clients-list">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-2">
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                        {searchQuery.trim() ? 'Aucun client trouvé' : 'Aucun client disponible'}
                                    </p>
                                </div>
                            ) : (
                                <div className="clients-scroll">
                                    {filteredClients.map((client) => (
                                        <div
                                            key={client.id}
                                            className={`client-item ${selectedClientForDisplay?.id === client.id ? 'selected' : ''}`}
                                            onClick={() => handleClientSelect(client)}
                                        >
                                            {client.nom} {client.prenom} ({client.username})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <button
                                className="show-client-btn"
                                onClick={showSelectedClientEtat}
                                disabled={!selectedClientForDisplay}
                            >
                                <i className="fas fa-eye me-2"></i>Afficher l'état
                            </button>
                        </div>
                    </div>

                    {/* Interface de filtrage */}
                    <div className="filter-bar">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${filterType === 'jour' ? 'active' : ''}`}
                                onClick={() => setFilterType('jour')}
                            >
                                Jour
                            </button>
                            <button
                                className={`tab-btn ${filterType === 'mois' ? 'active' : ''}`}
                                onClick={() => setFilterType('mois')}
                            >
                                Mois
                            </button>
                            <button
                                className={`tab-btn ${filterType === 'annee' ? 'active' : ''}`}
                                onClick={() => setFilterType('annee')}
                            >
                                Année
                            </button>
                        </div>

                        {filterType === 'jour' && (
                            <>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <label style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                                        <input
                                            type="radio"
                                            checked={jourMode === 'date'}
                                            onChange={() => setJourMode('date')}
                                            style={{ marginRight: '4px' }}
                                        />
                                        Date
                                    </label>
                                    <label style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                                        <input
                                            type="radio"
                                            checked={jourMode === 'periode'}
                                            onChange={() => setJourMode('periode')}
                                            style={{ marginRight: '4px' }}
                                        />
                                        Période
                                    </label>
                                </div>
                                {jourMode === 'date' ? (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="date"
                                            value={dateDebut}
                                            onChange={(e) => setDateDebut(e.target.value)}
                                            placeholder="Début"
                                            style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>à</span>
                                        <input
                                            type="date"
                                            value={dateFin}
                                            onChange={(e) => setDateFin(e.target.value)}
                                            placeholder="Fin"
                                            style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {filterType === 'mois' && (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === 'annee' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                style={{ border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px' }}
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}

                        <button className="btn-search" onClick={handleShowEtat}>
                            <i className="fas fa-search me-2"></i>Rechercher
                        </button>
                    </div>
                </div>

                {showModal && (
                    <EtatCgmModal
                        show={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setSelectedClient(null);
                            setSelectedClientForDisplay(null);
                        }}
                        type="client"
                        filterType={
                            filterType === 'jour' && jourMode === 'date' ? 'jour' :
                                filterType === 'jour' && jourMode === 'periode' ? 'periode' :
                                    filterType === 'mois' ? 'mois' :
                                        filterType === 'annee' ? 'annee' : null
                        }
                        date={filterType === 'jour' && jourMode === 'date' ? selectedDate : null}
                        dateDebut={filterType === 'jour' && jourMode === 'periode' ? dateDebut : null}
                        dateFin={filterType === 'jour' && jourMode === 'periode' ? dateFin : null}
                        mois={filterType === 'mois' ? selectedMonth : null}
                        annee={
                            filterType === 'mois' ? selectedYear :
                                filterType === 'annee' ? selectedYear : null
                        }
                    />
                )}
            </div>
        </>
    );
}


