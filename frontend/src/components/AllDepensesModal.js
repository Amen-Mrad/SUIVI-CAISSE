import React, { useState, useEffect } from 'react';

export default function AllDepensesModal({ show, onClose, actionMode = 'view', type = null, filterType = null, date = null, mois = null, annee = null, clientId = null, date_debut = null, date_fin = null }) {
    const [depenses, setDepenses] = useState([]);
    const [filteredDepenses, setFilteredDepenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingDepense, setEditingDepense] = useState(null);
    const [formData, setFormData] = useState({
        date: '',
        client: '',
        montant: '',
        libelle: ''
    });

    useEffect(() => {
        if (show) {
            setDepenses([]);
            setFilteredDepenses([]);
            setError('');
            setSearchQuery('');
            setShowEditForm(false);
            setEditingDepense(null);
            fetchAllDepenses();
        }
    }, [show, type, filterType, date, mois, annee, clientId, date_debut, date_fin]);

    // Filtrage en temps réel des dépenses par bénéficiaire
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredDepenses(depenses);
        } else {
            const filtered = depenses.filter(depense => {
                const beneficiaire = depense.client || depense.beneficiaire || '';
                const query = searchQuery.toLowerCase();

                // Recherche par première lettre du bénéficiaire
                return beneficiaire.toLowerCase().startsWith(query);
            });
            setFilteredDepenses(filtered);
        }
    }, [searchQuery, depenses]);

    const fetchAllDepenses = async () => {
        setLoading(true);
        setError('');

        try {
            let url = '/api/depenses';
            const params = new URLSearchParams();

            // Déterminer l'ID client (window ou prop)
            const effectiveClientId = window.currentDepensesClientId || clientId;

            // Déterminer le type de dépenses
            const depensesType = window.currentDepensesType || type;

            // Si c'est pour les dépenses bureau, utiliser l'endpoint spécifique
            if (depensesType === 'bureau') {
                // Utiliser l'endpoint par période pour tous les cas à base de date
                if (filterType === 'jour' && date) {
                    url = '/api/depenses/bureau/par-periode';
                    params.append('date_debut', date);
                    params.append('date_fin', date);
                } else if (filterType === 'periode' && date_debut && date_fin) {
                    url = '/api/depenses/bureau/par-periode';
                    params.append('date_debut', date_debut);
                    params.append('date_fin', date_fin);
                } else if (filterType === 'mois' && mois && annee) {
                    // Convertir mois/année → période complète du mois
                    const start = `${annee}-${String(mois).padStart(2, '0')}-01`;
                    const endDate = new Date(parseInt(annee), parseInt(mois), 0);
                    const end = `${annee}-${String(mois).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    url = '/api/depenses/bureau/par-periode';
                    params.append('date_debut', start);
                    params.append('date_fin', end);
                } else if (filterType === 'annee' && annee) {
                    // Convertir année → période complète de l'année
                    const start = `${annee}-01-01`;
                    const end = `${annee}-12-31`;
                    url = '/api/depenses/bureau/par-periode';
                    params.append('date_debut', start);
                    params.append('date_fin', end);
                } else {
                    // Sinon, récupérer toutes les dépenses bureau
                    url = '/api/depenses/bureau';
                }

                // Construire l'URL avec les paramètres pour les dépenses bureau
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }
            } else if (effectiveClientId) {
                // Construire l'URL /depenses/par-client avec filtres de date si fournis
                const clientParams = new URLSearchParams();
                clientParams.append('client_id', effectiveClientId);

                if (filterType === 'jour' && date) {
                    clientParams.append('date', date);
                } else if (filterType === 'mois' && mois && annee) {
                    clientParams.append('mois', mois);
                    clientParams.append('annee', annee);
                } else if (filterType === 'annee' && annee) {
                    clientParams.append('annee', annee);
                }

                url = `/api/depenses/par-client?${clientParams.toString()}`;
            } else {
                // Si on veut voir toutes les dépenses (client + bureau), ajouter all=true
                if (!depensesType || depensesType === 'all') {
                    params.append('all', 'true');
                }

                // Ajouter le type si spécifié
                if (depensesType && depensesType !== 'all') {
                    params.append('type', depensesType);
                }

                // Ajouter les filtres de date selon le filterType
                if (filterType === 'jour' && date) {
                    params.append('date', date);
                } else if (filterType === 'mois' && mois && annee) {
                    params.append('mois', mois);
                    params.append('annee', annee);
                } else if (filterType === 'annee' && annee) {
                    params.append('annee', annee);
                } else if (filterType === 'periode' && date_debut && date_fin) {
                    params.append('date_debut', date_debut);
                    params.append('date_fin', date_fin);
                }

                // Construire l'URL avec les paramètres pour les dépenses client
                if (params.toString()) {
                    url += `?${params.toString()}`;
                }
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                let depensesData = data.depenses || [];
                console.log('Données récupérées:', depensesData);
                console.log('Type de dépenses:', window.currentDepensesType || type);

                // Note: Pour les dépenses bureau, l'endpoint /api/depenses/bureau retourne déjà les bonnes données
                // Pas besoin de filtrer côté client

                // Filtrage client-side de sécurité (au cas où l'API ne filtre pas)
                const sameDay = (d1, d2) => {
                    // d1: date string from row; d2: 'YYYY-MM-DD'
                    try {
                        const nd = new Date(d1);
                        const y = nd.getFullYear();
                        const m = (nd.getMonth() + 1).toString().padStart(2, '0');
                        const day = nd.getDate().toString().padStart(2, '0');
                        const rowDate = `${y}-${m}-${day}`;
                        return rowDate === d2;
                    } catch (_) { return false; }
                };

                const monthOf = (d1) => {
                    const nd = new Date(d1);
                    return { y: nd.getFullYear(), m: nd.getMonth() + 1 };
                };

                if (filterType === 'jour' && date) {
                    depensesData = depensesData.filter(d => sameDay(d.date, date));
                } else if (filterType === 'mois' && mois && annee) {
                    depensesData = depensesData.filter(d => {
                        const { y, m } = monthOf(d.date);
                        return y === parseInt(annee) && m === parseInt(mois);
                    });
                } else if (filterType === 'annee' && annee) {
                    depensesData = depensesData.filter(d => {
                        const nd = new Date(d.date);
                        return nd.getFullYear() === parseInt(annee);
                    });
                } else if (filterType === 'periode' && date_debut && date_fin) {
                    const start = new Date(date_debut);
                    const end = new Date(date_fin);
                    // normaliser heures
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    depensesData = depensesData.filter(d => {
                        const nd = new Date(d.date);
                        return nd >= start && nd <= end;
                    });
                }

                setDepenses(depensesData);
                setFilteredDepenses(depensesData);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
            }
        } catch (err) {
            setError('Erreur lors du chargement des dépenses');
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
        // Utiliser les méthodes locales pour être cohérent avec la fonction sameDay
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const totalDepenses = filteredDepenses.reduce((sum, d) => sum + parseFloat(d.montant || 0), 0);

    const handleReturnToCharge = async (depense) => {
        try {
            const effectiveClientId = window.currentDepensesClientId || clientId;
            if (!effectiveClientId) {
                alert("Client introuvable pour déplacer la dépense vers les charges.");
                return;
            }

            if (!window.confirm(`Déplacer la dépense de ${depense.beneficiaire || ''} (${formatMontant(depense.montant)}) vers les charges du client ?`)) {
                return;
            }

            setLoading(true);
            setError('');
            // Supprimer uniquement la dépense initiale (la charge d'origine existe déjà)
            const deleteRes = await fetch(`/api/depenses/${depense.id}`, { method: 'DELETE' });
            const deleteData = await deleteRes.json();
            if (!deleteRes.ok || !deleteData.success) {
                throw new Error(deleteData.error || 'Erreur lors de la suppression de la dépense');
            }

            // Rafraîchir la liste
            await fetchAllDepenses();
            alert('Dépense renvoyée au tableau des charges.');
        } catch (err) {
            setError(err.message || 'Erreur lors du déplacement de la dépense');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnToChargeFromBureau = async (depense) => {
        try {
            if (!window.confirm(`Retirer la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) des dépenses bureau ?`)) {
                return;
            }

            setLoading(true);
            setError('');

            // Debug: afficher les informations de la dépense
            console.log('Tentative de suppression de la dépense bureau:', {
                id: depense.id,
                libelle: depense.libelle,
                beneficiaire: depense.beneficiaire,
                client: depense.client,
                montant: depense.montant
            });

            // Supprimer la dépense bureau (essayer d'abord l'endpoint bureau, puis l'endpoint général)
            let deleteRes = await fetch(`/api/depenses/bureau/${depense.id}`, { method: 'DELETE' });

            // Si l'endpoint bureau ne fonctionne pas, essayer l'endpoint général
            if (!deleteRes.ok) {
                console.log('Endpoint bureau échoué, tentative avec endpoint général...');
                deleteRes = await fetch(`/api/depenses/${depense.id}`, { method: 'DELETE' });
            }
            const deleteData = await deleteRes.json();

            console.log('Réponse de suppression:', deleteData);

            if (!deleteRes.ok || !deleteData.success) {
                throw new Error(deleteData.error || 'Erreur lors de la suppression de la dépense bureau');
            }

            // Rafraîchir la liste
            await fetchAllDepenses();
            // Notifier la mise à jour de la caisse live
            try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) {}
            alert('Dépense retirée des dépenses bureau. Le bouton CGM redevient disponible.');
        } catch (err) {
            console.error('Erreur lors du retrait de la dépense bureau:', err);
            setError(err.message || 'Erreur lors du retrait de la dépense bureau');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCharge = async (depense) => {
        try {
            if (!window.confirm(`Ajouter la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) aux charges ?`)) {
                return;
            }

            setLoading(true);
            setError('');

            // Créer une nouvelle charge mensuelle basée sur la dépense bureau
            const chargeData = {
                client_id: null, // Sera déterminé par l'utilisateur
                date: depense.date || new Date().toISOString().slice(0, 16),
                libelle: depense.libelle || depense.description || 'Dépense bureau',
                montant: parseFloat(depense.montant),
                avance: 0
            };

            const response = await fetch('/api/charges-mensuelles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chargeData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Dépense ajoutée aux charges avec succès !');
                // Optionnel: rafraîchir la liste des dépenses
                await fetchAllDepenses();
            } else {
                throw new Error(result.error || 'Erreur lors de l\'ajout de la charge');
            }
        } catch (err) {
            setError(err.message || 'Erreur lors de l\'ajout de la charge');
        } finally {
            setLoading(false);
        }
    };

    const handleModifyDepense = (depense) => {
        setEditingDepense(depense);
        setFormData({
            date: depense.date.split('T')[0], // Format date for input
            client: depense.client || depense.beneficiaire || '',
            montant: depense.montant,
            libelle: depense.libelle || depense.description || ''
        });
        setShowEditForm(true);
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Mapper libelle vers description pour le backend
            const isBureau = (window.currentDepensesType || type) === 'bureau';
            const dataToSend = {
                date: formData.date,
                beneficiaire: formData.client,
                montant: formData.montant,
                description: formData.libelle
            };

            const endpoint = isBureau ? `/api/depenses/bureau/${editingDepense.id}` : `/api/depenses/${editingDepense.id}`;
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                setShowEditForm(false);
                setEditingDepense(null);
                fetchAllDepenses(); // Recharger la liste
                alert('Dépense modifiée avec succès');
            } else {
                setError(data.error || 'Erreur lors de la modification');
            }
        } catch (err) {
            setError('Erreur lors de la modification');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDepense = async (depenseId, beneficiaire) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la dépense de ${beneficiaire} ?`)) {
            try {
                const isBureau = (window.currentDepensesType || type) === 'bureau';
                const endpoint = isBureau ? `/api/depenses/bureau/${depenseId}` : `/api/depenses/${depenseId}`;
                const response = await fetch(endpoint, { method: 'DELETE' });
                const data = await response.json();

                if (data.success) {
                    // Recharger la liste des dépenses
                    fetchAllDepenses();
                    // Notifier la mise à jour de la caisse live si c'est une dépense bureau
                    if (isBureau) {
                        try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) {}
                    }
                } else {
                    setError(data.error || 'Erreur lors de la suppression');
                }
            } catch (err) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    // Fonction pour créer un retrait direct dans la caisse CGM
    const handleRetraitCaisseCgm = async (depense) => {
        try {
            const response = await fetch('/api/caisse-cgm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type_operation: 'retrait',
                    montant: parseFloat(depense.montant || 0),
                    commentaire: `${depense.beneficiaire || depense.client || 'CGM'} - ${depense.libelle || depense.description || 'Dépense bureau'}`,
                    client_id: null,
                    user_id: null
                })
            });

            const result = await response.json();
            if (result.success) {
                // Mettre à jour la caisse live
                try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
                // Afficher un message de succès
                setError(''); // Réinitialiser l'erreur
                // Note: On pourrait ajouter un état successMessage si nécessaire
                alert('Retrait créé dans la caisse CGM avec succès');
            } else {
                setError(result.error || 'Erreur lors de la création du retrait');
            }
        } catch (e) {
            setError('Erreur réseau lors de la création du retrait');
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-credit-card me-2"></i>
                            Toutes les dépenses
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {showEditForm ? (
                            // Formulaire de modification
                            <form onSubmit={handleSubmitEdit}>
                                <h5 className="mb-3">
                                    <i className="fas fa-edit me-2"></i>
                                    Modifier la dépense
                                </h5>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Date *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Client *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="client"
                                            value={formData.client}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Montant *</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            className="form-control"
                                            name="montant"
                                            value={formData.montant}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Description *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="libelle"
                                            value={formData.libelle}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>


                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditForm(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Modification...' : 'Modifier la dépense'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {/* Barre de recherche */}
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
                                                    // Fonction helper pour traiter les dépenses CGM
                                                    const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                                    const isCgmDepense = rawText.includes('[CGM]') || rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES REC') || rawText.includes('AVANCE DE DECLARATION');
                                                    const clientName = isCgmDepense ? 'CGM' : (depense.beneficiaire || depense.client);
                                                    const originalClientName = depense.beneficiaire || depense.client;

                                                    // Pour toutes les dépenses bureau, afficher le nom du bénéficiaire entre parenthèses
                                                    let libelleText;
                                                    let baseLibelle = depense.libelle || depense.description || '-';

                                                    // Remplacer [CGM] par [PAYÉ PAR CGM] dans l'affichage
                                                    baseLibelle = baseLibelle.replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');

                                                    // Pour toutes les dépenses, ajouter le nom du bénéficiaire entre parenthèses
                                                    if (originalClientName) {
                                                        libelleText = `${baseLibelle} (${originalClientName})`;
                                                    } else {
                                                        libelleText = baseLibelle;
                                                    }

                                                    // Déterminer la couleur du montant selon le type de dépense
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
                                                                {/* Actions d'édition/suppression selon actionMode */}
                                                                {actionMode === 'modify' && (
                                                                    <button
                                                                        className="btn btn-primary btn-sm me-2"
                                                                        onClick={() => handleModifyDepense(depense)}
                                                                        title="Modifier"
                                                                        style={{ minWidth: '120px' }}
                                                                    >
                                                                        <i className="fas fa-edit me-1"></i> Modifier
                                                                    </button>
                                                                )}
                                                                {actionMode === 'delete' && (
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteDepense(depense.id, depense.beneficiaire); }}
                                                                        title="Supprimer"
                                                                        style={{ minWidth: '120px' }}
                                                                    >
                                                                        <i className="fas fa-trash me-1"></i> Supprimer
                                                                    </button>
                                                                )}

                                                                {/* Action spécifique: Retour au charge pour dépenses bureau */}
                                                                {(window.currentDepensesType === 'bureau' || type === 'bureau') ? (
                                                                    // Boutons pour les dépenses bureau
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleRetraitCaisseCgm(depense); }}
                                                                            title="Créer un retrait dans la caisse CGM"
                                                                            style={{ minWidth: '30px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-warning btn-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleReturnToChargeFromBureau(depense); }}
                                                                            title="Retour au charge"
                                                                            style={{ minWidth: '120px' }}
                                                                        >
                                                                            <i className="fas fa-undo me-1"></i> Retour au charge
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteDepense(depense.id, depense.beneficiaire); }}
                                                                            title="Supprimer"
                                                                            style={{ minWidth: '100px' }}
                                                                        >
                                                                            <i className="fas fa-trash me-1"></i> Supprimer
                                                                        </button>
                                                                    </div>
                                                                ) : (window.currentDepensesType === 'client' || type === 'client' || window.currentDepensesClientId || clientId) ? (
                                                                    // Boutons pour les dépenses client
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleReturnToCharge(depense); }}
                                                                            title="Retour au charge"
                                                                            style={{ minWidth: '120px' }}
                                                                        >
                                                                            <i className="fas fa-undo me-1"></i> Retour au charge
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteDepense(depense.id, depense.beneficiaire); }}
                                                                            title="Supprimer définitivement"
                                                                            style={{ minWidth: '100px' }}
                                                                        >
                                                                            <i className="fas fa-trash me-1"></i> Supprimer
                                                                        </button>
                                                                    </div>
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot style={{
                                                background: 'linear-gradient(135deg, #6f42c1 0%, #007bff 100%)',
                                                color: 'white'
                                            }}>
                                                <tr>
                                                    <th colSpan="4">TOTAL</th>
                                                    <th className="text-white fw-bold">{formatMontant(totalDepenses)}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        {searchQuery.trim() ?
                                            `Aucune dépense trouvée pour "${searchQuery}".` :
                                            'Aucune dépense trouvée.'
                                        }
                                    </div>
                                )}
                            </>
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
