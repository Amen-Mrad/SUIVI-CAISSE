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
          height: auto !important;
          overflow-x: hidden;
          overflow-y: auto;
        }
        
        .all-depenses-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 0.75rem 0; }
        .action-container { background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #edf0f3; max-width: 900px; margin: 0 auto 0.75rem auto; }
        .tabs { display: inline-flex; background: #f1f5f9; border-radius: 999px; padding: 4px; margin: 0 auto 0.75rem auto; }
        .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 999px; font-weight: 700; color: #334155; cursor: pointer; }
        .tab-btn.active { background: #0d6efd; color: #fff; box-shadow: 0 4px 10px rgba(13,110,253,.3); }
        .filter-row { display: flex; gap: 0.5rem; align-items: center; justify-content: center; flex-wrap: wrap; }
        .filter-row label { margin-bottom: 0; color: #2c3e50; font-weight: 600; }
        .filter-row input[type="date"], .filter-row select { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
        .btn-search { background: linear-gradient(45deg, #28a745, #20c997); color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-weight: 700; cursor: pointer; }
        .btn-search:hover { background: linear-gradient(45deg, #218838, #1e7e34); }
        .btn-search:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .inline-results-card { background: white; border-radius: 12px; border: 1px solid #edf0f3; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 1rem; }
        .inline-table { width: 100%; border-collapse: collapse; }
        .inline-table thead th { background: #FFB5FC; color: #2c3e50; border-bottom: 2px solid #e6ebf1; font-weight: 700; }
        .inline-table th, .inline-table td { padding: 0.6rem; border-bottom: 1px solid #eef2f7; text-align: left; }
        .inline-table tbody tr:hover { background: #fafcff; }
        .inline-table tfoot td { background: #FFB5FC; color: #2c3e50; font-weight: 700; border-top: 2px solid #e6ebf1; }
        
        .modern-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #28a745;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .action-container {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="all-depenses-page">
        <div className="container">
          {/* Filtres */}
          <div className="action-container text-center">
            <div style={{fontWeight:800, fontSize:'1.25rem', color:'#334155', marginBottom:'0.5rem'}}>Filtrer les dépenses client</div>
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
                      libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '');
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
