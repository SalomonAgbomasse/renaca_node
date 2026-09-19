<template>
  <div class="chart-container">
    <div class="chart-header d-flex justify-content-between align-items-center mb-3">
      <h6 class="chart-title mb-0">
        <i class="flaticon-bar-chart me-2 text-warning"></i>
        Performance des Agences
      </h6>
      <div class="chart-actions">
        <button class="btn btn-sm btn-outline-warning" @click="exportChart">
          <i class="flaticon-download me-1"></i>
          Exporter
        </button>
      </div>
    </div>
    <div class="chart-wrapper">
      <apexchart
        type="bar"
        height="350"
        :options="chartOptions"
        :series="series"
        ref="chart"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import DashboardService from '../../../services/DashboardService';

export default defineComponent({
  name: 'AgenciesPerformanceChart',
  components: {
    apexchart: VueApexCharts,
  },
  setup() {
    const chart = ref(null);
    const series = ref([
      {
        name: 'Contrats',
        data: [] as number[]
      }
    ]);
    const loading = ref(true);

    const chartOptions = ref({
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      colors: ['#33b04a'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val;
        },
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['white']
        }
      },
      grid: {
        borderColor: '#e9ecef',
        strokeDashArray: 4
      },
      xaxis: {
        categories: [] as string[],
        labels: {
          style: {
            colors: '#6c757d',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function (val: number) {
            return val + ' contrats';
          },
          style: {
            colors: '#6c757d',
            fontSize: '12px'
          }
        }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val: number) {
            return val + ' contrats';
          }
        }
      },
      legend: {
        show: false
      }
    });

    const loadData = async () => {
      try {
        loading.value = true;
        const response = await DashboardService.getAgenciesPerformanceData();
        
        // Extraire les données de la réponse
        const data = response.data.data as any;
        console.log('🏢 Structure des données agences:', data);
        console.log('🏢 Type de data:', typeof data);
        console.log('🏢 data.data:', data?.data);
        console.log('🏢 data.labels:', data?.labels);
        
        // Vérifier si data est un objet avec des propriétés data et labels
        if (data && typeof data === 'object' && data.data && data.labels) {
          series.value = [
            {
              name: 'Contrats',
              data: data.data
            }
          ];
          // Forcer la réactivité en créant un nouvel objet
          chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
              ...chartOptions.value.xaxis,
              categories: data.labels
            }
          };
          console.log('🏢 Labels assignés:', data.labels);
          console.log('🏢 Données assignées:', data.data);
        } else if (Array.isArray(data)) {
          series.value = [
            {
              name: 'Contrats',
              data: data
            }
          ];
          chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
              ...chartOptions.value.xaxis,
              categories: data.map((_, index) => `Agence ${index + 1}`)
            }
          };
        } else {
          // Données par défaut
          series.value = [
            {
              name: 'Contrats',
              data: [0]
            }
          ];
          chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
              ...chartOptions.value.xaxis,
              categories: ['Aucune donnée']
            }
          };
        }
        
        console.log('🏢 Données d\'agences chargées:', response);
        console.log('🏢 Données extraites:', data);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données d\'agences:', error);
      } finally {
        loading.value = false;
      }
    };

    const exportChart = () => {
      if (chart.value && (chart.value as any).exportToPng) {
        (chart.value as any).exportToPng();
      }
    };

    onMounted(() => {
      loadData();
    });

    return {
      chart,
      series,
      chartOptions,
      loading,
      exportChart
    };
  }
});
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.chart-title {
  color: #231f20;
  font-weight: 600;
  font-size: 1.1rem;
}

.chart-wrapper {
  position: relative;
}

.chart-actions .btn {
  border-radius: 8px;
  font-size: 0.875rem;
  padding: 6px 12px;
}
</style>
