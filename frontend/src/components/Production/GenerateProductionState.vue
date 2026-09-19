<template>
  <div class="card mb-25 border-0 rounded-3 shadow-sm bg-white letter-spacing overflow-hidden">
    <!-- Card Header Premium -->
    <div class="card-header bg-white border-bottom py-3 px-4">
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <div class="icon-box bg-soft-fnda rounded-3 p-2 me-3">
            <i class="ph-bold ph-chart-line text-fnda fs-4"></i>
          </div>
          <div>
            <h4 class="mb-0 fw-bold text-dark">Génération d’État de Production</h4>
            <p class="text-muted mb-0 fs-xs">Analyse et extraction des données de production par période</p>
          </div>
        </div>
        <div v-if="dateRangeInfo" class="badge bg-soft-info-fnda text-info border-soft-info px-3 py-2 rounded-pill">
          <i class="ph-bold ph-calendar me-1"></i>
          {{ dateRangeInfo }}
        </div>
      </div>
    </div>

    <div class="card-body p-4">
      <Form ref="productionStateForm" @submit="addProductionState" :validation-schema="productionStateSchema">
        <!-- Section Filtres -->
        <div class="row g-4 mb-4">

          <!-- Filtres de base : Agence & Période -->
          <div class="col-lg-6">
            <div class="filter-group p-3 rounded-3 bg-light-gray border h-100">
              <h6 class="fw-bold mb-3 d-flex align-items-center text-secondary">
                <i class="ph-bold ph-funnel me-2 fs-xs"></i>Sélection des Filtres
              </h6>
              <div class="row">
                <!-- Agence -->
                <div class="col-md-6 mb-3">
                  <label class="d-block text-dark fw-semibold mb-2 fs-sm">Agence</label>
                  <Field name="agence" v-slot="{ field, setValue }">
                    <Multiselect
                      :options="agenceOptions"
                      :searchable="agenceOptions.length > 1"
                      track-by="value"
                      label="label"
                      :modelValue="field.value"
                      @update:modelValue="(val) => { setValue(val); isFormDirty = true; }"
                      :placeholder="agenceOptions.length > 1 ? 'Toutes les agences' : 'Agence assignée'"
                      :object="true"
                      :disabled="agenceOptions.length === 1"
                      :clearable="agenceOptions.length > 1"
                      class="custom-multiselect shadow-sm"
                    />
                  </Field>
                  <ErrorMessage name="agence" class="text-danger fs-xs mt-1"/>
                </div>
                <!-- Nature de crédit -->
                <div class="col-md-6 mb-3">
                  <label class="d-block text-dark fw-semibold mb-2 fs-sm">Nature(s) de crédit</label>
                  <Field name="natureCredit" v-slot="{ field, setValue }">
                    <Multiselect
                      mode="tags"
                      :options="natureCreditOptions"
                      :searchable="natureCreditOptions.length > 1"
                      trackBy="value"
                      valueProp="value"
                      label="label"
                      :modelValue="field.value || []"
                      @update:modelValue="(val) => { setValue(val); isFormDirty = true; }"
                      placeholder="Toutes les natures (Sélection multiple)"
                      :object="true"
                      :closeOnSelect="false"
                      :clearable="true"
                      class="custom-multiselect shadow-sm"
                    >
                      <template #tag="{ option, handleTagRemove }">
                        <span class="custom-tag-badge">
                          <span>{{ option.label }}</span>
                          <span class="tag-remove-btn" @click.prevent="handleTagRemove(option, $event)">×</span>
                        </span>
                      </template>
                    </Multiselect>
                  </Field>
                  <ErrorMessage name="natureCredit" class="text-danger fs-xs mt-1"/>
                </div>
                <!-- Période prédéfinie -->
                <div class="col-12">
                  <label class="d-block text-dark fw-semibold mb-2 fs-sm">Période Rapide</label>
                  <Multiselect
                    v-model="selectedPeriod"
                    :options="periodOptions"
                    :searchable="false"
                    :clearable="true"
                    track-by="value"
                    label="label"
                    placeholder="Choisir un raccourci..."
                    :object="true"
                    @update:modelValue="applyPredefinedPeriod"
                    class="custom-multiselect shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Dates Manuelles -->
          <div class="col-lg-6">
            <div class="filter-group p-3 rounded-3 bg-light-gray border h-100">
              <h6 class="fw-bold mb-3 d-flex align-items-center text-secondary">
                <i class="ph-bold ph-calendar-check me-2 fs-xs"></i>Définition de la Période
              </h6>
              <div class="row">
                <!-- Date de début -->
                <div class="col-md-6 mb-3">
                  <label class="d-block text-dark fw-semibold mb-2 fs-sm">Date de début <span class="text-danger">*</span></label>
                  <Field name="startDate" v-slot="{ field }">
                    <input
                      id="startDate"
                      v-bind="field"
                      type="date"
                      class="form-control border shadow-sm fs-md-15 text-black"
                      @change="handleDateChange"
                    />
                  </Field>
                  <ErrorMessage name="startDate" class="text-danger fs-xs mt-1"/>
                </div>
                <!-- Date de fin -->
                <div class="col-md-6 mb-3">
                  <label class="d-block text-dark fw-semibold mb-2 fs-sm">Date de fin <span class="text-danger">*</span></label>
                  <Field name="endDate" v-slot="{ field }">
                    <input
                      id="endDate"
                      v-bind="field"
                      type="date"
                      class="form-control border shadow-sm fs-md-15 text-black"
                      @change="handleDateChange"
                    />
                  </Field>
                  <ErrorMessage name="endDate" class="text-danger fs-xs mt-1"/>
                </div>
              </div>
              <div class="p-2 mt-1 rounded-2 bg-white border fs-xs text-muted d-flex align-items-center">
                <i class="ph-bold ph-info text-fnda me-2"></i>
                Définissez manuellement les dates pour un rapport précis.
              </div>
            </div>
          </div>

          <!-- Statut (mode édition) -->
          <div v-if="isEditMode" class="col-md-6">
            <div class="filter-group p-3 rounded-3 bg-light-gray border">
              <h6 class="fw-bold mb-3 d-flex align-items-center text-secondary">
                <i class="ph-bold ph-tag me-2 fs-xs"></i>Statut
              </h6>
              <Field name="status" v-slot="{ field, setValue }">
                <Multiselect
                  :modelValue="field.value"
                  @update:modelValue="(val) => { setValue(val); isFormDirty = true; }"
                  :options="statusOptions"
                  :searchable="true"
                  :clearable="false"
                  valueProp="value"
                  trackBy="value"
                  label="label"
                  placeholder="Sélectionner le statut"
                  :object="true"
                  :multiple="false"
                  :closeOnSelect="true"
                  mode="single"
                  class="custom-multiselect shadow-sm"
                >
                  <template #option="{ option }">
                    <div class="flex items-center">
                      <span class="badge me-2" :class="getStatusBadgeClass(option.value)">{{ option.label }}</span>
                      <span class="text-sm text-gray-500">{{ option.description }}</span>
                    </div>
                  </template>
                  <template #tag="{ option }">
                    <div class="flex items-center">
                      <span class="badge" :class="getStatusBadgeClass(option.value)">{{ option.label }}</span>
                    </div>
                  </template>
                </Multiselect>
              </Field>
              <ErrorMessage name="status" class="text-danger fs-xs mt-1"/>
            </div>
          </div>

          <!-- Message d'erreur (mode édition + statut échoué) -->
          <div v-if="isEditMode && showErrorMessage" class="col-12">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10" for="errorMessage">Message d’erreur</label>
              <Field name="errorMessage" v-slot="{ field }">
                <textarea id="errorMessage" v-bind="field" class="form-control shadow-none fs-md-15 text-black bg-light" rows="3" placeholder="Message d'erreur (si applicable)" readonly></textarea>
              </Field>
            </div>
          </div>

          <!-- Résumé (mode édition + statut completé) -->
          <div v-if="isEditMode && showSummary" class="col-12">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">Résumé de production</label>
              <div class="bg-light p-3 rounded">
                <div class="row" v-if="summaryData">
                  <div class="col-md-3"><strong>Total contrats:</strong><br><span class="fs-5 text-fnda">{{ summaryData.totalContracts?.toLocaleString() || 0 }}</span></div>
                  <div class="col-md-3"><strong>Capital total:</strong><br><span class="fs-5 text-fnda">{{ formatCurrency(summaryData.totalCapital) }}</span></div>
                  <div class="col-md-3"><strong>Prime TTC totale:</strong><br><span class="fs-5" style="color: #231f20;">{{ formatCurrency(summaryData.totalPrimeTTC) }}</span></div>
                  <div class="col-md-3"><strong>Capital moyen:</strong><br><span class="fs-5" style="color: #231f20;">{{ formatCurrency(summaryData.avgCapital) }}</span></div>
                </div>
                <div v-else class="text-muted">Aucun résumé disponible</div>
              </div>
            </div>
          </div>

          <!-- Chemin du fichier (mode édition + statut completé) -->
          <div v-if="isEditMode && showFilePath" class="col-12">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">Fichier généré</label>
              <div class="d-flex align-items-center">
                <Field name="filePath" v-slot="{ field }">
                  <input v-bind="field" type="text" class="form-control shadow-none fs-md-15 text-black bg-light me-2" placeholder="Chemin du fichier généré" readonly />
                </Field>
                <button v-if="hasValidFilePath" type="button" class="btn btn-fnda" @click="downloadFile">
                  <i class="ph-bold ph-download-simple me-1"></i>Télécharger
                </button>
              </div>
            </div>
          </div>

          <!-- Barre d’actions intégrée -->
          <div class="col-12 text-end">
            <div class="d-inline-flex align-items-center gap-2 flex-wrap bg-white p-2 border rounded-3 shadow-sm">
              <!-- Reset Filter Button (Only when preview is active) -->
              <button v-if="hasActivePreview" type="button" @click="resetActiveFilter" class="btn btn-sm btn-outline-secondary d-flex align-items-center py-2 px-3 rounded-2 fw-semibold fs-xs">
                <i class="ph-bold ph-x me-1 fs-xs"></i> Réinitialiser le filtre
              </button>
              
              <!-- Export PDF -->
              <button type="button" @click="handlePdfExport" class="btn btn-sm btn-danger d-flex align-items-center py-2 px-3 rounded-2 fw-semibold fs-xs" :disabled="hasActivePreview ? isDownloadingPdf : isDownloadingWeeklyPdf">
                <span v-if="hasActivePreview ? isDownloadingPdf : isDownloadingWeeklyPdf" class="spinner-border spinner-border-sm me-1" role="status" style="width: 12px; height: 12px;"></span>
                <i v-else class="ph-bold ph-file-pdf me-1 fs-xs"></i> PDF
              </button>
              
              <!-- Export Excel -->
              <button type="button" @click="handleExcelExport" class="btn btn-sm btn-info text-white d-flex align-items-center py-2 px-3 rounded-2 fw-semibold fs-xs" :disabled="hasActivePreview ? isDownloadingExcel : isDownloadingWeeklyExcel">
                <span v-if="hasActivePreview ? isDownloadingExcel : isDownloadingWeeklyExcel" class="spinner-border spinner-border-sm me-1" role="status" style="width: 12px; height: 12px;"></span>
                <i v-else class="ph-bold ph-file-xls me-1 fs-xs"></i> Excel
              </button>
              
              <!-- Enregistrer Excel -->
              <button v-if="!isEditMode" type="button" @click="handleSaveExcel" class="btn btn-sm btn-success d-flex align-items-center py-2 px-3 rounded-2 fw-semibold fs-xs" :disabled="hasActivePreview ? isSaving : isSavingWeekly">
                <span v-if="hasActivePreview ? isSaving : isSavingWeekly" class="spinner-border spinner-border-sm me-1" role="status" style="width: 12px; height: 12px;"></span>
                <i v-else class="ph-bold ph-floppy-disk me-1 fs-xs"></i> Enregistrer
              </button>

              <!-- Actualiser (Only when showing weekly production) -->
              <button v-if="!hasActivePreview" type="button" @click="loadCurrentWeekProduction" class="btn btn-sm btn-outline-success d-flex align-items-center py-2 px-3 rounded-2 fw-semibold fs-xs" :disabled="loadingCurrentWeek">
                <span v-if="loadingCurrentWeek" class="spinner-border spinner-border-sm me-1" role="status" style="width: 12px; height: 12px;"></span>
                <i v-else class="ph-bold ph-arrows-clockwise me-1 fs-xs"></i> Actualiser
              </button>

              <div class="divider-v d-none d-sm-block"></div>
              
              <!-- Submit Button -->
              <button class="btn btn-fnda d-inline-flex align-items-center px-4 py-2 fw-bold shadow-sm" type="submit" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="ph-bold ph-magnifying-glass me-2"></i>
                {{ isEditMode ? 'Mettre à jour' : 'Prévisualiser les données' }}
              </button>
            </div>
          </div>



        </div>
      </Form>
    </div>

    <!-- Section Résultats Unifiée -->
    <div class="border-top mt-2 px-4 pb-4 bg-light-gray">
      <!-- Section Header: Title left + Inline KPI chips right -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
        <!-- Left: Icon + Title -->
        <div class="d-flex align-items-center">
          <div class="icon-box bg-soft-fnda rounded-3 p-2 me-3">
            <i :class="hasActivePreview ? 'ph-bold ph-funnel text-fnda fs-4' : 'ph-bold ph-calendar text-fnda fs-4'"></i>
          </div>
          <div>
            <h5 class="mb-0 fw-bold text-dark">
              {{ hasActivePreview ? 'Résultats de la Prévisualisation' : 'Production de la Semaine en Cours' }}
            </h5>
            <p class="text-muted mb-0 fs-xs">
              {{ hasActivePreview ? getPreviewPeriodText() : `Du ${formatDate(getStartOfWeek())} au ${formatDate(new Date())}` }}
            </p>
          </div>
        </div>

        <!-- Right: Inline KPI Chips -->
        <div v-if="!(hasActivePreview ? isSubmitting : loadingCurrentWeek)" class="d-flex align-items-center gap-3 flex-wrap">
          <!-- Contrats -->
          <div class="d-flex align-items-center gap-2 bg-white border rounded-pill px-3 py-2 shadow-sm">
            <div class="rounded-circle bg-soft-success d-flex align-items-center justify-content-center" style="width:28px;height:28px;">
              <i class="ph-bold ph-file-text text-success" style="font-size:13px;"></i>
            </div>
            <div>
              <div class="text-muted fw-bold" style="font-size:10px;line-height:1;text-transform:uppercase;">Contrats</div>
              <div class="fw-bold text-dark" style="font-size:14px;line-height:1.2;">{{ activeSummary.totalContracts }}</div>
            </div>
          </div>
          <!-- Capital -->
          <div class="d-flex align-items-center gap-2 bg-white border rounded-pill px-3 py-2 shadow-sm">
            <div class="rounded-circle bg-soft-fnda d-flex align-items-center justify-content-center" style="width:28px;height:28px;">
              <i class="ph-bold ph-bank text-fnda" style="font-size:13px;"></i>
            </div>
            <div>
              <div class="text-muted fw-bold" style="font-size:10px;line-height:1;text-transform:uppercase;">Capital</div>
              <div class="fw-bold text-dark text-nowrap" style="font-size:14px;line-height:1.2;">{{ formatCurrency(activeSummary.totalCapital) }} FCFA</div>
            </div>
          </div>
          <!-- Prime TTC -->
          <div class="d-flex align-items-center gap-2 bg-white border rounded-pill px-3 py-2 shadow-sm">
            <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:28px;height:28px;background:rgba(35,31,32,0.1);">
              <i class="ph-bold ph-coins text-dark" style="font-size:13px;"></i>
            </div>
            <div>
              <div class="text-muted fw-bold" style="font-size:10px;line-height:1;text-transform:uppercase;">Prime TTC</div>
              <div class="fw-bold text-success text-nowrap" style="font-size:14px;line-height:1.2;">{{ formatCurrency(activeSummary.totalPrimeTTC) }} FCFA</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Loader (Skeleton) -->
      <div v-if="hasActivePreview ? isSubmitting : loadingCurrentWeek" class="row g-3">
        <div v-for="i in 3" :key="i" class="col-md-4">
          <div class="card p-3 shadow-sm border-0 bg-white">
            <div class="skeleton-line mb-2" style="width: 50%;"></div>
            <div class="skeleton-line" style="width: 80%; height: 24px;"></div>
          </div>
        </div>
      </div>


      <!-- Results Content -->
      <div v-else>

        <!-- Table Details -->
        <div v-if="activeContracts.length > 0" class="card border border-light shadow-sm rounded-3 overflow-hidden bg-white">
          <div class="card-header bg-white py-2 border-bottom">
            <span class="fs-xs fw-bold text-dark">
              <i class="ph-bold ph-list me-1 text-fnda"></i>Détails des Contrats
            </span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
              <table class="table table-hover mb-0 align-middle table-sm" style="font-size: 12px;">
                <thead class="bg-light sticky-top">
                  <tr>
                    <th class="ps-3 py-2">Réf / Police</th>
                    <th class="py-2">Client</th>
                    <th class="py-2">Agence</th>
                    <th class="py-2">Gestionnaire</th>
                    <th class="text-end py-2">Capital (FCFA)</th>
                    <th class="text-end py-2">Prime TTC (FCFA)</th>
                    <th class="text-center py-2">Date Effet</th>
                    <th class="pe-3 py-2">Nature Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contract in activeContracts" :key="contract.id">
                    <td class="ps-3 fw-bold text-fnda">{{ getContractCode(contract) }}</td>
                    <td>{{ getCustomerName(contract) }}</td>
                    <td><span class="text-muted fs-xs">{{ contract.agency?.name || 'N/A' }}</span></td>
                    <td><span class="badge bg-light text-dark fw-normal border fs-xxs">{{ getUserName(contract) }}</span></td>
                    <td class="text-end fw-semibold">{{ formatCurrency(getCapital(contract)) }}</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(getPrimeTTC(contract)) }}</td>
                    <td class="text-center text-muted">{{ formatDate(contract.dateEff) }}</td>
                    <td class="pe-3"><span class="badge bg-light text-secondary border">{{ getNatureCredit(contract) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-3 text-muted fs-xs bg-white rounded-3 mt-3 border">
          Aucun contrat trouvé pour cette sélection.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success } from '../../utils/utils';
import { useRouter } from "vue-router";
import ApiService from '../../services/ApiService';
import { useAuthStore } from '../../services/auth';
import * as Yup from 'yup';
import Multiselect from '@vueform/multiselect';

// Types
interface AgenceOption {
  id: number;
  name: string;
  value: number;
  label: string;
}

interface StatusOption {
  value: string;
  label: string;
  description: string;
}

interface PeriodOption {
  value: string;
  label: string;
  startDate: string;
  endDate: string;
}

interface ProductionSummary {
  totalContracts: number;
  totalCapital: number;
  totalPrimeTTC: number;
  avgCapital?: number;
  avgPrimeTTC?: number;
  contractsByUser: { [key: string]: number };
  contractsByOption: { [key: string]: number };
}

interface ProductionStateData {
  agence: AgenceOption | null;
  startDate: string;
  endDate: string;
  status?: StatusOption | null;
  errorMessage?: string;
  filePath?: string;
  summary?: ProductionSummary;
}

export default defineComponent({
  name: "AddProductionState",
  components: {
    Form,
    Field,
    ErrorMessage,
    Multiselect
  },
  props: {
    id: {
      type: String,
      default: null
    }
  },

  setup(props) {
    // Composables
    const router = useRouter();
    const authStore = useAuthStore();

    // Refs
    const productionStateForm = ref(null);
    const isSubmitting = ref(false);
    const isDownloadingPdf = ref(false);
    const isDownloadingExcel = ref(false);
    const isSaving = ref(false);
    const isFormDirty = ref(false);
    const agenceOptions = ref<AgenceOption[]>([]);
    const natureCredits = ref<any[]>([]);
    const natureCreditOptions = computed(() => {
      return natureCredits.value.map((nc: any) => ({
        id: nc.id,
        value: nc.id,
        label: nc.libelle || nc.name || nc.code,
        name: nc.libelle || nc.name || nc.code
      }));
    });

    const getSelectedNatureIds = (natureCreditVal: any): number[] => {
      if (!natureCreditVal) return [];
      if (Array.isArray(natureCreditVal)) {
        return natureCreditVal
          .map((item: any) => (typeof item === 'object' ? (item.id || item.value) : item))
          .filter(Boolean)
          .map(Number);
      }
      if (typeof natureCreditVal === 'object') {
        const id = natureCreditVal.id || natureCreditVal.value;
        return id ? [Number(id)] : [];
      }
      if (typeof natureCreditVal === 'number') return [natureCreditVal];
      return [];
    };

    const loadNatureCredits = async (): Promise<void> => {
      try {
        const response = await ApiService.get('/nature-credits');
        const rawData = response.data;
        let credits: any[] = [];
        if (Array.isArray(rawData)) {
          credits = rawData;
        } else if (Array.isArray(rawData?.data)) {
          credits = rawData.data;
        } else if (Array.isArray(rawData?.data?.data)) {
          credits = rawData.data.data;
        } else if (Array.isArray(rawData?.natureCredits)) {
          credits = rawData.natureCredits;
        } else if (Array.isArray(rawData?.data?.natureCredits)) {
          credits = rawData.data.natureCredits;
        }
        natureCredits.value = credits;
      } catch (err) {
        console.error('Erreur chargement natures de crédit:', err);
      }
    };

    const selectedPeriod = ref<PeriodOption | null>(null);
    const previewData = ref<any[]>([]);
    const previewSummary = ref({
      totalCapital: 0,
      totalPrimeTTC: 0,
      avgCapital: 0
    });

    // Weekly Production states
    const currentWeekContracts = ref<any[]>([]);
    const currentWeekSummary = ref({
      totalContracts: 0,
      totalCapital: 0,
      totalPrimeTTC: 0
    });
    const loadingCurrentWeek = ref(false);
    const isDownloadingWeeklyPdf = ref(false);
    const isDownloadingWeeklyExcel = ref(false);
    const isSavingWeekly = ref(false);

    // Options de période prédéfinie
    const periodOptions = ref<PeriodOption[]>([
      {
        value: 'today',
        label: 'Aujourd\'hui',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        value: 'yesterday',
        label: 'Hier',
        startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
      },
      {
        value: 'this_week',
        label: 'Cette semaine',
        startDate: getStartOfWeek().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        value: 'last_week',
        label: 'Semaine dernière',
        startDate: getStartOfLastWeek().toISOString().split('T')[0],
        endDate: getEndOfLastWeek().toISOString().split('T')[0]
      },
      {
        value: 'this_month',
        label: 'Ce mois',
        startDate: getStartOfMonth().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        value: 'last_month',
        label: 'Mois dernier',
        startDate: getStartOfLastMonth().toISOString().split('T')[0],
        endDate: getEndOfLastMonth().toISOString().split('T')[0]
      },
      {
        value: 'this_quarter',
        label: 'Ce trimestre',
        startDate: getStartOfQuarter().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        value: 'last_quarter',
        label: 'Trimestre dernier',
        startDate: getStartOfLastQuarter().toISOString().split('T')[0],
        endDate: getEndOfLastQuarter().toISOString().split('T')[0]
      },
      {
        value: 'this_year',
        label: 'Cette année',
        startDate: getStartOfYear().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        value: 'last_year',
        label: 'Année dernière',
        startDate: getStartOfLastYear().toISOString().split('T')[0],
        endDate: getEndOfLastYear().toISOString().split('T')[0]
      }
    ]);

    // Options de statut
    const statusOptions = ref<StatusOption[]>([
      { value: 'pending', label: 'En attente', description: 'En attente de traitement' },
      { value: 'processing', label: 'En cours', description: 'Traitement en cours' },
      { value: 'completed', label: 'Terminé', description: 'Traitement terminé avec succès' },
      { value: 'failed', label: 'Échoué', description: 'Traitement échoué' }
    ]);

    // Fonctions utilitaires pour les dates
    function getStartOfWeek(): Date {
      const today = new Date();
      const first = today.getDate() - today.getDay() + 1;
      return new Date(today.setDate(first));
    }

    function getStartOfLastWeek(): Date {
      const today = new Date();
      const first = today.getDate() - today.getDay() + 1 - 7;
      return new Date(today.setDate(first));
    }

    function getEndOfLastWeek(): Date {
      const start = getStartOfLastWeek();
      return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    }

    function getStartOfMonth(): Date {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    function getStartOfLastMonth(): Date {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }

    function getEndOfLastMonth(): Date {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 0);
    }

    function getStartOfQuarter(): Date {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      return new Date(today.getFullYear(), quarter * 3, 1);
    }

    function getStartOfLastQuarter(): Date {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3) - 1;
      const year = quarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const month = quarter < 0 ? 9 : quarter * 3;
      return new Date(year, month, 1);
    }

    function getEndOfLastQuarter(): Date {
      const start = getStartOfLastQuarter();
      return new Date(start.getFullYear(), start.getMonth() + 3, 0);
    }

    function getStartOfYear(): Date {
      const today = new Date();
      return new Date(today.getFullYear(), 0, 1);
    }

    function getStartOfLastYear(): Date {
      const today = new Date();
      return new Date(today.getFullYear() - 1, 0, 1);
    }

    function getEndOfLastYear(): Date {
      const today = new Date();
      return new Date(today.getFullYear() - 1, 11, 31);
    }

    // Computed
    const isEditMode = computed(() => props.id !== null);
    const isAgencyRestricted = computed(() => agenceOptions.value.length === 1);
    
    const selectedAgence = computed(() => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        return form.values?.agence;
      }
      return null;
    });

    const selectedStatus = computed(() => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        return form.values?.status;
      }
      return null;
    });

    const showErrorMessage = computed(() => {
      return selectedStatus.value?.value === 'failed';
    });

    const showSummary = computed(() => {
      return selectedStatus.value?.value === 'completed';
    });

    const showFilePath = computed(() => {
      return selectedStatus.value?.value === 'completed';
    });

    const hasValidFilePath = computed(() => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        const filePath = form.values?.filePath;
        return filePath && filePath.trim() !== '';
      }
      return false;
    });

    const summaryData = computed(() => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        return form.values?.summary;
      }
      return null;
    });

    const hasActivePreview = ref(false);

    const activeContracts = computed(() => {
      return hasActivePreview.value ? previewData.value : currentWeekContracts.value;
    });

    const activeSummary = computed(() => {
      if (hasActivePreview.value) {
        return {
          totalContracts: previewData.value.length,
          totalCapital: previewSummary.value.totalCapital,
          totalPrimeTTC: previewSummary.value.totalPrimeTTC
        };
      } else {
        return {
          totalContracts: currentWeekContracts.value.length,
          totalCapital: currentWeekSummary.value.totalCapital,
          totalPrimeTTC: currentWeekSummary.value.totalPrimeTTC
        };
      }
    });

    const getPreviewPeriodText = () => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        const startDate = form.values?.startDate;
        const endDate = form.values?.endDate;
        const agenceName = form.values?.agence?.name || 'Toutes les agences';
        return `Période du ${formatDate(startDate)} au ${formatDate(endDate)} - ${agenceName}`;
      }
      return '';
    };

    const resetActiveFilter = () => {
      hasActivePreview.value = false;
      previewData.value = [];
      selectedPeriod.value = null;
      if (productionStateForm.value) {
        const today = new Date().toISOString().split('T')[0];
        const formData: any = {
          startDate: today,
          endDate: today
        };
        if (agenceOptions.value.length === 1) {
          formData.agence = agenceOptions.value[0];
        } else {
          formData.agence = null;
        }
        (productionStateForm.value as any).setValues(formData);
      }
    };

    const handlePdfExport = () => {
      if (hasActivePreview.value) {
        downloadPdfReport();
      } else {
        downloadWeeklyPdfReport();
      }
    };

    const handleExcelExport = () => {
      if (hasActivePreview.value) {
        downloadExcelReport();
      } else {
        downloadWeeklyExcelReport();
      }
    };

    const handleSaveExcel = () => {
      if (hasActivePreview.value) {
        generateAndSaveExcel();
      } else {
        saveWeeklyExcelReport();
      }
    };

    const dateRangeInfo = computed(() => {
      if (productionStateForm.value) {
        const form = productionStateForm.value as any;
        const startDate = form.values?.startDate;
        const endDate = form.values?.endDate;
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return `Période de ${diffDays} jour(s)`;
        }
      }
      return null;
    });

    // Schema de validation
    const productionStateSchema = computed(() => {
      const baseSchema = {
        agence: Yup.object().nullable(),
        startDate: Yup.date()
          .typeError('Veuillez entrer une date de début valide')
          .required('La date de début est obligatoire')
          .max(new Date(), 'La date de début ne peut pas être dans le futur'),
        endDate: Yup.date()
          .typeError('Veuillez entrer une date de fin valide')
          .required('La date de fin est obligatoire')
          .min(Yup.ref('startDate'), 'La date de fin doit être postérieure à la date de début')
          .max(new Date(), 'La date de fin ne peut pas être dans le futur')
      };

      if (isEditMode.value) {
        return Yup.object().shape({
          ...baseSchema,
          status: Yup.object().nullable().required('Le statut est obligatoire'),
          errorMessage: Yup.string().when('status', {
            is: (status: StatusOption) => status?.value === 'failed',
            then: (schema) => schema.required('Le message d\'erreur est obligatoire pour un statut échoué'),
            otherwise: (schema) => schema.nullable()
          })
        });
      }

      return Yup.object().shape(baseSchema);
    });

    // Methods
    const canViewAllAgencies = (user: any): boolean => {
      // console.log('🔍 canViewAllAgencies - user:', user);
      
      if (!user || !user.role) {
        // console.log('❌ Pas d\'utilisateur ou pas de rôle');
        return false;
      }
      
      // Récupérer le nom du rôle (peut être string ou objet)
      const roleName = typeof user.role === 'string' 
        ? user.role 
        : user.role?.name || user.role?.slug || user.role?.libelle || '';
      
      // console.log('🔍 Rôle brut:', roleName);
      // console.log('🔍 Type du rôle:', typeof user.role);
      
      // Convertir en majuscules et normaliser (remplacer espaces et underscores)
      const roleUpper = roleName.toUpperCase().replace(/\s+/g, '_').replace(/_+/g, '_');
      
      // console.log('🔍 Rôle normalisé:', roleUpper);
      
      // USER et AGENCY MANAGER ne peuvent voir que leur agence
      // Les autres rôles (ADMIN, MANAGER, SUPER ADMIN, etc.) peuvent voir toutes les agences
      const restrictedRoles = ['USER', 'AGENCY_MANAGER', 'AGENCYMANAGER'];
      const isRestricted = restrictedRoles.includes(roleUpper);
      const canViewAll = !isRestricted;
      
      // console.log('🔍 Rôle restreint?', isRestricted);
      // console.log('🔍 Peut voir toutes les agences?', canViewAll);
      
      return canViewAll;
    };

    const fetchAgences = async (): Promise<void> => {
      try {
        // Récupérer le profil utilisateur en temps réel pour avoir les données à jour
        try {
          const profileResponse = await ApiService.get('/auth/profile');
          const profileUser = profileResponse.data?.data?.user || profileResponse.data?.user;
          
          if (profileUser) {
            // Mettre à jour le store avec les données à jour
            Object.assign(authStore.user as any, profileUser);
          }
        } catch (profileErr) {
          console.warn('⚠️ Impossible de charger le profil, utilisation du store:', profileErr);
          // Si l'API échoue, utiliser les données du store
        }
        
        const user = authStore.user as any;
        
        if (!user || !user.id) {
          error('Utilisateur non connecté');
          return;
        }
        
        // Vérifier si l'utilisateur peut voir toutes les agences (avec les données à jour)
        const canViewAll = canViewAllAgencies(user);
        
        // Si l'utilisateur est USER ou AGENCY MANAGER, ne montrer que son agence
        // Ne pas charger toutes les agences pour ces rôles
        if (!canViewAll) {
          // Essayer d'abord avec user.agency (objet complet)
          if (user.agency && (user.agency.id !== undefined && user.agency.id !== null)) {
            agenceOptions.value = [{
              id: user.agency.id,
              name: user.agency.name,
              value: user.agency.id,
              label: user.agency.name
            }];
            return;
          }
          
          // Si on a l'ID de l'agence (même si c'est 0, c'est valide), récupérer l'agence via API
          if (user.idAgency !== undefined && user.idAgency !== null) {
            try {
              const response = await ApiService.get(`/agencies/${user.idAgency}`);
              
              // Gérer différentes structures de réponse
              const agency = response.data?.data?.agency 
                || response.data?.data?.data?.agency
                || response.data?.data 
                || response.data?.agency 
                || response.data;
              
              if (agency && (agency.id !== undefined && agency.id !== null)) {
                agenceOptions.value = [{
                  id: agency.id,
                  name: agency.name,
                  value: agency.id,
                  label: agency.name
                }];
                return;
              } else {
                // Si l'agence n'est pas trouvée dans la réponse, essayer de charger le profil utilisateur complet
                console.warn('⚠️ Agence non trouvée dans la réponse API, tentative de chargement du profil utilisateur...');
                try {
                  const profileResponse = await ApiService.get('/auth/profile');
                  const profileUser = profileResponse.data?.data?.user || profileResponse.data?.user;
                  
                  if (profileUser?.agency && (profileUser.agency.id !== undefined && profileUser.agency.id !== null)) {
                    agenceOptions.value = [{
                      id: profileUser.agency.id,
                      name: profileUser.agency.name,
                      value: profileUser.agency.id,
                      label: profileUser.agency.name
                    }];
                    // Mettre à jour le store avec les données complètes
                    Object.assign(authStore.user as any, profileUser);
                    return;
                  }
                } catch (profileErr) {
                  console.error('❌ Erreur lors du chargement du profil:', profileErr);
                }
                
                error('Agence non trouvée');
                return;
              }
            } catch (err: any) {
              console.error('❌ Erreur lors de la récupération de l\'agence:', err);
              
              // Essayer de charger le profil utilisateur complet comme fallback
              try {
                const profileResponse = await ApiService.get('/auth/profile');
                const profileUser = profileResponse.data?.data?.user || profileResponse.data?.user;
                
                if (profileUser?.agency && (profileUser.agency.id !== undefined && profileUser.agency.id !== null)) {
                  agenceOptions.value = [{
                    id: profileUser.agency.id,
                    name: profileUser.agency.name,
                    value: profileUser.agency.id,
                    label: profileUser.agency.name
                  }];
                  // Mettre à jour le store avec les données complètes
                  Object.assign(authStore.user as any, profileUser);
                  return;
                }
              } catch (profileErr) {
                console.error('❌ Erreur lors du chargement du profil:', profileErr);
              }
              
              error('Erreur lors du chargement de votre agence');
              return;
            }
          } else {
            // Si l'utilisateur n'a pas d'agence assignée, essayer de charger le profil complet
            try {
              const profileResponse = await ApiService.get('/auth/profile');
              const profileUser = profileResponse.data?.data?.user || profileResponse.data?.user;
              
              if (profileUser?.idAgency !== undefined && profileUser.idAgency !== null) {
                // L'utilisateur a un idAgency, récupérer l'agence
                try {
                  const response = await ApiService.get(`/agencies/${profileUser.idAgency}`);
                  const agency = response.data?.data?.agency 
                    || response.data?.data?.data?.agency
                    || response.data?.data 
                    || response.data?.agency 
                    || response.data;
                  
                  if (agency && (agency.id !== undefined && agency.id !== null)) {
                    agenceOptions.value = [{
                      id: agency.id,
                      name: agency.name,
                      value: agency.id,
                      label: agency.name
                    }];
                    // Mettre à jour le store
                    Object.assign(authStore.user as any, {
                      idAgency: profileUser.idAgency,
                      agency
                    });
                    return;
                  }
                } catch (agencyErr) {
                  console.error('❌ Erreur lors de la récupération de l\'agence:', agencyErr);
                }
              }
              
              if (profileUser?.agency && (profileUser.agency.id !== undefined && profileUser.agency.id !== null)) {
                agenceOptions.value = [{
                  id: profileUser.agency.id,
                  name: profileUser.agency.name,
                  value: profileUser.agency.id,
                  label: profileUser.agency.name
                }];
                // Mettre à jour le store
                Object.assign(authStore.user as any, profileUser);
                return;
              }
            } catch (profileErr) {
              console.error('❌ Erreur lors du chargement du profil:', profileErr);
            }
            
            // Si après tous les essais, aucune agence n'est trouvée
            error('Aucune agence assignée à votre compte');
            return;
          }
        }
        
        // Pour les autres rôles (ADMIN, MANAGER, etc.) : charger toutes les agences
        // console.log('🌐 Chargement de toutes les agences pour les rôles non restreints');
        // Passer un limit élevé pour obtenir toutes les agences sans pagination
        const response = await ApiService.get('/agencies?limit=-1');
        // console.log('📥 Réponse API agences:', response);
        
        // Gérer différentes structures de réponse selon la structure fournie
        let agencies: any[] = [];
        
        if (response.data?.data?.agencies && Array.isArray(response.data.data.agencies)) {
          // Structure: { data: { data: { agencies: [...] } } }
          agencies = response.data.data.agencies;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Structure: { data: { data: [...] } }
          agencies = response.data.data;
        } else if (response.data?.agencies && Array.isArray(response.data.agencies)) {
          // Structure: { data: { agencies: [...] } }
          agencies = response.data.agencies;
        } else if (Array.isArray(response.data)) {
          // Structure directe: [...]
          agencies = response.data;
        }
        
        agenceOptions.value = agencies.map((agence: any) => ({
          id: agence.id,
          name: agence.name,
          value: agence.id,
          label: agence.name
        }));
      } catch (err: any) {
        console.error("❌ Erreur lors du chargement des agences:", err);
        error("Erreur lors du chargement des agences: " + (err.response?.data?.message || err.message));
      }
    };


    // Télécharger le rapport PDF
    const downloadPdfReport = async (): Promise<void> => {
      if (isDownloadingPdf.value) return;
      
      try {
        isDownloadingPdf.value = true;
        
        if (!productionStateForm.value) {
          error('Formulaire non initialisé');
          return;
        }

        const formData = (productionStateForm.value as any).getValues();
        
        if (!formData.startDate || !formData.endDate) {
          error('Veuillez sélectionner une période');
          return;
        }

        // console.log('📄 Téléchargement du rapport PDF...');
        // console.log('📅 Période:', formData.startDate, 'au', formData.endDate);
        // console.log('🏢 Agence:', formData.agence?.name || 'Toutes les agences');

        // Construire les paramètres
        const params: any = {
          startDate: formData.startDate,
          endDate: formData.endDate
        };
        
        // Ajouter l'agence seulement si elle est sélectionnée
        if (formData.agence?.id) {
          params.idAgency = formData.agence.id.toString();
        }

        // Ajouter la nature de crédit si elle est sélectionnée
        const natureCreditId = formData.natureCredit?.id || formData.natureCredit?.value;
        if (natureCreditId) {
          params.idNatureCredit = natureCreditId.toString();
        }

        // Ajouter l'utilisateur si ce n'est pas un admin/manager
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        if (!canViewAll && user.id) {
          params.idUser = user.id.toString();
        }

        // Construire l'URL pour le téléchargement
        const queryString = new URLSearchParams(params).toString();
        const downloadUrl = `/production_states/report/pdf?${queryString}`;
        
        // console.log('🔗 URL de téléchargement PDF:', downloadUrl);
        
        // Utiliser ApiService pour télécharger le fichier
        const response = await ApiService.vueInstance.axios.get(downloadUrl, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf'
          }
        });
        
        // console.log('📥 Réponse reçue, status:', response.status);
        // console.log('📥 Content-Type:', response.headers['content-type']);
        
        // Vérifier que c'est bien un blob
        if (!(response.data instanceof Blob)) {
          // console.error('❌ Réponse invalide, ce n\'est pas un blob');
          throw new Error('Le serveur n\'a pas renvoyé un fichier PDF valide');
        }
        
        // Vérifier que le blob n'est pas vide
        if (response.data.size === 0) {
          throw new Error('Le fichier PDF est vide');
        }
        
        // console.log('✅ Blob créé, taille:', response.data.size, 'bytes');
        
        // Créer un blob PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rapport_Production_${formData.startDate}_${formData.endDate}.pdf`;
        link.style.display = 'none';
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL
        window.URL.revokeObjectURL(url);

        success('Rapport PDF téléchargé avec succès');
      } catch (err: any) {
        // console.error('❌ Erreur lors du téléchargement du rapport PDF:', err);
        
        // Gérer les erreurs axios
        if (err.response) {
          // console.error('❌ Réponse d erreur:', err.response.status, err.response.data);
          
          // Si c'est un blob d'erreur, essayer de le lire
          if (err.response.data instanceof Blob) {
            try {
              const errorText = await err.response.data.text();
              const errorJson = JSON.parse(errorText);
              error(errorJson.message || errorJson.error || 'Erreur lors du téléchargement du rapport PDF');
            } catch (e) {
              error('Erreur lors du téléchargement du rapport PDF');
            }
          } else if (err.response.data?.message) {
            error(err.response.data.message);
          } else {
            error('Erreur lors du téléchargement du rapport PDF');
          }
        } else if (err.message) {
          error(err.message);
        } else {
          error('Erreur lors du téléchargement du rapport PDF');
        }
      } finally {
        isDownloadingPdf.value = false;
      }
    };

    // Télécharger le rapport Excel
    const downloadExcelReport = async (): Promise<void> => {
      if (isDownloadingExcel.value) return;
      
      try {
        isDownloadingExcel.value = true;
        
        if (!productionStateForm.value) {
          error('Formulaire non initialisé');
          return;
        }

        const formData = (productionStateForm.value as any).getValues();
        
        if (!formData.startDate || !formData.endDate) {
          error('Veuillez sélectionner une période');
          return;
        }

        console.log('📊 Téléchargement du rapport Excel...');
        console.log('📅 Période:', formData.startDate, 'au', formData.endDate);
        console.log('🏢 Agence:', formData.agence?.name || 'Toutes les agences');

        // Construire les paramètres
        const params: any = {
          startDate: formData.startDate,
          endDate: formData.endDate
        };
        
        // Ajouter l'agence seulement si elle est sélectionnée
        if (formData.agence?.id) {
          params.idAgency = formData.agence.id.toString();
        }

        // Ajouter la nature de crédit si elle est sélectionnée
        const natureIds = getSelectedNatureIds(formData.natureCredit);
        if (natureIds.length > 0) {
          params.idNatureCredits = natureIds.join(',');
        }

        // Ajouter l'utilisateur si ce n'est pas un admin/manager
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        if (!canViewAll && user.id) {
          params.idUser = user.id.toString();
        }

        // Construire l'URL pour le téléchargement
        const queryString = new URLSearchParams(params).toString();
        const downloadUrl = `/contracts/production-report/excel?${queryString}`;
        
        console.log('🔗 URL de téléchargement Excel:', downloadUrl);
        
        // Utiliser ApiService pour télécharger le fichier
        const response = await ApiService.vueInstance.axios.get(downloadUrl, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream'
          }
        });
        
        // Créer un blob et déclencher le téléchargement
        const blob = response.data;
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rapport_Production_${formData.startDate}_${formData.endDate}.xlsx`;
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL
        window.URL.revokeObjectURL(url);

        success('Rapport Excel téléchargé avec succès');
      } catch (err: any) {
        console.error('❌ Erreur lors du téléchargement du rapport Excel:', err);
        error('Erreur lors du téléchargement du rapport Excel');
      } finally {
        isDownloadingExcel.value = false;
      }
    };

    const fetchProductionState = async (id: string): Promise<void> => {
      try {
        isSubmitting.value = true;
        const response = await ApiService.get(`/production_states/${id}`);
        const productionData = response.data.data;

        // Trouver l'agence correspondante
        const agenceOption = agenceOptions.value.find(
          option => option.id === productionData.idAgency
        );

        // Trouver le statut correspondant
        const statusOption = statusOptions.value.find(
          option => option.value === productionData.status
        );

        // Préparer les données pour le formulaire
        const formData: ProductionStateData = {
          agence: agenceOption || null,
          startDate: productionData.startDate,
          endDate: productionData.endDate,
          status: statusOption || null,
          errorMessage: productionData.errorMessage || '',
          filePath: productionData.filePath || '',
          summary: productionData.summary || null
        };

        // Remplir le formulaire
        if (productionStateForm.value) {
          (productionStateForm.value as any).setValues(formData);
        }

        isFormDirty.value = false;

      } catch (err: any) {
        // console.error('Erreur lors du chargement de l\'état de production:', err);
        error('Erreur lors du chargement de l\'état de production');
        router.push('/liste-etats-production');
      } finally {
        isSubmitting.value = false;
      }
    };

    const applyPredefinedPeriod = (period: PeriodOption | null): void => {
      if (period && productionStateForm.value) {
        const form = productionStateForm.value as any;
        form.setFieldValue('startDate', period.startDate);
        form.setFieldValue('endDate', period.endDate);
        isFormDirty.value = true;
      }
    };

    const handleDateChange = (): void => {
      // Réinitialiser la période prédéfinie si l'utilisateur modifie manuellement les dates
      selectedPeriod.value = null;
      isFormDirty.value = true;
    };

    const getStatusBadgeClass = (status: string): string => {
      switch (status) {
        case 'pending':
          return 'bg-secondary';
        case 'processing':
          return 'bg-warning';
        case 'completed':
          return 'badge-success-custom';
        case 'failed':
          return 'bg-danger';
        default:
          return 'bg-secondary';
      }
    };

    const formatCurrency = (amount: number | undefined): string => {
      if (amount === undefined || amount === null) return '0';
      return amount.toLocaleString('fr-FR');
    };

    const formatDate = (date: string | Date | null | undefined): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('fr-FR');
    };

    const getCustomerName = (contract: any): string => {
      if (!contract.customer) return 'N/A';
      // Essayer différentes structures de nom
      if (contract.customer.fullName) return contract.customer.fullName;
      if (contract.customer.firstname && contract.customer.lastname) {
        return `${contract.customer.firstname} ${contract.customer.lastname}`.trim();
      }
      if (contract.customer.prenom && contract.customer.nom) {
        return `${contract.customer.prenom} ${contract.customer.nom}`.trim();
      }
      if (contract.customer.lastname && contract.customer.firstname) {
        return `${contract.customer.lastname} ${contract.customer.firstname}`.trim();
      }
      return contract.customer.lastname || contract.customer.firstname || 'N/A';
    };

    const getUserName = (contract: any): string => {
      if (!contract.user) return 'N/A';
      // Essayer différentes structures de nom
      if (contract.user.fullName) return contract.user.fullName;
      if (contract.user.firstname && contract.user.lastname) {
        return `${contract.user.firstname} ${contract.user.lastname}`.trim();
      }
      return contract.user.lastname || contract.user.firstname || 'N/A';
    };

    const getContractStatus = (contract: any): string => {
      if (contract.contractState?.libelle) return contract.contractState.libelle;
      if (contract.status) return contract.status;
      if (contract.contractState?.name) return contract.contractState.name;
      return 'N/A';
    };

    const getContractStatusBadgeClass = (contract: any): string => {
      const status = getContractStatus(contract);
      if (!status || status === 'N/A') return 'bg-secondary';
      const statusUpper = status.toUpperCase();
      if (statusUpper.includes('ACTIF') || statusUpper.includes('EN COURS') || statusUpper === 'ACTIVE') return 'bg-success';
      if (statusUpper.includes('SUSPENDU') || statusUpper === 'SUSPENDED') return 'bg-danger';
      if (statusUpper.includes('ATTENTE') || statusUpper === 'PENDING') return 'bg-warning';
      return 'bg-secondary';
    };

    const getContractCode = (contract: any): string => {
      return contract.reference || contract.police || contract.code || 'N/A';
    };

    const getPrimeTTC = (contract: any): number => {
      return parseFloat(contract.puttc) || parseFloat(contract.primeTTC) || 0;
    };

    const getCapital = (contract: any): number => {
      return parseFloat(contract.capital) || 0;
    };

    const getNatureCredit = (contract: any): string => {
      if (contract.natureCredit?.libelle) return contract.natureCredit.libelle;
      if (contract.natureCredit?.name) return contract.natureCredit.name;
      if (contract.natureCredit?.code) return contract.natureCredit.code;
      return 'N/A';
    };

    const fetchPreviewData = async (startDate: string, endDate: string, idAgency?: number | null, idNatureCredits?: number[] | null): Promise<void> => {
      try {
        isSubmitting.value = true;
        
        // Ajouter l'utilisateur si ce n'est pas un admin/manager
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        
        // Construire l'URL avec les paramètres de requête
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        if (idAgency) {
          queryParams.append('idAgency', idAgency.toString());
        }
        if (idNatureCredits && idNatureCredits.length > 0) {
          queryParams.append('idNatureCredits', idNatureCredits.join(','));
        }
        if (!canViewAll && user.id) {
          queryParams.append('idUser', user.id.toString());
        }
        
        const url = `/production_states/preview?${queryParams.toString()}`;
        
        // Utiliser l'endpoint spécifique pour la prévisualisation
        const response = await ApiService.get(url);
        
        // Gérer la structure de réponse
        let contracts: any[] = [];
        let summary: any = null;
        
        const responseData = response.data;
        
        // Essayer différentes structures possibles
        if (responseData?.data?.contracts && Array.isArray(responseData.data.contracts)) {
          // Structure: { data: { data: { contracts: [...], summary: {...} } } }
          contracts = responseData.data.contracts;
          summary = responseData.data.summary;
        } else if (responseData?.contracts && Array.isArray(responseData.contracts)) {
          // Structure: { data: { contracts: [...], summary: {...} } }
          contracts = responseData.contracts;
          summary = responseData.summary;
        } else if (responseData?.data && responseData.data.contracts) {
          // Structure: { data: { contracts: [...], summary: {...} } }
          contracts = responseData.data.contracts;
          summary = responseData.data.summary;
        } else if (Array.isArray(responseData?.data)) {
          contracts = responseData.data;
        } else if (Array.isArray(responseData)) {
          contracts = responseData;
        } else {
          console.error('❌ Structure de réponse inattendue:', responseData);
          throw new Error('Structure de réponse invalide');
        }

        previewData.value = contracts;
        hasActivePreview.value = true;
        
        // Utiliser le résumé du backend ou calculer localement
        if (summary) {
          previewSummary.value = {
            totalCapital: summary.totalCapital || 0,
            totalPrimeTTC: summary.totalPrimeTTC || 0,
            avgCapital: contracts.length > 0 ? (summary.totalCapital || 0) / contracts.length : 0
          };
        } else {
          // Calculer le résumé localement si non fourni
          const totalCapital = contracts.reduce((sum, c) => sum + (parseFloat(c.capital) || 0), 0);
          const totalPrimeTTC = contracts.reduce((sum, c) => sum + (parseFloat(c.puttc) || 0), 0);
          const avgCapital = contracts.length > 0 ? totalCapital / contracts.length : 0;
          
          previewSummary.value = {
            totalCapital,
            totalPrimeTTC,
            avgCapital
          };
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors de la récupération des données de prévisualisation:', err);
        // Si l'endpoint n'existe pas, essayer avec findByPeriodAndFilters
        if (err.response?.status === 404) {
          error('Impossible de récupérer les données de prévisualisation');
        } else {
          error('Erreur lors de la récupération des données: ' + (err.response?.data?.message || err.message));
        }
        previewData.value = [];
      } finally {
        isSubmitting.value = false;
      }
    };

    const downloadFile = async (): Promise<void> => {
      if (hasValidFilePath.value && props.id) {
        try {
          const filename = `production_${props.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
          await ApiService.getWithConfig(`production_states/${props.id}/download`, {
            responseType: 'blob'
          });
          success('Fichier téléchargé avec succès');
        } catch (err: any) {
          console.error('Erreur téléchargement:', err);
          error('Erreur lors du téléchargement du fichier');
        }
      }
    };

    const addProductionState = async (values: any): Promise<void> => {
      try {
        // Validation des données requises (période obligatoire)
        if (!values.startDate || !values.endDate) {
          error('La période est obligatoire');
          return;
        }

        if (isEditMode.value && props.id) {
          // Mode édition - mise à jour directe
          isSubmitting.value = true;
          
          const formData = {
            idAgency: values.agence?.id || null,
            startDate: values.startDate,
            endDate: values.endDate,
            status: values.status?.value,
            errorMessage: values.errorMessage || null,
            filePath: values.filePath || null,
            summary: values.summary || null
          };

          console.log('🔄 Mode mise à jour, ID:', props.id);
          await ApiService.put(`/production_states/${props.id}`, formData);
          success('État de production mis à jour avec succès!');
          
          setTimeout(() => {
            router.push('/liste-etats-production');
          }, 1000);
        } else {
          // Mode création - récupérer les données pour prévisualisation
          const selectedNatureIds = getSelectedNatureIds(values.natureCredit);
          await fetchPreviewData(
            values.startDate,
            values.endDate,
            values.agence?.id || null,
            selectedNatureIds
          );
          
          // Si les données sont chargées avec succès, le tableau s'affichera automatiquement
          if (previewData.value.length === 0) {
            error('Aucun contrat trouvé pour cette période');
          }
        }

        // Réinitialiser le flag de modification
        isFormDirty.value = false;

      } catch (err: any) {
        console.error('❌ Erreur lors de l\'enregistrement:', err);

        // Gestion des erreurs spécifiques
        if (err.response?.status === 422) {
          const errors = err.response.data.errors;
          if (errors) {
            Object.keys(errors).forEach(key => {
              error(errors[key][0]);
            });
          } else {
            error('Données invalides. Veuillez vérifier le formulaire.');
          }
        } else if (err.response?.status === 409) {
          error('Cet état de production existe déjà.');
        } else if (err.response?.status === 400) {
          const errorMessage = err.response.data.message || 'Erreur lors de la récupération des données';
          error(errorMessage);
        } else {
          error('Erreur lors de l\'enregistrement. Veuillez réessayer.');
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const generateAndSaveExcel = async (): Promise<void> => {
      if (isSaving.value) return;
      
      try {
        isSaving.value = true;
        
        if (!productionStateForm.value) {
          error('Formulaire non initialisé');
          return;
        }

        const formData = (productionStateForm.value as any).getValues();
        
        if (!formData.startDate || !formData.endDate) {
          error('La période est obligatoire');
          return;
        }

        const selectedNatureIds = getSelectedNatureIds(formData.natureCredit);
        const generateData = {
          startDate: formData.startDate,
          endDate: formData.endDate,
          idAgency: formData.agence?.id || null,
          idNatureCredits: selectedNatureIds.length > 0 ? selectedNatureIds : undefined
        };

        // console.log('📊 Génération et sauvegarde du fichier Excel...', generateData);

        const response = await ApiService.post('/production_states/generate-excel', generateData);
        
        // console.log('✅ Réponse génération Excel:', response.data);
        
        const { message, productionState, filePath } = response.data.data;
        
        success(`${message} Fichier généré: ${filePath}`);

        // Rediriger vers la liste
        setTimeout(() => {
          router.push('/liste-etats-production');
        }, 1000);

      } catch (err: any) {
        console.error('❌ Erreur lors de la génération:', err);
        const errorMessage = err.response?.data?.message || 'Erreur lors de la génération du fichier Excel';
        error(errorMessage);
      } finally {
        isSaving.value = false;
      }
    };

    const downloadWeeklyPdfReport = async (): Promise<void> => {
      if (isDownloadingWeeklyPdf.value) return;
      try {
        isDownloadingWeeklyPdf.value = true;
        const startDate = getStartOfWeek().toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        
        const params: any = { startDate, endDate };
        
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        if (!canViewAll && user.idAgency) {
          params.idAgency = user.idAgency.toString();
        }
        if (!canViewAll && user.id) {
          params.idUser = user.id.toString();
        }

        const queryString = new URLSearchParams(params).toString();
        const downloadUrl = `/production_states/report/pdf?${queryString}`;
        
        const response = await ApiService.vueInstance.axios.get(downloadUrl, {
          responseType: 'blob',
          headers: { 'Accept': 'application/pdf' }
        });
        
        if (!(response.data instanceof Blob) || response.data.size === 0) {
          throw new Error('Le serveur n\'a pas renvoyé un fichier PDF valide');
        }
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Production_Hebdomadaire_${startDate}_${endDate}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        success('Rapport PDF hebdomadaire téléchargé avec succès');
      } catch (err: any) {
        console.error(err);
        error('Erreur lors du téléchargement du rapport PDF');
      } finally {
        isDownloadingWeeklyPdf.value = false;
      }
    };

    const downloadWeeklyExcelReport = async (): Promise<void> => {
      if (isDownloadingWeeklyExcel.value) return;
      try {
        isDownloadingWeeklyExcel.value = true;
        const startDate = getStartOfWeek().toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        
        const params: any = { startDate, endDate };
        
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        if (!canViewAll && user.idAgency) {
          params.idAgency = user.idAgency.toString();
        }
        if (!canViewAll && user.id) {
          params.idUser = user.id.toString();
        }

        const queryString = new URLSearchParams(params).toString();
        const downloadUrl = `/contracts/production-report/excel?${queryString}`;
        
        const response = await ApiService.vueInstance.axios.get(downloadUrl, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream'
          }
        });
        
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Production_Hebdomadaire_${startDate}_${endDate}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        success('Rapport Excel hebdomadaire téléchargé avec succès');
      } catch (err: any) {
        console.error(err);
        error('Erreur lors du téléchargement du rapport Excel');
      } finally {
        isDownloadingWeeklyExcel.value = false;
      }
    };

    const saveWeeklyExcelReport = async (): Promise<void> => {
      if (isSavingWeekly.value) return;
      try {
        isSavingWeekly.value = true;
        const startDate = getStartOfWeek().toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        const idAgency = !canViewAll && user.idAgency ? user.idAgency : null;
        
        const generateData = {
          startDate,
          endDate,
          idAgency
        };

        const response = await ApiService.post('/production_states/generate-excel', generateData);
        const { message, filePath } = response.data.data;
        success(`${message} Fichier généré: ${filePath}`);
      } catch (err: any) {
        console.error(err);
        error('Erreur lors de la génération de l\'état de production');
      } finally {
        isSavingWeekly.value = false;
      }
    };

    const loadCurrentWeekProduction = async (): Promise<void> => {
      try {
        loadingCurrentWeek.value = true;
        const startDate = getStartOfWeek().toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        
        if (!canViewAll && user.idAgency) {
          queryParams.append('idAgency', user.idAgency.toString());
        }
        if (!canViewAll && user.id) {
          queryParams.append('idUser', user.id.toString());
        }

        const url = `/production_states/preview?${queryParams.toString()}`;
        const response = await ApiService.get(url);
        
        let contracts: any[] = [];
        let summary: any = null;
        
        const responseData = response.data;
        if (responseData?.data?.contracts && Array.isArray(responseData.data.contracts)) {
          contracts = responseData.data.contracts;
          summary = responseData.data.summary;
        } else if (responseData?.contracts && Array.isArray(responseData.contracts)) {
          contracts = responseData.contracts;
          summary = responseData.summary;
        } else if (responseData?.data && responseData.data.contracts) {
          contracts = responseData.data.contracts;
          summary = responseData.data.summary;
        }

        currentWeekContracts.value = contracts;
        if (summary) {
          currentWeekSummary.value = {
            totalContracts: contracts.length,
            totalCapital: summary.totalCapital || 0,
            totalPrimeTTC: summary.totalPrimeTTC || 0
          };
        } else {
          let totalCapital = 0;
          let totalPrimeTTC = 0;
          contracts.forEach(c => {
            totalCapital += getCapital(c);
            totalPrimeTTC += getPrimeTTC(c);
          });
          currentWeekSummary.value = {
            totalContracts: contracts.length,
            totalCapital,
            totalPrimeTTC
          };
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement de la production hebdomadaire:', err);
      } finally {
        loadingCurrentWeek.value = false;
      }
    };

    // Watchers
    watch(() => agenceOptions.value, async () => {
      if (isEditMode.value && props.id && agenceOptions.value.length > 0) {
        await fetchProductionState(props.id);
      }
    });

    // Protection contre la navigation non sauvegardée
    const beforeWindowUnload = (e: BeforeUnloadEvent): void => {
      if (isFormDirty.value) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Lifecycle hooks
    onMounted(async () => {
      // console.log('🎯 Composant monté, chargement des données...');
      try {
        await fetchAgences();
        await loadNatureCredits();
        
        // Préremplir les champs si on est en mode création
        if (!isEditMode.value && productionStateForm.value) {
          setTimeout(() => {
            if (productionStateForm.value) {
              const today = new Date().toISOString().split('T')[0];
              const formData: any = {
                startDate: today,
                endDate: today,
                natureCredit: []
              };
              
              // Si une seule agence disponible (cas USER), la pré-sélectionner automatiquement
              if (agenceOptions.value.length === 1) {
                formData.agence = agenceOptions.value[0];
              }
              
              (productionStateForm.value as any).setValues(formData);
            }
          }, 200); // Augmenter le délai pour s'assurer que les agences sont chargées
        }
        
        window.addEventListener('beforeunload', beforeWindowUnload);
        console.log('✅ Données chargées avec succès');
        
        // Charger la production de la semaine en cours
        await loadCurrentWeekProduction();
        
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation:', err);
        error("Erreur lors de l'initialisation du formulaire");
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeWindowUnload);
    });

      return {
      // Refs
      productionStateForm,
      isSubmitting,
      isDownloadingPdf,
      isDownloadingExcel,
      isSaving,
      isFormDirty,
      agenceOptions,
      natureCredits,
      natureCreditOptions,
      statusOptions,
      selectedPeriod,
      periodOptions,
      previewData,
      previewSummary,
      currentWeekContracts,
      currentWeekSummary,
      loadingCurrentWeek,
      isDownloadingWeeklyPdf,
      isDownloadingWeeklyExcel,
      isSavingWeekly,
      
      // Computed
      isEditMode,
      isAgencyRestricted,
      selectedAgence,
      selectedStatus,
      showErrorMessage,
      showSummary,
      showFilePath,
      hasValidFilePath,
      summaryData,
      dateRangeInfo,
      productionStateSchema,
      
      // Methods
      addProductionState,
      applyPredefinedPeriod,
      handleDateChange,
      getStatusBadgeClass,
      formatCurrency,
      formatDate,
      getCustomerName,
      getUserName,
      getContractStatus,
      getContractStatusBadgeClass,
      getContractCode,
      getPrimeTTC,
      getCapital,
      getNatureCredit,
      downloadFile,
      downloadPdfReport,
      downloadExcelReport,
      generateAndSaveExcel,
      loadCurrentWeekProduction,
      getStartOfWeek,
      downloadWeeklyPdfReport,
      downloadWeeklyExcelReport,
      saveWeeklyExcelReport,
      hasActivePreview,
      activeContracts,
      activeSummary,
      getPreviewPeriodText,
      resetActiveFilter,
      handlePdfExport,
      handleExcelExport,
      handleSaveExcel
    };
  }
});
</script>

