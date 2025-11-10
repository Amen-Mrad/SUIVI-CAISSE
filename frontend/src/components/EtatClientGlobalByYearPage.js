import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EtatCgmModal from './EtatCgmModal';

export default function EtatClientGlobalByYearPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <style jsx global>{`
        body, html { height: auto !important; overflow-x: hidden; overflow-y: auto; }
        .etat-client-year-page { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
        .header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; }
        .title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .subtitle { color: #6c757d; font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; }
        .back-btn { background: linear-gradient(45deg, #6c757d, #495057); border: none; color: white; border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .back-btn:hover { background: linear-gradient(45deg, #5a6268, #343a40); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); color: white; text-decoration: none; }
        .selector { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; text-align: center; }
        .select { width: 100%; border: 2px solid #e9ecef; border-radius: 15px; padding: 12px 16px; background: #f8f9fa; }
        .show-btn { background: linear-gradient(45deg, #28a745, #20c997); border: none; color: white; border-radius: 15px; padding: 12px 24px; font-weight: 600; }
      `}</style>

      <div className="etat-client-year-page">
        <div className="container">
          <div className="header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="title"><i className="fas fa-calendar me-3"></i>État Client (Global) - Par Année</h1>
                <p className="subtitle">Synthèse CGM de tous les clients pour une année</p>
              </div>
              <Link to="/" className="back-btn"><i className="fas fa-arrow-left"></i>Retour</Link>
            </div>
          </div>

          <div className="selector">
            <label className="form-label"><i className="fas fa-calendar-year me-2"></i>Année</label>
            <select className="select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
            <div className="text-center mt-3">
              <button className="show-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-eye me-2"></i>Afficher
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <EtatCgmModal
            show={showModal}
            onClose={() => setShowModal(false)}
            type="client"
            filterType="annee"
            annee={selectedYear}
          />
        )}
      </div>
    </>
  );
}


