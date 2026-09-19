import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from './modules/gestionUsers/entity/user.entity';
import { SystemSetting } from './modules/gestionUsers/entity/system-setting.entity';
import { UserSession } from './modules/gestionUsers/entity/user-session.entity';
import { ProductionState } from './modules/gestionContracts/entity/production-state.entity';
import { Contract } from './modules/gestionContracts/entity/contract.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GestionContractsModule } from './modules/gestionContracts/gestion-contracts.module';
import { GestionUsersModule } from './modules/gestionUsers/gestion-users.module';
import { GestionTicketsModule } from './modules/gestionTickets/gestion-tickets.module';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { DailyProductionReportService } from './services/daily-production-report.service';
import { ExcelService } from './services/excel.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Chargement automatique selon l'environnement
      // Ordre de priorité : .env.{NODE_ENV}.local > .env.{NODE_ENV} > .env.local > .env
      envFilePath: [
        // Fichiers locaux au backend
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
        // Fichiers à la racine du projet
        `../.env.${process.env.NODE_ENV || 'development'}.local`,
        `../.env.${process.env.NODE_ENV || 'development'}`,
        '../.env.local',
        '../.env',
      ],
      ignoreEnvFile: false,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || (process.env.NODE_ENV === 'production' ? '144.91.119.9' : 'localhost'),
      port: parseInt(process.env.DB_PORT || (process.env.NODE_ENV === 'production' ? '43000' : '3306')),
      username: process.env.DB_USERNAME || (process.env.NODE_ENV === 'production' ? 'padme_fnda_user' : 'root'),
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.NODE_ENV === 'production' ? 'PadmeFNDA2024!' : ''),
      database: process.env.DB_DATABASE || process.env.DB_NAME || (process.env.NODE_ENV === 'production' ? 'padme_fnda_db' : 'fnda_node'),
      entities: [__dirname + '/modules/**/entity/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([User, UserSession, ProductionState, Contract, SystemSetting]),
    GestionContractsModule,
    GestionUsersModule,
    GestionTicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PdfService, EmailService, SmsService, DailyProductionReportService, ExcelService],
})
export class AppModule {}
