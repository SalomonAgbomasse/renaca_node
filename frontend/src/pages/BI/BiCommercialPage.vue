<template>
  <div>
    <BreadCrumb PageTitle="Analyse Commerciale" />

    <!-- Filtres -->
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
      <div class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
        <h5 class="mb-0 fw-bold"><i class="ph-duotone ph-funnel me-2"></i>Filtres</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-warning btn-sm rounded-1" @click="exportExcel" :disabled="exportingExcel">
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
            <button class="btn btn-outline-secondary btn-sm w-100 rounded-1" @click="resetFilters">
              <i class="ph-bold ph-funnel-simple-x me-1"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <ul class="nav nav-tabs bi-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'agences' }" @click="tab = 'agences'">
          <i class="ph-duotone ph-buildings me-1"></i>Agences
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'conseillers' }" @click="tab = 'conseillers'">
          <i class="ph-duotone ph-user-circle me-1"></i>Conseillers
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'nature' }" @click="tab = 'nature'">
          <i class="ph-duotone ph-tag me-1"></i>Nature de crédit
        </button>
      </li>
    </ul>

    <div v-if="loading" class="text-center py-5 mb-25">
      <div class="spinner-border text-warning"></div>
    </div>
    <div v-else>

      <!-- ─── AGENCES ─── -->
      <div v-if="tab === 'agences'">
        <div class="row g-4 mb-4">
          <div class="col-xl-8">
            <div class="card border-0 shadow-sm" style="border-radius:12px">
              <div class="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 class="fw-bold mb-0"><i class="ph-duotone ph-chart-bar me-2 text-warning"></i>Primes & Contrats par agence</h6>
              </div>
              <div class="card-body">
                <VueApexCharts type="bar" height="300" :options="agencesChartOptions" :series="agencesSeries" />
              </div>
            </div>
          </div>
          <div class="col-xl-4">
            <div class="card border-0 shadow-sm" style="border-radius:12px">
              <div class="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 class="fw-bold mb-0"><i class="ph-duotone ph-chart-pie me-2"></i>Part de marché</h6>
              </div>
              <div class="card-body">
                <VueApexCharts type="pie" height="300" :options="agencesPieOptions" :series="agencesPieSeries" />
              </div>
            </div>
          </div>
        </div>
        <div class="card border-0 shadow-sm mb-25" style="border-radius:12px">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Rang</th><th>Agence</th><th class="text-end">Contrats</th>
                    <th class="text-end">Primes (FCFA)</th><th class="text-end">Capital (FCFA)</th>
                    <th class="text-end">Prime moy.</th><th class="text-end">Part marché</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(a, i) in agencesData" :key="a.agenceId">
                    <td><span class="rank-badge" :class="i < 3 ? `rank-${i+1}` : ''">{{ i + 1 }}</span></td>
                    <td class="fw-medium">{{ a.agenceName }}</td>
                    <td class="text-end">{{ a.contrats.toLocaleString('fr-FR') }}</td>
                    <td class="text-end">{{ formatMoney(a.primes) }}</td>
                    <td class="text-end">{{ formatMoney(a.capital) }}</td>
                    <td class="text-end">{{ formatMoney(a.primeMoyenne) }}</td>
                    <td class="text-end"><span class="badge bg-warning-subtle text-warning fw-bold">{{ a.partMarche }}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── CONSEILLERS ─── -->
      <div v-if="tab === 'conseillers'">
        <div class="row g-4 mb-4">
          <div class="col-12">
            <div class="card border-0 shadow-sm" style="border-radius:12px">
              <div class="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 class="fw-bold mb-0"><i class="ph-duotone ph-chart-bar me-2 text-primary"></i>Top 10 conseillers — Primes générées</h6>
              </div>
              <div class="card-body">
                <VueApexCharts type="bar" height="280" :options="conseillersChartOptions" :series="conseillersSeries" />
              </div>
            </div>
          </div>
        </div>
        <div class="card border-0 shadow-sm mb-25" style="border-radius:12px">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Rang</th><th>Conseiller</th><th>Agence</th>
                    <th class="text-end">Contrats</th><th class="text-end">Cotations</th>
                    <th class="text-end">Taux conv.</th><th class="text-end">Primes</th>
                    <th class="text-end">Part</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in conseillersData" :key="c.userId">
                    <td><span class="rank-badge" :class="c.rank <= 3 ? `rank-${c.rank}` : ''">{{ c.rank }}</span></td>
                    <td class="fw-medium">{{ c.nom }}</td>
                    <td><span class="badge bg-light text-secondary">{{ c.agenceName }}</span></td>
                    <td class="text-end">{{ c.contrats }}</td>
                    <td class="text-end">{{ c.cotations }}</td>
                    <td class="text-end">
                      <span class="badge" :class="c.tauxTransformation >= 50 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
                        {{ c.tauxTransformation }}%
                      </span>
                    </td>
                    <td class="text-end fw-semibold">{{ formatMoney(c.primes) }}</td>
                    <td class="text-end"><span class="badge bg-primary-subtle text-primary">{{ c.partMarche }}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── NATURE CRÉDIT ─── -->
      <div v-if="tab === 'nature'">
        <div class="row g-4 mb-4">
          <div class="col-xl-8">
            <div class="card border-0 shadow-sm" style="border-radius:12px">
              <div class="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 class="fw-bold mb-0"><i class="ph-duotone ph-tag me-2 text-success"></i>Performance par nature de crédit</h6>
              </div>
              <div class="card-body">
                <VueApexCharts type="bar" height="300" :options="natureChartOptions" :series="natureSeries" />
              </div>
            </div>
          </div>
          <div class="col-xl-4">
            <div class="card border-0 shadow-sm" style="border-radius:12px">
              <div class="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 class="fw-bold mb-0">Répartition</h6>
              </div>
              <div class="card-body">
                <VueApexCharts type="donut" height="300" :options="natureDonutOptions" :series="natureDonutSeries" />
              </div>
            </div>
          </div>
        </div>
        <div class="card border-0 shadow-sm mb-25" style="border-radius:12px">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Nature de crédit</th><th class="text-end">Contrats</th>
                    <th class="text-end">Primes</th><th class="text-end">Capital</th>
                    <th class="text-end">Prime moy.</th><th class="text-end">Durée moy.</th>
                    <th class="text-end">Part</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="n in natureData" :key="n.id">
                    <td class="fw-medium">{{ n.libelle }}</td>
                    <td class="text-end">{{ n.contrats.toLocaleString('fr-FR') }}</td>
                    <td class="text-end">{{ formatMoney(n.primes) }}</td>
                    <td class="text-end">{{ formatMoney(n.capital) }}</td>
                    <td class="text-end">{{ formatMoney(n.primeMoyenne) }}</td>
                    <td class="text-end">{{ n.dureeMoyenne }} mois</td>
                    <td class="text-end"><span class="badge bg-success-subtle text-success fw-bold">{{ n.partMarche }}%</span></td>
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
  name: 'BiCommercialPage',
  components: { VueApexCharts, BreadCrumb },
  setup() {
    const filters = ref({ dateDebut: '', dateFin: '', agenceId: '' });
    const tab = ref('agences');
    const loading = ref(false);
    const agencesData = ref<any[]>([]);
    const conseillersData = ref<any[]>([]);
    const natureData = ref<any[]>([]);
    const agences = ref<any[]>([]);

    const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6'];

    const formatMoney = (v: number) => {
      if (!v) return '0';
      if (v >= 1e9) return `${(v/1e9).toFixed(1)}G`;
      if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
      return v.toLocaleString('fr-FR');
    };

    // Agences charts
    const agencesSeries = computed(() => [
      { name: 'Primes (FCFA)', data: agencesData.value.slice(0,10).map(a => a.primes) },
      { name: 'Contrats', data: agencesData.value.slice(0,10).map(a => a.contrats) },
    ]);
    const agencesChartOptions = computed(() => ({
      chart: { toolbar: { show: false } }, colors: ['#f59e0b', '#6366f1'],
      xaxis: { categories: agencesData.value.slice(0,10).map(a => a.agenceName), labels: { rotate: -30, style: { fontSize: '11px' } } },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      yaxis: [{ labels: { formatter: (v: number) => formatMoney(v) } }, { opposite: true }],
      grid: { borderColor: '#f1f1f1' }, legend: { position: 'top' },
      tooltip: { y: { formatter: (v: number, { seriesIndex }: any) => seriesIndex === 0 ? formatMoney(v) : v.toString() } },
    }));
    const agencesPieSeries = computed(() => agencesData.value.map(a => a.primes));
    const agencesPieOptions = computed(() => ({
      labels: agencesData.value.map(a => a.agenceName), colors: COLORS,
      legend: { position: 'bottom' },
      dataLabels: { formatter: (v: number) => `${Math.round(v)}%` },
    }));

    // Conseillers chart
    const top10 = computed(() => conseillersData.value.slice(0, 10));
    const conseillersSeries = computed(() => [{ name: 'Primes', data: top10.value.map(c => c.primes) }]);
    const conseillersChartOptions = computed(() => ({
      chart: { toolbar: { show: false } }, colors: ['#6366f1'],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
      xaxis: { categories: top10.value.map(c => c.nom), labels: { style: { fontSize: '11px' } } },
      legend: { show: false },
      dataLabels: { enabled: true, formatter: (v: number) => formatMoney(v) },
      grid: { borderColor: '#f1f1f1' },
    }));

    // Nature credit chart
    const natureSeries = computed(() => [
      { name: 'Primes', data: natureData.value.map(n => n.primes) },
      { name: 'Contrats', data: natureData.value.map(n => n.contrats) },
    ]);
    const natureChartOptions = computed(() => ({
      chart: { toolbar: { show: false } }, colors: ['#10b981', '#6366f1'],
      xaxis: { categories: natureData.value.map(n => n.libelle) },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
      yaxis: [{ labels: { formatter: (v: number) => formatMoney(v) } }, { opposite: true }],
      grid: { borderColor: '#f1f1f1' }, legend: { position: 'top' },
    }));
    const natureDonutSeries = computed(() => natureData.value.map(n => n.contrats));
    const natureDonutOptions = computed(() => ({
      labels: natureData.value.map(n => n.libelle), colors: COLORS,
      legend: { position: 'bottom' }, plotOptions: { pie: { donut: { size: '55%' } } },
    }));

    const loadAll = async () => {
      loading.value = true;
      try {
        const [ag, co, na] = await Promise.all([
          BiService.getAgencesPerformance(filters.value),
          BiService.getConseillersPerformance(filters.value),
          BiService.getNatureCreditAnalysis(filters.value),
        ]);
        agencesData.value = ag.data.data || [];
        conseillersData.value = co.data.data || [];
        natureData.value = na.data.data || [];
      } catch (e) { console.error(e); } finally { loading.value = false; }
    };

    const resetFilters = () => { filters.value = { dateDebut: '', dateFin: '', agenceId: '' }; loadAll(); };

    const exportingExcel = ref(false);
    const exportingPdf = ref(false);

    const exportExcel = async () => {
      if (exportingExcel.value) return;
      exportingExcel.value = true;
      try {
        const response = await BiService.exportExcel('commercial', filters.value);
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Commercial_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
        const response = await BiService.exportPdf('commercial', filters.value);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BI_Commercial_${new Date().toISOString().slice(0, 10)}.pdf`;
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
        const ag = await ApiService.get('/agencies?limit=-1');
        const agenciesRes = ag.data?.data?.agencies || ag.data?.agencies || ag.data?.data || ag.data;
        agences.value = Array.isArray(agenciesRes) ? agenciesRes : [];
      } catch (e) {
        console.error('Error loading agencies in BiCommercialPage:', e);
      }
      loadAll();
    });

    return { filters, tab, loading, agencesData, conseillersData, natureData, agences, formatMoney, agencesSeries, agencesChartOptions, agencesPieSeries, agencesPieOptions, conseillersSeries, conseillersChartOptions, natureSeries, natureChartOptions, natureDonutSeries, natureDonutOptions, loadAll, resetFilters, exportingExcel, exportingPdf, exportExcel, exportPdf };
  },
});
</script>

<style scoped>
.bi-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
.bi-tabs .nav-link { border-radius: 4px 4px 0 0; font-weight: 500; color: #64748b; }
.bi-tabs .nav-link.active { color: #f59e0b; font-weight: 600; }
.card { border-radius: 0px !important; }
.rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-weight: 700; font-size: .8rem; background: #f1f5f9; color: #475569; }
.rank-1 { background: #fef3c7; color: #d97706; }
.rank-2 { background: #f1f5f9; color: #64748b; }
.rank-3 { background: #fed7aa; color: #ea580c; }
</style>
