const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function swapUserIds() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'renaca_db'
  });

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Étape 1 : Libérer l'id 1 temporairement si Ajmal a l'id 1
    await conn.query("UPDATE users SET id = 9999 WHERE email = 'ajmalassouma2@gmail.com'");
    
    // Étape 2 : Mettre Salomon AGBOMASSE à l'id 1
    await conn.query("UPDATE users SET id = 1 WHERE email = 'salomonagbomasse25@gmail.com'");
    
    // Étape 3 : Mettre Ajmal ASSOUMA à l'id 2
    await conn.query("UPDATE users SET id = 2 WHERE email = 'ajmalassouma2@gmail.com'");
    
    // Étape 4 : Réajuster l'AUTO_INCREMENT à 3
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 3');
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const [rows] = await conn.query('SELECT id, uuid, lastname, firstname, email, phone FROM users ORDER BY id ASC');
    console.log('✅ Utilisateurs mis à jour avec succès :');
    console.table(rows);
  } catch (error) {
    console.error('❌ Erreur lors du swap des identifiants:', error);
  } finally {
    await conn.end();
  }
}

swapUserIds();
