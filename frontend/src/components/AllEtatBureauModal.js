import React, { useState, useEffect } from 'react';

export default function AllEtatBureauModal({ show, onClose, selectedBeneficiaire = null }) {
    const [etats, setEtats] = useState([]);
    const [filteredEtats, setFilteredEtats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('tous'); // 'tous', 'jour', 'mois', 'annee'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
    const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (show) {
            fetchAllEtats();
        }
    }, [show, selectedBeneficiaire]);

    // Filtrage en temps réel des états par bénéficiaire
    useEffect(() => {
        let filtered = etats;

        // Filtrage par bénéficiaire sélectionné
        if (selectedBeneficiaire) {
            filtered = filtered.filter(etat =>
                etat.beneficiaire === selectedBeneficiaire
            );
        }

        // Filtrage par recherche de bénéficiaire
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(etat => {
                const beneficiaireName = (etat.beneficiaire || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                return beneficiaireName.includes(query);
            });
        }

        // Filtrage par type de date
        if (filterType !== 'tous') {
            filtered = filtered.filter(etat => {
                const etatDate = new Date(etat.date);

                if (filterType === 'jour') {
                    const selectedDateObj = new Date(selectedDate);
                    return etatDate.toDateString() === selectedDateObj.toDateString();
                } else if (filterType === 'mois') {
                    return etatDate.getMonth() + 1 === selectedMonth && etatDate.getFullYear() === selectedYear;
                } else if (filterType === 'annee') {
                    return etatDate.getFullYear() === selectedYear;
                } else if (filterType === 'periode') {
                    const debut = new Date(dateDebut);
                    const fin = new Date(dateFin);
                    return etatDate >= debut && etatDate <= fin;
                }
                return true;
            });
        }

        setFilteredEtats(filtered);
    }, [searchQuery, etats, filterType, selectedDate, selectedMonth, selectedYear, dateDebut, dateFin, selectedBeneficiaire]);

    const fetchAllEtats = async () => {
        setLoading(true);
        setError('');

        try {
            // Récupérer les honoraires
            console.log('Fetching honoraires...');
            const honorairesResponse = await fetch('/api/honoraires?libelle=Honoraires reçu');
            console.log('Honoraires response status:', honorairesResponse.status);
            const honorairesData = await honorairesResponse.json();
            console.log('Honoraires data:', honorairesData);

            // Récupérer les dépenses bureau
            console.log('Fetching depenses...');
            const depensesResponse = await fetch('/api/depenses?type=bureau');
            console.log('Depenses response status:', depensesResponse.status);
            const depensesData = await depensesResponse.json();
            console.log('Depenses data:', depensesData);

            if (honorairesData.success && depensesData.success) {
                const honoraires = honorairesData.honoraires || [];
                const depenses = depensesData.depenses || [];

                console.log('Honoraires count:', honoraires.length);
                console.log('Depenses count:', depenses.length);

                // Combiner les données en états
                const etatsCombines = [];

                // Ajouter les honoraires
                honoraires.forEach(honoraire => {
                    etatsCombines.push({
                        id: `h_${honoraire.id}`,
                        type: 'honoraire',
                        date: honoraire.date,
                        beneficiaire: `${honoraire.client_nom} ${honoraire.client_prenom}`,
                        libelle: honoraire.libelle,
                        montant: parseFloat(honoraire.avance || 0),
                        solde_restant: parseFloat(honoraire.solde_restant || 0)
                    });
                });

                // Ajouter les dépenses
                depenses.forEach(depense => {
                    etatsCombines.push({
                        id: `d_${depense.id}`,
                        type: 'depense',
                        date: depense.date,
                        beneficiaire: depense.beneficiaire || 'Bureau',
                        libelle: depense.libelle,
                        montant: parseFloat(depense.montant || 0),
                        solde_restant: 0
                    });
                });

                // Trier par date décroissante
                etatsCombines.sort((a, b) => new Date(b.date) - new Date(a.date));

                console.log('Total etats combines:', etatsCombines.length);
                setEtats(etatsCombines);
                setFilteredEtats(etatsCombines);
            } else {
                let errorMsg = 'Erreur lors du chargement des données: ';
                if (!honorairesData.success) {
                    errorMsg += `Honoraires: ${honorairesData.error || 'Erreur inconnue'}`;
                }
                if (!depensesData.success) {
                    errorMsg += `Dépenses: ${depensesData.error || 'Erreur inconnue'}`;
                }
                setError(errorMsg);
            }
        } catch (err) {
            console.error('Erreur détaillée:', err);
            setError(`Erreur lors du chargement des états: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatMontant = (montant) => {
        const value = parseFloat(montant);
        if (isNaN(value)) return '0,00';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'TND'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalHonoraires = filteredEtats.filter(e => e.type === 'honoraire').reduce((sum, e) => sum + e.montant, 0);
    const totalDepenses = filteredEtats.filter(e => e.type === 'depense').reduce((sum, e) => sum + e.montant, 0);
    const soldeTotal = totalHonoraires - totalDepenses;

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-chart-line me-2"></i>
                            Tous les États Bureau
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Barre de recherche par bénéficiaire */}
                        <div className="mb-4">
                            <label htmlFor="beneficiaireSearch" className="form-label">
                                <i className="fas fa-search me-1"></i>
                                Rechercher par bénéficiaire
                            </label>
                            <input
                                type="text"
                                id="beneficiaireSearch"
                                className="form-control form-control-lg"
                                placeholder="Tapez le nom du bénéficiaire..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filtres par date */}
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <label className="form-label">Filtrer par :</label>
                                <select
                                    className="form-select"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="tous">Toutes les dates</option>
                                    <option value="jour">Jour spécifique</option>
                                    <option value="mois">Mois spécifique</option>
                                    <option value="annee">Année spécifique</option>
                                    <option value="periode">Période</option>
                                </select>
                            </div>

                            {filterType === 'jour' && (
                                <div className="col-md-3">
                                    <label className="form-label">Date :</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {filterType === 'mois' && (
                                <>
                                    <div className="col-md-3">
                                        <label className="form-label">Mois :</label>
                                        <select
                                            className="form-select"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        >
                                            <option value="1">Janvier</option>
                                            <option value="2">Février</option>
                                            <option value="3">Mars</option>
                                            <option value="4">Avril</option>
                                            <option value="5">Mai</option>
                                            <option value="6">Juin</option>
                                            <option value="7">Juillet</option>
                                            <option value="8">Août</option>
                                            <option value="9">Septembre</option>
                                            <option value="10">Octobre</option>
                                            <option value="11">Novembre</option>
                                            <option value="12">Décembre</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Année :</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            min="2020"
                                            max="2030"
                                        />
                                    </div>
                                </>
                            )}

                            {filterType === 'annee' && (
                                <div className="col-md-3">
                                    <label className="form-label">Année :</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        min="2020"
                                        max="2030"
                                    />
                                </div>
                            )}

                            {filterType === 'periode' && (
                                <>
                                    <div className="col-md-3">
                                        <label className="form-label">Date début :</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateDebut}
                                            onChange={(e) => setDateDebut(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Date fin :</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateFin}
                                            onChange={(e) => setDateFin(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Statistiques */}
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-list me-2"></i>
                                            Total Entrées
                                        </h5>
                                        <h3>{filteredEtats.length}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-money-bill-wave me-2"></i>
                                            Honoraires
                                        </h5>
                                        <h3>{formatMontant(totalHonoraires)}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-danger text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-credit-card me-2"></i>
                                            Dépenses
                                        </h5>
                                        <h3>{formatMontant(totalDepenses)}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-white">
                                    <div className="card-body text-center">
                                        <h5 className="card-title">
                                            <i className="fas fa-balance-scale me-2"></i>
                                            Solde
                                        </h5>
                                        <h3 className={soldeTotal >= 0 ? 'text-success' : 'text-danger'}>
                                            {formatMontant(soldeTotal)}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tableau des états */}
                        {loading && (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement des états...</p>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {!loading && !error && filteredEtats.length > 0 && (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Bénéficiaire</th>
                                            <th>Libellé</th>
                                            <th>Montant</th>
                                            <th>Solde Restant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEtats.map((etat, index) => (
                                            <tr key={etat.id}>
                                                <td>{formatDate(etat.date)}</td>
                                                <td>
                                                    <span className={`badge ${etat.type === 'honoraire' ? 'bg-success' : 'bg-danger'}`}>
                                                        {etat.type === 'honoraire' ? 'Honoraire' : 'Dépense'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{etat.beneficiaire}</strong>
                                                </td>
                                                <td>{etat.libelle}</td>
                                                <td className={`fw-bold ${etat.type === 'honoraire' ? 'text-success' : 'text-danger'}`}>
                                                    {etat.type === 'honoraire' ? '+' : '-'}{formatMontant(etat.montant)}
                                                </td>
                                                <td className="text-info fw-bold">
                                                    {formatMontant(etat.solde_restant)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-dark">
                                        <tr>
                                            <th colSpan="4">TOTAL</th>
                                            <th className="text-success">+{formatMontant(totalHonoraires)}</th>
                                            <th className="text-danger">-{formatMontant(totalDepenses)}</th>
                                        </tr>
                                        <tr>
                                            <th colSpan="5">SOLDE FINAL</th>
                                            <th className={soldeTotal >= 0 ? 'text-success' : 'text-danger'}>
                                                {formatMontant(soldeTotal)}
                                            </th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {!loading && !error && filteredEtats.length === 0 && (
                            <div className="alert alert-info text-center">
                                <i className="fas fa-info-circle me-2"></i>
                                {searchQuery.trim() || filterType !== 'tous' ?
                                    'Aucun état trouvé avec les critères sélectionnés.' :
                                    'Aucun état bureau trouvé.'
                                }
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={fetchAllEtats}
                            disabled={loading}
                        >
                            <i className="fas fa-sync-alt me-2"></i>
                            Actualiser
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            <i className="fas fa-times me-2"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
