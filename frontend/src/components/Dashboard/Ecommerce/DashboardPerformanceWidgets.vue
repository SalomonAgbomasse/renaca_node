<template>
  <div class="row g-4 mb-25">
    <!-- Top Performing Agencies -->
    <div class="col-lg-6 col-md-12">
      <div class="card border-0 rounded-0 bg-white shadow-sm h-100">
        <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
          <div class="d-flex align-items-center justify-content-between mb-20 border-bottom border-light-subtle pb-3">
            <h6 class="card-title fw-bold mb-0 text-dark">
              <i class="ph-bold ph-chart-bar text-success me-2 fs-5"></i>Performance des Agences
            </h6>
            <router-link to="/liste-agences" class="text-success fw-semibold fs-xs text-decoration-none d-flex align-items-center gap-1">
              Voir tout <i class="ph-bold ph-caret-right fs-10"></i>
            </router-link>
          </div>

          <div v-if="loadingAgencies" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-success" role="status"></div>
          </div>
          
          <div v-else-if="topAgencies.length === 0" class="text-center text-muted py-4 fs-13">
            Aucune donnée de performance d'agence.
          </div>

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 fs-13 table-striped">
              <thead>
                <tr>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 ps-0">Agence</th>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 text-center">Contrats</th>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 text-end pe-0">Total Primes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(agency, i) in topAgencies" :key="agency.id">
                  <td class="ps-0 fw-semibold text-dark">
                    <span class="badge bg-light text-dark-emphasis me-2">{{ i + 1 }}</span>
                    {{ agency.name }}
                  </td>
                  <td class="text-center fw-medium text-black-emphasis">{{ agency.contractsCount }}</td>
                  <td class="text-end fw-bold text-success pe-0">{{ formatCurrency(agency.totalPrimes) }} F</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Expiries -->
    <div class="col-lg-6 col-md-12">
      <div class="card border-0 rounded-0 bg-white shadow-sm h-100">
        <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
          <div class="d-flex align-items-center justify-content-between mb-20 border-bottom border-light-subtle pb-3">
            <h6 class="card-title fw-bold mb-0 text-dark">
              <i class="ph-bold ph-calendar-blank text-warning me-2 fs-5"></i>Prochaines Échéances (30j)
            </h6>
            <router-link to="/liste-contrats" class="text-warning fw-semibold fs-xs text-decoration-none d-flex align-items-center gap-1">
              Voir tout <i class="ph-bold ph-caret-right fs-10"></i>
            </router-link>
          </div>

          <div v-if="loadingContracts" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
          </div>

          <div v-else-if="expiringContracts.length === 0" class="text-center text-muted py-4 fs-13">
            Aucun contrat n'arrive à échéance dans les 30 prochains jours.
          </div>

          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 fs-13 table-striped">
              <thead>
                <tr>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 ps-0">Réf / Client</th>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 text-center">Échéance</th>
                  <th class="text-uppercase text-muted fw-semibold fs-xs py-2 text-end pe-0">Jours restants</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in expiringContracts" :key="c.id">
                  <td class="ps-0">
                    <div class="fw-semibold text-primary">{{ c.contractNumber }}</div>
                    <div class="text-muted fs-xs text-truncate" style="max-width: 160px;">{{ c.customerName }}</div>
                  </td>
                  <td class="text-center text-muted">{{ formatDate(c.expiryDate) }}</td>
                  <td class="text-end pe-0">
                    <span :class="['badge rounded-pill px-2 py-1', getRemainingDaysClass(c.daysUntilExpiry)]">
                      {{ c.daysUntilExpiry }} j
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
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import ApiService from '../../../services/ApiService';

export default defineComponent({
  name: 'DashboardPerformanceWidgets',
  setup() {
    const topAgencies = ref<any[]>([]);
    const expiringContracts = ref<any[]>([]);
    const loadingAgencies = ref(true);
    const loadingContracts = ref(true);

    const loadPerformanceData = async () => {
      try {
        loadingAgencies.value = true;
        const { data } = await ApiService.get('/dashboard-test/agencies-stats');
        const list = data?.data?.agenciesData || [];
        // Trier par total primes décroissant et garder le top 5
        topAgencies.value = list
          .sort((a: any, b: any) => (b.totalPrimes || 0) - (a.totalPrimes || 0))
          .slice(0, 5);
      } catch (err) {
        console.error('Erreur chargement perf agences:', err);
      } finally {
        loadingAgencies.value = false;
      }
    };

    const loadExpiringContracts = async () => {
      try {
        loadingContracts.value = true;
        const { data } = await ApiService.get('/dashboard-test/contracts-expiring?period=30days');
        const list = data?.data || [];
        // Garder le top 5 arrivant le plus tôt à échéance
        expiringContracts.value = list.slice(0, 5);
      } catch (err) {
        console.error('Erreur chargement contrats échéances:', err);
      } finally {
        loadingContracts.value = false;
      }
    };

    function formatCurrency(v: number): string {
      return (v || 0).toLocaleString('fr-FR');
    }

    function formatDate(d: string): string {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }

    function getRemainingDaysClass(days: number): string {
      if (days <= 5) return 'bg-danger text-white';
      if (days <= 15) return 'bg-warning text-dark';
      return 'bg-success text-white';
    }

    onMounted(() => {
      loadPerformanceData();
      loadExpiringContracts();
    });

    return {
      topAgencies,
      expiringContracts,
      loadingAgencies,
      loadingContracts,
      formatCurrency,
      formatDate,
      getRemainingDaysClass
    };
  }
});
</script>

<style scoped>
.fs-xs {
  font-size: 0.75rem;
}
</style>
