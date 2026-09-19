import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../service/dashboard.service';

@Controller('dashboard-test')
export class DashboardTestController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Endpoint de test sans authentification pour diagnostiquer
   */
  @Get('widgets')
  async getDashboardWidgetsTest() {
    try {
      console.log('🧪 Test endpoint appelé');
      const widgets = await this.dashboardService.getDashboardWidgets();
      console.log('✅ Widgets récupérés:', widgets);
      return {
        message: 'Test des widgets du dashboard récupérées avec succès',
        data: widgets
      };
    } catch (error) {
      console.error('❌ Erreur dans getDashboardWidgetsTest:', error);
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

  /**
   * Endpoint pour les statistiques des agences
   */
  @Get('agencies-stats')
  async getAgenciesStats() {
    try {
      console.log('🏢 Récupération des statistiques des agences...');
      const stats = await this.dashboardService.getAgenciesStats();
      console.log('✅ Statistiques agences récupérées:', stats);
      return {
        message: 'Statistiques des agences récupérées avec succès',
        data: stats
      };
    } catch (error) {
      console.error('❌ Erreur dans getAgenciesStats:', error);
      return {
        message: 'Erreur lors de la récupération des statistiques des agences',
        error: error.message,
        data: {
          totalAgencies: 0,
          agenciesData: [],
          chartData: {
            labels: [],
            series: []
          }
        }
      };
    }
  }

  /**
   * Endpoint pour la comparaison des agences
   */
  @Get('agencies-comparison')
  async getAgenciesComparison() {
    try {
      console.log('📊 Récupération de la comparaison des agences...');
      const comparison = await this.dashboardService.getAgenciesComparison();
      console.log('✅ Comparaison agences récupérée:', comparison);
      return {
        message: 'Comparaison des agences récupérée avec succès',
        data: comparison
      };
    } catch (error) {
      console.error('❌ Erreur dans getAgenciesComparison:', error);
      return {
        message: 'Erreur lors de la récupération de la comparaison des agences',
        error: error.message,
        data: {
          totalRevenue: 0,
          revenueGrowth: 0,
          agenciesComparison: [],
          chartData: {
            labels: [] as string[],
            contracts: [] as number[],
            primes: [] as number[],
            capital: [] as number[]
          }
        }
      };
    }
  }

  /**
   * Endpoint pour les contrats qui vont échoir
   */
  @Get('contracts-expiring')
  async getContractsExpiring(@Query('period') period: string) {
    try {
      console.log('📋 Récupération des contrats qui vont échoir pour la période:', period);
      const contracts = await this.dashboardService.getContractsExpiring(period);
      console.log('✅ Contrats échéance récupérés:', contracts);
      return {
        message: 'Contrats à échoir récupérés avec succès',
        data: contracts
      };
    } catch (error) {
      console.error('❌ Erreur dans getContractsExpiring:', error);
      return {
        message: 'Erreur lors de la récupération des contrats à échoir',
        error: error.message,
        data: []
      };
    }
  }
}
