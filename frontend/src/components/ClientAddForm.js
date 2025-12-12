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
                .add-form {
                    background: transparent;
                }

                .add-form .form-group {
                    margin-bottom: 0.8rem;
                }

                .add-form .form-label {
                    color: #2c3e50;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    display: block;
                    font-size: 0.9rem;
                }

                .add-form .form-input {
                    width: 100%;
                    border: 1px solid #d5dbe3;
                    border-radius: 8px;
                    padding: 8px 11px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background: #ffffff;
                }

                .add-form .form-input:focus {
                    outline: none;
                    border-color: #0b5796;
                    box-shadow: 0 0 0 2px rgba(11, 87, 150, 0.12);
                }

                .add-form .form-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 1.5rem;
                }

                .add-form .form-btn {
                    border-radius: 12px;
                    padding: 12px 24px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    border: none;
                    min-width: 120px;
                }

                .add-form .form-btn-secondary {
                    background: linear-gradient(45deg, #6c757d, #495057);
                    color: #ffffff;
                }

                .add-form .form-btn-primary {
                    background: linear-gradient(45deg, #0b5796, #0b5796);
                    color: #ffffff;
                }

                .add-form .form-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }

                .add-form .form-btn:disabled {
                    opacity: 0.7;
                    transform: none;
                    box-shadow: none;
                }

                .add-form .modern-alert {
                    border-radius: 12px;
                    border: none;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1rem;
                    font-weight: 500;
                }

                .add-form .modern-alert-danger {
                    background: linear-gradient(45deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
            `}</style>

            <div className="add-form">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="modern-alert modern-alert-danger">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-user me-2"></i>
                                    Nom et Prénom *
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="nom_complet"
                                    value={formData.nom_complet}
                                    onChange={handleChange}
                                    required
                                    placeholder="Entrez le nom et prénom du client"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-at me-2"></i>
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
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
                            <div className="form-group">
                                <label className="form-label">
                                    <i className="fas fa-phone me-2"></i>
                                    Téléphone *
                                </label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    required
                                    placeholder="Entrez le numéro de téléphone"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-buttons">
                        <button
                            type="button"
                            className="form-btn form-btn-secondary"
                            onClick={onCancel}
                        >
                            <i className="fas fa-times me-2"></i>
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="form-btn form-btn-primary"
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
