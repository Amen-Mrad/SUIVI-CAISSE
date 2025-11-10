# 📋 Liste Complète des URLs des Pages (Frontend)

Ce document liste toutes les URLs (routes) des pages de votre application frontend. **Toutes ces URLs sont déjà créées et fonctionnelles.**

## 🌐 Base URL

**En développement local :**
```
http://localhost:3000
```

**En production avec domaine :**
```
https://votredomaine.com
```

---

## 🔐 Pages d'Authentification

| URL | Page | Description | Protection |
|-----|------|-------------|------------|
| `/login` | LoginPage | Page de connexion | Public |
| `/register` | RegisterPage | Page d'inscription | Public |
| `/regst` | RegisterPage | Alias pour l'inscription | Public |

---

## 🏠 Pages Principales

| URL | Page | Description | Protection |
|-----|------|-------------|------------|
| `/` | Redirection | Redirige vers `/clients` | Protégé |
| `/accueil` | HomePage | Page d'accueil | Protégé |
| `/acceuil` | HomePage | Alias (orthographe alternative) | Protégé |
| `/clients` | AllClientsPage | Liste de tous les clients | Protégé |
| `/search-client` | SearchClientPage | Recherche de client | Protégé |
| `/add-client` | AddClientPage | Ajouter un nouveau client | Protégé |
| `/comptes` | UserManagementPage | Gestion des utilisateurs | Protégé |
| `/dashboard` | AdminDashboard | Tableau de bord admin | Protégé |
| `/admin/dashboard` | AdminDashboard | Alias du dashboard | Protégé |

---

## 👤 Pages Client (avec ID dynamique)

| URL | Page | Description |
|-----|------|-------------|
| `/client/:id` | Redirection | Redirige vers `/client/:id/charges` |
| `/client/:id/charges` | ClientCharges | Charges d'un client |
| `/client/:id/depenses/toutes` | AllDepensesPage | Toutes les dépenses d'un client |
| `/client/:id/depenses/jour` | ClientDepensesByDayPage | Dépenses par jour |
| `/client/:id/depenses/mois` | ClientDepensesByMonthPage | Dépenses par mois |
| `/client/:id/depenses/annee` | ClientDepensesByYearPage | Dépenses par année |
| `/client/:id/depenses/beneficiaire` | ClientDepensesByBeneficiairePage | Dépenses par bénéficiaire |
| `/client/:id/honoraires/jour` | HonorairesByDayPage | Honoraires par jour |
| `/client/:id/honoraires/mois` | HonorairesByMonthPage | Honoraires par mois |
| `/client/:id/honoraires/annee` | HonorairesByYearPage | Honoraires par année |
| `/client/:id/honoraires/tous` | AllHonorairesPage | Tous les honoraires |
| `/client/:id/etat/jour` | EtatClientByDayPage | État client par jour |
| `/client/:id/etat/mois` | EtatClientByMonthPage | État client par mois |
| `/client/:id/etat/annee` | EtatClientByYearPage | État client par année |
| `/client/:id/etat/toutes` | AllEtatClientPage | Tous les états client |
| `/client/:id/etat/honoraires` | EtatsCgmHonorairesPage | États CGM honoraires |
| `/client/:id/print-receipt` | PrintReceiptPage | Impression reçu (sans header) |

**Exemple :** `/client/5/charges` affiche les charges du client avec l'ID 5

---

## 💵 Pages Honoraires (Globales)

| URL | Page | Description |
|-----|------|-------------|
| `/honoraires/jour` | HonorairesByDayPage | Honoraires par jour (tous clients) |
| `/honoraires/mois` | HonorairesByMonthPage | Honoraires par mois (tous clients) |
| `/honoraires/annee` | HonorairesByYearPage | Honoraires par année (tous clients) |
| `/honoraires/tous` | AllHonorairesPage | Tous les honoraires (tous clients) |

---

## 💸 Pages Dépenses Client (Globales)

| URL | Page | Description |
|-----|------|-------------|
| `/depenses-client/jour` | DepensesClientByDayPage | Dépenses client par jour |
| `/depenses-client/mois` | DepensesClientByMonthPage | Dépenses client par mois |
| `/depenses-client/annee` | DepensesClientByYearPage | Dépenses client par année |
| `/depenses-client/toutes` | AllDepensesClientPage | Toutes les dépenses client |

---

## 🏢 Pages Dépenses Bureau

| URL | Page | Description |
|-----|------|-------------|
| `/depenses-bureau/ajouter` | AddDepenseBureauPage | Ajouter une dépense bureau |
| `/depenses-bureau/jour` | DepensesBureauByDayPage | Dépenses bureau par jour |
| `/depenses-bureau/mois` | DepensesBureauByMonthPage | Dépenses bureau par mois |
| `/depenses-bureau/annee` | DepensesBureauByYearPage | Dépenses bureau par année |
| `/depenses-bureau/beneficiaire` | DepensesBureauByBeneficiairePage | Dépenses bureau par bénéficiaire |
| `/depenses-bureau/toutes` | AllDepensesBureauPage | Toutes les dépenses bureau |

---

## 💰 Pages Dépenses CGM

