import React, { useState } from 'react';

export default function LoginModal({ show, onClose, onLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        phone: '',
        smsCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [smsSent, setSmsSent] = useState(false);
    const [smsLoading, setSmsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendSms = async () => {
        if (!formData.phone) {
            setError('Veuillez saisir le numéro de téléphone');
            return;
        }

        setSmsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    num_tel: formData.phone
                })
            });

            const data = await response.json();

            if (data.success) {
                setSmsSent(true);
                setError(`Code SMS envoyé ! Utilisez le code: ${data.sms_code}`);
            } else {
                setError(data.error || 'Erreur lors de l\'envoi du SMS');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setSmsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Essayer d'abord la connexion par username/password
            if (formData.username && formData.password) {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const user = {
                        ...data.user,
                        loginMethod: 'username'
                        // token: data.token // Désactivé pour les tests
                    };
                    onLogin(user);
                    return;
                }
            }

            // Si la connexion username/password échoue, essayer par SMS
            if (formData.phone && formData.smsCode) {
                const response = await fetch('/api/auth/login-sms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        num_tel: formData.phone,
                        sms_code: formData.smsCode
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const user = {
                        ...data.user,
                        loginMethod: 'sms'
                        // token: data.token // Désactivé pour les tests
                    };
                    onLogin(user);
                    return;
                }
            }

            setError('Veuillez remplir les champs username/password ou téléphone avec code SMS');
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            phone: '',
            smsCode: ''
        });
        setError('');
        setSmsSent(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-sign-in-alt me-2"></i>
                            Connexion
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Messages d'erreur */}
                        {error && (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Formulaire unifié */}
                        <form onSubmit={handleLogin}>
                            {/* Username */}
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">
                                    <i className="fas fa-user me-2"></i>Nom d'utilisateur
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Nom d'utilisateur"
                                />
                            </div>

                            {/* Mot de passe */}
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
                                    <i className="fas fa-lock me-2"></i>Mot de passe
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Mot de passe"
                                />
                            </div>

                            {/* Numéro de téléphone */}
                            <div className="mb-3">
                                <label htmlFor="phone" className="form-label">
                                    <i className="fas fa-phone me-2"></i>Numéro de téléphone
                                </label>
                                <div className="input-group">
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+21612345678"
                                        disabled={smsSent}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleSendSms}
                                        disabled={smsLoading || smsSent || !formData.phone}
                                    >
                                        {smsLoading ? (
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="fas fa-paper-plane me-1"></i>
                                        )}
                                        {smsSent ? 'SMS Envoyé' : 'Envoyer SMS'}
                                    </button>
                                </div>
                            </div>

                            {/* Code SMS */}
                            {smsSent && (
                                <div className="mb-3">
                                    <label htmlFor="smsCode" className="form-label">
                                        <i className="fas fa-key me-2"></i>Code SMS
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="smsCode"
                                        name="smsCode"
                                        value={formData.smsCode}
                                        onChange={handleInputChange}
                                        placeholder="123456"
                                        maxLength="6"
                                    />
                                </div>
                            )}

                            {/* Bouton de connexion */}
                            <div className="d-grid gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-in-alt me-2"></i>
                                            Se connecter
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    );
}