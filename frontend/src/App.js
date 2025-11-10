import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import UserManagementPage from './components/UserManagementPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientDetails from './components/ClientDetails';
import ClientCharges from './components/ClientCharges';
import HomePage from './components/HomePage';
import AllClientsPage from './components/AllClientsPage';
import SearchClientPage from './components/SearchClientPage';
import AddClientPage from './components/AddClientPage';
import HonorairesByDayPage from './components/HonorairesByDayPage';
import HonorairesByMonthPage from './components/HonorairesByMonthPage';
import HonorairesByYearPage from './components/HonorairesByYearPage';
import AllHonorairesPage from './components/AllHonorairesPage';
import DepensesBureauByBeneficiairePage from './components/DepensesBureauByBeneficiairePage';
import DepensesBureauByDayPage from './components/DepensesBureauByDayPage';
import DepensesBureauByMonthPage from './components/DepensesBureauByMonthPage';
import DepensesBureauByYearPage from './components/DepensesBureauByYearPage';
import AllDepensesBureauPage from './components/AllDepensesBureauPage';
import AllEtatBureauPage from './components/AllEtatBureauPage';
import EtatBureauByBeneficiairePage from './components/EtatBureauByBeneficiairePage';
import EtatBureauByDayPage from './components/EtatBureauByDayPage';
import EtatBureauByMonthPage from './components/EtatBureauByMonthPage';
import EtatBureauByYearPage from './components/EtatBureauByYearPage';
import ClientDepensesByDayPage from './components/ClientDepensesByDayPage';
import ClientDepensesByMonthPage from './components/ClientDepensesByMonthPage';
import ClientDepensesByYearPage from './components/ClientDepensesByYearPage';
import DepensesClientByDayPage from './components/DepensesClientByDayPage';
import DepensesClientByMonthPage from './components/DepensesClientByMonthPage';
import DepensesClientByYearPage from './components/DepensesClientByYearPage';
import ClientDepensesByBeneficiairePage from './components/ClientDepensesByBeneficiairePage';
import PrintReceiptPage from './components/PrintReceiptPage';
import EtatClientByDayPage from './components/EtatClientByDayPage';
import EtatClientByMonthPage from './components/EtatClientByMonthPage';
import EtatClientByYearPage from './components/EtatClientByYearPage';
import AllEtatClientPage from './components/AllEtatClientPage';
import AllDepensesPage from './components/AllDepensesPage';
import AllDepensesClientPage from './components/AllDepensesClientPage';
import EtatsCgmHonorairesPage from './components/EtatsCgmHonorairesPage';
import AllEtatClientsGlobalPage from './components/AllEtatClientsGlobalPage';
import EtatClientGlobalByDayPage from './components/EtatClientGlobalByDayPage';
import EtatClientGlobalByMonthPage from './components/EtatClientGlobalByMonthPage';
import EtatClientGlobalByYearPage from './components/EtatClientGlobalByYearPage';
import EtatClientParClientPage from './components/EtatClientParClientPage';
import AddDepenseBureauPage from './components/AddDepenseBureauPage';
import AddDepensePage from './components/AddDepensePage';
import PrintHistoryPage from './components/PrintHistoryPage';
import EtatClientPrintPage from './components/EtatClientPrintPage';
import EtatCgmPrintPage from './components/EtatCgmPrintPage';
import AdminDashboard from './components/AdminDashboard';
import CaisseCgmPage from './components/CaisseCgmPage';
import CartesBancairesPage from './components/CartesBancairesPage';

// Composant de redirection pour /client/:id vers /client/:id/charges
function ClientRedirect() {
  const { id } = useParams();
  return <Navigate to={`/client/${id}/charges`} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/regst" element={<RegisterPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/clients" replace />
            </ProtectedRoute>
          } />
          {/* Routes Honoraires dans le contexte client (navbar client) */}
          <Route path="/client/:id/honoraires/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/honoraires/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/honoraires/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/honoraires/tous" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllHonorairesPage />
              </div>
            </ProtectedRoute>
          } />

          {/* Route: Voir toutes les dépenses d'un client */}
          <Route path="/client/:id/depenses/toutes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllDepensesPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/accueil" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HomePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/acceuil" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HomePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id" element={
            <ProtectedRoute>
              <ClientRedirect />
            </ProtectedRoute>
          } />
          <Route path="/client/:id/charges" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <ClientCharges />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllClientsPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/comptes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <UserManagementPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/search-client" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <SearchClientPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/add-client" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AddClientPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/honoraires/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/honoraires/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/honoraires/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <HonorairesByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/honoraires/tous" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllHonorairesPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/beneficiaire" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesBureauByBeneficiairePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/ajouter" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AddDepenseBureauPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-cgm/ajouter" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AddDepensePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesBureauByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesBureauByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesBureauByYearPage />
              </div>
            </ProtectedRoute>
          } />
          {/* Dépenses Client (global, toutes clients) */}
          <Route path="/depenses-client/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesClientByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-client/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesClientByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-client/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <DepensesClientByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-bureau/toutes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllDepensesBureauPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/depenses-client/toutes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllDepensesClientPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-bureau/beneficiaire" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatBureauByBeneficiairePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-bureau/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatBureauByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-bureau/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatBureauByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-bureau/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatBureauByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-bureau/toutes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllEtatBureauPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/depenses/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <ClientDepensesByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/depenses/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <ClientDepensesByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/depenses/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <ClientDepensesByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/depenses/beneficiaire" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <ClientDepensesByBeneficiairePage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/print-receipt" element={
            <ProtectedRoute>
              <PrintReceiptPage />
            </ProtectedRoute>
          } />
          {/* Impression d'état - routes dédiées */}
          <Route path="/etat-client/print" element={
            <ProtectedRoute>
              <EtatClientPrintPage />
            </ProtectedRoute>
          } />
          <Route path="/etat-cgm/print" element={
            <ProtectedRoute>
              <EtatCgmPrintPage />
            </ProtectedRoute>
          } />
          <Route path="/client/:id/etat/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/etat/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/etat/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/etat/toutes" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllEtatClientPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/client/:id/etat/honoraires" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatsCgmHonorairesPage />
              </div>
            </ProtectedRoute>
          } />
          {/* États Client globaux */}
          <Route path="/etat-client/tous" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <AllEtatClientsGlobalPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-client/jour" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientGlobalByDayPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-client/mois" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientGlobalByMonthPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-client/annee" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientGlobalByYearPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/etat-client/client" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <EtatClientParClientPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/print-history" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <PrintHistoryPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Header />
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <Header />
              <AdminDashboard />
            </ProtectedRoute>
          } />
          {/* Route de gestion de la caisse CGM */}
          <Route path="/caisse-cgm" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <CaisseCgmPage />
              </div>
            </ProtectedRoute>
          } />
          {/* Route de suivi des opérations carte bancaire */}
          <Route path="/cartes-bancaires" element={
            <ProtectedRoute>
              <Header />
              <div className="container-fluid mt-4">
                <CartesBancairesPage />
              </div>
            </ProtectedRoute>
          } />
          {/* Catch-all: redirige vers /clients (protégé) */}
          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
