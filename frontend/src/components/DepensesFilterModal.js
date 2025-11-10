import React, { useState, useEffect } from 'react';

export default function DepensesFilterModal({ show, onClose, type }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10));
    const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));
    const [filterType, setFilterType] = useState('date'); // 'date' ou 'periode'
    const [depenses, setDepenses] = useState([]);
    const [filteredDepenses, setFilteredDepenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (show) {
            // Réinitialiser les valeurs par défaut
            setSelectedDate(new Date().toISOString().slice(0, 10));
            setSelectedMonth(new Date().getMonth() + 1);
            setSelectedYear(new Date().getFullYear());
            setDateDebut(new Date().toISOString().slice(0, 10));
            setDateFin(new Date().toISOString().slice(0, 10));
            setFilterType('date');
            setDepenses([]);
            setFilteredDepenses([]);
            setError('');
            setSearchQuery('');

            // Si c'est le mode bénéficiaire, charger automatiquement les dépenses
            if (type === 'beneficiaire') {
                fetchDepenses();
            }
        }
    }, [show, type]);

    // Filtrage en temps réel des dépenses par bénéficiaire
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredDepenses(depenses);
        } else {
            const filtered = depenses.filter(depense => {
                const beneficiaire = depense.beneficiaire || '';
                const query = searchQuery.toLowerCase();

                // Recherche par première lettre du bénéficiaire
                return beneficiaire.toLowerCase().startsWith(query);
            });
            setFilteredDepenses(filtered);
        }
    }, [searchQuery, depenses]);

    const fetchDepenses = async () => {
        setLoading(true);
        setError('');
        setDepenses([]); // Réinitialiser les dépenses avant la recherche

        try {
            let url = '';
            let params = new URLSearchParams();

            // Ajouter l'ID du client si disponible (pour les pages de détails client)
            if (window.currentDepensesClientId) {
                params.append('client_id', window.currentDepensesClientId);
            }

            // Ajouter le type de dépense si disponible
            if (window.currentDepensesType) {
                params.append('type', window.currentDepensesType);
            }

            if (type === 'beneficiaire') {
                // Pour le filtrage par bénéficiaire, récupérer toutes les dépenses
                url = '/api/depenses';
            } else if (type === 'jour') {
                if (filterType === 'date') {
                    params.append('date', selectedDate);
                    url = '/api/depenses/par-jour';
                } else if (filterType === 'periode') {
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                    url = '/api/depenses/par-periode';
                }
            } else if (type === 'mois') {
                params.append('mois', selectedMonth);
                params.append('annee', selectedYear);
                url = '/api/depenses/par-mois';
            } else if (type === 'annee') {
                params.append('annee', selectedYear);
                url = '/api/depenses/par-annee';
            }

            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                const depensesData = data.depenses || [];
                setDepenses(depensesData);
                setFilteredDepenses(depensesData);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
                setDepenses([]); // S'assurer que les dépenses sont vides en cas d'erreur
                setFilteredDepenses([]);
            }
        } catch (err) {
            setError('Erreur lors du chargement des dépenses');
            setDepenses([]); // S'assurer que les dépenses sont vides en cas d'erreur
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

    const totalDepenses = filteredDepenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-credit-card me-2"></i>
                            Dépenses - {type === 'beneficiaire' ? 'Par bénéficiaire' : type === 'jour' ? 'Par jour' : type === 'mois' ? 'Par mois' : 'Par année'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Sélecteurs selon le type */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                {type === 'beneficiaire' && (
                                    <div>
                                        <label className="form-label">Filtrage par bénéficiaire</label>
                                        <p className="text-muted small">Toutes les dépenses seront affichées. Utilisez la barre de recherche ci-dessous pour filtrer par bénéficiaire.</p>
                                    </div>
                                )}
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
                                                        onChange={(e) => {
                                                            setFilterType(e.target.value);
                                                            setDepenses([]); // Réinitialiser les dépenses quand on change le type
                                                            setError('');
                                                        }}
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
                                                        onChange={(e) => {
                                                            setFilterType(e.target.value);
                                                            setDepenses([]); // Réinitialiser les dépenses quand on change le type
                                                            setError('');
                                                        }}
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
                                {type !== 'beneficiaire' && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={fetchDepenses}
                                        disabled={loading}
                                    >
                                        {loading ? 'Chargement...' : 'Rechercher'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Barre de recherche par bénéficiaire */}
                        {depenses.length > 0 && (
                            <div className="mb-3">
                                <label htmlFor="beneficiaireSearch" className="form-label">
                                    <i className="fas fa-search me-1"></i>
                                    Rechercher par bénéficiaire
                                </label>
                                <input
                                    type="text"
                                    id="beneficiaireSearch"
                                    className="form-control"
                                    placeholder="Tapez la première lettre du bénéficiaire..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Tableau des dépenses */}
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}


                        {filteredDepenses.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Date</th>
                                            <th>Bénéficiaire</th>
                                            <th>Description</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDepenses.map((depense, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(depense.date)}</td>
                                                <td className="fw-bold">{depense.beneficiaire}</td>
                                                <td>{depense.description || '-'}</td>
                                                <td className="text-danger fw-bold">{formatMontant(depense.montant || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-dark">
                                        <tr>
                                            <th colSpan="3">TOTAL</th>
                                            <th className="text-danger">{formatMontant(totalDepenses)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : !loading && (
                            <div className="alert alert-info">
                                {searchQuery.trim() ?
                                    `Aucune dépense trouvée pour "${searchQuery}".` :
                                    'Aucune dépense trouvée pour la période sélectionnée.'
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