<style scoped>
/* ===== FNDA Green Color System ===== */
.text-fnda { color: #33b04a !important; }
.bg-soft-fnda { background-color: rgba(51, 176, 74, 0.12) !important; }
.bg-soft-info-fnda { background-color: rgba(0, 188, 212, 0.1) !important; }
.border-soft-info { border: 1px solid rgba(0, 188, 212, 0.2) !important; }

.btn-fnda {
  background-color: #33b04a;
  color: #ffffff;
  border-color: #33b04a;
  transition: all 0.3s ease;
}
.btn-fnda:hover, .btn-fnda:focus {
  background-color: #2d9a41;
  color: #ffffff;
  border-color: #2d9a41;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 176, 74, 0.3);
}

/* ===== Card Header ===== */
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
}

/* ===== Filter Groups ===== */
.filter-group { transition: all 0.3s ease; }
.filter-group:hover {
  background-color: #fff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.bg-light-gray { background-color: #fcfcfc; }

/* ===== Custom Multiselect ===== */
:deep(.custom-multiselect) {
  --ms-border-color: #cbd5e1;
  --ms-radius: 8px;
  --ms-placeholder-color: #94a3b8;
  --ms-option-bg-selected: #059669;
  --ms-option-bg-selected-pointed: #047857;
  --ms-tag-bg: #ecfdf5;
  --ms-tag-color: #047857;
  --ms-tag-radius: 6px;
  --ms-tag-font-size: 0.75rem;
  --ms-tag-font-weight: 600;
}

:deep(.custom-multiselect .multiselect-tags) {
  gap: 4px;
  padding: 3px 6px;
}

:deep(.custom-multiselect .multiselect-tag) {
  background-color: #ecfdf5 !important;
  color: #047857 !important;
  border: 1px solid #a7f3d0 !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  padding: 2px 8px !important;
  margin: 2px !important;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

:deep(.custom-multiselect .multiselect-tag-remove) {
  background: transparent !important;
  color: #059669 !important;
  border-radius: 4px;
  margin-left: 4px;
  padding: 0 2px;
}

:deep(.custom-multiselect .multiselect-tag-remove:hover) {
  background-color: rgba(4, 120, 87, 0.15) !important;
  color: #064e3b !important;
}

.custom-tag-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  margin: 2px;
  line-height: 1.2;
}

.tag-remove-btn {
  margin-left: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  color: #059669;
  line-height: 1;
}

.tag-remove-btn:hover {
  color: #064e3b;
}

/* ===== Action Bar Status Badges ===== */
.bg-soft-success-badge {
  background-color: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.25);
}
.bg-soft-warning-badge {
  background-color: rgba(243, 156, 18, 0.1);
  border: 1px solid rgba(243, 156, 18, 0.25);
}

