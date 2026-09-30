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
  const missingVars: string[] = [];

  if (!process.env.DB_HOST) missingVars.push('DB_HOST');
  if (!process.env.DB_PORT) missingVars.push('DB_PORT');
  if (!process.env.DB_USERNAME && !process.env.DB_USER) missingVars.push('DB_USERNAME / DB_USER');
  if (!process.env.DB_DATABASE && !process.env.DB_NAME) missingVars.push('DB_DATABASE / DB_NAME');

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
function stripQuotes(val?: string): string | undefined {
  if (val === undefined || val === null) return val;
  const trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function getDatabaseConfig(): TypeOrmModuleOptions {
  // Valider que toutes les variables requises sont présentes
  validateDatabaseConfig();

  const isProduction = process.env.NODE_ENV === 'production';
  const rawPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.DB_PASS || '');

  return {
    type: 'mysql',
    host: stripQuotes(process.env.DB_HOST) || 'localhost',
    port: parseInt(stripQuotes(process.env.DB_PORT) || '3306', 10),
    username: stripQuotes(process.env.DB_USERNAME || process.env.DB_USER) || 'root',
    password: stripQuotes(rawPass) || '',
    database: stripQuotes(process.env.DB_DATABASE || process.env.DB_NAME) || 'renaca_db',
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
