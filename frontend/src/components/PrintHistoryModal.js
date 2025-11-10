import React, { useState, useEffect } from 'react';

export default function PrintHistoryModal({ show, onClose }) {
    const [printHistory, setPrintHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(20);

    useEffect(() => {
        if (show) {
            fetchPrintHistory();
        }
    }, [show, currentPage]);

    const fetchPrintHistory = async () => {
        setLoading(true);
        setError('');

        try {
            const offset = (currentPage - 1) * recordsPerPage;
            const params = new URLSearchParams({
                limit: recordsPerPage,
                offset: offset
            });

            const response = await fetch(`/api/print-history?${params}`);
            const data = await response.json();

            if (data.success) {
                setPrintHistory(data.data);
                setTotalRecords(data.total);
            } else {
                setError(data.error || 'Erreur lors du chargement de l\'historique');
            }
        } catch (err) {
            setError('Erreur lors du chargement de l\'historique');
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMontant = (montant) => {
        const value = parseFloat(montant);
        if (isNaN(value)) return '0,00';
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };


    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-history me-2"></i>
                            Historique des Reçus Imprimés
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>

                    <div className="modal-body">
                        {/* Informations sur le total */}
                        <div className="row mb-3">
                            <div className="col-12 text-end">
                                <span className="text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Total: {totalRecords} enregistrements
                                </span>
                            </div>
                        </div>

                        {/* Tableau */}
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-2">Chargement de l'historique...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        ) : printHistory.length === 0 ? (
                            <div className="text-center py-4">
                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">Aucun historique trouvé</h5>
                                <p className="text-muted">Aucun reçu n'a été imprimé pour les critères sélectionnés.</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Date d'impression</th>
                                                <th>Client</th>
                                                <th>Montant</th>
                                                <th>Caissier</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {printHistory.map((record, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <i className="fas fa-calendar-alt me-1 text-muted"></i>
                                                        {formatDate(record.date_impression)}
                                                    </td>
                                                    <td>
                                                        <strong>
                                                            {record.client_prenom} {record.client_nom}
                                                        </strong>
                                                    </td>
                                                    <td className="text-success fw-bold">
                                                        {formatMontant(record.montant)} TND
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-user me-1 text-muted"></i>
                                                        {record.caissier_username}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="mt-4">
                                        <ul className="pagination justify-content-center">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Précédent
                                                </button>
                                            </li>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            ))}

                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Suivant
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <i className="fas fa-times me-1"></i>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
