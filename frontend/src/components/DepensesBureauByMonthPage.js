import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DepensesBureauByMonthPage() {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [depenses, setDepenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Définir le mois actuel par défaut
        const currentMonth = new Date().getMonth() + 1;
        setSelectedMonth(currentMonth.toString().padStart(2, '0'));
    }, []);

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleShowDepenses = async () => {
        if (!selectedMonth) {
            alert('Veuillez sélectionner un mois');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Calculer les dates de début et fin du mois
            const dateDebut = `${selectedYear}-${selectedMonth}-01`;
            const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
            const dateFin = `${selectedYear}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

            const url = `/api/depenses/bureau/par-periode?date_debut=${dateDebut}&date_fin=${dateFin}`;
            const response = await fetch(url);
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

    const handleDeleteDepense = async (depense) => {
        try {
            if (!window.confirm(`Supprimer la dépense de ${depense.beneficiaire || depense.client} (${formatMontant(depense.montant)}) ?`)) {
                return;
            }

            const response = await fetch(`/api/depenses/bureau/${depense.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                // Recharger les dépenses
                handleShowDepenses();
                // Notifier la mise à jour de la caisse live
                try { window.dispatchEvent(new CustomEvent('caisse-updated')); } catch (_) {}
                alert('Dépense supprimée avec succès');
            } else {
                alert('Erreur lors de la suppression: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // Filtrer les dépenses selon la recherche
    const filteredDepenses = depenses.filter(depense => {
        if (!searchQuery.trim()) return true;
        const beneficiaire = (depense.beneficiaire || depense.client || '').toLowerCase();
        return beneficiaire.includes(searchQuery.toLowerCase());
    });

    const months = [
        { value: '01', label: 'Janvier' },
        { value: '02', label: 'Février' },
        { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' },
        { value: '05', label: 'Mai' },
        { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' },
        { value: '08', label: 'Août' },
        { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' },
        { value: '12', label: 'Décembre' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .depenses-bureau-month-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 0.75rem 0; }
                
                .depenses-header { display: none; }
                
                .depenses-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .depenses-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-bottom: 2rem;
                }
                
                .modern-back-btn {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    border: none;
                    color: white;
                    border-radius: 12px;
                    padding: 10px 20px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .modern-back-btn:hover {
                    background: linear-gradient(45deg, #5a6268, #343a40);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                    color: white;
                    text-decoration: none;
                }
                
                .month-selector-container { background: white; border-radius: 14px; padding: 1rem; box-shadow: 0 6px 16px rgba(0,0,0,0.06); border: 1px solid #edf0f3; backdrop-filter: none; margin-bottom: 0.75rem; max-width: 700px; margin-left: auto; margin-right: auto; }
                
                .month-selector-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .month-input-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .input-label {
                    color: #495057;
                    font-weight: 600;
                    font-size: 1rem;
                }
                
                .month-select,
                .year-select {
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 12px 16px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .month-select:focus,
                .year-select:focus {
                    outline: none;
                    border-color: #dc3545;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
                }
                
                .show-btn {
                    background: linear-gradient(45deg, #dc3545, #c82333);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 150px;
                }
                
                .show-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s;
                }
                
                .show-btn:hover::before {
                    left: 100%;
                }
                
                .show-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(220, 53, 69, 0.4);
                }
                
                .show-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .info-cards { display: none; }

                .filter-bar { background: white; border: 1px solid #edf0f3; border-radius: 10px; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; gap: 0.5rem; align-items: center; justify-content: center; max-width: 700px; margin: 0 auto 0.75rem auto; }
                .filter-bar select { border: 1px solid #e2e6ea; border-radius: 8px; padding: 6px 10px; }
                .filter-bar .btn-search { background: #0d6efd; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-weight: 600; }

                .inline-results-card { background: white; border-radius: 12px; border: 1px solid #edf0f3; box-shadow: 0 6px 16px rgba(0,0,0,0.06); padding: 1rem; }
                .inline-table { width: 100%; border-collapse: collapse; }
                .inline-table thead th { background: #FFB5FC; color: #2c3e50; border-bottom: 2px solid #e6ebf1; font-weight: 700; }
                .inline-table th, .inline-table td { padding: 0.6rem; border-bottom: 1px solid #eef2f7; text-align: left; }
                .inline-table tbody tr:hover { background: #fafcff; }
                .inline-table tfoot td { background: #FFB5FC; color: #2c3e50; font-weight: 700; border-top: 2px solid #e6ebf1; }
                
                .info-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #dc3545;
                    transition: all 0.3s ease;
                }
                
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .info-card-icon {
                    font-size: 2rem;
                    color: #dc3545;
                    margin-bottom: 1rem;
                }
                
                .info-card-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                }
                
                .info-card-text {
                    color: #6c757d;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #dc3545;
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
                    .depenses-title {
                        font-size: 2rem;
                    }
                    
                    .month-input-group {
                        grid-template-columns: 1fr;
                    }
                    
                    .depenses-header,
                    .month-selector-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .info-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="depenses-bureau-month-page">
                <div className="container">
                    <div className="filter-bar">
                        <label className="mb-0 me-1"><i className="fas fa-calendar-alt me-1"></i>Mois</label>
                        <select value={selectedMonth} onChange={handleMonthChange}>
                            {months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                        <label className="mb-0 ms-3 me-1">Année</label>
                        <select value={selectedYear} onChange={handleYearChange}>
                            {years.map(y => (<option key={y} value={y}>{y}</option>))}
                        </select>
                        <button className="btn-search" onClick={handleShowDepenses}>Rechercher</button>
                    </div>

                    {loading && (
                        <div className="text-center my-3"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Chargement...</span></div></div>
                    )}

                    {!loading && filteredDepenses.length > 0 && (
                        <div className="inline-results-card">
                            <div className="table-responsive">
                                <table className="inline-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Bénéficiaire</th>
                                            <th>Libellé</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDepenses.map((depense, index) => {
                                            const rawText = (depense.libelle || depense.description || '').toUpperCase();
                                            const isCgmDepense = rawText.includes('[CGM]') || rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES REC') || rawText.includes('AVANCE DE DECLARATION');
                                            const clientName = isCgmDepense ? 'CGM' : (depense.beneficiaire || depense.client);

                                            const originalClientName = depense.beneficiaire || depense.client;
                                            let baseLibelle = depense.libelle || depense.description || '-';
                                            // Remplacer [CGM] par [PAYÉ PAR CGM] dans l'affichage
                                            baseLibelle = baseLibelle.replace(/^\[CGM\]\s*/, '[PAYÉ PAR CGM] ');
                                            const libelleText = originalClientName ? `${baseLibelle} (${originalClientName})` : baseLibelle;

                                            const isHonoraire = rawText.includes('HONORAIRES REÇU') || rawText.includes('HONORAIRES RECU') || rawText.includes('AVANCE DE DECLARATION');
        
                                            return (
                                                <tr key={index}>
                                                    <td>{formatDate(depense.date)}</td>
                                                    <td>{clientName}</td>
                                                    <td>{libelleText}</td>
                                                    <td style={{ color: isHonoraire ? '#198754' : '#dc3545', fontWeight: 700 }}>{formatMontant(depense.montant)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3">TOTAL</td>
                                            <td>{filteredDepenses.reduce((s,d)=> s + parseFloat(d.montant||0),0).toLocaleString('fr-FR', {minimumFractionDigits:3, maximumFractionDigits:3})} TND</td>
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
