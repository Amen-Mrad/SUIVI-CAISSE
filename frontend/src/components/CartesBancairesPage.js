import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function CartesBancairesPage() {
    const { user } = useAuth();
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCartesBancaires();
    }, []);

    const fetchCartesBancaires = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/charges-mensuelles/cartes-bancaires');
            const data = await response.json();
            if (data.success) {
                setCharges(data.charges || []);
            } else {
                setError(data.error || 'Erreur lors du chargement des opérations carte bancaire');
            }
        } catch (err) {
            setError('Erreur réseau lors du chargement');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatMontant = (montant) => {
        const v = parseFloat(montant || 0);
        return v.toLocaleString('fr-FR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: rgb(187, 187, 187);
                }
                
                .cartes-bancaires-page {
                    background: transparent;
                    min-height: 100vh;
                    padding: 0.5rem 0;
                }
                
                .cartes-header {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 1rem 1.25rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    margin-bottom: 0.75rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    max-width: 1100px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .cartes-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                }
                
                .cartes-title {
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                
                .cartes-subtitle {
                    color: #6c757d;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .cartes-table-container {
                    background: #ffffff;
                    border-radius: 8px;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    padding: 0.75rem 1rem;
                    overflow-x: auto;
                    position: relative;
                    max-width: 1100px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .cartes-table-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(135deg, #0b5796 0%, #0d6efd 100%);
                }
                
                .inline-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid rgba(213, 219, 227, 0.8);
                    border-radius: 6px;
                    overflow: hidden;
                }
                
                .inline-table thead th {
                    background: #0b5796;
                    color: #ffffff;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.2);
                    font-weight: 700;
                    padding: 0.6rem 0.5rem;
                    text-align: left;
                    font-size: 0.85rem;
                }
                
                .inline-table thead th:last-child {
                    border-right: none;
                }
                
                .inline-table th, .inline-table td {
                    padding: 0.6rem 0.5rem;
                    border-bottom: 1px solid rgba(213, 219, 227, 0.5);
                    border-right: 1px solid rgba(213, 219, 227, 0.5);
                    text-align: left;
                    font-size: 0.85rem;
                }
                
                .inline-table td:last-child {
                    border-right: none;
                }
                
                .inline-table tbody tr {
                    background: transparent;
                }
                
                .inline-table tbody tr:nth-child(even) {
                    background: rgba(248, 249, 250, 0.5);
                }
                
                .inline-table tbody tr:hover {
                    background: rgba(11, 87, 150, 0.05);
                }
                
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .inline-table tfoot td {
                    background: #0b5796;
                    color: #ffffff;
                    font-weight: 700;
                    border-top: 2px solid rgba(255, 255, 255, 0.2);
                    border-right: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 0.6rem 0.5rem;
                }
                
                .inline-table tfoot td:last-child {
                    border-right: none;
                }
                
                .loading-spinner {
                    text-align: center;
                    padding: 2rem;
                }
                
                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    margin: 1rem 0;
                    text-align: center;
                    font-size: 0.85rem;
                    border-left: 3px solid #dc3545;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: #6c757d;
                }
                
                .empty-state i {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                @media (max-width: 768px) {
                    .cartes-header,
                    .cartes-table-container {
                        margin: 0.5rem;
                        padding: 0.75rem;
                    }
                    
                    .cartes-title {
                        font-size: 1.2rem;
                    }
                }
            `}</style>

            <div className="cartes-bancaires-page">
                <div className="container">
                    <div className="cartes-header">
                        <h1 className="cartes-title">
                            <i className="fas fa-credit-card me-3"></i>
                            Suivi des Opérations Carte Bancaire
                        </h1>
                        <p className="cartes-subtitle">
                            Liste de toutes les charges payées par carte bancaire
                        </p>
                    </div>

                    <div className="cartes-table-container">
                        {loading ? (
                            <div className="loading-spinner">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {error}
                            </div>
                        ) : charges.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <p>Aucune opération carte bancaire enregistrée</p>
                            </div>
                        ) : (
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
                                        {charges.map((charge) => (
                                            <tr key={charge.id}>
                                                <td>{formatDate(charge.date || charge.date_creation)}</td>
                                                <td>
                                                    {charge.client_nom || charge.client_prenom 
                                                        ? `${charge.client_prenom || ''} ${charge.client_nom || ''}`.trim()
                                                        : charge.client_username || '-'}
                                                </td>
                                                <td>{charge.libelle || '-'}</td>
                                                <td style={{ color: '#198754', fontWeight: 700 }}>
                                                    {formatMontant(charge.montant || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3">TOTAL</td>
                                            <td style={{ color: '#ffffff', fontWeight: 700 }}>{formatMontant(charges.reduce((sum, c) => sum + parseFloat(c.montant || 0), 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