| URL | Page | Description |
|-----|------|-------------|
| `/depenses-cgm/ajouter` | AddDepensePage | Ajouter une dépense CGM |

---

## 📊 Pages État Bureau

| URL | Page | Description |
|-----|------|-------------|
| `/etat-bureau/beneficiaire` | EtatBureauByBeneficiairePage | État bureau par bénéficiaire |
| `/etat-bureau/jour` | EtatBureauByDayPage | État bureau par jour |
| `/etat-bureau/mois` | EtatBureauByMonthPage | État bureau par mois |
| `/etat-bureau/annee` | EtatBureauByYearPage | État bureau par année |
| `/etat-bureau/toutes` | AllEtatBureauPage | Tous les états bureau |

---

## 📈 Pages État Client (Globales)

| URL | Page | Description |
|-----|------|-------------|
| `/etat-client/tous` | AllEtatClientsGlobalPage | Tous les états clients |
| `/etat-client/jour` | EtatClientGlobalByDayPage | États clients par jour |
| `/etat-client/mois` | EtatClientGlobalByMonthPage | États clients par mois |
| `/etat-client/annee` | EtatClientGlobalByYearPage | États clients par année |
| `/etat-client/client` | EtatClientParClientPage | États par client |

---

## 🖨️ Pages Impression

| URL | Page | Description | Header |
|-----|------|-------------|--------|
| `/etat-client/print` | EtatClientPrintPage | Impression état client | Non |
| `/etat-cgm/print` | EtatCgmPrintPage | Impression état CGM | Non |
| `/print-history` | PrintHistoryPage | Historique des impressions | Oui |

---

## 🏦 Pages Caisse et Cartes

| URL | Page | Description |
|-----|------|-------------|
| `/caisse-cgm` | CaisseCgmPage | Gestion de la caisse CGM |
| `/cartes-bancaires` | CartesBancairesPage | Suivi des opérations carte bancaire |

---

## 🔄 Redirections et Routes Spéciales

| URL | Comportement |
|-----|--------------|
| `/` | Redirige vers `/clients` |
| `/client/:id` | Redirige vers `/client/:id/charges` |
| `*` (toute autre URL) | Redirige vers `/clients` (404) |

---

## 📝 Notes Importantes

### ✅ Toutes les URLs sont déjà créées !

Vous n'avez **pas besoin de créer** ces URLs, elles sont toutes déjà configurées dans `frontend/src/App.js`.

### 🔒 Protection des Routes

- **Routes publiques** : `/login`, `/register`, `/regst`
- **Routes protégées** : Toutes les autres routes nécessitent une authentification (via `ProtectedRoute`)

### 🎯 Paramètres Dynamiques

Les routes avec `:id` sont dynamiques :
- `/client/:id/charges` → `/client/5/charges` (client ID 5)
- `/client/:id/depenses/jour` → `/client/10/depenses/jour` (client ID 10)

### 📱 Format des URLs en Production

**En développement :**
```
http://localhost:3000/clients
http://localhost:3000/client/5/charges
```

**En production :**
```
https://votredomaine.com/clients
https://votredomaine.com/client/5/charges
```

### 🎨 Pages avec Header

La plupart des pages incluent le composant `<Header />` pour la navigation. Les pages d'impression (`/print-*`) n'ont pas de header pour un affichage propre.

---

## 📊 Résumé par Catégorie

- **Authentification** : 3 routes
- **Pages principales** : 9 routes
- **Pages client (avec ID)** : 15 routes
- **Honoraires globales** : 4 routes
- **Dépenses client globales** : 4 routes
- **Dépenses bureau** : 6 routes
- **Dépenses CGM** : 1 route
- **État bureau** : 5 routes
- **État client globales** : 5 routes
- **Impression** : 3 routes
- **Caisse/Cartes** : 2 routes
- **Redirections** : 3 routes

**Total : ~60 routes frontend déjà configurées**

---

## 🚀 Comment Utiliser ces URLs

### Navigation dans le code React

```javascript
import { useNavigate } from 'react-router-dom';

function MonComposant() {
  const navigate = useNavigate();
  
  // Naviguer vers une page
  navigate('/clients');
  navigate('/client/5/charges');
  navigate('/honoraires/jour');
}
```

### Liens dans les composants

```jsx
import { Link } from 'react-router-dom';

<Link to="/clients">Voir tous les clients</Link>
<Link to={`/client/${clientId}/charges`}>Voir les charges</Link>
```

### Redirection programmatique

```javascript
import { Navigate } from 'react-router-dom';

<Navigate to="/clients" replace />
```

---

## ⚠️ Important pour l'Hébergement

Quand vous hébergez sur un domaine, **toutes ces URLs fonctionneront automatiquement** car React Router gère le routing côté client.

**Configuration requise :**
- Le serveur web (Nginx/Apache) doit être configuré pour rediriger toutes les routes vers `index.html`
- C'est déjà prévu dans le guide d'hébergement (voir `GUIDE-HEBERGEMENT-DOMAINE.md`)

**Exemple de configuration Nginx :**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Cela permet à React Router de gérer toutes les routes, même lors d'un rafraîchissement de page.

---

**Dernière mise à jour** : Basé sur l'analyse de `frontend/src/App.js`

