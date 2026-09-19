import * as dotenv from 'dotenv';
import { join } from 'path';

// Charger les variables d'environnement AVANT tout import (local et parent)
dotenv.config();
dotenv.config({ path: join(process.cwd(), '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuration des fichiers statiques pour les logos
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  // Préfixe global pour tous les endpoints
  app.setGlobalPrefix('api');
  
  // ✅ Filtre global pour les erreurs de base de données (doublons, clés étrangères, etc.)
  // Ce filtre intercepte les QueryFailedError TypeORM et retourne des messages clairs en français
  app.useGlobalFilters(new DatabaseExceptionFilter());
  
  // Configuration des cookies
  app.use(cookieParser());
  
  // Configuration CORS pour cookies HttpOnly
  app.enableCors({
    origin: (origin, callback) => {
      // Configuration pour développement et production
      const corsOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
        : [];
      if (process.env.FRONTEND_URL) {
        corsOrigins.push(process.env.FRONTEND_URL.trim());
      }

      // Add local origins for development
      if (process.env.NODE_ENV === 'development') {
        corsOrigins.push(
          'http://localhost:5174',
          'http://localhost:3000',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:3000'
        );
      }

      const allowedOrigins = corsOrigins.length > 0
        ? corsOrigins
        : [
            'http://localhost:5174',
            'http://localhost:3000',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:3000',
          ];
      // Autoriser les requêtes sans origin (curl, tests, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('🚫 CORS: Origin non autorisé:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // OBLIGATOIRE pour les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Cookie', 'X-Requested-With', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
  });
  
  // Configuration des routes personnalisées (désactivé temporairement)
  // RouteConfig.setupRoutes(app);
  
  await app.listen(process.env.PORT ?? 3000);
  console.log('🔒 Backend configuré avec cookies HttpOnly sécurisés');
}
bootstrap();
