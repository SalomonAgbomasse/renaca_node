<template>
  <div class="card bg-white border-0 rounded-3 mb-4 stats-box">
    <div class="card-body p-4">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div>
          <div class="d-flex">
            <span>Total Agences</span>
            <span class="count up" v-if="agenciesStats.totalAgencies > 0">+{{ agenciesStats.totalAgencies }}</span>
            <span class="count neutral" v-else>0</span>
          </div>
          <h3 class="fs-20 mt-1 mb-0">{{ agenciesStats.totalAgencies }}</h3>
        </div>
        <span class="fs-12">Statistiques</span>
      </div>
      
      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-2 text-muted">Chargement des données...</p>
      </div>
      
      <!-- Graphique des agences -->
      <div
        v-else-if="isClient && agenciesStats.chartData.labels.length > 0"
        style="
          max-width: 100%;
          margin: auto;
          margin-top: 10px;
          margin-bottom: 10px;
        "
      >
        <apexchart
          type="bar"
          height="120"
          :options="chartOptions"
          :series="chartSeries"
        ></apexchart>
      </div>
      
      <!-- Message si pas de données -->
      <div v-else class="text-center py-4">
        <div class="text-muted">
          <i class="fas fa-building fa-2x mb-2"></i>
          <p class="mb-0">Aucune agence trouvée</p>
        </div>
      </div>
      
      <!-- Détails des agences -->
      <div v-if="!loading && agenciesStats.agenciesData.length > 0" class="agencies-details">
        <div 
          v-for="agency in agenciesStats.agenciesData" 
          :key="agency.id"
          class="agency-item"
        >
          <div class="agency-header">
            <span class="agency-name">{{ agency.name }}</span>
            <span class="agency-contracts">{{ agency.contractsCount }} contrats</span>
          </div>
          <div class="agency-stats">
            <div class="stat-item">
              <span class="stat-label">Primes:</span>
              <span class="stat-value">{{ formatCurrency(agency.totalPrimes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Capital:</span>
              <span class="stat-value">{{ formatCurrency(agency.totalCapital) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import ApiService from "../../../services/ApiService";

export default defineComponent({
  name: "TotalCustomersChart",
  setup() {
    const isClient = ref(false);
    const loading = ref(true);
    const agenciesStats = ref({
      totalAgencies: 0,
      agenciesData: [] as Array<{
        id: number;
        name: string;
        address: string;
        phone: string;
        email: string;
        contractsCount: number;
        totalPrimes: number;
        totalCapital: number;
      }>,
      chartData: {
        labels: [] as string[],
        series: [] as number[]
      }
    });

    // Configuration du graphique avec les couleurs de l'entreprise
    const chartOptions = ref({
      chart: {
        height: 120,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '10px',
          fontWeight: 'bold',
          colors: ['#fff']
        },
        formatter: function (val: number) {
          return val > 0 ? val : '';
        }
      },
      colors: ["#33b04a"], // Couleur de l'entreprise
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 3,
        show: true,
      },
      stroke: {
        width: 0,
        show: false,
      },
      xaxis: {
        categories: [] as string[],
        axisTicks: {
          show: true,
          color: "#B1BBC8",
        },
        axisBorder: {
          show: true,
          color: "#B1BBC8",
        },
        labels: {
          show: true,
          style: {
            colors: "#374151",
            fontSize: "11px",
            fontWeight: 600,
          },
          rotate: -45,
        },
      },
      yaxis: {
        show: true,
        labels: {
          style: {
            colors: "#64748B",
            fontSize: "10px",
          },
          formatter: function (val: number) {
            return val > 1000 ? (val / 1000).toFixed(0) + 'k' : val;
          }
        },
        axisBorder: {
          show: true,
          color: "#B1BBC8",
        },
      },
      legend: {
        show: true,
        fontSize: "11px",
        position: "top",
        horizontalAlign: "center",
        itemMargin: {
          horizontal: 12,
          vertical: 4,
        },
        labels: {
          colors: "#374151",
          useSeriesColors: false,
        },
        markers: {
          width: 8,
          height: 8,
          offsetX: -2,
          offsetY: 0,
        },
      },
      fill: {
        opacity: 0.8,
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        style: {
          fontSize: '12px',
        },
        y: {
          formatter: function (val: number) {
            return val + " contrats";
          }
        }
      }
    });

    // Série de données pour le graphique
    const chartSeries = ref([
      {
        name: "Contrats par Agence",
        data: [] as number[]
      }
    ]);

    // Fonction de formatage des devises
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0
      }).format(value);
    };

    // Charger les données des agences
    const loadAgenciesStats = async () => {
      try {
        loading.value = true;
        //console.log('🏢 Chargement des statistiques des agences...');
        
        const response = await ApiService.get('/dashboard-test/agencies-stats');
        //console.log('📊 Réponse agences:', response);
        
        if (response.data && response.data.data) {
          agenciesStats.value = response.data.data;
          
          // Mettre à jour les options du graphique
          chartOptions.value.xaxis.categories = agenciesStats.value.chartData.labels;
          
          // Mettre à jour les séries
          chartSeries.value[0].data = agenciesStats.value.chartData.series;
          
          //console.log('✅ Statistiques agences chargées:', agenciesStats.value);
        } else {
          console.warn('⚠️ Aucune donnée trouvée pour les agences');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques des agences:', error);
        // Charger des données de démonstration en cas d'erreur
        loadDemoData();
      } finally {
        loading.value = false;
      }
    };

    // Données de démonstration
    const loadDemoData = () => {
      agenciesStats.value = {
        totalAgencies: 2,
        agenciesData: [
          {
            id: 1,
            name: "Agence Cotonou",
            address: "Cotonou, Bénin",
            phone: "+229 21 12 34 56",
            email: "cotonou@biic.bj",
            contractsCount: 8,
            totalPrimes: 850000,
            totalCapital: 65000000
          },
          {
            id: 2,
            name: "Agence Porto-Novo",
            address: "Porto-Novo, Bénin",
            phone: "+229 20 12 34 56",
            email: "portonovo@biic.bj",
            contractsCount: 2,
            totalPrimes: 168505,
            totalCapital: 13225000
          }
        ],
        chartData: {
          labels: ["Agence Cotonou", "Agence Porto-Novo"],
          series: [8, 2]
        }
      };
      
      chartOptions.value.xaxis.categories = agenciesStats.value.chartData.labels;
      chartSeries.value[0].data = agenciesStats.value.chartData.series;
    };

    onMounted(async () => {
      isClient.value = true;
      await loadAgenciesStats();
    });

    return {
      isClient,
      loading,
      agenciesStats,
      chartOptions,
      chartSeries,
      formatCurrency,
    };
  },
});
</script>

<style scoped>
.count.up {
  color: #28a745;
  font-weight: 600;
}

.count.neutral {
  color: #6c757d;
  font-weight: 600;
}

.stats-box {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}

.text-primary {
  color: #33b04a !important;
}

.agencies-details {
  margin-top: 1rem;
}

.agency-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid #33b04a;
}

.agency-item:last-child {
  margin-bottom: 0;
}

.agency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.agency-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.agency-contracts {
  font-weight: 700;
  color: #33b04a;
  font-size: 0.9rem;
}

.agency-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
}
</style>
