<template>
  <div class="card bg-white border-0 rounded-3 mb-4 stats-box">
    <div class="card-body p-4">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div>
          <div class="d-flex">
            <span>Total Primes</span>
            <span class="count up" v-if="comparisonData.revenueGrowth > 0">+{{ comparisonData.revenueGrowth }}%</span>
            <span class="count neutral" v-else>0%</span>
          </div>
          <h3 class="fs-20 mt-1 mb-0">{{ formatCurrency(comparisonData.totalRevenue) }}</h3>
        </div>
        <span class="fs-12">Par Agence</span>
      </div>
      
      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-2 text-muted">Chargement des données...</p>
      </div>
      
      <!-- Graphique de comparaison des agences -->
      <div
        v-else-if="isClient && comparisonData.chartData.labels.length > 0"
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
          <i class="fas fa-chart-bar fa-2x mb-2"></i>
          <p class="mb-0">Aucune donnée d'agence</p>
        </div>
      </div>
      
      <!-- Liste des agences avec détails -->
      <div v-if="!loading && comparisonData.agenciesComparison.length > 0" class="agencies-details">
        <div 
          v-for="agency in comparisonData.agenciesComparison" 
          :key="agency.id"
          class="agency-item"
        >
          <div class="agency-header">
            <span class="agency-name">{{ agency.name }}</span>
            <span class="agency-percentage">{{ agency.percentage }}%</span>
          </div>
          <div class="agency-stats">
            <div class="stat-item">
              <span class="stat-label">Contrats:</span>
              <span class="stat-value">{{ agency.contractsCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Primes:</span>
              <span class="stat-value">{{ formatCurrency(agency.totalPrimes) }}</span>
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
  name: "TotalRevenueChart",
  setup() {
    const isClient = ref(false);
    const loading = ref(true);
    const comparisonData = ref({
      totalRevenue: 0,
      revenueGrowth: 0,
      agenciesComparison: [] as Array<{
        id: number;
        name: string;
        contractsCount: number;
        totalPrimes: number;
        totalCapital: number;
        percentage: number;
      }>,
      chartData: {
        labels: [] as string[],
        contracts: [] as number[],
        primes: [] as number[],
        capital: [] as number[]
      }
    });

    // Configuration du graphique avec les couleurs de l'entreprise
    const chartOptions = ref({
      chart: {
        type: "bar",
        height: 120,
        stacked: false, // Graphique non empilé pour plus de clarté
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      plotOptions: {
        bar: {
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
      colors: ["#33b04a", "#ede947"], // Couleurs de l'entreprise
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 3,
        show: true,
      },
      stroke: {
        width: 0,
        show: false,
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
          formatter: function (val: number, { seriesIndex }: any) {
            if (seriesIndex === 0) {
              return val + " contrats";
            } else {
              return new Intl.NumberFormat('fr-FR').format(val) + " FCFA";
            }
          }
        }
      }
    });

    // Série de données pour le graphique
    const chartSeries = ref([
      {
        name: "Contrats",
        data: [] as number[]
      },
      {
        name: "Primes",
        data: [] as number[]
      }
    ]);

    // Fonction de formatage des devises
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0
      }).format(value);
    };

    // Charger les données de comparaison des agences
    const loadAgenciesComparison = async () => {
      try {
        loading.value = true;
        //console.log('📊 Chargement de la comparaison des agences...');
        
        const response = await ApiService.get('/dashboard-test/agencies-comparison');
        //console.log('📊 Réponse comparaison:', response);
        
        if (response.data && response.data.data) {
          comparisonData.value = response.data.data;
          
          // Mettre à jour les options du graphique
          chartOptions.value.xaxis.categories = comparisonData.value.chartData.labels;
          
          // Mettre à jour les séries
          chartSeries.value[0].data = comparisonData.value.chartData.contracts;
          chartSeries.value[1].data = comparisonData.value.chartData.primes;
          
         // console.log('✅ Comparaison agences chargée:', comparisonData.value);
        } else {
          console.warn('⚠️ Aucune donnée trouvée pour la comparaison');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de la comparaison des agences:', error);
        // Charger des données de démonstration en cas d'erreur
        loadDemoData();
      } finally {
        loading.value = false;
      }
    };

    // Données de démonstration
    const loadDemoData = () => {
      comparisonData.value = {
        totalRevenue: 1018505,
        revenueGrowth: 15,
        agenciesComparison: [
          {
            id: 1,
            name: "Agence Cotonou",
            contractsCount: 8,
            totalPrimes: 850000,
            totalCapital: 65000000,
            percentage: 83
          },
          {
            id: 2,
            name: "Agence Porto-Novo",
            contractsCount: 2,
            totalPrimes: 168505,
            totalCapital: 13225000,
            percentage: 17
          }
        ],
        chartData: {
          labels: ["Agence Cotonou", "Agence Porto-Novo"],
          contracts: [8, 2],
          primes: [850000, 168505],
          capital: [65000000, 13225000]
        }
      };
      
      chartOptions.value.xaxis.categories = comparisonData.value.chartData.labels;
      chartSeries.value[0].data = comparisonData.value.chartData.contracts;
      chartSeries.value[1].data = comparisonData.value.chartData.primes;
    };

    onMounted(async () => {
      isClient.value = true;
      await loadAgenciesComparison();
    });

    return {
      isClient,
      loading,
      comparisonData,
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

.stats-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.stats-list li:last-child {
  border-bottom: none;
}

.stats-list .title {
  font-weight: 600;
  color: #374151;
}

.stats-list span:last-child {
  font-weight: 700;
  color: #33b04a;
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

.agency-percentage {
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
