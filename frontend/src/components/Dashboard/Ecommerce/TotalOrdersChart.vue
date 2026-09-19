<template>
  <div class="card bg-white border-0 rounded-3 mb-4 stats-box">
    <div class="card-body p-4">
      <!-- En-tête avec titre et bouton -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h3 class="fs-20 mt-1 mb-0">Statistiques Utilisateurs</h3>
          <span class="fs-12 text-muted">Semaine courante</span>
        </div>
        <div class="d-flex gap-2">
          <select
            class="form-select form-control"
            v-model="selectedLimit"
            @change="loadUserStats"
            style="width: auto;"
          >
            <option value="5">5 par page</option>
            <option value="10">10 par page</option>
            <option value="20">20 par page</option>
          </select>
        </div>
      </div>

      <!-- Graphiques de résumé -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="text-primary mb-1">{{ summary?.totalContracts || 0 }}</h4>
            <p class="text-muted mb-0">Contrats Total</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="text-success mb-1">{{ formatCurrency(summary?.totalCapital || 0) }}</h4>
            <p class="text-muted mb-0">Capital Total</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="text-center">
            <h4 class="text-warning mb-1">{{ formatCurrency(summary?.totalPrime || 0) }}</h4>
            <p class="text-muted mb-0">Prime Total</p>
          </div>
        </div>
      </div>

      <!-- Graphique en barres des utilisateurs -->
      <div v-if="isClient && userStats.length > 0" class="mb-4">
        <h5 class="mb-3">Production par Utilisateur</h5>
        <apexchart
          type="bar"
          height="300"
          :options="chartOptions"
          :series="chartSeries"
        ></apexchart>
      </div>

      <!-- Top Performers -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center p-3">
              <div class="text-primary mb-2" style="font-size: 2rem;">🏆</div>
              <h6 class="mb-1">Top Contrats</h6>
              <p class="mb-0 fw-bold">{{ topStats?.topByContracts?.user || 'Aucun' }}</p>
              <small class="text-muted">{{ topStats?.topByContracts?.count || 0 }} contrats</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center p-3">
              <div class="text-success mb-2" style="font-size: 2rem;">📈</div>
              <h6 class="mb-1">Top Capital</h6>
              <p class="mb-0 fw-bold">{{ topStats?.topByCapital?.user || 'Aucun' }}</p>
              <small class="text-muted">{{ formatCurrency(topStats?.topByCapital?.amount || 0) }}</small>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center p-3">
              <div class="text-warning mb-2" style="font-size: 2rem;">⭐</div>
              <h6 class="mb-1">Top Prime</h6>
              <p class="mb-0 fw-bold">{{ topStats?.topByPrime?.user || 'Aucun' }}</p>
              <small class="text-muted">{{ formatCurrency(topStats?.topByPrime?.amount || 0) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des utilisateurs avec pagination -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>

      <div v-else-if="userStats.length === 0" class="text-center py-4 text-muted">
        <div style="font-size: 3rem; opacity: 0.3;">👤</div>
        <p class="mt-2">Aucune donnée cette semaine</p>
      </div>

      <div v-else>
        <h5 class="mb-3">Détail par Utilisateur</h5>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Utilisateur</th>
                <th>Contrats</th>
                <th>Capital Total</th>
                <th>Prime Total</th>
                <th>Moy. Capital</th>
                <th>Moy. Prime</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userStats" :key="user.id">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                      {{ user.firstname.charAt(0) }}{{ user.lastname.charAt(0) }}
                    </div>
                    <div>
                      <div class="fw-medium">{{ user.firstname }} {{ user.lastname }}</div>
                      <small class="text-muted">{{ user.email }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge bg-primary">{{ user.contractsCount }}</span>
                </td>
                <td class="fw-medium">{{ formatCurrency(user.totalCapital) }}</td>
                <td class="fw-medium">{{ formatCurrency(user.totalPrime) }}</td>
                <td>{{ formatCurrency(user.averageCapital) }}</td>
                <td>{{ formatCurrency(user.averagePrime) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 0" class="mt-3">
          <Pagination
            :page="currentPage"
            :totalPages="totalPages"
            :limit="selectedLimit"
            :totalElements="total"
            @paginate="handlePagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import ApiService from "../../../services/ApiService";
import Pagination from "../../Utilities/Pagination.vue";

interface UserStats {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  contractsCount: number;
  totalCapital: number;
  totalPrime: number;
  averageCapital: number;
  averagePrime: number;
}

interface TopStats {
  topByContracts: { user: string; count: number };
  topByCapital: { user: string; amount: number };
  topByPrime: { user: string; amount: number };
}

interface Summary {
  totalContracts: number;
  totalCapital: number;
  totalPrime: number;
  totalUsers: number;
}

export default defineComponent({
  name: "UserStatsChart",
  components: {
    Pagination
  },
  setup() {
    const isClient = ref(false);
    const userStats = ref<UserStats[]>([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const selectedLimit = ref(10);
    const total = ref(0);
    const totalPages = ref(0);
    const topStats = ref<TopStats>({
      topByContracts: { user: 'Aucun', count: 0 },
      topByCapital: { user: 'Aucun', amount: 0 },
      topByPrime: { user: 'Aucun', amount: 0 }
    });
    const summary = ref<Summary>({
      totalContracts: 0,
      totalCapital: 0,
      totalPrime: 0,
      totalUsers: 0
    });

    const loadUserStats = async () => {
      try {
        loading.value = true;
        //console.log('🔄 Chargement des statistiques utilisateurs...');
        const response = await ApiService.get(
          `/dashboard/weekly-user-stats?page=${currentPage.value}&limit=${selectedLimit.value}`
        );
        
        //console.log('📊 Réponse API stats utilisateurs sta:', response);
        
        if (response.data && response.data.data) {
          //console.log('📋 Données stats utilisateurs:', response.data.data);
          userStats.value = response.data.data.data.data;
          total.value = response.data.data.data.total;
          totalPages.value = response.data.data.data.totalPages;
          topStats.value = response.data.data.data.topStats;
          summary.value = response.data.data.data.summary;

        } else {
          console.warn('⚠️ Aucune donnée dans la réponse');
          userStats.value = [];
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stats utilisateurs:', error);
        userStats.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handlePagination = (paginationData: { page_: number; limit_: number }) => {
      currentPage.value = paginationData.page_;
      selectedLimit.value = paginationData.limit_;
      loadUserStats();
    };

    const formatCurrency = (amount: number | string) => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (!numAmount || isNaN(numAmount)) {
        return '0 FCFA';
      }
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(numAmount);
    };

    // Configuration du graphique
    const chartOptions = computed(() => ({
      chart: {
        type: "bar",
        height: 300,
        toolbar: {
          show: false,
        },
      },
      colors: ["#1F64F1", "#10B981", "#F59E0B"],
      plotOptions: {
        bar: {
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toString();
        },
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['#fff']
        }
      },
      stroke: {
        width: 0,
        show: true,
        colors: ["transparent"],
      },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
      },
      xaxis: {
        categories: userStats.value.map(user => `${user.firstname} ${user.lastname}`),
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        labels: {
          style: {
            colors: "#64748B",
            fontSize: "12px",
          },
          rotate: -45,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#64748B",
            fontSize: "12px",
          },
          formatter: function (val: number) {
            return val.toString();
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number, { seriesIndex }: any) {
            const labels = ['Contrats', 'Capital (K)', 'Prime (K)'];
            return `${labels[seriesIndex]}: ${val}`;
          },
        },
      },
      legend: {
        show: true,
        fontSize: "12px",
        position: "top",
        horizontalAlign: "center",
        itemMargin: {
          horizontal: 20,
          vertical: 0,
        },
        labels: {
          colors: "#64748B",
        },
        markers: {
          width: 8,
          height: 8,
          offsetX: -2,
          offsetY: -0.5,
        },
      },
    }));

    const chartSeries = computed(() => [
      {
        name: "Contrats",
        data: userStats.value.map(user => user.contractsCount)
      },
      {
        name: "Capital (K)",
        data: userStats.value.map(user => Math.round(user.totalCapital / 1000))
      },
      {
        name: "Prime (K)",
        data: userStats.value.map(user => Math.round(user.totalPrime / 1000))
      }
    ]);

    onMounted(() => {
      isClient.value = true;
      loadUserStats();
    });

    return {
      isClient,
      userStats,
      loading,
      currentPage,
      selectedLimit,
      total,
      totalPages,
      topStats,
      summary,
      loadUserStats,
      handlePagination,
      formatCurrency,
      chartOptions,
      chartSeries
    };
  },
});
</script>

<style scoped>
.avatar-sm {
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: bold;
}

.stats-box {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card.bg-light {
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease-in-out;
}

.card.bg-light:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>
