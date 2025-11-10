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
                }
                
                .cartes-bancaires-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                .cartes-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .cartes-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                
                .cartes-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                    font-weight: 500;
                }
                
                .cartes-table-container {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #000;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
                    padding: 1rem;
                    overflow-x: auto;
                }
                
                .inline-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid #000;
                }
                
                .inline-table thead th {
                    background: #FFB5FC;
                    color: #2c3e50;
                    border-bottom: 2px solid #000;
                    border-right: 1px solid #000;
                    font-weight: 700;
                    padding: 0.6rem;
                    text-align: left;
                }
                
                .inline-table thead th:last-child {
                    border-right: none;
                }
                
                .inline-table th, .inline-table td {
                    padding: 0.6rem;
                    border-bottom: 1px solid #000;
                    border-right: 1px solid #000;
                    text-align: left;
                }
                
                .inline-table td:last-child {
                    border-right: none;
                }
                
                .inline-table tbody tr:hover {
                    background: #fafcff;
                }
                
                .inline-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .inline-table tfoot td {
                    background: #FFB5FC;
                    color: #2c3e50;
                    font-weight: 700;
                    border-top: 2px solid #000;
                    border-right: 1px solid #000;
                    padding: 0.6rem;
                }
                
                .inline-table tfoot td:last-child {
                    border-right: none;
                }
                
                .loading-spinner {
                    text-align: center;
                    padding: 3rem;
                }
                
                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 1rem;
                    border-radius: 10px;
                    margin: 1rem 0;
                    text-align: center;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #6c757d;
                }
                
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
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
                                            <td>{formatMontant(charges.reduce((sum, c) => sum + parseFloat(c.montant || 0), 0))}</td>
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

