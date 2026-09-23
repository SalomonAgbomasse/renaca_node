<!-- CotationModal.vue -->
<template>
  <Modal
    :is-visible="visible"
    :title="`Faire une cotation - ${clientData?.lastname} ${clientData?.firstname}`"
    icon="flaticon-calculator"
    size="xlarge"
    @close="closeModal"
    @update:is-visible="$emit('update:visible', $event)"
  >
    <Form 
      ref="cotationFormRef" 
      :validation-schema="cotationSchema" 
      :initial-values="cotationForm"
      @submit="handleCotationSubmit"
      class="cotation-modal-content"
    >
      <!-- Message d'erreur de validation -->
      <div v-if="modalValidationError" class="alert alert-danger mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ modalValidationError }}
      </div>

      <!-- Message d'alerte pour l'âge invalide -->
      <div v-if="!isAgeValid" class="alert alert-warning mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Attention :</strong> L'âge du client doit être compris entre 18 et 70 ans pour effectuer une cotation.
        <span v-if="clientAge > 0">Âge actuel : {{ clientAge }} ans.</span>
      </div>

      <!-- Sélecteur Nature de Crédit -->
      <div class="mb-4">
        <label class="d-block text-black fw-semibold mb-2">Nature de crédit <span class="text-danger">*</span></label>
        <div v-if="loadingNatureCredits" class="text-center py-2">
          <div class="spinner-border spinner-border-sm text-success me-2"></div>
          <small class="text-muted">Chargement...</small>
        </div>
        <div v-else class="modern-tabs">
          <div
            v-for="nc in natureCredits"
            :key="nc.id"
            class="tab-item"
            :class="{ active: creditType === nc.code || creditType === (nc.code || '').toUpperCase() }"
            @click="selectCreditType(nc.code)"
          >
            <div class="tab-icon">
              <i v-if="(nc.code||'').toUpperCase()==='AMORT'" class="fas fa-chart-line"></i>
              <i v-else class="fas fa-file-invoice-dollar"></i>
            </div>
            <div class="tab-label">
              <span class="full-label">{{ nc.libelle }}</span>
              <span class="short-label">{{ nc.code }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Champs conditionnels selon la nature de crédit -->
      <div class="row mb-3">

        <!-- AMORT/CONST : champs complets -->
        <!-- Capital -->
        <div class="col-md-6">
          <div class="form-group mb-15 mb-sm-20 mb-md-25">
            <label class="d-block text-black fw-semibold mb-10">Capital (FCFA) <span class="text-danger">*</span></label>
            <Field
              name="capital"
              v-model="cotationForm.capital"
              type="number"
              class="form-control shadow-none fs-md-15 text-black"
              :min="1" :max="capitalMaxForType" :disabled="!isAgeValid"
              required @input="handleCapitalChange" @blur="handleCapitalChange"
            />
            <ErrorMessage name="capital" class="text-danger"/>
            <small class="form-text text-muted"><i class="fas fa-info-circle me-1"></i>Capital maximum : {{ capitalMaxForType.toLocaleString('fr-FR') }} FCFA</small>
          </div>
        </div>

        <!-- Durée -->
        <div class="col-md-6">
          <div class="form-group mb-15 mb-sm-20 mb-md-25">
            <label class="d-block text-black fw-semibold mb-10">Durée (en mois) <span class="text-danger">*</span></label>
            <Field
              name="duration"
              v-model="cotationForm.duration"
              type="number"
              class="form-control shadow-none fs-md-15 text-black"
              :min="1" :max="getMaxDuration()" :disabled="!isAgeValid"
              required @input="handleDurationChange" @blur="handleDurationChange"
            />
            <ErrorMessage name="duration" class="text-danger"/>
            <small class="form-text text-muted"><i class="fas fa-info-circle me-1"></i>Durée max : {{ getMaxDuration() }} mois</small>
          </div>
        </div>

        <!-- Périodicité -->
        <div class="col-md-6">
          <div class="form-group mb-15 mb-sm-20 mb-md-25">
            <label class="d-block text-black fw-semibold mb-10">Périodicité <span class="text-danger">*</span></label>
            <Field name="idPeriodicite" v-model="cotationForm.idPeriodicite" as="select" class="form-control shadow-none fs-md-15 text-black" :disabled="loadingPeriodicites || !isAgeValid" required>
              <option value="">Sélectionner...</option>
              <option v-for="p in periodicites" :key="p.id" :value="p.id">{{ p.libelle }}</option>
            </Field>
            <ErrorMessage name="idPeriodicite" class="text-danger"/>
            <small class="form-text text-muted"><i class="fas fa-info-circle me-1"></i>{{ loadingPeriodicites ? 'Chargement...' : 'Sélectionnez la périodicité' }}</small>
          </div>
        </div>

        <!-- Perte d'Emploi (Amortissable uniquement) -->
        <div class="col-md-6" v-if="isAmortMode">
          <div class="form-group mb-15 mb-sm-20 mb-md-25">
            <label class="d-block text-black fw-semibold mb-10">Perte d'Emploi <span class="text-danger">*</span></label>
            <div class="d-flex gap-3">
              <label class="d-flex align-items-center gap-2">
                <Field name="perteEmploi" type="radio" value="OUI" v-model="cotationForm.perteEmploi" v-slot="{ field }">
                  <input type="radio" v-bind="field" value="OUI" :disabled="!isAgeValid" />
                </Field>
                OUI
              </label>
              <label class="d-flex align-items-center gap-2">
                <Field name="perteEmploi" type="radio" value="NON" v-model="cotationForm.perteEmploi" v-slot="{ field }">
                  <input type="radio" v-bind="field" value="NON" :disabled="!isAgeValid" />
                </Field>
                NON
              </label>
            </div>
            <ErrorMessage name="perteEmploi" class="text-danger"/>
          </div>
        </div>

      </div>

      <!-- Résumé client (non modifiable) -->
      <div class="client-info-card mb-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="fas fa-user-circle text-muted"></i>
          <span class="fw-semibold text-muted text-uppercase" style="font-size:0.72rem;letter-spacing:0.06em;">Informations client</span>
          <i class="fas fa-lock text-muted ms-1" style="font-size:0.65rem;" title="Non modifiable"></i>
        </div>
        <div class="row g-2">
          <div class="col-md-3 col-6">
            <div class="info-chip">
              <span class="info-chip-label">Nom</span>
              <span class="info-chip-value">{{ clientData?.lastname || '—' }}</span>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="info-chip">
              <span class="info-chip-label">Prénom</span>
              <span class="info-chip-value">{{ clientData?.firstname || '—' }}</span>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="info-chip">
              <span class="info-chip-label">Né(e) le</span>
              <span class="info-chip-value">{{ formatDate(clientData?.birthdate) || '—' }}</span>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="info-chip">
              <span class="info-chip-label">Âge</span>
              <span class="info-chip-value" :class="isAgeValid ? 'text-success' : 'text-danger'">
                {{ clientAge > 0 ? clientAge + ' ans' : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </Form>

    <!-- Boutons du modal -->
    <div class="modal-buttons mt-3 mb-3">
      <div class="d-flex justify-content-end gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="closeModal"
        >
          <i class="flaticon-cancel me-2"></i>
          Fermer
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="calculatePrimes"
          :disabled="isCalculating || !isFormValid || !isAgeValid"
        >
          <span v-if="isCalculating">
            <i class="spinner-border spinner-border-sm me-2"></i>
            Calcul en cours...
          </span>
          <span v-else>
            <i class="flaticon-calculator me-2"></i>
            Calculer les primes
          </span>
        </button>
      </div>
    </div>

    <!-- Modal des primes calculées -->
    <PrimesCalculatedModal
      :visible="showPrimesModal"
      :primes="calculatedPrimes"
      :show-convert-button="true"
      :client-data="clientData"
      :cotation-data="cotationForm"
      :client-editable="false"
      context="cotation-modal"
      @close="closePrimesModal"
      @convert-cotation-modal="openConvertModal"
      @conversion-success="handleConversionSuccess"
      @update:visible="showPrimesModal = $event"
    />

    <!-- Modal de conversion en contrat -->
    <CotationToContratModal
      :visible="showConvertModal"
      :selected-client="clientData"
      :selected-cotation="cotationData"
      :client-editable="false"
      @conversion-success="handleConversionSuccess"
      @close="closeConvertModal"
      @update:visible="showConvertModal = $event"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success } from '../../utils/utils';
import ApiService from '../../services/ApiService';
import * as Yup from 'yup';
import Modal from '../Common/Modal.vue';
import PrimesCalculatedModal from '../Common/PrimesCalculatedModal.vue';
import CotationToContratModal from '../Common/CotationToContratModal.vue';

export default defineComponent({
  name: 'CotationModal',
  components: {
    Form,
    Field,
    ErrorMessage,
    Modal,
    PrimesCalculatedModal,
    CotationToContratModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    clientData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'cotation-success', 'close'],
  setup(props, { emit }) {
    // Refs
    const cotationFormRef = ref(null);
    const isCalculating = ref(false);
    const modalValidationError = ref('');
    const showPrimesModal = ref(false);
    const showConvertModal = ref(false);
    const calculatedPrimes = ref({
      pd: 0,
      pc: 0,
      surp: 0,
      acc: 0,
      fm: 0,
      puttc: 0
    });
    const cotationData = ref<any>(null);

    // Nature de crédit
    const natureCredits = ref<any[]>([]);
    const loadingNatureCredits = ref(false);
    const creditType = ref('AMORT');
    const selectedNatureCreditId = ref(1); // 1 = AMORTISSABLE par défaut
    const isAmortMode = computed(() => (creditType.value || '').toUpperCase() === 'AMORT');
    const isConstMode = computed(() => (creditType.value || '').toUpperCase() === 'CONST');
    const capitalMaxForType = computed(() => (isConstMode.value ? 20000000 : 10000000));

    // Périodicités
    const periodicites = ref<Array<{id: number, libelle: string, code: string, nombreMois: number}>>([]);
    const loadingPeriodicites = ref(false);

    // Formulaire de cotation
    const cotationForm = ref({
      duration: 12,
      capital: 5000000, // Valeur par défaut : 5M (inférieure au maximum de 10M)
      garantieCompl: 'NON',
      idPeriodicite: null as number | null,
      perteEmploi: 'NON' as string
    });

    // Durée maximale RENACA selon l'âge : min(60, (70 - âge) x 12). Règle unifiée AMORT/CONST.
    const getMaxDuration = (): number => {
      if (!props.clientData?.birthdate) return 60;
      const age = calculateAge(props.clientData.birthdate);
      return Math.min(60, Math.max(0, (70 - age) * 12));
    };

    // Schéma de validation
    const cotationSchema = computed(() => {
      return Yup.object().shape({
        duration: Yup.number()
          .required('La durée est obligatoire')
          .min(1, 'La durée doit être d\'au moins 1 mois')
          .test('max-duration', 'Durée invalide selon l\'âge', function(value) {
            if (!value) return true;
            const maxDuration = getMaxDuration();
            if (maxDuration === 0) return false; // Âge non autorisé
            return value <= maxDuration;
          }),
        capital: Yup.number()
          .required('Le capital est obligatoire')
          .min(1, 'Le capital doit être d\'au moins 1 FCFA')
          .max(capitalMaxForType.value, `Le capital maximum est de ${capitalMaxForType.value.toLocaleString('fr-FR')} FCFA`),
        idPeriodicite: Yup.number()
          .required('La périodicité est obligatoire')
          .min(1, 'Veuillez sélectionner une périodicité'),
        perteEmploi: isAmortMode.value
          ? Yup.string()
              .oneOf(['OUI', 'NON'], "Choix invalide pour Perte d'Emploi")
              .required("Merci d'indiquer si la Perte d'Emploi est souhaitée")
          : Yup.string().nullable().optional()
      });
    });

    // Computed pour vérifier l'âge
    const clientAge = computed(() => {
      if (!props.clientData?.birthdate) return 0;
      return calculateAge(props.clientData.birthdate);
    });

    const isAgeValid = computed(() => {
      const age = clientAge.value;
      return age >= 18 && age < 70;
    });

    // Computed
    const isFormValid = computed(() => {
      if (!isAgeValid.value) return false;

      return !!(cotationForm.value.duration &&
             cotationForm.value.capital &&
             cotationForm.value.idPeriodicite &&
             (!isAmortMode.value || cotationForm.value.perteEmploi === 'OUI' || cotationForm.value.perteEmploi === 'NON'));
    });

    // Méthodes
    const closeModal = () => {
      emit('update:visible', false);
      emit('close');
      resetForm();
    };

    const resetForm = () => {
      creditType.value = 'AMORT';
      selectedNatureCreditId.value = 1;
      cotationForm.value = {
        duration: 12,
        capital: 5000000,
        garantieCompl: 'NON',
        idPeriodicite: null,
        perteEmploi: 'NON'
      };
      modalValidationError.value = '';
      showPrimesModal.value = false;
      calculatedPrimes.value = { pd: 0, pc: 0, surp: 0, acc: 0, fm: 0, puttc: 0 };
    };

    // Sélection d'une nature de crédit
    const selectCreditType = (code: string) => {
      creditType.value = code.toUpperCase();
      // Trouver l'ID correspondant
      const nc = natureCredits.value.find(n => n.code === code || n.code === code.toUpperCase());
      selectedNatureCreditId.value = nc ? nc.id : (code === 'CONST' ? 2 : 1);
      cotationForm.value.capital = Math.min(cotationForm.value.capital || 5000000, capitalMaxForType.value);
      if (!isAmortMode.value) {
        cotationForm.value.perteEmploi = 'NON';
      }
      modalValidationError.value = '';
    };

    // Chargement des natures de crédit
    const loadNatureCredits = async () => {
      try {
        loadingNatureCredits.value = true;
        const response = await ApiService.get('/nature-credits');
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          natureCredits.value = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          natureCredits.value = response.data.data;
        } else {
          natureCredits.value = [
            { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
            { id: 2, libelle: 'CONSTANT', code: 'CONST' }
          ];
        }
        // Filtrer uniquement AMORT, CONST (les seules natures de crédit RENACA)
        natureCredits.value = natureCredits.value.filter((nc: any) =>
          nc.code === 'AMORT' || nc.code === 'CONST'
        );
        // Initialiser l'ID sélectionné
        const current = natureCredits.value.find((n: any) => n.code === creditType.value);
        if (current) selectedNatureCreditId.value = current.id;
      } catch (err: any) {
        console.error('❌ Erreur chargement natures de crédit:', err);
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
          { id: 2, libelle: 'CONSTANT', code: 'CONST' }
        ];
      } finally {
        loadingNatureCredits.value = false;
      }
    };

    // Fonctions supprimées car le type de crédit est fixé

    const handleDurationChange = () => {
      // Vérifier que la durée est un nombre valide
      if (isNaN(cotationForm.value.duration) || cotationForm.value.duration === null || cotationForm.value.duration === undefined) {
        cotationForm.value.duration = 1;
        error('La durée doit être un nombre valide.');
        return;
      }
      
      // Vérifier que la durée n'est pas vide ou négative
      if (cotationForm.value.duration <= 0) {
        cotationForm.value.duration = 1;
        error('La durée doit être d\'au moins 1 mois.');
        return;
      }
      
      const age = calculateAge(props.clientData?.birthdate || '');

      // Vérifier l'âge d'abord
      if (age < 18 || age >= 70) {
        cotationForm.value.duration = 0;
        error(`L'âge du client doit être compris entre 18 et 70 ans pour effectuer une cotation.`);
        return;
      }

      // Durée maximale selon l'âge
      const maxDuration = getMaxDuration();

      if (maxDuration === 0) {
        cotationForm.value.duration = 0;
        error(`L'âge du client doit être compris entre 18 et 70 ans pour effectuer une cotation.`);
        return;
      }

      if (cotationForm.value.duration > maxDuration) {
        cotationForm.value.duration = maxDuration;
        error(`Pour un client de ${age} ans, la durée est limitée à ${maxDuration} mois maximum. Valeur ajustée à ${maxDuration} mois.`);
      }
      checkFormValidity();
    };

    const calculateAge = (birthdate: string): number => {
      if (!birthdate) return 0;
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const handleCapitalChange = () => {
      // Vérifier que le capital est un nombre valide
      if (isNaN(cotationForm.value.capital) || cotationForm.value.capital === null || cotationForm.value.capital === undefined) {
        cotationForm.value.capital = 0;
        error('Le capital doit être un nombre valide.');
        return;
      }

      // Vérifier que le capital n'est pas vide ou négatif
      if (cotationForm.value.capital <= 0) {
        cotationForm.value.capital = 1;
        error('Le capital doit être supérieur à 0 FCFA.');
        return;
      }

      const maxCapital = capitalMaxForType.value;
      const age = calculateAge(props.clientData?.birthdate || '');

      if (age < 18 || age >= 70) {
        cotationForm.value.capital = 0;
        error(`L'âge du client doit être compris entre 18 et 70 ans pour effectuer une cotation.`);
        return;
      }

      if (cotationForm.value.capital > maxCapital) {
        cotationForm.value.capital = maxCapital;
        error(`Le capital maximum est de ${maxCapital.toLocaleString('fr-FR')} FCFA. Valeur ajustée à ${maxCapital.toLocaleString('fr-FR')} FCFA.`);
      }
      checkFormValidity();
    };


    const checkFormValidity = () => {
      // Cette fonction peut être étendue pour des validations en temps réel
    };

    const loadPeriodicites = async () => {
      try {
        loadingPeriodicites.value = true;
        
        const response = await ApiService.get('/periodicite');
        
        // Structure: { code: 200, message: "...", data: { message: "...", data: [...] } }
        if (response.data && response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          periodicites.value = response.data.data.data.filter((p: any) => p.isActive);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          periodicites.value = response.data.data.filter((p: any) => p.isActive);
        } else if (response.data && response.data.data && response.data.data.periodicites) {
          periodicites.value = response.data.data.periodicites.filter((p: any) => p.isActive);
        } else {
          console.warn('⚠️ Structure de réponse inattendue pour périodicités, utilisation des valeurs par défaut');
          // Fallback avec les valeurs par défaut
          periodicites.value = [
            { id: 1, libelle: 'Mensuelle', code: '1', nombreMois: 1 },
            { id: 2, libelle: 'Bimestrielle', code: '2', nombreMois: 2 },
            { id: 3, libelle: 'Trimestrielle', code: '3', nombreMois: 3 },
            { id: 4, libelle: 'Quadrimestrielle', code: '4', nombreMois: 4 },
            { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
            { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
            { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
          ];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des périodicités:', err);
        // Fallback avec les valeurs par défaut
        periodicites.value = [
          { id: 1, libelle: 'Mensuelle', code: '1', nombreMois: 1 },
          { id: 2, libelle: 'Bimestrielle', code: '2', nombreMois: 2 },
          { id: 3, libelle: 'Trimestrielle', code: '3', nombreMois: 3 },
          { id: 4, libelle: 'Quadrimestrielle', code: '4', nombreMois: 4 },
          { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
          { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
          { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
        ];
        error('Erreur lors du chargement des périodicités. Valeurs par défaut utilisées.');
      } finally {
        loadingPeriodicites.value = false;
      }
    };

    const calculatePrimes = async () => {
      if (isCalculating.value) {
        return;
      }

      try {
        isCalculating.value = true;
        modalValidationError.value = '';

        // Vérifier que le formulaire est valide
        if (!isFormValid.value) {
          error('Veuillez remplir tous les champs obligatoires');
          return;
        }

        // Vérifier que la date de naissance est disponible
        if (!props.clientData?.birthdate) {
          error('Date de naissance du client manquante. Impossible de calculer les primes.');
          return;
        }

        // Vérifier l'âge du client
        const age = calculateAge(props.clientData.birthdate);
        if (age < 18 || age >= 70) {
          error(`L'âge du client (${age} ans) doit être compris entre 18 et 70 ans pour effectuer une cotation.`);
          return;
        }

        // Préparer les données pour le calcul (aperçu uniquement, aucune persistance)
        const calculationData: any = {
          idNatureCredit: selectedNatureCreditId.value,
          capital: cotationForm.value.capital,
          birthdate: props.clientData.birthdate,
          duration: cotationForm.value.duration,
          perteEmploi: isAmortMode.value && cotationForm.value.perteEmploi === 'OUI',
          tauxSurprime: 0
        };

        const response = await ApiService.post('/cotations/renaca/calculate', calculationData);

        // Parsing repris de CotationToContratModal.vue (recalculatePrimes) : le contrôleur
        // renvoie { code, message, error, data: primeData }, lui-même enveloppé par
        // l'intercepteur → response.data.data.data en succès, response.data.data.error
        // (sans triple imbrication) sur les erreurs de validation renvoyées avant appel
        // du moteur de calcul.
        let primesData: any = null;
        if (response.data && response.data.data) {
          if (response.data.data.data && typeof response.data.data.data === 'object') {
            primesData = response.data.data.data;
          } else if ((response.data.data as any).pd !== undefined || (response.data.data as any).puttc !== undefined) {
            primesData = response.data.data;
          }
        }

        if (primesData && !response.data.data?.error) {
          calculatedPrimes.value = {
            pd: Number(primesData.pd) || 0,
            pc: Number(primesData.primePE) || 0,
            surp: Number(primesData.surp) || 0,
            acc: Number(primesData.acc) || 0,
            fm: 0,
            puttc: Number(primesData.puttc) || 0
          };
          showPrimesModal.value = true;
        } else {
          const errorMessage = response.data?.message || (response.data?.data as any)?.message || 'Erreur lors du calcul des primes';
          modalValidationError.value = errorMessage;
          error(errorMessage);
        }
      } catch (error: any) {
        console.error('❌ Erreur lors du calcul des primes:', error);
        
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Erreur lors du calcul des primes. Veuillez vérifier les données saisies.';
        
        modalValidationError.value = errorMessage;
        error(errorMessage);
      } finally {
        isCalculating.value = false;
      }
    };

    const closePrimesModal = () => {
      showPrimesModal.value = false;
    };

    const handleConversionSuccess = (contract: any) => {
      // success('Contrat créé avec succès depuis la cotation'); // Supprimé pour éviter de fermer le modal
      showPrimesModal.value = false;
      // Ne pas fermer le modal de conversion automatiquement
      // showConvertModal.value = false;
      // Ne pas émettre cotation-success pour éviter de rouvrir le modal des primes
      // emit('cotation-success', contract);
    };

    const openConvertModal = (primes: any) => {
      
      // Stocker les données de cotation
      cotationData.value = {
        ...cotationForm.value,
        creditType: creditType.value,
        idNatureCredit: selectedNatureCreditId.value,
        garantieCompl: (isAmortMode.value && cotationForm.value.perteEmploi === 'OUI') ? 'OUI' : 'NON',
        pd: calculatedPrimes.value.pd,
        pc: calculatedPrimes.value.pc,
        surp: calculatedPrimes.value.surp,
        acc: calculatedPrimes.value.acc,
        fm: calculatedPrimes.value.fm,
        puttc: calculatedPrimes.value.puttc
      };
      
      
      // Fermer le modal des primes
      showPrimesModal.value = false;
      
      // Attendre un petit délai pour s'assurer que le modal des primes se ferme
      setTimeout(() => {
        // Ouvrir le modal de conversion avec les données du client
        showConvertModal.value = true;
      }, 100);
    };

    const closeConvertModal = () => {
      showConvertModal.value = false;
    };

    const handleCotationSubmit = async (values: any) => {
      // Cette fonction peut être utilisée si nécessaire
    };

    // Fonction de formatage de date
    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) return '';
      try {
        // Si c'est au format YYYY-MM-DD, le convertir en DD/MM/YYYY
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        // Si c'est déjà au format DD/MM/YYYY, le retourner tel quel
        if (dateString.includes('/')) {
          return dateString;
        }
        // Sinon, essayer de le convertir depuis ISO
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    };

    // Watcher pour charger les données quand le modal s'ouvre
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        loadPeriodicites();
        loadNatureCredits();
        resetForm();
      }
    });

    // Lifecycle
    onMounted(() => {
      loadPeriodicites();
      loadNatureCredits();
    });

    return {
      // Refs
      cotationFormRef,
      isCalculating,
      modalValidationError,
      showPrimesModal,
      showConvertModal,
      calculatedPrimes,
      cotationData,
      periodicites,
      loadingPeriodicites,
      cotationForm,
      cotationSchema,
      natureCredits,
      loadingNatureCredits,
      creditType,
      selectedNatureCreditId,

      // Computed
      isFormValid,
      isAmortMode,
      isConstMode,
      capitalMaxForType,

      // Méthodes
      closeModal,
      resetForm,
      selectCreditType,
      loadNatureCredits,
      handleDurationChange,
      handleCapitalChange,
      checkFormValidity,
      loadPeriodicites,
      calculatePrimes,
      closePrimesModal,
      openConvertModal,
      closeConvertModal,
      handleCotationSubmit,
      handleConversionSuccess,
      formatDate,
      calculateAge,
      getMaxDuration,
      clientAge,
      isAgeValid
    };
  }
});
</script>

<style scoped>
/* Segmented Control */
.modern-tabs {
  display: flex;
  background: #f1f3f5;
  border-radius: 12px;
  padding: 6px;
  gap: 8px;
  width: 100%;
}
.modern-tabs .tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6c757d;
  min-width: 0;
}
.modern-tabs .tab-item.active {
  background: #fff;
  color: #33b04a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.modern-tabs .tab-icon { font-size: 1.2rem; margin-bottom: 2px; }
.modern-tabs .tab-label { font-size: 0.85rem; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
.modern-tabs .short-label { display: none; }
@media (max-width: 768px) {
  .modern-tabs .full-label { display: none; }
  .modern-tabs .short-label { display: inline; }
}

.cotation-modal-content {
  min-height: auto;
  padding: 10px 0 0 0;
}

.client-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

/* Styles pour le champ de type de crédit en lecture seule */
.form-control.bg-light {
  background-color: #f8f9fa !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-control {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.btn-primary {
  background-color: #33b04a;
  border-color: #33b04a;
  color: #231f20;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #2d9a41;
  border-color: #2d9a41;
  color: #231f20;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(51, 176, 74, 0.3);
}

.btn-primary:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  border-radius: 0.375rem;
  border: 1px solid transparent;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.text-danger {
  color: #dc3545 !important;
}

.text-muted {
  color: #6c757d !important;
}

.badge {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.badge.bg-primary {
  background-color: #33b04a !important;
  color: #231f20 !important;
}

/* Styles pour les boutons du modal */
.modal-buttons {
  padding: 0.5rem 0;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  margin: 0.5rem -20px -20px -20px;
  padding: 0.5rem 20px;
}

.modal-buttons .btn {
  min-height: 36px;
  font-weight: 500;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .cotation-modal-content {
    min-height: 300px;
    padding: 5px 0;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-control {
    font-size: 14px;
    padding: 0.625rem;
  }

  .form-control.bg-light {
    padding: 0.625rem;
    font-size: 14px;
    min-height: 44px;
  }

  /* Boutons responsive sur mobile */
  .modal-buttons {
    padding: 0.5rem 20px;
    margin: 0.5rem -20px -20px -20px;
  }

  .modal-buttons .btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    min-height: 32px;
  }
}

@media (max-width: 576px) {
  .modal-buttons .btn {
    font-size: 0.75rem;
    padding: 0.4rem 0.6rem;
    min-height: 30px;
  }
}

/* Style pour la fiche d'informations client */
.client-info-card {
  background: #f8f9fa;
  border-left: 4px solid #33b04a;
  border-top: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.info-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  min-height: 54px;
}

.info-chip-label {
  display: block;
  font-size: 0.7rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.info-chip-value {
  display: block;
  font-size: 0.9rem;
  color: #231f20;
  font-weight: 700;
  word-break: break-all;
}
</style>
