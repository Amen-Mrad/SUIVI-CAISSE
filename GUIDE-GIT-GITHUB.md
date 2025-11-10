# 📦 Guide : Déposer le Projet sur GitHub

Ce guide vous explique comment déposer votre projet "gestionCAIS" sur votre repository GitHub "suivi caisse".

---

## 📋 Prérequis

1. ✅ **Git installé** sur votre ordinateur
   - Vérifier : `git --version`
   - Si pas installé : [Télécharger Git](https://git-scm.com/downloads)

2. ✅ **Compte GitHub** créé
3. ✅ **Repository "suivi caisse"** créé sur GitHub

---

## 🔧 Étape 1 : Vérifier/Créer le fichier .gitignore

Avant de commiter, assurez-vous d'avoir un fichier `.gitignore` pour exclure les fichiers inutiles.

### Créer/Modifier `.gitignore` à la racine du projet :

```gitignore
# Dépendances
node_modules/
backend/node_modules/
frontend/node_modules/

# Variables d'environnement (IMPORTANT - contient des secrets)
.env
.env.local
.env.production
backend/.env
frontend/.env
frontend/.env.production

# Build
frontend/build/
dist/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Fichiers système
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Uploads (optionnel - si vous voulez exclure les signatures)
backend/uploads/signatures/*
!backend/uploads/signatures/.gitkeep

# Fichiers temporaires
*.tmp
*.temp
```

**⚠️ IMPORTANT :** Ne jamais commiter les fichiers `.env` qui contiennent vos secrets (mots de passe DB, JWT_SECRET, etc.)

---

## 🚀 Étape 2 : Initialiser Git (si pas déjà fait)

Ouvrez un terminal dans le dossier de votre projet :

```bash
# Aller dans le dossier du projet
cd C:\Users\amenm\gestionCAIS

# Vérifier si Git est déjà initialisé
git status

# Si erreur "not a git repository", initialiser :
git init
```

---

## 📝 Étape 3 : Ajouter les fichiers au staging

```bash
# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Vérifier les fichiers ajoutés
git status
```

Vous devriez voir tous vos fichiers sauf `node_modules/`, `.env`, etc.

---

## 💾 Étape 4 : Faire le premier commit

```bash
# Créer le commit initial
git commit -m "Initial commit - Application de gestion comptable"

# Ou avec un message plus détaillé :
git commit -m "Initial commit

- Backend Express.js avec API REST
- Frontend React avec Bootstrap
- Système d'authentification JWT
- Gestion clients, honoraires, dépenses
- Dashboard avec graphiques
- Base de données MySQL"
```

---

## 🔗 Étape 5 : Connecter au repository GitHub

**Option A : Si le repository est vide (recommandé)**

```bash
# Ajouter le remote (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/suivi-caisse.git

# OU avec SSH (si vous avez configuré SSH) :
# git remote add origin git@github.com:VOTRE_USERNAME/suivi-caisse.git
```

**Option B : Si le repository a déjà des fichiers (README, .gitignore, etc.)**

```bash
# Ajouter le remote
git remote add origin https://github.com/VOTRE_USERNAME/suivi-caisse.git

# Récupérer les fichiers existants
git pull origin main --allow-unrelated-histories

# Résoudre les conflits si nécessaire, puis :
git add .
git commit -m "Merge avec repository GitHub"
```

**Trouver l'URL de votre repository :**
- Allez sur GitHub → Votre repository "suivi caisse"
- Cliquez sur le bouton vert "Code"
- Copiez l'URL HTTPS (ex: `https://github.com/votre-username/suivi-caisse.git`)

---

## 📤 Étape 6 : Pousser vers GitHub

```bash
# Vérifier la branche actuelle
git branch

# Si vous êtes sur "master", renommer en "main" (standard GitHub)
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

**Si c'est la première fois, GitHub vous demandera vos identifiants :**
- Username : votre nom d'utilisateur GitHub
- Password : utilisez un **Personal Access Token** (pas votre mot de passe)

**Créer un Personal Access Token :**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Donnez-lui un nom (ex: "suivi-caisse")
4. Cochez `repo` (accès complet aux repositories)
5. Generate token
6. **Copiez le token** (vous ne pourrez plus le voir après)
7. Utilisez ce token comme mot de passe lors du `git push`

---

## ✅ Étape 7 : Vérifier sur GitHub

1. Allez sur votre repository GitHub : `https://github.com/VOTRE_USERNAME/suivi-caisse`
2. Vérifiez que tous vos fichiers sont présents
3. Vérifiez que `node_modules/` et `.env` ne sont **PAS** présents

---

## 🔄 Commandes Utiles pour les Mises à Jour Futures

### Après avoir modifié des fichiers :

```bash
# Voir les fichiers modifiés
git status

# Ajouter les modifications
git add .

# Ou ajouter des fichiers spécifiques
git add fichier1.js fichier2.js

# Créer un commit
git commit -m "Description des modifications"

# Pousser vers GitHub
git push origin main
```

### Voir l'historique des commits :

```bash
git log
```

### Annuler des modifications non commitées :

```bash
# Annuler les modifications d'un fichier
git checkout -- nom-du-fichier.js

# Annuler toutes les modifications
git reset --hard
```

---

## 📋 Checklist Avant de Pousser

- [ ] Fichier `.gitignore` créé et vérifié
- [ ] Fichiers `.env` exclus (vérifier avec `git status`)
- [ ] `node_modules/` exclus
- [ ] Fichiers sensibles exclus (mots de passe, clés API)
- [ ] Code testé et fonctionnel
- [ ] Repository GitHub créé
- [ ] Remote ajouté correctement

---

## ⚠️ Erreurs Courantes et Solutions

### Erreur : "remote origin already exists"

```bash
# Voir les remotes existants
git remote -v

# Supprimer l'ancien remote
git remote remove origin

# Ajouter le nouveau
git remote add origin https://github.com/VOTRE_USERNAME/suivi-caisse.git
```

### Erreur : "failed to push some refs"

```bash
# Récupérer les changements distants d'abord
git pull origin main --allow-unrelated-histories

# Résoudre les conflits si nécessaire
# Puis pousser à nouveau
git push origin main
```

### Erreur : "authentication failed"

- Vérifiez que vous utilisez un **Personal Access Token** (pas votre mot de passe)
- Ou configurez SSH : [Guide SSH GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### Fichiers .env commités par erreur

```bash
# Retirer du suivi Git (mais garder le fichier local)
git rm --cached backend/.env
git rm --cached frontend/.env

# Ajouter à .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore

# Commit
git add .gitignore
git commit -m "Remove .env files from tracking"

# Push
git push origin main
```

---

## 🎯 Commandes Complètes (Copier-Coller)

### Pour un nouveau projet (première fois) :

```bash
cd C:\Users\amenm\gestionCAIS
git init
git add .
git commit -m "Initial commit - Application de gestion comptable"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/suivi-caisse.git
git push -u origin main
```

**Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub.**

---

## 📚 Ressources Utiles

- [Documentation Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Créer un Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

**Bon dépôt sur GitHub ! 🚀**

