<template>
  <div class="row">

    <div class="col-lg-6 col-xxxl-6 col-md-6">
      <div class="card mb-25 border-0 rounded-0 bg-white expected-earnings-box ">
        <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
          <span class="d-block mb-6 fs-13 text-uppercase fw-medium text-dark-emphasis">
           Nombre de clients
          </span>
          <h4 class="fw-black mb-12 lh-1">{{ totalClients }}</h4>
          <ul class="list ps-0 mb-0 list-unstyled mt-15">
            <li v-for="(client, index) in clientsParStatus" :key="index" class="text-muted position-relative fw-medium">
              Clients {{ client.status === 'ACTIVE' ? "Actifs" : client.status === 'INACTIVE' ? "Inactifs" : client.status }} = <span class="text-black fw-bold">{{ client.count }}</span>
            </li>
          </ul>
          <div id="earningChart" class="chart">
            <apexchart
              type="donut"
              height="100"
              :options="earningChart"
              :series="clientsData"
            ></apexchart>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-lg-6 col-xxxl-6 col-md-6">
      <div class="card mb-25 border-0 rounded-0 bg-white expected-earnings-box ">
        <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
          <span class="d-block mb-6 fs-13 text-uppercase fw-medium text-dark-emphasis">
            Nombre de contrats certicompte
          </span>
          <h4 class="fw-black mb-12 lh-1">{{ totalContratsCerticompte }}</h4>
          <ul class="list ps-0 mb-0 list-unstyled mt-15">
            <li v-for="(contrat, index) in contratsParStatus" :key="index" class="text-muted position-relative fw-medium">
              Contrats {{ contrat.status === 'ACTIVE' ? "Actifs" : contrat.status === 'SUSPENDED' ? "Suspendus" : contrat.status === 'CANCELLED' ? "Annulés" : contrat.status }} = <span class="text-black fw-bold">{{ contrat.count }}</span>
            </li>
          </ul>
          <div id="earningChart" class="chart">
            <apexchart
              type="donut"
              height="100"
              :options="earningChart"
              :series="contratsData"
            ></apexchart>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-lg-12 col-xxxl-12 col-md-12">
      <div class="card mb-25 border-0 rounded-0 bg-white expected-earnings-box ">
        <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span class="d-block mb-6 fs-13 text-uppercase fw-medium text-dark-emphasis">
                Evolution des contrats certicompte par année
              </span>
              <h4 class="fw-black mb-12 lh-1">{{ coursesSummary.totalContracts }}</h4>
              <p class="text-muted mb-0">
                <small>
                  <i class="flaticon-trending-up me-1" v-if="coursesSummary.growthRate >= 0"></i>
                  <i class="flaticon-trending-down me-1" v-else></i>
                  {{ coursesSummary.growthRate >= 0 ? '+' : '' }}{{ coursesSummary.growthRate }}% par rapport à l'année précédente
                </small>
              </p>
            </div>
            <div class="d-flex gap-2">
              <span class="badge" :class="getTrendBadgeClass(coursesSummary.trend)">
                {{ getTrendText(coursesSummary.trend) }}
              </span>
              <button 
                class="btn btn-sm btn-outline-primary"
                @click="loadCoursesStatsByYear">
                <i class="flaticon-refresh me-1"></i>
                Actualiser
              </button>
            </div>
          </div>
          
          <!-- Graphique en barres -->
          <div class="mb-4">
            <apexchart
              type="bar"
              height="300"
              :options="coursesChartOptions"
              :series="coursesChartSeries">
            </apexchart>
          </div>
          
          <!-- Statistiques détaillées -->
          <div class="row">
            <div class="col-lg-3 col-md-6 mb-3">
              <div class="text-center p-3 rounded" style="background-color: #e8f5e8;">
                <h6 class="fw-bold text-success mb-1">{{ coursesSummary.averagePerYear }}</h6>
                <small class="text-muted">Moyenne par année</small>
              </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
              <div class="text-center p-3 rounded" style="background-color: #e3f2fd;">
                <h6 class="fw-bold text-primary mb-1">{{ coursesSummary.bestYear.year }}</h6>
                <small class="text-muted">Meilleure année ({{ coursesSummary.bestYear.count }})</small>
              </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
              <div class="text-center p-3 rounded" style="background-color: #fff3e0;">
                <h6 class="fw-bold text-warning mb-1">{{ coursesSummary.currentYear.year }}</h6>
                <small class="text-muted">Année actuelle ({{ coursesSummary.currentYear.count }})</small>
              </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
              <div class="text-center p-3 rounded" style="background-color: #f3e5f5;">
                <h6 class="fw-bold text-secondary mb-1">{{ formatCurrency(coursesSummary.totalPrimes) }}</h6>
                <small class="text-muted">Total primes {{ coursesData.period?.yearsCount }} ans</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import ApiService from '../../../services/ApiService';

