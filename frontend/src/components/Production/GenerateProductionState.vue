<template>
  <div class="prod-page mb-25">

    <!-- PAGE HEADER -->
    <div class="prod-header">
      <div class="prod-header-left">
        <div class="prod-header-icon">
          <i class="ph-bold ph-chart-line-up"></i>
        </div>
        <div>
          <h3 class="prod-title">Etats de Production</h3>
          <p class="prod-subtitle">Extraction et analyse des donnees par periode</p>
        </div>
      </div>
      <div v-if="dateRangeInfo" class="prod-period-badge">
        <i class="ph-bold ph-calendar-blank me-1"></i>{{ dateRangeInfo }}
      </div>
    </div>

    <!-- FILTER PANEL -->
    <div class="prod-filter-panel">
      <Form ref="productionStateForm" @submit="addProductionState" :validation-schema="productionStateSchema">

        <div class="prod-filter-grid">
          <!-- Agence -->
          <div class="prod-filter-item">
            <label class="prod-label"><i class="ph-bold ph-buildings me-1 text-fnda"></i>Agence(s)</label>
            <Field name="agence" v-slot="{ field, setValue }">
              <Multiselect
                mode="tags"
                :options="agenceOptions"
                :searchable="agenceOptions.length > 1"
                trackBy="value"
                valueProp="value"
                label="label"
                :modelValue="Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])"
                @update:modelValue="(val) => { setValue(val); isFormDirty = true; }"
                :placeholder="agenceOptions.length > 1 ? 'Toutes (sélection multiple)' : 'Agence assignée'"
                :object="true"
                :disabled="agenceOptions.length === 1"
                :closeOnSelect="false"
                :clearable="agenceOptions.length > 1"
                class="prod-multiselect"
              >
                <template #tag="{ option, handleTagRemove }">
                  <span class="prod-tag">
                    <span>{{ option.label }}</span>
                    <span v-if="agenceOptions.length > 1" class="prod-tag-remove" @click.prevent="handleTagRemove(option, $event)">x</span>
                  </span>
                </template>
              </Multiselect>
            </Field>
            <ErrorMessage name="agence" class="prod-error"/>
          </div>

          <!-- Nature de credit -->
          <div class="prod-filter-item">
            <label class="prod-label"><i class="ph-bold ph-tag me-1 text-fnda"></i>Natures de credit</label>
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
                placeholder="Toutes (selection multiple)"
                :object="true"
                :closeOnSelect="false"
                :clearable="true"
                class="prod-multiselect"
              >
                <template #tag="{ option, handleTagRemove }">
                  <span class="prod-tag">
                    <span>{{ option.label }}</span>
                    <span class="prod-tag-remove" @click.prevent="handleTagRemove(option, $event)">x</span>
                  </span>
                </template>
              </Multiselect>
            </Field>
            <ErrorMessage name="natureCredit" class="prod-error"/>
          </div>

          <!-- Date debut -->
          <div class="prod-filter-item">
            <label class="prod-label"><i class="ph-bold ph-calendar-blank me-1 text-fnda"></i>Date de debut <span class="text-danger">*</span></label>
            <Field name="startDate" v-slot="{ field }">
              <input id="startDate" v-bind="field" type="date" class="prod-input" @change="handleDateChange"/>
            </Field>
            <ErrorMessage name="startDate" class="prod-error"/>
          </div>

          <!-- Date fin -->
          <div class="prod-filter-item">
            <label class="prod-label"><i class="ph-bold ph-calendar-check me-1 text-fnda"></i>Date de fin <span class="text-danger">*</span></label>
            <Field name="endDate" v-slot="{ field }">
              <input id="endDate" v-bind="field" type="date" class="prod-input" @change="handleDateChange"/>
            </Field>
            <ErrorMessage name="endDate" class="prod-error"/>
          </div>

          <!-- Periode rapide -->
          <div class="prod-filter-item">
            <label class="prod-label"><i class="ph-bold ph-lightning me-1 text-fnda"></i>Raccourci periode</label>
            <Multiselect
              v-model="selectedPeriod"
              :options="periodOptions"
              :searchable="false"
              :clearable="true"
              track-by="value"
              label="label"
              placeholder="Selectionner..."
              :object="true"
              @update:modelValue="applyPredefinedPeriod"
              class="prod-multiselect"
            />
          </div>
        </div>

        <!-- Edit mode extras -->
        <div v-if="isEditMode" class="prod-edit-extras">
          <div class="prod-filter-item" style="max-width:280px">
            <label class="prod-label">Statut</label>
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
                placeholder="Selectionner le statut"
                :object="true"
                mode="single"
                class="prod-multiselect"
              >
                <template #option="{ option }">
                  <span class="badge me-2" :class="getStatusBadgeClass(option.value)">{{ option.label }}</span>
                  <span class="text-muted" style="font-size:12px">{{ option.description }}</span>
                </template>
              </Multiselect>
            </Field>
            <ErrorMessage name="status" class="prod-error"/>
          </div>
          <div v-if="showErrorMessage" class="prod-filter-item flex-grow-1">
            <label class="prod-label">Message d erreur</label>
            <Field name="errorMessage" v-slot="{ field }">
              <textarea v-bind="field" class="prod-input" rows="2" readonly placeholder="Message d erreur"></textarea>
            </Field>
          </div>
          <div v-if="showFilePath" class="prod-filter-item flex-grow-1">
            <label class="prod-label">Fichier genere</label>
            <div class="d-flex gap-2">
              <Field name="filePath" v-slot="{ field }">
                <input v-bind="field" type="text" class="prod-input flex-grow-1" readonly placeholder="Chemin du fichier"/>
              </Field>
              <button v-if="hasValidFilePath" type="button" class="prod-btn prod-btn-primary" @click="downloadFile">
                <i class="ph-bold ph-download-simple"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- ACTION BAR -->
        <div class="prod-action-bar">
          <div class="prod-action-left">
            <button v-if="hasActivePreview" type="button" @click="resetActiveFilter" class="prod-btn prod-btn-ghost">
              <i class="ph-bold ph-x me-1"></i>Reinitialiser
            </button>
            <button v-if="!hasActivePreview" type="button" @click="loadCurrentWeekProduction" class="prod-btn prod-btn-ghost" :disabled="loadingCurrentWeek">
              <span v-if="loadingCurrentWeek" class="spinner-border spinner-border-sm me-1" style="width:13px;height:13px;"></span>
              <i v-else class="ph-bold ph-arrows-clockwise me-1"></i>Actualiser
            </button>
          </div>
          <div class="prod-action-right">
            <button
              type="button"
              @click="handlePdfExport"
              class="prod-btn prod-btn-danger"
              :disabled="activeContracts.length === 0 || (hasActivePreview ? isDownloadingPdf : isDownloadingWeeklyPdf)"
              :title="activeContracts.length === 0 ? 'Aucune donnée à exporter' : 'Exporter en PDF'"
            >
              <span v-if="hasActivePreview ? isDownloadingPdf : isDownloadingWeeklyPdf" class="spinner-border spinner-border-sm me-1" style="width:13px;height:13px;"></span>
              <i v-else class="ph-bold ph-file-pdf me-1"></i>PDF
            </button>
            <button
              type="button"
              @click="handleExcelExport"
              class="prod-btn prod-btn-excel"
              :disabled="activeContracts.length === 0 || (hasActivePreview ? isDownloadingExcel : isDownloadingWeeklyExcel)"
              :title="activeContracts.length === 0 ? 'Aucune donnée à exporter' : 'Exporter en Excel'"
            >
              <span v-if="hasActivePreview ? isDownloadingExcel : isDownloadingWeeklyExcel" class="spinner-border spinner-border-sm me-1" style="width:13px;height:13px;"></span>
              <i v-else class="ph-bold ph-file-xls me-1"></i>Excel
            </button>
            <div class="prod-separator"></div>
            <button class="prod-btn prod-btn-primary" type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" style="width:13px;height:13px;"></span>
              <i v-else class="ph-bold ph-magnifying-glass me-1"></i>
              {{ isEditMode ? 'Mettre a jour' : 'Previsualiser' }}
            </button>
          </div>
        </div>

      </Form>
    </div>

    <!-- RESULTS SECTION -->
    <div class="prod-results">

      <!-- Results Header -->
      <div class="prod-results-header">
        <div class="prod-results-title">
          <div class="prod-results-icon" :class="hasActivePreview ? 'prod-icon--preview' : 'prod-icon--week'">
            <i :class="hasActivePreview ? 'ph-bold ph-funnel' : 'ph-bold ph-calendar-blank'"></i>
          </div>
          <div>
            <div class="prod-results-label">{{ hasActivePreview ? 'Resultats de la previsualisation' : 'Production - Semaine en cours' }}</div>
            <div class="prod-results-period">{{ hasActivePreview ? getPreviewPeriodText() : `Du ${formatDate(getStartOfWeek())} au ${formatDate(new Date())}` }}</div>
          </div>
        </div>
        <div v-if="!(hasActivePreview ? isSubmitting : loadingCurrentWeek)" class="prod-kpi-row">
          <div class="prod-kpi">
            <div class="prod-kpi-icon prod-kpi--contracts"><i class="ph-bold ph-file-text"></i></div>
            <div>
              <div class="prod-kpi-label">Contrats</div>
              <div class="prod-kpi-value">{{ activeSummary.totalContracts }}</div>
            </div>
          </div>
          <div class="prod-kpi">
            <div class="prod-kpi-icon prod-kpi--capital"><i class="ph-bold ph-bank"></i></div>
            <div>
              <div class="prod-kpi-label">Capital</div>
              <div class="prod-kpi-value prod-kpi-nowrap">{{ formatCurrency(activeSummary.totalCapital) }} FCFA</div>
            </div>
          </div>
          <div class="prod-kpi">
            <div class="prod-kpi-icon prod-kpi--prime"><i class="ph-bold ph-coins"></i></div>
            <div>
              <div class="prod-kpi-label">Prime TTC</div>
              <div class="prod-kpi-value prod-kpi-success prod-kpi-nowrap">{{ formatCurrency(activeSummary.totalPrimeTTC) }} FCFA</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="hasActivePreview ? isSubmitting : loadingCurrentWeek" class="prod-skeleton-wrap">
        <div v-for="i in 7" :key="i" class="prod-skeleton-row">
          <div class="prod-sk" style="width:90px"></div>
          <div class="prod-sk" style="width:140px"></div>
          <div class="prod-sk" style="width:100px"></div>
          <div class="prod-sk" style="width:80px"></div>
          <div class="prod-sk" style="width:110px"></div>
          <div class="prod-sk" style="width:110px"></div>
          <div class="prod-sk" style="width:90px"></div>
          <div class="prod-sk" style="width:80px"></div>
        </div>
      </div>

      <!-- Table -->
      <div v-else class="prod-table-wrap">
        <table class="prod-table">
          <thead>
            <tr>
              <th>Réf / Police</th>
              <th>Client</th>
              <th>Agence</th>
              <th>Gestionnaire</th>
              <th class="text-end">Capital (FCFA)</th>
              <th class="text-end">Prime TTC (FCFA)</th>
              <th class="text-center">Date Effet</th>
              <th>Nature Crédit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="activeContracts.length === 0">
              <td colspan="8" class="text-center py-5">
                <div class="d-flex flex-column align-items-center justify-content-center py-4">
                  <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3" style="width: 54px; height: 54px;">
                    <i class="ph-bold ph-folder-open text-muted fs-3"></i>
                  </div>
                  <h6 class="fw-semibold text-dark mb-1" style="font-size: 14px;">Aucun contrat trouvé</h6>
                  <p class="text-muted mb-0" style="font-size: 12px; max-width: 420px;">
                    Aucune production n'a été enregistrée pour les critères ou la période sélectionnée.
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="contract in activeContracts" :key="contract.id" v-else>
              <td class="prod-td-code">{{ getContractCode(contract) }}</td>
              <td class="prod-td-client">{{ getCustomerName(contract) }}</td>
              <td class="prod-td-muted">{{ contract.agency?.name || 'N/A' }}</td>
              <td><span class="prod-badge-light">{{ getUserName(contract) }}</span></td>
              <td class="text-end fw-semibold">{{ formatCurrency(getCapital(contract)) }}</td>
              <td class="text-end prod-td-prime">{{ formatCurrency(getPrimeTTC(contract)) }}</td>
              <td class="text-center prod-td-muted">{{ formatDate(contract.dateEff) }}</td>
              <td><span class="prod-badge-secondary">{{ getNatureCredit(contract) }}</span></td>
            </tr>
          </tbody>
        </table>
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

    const getSelectedAgencyIds = (agenceVal: any): number[] => {
      if (!agenceVal) return [];
      if (Array.isArray(agenceVal)) {
        return agenceVal
          .map((item: any) => (typeof item === 'object' ? (item.id || item.value) : item))
          .filter(Boolean)
          .map(Number);
      }
      if (typeof agenceVal === 'object') {
        const id = agenceVal.id || agenceVal.value;
        return id ? [Number(id)] : [];
      }
      if (typeof agenceVal === 'number') return [agenceVal];
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
        const agenceVal = form.values?.agence;
        let agenceLabel = 'Toutes les agences';
        if (Array.isArray(agenceVal) && agenceVal.length > 0) {
          agenceLabel = agenceVal.map((a: any) => a.label || a.name).join(', ');
        } else if (agenceVal?.label || agenceVal?.name) {
          agenceLabel = agenceVal.label || agenceVal.name;
        }
        return `Période du ${formatDate(startDate)} au ${formatDate(endDate)} - ${agenceLabel}`;
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
          endDate: today,
          natureCredit: []
        };
        if (agenceOptions.value.length === 1) {
          formData.agence = [agenceOptions.value[0]];
        } else {
          formData.agence = [];
        }
        (productionStateForm.value as any).setValues(formData);
      }
    };

    const handlePdfExport = () => {
      if (activeContracts.value.length === 0) return;
      if (hasActivePreview.value) {
        downloadPdfReport();
      } else {
        downloadWeeklyPdfReport();
      }
    };

    const handleExcelExport = () => {
      if (activeContracts.value.length === 0) return;
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
        agence: Yup.mixed().nullable(),
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
        
        // Ajouter les agences si sélectionnées
        const agencyIds = getSelectedAgencyIds(formData.agence);
        if (agencyIds.length === 1) {
          params.idAgency = agencyIds[0].toString();
        } else if (agencyIds.length > 1) {
          params.idAgencies = agencyIds.join(',');
        }

        // Ajouter les natures de crédit si sélectionnées
        const natureIds = getSelectedNatureIds(formData.natureCredit);
        if (natureIds.length === 1) {
          params.idNatureCredit = natureIds[0].toString();
        } else if (natureIds.length > 1) {
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
        
        // Ajouter les agences si sélectionnées
        const agencyIds = getSelectedAgencyIds(formData.agence);
        if (agencyIds.length === 1) {
          params.idAgency = agencyIds[0].toString();
        } else if (agencyIds.length > 1) {
          params.idAgencies = agencyIds.join(',');
        }

        // Ajouter la nature de crédit si elle est sélectionnée
        const natureIds = getSelectedNatureIds(formData.natureCredit);
        if (natureIds.length === 1) {
          params.idNatureCredit = natureIds[0].toString();
        } else if (natureIds.length > 1) {
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

    const fetchPreviewData = async (startDate: string, endDate: string, idAgencies?: number[] | number | null, idNatureCredits?: number[] | null): Promise<void> => {
      try {
        isSubmitting.value = true;
        
        // Ajouter l'utilisateur si ce n'est pas un admin/manager
        const user = authStore.user as any;
        const canViewAll = canViewAllAgencies(user);
        
        // Construire l'URL avec les paramètres de requête
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        if (idAgencies) {
          if (Array.isArray(idAgencies)) {
            if (idAgencies.length === 1) {
              queryParams.append('idAgency', idAgencies[0].toString());
            } else if (idAgencies.length > 1) {
              queryParams.append('idAgencies', idAgencies.join(','));
            }
          } else {
            queryParams.append('idAgency', idAgencies.toString());
          }
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
          const selectedAgencyIds = getSelectedAgencyIds(values.agence);
          await fetchPreviewData(
            values.startDate,
            values.endDate,
            selectedAgencyIds.length > 0 ? selectedAgencyIds : null,
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
        const selectedAgencyIds = getSelectedAgencyIds(formData.agence);
        const generateData: any = {
          startDate: formData.startDate,
          endDate: formData.endDate,
          idNatureCredits: selectedNatureIds.length > 0 ? selectedNatureIds : undefined
        };
        if (selectedAgencyIds.length === 1) {
          generateData.idAgency = selectedAgencyIds[0];
        } else if (selectedAgencyIds.length > 1) {
          generateData.idAgencies = selectedAgencyIds;
        }

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
                formData.agence = [agenceOptions.value[0]];
              } else {
                formData.agence = [];
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
/* ===== PROD PAGE DESIGN SYSTEM ===== */
.prod-page {
  display: flex; flex-direction: column; gap: 20px;
  background: transparent;
  margin-bottom: 25px;
}

/* Header Card */
.prod-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; background: #fff;
  border: 1px solid #e8eaf0; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}
.prod-header-left { display: flex; align-items: center; gap: 14px; }
.prod-header-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(51,176,74,.1); display: flex; align-items: center;
  justify-content: center; font-size: 20px; color: #33b04a;
}
.prod-title { font-size: 17px; font-weight: 700; color: #1a1d2e; margin: 0; }
.prod-subtitle { font-size: 12px; color: #8b90a7; margin: 0; }
.prod-period-badge {
  font-size: 11.5px; font-weight: 600; color: #0d6efd;
  background: rgba(13,110,253,.08); border: 1px solid rgba(13,110,253,.15);
  border-radius: 20px; padding: 5px 12px; display: flex; align-items: center;
}

/* Filter Panel Card */
.prod-filter-panel {
  background: #fff; padding: 22px 24px;
  border: 1px solid #e8eaf0; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}
.prod-filter-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 14px;
}
@media (max-width: 1100px) { .prod-filter-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .prod-filter-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px)  { .prod-filter-grid { grid-template-columns: 1fr; } }
.prod-filter-item { display: flex; flex-direction: column; gap: 5px; }
.prod-label {
  font-size: 11.5px; font-weight: 600; color: #5a607f;
  text-transform: uppercase; letter-spacing: .4px; display: flex; align-items: center;
}
.prod-input {
  height: 38px; border: 1px solid #dde1ed; border-radius: 8px; padding: 0 11px;
  font-size: 13px; color: #1a1d2e; background: #fff;
  transition: border-color .2s, box-shadow .2s; width: 100%; outline: none;
}
.prod-input:focus { border-color: #33b04a; box-shadow: 0 0 0 3px rgba(51,176,74,.1); }
.prod-input[readonly] { background: #f8f9fc; color: #8b90a7; }
.prod-error { font-size: 11px; color: #dc3545; }
.prod-multiselect { font-size: 13px; }
.prod-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(51,176,74,.12); color: #1e7e34;
  border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 600;
}
.prod-tag-remove { cursor: pointer; font-size: 13px; line-height: 1; }
.prod-edit-extras {
  display: flex; gap: 14px; flex-wrap: wrap;
  padding-top: 12px; border-top: 1px dashed #e8eaf0; margin-top: 4px;
}

/* Action Bar */
.prod-action-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px; border-top: 1px solid #f0f1f5; margin-top: 8px;
  flex-wrap: wrap; gap: 8px;
}
.prod-action-left, .prod-action-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.prod-separator { width: 1px; height: 24px; background: #dde1ed; }
.prod-btn {
  display: inline-flex; align-items: center; height: 36px; padding: 0 14px;
  border-radius: 8px; border: none; font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: all .18s ease; white-space: nowrap;
}
.prod-btn:disabled { opacity: .55; cursor: not-allowed; }
.prod-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.12); }
.prod-btn-ghost { background: #f5f6fa; color: #5a607f; border: 1px solid #dde1ed; }
.prod-btn-danger { background: #dc3545; color: #fff; }
.prod-btn-excel  { background: #1d7843; color: #fff; }
.prod-btn-primary { background: #33b04a; color: #fff; }

/* Results Card */
.prod-results {
  background: #fff; padding: 20px 24px 24px;
  border: 1px solid #e8eaf0; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}
.prod-results-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; padding: 0 0 16px;
  border-bottom: 1px solid #f0f1f5; margin-bottom: 18px;
}
.prod-results-title { display: flex; align-items: center; gap: 12px; }
.prod-results-icon {
  width: 38px; height: 38px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; font-size: 17px;
}
.prod-icon--week    { background: rgba(13,110,253,.1); color: #0d6efd; }
.prod-icon--preview { background: rgba(51,176,74,.1);  color: #33b04a; }
.prod-results-label { font-size: 14px; font-weight: 700; color: #1a1d2e; }
.prod-results-period { font-size: 11.5px; color: #8b90a7; }

/* KPI chips */
.prod-kpi-row { display: flex; gap: 10px; flex-wrap: wrap; }
.prod-kpi {
  display: flex; align-items: center; gap: 8px;
  background: #f8f9fc; border: 1px solid #e8eaf0;
  border-radius: 10px; padding: 7px 12px;
}
.prod-kpi-icon {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.prod-kpi--contracts { background: rgba(25,135,84,.12); color: #198754; }
.prod-kpi--capital   { background: rgba(51,176,74,.12);  color: #33b04a; }
.prod-kpi--prime     { background: rgba(13,110,253,.1);  color: #0d6efd; }
.prod-kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #8b90a7; }
.prod-kpi-value { font-size: 13.5px; font-weight: 700; color: #1a1d2e; line-height: 1.2; }
.prod-kpi-success { color: #198754; }
.prod-kpi-nowrap { white-space: nowrap; }

/* Skeleton */
.prod-skeleton-wrap { background: #fff; border-radius: 10px; border: 1px solid #e8eaf0; overflow: hidden; }
.prod-skeleton-row {
  display: flex; gap: 20px; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid #f0f1f5;
}
.prod-skeleton-row:last-child { border-bottom: none; }
.prod-sk {
  height: 13px; border-radius: 6px;
  background: linear-gradient(90deg, #eef0f5 25%, #f8f9fc 50%, #eef0f5 75%);
  background-size: 400% 100%; animation: sk-shimmer 1.4s ease infinite; flex-shrink: 0;
}
@keyframes sk-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

/* Table */
.prod-table-wrap {
  background: #fff; border: 1px solid #e8eaf0;
  border-radius: 10px; overflow: auto;
  max-height: 520px;
}
.prod-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.prod-table thead tr { background: #f8f9fc; position: sticky; top: 0; z-index: 2; }
.prod-table th {
  padding: 11px 14px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .4px; color: #8b90a7;
  border-bottom: 1px solid #e8eaf0; white-space: nowrap;
}
.prod-table tbody tr { border-bottom: 1px solid #f0f1f5; transition: background .12s; }
.prod-table tbody tr:last-child { border-bottom: none; }
.prod-table tbody tr:hover { background: #f8f9fc; }
.prod-table td { padding: 11px 14px; color: #3a3f5c; vertical-align: middle; }
.prod-td-code   { font-weight: 700; color: #33b04a; font-family: monospace; }
.prod-td-client { font-weight: 600; color: #1a1d2e; }
.prod-td-muted  { color: #8b90a7; font-size: 12px; }
.prod-td-prime  { font-weight: 700; color: #198754; }
.prod-badge-light {
  background: #f5f6fa; color: #5a607f; border: 1px solid #dde1ed;
  border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 600;
}
.prod-badge-secondary {
  background: rgba(13,110,253,.07); color: #0d6efd; border: 1px solid rgba(13,110,253,.15);
  border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 600;
}

/* Empty */
.prod-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px;
  background: #fff; border-radius: 10px; border: 1px solid #e8eaf0;
}

/* Responsive */
@media (max-width: 768px) {
  .prod-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .prod-kpi-row { display: none; }
  .prod-action-bar { flex-direction: column; align-items: stretch; }
  .prod-action-right { justify-content: flex-end; }
}
</style>