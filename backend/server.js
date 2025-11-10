require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./config/database');

// Import des routes
const clientRoutes = require('./routes/clients');
const operationRoutes = require('./routes/operations');
const chargeRoutes = require('./routes/charges');
const chargesMensuellesRoutes = require('./routes/charges-mensuelles');
const honorairesRoutes = require('./routes/honoraires');
const depensesRoutes = require('./routes/depenses');
const statisticsRoutes = require('./routes/statistics');
const printHistoryRoutes = require('./routes/print-history');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const caisseCgmRoutes = require('./routes/caisse-cgm');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Fichiers statiques pour les signatures uploadées
const uploadsDir = path.join(__dirname, 'uploads', 'signatures');
try {
    fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
    // ignore si déjà existant
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/charges', chargeRoutes);
app.use('/api/charges-mensuelles', chargesMensuellesRoutes);
app.use('/api/honoraires', honorairesRoutes);
app.use('/api/depenses', depensesRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/print-history', printHistoryRoutes);
app.use('/api/caisse-cgm', caisseCgmRoutes);

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API de gestion comptable fonctionne!' });
});

// Route de santé
app.get('/api/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        status: 'OK',
        database: dbStatus ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: err.message
    });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Accessible sur le réseau local à l'adresse: http://[VOTRE_IP_LOCALE]:${PORT}`);
    console.log(`📱 Pour accéder depuis d'autres appareils du réseau, utilisez l'IP de cette machine`);

    // Test de connexion à la base de données
    await testConnection();
});

module.exports = app;