interface StatusCount {
  status: string;
  count: number;
}

export default defineComponent({
  name: "ExpectedEarnings",
  setup() {
    // Données pour les clients
    const totalClients = ref(0);
    const clientsParStatus = ref<StatusCount[]>([]);
    const clientsData = ref<number[]>([]);

    // Données pour les contrats certicompte
    const totalContratsCerticompte = ref(0);
    const contratsParStatus = ref<StatusCount[]>([]);
    const contratsData = ref<number[]>([]);

    // Données pour les contrats emprunteur (pour le moment à 0)
    const totalContratsEmprunteur = ref(0);

    // Données pour les courses
    const coursesSummary = ref({
      totalContracts: 0,
      growthRate: 0,
      trend: '',
      averagePerYear: 0,
      bestYear: { year: '', count: 0 },
      currentYear: { year: '', count: 0 },
      totalPrimes: 0
    });

    const coursesData = ref({
      period: { yearsCount: 5 }
    });

    const coursesChartOptions = ref({
      chart: {
        type: 'bar',
        height: 300,
        stacked: false,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: true
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 1,
      },
      xaxis: {
        categories: [],
        labels: {
          formatter: function (value: any) {
            return value ? value.toString() : '';
          }
        }
      },
      yaxis: {
        title: {
          text: 'Nombre de contrats'
        },
      },
      tooltip: {
        y: {
          formatter: function (y: number) {
            return y + ' contrats';
          }
        }
      },
      fill: {
        opacity: 1
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetX: 40
      },
      colors: ["#33b04a", "#ede947", "#dc3545", "#6c757d"]
    });

    const coursesChartSeries = ref([{
      name: 'Contrats',
      data: []
    }]);

    // Fonctions de chargement des données
    const loadClientsStats = async () => {
      try {
        console.log('📊 [FRONTEND] Chargement des statistiques clients...');
        const response = await ApiService.get('/dashboard/clients-stats');
        console.log('📊 [FRONTEND] Réponse brute clients:', response);
        console.log('📊 [FRONTEND] Données clients:', response.data);
        
        if (response.data && response.data.data) {
          const stats = response.data.data;
          console.log('📊 [FRONTEND] Stats clients extraites:', stats);
          
          totalClients.value = stats.total || 0;
          clientsParStatus.value = stats.byStatus || [];
          
          // Préparer les données pour le graphique
          clientsData.value = clientsParStatus.value.map((item: any) => item.count);
          
          console.log('📊 [FRONTEND] ✅ Clients - Total:', totalClients.value);
          console.log('📊 [FRONTEND] ✅ Clients - Par statut:', clientsParStatus.value);
          console.log('📊 [FRONTEND] ✅ Clients - Données graphique:', clientsData.value);
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Erreur lors du chargement des statistiques clients:', error);
        // Données par défaut en cas d'erreur
        totalClients.value = 0;
        clientsParStatus.value = [
          { status: 'ACTIVE', count: 0 },
          { status: 'INACTIVE', count: 0 }
        ];
        clientsData.value = [0, 0];
      }
    };

    const loadContratsStats = async () => {
      try {
        console.log('📊 [FRONTEND] Chargement des statistiques contrats...');
        const response = await ApiService.get('/dashboard/contrats-stats');
        console.log('📊 [FRONTEND] Réponse brute contrats:', response);
        console.log('📊 [FRONTEND] Données contrats:', response.data);
        
        if (response.data && response.data.data) {
          const stats = response.data.data;
          console.log('📊 [FRONTEND] Stats contrats extraites:', stats);
          
          totalContratsCerticompte.value = stats.total || 0;
          contratsParStatus.value = stats.byStatus || [];
          
          // Préparer les données pour le graphique
          contratsData.value = contratsParStatus.value.map((item: any) => item.count);
          
          console.log('📊 [FRONTEND] ✅ Contrats - Total:', totalContratsCerticompte.value);
          console.log('📊 [FRONTEND] ✅ Contrats - Par statut:', contratsParStatus.value);
          console.log('📊 [FRONTEND] ✅ Contrats - Données graphique:', contratsData.value);
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Erreur lors du chargement des statistiques contrats:', error);
        // Données par défaut en cas d'erreur
        totalContratsCerticompte.value = 0;
        contratsParStatus.value = [
          { status: 'ACTIVE', count: 0 },
          { status: 'SUSPENDED', count: 0 },
          { status: 'CANCELLED', count: 0 }
        ];
        contratsData.value = [0, 0, 0];
      }
    };

    const loadCoursesStatsByYear = async () => {
      try {
        console.log('📊 [FRONTEND] Chargement des statistiques courses...');
        const response = await ApiService.get('/dashboard/courses-by-year?years=5');
        console.log('📊 [FRONTEND] Réponse brute courses:', response);
        console.log('📊 [FRONTEND] Données courses:', response.data);
        
        if (response.data && response.data.data) {
          const stats = response.data.data;
          console.log('📊 [FRONTEND] Stats courses extraites:', stats);
          
          // Mettre à jour le résumé
          coursesSummary.value = stats.summary || {
            totalContracts: 0,
            growthRate: 0,
            trend: '',
            averagePerYear: 0,
            bestYear: { year: '', count: 0 },
            currentYear: { year: '', count: 0 },
            totalPrimes: 0
          };

          // Mettre à jour les données du graphique
          if (stats.yearlyData && stats.yearlyData.length > 0) {
            const years = stats.yearlyData.map((item: any) => item.year.toString());
            const counts = stats.yearlyData.map((item: any) => item.count);
            
            coursesChartOptions.value.xaxis.categories = years;
            coursesChartSeries.value = [{
              name: 'Contrats',
              data: counts
            }];
          }

          // Mettre à jour les informations de période
          coursesData.value = {
            period: stats.period || { yearsCount: 5 }
          };
          
          console.log('📊 [FRONTEND] ✅ Courses - Total:', coursesSummary.value.totalContracts);
          console.log('📊 [FRONTEND] ✅ Courses - Résumé:', coursesSummary.value);
          console.log('📊 [FRONTEND] ✅ Courses - Séries:', coursesChartSeries.value);
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Erreur lors du chargement des statistiques courses:', error);
        // Données par défaut en cas d'erreur
        coursesSummary.value = {
          totalContracts: 0,
          growthRate: 0,
          trend: 'STABLE',
          averagePerYear: 0,
          bestYear: { year: new Date().getFullYear().toString(), count: 0 },
          currentYear: { year: new Date().getFullYear().toString(), count: 0 },
          totalPrimes: 0
        };
        coursesChartSeries.value = [{
          name: 'Contrats',
          data: []
        }];
        coursesData.value = {
          period: { yearsCount: 5 }
        };
      }
    };

    // Configuration du graphique
    const earningChart = {
      dataLabels: {
        enabled: false,
      },
      colors: ["#33b04a", "#ede947", "#dc3545", "#6c757d"],
      legend: {
        show: false,
        fontWeight: 500,
        fontSize: "14px",
        fontFamily: "Red Hat Display, sans-serif",
        labels: {
          colors: "#ffffff",
        },
        markers: {
          offsetX: -2,
          offsetY: 1,
        },
      },
      stroke: {
        width: 0,
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: "14px",
          fontFamily: "Red Hat Display, sans-serif",
        },
      },
    };

    onMounted(async () => {
      await loadClientsStats();
      await loadContratsStats();
      await loadCoursesStatsByYear();
    });

    // Fonctions utilitaires pour les courses
    const getTrendBadgeClass = (trend: string) => {
      switch (trend) {
        case 'CROISSANTE': return 'bg-success';
        case 'DECROISSANTE': return 'bg-danger';
        case 'STABLE': return 'bg-secondary';
        default: return 'bg-secondary';
      }
    };

    const getTrendText = (trend: string) => {
      switch (trend) {
        case 'CROISSANTE': return 'Croissante';
        case 'DECROISSANTE': return 'Décroissante';
        case 'STABLE': return 'Stable';
        default: return 'Inconnu';
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return {
      totalClients,
      clientsParStatus,
      clientsData,
      totalContratsCerticompte,
      contratsParStatus,
      contratsData,
      totalContratsEmprunteur,
      earningChart,
      coursesSummary,
      coursesData,
      coursesChartOptions,
      coursesChartSeries,
      loadCoursesStatsByYear,
      getTrendBadgeClass,
      getTrendText,
      formatCurrency
    };
  },
});
</script>