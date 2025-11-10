import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function SearchClientPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Charger tous les clients au montage du composant
    useEffect(() => {
        fetchAllClients();
        // Focus sur la barre de recherche
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
    }, []);

    // Filtrage en temps réel
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm.trim() === '') {
            setResults(allClients);
            setError('');
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            setError('');

            const filteredClients = allClients.filter(client => {
                const search = searchTerm.toLowerCase();
                return (
                    client.username.toLowerCase().includes(search) ||
                    client.nom.toLowerCase().includes(search) ||
                    client.prenom.toLowerCase().includes(search) ||
                    client.telephone.includes(search)
                );
            });

            setResults(filteredClients);

            if (filteredClients.length === 0) {
                setError('Aucun client trouvé');
            }
        }, 100);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, allClients]);

    const fetchAllClients = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (data && data.clients) {
                setAllClients(data.clients);
                setResults(data.clients);
            } else {
                setAllClients([]);
                setResults([]);
            }
        } catch (err) {
            setError('Erreur lors du chargement des clients');
            setAllClients([]);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setError('');

        if (searchTerm.trim() === '') {
            setResults(allClients);
            setError('Veuillez entrer un terme de recherche');
            return;
        }
    };

    return (
        <>
            <style jsx global>{`
                body, html {
                    height: auto !important;
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                
                .search-client-page {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    padding: 0.75rem 0; /* compact */
                }
                
                .search-client-header { display: none; } /* supprimer le gros header */
                
                .search-client-title {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                .search-client-subtitle {
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
                
                .search-container {
                    background: white;
                    border-radius: 14px;
                    padding: 1rem; /* compact */
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                    border: 1px solid #edf0f3;
                    backdrop-filter: none;
                    margin-bottom: 0.75rem; /* compact */
                }
                
                .search-title {
                    color: #2c3e50;
                    font-weight: 700;
                    font-size: 1.1rem; /* compact */
                    margin-bottom: 0.75rem; /* compact */
                    text-align: center;
                }
                
                .search-form {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    justify-content: center;
                }
                
                .search-input {
                    flex: 0 1 450px;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 6px 12px;
                    font-size: 0.85rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: #f8f9fa;
                    max-width: 480px;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    transform: translateY(-2px);
                }
                
                .search-btn {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    border-radius: 12px;
                    padding: 6px 14px;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-width: 90px;
                }
                
                .search-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.6s;
                }
                
                .search-btn:hover::before {
                    left: 100%;
                }
                
                .search-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                }
                
                .search-btn:disabled {
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
                
                .table-container {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }
                
                .table-title {
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
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
                    border: 2px solid #b5b9bf;
                }
                
                .modern-table thead {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                }
                
                .modern-table thead th {
                    border: 2px solid rgba(255,255,255,0.35);
                    color: white;
                    font-weight: 600;
                    padding: 1rem;
                    text-align: center;
                }
                
                .modern-table tbody tr {
                    transition: all 0.3s ease;
                    border-bottom: 2px solid #d8dde3;
                }
                
                .modern-table tbody tr:hover {
                    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
                    transform: scale(1.01);
                }
                
                .modern-table tbody td {
                    border-right: 2px solid #d8dde3;
                    padding: 1rem;
                    text-align: center;
                    vertical-align: middle;
                    font-weight: 500;
                }

                .modern-table tbody tr:last-child { border-bottom: none; }
                .modern-table tbody td:last-child { border-right: none; }
                
                .action-btn {
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    min-width: 100px;
                    position: relative;
                    overflow: hidden;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
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
                
                .action-btn-success {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }
                
                .action-btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
                    color: white;
                    text-decoration: none;
                }
                
                .modern-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .no-results {
                    text-align: center;
                    padding: 3rem 2rem;
                }
                
                .no-results i {
                    font-size: 4rem;
                    color: #6c757d;
                    margin-bottom: 1rem;
                }
                
                .no-results h5 {
                    color: #495057;
                    margin-bottom: 0.5rem;
                }
                
                .no-results p {
                    color: #6c757d;
                }
                
                @media (max-width: 768px) {
                    .search-client-title {
                        font-size: 2rem;
                    }
                    
                    .search-form {
                        flex-direction: column;
                    }
                    
                    .search-client-header,
                    .search-container,
                    .table-container {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                }
            `}</style>

            <div className="search-client-page">
                <div className="container">
                    {/* Header */}
                    <div className="search-client-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="search-client-title">
                                    <i className="fas fa-search me-3"></i>
                                    Rechercher un Client
                                </h1>
                                <p className="search-client-subtitle">
                                    Trouvez rapidement un client dans la base de données
                                </p>
                            </div>
                            <Link to="/" className="modern-back-btn">
                                <i className="fas fa-arrow-left"></i>
                                Retour
                            </Link>
                        </div>
                    </div>


                    {/* Recherche */}
                    <div className="search-container">
                        <h5 className="search-title">
                            <i className="fas fa-search me-2"></i>
                            Rechercher client
                        </h5>

                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Tapez pour filtrer (username, nom, prénom, téléphone)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                ref={searchInputRef}
                            />
                            <button
                                type="submit"
                                className="search-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="modern-spinner me-2"></div>
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-search me-2"></i>
                                        Chercher
                                    </>
                                )}
                            </button>
                        </form>

                        {error && (
                            <div className="modern-alert modern-alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Résultats */}
                    <div className="table-container">
                        <h5 className="table-title">
                            <i className="fas fa-users me-2"></i>
                            {searchTerm.trim() ? `Résultats (${results.length})` : `Tous les clients (${results.length})`}
                        </h5>

                        {loading ? (
                            <div className="text-center">
                                <div className="modern-spinner"></div>
                                <p>Chargement des clients...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table modern-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <i className="fas fa-user me-2"></i>
                                                Nom
                                            </th>
                                            <th>
                                                <i className="fas fa-phone me-2"></i>
                                                Téléphone
                                            </th>
                                            <th>
                                                <i className="fas fa-cogs me-2"></i>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((client) => (
                                            <tr key={client.id}>
                                                <td>
                                                    <strong>{client.nom} {client.prenom}</strong>
                                                    <br />
                                                    <small className="text-muted">@{client.username}</small>
                                                </td>
                                                <td>
                                                    <i className="fas fa-phone me-2 text-primary"></i>
                                                    {client.telephone}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center" role="group">
                                                        <Link
                                                            to={`/client/${client.id}/charges`}
                                                            className="action-btn action-btn-success"
                                                            title="Voir les charges"
                                                        >
                                                            <i className="fas fa-chart-line me-1"></i>
                                                            Détails
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-results">
                                <i className="fas fa-search"></i>
                                <h5>Aucun client trouvé</h5>
                                <p>
                                    {searchTerm ?
                                        'Aucun client ne correspond à votre recherche. Essayez avec d\'autres termes.' :
                                        'Aucun client enregistré dans le système.'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
