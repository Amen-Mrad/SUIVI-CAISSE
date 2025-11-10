import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatClientByYearPage() {
    const { id } = useParams(); // ID du client
    const navigate = useNavigate();
    
    // UI de filtrage (comme Honoraires/Dépenses)
    const [tab, setTab] = useState('annee'); // 'jour' | 'mois' | 'annee'
    const [jourMode, setJourMode] = useState('date'); // 'date' | 'periode'
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState(null);

    useEffect(() => {
        fetchClientData();
    }, [id]);


    const handleShowEtat = () => {
        // Déterminer le filterType et les paramètres selon la sélection
        let finalFilterType = tab;
        let finalDate = null;
        let finalDateDebut = null;
        let finalDateFin = null;
        let finalMois = null;
        let finalAnnee = null;

        if (tab === 'jour') {
            if (jourMode === 'date') {
                if (!selectedDate) {
                    alert('Veuillez sélectionner une date');
                    return;
                }
                finalDate = selectedDate;
            } else {
                // période
                if (!dateDebut || !dateFin) {
                    alert('Veuillez sélectionner une période (début et fin)');
                    return;
                }
                if (new Date(dateDebut) > new Date(dateFin)) {
                    alert('La date de début doit être antérieure à la date de fin');
                    return;
                }
                finalFilterType = 'periode';
                finalDateDebut = dateDebut;
                finalDateFin = dateFin;
            }
        } else if (tab === 'mois') {
            finalMois = selectedMonth;
            finalAnnee = selectedYear;
        } else if (tab === 'annee') {
            finalAnnee = selectedYear;
        }

        // Définir les variables globales pour le client spécifique
        window.currentEtatClientId = id;
        window.currentEtatType = 'client';
        
        // Stocker les paramètres pour le modal
        window.currentEtatFilterType = finalFilterType;
        window.currentEtatDate = finalDate;
        window.currentEtatDateDebut = finalDateDebut;
        window.currentEtatDateFin = finalDateFin;
        window.currentEtatMois = finalMois;
        window.currentEtatAnnee = finalAnnee;
        
        setShowModal(true);
    };

    const fetchClientData = async () => {
        try {
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();
            if (data.success) {
                setClient(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données client:', error);
        }
    };

    const handleBack = () => {
        navigate(`/client/${id}/charges`);
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <style jsx global>{`
                body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
                .etat-bureau-year-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
                /* Masquer l'ancien en-tête et le bloc d'informations */
                .etat-header { display: none; }
                .client-info { display: none; }
                .etat-header-old { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
                .etat-title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
                .etat-subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
                .modern-back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
                .modern-back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); color: white; text-decoration: none; }
                .year-selector-container { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; }
                .year-selector-title { color: #2c3e50; font-weight: 700; font-size: 1.4rem; margin-bottom: 1.5rem; text-align: center; }
                .year-input-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
                .input-label { color: #495057; font-weight: 600; font-size: 1.1rem; text-align: center; }
                .year-select { border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 20px; font-size: 1.1rem; transition: all 0.3s ease; background: #f8f9fa; text-align: center; }
                .year-select:focus { outline: none; border-color: #ffc107; background: white; box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1); }
                .show-btn { background: linear-gradient(45deg, #ffc107, #e0a800); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; min-width: 150px; }
                .show-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.6s; }
                .show-btn:hover::before { left: 100%; }
                .show-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255, 193, 7, 0.4); }
                .show-btn:disabled { opacity: 0.7; transform: none; }
                .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .info-card { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; padding: 1.5rem; border-left: 4px solid #ffc107; transition: all 0.3s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .info-card-icon { font-size: 2rem; color: #ffc107; margin-bottom: 1rem; }
                .info-card-title { color: #2c3e50; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .info-card-text { color: #6c757d; font-size: 0.9rem; line-height: 1.5; }
                .modern-spinner { width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #ffc107; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
                .client-info { background: rgba(102, 126, 234, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; text-align: center; }
                .client-info h5 { color: #667eea; margin-bottom: 1rem; }
                .client-info-item { margin-bottom: 0.5rem; font-weight: 500; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) { .etat-title { font-size: 2rem; } .etat-header, .year-selector-container { margin: 1rem; padding: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }
            `}</style>

            <div className="etat-bureau-year-page">
                <div className="container">
                    <div className="etat-header">
                        <h1 className="etat-title">
                            <i className="fas fa-chart-line me-3"></i>
                            État Client - Par Année
                        </h1>
                        <p className="etat-subtitle">
                            Consultez l'état du client pour une année complète
                        </p>
                        <button className="modern-back-btn" onClick={handleBack}>
                            <i className="fas fa-arrow-left"></i>
                            Retour
                        </button>
                    </div>

                    {/* Informations du client */}
                    {client && (
                        <div className="client-info">
                            <h5><i className="fas fa-user me-2"></i>Informations du client</h5>
                            <div className="client-info-item"><strong>Nom :</strong> {client.nom} {client.prenom}</div>
                            <div className="client-info-item"><strong>Téléphone :</strong> {client.telephone}</div>
                            <div className="client-info-item"><strong>Email :</strong> {client.email || 'Non renseigné'}</div>
                        </div>
                    )}

                    {/* Interface de filtrage */}
                    <div className="action-container" style={{maxWidth: '900px', margin: '0 auto 1rem auto', background: 'white', borderRadius: '16px', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #edf0f3', textAlign: 'center'}}>
                        <div style={{fontWeight:800, fontSize:'1.25rem', color:'#334155', marginBottom:'0.5rem'}}>Filtrer l'état client</div>
                        <div className="tabs" style={{display: 'inline-flex', background: '#f1f5f9', borderRadius: '999px', padding: '4px', margin: '0 auto 0.75rem auto'}}>
                            <button className={`tab-btn ${tab==='jour'?'active':''}`} style={{border: 'none', background: tab==='jour' ? '#0d6efd' : 'transparent', color: tab==='jour' ? '#fff' : '#334155', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer'}} onClick={()=>setTab('jour')}>Jour</button>
                            <button className={`tab-btn ${tab==='mois'?'active':''}`} style={{border: 'none', background: tab==='mois' ? '#0d6efd' : 'transparent', color: tab==='mois' ? '#fff' : '#334155', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer'}} onClick={()=>setTab('mois')}>Mois</button>
                            <button className={`tab-btn ${tab==='annee'?'active':''}`} style={{border: 'none', background: tab==='annee' ? '#0d6efd' : 'transparent', color: tab==='annee' ? '#fff' : '#334155', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, cursor: 'pointer'}} onClick={()=>setTab('annee')}>Année</button>
                        </div>
                        {tab === 'jour' && (
                            <div className="filter-row" style={{display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop:'0.25rem'}}>
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
                                        <label className="mb-0 ms-2 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>Date</label>
                                        <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}} />
                                    </>
                                ) : (
                                    <>
                                        <label className="mb-0 ms-2 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>De</label>
                                        <input type="date" value={dateDebut} onChange={(e)=>setDateDebut(e.target.value)} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}} />
                                        <label className="mb-0 ms-2 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>à</label>
                                        <input type="date" value={dateFin} onChange={(e)=>setDateFin(e.target.value)} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}} />
                                    </>
                                )}
                                <button className="btn-search" onClick={handleShowEtat} disabled={loading} style={{background: 'linear-gradient(45deg, #28a745, #20c997)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer'}}>Rechercher</button>
                            </div>
                        )}
                        {tab === 'mois' && (
                            <div className="filter-row" style={{display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop:'0.25rem'}}>
                                <label className="mb-0 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>Mois</label>
                                <select value={selectedMonth} onChange={(e)=>setSelectedMonth(parseInt(e.target.value))} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}}>
                                    {Array.from({length:12},(_,i)=>i+1).map(m=> (
                                        <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
                                    ))}
                                </select>
                                <label className="mb-0 ms-2 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>Année</label>
                                <select value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value))} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}}>
                                    {Array.from({length:11},(_,i)=> now.getFullYear()-5+i).map(y=> (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button className="btn-search" onClick={handleShowEtat} disabled={loading} style={{background: 'linear-gradient(45deg, #28a745, #20c997)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer'}}>Rechercher</button>
                            </div>
                        )}
                        {tab === 'annee' && (
                            <div className="filter-row" style={{display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop:'0.25rem'}}>
                                <label className="mb-0 me-1" style={{marginBottom: 0, color: '#2c3e50', fontWeight: 600}}>Année</label>
                                <select value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value))} style={{border: '1px solid #e2e6ea', borderRadius: '8px', padding: '6px 10px'}}>
                                    {Array.from({length:11},(_,i)=> now.getFullYear()-5+i).map(y=> (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button className="btn-search" onClick={handleShowEtat} disabled={loading} style={{background: 'linear-gradient(45deg, #28a745, #20c997)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer'}}>Rechercher</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <EtatCgmModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    type="client"
                    filterType={
                        tab === 'jour' && jourMode === 'date' ? 'jour' :
                        tab === 'jour' && jourMode === 'periode' ? 'periode' :
                        tab === 'mois' ? 'mois' :
                        tab === 'annee' ? 'annee' : null
                    }
                    date={tab === 'jour' && jourMode === 'date' ? selectedDate : null}
                    dateDebut={tab === 'jour' && jourMode === 'periode' ? dateDebut : null}
                    dateFin={tab === 'jour' && jourMode === 'periode' ? dateFin : null}
                    mois={tab === 'mois' ? selectedMonth : null}
                    annee={
                        tab === 'mois' ? selectedYear :
                        tab === 'annee' ? selectedYear : null
                    }
                />
            )}
        </>
    );
}