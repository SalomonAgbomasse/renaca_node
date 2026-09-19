import ApiService from './ApiService';

export interface DashboardStats {
  totalContracts: number;
  totalRevenue: number;
  totalClients: number;
  totalAgencies: number;
  activeContracts: number;
  suspendedContracts: number;
  expiredContracts: number;
  contractsThisMonth: number;
  revenueThisMonth: number;
  contractsLastMonth: number;
  revenueLastMonth: number;
}

export interface SalesEvolutionData {
  labels: string[];
  capitalData: number[];
  revenueData: number[];
}

export interface ContractsStatusData {
  labels: string[];
  data: number[];
}

export interface AgenciesPerformanceData {
  labels: string[];
  data: number[];
}

export interface RevenueData {
  labels: string[];
  data: number[];
}

export interface RecentActivity {
  id: number;
  police: string;
  reference: string;
  capital: number;
  duree: number;
  natureCredit: string;
  puttc: number;
  user: string;
  date: Date;
  status: string;
}

export interface NatureCreditStats {
  idNatureCredit: number;
  code: string;
  libelle: string;
  capitalLabel: string;
  totalCapital: number;
  totalPrime: number;
  nombreEnCours: number;
  nombreEchu: number;
  capitalEnCours: number;
  capitalEchu: number;
  primeEnCours: number;
  primeEchu: number;
}

export interface WelcomeTotalsData {
  totalCapital: number;
  totalPrime: number;
  byNature: NatureCreditStats[];
}

class DashboardService {
  /**
   * Obtenir les totaux et détails par nature de crédit
   */
  async getWelcomeTotals(): Promise<WelcomeTotalsData> {
    try {
      const response = await ApiService.get('/dashboard/welcome-totals');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des totaux de bienvenue:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques générales du dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      //console.log('🔗 Appel API: /dashboard/stats');
      //console.log('🔑 Token JWT:', localStorage.getItem('id_token') ? 'Présent' : 'Absent');
      const response = await ApiService.get('/dashboard/stats');
      //console.log('📊 Réponse API stats:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Message:', error.response?.data?.message);
      throw error;
    }
  }

  /**
   * Obtenir les données d'évolution des ventes
   */
  async getSalesEvolutionData(): Promise<SalesEvolutionData> {
    try {
      const response = await ApiService.get('/dashboard/sales-evolution');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de ventes:', error);
      throw error;
    }
  }

  /**
   * Obtenir les données de répartition des contrats
   */
  async getContractsStatusData(): Promise<ContractsStatusData> {
    try {
      const response = await ApiService.get('/dashboard/contracts-status');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de statuts:', error);
      throw error;
    }
  }

  /**
   * Obtenir les données de performance des agences
   */
  async getAgenciesPerformanceData(): Promise<AgenciesPerformanceData> {
    try {
      const response = await ApiService.get('/dashboard/agencies-performance');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'agences:', error);
      throw error;
    }
  }

  /**
   * Obtenir les données de revenus
   */
  async getRevenueData(): Promise<RevenueData> {
    try {
      const response = await ApiService.get('/dashboard/revenue-data');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de revenus:', error);
      throw error;
    }
  }

  /**
   * Obtenir les activités récentes avec pagination
   */
  async getRecentActivities(page: number = 1, limit: number = 10): Promise<{
    data: RecentActivity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      //console.log('🔗 Appel API: /dashboard/recent-activities');
      //console.log('🔑 Token JWT:', localStorage.getItem('id_token') ? 'Présent' : 'Absent');
      
      const response = await ApiService.query('/dashboard/recent-activities', {
        params: { page, limit }
      });
      
      //console.log('📋 Réponse API activités:', response);
      //console.log('📋 Status:', response.status);
      //console.log('📋 Data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des activités récentes:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new DashboardService();
