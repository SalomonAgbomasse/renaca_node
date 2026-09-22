<template>
  <Modal
    :isVisible="visible"
    :title="modalTitle"
    icon="flaticon-settings"
    size="xlarge"
    :closeOnOverlay="false"
    @close="closeModal"
  >
    <!-- STEPPER HEADER -->
    <div class="stepper-wrapper mb-4 px-2">
      <!-- Step 1: Paramètres -->
      <div 
        class="stepper-item" 
        :class="{ active: currentStep === 1, completed: currentStep > 1 }"
        @click="goToStep(1)"
      >
        <div class="step-counter">
          <i v-if="currentStep > 1" class="flaticon-check"></i>
          <span v-else>1</span>
        </div>
        <div class="step-name">1. Paramètres</div>
      </div>

      <div class="stepper-line"></div>

      <!-- Last Step: Récapitulatif & Saisie Manuelle des Primes -->
      <div 
        class="stepper-item" 
        :class="{ active: currentStep === totalSteps }"
        @click="goToStep(totalSteps)"
      >
        <div class="step-counter">{{ totalSteps }}</div>
        <div class="step-name">{{ totalSteps }}. Récapitulatif & Primes</div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- STEP 1: PARAMÈTRES DU CONTRAT SELON NATURE                      -->
    <!-- ============================================================== -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="row g-3">
        <!-- ========================================== -->
        <!-- CAS : AMORTISSABLE ou CONSTANT (RENACA)    -->
        <!-- ========================================== -->
        <template v-if="creditType === 'AMORT' || creditType === 'CONST'">
          <!-- Ligne 1 : Nature & Référence -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Nature de crédit <span class="text-danger">*</span></label>
            <select v-model.number="form.idNatureCredit" class="form-select" :disabled="loadingNatureCredits" required>
              <option v-for="nc in natureCredits" :key="nc.id" :value="nc.id">
                {{ nc.libelle }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Référence Contrat <span class="text-danger">*</span></label>
            <input
              type="text"
              v-model="form.reference"
              class="form-control"
              placeholder="Ex: REF-2024-001"
              required
            />
          </div>

          <!-- Ligne 2 : Capital, Taux, Périodicité -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Capital (FCFA) <span class="text-danger">*</span></label>
            <input
              type="number"
              v-model.number="form.capital"
              class="form-control"
              :min="1"
              :max="maxCapital"
              required
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Taux d'intérêt (%) <span class="text-danger">*</span></label>
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

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Périodicité <span class="text-danger">*</span></label>
            <select
              v-model.number="form.idPeriodicite"
              class="form-select"
              required
              :disabled="loadingPeriodicites"
            >
              <option v-for="p in periodicites" :key="p.id" :value="p.id">
                {{ p.libelle }}
              </option>
            </select>
          </div>

          <!-- Ligne 3 : Durée, Perte d'Emploi, Établissement (Optionnel) -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Durée (mois) <span class="text-danger">*</span></label>
            <input
              type="number"
              v-model.number="form.duration"
              class="form-control"
              :min="minDuration"
              :max="maxDuration"
              required
            />
          </div>

          <div class="col-md-4" v-if="creditType === 'AMORT'">
            <label class="form-label fw-bold small text-muted text-uppercase">Perte d'Emploi <span class="text-danger">*</span></label>
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

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Établissement / Employeur</label>
            <input
              type="text"
              v-model="form.etablissement"
              class="form-control"
              placeholder="Ex: Établissement"
            />
          </div>

          <!-- Ligne 4 : 3 Dates -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input
              type="date"
              v-model="form.dateEffet"
              class="form-control"
              required
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date 1re échéance <span class="text-danger">*</span></label>
            <input
              type="date"
              v-model="form.datePremiereEcheance"
              class="form-control"
              required
            />
          </div>

          <div class="col-md-4">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label fw-bold small text-muted text-uppercase mb-0">Date échéance finale <span class="text-danger">*</span></label>
            </div>
            <input
              type="date"
              v-model="form.dateEch1"
              class="form-control mt-1"
              required
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- LAST STEP: RÉCAPITULATIF & SAISIE MANUELLE DES PRIMES           -->
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

        <!-- Panel 2 (Droite): Tarification Manuelle & Bénéficiaires/Membres -->
        <div class="col-lg-6 col-12 d-flex flex-column gap-3">
          <!-- Carte 1 : Tarification Manuelle -->
          <div class="card border rounded-3 bg-white shadow-xs overflow-hidden">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                  <i class="fas fa-calculator fs-13"></i>
                </div>
                <span class="fw-bold text-dark fs-14">Tarification (Saisie Manuelle Admin)</span>
              </div>
              <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-0.5 fs-11 fw-semibold">
                <i class="fas fa-edit me-1"></i>Saisie Libre
              </span>
            </div>
            
            <div class="card-body p-3">
              <!-- Hero Card Prime Totale TTC (Éditable) -->
              <div class="p-3 rounded-3 text-white mb-3 shadow-xs" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                <div class="d-flex justify-content-between align-items-center mb-1.5">
                  <span class="small text-white text-opacity-80 fw-bold fs-11 text-uppercase" style="letter-spacing: 0.5px;">
                    <i class="fas fa-shield-alt me-1"></i> Prime Unique Totale TTC (PUTTC)
                  </span>
                  <button 
                    type="button" 
                    class="btn btn-xs btn-light bg-white text-success border-0 py-0.5 px-2 fs-11 fw-semibold shadow-xs"
                    @click="recalcSumTotalPuttc"
                    title="Calculer automatiquement la somme des sous-primes saisies"
                  >
                    <i class="fas fa-magic me-1"></i>Sommer sous-primes
                  </button>
                </div>
                <div class="input-group input-group-lg">
                  <input 
                    type="number" 
                    v-model.number="form.puttc" 
                    class="form-control bg-white text-dark border-0 fw-bold text-end fs-18"
                    min="0"
                    step="1"
                    placeholder="0"
                    required
                  />
                  <span class="input-group-text bg-white text-success border-0 fw-bold fs-14">FCFA</span>
                </div>
              </div>

              <!-- Grille des Sous-Primes -->
              <div class="row g-2">
                <!-- Prime Décès (PD) -->
                <div class="col-md-6 col-12">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-heartbeat text-danger me-1"></i>Prime Décès (PD)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      v-model.number="form.pd" 
                      @input="onSubPrimeInput"
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      step="1" 
                    />
                    <span class="input-group-text fs-11 text-muted">FCFA</span>
                  </div>
                </div>

                <!-- Prime Perte Emploi (PC) -->
                <div class="col-md-6 col-12" v-if="creditType === 'AMORT' || form.pc > 0">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-briefcase text-primary me-1"></i>Prime Perte Emploi (PC)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      v-model.number="form.pc" 
                      @input="onSubPrimeInput"
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      step="1" 
                    />
                    <span class="input-group-text fs-11 text-muted">FCFA</span>
                  </div>
                </div>

                <!-- Surprime (SURP) -->
                <div class="col-md-6 col-12">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-plus-circle text-warning me-1"></i>Surprime (SURP)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      v-model.number="form.surp" 
                      @input="onSubPrimeInput"
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      step="1" 
                    />
                    <span class="input-group-text fs-11 text-muted">FCFA</span>
                  </div>
                </div>

                <!-- Frais Médicaux (FM) -->
                <div class="col-md-6 col-12">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-notes-medical text-info me-1"></i>Frais Médicaux (FM)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      v-model.number="form.fm" 
                      @input="onSubPrimeInput"
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      step="1" 
                    />
                    <span class="input-group-text fs-11 text-muted">FCFA</span>
                  </div>
                </div>

                <!-- Accessoires (ACC) -->
                <div class="col-md-6 col-12">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-receipt text-secondary me-1"></i>Accessoires (ACC)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      v-model.number="form.acc" 
                      @input="onSubPrimeInput"
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      step="1" 
                    />
                    <span class="input-group-text fs-11 text-muted">FCFA</span>
                  </div>
                </div>

                <!-- Taux Appliqué (%) -->
                <div class="col-md-6 col-12">
                  <label class="form-label text-muted small fw-semibold mb-1 fs-11 text-uppercase">
                    <i class="fas fa-percentage text-dark me-1"></i>Taux Appliqué (%)
                  </label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="number" 
                      step="0.01"
                      v-model.number="form.tauxInteret" 
                      class="form-control fw-bold text-end fs-13" 
                      min="0" 
                      max="100" 
                    />
                    <span class="input-group-text fs-11 text-muted">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte 2 : Garantie & Couverture (Amortissable / Constant) -->
          <div class="card border rounded-3 bg-white shadow-xs overflow-hidden">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-1.5">
                <i class="fas fa-shield-alt text-primary fs-12"></i>
                <span class="fw-bold text-dark fs-13">Garantie & Couverture</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fs-11 fw-semibold">
                {{ natureCreditLabel }}
              </span>
            </div>
            <div class="card-body p-2.5">
              <div class="d-flex flex-column gap-1.5">
                <div class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-muted fs-12 fw-semibold">Capital Initial Assuré</span>
                  <strong class="text-dark fs-13">{{ Number(form.capital).toLocaleString('fr-FR') }} FCFA</strong>
                </div>
                <div class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-muted fs-12 fw-semibold">Durée de couverture</span>
                  <strong class="text-dark fs-13">{{ form.duration }} mois</strong>
                </div>
                <div v-if="creditType === 'AMORT'" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-muted fs-12 fw-semibold">Perte d'Emploi</span>
                  <strong class="text-dark fs-13">{{ form.perteEmploi }}</strong>
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
          Enregistrer les modifications (Admin)
        </button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import Modal from '../Common/Modal.vue';
import ApiService from '../../services/ApiService';
import { success, error } from '../../utils/utils';

export default defineComponent({
  name: 'AdminEditContractModal',
  components: { Modal },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    contratDetails: {
      type: Object,
      default: () => null
    },
    natureCredits: {
      type: Array as () => any[],
      default: () => []
    }
  },
  emits: ['close', 'update:visible', 'saved'],
  setup(props, { emit }) {
    const currentStep = ref(1);
    const isSubmitting = ref(false);

    // Listes dynamiques
    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    const loadingNatureCredits = ref(false);

    // Formulaire principal
    const form = ref<any>({
      reference: '',
      idNatureCredit: 1,
      capital: 0,
      duration: 12,
      idPeriodicite: 1,
      dateEffet: '',
      datePremiereEcheance: '',
      dateEch1: '',
      tauxInteret: 0,
      perteEmploi: 'NON',
      etablissement: '',
      // Primes éditables manuellement par l'admin
      pd: 0,
      pc: 0,
      surp: 0,
      fm: 0,
      acc: 0,
      puttc: 0
    });

    // Code de la nature actuelle
    const selectedNature = computed(() => {
      if (!props.natureCredits || !props.natureCredits.length) return null;
      return props.natureCredits.find(nc => nc.id === form.value.idNatureCredit);
    });

    const selectedNatureCode = computed(() => {
      return selectedNature.value?.code || 'AMORT';
    });

    const creditType = computed(() => {
      return selectedNatureCode.value === 'CONST' ? 'CONST' : 'AMORT';
    });

    const natureCreditLabel = computed(() => selectedNature.value?.libelle || '-');

    const totalSteps = computed(() => 2);

    const modalTitle = computed(() => {
      const refStr = form.value.reference || props.contratDetails?.reference || '';
      return `Modification Administrative du Contrat ${refStr ? ' - ' + refStr : ''}`;
    });

    const maxCapital = computed(() => 100000000);
    const minDuration = computed(() => 1);
    const maxDuration = computed(() => 360);

    // Initialisation
    const initForm = () => {
      currentStep.value = 1;
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
        etablissement: c.etablissement || '',
        // Primes initialisées avec les montants actuels du contrat
        pd: Number(c.pd || 0),
        pc: Number(c.pc || 0),
        surp: Number(c.surp || 0),
        fm: Number(c.fm || 0),
        acc: Number(c.acc || 0),
        puttc: Number(c.puttc || 0)
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
      return currentStep.value === 1 ? isStep1Valid.value : true;
    });

    // Calcul de la somme des sous-primes pour alimenter PUTTC
    const recalcSumTotalPuttc = () => {
      const pd = Number(form.value.pd || 0);
      const pc = Number(form.value.pc || 0);
      const surp = Number(form.value.surp || 0);
      const fm = Number(form.value.fm || 0);
      const acc = Number(form.value.acc || 0);
      form.value.puttc = pd + pc + surp + fm + acc;
    };

    const onSubPrimeInput = () => {
      recalcSumTotalPuttc();
    };

    const formatDateDisplay = (dateStr: string | null | undefined): string => {
      if (!dateStr) return '-';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('fr-FR');
      } catch {
        return String(dateStr);
      }
    };

    // Comparaisons pour le récapitulatif
    const comparisons = computed(() => {
      const c = props.contratDetails;
      if (!c) return [];

      const currentNc = props.natureCredits.find(nc => nc.id === (c.idNatureCredit || c.natureCredit?.id));
      const newNc = props.natureCredits.find(nc => nc.id === form.value.idNatureCredit);

      const currentPer = periodicites.value.find(p => p.id === (c.idPeriodicite || c.periodicite?.id));
      const newPer = periodicites.value.find(p => p.id === form.value.idPeriodicite);

      const compList = [
        {
          label: 'Nature de crédit',
          oldVal: currentNc?.libelle || c.natureCredit?.libelle || 'Standard',
          newVal: newNc?.libelle || '-',
          changed: currentNc?.id !== newNc?.id
        },
        {
          label: 'Référence contrat',
          oldVal: c.reference || '-',
          newVal: form.value.reference || '-',
          changed: (c.reference || '') !== (form.value.reference || '')
        },
        {
          label: 'Capital garanti',
          oldVal: `${Number(c.capital || 0).toLocaleString('fr-FR')} FCFA`,
          newVal: `${Number(form.value.capital || 0).toLocaleString('fr-FR')} FCFA`,
          changed: Number(c.capital || 0) !== Number(form.value.capital || 0)
        },
        {
          label: 'Durée (mois)',
          oldVal: `${c.duration || c.duree || 0} mois`,
          newVal: `${form.value.duration || 0} mois`,
          changed: Number(c.duration || c.duree || 0) !== Number(form.value.duration || 0)
        },
        {
          label: 'Date d\'effet',
          oldVal: formatDateDisplay(c.dateEff),
          newVal: formatDateDisplay(form.value.dateEffet),
          changed: (c.dateEff ? c.dateEff.split('T')[0] : '') !== form.value.dateEffet
        },
        {
          label: '1re Échéance',
          oldVal: formatDateDisplay(c.dateEch1),
          newVal: formatDateDisplay(form.value.datePremiereEcheance),
          changed: (c.dateEch1 ? c.dateEch1.split('T')[0] : '') !== form.value.datePremiereEcheance
        },
        {
          label: 'Échéance finale',
          oldVal: formatDateDisplay(c.dateEch),
          newVal: formatDateDisplay(form.value.dateEch1),
          changed: (c.dateEch ? c.dateEch.split('T')[0] : '') !== form.value.dateEch1
        }
      ];

      if (creditType.value === 'AMORT' || creditType.value === 'CONST') {
        compList.push({
          label: 'Périodicité',
          oldVal: currentPer?.libelle || c.periodicite?.libelle || 'Mensuelle',
          newVal: newPer?.libelle || 'Mensuelle',
          changed: currentPer?.id !== newPer?.id
        });
        compList.push({
          label: 'Taux d\'intérêt',
          oldVal: `${c.taux || 0}%`,
          newVal: `${form.value.tauxInteret || 0}%`,
          changed: Number(c.taux || 0) !== Number(form.value.tauxInteret || 0)
        });
      }

      if (creditType.value === 'AMORT') {
        const oldPerteEmploi = c.garantieCompl === 'OUI' ? 'OUI' : 'NON';
        compList.push({
          label: 'Perte d\'Emploi',
          oldVal: oldPerteEmploi,
          newVal: form.value.perteEmploi,
          changed: oldPerteEmploi !== form.value.perteEmploi
        });
      }

      return compList;
    });

    // Navigation Stepper
    const nextStep = () => {
      if (currentStep.value < totalSteps.value) {
        currentStep.value++;
      }
    };

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const goToStep = (step: number) => {
      if (step < currentStep.value || isStep1Valid.value) {
        currentStep.value = step;
      }
    };

    const closeModal = () => {
      emit('close');
      emit('update:visible', false);
    };

    // Chargement des données de référence
    const fetchPeriodicites = async () => {
      try {
        loadingPeriodicites.value = true;
        const res = await ApiService.get('/periodicite');
        const list = res.data?.periodicites || res.data?.data?.periodicites || res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          periodicites.value = list.filter((p: any) => p.isActive !== false);
        }
      } catch (err) {
        console.warn('Erreur chargement périodicités:', err);
      } finally {
        loadingPeriodicites.value = false;
      }
    };

    // Soumission du formulaire Admin
    const submitForm = async () => {
      isSubmitting.value = true;
      try {
        const c = props.contratDetails;
        if (!c?.id) {
          throw new Error('Identifiant du contrat introuvable');
        }

        const payload: any = {
          reference: form.value.reference,
          idNatureCredit: form.value.idNatureCredit,
          capital: Number(form.value.capital),
          duration: Number(form.value.duration),
          idPeriodicite: Number(form.value.idPeriodicite),
          dateEff: form.value.dateEffet,
          dateEch1: form.value.datePremiereEcheance,
          dateEch: form.value.dateEch1,
          taux: form.value.tauxInteret,
          etablissement: form.value.etablissement,
          garantieCompl: (creditType.value === 'AMORT' && form.value.perteEmploi === 'OUI') ? 'OUI' : 'NON',
          // Primes saisies manuellement par l'administrateur
          pd: Number(form.value.pd) || 0,
          pc: Number(form.value.pc) || 0,
          surp: Number(form.value.surp) || 0,
          fm: Number(form.value.fm) || 0,
          acc: Number(form.value.acc) || 0,
          puttc: Number(form.value.puttc) || 0
        };

        const targetId = c.id;
        const res = await ApiService.put(`/contracts/admin/${targetId}`, payload);
        success(res?.data?.message || 'Contrat mis à jour avec succès en mode administratif !');
        emit('saved');
        closeModal();
      } catch (err: any) {
        console.error('Erreur modification contrat admin:', err);
        error(err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour');
      } finally {
        isSubmitting.value = false;
      }
    };

    onMounted(() => {
      fetchPeriodicites();
      if (props.visible) {
        initForm();
      }
    });

    return {
      currentStep,
      totalSteps,
      modalTitle,
      isSubmitting,
      loadingPeriodicites,
      loadingNatureCredits,
      periodicites,
      form,
      creditType,
      natureCreditLabel,
      selectedNatureCode,
      maxCapital,
      minDuration,
      maxDuration,
      isCurrentStepValid,
      isStep1Valid,
      comparisons,
      recalcSumTotalPuttc,
      onSubPrimeInput,
      formatDateDisplay,
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
  align-items: center;
  justify-content: space-between;
  position: relative;
  background: #f8fafc;
  padding: 14px 20px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;
}

.step-counter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  transition: all 0.2s ease;
}

.step-name {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  transition: color 0.2s ease;
}

.stepper-item.active .step-counter {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.stepper-item.active .step-name {
  color: #0f172a;
  font-weight: 700;
}

.stepper-item.completed .step-counter {
  background: #ecfdf5;
  border-color: #10b981;
  color: #10b981;
}

.stepper-item.completed .step-name {
  color: #10b981;
}

.stepper-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 12px;
}

.step-content {
  animation: fadeIn 0.25s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.cursor-pointer {
  cursor: pointer;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.fs-10 { font-size: 10px !important; }
.fs-11 { font-size: 11px !important; }
.fs-12 { font-size: 12px !important; }
.fs-13 { font-size: 13px !important; }
.fs-14 { font-size: 14px !important; }
.fs-15 { font-size: 15px !important; }
.fs-16 { font-size: 16px !important; }
.fs-18 { font-size: 18px !important; }
.fs-20 { font-size: 20px !important; }

.btn-xs {
  padding: 2px 8px;
  font-size: 11px;
}

/* Force clean, modern typography for all elements in this modal */
:deep(*), .step-content, .card, input, select, button, table {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}
</style>
