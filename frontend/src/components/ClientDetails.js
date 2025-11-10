import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ClientDetails() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [charges, setCharges] = useState([]);
    const [newCharge, setNewCharge] = useState({
        mois: '',
        annee: new Date().getFullYear(),
        montant_charge: '',
        avance: ''
    });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        async function fetchClient() {
            setError('');
            setLoading(true);
            try {
                const res = await fetch(`/api/clients/${id}`);
                const data = await res.json();
                if (data && data.client) {
                    setClient(data.client);
                    // Charger automatiquement les charges du client
                    fetchCharges();
                } else {
                    setError('Client introuvable');
                }
            } catch (err) {
                setError('Erreur lors du chargement');
            } finally {
                setLoading(false);
            }
        }
        fetchClient();
    }, [id]);

    const handleAddCharge = async (e) => {
        e.preventDefault();
        setAdding(true);
        setError('');

        try {
            const res = await fetch('/api/charges-mensuelles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: id,
                    mois: newCharge.mois,
                    annee: newCharge.annee,
                    montant_charge: parseFloat(newCharge.montant_charge),
                    avance: parseFloat(newCharge.avance) || 0
                })
            });

            const data = await res.json();
            if (data.success) {
                // Réinitialiser le formulaire
                setNewCharge({
                    mois: '',
                    annee: new Date().getFullYear(),
                    montant_charge: '',
                    avance: ''
                });
                setShowAddForm(false);
                // Recharger les charges
                fetchCharges();
                alert('Charge ajoutée avec succès!');
            } else {
                setError(data.error || 'Erreur lors de l\'ajout');
            }
        } catch (err) {
            setError('Erreur lors de l\'ajout');
        } finally {
            setAdding(false);
        }
    };

    const fetchCharges = async () => {
        try {
            const res = await fetch(`/api/charges-mensuelles/client/${id}?annee=2023`);
            const data = await res.json();
            if (data.success) {
                setCharges(data.charges);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des charges:', err);
        }
    };

    if (loading) return <div className="container mt-4">Chargement...</div>;
    if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
    if (!client) return null;

    return (
        <>
            <style jsx>{`
                .modern-client-details {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 2rem 0;
                }
                
                .modern-client-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .modern-client-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .modern-client-subtitle {
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
                
                .modern-client-info {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .modern-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }
                
                .modern-info-item {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border-left: 4px solid #667eea;
                    transition: all 0.3s ease;
                }
                
                .modern-info-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }
                
                .modern-info-label {
                    color: #6c757d;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .modern-info-value {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                
                .modern-add-btn {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    border: none;
                    color: white;
                    border-radius: 15px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-add-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s;
                }
                
                .modern-add-btn:hover::before {
                    left: 100%;
                }
                
                .modern-add-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.4);
                }
                
                .modern-form-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-bottom: 2rem;
                }
                
                .modern-form-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .modern-form-group {
                    margin-bottom: 1.5rem;
                }
                
                .modern-form-label {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                
                .modern-form-input,
                .modern-form-select {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .modern-form-input:focus,
                .modern-form-select:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .modern-form-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                }
                
                .modern-form-btn {
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    min-width: 120px;
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-form-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .modern-form-btn:hover::before {
                    left: 100%;
                }
                
                .modern-form-btn-secondary {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: white;
                }
                
                .modern-form-btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
                }
                
                .modern-form-btn-primary {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                }
                
                .modern-form-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
                }
                
                .modern-form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .modern-alert {
                    border-radius: 12px;
                    border: none;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                }
                
                .modern-alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .modern-alert-info {
                    background: linear-gradient(45deg, #d1ecf1, #bee5eb);
                    color: #0c5460;
                    border-left: 4px solid #17a2b8;
                }
                
                .modern-table-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }
                
                .modern-table-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                
                .modern-table {
                    margin: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                }
                
                .modern-table thead {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                }
                
                .modern-table thead th {
                    border: none;
                    color: white;
                    font-weight: 600;
                    padding: 1rem;
                    text-align: center;
                }
                
                .modern-table tbody tr {
                    transition: all 0.3s ease;
                    border: none;
                }
                
                .modern-table tbody tr:hover {
                    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
                    transform: scale(1.01);
                }
                
                .modern-table tbody td {
                    border: none;
                    padding: 1rem;
                    text-align: center;
                    vertical-align: middle;
                    font-weight: 500;
                }
                
                .modern-table tbody tr.table-warning {
                    background: linear-gradient(45deg, #fff3cd, #ffeaa7);
                }
                
                .modern-table tbody tr.table-success {
                    background: linear-gradient(45deg, #d4edda, #c3e6cb);
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #667eea;
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
                    .modern-client-title {
                        font-size: 2rem;
                    }
                    
                    .modern-info-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .modern-form-buttons {
                        flex-direction: column;
                    }
                    
                    .modern-client-header,
                    .modern-client-info,
                    .modern-form-container,
                    .modern-table-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                }
            `}</style>
            
            <div className="modern-client-details">
                <div className="container">
                    <div className="modern-client-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="modern-client-title">
                                    <i className="fas fa-chart-line me-3"></i>
                                    Charges mensuelles
                                </h1>
                                <p className="modern-client-subtitle">
                                    {client.nom} {client.prenom}
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>

                    {/* Informations client en résumé */}
                    <div className="modern-client-info">
                        <div className="modern-info-grid">
                            <div className="modern-info-item">
                                <div className="modern-info-label">ID Client</div>
                                <div className="modern-info-value">
                                    <i className="fas fa-id-card me-2"></i>
                                    {client.id}
                                </div>
                            </div>
                            <div className="modern-info-item">
                                <div className="modern-info-label">Email</div>
                                <div className="modern-info-value">
                                    <i className="fas fa-envelope me-2"></i>
                                    {client.email || 'Non renseigné'}
                                </div>
                            </div>
                            <div className="modern-info-item">
                                <div className="modern-info-label">Téléphone</div>
                                <div className="modern-info-value">
                                    <i className="fas fa-phone me-2"></i>
                                    {client.telephone}
                                </div>
                            </div>
                            <div className="modern-info-item">
                                <div className="modern-info-label">Année</div>
                                <div className="modern-info-value">
                                    <i className="fas fa-calendar me-2"></i>
                                    2023
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bouton Ajouter */}
                    <div className="text-center mb-4">
                        <button
                            className="modern-add-btn"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <i className="fas fa-plus me-2"></i>
                            {showAddForm ? 'Annuler' : 'Ajouter une charge'}
                        </button>
                    </div>

                    {/* Formulaire d'ajout */}
                    {showAddForm && (
                        <div className="modern-form-container">
                            <h5 className="modern-form-title">
                                <i className="fas fa-plus-circle me-2"></i>
                                Ajouter une nouvelle charge
                            </h5>
                            
                            {error && (
                                <div className="modern-alert modern-alert-danger">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleAddCharge}>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-calendar me-2"></i>
                                                Mois
                                            </label>
                                            <select
                                                className="modern-form-select"
                                                value={newCharge.mois}
                                                onChange={(e) => setNewCharge({ ...newCharge, mois: e.target.value })}
                                                required
                                            >
                                                <option value="">Sélectionner</option>
                                                <option value="JANVIER">Janvier</option>
                                                <option value="FEVRIER">Février</option>
                                                <option value="MARS">Mars</option>
                                                <option value="AVRIL">Avril</option>
                                                <option value="MAI">Mai</option>
                                                <option value="JUIN">Juin</option>
                                                <option value="JUILLET">Juillet</option>
                                                <option value="AOUT">Août</option>
                                                <option value="SEPTEMBRE">Septembre</option>
                                                <option value="OCTOBRE">Octobre</option>
                                                <option value="NOVEMBRE">Novembre</option>
                                                <option value="DECEMBRE">Décembre</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-calendar-alt me-2"></i>
                                                Année
                                            </label>
                                            <input
                                                type="number"
                                                className="modern-form-input"
                                                value={newCharge.annee}
                                                onChange={(e) => setNewCharge({ ...newCharge, annee: parseInt(e.target.value) })}
                                                required
                                                placeholder="2023"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-money-bill me-2"></i>
                                                Montant charge
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="modern-form-input"
                                                placeholder="0.00"
                                                value={newCharge.montant_charge}
                                                onChange={(e) => setNewCharge({ ...newCharge, montant_charge: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <i className="fas fa-hand-holding-usd me-2"></i>
                                                Avance
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="modern-form-input"
                                                placeholder="0.00"
                                                value={newCharge.avance}
                                                onChange={(e) => setNewCharge({ ...newCharge, avance: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modern-form-buttons">
                                    <button
                                        type="button"
                                        className="modern-form-btn modern-form-btn-secondary"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="modern-form-btn modern-form-btn-primary"
                                        disabled={adding}
                                    >
                                        {adding ? (
                                            <>
                                                <div className="modern-spinner"></div>
                                                Ajout en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-plus me-2"></i>
                                                Ajouter
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tableau des charges - Toujours affiché */}
                    <div className="modern-table-container">
                        <h5 className="modern-table-title">
                            <i className="fas fa-table me-2"></i>
                            Tableau des charges mensuelles
                        </h5>
                        
                        {charges.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table modern-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <i className="fas fa-calendar me-2"></i>
                                                MOIS
                                            </th>
                                            <th>
                                                <i className="fas fa-money-bill me-2"></i>
                                                MONTANT
                                            </th>
                                            <th>
                                                <i className="fas fa-hand-holding-usd me-2"></i>
                                                AVANCE
                                            </th>
                                            <th>
                                                <i className="fas fa-calculator me-2"></i>
                                                RESTE
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {charges.map((charge, index) => (
                                            <tr key={index} className={charge.mois === 'REGLT' ? 'table-warning' : ''}>
                                                <td>
                                                    <strong>{charge.mois}</strong>
                                                </td>
                                                <td>
                                                    <span className="text-primary fw-bold">
                                                        {parseFloat(charge.montant_charge).toLocaleString()} DT
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-success fw-bold">
                                                        {parseFloat(charge.avance).toLocaleString()} DT
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={parseFloat(charge.solde_restant) < 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                                        {parseFloat(charge.solde_restant).toLocaleString()} DT
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Ligne des totaux */}
                                        {charges.length > 0 && (
                                            <tr className="table-success">
                                                <td>
                                                    <strong>
                                                        <i className="fas fa-calculator me-2"></i>
                                                        TOTAL
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong className="text-primary">
                                                        {charges.reduce((sum, c) => sum + parseFloat(c.montant_charge), 0).toLocaleString()} DT
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong className="text-success">
                                                        {charges.reduce((sum, c) => sum + parseFloat(c.avance), 0).toLocaleString()} DT
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong className={charges.length > 0 && parseFloat(charges[charges.length - 1].solde_restant) < 0 ? 'text-danger' : 'text-success'}>
                                                        {charges.length > 0 ? parseFloat(charges[charges.length - 1].solde_restant).toLocaleString() : '0'} DT
                                                    </strong>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="modern-alert modern-alert-info">
                                <div className="text-center">
                                    <i className="fas fa-info-circle fa-3x mb-3 text-info"></i>
                                    <h6 className="mb-2">Aucune charge enregistrée pour ce client</h6>
                                    <p className="mb-0">Utilisez le bouton "Ajouter une charge" pour commencer à enregistrer les charges mensuelles.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}


