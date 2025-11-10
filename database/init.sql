-- Script d'initialisation de la base de données comptable_app
-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS comptable_app;
USE comptable_app;

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_client VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    telephone VARCHAR(20),
    adresse TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    INDEX idx_code_client (code_client),
    INDEX idx_username (username),
    INDEX idx_nom_prenom (nom, prenom)
);

-- Table des opérations comptables
CREATE TABLE IF NOT EXISTS operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    type_operation ENUM('vente', 'achat', 'remboursement', 'credit', 'debit') NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference VARCHAR(50),
    date_operation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('en_cours', 'termine', 'annule') DEFAULT 'en_cours',
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_id (client_id),
    INDEX idx_type_operation (type_operation),
    INDEX idx_date_operation (date_operation)
);

-- Table des charges
CREATE TABLE IF NOT EXISTS charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    type_charge ENUM('frais_gestion', 'commission', 'penalite', 'frais_bancaire', 'autre') NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference VARCHAR(50),
    categorie VARCHAR(50),
    date_charge TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif', 'annule', 'rembourse') DEFAULT 'actif',
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_id (client_id),
    INDEX idx_type_charge (type_charge),
    INDEX idx_categorie (categorie),
    INDEX idx_date_charge (date_charge)
);

-- Table des utilisateurs (experts comptables)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role ENUM('admin', 'comptable', 'utilisateur') DEFAULT 'comptable',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif', 'inactif') DEFAULT 'actif',
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Insertion de données de test
INSERT INTO clients (code_client, nom, prenom, username, email, telephone, adresse) VALUES
('CLI001', 'Dupont', 'Jean', 'jdupont', 'jean.dupont@email.com', '0123456789', '123 Rue de la Paix, Paris'),
('CLI002', 'Martin', 'Marie', 'mmartin', 'marie.martin@email.com', '0987654321', '456 Avenue des Champs, Lyon'),
('CLI003', 'Bernard', 'Pierre', 'pbernard', 'pierre.bernard@email.com', '0555666777', '789 Boulevard Saint-Germain, Marseille'),
('CLI004', 'Dubois', 'Sophie', 'sdubois', 'sophie.dubois@email.com', '0444555666', '321 Rue de Rivoli, Toulouse'),
('CLI005', 'Moreau', 'Luc', 'lmoreau', 'luc.moreau@email.com', '0333444555', '654 Place Bellecour, Lyon');

-- Insertion d'opérations de test
INSERT INTO operations (client_id, type_operation, montant, description, reference) VALUES
(1, 'vente', 1500.00, 'Vente de produits', 'V2024001'),
(1, 'credit', 200.00, 'Avoir client', 'AV2024001'),
(2, 'vente', 2300.50, 'Prestation de service', 'V2024002'),
(2, 'debit', 100.00, 'Frais de dossier', 'FD2024001'),
(3, 'vente', 850.75, 'Vente de marchandises', 'V2024003'),
(4, 'remboursement', 300.00, 'Remboursement client', 'R2024001'),
(5, 'vente', 1200.00, 'Consultation comptable', 'V2024004');

-- Insertion de charges de test
INSERT INTO charges (client_id, type_charge, montant, description, reference, categorie) VALUES
(1, 'frais_gestion', 25.00, 'Frais de gestion mensuel', 'FG2024001', 'mensuel'),
(1, 'commission', 75.00, 'Commission sur vente', 'COM2024001', 'vente'),
(2, 'frais_gestion', 30.00, 'Frais de gestion mensuel', 'FG2024002', 'mensuel'),
(2, 'penalite', 50.00, 'Pénalité de retard', 'PEN2024001', 'penalite'),
(3, 'frais_bancaire', 15.00, 'Frais bancaire', 'FB2024001', 'bancaire'),
(4, 'frais_gestion', 25.00, 'Frais de gestion mensuel', 'FG2024003', 'mensuel'),
(5, 'commission', 60.00, 'Commission sur vente', 'COM2024002', 'vente');

-- Création d'un utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO users (username, email, password_hash, nom, prenom, role) VALUES
('admin', 'admin@comptable.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin');

-- Affichage des tables créées
SHOW TABLES;
