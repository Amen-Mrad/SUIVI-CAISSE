import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HonorairesModal from './HonorairesModal';
import DepensesModal from './DepensesModal';
import DepensesFilterModal from './DepensesFilterModal';
import AllHonorairesModal from './AllHonorairesModal';
import AllDepensesModal from './AllDepensesModal';
import AllClientsModal from './AllClientsModal';
import AllBeneficiairesModal from './AllBeneficiairesModal';
import EtatCgmModal from './EtatCgmModal';
import RecuTemplate from './RecuTemplate';
import UserManagementModal from './UserManagementModal';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHonorairesDropdown, setShowHonorairesDropdown] = useState(false);
  const [showDepensesDropdown, setShowDepensesDropdown] = useState(false);
  const [showHonorairesModal, setShowHonorairesModal] = useState(false);
  const [honorairesType, setHonorairesType] = useState('');
  const [showDepensesModal, setShowDepensesModal] = useState(false);
  const [depensesAction, setDepensesAction] = useState('');
  const [showDepensesFilterModal, setShowDepensesFilterModal] = useState(false);
  const [depensesFilterType, setDepensesFilterType] = useState('');
  const [showDepensesClientDropdown, setShowDepensesClientDropdown] = useState(false);
  const [showDepensesClientDetailDropdown, setShowDepensesClientDetailDropdown] = useState(false);
  const [showAllHonorairesModal, setShowAllHonorairesModal] = useState(false);
  const [showAllDepensesModal, setShowAllDepensesModal] = useState(false);
  const [depensesActionMode, setDepensesActionMode] = useState('view');
  const [showRecuTemplate, setShowRecuTemplate] = useState(false);
  const [recuData, setRecuData] = useState(null);
  const [showAllClientsModal, setShowAllClientsModal] = useState(false);
  const [showAllBeneficiairesModal, setShowAllBeneficiairesModal] = useState(false);
  const [showEtatCgmDropdown, setShowEtatCgmDropdown] = useState(false);
  const [showCgmDropdown, setShowCgmDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showEtatClientDropdown, setShowEtatClientDropdown] = useState(false);
  const [showEtatCgmModal, setShowEtatCgmModal] = useState(false);
  const [etatCgmFilteredData, setEtatCgmFilteredData] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [caisseTotal, setCaisseTotal] = useState(0);
  const [caisseLoading, setCaisseLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si on est dans une page de détails client (charges, etat, depenses)
  const isClientDetailPage = location.pathname.includes('/client/') && (
    location.pathname.includes('/charges') ||
    location.pathname.includes('/etat/') ||
    location.pathname.includes('/depenses/') ||
    location.pathname.includes('/honoraires/')
  );

  // Fonction de déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Récupérer le total de la caisse CGM (somme des honoraires reçus)
  const fetchCaisseTotal = async () => {
    if (!isAuthenticated) return;

    setCaisseLoading(true);
    try {
      const response = await fetch('/api/honoraires/caisse-live');
      const data = await response.json();
      if (data.success) {
        const newTotal = data.total_caisse || 0;
        console.log('Caisse CGM mise à jour:', newTotal);
        setCaisseTotal(newTotal);
      } else {
        console.error('Erreur dans la réponse de la caisse:', data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la caisse:', err);
    } finally {
      setCaisseLoading(false);
    }
  };

  // Charger la caisse au montage et périodiquement
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchCaisseTotal();
    // Mettre à jour toutes les 5 secondes
    const interval = setInterval(fetchCaisseTotal, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Écouter les événements de mise à jour de la caisse
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleCaisseUpdate = () => {
      console.log('Événement caisse-updated reçu dans Header');
      // Petit délai pour s'assurer que la base de données est à jour
      setTimeout(() => {
        console.log('Appel de fetchCaisseTotal()...');
        fetchCaisseTotal();
      }, 200);
    };

    window.addEventListener('caisse-updated', handleCaisseUpdate);
    window.addEventListener('charge-added', handleCaisseUpdate);
    window.addEventListener('charge-updated', handleCaisseUpdate);
    window.addEventListener('charge-deleted', handleCaisseUpdate);

    return () => {
      window.removeEventListener('caisse-updated', handleCaisseUpdate);
      window.removeEventListener('charge-added', handleCaisseUpdate);
      window.removeEventListener('charge-updated', handleCaisseUpdate);
      window.removeEventListener('charge-deleted', handleCaisseUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Ouvrir le gabarit de reçu via un événement global
  useEffect(() => {
    const openRecu = (event) => {
      setRecuData(event.detail || null);
      setShowRecuTemplate(true);
    };
    window.addEventListener('open-recu-template', openRecu);
    return () => window.removeEventListener('open-recu-template', openRecu);
  }, []);

  // Ouvrir le modal Dépenses depuis la page client (bouton "Dépense")
  useEffect(() => {
    const openDepensesModal = () => {
      setDepensesAction('ajouter');
      setShowDepensesModal(true);
    };
    window.addEventListener('open-depenses-modal', openDepensesModal);
    return () => window.removeEventListener('open-depenses-modal', openDepensesModal);
  }, []);

  // Ouvrir les états CGM filtrés via un événement global
  useEffect(() => {
    const openEtatCgmFiltered = (event) => {
      setEtatCgmFilteredData(event.detail || null);
      setShowEtatCgmModal(true);
    };

    const openEtatBureauForBeneficiaire = (event) => {
      setEtatCgmFilteredData(event.detail || null);
      setShowEtatCgmModal(true);
    };

    window.addEventListener('open-etat-cgm-filtered', openEtatCgmFiltered);
    window.addEventListener('open-etat-bureau-for-beneficiaire', openEtatBureauForBeneficiaire);
    return () => {
      window.removeEventListener('open-etat-cgm-filtered', openEtatCgmFiltered);
      window.removeEventListener('open-etat-bureau-for-beneficiaire', openEtatBureauForBeneficiaire);
    };
  }, []);


  const handleClientSearch = () => {
    setShowDropdown(false);
    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      navigate('/search-client');
    }, 200);
  };




  const handleHonorairesClick = (type) => {
    // Fermer le dropdown d'abord
    setShowHonorairesDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      // Navigation par routes selon le type
      if (isClientDetailPage) {
        // Rester dans le contexte client (navbar client) et utiliser les routes client
        const clientId = location.pathname.split('/')[2];
        switch (type) {
          case 'jour':
            navigate(`/client/${clientId}/honoraires/jour`);
            break;
          case 'mois':
            navigate(`/client/${clientId}/honoraires/mois`);
            break;
          case 'annee':
            navigate(`/client/${clientId}/honoraires/annee`);
            break;
          case 'toutes':
            navigate(`/client/${clientId}/honoraires/tous`);
            break;
          default:
            break;
        }
      } else {
        switch (type) {
          case 'jour':
            navigate('/honoraires/jour');
            break;
          case 'mois':
            navigate('/honoraires/mois');
            break;
          case 'annee':
            navigate('/honoraires/annee');
            break;
          case 'toutes':
            navigate('/honoraires/tous');
            break;
          default:
            break;
        }
      }
    }, 200);

    // Si on est dans une page de détails client, passer l'ID du client
    if (isClientDetailPage) {
      const clientId = location.pathname.split('/')[2];
      window.currentHonorairesClientId = clientId;
    } else {
      // Si on est sur la page d'accueil, réinitialiser l'ID du client
      window.currentHonorairesClientId = null;
    }
  };

  const handleDepensesClick = (action) => {
    console.log(`Action Dépenses: ${action}`);

    // Définir les variables globales selon le contexte
    if (isClientDetailPage) {
      setShowDepensesClientDetailDropdown(false);
      // Si on est dans une page de détails client, passer l'ID du client
      const clientId = location.pathname.split('/')[2];
      window.currentDepensesClientId = clientId;
      window.currentDepensesType = 'client';
    } else {
      setShowDepensesDropdown(false); // Pour Dépenses Bureau
      window.currentDepensesClientId = null;
      window.currentDepensesType = 'bureau';
    }

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      setDepensesAction(action);

      if (action === 'ajouter') {
        setShowDepensesModal(true);
      } else if (action === 'modifier') {
        // Afficher le modal de toutes les dépenses pour modification
        setDepensesActionMode('modify');
        setShowAllDepensesModal(true);
      } else if (action === 'supprimer') {
        // Afficher le modal de toutes les dépenses pour suppression
        setDepensesActionMode('delete');
        setShowAllDepensesModal(true);
      } else if (action === 'voir-toutes') {
        if (isClientDetailPage) {
          // Naviguer vers la page dédiée client
          const clientId = location.pathname.split('/')[2];
          navigate(`/client/${clientId}/depenses/toutes`);
        } else {
          // Si on est sur la page d'accueil (Dépenses Bureau), naviguer vers la route
          navigate('/depenses-bureau/toutes');
        }
      }
    }, 200);
  };

  const handleAddDepenseClick = () => {
    console.log('Ajouter une nouvelle dépense CGM');
    setShowCgmDropdown(false);
    navigate('/depenses-cgm/ajouter');
  };

  const handleDepensesFilterClick = (type) => {
    // Fermer le dropdown d'abord
    setShowDepensesDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      // Vérifier si on est dans les détails d'un client
      if (isClientDetailPage) {
        // Si on est dans les détails d'un client, naviguer vers les routes client
        const clientId = location.pathname.split('/')[2];
        switch (type) {
          case 'jour':
            navigate(`/client/${clientId}/depenses/jour`);
            break;
          case 'mois':
            navigate(`/client/${clientId}/depenses/mois`);
            break;
          case 'annee':
            navigate(`/client/${clientId}/depenses/annee`);
            break;
          default:
            break;
        }
      } else {
        // Si on est sur la page d'accueil, naviguer vers les routes bureau
        switch (type) {
          case 'jour':
            navigate('/depenses-bureau/jour');
            break;
          case 'mois':
            navigate('/depenses-bureau/mois');
            break;
          case 'annee':
            navigate('/depenses-bureau/annee');
            break;
          default:
            break;
        }
      }
    }, 200);
  };

  const handleDepensesBeneficiaireClick = () => {
    setShowDepensesDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      // Vérifier si on est dans les détails d'un client
      if (isClientDetailPage) {
        // Si on est dans les détails d'un client, naviguer vers la route client
        const clientId = location.pathname.split('/')[2];
        navigate(`/client/${clientId}/depenses/beneficiaire`);
      } else {
        // Si on est sur la page d'accueil, naviguer vers la route bureau
        navigate('/depenses-bureau/beneficiaire');
      }
    }, 200);
  };

  // Gestionnaires spécifiques pour les boutons admin
  const handleAdminDepensesClientFilterClick = (type) => {
    setShowDepensesClientDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      // Navigation par routes selon le type pour Dépenses Client
      switch (type) {
        case 'jour':
          navigate('/depenses-client/jour');
          break;
        case 'mois':
          navigate('/depenses-client/mois');
          break;
        case 'annee':
          navigate('/depenses-client/annee');
          break;
        default:
          break;
      }
    }, 200);
  };

  const handleAdminDepensesClientClick = (action) => {
    if (action === 'voir-toutes') {
      setShowDepensesClientDropdown(false);

      // Aller vers la page dédiée (toutes dépenses client)
      setTimeout(() => {
        navigate('/depenses-client/toutes');
      }, 200);
    }
  };

  const handleAdminEtatClientFilterClick = (type) => {
    setShowEtatClientDropdown(false);

    setTimeout(() => {
      // Routes globales États Client (tous clients)
      switch (type) {
        case 'client': navigate('/etat-client/client'); break;
        case 'jour': navigate('/etat-client/jour'); break;
        case 'mois': navigate('/etat-client/mois'); break;
        case 'annee': navigate('/etat-client/annee'); break;
        case 'tous': navigate('/etat-client/tous'); break;
        default: break;
      }
    }, 200);
  };

  const handleClientDetailEtatFilterClick = (type) => {
    // Récupérer l'ID du client depuis l'URL actuelle
    const currentPath = location.pathname;
    const clientIdMatch = currentPath.match(/\/client\/(\d+)/);

    if (clientIdMatch) {
      const clientId = clientIdMatch[1];

      setTimeout(() => {
        // Routes spécifiques au client pour les états
        switch (type) {
          case 'jour': navigate(`/client/${clientId}/etat/jour`); break;
          case 'mois': navigate(`/client/${clientId}/etat/mois`); break;
          case 'annee': navigate(`/client/${clientId}/etat/annee`); break;
          default: break;
        }
      }, 200);
    }
  };

  const handleAdminEtatClientClick = (action) => {
    if (action === 'voir-toutes') {
      setShowEtatClientDropdown(false);

      setTimeout(() => {
        navigate('/etat-client/tous');
      }, 200);
    }
  };


  const handleAfficherParJour = () => {
    setShowEtatCgmDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      navigate('/etat-bureau/jour');
    }, 200);
  };


  const handleAfficherParMois = () => {
    setShowEtatCgmDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      navigate('/etat-bureau/mois');
    }, 200);
  };

  const handleAfficherParAnnee = () => {
    setShowEtatCgmDropdown(false);

    // Attendre un peu pour que la transition se termine
    setTimeout(() => {
      navigate('/etat-bureau/annee');
    }, 200);
  };

  const handleVoirToutesLesEtats = () => {
    setShowEtatCgmDropdown(false);

    // Si on est sur la page d'accueil (Etat Bureau), naviguer vers la route
    if (!isClientDetailPage) {
      // Attendre un peu pour que la transition se termine
      setTimeout(() => {
        navigate('/etat-bureau/toutes');
      }, 200);
    } else {
      // Si on est dans une page de détails client, naviguer vers la route client
      setTimeout(() => {
        const clientId = location.pathname.split('/')[2];
        navigate(`/client/${clientId}/etat/tous`);
      }, 200);
    }
  };


  return (
    <>
      <style jsx>{`
        .modern-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1000;
          padding: 0.75rem 1rem;
        }
        
        .modern-brand {
          color: white;
          font-weight: 600;
          font-size: 1.4rem;
          transition: opacity 0.2s ease;
        }
        
        .modern-brand:hover {
          opacity: 0.9;
        }
        
        .modern-header .modern-btn,
        .modern-nav-container .modern-btn {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .modern-header .modern-btn:hover,
        .modern-nav-container .modern-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
          color: white;
        }
        
        .modern-header .modern-btn:active,
        .modern-nav-container .modern-btn:active {
          transform: scale(0.98);
        }
        
        
        .dropdown {
          position: relative;
          display: inline-block; /* Le conteneur s'adapte à la largeur du bouton */
        }
        
        .modern-dropdown {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-top: 0;
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          position: absolute;
          z-index: 9999;
          width: 100%;
          left: 0;
          top: 100%;
          padding: 4px 4px 8px 4px;
          visibility: hidden;
          box-sizing: border-box;
          min-width: 220px;
          backdrop-filter: blur(10px);
        }
        
        .modern-dropdown.show {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          visibility: visible;
        }
        
        .modern-dropdown-item {
          color: #2d3748;
          padding: 12px 20px;
          border-radius: 8px;
          margin: 4px 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          background: transparent;
          border: 1px solid transparent;
        }
        
        .modern-dropdown:not(.show) .modern-dropdown-item {
          opacity: 0;
          transform: translateX(-10px);
        }
        
        .modern-dropdown.show .modern-dropdown-item {
          animation: slideInItem 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .modern-dropdown.show li:nth-child(1) .modern-dropdown-item { animation-delay: 0.05s; }
        .modern-dropdown.show li:nth-child(2) .modern-dropdown-item { animation-delay: 0.1s; }
        .modern-dropdown.show li:nth-child(3) .modern-dropdown-item { animation-delay: 0.15s; }
        .modern-dropdown.show li:nth-child(4) .modern-dropdown-item { animation-delay: 0.2s; }
        .modern-dropdown.show li:nth-child(5) .modern-dropdown-item { animation-delay: 0.25s; }
        .modern-dropdown.show li:nth-child(6) .modern-dropdown-item { animation-delay: 0.3s; }
        .modern-dropdown.show li:nth-child(7) .modern-dropdown-item { animation-delay: 0.35s; }
        .modern-dropdown.show li:nth-child(8) .modern-dropdown-item { animation-delay: 0.4s; }
        
        @keyframes slideInItem {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .modern-dropdown-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modern-dropdown-item:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .modern-dropdown-item:hover::before {
          transform: scaleY(1);
        }
        
        .modern-dropdown-item:active {
          transform: translateX(4px) scale(0.98);
        }
        
        .modern-dropdown-item i {
          font-size: 1rem;
          width: 22px;
          margin-right: 10px;
          transition: transform 0.25s ease;
        }
        
        .modern-dropdown-item:hover i {
          transform: scale(1.1);
        }
        
        .modern-dropdown-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          border-radius: 8px;
          margin: 8px 8px 4px 8px;
          padding: 10px 16px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          opacity: 0;
          transform: translateY(-5px);
          transition: all 0.3s ease;
        }
        
        .modern-dropdown.show .modern-dropdown-header {
          opacity: 1;
          transform: translateY(0);
        }
        
        .modern-dropdown-header i {
          margin-right: 8px;
          font-size: 0.9rem;
        }
        
        .modern-dropdown .dropdown-divider {
          margin: 8px 12px;
          border-top: 2px solid rgba(102, 126, 234, 0.15);
          opacity: 0.5;
        }
        
        .modern-user-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 8px 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .modern-user-text {
          color: white;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .modern-nav-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1001;
          justify-content: center;
        }
        
        .modern-nav-container .dropdown {
          position: relative;
          z-index: 1000;
        }

        /* Styles simplifiés pour les boutons spéciaux */
        .modern-header .modern-btn-success,
        .modern-nav-container .modern-btn-success {
          background: rgba(40, 167, 69, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .modern-header .modern-btn-success:hover,
        .modern-nav-container .modern-btn-success:hover {
          background: rgba(40, 167, 69, 1);
        }
        
        .modern-header .modern-btn-warning,
        .modern-nav-container .modern-btn-warning {
          background: rgba(255, 193, 7, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .modern-header .modern-btn-warning:hover,
        .modern-nav-container .modern-btn-warning:hover {
          background: rgba(255, 193, 7, 1);
        }
        
        .modern-header .modern-btn-danger,
        .modern-nav-container .modern-btn-danger {
          background: rgba(220, 53, 69, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .modern-header .modern-btn-danger:hover,
        .modern-nav-container .modern-btn-danger:hover {
          background: rgba(220, 53, 69, 1);
        }
        
        @media (max-width: 992px) {
          .modern-header {
            padding: 0.5rem 0.75rem;
          }
          
          .modern-nav-container {
            gap: 4px;
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .modern-header .modern-btn,
          .modern-nav-container .modern-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
            margin: 2px;
          }
          
          .modern-brand {
            font-size: 1.2rem;
          }
          
          .modern-brand img {
            height: 28px !important;
            margin-right: 8px !important;
          }
          
          .modern-user-info {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 768px) {
          .modern-header {
            padding: 0.5rem;
            flex-wrap: wrap;
          }
          
          .modern-nav-container {
            width: 100%;
            order: 3;
            margin-top: 0.5rem;
            gap: 3px;
          }
          
          .modern-header .modern-btn,
          .modern-nav-container .modern-btn {
            padding: 5px 8px;
            font-size: 0.7rem;
            margin: 1px;
            flex: 1 1 auto;
            min-width: auto;
          }
          
          .modern-brand {
            font-size: 1rem;
            margin-right: 0.5rem !important;
          }
          
          .modern-brand img {
            height: 24px !important;
            margin-right: 6px !important;
          }
          
          .modern-user-info {
            padding: 5px 10px;
            font-size: 0.75rem;
            margin-left: auto;
          }
          
          .modern-dropdown {
            min-width: 180px;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 576px) {
          .modern-header {
            padding: 0.4rem;
          }
          
          .modern-header .modern-btn,
          .modern-nav-container .modern-btn {
            padding: 4px 6px;
            font-size: 0.65rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .modern-btn i {
            margin-right: 3px !important;
            font-size: 0.7rem;
          }
          
          .modern-brand {
            font-size: 0.9rem;
          }
          
          .modern-brand img {
            height: 20px !important;
            margin-right: 4px !important;
          }
        }

        /* Animations pour l'indicateur LIVE */
        @keyframes shine {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }

        @keyframes pulse-live {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(255, 0, 0, 0);
            transform: scale(1.1);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        .caisse-live-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5), 0 0 30px rgba(40, 167, 69, 0.3);
        }

        .caisse-live-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 20px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .caisse-live-badge:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .caisse-live-badge i {
          color: #ffd700;
          font-size: 1.1rem;
        }

        .caisse-label {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .caisse-amount {
          color: #ffd700;
          font-weight: 700;
          font-size: 1rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .caisse-loading {
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .caisse-live-badge {
            margin-left: 10px;
            padding: 6px 12px;
            font-size: 0.85rem;
          }

          .caisse-label {
            font-size: 0.8rem;
          }

          .caisse-amount {
            font-size: 0.9rem;
          }
        }
      `}</style>

      <nav className="navbar modern-header">
        <div className="container-fluid d-flex align-items-center justify-content-between flex-wrap">
          {/* Zone gauche: Logo */}
          <div className="d-flex align-items-center flex-shrink-0">
            <span
              className="navbar-brand modern-brand mb-0 h1 me-2 me-md-4"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
              title="Aller à l'accueil"
            >
              <img src="/logo.png" alt="Caisse CGM" style={{ height: '35px', marginRight: '15px', verticalAlign: 'middle' }} />
            </span>
          </div>

          {/* Bouton retour vers tableau des charges - visible uniquement dans les détails client */}
          {isClientDetailPage && (
            <div className="d-flex justify-content-center flex-grow-1">
              <button
                className="btn modern-btn modern-btn-success"
                onClick={() => {
                  // Naviguer vers le tableau des charges du client courant
                  const currentPath = location.pathname;
                  const match = currentPath.match(/\/client\/(\d+)/);
                  if (match) {
                    const clientId = match[1];
                    navigate(`/client/${clientId}/charges`);
                  }
                }}
                title="Retour au tableau des charges"
              >
                <i className="fas fa-arrow-left me-2"></i>Retour au tableau des charges
              </button>
            </div>
          )}

          {/* Groupe de navigation centré */}
          <div className="modern-nav-container d-flex justify-content-center flex-grow-1" style={{ minWidth: 0 }}>

            {/* Bouton Gérer les comptes - Visible uniquement pour les admins */}
            {!isClientDetailPage && user && user.role === 'admin' && (
              <button
                className="btn modern-btn"
                onClick={() => navigate('/comptes')}
                title="Gérer les comptes utilisateurs"
              >
                <i className="fas fa-user-cog me-2"></i>Gérer les comptes
              </button>
            )}




            {/* Bouton Gérer Client - navigation directe */}
            {!isClientDetailPage && (
              <button
                className="btn modern-btn"
                type="button"
                onClick={() => navigate('/clients')}
                title="Gérer les clients"
              >
                <i className="fas fa-users me-2"></i>Gérer Client
              </button>
            )}

            {/* Bouton Honoraires - Cliquer pour aller directement à la page */}
            {!isClientDetailPage && (
              <button
                className="btn modern-btn"
                type="button"
                onClick={() => handleHonorairesClick('toutes')}
                title="Honoraires (j/m/a)"
              >
                <i className="fas fa-money-bill-wave me-2"></i>Honoraires par période
              </button>
            )}

            {/* Bouton Client - Regroupe Dépenses Client et État Client pour Admin */}
            {!isClientDetailPage && user?.role === 'admin' && (
              <div className="dropdown">
                <button
                  className="btn modern-btn dropdown-toggle"
                  type="button"
                  onMouseEnter={() => setShowClientDropdown(true)}
                  onMouseLeave={() => setShowClientDropdown(false)}
                  aria-expanded={showClientDropdown}
                >
                  <i className="fas fa-users me-2"></i>Client
                </button>
                <ul
                  className={`dropdown-menu modern-dropdown ${showClientDropdown ? 'show' : ''}`}
                  onMouseEnter={() => setShowClientDropdown(true)}
                  onMouseLeave={() => setShowClientDropdown(false)}
                >
                  {/* Section Dépenses Client */}
                  <li>
                    <h6 className="dropdown-header modern-dropdown-header">
                      <i className="fas fa-credit-card me-2"></i>Dépenses Client
                    </h6>
                  </li>
                  {/* Liens Par jour/mois/année supprimés pour Dépenses Client (navbar admin) */}
                  <li>
                    <button
                      className="dropdown-item modern-dropdown-item"
                      onClick={() => handleAdminDepensesClientClick('voir-toutes')}
                    >
                      <i className="fas fa-list me-2"></i>Dépenses (j/m/a)
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Section État Client */}
                  <li>
                    <h6 className="dropdown-header modern-dropdown-header">
                      <i className="fas fa-chart-line me-2"></i>État Client
                    </h6>
                  </li>
                  {/* Boutons Par jour/mois/année supprimés pour État Client (navbar admin) */}
                  <li>
                    <button
                      className="dropdown-item modern-dropdown-item"
                      onClick={() => handleAdminEtatClientClick('voir-toutes')}
                    >
                      <i className="fas fa-list me-2"></i>Voir toutes les états
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Honoraires reçus - visible dans la page détail client - navigation directe */}
            {isClientDetailPage && (
              <button
                className="btn modern-btn"
                type="button"
                onClick={() => handleHonorairesClick('toutes')}
                title="Honoraires (j/m/a)"
              >
                <i className="fas fa-money-bill-wave me-2"></i>Honoraires (j/m/a)
              </button>
            )}

            {/* Bouton Dépenses Client - visible uniquement dans la page détail client - navigation directe */}
            {isClientDetailPage && (
              <button
                className="btn modern-btn"
                type="button"
                onClick={() => handleDepensesClick('voir-toutes')}
                title="Dépenses (j/m/a)"
              >
                <i className="fas fa-credit-card me-2"></i>Dépenses Client
              </button>
            )}


            {/* Bouton CGM - Regroupe Dépenses Bureau et État Bureau */}
            {!isClientDetailPage && (
              <div className="dropdown">
                <button
                  className="btn modern-btn dropdown-toggle"
                  type="button"
                  onMouseEnter={() => setShowCgmDropdown(true)}
                  onMouseLeave={() => setShowCgmDropdown(false)}
                  aria-expanded={showCgmDropdown}
                >
                  <i className="fas fa-building me-2"></i>CGM (dépenses et états )
                </button>
                <ul
                  className={`dropdown-menu modern-dropdown ${showCgmDropdown ? 'show' : ''}`}
                  onMouseEnter={() => setShowCgmDropdown(true)}
                  onMouseLeave={() => setShowCgmDropdown(false)}
                >
                  {/* Section Dépenses Bureau */}
                  <li>
                    <h6 className="dropdown-header modern-dropdown-header">
                      <i className="fas fa-credit-card me-2"></i>Dépenses CGM
                    </h6>
                  </li>
                  <li>
                    <button
                      className="dropdown-item modern-dropdown-item"
                      onClick={() => handleAddDepenseClick()}
                    >
                      <i className="fas fa-plus me-2"></i>Ajouter dépenses
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Section État Bureau */}
                  <li>
                    <h6 className="dropdown-header modern-dropdown-header">
                      <i className="fas fa-chart-line me-2"></i>État CGM
                    </h6>
                  </li>
                  <li>

                    <button
                      className="dropdown-item modern-dropdown-item"
                      onClick={handleAfficherParAnnee}
                    >
                      <i className="fas fa-calendar me-2"></i>Etat (j/m/a)
                    </button>
                  </li>

                </ul>
              </div>
            )}

            {/* Bouton Etat Client - visible uniquement dans la page détail client */}
            {isClientDetailPage && (
              <button
                className="btn modern-btn"
                type="button"
                onClick={() => handleClientDetailEtatFilterClick('annee')}
              >
                <i className="fas fa-chart-line me-2"></i>Etat (j/m/a)
              </button>
            )}

            {/* (Déplacés à gauche) voir reçus / CARTE / Statistiques */}

            {/* Bouton Déconnexion - à la fin de la ligne principale */}
            {isAuthenticated && (
              <button
                className="btn modern-btn modern-btn-danger"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <i className="fas fa-sign-out-alt me-2"></i>Déconnexion
              </button>
            )}
          </div>
        </div>

        {/* Modal des honoraires */}
        <HonorairesModal
          show={showHonorairesModal}
          onClose={() => setShowHonorairesModal(false)}
          type={honorairesType}
        />

        {/* Modal des dépenses */}
        <DepensesModal
          show={showDepensesModal}
          onClose={() => setShowDepensesModal(false)}
          action={depensesAction}
        />

        {/* Modal de filtrage des dépenses */}
        <DepensesFilterModal
          show={showDepensesFilterModal}
          onClose={() => setShowDepensesFilterModal(false)}
          type={depensesFilterType}
        />

        {/* Modal de toutes les honoraires */}
        <AllHonorairesModal
          show={showAllHonorairesModal}
          onClose={() => setShowAllHonorairesModal(false)}
        />

        {/* Modal de toutes les dépenses */}
        <AllDepensesModal
          show={showAllDepensesModal}
          onClose={() => setShowAllDepensesModal(false)}
          actionMode={depensesActionMode}
        />

        {/* Modal de tous les clients */}
        <AllClientsModal
          show={showAllClientsModal}
          onClose={() => setShowAllClientsModal(false)}
        />

        {/* Modal de tous les bénéficiaires */}
        <AllBeneficiairesModal
          show={showAllBeneficiairesModal}
          onClose={() => setShowAllBeneficiairesModal(false)}
        />

        {/* Gabarit de reçu */}
        <RecuTemplate
          show={showRecuTemplate}
          onClose={() => setShowRecuTemplate(false)}
          data={recuData}
        />

        {/* Modal Etat CGM */}
        <EtatCgmModal
          show={showEtatCgmModal}
          onClose={() => setShowEtatCgmModal(false)}
          filteredData={etatCgmFilteredData}
        />


        {/* Modal Gestion des utilisateurs (désactivé, page dédiée) */}


      </nav>

      {/* Sidebar (menu) à gauche pour ADMIN et CAISSIER: Caisse CGM (tous) / Voir reçus / CARTE / Statistiques (admin uniquement) */}
      {(user?.role === 'admin' || user?.role === 'caissier') && (
        <>
          <style>{`
            .admin-side-menu {
              position: fixed;
              top: 150px;
              left: 0;
              display: flex;
              flex-direction: column;
              gap: 8px;
              z-index: 999;
              transition: all 0.3s ease;
              padding: 10px 0;
            }
            .admin-side-menu:hover {
              left: 0;
            }
            .admin-side-menu .side-btn {
              background: linear-gradient(45deg, #667eea, #764ba2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: #fff;
              border-radius: 0 10px 10px 0;
              padding: 12px 8px;
              font-weight: 700;
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
              text-align: left;
              min-width: 50px;
              width: 50px;
              overflow: hidden;
              white-space: nowrap;
              position: relative;
            }
            .admin-side-menu:hover .side-btn {
              width: 160px;
              padding: 12px 14px;
            }
            .admin-side-menu .side-btn:hover { 
              transform: translateX(4px); 
              box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
              background: linear-gradient(45deg, #5568d3, #6a3d8a);
            }
            .admin-side-menu .side-btn i { 
              width: 20px; 
              margin-right: 0;
              display: inline-block;
              text-align: center;
            }
            .admin-side-menu:hover .side-btn i {
              margin-right: 10px;
            }
            .admin-side-menu .side-btn span {
              opacity: 0;
              transition: opacity 0.2s ease 0.1s;
            }
            .admin-side-menu:hover .side-btn span {
              opacity: 1;
            }
            .admin-side-menu .side-btn.gold {
              background: linear-gradient(45deg, #ffd700, #ffed4e);
              color: #1a1a1a;
              border: 1px solid rgba(255, 215, 0, 0.5);
              box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
            }
            .admin-side-menu .side-btn.gold:hover {
              background: linear-gradient(45deg, #ffed4e, #ffd700);
              box-shadow: 0 8px 20px rgba(255, 215, 0, 0.6);
            }
            @media (max-width: 992px) { .admin-side-menu { display: none; } }
          `}</style>
          <div className="admin-side-menu">
            {isAuthenticated && (
              <button className="side-btn gold" onClick={() => navigate('/caisse-cgm')} title="Gérer la caisse CGM">
                <i className="fas fa-wallet"></i>
                <span>Caisse CGM</span>
              </button>
            )}
            {user?.role === 'admin' && (
              <>
                <button className="side-btn" onClick={() => navigate('/cartes-bancaires')} title="Suivi carte bancaire">
                  <i className="fas fa-credit-card"></i>
                  <span>CARTE</span>
                </button>
                <button className="side-btn" onClick={() => navigate('/dashboard')} title="Statistiques">
                  <i className="fas fa-chart-line"></i>
                  <span>Statistiques</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}