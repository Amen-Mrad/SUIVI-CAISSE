import React, { useState, useEffect } from 'react';

export default function HonorairesModal({ show, onClose, type, date, mois, annee }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
    const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));
    const [filterType, setFilterType] = useState('date'); // 'date' ou 'periode'
    const [honoraires, setHonoraires] = useState([]);
    const [filteredHonoraires, setFilteredHonoraires] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!show) return;
        // Si une date est fournie par le parent (ex: page Par Jour), l'utiliser et éviter une deuxième saisie
        if (type === 'jour' && date) {
            setFilterType('date');
            setSelectedDate(date);
            setHonoraires([]);
            setFilteredHonoraires([]);
            setError('');
            setSearchQuery('');
            // Charger automatiquement les données pour cette date
            // Attendre un tick pour garantir la mise à jour de l'état
            setTimeout(() => fetchHonoraires(), 0);
            return;
        }

        // Sinon, réinitialiser avec les valeurs par défaut
        setSelectedDate(new Date().toISOString().slice(0, 10));
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
        setDateDebut(new Date().toISOString().slice(0, 10));
        setDateFin(new Date().toISOString().slice(0, 10));
        setFilterType('date');
        setHonoraires([]);
        setFilteredHonoraires([]);
        setError('');
        setSearchQuery('');
        // Si on vient de la page par mois avec mois/annee fournis, pré-remplir et charger
        if (type === 'mois' && (mois || annee)) {
            if (mois) setSelectedMonth(parseInt(mois));
            if (annee) setSelectedYear(parseInt(annee));
            setHonoraires([]);
            setFilteredHonoraires([]);
            setError('');
            setSearchQuery('');
            setTimeout(() => fetchHonoraires(), 0);
            return;
        }

    }, [show, type, date, mois, annee]);

    // Filtrage en temps réel des honoraires par client
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredHonoraires(honoraires);
        } else {
            const filtered = honoraires.filter(honoraire => {
                const clientName = `${honoraire.client_nom || ''} ${honoraire.client_prenom || ''}`.toLowerCase();
                const query = searchQuery.toLowerCase();

                // Recherche par première lettre du nom ou prénom
                return (honoraire.client_nom && honoraire.client_nom.toLowerCase().startsWith(query)) ||
                    (honoraire.client_prenom && honoraire.client_prenom.toLowerCase().startsWith(query));
            });
            setFilteredHonoraires(filtered);
        }
    }, [searchQuery, honoraires]);

    const fetchHonoraires = async () => {
        setLoading(true);
        setError('');

        try {
            let url = '';
            let params = new URLSearchParams();

            params.append('libelle', 'HONORAIRES REÇU');

            // Ajouter l'ID du client si disponible (pour les pages de détails client)
            if (window.currentHonorairesClientId) {
                params.append('client_id', window.currentHonorairesClientId);
            }

            if (type === 'jour') {
                if (filterType === 'date') {
                    params.append('date', selectedDate);
                    url = '/api/honoraires/par-jour';
                } else if (filterType === 'periode') {
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                    url = '/api/honoraires/par-periode';
                }
            } else if (type === 'mois') {
                params.append('mois', selectedMonth);
                params.append('annee', selectedYear);
                url = '/api/honoraires/par-mois';
            } else if (type === 'annee') {
                params.append('annee', selectedYear);
                url = '/api/honoraires/par-annee';
            }

            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                const honorairesData = data.honoraires || [];
                setHonoraires(honorairesData);
                setFilteredHonoraires(honorairesData);
            } else {
                setError(data.error || 'Erreur lors du chargement des honoraires');
            }
        } catch (err) {
            setError('Erreur lors du chargement des honoraires');
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
            year: 'numeric'
        });
    };

    const totalHonoraires = filteredHonoraires.reduce((sum, h) => sum + parseFloat(h.avance || 0), 0);

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-money-bill-wave me-2"></i>
                            Honoraires reçu - {type === 'jour' ? 'Par jour' : type === 'mois' ? 'Par mois' : 'Par année'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Sélecteurs selon le type */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                {type === 'jour' && (
                                    <div>
                                        {/* Choix du type de filtrage */}
                                        <div className="mb-3">
                                            <label className="form-label">Type de filtrage :</label>
                                            <div className="d-flex gap-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="filterType"
                                                        id="filterDate"
                                                        value="date"
                                                        checked={filterType === 'date'}
                                                        onChange={(e) => setFilterType(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="filterDate">
                                                        Date
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="filterType"
                                                        id="filterPeriode"
                                                        value="periode"
                                                        checked={filterType === 'periode'}
                                                        onChange={(e) => setFilterType(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="filterPeriode">
                                                        Période
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Champ date simple */}
                                        {filterType === 'date' && (
                                            <div>
                                                <label className="form-label">Sélectionner la date :</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {/* Champs période */}
                                        {filterType === 'periode' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <label className="form-label">Date de début :</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={dateDebut}
                                                            onChange={(e) => setDateDebut(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label">Date de fin :</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={dateFin}
                                                            onChange={(e) => setDateFin(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {type === 'mois' && (
                                    <div>
                                        <label className="form-label">Sélectionner le mois :</label>
                                        <div className="d-flex gap-2">
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
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                min="2020"
                                                max="2030"
                                            />
                                        </div>
                                    </div>
                                )}

                                {type === 'annee' && (
                                    <div>
                                        <label className="form-label">Sélectionner l'année :</label>
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
                            </div>

                            <div className="col-md-4 d-flex align-items-end">
                                <button
                                    className="btn btn-primary"
                                    onClick={fetchHonoraires}
                                    disabled={loading}
                                >
                                    {loading ? 'Chargement...' : 'Rechercher'}
                                </button>
                            </div>
                        </div>

                        {/* Barre de recherche par client */}
                        {honoraires.length > 0 && (
                            <div className="mb-3">
                                <label htmlFor="clientSearch" className="form-label">
                                    <i className="fas fa-search me-1"></i>
                                    Rechercher par client
                                </label>
                                <input
                                    type="text"
                                    id="clientSearch"
                                    className="form-control"
                                    placeholder="Tapez la première lettre du nom ou prénom..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Tableau des honoraires */}
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {filteredHonoraires.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th>Libellé</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHonoraires.map((honoraire, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(honoraire.date)}</td>
                                                <td>{honoraire.client_nom} {honoraire.client_prenom}</td>
                                                <td>{honoraire.libelle}</td>
                                                <td className="text-success fw-bold">{formatMontant(honoraire.avance || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-dark">
                                        <tr>
                                            <th colSpan="3">TOTAL</th>
                                            <th className="text-success">{formatMontant(totalHonoraires)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : !loading && (
                            <div className="alert alert-info">
                                {searchQuery.trim() ?
                                    `Aucun honoraires trouvé pour "${searchQuery}".` :
                                    'Aucun honoraires reçu trouvé pour la période sélectionnée.'
                                }
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
