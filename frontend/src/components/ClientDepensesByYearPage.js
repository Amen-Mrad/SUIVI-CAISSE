import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ClientDepensesByYearPage() {
    const { id } = useParams();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);
    const [depenses, setDepenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClientInfo();
    }, [id]);

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

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowDepenses = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('client_id', id);
            params.append('annee', selectedYear);

            const response = await fetch(`/api/depenses/par-client?${params.toString()}`);
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

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

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

            setLoading(true);
            setError('');

            const deleteRes = await fetch(`/api/depenses/${depense.id}`, { method: 'DELETE' });
            const deleteData = await deleteRes.json();
            if (!deleteRes.ok || !deleteData.success) {
                throw new Error(deleteData.error || 'Erreur lors de la suppression de la dépense');
            }

            // Rafraîchir la liste
            await handleShowDepenses();
            alert('Dépense retirée des dépenses client. Le bouton Client redevient disponible.');
        } catch (err) {
            setError(err.message || 'Erreur lors du retrait de la dépense');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les dépenses selon la recherche
    const filteredDepenses = depenses.filter(depense => {
        if (!searchQuery.trim()) return true;
        const beneficiaire = (depense.beneficiaire || depense.client || '').toLowerCase();
        return beneficiaire.includes(searchQuery.toLowerCase());
    });


    return (
        <>
            <style jsx global>{`
                body, html { 
                    background: rgb(187, 187, 187) !important;
                    height: auto !important; 
                    overflow-x: hidden; 
                    overflow-y: auto; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .client-depenses-year-page { 
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

            <div className="client-depenses-year-page">
                <div className="container">
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

                    {/* Filtres */}
                    <div className="action-container text-center">
                        <div className="filter-title">Filtrer les dépenses client - Par Année</div>
                        <div className="filter-row" style={{ marginTop: '0.25rem' }}>
                            <label className="mb-0 me-1">Année</label>
                            <select value={selectedYear} onChange={handleYearChange}>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <button 
                                className="btn-search" 
                                onClick={handleShowDepenses} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="modern-spinner"></div>
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-eye me-2"></i>
                                        Afficher les Dépenses
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {showTable && (
                    <div className="container mt-4">
                        <div className="card" style={{ borderRadius: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
                            <div className="card-header" style={{
                                background: 'linear-gradient(135deg, #6f42c1 0%, #007bff 100%)',
                                color: 'white',
                                borderRadius: '20px 20px 0 0',
                                border: 'none'
                            }}>
                                <h4 className="mb-0">
                                    <i className="fas fa-table me-2"></i>
                                    Dépenses du client - {selectedYear}
                                </h4>
                            </div>
                            <div className="card-body">
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        {error}
                                    </div>
                                )}

                                {/* Barre de recherche */}
                                <div className="mb-3">
                                    <label htmlFor="beneficiaireSearch" className="form-label">
                                        <i className="fas fa-search me-1"></i>
                                        Rechercher par client
                                    </label>
                                    <input
                                        type="text"
                                        id="beneficiaireSearch"
                                        className="form-control"
                                        placeholder="Tapez la première lettre du client..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {loading ? (
                                    <div className="text-center">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Chargement...</span>
                                        </div>
                                        <p className="mt-2">Chargement des dépenses...</p>
                                    </div>
                                ) : filteredDepenses.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead style={{
                                                background: 'linear-gradient(135deg, #6f42c1 0%, #007bff 100%)',
                                                color: 'white'
                                            }}>
                                                <tr>
                                                    <th>DATE</th>
                                                    <th>CLIENT</th>
                                                    <th>LIBELLÉ</th>
                                                    <th>MONTANT</th>
                                                    <th>ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredDepenses.map((depense, index) => {
                                                    const clientName = depense.client || depense.beneficiaire;
                                                    let libelleText = depense.libelle || depense.description || '-';
                                                    // Remplacer [CGM] ou [CGM PAYÉ] par [PAYÉ PAR CGM] dans l'affichage
                                                    libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '[PAYÉ PAR CGM] ').replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');

                                                    // Déterminer la couleur du montant selon le type de dépense
                                                    const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                                    const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
                                                    const montantClassName = isHonoraire ? 'text-success fw-bold' : 'text-danger fw-bold';

                                                    return (
                                                        <tr
                                                            key={index}
                                                            style={{
                                                                backgroundColor: index % 2 === 0 ? '#fff3cd' : 'white'
                                                            }}
                                                        >
                                                            <td>{formatDate(depense.date)}</td>
                                                            <td className="fw-bold">{clientName}</td>
                                                            <td>{libelleText}</td>
                                                            <td className={montantClassName}>{formatMontant(depense.montant || 0)}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleReturnToCharge(depense); }}
                                                                    title="Retour au charge"
                                                                    style={{ minWidth: '120px' }}
                                                                >
                                                                    <i className="fas fa-undo me-1"></i> Retour au charge
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        {searchQuery.trim() ?
                                            `Aucune dépense trouvée pour "${searchQuery}".` :
                                            'Aucune dépense trouvée pour cette année.'
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
