import React, { useState } from 'react';

export default function ClientAddForm({ onClientAdded, onCancel }) {
    const [formData, setFormData] = useState({
        nom_complet: '',
        username: '',
        telephone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fonction pour splitter le nom complet en nom et prénom
    const splitNomComplet = (nomComplet) => {
        const trimmed = nomComplet.trim();
        if (!trimmed) return { nom: '', prenom: '' };

        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
            // Si un seul mot, mettre dans nom et prénom vide
            return { nom: parts[0], prenom: '' };
        } else {
            // Premier mot = nom, le reste = prénom
            return { nom: parts[0], prenom: parts.slice(1).join(' ') };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Splitter le nom complet en nom et prénom
        const { nom, prenom } = splitNomComplet(formData.nom_complet);
        const username = formData.username.trim();
        const email = null; // email supprimé
        const telephone = formData.telephone.trim();

        if (!nom || !username || !telephone) {
            setLoading(false);
            setError('Tous les champs (*) sont obligatoires');
            return;
        }
        // plus de validation email

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nom, prenom, username, email, telephone }),
            });

            let data = {};
            try {
                data = await response.json();
            } catch (_) {
                // ignorer parse error
            }

            if (response.ok && data.success) {
                // Réinitialiser le formulaire
                setFormData({
                    nom_complet: '',
                    username: '',
                    telephone: ''
                });
                onClientAdded();
            } else {
                setError((data && (data.error || data.message)) || 'Erreur lors de la création');
            }
        } catch (err) {
            console.error('Erreur lors de l\'ajout du client:', err);
            setError('Erreur réseau lors de la création');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <style jsx>{`
                .modern-add-form {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }
                
                .modern-add-form .modern-alert {
                    border-radius: 12px;
                    border: none;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    font-weight: 500;
                }
                
                .modern-add-form .modern-alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .modern-add-form .modern-form-group {
                    margin-bottom: 1.5rem;
                }
                
                .modern-add-form .modern-form-label {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                }
                
                .modern-add-form .modern-form-input {
                    width: 100%;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                
                .modern-add-form .modern-form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .modern-add-form .modern-form-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 2rem;
                }
                
                .modern-add-form .modern-form-btn {
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    min-width: 120px;
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-add-form .modern-form-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .modern-add-form .modern-form-btn:hover::before {
                    left: 100%;
                }
                
                .modern-add-form .modern-form-btn-secondary {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(108, 117, 125, 0.3);
                }
                
                .modern-add-form .modern-form-btn-success {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }
                
                .modern-add-form .modern-form-btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.4);
                }
                
                .modern-add-form .modern-form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                }
                
                .modern-add-form .modern-spinner {
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
                    .modern-add-form .modern-form-buttons {
                        flex-direction: column;
                    }
                    
                    .modern-add-form {
                        padding: 1.5rem;
                    }
                }
            `}</style>

            <div className="modern-add-form">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="modern-alert modern-alert-danger">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-6">
                            <div className="modern-form-group">
                                <label className="modern-form-label">
                                    <i className="fas fa-user me-2"></i>
                                    Nom et Prénom *
                                </label>
                                <input
                                    type="text"
                                    className="modern-form-input"
                                    name="nom_complet"
                                    value={formData.nom_complet}
                                    onChange={handleChange}
                                    required
                                    placeholder="Entrez le nom et prénom du client"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="modern-form-group">
                                <label className="modern-form-label">
                                    <i className="fas fa-at me-2"></i>
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    className="modern-form-input"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Entrez le nom d'utilisateur"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="modern-form-group">
                                <label className="modern-form-label">
                                    <i className="fas fa-phone me-2"></i>
                                    Téléphone *
                                </label>
                                <input
                                    type="tel"
                                    className="modern-form-input"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    required
                                    placeholder="Entrez le numéro de téléphone"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modern-form-buttons">
                        <button
                            type="button"
                            className="modern-form-btn modern-form-btn-secondary"
                            onClick={onCancel}
                        >
                            <i className="fas fa-times me-2"></i>
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="modern-form-btn modern-form-btn-success"
                            disabled={loading}
                        >
                            {loading ? (
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
        </>
    );
}
