<template>
  <div>
    <BreadCrumb PageTitle="Analyse Clients — Segmentation" />

    <!-- Filtres -->
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <h5 class="mb-0 fw-bold"><i class="ph-duotone ph-funnel me-2"></i>Filtres</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm rounded-1" @click="exportExcel" :disabled="exportingExcel">
            <span v-if="exportingExcel" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="ph-bold ph-download-simple me-1"></i> Export Excel
          </button>
          <button class="btn btn-outline-danger btn-sm rounded-1" @click="exportPdf" :disabled="exportingPdf">
            <span v-if="exportingPdf" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="ph-bold ph-file-pdf me-1"></i> Export PDF
          </button>
        </div>
      </div>
      <div class="card-body p-15 p-sm-20 p-md-25">
        <div class="row g-3 align-items-end">
          <div class="col-md-2">
            <label class="form-label small fw-semibold">De</label>
            <input type="date" v-model="filters.dateDebut" class="form-control form-control-sm" @change="loadAll" />
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">À</label>
            <input type="date" v-model="filters.dateFin" class="form-control form-control-sm" @change="loadAll" />
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Agence</label>
            <select v-model="filters.agenceId" class="form-select form-select-sm" @change="loadAll">
              <option value="">Toutes</option>
              <option v-for="a in agences" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Nature crédit</label>
            <select v-model="filters.natureCreditId" class="form-select form-select-sm" @change="loadAll">
              <option value="">Toutes</option>
              <option v-for="n in naturesCredit" :key="n.id" :value="n.id">{{ n.libelle }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary btn-sm w-100 rounded-1" @click="resetFilters">
              <i class="ph-bold ph-funnel-simple-x me-1"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets de segmentation -->
    <ul class="nav nav-tabs bi-tabs mb-4">
      <li class="nav-item" v-for="tab in tabs" :key="tab.key">
        <button class="nav-link" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <i :class="tab.icon + ' me-1'"></i>{{ tab.label }}
        </button>
      </li>
    </ul>

    <!-- Contenu par onglet -->
    <div v-if="loading" class="text-center py-5 mb-25">
      <div class="spinner-border text-success"></div>
    </div>
    <div v-else>
      <!-- Graphique barres horizontales -->
      <div class="row g-4">
        <div class="col-xl-7">
          <div class="card border-0 shadow-sm" style="border-radius:12px">
            <div class="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 class="fw-bold mb-0">
                <i class="ph-duotone ph-chart-bar-horizontal me-2 text-success"></i>
                {{ currentTab.label }} — Volume de contrats
              </h6>
            </div>
            <div class="card-body">
              <VueApexCharts type="bar" height="300" :options="barOptions" :series="barSeries" />
            </div>
          </div>
        </div>
        <div class="col-xl-5">
          <div class="card border-0 shadow-sm" style="border-radius:12px">
            <div class="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 class="fw-bold mb-0">
                <i class="ph-duotone ph-chart-donut me-2 text-warning"></i>
                Répartition en %
              </h6>
            </div>
            <div class="card-body">
              <VueApexCharts type="donut" height="300" :options="donutOptions" :series="donutSeries" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau détaillé -->
      <div class="card border-0 shadow-sm mt-4 mb-25" style="border-radius:12px">
        <div class="card-header bg-transparent border-0 pt-3 pb-0">
          <h6 class="fw-bold mb-0"><i class="ph-duotone ph-table me-2 text-info"></i>Détail par {{ currentTab.label }}</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>{{ currentTab.label }}</th>
                  <th class="text-end">Contrats</th>
                  <th class="text-end">Prime moy. (FCFA)</th>
                  <th class="text-end">Capital moy. (FCFA)</th>
                  <th v-if="activeTab !== 'capital'" class="text-end">Part</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in segmentData" :key="row.segment">
                  <td class="fw-medium">{{ row.segment }}</td>
                  <td class="text-end">{{ row.count?.toLocaleString('fr-FR') }}</td>
                  <td class="text-end">{{ (row.avgPrime || 0).toLocaleString('fr-FR') }}</td>
                  <td class="text-end">{{ (row.avgCapital || 0).toLocaleString('fr-FR') }}</td>
                  <td v-if="activeTab !== 'capital'" class="text-end">
                    <div class="d-flex align-items-center justify-content-end gap-2">
                      <div class="progress flex-grow-1" style="height:6px; min-width:60px">
                        <div class="progress-bar bg-success" :style="{ width: getPercent(row.count) + '%' }"></div>
                      </div>
                      <span class="small">{{ getPercent(row.count) }}%</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="!segmentData.length">
                  <td colspan="5" class="text-center text-muted py-4">Aucune donnée disponible</td>
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
import { defineComponent, ref, computed, onMounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import BiService from '../../services/BiService';
import ApiService from '../../services/ApiService';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import * as XLSX from 'xlsx';

export default defineComponent({
  name: 'BiClientsPage',
  components: { VueApexCharts, BreadCrumb },
  setup() {
    const filters = ref({ dateDebut: '', dateFin: '', agenceId: '', natureCreditId: '' });
    const activeTab = ref<'gender' | 'age' | 'occupation' | 'capital'>('gender');
    const loading = ref(false);
    const segmentData = ref<any[]>([]);
    const agences = ref<any[]>([]);
    const naturesCredit = ref<any[]>([]);

    const tabs = [
      { key: 'gender', label: 'Par sexe', icon: 'ph-duotone ph-gender-intersex' },
      { key: 'age', label: 'Par âge', icon: 'ph-duotone ph-cake' },
      { key: 'occupation', label: 'Par profession', icon: 'ph-duotone ph-briefcase' },
      { key: 'capital', label: 'Par montant', icon: 'ph-duotone ph-coins' },
    ];

    const currentTab = computed(() => tabs.find(t => t.key === activeTab.value) || tabs[0]);
    const totalCount = computed(() => segmentData.value.reduce((s, d) => s + (d.count || 0), 0));
    const getPercent = (count: number) => totalCount.value > 0 ? Math.round((count / totalCount.value) * 100) : 0;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

    const barSeries = computed(() => [{
      name: 'Contrats',
      data: segmentData.value.map(d => d.count),
    }]);

    const barOptions = computed(() => ({
      chart: { toolbar: { show: false } },
      colors: COLORS,
      plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
      xaxis: { categories: segmentData.value.map(d => d.segment) },
      legend: { show: false },
      grid: { borderColor: '#f1f1f1' },
      dataLabels: { enabled: true, formatter: (v: number) => v.toLocaleString('fr-FR') },
    }));

    const donutSeries = computed(() => segmentData.value.map(d => d.count));
    const donutOptions = computed(() => ({
      labels: segmentData.value.map(d => d.segment),
      colors: COLORS,
      legend: { position: 'bottom' },
      dataLabels: { formatter: (val: number) => `${Math.round(val)}%` },
      plotOptions: { pie: { donut: { size: '55%' } } },
    }));

    const switchTab = async (key: any) => {
      activeTab.value = key;
      await loadSegment();
    };

    const loadSegment = async () => {
      loading.value = true;
      try {
        const res = await BiService.getClientSegmentation(activeTab.value, filters.value);
        segmentData.value = res.data.data || [];
      } catch (e) { console.error(e); } finally { loading.value = false; }
    };

    const loadAll = () => loadSegment();
    const resetFilters = () => { filters.value = { dateDebut: '', dateFin: '', agenceId: '', natureCreditId: '' }; loadAll(); };

    const exportingExcel = ref(false);
    const exportingPdf = ref(false);

    const exportExcel = async () => {
      if (exportingExcel.value) return;
      exportingExcel.value = true;
      try {
        const response = await BiService.exportExcel('clients', filters.value);
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Clients_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Erreur lors de l\'export Excel:', e);
      } finally {
        exportingExcel.value = false;
      }
    };

    const exportPdf = async () => {
      if (exportingPdf.value) return;
      exportingPdf.value = true;
      try {
        const response = await BiService.exportPdf('clients', filters.value);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Clients_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Erreur lors de l\'export PDF:', e);
      } finally {
        exportingPdf.value = false;
      }
    };

    onMounted(async () => {
      try {
        const [ag, nc] = await Promise.all([
          ApiService.get('/agencies?limit=-1'),
          ApiService.get('/nature-credits')
        ]);
        const agenciesRes = ag.data?.data?.agencies || ag.data?.agencies || ag.data?.data || ag.data;
        agences.value = Array.isArray(agenciesRes) ? agenciesRes : [];

        const ncRes = nc.data?.data?.data || nc.data?.data || nc.data;
        naturesCredit.value = Array.isArray(ncRes) ? ncRes : [];
      } catch (e) {
        console.error('Error loading filters in BiClientsPage:', e);
      }
      loadAll();
    });

    return { filters, activeTab, loading, segmentData, agences, naturesCredit, tabs, currentTab, barOptions, barSeries, donutOptions, donutSeries, getPercent, switchTab, loadAll, resetFilters, exportingExcel, exportingPdf, exportExcel, exportPdf };
  },
});
</script>

<style scoped>
.bi-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
.bi-tabs .nav-link { border-radius: 4px 4px 0 0; font-weight: 500; color: #64748b; }
.bi-tabs .nav-link.active { color: #6366f1; border-bottom-color: #fff; font-weight: 600; }
.card { border-radius: 0px !important; }
</style>
