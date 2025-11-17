import React, { useEffect, useState } from 'react';
import logoImage from '../assets/logo.png';
import cachet from '../assets/cachet.png';

export default function EtatPrintPage({ mode = 'client' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [honoraires, setHonoraires] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [clientName, setClientName] = useState('');
  const [soldeReporte, setSoldeReporte] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterType = params.get('filterType');
    const date = params.get('date');
    const mois = params.get('mois');
    const annee = params.get('annee');
    const dateDebut = params.get('dateDebut');
    const dateFin = params.get('dateFin');
    const beneficiaire = params.get('beneficiaire');
    const clientId = params.get('client_id');

    const run = async () => {
      try {
        if (mode === 'client' && !clientId) {
          setError('client_id requis');
          setLoading(false);
          return;
        }

        // Optional: fetch client name
        let clientNameLocal = '';
        let soldeReporteLocal = null;
        if (mode === 'client' && clientId) {
          try {
            const r = await fetch(`/api/clients/${clientId}`);
            const d = await r.json();
            if (d.success && d.client) {
              clientNameLocal = `${d.client.nom || ''} ${d.client.prenom || ''}`.trim();
              setClientName(clientNameLocal);
            }
            // solde reporté - utiliser l'année de la période sélectionnée
            let anneePourSolde = new Date().getFullYear();
            if (annee) {
              anneePourSolde = parseInt(annee);
            } else if (date) {
              anneePourSolde = new Date(date).getFullYear();
            } else if (dateDebut) {
              anneePourSolde = new Date(dateDebut).getFullYear();
            } else if (mois) {
              // Si mois est fourni sans annee, utiliser l'année courante
              anneePourSolde = new Date().getFullYear();
            }
            const sr = await fetch(`/api/charges-mensuelles/solde-reporte/${clientId}?annee=${anneePourSolde}`);
            const srd = await sr.json();
            if (srd.success) {
              soldeReporteLocal = srd;
              setSoldeReporte(srd);
            }
          } catch (_) { }
        }

        const honorairesData = await fetchHonoraires({ filterType, date, mois, annee, dateDebut, dateFin, beneficiaire, clientId });
        setHonoraires(honorairesData);
        const depensesData = await fetchDepenses({ filterType, date, mois, annee, dateDebut, dateFin, clientId });
        setDepenses(depensesData);

        setLoading(false);

        setTimeout(() => handlePrint({ honoraires: honorairesData, depenses: depensesData, filterType, date, mois, annee, dateDebut, dateFin, beneficiaire, clientName: (mode === 'client' ? (clientNameLocal || clientName) : ''), soldeReporte: soldeReporteLocal || soldeReporte, mode }), 0);
      } catch (e) {
        setError(e.message || 'Erreur');
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const formatMontant = (montant) => {
    const value = parseFloat(montant);
    if (isNaN(value)) return '0,000 TND';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value) + ' TND';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  };

  async function fetchHonoraires({ filterType, date, mois, annee, dateDebut, dateFin, beneficiaire, clientId }) {
    let url = '/api/honoraires';
    const params = new URLSearchParams();
    if (mode !== 'bureau') params.append('type', mode);
    if (clientId) params.append('client_id', clientId);
    if (filterType === 'jour' && date) params.append('date', date);
    else if (filterType === 'periode' && dateDebut && dateFin) { params.append('date_debut', dateDebut); params.append('date_fin', dateFin); }
    else if (filterType === 'mois' && mois && annee) { params.append('mois', mois); params.append('annee', annee); }
    else if (filterType === 'annee' && annee) params.append('annee', annee);
    if (params.toString()) url += `?${params.toString()}`;

    const r = await fetch(url);
    const d = await r.json();
    let data = d.success ? (d.honoraires || []) : [];

    // Keep only honoraires reçus with amount > 0
    data = data.filter(h => {
      const lib = (h.libelle || '').toUpperCase();
      const isHon = lib.includes('HONORAIRES REÇU') || lib.includes('HONORAIRES RECU');
      const amt = parseFloat(h.avance || h.montant || 0);
      return isHon && amt > 0;
    });

    // Note: /api/honoraires retourne déjà les données depuis charges_mensuelles
    // Donc on n'a pas besoin de récupérer les charges séparément pour éviter les doublons
    // Si clientId est fourni, l'API /api/honoraires le filtre déjà correctement

    return data;
  }

  async function fetchDepenses({ filterType, date, mois, annee, dateDebut, dateFin, clientId }) {
    let url = '/api/depenses';
    const params = new URLSearchParams();
    if (mode !== 'bureau') params.append('type', mode);
    if (clientId) params.append('client_id', clientId);
    if (filterType === 'jour' && date) { url = mode === 'bureau' ? '/api/depenses/bureau/par-periode' : '/api/depenses/par-periode'; params.append('date_debut', date); params.append('date_fin', date); }
    else if (filterType === 'periode' && dateDebut && dateFin) { url = mode === 'bureau' ? '/api/depenses/bureau/par-periode' : '/api/depenses/par-periode'; params.append('date_debut', dateDebut); params.append('date_fin', dateFin); }
    else if (filterType === 'mois' && mois && annee) { url = mode === 'bureau' ? '/api/depenses/bureau/par-periode' : '/api/depenses/par-periode'; const start = `${annee}-${String(mois).padStart(2, '0')}-01`; const endDate = new Date(annee, mois, 0); const end = `${annee}-${String(mois).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`; params.append('date_debut', start); params.append('date_fin', end); }
    else if (filterType === 'annee' && annee) { url = mode === 'bureau' ? '/api/depenses/bureau/par-periode' : '/api/depenses/par-periode'; params.append('date_debut', `${annee}-01-01`); params.append('date_fin', `${annee}-12-31`); }
    if (params.toString()) url += `?${params.toString()}`;

    const r = await fetch(url);
    const d = await r.json();
    let data = d.success ? (d.depenses || []) : [];

    // For bureau: include only [CGM] expenses, for client: exclude [CGM]
    data = data.filter(dep => {
      const desc = dep.description || dep.libelle || '';
      if (mode === 'bureau') return desc.includes('[CGM]');
      if (mode === 'client') return !desc.includes('[CGM]');
      return true;
    });
    return data;
  }

  const getCurrentDate = (filterType, { date, mois, annee, dateDebut, dateFin }) => {
    if ((filterType === 'jour' && dateDebut && dateFin) || filterType === 'periode') return `${dateDebut} - ${dateFin}`;
    if (filterType === 'mois' && mois && annee) return `${String(mois).padStart(2, '0')}/${annee}`;
    if (filterType === 'annee' && annee) return `${annee}`;
    const now = new Date();
    return formatDate(now.toISOString());
  };

  const getTotalMontant = (arr) => {
    // Pour les honoraires reçus, utiliser GREATEST(avance, montant) comme dans le backend
    // Pour les honoraires reçus, avance contient souvent le montant reçu
    return arr.reduce((t, h) => {
      const avanceValue = parseFloat(h.avance || 0);
      const montantValue = parseFloat(h.montant || 0);
      // Utiliser le maximum entre avance et montant (comme dans les routes backend)
      const amount = Math.max(avanceValue, montantValue);
      return t + amount;
    }, 0);
  };
  const getTotalDepenses = (arr) => arr.reduce((t, d) => t + parseFloat(d.montant || 0), 0);

  function handlePrint(ctx) {
    const { honoraires, depenses, filterType, date, mois, annee, dateDebut, dateFin, clientName, soldeReporte, mode } = ctx;
    const infoGauche = `
    Matricule fiscale: 1408941/H/A/P/000
    <br>Banque Zitouna Agence Ben Arous
    <br>RIB : 25047000000039870129
`;
    const infoDroit = `
    Membre de la compagnie des comptables de Tunisie.
    <br>62 Avenue de France, bureau N°3, 1er étage 2013 Ben Arous.
    <br>(+216) 79 410 028
    <br>contact@ccgm.com.tn
`;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Synthèse ${mode === 'bureau' ? 'CGM' : 'Client'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 12px; font-size: 11px; }
    .header { text-align: center; margin-bottom: 10px; }
    .logo-container img { height: 50px; width: auto; margin-bottom: 4px; }
    .header-infos { display: flex; justify-content: space-between; text-align: left; margin-top: 6px; font-size: 9px; line-height: 1.3; }
    .info-gauche { width: 48%; text-align: left; }
    .info-droit { width: 48%; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 4px 6px; }
    thead th { font-weight: bold; background: #f9f9f9; }
    .details-section { margin-top: 12px; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .footer-section { margin-top: 20px; }
    .footer-content { display: flex; justify-content: space-around; align-items: flex-end; border-top: 1px solid #333; padding-top: 12px; margin-top: 12px; }
    .signature-block { text-align: center; }
    .signature-block img { height: 70px; width: auto; object-fit: contain; }
    .signature-line { font-size: 11px; color: #333; margin-top: 4px; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo-container">
      <img src="${logoImage}" alt="Logo CGM" />
    </div>
    <div class="header-infos">
      <div class="info-gauche">${infoGauche}</div>
      <div class="info-droit">${infoDroit}</div>
    </div>
  </div>
  <hr>

  ${mode === 'client' ? `<div style="margin-bottom:10px; font-weight:bold; font-size: 14px;">Client: ${clientName || ''}</div>` : ''}

  <div class="details-section">
    <table>
      <thead>
        <tr><th>Date</th><th>Libellé</th><th>Client</th><th>Montant</th></tr>
      </thead>
      <tbody>
        ${honoraires.length > 0 ? honoraires.map(h => {
          // Pour les honoraires reçus, utiliser GREATEST(avance, montant) comme dans le backend
          const avanceValue = parseFloat(h.avance || 0);
          const montantValue = parseFloat(h.montant || 0);
          const montantAffiche = Math.max(avanceValue, montantValue);
          return `
          <tr>
            <td>${formatDate(h.date)}</td>
            <td>${h.libelle || '-'}</td>
            <td>${(h.client_nom || '') + ' ' + (h.client_prenom || '')}</td>
            <td>${formatMontant(montantAffiche)}</td>
          </tr>
        `;
        }).join('') : `<tr><td colspan="4" style="text-align:center;color:#666;font-style:italic;">Aucun honoraire reçu</td></tr>`}
      </tbody>
      <tfoot>
        <tr class="total-row"><td colspan="3">TOTAL HONORAIRES REÇUS</td><td>${formatMontant(getTotalMontant(honoraires))}</td></tr>
      </tfoot>
    </table>
  </div>

  ${depenses.length > 0 ? `
  <div class="details-section">
  <table>
    <thead><tr><th>Date</th><th>Libellé</th><th>Client</th><th>Montant</th></tr></thead>
    <tbody>
        ${depenses.map(d => {
            // Récupérer le nom du bénéficiaire selon la logique précédente
            const rawText = (d.description || d.libelle || '').toUpperCase();
            const isCgmDepense = rawText.includes('[CGM]') || rawText.includes('HONORAIRES REÇU');
            
            // Déterminer le nom du client/beneficiaire
            let clientName = '';
            if (isCgmDepense) {
                clientName = d.nom_beneficiaire || d.beneficiaire || d.client || '';
            } else {
                clientName = d.beneficiaire || d.client || '';
            }
            
            // Alternative: utiliser client_nom et client_prenom si disponibles
            const clientFullName = (d.client_nom || '') + ' ' + (d.client_prenom || '').trim();
            if (clientFullName.trim()) {
                clientName = clientFullName;
            }
            
            return `
                <tr>
                    <td>${formatDate(d.date)}</td>
                    <td>${(d.description || d.libelle || '-').replace(/^\[CGM\]\s*/, '').replace(/CGM\s*/, '')}</td>
                    <td>${clientName || '-'}</td>
                    <td>${formatMontant(d.montant)}</td>
                </tr>
            `;
        }).join('')}
    </tbody>
    <tfoot>
        <tr class="total-row"><td colspan="3">TOTAL DÉPENSES</td><td>${formatMontant(getTotalDepenses(depenses))}</td></tr>
    </tfoot>
</table>
  </div>
  ` : ''}

  <div class="details-section">
    <table>
      <thead><tr><th>Date</th><th>Total Honoraires Reçus</th><th>Total Dépenses</th><th>${mode === 'bureau' ? 'Reste CGM' : 'Reste'}</th></tr></thead>
      <tbody>
        <tr>
          <td>${getCurrentDate(filterType, { date, mois, annee, dateDebut, dateFin })}</td>
          <td>${formatMontant(getTotalMontant(honoraires))}</td>
          <td>${formatMontant(getTotalDepenses(depenses))}</td>
          <td>${formatMontant(getTotalMontant(honoraires) - getTotalDepenses(depenses))}</td>
        </tr>
        ${soldeReporte && soldeReporte.soldeReporte !== 0 ? `
        <tr><td colspan="3" style="text-align:right;font-weight:bold;">+ Solde reporté (${soldeReporte.anneePrecedente})</td><td>${formatMontant(soldeReporte.soldeReporte)}</td></tr>
        <tr class="total-row"><td colspan="3" style="text-align:right;font-weight:bold;">= ${mode === 'bureau' ? 'Reste CGM Final' : 'Reste Final'}</td><td>${formatMontant(getTotalMontant(honoraires) - getTotalDepenses(depenses) + (soldeReporte.soldeReporte || 0))}</td></tr>
        ` : ''}
      </tbody>
    </table>
  </div>

  <div class="footer-section">
    <div class="footer-content">
      <div class="signature-block"><img src="${cachet}" alt="Cachet et Signature" /><div class="signature-line">Cachet et Signature</div></div>
      <div class="signature-block"><div style="width:200px;height:60px;border-bottom:1px solid #000;margin:0 auto 5px;"></div><div class="signature-line">${mode === 'client' ? 'Signature Client' : 'Signature Bénéficiaire'}</div></div>
      <div class="signature-block"><div style="width:200px;height:60px;border-bottom:1px solid #000;margin:0 auto 5px;"></div><div class="signature-line">Signature Caissier</div></div>
    </div>
  </div>

</body>
</html>`;
    try {
      // Remplacer le contenu de la page actuelle pour éviter le blocage des popups
      document.open();
      document.write(printContent);
      document.close();
      window.onload = () => { window.print(); };
    } catch (_) {
      // Fallback: tenter l'ancienne méthode si le navigateur l'autorise
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(printContent);
        w.document.close();
        w.onload = () => { w.print(); w.close(); };
      }
    }
  }

  if (loading) return <div className="container py-5">Préparation de l'impression...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  return null;
}


