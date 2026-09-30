<template>
  <Modal
    :isVisible="visible"
    :title="modalTitle"
    icon="flaticon-settings"
    size="xlarge"
    :closeOnOverlay="false"
    @close="closeModal"
  >
    <template #header-right>
      <div class="modal-header-stepper">
        <div 
          class="header-step-item" 
          :class="{ active: currentStep === 1, completed: currentStep > 1 }"
          @click="goToStep(1)"
          role="button"
          tabindex="0"
          title="Étape 1 : Paramètres"
        >
          <div class="header-step-circle">
            <i v-if="currentStep > 1" class="fas fa-check"></i>
            <span v-else>1</span>
          </div>
          <span class="header-step-text">Paramètres</span>
        </div>

        <div class="header-step-line"></div>

        <div 
          class="header-step-item" 
          :class="{ active: currentStep === totalSteps }"
          @click="goToStep(totalSteps)"
          role="button"
          tabindex="0"
          title="Étape 2 : Récapitulatif"
        >
          <div class="header-step-circle">
            <span>{{ totalSteps }}</span>
          </div>
          <span class="header-step-text">Récapitulatif</span>
        </div>
      </div>
    </template>

    <!-- ============================================================== -->
    <!-- STEP 1: PARAMÈTRES DU CONTRAT SELON NATURE                      -->
    <!-- ============================================================== -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="row g-3">
        <!-- ========================================== -->
        <!-- CAS : AMORTISSABLE ou CONSTANT (RENACA)    -->
        <!-- ========================================== -->
        <template v-if="creditType === 'AMORT' || creditType === 'CONST'">
          <!-- Champ Périodicité caché (défaut Mensuelle = 1) -->
          <input type="hidden" v-model.number="form.idPeriodicite" />

          <!-- Ligne 1 : Nature & Référence -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-credit-card text-secondary me-2"></i>Nature de crédit <span class="text-danger">*</span>
            </label>
            <select v-model.number="form.idNatureCredit" class="form-select" :disabled="loadingNatureCredits" required>
              <option v-for="nc in natureCredits" :key="nc.id" :value="nc.id">
                {{ nc.libelle }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-file-alt text-secondary me-2"></i>Référence Contrat <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              v-model="form.reference"
              class="form-control"
              placeholder="Ex: REF-2024-001"
              required
            />
          </div>

          <!-- Ligne 2 : Capital & Taux -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-coins text-secondary me-2"></i>Capital (FCFA) <span class="text-danger">*</span>
            </label>
            <input
              type="number"
              v-model.number="form.capital"
              class="form-control"
              :min="1"
              :max="maxCapital"
              @blur="validateCapitalField"
              required
            />
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-percentage text-secondary me-2"></i>Taux d'intérêt (%) <span class="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              v-model.number="form.tauxInteret"
              class="form-control"
              required
            />
          </div>

          <!-- Ligne 3 : Durée & Perte d'Emploi -->
          <div :class="creditType === 'AMORT' ? 'col-md-6' : 'col-md-12'">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-clock text-secondary me-2"></i>Durée (mois) <span class="text-danger">*</span>
            </label>
            <input
              type="number"
              v-model.number="form.duration"
              class="form-control"
              :min="minDuration"
              :max="maxDuration"
              @blur="validateDurationField"
              required
            />
          </div>

          <div class="col-md-6" v-if="creditType === 'AMORT'">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-shield-alt text-secondary me-2"></i>Perte d'Emploi <span class="text-danger">*</span>
            </label>
            <div class="d-flex gap-3 mt-2">
              <label class="d-flex align-items-center gap-2">
                <input type="radio" v-model="form.perteEmploi" value="OUI" />
                OUI
              </label>
              <label class="d-flex align-items-center gap-2">
                <input type="radio" v-model="form.perteEmploi" value="NON" />
                NON
              </label>
            </div>
          </div>

          <!-- Ligne 4 : Établissement -->
          <div class="col-md-12">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-building text-secondary me-2"></i>Établissement / Employeur
            </label>
            <input type="text" v-model="form.etablissement" class="form-control" placeholder="Ex: Établissement" />
          </div>

          <!-- Ligne 5 : 3 Dates alignées -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-calendar-check text-secondary me-2"></i>Date d'effet <span class="text-danger">*</span>
            </label>
            <input type="date" v-model="form.dateEffet" class="form-control" required />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-calendar-alt text-secondary me-2"></i>Date de la 1re échéance <span class="text-danger">*</span>
            </label>
            <input type="date" v-model="form.datePremiereEcheance" class="form-control" required />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">
              <i class="fas fa-calendar-day text-secondary me-2"></i>Date d'échéance finale <span class="text-danger">*</span>
              <button
                v-if="dateEcheanceManuallyEdited"
                type="button"
                class="btn btn-sm btn-link p-0 ms-1"
                @click="resetDateEcheanceAuto"
                title="Réinitialiser le calcul automatique"
              >
                <i class="fas fa-sync-alt text-primary"></i>
              </button>
            </label>
            <input
              type="date"
              v-model="form.dateEch1"
              class="form-control"
              @input="handleDateEcheanceManualEdit"
              required
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- LAST STEP: RÉCAPITULATIF & PRIMES RECALCULÉES AUTOMATIQUEMENT   -->
    <!-- ============================================================== -->
    <div v-if="currentStep === totalSteps" class="step-content">
      <div class="row g-3 align-items-stretch">
        <!-- Panel 1 (Gauche): Synthèse des Paramètres du Contrat -->
        <div class="col-lg-6 col-12 d-flex flex-column">
          <div class="card border rounded-3 bg-white shadow-xs h-100 overflow-hidden d-flex flex-column">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                  <i class="fas fa-file-contract fs-13"></i>
                </div>
                <span class="fw-bold text-dark fs-14">Paramètres du contrat</span>
              </div>
              <span class="badge bg-secondary-subtle text-secondary border px-2 py-0.5 fs-11 fw-semibold">Synthèse</span>
            </div>

            <div class="card-body p-3 flex-grow-1">
              <div class="d-flex flex-column gap-2">
                <div 
                  v-for="comp in comparisons" 
                  :key="comp.label"
                  class="p-2 px-2.5 rounded-2 border d-flex justify-content-between align-items-center"
                  :class="comp.changed ? 'bg-warning-subtle border-warning border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'"
                >
                  <div class="d-flex align-items-center gap-2">
                    <span class="text-muted fw-semibold fs-12">{{ comp.label }}</span>
                    <span v-if="comp.changed" class="badge bg-warning text-dark px-1.5 py-0.5 fs-10 fw-bold">
                      <i class="fas fa-pen me-0.5"></i>Modifié
                    </span>
                  </div>

                  <div class="text-end">
                    <div v-if="comp.changed" class="d-flex align-items-center gap-1.5 justify-content-end">
                      <del class="text-danger small fs-12">{{ comp.oldVal }}</del>
                      <i class="fas fa-arrow-right text-success small" style="font-size: 10px;"></i>
                      <span class="fw-bold text-success fs-13">{{ comp.newVal }}</span>
                    </div>
                    <div v-else class="fw-semibold text-dark fs-13">
                      {{ comp.newVal || '-' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel 2 (Droite): Tarification & Carte Spécifique (Bénéficiaires / Membres / Synthèse) -->
        <div class="col-lg-6 col-12 d-flex flex-column gap-3">
          <!-- Carte 1 : Nouvelle Tarification -->
          <div class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                  <i class="fas fa-calculator fs-14"></i>
                </div>
                <span class="fw-bold text-dark fs-15">Nouvelle Tarification</span>
              </div>
              <span v-if="!isRecalculatingPrimes" class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-12 fw-medium">
                <i class="fas fa-check-circle me-1"></i>Recalculé
              </span>
            </div>
            <div class="card-body p-3">
              <!-- Loader pendant le recalcul -->
              <div v-if="isRecalculatingPrimes" class="text-center py-4">
                <div class="spinner-border text-success mb-2" role="status" style="width: 2.2rem; height: 2.2rem;">
                  <span class="visually-hidden">Calcul en cours...</span>
                </div>
                <p class="text-muted small fw-medium mb-0 fs-13">Recalcul automatique des primes...</p>
              </div>

              <!-- Affichage des Primes -->
              <div v-else>
                <!-- Hero Card Prime Unique TTC -->
                <div class="p-3 rounded-3 text-white text-center mb-2.5 shadow-sm position-relative overflow-hidden" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                  <div class="small fw-semibold text-white-50 text-uppercase mb-1" style="font-size: 11px; letter-spacing: 0.5px;">
                    <i class="fas fa-shield-alt me-1"></i> Prime Unique Totale TTC (Recalculée)
                  </div>
                  <div class="fs-2 fw-bold text-white mb-0">
                    {{ primes.puttc.toLocaleString('fr-FR') }} <span class="fs-5 fw-normal text-white-50">FCFA</span>
                  </div>
                </div>

                <!-- Grille détaillée des primes RENACA -->
                <div class="row g-2">
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Prime Décès (PD)</span>
                      <strong class="text-dark fs-15">{{ primes.pd.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Perte d'Emploi (PC)</span>
                      <strong class="text-dark fs-15">{{ primes.pc.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Surprime (SURP)</span>
                      <strong class="text-dark fs-15">{{ primes.surp.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Accessoires (ACC)</span>
                      <strong class="text-dark fs-15">{{ primes.acc.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Frais Médicaux (FM)</span>
                      <strong class="text-dark fs-15">{{ primes.fm.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte 2 : Garantie & Couverture (Amortissable / Constant) -->
          <div class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white flex-grow-1">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                  <i class="fas fa-shield-alt fs-14"></i>
                </div>
                <span class="fw-bold text-dark fs-15">Garantie & Couverture</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-12 fw-medium">
                {{ natureCreditLabel }}
              </span>
            </div>
            <div class="card-body p-3">
              <div class="d-flex flex-column gap-2.5">
                <div class="p-2.5 rounded-2 bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-secondary fs-13 fw-semibold">Capital Initial Assuré</span>
                  <strong class="text-dark fs-15">{{ Number(form.capital).toLocaleString('fr-FR') }} FCFA</strong>
                </div>
                <div class="p-2.5 rounded-2 bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-secondary fs-13 fw-semibold">Durée de couverture</span>
                  <strong class="text-dark fs-15">{{ form.duration }} mois</strong>
                </div>
                <div v-if="creditType === 'AMORT'" class="p-2.5 rounded-2 bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-secondary fs-13 fw-semibold">Perte d'Emploi</span>
                  <strong class="text-dark fs-15">{{ form.perteEmploi }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER ACTIONS -->
    <template #footer>
      <div class="d-flex justify-content-between align-items-center w-100">
        <!-- Bouton Précédent ou Annuler -->
        <button
          v-if="currentStep > 1"
          type="button"
          class="btn btn-outline-secondary"
          @click="prevStep"
        >
          <i class="flaticon-left-arrow-1 me-1"></i> Précédent
        </button>
        <button
          v-else
          type="button"
          class="btn btn-outline-secondary"
          @click="closeModal"
        >
          Annuler
        </button>

        <!-- Bouton Suivant ou Enregistrer -->
        <button
          v-if="currentStep < totalSteps"
          type="button"
          class="btn btn-primary"
          :disabled="!isCurrentStepValid"
          @click="nextStep"
        >
          Suivant <i class="flaticon-right-arrow me-1"></i>
        </button>
        <button
          v-else
          type="button"
          class="btn btn-success"
          :disabled="isSubmitting"
          @click="submitForm"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
          <i v-else class="flaticon-diskette me-1"></i>
          Enregistrer les modifications
        </button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import Modal from '../Common/Modal.vue';
import ApiService from '../../services/ApiService';
import { success, error, calculateDateEcheance } from '../../utils/utils';

export default defineComponent({
  name: 'EditCalculModal',
  components: { Modal },
  props: {
    visible: { type: Boolean, required: true },
    contratDetails: { type: Object, default: () => ({}) },
    natureCredits: { type: Array as () => any[], default: () => [] }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {

    const currentStep = ref(1);
    const isSubmitting = ref(false);
    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    const dateEcheanceManuallyEdited = ref(false);
    const isRecalculatingPrimes = ref(false);
    const primes = ref({ pd: 0, pc: 0, surp: 0, acc: 0, fm: 0, puttc: 0 });

    const natureCredits = computed(() => props.natureCredits);
    const loadingNatureCredits = computed(() => !props.natureCredits || props.natureCredits.length === 0);

    const creditType = computed(() => {
      const selected = props.natureCredits.find(nc => nc.id === form.value.idNatureCredit);
      if (selected) return selected.code;
      return props.contratDetails?.natureCredit?.code || '';
    });

    const natureCreditLabel = computed(() => {
      const selected = props.natureCredits.find(nc => nc.id === form.value.idNatureCredit);
      if (selected) return selected.libelle;
      return props.contratDetails?.natureCredit?.libelle || '';
    });

    const totalSteps = computed(() => 2);

    const modalTitle = computed(() => {
      return 'Modifier le contrat';
    });

    const form = ref({
      reference: '',
      idNatureCredit: 0,
      capital: 0,
      duration: 12,
      idPeriodicite: 0,
      dateEffet: '',
      datePremiereEcheance: '',
      dateEch1: '',
      tauxInteret: 0,
      perteEmploi: 'NON' as string,
      etablissement: ''
    });

    const clientAge = computed(() => {
      const birthdate = props.contratDetails?.customer?.birthdate;
      if (!birthdate) return 0;
      const birthDateObj = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate()) 
        ? age - 1 
        : age;
      return actualAge;
    });

    // Charger les périodicités et liens de parenté
    const loadPeriodicites = async () => {
      loadingPeriodicites.value = true;
      try {
        const response = await ApiService.get('/periodicite');
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          periodicites.value = response.data.data.filter((p: any) => p.isActive);
        } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          periodicites.value = response.data.data.data.filter((p: any) => p.isActive);
        }
      } catch (err) {
        periodicites.value = [
          { id: 1, libelle: 'Mensuelle', code: '1', nombreMois: 1, isActive: true },
          { id: 2, libelle: 'Bimestrielle', code: '2', nombreMois: 2, isActive: true },
          { id: 3, libelle: 'Trimestrielle', code: '3', nombreMois: 3, isActive: true },
          { id: 4, libelle: 'Semestrielle', code: '6', nombreMois: 6, isActive: true },
          { id: 5, libelle: 'Annuelle', code: '12', nombreMois: 12, isActive: true }
        ];
      } finally {
        loadingPeriodicites.value = false;
      }
    };

    onMounted(() => {
      loadPeriodicites();
    });

    // Limites de crédit selon âge
    const getLimits = (natureCode: string, age: number) => {
      return {
        maxCapital: natureCode === 'CONST' ? 20000000 : 10000000,
        maxDuration: Math.min(60, Math.max(0, (70 - age) * 12)),
        minDuration: 1
      };
    };

    const currentLimits = computed(() => {
      return getLimits(creditType.value, clientAge.value);
    });

    const maxCapital = computed(() => currentLimits.value.maxCapital);
    const maxDuration = computed(() => currentLimits.value.maxDuration);
    const minDuration = computed(() => currentLimits.value.minDuration);

    const validateCapitalField = () => {
      if (form.value.capital > maxCapital.value) {
        form.value.capital = maxCapital.value;
      }
    };

    const validateDurationField = () => {
      if (form.value.duration > maxDuration.value) {
        form.value.duration = maxDuration.value;
      }
    };

    // Initialisation
    const initForm = () => {
      currentStep.value = 1;
      dateEcheanceManuallyEdited.value = false;
      const c = props.contratDetails;
      if (!c) return;

      form.value = {
        reference: c.reference || c.refContrat || c.numPolice || '',
        idNatureCredit: c.idNatureCredit || c.natureCredit?.id || 1,
        capital: Number(c.capital) || 0,
        duration: Number(c.duration || c.duree || 12),
        idPeriodicite: Number(c.idPeriodicite || c.periodicite?.id || 1),
        dateEffet: c.dateEff ? c.dateEff.split('T')[0] : '',
        datePremiereEcheance: c.dateEch1 ? c.dateEch1.split('T')[0] : '',
        dateEch1: c.dateEch ? c.dateEch.split('T')[0] : '',
        tauxInteret: c.taux !== undefined ? Number(c.taux) : 0,
        perteEmploi: c.garantieCompl === 'OUI' ? 'OUI' : 'NON',
        etablissement: c.etablissement || ''
      };
    };

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        initForm();
      }
    });

    const isStep1Valid = computed(() => {
      if (!form.value.reference || !form.value.reference.trim()) return false;
      if (!form.value.idNatureCredit || !form.value.capital || !form.value.duration) return false;
      if (!form.value.dateEffet || !form.value.datePremiereEcheance || !form.value.dateEch1) return false;
      if (creditType.value === 'AMORT' && form.value.perteEmploi !== 'OUI' && form.value.perteEmploi !== 'NON') return false;
      return true;
    });

    const isCurrentStepValid = computed(() => {
      if (currentStep.value === 1) return isStep1Valid.value;
      return true;
    });

    const isFormValid = computed(() => isStep1Valid.value);

    const handleDateEcheanceManualEdit = () => {
      dateEcheanceManuallyEdited.value = true;
    };

    const resetDateEcheanceAuto = () => {
      dateEcheanceManuallyEdited.value = false;
      calculateDateEcheanceAuto();
    };

    const calculateDateEcheanceAuto = () => {
      if (dateEcheanceManuallyEdited.value) return;
      if (!form.value.datePremiereEcheance || !form.value.duration || !form.value.idPeriodicite) return;

      const pSelected = periodicites.value.find(p => p.id === form.value.idPeriodicite);
      if (!pSelected || !pSelected.nombreMois) return;

      const calculated = calculateDateEcheance(
        form.value.datePremiereEcheance,
        Number(form.value.duration),
        pSelected.nombreMois,
        0
      );
      if (calculated) {
        form.value.dateEch1 = calculated;
      }
    };

    // Watcher dynamique lors du changement de nature de crédit : recadrer le capital sur la nouvelle limite
    watch(creditType, (newType) => {
      if (newType === 'AMORT' || newType === 'CONST') {
        const limits = getLimits(newType, clientAge.value);
        if (!form.value.capital) {
          form.value.capital = Math.min(1000000, limits.maxCapital);
        } else if (form.value.capital > limits.maxCapital) {
          form.value.capital = limits.maxCapital;
        }
        if (!form.value.idPeriodicite) {
          form.value.idPeriodicite = 1;
        }
      }
    });

    const formatDateDisplay = (dateStr: string) => {
      if (!dateStr) return '-';
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    };

    // Comparaisons exhaustives selon la nature de crédit
    const comparisons = computed(() => {
      const c = props.contratDetails;
      if (!c) return [];

      const fields: any[] = [];

      // 1. Nature de crédit
      const oldNature = props.natureCredits.find(nc => nc.id === (c.idNatureCredit || c.natureCredit?.id))?.libelle || c.natureCredit?.libelle || '-';
      const newNature = natureCreditLabel.value || '-';
      fields.push({
        field: 'idNatureCredit',
        label: 'Nature de crédit',
        oldVal: oldNature,
        newVal: newNature,
        changed: (c.idNatureCredit || c.natureCredit?.id) !== form.value.idNatureCredit
      });

      // 2. Référence Contrat
      fields.push({ 
        field: 'reference',
        label: 'Référence Contrat', 
        oldVal: c.reference || c.refContrat || c.numPolice || '-', 
        newVal: form.value.reference || '-', 
        changed: (c.reference || c.refContrat || c.numPolice || '') !== (form.value.reference || '') 
      });

      // 3. Établissement / Employeur
      fields.push({ 
        field: 'etablissement',
        label: 'Établissement / Employeur', 
        oldVal: c.etablissement || '-', 
        newVal: form.value.etablissement || '-', 
        changed: (c.etablissement || '') !== (form.value.etablissement || '') 
      });

      // Capital
      fields.push({
        field: 'capital',
        label: 'Capital',
        oldVal: c.capital ? `${Number(c.capital).toLocaleString('fr-FR')} FCFA` : '-',
        newVal: `${Number(form.value.capital).toLocaleString('fr-FR')} FCFA`,
        changed: Number(c.capital) !== Number(form.value.capital)
      });

      // Taux d'intérêt
      fields.push({
        field: 'tauxInteret',
        label: 'Taux d\'intérêt',
        oldVal: c.taux !== undefined && c.taux !== null ? `${c.taux} %` : '-',
        newVal: `${form.value.tauxInteret} %`,
        changed: Number(c.taux !== undefined && c.taux !== null ? c.taux : 0) !== Number(form.value.tauxInteret)
      });

      // Périodicité
      const oldPeriodLabel = periodicites.value.find(p => p.id === (c.idPeriodicite || c.periodicite?.id))?.libelle || c.periodicite?.libelle || '-';
      const newPeriodLabel = periodicites.value.find(p => p.id === form.value.idPeriodicite)?.libelle || '-';
      fields.push({
        field: 'idPeriodicite',
        label: 'Périodicité',
        oldVal: oldPeriodLabel,
        newVal: newPeriodLabel,
        changed: (c.idPeriodicite || c.periodicite?.id) !== form.value.idPeriodicite
      });

      // Durée
      fields.push({
        field: 'duration',
        label: 'Durée',
        oldVal: c.duration || c.duree ? `${c.duration || c.duree} mois` : '-',
        newVal: `${form.value.duration} mois`,
        changed: Number(c.duration || c.duree) !== Number(form.value.duration)
      });

      // Perte d'Emploi (Amortissable uniquement)
      if (creditType.value === 'AMORT') {
        const oldPerteEmploi = c.garantieCompl === 'OUI' ? 'OUI' : 'NON';
        fields.push({
          field: 'perteEmploi',
          label: 'Perte d\'Emploi',
          oldVal: oldPerteEmploi,
          newVal: form.value.perteEmploi,
          changed: oldPerteEmploi !== form.value.perteEmploi
        });
      }

      // Dates (communes à toutes les natures)
      fields.push({ 
        field: 'dateEffet',
        label: 'Date d\'effet', 
        oldVal: formatDateDisplay(c.dateEff), 
        newVal: formatDateDisplay(form.value.dateEffet), 
        changed: c.dateEff?.split('T')[0] !== form.value.dateEffet 
      });

      fields.push({ 
        field: 'datePremiereEcheance',
        label: 'Date de la 1re échéance', 
        oldVal: formatDateDisplay(c.dateEch1), 
        newVal: formatDateDisplay(form.value.datePremiereEcheance), 
        changed: c.dateEch1?.split('T')[0] !== form.value.datePremiereEcheance 
      });

      fields.push({ 
        field: 'dateEch',
        label: 'Date d\'échéance finale', 
        oldVal: formatDateDisplay(c.dateEch), 
        newVal: formatDateDisplay(form.value.dateEch1), 
        changed: c.dateEch?.split('T')[0] !== form.value.dateEch1 
      });

      return fields;
    });

    // Recalcul automatique des primes par le système
    const recalculatePrimes = async () => {
      try {
        isRecalculatingPrimes.value = true;
        const birthdate = props.contratDetails?.customer?.birthdate;

        const recalculationData: any = {
          idNatureCredit: form.value.idNatureCredit,
          capital: Number(form.value.capital),
          birthdate: birthdate,
          duration: Number(form.value.duration),
          perteEmploi: creditType.value === 'AMORT' && form.value.perteEmploi === 'OUI',
          tauxSurprime: (props.contratDetails as any)?.tauxSurprime || 0
        };

        const response = await ApiService.post('/cotations/renaca/calculate', recalculationData);
        let primesData: any = null;
        if (response.data?.data?.data && typeof response.data.data.data === 'object') {
          primesData = response.data.data.data;
        } else if (response.data?.data?.pd !== undefined || response.data?.data?.puttc !== undefined) {
          primesData = response.data.data;
        }
        if (primesData && !response.data?.data?.error) {
          primes.value = {
            pd: Number(primesData.pd) || 0,
            pc: Number(primesData.primePE) || 0,
            surp: Number(primesData.surp) || 0,
            acc: Number(primesData.acc) || 0,
            fm: 0,
            puttc: Number(primesData.puttc) || 0
          };
        }
      } catch (err: any) {
        console.error('Erreur recalcul primes:', err);
      } finally {
        isRecalculatingPrimes.value = false;
      }
    };

    const nextStep = () => {
      if (currentStep.value < totalSteps.value && isCurrentStepValid.value) {
        currentStep.value++;
        if (currentStep.value === totalSteps.value) {
          recalculatePrimes();
        }
      }
    };

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const goToStep = (step: number) => {
      if (step > currentStep.value && !isCurrentStepValid.value) return;
      currentStep.value = step;
      if (step === totalSteps.value) {
        recalculatePrimes();
      }
    };

    const closeModal = () => {
      emit('close');
    };

    const submitForm = async () => {
      if (!props.contratDetails?.id || !isFormValid.value) return;
      isSubmitting.value = true;
      try {
        const c = props.contratDetails;
        const payload: any = {
          reference: form.value.reference,
          idNatureCredit: form.value.idNatureCredit,
          capital: form.value.capital,
          duration: form.value.duration,
          idPeriodicite: form.value.idPeriodicite,
          dateEff: form.value.dateEffet,
          dateEch1: form.value.datePremiereEcheance,
          dateEch: form.value.dateEch1,
          taux: form.value.tauxInteret,
          etablissement: form.value.etablissement,
          perteEmploi: creditType.value === 'AMORT' && form.value.perteEmploi === 'OUI',
          // Primes recalculées par le système
          pd: primes.value.pd || undefined,
          pc: primes.value.pc || undefined,
          surp: primes.value.surp || undefined,
          acc: primes.value.acc || undefined,
          fm: primes.value.fm || undefined,
          puttc: primes.value.puttc || undefined,
        };

        const res = await ApiService.put(`/contracts/${c.id}`, payload);
        success(res?.data?.message || 'Contrat mis à jour avec succès avec les nouvelles primes calculées !');
        emit('saved');
        closeModal();
      } catch (err: any) {
        console.error('Erreur modification contrat:', err);
        error(err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour');
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      currentStep,
      totalSteps,
      modalTitle,
      isSubmitting,
      loadingPeriodicites,
      loadingNatureCredits,
      periodicites,
      natureCredits,
      creditType,
      natureCreditLabel,
      clientAge,
      maxCapital,
      maxDuration,
      minDuration,
      form,
      isCurrentStepValid,
      isFormValid,
      comparisons,
      primes,
      isRecalculatingPrimes,
      dateEcheanceManuallyEdited,
      formatDateDisplay,
      handleDateEcheanceManualEdit,
      resetDateEcheanceAuto,
      validateCapitalField,
      validateDurationField,
      nextStep,
      prevStep,
      goToStep,
      closeModal,
      submitForm
    };
  }
});
</script>

<style scoped>
.stepper-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 2;
  flex: 1;
}
.step-counter {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #cbd5e1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 5px;
  transition: all 0.3s;
}
.stepper-item.active .step-counter {
  background: #33b04a;
  box-shadow: 0 0 8px rgba(51, 176, 74, 0.4);
}
.stepper-item.completed .step-counter {
  background: #198754;
}
.step-name {
  font-size: 11px;
  font-weight: bold;
  color: #64748b;
}
.stepper-item.active .step-name {
  color: #33b04a;
}
.stepper-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin-top: -15px;
}
.step-content {
  min-height: 280px;
  padding-bottom: 15px;
}
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
.cursor-pointer {
  cursor: pointer;
}
.card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Force clean, modern typography for text elements, preserving font icons */
.step-content, .card, input, select, button, table {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

:deep(i.fa), :deep(i.fas), :deep(i.far), :deep(i.fab), :deep([class*="fa-"]) {
  font-family: "Font Awesome 6 Free", "FontAwesome" !important;
  font-style: normal;
}

:deep([class*="flaticon-"]) {
  font-family: flaticon !important;
  font-style: normal;
}
</style>
