import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrintHistoryPage() {
    const navigate = useNavigate();
    const [printHistory, setPrintHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTable, setShowTable] = useState(false);
    const [libellesMap, setLibellesMap] = useState({}); // Pour stocker les libellés par client_id et montant

    // Filtres
    const [filterType, setFilterType] = useState('mois'); // 'jour', 'periode', 'mois', 'annee'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
    const months = [
        { value: 1, label: 'Janvier' },
        { value: 2, label: 'Février' },
        { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' },
        { value: 5, label: 'Mai' },
        { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' },
        { value: 8, label: 'Août' },
        { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Décembre' }
    ];

    // Fonction pour récupérer les libellés des charges correspondantes
    const fetchLibellesForHistory = async (historyData) => {
        const libelles = {};
        
        // Grouper par client_id pour éviter les requêtes multiples
        const clientsMap = {};
        historyData.forEach(r => {
            if (!clientsMap[r.client_id]) {
                clientsMap[r.client_id] = [];
            }
            clientsMap[r.client_id].push(r);
        });

        // Pour chaque client, récupérer les charges et trouver les libellés correspondants
        for (const [clientId, receipts] of Object.entries(clientsMap)) {
            try {
                const chargesResponse = await fetch(`/api/charges-mensuelles/client/${clientId}?all=true`);
                const chargesData = await chargesResponse.json();

                if (chargesData.success && chargesData.charges) {
                    receipts.forEach(receipt => {
                        const montantRecherche = parseFloat(receipt.montant);
                        // Trouver la charge correspondante (honoraire reçu avec le même montant)
                        const chargeTrouvee = chargesData.charges
                            .filter(c => {
                                const chargeLibelle = (c.libelle || '').toUpperCase();
                                const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('HONORAIRES RECU');
                                if (!isHonoraireRecu) return false;
                                
                                const avance = parseFloat(c.avance || 0);
                                const montant = parseFloat(c.montant || 0);
                                const montantCharge = Math.max(avance, montant);
                                
                                return Math.abs(montantCharge - montantRecherche) < 0.001;
                            })
                            .sort((a, b) => {
                                const dateA = new Date(a.date || a.date_creation || 0);
                                const dateB = new Date(b.date || b.date_creation || 0);
                                return dateB - dateA;
                            })[0];

                        if (chargeTrouvee) {
                            libelles[`${receipt.client_id}_${receipt.montant}_${receipt.date_impression}`] = chargeTrouvee.libelle || 'HONORAIRES REÇU';
                        } else {
                            libelles[`${receipt.client_id}_${receipt.montant}_${receipt.date_impression}`] = 'HONORAIRES REÇU';
                        }
                    });
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération des charges pour client ${clientId}:`, error);
                // En cas d'erreur, utiliser le libellé par défaut
                receipts.forEach(receipt => {
                    libelles[`${receipt.client_id}_${receipt.montant}_${receipt.date_impression}`] = 'HONORAIRES REÇU';
                });
            }
        }

        setLibellesMap(libelles);
    };

    // Charger automatiquement les données au chargement de la page (SANS FILTRE pour voir toutes les données)
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            setShowTable(false);

            try {
                // Charger TOUTES les données sans filtre pour voir s'il y a des enregistrements
                console.log('Chargement de toutes les données print-history...');
                const response = await fetch(`/api/print-history?limit=1000&offset=0`);
                const data = await response.json();
                
                console.log('Réponse API print-history (toutes données):', data);

                if (data.success) {
                    const historyData = data.data || [];
                    console.log(`Nombre d'enregistrements trouvés: ${historyData.length}`);
                    setPrintHistory(historyData);
                    setShowTable(true);
                    // Récupérer les libellés pour chaque reçu
                    if (historyData.length > 0) {
                        fetchLibellesForHistory(historyData);
                    }
                    if (historyData.length === 0) {
                        console.warn('⚠️ Aucun enregistrement trouvé dans print_history');
                        setError('');
                    }
                } else {
                    const errorMsg = data.error || data.message || "Erreur lors du chargement de l'historique";
                    setError(errorMsg);
                    console.error('❌ Erreur API print-history:', errorMsg, data);
                }
            } catch (err) {
                const errorMsg = err.message || "Erreur réseau lors du chargement de l'historique";
                setError(errorMsg);
                console.error('❌ Erreur fetch print-history:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleAfficher = async () => {
        setLoading(true);
        setError('');
        setShowTable(false);

        try {
            const params = new URLSearchParams();

            // Construire les dates selon le type de filtre
            if (filterType === 'jour') {
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                params.append('date_debut', dateStr);
                params.append('date_fin', dateStr);
            } else if (filterType === 'periode') {
                if (!dateDebut || !dateFin) {
                    alert('Veuillez sélectionner les dates de début et de fin');
                    setLoading(false);
                    return;
                }
                params.append('date_debut', dateDebut);
                params.append('date_fin', dateFin);
            } else if (filterType === 'mois') {
                const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
                params.append('date_debut', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
                params.append('date_fin', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
            } else if (filterType === 'annee') {
                params.append('date_debut', `${selectedYear}-01-01`);
                params.append('date_fin', `${selectedYear}-12-31`);
            }

            // Ne pas filtrer par caissier - afficher tous les caissiers

            const response = await fetch(`/api/print-history?${params.toString()}`);
            const data = await response.json();
            
            console.log('Réponse API print-history (avec filtres):', { params: params.toString(), data });

            if (data.success) {
                const historyData = data.data || [];
                console.log(`Nombre d'enregistrements trouvés avec filtres: ${historyData.length}`);
                setPrintHistory(historyData);
                setShowTable(true);
                // Récupérer les libellés pour chaque reçu
                if (historyData.length > 0) {
                    fetchLibellesForHistory(historyData);
                }
                if (historyData.length === 0) {
                    console.warn('⚠️ Aucun enregistrement trouvé avec les filtres sélectionnés');
                    setError('');
                }
            } else {
                const errorMsg = data.error || data.message || "Erreur lors du chargement de l'historique";
                setError(errorMsg);
                console.error('❌ Erreur API print-history:', errorMsg, data);
            }
        } catch (err) {
            const errorMsg = err.message || "Erreur réseau lors du chargement de l'historique";
            setError(errorMsg);
            console.error('Erreur fetch print-history:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const formatMontant = (m) => {
        const n = parseFloat(m);
        if (isNaN(n)) return '0,000';
        return n.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    };

    // Fonction pour trouver et afficher le reçu
    const handleViewReceipt = async (receipt) => {
        try {
            // Récupérer les charges du client pour trouver celle correspondante
            const chargesResponse = await fetch(`/api/charges-mensuelles/client/${receipt.client_id}?all=true`);
            const chargesData = await chargesResponse.json();

            if (chargesData.success && chargesData.charges) {
                // Trouver la charge correspondante : honoraires reçu avec le même montant
                // Chercher la charge la plus récente avec ce montant
                const montantRecherche = parseFloat(receipt.montant);
                const chargeTrouvee = chargesData.charges
                    .filter(c => {
                        const chargeLibelle = (c.libelle || '').toUpperCase();
                        const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('HONORAIRES RECU');
                        if (!isHonoraireRecu) return false;
                        
                        // Comparer le montant (avance ou montant)
                        const avance = parseFloat(c.avance || 0);
                        const montant = parseFloat(c.montant || 0);
                        const montantCharge = Math.max(avance, montant);
                        
                        return Math.abs(montantCharge - montantRecherche) < 0.001; // Tolérance pour les erreurs de virgule flottante
                    })
                    .sort((a, b) => {
                        // Trier par date décroissante (plus récent en premier)
                        const dateA = new Date(a.date || a.date_creation || 0);
                        const dateB = new Date(b.date || b.date_creation || 0);
                        return dateB - dateA;
                    })[0];

                if (chargeTrouvee) {
                    // Naviguer vers la page d'impression du reçu
                    navigate(`/client/${receipt.client_id}/print-receipt?chargeId=${chargeTrouvee.id}`);
                } else {
                    alert('Charge correspondante non trouvée. Le reçu peut avoir été supprimé ou modifié.');
                }
            } else {
                alert('Erreur lors de la récupération des charges du client.');
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de la charge:', error);
            alert('Erreur lors de la recherche du reçu.');
        }
    };

    // Générer les jours du mois sélectionné
    const getDaysInMonth = () => {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    };

    const days = getDaysInMonth();

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .print-history-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 0.75rem 0;
                }
                
                .filter-bar {
                    background: white;
                    border: 1px solid #edf0f3;
                    border-radius: 10px;
                    padding: 1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    max-width: 1200px;
                    margin: 0 auto 0.75rem auto;
                }
                
                .filter-bar label {
                    margin-bottom: 0;
                    color: #2c3e50;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .filter-bar select,
                .filter-bar input[type="date"] {
                    border: 1px solid #e2e6ea;
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 0.9rem;
                    min-width: 120px;
                }
                
                .filter-bar select:focus,
                .filter-bar input[type="date"]:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
                }
                
                .btn-afficher {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    padding: 8px 20px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-afficher:hover {
                    background: linear-gradient(45deg, #218838, #1e7e34);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                
                .btn-afficher:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .inline-results-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #000;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    padding: 1rem;
                    max-width: 1200px;
                    margin: 0 auto;
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
                    padding: 0.75rem;
                    text-align: left;
                }
                
                .inline-table thead th:last-child {
                    border-right: none;
                }
                
                .inline-table th,
                .inline-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #000;
                    border-right: 1px solid #000;
                    text-align: left;
                }
                
                .inline-table td:last-child {
                    border-right: none;
                }
                
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .inline-table tbody tr:hover {
                    background: #fafcff;
                }
                
                .modern-spinner {
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
                
                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 0 auto 0.75rem auto;
                    max-width: 1200px;
                    text-align: center;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #6c757d;
                }
                
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                @media (max-width: 768px) {
                    .filter-bar {
                        margin: 1rem;
                        padding: 1rem;
                    }
                    
                    .filter-bar select,
                    .filter-bar input[type="date"] {
                        width: 100%;
                        min-width: auto;
                    }
                    
                    .inline-results-card {
                        margin: 1rem;
                    }
                }
            `}</style>

            <div className="print-history-page">
                <div className="container">
                    {/* Barre de filtrage */}
                    <div className="filter-bar">
                        <label><i className="fas fa-filter me-1"></i>Type:</label>
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setShowTable(false);
                            }}
                        >
                            <option value="jour">Jour</option>
                            <option value="periode">Période</option>
                            <option value="mois">Mois</option>
                            <option value="annee">Année</option>
                        </select>

                        {filterType === 'jour' && (
                            <>
                                <label className="ms-2">Jour:</label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => {
                                        setSelectedDay(parseInt(e.target.value));
                                        setShowTable(false);
                                    }}
                                >
                                    {days.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <label className="ms-2">Mois:</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(parseInt(e.target.value));
                                        setSelectedDay(1);
                                        setShowTable(false);
                                    }}
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <label className="ms-2">Année:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(parseInt(e.target.value));
                                        setShowTable(false);
                                    }}
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === 'periode' && (
                            <>
                                <label className="ms-2">Du:</label>
                                <input
                                    type="date"
                                    value={dateDebut}
                                    onChange={(e) => {
                                        setDateDebut(e.target.value);
                                        setShowTable(false);
                                    }}
                                />
                                <label className="ms-2">Au:</label>
                                <input
                                    type="date"
                                    value={dateFin}
                                    onChange={(e) => {
                                        setDateFin(e.target.value);
                                        setShowTable(false);
                                    }}
                                />
                            </>
                        )}

                        {filterType === 'mois' && (
                            <>
                                <label className="ms-2">Mois:</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(parseInt(e.target.value));
                                        setShowTable(false);
                                    }}
                                >
                                    {months.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <label className="ms-2">Année:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(parseInt(e.target.value));
                                        setShowTable(false);
                                    }}
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === 'annee' && (
                            <>
                                <label className="ms-2">Année:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(parseInt(e.target.value));
                                        setShowTable(false);
                                    }}
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        <button
                            className="btn-afficher ms-2"
                            onClick={handleAfficher}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="modern-spinner"></div>
                                    Chargement...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-search me-2"></i>
                                    Afficher
                                </>
                            )}
                        </button>
                    </div>

                    {/* Messages d'erreur */}
                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Tableau des résultats */}
                    {showTable && !loading && (
                        <div className="inline-results-card">
                            {printHistory.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-receipt"></i>
                                    <h5>Aucun reçu trouvé</h5>
                                    <p>Aucun reçu n'a été trouvé avec les critères de recherche sélectionnés.</p>
                                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                        <strong>Astuce :</strong> Pour enregistrer un reçu, cliquez sur le bouton "Reçu" (orange) dans le tableau des charges d'un client, puis sur "Imprimer" dans la page du reçu.
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="inline-table">
                                        <thead>
                                            <tr>
                                                <th>Date d'impression</th>
                                                <th>Nom de caissier</th>
                                                <th>Nom de client</th>
                                                <th>Libellé (Honoraire)</th>
                                                <th>Montant de honoraire reçu</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {printHistory.map((r, idx) => {
                                                const libelleKey = `${r.client_id}_${r.montant}_${r.date_impression}`;
                                                const libelle = libellesMap[libelleKey] || 'HONORAIRES REÇU';
                                                
                                                return (
                                                <tr key={idx}>
                                                    <td>
                                                        <i className="fas fa-calendar-alt me-2 text-muted"></i>
                                                        {formatDate(r.date_impression)}
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-user me-2 text-muted"></i>
                                                        {r.caissier_username || '-'}
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-user-tie me-2 text-muted"></i>
                                                        {`${r.client_prenom || ''} ${r.client_nom || ''}`.trim() || '-'}
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-file-invoice me-2 text-muted"></i>
                                                        {libelle}
                                                    </td>
                                                    <td style={{ color: '#198754', fontWeight: 700 }}>
                                                        {formatMontant(r.montant)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleViewReceipt(r)}
                                                            style={{
                                                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '6px 12px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-2px)';
                                                                e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0)';
                                                                e.target.style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                            Voir reçu
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
