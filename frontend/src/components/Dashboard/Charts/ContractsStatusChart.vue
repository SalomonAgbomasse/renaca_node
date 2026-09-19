<template>
  <div class="chart-container">
    <div class="chart-header d-flex justify-content-between align-items-center mb-3">
      <h6 class="chart-title mb-0">
        <i class="flaticon-pie-chart me-2 text-success"></i>
        Contrats par Nature de Crédit
      </h6>
      <div class="chart-actions">
        <button class="btn btn-sm btn-outline-success" @click="exportChart">
          <i class="flaticon-download me-1"></i>
          Exporter
        </button>
      </div>
    </div>
    <div class="chart-wrapper">
      <apexchart
        type="donut"
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
  name: 'ContractsStatusChart',
  components: {
    apexchart: VueApexCharts,
  },
  setup() {
    const chart = ref(null);
    const series = ref([] as number[]);
    const loading = ref(true);

    const chartOptions = ref({
      chart: {
        type: 'donut',
        height: 350,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: ['#33b04a', '#007bff', '#ffc107', '#dc3545'],
      labels: [] as string[],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return new Intl.NumberFormat('fr-FR').format(total);
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val + '%';
        },
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['white']
        }
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        fontFamily: 'Helvetica, Arial',
        fontWeight: 400,
        markers: {
          width: 12,
          height: 12,
          strokeWidth: 0,
          radius: 12
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
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    });

    const loadData = async () => {
      try {
        loading.value = true;
        const response = await DashboardService.getContractsStatusData();
        
        // Extraire les données de la réponse
        const data = response.data.data as any;
        console.log('📊 Structure des données:', data);
        console.log('📊 Type de data:', typeof data);
        console.log('📊 data.data:', data?.data);
        console.log('📊 data.labels:', data?.labels);
        
        // Vérifier si data est un objet avec des propriétés data et labels
        if (data && typeof data === 'object' && data.data && data.labels) {
          series.value = data.data;
          // Forcer la réactivité en créant un nouvel objet
          chartOptions.value = {
            ...chartOptions.value,
            labels: data.labels
          };
          console.log('📊 Labels assignés:', data.labels);
          console.log('📊 Données assignées:', data.data);
        } else if (Array.isArray(data)) {
          series.value = data;
          chartOptions.value = {
            ...chartOptions.value,
            labels: data.map((_, index) => `Nature ${index + 1}`)
          };
        } else {
          // Données par défaut
          series.value = [0];
          chartOptions.value = {
            ...chartOptions.value,
            labels: ['Aucune donnée']
          };
        }
        
        console.log('📊 Données de nature de crédit chargées:', response);
        console.log('📊 Données extraites:', data);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de nature de crédit:', error);
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
