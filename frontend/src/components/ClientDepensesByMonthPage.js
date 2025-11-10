import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ClientDepensesByMonthPage() {
    const { id } = useParams();
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);
    const [depenses, setDepenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const currentMonth = new Date().getMonth() + 1;
        setSelectedMonth(currentMonth.toString().padStart(2, '0'));
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

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowDepenses = async () => {
        if (!selectedMonth) {
            alert('Veuillez sélectionner un mois');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('client_id', id);
            params.append('mois', selectedMonth);
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

    const months = [
        { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' }, { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' }, { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' }, { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' }, { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
    ];

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
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .client-depenses-month-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                .depenses-header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .depenses-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .depenses-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); color: white; text-decoration: none; }
                .client-info-card { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid #2196f3; }
                .client-info-title { color: #1976d2; font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; }
                .client-info-text { color: #424242; font-size: 1rem; margin-bottom: 0.5rem; }
                .month-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
                .month-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .month-input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-label { color: #495057; font-weight: 600; font-size: 1rem; }
                .month-select, .year-select { border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 16px; font-size: 1rem; transition: all 0.3s ease; background: #f8f9fa; }
                .month-select:focus, .year-select:focus { outline: none; border-color: #2196f3; background: white; box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1); }
                .show-btn { background: linear-gradient(45deg, #2196f3, #1976d2); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; min-width: 150px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(33, 150, 243, 0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .info-card { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 1.5rem; border-left: 4px solid #2196f3; transition: all 0.3s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .info-card-icon { font-size: 2rem; color: #2196f3; margin-bottom: 1rem; }
                .info-card-title { color: #2c3e50; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .info-card-text { color: #6c757d; font-size: 0.9rem; line-height: 1.5; }
                .modern-spinner { width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #2196f3; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) { .depenses-title { font-size: 2rem; } .month-input-group { grid-template-columns: 1fr; } .depenses-header, .month-selector-container { margin: 1rem; padding: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="client-depenses-month-page">
                <div className="container">
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title"><i className="fas fa-calendar-alt me-3"></i>Dépenses Client - Par Mois</h1>
                                <p className="depenses-subtitle">Consultez les dépenses du client pour un mois spécifique</p>
                            </div>
                            <Link to={`/client/${id}`} className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    {clientInfo && (
                        <div className="client-info-card">
                            <div className="client-info-title"><i className="fas fa-user me-2"></i>Informations du client</div>
                            <div className="client-info-text"><strong>Nom :</strong> {clientInfo.nom} {clientInfo.prenom}</div>
                            <div className="client-info-text"><strong>Téléphone :</strong> {clientInfo.telephone}</div>
                            <div className="client-info-text"><strong>Email :</strong> {clientInfo.email}</div>
                        </div>
                    )}

                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-calendar-week"></i></div>
                            <div className="info-card-title">Sélection mensuelle</div>
                            <div className="info-card-text">Choisissez le mois et l'année pour consulter les dépenses de ce client.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-user"></i></div>
                            <div className="info-card-title">Dépenses client</div>
                            <div className="info-card-text">Visualisez toutes les dépenses spécifiques à ce client pour le mois sélectionné.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-chart-bar"></i></div>
                            <div className="info-card-title">Vue mensuelle</div>
                            <div className="info-card-text">Analysez les dépenses mensuelles de ce client avec des statistiques détaillées.</div>
                        </div>
                    </div>

                    <div className="month-selector-container">
                        <h5 className="month-selector-title"><i className="fas fa-calendar-alt me-2"></i>Sélectionner un mois</h5>

                        <div className="month-input-group">
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar me-2"></i>Mois :</label>
                                <select className="month-select" value={selectedMonth} onChange={handleMonthChange}>
                                    <option value="">Sélectionner un mois</option>
                                    {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label"><i className="fas fa-calendar-year me-2"></i>Année :</label>
                                <select className="year-select" value={selectedYear} onChange={handleYearChange}>
                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="text-center">
                            <button className="show-btn" onClick={handleShowDepenses} disabled={loading || !selectedMonth}>
                                {loading ? (<><div className="modern-spinner"></div>Chargement...</>) : (<><i className="fas fa-eye me-2"></i>Afficher les Dépenses</>)}
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
                                    Dépenses du client - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
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
                                                    // Supprimer le préfixe [CGM PAYÉ] du libellé
                                                    libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '');

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
                                            'Aucune dépense trouvée pour cette période.'
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
