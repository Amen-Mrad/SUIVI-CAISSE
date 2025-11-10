import React, { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import cachet from '../assets/cachet.png';

export default function EtatCgmModal({ show, onClose, filteredData = null, type = null, filterType = null, date = null, mois = null, annee = null, beneficiaire = null, dateDebut = null, dateFin = null }) {
    const [honoraires, setHonoraires] = useState([]);
    const [depenses, setDepenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterInfo, setFilterInfo] = useState(null);
    const [beneficiaireData, setBeneficiaireData] = useState(null);
    const [clientName, setClientName] = useState('');
    const [soldeReporte, setSoldeReporte] = useState(null);

    useEffect(() => {
        if (show) {
            setHonoraires([]);
            setDepenses([]);
            setError('');
            setFilterInfo(null);
            setBeneficiaireData(null);
            setClientName('');
            setSoldeReporte(null);

            // Récupérer le nom du client si on est dans un contexte client
            const currentClientId = window.currentEtatClientId || window.currentHonorairesClientId;
            if (currentClientId) {
                fetchClientName(currentClientId);
                fetchSoldeReporte(currentClientId);
            }

            if (filteredData) {
                // Utiliser les données filtrées normales
                setHonoraires(filteredData.honoraires || []);
                setDepenses(filteredData.depenses || []);
                setFilterInfo({
                    type: filteredData.filterType,
                    value: filteredData.filterValue,
                    clientName: filteredData.clientName || null
                });
            } else if (filterType === 'beneficiaire' && beneficiaire) {
                // État par bénéficiaire spécifique
                setLoading(true);
                fetchBeneficiaireData(beneficiaire)
                    .finally(() => setLoading(false));
            } else {
                // Charger toutes les données selon le type
                setLoading(true);
                const etatType = window.currentEtatType || type;
                if (etatType === 'bureau') {
                    // Pour l'état CGM (bureau), charger seulement les honoraires et les dépenses bureau
                    Promise.all([fetchAllHonoraires(), fetchAllDepenses()])
                        .finally(() => setLoading(false));
                } else {
                    // Pour l'état client, charger les honoraires et les dépenses client
                    Promise.all([fetchAllHonoraires(), fetchAllDepenses()])
                        .finally(() => setLoading(false));
                }
            }
        }
    }, [show, filteredData, type, filterType, date, mois, annee, beneficiaire, dateDebut, dateFin]);

    const fetchClientName = async (clientId) => {
        try {
            const response = await fetch(`/api/clients/${clientId}`);
            const data = await response.json();

            if (data.success && data.client) {
                const fullName = `${data.client.nom || ''} ${data.client.prenom || ''}`.trim();
                setClientName(fullName);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du nom du client:', error);
        }
    };

    const fetchSoldeReporte = async (clientId) => {
        try {
            const currentYear = new Date().getFullYear();
            const response = await fetch(`/api/charges-mensuelles/solde-reporte/${clientId}?annee=${currentYear}`);
            const data = await response.json();
            if (data.success) {
                setSoldeReporte(data);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du solde reporté:', error);
        }
    };

    const fetchAllHonoraires = async () => {
        try {
            let url = '/api/honoraires';
            const params = new URLSearchParams();

            // Ajouter le type si spécifié
            const etatType = window.currentEtatType || type;
            if (etatType && etatType !== 'bureau') {
                params.append('type', etatType);
            }

            // Ajouter le client_id si on est dans un contexte client spécifique
            const currentClientId = window.currentEtatClientId;
            if (currentClientId) {
                params.append('client_id', currentClientId);
            }

            // Ajouter les filtres de date selon le filterType
            if (filterType === 'jour' && date) {
                params.append('date', date);
            } else if (filterType === 'periode' && dateDebut && dateFin) {
                params.append('date_debut', dateDebut);
                params.append('date_fin', dateFin);
            } else if (filterType === 'mois' && mois && annee) {
                params.append('mois', mois);
                params.append('annee', annee);
            } else if (filterType === 'annee' && annee) {
                params.append('annee', annee);
            }

            // Construire l'URL avec les paramètres
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            let honorairesData = [];
            if (data.success) {
                honorairesData = data.honoraires || [];

                // Filtrer par bénéficiaire si spécifié
                if (filterType === 'beneficiaire' && beneficiaire) {
                    honorairesData = honorairesData.filter(honoraire => {
                        const clientName = `${honoraire.client_nom} ${honoraire.client_prenom}`.trim();
                        return clientName.toLowerCase().includes(beneficiaire.toLowerCase());
                    });
                }

                // Filtrer pour ne garder que les vrais honoraires reçus (PAS les avances de déclaration)
                honorairesData = honorairesData.filter(honoraire => {
                    const libelle = (honoraire.libelle || '').toUpperCase();
                    const isHonoraireRecu = libelle.includes('HONORAIRES REÇU') || libelle.includes('HONORAIRES RECU');
                    const hasAmount = parseFloat(honoraire.avance || honoraire.montant || 0) > 0;

                    return isHonoraireRecu && hasAmount;
                });

                // Si le nom du client n'est pas encore défini dans filterInfo, essayons de le déduire
                try {
                    const firstWithClient = honorairesData && honorairesData.find && honorairesData.find(h => (h.client_nom || h.client_prenom));
                    if (firstWithClient) {
                        const inferredClientName = `${firstWithClient.client_nom || ''} ${firstWithClient.client_prenom || ''}`.trim();
                        if (inferredClientName) {
                            setFilterInfo(prev => ({ ...(prev || {}), clientName: prev?.clientName || inferredClientName }));
                        }
                    }
                } catch (_) { /* no-op */ }
            }

            // Si on est dans un contexte client spécifique, récupérer aussi les charges (honoraires reçus)
            if (currentClientId) {
                try {
                    // Déterminer l'année pertinente selon le filtre sélectionné
                    let yearForCharges = new Date().getFullYear();
                    if (filterType === 'annee' && annee) {
                        yearForCharges = parseInt(annee);
                    } else if (filterType === 'mois' && annee) {
                        yearForCharges = parseInt(annee);
                    } else if (filterType === 'jour' && date) {
                        yearForCharges = new Date(date).getFullYear();
                    } else if (filterType === 'periode' && dateDebut) {
                        yearForCharges = new Date(dateDebut).getFullYear();
                    }

                    const chargesResponse = await fetch(`/api/charges-mensuelles/client/${currentClientId}?annee=${yearForCharges}`);
                    const chargesData = await chargesResponse.json();

                    if (chargesData.success && chargesData.charges) {
                        // Helpers de filtrage par date (alignés avec fetchAllDepenses)
                        const sameDay = (d1, d2) => {
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

                        // Appliquer le filtre de date sur les charges
                        let filteredCharges = [...chargesData.charges];
                        if (filterType === 'jour' && date) {
                            filteredCharges = filteredCharges.filter(c => sameDay(c.date, date));
                        } else if (filterType === 'mois' && mois && annee) {
                            filteredCharges = filteredCharges.filter(c => {
                                const { y, m } = monthOf(c.date);
                                return y === parseInt(annee) && m === parseInt(mois);
                            });
                        } else if (filterType === 'annee' && annee) {
                            filteredCharges = filteredCharges.filter(c => {
                                const nd = new Date(c.date);
                                return nd.getFullYear() === parseInt(annee);
                            });
                        } else if (filterType === 'periode' && dateDebut && dateFin) {
                            const start = new Date(dateDebut); start.setHours(0, 0, 0, 0);
                            const end = new Date(dateFin); end.setHours(23, 59, 59, 999);
                            filteredCharges = filteredCharges.filter(c => {
                                const nd = new Date(c.date);
                                return nd >= start && nd <= end;
                            });
                        }

                        // Convertir les charges en honoraires pour l'affichage
                        const chargesAsHonoraires = filteredCharges
                            .filter(charge => {
                                // Seulement les charges qui sont vraiment des honoraires reçus (PAS les avances de déclaration)
                                const isHonoraireRecu = charge.libelle &&
                                    charge.libelle.toLowerCase().includes('honoraires reçu') &&
                                    charge.avance > 0;
                                return isHonoraireRecu;
                            })
                            .map(charge => ({
                                id: `charge_${charge.id}`,
                                date: charge.date,
                                libelle: charge.libelle,
                                montant: charge.avance, // Utiliser l'avance comme montant reçu
                                avance: charge.avance,
                                client_nom: clientName.split(' ')[0] || '',
                                client_prenom: clientName.split(' ').slice(1).join(' ') || ''
                            }));

                        // /api/honoraires retourne déjà les données depuis charges_mensuelles
                        // Donc on évite de combiner pour ne pas créer de doublons
                        // Les charges sont déjà incluses dans honorairesData depuis l'API
                        // Seulement filtrer pour ne garder que les honoraires avec un montant > 0
                        honorairesData = honorairesData.filter(honoraire => {
                            const amount = parseFloat(honoraire.avance || honoraire.montant || 0);
                            return amount > 0;
                        });
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération des charges:', error);
                }
            }

            setHonoraires(honorairesData);

            if (!data.success) {
                setError(data.error || 'Erreur lors du chargement des honoraires');
            }
        } catch (err) {
            setError('Erreur lors du chargement des honoraires');
        }
    };

    const fetchAllDepenses = async () => {
        try {
            let url = '/api/depenses';
            const params = new URLSearchParams();

            // Ajouter le type si spécifié
            const etatType = window.currentEtatType || type;
            const isBureau = etatType === 'bureau';
            if (!isBureau && etatType) {
                params.append('type', etatType);
            }

            // Ajouter le client_id si on est dans un contexte client spécifique
            const currentClientId = window.currentEtatClientId;
            if (currentClientId) {
                params.append('client_id', currentClientId);
            }

            // Construire l'URL avec les paramètres selon le type (bureau ou client)
            if (isBureau) {
                // Pour le bureau, utiliser l'endpoint par période quand on a des filtres de date
                if (filterType === 'jour' && date) {
                    url = '/api/depenses/bureau/par-periode';
                    // Créer un nouveau params pour éviter les doublons
                    const dateParams = new URLSearchParams();
                    dateParams.append('date_debut', date);
                    dateParams.append('date_fin', date);
                    url += `?${dateParams.toString()}`;
                } else if (filterType === 'periode' && dateDebut && dateFin) {
                    url = '/api/depenses/bureau/par-periode';
                    // Créer un nouveau params pour éviter les doublons
                    const dateParams = new URLSearchParams();
                    dateParams.append('date_debut', dateDebut);
                    dateParams.append('date_fin', dateFin);
                    url += `?${dateParams.toString()}`;
                } else if (filterType === 'mois' && mois && annee) {
                    // Passer tout le mois au backend pour éviter les soucis de fuseau (Date parsing du navigateur)
                    const start = `${annee}-${String(mois).padStart(2, '0')}-01`;
                    const endDate = new Date(annee, mois, 0); // dernier jour du mois
                    const end = `${annee}-${String(mois).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    url = '/api/depenses/bureau/par-periode';
                    const dateParams = new URLSearchParams();
                    dateParams.append('date_debut', start);
                    dateParams.append('date_fin', end);
                    url += `?${dateParams.toString()}`;
                } else if (filterType === 'annee' && annee) {
                    const start = `${annee}-01-01`;
                    const end = `${annee}-12-31`;
                    url = '/api/depenses/bureau/par-periode';
                    const dateParams = new URLSearchParams();
                    dateParams.append('date_debut', start);
                    dateParams.append('date_fin', end);
                    url += `?${dateParams.toString()}`;
                } else {
                    // Sinon, récupérer toutes les dépenses bureau
                    url = '/api/depenses/bureau';
                }
            } else {
                // Pour les dépenses client, utiliser l'endpoint par période quand on a des filtres de date
                if (filterType === 'jour' && date) {
                    url = '/api/depenses/par-periode';
                    params.append('date_debut', date);
                    params.append('date_fin', date);
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                } else if (filterType === 'periode' && dateDebut && dateFin) {
                    url = '/api/depenses/par-periode';
                    params.append('date_debut', dateDebut);
                    params.append('date_fin', dateFin);
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                } else if (filterType === 'mois' && mois && annee) {
                    // Passer tout le mois au backend pour éviter les soucis de fuseau (Date parsing du navigateur)
                    const start = `${annee}-${String(mois).padStart(2, '0')}-01`;
                    const endDate = new Date(annee, mois, 0); // dernier jour du mois
                    const end = `${annee}-${String(mois).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    url = '/api/depenses/par-periode';
                    params.append('date_debut', start);
                    params.append('date_fin', end);
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                } else if (filterType === 'annee' && annee) {
                    const start = `${annee}-01-01`;
                    const end = `${annee}-12-31`;
                    url = '/api/depenses/par-periode';
                    params.append('date_debut', start);
                    params.append('date_fin', end);
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                } else {
                    // Ajouter les params le cas échéant
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                }
            }

            // Construire l'URL finale
            const finalUrl = url;
            console.log('🔍 Fetching dépenses bureau avec URL:', finalUrl);
            const response = await fetch(finalUrl);
            const data = await response.json();
            console.log('📡 Réponse dépenses bureau:', data);

            if (data.success) {
                let depensesData = data.depenses || [];

                // Si on est en contexte bureau, appliquer les filtres côté client
                if (isBureau) {
                    const sameDay = (d1, d2) => {
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
                    } else if (filterType === 'periode' && dateDebut && dateFin) {
                        const start = new Date(dateDebut); start.setHours(0, 0, 0, 0);
                        const end = new Date(dateFin); end.setHours(23, 59, 59, 999);
                        depensesData = depensesData.filter(d => {
                            const nd = new Date(d.date);
                            return nd >= start && nd <= end;
                        });
                    }
                }

                // Filtrer par bénéficiaire si spécifié (pour bureau et client)
                if (filterType === 'beneficiaire' && beneficiaire) {
                    depensesData = depensesData.filter(depense => {
                        return depense.beneficiaire &&
                            depense.beneficiaire.toLowerCase().includes(beneficiaire.toLowerCase());
                    });
                }

                // LOGIQUE CGM: Afficher les dépenses de la table beneficiaires_bureau (dépenses CGM)
                // Exclure les honoraires reçus et les avances de déclaration (déjà dans la section honoraires)
                depensesData = depensesData.filter(depense => {
                    const description = (depense.description || depense.libelle || '').toUpperCase();

                    // Exclure les honoraires reçus (détails dans la section honoraires)
                    const isHonoraireRecu = description.includes('HONORAIRES REÇU') ||
                        description.includes('HONORAIRES RECU') ||
                        description.includes('HONORAIRES REÇU 60');

                    // Exclure les avances de déclaration (déjà dans la section honoraires)
                    const isAvanceDeclaration = description.includes('AVANCE DE DECLARATION');

                    // Afficher toutes les autres dépenses CGM (sans honoraires et sans avances de déclaration)
                    return !isHonoraireRecu && !isAvanceDeclaration;
                });

                setDepenses(depensesData);
            } else {
                const errorMessage = data.error || data.message || 'Erreur lors du chargement des dépenses';
                console.error('❌ Erreur lors de la récupération des dépenses bureau:', errorMessage, data);
                setError(`Erreur lors de la récupération des dépenses bureau: ${errorMessage}`);
            }
        } catch (err) {
            console.error('💥 Erreur catch lors de la récupération des dépenses:', err);
            setError(`Erreur lors de la récupération des dépenses bureau: ${err.message || 'Erreur réseau'}`);
        }
    };

    const fetchBeneficiaireData = async (beneficiaire) => {
        try {
            const response = await fetch(`/api/statistics/etat-beneficiaire?beneficiaire=${encodeURIComponent(beneficiaire)}`);
            const data = await response.json();

            if (data.success) {
                setBeneficiaireData(data.data);
                setFilterInfo({
                    type: 'beneficiaire',
                    value: beneficiaire,
                    beneficiaireName: beneficiaire
                });
            } else {
                setError(data.error || 'Erreur lors du chargement des données du bénéficiaire');
            }
        } catch (err) {
            setError('Erreur lors du chargement des données du bénéficiaire');
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
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '-';

        // Si c'est un filtre de période, afficher la période complète
        if (filterInfo && filterInfo.type === 'jour' && filterInfo.subFilterType === 'periode') {
            return filterInfo.value; // Afficher "2025-10-01 - 2025-10-04"
        } else if (filterInfo && filterInfo.type === 'periode') {
            return filterInfo.value; // Afficher "2025-10-01 - 2025-10-04"
        } else {
            // Pour les autres cas, afficher la date normale
            return formatDate(dateStr);
        }
    };

    // Déduire un nom de bénéficiaire pertinent pour l'en-tête des reçus
    const getBeneficiaireName = () => {
        if (filterInfo && filterInfo.beneficiaireName) return filterInfo.beneficiaireName;
        try {
            const uniques = Array.from(new Set((depenses || []).map(d => d && d.beneficiaire).filter(Boolean)));
            if (uniques.length === 1) return uniques[0];
        } catch (_) { /* ignore */ }
        return '';
    };

    const getTotalMontant = () => {
        // Si c'est un état par bénéficiaire, utiliser les données du bénéficiaire
        if (beneficiaireData) {
            return beneficiaireData.honoraires.total || 0;
        }

        const etatType = window.currentEtatType;

        if (etatType === 'bureau') {
            // Pour l'État Bureau : somme de tous les honoraires reçus (montant total)
            return honoraires.reduce((total, honoraire) => {
                return total + parseFloat(honoraire.montant || 0);
            }, 0);
        } else {
            // Pour l'État Client : somme des avances (comportement actuel)
            return honoraires.reduce((total, honoraire) => {
                return total + parseFloat(honoraire.avance || 0);
            }, 0);
        }
    };

    const getTotalDepenses = () => {
        // Si c'est un état par bénéficiaire, utiliser les données du bénéficiaire
        if (beneficiaireData) {
            return beneficiaireData.depenses.total || 0;
        }

        // Filtrer les dépenses selon le type d'état
        const etatType = window.currentEtatType || type;
        const filteredDepenses = depenses.filter(depense => {
            if (etatType === 'bureau') {
                // Pour l'état CGM (bureau), ne compter que les dépenses avec préfixe [CGM]
                const description = depense.description || depense.libelle || '';
                return description.includes('[CGM]');
            } else if (etatType === 'client') {
                // Pour l'état client, ne compter que les dépenses sans préfixe [CGM]
                const description = depense.description || depense.libelle || '';
                return !description.includes('[CGM]');
            }
            // Par défaut, compter toutes les dépenses
            return true;
        });

        return filteredDepenses.reduce((total, depense) => {
            return total + parseFloat(depense.montant || 0);
        }, 0);
    };

    const getResteCgm = () => {
        // Si c'est un état par bénéficiaire, utiliser le solde calculé
        if (beneficiaireData) {
            return beneficiaireData.solde || 0;
        }

        return getTotalMontant() - getTotalDepenses();
    };

    const getResteCgmFinal = () => {
        const resteCgm = getResteCgm();
        const soldeReporteValue = soldeReporte ? soldeReporte.soldeReporte : 0;
        return resteCgm + soldeReporteValue;
    };

    const getHonorairesLabel = () => {
        if (beneficiaireData) {
            return 'Total Honoraires Reçus (Tous)';
        }

        const etatType = window.currentEtatType;
        if (etatType === 'bureau') {
            return 'Total Honoraires Reçus (Tous)';
        } else {
            return 'Total Honoraires Reçus';
        }
    };

    const getDepensesLabel = () => {
        if (beneficiaireData) {
            return `Dépenses - ${beneficiaireData.beneficiaire}`;
        }

        const etatType = window.currentEtatType;
        if (etatType === 'bureau') {
            return 'Total Dépenses Bureau';
        } else {
            return 'Total Dépenses';
        }
    };

    const getResteLabel = () => {
        if (beneficiaireData) {
            return `Solde (Honoraires - Dépenses ${beneficiaireData.beneficiaire})`;
        }

        const etatType = window.currentEtatType;
        if (etatType === 'bureau') {
            return 'État Bureau';
        } else {
            return 'Reste CGM';
        }
    };

    const getCurrentDate = () => {
        // Si c'est un filtre de période, afficher la période
        if (filterInfo && (
            (filterInfo.type === 'jour' && filterInfo.subFilterType === 'periode') ||
            filterInfo.type === 'periode'
        )) {
            return filterInfo.value; // Afficher "2025-10-01 - 2025-10-04"
        } else if (filterInfo && filterInfo.type === 'mois') {
            return filterInfo.value; // Afficher "10/2025"
        } else if (filterInfo && filterInfo.type === 'annee') {
            return filterInfo.value; // Afficher "2025"
        } else {
            // Par défaut, afficher la date actuelle
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        }
    };

    const recordPrintHistory = async () => {
        try {
            // Récupérer le nom d'utilisateur du caissier
            let caissierUsername = 'Caissier Inconnu';
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.username) {
                    caissierUsername = user.username;
                }
            } catch (e) {
                console.warn('Erreur lors de la récupération du nom d\'utilisateur:', e);
            }

            // Déterminer le type de reçu et les données à enregistrer
            let printData = {
                type_reçu: 'honoraires',
                montant: getTotalMontant(),
                caissier_username: caissierUsername
            };

            // Si c'est un état par client
            if (filterInfo && filterInfo.clientName) {
                const clientNameParts = filterInfo.clientName.split(' ');
                printData.client_nom = clientNameParts[clientNameParts.length - 1] || '';
                printData.client_prenom = clientNameParts.slice(0, -1).join(' ') || '';
                printData.type_reçu = 'etat_client';

                // Récupérer l'ID du client depuis l'URL ou les données
                const clientId = window.currentEtatClientId || window.currentHonorairesClientId;
                if (clientId) {
                    printData.client_id = clientId;
                }
            }
            // Si c'est un état par bénéficiaire
            else if (filterInfo && filterInfo.beneficiaireName) {
                printData.type_reçu = 'etat_beneficiaire';
                // Pour les bénéficiaires, on n'a pas d'ID client spécifique
                printData.client_id = null;
                printData.client_nom = 'Bénéficiaire';
                printData.client_prenom = filterInfo.beneficiaireName;
            }
            // Si c'est un état bureau général
            else {
                printData.client_id = null;
                printData.client_nom = 'Bureau';
                printData.client_prenom = 'Général';
                printData.type_reçu = 'honoraires';
            }

            // Envoyer les données au backend
            const response = await fetch('/api/print-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                console.warn('Erreur lors de l\'enregistrement de l\'impression:', response.statusText);
            }
        } catch (error) {
            console.warn('Erreur lors de l\'enregistrement de l\'impression:', error);
        }
    };

    const handlePrint = () => {
        // Enregistrer l'impression avant d'imprimer
        recordPrintHistory();

        // Utiliser les nouvelles routes d'impression dédiées
        const etatType = window.currentEtatType || type; // 'bureau' ou 'client'
        const params = new URLSearchParams();

        if (filterType === 'jour' && date) {
            params.append('filterType', 'jour');
            params.append('date', date);
        } else if (filterType === 'periode' && dateDebut && dateFin) {
            params.append('filterType', 'periode');
            params.append('dateDebut', dateDebut);
            params.append('dateFin', dateFin);
        } else if (filterType === 'mois' && mois && annee) {
            params.append('filterType', 'mois');
            params.append('mois', mois);
            params.append('annee', annee);
        } else if (filterType === 'annee' && annee) {
            params.append('filterType', 'annee');
            params.append('annee', annee);
        }

        if (etatType === 'client') {
            const clientId = window.currentEtatClientId || window.currentHonorairesClientId;
            if (clientId) params.append('client_id', clientId);
        }

        const base = etatType === 'bureau' ? '/etat-cgm/print' : '/etat-client/print';
        const url = `${base}?${params.toString()}`;
        window.open(url, '_blank');
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-chart-line me-2"></i>
                            {filterInfo && filterInfo.beneficiaireName ?
                                `État Bénéficiaire - ${filterInfo.beneficiaireName}` :
                                filterInfo && filterInfo.clientName ?
                                    'État' :
                                    (window.currentEtatType === 'bureau' ? 'État Bureau' : 'États CGM - Honoraires Reçus')
                            }
                            {filterInfo && (
                                <small className="text-muted ms-2">
                                    <i className="fas fa-filter me-1"></i>
                                    {filterInfo.type === 'jour' ?
                                        (filterInfo.subFilterType === 'date' ? `Jour: ${filterInfo.value}` : `Période: ${filterInfo.value}`) :
                                        filterInfo.type === 'periode' ? `Période: ${filterInfo.value}` :
                                            filterInfo.type === 'mois' ? `Mois: ${filterInfo.value}` :
                                                filterInfo.type === 'annee' ? `Année: ${filterInfo.value}` :
                                                    filterInfo.value
                                    }
                                </small>
                            )}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {loading && (
                            <div className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement des honoraires...</p>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {!loading && !error && (
                            <>
                                {honoraires.length === 0 && depenses.length === 0 && !beneficiaireData ? (
                                    <div className="text-center py-4">
                                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                        <h5 className="text-muted">Aucune donnée trouvée</h5>
                                        <p className="text-muted">Aucun honoraire ou dépense n'a été enregistré.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Tableau des Honoraires et Avance de Déclaration */}
                                        {(honoraires.length > 0 || beneficiaireData) && (
                                            <div className="mb-4">
                                                <h5 className="mb-3">
                                                    <i className="fas fa-chart-line me-2"></i>
                                                    Détail des Honoraires Reçus
                                                </h5>
                                                <div className="table-responsive">
                                                    <table className="table table-striped table-hover">
                                                        <thead className="table-dark">
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Libellé</th>
                                                                <th>Montant</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {beneficiaireData ? (
                                                                <tr>
                                                                    <td colSpan="2" className="text-center">
                                                                        <strong>Total des honoraires reçus</strong>
                                                                    </td>
                                                                    <td className="text-success fw-bold">
                                                                        {formatMontant(beneficiaireData.honoraires.total)}
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                honoraires.map((honoraire, index) => (
                                                                    <tr key={index}>
                                                                        <td>{formatDateForDisplay(honoraire.date)}</td>
                                                                        <td>
                                                                            <strong>{honoraire.libelle || '-'}</strong>
                                                                        </td>
                                                                        <td className="text-success fw-bold">
                                                                            {formatMontant(window.currentEtatType === 'bureau' ? honoraire.montant : honoraire.avance)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                        <tfoot className="table-dark">
                                                            <tr>
                                                                <th colSpan="2" className="text-end">
                                                                    <strong>TOTAL HONORAIRES REÇUS :</strong>
                                                                </th>
                                                                <th className="text-success">
                                                                    <strong>{formatMontant(getTotalMontant())}</strong>
                                                                </th>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tableau des Dépenses du Client */}
                                        {(depenses.length > 0 || beneficiaireData) && (
                                            <div className="mb-4">
                                                <h5 className="mb-3">
                                                    <i className="fas fa-credit-card me-2"></i>
                                                    Détail des Dépenses
                                                </h5>
                                                <div className="table-responsive">
                                                    <table className="table table-striped table-hover">
                                                        <thead className="table-dark">
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Libellé</th>
                                                                <th>Montant</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {beneficiaireData ? (
                                                                beneficiaireData.depenses.details.map((depense, index) => (
                                                                    <tr key={index}>
                                                                        <td>{formatDateForDisplay(depense.date)}</td>
                                                                        <td>
                                                                            <strong>{depense.description || depense.libelle || '-'}</strong>
                                                                        </td>
                                                                        <td className="text-primary fw-bold">
                                                                            {formatMontant(depense.montant)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                depenses
                                                                    .filter(depense => {
                                                                        // Pour l'état CGM (bureau), ne montrer que les dépenses avec préfixe [CGM]
                                                                        const etatType = window.currentEtatType || type;
                                                                        if (etatType === 'bureau') {
                                                                            const description = depense.description || depense.libelle || '';
                                                                            return description.includes('[CGM]');
                                                                        }
                                                                        // Pour l'état client, ne montrer que les dépenses sans préfixe [CGM]
                                                                        else if (etatType === 'client') {
                                                                            const description = depense.description || depense.libelle || '';
                                                                            return !description.includes('[CGM]');
                                                                        }
                                                                        // Par défaut, montrer toutes les dépenses
                                                                        return true;
                                                                    })
                                                                    .map((depense, index) => (
                                                                        <tr key={index}>
                                                                            <td>{formatDateForDisplay(depense.date)}</td>
                                                                            <td>
                                                                                <strong>{depense.description || depense.libelle || '-'}</strong>
                                                                            </td>
                                                                            <td className="text-primary fw-bold">
                                                                                {formatMontant(depense.montant)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                            )}
                                                        </tbody>
                                                        <tfoot className="table-dark">
                                                            <tr>
                                                                <th colSpan="2" className="text-end">
                                                                    <strong>TOTAL DÉPENSES :</strong>
                                                                </th>
                                                                <th className="text-primary">
                                                                    <strong>{formatMontant(getTotalDepenses())}</strong>
                                                                </th>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tableau de Synthèse */}
                                        <div className="mt-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="mb-0">
                                                    <i className="fas fa-calculator me-2"></i>
                                                    Synthèse
                                                </h5>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={handlePrint}
                                                    title="Imprimer la synthèse "
                                                >
                                                    <i className="fas fa-print me-2"></i>
                                                    Imprimer
                                                </button>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-striped">
                                                    <thead className="table-primary">
                                                        <tr>
                                                            <th className="text-center">Date</th>
                                                            <th className="text-center">Total Honoraires Reçus</th>
                                                            <th className="text-center">Total Dépenses</th>
                                                            <th className="text-center">Reste CGM</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="fw-bold">
                                                            <td className="text-center">{getCurrentDate()}</td>
                                                            <td className="text-success text-center">
                                                                {formatMontant(getTotalMontant())}
                                                            </td>
                                                            <td className="text-primary text-center">
                                                                {formatMontant(getTotalDepenses())}
                                                            </td>
                                                            <td className={`text-center fw-bold ${getResteCgm() >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {formatMontant(getResteCgm())}
                                                            </td>
                                                        </tr>
                                                        {soldeReporte && soldeReporte.soldeReporte !== 0 && (
                                                            <>
                                                                <tr>
                                                                    <td colSpan="3" className="text-end fw-bold">
                                                                        + Solde reporté ({soldeReporte.anneePrecedente})
                                                                    </td>
                                                                    <td className={`text-center ${soldeReporte.soldeReporte >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                        {formatMontant(soldeReporte.soldeReporte)}
                                                                    </td>
                                                                </tr>
                                                                <tr className="table-warning">
                                                                    <td colSpan="3" className="text-end fw-bold">
                                                                        = Reste CGM Final
                                                                    </td>
                                                                    <td className={`text-center fw-bold ${getResteCgmFinal() >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                        {formatMontant(getResteCgmFinal())}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <i className="fas fa-times me-2"></i>Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