/* ===== Vertical Divider ===== */
.divider-v {
  width: 1px;
  height: 30px;
  background-color: #dee2e6;
  margin: 0 5px;
  align-self: center;
}

/* ===== KPI Cards Glassmorphism ===== */
.glass-morphism {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06) !important;
}
.kpi-icon-wrapper {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* KPI soft backgrounds */
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12) !important; }
.bg-soft-dark    { background-color: rgba(35, 31, 32, 0.10) !important; }

/* ===== Table Premium ===== */
.table-responsive-custom {
  max-height: 520px;
  overflow-y: auto;
}
.table-responsive-custom::-webkit-scrollbar { width: 6px; }
.table-responsive-custom::-webkit-scrollbar-track { background: #f1f1f1; }
.table-responsive-custom::-webkit-scrollbar-thumb { background: #33b04a; border-radius: 10px; }
.table-responsive-custom::-webkit-scrollbar-thumb:hover { background: #2d9a41; }

.table thead th {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #6c757d;
  padding: 0.9rem 0.5rem;
  border-top: none;
}
.table tbody td {
  padding: 0.85rem 0.5rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #f3f3f3;
  vertical-align: middle;
}
.table tbody tr:hover { background-color: #f8fff9; }

.avatar-sm {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  font-size: 0.65rem;
}

/* ===== Typography Utilities ===== */
.fs-xs  { font-size: 0.75rem !important; }
.fs-xxs { font-size: 0.65rem !important; }
.fs-sm  { font-size: 0.825rem !important; }
.font-xs { font-size: 0.7rem !important; }

/* ===== Misc ===== */
.cursor-pointer { cursor: pointer; }
.badge-success-custom { background-color: #33b04a !important; color: #fff !important; }

.btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .kpi-card h3 { font-size: 1.1rem; }
  .btn { font-size: 13px !important; padding: 8px 12px !important; }
  .actions-group { width: 100%; }
  .divider-v { display: none; }
  .table-responsive-custom { max-height: 400px; }
  .table td, .table th { padding: 0.5rem; }
}
</style>
