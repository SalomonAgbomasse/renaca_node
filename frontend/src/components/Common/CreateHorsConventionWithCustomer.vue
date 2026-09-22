<template>
  <Modal
    :is-visible="visible"
    :title="`Créer Contrat Hors Convention (Client + Contrat)`"
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
      class="create-hc-with-client"
    >
      <!-- Message d'erreur de validation -->
      <div v-if="stepValidationError && !creationSuccess" class="alert alert-danger mb-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ stepValidationError }}
      </div>

      <div v-if="currentStep === 1 && !creationSuccess" class="form-step">
        <h5 class="mb-3 text-uppercase">
          <i class="fa fa-file-contract me-2"></i>
          Informations du client
        </h5>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold">Prénom <span class="text-danger">*</span></label>
            <Field name="client.firstname" v-model="formModel.client.firstname" class="form-control" placeholder="Prénom du client" />
            <ErrorMessage name="client.firstname" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Nom <span class="text-danger">*</span></label>
            <Field name="client.lastname" v-model="formModel.client.lastname" class="form-control" placeholder="Nom du client" />
            <ErrorMessage name="client.lastname" class="text-danger small" />
          </div>
          <div class="col-md-12">
            <label class="form-label fw-bold">Numéro de client <span class="text-danger">*</span></label>
            <Field name="client.numCustomer" v-model="formModel.client.numCustomer" class="form-control" placeholder="Numéro de client" />
            <ErrorMessage name="client.numCustomer" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Téléphone <span class="text-danger">*</span></label>
            <Field name="client.phone" v-model="formModel.client.phone" class="form-control" placeholder="Numéro de téléphone" />
            <ErrorMessage name="client.phone" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Email</label>
            <Field name="client.email" v-model="formModel.client.email" type="email" class="form-control" placeholder="Adresse email" />
            <ErrorMessage name="client.email" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Genre <span class="text-danger">*</span></label>
            <Field name="client.gender" as="select" v-model="formModel.client.gender" class="form-select">
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Field>
            <ErrorMessage name="client.gender" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Date de naissance <span class="text-danger">*</span></label>
            <Field name="client.birthdate" v-model="formModel.client.birthdate" type="date" class="form-control" />
            <ErrorMessage name="client.birthdate" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Type de client <span class="text-danger">*</span></label>
            <Field name="client.idTypeCustomer" as="select" v-model="formModel.client.idTypeCustomer" class="form-select">
              <option value="">Sélectionner</option>
              <option v-for="tc in typeCustomers" :key="tc.id" :value="String(tc.id)">{{ tc.libelle }}</option>
            </Field>
            <ErrorMessage name="client.idTypeCustomer" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Lieu de naissance <span class="text-danger">*</span></label>
            <Field name="client.placeOfBirth" v-model="formModel.client.placeOfBirth" class="form-control" placeholder="Lieu de naissance" />
            <ErrorMessage name="client.placeOfBirth" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Profession <span class="text-danger">*</span></label>
            <Field name="client.occupation" v-model="formModel.client.occupation" class="form-control" placeholder="Profession" />
            <ErrorMessage name="client.occupation" class="text-danger small" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Adresse <span class="text-danger">*</span></label>
            <Field name="client.address" as="textarea" v-model="formModel.client.address" class="form-control" rows="2" placeholder="Adresse complète" />
            <ErrorMessage name="client.address" class="text-danger small" />
          </div>
        </div>
      </div>

      <div v-if="currentStep === 2 && !creationSuccess" class="form-step">
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
          <div class="col-md-6" v-if="formModel.contrat.perteEmploi === 'OUI'">
            <div class="form-group mb-3">
              <label class="form-label">Prime Complémentaire Perte d'Emploi (PC) <span class="text-danger">*</span></label>
              <Field
                name="primes.pc"
                v-model="formModel.primes.pc"
                type="number"
                class="form-control"
                :min="0"
                step="0.01"
                placeholder="0"
                @input="handlePrimeInput"
              />
              <ErrorMessage name="primes.pc" class="text-danger" />
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
          <div class="col-md-12">
            <div class="form-group mb-3">
              <label class="form-label">Référence dossier</label>
              <Field
                name="contrat.reference"
                v-model="formModel.contrat.reference"
                type="text"
                class="form-control"
                placeholder="Référence dossier"
                @input="handleUppercaseInput($event, 'contrat.reference')"
              />
              <ErrorMessage name="contrat.reference" class="text-danger" />
            </div>
          </div>
        </div>

        <!-- Première ligne des primes : PD, SURP -->
        <div class="row">
          <div class="col-md-6">
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
          
          <div class="col-md-6">
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

      <div v-if="currentStep === 3 && !creationSuccess" class="form-step">
        <h5>Étape 3 — Récapitulatif</h5>
        <div class="card mb-3">
          <div class="card-body">
            <h6 class="mb-3">Informations Client</h6>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Prénom:</strong> {{ formModel.client.firstname || '-' }}</p>
                <p><strong>Nom:</strong> {{ formModel.client.lastname || '-' }}</p>
                <p><strong>Numéro de client:</strong> {{ formModel.client.numCustomer || '-' }}</p>
                <p><strong>Téléphone:</strong> {{ formModel.client.phone || '-' }}</p>
                <p><strong>Email:</strong> {{ formModel.client.email || '-' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Genre:</strong> {{ formModel.client.gender === 'M' ? 'Masculin' : formModel.client.gender === 'F' ? 'Féminin' : '-' }}</p>
                <p><strong>Date de naissance:</strong> {{ formatDate(formModel.client.birthdate) }}</p>
                <p><strong>Lieu de naissance:</strong> {{ formModel.client.placeOfBirth || '-' }}</p>
                <p><strong>Profession:</strong> {{ formModel.client.occupation || '-' }}</p>
                <p><strong>Type de client:</strong> {{ formModel.client.idTypeCustomer === '1' ? 'Particulier' : formModel.client.idTypeCustomer === '2' ? 'Personnel PADME' : '-' }}</p>
              </div>
              <div class="col-md-12">
                <p><strong>Adresse:</strong> {{ formModel.client.address || '-' }}</p>
              </div>
            </div>
            <hr>
            <h6 class="mb-3">Informations Contrat</h6>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Nature de crédit:</strong> {{ natureCredits.find(nc => nc.id === formModel.contrat.idNatureCredit)?.libelle || '-' }}</p>
                <p><strong>Capital:</strong> {{ formatNumber(formModel.contrat.capital) }} FCFA</p>
                <p><strong>Durée:</strong> {{ formModel.contrat.duration }} mois</p>
                <p><strong>Taux d'intérêt:</strong> {{ formModel.contrat.tauxInteret }}%</p>
                <p><strong>Périodicité:</strong> {{ periodicites.find(p => p.id === formModel.contrat.idPeriodicite)?.libelle || '-' }}</p>
                <p v-if="natureCreditCode === 'AMORT'"><strong>Perte d'Emploi:</strong> {{ formModel.contrat.perteEmploi }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Date d'effet:</strong> {{ formatDate(formModel.contrat.dateEffet) }}</p>
                <p><strong>Date 1re échéance:</strong> {{ formatDate(formModel.contrat.datePremiereEcheance) }}</p>
                <p><strong>Date d'échéance:</strong> {{ formatDate(formModel.contrat.dateEch1) }}</p>
                <p><strong>Référence:</strong> {{ formModel.contrat.reference || '-' }}</p>
              </div>
            </div>
            <hr>
            <h6 class="mb-3">Primes d'assurance</h6>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Prime Décès (PD):</strong> {{ formatNumber(formModel.primes.pd) }} FCFA</p>
                <p><strong>Prime Complémentaire (PC):</strong> {{ formatNumber(formModel.primes.pc) }} FCFA</p>
                <p><strong>Surprime (SURP):</strong> {{ formatNumber(formModel.primes.surp) }} FCFA</p>
              </div>
              <div class="col-md-6">
                <p><strong>Accessoires (ACC):</strong> {{ formatNumber(formModel.primes.acc) }} FCFA</p>
                <p><strong>Frais Médicaux (FM):</strong> {{ formatNumber(formModel.primes.fm) }} FCFA</p>
                <p><strong>Prime Unique TTC (PUTTC):</strong> <span class="text-success fw-bold">{{ formatNumber(formModel.primes.puttc) }} FCFA</span></p>
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
            <p class="mb-3">Le client et le contrat ont été créés avec succès. Vous pouvez maintenant télécharger le PDF du contrat.</p>
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
          <button v-if="currentStep > 1" type="button" class="btn btn-outline-primary" @click="prevStep">
            <i class="fas fa-arrow-left me-2"></i>
            Précédent
          </button>
        </div>
        <div>
          <button 
            v-if="currentStep < 3" 
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
            {{ isSubmitting ? 'Création...' : 'Créer' }}
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
import { error, success, calculateDateEcheance, extractFilenameFromResponse } from '../../utils/utils';
import JwtService from '../../services/JwtService';
import {
  dateEffetSchema,
  datePremiereEcheanceSchema,
  dateEcheanceSchema,
  handleValidateDatePremiereEcheance,
  handleValidateDateEcheance,
  getMinDateEcheance as getMinDateEcheanceUtil
} from '../../utils/dateValidations';

export default defineComponent({
  name: 'CreateHorsConventionWithCustomer',
  components: { Form, Field, ErrorMessage, Modal },
  props: {
    visible: { type: Boolean, default: false }
  },
  emits: ['create-success','close','update:visible'],
  setup(props, { emit }) {
    const formRef = ref<any>(null);
    const currentStep = ref(1);
    const isSubmitting = ref(false);
    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    const natureCredits = ref<any[]>([]);
    const loadingNatureCredits = ref(false);
    const typeCustomers = ref<any[]>([]);
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
      client: {
        firstname: '',
        lastname: '',
        numCustomer: '',
        phone: '',
        email: '',
        gender: '',
        birthdate: '',
        placeOfBirth: '',
        occupation: '',
        address: '',
        idTypeCustomer: ''
      },
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
      client: Yup.object({
        firstname: Yup.string().required('Le prénom est obligatoire').min(2, 'Le prénom doit contenir au moins 2 caractères'),
        lastname: Yup.string().required('Le nom est obligatoire').min(2, 'Le nom doit contenir au moins 2 caractères'),
        numCustomer: Yup.string().required('Le numéro de client est obligatoire'),
        phone: Yup.string().required('Le téléphone est obligatoire').matches(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide'),
        email: Yup.string().email('Format d\'email invalide').nullable(),
        gender: Yup.string().required('Le genre est obligatoire').oneOf(['M', 'F'], 'Genre invalide'),
        birthdate: Yup.string()
          .required('La date de naissance est obligatoire')
          .test('not-future', 'La date de naissance ne peut pas être dans le futur', function(value) {
            if (!value) return true;
            return new Date(value) <= new Date();
          }),
        placeOfBirth: Yup.string().required('Le lieu de naissance est obligatoire').min(2, 'Le lieu de naissance doit contenir au moins 2 caractères'),
        occupation: Yup.string().required('La profession est obligatoire').min(2, 'La profession doit contenir au moins 2 caractères'),
        address: Yup.string().required('L\'adresse est obligatoire').min(5, 'L\'adresse doit contenir au moins 5 caractères'),
        idTypeCustomer: Yup.string().required('Le type de client est obligatoire')
      }),
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

    const loadTypeCustomers = async () => {
      try {
        const response = await ApiService.get('/type-customers');
        const raw = response.data?.data?.data || response.data?.data || response.data;
        if (Array.isArray(raw)) {
          typeCustomers.value = raw;
        } else {
          typeCustomers.value = [
            { id: 1, libelle: 'PARTICULIER' },
            { id: 2, libelle: 'PERSONNEL RENACA' }
          ];
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des types de client:', err);
        typeCustomers.value = [
          { id: 1, libelle: 'PARTICULIER' },
          { id: 2, libelle: 'PERSONNEL RENACA' }
        ];
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

    const validateDatePremiereEcheance = (event: Event) => {
      datePremiereEcheanceManuallyEdited.value = true;
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    };

    const validateDateEcheance = (event: Event) => {
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
          // Calculer automatiquement la date d'échéance
          calculateDateEcheanceAuto();
        }
      }
    };

    // Fonction pour calculer automatiquement la PUTTC
    const calculatePutcc = () => {
      const pd = validateNumericValue(formModel.value.primes.pd, 0);
      const pc = validateNumericValue(formModel.value.primes.pc, 0);
      const surp = validateNumericValue(formModel.value.primes.surp, 0);
      const acc = validateNumericValue(formModel.value.primes.acc, 0);
      const fm = validateNumericValue(formModel.value.primes.fm, 0);
      
      const total = pd + pc + surp + acc + fm;
      formModel.value.primes.puttc = total;
    };

    // Fonction pour valider et nettoyer les valeurs numériques
    const validateNumericValue = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? defaultValue : numValue;
    };

    // Fonction pour gérer la saisie des primes
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
      
      // Recalculer PUTTC après modification
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

    // Fonction de validation des champs requis par étape
    const validateCurrentStep = (): boolean => {
      const step = currentStep.value;
      const missingFields: string[] = [];
      
      if (step === 1) {
        // Validation étape 1: Informations client
        const client = formModel.value.client;
        
        if (!client.firstname?.trim()) missingFields.push('Prénom');
        if (!client.lastname?.trim()) missingFields.push('Nom');
        if (!client.numCustomer?.trim()) missingFields.push('Numéro de client');
        if (!client.phone?.trim()) missingFields.push('Téléphone');
        if (!client.gender) missingFields.push('Genre');
        if (!client.birthdate) missingFields.push('Date de naissance');
        if (!client.placeOfBirth?.trim()) missingFields.push('Lieu de naissance');
        if (!client.occupation?.trim()) missingFields.push('Profession');
        if (!client.address?.trim()) missingFields.push('Adresse');
        if (!client.idTypeCustomer) missingFields.push('Type de client');
        
        if (missingFields.length > 0) {
          stepValidationError.value = `Champs manquants : ${missingFields.join(', ')}`;
          return false;
        }
      } else if (step === 2) {
        // Validation étape 2: Informations contrat
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

        // Validation des primes
        if (primes.pd === null || primes.pd === undefined || Number(primes.pd) < 0) missingFields.push('Prime Décès (PD)');
        if (primes.surp === null || primes.surp === undefined || Number(primes.surp) < 0) missingFields.push('Surprime (SURP)');
        if (primes.acc === null || primes.acc === undefined || Number(primes.acc) < 0) missingFields.push('Accessoires (ACC)');
        if (primes.fm === null || primes.fm === undefined || Number(primes.fm) < 0) missingFields.push('Frais Médicaux (FM)');
        if (!primes.puttc || Number(primes.puttc) <= 0) missingFields.push('Prime Unique TTC (PUTTC)');
        
        if (missingFields.length > 0) {
          stepValidationError.value = `Champs manquants : ${missingFields.join(', ')}`;
          return false;
        }
      }
      
      stepValidationError.value = '';
      return true;
    };

    // Computed pour vérifier si l'étape actuelle est valide (version optimisée sans message d'erreur)
    const isCurrentStepValid = computed(() => {
      const step = currentStep.value;
      
      if (step === 1) {
        const client = formModel.value.client;
        return !!(client.firstname?.trim() && 
                  client.lastname?.trim() && 
                  client.numCustomer?.trim() && 
                  client.phone?.trim() && 
                  client.gender && 
                  client.birthdate && 
                  client.placeOfBirth?.trim() && 
                  client.occupation?.trim() && 
                  client.address?.trim() && 
                  client.idTypeCustomer);
      } else if (step === 2) {
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
      }
      return true;
    });

    const nextStep = async () => { 
      // Valider les champs requis avant de passer à l'étape suivante
      if (!validateCurrentStep()) {
        return;
      }
      
      // Effacer l'erreur de validation si la validation réussit
      stepValidationError.value = '';
      
      if (currentStep.value === 1) {
        // Passer à l'étape 2, charger les périodicités si nécessaire
        if (periodicites.value.length === 0) {
          await loadPeriodicites();
        }
        // Calculer la date d'échéance automatiquement
        nextTick(() => {
          if (periodicites.value.length > 0 && !dateEcheanceManuallyEdited.value) {
            calculateDateEcheanceAuto();
          }
        });
      }
      currentStep.value++; 
    };
    const prevStep = () => { 
      stepValidationError.value = '';
      currentStep.value--; 
    };
    const closeModal = () => { 
      dateEcheanceManuallyEdited.value = false;
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
        
        // Utiliser la même méthode que dans CotationToContratModal.vue
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contractId}/pdf`, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          }
        });

        // Vérifier que c'est bien un blob
        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        // Créer un blob PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Extraire le nom de fichier du header Content-Disposition
        const filename = extractFilenameFromResponse(response, `contrat_${contractId}.pdf`);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        // Télécharger
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Nettoyer
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
      
      // Valider le formulaire avant de soumettre
      if (formRef.value) {
        try {
          // Synchroniser les valeurs avec VeeValidate avant la validation
          // VeeValidate utilise son propre état interne, donc on doit mettre à jour les valeurs
          if ((formRef.value as any).setValues) {
            (formRef.value as any).setValues(formModel.value);
          }
          
          // Attendre un peu pour que la synchronisation se fasse
          await nextTick();
          
          // Valider le formulaire avec VeeValidate
          const validationResult = await formRef.value.validate();
          
          // Vérifier si la validation a échoué
          if (!validationResult || !validationResult.valid) {
            // Essayer d'accéder aux erreurs de différentes manières
            let errors: any = {};
            
            // Méthode 1: Depuis le résultat de validation
            if (validationResult && validationResult.errors) {
              errors = validationResult.errors;
            }
            // Méthode 2: Depuis formRef directement
            else if ((formRef.value as any).errors) {
              errors = (formRef.value as any).errors;
            }
            // Méthode 3: Depuis formRef.meta.errors
            else if ((formRef.value as any).meta && (formRef.value as any).meta.errors) {
              errors = (formRef.value as any).meta.errors;
            }
            
            const errorFields = Object.keys(errors);
            
            console.log('🔍 Résultat de validation:', validationResult);
            console.log('🔍 FormRef:', formRef.value);
            console.log('🔍 Erreurs détectées:', errors);
            console.log('🔍 Champs en erreur:', errorFields);
            console.log('🔍 État du formulaire:', formModel.value);
            
            if (errorFields.length > 0) {
              // Afficher les premiers champs en erreur avec leurs messages
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
              // Si pas d'erreurs spécifiques mais validation échouée, utiliser la validation manuelle
              // La validation manuelle est la source de vérité principale
              if (!validateCurrentStep()) {
                error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
                return;
              }
              // Si la validation manuelle passe, on continue malgré l'échec de VeeValidate
              // (problème de synchronisation entre v-model et VeeValidate)
              console.warn('⚠️ Validation VeeValidate échouée mais validation manuelle OK. Continuons avec la validation manuelle...');
            }
          }
        } catch (validationError: any) {
          console.error('❌ Erreur lors de la validation VeeValidate:', validationError);
          // En cas d'erreur, utiliser la validation manuelle comme fallback
          // La validation manuelle est la source de vérité principale
          if (!validateCurrentStep()) {
            error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
            return;
          }
          // Si la validation manuelle passe, on continue
          console.warn('⚠️ Erreur de validation VeeValidate mais validation manuelle OK. Continuons...');
        }
      }
      
      // Valider manuellement les étapes avant de soumettre (double vérification)
      if (!validateCurrentStep()) {
        error(stepValidationError.value || 'Veuillez remplir tous les champs requis');
        return;
      }
      
      isSubmitting.value = true;
      try {
        // Préparer les données du client
        const clientData = {
          firstname: formModel.value.client.firstname.trim().toUpperCase(),
          lastname: formModel.value.client.lastname.trim().toUpperCase(),
          numCustomer: formModel.value.client.numCustomer.trim(),
          phone: formModel.value.client.phone.trim(),
          email: formModel.value.client.email?.trim().toLowerCase() || null,
          gender: formModel.value.client.gender,
          birthdate: formModel.value.client.birthdate,
          placeOfBirth: formModel.value.client.placeOfBirth?.trim().toUpperCase() || null,
          occupation: formModel.value.client.occupation.trim().toUpperCase(),
          address: formModel.value.client.address?.trim().toUpperCase() || null,
          idTypeCustomer: parseInt(formModel.value.client.idTypeCustomer)
        };

        // Préparer les données du contrat
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
          // Primes d'assurance
          pd: validateNumericValue(formModel.value.primes.pd, 0),
          pc: validateNumericValue(formModel.value.primes.pc, 0),
          surp: validateNumericValue(formModel.value.primes.surp, 0),
          acc: validateNumericValue(formModel.value.primes.acc, 0),
          fm: validateNumericValue(formModel.value.primes.fm, 0),
          puttc: validateNumericValue(formModel.value.primes.puttc, 0),
          // Données du client pour création simultanée
          clientData: clientData
        };

        // Appel unique au nouvel endpoint qui crée le client et le contrat
        const response = await ApiService.post('/contracts/hors-convention-with-customer', contractPayload);
        
        // Gérer la structure de réponse encapsulée par l'intercepteur
        // Structure possible: { code: 200/400/500, message: '...', data: { success: true/false, message: '...', contract: {...}, customer: {...} }, timestamp: '...' }
        let result = response?.data;
        
        // Si la réponse a une structure data.data, l'utiliser
        if (result?.data && typeof result.data === 'object') {
          result = result.data;
        }
        
        console.log('📥 Réponse complète:', response);
        console.log('📥 result:', result);
        
        // Vérifier si la réponse indique un succès
        if (!result || result.success === false) {
          // Extraire le message d'erreur de différentes structures possibles
          const errorMessage = result?.message || 
                              response?.data?.message || 
                              'Erreur lors de la création du client et du contrat';
          throw new Error(errorMessage);
        }

        const contract = result.contract;
        const customer = result.customer || contract?.customer;
        
        if (!contract) throw new Error('Contrat non créé');
        if (!customer) throw new Error('Client non créé');

        // Stocker l'ID du contrat pour le téléchargement
        createdContractId.value = contract.id;
        creationSuccess.value = true;
        
        // Utiliser le message de succès du backend s'il existe, sinon créer un message par défaut
        const successMessage = result.message || 
                              `Client et contrat "${contract.reference || contract.id}" créés avec succès !`;
        creationMessage.value = successMessage;
        
        // Afficher une notification de succès
        success(successMessage);
        
        // Émettre l'événement de succès
        emit('create-success', { client: customer, contract });
        
        // Ne pas fermer automatiquement le modal - permettre le téléchargement du PDF
      } catch (err: any) {
        console.error('❌ Erreur création client+contrat:', err);
        console.error('❌ Structure de l\'erreur:', {
          message: err?.message,
          response: err?.response?.data,
          responseData: err?.response?.data?.data
        });
        
        // Extraire le message d'erreur de différentes structures possibles
        let errorMessage = 'Erreur lors de la création du client et du contrat';
        
        // Gérer la structure encapsulée response.data.data
        if (err?.response?.data?.data?.message) {
          errorMessage = err.response.data.data.message;
        } else if (err?.response?.data?.data?.success === false && err?.response?.data?.data?.message) {
          errorMessage = err.response.data.data.message;
        } else if (err?.response?.data?.message) {
          // Erreur HTTP (400, 500, etc.) ou dans response.data directement
          errorMessage = err.response.data.message;
        } else if (err?.response?.data?.success === false && err?.response?.data?.message) {
          // Erreur dans le body avec success: false
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          // Erreur lancée manuellement (throw new Error)
          errorMessage = err.message;
        }
        
        error(errorMessage);
      } finally {
        isSubmitting.value = false;
      }
    };

    // Fonction utilitaire pour formater les dates
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

    // Fonction utilitaire pour formater les nombres
    const formatNumber = (value: number | string | null | undefined): string => {
      if (value === null || value === undefined || value === '') return '0';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0';
      return new Intl.NumberFormat('fr-FR').format(num);
    };

    // Watchers pour recalculer automatiquement la date d'échéance
    watch(() => formModel.value.contrat.datePremiereEcheance, (newDate, oldDate) => {
      if (newDate && newDate !== oldDate && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => formModel.value.contrat.duration, (newDuration, oldDuration) => {
      if (newDuration && newDuration !== oldDuration && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => formModel.value.contrat.idPeriodicite, (newPeriodicite, oldPeriodicite) => {
      if (newPeriodicite && newPeriodicite !== oldPeriodicite && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    // Watcher pour recalculer PUTTC quand le modal s'ouvre
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        // Réinitialiser PUTTC au chargement
        nextTick(() => {
          calculatePutcc();
        });
      }
    });

    // Watchers pour recalculer PUTTC quand les primes changent
    watch(() => formModel.value.primes.pd, () => {
      calculatePutcc();
    });

    watch(() => formModel.value.primes.pc, () => {
      calculatePutcc();
    });

    watch(() => formModel.value.primes.surp, () => {
      calculatePutcc();
    });

    watch(() => formModel.value.primes.acc, () => {
      calculatePutcc();
    });

    watch(() => formModel.value.primes.fm, () => {
      calculatePutcc();
    });

    // Charger les périodicités au montage et initialiser PUTTC
    onMounted(() => {
      loadPeriodicites();
      loadNatureCredits();
      loadTypeCustomers();
      calculatePutcc();
    });

    return { 
      formRef,
      currentStep, 
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
      periodicites,
      loadingPeriodicites,
      natureCredits,
      loadingNatureCredits,
      natureCreditCode,
      typeCustomers,
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
.create-hc-with-client .card { border-radius: 8px; }

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

/* Responsive pour le footer */
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
}
</style>


