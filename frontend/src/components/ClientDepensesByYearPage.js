import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ClientDepensesByYearPage() {
    const { id } = useParams();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clientInfo, setClientInfo] = useState(null);
    const [depenses, setDepenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClientInfo();
    }, [id]);

    const fetchClientInfo = async () => {
        try {
            const response = await fetch(`/api/clients/${id}`);
            const data = await response.json();
            if (data.success) {
                setClientInfo(data.client);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations du client:', error);
        }
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowDepenses = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('client_id', id);
            params.append('annee', selectedYear);

            const response = await fetch(`/api/depenses/par-client?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setDepenses(data.depenses || []);
                setShowTable(true);
            } else {
                setError(data.error || 'Erreur lors du chargement des dépenses');
            }
        } catch (err) {
            setError('Erreur réseau lors du chargement des dépenses');
        } finally {
            setLoading(false);
        }
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    // Fonctions utilitaires
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const formatMontant = (montant) => {
        const value = parseFloat(montant || 0);
        if (isNaN(value)) return '0,000 TND';
        return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
    };

    const handleReturnToCharge = async (depense) => {
        try {
            if (!window.confirm(`Retirer la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) des dépenses client ?`)) {
                return;
            }

            setLoading(true);
            setError('');

            const deleteRes = await fetch(`/api/depenses/${depense.id}`, { method: 'DELETE' });
            const deleteData = await deleteRes.json();
            if (!deleteRes.ok || !deleteData.success) {
                throw new Error(deleteData.error || 'Erreur lors de la suppression de la dépense');
            }

            // Rafraîchir la liste
            await handleShowDepenses();
            alert('Dépense retirée des dépenses client. Le bouton Client redevient disponible.');
        } catch (err) {
            setError(err.message || 'Erreur lors du retrait de la dépense');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les dépenses selon la recherche
    const filteredDepenses = depenses.filter(depense => {
        if (!searchQuery.trim()) return true;
        const beneficiaire = (depense.beneficiaire || depense.client || '').toLowerCase();
        return beneficiaire.includes(searchQuery.toLowerCase());
    });


    return (
        <>
            <style jsx global>{`
                body, html { 
                    height: auto !important; 
                    overflow-x: hidden; 
                    overflow-y: auto; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .client-depenses-year-page { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
                    background-size: 400% 400%;
                    animation: gradientShift 15s ease infinite;
                    min-height: 100vh; 
                    padding: 2rem 0;
                    position: relative;
                    overflow: hidden;
                }
                
                .client-depenses-year-page::before {
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
                
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .depenses-header { 
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
                
                .depenses-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe);
                    background-size: 200% 100%;
                    animation: shimmer 3s ease-in-out infinite;
                }
                
                @keyframes slideInDown {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                .depenses-title { 
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
                
                .depenses-subtitle { 
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
                    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(30, 136, 229, 0.05));
                    backdrop-filter: blur(10px);
                    border-radius: 20px; 
                    padding: 2rem; 
                    margin-bottom: 2rem; 
                    border: 1px solid rgba(33, 150, 243, 0.2);
                    box-shadow: 0 10px 25px rgba(33, 150, 243, 0.1);
                    animation: slideInUp 0.8s ease-out 0.2s both;
                    position: relative;
                    overflow: hidden;
                }
                
                .client-info-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(180deg, #2196f3, #1976d2);
                }
                
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .client-info-title { 
                    color: #1976d2; 
                    font-weight: 800; 
                    font-size: 1.4rem; 
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .client-info-text { 
                    color: #424242; 
                    font-size: 1.1rem; 
                    margin-bottom: 0.8rem;
                    font-weight: 500;
                }
                
                .year-selector-container { 
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 25px; 
                    padding: 3rem; 
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
                    margin-bottom: 2rem; 
                    max-width: 600px; 
                    margin-left: auto; 
                    margin-right: auto;
                    animation: slideInUp 0.8s ease-out 0.4s both;
                    position: relative;
                    overflow: hidden;
                }
                
                .year-selector-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #2196f3, #1976d2, #1565c0);
                    background-size: 200% 100%;
                    animation: shimmer 3s ease-in-out infinite;
                }
                
                .year-selector-title { 
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
                
                .year-input-group { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1.5rem; 
                    margin-bottom: 2.5rem; 
                }
                
                .input-label { 
                    color: #495057; 
                    font-weight: 700; 
                    font-size: 1.2rem; 
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .year-select { 
                    border: 2px solid #e9ecef; 
                    border-radius: 20px; 
                    padding: 15px 25px; 
                    font-size: 1.2rem; 
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                    background: #f8f9fa; 
                    text-align: center;
                    font-weight: 600;
                    color: #495057;
                    position: relative;
                }
                
                .year-select:focus { 
                    outline: none; 
                    border-color: #2196f3; 
                    background: white; 
                    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1), 0 10px 25px rgba(33, 150, 243, 0.2);
                    transform: translateY(-2px);
                }
                
                .year-select:hover {
                    border-color: #2196f3;
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.1);
                }
                
                .show-btn { 
                    background: linear-gradient(45deg, #2196f3, #1976d2, #1565c0);
                    border: none; 
                    color: white; 
                    border-radius: 20px; 
                    padding: 15px 30px; 
                    font-weight: 700; 
                    font-size: 1.1rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                    position: relative; 
                    overflow: hidden; 
                    min-width: 200px;
                    box-shadow: 0 10px 25px rgba(33, 150, 243, 0.3);
                }
                
                .show-btn::before { 
                    content: ''; 
                    position: absolute; 
                    top: 0; 
                    left: -100%; 
                    width: 100%; 
                    height: 100%; 
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent); 
                    transition: left 0.8s; 
                }
                
                .show-btn:hover::before { 
                    left: 100%; 
                }
                
                .show-btn:hover { 
                    transform: translateY(-4px) scale(1.05); 
                    box-shadow: 0 20px 40px rgba(33, 150, 243, 0.4);
                    background: linear-gradient(45deg, #1976d2, #1565c0, #0d47a1);
                }
                
                .show-btn:disabled { 
                    opacity: 0.7; 
                    transform: none;
                    cursor: not-allowed;
                }
                
                .info-cards { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                    gap: 2rem; 
                    margin-bottom: 2rem;
                }
                
                .info-card { 
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 20px; 
                    padding: 2rem; 
                    border: 1px solid rgba(33, 150, 243, 0.1);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    animation: slideInUp 0.8s ease-out both;
                }
                
                .info-card:nth-child(1) { animation-delay: 0.1s; }
                .info-card:nth-child(2) { animation-delay: 0.2s; }
                .info-card:nth-child(3) { animation-delay: 0.3s; }
                
                .info-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(180deg, #2196f3, #1976d2);
                    transform: scaleY(0);
                    transition: transform 0.3s ease;
                }
                
                .info-card:hover::before {
                    transform: scaleY(1);
                }
                
                .info-card:hover { 
                    transform: translateY(-8px) scale(1.02); 
                    box-shadow: 0 20px 40px rgba(33, 150, 243, 0.15);
                    background: rgba(255, 255, 255, 0.95);
                }
                
                .info-card-icon { 
                    font-size: 2.5rem; 
                    color: #2196f3; 
                    margin-bottom: 1.5rem;
                    animation: iconFloat 3s ease-in-out infinite;
                }
                
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .info-card-title { 
                    color: #2c3e50; 
                    font-weight: 800; 
                    font-size: 1.3rem; 
                    margin-bottom: 1rem;
                }
                
                .info-card-text { 
                    color: #6c757d; 
                    font-size: 1rem; 
                    line-height: 1.6;
                    font-weight: 500;
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
                @media (max-width: 768px) { 
                    .depenses-title { font-size: 2.2rem; } 
                    .depenses-header, .year-selector-container { 
                        margin: 1rem; 
                        padding: 2rem; 
                    } 
                    .info-cards { 
                        grid-template-columns: 1fr; 
                        gap: 1.5rem;
                    }
                    .client-depenses-year-page {
                        padding: 1rem 0;
                    }
                }
                
                @media (max-width: 480px) {
                    .depenses-title { font-size: 1.8rem; }
                    .depenses-header, .year-selector-container {
                        padding: 1.5rem;
                    }
                    .info-card {
                        padding: 1.5rem;
                    }
                }
            `}</style>

            <div className="client-depenses-year-page">
                <div className="container">
                    <div className="depenses-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="depenses-title"><i className="fas fa-calendar me-3"></i>Dépenses Client - Par Année</h1>
                                <p className="depenses-subtitle">Consultez les dépenses du client pour une année complète</p>
                            </div>
                            <Link to={`/client/${id}`} className="modern-back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
                        </div>
                    </div>

                    {clientInfo && (
                        <div className="client-info-card">
                            <div className="client-info-title"><i className="fas fa-user me-2"></i>Informations du client</div>
                            <div className="client-info-text"><strong>Nom :</strong> {clientInfo.nom} {clientInfo.prenom}</div>
                            <div className="client-info-text"><strong>Téléphone :</strong> {clientInfo.telephone}</div>
                            <div className="client-info-text"><strong>Email :</strong> {clientInfo.email}</div>
                        </div>
                    )}

                    <div className="info-cards">
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-calendar-year"></i></div>
                            <div className="info-card-title">Vue annuelle</div>
                            <div className="info-card-text">Consultez toutes les dépenses de ce client au cours d'une année complète.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-user"></i></div>
                            <div className="info-card-title">Dépenses client</div>
                            <div className="info-card-text">Visualisez toutes les dépenses spécifiques à ce client pour l'année sélectionnée.</div>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon"><i className="fas fa-chart-pie"></i></div>
                            <div className="info-card-title">Analyse complète</div>
                            <div className="info-card-text">Analysez les tendances et performances de ce client sur toute l'année.</div>
                        </div>
                    </div>

                    <div className="year-selector-container">
                        <h5 className="year-selector-title"><i className="fas fa-calendar me-2"></i>Sélectionner une année</h5>

                        <div className="year-input-group">
                            <label className="input-label"><i className="fas fa-calendar-year me-2"></i>Année :</label>
                            <select className="year-select" value={selectedYear} onChange={handleYearChange}>
                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        <div className="text-center">
                            <button className="show-btn" onClick={handleShowDepenses} disabled={loading}>
                                {loading ? (<><div className="modern-spinner"></div>Chargement...</>) : (<><i className="fas fa-eye me-2"></i>Afficher les Dépenses</>)}
                            </button>
                        </div>
                    </div>
                </div>

                {showTable && (
                    <div className="container mt-4">
                        <div className="card" style={{ borderRadius: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
                            <div className="card-header" style={{
                                background: 'linear-gradient(135deg, #6f42c1 0%, #007bff 100%)',
                                color: 'white',
                                borderRadius: '20px 20px 0 0',
                                border: 'none'
                            }}>
                                <h4 className="mb-0">
                                    <i className="fas fa-table me-2"></i>
                                    Dépenses du client - {selectedYear}
                                </h4>
                            </div>
                            <div className="card-body">
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        {error}
                                    </div>
                                )}

                                {/* Barre de recherche */}
                                <div className="mb-3">
                                    <label htmlFor="beneficiaireSearch" className="form-label">
                                        <i className="fas fa-search me-1"></i>
                                        Rechercher par client
                                    </label>
                                    <input
                                        type="text"
                                        id="beneficiaireSearch"
                                        className="form-control"
                                        placeholder="Tapez la première lettre du client..."
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
                                                    const clientName = depense.client || depense.beneficiaire;
                                                    let libelleText = depense.libelle || depense.description || '-';
                                                    // Supprimer le préfixe [CGM PAYÉ] du libellé
                                                    libelleText = libelleText.replace(/^\[CGM PAYÉ\]\s*/, '');

                                                    // Déterminer la couleur du montant selon le type de dépense
                                                    const rawText = (depense.libelle || depense.description || '').toUpperCase();
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
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleReturnToCharge(depense); }}
                                                                    title="Retour au charge"
                                                                    style={{ minWidth: '120px' }}
                                                                >
                                                                    <i className="fas fa-undo me-1"></i> Retour au charge
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">
                                        {searchQuery.trim() ?
                                            `Aucune dépense trouvée pour "${searchQuery}".` :
                                            'Aucune dépense trouvée pour cette année.'
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
