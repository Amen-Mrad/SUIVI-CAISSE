import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function AllDepensesPage() {
  const { id: clientId } = useParams();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  
  // Filtres
  const [tab, setTab] = useState('jour'); // 'jour' | 'mois' | 'annee'
  const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '';
      const params = new URLSearchParams();
      
      if (clientId) {
        params.append('client_id', clientId);
      }

      if (tab === 'jour') {
        if (jourMode === 'date') {
          params.append('date', selectedDate);
          url = '/api/depenses/par-client';
        } else {
          params.append('date_debut', dateDebut);
          params.append('date_fin', dateFin);
          url = '/api/depenses/par-periode';
        }
      } else if (tab === 'mois') {
        params.append('mois', String(selectedMonth).padStart(2, '0'));
        params.append('annee', String(selectedYear));
        url = '/api/depenses/par-client';
      } else if (tab === 'annee') {
        params.append('annee', String(selectedYear));
        url = '/api/depenses/par-client';
      }

      const r = await fetch(`${url}?${params.toString()}`);
      const d = await r.json();
      if (d && d.success) {
        const list = d.depenses || [];
        setResults(list);
        const t = list.reduce((s, dep) => s + parseFloat(dep.montant || 0), 0);
        setTotal(t);
      } else {
        setResults([]);
        setTotal(0);
        setError(d?.error || 'Erreur lors du chargement');
      }
    } catch (_) {
      setResults([]);
      setTotal(0);
      setError('Erreur réseau lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatMontant = (montant) => {
    const value = parseFloat(montant || 0);
    if (isNaN(value)) return '0,000 TND';
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
  };

  return (
    <>
      <style jsx global>{`
        body, html {
          background: rgb(187, 187, 187) !important;
          height: auto !important;
          overflow-x: hidden;
          overflow-y: auto;
        }
        
        .all-depenses-page { 
          background: transparent; 
          min-height: 100vh; 
          padding: 0.5rem 0; 
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
        
        .tabs { 
          display: inline-flex; 
          background: #f4f6f8; 
          border-radius: 8px; 
          padding: 4px; 
          margin: 0 auto 1rem auto; 
          border: 1px solid #d5dbe3;
        }
        
        .tab-btn { 
          border: none; 
          background: transparent; 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-weight: 600; 
          color: #495057;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .tab-btn:hover {
          background: rgba(11, 87, 150, 0.1);
        }
        
        .tab-btn.active { 
          background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%); 
          color: #fff; 
          box-shadow: 0 4px 10px rgba(11, 87, 150, 0.25); 
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
        
        .form-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .form-check-input {
          width: 18px;
          height: 18px;
          margin: 0;
          cursor: pointer;
          accent-color: #0b5796;
        }
        
        .form-check-label {
          margin: 0;
          cursor: pointer;
          font-size: 0.9rem;
          color: #2c3e50;
          font-weight: 500;
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
        
        .inline-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .inline-table tfoot td { 
          background: #0b5796; 
          color: #ffffff; 
          font-weight: 700; 
          border-top: 1px solid rgba(213, 219, 227, 0.8);
          border-right: 1px solid rgba(213, 219, 227, 0.8);
          padding: 0.7rem;
          font-size: 0.88rem;
        }
        
        .inline-table tfoot td:last-child {
          border-right: none;
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
        
        .alert-danger {
          background: linear-gradient(45deg, #f8d7da, #f5c6cb);
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          max-width: 1100px;
          margin: 0 auto 1rem auto;
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

      <div className="all-depenses-page">
        <div className="container">
          {/* Filtres */}
          <div className="action-container text-center">
            <div className="filter-title">Filtrer les dépenses client</div>
            <div className="tabs">
              <button className={`tab-btn ${tab==='jour'?'active':''}`} onClick={()=>setTab('jour')}>Jour</button>
              <button className={`tab-btn ${tab==='mois'?'active':''}`} onClick={()=>setTab('mois')}>Mois</button>
              <button className={`tab-btn ${tab==='annee'?'active':''}`} onClick={()=>setTab('annee')}>Année</button>
            </div>
            {tab === 'jour' && (
              <div className="filter-row" style={{marginTop:'0.25rem'}}>
                <div className="form-check me-2">
                  <input className="form-check-input" type="radio" id="jourDate" name="jourMode" checked={jourMode==='date'} onChange={()=>setJourMode('date')} />
                  <label className="form-check-label" htmlFor="jourDate">Par date</label>
                </div>
                <div className="form-check me-2">
                  <input className="form-check-input" type="radio" id="jourPeriode" name="jourMode" checked={jourMode==='periode'} onChange={()=>setJourMode('periode')} />
                  <label className="form-check-label" htmlFor="jourPeriode">Par période</label>
                </div>
                {jourMode==='date' ? (
                  <>
                    <label className="mb-0 ms-2 me-1">Date</label>
                    <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
                  </>
                ) : (
                  <>
                    <label className="mb-0 ms-2 me-1">De</label>
                    <input type="date" value={dateDebut} onChange={(e)=>setDateDebut(e.target.value)} />
                    <label className="mb-0 ms-2 me-1">à</label>
                    <input type="date" value={dateFin} onChange={(e)=>setDateFin(e.target.value)} />
                  </>
                )}
                <button className="btn-search" onClick={handleSearch} disabled={loading}>Rechercher</button>
              </div>
            )}
            {tab === 'mois' && (
              <div className="filter-row" style={{marginTop:'0.25rem'}}>
                <label className="mb-0 me-1">Mois</label>
                <select value={selectedMonth} onChange={(e)=>setSelectedMonth(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=>i+1).map(m=> (
                    <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
                  ))}
                </select>
                <label className="mb-0 ms-2 me-1">Année</label>
                <select value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value))}>
                  {Array.from({length:11},(_,i)=> now.getFullYear()-5+i).map(y=> (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button className="btn-search" onClick={handleSearch} disabled={loading}>Rechercher</button>
              </div>
            )}
            {tab === 'annee' && (
              <div className="filter-row" style={{marginTop:'0.25rem'}}>
                <label className="mb-0 me-1">Année</label>
                <select value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value))}>
                  {Array.from({length:11},(_,i)=> now.getFullYear()-5+i).map(y=> (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button className="btn-search" onClick={handleSearch} disabled={loading}>Rechercher</button>
              </div>
            )}
          </div>

          {/* Résultats */}
          {error && (
            <div className="alert alert-danger text-center" style={{maxWidth:'800px', margin:'0 auto 0.75rem auto'}}>{error}</div>
          )}
          {loading && (
            <div className="text-center my-3"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Chargement...</span></div></div>
          )}
          {!loading && results && results.length > 0 && (
            <div className="inline-results-card" style={{maxWidth:'1000px', margin:'0 auto'}}>
              <div className="table-responsive">
                <table className="inline-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Libellé</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((dep, idx) => {
                      const clientName = dep.client || dep.beneficiaire || '';
                      let libelleText = dep.libelle || dep.description || '-';
                      // Remplacer [CGM] ou [CGM PAYÉ] par [PAYÉ PAR CGM] dans l'affichage
                      libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '[PAYÉ PAR CGM] ').replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');
                      const rawText = (dep.libelle || dep.description || '').toUpperCase();
                      const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
                      const montantStyle = { color: isHonoraire ? '#198754' : '#dc3545', fontWeight: 700 };
                      return (
                        <tr key={idx}>
                          <td>{formatDate(dep.date)}</td>
                          <td>{clientName}</td>
                          <td>{libelleText}</td>
                          <td style={montantStyle}>{formatMontant(dep.montant)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">TOTAL</td>
                      <td>{total.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
