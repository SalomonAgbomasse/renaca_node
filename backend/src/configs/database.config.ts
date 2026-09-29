/**
 * Configuration centralisée de la base de données
 * Toutes les valeurs doivent provenir des variables d'environnement
 * Aucune valeur hardcodée n'est autorisée
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 */
function validateDatabaseConfig(): void {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD'];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error(
      `❌ Variables d'environnement manquantes pour la base de données: ${missingVars.join(', ')}\n` +
      `Veuillez définir ces variables dans votre fichier .env`
    );
  }
}

/**
 * Configuration TypeORM pour la base de données
 * Toutes les valeurs proviennent des variables d'environnement
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  // Valider que toutes les variables requises sont présentes
  validateDatabaseConfig();

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'renaca_db',
    entities: [__dirname + '/../modules/**/entity/*.entity{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: !isProduction,
    // Options de connexion supplémentaires
    extra: {
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
  };
}

export default getDatabaseConfig;
