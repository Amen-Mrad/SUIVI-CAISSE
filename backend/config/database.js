const mysql = require('mysql2');
require('dotenv').config();

// Configuration de la connexion à la base de données existante
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'comptable_app',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Options de timeout correctes pour MySQL2
  acquireTimeout: 60000, // Timeout pour obtenir une connexion du pool (valide)
  connectTimeout: 10000, // Timeout pour la connexion initiale (valide)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Promisifier le pool pour utiliser async/await
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Connexion à la base de données MySQL réussie');
    console.log(`📊 Base de données: ${dbConfig.database}`);
    console.log(`🔌 Hôte: ${dbConfig.host}:${dbConfig.port}`);

    // Vérifier les tables existantes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables disponibles:', tables.map(table => Object.values(table)[0]));

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    console.error(`   Code d'erreur: ${error.code || 'N/A'}`);
    console.error(`   Configuration actuelle:`);
    console.error(`   - Hôte: ${dbConfig.host}:${dbConfig.port}`);
    console.error(`   - Utilisateur: ${dbConfig.user}`);
    console.error(`   - Base de données: ${dbConfig.database}`);
    console.error('💡 Vérifiez que:');
    console.error('   1. MySQL/MariaDB est démarré (XAMPP, WAMP, ou service Windows)');
    console.error('   2. Le service MySQL écoute sur le port ' + dbConfig.port);
    console.error('   3. La base "' + dbConfig.database + '" existe');
    console.error('   4. Les identifiants sont corrects');
    console.error('   5. Le pare-feu n\' bloque pas la connexion');

    if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  Timeout de connexion - MySQL n\'est probablement pas démarré ou inaccessible');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Connexion refusée - Vérifiez que MySQL écoute sur ' + dbConfig.host + ':' + dbConfig.port);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('⚠️  Accès refusé - Vérifiez le nom d\'utilisateur et le mot de passe');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('⚠️  Base de données non trouvée - Créez la base "' + dbConfig.database + '"');
    }

    return false;
  }
};

module.exports = {
  pool: promisePool,
  testConnection
};