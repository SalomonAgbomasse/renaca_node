import { Controller, Get, UseGuards, UseInterceptors, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { ContractAuthGuard } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { DashboardService } from '../service/dashboard.service';
import { ContractPermission } from '../enum/contract-permission.enum';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Obtenir les statistiques générales du dashboard
   */
  @Get('stats')
  @RequirePermissions(ContractPermission.READ)
  async getDashboardStats() {
    const stats = await this.dashboardService.getDashboardStats();
    return {
      message: 'Statistiques du dashboard récupérées avec succès',
      data: stats
    };
  }

  /**
   * Obtenir les données pour le graphique d'évolution des ventes
   */
  @Get('sales-evolution')
  @RequirePermissions(ContractPermission.READ)
  async getSalesEvolutionData() {
    const data = await this.dashboardService.getSalesEvolutionData();
    return {
      message: 'Données d\'évolution des ventes récupérées avec succès',
      data
    };
  }

  /**
   * Obtenir les données pour le graphique de répartition des contrats
   */
  @Get('contracts-status')
  @RequirePermissions(ContractPermission.READ)
  async getContractsStatusData() {
    const data = await this.dashboardService.getContractsStatusData();
    return {
      message: 'Données de répartition des contrats récupérées avec succès',
      data
    };
  }

  /**
   * Obtenir les données pour le graphique de performance des agences
   */
  @Get('agencies-performance')
  @RequirePermissions(ContractPermission.READ)
  async getAgenciesPerformanceData() {
    const data = await this.dashboardService.getAgenciesPerformanceData();
    return {
      message: 'Données de performance des agences récupérées avec succès',
      data
    };
  }

  /**
   * Obtenir les données pour le graphique de revenus par mois
   */
  @Get('revenue-data')
  @RequirePermissions(ContractPermission.READ)
  async getRevenueData() {
    const data = await this.dashboardService.getRevenueData();
    return {
      message: 'Données de revenus récupérées avec succès',
      data
    };
  }

  /**
   * Obtenir les activités récentes avec pagination
   */
  @Get('recent-activities')
  @RequirePermissions(ContractPermission.READ)
  async getRecentActivities(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const result = await this.dashboardService.getRecentActivities(pageNum, limitNum);
    return {
      message: 'Activités récentes récupérées avec succès',
      data: result
    };
  }

  /**
   * Obtenir les contrats de la semaine courante avec pagination
   */
  @Get('weekly-contracts')
  @RequirePermissions(ContractPermission.READ)
  async getWeeklyContracts(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const user = request['user'];
    const result = await this.dashboardService.getWeeklyContracts(pageNum, limitNum, user);
    return {
      message: 'Contrats de la semaine courante récupérés avec succès',
      data: result
    };
  }

  @Get('weekly-user-stats')
  @RequirePermissions(ContractPermission.READ)
  async getWeeklyUserStats(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const result = await this.dashboardService.getWeeklyUserStats(pageNum, limitNum);
    return {
      message: 'Statistiques utilisateurs de la semaine courante récupérées avec succès',
      data: result
    };
  }

  /**
   * Obtenir les données des widgets du dashboard principal
   * avec gestion des rôles : si l'utilisateur n'est pas ADMIN ou SUPER ADMIN,
   * on récupère uniquement les données de son agence
   */
  @Get('widgets')
  @RequirePermissions(ContractPermission.READ)
  async getDashboardWidgets(@Req() request: Request) {
    const user = request['user'];
    const widgets = await this.dashboardService.getDashboardWidgets(user);
    return {
      message: 'Données des widgets du dashboard récupérées avec succès',
      data: widgets
    };
  }

  /**
   * Obtenir les totaux pour la section welcome (capital, prime, ristourne)
   * avec gestion des rôles : si l'utilisateur n'est pas ADMIN ou SUPER ADMIN,
   * on récupère uniquement les données de son agence
   */
  @Get('welcome-totals')
  @RequirePermissions(ContractPermission.READ)
  async getWelcomeTotals(@Req() request: Request) {
    const user = request['user'];
    const totals = await this.dashboardService.getWelcomeTotals(user);
    return {
      message: 'Totaux de la section welcome récupérés avec succès',
      data: totals
    };
  }

  /**
   * Endpoint de test sans authentification pour diagnostiquer
   */
  @Get('widgets-test')
  @UseGuards() // Retirer tous les guards
  async getDashboardWidgetsTest() {
    try {
      const widgets = await this.dashboardService.getDashboardWidgets();
      return {
        message: 'Test des widgets du dashboard récupérées avec succès',
        data: widgets
      };
    } catch (error) {
      console.error('Erreur dans getDashboardWidgetsTest:', error);
      return {
        message: 'Erreur lors du test des widgets',
        error: error.message,
        data: {
          nombreContrats: { current: 0, previous: 0, percentage: 0 },
          primeEncaisee: { current: 0, previous: 0, percentage: 0 },
          capitalPrete: { current: 0, previous: 0, percentage: 0 },
          nombreClients: { current: 0, previous: 0, percentage: 0 },
          nombreAgences: { current: 0, previous: 0, percentage: 0 },
          nombreUtilisateurs: { current: 0, previous: 0, percentage: 0 }
        }
      };
    }
  }
}
