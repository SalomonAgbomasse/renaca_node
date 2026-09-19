<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <BreadCrumb PageTitle="Alertes & Insights Automatiques" style="margin-bottom: 0 !important; flex-grow: 1;" />
      <button class="btn btn-primary btn-sm rounded-1" @click="loadInsights">
        <i class="ph-bold ph-arrows-clockwise me-1"></i> Actualiser
      </button>
    </div>

    <!-- Résumé statuts -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="alert-stat-card card border-0 shadow-sm" style="border-left: 4px solid #ef4444">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="stat-icon" style="background: rgba(239,68,68,.1); color:#ef4444"><i class="ph-duotone ph-warning-circle fs-4"></i></div>
            <div>
              <div class="stat-value">{{ countBySeverity('HIGH') + countBySeverity('CRITICAL') }}</div>
              <div class="stat-label">Alertes critiques</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert-stat-card card border-0 shadow-sm" style="border-left: 4px solid #f59e0b">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="stat-icon" style="background: rgba(245,158,11,.1); color:#f59e0b"><i class="ph-duotone ph-warning fs-4"></i></div>
            <div>
              <div class="stat-value">{{ countBySeverity('MEDIUM') }}</div>
              <div class="stat-label">Alertes modérées</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert-stat-card card border-0 shadow-sm" style="border-left: 4px solid #6366f1">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="stat-icon" style="background: rgba(99,102,241,.1); color:#6366f1"><i class="ph-duotone ph-trend-up fs-4"></i></div>
            <div>
              <div class="stat-value">{{ countByType('TREND') }}</div>
              <div class="stat-label">Tendances</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="alert-stat-card card border-0 shadow-sm" style="border-left: 4px solid #10b981">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="stat-icon" style="background: rgba(16,185,129,.1); color:#10b981"><i class="ph-duotone ph-lightbulb fs-4"></i></div>
            <div>
              <div class="stat-value">{{ countByType('OPPORTUNITY') }}</div>
              <div class="stat-label">Opportunités</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-25">
      <!-- Feed des insights -->
      <div class="col-xl-7">
        <div class="card border-0 shadow-sm" style="border-radius:12px">
          <div class="card-header bg-transparent border-0 pt-3 pb-2 d-flex justify-content-between align-items-center">
            <h6 class="fw-bold mb-0">
              <i class="ph-duotone ph-list-bullets me-2 text-primary"></i>Insights détectés
            </h6>
            <div class="btn-group btn-group-sm">
              <button class="btn" :class="filterType === ''?'btn-primary':'btn-outline-secondary'" @click="filterType = ''">Tous</button>
              <button class="btn" :class="filterType === 'ALERT'?'btn-danger':'btn-outline-secondary'" @click="filterType = 'ALERT'">Alertes</button>
              <button class="btn" :class="filterType === 'TREND'?'btn-primary':'btn-outline-secondary'" @click="filterType = 'TREND'">Tendances</button>
              <button class="btn" :class="filterType === 'OPPORTUNITY'?'btn-success':'btn-outline-secondary'" @click="filterType = 'OPPORTUNITY'">Opportunités</button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else-if="!filteredInsights.length" class="text-center py-5 text-muted">
              <i class="ph-duotone ph-check-circle fs-1 text-success d-block mb-3"></i>
              <p class="mb-0">Aucune alerte détectée — tout est nominal ✅</p>
            </div>
            <div v-else class="insights-feed">
              <div
                v-for="insight in filteredInsights"
                :key="insight.code"
                class="insight-card mb-3"
                :class="`insight-${insight.type.toLowerCase()}`">
                <div class="d-flex gap-3">
                  <div class="insight-icon">
                    <i :class="getInsightIcon(insight.type, insight.severity)"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <h6 class="fw-bold mb-0 insight-title">{{ insight.title }}</h6>
                      <div class="d-flex gap-1">
                        <span class="badge" :class="getTypeBadge(insight.type)">{{ insight.type }}</span>
                        <span class="badge" :class="getSeverityBadge(insight.severity)">{{ insight.severity }}</span>
                      </div>
                    </div>
                    <p class="text-muted small mb-1">{{ insight.description }}</p>
                    <div v-if="insight.value !== undefined" class="small">
                      <span class="fw-semibold">Valeur : </span>
                      <span :class="insight.type === 'ALERT' ? 'text-danger' : 'text-success'">{{ insight.value }}%</span>
                      <span v-if="insight.threshold" class="text-muted ms-2">(seuil : {{ insight.threshold }}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paramétrage seuils -->
      <div class="col-xl-5">
        <div class="card border-0 shadow-sm" style="border-radius:12px">
          <div class="card-header bg-transparent border-0 pt-3 pb-2">
            <h6 class="fw-bold mb-0">
              <i class="ph-duotone ph-sliders me-2 text-warning"></i>Paramétrage des seuils d'alerte
            </h6>
          </div>
          <div class="card-body">
            <div v-if="loadingThresholds" class="text-center py-3">
              <div class="spinner-border spinner-border-sm text-warning"></div>
            </div>
            <div v-else>
              <div v-for="t in thresholds" :key="t.id" class="threshold-row mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <div class="fw-semibold small">{{ t.label }}</div>
                    <div class="text-muted" style="font-size:.72rem">{{ t.description }}</div>
                  </div>
                  <div class="form-check form-switch mb-0">
                    <input type="checkbox" class="form-check-input" v-model="t.isActive" @change="saveThreshold(t)" />
                  </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                  <input
                    type="range" class="form-range flex-grow-1"
                    :min="0" :max="100" :step="5"
                    v-model.number="t.thresholdValue"
                    @change="saveThreshold(t)"
                    :disabled="!t.isActive" />
                  <span class="badge fw-bold" :class="getSeverityBadge(t.severity)" style="min-width:42px">{{ t.thresholdValue }}%</span>
                </div>
                <div class="d-flex gap-1 mt-1">
                  <button
                    v-for="sev in ['LOW','MEDIUM','HIGH','CRITICAL']" :key="sev"
                    class="btn btn-xs" :class="t.severity === sev ? getSeverityBtnActive(sev) : 'btn-outline-secondary'"
                    @click="t.severity = sev; saveThreshold(t)">
                    {{ sev }}
                  </button>
                </div>
              </div>
              <div v-if="!thresholds.length" class="text-center text-muted py-3 small">
                Aucun seuil configuré.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import BiService from '../../services/BiService';
import BreadCrumb from '../../components/Common/BreadCrumb.vue';

export default defineComponent({
  name: 'BiAlertsPage',
  components: { BreadCrumb },
  setup() {
    const loading = ref(false);
    const loadingThresholds = ref(false);
    const insights = ref<any[]>([]);
    const thresholds = ref<any[]>([]);
    const filterType = ref('');

    const filteredInsights = computed(() =>
      filterType.value ? insights.value.filter(i => i.type === filterType.value) : insights.value
    );

    const countBySeverity = (s: string) => insights.value.filter(i => i.severity === s).length;
    const countByType = (t: string) => insights.value.filter(i => i.type === t).length;

    const getInsightIcon = (type: string, severity: string) => {
      if (type === 'ALERT' && (severity === 'HIGH' || severity === 'CRITICAL')) return 'ph-fill ph-warning-circle text-danger fs-4';
      if (type === 'ALERT') return 'ph-fill ph-warning text-warning fs-4';
      if (type === 'TREND') return 'ph-fill ph-trend-up text-primary fs-4';
      return 'ph-fill ph-lightbulb text-success fs-4';
    };

    const getTypeBadge = (type: string) => ({
      ALERT: 'bg-danger-subtle text-danger',
      TREND: 'bg-primary-subtle text-primary',
      OPPORTUNITY: 'bg-success-subtle text-success',
    }[type] || 'bg-secondary-subtle text-secondary');

    const getSeverityBadge = (sev: string) => ({
      CRITICAL: 'bg-danger text-white',
      HIGH: 'bg-danger-subtle text-danger',
      MEDIUM: 'bg-warning-subtle text-warning',
      LOW: 'bg-success-subtle text-success',
    }[sev] || 'bg-secondary-subtle text-secondary');

    const getSeverityBtnActive = (sev: string) => ({
      CRITICAL: 'btn-danger',
      HIGH: 'btn-danger',
      MEDIUM: 'btn-warning',
      LOW: 'btn-success',
    }[sev] || 'btn-secondary');

    const loadInsights = async () => {
      loading.value = true;
      try {
        const res = await BiService.getAutoInsights();
        insights.value = res.data.data || [];
      } catch (e) { console.error(e); } finally { loading.value = false; }
    };

    const loadThresholds = async () => {
      loadingThresholds.value = true;
      try {
        const res = await BiService.getAlertThresholds();
        thresholds.value = res.data.data || [];
      } catch (e) { console.error(e); } finally { loadingThresholds.value = false; }
    };

    const saveThreshold = async (t: any) => {
      try {
        await BiService.updateAlertThreshold(t.id, {
          thresholdValue: t.thresholdValue,
          severity: t.severity,
          isActive: t.isActive,
        });
      } catch (e) { console.error(e); }
    };

    onMounted(() => Promise.all([loadInsights(), loadThresholds()]));

    return { loading, loadingThresholds, insights, thresholds, filterType, filteredInsights, countBySeverity, countByType, getInsightIcon, getTypeBadge, getSeverityBadge, getSeverityBtnActive, loadInsights, saveThreshold };
  },
});
</script>

<style scoped>
.bi-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
.card { border-radius: 0px !important; }
.alert-stat-card { border-radius: 0px !important; transition: transform .2s; }
.alert-stat-card:hover { transform: translateY(-2px); }
.stat-icon { width: 44px; height: 44px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.stat-label { font-size: .78rem; color: #64748b; font-weight: 500; }
.insight-card { padding: 1rem; border-radius: 4px; border: 1px solid transparent; transition: all .2s; }
.insight-card:hover { transform: translateX(3px); }
.insight-alert { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.2); }
.insight-trend { background: rgba(99,102,241,.06); border-color: rgba(99,102,241,.2); }
.insight-opportunity { background: rgba(16,185,129,.06); border-color: rgba(16,185,129,.2); }
.insight-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.insight-title { font-size: .9rem; }
.threshold-row { padding-bottom: .75rem; border-bottom: 1px solid #f1f5f9; }
.threshold-row:last-child { border-bottom: none; }
.btn-xs { padding: .1rem .4rem; font-size: .7rem; border-radius: 2px; }
</style>
