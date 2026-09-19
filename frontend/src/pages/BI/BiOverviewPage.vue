<template>
  <div>
    <BreadCrumb PageTitle="Analyse & Pilotage — Vue d'ensemble" />

    <!-- Filtres globaux -->
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <h5 class="mb-0 fw-bold"><i class="ph-duotone ph-funnel me-2"></i>Filtres</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm rounded-1" @click="exportExcel" :disabled="exportingExcel">
            <span v-if="exportingExcel" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="ph-bold ph-download-simple me-1"></i> Export Excel
          </button>
          <button class="btn btn-outline-danger btn-sm rounded-1" @click="exportPdf" :disabled="exportingPdf">
            <span v-if="exportingPdf" class="spinner-border spinner-border-sm me-1"></span>
            <i v-else class="ph-bold ph-file-pdf me-1"></i> Export PDF
          </button>
          <button class="btn btn-primary btn-sm rounded-1" @click="loadAll">
            <i class="ph-bold ph-arrows-clockwise me-1"></i> Actualiser
          </button>
        </div>
      </div>
      <div class="card-body p-15 p-sm-20 p-md-25">
        <div class="row g-3 align-items-end">
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Période de</label>
            <input type="date" v-model="filters.dateDebut" class="form-control form-control-sm" @change="loadAll" />
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">À</label>
            <input type="date" v-model="filters.dateFin" class="form-control form-control-sm" @change="loadAll" />
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Agence</label>
            <select v-model="filters.agenceId" class="form-select form-select-sm" @change="loadAll">
              <option value="">Toutes les agences</option>
              <option v-for="a in agences" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Nature de crédit</label>
            <select v-model="filters.natureCreditId" class="form-select form-select-sm" @change="loadAll">
              <option value="">Toutes</option>
              <option v-for="n in naturesCredit" :key="n.id" :value="n.id">{{ n.libelle }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Mois affichés</label>
            <select v-model="months" class="form-select form-select-sm" @change="loadEvolution">
              <option :value="6">6 mois</option>
              <option :value="12">12 mois</option>
              <option :value="24">24 mois</option>
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

    <!-- KPI Cards -->
    <div class="row g-3 mb-4" v-if="!loadingKpis">
      <div class="col-xl col-md-4 col-6" v-for="kpi in kpiCards" :key="kpi.key">
        <div class="bi-kpi-card card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="kpi-icon" :style="{ background: kpi.bg }">
                <i :class="kpi.icon" :style="{ color: kpi.color }"></i>
              </div>
              <span class="kpi-badge" :class="kpi.pct >= 0 ? 'badge-success' : 'badge-danger'">
                <i :class="kpi.pct >= 0 ? 'ph-bold ph-trend-up' : 'ph-bold ph-trend-down'"></i>
                {{ Math.abs(kpi.pct) }}%
              </span>
            </div>
            <div class="kpi-value">{{ formatValue(kpi.value, kpi.format) }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-sub text-muted small mt-1">
              Période préc. : {{ formatValue(kpi.prev, kpi.format) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="row g-3 mb-4">
      <div class="col-xl col-md-4 col-6" v-for="i in 5" :key="i">
        <div class="card border-0 shadow-sm" style="height:130px">
          <div class="card-body d-flex align-items-center justify-content-center">
            <div class="spinner-border spinner-border-sm text-primary"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="row g-4 mb-4">
      <!-- Évolution mensuelle -->
      <div class="col-xl-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
            <h6 class="fw-bold mb-0"><i class="ph-duotone ph-chart-line me-2 text-primary"></i>Évolution mensuelle</h6>
            <div class="btn-group btn-group-sm">
              <button class="btn" :class="evChart==='contrats'?'btn-primary':'btn-outline-secondary'" @click="evChart='contrats'">Contrats</button>
              <button class="btn" :class="evChart==='primes'?'btn-primary':'btn-outline-secondary'" @click="evChart='primes'">Primes</button>
              <button class="btn" :class="evChart==='both'?'btn-primary':'btn-outline-secondary'" @click="evChart='both'">Les deux</button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loadingEvolution" class="d-flex justify-content-center align-items-center" style="height:280px">
              <div class="spinner-border text-primary"></div>
            </div>
            <VueApexCharts v-else type="area" height="280" :options="evolutionOptions" :series="evolutionSeries" />
          </div>
        </div>
      </div>

      <!-- Répartition nature crédit -->
      <div class="col-xl-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-3 pb-0">
            <h6 class="fw-bold mb-0"><i class="ph-duotone ph-chart-donut me-2 text-warning"></i>Par nature de crédit</h6>
          </div>
          <div class="card-body">
            <div v-if="loadingNature" class="d-flex justify-content-center align-items-center" style="height:280px">
              <div class="spinner-border text-warning"></div>
            </div>
            <VueApexCharts v-else type="donut" height="280" :options="donutOptions" :series="donutSeries" />
          </div>
        </div>
      </div>
    </div>

    <!-- Top Agences -->
    <div class="row g-4 mb-25">
      <div class="col-xl-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0 pt-3 pb-0">
            <h6 class="fw-bold mb-0"><i class="ph-duotone ph-buildings me-2 text-success"></i>Performance des agences</h6>
          </div>
          <div class="card-body">
            <div v-if="loadingAgences" class="d-flex justify-content-center py-4">
              <div class="spinner-border text-success"></div>
            </div>
            <VueApexCharts v-else type="bar" height="280" :options="agencesOptions" :series="agencesSeries" />
          </div>
        </div>
      </div>

      <!-- Tableau récap KPI -->
      <div class="col-xl-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-0 pt-3 pb-0">
            <h6 class="fw-bold mb-0"><i class="ph-duotone ph-table me-2 text-info"></i>Récapitulatif par nature de crédit</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-sm mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Nature</th>
                    <th class="text-end">Contrats</th>
                    <th class="text-end">Primes (FCFA)</th>
                    <th class="text-end">Part</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in natureData" :key="n.id">
                    <td class="fw-medium">{{ n.libelle }}</td>
                    <td class="text-end">{{ n.contrats.toLocaleString('fr-FR') }}</td>
                    <td class="text-end">{{ formatMoney(n.primes) }}</td>
                    <td class="text-end">
                      <span class="badge bg-primary-subtle text-primary">{{ n.partMarche }}%</span>
                    </td>
                  </tr>
                  <tr v-if="!natureData.length">
                    <td colspan="4" class="text-center text-muted py-3">Aucune donnée</td>
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
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import BiService from '../../services/BiService';
import ApiService from '../../services/ApiService';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';
import * as XLSX from 'xlsx';

export default defineComponent({
  name: 'BiOverviewPage',
  components: { VueApexCharts, BreadCrumb },
  setup() {
    const filters = ref({ dateDebut: '', dateFin: '', agenceId: '', natureCreditId: '' });
    const months = ref(12);
    const evChart = ref('both');

    const agences = ref<any[]>([]);
    const naturesCredit = ref<any[]>([]);

    const loadingKpis = ref(true);
    const loadingEvolution = ref(true);
    const loadingNature = ref(true);
    const loadingAgences = ref(true);

    const kpis = ref<any>({});
    const evolutionData = ref<any>({});
    const natureData = ref<any[]>([]);
    const agencesData = ref<any[]>([]);

    // ─── KPI Cards ───
    const kpiCards = computed(() => {
      if (!kpis.value.contrats) return [];
      return [
        { key: 'contrats', label: 'Total Contrats', value: kpis.value.contrats?.current, prev: kpis.value.contrats?.previous, pct: kpis.value.contrats?.pct, format: 'number', icon: 'ph-duotone ph-file-text', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        { key: 'cotations', label: 'Simulations', value: kpis.value.cotations?.current, prev: kpis.value.cotations?.previous, pct: kpis.value.cotations?.pct, format: 'number', icon: 'ph-duotone ph-calculator', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { key: 'taux', label: 'Taux transformation', value: kpis.value.tauxTransformation?.current, prev: kpis.value.tauxTransformation?.previous, pct: kpis.value.tauxTransformation?.pct, format: 'percent', icon: 'ph-duotone ph-arrow-up-right', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { key: 'primes', label: 'Primes encaissées', value: kpis.value.primes?.current, prev: kpis.value.primes?.previous, pct: kpis.value.primes?.pct, format: 'money', icon: 'ph-duotone ph-money', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { key: 'capital', label: 'Capital assuré', value: kpis.value.capital?.current, prev: kpis.value.capital?.previous, pct: kpis.value.capital?.pct, format: 'money', icon: 'ph-duotone ph-bank', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
      ];
    });

    // ─── Graphique évolution ───
    const evolutionSeries = computed(() => {
      if (!evolutionData.value.labels) return [];
      const series: any[] = [];
      if (evChart.value === 'contrats' || evChart.value === 'both') {
        series.push({ name: 'Contrats', data: evolutionData.value.contrats || [] });
      }
      if (evChart.value === 'primes' || evChart.value === 'both') {
        series.push({ name: 'Primes (FCFA)', data: evolutionData.value.primes || [] });
      }
      return series;
    });

    const evolutionOptions = computed(() => ({
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      colors: ['#6366f1', '#f59e0b'],
      xaxis: { categories: evolutionData.value.labels || [] },
      yaxis: [
        { title: { text: 'Contrats' }, min: 0 },
        ...(evChart.value === 'both' ? [{ opposite: true, title: { text: 'Primes' }, labels: { formatter: (v: number) => formatMoney(v) } }] : []),
      ],
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      stroke: { curve: 'smooth', width: 2 },
      grid: { borderColor: '#f1f1f1' },
      tooltip: { y: { formatter: (v: number, { seriesIndex }: any) => seriesIndex === 1 && evChart.value === 'both' ? formatMoney(v) : v.toString() } },
    }));

    // ─── Donut nature crédit ───
    const donutSeries = computed(() => natureData.value.map(n => n.contrats));
    const donutOptions = computed(() => ({
      labels: natureData.value.map(n => n.libelle),
      colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'],
      legend: { position: 'bottom' },
      dataLabels: { formatter: (val: number) => `${Math.round(val)}%` },
      plotOptions: { pie: { donut: { size: '60%' } } },
    }));

    // ─── Barres agences ───
    const agencesSeries = computed(() => [
      { name: 'Primes (FCFA)', data: agencesData.value.slice(0, 10).map(a => a.primes) },
      { name: 'Contrats', data: agencesData.value.slice(0, 10).map(a => a.contrats) },
    ]);
    const agencesOptions = computed(() => ({
      chart: { toolbar: { show: false } },
      colors: ['#6366f1', '#10b981'],
      xaxis: { categories: agencesData.value.slice(0, 10).map(a => a.agenceName), labels: { style: { fontSize: '11px' } } },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 } },
      yaxis: [
        { title: { text: 'Primes' }, labels: { formatter: (v: number) => formatMoney(v) } },
        { opposite: true, title: { text: 'Contrats' } },
      ],
      grid: { borderColor: '#f1f1f1' },
      legend: { position: 'top' },
      tooltip: { y: { formatter: (v: number, { seriesIndex }: any) => seriesIndex === 0 ? formatMoney(v) : v.toString() } },
    }));

    // ─── Helpers ───
    const formatMoney = (v: number) => {
      if (!v) return '0';
      if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
      return v.toLocaleString('fr-FR');
    };

    const formatValue = (v: number, format: string) => {
      if (format === 'money') return `${formatMoney(v)} FCFA`;
      if (format === 'percent') return `${v ?? 0}%`;
      return (v ?? 0).toLocaleString('fr-FR');
    };

    // ─── Load functions ───
    const loadKpis = async () => {
      loadingKpis.value = true;
      try {
        const res = await BiService.getKPIsOverview(filters.value);
        kpis.value = res.data.data;
      } catch (e) { console.error(e); } finally { loadingKpis.value = false; }
    };

    const loadEvolution = async () => {
      loadingEvolution.value = true;
      try {
        const res = await BiService.getMonthlyEvolution(months.value, filters.value);
        evolutionData.value = res.data.data;
      } catch (e) { console.error(e); } finally { loadingEvolution.value = false; }
    };

    const loadNature = async () => {
      loadingNature.value = true;
      try {
        const res = await BiService.getNatureCreditAnalysis(filters.value);
        natureData.value = res.data.data;
      } catch (e) { console.error(e); } finally { loadingNature.value = false; }
    };

    const loadAgences = async () => {
      loadingAgences.value = true;
      try {
        const res = await BiService.getAgencesPerformance(filters.value);
        agencesData.value = res.data.data;
      } catch (e) { console.error(e); } finally { loadingAgences.value = false; }
    };

    const loadAll = () => Promise.all([loadKpis(), loadEvolution(), loadNature(), loadAgences()]);

    const resetFilters = () => {
      filters.value = { dateDebut: '', dateFin: '', agenceId: '', natureCreditId: '' };
      loadAll();
    };

    const exportingExcel = ref(false);
    const exportingPdf = ref(false);

    const exportExcel = async () => {
      if (exportingExcel.value) return;
      exportingExcel.value = true;
      try {
        const response = await BiService.exportExcel('overview', filters.value);
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Overview_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
        const response = await BiService.exportPdf('overview', filters.value);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Overview_${new Date().toISOString().slice(0, 10)}.pdf`;
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
          ApiService.get('/nature-credits'),
        ]);
        const agenciesRes = ag.data?.data?.agencies || ag.data?.agencies || ag.data?.data || ag.data;
        agences.value = Array.isArray(agenciesRes) ? agenciesRes : [];

        const ncRes = nc.data?.data?.data || nc.data?.data || nc.data;
        naturesCredit.value = Array.isArray(ncRes) ? ncRes : [];
      } catch (e) {
        console.error('Error loading filters in BiOverviewPage:', e);
      }
      loadAll();
    });

    return {
      filters, months, evChart, agences, naturesCredit,
      loadingKpis, loadingEvolution, loadingNature, loadingAgences,
      kpiCards, evolutionOptions, evolutionSeries, donutOptions, donutSeries,
      agencesOptions, agencesSeries, natureData, agencesData,
      formatValue, formatMoney, loadAll, loadEvolution, resetFilters,
      exportingExcel, exportingPdf, exportExcel, exportPdf,
    };
  },
});
</script>

<style scoped>
.bi-overview-page { padding: 0.5rem 0; }
.bi-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
.bi-filters { border-radius: 0px; }
.bi-kpi-card { border-radius: 0px; transition: transform .2s, box-shadow .2s; }
.bi-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,.12) !important; }
.kpi-icon { width: 44px; height: 44px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.kpi-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-top: .5rem; }
.kpi-label { font-size: .8rem; color: #64748b; font-weight: 500; }
.kpi-sub { font-size: .72rem; }
.kpi-badge { font-size: .72rem; font-weight: 600; padding: .25rem .5rem; border-radius: 4px; display: flex; align-items: center; gap: 3px; }
.badge-success { background: rgba(16,185,129,.15); color: #10b981; }
.badge-danger { background: rgba(239,68,68,.15); color: #ef4444; }
.card { border-radius: 0px !important; }
</style>
