import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ClientCharges() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [editingCharge, setEditingCharge] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCarteBancaire, setIsCarteBancaire] = useState(false);
  const [chargesWithExpenses, setChargesWithExpenses] = useState(new Set());
  const [chargesWithClientExpenses, setChargesWithClientExpenses] = useState(new Set());
  const [chargesWithCgmExpenses, setChargesWithCgmExpenses] = useState(new Set());
  const [chargesWithClientAndCgmExpenses, setChargesWithClientAndCgmExpenses] = useState(new Set());
  const [chargesWithRetraitCgm, setChargesWithRetraitCgm] = useState(new Set());
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16), // Format datetime-local
    libelle: '',
    libelleCustom: '', // Pour le libellé personnalisé
    montant: '',
    avance: ''
  });

  useEffect(() => {
    fetchClientCharges();
  }, [id, annee]);

  // Vérifier quelles charges ont déjà des dépenses
  useEffect(() => {
    if (charges.length > 0) {
      checkChargesWithExpenses();
    }
  }, [charges]);

  // Vérifier quelles charges ont déjà des dépenses (client ou bureau)
  const checkChargesWithExpenses = async () => {
    try {
      const chargeIds = charges
        .filter(charge => !charge.isPrecedent)
        .map(charge => charge.id);

      if (chargeIds.length === 0) return;

      // Vérifier chaque charge individuellement
      const chargesWithClientExpensesSet = new Set();
      const chargesWithCgmExpensesSet = new Set();
      const chargesWithClientAndCgmExpensesSet = new Set();

      for (const chargeId of chargeIds) {
        try {
          const chargeObj = charges.find(c => c.id === chargeId);
          if (!chargeObj) continue;

          // Vérifier les dépenses client - utiliser l'endpoint spécifique avec charge_id
          try {
            const clientResponse = await fetch(`/api/depenses?charge_id=${chargeId}&client_id=${id}`);
            const clientData = await clientResponse.json();
            // Vérifier que c'est bien une dépense client (type: 'client' ou dans depenses_client)
            if (clientData.success && clientData.depenses && Array.isArray(clientData.depenses)) {
              const hasClientExpense = clientData.depenses.some(dep =>
                dep.type === 'client' || dep.charge_id === chargeId
              );
              if (hasClientExpense) {
                chargesWithClientExpensesSet.add(chargeId);
              }
            }
          } catch (err) {
            console.error(`Erreur vérification dépenses client pour charge ${chargeId}:`, err);
          }

          // Détection précise d'une dépense CGM liée à cette charge:
          // On considère qu'une dépense bureau correspond à la charge si:
          // - le libellé ou la description contient le préfixe [CGM] ET le libellé exact de la charge
          // - et la date (jour) correspond exactement
          // - et le bénéficiaire correspond au nom du client
          // - et le montant correspond (pour éviter les fausses correspondances)
          try {
            const bureauResponse = await fetch(`/api/depenses/bureau`);
            const bureauData = await bureauResponse.json();
            if (bureauData.success && Array.isArray(bureauData.depenses)) {
              const chargeLib = (chargeObj.libelle || '').toUpperCase();
              const chargeMontant = parseFloat(chargeObj.montant || 0);
              const chargeDate = chargeObj.date ? new Date(chargeObj.date) : (chargeObj.date_creation ? new Date(chargeObj.date_creation) : null);
              const chDay = chargeDate ? `${chargeDate.getUTCFullYear()}-${String(chargeDate.getUTCMonth() + 1).padStart(2, '0')}-${String(chargeDate.getUTCDate()).padStart(2, '0')}` : null;

              const hasMatchingBureauExpense = bureauData.depenses.some(depense => {
                const raw = (depense.description || depense.libelle || '').toUpperCase();
                const depDate = new Date(depense.date || depense.date_operation);
                const depDay = `${depDate.getUTCFullYear()}-${String(depDate.getUTCMonth() + 1).padStart(2, '0')}-${String(depDate.getUTCDate()).padStart(2, '0')}`;
                const sameDay = chDay && depDay === chDay;
                const sameBenef = (depense.beneficiaire || depense.nom_beneficiaire || '').toUpperCase() === ((client?.nom || '').toUpperCase());
                const sameMontant = Math.abs(parseFloat(depense.montant || 0) - chargeMontant) < 0.01; // Tolérance pour les arrondis
                const hasCgmPrefix = raw.includes('[CGM]');
                const hasChargeLibelle = chargeLib && raw.includes(chargeLib);

                // Correspondance stricte: préfixe CGM, libellé, date, bénéficiaire et montant
                return hasCgmPrefix && hasChargeLibelle && sameDay && sameBenef && sameMontant;
              });

              if (hasMatchingBureauExpense) {
                chargesWithCgmExpensesSet.add(chargeId);
              }
            }
          } catch (err) {
            console.error(`Erreur vérification dépenses CGM pour charge ${chargeId}:`, err);
          }

          // Si une charge a à la fois des dépenses client et bureau, elle est "Client et CGM"
          if (chargesWithClientExpensesSet.has(chargeId) && chargesWithCgmExpensesSet.has(chargeId)) {
            chargesWithClientAndCgmExpensesSet.add(chargeId);
            // Harmoniser les états des boutons: on ne montre pas "Stocké" seulement côté Client
            // si elle est aussi CGM. Cela évite l'ambiguïté vue pour HONORAIRES REÇU.
            chargesWithClientExpensesSet.delete(chargeId);
            chargesWithCgmExpensesSet.delete(chargeId);
          }
        } catch (error) {
          console.error(`Erreur lors de la vérification de la charge ${chargeId}:`, error);
        }
      }

      setChargesWithClientExpenses(chargesWithClientExpensesSet);
      setChargesWithCgmExpenses(chargesWithCgmExpensesSet);
      setChargesWithClientAndCgmExpenses(chargesWithClientAndCgmExpensesSet);
    } catch (error) {
      console.error('Erreur lors de la vérification des dépenses:', error);
    }
  };

  // Écouter l'événement du bouton "Ajouter charge" de la navbar
  useEffect(() => {
    const handleOpenAddCharge = () => {
      setShowForm(true);
    };

    window.addEventListener('open-add-charge-modal', handleOpenAddCharge);
    return () => window.removeEventListener('open-add-charge-modal', handleOpenAddCharge);
  }, []);

  const fetchClientCharges = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer les informations du client
      const clientRes = await fetch(`/api/clients/${id}`);
      const clientData = await clientRes.json();

      if (!clientData.success) {
        setError('Client non trouvé');
        return;
      }

      setClient(clientData.client);

      // Récupérer les charges mensuelles pour l'année sélectionnée
      const chargesRes = await fetch(`/api/charges-mensuelles/client/${id}?annee=${annee}`);
      const chargesData = await chargesRes.json();

      if (chargesData.success) {
        // Trier les charges par année puis par mois pour un affichage chronologique
        const sortedCharges = chargesData.charges.sort((a, b) => {
          if (a.annee !== b.annee) {
            return a.annee - b.annee;
          }
          return a.mois - b.mois;
        });
        setCharges(sortedCharges);

        // Initialiser chargesWithRetraitCgm depuis les données de la base de données
        const retraitProcessedSet = new Set();
        sortedCharges.forEach(charge => {
          if (charge.is_cgm_retrait_processed) {
            retraitProcessedSet.add(charge.id);
          }
        });
        setChargesWithRetraitCgm(retraitProcessedSet);
      } else {
        setCharges([]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    const value = parseFloat(montant);
    if (isNaN(value)) return '0,000';
    // Afficher la valeur absolue pour supprimer le signe '-' visuel
    const absValue = Math.abs(value);
    // Afficher avec 3 décimales (ex: 100,000)
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(absValue);
  };

  // Format avec signe '-' si négatif
  const formatMontantWithSign = (montant) => {
    const value = parseFloat(montant || 0);
    const isNeg = value < 0;
    const base = formatMontant(Math.abs(value));
    return `${isNeg ? '-' : ''}${base}`;
  };

  // Affichage formaté par type: montant en vert, avance en rouge, sinon noir
  const renderMontantGreen = (montant) => {
    const num = parseFloat(montant || 0);
    const hasValue = !isNaN(num) && num > 0;
    if (!hasValue) return <span></span>; // afficher vide si 0 ou invalide
    // Montant doit être en rouge quand il existe
    const className = hasValue ? 'text-danger fw-bold' : 'text-dark';
    return <span className={className}>{formatMontant(num)}</span>;
  };

  const renderAvanceRed = (avance) => {
    const num = parseFloat(avance || 0);
    const hasValue = !isNaN(num) && num > 0;
    if (!hasValue) return <span></span>; // afficher vide si 0 ou invalide
    // Avance doit être en vert quand elle existe
    const className = hasValue ? 'text-success fw-bold' : 'text-dark';
    return <span className={className}>{formatMontant(num)}</span>;
  };

  const getMoisName = (mois) => {
    const moisNames = {
      1: 'JANVIER', 2: 'FEVRIER', 3: 'MARS', 4: 'AVRIL',
      5: 'MAI', 6: 'JUIN', 7: 'JUILLET', 8: 'AOUT',
      9: 'SEPTEMBRE', 10: 'OCTOBRE', 11: 'NOVEMBRE', 12: 'DECEMBRE'
    };
    return moisNames[mois] || mois;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Libellés de base pouvant recevoir un suffixe saisi manuellement
  const baseLibelles = [
    'HONORAIRES REÇU',
    'HONO',
    'AVANCE DE DECLARATION',
    'RC',
    'BENEF.EFFECTIF',
    'RESERVATION',
    'CNSS',
    'DECLARATION',
    'ENREGT',
    'RNE',
    'PUBLICATION',
    'CACHET',
  ];

  const isBaseLibelle = (value) => baseLibelles.includes(value);

  // Fonction pour déterminer si le champ montant doit être bloqué
  const isMontantBlocked = (libelle) => {
    return libelle === 'HONORAIRES REÇU' || libelle === 'AVANCE DE DECLARATION';
  };

  // Fonction pour déterminer si le champ avance doit être bloqué
  const isAvanceBlocked = (libelle) => {
    return !isMontantBlocked(libelle) && libelle !== '' && libelle !== 'Sélectionner...';
  };

  const buildLibelleValue = (selected, customText) => {
    if (selected === 'TAPEZ MANUELLE') return customText;
    if (selected === '' || selected === 'Sélectionner...') return selected;
    // Pour tous les autres libellés, ajouter le texte supplémentaire s'il existe
    return `${selected}${customText ? ' ' + customText : ''}`;
  };

  const handleLibelleChange = (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        libelle: value,
        libelleCustom: (value === 'TAPEZ MANUELLE' || (value !== '' && value !== 'Sélectionner...')) ? prev.libelleCustom : ''
      };

      // Bloquer automatiquement les champs selon le libellé sélectionné
      if (isMontantBlocked(value)) {
        // Pour HONORAIRES REÇU et AVANCE DE DECLARATION : bloquer montant, activer avance
        newFormData.montant = '0'; // Mettre 0 pour éviter les erreurs de validation
        newFormData.avance = prev.avance || '';
      } else if (isAvanceBlocked(value)) {
        // Pour les autres libellés : bloquer avance, activer montant
        newFormData.avance = '0'; // Mettre 0 pour éviter les erreurs de validation
        newFormData.montant = prev.montant || '';
      }

      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalLibelle = buildLibelleValue(formData.libelle, formData.libelleCustom);
      // Ajouter le préfixe [CARTE BANCAIRE] si c'est une charge carte bancaire
      if (isCarteBancaire) {
        finalLibelle = `[CARTE BANCAIRE] ${finalLibelle}`;
      }
      const response = await fetch('/api/charges-mensuelles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: parseInt(id),
          date: formData.date,
          libelle: finalLibelle,
          montant: isMontantBlocked(formData.libelle) ? 0 : parseFloat(formData.montant || 0),
          avance: isAvanceBlocked(formData.libelle) ? 0 : parseFloat(formData.avance || 0)
        })
      });

      const result = await response.json();

      if (result.success) {
        const newChargeId = result.charge?.id || result.chargeId;
        const chargeMontant = parseFloat(formData.montant || 0);
        const chargeAvance = parseFloat(formData.avance || 0);
        const isDepense = chargeMontant > 0 && chargeAvance === 0;

        // Pour les honoraires reçus: mettre à jour la caisse uniquement si ce n'est PAS une carte bancaire
        if (!isCarteBancaire && finalLibelle && (finalLibelle.toUpperCase().includes('HONORAIRES REÇU') || finalLibelle.toUpperCase().includes('HONORAIRES RECU') || finalLibelle.toUpperCase().includes('HONORAIRES RE'))) {
          window.dispatchEvent(new CustomEvent('caisse-updated'));
          window.dispatchEvent(new CustomEvent('charge-added'));
        }

        // Pour les charges dépense (montant>0, avance=0): ajouter automatiquement aux dépenses client (y compris carte bancaire)
        if (isDepense && newChargeId) {
          // Si c'est une charge avec montant (dépense), l'ajouter automatiquement aux dépenses client
          try {
            const depenseResponse = await fetch('/api/depenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: formData.date ? formData.date.split('T')[0] : new Date().toISOString().slice(0, 10),
                beneficiaire: client?.nom || 'Client',
                montant: chargeMontant,
                description: finalLibelle || 'Dépense liée à charge',
                type: 'client',
                client_id: parseInt(id),
                charge_id: newChargeId
              })
            });

            const depenseResult = await depenseResponse.json();
            if (depenseResult.success) {
              // Marquer immédiatement cette charge comme ayant une dépense client
              setChargesWithClientExpenses(prev => new Set([...prev, newChargeId]));
            }
          } catch (err) {
            console.error('Erreur lors de l\'ajout automatique aux dépenses client:', err);
          }
          window.dispatchEvent(new CustomEvent('charge-added'));
        } else {
          // Pour les autres charges, mettre à jour normalement
          window.dispatchEvent(new CustomEvent('charge-added'));
        }

        // Recharger les charges après ajout
        await fetchClientCharges();
        setShowForm(false);
        setFormData({
          date: new Date().toISOString().slice(0, 16),
          libelle: '',
          libelleCustom: '',
          montant: '',
          avance: ''
        });
        // Afficher un message de succès
        if (!isCarteBancaire && finalLibelle && (finalLibelle.toUpperCase().includes('HONORAIRES REÇU') || finalLibelle.toUpperCase().includes('HONORAIRES RECU') || finalLibelle.toUpperCase().includes('HONORAIRES RE'))) {
          setSuccessMessage('Honoraires reçus ajoutés ! La caisse CGM a été mise à jour.');
        } else if (isDepense) {
          setSuccessMessage('Charge ajoutée et automatiquement enregistrée dans les dépenses client !');
        } else {
          setSuccessMessage('Charge ajoutée avec succès !');
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(result.error || 'Erreur lors de l\'ajout de la charge');
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout de la charge');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCharge = (charge) => {
    setEditingCharge(charge);
    const normalizedLibelle = (charge.libelle || '').toUpperCase();
    // Identifier si le libellé commence par l'un des libellés de base
    const matchedBase = baseLibelles.find(base => normalizedLibelle.startsWith(base));

    let libelleValue = matchedBase || 'TAPEZ MANUELLE';
    let libelleCustom = '';
    if (matchedBase) {
      const regex = new RegExp(`^${matchedBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-?\\s*`, 'i');
      libelleCustom = (charge.libelle || '').replace(regex, '');
    } else {
      // Pas de base trouvée: considérer comme libellé libre
      libelleValue = 'TAPEZ MANUELLE';
      libelleCustom = charge.libelle || '';
    }

    setFormData({
      date: charge.date ? new Date(charge.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      libelle: libelleValue,
      libelleCustom: libelleCustom,
      montant: charge.montant,
      avance: charge.avance || 0
    });
    setShowEditForm(true);
    setShowForm(false);
  };

  const handleUpdateCharge = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/charges-mensuelles/${editingCharge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          libelle: buildLibelleValue(formData.libelle, formData.libelleCustom),
          montant: isMontantBlocked(formData.libelle) ? 0 : parseFloat(formData.montant || 0),
          avance: isAvanceBlocked(formData.libelle) ? 0 : parseFloat(formData.avance || 0)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Charge modifiée avec succès !');
        setShowEditForm(false);
        setEditingCharge(null);
        setFormData({ date: new Date().toISOString().slice(0, 16), libelle: '', libelleCustom: '', montant: '', avance: 0 });
        fetchClientCharges();
        // Mettre à jour la caisse si c'est un honoraire reçu
        const finalLibelleEdit = buildLibelleValue(formData.libelle, formData.libelleCustom);
        if (finalLibelleEdit && (finalLibelleEdit.toUpperCase().includes('HONORAIRES REÇU') || finalLibelleEdit.toUpperCase().includes('HONORAIRES RECU') || finalLibelleEdit.toUpperCase().includes('HONORAIRES RE'))) {
          window.dispatchEvent(new CustomEvent('caisse-updated'));
          window.dispatchEvent(new CustomEvent('charge-updated'));
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Erreur lors de la modification de la charge.');
      }
    } catch (err) {
      console.error('Erreur lors de la modification de la charge:', err);
      setError('Erreur lors de la modification de la charge.');
    }
  };

  const handleDeleteCharge = async (chargeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) {
      try {
        const response = await fetch(`/api/charges-mensuelles/${chargeId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          setSuccessMessage('Charge supprimée avec succès !');
          fetchClientCharges();
          // Mettre à jour la caisse si c'était un honoraire reçu
          const deletedCharge = charges.find(c => c.id === chargeId);
          if (deletedCharge && deletedCharge.libelle && (deletedCharge.libelle.toUpperCase().includes('HONORAIRES REÇU') || deletedCharge.libelle.toUpperCase().includes('HONORAIRES RECU') || deletedCharge.libelle.toUpperCase().includes('HONORAIRES RE'))) {
            window.dispatchEvent(new CustomEvent('caisse-updated'));
            window.dispatchEvent(new CustomEvent('charge-deleted'));
          }
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setError(data.error || 'Erreur lors de la suppression de la charge.');
        }
      } catch (err) {
        console.error('Erreur lors de la suppression de la charge:', err);
        setError('Erreur lors de la suppression de la charge.');
      }
    }
  };

  // Note: Tous les boutons (Client, CGM, Client et CGM) sont maintenant affichés pour chaque charge

  const handleClientClick = async (charge) => {
    // Empêcher les double-clics et les actions multiples
    if (chargesWithClientExpenses.has(charge.id)) {
      return;
    }

    try {
      // Utiliser l'endpoint /api/depenses avec type: 'client' pour stocker dans depenses_client
      const requestData = {
        date: charge.date ? charge.date.split('T')[0] : new Date().toISOString().slice(0, 10),
        beneficiaire: client?.nom || 'Client',
        montant: (() => {
          const chargeLibelle = (charge.libelle || '').toUpperCase();
          if (chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('AVANCE DE DECLARATION')) {
            return parseFloat(charge.avance || 0);
          }
          // Pour les dépenses (montant > 0, avance = 0), utiliser le montant complet
          return parseFloat(charge.montant || 0);
        })(),
        description: charge.libelle || 'Dépense liée à charge',
        type: 'client', // Paramètre pour indiquer que c'est pour depenses_client
        client_id: parseInt(id), // ID du client
        charge_id: charge.id // ID de la charge
      };

      // Marquer immédiatement comme en cours pour éviter les doubles clics
      setChargesWithClientExpenses(prev => new Set([...prev, charge.id]));

      const response = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        // En cas d'erreur, retirer le marqueur
        setChargesWithClientExpenses(prev => {
          const newSet = new Set(prev);
          newSet.delete(charge.id);
          return newSet;
        });
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Dépense ajoutée aux dépenses client');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Recharger les charges pour mettre à jour l'affichage
        await fetchClientCharges();
      } else {
        // En cas d'échec, retirer le marqueur
        setChargesWithClientExpenses(prev => {
          const newSet = new Set(prev);
          newSet.delete(charge.id);
          return newSet;
        });
        setErrorMessage(result.error || 'Erreur lors de l\'ajout de la dépense');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      // En cas d'erreur, retirer le marqueur
      setChargesWithClientExpenses(prev => {
        const newSet = new Set(prev);
        newSet.delete(charge.id);
        return newSet;
      });
      setErrorMessage(`Erreur: ${e.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCgmClick = async (charge) => {
    // Empêcher les double-clics et les actions multiples
    if (chargesWithCgmExpenses.has(charge.id)) {
      return;
    }

    try {
      // Marquer immédiatement comme en cours pour éviter les doubles clics
      setChargesWithCgmExpenses(prev => new Set([...prev, charge.id]));

      const response = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: charge.date ? charge.date.split('T')[0] : new Date().toISOString().slice(0, 10),
          beneficiaire: client?.nom || 'Client',
          montant: (() => {
            const chargeLibelle = (charge.libelle || '').toUpperCase();
            if (chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('AVANCE DE DECLARATION')) {
              return parseFloat(charge.avance || 0);
            }
            // Pour les dépenses (montant > 0, avance = 0), utiliser le montant complet
            return parseFloat(charge.montant || 0);
          })(),
          description: `[CGM] ${charge.libelle || 'Dépense liée à charge'}`,
          type: 'bureau' // Pour stocker dans beneficiaires_bureau
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('Dépense ajoutée aux dépenses CGM');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Mettre à jour la caisse live (car les dépenses CGM diminuent la caisse)
        try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
        // Recharger les charges pour mettre à jour l'affichage
        await fetchClientCharges();
      } else {
        // En cas d'échec, retirer le marqueur
        setChargesWithCgmExpenses(prev => {
          const newSet = new Set(prev);
          newSet.delete(charge.id);
          return newSet;
        });
        setErrorMessage(result.error || 'Erreur lors de l\'ajout de la dépense');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      // En cas d'erreur, retirer le marqueur
      setChargesWithCgmExpenses(prev => {
        const newSet = new Set(prev);
        newSet.delete(charge.id);
        return newSet;
      });
      setErrorMessage('Erreur réseau lors de l\'ajout de la dépense');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Fonction pour créer un retrait direct dans la caisse CGM
  const handleRetraitCaisseCgm = async (charge) => {
    try {
      // Vérifier si le bouton a déjà été cliqué pour cette charge (depuis la base de données)
      if (charge.is_cgm_retrait_processed || chargesWithRetraitCgm.has(charge.id)) {
        return; // Ne rien faire si déjà traité
      }

      const response = await fetch('/api/caisse-cgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_operation: 'retrait',
          montant: parseFloat(charge.montant || 0),
          commentaire: `${client?.nom || 'Client'} - ${charge.libelle || 'Dépense'}`,
          client_id: parseInt(id),
          charge_id: charge.id, // Envoyer l'ID de la charge pour la marquer comme traitée
          user_id: null // Sera rempli par le backend si nécessaire
        })
      });

      const result = await response.json();
      if (result.success) {
        // Marquer cette charge comme ayant eu son bouton '-' cliqué (mise à jour locale immédiate)
        setChargesWithRetraitCgm(prev => new Set([...prev, charge.id]));
        setSuccessMessage('Retrait créé dans la caisse CGM');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Mettre à jour la caisse live
        try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
        // Recharger les charges pour mettre à jour l'affichage (la base de données sera à jour)
        await fetchClientCharges();
      } else {
        setErrorMessage(result.error || 'Erreur lors de la création du retrait');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      setErrorMessage('Erreur réseau lors de la création du retrait');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleClientEtCgmClick = async (charge) => {
    try {
      // Ajouter aux dépenses client (dans depenses_client)
      const clientResponse = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: charge.date ? charge.date.split('T')[0] : new Date().toISOString().slice(0, 10),
          beneficiaire: client?.nom || 'Client',
          montant: (() => {
            const chargeLibelle = (charge.libelle || '').toUpperCase();
            if (chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('AVANCE DE DECLARATION')) {
              return parseFloat(charge.avance || 0);
            }
            return Math.abs(parseFloat(charge.montant) - parseFloat(charge.avance || 0)) || 0;
          })(),
          description: charge.libelle || 'Dépense liée à charge',
          type: 'client', // Pour stocker dans depenses_client
          client_id: parseInt(id), // ID du client
          charge_id: charge.id // ID de la charge
        })
      });

      // Ajouter aux dépenses CGM (dans beneficiaires_bureau)
      const cgmResponse = await fetch('/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: charge.date ? charge.date.split('T')[0] : new Date().toISOString().slice(0, 10),
          beneficiaire: client?.nom || 'Client',
          montant: (() => {
            const chargeLibelle = (charge.libelle || '').toUpperCase();
            if (chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('AVANCE DE DECLARATION')) {
              return parseFloat(charge.avance || 0);
            }
            return Math.abs(parseFloat(charge.montant) - parseFloat(charge.avance || 0)) || 0;
          })(),
          description: `[CGM] ${charge.libelle || 'Dépense liée à charge'}`,
          type: 'bureau' // Pour stocker dans beneficiaires_bureau
        })
      });

      const clientResult = await clientResponse.json();
      const cgmResult = await cgmResponse.json();

      if (clientResult.success && cgmResult.success) {
        setSuccessMessage('Dépense ajoutée aux dépenses client et CGM');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Rafraîchir la caisse live immédiatement
        try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) { }
        // Marquer immédiatement cette charge comme ayant une dépense client et CGM
        setChargesWithClientAndCgmExpenses(prev => new Set([...prev, charge.id]));
        fetchClientCharges();
      } else {
        setErrorMessage('Erreur lors de l\'ajout de la dépense');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      setErrorMessage('Erreur réseau lors de l\'ajout de la dépense');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Ouvrir le gabarit de reçu avec les données de la charge
  const handlePrintCharge = async (charge) => {
    try {
      // Vérifier que c'est un honoraire reçu
      const chargeLibelle = (charge.libelle || '').toUpperCase();
      const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('HONORAIRES RECU');

      if (!isHonoraireRecu) {
        console.warn('Ce n\'est pas un honoraire reçu');
        return;
      }

      console.log('Clic sur Reçu - Enregistrement dans l\'historique...');
      // Enregistrer l'impression dans l'historique (attendre que ce soit terminé)
      await recordPrintHistory(charge, client);
      console.log('Enregistrement terminé depuis ClientCharges');

      // Naviguer vers la page d'impression avec l'ID de la charge
      navigate(`/client/${id}/print-receipt?chargeId=${charge.id}`);
    } catch (err) {
      console.error('Erreur ouverture reçu:', err);
      // Même en cas d'erreur, on peut quand même naviguer vers la page d'impression
      navigate(`/client/${id}/print-receipt?chargeId=${charge.id}`);
    }
  };

  // Enregistrer l'impression dans l'historique
  const recordPrintHistory = async (charge, client) => {
    try {
      // Vérifier que le client est disponible
      if (!client || !client.id) {
        console.error('Client non disponible pour l\'enregistrement de l\'impression');
        return;
      }

      // Récupérer le nom d'utilisateur du caissier depuis useAuth ou sessionStorage
      let caissierUsername = 'Caissier Inconnu';
      try {
        // Essayer d'abord avec useAuth
        if (user && user.username) {
          caissierUsername = user.username;
        } else {
          // Sinon, essayer avec sessionStorage
          const userStr = sessionStorage.getItem('user');
          if (userStr) {
            const userFromStorage = JSON.parse(userStr);
            if (userFromStorage && userFromStorage.username) {
              caissierUsername = userFromStorage.username;
            }
          }
        }
      } catch (e) {
        console.warn('Erreur lors de la récupération du nom d\'utilisateur:', e);
      }

      // Déterminer le montant : si c'est une avance (montant = 0 et avance > 0), utiliser avance, sinon utiliser montant
      const isAdvance = parseFloat(charge.montant || 0) === 0 && parseFloat(charge.avance || 0) > 0;
      const montant = isAdvance ? parseFloat(charge.avance || 0) : parseFloat(charge.montant || 0);

      if (isNaN(montant) || montant <= 0) {
        console.warn('Montant invalide pour l\'enregistrement de l\'impression:', montant);
        return;
      }

      const printData = {
        client_id: client.id,
        client_nom: client.nom || '',
        client_prenom: client.prenom || '',
        montant: montant,
        caissier_username: caissierUsername,
        type_reçu: 'honoraires'
      };

      // Envoyer les données au backend
      const response = await fetch('/api/print-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData)
      });

      const data = await response.json();

      console.log('Réponse API print-history depuis ClientCharges:', { status: response.status, ok: response.ok, data });

      if (response.ok && data.success) {
        console.log('✅ Reçu enregistré avec succès dans l\'historique depuis ClientCharges:', printData);
        // Afficher un message de succès
        setSuccessMessage('Reçu enregistré dans l\'historique avec succès');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorMsg = data.error || data.message || response.statusText || 'Erreur lors de l\'enregistrement';
        console.error('❌ Erreur lors de l\'enregistrement de l\'impression:', errorMsg, printData);
        setErrorMessage(`Erreur: ${errorMsg}`);
        setTimeout(() => setErrorMessage(''), 5000);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'impression:', error);
      throw error; // Re-lancer l'erreur pour que handlePrintCharge puisse la gérer
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="client-charges-page">
      <style jsx global>{`
        body, html { 
          height: auto !important; 
          overflow-x: hidden; 
          overflow-y: auto; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .client-charges-page { 
          background:rgb(173, 69, 196);
          min-height: 100vh; 
          padding: 2rem 0;
          position: relative;
          overflow: hidden;
        }
        
        .client-charges-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
          pointer-events: none;
        }
        
        
        .charges-header { 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 25px; 
          padding: 3rem; 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          animation: slideInDown 0.8s ease-out;
        }
        
        .charges-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #667eea;
        }
        
        @keyframes slideInDown {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        
        .charges-title { 
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          background-clip: text; 
          font-size: 3rem; 
          font-weight: 900; 
          margin-bottom: 1rem; 
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          animation: titleGlow 2s ease-in-out infinite alternate;
          position: relative;
        }
        
        @keyframes titleGlow {
          from { filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.3)); }
          to { filter: drop-shadow(0 0 20px rgba(118, 75, 162, 0.5)); }
        }
        
        .charges-subtitle { 
          color: #6c757d; 
          font-size: 1.2rem; 
          font-weight: 500; 
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        .modern-back-btn { 
          background: linear-gradient(45deg, #667eea, #764ba2);
          border: none; 
          color: white; 
          border-radius: 15px; 
          padding: 12px 24px; 
          font-weight: 600; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
          text-decoration: none; 
          display: inline-flex; 
          align-items: center; 
          gap: 10px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        .modern-back-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .modern-back-btn:hover::before {
          left: 100%;
        }
        
        .modern-back-btn:hover { 
          background: linear-gradient(45deg, #764ba2, #667eea);
          transform: translateY(-3px) scale(1.05); 
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4); 
          color: white; 
          text-decoration: none; 
        }
        
        .client-info-card { 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 10px; 
          padding: 0.75rem 1rem; 
          margin-bottom: 1rem; 
          border: 1px solid rgba(33, 150, 243, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          animation: slideInUp 0.8s ease-out 0.2s both;
        }
        
        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .client-info-summary {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        
        .client-info-text {
          color: #2c3e50;
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
        }
        
        .client-info-text i {
          color: #667eea;
          margin-right: 0.5rem;
          font-size: 0.9rem;
        }
        
        .client-username {
          color: #6c757d;
          font-weight: 500;
          font-size: 0.85rem;
          margin-left: 0.5rem;
        }
        
        .client-info-year {
          display: flex;
          align-items: center;
          color: #495057;
          font-weight: 600;
          font-size: 0.85rem;
          margin-left: auto;
        }
        
        .client-info-year label {
          margin-bottom: 0;
          color: #495057;
          margin-right: 0.5rem;
        }
        
        .add-charge-btn {
          background: linear-gradient(45deg, #4caf50, #45a049);
          border: none;
          color: white;
          border-radius: 20px;
          padding: 15px 30px;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto;
        }
        
        .add-charge-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.8s;
        }
        
        .add-charge-btn:hover::before {
          left: 100%;
        }
        
        .add-charge-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 20px 40px rgba(76, 175, 80, 0.4);
          background: linear-gradient(45deg, #45a049, #4caf50);
        }
        
        .charges-table-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
          animation: slideInUp 0.8s ease-out 0.4s both;
          position: relative;
          overflow: hidden;
        }
        
        .charges-table-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #4caf50;
        }
        
        .charges-table-title {
          color: #2c3e50;
          font-weight: 800;
          font-size: 1.6rem;
          margin-bottom: 2rem;
          text-align: center;
          background: linear-gradient(45deg, #2c3e50, #34495e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .charges-count-badge {
          background: linear-gradient(45deg, #2196f3, #1976d2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          margin-left: 10px;
          box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3);
        }
        
        .modern-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #000;
        }
        
        .modern-table thead {
          background: #FFB5FC;
        }
        
        .modern-table th {
          color: #2c3e50;
          font-weight: 700;
          padding: 1rem;
          text-align: center;
          border-bottom: 2px solid #000;
          border-right: 1px solid #000;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .modern-table th:last-child {
          border-right: none;
        }
        
        .modern-table tbody tr {
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
        }
        
        .modern-table tbody tr:nth-child(even) {
          background: rgba(248, 249, 250, 0.9);
        }
        
        .modern-table tbody tr:hover {
          background: rgba(33, 150, 243, 0.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .modern-table td {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          font-weight: 500;
        }
        
        .modern-table td:last-child {
          border-right: none;
        }
        
        .modern-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .modern-table tfoot {
          background: #FFB5FC !important;
        }
        
        .modern-table tfoot th,
        .modern-table tfoot td {
          background: #FFB5FC !important;
          color: #2c3e50 !important;
          font-weight: 700;
          padding: 1rem;
          border-top: 2px solid #000;
          border-right: 1px solid #000;
          text-align: center;
        }
        
        .modern-table tfoot th:last-child,
        .modern-table tfoot td:last-child {
          border-right: none;
        }
        
        .action-btn {
          background: linear-gradient(45deg, #2196f3, #1976d2);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.3s ease;
          margin: 0 2px;
          position: relative;
          overflow: hidden;
        }
        
        .action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .action-btn:hover::before {
          left: 100%;
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
        }
        
        .action-btn-success {
          background: linear-gradient(45deg, #4caf50, #45a049);
        }
        
        .action-btn-warning {
          background: linear-gradient(45deg, #ff9800, #f57c00);
        }
        
        .action-btn-danger {
          background: linear-gradient(45deg, #f44336, #d32f2f);
        }
        
        /* Style pour les boutons d'action principaux (Client, CGM, Client et CGM) */
        .btn-success {
          background: linear-gradient(45deg, #28a745, #20c997) !important;
          border: none !important;
          color: white !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3) !important;
        }
        
        .btn-success:hover:not(:disabled) {
          background: linear-gradient(45deg, #218838, #1e7e34) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4) !important;
        }
        
        .btn-success:disabled {
          background: linear-gradient(45deg, #6c757d, #5a6268) !important;
          cursor: not-allowed !important;
          opacity: 0.7 !important;
        }
        
        /* Style pour les boutons d'action plus petits */
        .action-btn-sm {
          font-size: 0.75rem !important;
          padding: 0.25rem 0.5rem !important;
          min-width: 60px !important;
        }
        
        .action-btn-sm i {
          font-size: 0.7rem !important;
        }
        
        .text-success {
          color: #4caf50 !important;
          font-weight: 600;
        }
        
        .text-danger {
          color: #f44336 !important;
          font-weight: 600;
        }
        
        .text-primary {
          color: #2196f3 !important;
          font-weight: 600;
        }
        
        .modern-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Animations d'entrée */
        .container > * {
          animation: fadeInUp 0.8s ease-out both;
        }
        
        .container > *:nth-child(1) { animation-delay: 0.1s; }
        .container > *:nth-child(2) { animation-delay: 0.2s; }
        .container > *:nth-child(3) { animation-delay: 0.3s; }
        .container > *:nth-child(4) { animation-delay: 0.4s; }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 992px) {
          .charges-table-container {
            margin: 0.5rem;
            padding: 1rem;
          }
          
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
          }
          
          .modern-table {
            min-width: 800px;
            font-size: 0.85rem;
          }
          
          .modern-table th,
          .modern-table td {
            padding: 0.75rem 0.5rem;
            white-space: nowrap;
          }
        }
        
        @media (max-width: 768px) {
          .charges-title { font-size: 2.2rem; }
          .charges-header, .charges-table-container {
            margin: 0.5rem;
            padding: 1rem;
          }
          .client-info-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .client-charges-page {
            padding: 0.5rem 0;
          }
          .modern-table {
            font-size: 0.75rem;
            min-width: 700px;
          }
          .modern-table th,
          .modern-table td {
            padding: 0.5rem 0.4rem;
            font-size: 0.75rem;
          }
          
          .action-btn,
          .action-btn-sm {
            padding: 4px 8px !important;
            font-size: 0.7rem !important;
            min-width: 50px !important;
          }
          
          .add-charge-btn {
            padding: 10px 16px;
            font-size: 0.9rem;
            margin: 0.25rem;
          }
        }
        
        @media (max-width: 480px) {
          .charges-title { font-size: 1.8rem; }
          .charges-header, .charges-table-container {
            padding: 0.75rem;
            margin: 0.25rem;
          }
          .client-info-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .client-info-year {
            width: 100%;
          }
          
          .modern-table {
            font-size: 0.7rem;
            min-width: 600px;
          }
          
          .modern-table th,
          .modern-table td {
            padding: 0.4rem 0.3rem;
            font-size: 0.7rem;
          }
          
          .action-btn,
          .action-btn-sm {
            padding: 3px 6px !important;
            font-size: 0.65rem !important;
            min-width: 45px !important;
          }
          
          .add-charge-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
            width: 100%;
            margin: 0.25rem 0;
          }
        }
      `}</style>

      <div className="container">
        {/* Informations du client - Résumé compact */}
        <div className="client-info-card">
          <div className="client-info-summary">
            <div className="client-info-text">
              <i className="fas fa-user"></i>
              <span>{client?.nom} {client?.prenom}</span>
              {client?.username && (
                <span className="client-username">(@{client.username})</span>
              )}
            </div>
            <div className="client-info-text">
              <i className="fas fa-phone"></i>
              <span>{client?.telephone || '-'}</span>
            </div>
            <div className="client-info-year">
              <label>
                <i className="fas fa-calendar"></i>
                Année:
              </label>
              <select
                className="form-select"
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value))}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#495057',
                  background: '#f8f9fa',
                  transition: 'all 0.3s ease',
                  minWidth: '80px'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(76, 175, 80, 0.3)'
          }}>
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
            <button type="button" className="btn-close btn-close-white" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{
            background: 'linear-gradient(45deg, #f44336, #d32f2f)',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(244, 67, 54, 0.3)'
          }}>
            <i className="fas fa-exclamation-circle me-2"></i>
            {errorMessage}
            <button type="button" className="btn-close btn-close-white" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        {/* Boutons pour ajouter une charge */}
        <div className="text-center mb-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="add-charge-btn"
            onClick={() => {
              setIsCarteBancaire(false);
              setShowForm(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Ajouter une charge
          </button>
          <button
            className="add-charge-btn"
            style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}
            onClick={() => {
              setIsCarteBancaire(true);
              setShowForm(true);
            }}
          >
            <i className="fas fa-credit-card"></i>
            Carte bancaire
          </button>
        </div>

        {/* Formulaire d'ajout de charge */}
        {showForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">
                {isCarteBancaire ? 'Ajouter une charge (Carte bancaire)' : 'Ajouter une nouvelle charge'}
              </h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Date</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Libellé</label>
                    <select
                      className="form-select"
                      name="libelle"
                      value={formData.libelle}
                      onChange={handleLibelleChange}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="HONORAIRES REÇU">HONORAIRES REÇU</option>
                      <option value="HONO">HONO</option>
                      <option value="AVANCE DE DECLARATION">AVANCE DE DECLARATION</option>
                      <option value="RC">RC</option>
                      <option value="BENEF.EFFECTIF">BENEF.EFFECTIF</option>
                      <option value="RESERVATION">RESERVATION</option>
                      <option value="CNSS">CNSS</option>
                      <option value="DECLARATION">DECLARATION</option>
                      <option value="ENREGT">ENREGT</option>
                      <option value="RNE">RNE</option>
                      <option value="PUBLICATION">PUBLICATION</option>
                      <option value="CACHET">CACHET</option>
                      <option value="TAPEZ MANUELLE">TAPEZ MANUELLE</option>
                    </select>
                    {(formData.libelle === 'TAPEZ MANUELLE' || (formData.libelle !== '' && formData.libelle !== 'Sélectionner...')) && (
                      <input
                        type="text"
                        className="form-control mt-2"
                        name="libelleCustom"
                        value={formData.libelleCustom}
                        onChange={handleInputChange}
                        placeholder={(formData.libelle === 'HONORAIRES REÇU' || formData.libelle === 'AVANCE DE DECLARATION') ? 'Tapez le texte supplémentaire (optionnel)' : 'Saisir le libellé personnalisé (optionnel)'}
                      />
                    )}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Montant</label>
                    <input
                      type="number"
                      step="0.001"
                      className={`form-control ${isMontantBlocked(formData.libelle) ? 'bg-light' : ''}`}
                      name="montant"
                      value={isMontantBlocked(formData.libelle) ? '0' : formData.montant}
                      onChange={handleInputChange}
                      placeholder="0.000"
                      disabled={isMontantBlocked(formData.libelle)}
                      required={!isMontantBlocked(formData.libelle)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Avance</label>
                    <input
                      type="number"
                      step="0.001"
                      className={`form-control ${isAvanceBlocked(formData.libelle) ? 'bg-light' : ''}`}
                      name="avance"
                      value={isAvanceBlocked(formData.libelle) ? '0' : formData.avance}
                      onChange={handleInputChange}
                      placeholder="0.000"
                      disabled={isAvanceBlocked(formData.libelle)}
                      required={isMontantBlocked(formData.libelle)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Ajout en cours...' : 'Ajouter la charge'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => {
                      setShowForm(false);
                      setIsCarteBancaire(false);
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulaire de modification */}
        {showEditForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Modifier la charge</h5>
              <form onSubmit={handleUpdateCharge}>
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Date</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Libellé</label>
                    <select
                      className="form-select"
                      value={formData.libelle}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          libelle: value,
                          libelleCustom: (value === 'TAPEZ MANUELLE' || (value !== '' && value !== 'Sélectionner...')) ? formData.libelleCustom : ''
                        });
                      }}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="HONORAIRES REÇU">HONORAIRES REÇU</option>
                      <option value="HONO">HONO</option>
                      <option value="AVANCE DE DECLARATION">AVANCE DE DECLARATION</option>
                      <option value="RC">RC</option>
                      <option value="BENEF.EFFECTIF">BENEF.EFFECTIF</option>
                      <option value="RESERVATION">RESERVATION</option>
                      <option value="CNSS">CNSS</option>
                      <option value="DECLARATION">DECLARATION</option>
                      <option value="ENREGT">ENREGT</option>
                      <option value="RNE">RNE</option>
                      <option value="PUBLICATION">PUBLICATION</option>
                      <option value="CACHET">CACHET</option>
                      <option value="TAPEZ MANUELLE">TAPEZ MANUELLE</option>
                    </select>
                    {(formData.libelle === 'TAPEZ MANUELLE' || (formData.libelle !== '' && formData.libelle !== 'Sélectionner...')) && (
                      <input
                        type="text"
                        className="form-control mt-2"
                        value={formData.libelleCustom}
                        onChange={(e) => setFormData({ ...formData, libelleCustom: e.target.value })}
                        placeholder={(formData.libelle === 'HONORAIRES REÇU' || formData.libelle === 'AVANCE DE DECLARATION') ? 'Tapez le texte supplémentaire' : 'Saisir le libellé personnalisé'}
                        required
                      />
                    )}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Montant</label>
                    <input
                      type="number"
                      step="0.001"
                      className={`form-control ${isMontantBlocked(formData.libelle) ? 'bg-light' : ''}`}
                      value={isMontantBlocked(formData.libelle) ? '0' : formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      placeholder="0.000"
                      disabled={isMontantBlocked(formData.libelle)}
                      required={!isMontantBlocked(formData.libelle)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Avance</label>
                    <input
                      type="number"
                      step="0.001"
                      className={`form-control ${isAvanceBlocked(formData.libelle) ? 'bg-light' : ''}`}
                      value={isAvanceBlocked(formData.libelle) ? '0' : formData.avance}
                      onChange={(e) => setFormData({ ...formData, avance: e.target.value })}
                      placeholder="0.000"
                      disabled={isAvanceBlocked(formData.libelle)}
                      required={isMontantBlocked(formData.libelle)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button type="submit" className="btn btn-success me-2">
                    <i className="fas fa-save"></i> Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingCharge(null);
                      setFormData({ date: new Date().toISOString().slice(0, 16), libelle: '', libelleCustom: '', montant: '', avance: 0 });
                    }}
                  >
                    <i className="fas fa-times"></i> Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tableau des charges */}
        <div className="charges-table-container">
          <h5 className="charges-table-title">
            <i className="fas fa-table me-2"></i>
            Tableau des charges

          </h5>

          {charges.length === 0 ? (
            <div className="alert alert-info" style={{
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(33, 150, 243, 0.3)'
            }}>
              <i className="fas fa-info-circle fa-2x mb-3"></i>
              <h6>Aucune charge enregistrée pour ce client</h6>
              <p>Utilisez le bouton "Ajouter une charge" pour commencer à enregistrer les charges mensuelles.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th><i className="fas fa-calendar me-2"></i>Date</th>
                    <th><i className="fas fa-tag me-2"></i>Libellé</th>
                    <th><i className="fas fa-money-bill me-2"></i>Montant</th>
                    <th><i className="fas fa-hand-holding-usd me-2"></i>Avance</th>
                    <th><i className="fas fa-calculator me-2"></i>Reste</th>
                    <th><i className="fas fa-cogs me-2"></i>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge, index) => {
                    // Calculer le solde cumulatif pour cette ligne
                    let soldeCumulatif = 0;

                    // Si c'est le solde reporté, utiliser sa valeur réelle
                    if (charge.isPrecedent) {
                      soldeCumulatif = parseFloat(charge.solde_restant || 0);
                    } else {
                      // Trouver le solde reporté (stock initial) pour l'inclure dans le calcul
                      let stockInitial = 0;
                      const soldeReporte = charges.find(c => c.isPrecedent);
                      if (soldeReporte) {
                        stockInitial = parseFloat(soldeReporte.solde_restant || 0);
                      }

                      // Calculer la somme cumulative jusqu'à cette ligne
                      // Logique: Stock initial + Avances - Montants
                      soldeCumulatif = stockInitial;
                      for (let i = 0; i <= index; i++) {
                        const currentCharge = charges[i];
                        if (currentCharge.isPrecedent) {
                          // Ignorer le solde reporté car il est déjà inclus dans stockInitial
                          continue;
                        }
                        const montant = parseFloat(currentCharge.montant || 0);
                        const avance = parseFloat(currentCharge.avance || 0);
                        // Ajouter l'avance et soustraire le montant
                        soldeCumulatif += avance - montant;
                      }
                    }

                    return (
                      <tr
                        key={charge.id}
                        style={{
                          backgroundColor: charge.isPrecedent
                            ? 'rgba(0, 123, 255, 0.1)' // Bleu clair pour solde reporté
                            : parseFloat(charge.montant) === 0 && parseFloat(charge.avance || 0) > 0
                              ? 'rgba(255, 255, 0, 0.2)' // Jaune pour avances
                              : 'transparent',
                          cursor: charge.isPrecedent ? 'default' : 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        className={charge.isPrecedent ? 'table-info' : ''}
                        onClick={(e) => {
                          // Ne pas ouvrir le formulaire pour le solde reporté
                          if (!charge.isPrecedent) {
                            // Ne pas déclencher si on clique sur un bouton ou dans la colonne ACTIONS
                            const target = e.target;
                            const clickedCell = target.closest('td');
                            const isLastCell = clickedCell && clickedCell === clickedCell.parentElement.lastElementChild;

                            if (target.tagName === 'BUTTON' ||
                              target.closest('button') ||
                              target.closest('.d-flex') ||
                              isLastCell) {
                              return;
                            }
                            handleEditCharge(charge);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!charge.isPrecedent) {
                            e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!charge.isPrecedent) {
                            const originalBg = parseFloat(charge.montant) === 0 && parseFloat(charge.avance || 0) > 0
                              ? 'rgba(255, 255, 0, 0.2)'
                              : 'transparent';
                            e.currentTarget.style.backgroundColor = originalBg;
                          }
                        }}
                      >
                        <td>
                          {charge.date ? (() => {
                            const date = new Date(charge.date);
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            return `${day}/${month}/${year}`;
                          })() : (() => {
                            const date = new Date(charge.date_creation);
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            return `${day}/${month}/${year}`;
                          })()}
                        </td>
                        <td>{charge.libelle || '-'}</td>
                        <td>{renderMontantGreen(charge.montant)}</td>
                        <td>{renderAvanceRed(charge.avance || 0)}</td>
                        <td className={charge.isPrecedent ?
                          (parseFloat(charge.solde_restant || 0) < 0 ? 'text-danger fw-bold' : 'text-success') :
                          (soldeCumulatif < 0 ? 'text-danger fw-bold' : 'text-success')
                        }>
                          {charge.isPrecedent ?
                            formatMontantWithSign(parseFloat(charge.solde_restant || 0)) :
                            formatMontantWithSign(soldeCumulatif)
                          }
                        </td>
                        <td>
                          {charge.isPrecedent ? (
                            <span className="text-muted fst-italic">Solde reporté</span>
                          ) : (
                            <div className="d-flex gap-2" role="group">
                              {/* Boutons selon le type de libellé */}
                              {/* Boutons d'action principaux */}
                              {(() => {
                                const chargeLibelle = (charge.libelle || '').toUpperCase();
                                const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('HONORAIRES RECU') || chargeLibelle.includes('HONORAIRES RE');

                                // Vérifier si c'est une dépense (montant > 0 et pas d'avance)
                                const isDepense = parseFloat(charge.montant || 0) > 0 && parseFloat(charge.avance || 0) === 0;
                                // Détecter une charge ajoutée via le bouton Carte bancaire (préfixe ajouté au libellé)
                                const isCarte = chargeLibelle.includes('[CARTE BANCAIRE]') || chargeLibelle.includes('[CARTE]');

                                // Masquer les boutons pour HONORAIRES REÇU (déjà stocké automatiquement)
                                if (isHonoraireRecu) {
                                  return null;
                                }

                                // Pour les dépenses (montant > 0 et pas d'avance), afficher un bouton "-"
                                if (isDepense && !isCarte) {
                                  // Vérifier si le retrait a été traité (depuis la base de données ou le state local)
                                  const isRetraitDone = charge.is_cgm_retrait_processed || chargesWithRetraitCgm.has(charge.id);
                                  return (
                                    <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${isRetraitDone ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => handleRetraitCaisseCgm(charge)}
                                        disabled={isRetraitDone}
                                        title={isRetraitDone ? "Retrait déjà créé" : "Créer un retrait dans la caisse CGM"}
                                        style={{ minWidth: '30px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                      >
                                        -
                                      </button>
                                    </div>
                                  );
                                }

                                // Pour les autres charges: afficher les 3 boutons (sauf pour carte bancaire)
                                if (isCarte) {
                                  return null;
                                }
                                return (
                                  <div className="d-flex gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                                    {/* Bouton Client */}
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${chargesWithClientExpenses.has(charge.id) ? 'btn-secondary' : 'btn-success'}`}
                                      disabled={chargesWithClientExpenses.has(charge.id)}
                                      onClick={() => handleClientClick(charge)}
                                      title={chargesWithClientExpenses.has(charge.id) ? "Cette charge a déjà une dépense client" : "Ajouter aux dépenses client"}
                                      style={{ minWidth: '70px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      <i className="fas fa-user me-1" style={{ fontSize: '0.7rem' }}></i>
                                      {chargesWithClientExpenses.has(charge.id) ? 'Stocké' : 'Client'}
                                    </button>

                                    {/* Bouton CGM */}
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${chargesWithCgmExpenses.has(charge.id) ? 'btn-secondary' : 'btn-success'}`}
                                      disabled={chargesWithCgmExpenses.has(charge.id)}
                                      onClick={() => handleCgmClick(charge)}
                                      title={chargesWithCgmExpenses.has(charge.id) ? "Cette charge a déjà une dépense CGM" : "Ajouter aux dépenses CGM"}
                                      style={{ minWidth: '70px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      <i className="fas fa-building me-1" style={{ fontSize: '0.7rem' }}></i>
                                      {chargesWithCgmExpenses.has(charge.id) ? 'Stocké' : 'CGM'}
                                    </button>

                                    {/* Bouton Client et CGM */}
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${chargesWithClientAndCgmExpenses.has(charge.id) ? 'btn-secondary' : 'btn-success'}`}
                                      disabled={chargesWithClientAndCgmExpenses.has(charge.id)}
                                      onClick={() => handleClientEtCgmClick(charge)}
                                      title={chargesWithClientAndCgmExpenses.has(charge.id) ? "Cette charge a déjà une dépense client et CGM" : "Ajouter aux dépenses client et CGM"}
                                      style={{ minWidth: '90px', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      <i className="fas fa-users me-1" style={{ fontSize: '0.7rem' }}></i>
                                      {chargesWithClientAndCgmExpenses.has(charge.id) ? 'Stocké' : 'Client et CGM'}
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Boutons d'action secondaires */}
                              <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* Bouton Modifier - Supprimé : cliquer sur la ligne pour modifier */}

                                {/* Bouton Supprimer */}
                                <button
                                  type="button"
                                  className="action-btn action-btn-danger action-btn-sm"
                                  onClick={() => handleDeleteCharge(charge.id)}
                                  title="Supprimer"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', minWidth: '70px' }}
                                >
                                  <i className="fas fa-trash" style={{ fontSize: '0.7rem' }}></i>
                                  Supprimer
                                </button>

                                {/* Bouton Reçu - Pour tous les honoraires reçus */}
                                {(() => {
                                  const chargeLibelle = (charge.libelle || '').toUpperCase();
                                  const isHonoraireRecu = chargeLibelle.includes('HONORAIRES REÇU') || chargeLibelle.includes('HONORAIRES RECU');

                                  // Afficher le bouton Reçu pour tous les honoraires reçus
                                  if (isHonoraireRecu) {
                                    return (
                                      <button
                                        type="button"
                                        className="action-btn action-btn-warning action-btn-sm"
                                        onClick={() => handlePrintCharge(charge)}
                                        title="Imprimer le reçu"
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', minWidth: '60px' }}
                                      >
                                        <i className="fas fa-print" style={{ fontSize: '0.7rem' }}></i>
                                        Reçu
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    // Calculer le total en incluant le stock initial
                    let totalReste = 0;
                    const soldeReporte = charges.find(c => c.isPrecedent);
                    if (soldeReporte) {
                      totalReste = parseFloat(soldeReporte.solde_restant || 0);
                    }
                    totalReste += charges.reduce((sum, c) => {
                      if (c.isPrecedent) return sum; // Ignorer le solde reporté (déjà ajouté)
                      return sum + parseFloat(c.avance || 0) - parseFloat(c.montant);
                    }, 0);

                    return (
                      <tr>
                        <th>TOTAL</th>
                        <th></th>
                        <th>{formatMontant(charges.reduce((sum, c) => sum + parseFloat(c.montant), 0))}</th>
                        <th>{formatMontant(charges.reduce((sum, c) => sum + parseFloat(c.avance || 0), 0))}</th>
                        <th className={totalReste < 0 ? 'text-danger fw-bold' : 'text-success'}>
                          {formatMontantWithSign(totalReste)}
                        </th>
                        <th></th>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

