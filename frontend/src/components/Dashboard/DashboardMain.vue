<template>
  <div class="dashboard-container">
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-2 text-muted">Chargement des données du dashboard...</p>
    </div>

    <!-- Contenu du dashboard -->
    <div v-else>
      <!-- Statistiques rapides -->
    <div class="stats-cards mb-4">
      <div class="row g-4">
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card-primary">
            <div class="stat-card-icon">
              <i class="flaticon-contract"></i>
            </div>
            <div class="stat-card-content">
              <h3 class="stat-card-value">{{ stats.totalContracts }}</h3>
              <p class="stat-card-label">Contrats Actifs</p>
              <div class="stat-card-change positive">
                <i class="flaticon-arrow-up me-1"></i>
                +12% ce mois
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card-success">
            <div class="stat-card-icon">
              <i class="flaticon-money"></i>
            </div>
            <div class="stat-card-content">
              <h3 class="stat-card-value">{{ formatCurrency(stats.totalRevenue) }}</h3>
              <p class="stat-card-label">Revenus Totaux</p>
              <div class="stat-card-change positive">
                <i class="flaticon-arrow-up me-1"></i>
                +8% ce mois
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card-warning">
            <div class="stat-card-icon">
              <i class="flaticon-users"></i>
            </div>
            <div class="stat-card-content">
              <h3 class="stat-card-value">{{ stats.totalClients }}</h3>
              <p class="stat-card-label">Clients Actifs</p>
              <div class="stat-card-change positive">
                <i class="flaticon-arrow-up me-1"></i>
                +5% ce mois
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card-info">
            <div class="stat-card-icon">
              <i class="flaticon-building"></i>
            </div>
            <div class="stat-card-content">
              <h3 class="stat-card-value">{{ stats.totalAgencies }}</h3>
              <p class="stat-card-label">Agences</p>
              <div class="stat-card-change neutral">
                <i class="flaticon-minus me-1"></i>
                Stable
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphiques principaux -->
    <div class="charts-section mb-4">
      <div class="row g-4">
        <div class="col-xl-8">
          <SalesChart />
        </div>
        <div class="col-xl-4">
          <ContractsStatusChart />
        </div>
      </div>
    </div>

    <!-- Graphiques secondaires -->
    <div class="charts-section mb-4">
      <div class="row g-4">
        <div class="col-xl-6">
          <AgenciesPerformanceChart />
        </div>
        <div class="col-xl-6">
          <RevenueChart />
        </div>
      </div>
    </div>

    <!-- Tableau des dernières activités -->
    <div class="recent-activities mb-4">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="flaticon-clock me-2 text-primary"></i>
            Activités Récentes
          </h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Police</th>
                  <th>Référence</th>
                  <th>Capital</th>
                  <th>Durée</th>
                  <th>Nature Crédit</th>
                  <th>PUTTC</th>
                  <th>Utilisateur</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="recentActivities.length === 0">
                  <td colspan="9" class="text-center text-muted">
                    Aucune activité récente ({{ recentActivities.length }} activités)
                  </td>
                </tr>
                <tr v-for="activity in recentActivities" :key="activity.id">
                  <td>
                    <span class="badge badge-primary">{{ activity.police }}</span>
                  </td>
                  <td>{{ activity.reference }}</td>
                  <td>{{ formatCurrency(activity.capital) }}</td>
                  <td>{{ activity.duree }} mois</td>
                  <td>
                    <span class="badge badge-info">{{ activity.natureCredit }}</span>
                  </td>
                  <td>{{ formatCurrency(activity.puttc) }}</td>
                  <td>{{ activity.user }}</td>
                  <td>{{ formatDate(activity.date) }}</td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(activity.status)">
                      {{ activity.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from "vue";
import DashboardService, { RecentActivity } from "../../services/DashboardService";
import SalesChart from "./Charts/SalesChart.vue";
import ContractsStatusChart from "./Charts/ContractsStatusChart.vue";
import AgenciesPerformanceChart from "./Charts/AgenciesPerformanceChart.vue";
import RevenueChart from "./Charts/RevenueChart.vue";

export default defineComponent({
  name: "DashboardMain",
  components: {
    SalesChart,
    ContractsStatusChart,
    AgenciesPerformanceChart,
    RevenueChart
  },
  setup() {
    const stats = ref({
      totalContracts: 0,
      totalRevenue: 0,
      totalClients: 0,
      totalAgencies: 0,
      activeContracts: 0,
      suspendedContracts: 0,
      expiredContracts: 0,
      contractsThisMonth: 0,
      revenueThisMonth: 0,
      contractsLastMonth: 0,
      revenueLastMonth: 0
    });

    const recentActivities = ref<RecentActivity[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (date: Date | string): string => {
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        // Vérifier si la date est valide
        if (isNaN(dateObj.getTime())) {
          return 'Date invalide';
        }
        
        return new Intl.DateTimeFormat('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error, date);
        return 'Date invalide';
      }
    };

    const getActivityBadgeClass = (type: string): string => {
      const classes: { [key: string]: string } = {
        'Contrat': 'badge-primary',
        'Client': 'badge-success',
        'Rapport': 'badge-warning',
        'Système': 'badge-info'
      };
      return classes[type] || 'badge-secondary';
    };

    const getStatusBadgeClass = (status: string): string => {
      const classes: { [key: string]: string } = {
        'Succès': 'badge-success',
        'En cours': 'badge-warning',
        'Erreur': 'badge-danger',
        'En attente': 'badge-info'
      };
      return classes[status] || 'badge-secondary';
    };


    const loadDashboardData = async () => {
      try {
        loading.value = true;
        error.value = null;

        console.log('🔄 Début du chargement des données du dashboard...');

        // Charger les statistiques générales
        console.log('📊 Chargement des statistiques...');
        const statsResponse = await DashboardService.getDashboardStats();
        console.log('📊 Réponse des statistiques:', statsResponse);
        
        // Assigner les données individuellement pour assurer la réactivité
        const statsData = (statsResponse as any).data.data; // Les vraies données sont dans .data.data
        
        stats.value = {
          totalContracts: statsData.totalContracts || 0,
          totalRevenue: statsData.totalRevenue || 0,
          totalClients: statsData.totalClients || 0,
          totalAgencies: statsData.totalAgencies || 0,
          activeContracts: statsData.activeContracts || 0,
          suspendedContracts: statsData.suspendedContracts || 0,
          expiredContracts: statsData.expiredContracts || 0,
          contractsThisMonth: statsData.contractsThisMonth || 0,
          revenueThisMonth: statsData.revenueThisMonth || 0,
          contractsLastMonth: statsData.contractsLastMonth || 0,
          revenueLastMonth: statsData.revenueLastMonth || 0
        };

        // Charger les activités récentes
        console.log('📋 Chargement des activités récentes...');
        const activitiesResponse = await DashboardService.getRecentActivities(1, 10);
        console.log('📋 Réponse des activités:', activitiesResponse);
        
        // S'assurer que les dates sont valides
        const activities = (activitiesResponse as any).data.data.data || [];
        console.log('📋 Activités extraites:', activities);
        console.log('📋 Nombre d\'activités:', activities.length);
        
        recentActivities.value = activities.map((activity: any) => ({
          ...activity,
          date: activity.date ? new Date(activity.date) : new Date()
        }));

        console.log('✅ Données du dashboard chargées avec succès:', { 
          stats: stats.value, 
          activities: recentActivities.value 
        });
        console.log('📋 recentActivities.value après assignation:', recentActivities.value);
        console.log('📋 recentActivities.value.length:', recentActivities.value.length);
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du dashboard:', err);
        
        // Données de fallback en cas d'erreur
        stats.value = {
          totalContracts: 0,
          totalRevenue: 0,
          totalClients: 0,
          totalAgencies: 0,
          activeContracts: 0,
          suspendedContracts: 0,
          expiredContracts: 0,
          contractsThisMonth: 0,
          revenueThisMonth: 0,
          contractsLastMonth: 0,
          revenueLastMonth: 0
        };
        
        recentActivities.value = [
          {
            id: 1,
            police: 'FALLBACK',
            reference: 'MSFP_FALLBACK',
            capital: 500000,
            duree: 6,
            natureCredit: 'TEST',
            puttc: 2500,
            user: 'Fallback User',
            date: new Date(),
            status: 'FALLBACK'
          }
        ];
        
        error.value = err.response?.data?.message || err.message || 'Erreur lors du chargement des données';
      } finally {
        loading.value = false;
        console.log('🔄 Loading mis à false:', loading.value);
        // Forcer la réactivité
        nextTick(() => {
          console.log('🔄 Loading après nextTick:', loading.value);
        });
      }
    };

    onMounted(() => {
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('id_token');
      console.log('🔑 Token présent au montage:', token ? 'OUI' : 'NON');
      console.log('🔑 Token complet:', token);
      
      if (!token) {
        console.warn('⚠️ Aucun token trouvé, l\'utilisateur n\'est peut-être pas connecté');
        error.value = 'Vous devez être connecté pour accéder au dashboard';
        loading.value = false;
        return;
      }
      
      loadDashboardData();
    });

    return {
      stats,
      recentActivities,
      loading,
      error,
      formatCurrency,
      formatDate,
      getActivityBadgeClass,
      getStatusBadgeClass,
      loadDashboardData
    };
  }
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}


.stats-cards .stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-cards .stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-card-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-card-primary .stat-card-icon {
  background: linear-gradient(135deg, #007bff, #0056b3);
}

.stat-card-success .stat-card-icon {
  background: linear-gradient(135deg, #33b04a, #28a745);
}

.stat-card-warning .stat-card-icon {
  background: linear-gradient(135deg, #ffc107, #e0a800);
}

.stat-card-info .stat-card-icon {
  background: linear-gradient(135deg, #17a2b8, #138496);
}

.stat-card-content {
  position: relative;
  z-index: 2;
}

.stat-card-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #231f20;
  margin-bottom: 5px;
}

.stat-card-label {
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 10px;
}

.stat-card-change {
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.stat-card-change.positive {
  color: #28a745;
}

.stat-card-change.negative {
  color: #dc3545;
}

.stat-card-change.neutral {
  color: #6c757d;
}

.charts-section {
  margin-bottom: 30px;
}

.recent-activities .card {
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.recent-activities .card-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #dee2e6;
  border-radius: 12px 12px 0 0;
}

.recent-activities .card-title {
  color: #231f20;
  font-weight: 600;
}

.badge {
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
}

.badge-primary {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background-color: #e8f5e8;
  color: #28a745;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
}

.badge-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.badge-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background-color: #f8f9fa;
  color: #6c757d;
}


.table th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #231f20;
}

.table td {
  vertical-align: middle;
  border-bottom: 1px solid #e9ecef;
}
</style>
