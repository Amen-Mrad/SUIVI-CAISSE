import React, { useState, useEffect } from 'react';

export default function EtatCgmFilterModal({ show, onClose, filterType }) {
    const [selectedDate, setSelectedDate] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedSubFilterType, setSelectedSubFilterType] = useState('date');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            setSelectedDate('');
            setDateDebut('');
            setDateFin('');
            setSelectedMonth('');
            setSelectedYear(new Date().getFullYear());
            setSelectedSubFilterType('date');
            setError('');
        }
    }, [show, filterType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let params = new URLSearchParams();
            const clientId = window.currentEtatClientId;
            const etatType = window.currentEtatType;

            // Ajouter le type si spécifié (bureau)
            if (etatType) {
                params.append('type', etatType);
            }

            if (filterType === 'jour') {
                if (selectedSubFilterType === 'date') {
                    if (!selectedDate) {
                        setError('Veuillez sélectionner une date');
                        return;
                    }
                    params.append('date', selectedDate);
                } else if (selectedSubFilterType === 'periode') {
                    if (!dateDebut || !dateFin) {
                        setError('Veuillez sélectionner les deux dates');
                        return;
                    }
                    if (new Date(dateDebut) > new Date(dateFin)) {
                        setError('La date de début doit être antérieure à la date de fin');
                        return;
                    }
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                }
            } else if (filterType === 'periode') {
                if (!dateDebut || !dateFin) {
                    setError('Veuillez sélectionner les deux dates');
                    return;
                }
                if (new Date(dateDebut) > new Date(dateFin)) {
                    setError('La date de début doit être antérieure à la date de fin');
                    return;
                }
                params.append('date_debut', dateDebut);
                params.append('date_fin', dateFin);
            } else if (filterType === 'mois') {
                if (!selectedMonth || !selectedYear) {
                    setError('Veuillez sélectionner le mois et l\'année');
                    return;
                }
                params.append('mois', selectedMonth);
                params.append('annee', selectedYear);
            } else if (filterType === 'annee') {
                if (!selectedYear) {
                    setError('Veuillez sélectionner l\'année');
                    return;
                }
                params.append('annee', selectedYear);
            }

            // Récupérer les honoraires filtrés
            let honorairesUrl = '';
            if (filterType === 'jour') {
                if (selectedSubFilterType === 'date') {
                    honorairesUrl = `/api/honoraires/par-jour?libelle=Honoraires reçu&${params.toString()}`;
                } else if (selectedSubFilterType === 'periode') {
                    honorairesUrl = `/api/honoraires/par-periode?libelle=Honoraires reçu&${params.toString()}`;
                }
            } else if (filterType === 'periode') {
                honorairesUrl = `/api/honoraires/par-periode?libelle=Honoraires reçu&${params.toString()}`;
            } else if (filterType === 'mois') {
                honorairesUrl = `/api/honoraires/par-mois?libelle=Honoraires reçu&${params.toString()}`;
            } else if (filterType === 'annee') {
                honorairesUrl = `/api/honoraires/par-annee?libelle=Honoraires reçu&${params.toString()}`;
            }
            if (clientId) honorairesUrl += `&client_id=${clientId}`;
            const honorairesResponse = await fetch(honorairesUrl);
            const honorairesData = await honorairesResponse.json();

            // Récupérer les dépenses filtrées
            let depensesUrl = '';
            if (filterType === 'jour') {
                if (selectedSubFilterType === 'date') {
                    depensesUrl = `/api/depenses/par-jour?${params.toString()}${clientId ? `&client_id=${clientId}&type=client` : ''}`;
                } else if (selectedSubFilterType === 'periode') {
                    depensesUrl = `/api/depenses/par-periode?${params.toString()}${clientId ? `&client_id=${clientId}&type=client` : ''}`;
                }
            } else if (filterType === 'periode') {
                depensesUrl = `/api/depenses/par-periode?${params.toString()}${clientId ? `&client_id=${clientId}&type=client` : ''}`;
            } else if (filterType === 'mois') {
                depensesUrl = `/api/depenses/par-mois?${params.toString()}${clientId ? `&client_id=${clientId}&type=client` : ''}`;
            } else if (filterType === 'annee') {
                depensesUrl = `/api/depenses/par-annee?${params.toString()}${clientId ? `&client_id=${clientId}&type=client` : ''}`;
            }
            const depensesResponse = await fetch(depensesUrl);
            const depensesData = await depensesResponse.json();

            if (honorairesData.success && depensesData.success) {
                // Récupérer le nom du client si un client est sélectionné
                let clientName = null;
                if (clientId && honorairesData.honoraires && honorairesData.honoraires.length > 0) {
                    const firstHonoraire = honorairesData.honoraires[0];
                    clientName = `${firstHonoraire.client_nom || ''} ${firstHonoraire.client_prenom || ''}`.trim();
                }

                // Ouvrir le modal EtatCgmModal avec les données filtrées
                const event = new CustomEvent('open-etat-cgm-filtered', {
                    detail: {
                        honoraires: honorairesData.honoraires || [],
                        depenses: depensesData.depenses || [],
                        filterType: filterType,
                        filterValue: filterType === 'jour' ?
                            (selectedSubFilterType === 'date' ? selectedDate : `${dateDebut} - ${dateFin}`) :
                            filterType === 'periode' ? `${dateDebut} - ${dateFin}` :
                                filterType === 'mois' ? `${selectedMonth}/${selectedYear}` :
                                    filterType === 'annee' ? selectedYear.toString() : '',
                        subFilterType: filterType === 'jour' ? selectedSubFilterType : null,
                        clientName: clientName
                    }
                });
                window.dispatchEvent(event);
                onClose();
            } else {
                console.error('Erreur honoraires:', honorairesData);
                console.error('Erreur dépenses:', depensesData);
                setError(`Erreur lors du chargement des données filtrées. Honoraires: ${honorairesData.error || 'OK'}, Dépenses: ${depensesData.error || 'OK'}`);
            }
        } catch (err) {
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-filter me-2"></i>
                            Filtrer les États CGM - {
                                filterType === 'jour' ? 'Par Jour' :
                                    filterType === 'periode' ? 'Par Période' :
                                        filterType === 'mois' ? 'Par Mois' :
                                            filterType === 'annee' ? 'Par Année' : 'Filtre'
                            }
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {filterType === 'jour' ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Type de filtrage :</label>
                                        <div className="form-check form-check-inline ms-3">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="subFilterType"
                                                id="filterByDate"
                                                value="date"
                                                checked={selectedSubFilterType === 'date'}
                                                onChange={() => setSelectedSubFilterType('date')}
                                            />
                                            <label className="form-check-label" htmlFor="filterByDate">Date</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="subFilterType"
                                                id="filterByPeriode"
                                                value="periode"
                                                checked={selectedSubFilterType === 'periode'}
                                                onChange={() => setSelectedSubFilterType('periode')}
                                            />
                                            <label className="form-check-label" htmlFor="filterByPeriode">Période</label>
                                        </div>
                                    </div>

                                    {selectedSubFilterType === 'date' && (
                                        <div className="mb-3">
                                            <label htmlFor="selectedDate" className="form-label">
                                                <i className="fas fa-calendar-day me-2"></i>
                                                Sélectionner la date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="selectedDate"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    {selectedSubFilterType === 'periode' && (
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="dateDebut" className="form-label">
                                                        <i className="fas fa-calendar-alt me-2"></i>
                                                        Date de début
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        id="dateDebut"
                                                        value={dateDebut}
                                                        onChange={(e) => setDateDebut(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="dateFin" className="form-label">
                                                        <i className="fas fa-calendar-alt me-2"></i>
                                                        Date de fin
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        id="dateFin"
                                                        value={dateFin}
                                                        onChange={(e) => setDateFin(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : filterType === 'periode' ? (
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="dateDebut" className="form-label">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="dateDebut"
                                                value={dateDebut}
                                                onChange={(e) => setDateDebut(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="dateFin" className="form-label">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="dateFin"
                                                value={dateFin}
                                                onChange={(e) => setDateFin(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : filterType === 'mois' ? (
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="selectedMonth" className="form-label">
                                                <i className="fas fa-calendar me-2"></i>
                                                Mois
                                            </label>
                                            <select
                                                className="form-select"
                                                id="selectedMonth"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                required
                                            >
                                                <option value="">Sélectionner le mois</option>
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
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="selectedYear" className="form-label">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Année
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                id="selectedYear"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                min="2020"
                                                max="2030"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : filterType === 'annee' ? (
                                <div className="mb-3">
                                    <label htmlFor="selectedYear" className="form-label">
                                        <i className="fas fa-calendar-alt me-2"></i>
                                        Sélectionner l'année
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="selectedYear"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        min="2020"
                                        max="2030"
                                        required
                                    />
                                </div>
                            ) : null}

                            <div className="d-grid gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-search me-2"></i>
                                            Rechercher
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <i className="fas fa-times me-2"></i>Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
