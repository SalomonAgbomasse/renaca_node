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
        <strong>Attention :</strong> L'âge du client doit être compris entre 18 et {{ (creditType === 'CP' || creditType === 'OBA') ? 75 : 70 }} ans pour effectuer une cotation.
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
              <i v-if="(nc.code||'').toUpperCase()==='CP'" class="fas fa-shield-alt"></i>
              <i v-else-if="(nc.code||'').toUpperCase()==='OBA'" class="fas fa-hands-helping"></i>
              <i v-else-if="(nc.code||'').toUpperCase()==='AMORT'" class="fas fa-chart-line"></i>
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

        <!-- CP : 2 options capital fixes + info produit -->
        <template v-if="isCPMode">
          <div class="col-md-7">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">Capital (FCFA) <span class="text-danger">*</span></label>
              <Field name="capital" as="select" v-model="cotationForm.capital" class="form-control shadow-none fs-md-15 text-black" :disabled="!isAgeValid" style="height:46px;">
                <option :value="500000">Option 1 – 500 000 FCFA</option>
                <option :value="1000000">Option 2 – 1 000 000 FCFA</option>
              </Field>
              <ErrorMessage name="capital" class="text-danger"/>
            </div>
          </div>
          <div class="col-md-5">
            <div class="product-info-box h-100 d-flex align-items-center">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fas fa-shield-alt text-fnda"></i>
                  <strong class="text-fnda small">PADME PROTECTION</strong>
                </div>
                <p class="mb-0 text-muted" style="font-size:0.78rem;">Assurance décès liée à un compte épargne. Capital fixe selon l'option choisie.</p>
              </div>
            </div>
          </div>
        </template>

        <!-- OBA : Combinatorial insured choice -->
        <template v-else-if="isOBAMode">
          <div class="col-12 mb-4">
            <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h6 class="text-black fw-semibold mb-1">Choix des Assurés pour Obsèques Alafia</h6>
                <p class="text-muted small mb-0">Cochez les assurés à inclure dans la couverture. Âge max : 65 ans (Assuré/Conjoint), 75 ans (Ascendants).</p>
              </div>
              <div class="alert alert-info px-4 py-2 shadow-sm rounded-pill border-2 border-info d-inline-flex align-items-center mb-0">
                <i class="fas fa-shield-alt me-2 text-info fs-5"></i>
                <span class="fs-15 fw-bold text-info-emphasis">Total Capital Assuré : <span class="fs-17 text-dark ms-1">{{ obaMainCapital.toLocaleString('fr-FR') }} FCFA</span></span>
              </div>
            </div>
            
            <Field name="capital" type="hidden" v-model="obaMainCapital" />

            <div class="row">
              <!-- Groupe Assuré -->
              <div class="col-md-6">
                <div class="border-bottom pb-2 mb-3">
                  <h6 class="text-black fw-bold mb-0">
                    <i class="fas fa-user-circle text-primary me-2"></i>Groupe Assuré
                  </h6>
                </div>

                <!-- Assuré -->
                <div class="card p-2 border-2 mb-3" :class="obaSelectedOptions.assure.checked ? (isObaOptionAgeValid('assure') ? 'border-primary' : 'border-danger') : 'border-light-subtle'">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-assure" v-model="obaSelectedOptions.assure.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-assure">
                        Assuré
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.assure.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm bg-light" v-model="obaSelectedOptions.assure.birthdate" disabled />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.assure.checked && obaSelectedOptions.assure.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('assure') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.assure.birthdate) }} ans
                    </span>
                  </div>
                </div>

                <!-- Père Assuré -->
                <div class="card p-2 border-2 mb-3" :class="[
                  obaSelectedOptions.ascendant1.checked ? (isObaOptionAgeValid('ascendant1') ? 'border-primary' : 'border-danger') : 'border-light-subtle',
                  !obaSelectedOptions.assure.checked ? 'bg-light text-muted opacity-50' : ''
                ]">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant1" v-model="obaSelectedOptions.ascendant1.checked" :disabled="!obaSelectedOptions.assure.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant1">
                        Père Assuré
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant1.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant1.birthdate" />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.ascendant1.checked && obaSelectedOptions.ascendant1.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('ascendant1') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.ascendant1.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant1') && calculateAge(obaSelectedOptions.ascendant1.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant1.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgé)
                      </span>
                    </span>
                  </div>
                </div>

                <!-- Mère Assuré -->
                <div class="card p-2 border-2 mb-3" :class="[
                  obaSelectedOptions.ascendant2.checked ? (isObaOptionAgeValid('ascendant2') ? 'border-primary' : 'border-danger') : 'border-light-subtle',
                  !obaSelectedOptions.assure.checked ? 'bg-light text-muted opacity-50' : ''
                ]">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant2" v-model="obaSelectedOptions.ascendant2.checked" :disabled="!obaSelectedOptions.assure.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant2">
                        Mère Assuré
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant2.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant2.birthdate" />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.ascendant2.checked && obaSelectedOptions.ascendant2.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('ascendant2') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.ascendant2.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant2') && calculateAge(obaSelectedOptions.ascendant2.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant2.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgée)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Groupe Conjoint -->
              <div class="col-md-6">
                <div class="border-bottom pb-2 mb-3">
                  <h6 class="text-black fw-bold mb-0">
                    <i class="fas fa-user-friends text-primary me-2"></i>Groupe Conjoint(e)
                  </h6>
                </div>

                <!-- Conjoint -->
                <div class="card p-2 border-2 mb-3" :class="obaSelectedOptions.conjoint.checked ? (isObaOptionAgeValid('conjoint') ? 'border-primary' : 'border-danger') : 'border-light-subtle'">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-conjoint" v-model="obaSelectedOptions.conjoint.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-conjoint">
                        Conjoint(e)
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.conjoint.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.conjoint.birthdate" />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.conjoint.checked && obaSelectedOptions.conjoint.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('conjoint') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.conjoint.birthdate) }} ans
                    </span>
                  </div>
                </div>

                <!-- Père Conjoint -->
                <div class="card p-2 border-2 mb-3" :class="[
                  obaSelectedOptions.ascendant3.checked ? (isObaOptionAgeValid('ascendant3') ? 'border-primary' : 'border-danger') : 'border-light-subtle',
                  !obaSelectedOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
                ]">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant3" v-model="obaSelectedOptions.ascendant3.checked" :disabled="!obaSelectedOptions.conjoint.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant3">
                        Père Conjoint(e)
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant3.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant3.birthdate" />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.ascendant3.checked && obaSelectedOptions.ascendant3.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('ascendant3') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.ascendant3.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant3') && calculateAge(obaSelectedOptions.ascendant3.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant3.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgé)
                      </span>
                    </span>
                  </div>
                </div>

                <!-- Mère Conjoint -->
                <div class="card p-2 border-2 mb-3" :class="[
                  obaSelectedOptions.ascendant4.checked ? (isObaOptionAgeValid('ascendant4') ? 'border-primary' : 'border-danger') : 'border-light-subtle',
                  !obaSelectedOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
                ]">
                  <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                    <div class="form-check mb-0">
                      <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant4" v-model="obaSelectedOptions.ascendant4.checked" :disabled="!obaSelectedOptions.conjoint.checked" />
                      <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant4">
                        Mère Conjoint(e)
                      </label>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant4.checked" class="flex-grow-1" style="max-width: 160px;">
                      <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant4.birthdate" />
                    </div>
                  </div>
                  <div v-if="obaSelectedOptions.ascendant4.checked && obaSelectedOptions.ascendant4.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                    <span class="small" :class="isObaOptionAgeValid('ascendant4') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(obaSelectedOptions.ascendant4.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant4') && calculateAge(obaSelectedOptions.ascendant4.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant4.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgée)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </template>

        <!-- AMORT : champs complets -->
        <template v-else>
          <!-- Capital -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">Capital (FCFA) <span class="text-danger">*</span></label>
              <Field
                name="capital"
                v-model="cotationForm.capital"
                type="number"
                class="form-control shadow-none fs-md-15 text-black"
                :min="1" :max="getMaxCapital()" :disabled="!isAgeValid"
                required @input="handleCapitalChange" @blur="handleCapitalChange"
              />
              <ErrorMessage name="capital" class="text-danger"/>
              <small class="form-text text-muted"><i class="fas fa-info-circle me-1"></i>Capital maximum : 10 000 000 FCFA</small>
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

          <!-- Différé -->
          <div class="col-md-6">
            <div class="form-group mb-15 mb-sm-20 mb-md-25">
              <label class="d-block text-black fw-semibold mb-10">Différé (en mois) <span class="text-danger">*</span></label>
              <Field name="differe" v-model="cotationForm.differe" as="select" class="form-control shadow-none fs-md-15 text-black" :disabled="!isAgeValid" required>
                <option v-for="i in 7" :key="i - 1" :value="i - 1">{{ i - 1 }} mois</option>
              </Field>
              <ErrorMessage name="differe" class="text-danger"/>
              <small class="form-text text-muted"><i class="fas fa-info-circle me-1"></i>Différé de 0 à 6 mois</small>
            </div>
          </div>
        </template>

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
    const isCPMode = computed(() => (creditType.value || '').toUpperCase() === 'CP');
    const isOBAMode = computed(() => (creditType.value || '').toUpperCase() === 'OBA');

    const obaSelectedOptions = ref({
      assure: { checked: true, birthdate: '' },
      conjoint: { checked: false, birthdate: '' },
      ascendant1: { checked: false, birthdate: '' },
      ascendant2: { checked: false, birthdate: '' },
      ascendant3: { checked: false, birthdate: '' },
      ascendant4: { checked: false, birthdate: '' }
    });

    const obaMainCapital = computed(() => {
      let total = 0;
      if (obaSelectedOptions.value.assure.checked) total += 500000;
      if (obaSelectedOptions.value.conjoint.checked) total += 500000;
      if (obaSelectedOptions.value.ascendant1.checked) total += 500000;
      if (obaSelectedOptions.value.ascendant2.checked) total += 500000;
      if (obaSelectedOptions.value.ascendant3.checked) total += 500000;
      if (obaSelectedOptions.value.ascendant4.checked) total += 500000;
      return total;
    });

    const obaMainBirthdate = computed(() => {
      if (obaSelectedOptions.value.assure.checked && obaSelectedOptions.value.assure.birthdate) {
        return obaSelectedOptions.value.assure.birthdate;
      }
      if (obaSelectedOptions.value.conjoint.checked && obaSelectedOptions.value.conjoint.birthdate) {
        return obaSelectedOptions.value.conjoint.birthdate;
      }
      if (obaSelectedOptions.value.ascendant1.checked && obaSelectedOptions.value.ascendant1.birthdate) {
        return obaSelectedOptions.value.ascendant1.birthdate;
      }
      if (obaSelectedOptions.value.ascendant2.checked && obaSelectedOptions.value.ascendant2.birthdate) {
        return obaSelectedOptions.value.ascendant2.birthdate;
      }
      if (obaSelectedOptions.value.ascendant3.checked && obaSelectedOptions.value.ascendant3.birthdate) {
        return obaSelectedOptions.value.ascendant3.birthdate;
      }
      if (obaSelectedOptions.value.ascendant4.checked && obaSelectedOptions.value.ascendant4.birthdate) {
        return obaSelectedOptions.value.ascendant4.birthdate;
      }
      return '';
    });

    watch([obaMainCapital, obaMainBirthdate], ([newCapital, newBirthdate]) => {
      if (creditType.value === 'OBA') {
        cotationForm.value.capital = newCapital;
      }
    }, { immediate: true });

    watch(() => obaSelectedOptions.value.assure.checked, (val) => {
      if (!val) {
        obaSelectedOptions.value.ascendant1.checked = false;
        obaSelectedOptions.value.ascendant2.checked = false;
      }
    });

    watch(() => obaSelectedOptions.value.conjoint.checked, (val) => {
      if (!val) {
        obaSelectedOptions.value.ascendant3.checked = false;
        obaSelectedOptions.value.ascendant4.checked = false;
      }
    });

    watch(() => props.clientData, (newClientData) => {
      if (newClientData && newClientData.birthdate) {
        const formattedBirthdate = newClientData.birthdate.split('T')[0];
        obaSelectedOptions.value.assure.birthdate = formattedBirthdate;
      }
    }, { immediate: true });

    // Périodicités
    const periodicites = ref<Array<{id: number, libelle: string, code: string, nombreMois: number}>>([]);
    const loadingPeriodicites = ref(false);

    // Formulaire de cotation
    const cotationForm = ref({
      duration: 12,
      capital: 5000000, // Valeur par défaut : 5M (inférieure au maximum de 10M)
      garantieCompl: 'NON',
      idPeriodicite: null as number | null,
      differe: 0
    });

    // Fonction pour obtenir la durée maximale selon l'âge
    const getMaxDuration = (): number => {
      if (!props.clientData?.birthdate) return 60;
      
      const age = calculateAge(props.clientData.birthdate);
      
      // Règles selon l'âge
      if (age >= 65 && age <= 70) {
        return 12; // 65-70 ans : max 12 mois
      }
      return 60; // 18-65 ans : max 60 mois
    };

    // Schéma de validation
    const cotationSchema = computed(() => {
      const isCPorOBA = (creditType.value || '').toUpperCase() === 'CP' || (creditType.value || '').toUpperCase() === 'OBA';
      return Yup.object().shape({
        duration: isCPorOBA
          ? Yup.number().nullable().optional()
          : Yup.number()
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
          .max(10000000, 'Le capital maximum est de 10 000 000 FCFA'),
        idPeriodicite: isCPorOBA
          ? Yup.number().nullable().optional()
          : Yup.number()
              .required('La périodicité est obligatoire')
              .min(1, 'Veuillez sélectionner une périodicité'),
        differe: isCPorOBA
          ? Yup.number().nullable().optional()
          : Yup.number()
              .required('Le différé est obligatoire')
              .min(0, 'Le différé doit être d\'au moins 0 mois')
              .max(6, 'Le différé maximum est de 6 mois'),
        garantieCompl: isCPorOBA
          ? Yup.string().nullable().optional()
          : Yup.string()
              .oneOf(['NON'], "La garantie perte d'emploi n'est pas disponible pour PADME")
              .default('NON')
      });
    });

    // Computed pour vérifier l'âge
    const clientAge = computed(() => {
      if (!props.clientData?.birthdate) return 0;
      return calculateAge(props.clientData.birthdate);
    });

    const isAgeValid = computed(() => {
      if (isOBAMode.value) return true; // Validated per option on backend/frontend
      const age = clientAge.value;
      const maxAge = creditType.value === 'CP' ? 75 : 70;
      return age >= 18 && age <= maxAge;
    });

    // Computed
    const isFormValid = computed(() => {
      if (!isAgeValid.value) return false;

      if (isCPMode.value) {
        return !!(cotationForm.value.capital && cotationForm.value.capital > 0);
      }

      if (isOBAMode.value) {
        const keys = ['assure', 'conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4'];
        let checkedCount = 0;
        for (const key of keys) {
          const opt = (obaSelectedOptions.value as any)[key];
          if (opt && opt.checked) {
            checkedCount++;
            if (!isObaOptionAgeValid(key)) return false;
          }
        }
        if (checkedCount === 0) return false;
        return !!(cotationForm.value.capital && cotationForm.value.capital > 0);
      }

      // AMORT : tous les champs requis
      return !!(cotationForm.value.duration &&
             cotationForm.value.capital &&
             cotationForm.value.idPeriodicite &&
             cotationForm.value.differe !== null &&
             cotationForm.value.differe !== undefined);
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
        differe: 0
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
      selectedNatureCreditId.value = nc ? nc.id : (code === 'AMORT' ? 1 : code === 'CP' ? 2 : 3);
      // Reset capital selon le mode
      if (code === 'CP') {
        cotationForm.value.capital = 500000;
        cotationForm.value.idPeriodicite = null;
        cotationForm.value.duration = 12;
        cotationForm.value.differe = 0;
      } else if (code === 'OBA') {
        obaSelectedOptions.value.assure.checked = true;
        obaSelectedOptions.value.conjoint.checked = false;
        obaSelectedOptions.value.ascendant1.checked = false;
        obaSelectedOptions.value.ascendant2.checked = false;
        obaSelectedOptions.value.ascendant3.checked = false;
        obaSelectedOptions.value.ascendant4.checked = false;
        if (props.clientData?.birthdate) {
          obaSelectedOptions.value.assure.birthdate = props.clientData.birthdate.split('T')[0];
        }
        cotationForm.value.capital = obaMainCapital.value;
        cotationForm.value.idPeriodicite = null;
        cotationForm.value.duration = 12;
        cotationForm.value.differe = 0;
      } else {
        cotationForm.value.capital = 5000000;
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
            { id: 2, libelle: 'PADME PROTECTION', code: 'CP' },
            { id: 3, libelle: 'OBSEQUES ALAFIA', code: 'OBA' }
          ];
        }
        // Filtrer uniquement AMORT, CP, OBA
        natureCredits.value = natureCredits.value.filter((nc: any) =>
          nc.code === 'AMORT' || nc.code === 'CP' || nc.code === 'OBA'
        );
        // Initialiser l'ID sélectionné
        const current = natureCredits.value.find((n: any) => n.code === creditType.value);
        if (current) selectedNatureCreditId.value = current.id;
      } catch (err: any) {
        console.error('❌ Erreur chargement natures de crédit:', err);
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
          { id: 2, libelle: 'PADME PROTECTION', code: 'CP' },
          { id: 3, libelle: 'OBSEQUES ALAFIA', code: 'OBA' }
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
      const maxAge = (creditType.value === 'CP' || creditType.value === 'OBA') ? 75 : 70;
      
      // Vérifier l'âge d'abord
      if (age < 18 || age > maxAge) {
        cotationForm.value.duration = 0;
        error(`L'âge du client doit être compris entre 18 et ${maxAge} ans pour effectuer une cotation.`);
        return;
      }
      
      // Durée maximale selon l'âge
      const maxDuration = getMaxDuration();
      
      if (maxDuration === 0) {
        cotationForm.value.duration = 0;
        error(`L'âge du client doit être compris entre 18 et ${maxAge} ans pour effectuer une cotation.`);
        return;
      }
      
      if (cotationForm.value.duration > maxDuration) {
        cotationForm.value.duration = maxDuration;
        const ageRange = age >= 65 ? '65-70 ans' : '18-64 ans';
        error(`Pour un client de ${ageRange}, la durée est limitée à ${maxDuration} mois maximum. Valeur ajustée à ${maxDuration} mois.`);
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

    const isObaOptionAgeValid = (key: string): boolean => {
      const opt = (obaSelectedOptions.value as any)[key];
      if (!opt || !opt.checked || !opt.birthdate) return true;
      
      const age = calculateAge(opt.birthdate);
      
      // 1. Check absolute min/max limits
      const maxAge = (key === 'assure' || key === 'conjoint') ? 65 : 75;
      if (age < 18 || age > maxAge) return false;
      
      // 2. Check generational age gaps
      if (key === 'ascendant1' || key === 'ascendant2') {
        const childAge = obaSelectedOptions.value.assure.checked && obaSelectedOptions.value.assure.birthdate
          ? calculateAge(obaSelectedOptions.value.assure.birthdate)
          : 0;
        if (age <= childAge) return false;
      }
      
      if (key === 'ascendant3' || key === 'ascendant4') {
        const childAge = obaSelectedOptions.value.conjoint.checked && obaSelectedOptions.value.conjoint.birthdate
          ? calculateAge(obaSelectedOptions.value.conjoint.birthdate)
          : 0;
        if (age <= childAge) return false;
      }
      
      return true;
    };

    const isObaAgesValid = computed(() => {
      if (creditType.value !== 'OBA') return true;
      const keys = ['assure', 'conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4'];
      for (const key of keys) {
        const opt = (obaSelectedOptions.value as any)[key];
        if (opt && opt.checked) {
          if (!isObaOptionAgeValid(key)) return false;
        }
      }
      return true;
    });

    const getMaxCapital = (): number => {
      // Capital maximum fixé à 10 millions FCFA pour tous les clients
      return 10000000;
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
      
      const maxCapital = getMaxCapital();
      const age = calculateAge(props.clientData?.birthdate || '');
      const maxAge = (creditType.value === 'CP' || creditType.value === 'OBA') ? 75 : 70;
      
      if (age < 18 || age > maxAge) {
        cotationForm.value.capital = 0;
        error(`L'âge du client doit être compris entre 18 et ${maxAge} ans pour effectuer une cotation.`);
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

        // Si OBA, valider les contraintes d'âge de chaque assuré coché
        if (isOBAMode.value) {
          const configOBA = {
            assure: { label: "l'Assuré", maxSubAge: 65 },
            conjoint: { label: "le (la) Conjoint(e)", maxSubAge: 65 },
            ascendant1: { label: "le Père de l'Assuré", maxSubAge: 75 },
            ascendant2: { label: "la Mère de l'Assuré", maxSubAge: 75 },
            ascendant3: { label: "le Père du (de la) Conjoint(e)", maxSubAge: 75 },
            ascendant4: { label: "la Mère du (de la) Conjoint(e)", maxSubAge: 75 }
          };

          let checkedCount = 0;
          for (const [key, cfg] of Object.entries(configOBA)) {
            const opt = (obaSelectedOptions.value as any)[key];
            if (opt && opt.checked) {
              checkedCount++;
              if (!opt.birthdate) {
                error(`La date de naissance est obligatoire pour ${cfg.label}.`);
                return;
              }
              const age = calculateAge(opt.birthdate);
              if (age < 18 || age > cfg.maxSubAge) {
                error(`L'âge pour ${cfg.label} (${age} ans) doit être compris entre 18 et ${cfg.maxSubAge} ans.`);
                return;
              }
            }
          }

          if (checkedCount === 0) {
            error("Vous devez cocher au moins un assuré pour Obsèques Alafia.");
            return;
          }

          // Validation de l'écart d'âge générationnel (min 15 ans de différence)
          const assureAge = obaSelectedOptions.value.assure.checked && obaSelectedOptions.value.assure.birthdate
            ? calculateAge(obaSelectedOptions.value.assure.birthdate)
            : 0;
            
          const conjointAge = obaSelectedOptions.value.conjoint.checked && obaSelectedOptions.value.conjoint.birthdate
            ? calculateAge(obaSelectedOptions.value.conjoint.birthdate)
            : 0;

          if (obaSelectedOptions.value.ascendant1.checked && obaSelectedOptions.value.ascendant1.birthdate) {
            const parentAge = calculateAge(obaSelectedOptions.value.ascendant1.birthdate);
            if (parentAge <= assureAge) {
              error("Le Père de l'Assuré doit être plus âgé que l'Assuré.");
              return;
            }
          }
          if (obaSelectedOptions.value.ascendant2.checked && obaSelectedOptions.value.ascendant2.birthdate) {
            const parentAge = calculateAge(obaSelectedOptions.value.ascendant2.birthdate);
            if (parentAge <= assureAge) {
              error("La Mère de l'Assuré doit être plus âgée que l'Assuré.");
              return;
            }
          }
          if (obaSelectedOptions.value.ascendant3.checked && obaSelectedOptions.value.ascendant3.birthdate) {
            const parentAge = calculateAge(obaSelectedOptions.value.ascendant3.birthdate);
            if (parentAge <= conjointAge) {
              error("Le Père du (de la) Conjoint(e) doit être plus âgé que le (la) Conjoint(e).");
              return;
            }
          }
          if (obaSelectedOptions.value.ascendant4.checked && obaSelectedOptions.value.ascendant4.birthdate) {
            const parentAge = calculateAge(obaSelectedOptions.value.ascendant4.birthdate);
            if (parentAge <= conjointAge) {
              error("La Mère du (de la) Conjoint(e) doit être plus âgée que le (la) Conjoint(e).");
              return;
            }
          }

          let totalPremium = 0;
          if (obaSelectedOptions.value.assure.checked) totalPremium += 2000;
          if (obaSelectedOptions.value.conjoint.checked) totalPremium += 2000;
          if (obaSelectedOptions.value.ascendant1.checked) totalPremium += 2500;
          if (obaSelectedOptions.value.ascendant2.checked) totalPremium += 2500;
          if (obaSelectedOptions.value.ascendant3.checked) totalPremium += 2500;
          if (obaSelectedOptions.value.ascendant4.checked) totalPremium += 2500;

          if (totalPremium < 2000 || totalPremium > 14000) {
            error(`La prime minimale est de 2 000 FCFA et maximale 14 000 FCFA (prime actuelle: ${totalPremium} FCFA).`);
            return;
          }
        }
        
        // Vérifier que le formulaire est valide
        if (!isFormValid.value) {
          error('Veuillez remplir tous les champs obligatoires');
          return;
        }

        // Mapper le type de client vers l'ID correspondant
        const getTypeCustomerId = (typeClient: string): string => {
          switch (typeClient) {
            case '1': return '1'; // Particulier
            case '2': return '2'; // Personnel de la banque
            default: return '1'; // Particulier par défaut
          }
        };

        // Vérifier que la date de naissance est disponible
        if (!props.clientData?.birthdate) {
          error('Date de naissance du client manquante. Impossible de calculer les primes.');
          return;
        }

        // Vérifier l'âge du client
        if (!isOBAMode.value) {
          const age = calculateAge(props.clientData.birthdate);
          const maxAge = creditType.value === 'CP' ? 75 : 70;
          if (age < 18 || age > maxAge) {
            error(`L'âge du client (${age} ans) doit être compris entre 18 et ${maxAge} ans pour effectuer une cotation.`);
            return;
          }
        }

        // Préparer les données pour le calcul
        const calculationData: any = {
          idNatureCredit: selectedNatureCreditId.value, // ID selon la nature de crédit sélectionnée
          typeAss: getTypeCustomerId(props.clientData?.typeCustomer?.id?.toString() || '1'),
          capital: isOBAMode.value ? obaMainCapital.value : cotationForm.value.capital,
          duration: (isCPMode.value || isOBAMode.value) ? 12 : cotationForm.value.duration,
          idPeriodicite: (isCPMode.value || isOBAMode.value) ? 12 : cotationForm.value.idPeriodicite,
          differe: (isCPMode.value || isOBAMode.value) ? 0 : cotationForm.value.differe,
          garantieCompl: 'NON',
          lastname: props.clientData?.lastname || '',
          firstname: props.clientData?.firstname || '',
          birthdate: isOBAMode.value ? obaMainBirthdate.value : props.clientData?.birthdate,
          obaOptions: isOBAMode.value ? obaSelectedOptions.value : undefined
        };


        // Appel API unique - le backend gère le type de crédit
        const response = await ApiService.post('/cotations', calculationData);

        
        // Vérifier si la réponse contient une erreur
        if (response.data && response.data.message && !response.data.data?.cotation) {
          const errorMessage = response.data.message;
          modalValidationError.value = errorMessage;
          error(errorMessage);
        } else if (response.data && response.data.data && response.data.data.cotation) {
          const cotation = response.data.data.cotation;
          
          // Mettre à jour les primes calculées
          calculatedPrimes.value = {
            pd: cotation.pd || 0,
            pc: cotation.pc || 0,
            surp: cotation.surp || 0,
            acc: cotation.acc || 0,
            fm: cotation.fm || 0,
            puttc: cotation.puttc || 0
          };

          
          // Afficher le modal des primes
          showPrimesModal.value = true;
        } else {
          console.error('❌ Structure de réponse inattendue:', response.data);
          const errorMessage = 'Structure de réponse inattendue du serveur. Veuillez réessayer.';
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
        obaOptions: creditType.value === 'OBA' ? obaSelectedOptions.value : undefined,
        primes: calculatedPrimes.value,
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
      isCPMode,
      isOBAMode,

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
      isObaOptionAgeValid,
      isObaAgesValid,
      getMaxCapital,
      getMaxDuration,
      clientAge,
      isAgeValid,
      obaSelectedOptions,
      obaMainCapital,
      obaMainBirthdate
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
