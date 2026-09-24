<!-- HorsConventionModal.vue -->
<template>
  <Modal
    :is-visible="visible"
    :title="`Créer Contrat Hors Convention - ${selectedClient?.lastname || ''} ${selectedClient?.firstname || ''}`"
    icon="fas fa-file-contract"
    size="xlarge"
    @close="closeModal"
    @update:is-visible="$emit('update:visible', $event)"
  >
    <Form
      ref="formRef"
      :validation-schema="validationSchema"
      :initial-values="formModel"
      @submit="handleSubmitForm"
      class="hors-convention-modal-content"
    >
      <!-- Message d'erreur de validation -->
      <div v-if="stepValidationError && !creationSuccess" class="alert alert-danger mb-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ stepValidationError }}
      </div>

      <!-- Étape 1 : Informations du contrat -->
      <div v-if="currentStep === 1 && !creationSuccess" class="form-step">
        <h5 class="mb-3 text-uppercase">
          <i class="fa fa-file-contract me-2"></i>
          Informations du contrat
        </h5>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Nature de crédit <span class="text-danger">*</span></label>
              <Field
                name="contrat.idNatureCredit"
                v-model="formModel.contrat.idNatureCredit"
                as="select"
                class="form-control"
                :disabled="loadingNatureCredits"
                required
              >
                <option value="">
                  {{ loadingNatureCredits ? 'Chargement...' : 'Sélectionner la nature de crédit' }}
                </option>
                <option v-for="nc in natureCredits" :key="nc.id" :value="nc.id">
                  {{ nc.libelle }}
                </option>
              </Field>
              <ErrorMessage name="contrat.idNatureCredit" class="text-danger" />
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Capital <span class="text-danger">*</span></label>
              <Field
                name="contrat.capital"
                v-model="formModel.contrat.capital"
                type="number"
                class="form-control"
                placeholder="Capital"
                :min="1"
                @input="handleCapitalInput"
                required
              />
              <ErrorMessage name="contrat.capital" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Périodicité <span class="text-danger">*</span></label>
              <Field
                name="contrat.idPeriodicite"
                v-model="formModel.contrat.idPeriodicite"
                as="select"
                class="form-control"
                :disabled="loadingPeriodicites"
                required
              >
                <option value="">
                  {{ loadingPeriodicites ? 'Chargement...' : 'Sélectionner la périodicité' }}
                </option>
                <option
                  v-for="periodicite in periodicites"
                  :key="periodicite.id"
                  :value="periodicite.id"
                >
                  {{ periodicite.libelle }}
                </option>
              </Field>
              <ErrorMessage name="contrat.idPeriodicite" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Durée (en mois) <span class="text-danger">*</span></label>
              <Field
                name="contrat.duration"
                v-model="formModel.contrat.duration"
                type="number"
                class="form-control"
                placeholder="Durée en mois"
                :min="1"
                @input="handleDurationInput"
                required
              />
              <ErrorMessage name="contrat.duration" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Taux d'intérêt <span class="text-danger">*</span></label>
              <Field
                name="contrat.tauxInteret"
                v-model="formModel.contrat.tauxInteret"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="form-control"
                :class="{ 'border-warning': Number(formModel.contrat.tauxInteret) === 0 }"
                placeholder="Taux d'intérêt (%)"
                required
                @input="validateTauxInteret"
              />
              <ErrorMessage name="contrat.tauxInteret" class="text-danger" />
              <div v-if="Number(formModel.contrat.tauxInteret) === 0" class="alert alert-warning mt-2 mb-0 py-2">
                <small class="d-flex align-items-center">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  <span><strong>Attention :</strong> Le taux d'intérêt est à 0%. Veuillez vérifier cette valeur.</span>
                </small>
              </div>
            </div>
          </div>
          <div class="col-md-6" v-if="formModel.contrat.idNatureCredit && natureCreditCode === 'AMORT'">
            <label class="form-label fw-bold d-block">Perte d'Emploi <span class="text-danger">*</span></label>
            <div class="d-flex gap-3 mt-2">
              <label class="d-flex align-items-center gap-2">
                <input type="radio" v-model="formModel.contrat.perteEmploi" value="OUI" />
                OUI
              </label>
              <label class="d-flex align-items-center gap-2">
                <input type="radio" v-model="formModel.contrat.perteEmploi" value="NON" />
                NON
              </label>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Date d'effet <span class="text-danger">*</span></label>
              <Field
                name="contrat.dateEffet"
                v-model="formModel.contrat.dateEffet"
                type="date"
                class="form-control"
                :min="todayDate"
                @change="updateDatePremiereEcheance"
                @input="validateDateEffet"
                required
              />
              <ErrorMessage name="contrat.dateEffet" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Date de la 1re échéance <span class="text-danger">*</span></label>
              <Field
                name="contrat.datePremiereEcheance"
                v-model="formModel.contrat.datePremiereEcheance"
                type="date"
                class="form-control"
                :min="formModel.contrat.dateEffet"
                required
                @change="validateDatePremiereEcheance"
              />
              <ErrorMessage name="contrat.datePremiereEcheance" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label class="form-label">
                Date d'échéance <span class="text-danger">*</span>
                <button
                  v-if="dateEcheanceManuallyEdited"
                  type="button"
                  class="btn btn-sm btn-link p-0 ms-2"
                  @click="resetDateEcheanceAuto"
                  title="Réinitialiser le calcul automatique"
                >
                  <i class="fas fa-sync-alt text-primary"></i>
                </button>
              </label>
              <Field
                name="contrat.dateEch1"
                v-model="formModel.contrat.dateEch1"
                type="date"
                class="form-control"
                :min="getMinDateEcheance"
                required
                @input="handleDateEcheanceManualEdit"
                @change="validateDateEcheance"
              />
              <small v-if="!dateEcheanceManuallyEdited" class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Calculée automatiquement
              </small>
              <small v-else class="text-info">
                <i class="fas fa-edit me-1"></i>
                Modifiée manuellement
              </small>
              <ErrorMessage name="contrat.dateEch1" class="text-danger" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Référence dossier</label>
              <Field
                name="contrat.reference"
                v-model="formModel.contrat.reference"
                type="text"
                class="form-control"
                placeholder="Référence dossier (générée automatiquement si vide)"
                @input="handleUppercaseInput($event, 'contrat.reference')"
              />
              <ErrorMessage name="contrat.reference" class="text-danger" />
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Établissement</label>
              <Field
                name="contrat.etablissement"
                v-model="formModel.contrat.etablissement"
                type="text"
                class="form-control"
                placeholder="Établissement"
                @input="handleUppercaseInput($event, 'contrat.etablissement')"
              />
              <ErrorMessage name="contrat.etablissement" class="text-danger" />
            </div>
          </div>
        </div>

        <!-- Première ligne des primes : PD, PC, SURP -->
        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Prime Décès (PD) <span class="text-danger">*</span></label>
              <Field
                name="primes.pd"
                v-model="formModel.primes.pd"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                required
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.pd" class="text-danger" />
            </div>
          </div>

          <div class="col-md-4" v-if="natureCreditCode === 'AMORT'">
            <div class="form-group mb-3">
              <label class="form-label">Prime Complémentaire Perte d'Emploi (PC)</label>
              <Field
                name="primes.pc"
                v-model="formModel.primes.pc"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                :disabled="formModel.contrat.perteEmploi !== 'OUI'"
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.pc" class="text-danger" />
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Surprime (SURP) <span class="text-danger">*</span></label>
              <Field
                name="primes.surp"
                v-model="formModel.primes.surp"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                required
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.surp" class="text-danger" />
            </div>
          </div>
        </div>

        <!-- Deuxième ligne des primes : ACC, FM, PUTTC -->
        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Accessoires (ACC) <span class="text-danger">*</span></label>
              <Field
                name="primes.acc"
                v-model="formModel.primes.acc"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                required
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.acc" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Frais Médicaux (FM) <span class="text-danger">*</span></label>
              <Field
                name="primes.fm"
                v-model="formModel.primes.fm"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                required
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.fm" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Prime Unique TTC (PUTTC) <span class="text-danger">*</span></label>
              <input
                :value="formatNumber(formModel.primes.puttc)"
                type="text"
                class="form-control bg-light"
                readonly
                placeholder="Calculé automatiquement"
              />
              <div class="form-text">
                <i class="fas fa-calculator me-1"></i>
                Somme automatique (PD + PC + SURP + ACC + FM)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Étape 2 : Récapitulatif -->
      <div v-if="currentStep === 2 && !creationSuccess" class="form-step recap-step">
        <h5 class="mb-4 d-flex align-items-center gap-2">
          <i class="fas fa-check-circle text-success fs-4"></i>
          <span class="fw-bold text-dark">Récapitulatif et Validation</span>
        </h5>

        <div class="row">
          <div class="col-md-7">
            <!-- Informations Client (non modifiable, client déjà sélectionné) -->
            <div class="recap-card">
              <div class="recap-card-header">
                <i class="fas fa-user-circle"></i>
                <h5>Informations Client</h5>
              </div>
              <div class="recap-card-body">
                <div class="recap-grid">
                  <div class="recap-item">
                    <span class="recap-label">Nom</span>
                    <span class="recap-value">{{ selectedClient?.lastname || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Prénoms</span>
                    <span class="recap-value">{{ selectedClient?.firstname || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date de naissance</span>
                    <span class="recap-value">{{ formatDate(selectedClient?.birthdate) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Sexe</span>
                    <span class="recap-value">{{ selectedClient?.gender === 'M' ? 'Masculin' : 'Féminin' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Type de client</span>
                    <span class="recap-value">{{ selectedClient?.typeCustomer?.libelle || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Adresse</span>
                    <span class="recap-value">{{ selectedClient?.address || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Téléphone</span>
                    <span class="recap-value">{{ selectedClient?.phone || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Profession</span>
                    <span class="recap-value">{{ selectedClient?.occupation || '-' }}</span>
                  </div>
                  <div v-if="selectedClient?.email" class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Email</span>
                    <span class="recap-value">{{ selectedClient?.email }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-5">
            <!-- Informations Contrat -->
            <div class="recap-card">
              <div class="recap-card-header">
                <i class="fas fa-file-contract"></i>
                <h5>Informations Contrat</h5>
              </div>
              <div class="recap-card-body">
                <div class="recap-grid">
                  <div class="recap-item">
                    <span class="recap-label">Capital</span>
                    <span class="recap-value text-success">{{ formatCurrency(formModel.contrat.capital) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Durée</span>
                    <span class="recap-value">{{ formModel.contrat.duration }} mois</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Taux d'intérêt</span>
                    <span class="recap-value">{{ formModel.contrat.tauxInteret }}%</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date d'effet</span>
                    <span class="recap-value">{{ formatDate(formModel.contrat.dateEffet) }}</span>
                  </div>
                  <div class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Nature de crédit</span>
                    <span class="recap-value">
                      <span class="recap-badge-nature">{{ natureCredits.find(nc => nc.id === formModel.contrat.idNatureCredit)?.libelle || '-' }}</span>
                    </span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Périodicité</span>
                    <span class="recap-value">{{ periodicites.find(p => p.id === formModel.contrat.idPeriodicite)?.libelle || '-' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date 1re échéance</span>
                    <span class="recap-value">{{ formatDate(formModel.contrat.datePremiereEcheance) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date d'échéance</span>
                    <span class="recap-value">{{ formatDate(formModel.contrat.dateEch1) }}</span>
                  </div>
                  <div class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Référence dossier</span>
                    <span class="recap-value">{{ formModel.contrat.reference || 'Générée automatiquement' }}</span>
                  </div>
                  <div v-if="natureCreditCode === 'AMORT'" class="recap-item">
                    <span class="recap-label">Perte d'Emploi</span>
                    <span class="recap-value">{{ formModel.contrat.perteEmploi }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Primes d'assurance -->
        <div class="recap-card" style="border-left: 4px solid #33b04a;">
          <div class="recap-card-header">
            <i class="fas fa-coins text-success"></i>
            <h5>Primes d'assurance</h5>
          </div>
          <div class="recap-card-body">
            <div class="premium-badges-grid">
              <div class="premium-badge-card primary-premium">
                <span class="premium-card-label">
                  <i class="fas fa-check-double"></i> Prime Unique TTC
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.puttc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-heartbeat"></i> Prime Décès
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.pd) }}</span>
              </div>
              <div class="premium-badge-card" v-if="natureCreditCode === 'AMORT'">
                <span class="premium-card-label">
                  <i class="fas fa-briefcase"></i> Perte d'Emploi
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.pc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-hand-holding-medical"></i> Surprime
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.surp) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-concierge-bell"></i> Accessoires
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.acc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-file-medical-alt"></i> Frais Médicaux
                </span>
                <span class="premium-card-value">{{ formatCurrency(formModel.primes.fm) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message de succès de création -->
      <div v-if="creationSuccess" class="alert alert-success mb-4">
        <div class="d-flex align-items-center">
          <i class="fas fa-check-circle me-3 fs-4"></i>
          <div class="flex-grow-1">
            <h5 class="mb-2">{{ creationMessage }}</h5>
            <p class="mb-3">Le contrat hors convention a été créé avec succès. Vous pouvez maintenant télécharger le PDF du contrat.</p>
            <div class="d-flex gap-2">
              <button
                v-if="createdContractId"
                type="button"
                class="btn btn-primary"
                @click="downloadContractPDF(createdContractId)"
                :disabled="isDownloadingPDF"
              >
                <div v-if="isDownloadingPDF" class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Téléchargement...</span>
                </div>
                <i v-else class="fas fa-download me-2"></i>
                {{ isDownloadingPDF ? 'Téléchargement...' : 'Télécharger le PDF' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="closeModal"
              >
                <i class="fas fa-times me-2"></i>
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Form>

    <template #footer>
      <div v-if="!creationSuccess" class="d-flex justify-content-between w-100">
        <div>
          <button type="button" class="btn btn-secondary me-2" @click="closeModal">
            <i class="fas fa-times me-2"></i>
            Annuler
          </button>
          <button v-if="currentStep > 1" type="button" class="btn btn-outline-primary" @click="prevStep">
            <i class="fas fa-arrow-left me-2"></i>
            Précédent
          </button>
        </div>
        <div>
          <button
            v-if="currentStep < 2"
            type="button"
            :class="['btn', isCurrentStepValid ? 'btn-primary' : 'btn-danger']"
            @click="nextStep"
            :disabled="!isCurrentStepValid"
          >
            <i v-if="!isCurrentStepValid" class="fas fa-exclamation-triangle me-2"></i>
            Suivant
            <i class="fas fa-arrow-right ms-2"></i>
          </button>
          <button v-else type="button" class="btn btn-success" @click="handleSubmitForm" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-check me-2"></i>
            {{ isSubmitting ? 'Création...' : 'Créer le Contrat Hors Convention' }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as Yup from 'yup';
import Modal from './Modal.vue';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import { error, success, calculateDateEcheance, extractFilenameFromResponse } from '../../utils/utils';
import {
  dateEffetSchema,
  datePremiereEcheanceSchema,
  dateEcheanceSchema,
  getMinDateEcheance as getMinDateEcheanceUtil
} from '../../utils/dateValidations';

export default defineComponent({
  name: 'HorsConventionModal',
  components: { Form, Field, ErrorMessage, Modal },
  props: {
    // Client déjà sélectionné (non modifiable dans ce formulaire)
    selectedClient: {
      type: Object,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hors-convention-success', 'close', 'update:visible'],
  setup(props, { emit }) {
    const formRef = ref<any>(null);
    const currentStep = ref(1);
    const totalSteps = 2;
    const isSubmitting = ref(false);
    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    const natureCredits = ref<any[]>([]);
    const loadingNatureCredits = ref(false);
    const dateEcheanceManuallyEdited = ref(false);
    const datePremiereEcheanceManuallyEdited = ref(false);
    const stepValidationError = ref('');
    const creationSuccess = ref(false);
    const creationMessage = ref('');
    const createdContractId = ref<number | null>(null);
    const isDownloadingPDF = ref(false);

    const todayDate = computed(() => {
      return new Date().toISOString().split('T')[0];
    });

    const natureCreditCode = computed(() => {
      const nc = natureCredits.value.find(n => n.id === formModel.value.contrat.idNatureCredit);
      return nc?.code || '';
    });

    const getMinDateEcheance = computed(() => {
      return getMinDateEcheanceUtil(
        formModel.value.contrat.datePremiereEcheance,
        formModel.value.contrat.dateEffet,
        todayDate.value
      );
    });

    const formModel = ref({
      contrat: {
        idNatureCredit: '' as any,
        capital: 1000000,
        duration: 12,
        tauxInteret: 12.5,
        dateEffet: new Date().toISOString().split('T')[0],
        datePremiereEcheance: (() => {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth.toISOString().split('T')[0];
        })(),
        dateEch1: '',
        dateEcheance: '',
        idPeriodicite: 1,
        reference: '',
        etablissement: '',
        perteEmploi: 'NON' as string
      },
      primes: {
        pd: 0,
        pc: 0,
        surp: 0,
        acc: 0,
        fm: 0,
        puttc: 0
      }
    });

    const validationSchema = Yup.object({
      contrat: Yup.object({
        idNatureCredit: Yup.number()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
          .required('La nature de crédit est obligatoire'),
        capital: Yup.number()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
          .typeError('Le capital doit être un nombre')
          .required('Le capital est obligatoire')
          .min(1, 'Le capital doit être supérieur à 0'),
        idPeriodicite: Yup.number()
          .required('La périodicité est obligatoire')
          .min(1, 'La périodicité est obligatoire'),
        dateEffet: dateEffetSchema,
        datePremiereEcheance: datePremiereEcheanceSchema('contrat'),
        duration: Yup.number()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
          .typeError('La durée doit être un nombre')
          .required('La durée en mois est obligatoire')
          .integer('La durée doit être un entier')
          .min(1, 'La durée minimale est 1 mois'),
        tauxInteret: Yup.number()
          .nullable()
          .transform((value, originalValue) => {
            if (originalValue === '' || originalValue === null || originalValue === undefined) {
              return null;
            }
            const numValue = Number(originalValue);
            if (numValue === 0) {
              return 0;
            }
            return isNaN(numValue) ? null : numValue;
          })
          .required('Le taux d\'intérêt est obligatoire')
          .min(0, 'Le taux d\'intérêt ne peut pas être négatif')
          .max(100, 'Le taux d\'intérêt ne peut pas dépasser 100%'),
        dateEch1: dateEcheanceSchema('contrat'),
        perteEmploi: Yup.string()
          .test('required-if-amort', 'Un choix pour Perte d\'Emploi est obligatoire', function(value) {
            if (natureCreditCode.value !== 'AMORT') return true;
            return value === 'OUI' || value === 'NON';
          })
      }),
      primes: Yup.object({
        pd: Yup.number()
          .required('La prime décès est obligatoire')
          .min(0, 'La prime décès ne peut pas être négative'),
        pc: Yup.number()
          .min(0, 'La prime complémentaire ne peut pas être négative'),
        surp: Yup.number()
          .required('La surprime est obligatoire')
          .min(0, 'La surprime ne peut pas être négative'),
        acc: Yup.number()
          .required('Les accessoires sont obligatoires')
          .min(0, 'Les accessoires ne peuvent pas être négatifs'),
        fm: Yup.number()
          .required('Les frais médicaux sont obligatoires')
          .min(0, 'Les frais médicaux ne peuvent pas être négatifs'),
        puttc: Yup.number()
          .required('La prime unique TTC est obligatoire')
          .min(1, 'La prime unique TTC doit être supérieure à 0')
      })
    });

    const loadPeriodicites = async () => {
      try {
        loadingPeriodicites.value = true;
        const response = await ApiService.get('/periodicite');

        if (response.data && response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          periodicites.value = response.data.data.data.filter((p: any) => p.isActive);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          periodicites.value = response.data.data.filter((p: any) => p.isActive);
        } else {
          periodicites.value = [
            { id: 1, libelle: 'Mensuelle', code: '1', nombreMois: 1 },
            { id: 2, libelle: 'Bimestrielle', code: '2', nombreMois: 2 },
            { id: 3, libelle: 'Trimestrielle', code: '3', nombreMois: 3 },
            { id: 4, libelle: 'Quadrimesuelle', code: '4', nombreMois: 4 },
            { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
            { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
            { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
          ];
        }

        if (periodicites.value.length > 0 && !dateEcheanceManuallyEdited.value) {
          nextTick(() => {
            calculateDateEcheanceAuto();
          });
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des périodicités:', err);
        periodicites.value = [
          { id: 1, libelle: 'Mensuelle', code: '1', nombreMois: 1 },
          { id: 2, libelle: 'Bimestrielle', code: '2', nombreMois: 2 },
          { id: 3, libelle: 'Trimestrielle', code: '3', nombreMois: 3 },
          { id: 4, libelle: 'Quadrimesuelle', code: '4', nombreMois: 4 },
          { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
          { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
          { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
        ];
      } finally {
        loadingPeriodicites.value = false;
      }
    };

    const loadNatureCredits = async () => {
      try {
        loadingNatureCredits.value = true;
        const response = await ApiService.get('/nature-credits');
        const raw = response.data?.data?.data || response.data?.data || response.data;
        if (Array.isArray(raw)) {
          natureCredits.value = raw.filter((nc: any) => nc.code === 'AMORT' || nc.code === 'CONST');
        } else {
          natureCredits.value = [
            { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
            { id: 2, libelle: 'CONSTANT', code: 'CONST' }
          ];
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des natures de crédit:', err);
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
          { id: 2, libelle: 'CONSTANT', code: 'CONST' }
        ];
      } finally {
        loadingNatureCredits.value = false;
      }
    };

    const calculateDateEcheanceAuto = () => {
      if (!formModel.value.contrat.datePremiereEcheance ||
          !formModel.value.contrat.duration ||
          !formModel.value.contrat.idPeriodicite) {
        return;
      }

      const periodiciteSelected = periodicites.value.find(
        p => p.id === formModel.value.contrat.idPeriodicite
      );

      if (!periodiciteSelected || !periodiciteSelected.nombreMois) {
        return;
      }

      const nombreMoisPeriodicite = periodiciteSelected.nombreMois;
      const dureeMois = Number(formModel.value.contrat.duration);
      const differeMois = 0; // RENACA n'a pas de différé

      const dateEcheanceCalculee = calculateDateEcheance(
        formModel.value.contrat.datePremiereEcheance,
        dureeMois,
        nombreMoisPeriodicite,
        differeMois
      );

      if (dateEcheanceCalculee) {
        formModel.value.contrat.dateEch1 = dateEcheanceCalculee;
      }
    };

    const handleDateEcheanceManualEdit = () => {
      dateEcheanceManuallyEdited.value = true;
    };

    const resetDateEcheanceAuto = () => {
      dateEcheanceManuallyEdited.value = false;
      calculateDateEcheanceAuto();
    };

    const updateDatePremiereEcheance = () => {
      if (formModel.value.contrat.dateEffet) {
        if (!datePremiereEcheanceManuallyEdited.value) {
          const dateEffet = new Date(formModel.value.contrat.dateEffet);
          const dateEch1 = new Date(dateEffet);
          dateEch1.setMonth(dateEch1.getMonth() + 1);
          formModel.value.contrat.dateEch1 = dateEch1.toISOString().split('T')[0];
          formModel.value.contrat.datePremiereEcheance = dateEch1.toISOString().split('T')[0];
        }

        if (!dateEcheanceManuallyEdited.value) {
          calculateDateEcheanceAuto();
        }
      }
    };

    const validateDateEffet = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedDate = new Date(target.value);
      const today = new Date();

      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        const todayString = today.toISOString().split('T')[0];
        target.value = todayString;
        formModel.value.contrat.dateEffet = todayString;
        updateDatePremiereEcheance();
      }
    };

    const validateDatePremiereEcheance = () => {
      datePremiereEcheanceManuallyEdited.value = true;
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    };

    const validateDateEcheance = () => {
      dateEcheanceManuallyEdited.value = true;
    };

    const handleCapitalInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;

      if (value === '' || value === null || value === undefined) {
        formModel.value.contrat.capital = 1000000;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
          formModel.value.contrat.capital = numValue;
        }
      }
    };

    const handleDurationInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;

      if (value === '' || value === null || value === undefined) {
        formModel.value.contrat.duration = 12;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 1) {
          formModel.value.contrat.duration = numValue;
          calculateDateEcheanceAuto();
        }
      }
    };

    const calculatePutcc = () => {
      const pd = validateNumericValue(formModel.value.primes.pd, 0);
      const pc = validateNumericValue(formModel.value.primes.pc, 0);
      const surp = validateNumericValue(formModel.value.primes.surp, 0);
      const acc = validateNumericValue(formModel.value.primes.acc, 0);
      const fm = validateNumericValue(formModel.value.primes.fm, 0);

      formModel.value.primes.puttc = pd + pc + surp + acc + fm;
    };

    const validateNumericValue = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? defaultValue : numValue;
    };

    const handlePrimeInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      const fieldName = target.name;

      const defaultValue = 0;

      if (value === '' || value === null || value === undefined) {
        if (fieldName === 'primes.pd') {
          formModel.value.primes.pd = defaultValue;
        } else if (fieldName === 'primes.pc') {
          formModel.value.primes.pc = defaultValue;
        } else if (fieldName === 'primes.surp') {
          formModel.value.primes.surp = defaultValue;
        } else if (fieldName === 'primes.acc') {
          formModel.value.primes.acc = defaultValue;
        } else if (fieldName === 'primes.fm') {
          formModel.value.primes.fm = defaultValue;
        }
      } else {
        const numValue = Number(value);

        if (!isNaN(numValue) && numValue >= 0) {
          if (fieldName === 'primes.pd') {
            formModel.value.primes.pd = numValue;
          } else if (fieldName === 'primes.pc') {
            formModel.value.primes.pc = numValue;
          } else if (fieldName === 'primes.surp') {
            formModel.value.primes.surp = numValue;
          } else if (fieldName === 'primes.acc') {
            formModel.value.primes.acc = numValue;
          } else if (fieldName === 'primes.fm') {
            formModel.value.primes.fm = numValue;
          }
        }
      }

      calculatePutcc();
    };

    const validateTauxInteret = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = parseFloat(target.value);
      if (value < 0) {
        target.value = '0';
      } else if (value > 100) {
        target.value = '100';
      }
    };

    const handleUppercaseInput = (event: Event, fieldPath: string) => {
      const target = event.target as HTMLInputElement;
      if (target) {
        target.value = target.value.toUpperCase();
        const pathParts = fieldPath.split('.');
        if (pathParts.length === 2) {
          (formModel.value as any)[pathParts[0]][pathParts[1]] = target.value;
        }
      }
    };

    // Validation des champs requis de l'étape 1 (contrat + primes)
    const validateCurrentStep = (): boolean => {
      if (currentStep.value !== 1) {
        stepValidationError.value = '';
        return true;
      }

      const missingFields: string[] = [];
      const contrat = formModel.value.contrat;
      const primes = formModel.value.primes;

      if (!contrat.idNatureCredit) missingFields.push('Nature de crédit');
      if (!contrat.capital || Number(contrat.capital) <= 0) missingFields.push('Capital');
      if (!contrat.duration || Number(contrat.duration) <= 0) missingFields.push('Durée');
      if (!contrat.idPeriodicite) missingFields.push('Périodicité');
      if (contrat.tauxInteret === null || contrat.tauxInteret === undefined || isNaN(Number(contrat.tauxInteret)) || Number(contrat.tauxInteret) < 0) {
        missingFields.push('Taux d\'intérêt');
      }
      if (!contrat.dateEffet) missingFields.push('Date d\'effet');
      if (!contrat.datePremiereEcheance && !contrat.dateEch1) missingFields.push('Date de première échéance');
      if (!contrat.dateEch1) missingFields.push('Date d\'échéance');
      if (natureCreditCode.value === 'AMORT' && contrat.perteEmploi !== 'OUI' && contrat.perteEmploi !== 'NON') missingFields.push('Perte d\'Emploi');

      if (primes.pd === null || primes.pd === undefined || Number(primes.pd) < 0) missingFields.push('Prime Décès (PD)');
      if (primes.surp === null || primes.surp === undefined || Number(primes.surp) < 0) missingFields.push('Surprime (SURP)');
      if (primes.acc === null || primes.acc === undefined || Number(primes.acc) < 0) missingFields.push('Accessoires (ACC)');
      if (primes.fm === null || primes.fm === undefined || Number(primes.fm) < 0) missingFields.push('Frais Médicaux (FM)');
      if (!primes.puttc || Number(primes.puttc) <= 0) missingFields.push('Prime Unique TTC (PUTTC)');

      if (missingFields.length > 0) {
        stepValidationError.value = `Champs manquants : ${missingFields.join(', ')}`;
        return false;
      }

      stepValidationError.value = '';
      return true;
    };

    const isCurrentStepValid = computed(() => {
      if (currentStep.value !== 1) return true;

      const contrat = formModel.value.contrat;
      const primes = formModel.value.primes;
      return !!(contrat.idNatureCredit &&
                contrat.capital && Number(contrat.capital) > 0 &&
                contrat.duration && Number(contrat.duration) > 0 &&
                contrat.idPeriodicite &&
                contrat.tauxInteret !== null && contrat.tauxInteret !== undefined &&
                  !isNaN(Number(contrat.tauxInteret)) && Number(contrat.tauxInteret) >= 0 &&
                contrat.dateEffet &&
                (contrat.datePremiereEcheance || contrat.dateEch1) &&
                contrat.dateEch1 &&
                (natureCreditCode.value !== 'AMORT' || contrat.perteEmploi === 'OUI' || contrat.perteEmploi === 'NON') &&
                primes.pd !== null && primes.pd !== undefined && Number(primes.pd) >= 0 &&
                primes.surp !== null && primes.surp !== undefined && Number(primes.surp) >= 0 &&
                primes.acc !== null && primes.acc !== undefined && Number(primes.acc) >= 0 &&
                primes.fm !== null && primes.fm !== undefined && Number(primes.fm) >= 0 &&
                primes.puttc && Number(primes.puttc) > 0);
    });

    const nextStep = () => {
      if (!validateCurrentStep()) {
        return;
      }
      stepValidationError.value = '';
      currentStep.value++;
    };

    const prevStep = () => {
      stepValidationError.value = '';
      currentStep.value--;
    };

    const closeModal = () => {
      dateEcheanceManuallyEdited.value = false;
      datePremiereEcheanceManuallyEdited.value = false;
      creationSuccess.value = false;
      creationMessage.value = '';
      createdContractId.value = null;
      isDownloadingPDF.value = false;
      currentStep.value = 1;
      emit('update:visible', false);
      emit('close');
    };

    const downloadContractPDF = async (contractId: number) => {
      if (isDownloadingPDF.value) return;

      try {
        isDownloadingPDF.value = true;

        const response = await ApiService.vueInstance.axios.get(`/contracts/${contractId}/pdf`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });

        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const filename = extractFilenameFromResponse(response, `contrat_${contractId}.pdf`);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

        success('PDF téléchargé avec succès !');
      } catch (err: any) {
        console.error('❌ Erreur lors du téléchargement:', err);

        if (err.response?.status === 404) {
          error('Contrat non trouvé');
        } else if (err.response?.status === 400) {
          error('ID de contrat invalide');
        } else if (err.response?.status === 500) {
          error('Erreur serveur lors de la génération');
        } else {
          error('Erreur lors du téléchargement du PDF');
        }
      } finally {
        isDownloadingPDF.value = false;
      }
    };

    const handleSubmitForm = async () => {
      if (isSubmitting.value) return;

      if (!props.selectedClient?.id) {
        error('Aucun client sélectionné');
        return;
      }

      if (formRef.value) {
        try {
          if ((formRef.value as any).setValues) {
            (formRef.value as any).setValues(formModel.value);
          }
          await nextTick();

          const validationResult = await formRef.value.validate();

          if (!validationResult || !validationResult.valid) {
            let errors: any = {};
            if (validationResult && validationResult.errors) {
              errors = validationResult.errors;
            } else if ((formRef.value as any).errors) {
              errors = (formRef.value as any).errors;
            } else if ((formRef.value as any).meta && (formRef.value as any).meta.errors) {
              errors = (formRef.value as any).meta.errors;
            }

            const errorFields = Object.keys(errors);

            if (errorFields.length > 0) {
              const errorMessages: string[] = [];
              errorFields.slice(0, 5).forEach(field => {
                const fieldName = field.split('.').pop() || field;
                const errorMsg = errors[field];
                errorMessages.push(`${fieldName}${errorMsg ? `: ${errorMsg}` : ''}`);
              });

              const errorMessage = errorFields.length > 5
                ? `Erreurs de validation : ${errorMessages.join(' | ')} et ${errorFields.length - 5} autre(s)`
                : `Erreurs de validation : ${errorMessages.join(' | ')}`;

              error(errorMessage);
              return;
            } else {
              if (!validateCurrentStep()) {
                error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
                return;
              }
              console.warn('⚠️ Validation VeeValidate échouée mais validation manuelle OK. Continuons avec la validation manuelle...');
            }
          }
        } catch (validationError: any) {
          console.error('❌ Erreur lors de la validation VeeValidate:', validationError);
          if (!validateCurrentStep()) {
            error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
            return;
          }
          console.warn('⚠️ Erreur de validation VeeValidate mais validation manuelle OK. Continuons...');
        }
      }

      if (!validateCurrentStep()) {
        error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
        return;
      }

      isSubmitting.value = true;
      try {
        // Client déjà sélectionné : le backend retrouve/réutilise automatiquement
        // le même client existant via clientData (recherche par nom/prénom/date
        // de naissance), sans créer de doublon.
        const clientData = {
          firstname: (props.selectedClient.firstname || '').trim(),
          lastname: (props.selectedClient.lastname || '').trim(),
          birthdate: props.selectedClient.birthdate,
          numCustomer: props.selectedClient.numCustomer || undefined,
          phone: props.selectedClient.phone || undefined,
          email: props.selectedClient.email || undefined,
          gender: props.selectedClient.gender || undefined,
          placeOfBirth: props.selectedClient.placeOfBirth || undefined,
          occupation: props.selectedClient.occupation || undefined,
          address: props.selectedClient.address || undefined,
          idTypeCustomer: props.selectedClient.typeCustomer?.id || props.selectedClient.idTypeCustomer || undefined
        };

        const contractPayload = {
          capital: Number(formModel.value.contrat.capital),
          duration: Number(formModel.value.contrat.duration),
          taux: Number(formModel.value.contrat.tauxInteret),
          dateEff: formModel.value.contrat.dateEffet,
          dateEch1: formModel.value.contrat.datePremiereEcheance || formModel.value.contrat.dateEch1,
          dateEch: formModel.value.contrat.dateEcheance || formModel.value.contrat.dateEch1,
          idNatureCredit: Number(formModel.value.contrat.idNatureCredit),
          idPeriodicite: Number(formModel.value.contrat.idPeriodicite),
          perteEmploi: natureCreditCode.value === 'AMORT' && formModel.value.contrat.perteEmploi === 'OUI',
          reference: formModel.value.contrat.reference || undefined,
          etablissement: formModel.value.contrat.etablissement || undefined,
          pd: validateNumericValue(formModel.value.primes.pd, 0),
          pc: validateNumericValue(formModel.value.primes.pc, 0),
          surp: validateNumericValue(formModel.value.primes.surp, 0),
          acc: validateNumericValue(formModel.value.primes.acc, 0),
          fm: validateNumericValue(formModel.value.primes.fm, 0),
          puttc: validateNumericValue(formModel.value.primes.puttc, 0),
          clientData: clientData
        };

        const response = await ApiService.post('/contracts/hors-convention-with-customer', contractPayload);

        let result = response?.data;
        if (result?.data && typeof result.data === 'object') {
          result = result.data;
        }

        if (!result || result.success === false) {
          const errorMessage = result?.message ||
                              response?.data?.message ||
                              'Erreur lors de la création du contrat hors convention';
          throw new Error(errorMessage);
        }

        const contract = result.contract;
        if (!contract) throw new Error('Contrat non créé');

        createdContractId.value = contract.id;
        creationSuccess.value = true;

        const successMessage = result.message ||
                              `Contrat "${contract.reference || contract.id}" créé avec succès !`;
        creationMessage.value = successMessage;

        success(successMessage);

        emit('hors-convention-success', { contract });
      } catch (err: any) {
        console.error('❌ Erreur création contrat hors convention:', err);

        let errorMessage = 'Erreur lors de la création du contrat hors convention';
        if (err?.response?.data?.data?.message) {
          errorMessage = err.response.data.data.message;
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        error(errorMessage);
      } finally {
        isSubmitting.value = false;
      }
    };

    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) return '-';
      try {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('fr-FR');
      } catch {
        return '-';
      }
    };

    const formatNumber = (value: number | string | null | undefined): string => {
      if (value === null || value === undefined || value === '') return '0';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0';
      return new Intl.NumberFormat('fr-FR').format(num);
    };

    const formatCurrency = (value: number | string | null | undefined): string => {
      return `${formatNumber(value)} FCFA`;
    };

    // Watchers pour recalculer automatiquement la date d'échéance
    watch(() => formModel.value.contrat.datePremiereEcheance, (newDate, oldDate) => {
      if (newDate && newDate !== oldDate && !dateEcheanceManuallyEdited.value && currentStep.value >= 1) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => formModel.value.contrat.duration, (newDuration, oldDuration) => {
      if (newDuration && newDuration !== oldDuration && !dateEcheanceManuallyEdited.value && currentStep.value >= 1) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => formModel.value.contrat.idPeriodicite, (newPeriodicite, oldPeriodicite) => {
      if (newPeriodicite && newPeriodicite !== oldPeriodicite && !dateEcheanceManuallyEdited.value && currentStep.value >= 1) {
        calculateDateEcheanceAuto();
      }
    });

    // Réinitialise la Prime Complémentaire (PC) à 0 quand elle devient grisée
    // (Perte d'Emploi = NON) ou disparaît (nature de crédit CONSTANT)
    watch([natureCreditCode, () => formModel.value.contrat.perteEmploi], ([nature, perteEmploi]) => {
      if (nature !== 'AMORT' || perteEmploi !== 'OUI') {
        formModel.value.primes.pc = 0;
      }
    });

    // Réinitialise le formulaire à l'étape 1 à chaque ouverture (nouveau client à chaque fois)
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        currentStep.value = 1;
        creationSuccess.value = false;
        stepValidationError.value = '';
        nextTick(() => {
          calculatePutcc();
        });
      }
    });

    // Watchers pour recalculer PUTTC quand les primes changent
    watch(() => formModel.value.primes.pd, () => calculatePutcc());
    watch(() => formModel.value.primes.pc, () => calculatePutcc());
    watch(() => formModel.value.primes.surp, () => calculatePutcc());
    watch(() => formModel.value.primes.acc, () => calculatePutcc());
    watch(() => formModel.value.primes.fm, () => calculatePutcc());

    onMounted(() => {
      loadPeriodicites();
      loadNatureCredits();
      calculatePutcc();
    });

    return {
      formRef,
      currentStep,
      totalSteps,
      nextStep,
      prevStep,
      validateCurrentStep,
      isCurrentStepValid,
      stepValidationError,
      formModel,
      validationSchema,
      handleSubmitForm,
      isSubmitting,
      closeModal,
      downloadContractPDF,
      creationSuccess,
      creationMessage,
      createdContractId,
      isDownloadingPDF,
      formatDate,
      formatNumber,
      formatCurrency,
      periodicites,
      loadingPeriodicites,
      natureCredits,
      loadingNatureCredits,
      natureCreditCode,
      todayDate,
      getMinDateEcheance,
      dateEcheanceManuallyEdited,
      handleCapitalInput,
      handleDurationInput,
      validateTauxInteret,
      calculatePutcc,
      handlePrimeInput,
      validateNumericValue,
      validateDateEffet,
      validateDatePremiereEcheance,
      validateDateEcheance,
      updateDatePremiereEcheance,
      calculateDateEcheanceAuto,
      resetDateEcheanceAuto,
      handleDateEcheanceManualEdit,
      handleUppercaseInput
    };
  }
});
</script>

<style scoped>
.form-step { padding: 12px; }
.hors-convention-modal-content .card { border-radius: 8px; }

.recap-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.recap-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.recap-card-header h5 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.recap-card-body {
  padding: 1rem;
}

.recap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.recap-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.recap-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #6c757d;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.recap-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #212529;
}

.recap-badge-nature {
  display: inline-block;
  background: #e7f5ea;
  color: #1e7e34;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.premium-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.premium-badge-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.premium-badge-card.primary-premium {
  background: #e7f5ea;
  border-color: #33b04a;
}

.premium-card-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 600;
}

.premium-card-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #212529;
}

/* Styles pour le footer du modal */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.modal-footer .btn {
  min-width: 120px;
  padding: 0.5rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.modal-footer .btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer .btn-primary {
  background-color: #33b04a;
  border-color: #33b04a;
  color: white;
}

.modal-footer .btn-primary:hover:not(:disabled) {
  background-color: #2a8f3d;
  border-color: #2a8f3d;
}

.modal-footer .btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.modal-footer .btn-success:hover:not(:disabled) {
  background-color: #218838;
  border-color: #1e7e34;
}

.modal-footer .btn-outline-primary {
  border-color: #33b04a;
  color: #33b04a;
}

.modal-footer .btn-outline-primary:hover {
  background-color: #33b04a;
  border-color: #33b04a;
  color: white;
}

@media (max-width: 768px) {
  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .modal-footer .d-flex {
    width: 100%;
    justify-content: space-between;
  }

  .modal-footer .btn {
    flex: 1;
    min-width: auto;
  }

  .recap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
