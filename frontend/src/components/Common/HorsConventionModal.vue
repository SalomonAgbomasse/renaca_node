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
      ref="horsConventionFormRef" 
      :validation-schema="horsConventionSchema" 
      :initial-values="horsConventionForm"
      @submit="handleHorsConventionSubmit"
      class="hors-convention-modal-content"
      style="padding-bottom: 0;"
    >
      <!-- Message d'erreur de validation -->
      <div v-if="modalValidationError" class="alert alert-danger mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ modalValidationError }}
      </div>

      <!-- Section de résultat après création -->
      <div v-if="showResult" class="result-section">
        <div class="alert" :class="resultType === 'success' ? 'alert-success' : 'alert-danger'">
          <div class="d-flex align-items-start">
            <i :class="resultType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'" class="me-3 fs-4"></i>
            <div class="flex-grow-1">
              <h5 class="alert-heading mb-2">
                {{ resultType === 'success' ? '✅ Contrat hors convention créé avec succès !' : '❌ Erreur lors de la création' }}
              </h5>
              <p class="mb-0">{{ resultMessage }}</p>
              <div v-if="resultType === 'success' && createdContract" class="mt-2">
                <small class="text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Référence du contrat : {{ createdContract?.data?.contract?.reference || createdContract?.data?.reference || 'N/A' }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Bouton de téléchargement PDF en cas de succès -->
        <div v-if="resultType === 'success' && createdContractId" class="text-center mt-4">
          <div class="d-flex gap-2 justify-content-center">
            <button 
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
              @click="goToContractsList"
            >
              <i class="fas fa-list me-2"></i>
              Voir la liste des contrats
            </button>
          </div>
        </div>

        <!-- Boutons d'action pour les erreurs -->
        <div v-if="resultType === 'error'" class="text-center mt-4">
          <button 
            type="button" 
            class="btn btn-secondary me-2"
            @click="resetForm"
          >
            <i class="fas fa-redo me-2"></i>
            Réessayer
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

      <!-- Étape 1: Informations du contrat -->
      <div v-if="currentStep === 1 && !showResult" class="form-step">

        <div class="row">
          <!-- Nature de crédit -->
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Nature de crédit <span class="text-danger">*</span></label>
              <Field
                name="contrat.creditType"
                v-model="horsConventionForm.contrat.creditType"
                as="select"
                class="form-select shadow-none"
                required
              >
                <option value="">Sélectionnez la nature de crédit</option>
                <option v-for="nc in natureCredits" :key="nc.id || nc.code" :value="nc.code">
                  {{ nc.libelle }}
                </option>
              </Field>
              <ErrorMessage name="contrat.creditType" class="text-danger" />
            </div>
          </div>
        
          <!-- Taux d'intérêt -->
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Taux d'intérêt (%) <span class="text-danger">*</span></label>
              <Field
                name="contrat.tauxInteret"
                v-model="horsConventionForm.contrat.tauxInteret"
                type="number" 
                step="0.01"
                min="0"
                max="100"
                class="form-control" 
                placeholder="Ex: 12.5"
                required
                @input="handleTauxInteretInput"
              />
              <ErrorMessage name="contrat.tauxInteret" class="text-danger" />
            </div>
          </div>
        </div>

        <div v-if="horsConventionForm.contrat.creditType !== 'OBA'">
          <div class="row">
            <!-- Capital -->
            <div class="col-md-4">
              <div class="form-group mb-3">
                <label class="form-label">Capital <span class="text-danger">*</span></label>
                <Field
                  name="contrat.capital"
                  v-model="horsConventionForm.contrat.capital"
                  type="number" 
                  class="form-control" 
                  placeholder="Capital"
                  :min="1"
                  required
                  @input="handleCapitalInput"
                />
                <ErrorMessage name="contrat.capital" class="text-danger" />
              </div>
            </div>

            <!-- Périodicité -->
            <div class="col-md-4">
              <div class="form-group mb-3">
                <label class="form-label">Périodicité <span class="text-danger">*</span></label>
                
                <!-- Périodicité forcée pour CP -->
                <Field
                  v-if="horsConventionForm.contrat.creditType === 'CP'"
                  name="contrat.idPeriodicite"
                  v-model="horsConventionForm.contrat.idPeriodicite"
                  as="select"
                  class="form-select bg-light"
                  disabled
                >
                  <option :value="12">ANNUELLE</option>
                </Field>
                
                <!-- Périodicité standard pour AMORT -->
                <Field
                  v-else
                  name="contrat.idPeriodicite"
                  v-model="horsConventionForm.contrat.idPeriodicite"
                  as="select"
                  class="form-control"
                  :disabled="loadingPeriodicites"
                  required
                  @change="handlePeriodiciteChange"
                >
                  <option value="">Sélectionner une périodicité</option>
                  <option 
                    v-for="periodicite in periodicites" 
                    :key="periodicite.id" 
                    :value="periodicite.id"
                  >
                    {{ periodicite.libelle }}
                  </option>
                </Field>
                <div v-if="loadingPeriodicites" class="form-text text-muted">
                  <i class="fas fa-spinner fa-spin me-1"></i>
                  Chargement des périodicités...
                </div>
                <ErrorMessage name="contrat.idPeriodicite" class="text-danger" />
              </div>
            </div>
            
            <!-- Durée -->
            <div class="col-md-4">
              <div class="form-group mb-3">
                <label class="form-label">Durée (en mois) <span class="text-danger">*</span></label>
                <input 
                  v-model="horsConventionForm.contrat.duration"
                  type="number" 
                  class="form-control" 
                  :class="{ 'bg-light': horsConventionForm.contrat.creditType === 'CP' }"
                  :readonly="horsConventionForm.contrat.creditType === 'CP'"
                  :disabled="horsConventionForm.contrat.creditType === 'CP'"
                  :min="1"
                  :max="120"
                  @input="handleDurationInput"
                />
              </div>
            </div>
          </div>

          <div class="row">
            <!-- Différé -->
            <div v-if="horsConventionForm.contrat.creditType !== 'CP'" class="col-md-12">
              <div class="form-group mb-3">
                <label class="form-label">Différé (en mois) <span class="text-danger">*</span></label>
                <Field
                  name="contrat.differe"
                  v-model="horsConventionForm.contrat.differe"
                  as="select"
                  class="form-control"
                  required
                  @change="handleDiffereChange"
                >
                  <option 
                    v-for="i in 7" 
                    :key="i - 1" 
                    :value="i - 1"
                  >
                    {{ i - 1 }} mois
                  </option>
                </Field>
                <ErrorMessage name="contrat.differe" class="text-danger"/>
                <small class="form-text text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Période de différé de 0 à 6 mois
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Section OBA (Obsèques Alafia) -->
        <div v-else class="mb-4">
          <!-- Hidden fields for VeeValidate -->
          <Field name="contrat.capital" type="hidden" v-model="horsConventionForm.contrat.capital" />
          <Field name="contrat.duration" type="hidden" :value="12" />

          <div class="alert alert-info px-4 py-2 shadow-sm rounded-pill border-2 border-info d-inline-flex align-items-center mb-3">
            <span class="fs-15 fw-bold text-info-emphasis">
              Total Capital Assuré : <span class="fs-17 text-dark ms-1">{{ (horsConventionForm.contrat.capital || 0).toLocaleString('fr-FR') }} FCFA</span>
            </span>
          </div>

          <div class="row">
            <!-- Groupe Assuré -->
            <div class="col-md-6">
              <div class="border-bottom pb-2 mb-3">
                <h6 class="text-black fw-bold mb-0">
                  <i class="fas fa-user-circle text-primary me-2"></i>Groupe Assuré
                </h6>
              </div>

              <!-- Assuré Principal -->
              <div class="card p-3 border-2 border-primary mb-3 bg-light shadow-sm">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" checked disabled id="hc-modal-oba-opt-assure" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-assure">
                      Assuré Principal ({{ selectedClient?.lastname }} {{ selectedClient?.firstname }})
                    </label>
                  </div>
                  <span class="badge bg-primary">Inclus (500 000 FCFA)</span>
                </div>
              </div>

              <!-- Père Assuré -->
              <div class="card p-3 border-2 mb-3" :class="horsConventionForm.contrat.obaOptions.ascendant1.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="hc-modal-oba-opt-ascendant1" v-model="horsConventionForm.contrat.obaOptions.ascendant1.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-ascendant1">
                      Père Assuré
                    </label>
                  </div>
                </div>
                
                <div v-if="horsConventionForm.contrat.obaOptions.ascendant1.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant1.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant1.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant1.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant1.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="horsConventionForm.contrat.obaOptions.ascendant1.birthdate" class="text-end mt-1">
                    <span class="small" :class="isObaOptionAgeValid('ascendant1') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(horsConventionForm.contrat.obaOptions.ascendant1.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant1') && calculateAge(horsConventionForm.contrat.obaOptions.ascendant1.birthdate) >= 18 && calculateAge(horsConventionForm.contrat.obaOptions.ascendant1.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgé)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Mère Assuré -->
              <div class="card p-3 border-2 mb-3" :class="horsConventionForm.contrat.obaOptions.ascendant2.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="hc-modal-oba-opt-ascendant2" v-model="horsConventionForm.contrat.obaOptions.ascendant2.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-ascendant2">
                      Mère Assuré
                    </label>
                  </div>
                </div>
                
                <div v-if="horsConventionForm.contrat.obaOptions.ascendant2.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant2.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant2.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant2.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant2.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="horsConventionForm.contrat.obaOptions.ascendant2.birthdate" class="text-end mt-1">
                    <span class="small" :class="isObaOptionAgeValid('ascendant2') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(horsConventionForm.contrat.obaOptions.ascendant2.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant2') && calculateAge(horsConventionForm.contrat.obaOptions.ascendant2.birthdate) >= 18 && calculateAge(horsConventionForm.contrat.obaOptions.ascendant2.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgée)
                      </span>
                    </span>
                  </div>
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
              <div class="card p-3 border-2 mb-3" :class="horsConventionForm.contrat.obaOptions.conjoint.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="hc-modal-oba-opt-conjoint" v-model="horsConventionForm.contrat.obaOptions.conjoint.checked" @change="if(!horsConventionForm.contrat.obaOptions.conjoint.checked) { horsConventionForm.contrat.obaOptions.ascendant3.checked = false; horsConventionForm.contrat.obaOptions.ascendant4.checked = false; }" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-conjoint">
                      Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <div v-if="horsConventionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.conjoint.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.conjoint.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.conjoint.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.conjoint.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="horsConventionForm.contrat.obaOptions.conjoint.birthdate" class="text-end mt-1">
                    <span class="small" :class="isObaOptionAgeValid('conjoint') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(horsConventionForm.contrat.obaOptions.conjoint.birthdate) }} ans
                    </span>
                  </div>
                </div>
              </div>

              <!-- Père Conjoint -->
              <div class="card p-3 border-2 mb-3" :class="[
                horsConventionForm.contrat.obaOptions.ascendant3.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle',
                !horsConventionForm.contrat.obaOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
              ]">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="hc-modal-oba-opt-ascendant3" v-model="horsConventionForm.contrat.obaOptions.ascendant3.checked" :disabled="!horsConventionForm.contrat.obaOptions.conjoint.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-ascendant3">
                      Père Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <div v-if="horsConventionForm.contrat.obaOptions.ascendant3.checked && horsConventionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant3.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant3.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant3.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant3.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="horsConventionForm.contrat.obaOptions.ascendant3.birthdate" class="text-end mt-1">
                    <span class="small" :class="isObaOptionAgeValid('ascendant3') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(horsConventionForm.contrat.obaOptions.ascendant3.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant3') && calculateAge(horsConventionForm.contrat.obaOptions.ascendant3.birthdate) >= 18 && calculateAge(horsConventionForm.contrat.obaOptions.ascendant3.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgé)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Mère Conjoint -->
              <div class="card p-3 border-2 mb-3" :class="[
                horsConventionForm.contrat.obaOptions.ascendant4.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle',
                !horsConventionForm.contrat.obaOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
              ]">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="hc-modal-oba-opt-ascendant4" v-model="horsConventionForm.contrat.obaOptions.ascendant4.checked" :disabled="!horsConventionForm.contrat.obaOptions.conjoint.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="hc-modal-oba-opt-ascendant4">
                      Mère Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <div v-if="horsConventionForm.contrat.obaOptions.ascendant4.checked && horsConventionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant4.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant4.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms</label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant4.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="horsConventionForm.contrat.obaOptions.ascendant4.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="horsConventionForm.contrat.obaOptions.ascendant4.birthdate" class="text-end mt-1">
                    <span class="small" :class="isObaOptionAgeValid('ascendant4') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                      Âge : {{ calculateAge(horsConventionForm.contrat.obaOptions.ascendant4.birthdate) }} ans
                      <span v-if="!isObaOptionAgeValid('ascendant4') && calculateAge(horsConventionForm.contrat.obaOptions.ascendant4.birthdate) >= 18 && calculateAge(horsConventionForm.contrat.obaOptions.ascendant4.birthdate) <= 75" class="ms-1 fw-bold">
                        (Doit être plus âgée)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
          <!-- Ligne des dates : Date d'effet, Date 1re échéance, Date d'échéance -->
          <div class="row">
            <div class="col-md-4">
              <div class="form-group mb-3">
                <label class="form-label">Date d'effet <span class="text-danger">*</span></label>
                <Field
                  name="contrat.dateEffet"
                  v-model="horsConventionForm.contrat.dateEffet"
                  type="date" 
                  class="form-control" 
                  :class="{ 'bg-light': horsConventionForm.contrat.creditType === 'CP' }"
                  :readonly="horsConventionForm.contrat.creditType === 'CP'"
                  :disabled="horsConventionForm.contrat.creditType === 'CP'"
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
                  name="contrat.dateEch1"
                  v-model="horsConventionForm.contrat.dateEch1"
                  type="date" 
                  class="form-control" 
                  :class="{ 'bg-light': horsConventionForm.contrat.creditType === 'CP' }"
                  :readonly="horsConventionForm.contrat.creditType === 'CP'"
                  :disabled="horsConventionForm.contrat.creditType === 'CP'"
                  :min="horsConventionForm.contrat.dateEffet"
                  @input="handleDatePremiereEcheanceInput"
                  required
                />
                <ErrorMessage name="contrat.dateEch1" class="text-danger" />
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="form-group mb-3">
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
                  name="contrat.dateEch"
                  v-model="horsConventionForm.contrat.dateEch"
                  type="date" 
                  class="form-control" 
                  :class="{ 'bg-light': horsConventionForm.contrat.creditType === 'CP' }"
                  :readonly="horsConventionForm.contrat.creditType === 'CP'"
                  :disabled="horsConventionForm.contrat.creditType === 'CP'"
                  :min="horsConventionForm.contrat.dateEch1 || horsConventionForm.contrat.datePremiereEcheance"
                  @input="handleDateEcheanceManualEdit"
                  required
                />
                <small v-if="!dateEcheanceManuallyEdited" class="text-muted">
                  <i class="fas fa-info-circle me-1"></i>
                  Calculée automatiquement
                </small>
                <small v-else class="text-info">
                  <i class="fas fa-edit me-1"></i>
                  Modifiée manuellement
                </small>
                <ErrorMessage name="contrat.dateEch" class="text-danger" />
              </div>
            </div>
          </div>
        
          <!-- Ligne pour Référence dossier -->
          <div class="row">
            <div class="col-md-12">
              <div class="form-group mb-3">
                <label class="form-label">Référence dossier</label>
                <Field
                  name="contrat.refrence"
                  v-model="horsConventionForm.contrat.refrence"
                  type="text" 
                  class="form-control" 
                  placeholder="Référence du dossier"
                  @input="handleModalUppercaseInput($event, 'contrat.refrence')"
                />
                <ErrorMessage name="contrat.refrence" class="text-danger" />
              </div>
            </div>
          </div>
          
          <!-- Champs spécifiques CP (PADME PROTECTION) -->
        <div v-if="horsConventionForm.contrat.creditType === 'CP'" class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Renouvellement automatique <span class="text-danger">*</span></label>
              <select
                v-model="horsConventionForm.contrat.renouvellementAuto"
                class="form-select shadow-none"
                required
                @change="checkFormValidity"
              >
                <option value="">Sélectionner</option>
                <option :value="true">OUI</option>
                <option :value="false">NON</option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Compte bancaire <span class="text-danger">*</span></label>
              <select
                v-model="horsConventionForm.contrat.compteBancaire"
                class="form-select shadow-none"
                required
                @change="checkFormValidity"
              >
                <option value="">Sélectionner</option>
                <option value="EPARGNE">EPARGNE</option>
                <option value="COURANT">COURANT</option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Numéro de compte <span class="text-danger">*</span></label>
              <input
                v-model="horsConventionForm.contrat.numeroCompte"
                type="text"
                class="form-control"
                placeholder="Numéro de compte"
                required
                @input="checkFormValidity"
              />
            </div>
          </div>
        </div>

        <!-- Garantie Perte d'Emploi - Cachée -->
        <div class="row" style="display: none;">
          <div class="col-md-12">
            <div class="form-group mb-3">
              <label class="form-label">Garantie Perte d'Emploi <span class="text-danger">*</span></label>
              <div class="d-flex gap-3">
                <label class="d-flex align-items-center gap-2">
                  <input 
                    v-model="horsConventionForm.contrat.garantieCompl"
                    type="radio" 
                    value="OUI"
                    @change="checkFormValidity"
                  />
                  Oui
                </label>
                <label class="d-flex align-items-center gap-2">
                  <input 
                    v-model="horsConventionForm.contrat.garantieCompl"
                    type="radio" 
                    value="NON"
                    @change="checkFormValidity"
                  />
                  Non
                </label>
              </div>
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
                v-model="horsConventionForm.primes.pd"
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
                v-model="horsConventionForm.primes.surp"
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
        <!-- Prime Complémentaire (PC) - Cachée -->
        <div class="row" style="display: none;">
          <div class="col-md-12">
            <div class="form-group mb-3">
              <label class="form-label">Prime Complémentaire (PC)</label>
              <Field
                name="primes.pc"
                v-model="horsConventionForm.primes.pc"
                type="number" 
                class="form-control" 
                :min="0"
                step="0.01"
                placeholder="0"
                :disabled="horsConventionForm.contrat.garantieCompl !== 'OUI'"
                @input="handlePrimeInput"
              />
              <div v-if="horsConventionForm.contrat.garantieCompl !== 'OUI'" class="form-text text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Désactivée si garantie = NON
              </div>
              <ErrorMessage name="primes.pc" class="text-danger" />
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
                v-model="horsConventionForm.primes.acc"
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
                v-model="horsConventionForm.primes.fm"
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
                v-model="horsConventionForm.primes.puttc"
                type="number" 
                class="form-control bg-light" 
                readonly
                placeholder="Calculé automatiquement"
              />
              <div class="form-text">
                <i class="fas fa-calculator me-1"></i>
                Somme automatique
              </div>
            </div>
          </div>
        </div> 
          
          
        
        <!-- Champ caché pour l'ID du client -->
        <div class="row">
          <div class="col-12">
            <Field
              name="idCustomer"
              v-model="horsConventionForm.idCustomer"
              type="hidden"
            />
          </div>
        </div>
      </div>

      <!-- Étape 2: Enregistrement des bénéficiaires (CP uniquement) -->
      <div v-if="currentStep === 2 && horsConventionForm.contrat.creditType === 'CP' && !showResult" class="form-step">
        <h5 class="mb-3 text-uppercase">
          <i class="fas fa-users me-2"></i>
          Bénéficiaires (Maximum 5)
        </h5>
        <div class="alert alert-info py-2">
          <small class="d-flex align-items-center">
            <i class="fas fa-info-circle me-2"></i>
            <span>Veuillez enregistrer au moins un bénéficiaire et au plus 5 bénéficiaires. La somme des parts doit être égale à exactement 100%.</span>
          </small>
        </div>
        
        <div class="table-responsive mb-3">
          <table class="table table-bordered table-striped align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 45%;">Nom & prénoms <span class="text-danger">*</span></th>
                <th style="width: 25%;">Lien de parenté <span class="text-danger">*</span></th>
                <th style="width: 20%;">Part (%) <span class="text-danger">*</span></th>
                <th style="width: 10%;" class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(beneficiary, index) in horsConventionForm.contrat.beneficiaries" :key="index">
                <td>
                  <input
                    v-model="beneficiary.nomPrenoms"
                    type="text"
                    class="form-control"
                    placeholder="Nom et Prénoms"
                    required
                  />
                </td>
                <td>
                  <select
                    v-model="beneficiary.lienParente"
                    class="form-select shadow-none"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    <option v-for="l in liensParenteList" :key="l.id || l" :value="l.libelle || l">
                      {{ l.libelle || l }}
                    </option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="beneficiary.pourcentage"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    class="form-control"
                    placeholder="Part %"
                    required
                  />
                </td>
                <td class="text-center">
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                    @click="removeBeneficiary(index)"
                  >
                    <i class="fas fa-trash-alt"></i>
                    <span>Supprimer</span>
                  </button>
                </td>
              </tr>
              <tr v-if="horsConventionForm.contrat.beneficiaries.length === 0">
                <td colspan="4" class="text-center text-muted py-3">
                  Aucun bénéficiaire enregistré. Cliquez sur "Ajouter un bénéficiaire" ci-dessous.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <button
            v-if="horsConventionForm.contrat.beneficiaries.length < 5"
            type="button"
            class="btn btn-outline-success btn-sm"
            @click="addBeneficiary"
          >
            <i class="fas fa-plus me-2"></i> Ajouter un bénéficiaire
          </button>
          
          <div class="text-end">
            <span class="badge bg-success" v-if="totalPercentage === 100">
              Total des parts : 100%
            </span>
            <span class="badge bg-warning text-dark" v-else>
              Total des parts : {{ totalPercentage }}%
            </span>
          </div>
        </div>

        <!-- Validation message for beneficiaries -->
        <div v-if="beneficiaryValidationMessage" class="alert alert-warning py-2 mb-0">
          <small class="d-flex align-items-center">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <span>{{ beneficiaryValidationMessage }}</span>
          </small>
        </div>
      </div>

      <!-- Étape 2/3: Récapitulatif et validation -->
      <div v-if="((currentStep === 2 && horsConventionForm.contrat.creditType !== 'CP') || (currentStep === 3 && horsConventionForm.contrat.creditType === 'CP')) && !showResult" class="form-step recap-step">
        <h5 class="mb-4 d-flex align-items-center gap-2">
          <i class="fas fa-check-circle text-success fs-4"></i>
          <span class="fw-bold text-dark">Récapitulatif et Validation</span>
        </h5>

        <div class="row">
          <div class="col-md-7">
            <!-- Informations Client -->
            <div class="recap-card">
              <div class="recap-card-header">
                <i class="fas fa-user-circle"></i>
                <h5>Informations Client</h5>
              </div>
              <div class="recap-card-body">
                <div class="recap-grid">
                  <div class="recap-item">
                    <span class="recap-label">Nom</span>
                    <span class="recap-value">{{ selectedClient?.lastname }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Prénoms</span>
                    <span class="recap-value">{{ selectedClient?.firstname }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date de naissance</span>
                    <span class="recap-value">{{ formatDateLabel(selectedClient?.birthdate) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Sexe</span>
                    <span class="recap-value">{{ selectedClient?.gender === 'M' ? 'Homme' : 'Femme' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Type de client</span>
                    <span class="recap-value">{{ selectedClient?.typeCustomer?.libelle || 'Particulier' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Adresse</span>
                    <span class="recap-value">{{ selectedClient?.address || 'N/A' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Téléphone</span>
                    <span class="recap-value">{{ selectedClient?.phone || 'N/A' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Profession</span>
                    <span class="recap-value">{{ selectedClient?.occupation || 'N/A' }}</span>
                  </div>
                  <div v-if="selectedClient?.email" class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Email</span>
                    <span class="recap-value">{{ selectedClient?.email }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bénéficiaires du Contrat (CP uniquement) -->
            <div v-if="horsConventionForm.contrat.creditType === 'CP'" class="recap-card">
              <div class="recap-card-header">
                <i class="fas fa-users"></i>
                <h5>Bénéficiaires du Contrat</h5>
              </div>
              <div class="recap-card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%;">
                    <thead class="bg-light">
                      <tr>
                        <th class="ps-4 py-3 text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 700; border-bottom: 1px solid #dee2e6;">Nom & prénoms</th>
                        <th class="py-3 text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 700; border-bottom: 1px solid #dee2e6;">Lien de parenté</th>
                        <th class="pe-4 py-3 text-end text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 700; border-bottom: 1px solid #dee2e6;">Part (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(b, idx) in horsConventionForm.contrat.beneficiaries" :key="idx" style="border-bottom: 1px solid #f1f5f9;">
                        <td class="ps-4 py-3 fw-semibold text-dark">{{ b.nomPrenoms }}</td>
                        <td class="py-3"><span class="badge bg-light text-dark border px-2 py-1">{{ b.lienParente }}</span></td>
                        <td class="pe-4 py-3 text-end fw-bold text-success">{{ b.pourcentage }}%</td>
                      </tr>
                    </tbody>
                  </table>
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
                    <span class="recap-value text-success">{{ formatCurrency(horsConventionForm.contrat.capital) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Durée</span>
                    <span class="recap-value">{{ horsConventionForm.contrat.duration }} mois</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Taux d'intérêt</span>
                    <span class="recap-value">{{ horsConventionForm.contrat.tauxInteret }}%</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date d'effet</span>
                    <span class="recap-value">{{ formatDateLabel(horsConventionForm.contrat.dateEffet) }}</span>
                  </div>
                  <div class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Type de crédit</span>
                    <span class="recap-value">
                      <span class="recap-badge-nature">{{ getCreditTypeLabel(horsConventionForm.contrat.creditType) }}</span>
                    </span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Périodicité</span>
                    <span class="recap-value">{{ getPeriodiciteLabel(horsConventionForm.contrat.idPeriodicite) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Différé</span>
                    <span class="recap-value">{{ horsConventionForm.contrat.differe }} mois</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date 1re échéance</span>
                    <span class="recap-value">{{ formatDateLabel(horsConventionForm.contrat.dateEch1 || horsConventionForm.contrat.datePremiereEcheance) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date d'échéance</span>
                    <span class="recap-value">{{ formatDateLabel(horsConventionForm.contrat.dateEch) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Référence dossier</span>
                    <span class="recap-value">{{ horsConventionForm.contrat.refrence || 'N/A' }}</span>
                  </div>
                  <template v-if="horsConventionForm.contrat.creditType === 'CP'">
                    <div class="recap-item">
                      <span class="recap-label">Renouvellement auto</span>
                      <span class="recap-value">{{ horsConventionForm.contrat.renouvellementAuto ? 'OUI' : 'NON' }}</span>
                    </div>
                    <div class="recap-item">
                      <span class="recap-label">Compte bancaire</span>
                      <span class="recap-value">{{ horsConventionForm.contrat.compteBancaire }}</span>
                    </div>
                    <div class="recap-item" style="grid-column: span 2;">
                      <span class="recap-label">Numéro de compte</span>
                      <span class="recap-value">{{ horsConventionForm.contrat.numeroCompte }}</span>
                    </div>
                  </template>
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
            <!-- Parameter Pills horizontally -->
            <div class="parameter-pills-container mb-4">
              <span class="parameter-pill">
                <i class="fas fa-wallet"></i>
                <span class="parameter-pill-label">Capital:</span>
                <span>{{ formatCurrency(horsConventionForm.contrat.capital) }}</span>
              </span>
              <span class="parameter-pill">
                <i class="fas fa-hourglass-half"></i>
                <span class="parameter-pill-label">Durée:</span>
                <span>{{ horsConventionForm.contrat.duration }} mois</span>
              </span>
              <span class="parameter-pill" v-if="selectedClient?.birthdate">
                <i class="fas fa-birthday-cake"></i>
                <span class="parameter-pill-label">Né le:</span>
                <span>{{ formatDateLabel(selectedClient.birthdate) }}</span>
              </span>
              <span class="parameter-pill">
                <i class="fas fa-user-tag"></i>
                <span class="parameter-pill-label">Type:</span>
                <span>Hors Convention</span>
              </span>
            </div>

            <!-- Si CP ou OBA: Afficher uniquement Prime Unique TTC et Prime Décès -->
            <div v-if="horsConventionForm.contrat.creditType === 'CP' || horsConventionForm.contrat.creditType === 'OBA'" class="premium-badges-grid cp-oba">
              <div class="premium-badge-card primary-premium">
                <span class="premium-card-label">
                  <i class="fas fa-check-double"></i> Prime Unique TTC
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.puttc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-heartbeat"></i> Prime Décès
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.pd) }}</span>
              </div>
            </div>
            
            <!-- Si AMORT: Afficher les primes (PD, SURP, ACC, FM, PUTTC) -->
            <div v-else class="premium-badges-grid">
              <div class="premium-badge-card primary-premium">
                <span class="premium-card-label">
                  <i class="fas fa-check-double"></i> Prime Unique TTC
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.puttc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-heartbeat"></i> Prime Décès
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.pd) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-hand-holding-medical"></i> Surprime
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.surp) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-concierge-bell"></i> Accessoires
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.acc) }}</span>
              </div>
              <div class="premium-badge-card">
                <span class="premium-card-label">
                  <i class="fas fa-file-medical-alt"></i> Frais Médicaux
                </span>
                <span class="premium-card-value">{{ formatCurrency(horsConventionForm.primes.fm) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Form>

    <template #footer>
      <div class="d-flex justify-content-between w-100">
        <div>
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="closeModal"
          >
            <i class="fas fa-times me-2"></i>
            Annuler
          </button>
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-outline-primary"
            @click="prevStep"
          >
            <i class="fas fa-arrow-left me-2"></i>
            Précédent
          </button>
        </div>
        <div>
          <button
            v-if="currentStep < totalSteps && !showResult"
            type="button"
            class="btn btn-primary"
            @click="nextStep"
            :disabled="!!modalValidationError"
          >
            <span v-if="modalValidationError">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Erreur de validation
            </span>
            <span v-else>
              Suivant
              <i class="fas fa-arrow-right ms-2"></i>
            </span>
          </button>
          <button
            v-if="currentStep === totalSteps && !showResult"
            type="button"
            class="btn btn-success"
            @click="createHorsConventionContract"
            :disabled="isCreating || !!modalValidationError"
          >
            <span v-if="isCreating">
              <i class="spinner-border spinner-border-sm me-2"></i>
              Création en cours...
            </span>
            <span v-else-if="modalValidationError">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Erreur de validation
            </span>
            <span v-else>
              <i class="fas fa-check me-2"></i>
              <span class="d-none d-sm-inline">Créer le Contrat Hors Convention</span>
              <span class="d-inline d-sm-none">Créer</span>
            </span>
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success, calculateDateEcheance } from '../../utils/utils';
import { useRouter } from "vue-router";
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import * as Yup from 'yup';
import Modal from './Modal.vue';
import { ContractType } from '../../enums/contract-type.enum';

export default defineComponent({
  name: 'HorsConventionModal',
  components: {
    Form,
    Field,
    ErrorMessage,
    Modal
  },
  props: {
    // Client sélectionné
    selectedClient: {
      type: Object,
      default: null
    },
    // Visibilité du modal
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hors-convention-success', 'close', 'update:visible'],
  setup(props, { emit }) {
    // Composables
    const router = useRouter();

    // État du composant
    const isCreating = ref(false);
    const showResult = ref(false);
    const resultMessage = ref('');
    const resultType = ref<'success' | 'error'>('success');
    const createdContract = ref<any>(null);
    const createdContractId = ref<number | null>(null);
    const isDownloadingPDF = ref(false);
    
    // Variables pour le formulaire multi-étapes
    const currentStep = ref(1);
    const totalSteps = computed(() => horsConventionForm.value.contrat.creditType === 'CP' ? 3 : 2);
    
    // Variable pour les erreurs de validation dans le modal
    const modalValidationError = ref('');

    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    
    // Variable pour suivre si la date d'échéance a été modifiée manuellement
    const dateEcheanceManuallyEdited = ref(false);
    const datePremiereEcheanceManuallyEdited = ref(false);

    // Référence pour le formulaire
    const horsConventionFormRef = ref(null);

    // Données du formulaire
    const horsConventionForm = ref({
      // ID du client (obligatoire)
      idCustomer: null as number | null,
      // Informations du contrat
      contrat: {
        creditType: 'AMORT',
        refrence: '',
        dateEffet: null as string | null,
        etablissement: '',
        duree: 12,
        duration: 12,
        tauxInteret: 0,
        datePremiereEcheance: null as string | null,
        dateEch1: '',
        dateEch: null as string | null,
        capital: 1000000,
        garantieCompl: 'NON',
        idPeriodicite: null as number | null,
        differe: 0,
        renouvellementAuto: '' as any,
        compteBancaire: '',
        numeroCompte: '',
        beneficiaries: [] as any[],
        obaOptions: {
          conjoint: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F', capitalAssure: 0, prime: 0 },
          ascendant1: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M', capitalAssure: 0, prime: 0 },
          ascendant2: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F', capitalAssure: 0, prime: 0 },
          ascendant3: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M', capitalAssure: 0, prime: 0 },
          ascendant4: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F', capitalAssure: 0, prime: 0 }
        }
      },
      // Primes d'assurance
      primes: {
        pd: 0,
        pc: 0,
        surp: 0,
        acc: 0,
        fm: 0,
        puttc: 0
      }
    });

    // Schéma de validation VeeValidate
    const horsConventionSchema = Yup.object().shape({
      idCustomer: Yup.number()
        .required('L\'ID du client est obligatoire')
        .positive('L\'ID du client doit être positif'),
      contrat: Yup.object().shape({
        refrence: Yup.string().nullable(),
        dateEffet: Yup.date()
          .required('La date d\'effet est obligatoire')
          .test('is-valid-date', 'La date d\'effet doit être valide', function(value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          }),
        etablissement: Yup.string().nullable(),
        duree: Yup.number()
          .required('La durée est obligatoire')
          .min(1, 'La durée doit être d\'au moins 1 mois'),
        duration: Yup.number()
          .required('La durée est obligatoire')
          .min(1, 'La durée doit être d\'au moins 1 mois'),
        tauxInteret: Yup.number()
          .required('Le taux d\'intérêt est obligatoire')
          .min(0, 'Le taux d\'intérêt ne peut pas être négatif')
          .max(100, 'Le taux d\'intérêt ne peut pas dépasser 100%'),
        dateEch1: Yup.date()
          .required('La date de première échéance est obligatoire')
          .test('is-valid-date', 'La date de première échéance doit être valide', function(value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          })
          .test('after-date-effet', 'La date de première échéance ne peut pas être antérieure à la date d\'effet', function(value) {
            if (!value) return true;
            const dateEffet = this.parent.dateEffet;
            if (!dateEffet) return true;
            
            const dateEcheance = new Date(value);
            const dateEffetObj = new Date(dateEffet);
            return dateEcheance >= dateEffetObj;
          }),
        datePremiereEcheance: Yup.date()
          .required('La date de première échéance est obligatoire')
          .test('is-valid-date', 'La date de première échéance doit être valide', function(value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          }),
        capital: Yup.number()
          .required('Le capital est obligatoire')
          .min(1, 'Le capital doit être d\'au moins 1'),
        idPeriodicite: Yup.number()
          .required('La périodicité est obligatoire')
          .min(1, 'Veuillez sélectionner une périodicité'),
        differe: Yup.number()
          .required('Le différé est obligatoire')
          .min(0, 'Le différé doit être d\'au moins 0 mois')
          .max(6, 'Le différé maximum est de 6 mois'),
        garantieCompl: Yup.string()
          .oneOf(['OUI', 'NON'], "Un choix pour la garantie perte d'emploi est obligatoire")
          .required("Un choix pour la garantie perte d'emploi est obligatoire"),
        dateEch: Yup.date()
          .required('La date d\'échéance est obligatoire')
          .test('is-valid-date', 'La date d\'échéance doit être valide', function(value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          })
          .test('after-date-ech1', 'La date d\'échéance ne peut pas être antérieure à la date de première échéance', function(value) {
            if (!value) return true;
            const dateEch1 = this.parent.dateEch1;
            if (!dateEch1) return true;
            
            const dateEch = new Date(value);
            const dateEch1Obj = new Date(dateEch1);
            return dateEch >= dateEch1Obj;
          }),
        renouvellementAuto: Yup.boolean().nullable()
          .test('required-for-cp', 'Le renouvellement automatique est obligatoire', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP') {
              return value !== null && value !== undefined && (value as any) !== '';
            }
            return true;
          }),
        compteBancaire: Yup.string().nullable()
          .test('required-for-cp', 'Le type de compte bancaire est obligatoire', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP') {
              return !!value && ['EPARGNE', 'COURANT'].includes(value);
            }
            return true;
          }),
        numeroCompte: Yup.string().nullable()
          .test('required-for-cp', 'Le numéro de compte est obligatoire', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP') {
              return !!value && value.trim().length > 0;
            }
            return true;
          }),
        beneficiaries: Yup.array().nullable()
          .test('required-for-cp', 'Au moins un bénéficiaire est requis', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP') {
              return Array.isArray(value) && value.length > 0;
            }
            return true;
          })
          .test('max-five-beneficiaries', 'Maximum 5 bénéficiaires autorisés', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP' && Array.isArray(value)) {
              return value.length <= 5;
            }
            return true;
          })
          .test('valid-beneficiaries-info', 'Les informations des bénéficiaires sont incomplètes', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP' && Array.isArray(value)) {
              return value.every(b => b.nomPrenoms && b.nomPrenoms.trim() && b.lienParente && b.pourcentage > 0);
            }
            return true;
          })
          .test('sum-percentage-100', 'La somme des parts des bénéficiaires doit être égale à 100%', function(value) {
            const creditType = this.parent.creditType;
            if (creditType === 'CP' && Array.isArray(value)) {
              const sum = value.reduce((acc, b) => acc + (parseFloat(b.pourcentage) || 0), 0);
              return Math.abs(sum - 100) < 0.01;
            }
            return true;
          })
      }),
      primes: Yup.object().shape({
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

    // Fonction pour réinitialiser le formulaire
    const resetForm = () => {
      
      // Réinitialiser l'ID du client
      if (props.selectedClient?.id) {
        horsConventionForm.value.idCustomer = props.selectedClient.id;
      } else {
        console.error('❌ Aucun client sélectionné pour la réinitialisation');
      }
      
      // Réinitialiser les autres champs
      currentStep.value = 1;
      modalValidationError.value = '';
      showResult.value = false;
      resultMessage.value = '';
      resultType.value = 'success';
      createdContract.value = null;
      createdContractId.value = null;
      isCreating.value = false;
      isDownloadingPDF.value = false;
      
      // Réinitialiser les champs CP
      horsConventionForm.value.contrat.renouvellementAuto = '';
      horsConventionForm.value.contrat.compteBancaire = '';
      horsConventionForm.value.contrat.numeroCompte = '';
      horsConventionForm.value.contrat.beneficiaries = [];
      
      // Réinitialiser le formulaire VeeValidate
      if (horsConventionFormRef.value && (horsConventionFormRef.value as any).resetForm) {
        (horsConventionFormRef.value as any).resetForm();
      }
    };

    const calculateAge = (birthdate: string): number => {
      if (!birthdate) return 30;
      try {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch {
        return 30;
      }
    };

    const isObaOptionAgeValid = (key: string): boolean => {
      const opt = (horsConventionForm.value.contrat.obaOptions as any)[key];
      if (!opt || !opt.checked || !opt.birthdate) return true;
      
      const age = calculateAge(opt.birthdate);
      
      // 1. Check absolute min/max limits
      const maxAge = (key === 'conjoint') ? 65 : 75;
      if (age < 18 || age > maxAge) return false;
      
      // 2. Check generational age gaps
      if (key === 'ascendant1' || key === 'ascendant2') {
        const childAge = props.selectedClient?.birthdate
          ? calculateAge(props.selectedClient.birthdate)
          : 0;
        if (age <= childAge) return false;
      }
      
      if (key === 'ascendant3' || key === 'ascendant4') {
        const childAge = horsConventionForm.value.contrat.obaOptions.conjoint.checked && horsConventionForm.value.contrat.obaOptions.conjoint.birthdate
          ? calculateAge(horsConventionForm.value.contrat.obaOptions.conjoint.birthdate)
          : 0;
        if (age <= childAge) return false;
      }
      
      return true;
    };

    // Watcher pour calculer automatiquement le capital pour OBA en fonction des membres cochés
    watch(() => horsConventionForm.value.contrat.obaOptions, (newOpts) => {
      if (horsConventionForm.value.contrat.creditType === 'OBA' && newOpts) {
        let total = 500000; // Assuré principal toujours inclus (500 000 FCFA)
        if (newOpts.conjoint?.checked) total += 500000;
        if (newOpts.ascendant1?.checked) total += 500000;
        if (newOpts.ascendant2?.checked) total += 500000;
        if (newOpts.ascendant3?.checked) total += 500000;
        if (newOpts.ascendant4?.checked) total += 500000;
        horsConventionForm.value.contrat.capital = total;
      }
    }, { deep: true });

    watch(() => horsConventionForm.value.contrat.creditType, (newCreditType) => {
      if (newCreditType === 'OBA' || newCreditType === 'CP') {
        horsConventionForm.value.contrat.duration = 12;
        horsConventionForm.value.contrat.idPeriodicite = 12; // Annuelle (ID Periodicite 12)
        horsConventionForm.value.contrat.differe = 0;
        
        if (newCreditType === 'OBA') {
          // Déclencher le calcul du capital
          let total = 500000;
          const newOpts = horsConventionForm.value.contrat.obaOptions;
          if (newOpts.conjoint?.checked) total += 500000;
          if (newOpts.ascendant1?.checked) total += 500000;
          if (newOpts.ascendant2?.checked) total += 500000;
          if (newOpts.ascendant3?.checked) total += 500000;
          if (newOpts.ascendant4?.checked) total += 500000;
          horsConventionForm.value.contrat.capital = total;
        }
      }
    });

    const currentAge = computed(() => {
      if (!props.selectedClient?.birthdate) return 30;
      return calculateAge(props.selectedClient.birthdate);
    });

    const adjustValuesToLimits = () => {
      const creditType = horsConventionForm.value.contrat.creditType;
      if (!creditType) return;
      
      let hasChanges = false;
      
      if (creditType === 'CP') {
        if (horsConventionForm.value.contrat.duration !== 12) {
          horsConventionForm.value.contrat.duration = 12;
          hasChanges = true;
        }
        if (horsConventionForm.value.contrat.duree !== 12) {
          horsConventionForm.value.contrat.duree = 12;
          hasChanges = true;
        }
        if (horsConventionForm.value.contrat.idPeriodicite !== 12) {
          horsConventionForm.value.contrat.idPeriodicite = 12;
          hasChanges = true;
        }
        if (horsConventionForm.value.contrat.differe !== 0) {
          horsConventionForm.value.contrat.differe = 0;
          hasChanges = true;
        }

        const dateEffCPObj = new Date();
        dateEffCPObj.setDate(dateEffCPObj.getDate() + 1);
        const yEffCP = dateEffCPObj.getFullYear();
        const mEffCP = String(dateEffCPObj.getMonth() + 1).padStart(2, '0');
        const dEffCP = String(dateEffCPObj.getDate()).padStart(2, '0');
        const dateEffCPStr = `${yEffCP}-${mEffCP}-${dEffCP}`;

        if (horsConventionForm.value.contrat.dateEffet !== dateEffCPStr) {
          horsConventionForm.value.contrat.dateEffet = dateEffCPStr;
          hasChanges = true;
        }
      } else if (creditType === 'OBA') {
        // Périodicité et différée forcées
        if (horsConventionForm.value.contrat.idPeriodicite !== 12) {
          horsConventionForm.value.contrat.idPeriodicite = 12;
          hasChanges = true;
        }
        if (horsConventionForm.value.contrat.differe !== 0) {
          horsConventionForm.value.contrat.differe = 0;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        calculateDateEcheanceAuto();
      }
    };

    // Watcher pour mettre à jour les valeurs du formulaire quand le modal s'ouvre
    watch(() => props.visible, (isVisible) => {
      if (isVisible) {
        // Réinitialiser le formulaire
        resetForm();
        
        // Définir les dates par défaut
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        const todayString = today.toISOString().split('T')[0];
        const nextMonthString = nextMonth.toISOString().split('T')[0];
        
        // Date d'effet = aujourd'hui
        horsConventionForm.value.contrat.dateEffet = todayString;
        
        // Date de la 1re échéance = date d'effet + 1 mois
        horsConventionForm.value.contrat.datePremiereEcheance = nextMonthString;
        horsConventionForm.value.contrat.dateEch1 = nextMonthString;
        
        // Initialiser differe à 0 si non défini
        if (horsConventionForm.value.contrat.differe === null || horsConventionForm.value.contrat.differe === undefined) {
          horsConventionForm.value.contrat.differe = 0;
        }
        
        // Réinitialiser le flag de modification manuelle
        dateEcheanceManuallyEdited.value = false;
        
        // Forcer le type de crédit par défaut
        horsConventionForm.value.contrat.creditType = '';
        
        // Ajuster les valeurs selon la nature
        adjustValuesToLimits();
        
        // Calculer PUTTC initial
        calculatePutcc();
        
        // Calculer automatiquement la date d'échéance après un court délai pour laisser le temps aux périodicités de se charger
        setTimeout(() => {
          calculateDateEcheanceAuto();
        }, 500);
      }
    });

    // Watcher pour surveiller les changements de selectedClient
    watch(() => props.selectedClient, (newClient) => {
      if (newClient?.id && props.visible) {
        horsConventionForm.value.idCustomer = newClient.id;
      }
    }, { immediate: true });

    // Watchers pour la nature de crédit et la date d'effet
    watch(() => horsConventionForm.value.contrat.creditType, (newType) => {
      if (props.visible) {
        adjustValuesToLimits();
        if (newType === 'CP') {
          const dateEffCPObj = new Date();
          dateEffCPObj.setDate(dateEffCPObj.getDate() + 1);
          const yEffCP = dateEffCPObj.getFullYear();
          const mEffCP = String(dateEffCPObj.getMonth() + 1).padStart(2, '0');
          const dEffCP = String(dateEffCPObj.getDate()).padStart(2, '0');
          const dateEffCPStr = `${yEffCP}-${mEffCP}-${dEffCP}`;
          
          horsConventionForm.value.contrat.dateEffet = dateEffCPStr;
          
          const dEch = new Date(dateEffCPObj);
          dEch.setFullYear(dEch.getFullYear() + 1);
          dEch.setDate(dEch.getDate() - 1);

          const y = dEch.getFullYear();
          const m = String(dEch.getMonth() + 1).padStart(2, '0');
          const d = String(dEch.getDate()).padStart(2, '0');
          const dateEchCP = `${y}-${m}-${d}`;

          horsConventionForm.value.contrat.datePremiereEcheance = dateEchCP;
          horsConventionForm.value.contrat.dateEch1 = dateEchCP;
          horsConventionForm.value.contrat.dateEch = dateEchCP;
          
          horsConventionForm.value.contrat.duration = 12;
          horsConventionForm.value.contrat.duree = 12;
          
          dateEcheanceManuallyEdited.value = false;
        }
      }
    });
    
    watch(() => horsConventionForm.value.contrat.dateEffet, (newDate) => {
      if (props.visible && horsConventionForm.value.contrat.creditType === 'CP') {
        adjustValuesToLimits();
      }
    });

    // Méthodes
    const closeModal = () => {
      emit('update:visible', false);
      currentStep.value = 1;
      modalValidationError.value = '';
      showResult.value = false;
      resultMessage.value = '';
      resultType.value = 'success';
      createdContract.value = null;
      createdContractId.value = null;
      isCreating.value = false;
      isDownloadingPDF.value = false;
      emit('close');
    };

    // Fonctions pour la navigation entre les étapes
    const nextStep = async (): Promise<void> => {
      if (currentStep.value < totalSteps.value) {
        // Petit délai pour laisser le temps au v-model de se mettre à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Valider les champs requis avant de passer à l'étape suivante
        if (!validateCurrentStep()) {
          return;
        }
        
        // Effacer l'erreur de validation si la validation réussit
        modalValidationError.value = '';
        currentStep.value++;
      }
    };

    // Fonction de validation des champs requis par étape
    const validateCurrentStep = (): boolean => {
      const step = currentStep.value;
      const missingFields: string[] = [];
      
      if (step === 1) {
        // Validation étape 1: Informations contrat
        const contrat = horsConventionForm.value.contrat;
        
        if (!contrat.capital || Number(contrat.capital) <= 0) missingFields.push('Capital');
        if (!contrat.duration || Number(contrat.duration) <= 0) missingFields.push('Durée');
        if (contrat.tauxInteret === null || contrat.tauxInteret === undefined || isNaN(Number(contrat.tauxInteret)) || Number(contrat.tauxInteret) < 0 || Number(contrat.tauxInteret) > 100) {
          missingFields.push('Taux d\'intérêt (doit être entre 0 et 100%)');
        }
        if (!contrat.dateEffet) missingFields.push('Date d\'effet');
        if (!contrat.datePremiereEcheance) missingFields.push('Date 1re échéance');
        if (!contrat.dateEch) missingFields.push('Date d\'échéance');
        if (!contrat.garantieCompl) missingFields.push('Garantie Perte d\'Emploi');
        if (!contrat.idPeriodicite) missingFields.push('Périodicité');
        if (contrat.differe === null || contrat.differe === undefined) missingFields.push('Différé');
        
        // Validation de l'ID du client
        if (!horsConventionForm.value.idCustomer) {
          missingFields.push('ID du client');
          console.error('❌ ID du client manquant dans le formulaire');
        }
        
        // Validation des champs spécifiques CP en étape 1
        if (contrat.creditType === 'CP') {
          if (contrat.renouvellementAuto === null || contrat.renouvellementAuto === undefined || contrat.renouvellementAuto === '') {
            missingFields.push('Renouvellement automatique');
          }
          if (!contrat.compteBancaire) {
            missingFields.push('Type de compte bancaire');
          }
          if (!contrat.numeroCompte || !contrat.numeroCompte.trim()) {
            missingFields.push('Numéro de compte');
          }
        }
        
        // Validation des options OBA
        if (contrat.creditType === 'OBA') {
          const assureAge = props.selectedClient?.birthdate ? calculateAge(props.selectedClient.birthdate) : 0;
          const conjointAge = contrat.obaOptions.conjoint.checked && contrat.obaOptions.conjoint.birthdate
            ? calculateAge(contrat.obaOptions.conjoint.birthdate)
            : 0;

          const labelMap: any = {
            conjoint: 'du (de la) Conjoint(e)',
            ascendant1: "du Père de l'Assuré",
            ascendant2: "de la Mère de l'Assuré",
            ascendant3: "du Père du (de la) Conjoint(e)",
            ascendant4: "de la Mère du (de la) Conjoint(e)"
          };

          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = contrat.obaOptions[key];
            if (opt && opt.checked) {
              if (!opt.birthdate) {
                missingFields.push(`Date de naissance ${labelMap[key]}`);
              } else {
                const age = calculateAge(opt.birthdate);
                const maxAge = key === 'conjoint' ? 65 : 75;
                if (age < 18 || age > maxAge) {
                  missingFields.push(`Âge ${labelMap[key]} (${age} ans) hors limite (doit être entre 18 et ${maxAge} ans)`);
                }
                
                // Generational validation
                if (key === 'ascendant1' || key === 'ascendant2') {
                  if (age <= assureAge) {
                    missingFields.push(`Âge ${labelMap[key]} (${age} ans) doit être supérieur à l'Assuré (${assureAge} ans)`);
                  }
                }
                if (key === 'ascendant3' || key === 'ascendant4') {
                  if (age <= conjointAge) {
                    missingFields.push(`Âge ${labelMap[key]} (${age} ans) doit être supérieur au (à la) Conjoint(e) (${conjointAge} ans)`);
                  }
                }
              }
            }
          }
        }
        
        // Validation des primes
        const primes = horsConventionForm.value.primes;
        if (primes.pd === null || primes.pd === undefined || Number(primes.pd) < 0) missingFields.push('Prime Décès');
        if (primes.surp === null || primes.surp === undefined || Number(primes.surp) < 0) missingFields.push('Surprime');
        if (primes.acc === null || primes.acc === undefined || Number(primes.acc) < 0) missingFields.push('Accessoires');
        if (primes.fm === null || primes.fm === undefined || Number(primes.fm) < 0) missingFields.push('Frais Médicaux');
        
        // Vérifier que PUTTC est toujours supérieur à 0
        if (!primes.puttc || Number(primes.puttc) <= 0) {
          missingFields.push('Prime Unique TTC (doit être supérieure à 0)');
        }
        
        if (missingFields.length > 0) {
          modalValidationError.value = `Champs manquants dans les informations contrat : ${missingFields.join(', ')}`;
          return false;
        }
      }
      
      if (step === 2 && horsConventionForm.value.contrat.creditType === 'CP') {
        const beneficiaries = horsConventionForm.value.contrat.beneficiaries || [];
        if (beneficiaries.length === 0) {
          modalValidationError.value = "Au moins un bénéficiaire doit être enregistré pour un contrat CP.";
          return false;
        }
        if (beneficiaries.length > 5) {
          modalValidationError.value = "Un maximum de 5 bénéficiaires est autorisé pour un contrat CP.";
          return false;
        }
        
        // Vérifier que tous les bénéficiaires ont des valeurs valides
        for (let i = 0; i < beneficiaries.length; i++) {
          const b = beneficiaries[i];
          if (!b.nomPrenoms || !b.nomPrenoms.trim()) {
            modalValidationError.value = `Le nom et prénoms du bénéficiaire #${i + 1} est obligatoire.`;
            return false;
          }
          if (!b.lienParente) {
            modalValidationError.value = `Le lien de parenté du bénéficiaire #${i + 1} est obligatoire.`;
            return false;
          }
          if (!b.pourcentage || Number(b.pourcentage) <= 0) {
            modalValidationError.value = `La part (%) du bénéficiaire #${i + 1} doit être supérieure à 0.`;
            return false;
          }
        }
        
        const sum = beneficiaries.reduce((acc, b) => acc + (Number(b.pourcentage) || 0), 0);
        if (Math.abs(sum - 100) > 0.01) {
          modalValidationError.value = `La somme des parts des bénéficiaires doit être exactement égale à 100%. (Actuel : ${sum}%)`;
          return false;
        }
      }
      
      return true;
    };

    const prevStep = (): void => {
      if (currentStep.value > 1) {
        // Effacer l'erreur de validation quand on revient en arrière
        modalValidationError.value = '';
        currentStep.value--;
      }
    };


    // Fonction pour mettre à jour la date de première échéance quand la date d'effet change
    const updateDatePremiereEcheance = (): void => {
      if (horsConventionForm.value.contrat.dateEffet) {
        const dateEffet = new Date(horsConventionForm.value.contrat.dateEffet);
        if (isNaN(dateEffet.getTime())) return;
        
        if (horsConventionForm.value.contrat.creditType === 'CP') {
          const dEff = new Date(dateEffet);
          const dEch = new Date(dEff);
          dEch.setFullYear(dEch.getFullYear() + 1);
          dEch.setDate(dEch.getDate() - 1);
          const y = dEch.getFullYear();
          const m = String(dEch.getMonth() + 1).padStart(2, '0');
          const d = String(dEch.getDate()).padStart(2, '0');
          const dateEchCP = `${y}-${m}-${d}`;

          horsConventionForm.value.contrat.datePremiereEcheance = dateEchCP;
          horsConventionForm.value.contrat.dateEch1 = dateEchCP;
          horsConventionForm.value.contrat.dateEch = dateEchCP;
          horsConventionForm.value.contrat.duration = 12;
          horsConventionForm.value.contrat.duree = 12;
        } else {
          if (!datePremiereEcheanceManuallyEdited.value) {
            const datePremiereEcheance = new Date(dateEffet);
            datePremiereEcheance.setMonth(dateEffet.getMonth() + 1);
            
            const dateString = datePremiereEcheance.toISOString().split('T')[0];
            horsConventionForm.value.contrat.datePremiereEcheance = dateString;
            horsConventionForm.value.contrat.dateEch1 = dateString;
          }
          
          // Calculer automatiquement la date d'échéance
          calculateDateEcheanceAuto();
        }
      }
    };
    
    // Fonction pour calculer automatiquement la date d'échéance
    const calculateDateEcheanceAuto = (): void => {
      if (dateEcheanceManuallyEdited.value) {
        return; // Ne pas recalculer si l'utilisateur a modifié manuellement
      }
      
      const creditType = horsConventionForm.value.contrat.creditType;
      if (creditType === 'CP') {
        const baseDateStr = horsConventionForm.value.contrat.dateEffet || new Date().toISOString().split('T')[0];
        const dEff = new Date(baseDateStr);
        if (!isNaN(dEff.getTime())) {
          const dEch = new Date(dEff);
          dEch.setFullYear(dEch.getFullYear() + 1);
          dEch.setDate(dEch.getDate() - 1);
          const y = dEch.getFullYear();
          const m = String(dEch.getMonth() + 1).padStart(2, '0');
          const d = String(dEch.getDate()).padStart(2, '0');
          const dateEchCP = `${y}-${m}-${d}`;
          horsConventionForm.value.contrat.dateEch = dateEchCP;
          horsConventionForm.value.contrat.datePremiereEcheance = dateEchCP;
          horsConventionForm.value.contrat.dateEch1 = dateEchCP;
        }
        return;
      }
      
      const datePremiereEcheance = horsConventionForm.value.contrat.dateEch1 || horsConventionForm.value.contrat.datePremiereEcheance;
      const duration = horsConventionForm.value.contrat.duration;
      const idPeriodicite = horsConventionForm.value.contrat.idPeriodicite;
      const differe = horsConventionForm.value.contrat.differe || 0;
      
      if (!datePremiereEcheance || !duration || !idPeriodicite || periodicites.value.length === 0) {
        return;
      }
      
      // Trouver la périodicité sélectionnée
      const periodicite = periodicites.value.find(p => p.id === idPeriodicite);
      if (!periodicite || !periodicite.nombreMois) {
        return;
      }
      
      const nombreMoisPeriodicite = periodicite.nombreMois;
      
      // Calculer la date d'échéance
      const dateEch = calculateDateEcheance(
        datePremiereEcheance,
        duration,
        nombreMoisPeriodicite,
        differe
      );
      
      if (dateEch) {
        horsConventionForm.value.contrat.dateEch = dateEch;
      }
    };
    
    // Fonction pour gérer la modification manuelle de la date d'échéance
    const handleDateEcheanceManualEdit = (): void => {
      dateEcheanceManuallyEdited.value = true;
      checkFormValidity();
    };

    // Fonction pour gérer la modification manuelle de la date de 1re échéance
    const handleDatePremiereEcheanceInput = (): void => {
      datePremiereEcheanceManuallyEdited.value = true;
      if (horsConventionForm.value.contrat.dateEch1) {
        horsConventionForm.value.contrat.datePremiereEcheance = horsConventionForm.value.contrat.dateEch1;
      }
      calculateDateEcheanceAuto();
      checkFormValidity();
    };
    
    // Fonction pour réinitialiser le calcul automatique
    const resetDateEcheanceAuto = (): void => {
      dateEcheanceManuallyEdited.value = false;
      calculateDateEcheanceAuto();
    };
    
    // Fonction pour gérer le changement de périodicité
    const handlePeriodiciteChange = (): void => {
      calculateDateEcheanceAuto();
      checkFormValidity();
    };
    
    // Fonction pour gérer le changement de différé
    const handleDiffereChange = (): void => {
      calculateDateEcheanceAuto();
      checkFormValidity();
    };
    
    // Fonction pour obtenir le libellé de la périodicité
    const getPeriodiciteLabel = (idPeriodicite: number | null): string => {
      if (!idPeriodicite) return '-';
      const periodicite = periodicites.value.find(p => p.id === idPeriodicite);
      return periodicite ? periodicite.libelle : '-';
    };

    // Fonction pour calculer automatiquement la PUTTC
    const calculatePutcc = (): void => {
      const pd = validateNumericValue(horsConventionForm.value.primes.pd, 0);
      const pc = validateNumericValue(horsConventionForm.value.primes.pc, 0);
      const surp = validateNumericValue(horsConventionForm.value.primes.surp, 0);
      const acc = validateNumericValue(horsConventionForm.value.primes.acc, 0);
      const fm = validateNumericValue(horsConventionForm.value.primes.fm, 0);
      
      const total = pd + pc + surp + acc + fm;
      horsConventionForm.value.primes.puttc = total;
      
      // Vérifier que PUTTC est supérieur à 0
      if (total <= 0) {
        // PUTTC calculé à 0 ou moins, au moins une prime doit être saisie
      }
      
      // Vérifier la validité après le calcul
      checkFormValidity();
    };

    // Fonction pour valider la date d'échéance
    const validateDateEch = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedDate = new Date(target.value);
      const dateEch1 = horsConventionForm.value.contrat.dateEch1;
      
      if (dateEch1) {
        const dateEch1Obj = new Date(dateEch1);
        
        if (selectedDate < dateEch1Obj) {
          const correctedDate = new Date(dateEch1Obj);
          correctedDate.setMonth(dateEch1Obj.getMonth() + 1);
          const correctedDateString = correctedDate.toISOString().split('T')[0];
          
          target.value = correctedDateString;
          horsConventionForm.value.contrat.dateEch = correctedDateString;
          error('La date d\'échéance ne peut pas être antérieure à la date de première échéance. Date corrigée.');
        }
      }
      
      checkFormValidity();
    };

    // Fonction pour gérer la conversion automatique en majuscules dans le modal
    const handleModalUppercaseInput = (event: Event, fieldPath: string): void => {
      const target = event.target as HTMLInputElement;
      const uppercaseValue = target.value.toUpperCase();
      
      // Mettre à jour la valeur dans l'input
      target.value = uppercaseValue;
      
      // Mettre à jour la valeur dans l'objet horsConventionForm
      const pathParts = fieldPath.split('.');
      if (pathParts.length === 2) {
        const [section, field] = pathParts;
        if (section === 'contrat' && field in horsConventionForm.value.contrat) {
          (horsConventionForm.value.contrat as any)[field] = uppercaseValue;
        }
      }
    };

    // Fonction pour créer un contrat hors convention
    const createHorsConventionContract = async (): Promise<void> => {
      // Protection contre les doubles clics
      if (isCreating.value) {
        return;
      }
      
      try {
        isCreating.value = true;
        
        // Appeler la fonction de soumission
        await handleHorsConventionSubmit(horsConventionForm.value);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de la création:', err);
        error('Erreur lors de la création du contrat hors convention. Veuillez réessayer.');
      } finally {
        isCreating.value = false;
      }
    };

    // Fonction de soumission du formulaire
    const handleHorsConventionSubmit = async (values: any): Promise<void> => {
      try {
        
        if (!props.selectedClient?.id) {
          throw new Error('Aucun client sélectionné');
        }
        
        let idNatureCredit = 1;
        if (values.contrat.creditType === 'CP') idNatureCredit = 2;
        else if (values.contrat.creditType === 'OBA') idNatureCredit = 3;
        
        // Créer le contrat hors convention
        const contractData: any = {
          idCustomer: values.idCustomer, // Utiliser l'ID du client du formulaire
          capital: validateNumericValue(values.contrat.capital, 1000000),
          duration: validateNumericValue(values.contrat.duration, 12),
          dateEff: values.contrat.dateEffet,
          dateEch1: values.contrat.dateEch1,
          dateEch: values.contrat.dateEch,
          garantieCompl: values.contrat.garantieCompl,
          etablissement: values.contrat.etablissement,
          idNatureCredit: idNatureCredit,
          idPeriodicite: values.contrat.idPeriodicite || 1,
          differe: values.contrat.differe || 0,
          taux: validateNumericValue(values.contrat.tauxInteret, 0),
          commission: 0,
          description: `Contrat hors convention créé`,
          isActive: true,
          createdBy: 1,
          isHorsConvention: true, // Flag pour identifier les contrats hors convention
          contractType: ContractType.HORS_CONVENTION, // Type de contrat
          // Primes d'assurance
          pd: validateNumericValue(values.primes.pd, 0),
          pc: validateNumericValue(values.primes.pc, 0),
          surp: validateNumericValue(values.primes.surp, 0),
          acc: validateNumericValue(values.primes.acc, 0),
          fm: validateNumericValue(values.primes.fm, 0),
          puttc: validateNumericValue(values.primes.puttc, 0)
        };

        if (values.contrat.creditType === 'OBA') {
          // Valider les options OBA
          const assureAge = props.selectedClient?.birthdate ? calculateAge(props.selectedClient.birthdate) : 0;
          const conjointAge = values.contrat.obaOptions.conjoint.checked && values.contrat.obaOptions.conjoint.birthdate
            ? calculateAge(values.contrat.obaOptions.conjoint.birthdate)
            : 0;

          if (values.contrat.obaOptions.ascendant1.checked && values.contrat.obaOptions.ascendant1.birthdate) {
            const parentAge = calculateAge(values.contrat.obaOptions.ascendant1.birthdate);
            if (parentAge <= assureAge) {
              error("Le Père de l'Assuré doit être plus âgé que l'Assuré.");
              return;
            }
          }
          if (values.contrat.obaOptions.ascendant2.checked && values.contrat.obaOptions.ascendant2.birthdate) {
            const parentAge = calculateAge(values.contrat.obaOptions.ascendant2.birthdate);
            if (parentAge <= assureAge) {
              error("La Mère de l'Assuré doit être plus âgée que l'Assuré.");
              return;
            }
          }
          if (values.contrat.obaOptions.ascendant3.checked && values.contrat.obaOptions.ascendant3.birthdate) {
            const parentAge = calculateAge(values.contrat.obaOptions.ascendant3.birthdate);
            if (parentAge <= conjointAge) {
              error("Le Père du (de la) Conjoint(e) doit être plus âgé que le (la) Conjoint(e).");
              return;
            }
          }
          if (values.contrat.obaOptions.ascendant4.checked && values.contrat.obaOptions.ascendant4.birthdate) {
            const parentAge = calculateAge(values.contrat.obaOptions.ascendant4.birthdate);
            if (parentAge <= conjointAge) {
              error("La Mère du (de la) Conjoint(e) doit être plus âgée que le (la) Conjoint(e).");
              return;
            }
          }

          // Mapper les options OBA pour l'API
          const mappedOpts: any = {};
          const configMap: any = {
            conjoint: { capital: 500000, prime: 2000 },
            ascendant1: { capital: 500000, prime: 2500 },
            ascendant2: { capital: 500000, prime: 2500 },
            ascendant3: { capital: 500000, prime: 2500 },
            ascendant4: { capital: 500000, prime: 2500 }
          };

          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = values.contrat.obaOptions[key];
            if (opt && opt.checked) {
              if (!opt.birthdate) {
                error(`La date de naissance est obligatoire pour ${key}.`);
                return;
              }
              const age = calculateAge(opt.birthdate);
              const maxAge = key === 'conjoint' ? 65 : 75;
              if (age < 18 || age > maxAge) {
                error(`L'âge pour ${key} (${age} ans) doit être compris entre 18 et ${maxAge} ans.`);
                return;
              }
              mappedOpts[key] = {
                checked: true,
                lastname: opt.lastname || '',
                firstname: opt.firstname || '',
                birthdate: opt.birthdate || '',
                gender: opt.gender || (key === 'conjoint' || key.endsWith('2') || key.endsWith('4') ? 'F' : 'M'),
                capitalAssure: configMap[key].capital,
                prime: configMap[key].prime
              };
            }
          }
          contractData.obaOptions = mappedOpts;
        }

        if (values.contrat.creditType === 'CP') {
          contractData.renouvellementAuto = values.contrat.renouvellementAuto;
          contractData.compteBancaire = values.contrat.compteBancaire;
          contractData.numeroCompte = values.contrat.numeroCompte;
          contractData.beneficiaries = values.contrat.beneficiaries;
        }
        
        const response = await createContract(contractData);
        
        // Vérifier si la réponse indique un succès
        const isSuccess = response.success === true || 
                         (response.message && response.message.includes('créé avec succès')) ||
                         (response.data && response.data.success === true);
        
        if (isSuccess) {
          // Extraire l'ID du contrat créé
          const contractId = response?.data?.contract?.id || 
                           response?.data?.id || 
                           response?.contract?.id || 
                           response?.id;
          
          if (contractId) {
            createdContractId.value = contractId;
          }
          
          // Afficher le résultat de succès dans le modal
          resultType.value = 'success';
          resultMessage.value = response.message || 'Contrat hors convention créé avec succès';
          createdContract.value = response;
          showResult.value = true;
          
          // Émettre l'événement de succès
          emit('hors-convention-success');
        } else {
          // Afficher l'erreur dans le modal
          resultType.value = 'error';
          resultMessage.value = response.message || response.data?.message || 'Erreur lors de la création du contrat hors convention';
          showResult.value = true;
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la création du contrat hors convention:', err);
        console.error('❌ Détails de l\'erreur:', err.response?.data || err.message);
        
        // Afficher l'erreur dans le modal
        resultType.value = 'error';
        let errMsg = err.response?.data?.message || err.response?.data?.data?.message || err.message || 'Erreur lors de la création du contrat hors convention';
        if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
        resultMessage.value = errMsg;
        showResult.value = true;
      }
    };

    // Fonction pour créer un contrat
    const createContract = async (contractData: any): Promise<any> => {
      try {
        const response = await ApiService.post('/contracts/hors-convention', contractData);
        
        return response.data;
      } catch (error: any) {
        console.error('❌ Erreur lors de la création du contrat hors convention:', error);
        
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Erreur lors de la création du contrat hors convention'
        };
      }
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const formatDateLabel = (dateStr: string | null | undefined): string => {
      if (!dateStr) return 'N/A';
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return cleanDate;
    };

    const getCreditTypeLabel = (code: string): string => {
      if (code === 'AMORT') return 'AMORTISSABLE';
      if (code === 'CP') return 'PADME PROTECTION';
      if (code === 'OBA') return 'OBSEQUES ALAFIA';
      return code;
    };


    // Fonction pour télécharger le PDF du contrat
    const downloadContractPDF = async (contractId: number): Promise<void> => {
      if (isDownloadingPDF.value) {
        return;
      }

      try {
        isDownloadingPDF.value = true;
        
        const pdfUrl = `/contracts/${contractId}/pdf`;
        
        const response = await ApiService.vueInstance.axios.get(pdfUrl, {
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

        const link = document.createElement('a');
        link.href = url;
        
        const contractRef = createdContract.value?.data?.contract?.reference || 
                           createdContract.value?.data?.reference || 
                           createdContract.value?.contract?.reference || 
                           `contrat_${contractId}`;
        link.download = `contrat_hors_convention_${contractRef}.pdf`;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
        
        success('PDF téléchargé avec succès');
      } catch (err: any) {
        console.error('❌ Erreur lors du téléchargement du PDF:', err);
        
        if (err.response?.status === 404) {
          error('PDF du contrat non trouvé. Le contrat existe-t-il ?');
        } else if (err.response?.status === 500) {
          error('Erreur serveur lors de la génération du PDF');
        } else {
          error('Erreur lors du téléchargement du PDF');
        }
      } finally {
        isDownloadingPDF.value = false;
      }
    };

    // Fonction pour rediriger vers la liste des contrats
    const goToContractsList = () => {
      closeModal();
      router.push('/liste-contrats');
    };

    const natureCredits = ref<any[]>([]);
    const loadingNatureCredits = ref(false);

    const loadNatureCredits = async () => {
      try {
        loadingNatureCredits.value = true;
        const response = await ApiService.get('/nature-credits');
        const raw = response.data?.data?.data || response.data?.data?.natureCredits || response.data?.data || response.data?.natureCredits;
        if (Array.isArray(raw)) {
          natureCredits.value = raw.filter((nc: any) => nc.code === 'AMORT' || nc.code === 'CP' || nc.code === 'OBA');
        } else {
          natureCredits.value = [{ id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' }];
        }
      } catch (err: any) {
        natureCredits.value = [{ id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' }];
      } finally {
        loadingNatureCredits.value = false;
      }
    };

    // Fonction pour charger les périodicités
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
            { id: 4, libelle: 'Quadrimesuelle', code: '4', nombreMois: 4 },
            { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
            { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
            { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
          ];
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement des périodicités:', err);
        // Fallback avec les valeurs par défaut en cas d'erreur
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



    // Fonction pour valider la date d'effet
    const validateDateEffet = (event: Event) => {
      checkFormValidity();
    };

    // Fonction pour valider la date de première échéance
    const validateDateEcheance = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedDate = new Date(target.value);
      const dateEffet = horsConventionForm.value.contrat.dateEffet;
      
      if (dateEffet) {
        const dateEffetObj = new Date(dateEffet);
        
        if (selectedDate < dateEffetObj) {
          const nextMonth = new Date(dateEffetObj);
          nextMonth.setMonth(dateEffetObj.getMonth() + 1);
          const correctedDate = nextMonth.toISOString().split('T')[0];
          
          target.value = correctedDate;
          horsConventionForm.value.contrat.dateEch1 = correctedDate;
          horsConventionForm.value.contrat.datePremiereEcheance = correctedDate;
          error('La date de première échéance ne peut pas être antérieure à la date d\'effet. Date corrigée.');
        }
      }
      
      checkFormValidity();
    };

    // Fonction pour valider et nettoyer les valeurs numériques
    const validateNumericValue = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? defaultValue : numValue;
    };

    // Fonction pour gérer la saisie du capital
    const handleCapitalInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      
      if (value === '' || value === null || value === undefined) {
        horsConventionForm.value.contrat.capital = 1000000;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
          horsConventionForm.value.contrat.capital = numValue;
        }
      }
      
      checkFormValidity();
    };

    // Fonction pour gérer la saisie du taux d'intérêt
    const handleTauxInteretInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      
      if (value === '' || value === null || value === undefined) {
        horsConventionForm.value.contrat.tauxInteret = 0;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          // Limiter entre 0 et 100
          if (numValue < 0) {
            horsConventionForm.value.contrat.tauxInteret = 0;
          } else if (numValue > 100) {
            horsConventionForm.value.contrat.tauxInteret = 100;
          } else {
            horsConventionForm.value.contrat.tauxInteret = numValue;
          }
        }
      }
      
      checkFormValidity();
    };

    // Fonction pour gérer la saisie de la durée
    const handleDurationInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      
      if (value === '' || value === null || value === undefined) {
        horsConventionForm.value.contrat.duration = 12;
        horsConventionForm.value.contrat.duree = 12;
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 1) {
          horsConventionForm.value.contrat.duration = numValue;
          horsConventionForm.value.contrat.duree = numValue;
          
          // Calculer automatiquement la date d'échéance
          calculateDateEcheanceAuto();
        }
      }
      
      checkFormValidity();
    };

    // Fonction pour gérer la saisie des primes
    const handlePrimeInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      const fieldName = target.name;
      
      // Valeur par défaut si vide
      const defaultValue = 0;
      
      if (value === '' || value === null || value === undefined) {
        // Définir la valeur par défaut selon le champ
        if (fieldName === 'primes.pd') {
          horsConventionForm.value.primes.pd = defaultValue;
        } else if (fieldName === 'primes.pc') {
          horsConventionForm.value.primes.pc = defaultValue;
        } else if (fieldName === 'primes.surp') {
          horsConventionForm.value.primes.surp = defaultValue;
        } else if (fieldName === 'primes.acc') {
          horsConventionForm.value.primes.acc = defaultValue;
        } else if (fieldName === 'primes.fm') {
          horsConventionForm.value.primes.fm = defaultValue;
        }
      } else {
        const numValue = Number(value);
        
        if (!isNaN(numValue) && numValue >= 0) {
          // Assigner la valeur selon le champ
          if (fieldName === 'primes.pd') {
            horsConventionForm.value.primes.pd = numValue;
          } else if (fieldName === 'primes.pc') {
            horsConventionForm.value.primes.pc = numValue;
          } else if (fieldName === 'primes.surp') {
            horsConventionForm.value.primes.surp = numValue;
          } else if (fieldName === 'primes.acc') {
            horsConventionForm.value.primes.acc = numValue;
          } else if (fieldName === 'primes.fm') {
            horsConventionForm.value.primes.fm = numValue;
          }
        }
      }
      
      // Recalculer PUTTC après modification
      calculatePutcc();
    };

    // Fonction pour vérifier la validité du formulaire en temps réel
    const checkFormValidity = () => {
      if (currentStep.value === 1) {
        const contrat = horsConventionForm.value.contrat;
        const primes = horsConventionForm.value.primes;
        
        // Nettoyer les valeurs numériques
        contrat.capital = validateNumericValue(contrat.capital, 1000000);
        contrat.duration = validateNumericValue(contrat.duration, 12);
        contrat.tauxInteret = validateNumericValue(contrat.tauxInteret, 0);
        
        let isFormValid = contrat.capital > 0 && 
                           contrat.duration > 0 && 
                           !!contrat.dateEffet && 
                           !!contrat.dateEch1 && 
                           contrat.tauxInteret >= 0 && 
                           !!contrat.garantieCompl;
                           
        if (contrat.creditType === 'CP') {
          isFormValid = isFormValid &&
                        contrat.renouvellementAuto !== null &&
                        contrat.renouvellementAuto !== undefined &&
                        contrat.renouvellementAuto !== '' &&
                        !!contrat.compteBancaire &&
                        !!contrat.numeroCompte &&
                        contrat.numeroCompte.trim() !== '';
        }
        
        const tauxValide = contrat.tauxInteret !== null && 
                           contrat.tauxInteret !== undefined && 
                           !isNaN(Number(contrat.tauxInteret)) &&
                           Number(contrat.tauxInteret) >= 0 && 
                           Number(contrat.tauxInteret) <= 100;
        
        // Vérifier que PUTTC est toujours supérieur à 0
        const puttcValide = primes.puttc && Number(primes.puttc) > 0;
        
        if (isFormValid && tauxValide && puttcValide) {
          modalValidationError.value = '';
        } else if (!puttcValide) {
          modalValidationError.value = 'La Prime Unique TTC doit être supérieure à 0';
        } else {
          modalValidationError.value = '';
        }
      }
    };

    // Watchers pour déclencher le calcul automatique de la date d'échéance
    watch(() => horsConventionForm.value.contrat.dateEch1, () => {
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });
    
    watch(() => horsConventionForm.value.contrat.datePremiereEcheance, () => {
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });
    
    watch(() => horsConventionForm.value.contrat.duration, () => {
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });
    
    watch(() => horsConventionForm.value.contrat.idPeriodicite, () => {
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });
    
    watch(() => horsConventionForm.value.contrat.differe, () => {
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });
    
    watch(() => periodicites.value.length, () => {
      if (periodicites.value.length > 0 && !dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    });

    // Charger les options au montage du composant
    onMounted(async () => {
      await Promise.all([loadPeriodicites(), loadNatureCredits()]);
    });

    // Méthodes bénéficiaires
    const addBeneficiary = () => {
      if (!horsConventionForm.value.contrat.beneficiaries) {
        horsConventionForm.value.contrat.beneficiaries = [];
      }
      if (horsConventionForm.value.contrat.beneficiaries.length < 5) {
        horsConventionForm.value.contrat.beneficiaries.push({
          nomPrenoms: '',
          lienParente: '',
          pourcentage: 0
        });
      }
    };

    const removeBeneficiary = (index: number) => {
      if (horsConventionForm.value.contrat.beneficiaries) {
        horsConventionForm.value.contrat.beneficiaries.splice(index, 1);
      }
    };

    const totalPercentage = computed(() => {
      const beneficiaries = horsConventionForm.value.contrat.beneficiaries || [];
      return beneficiaries.reduce((acc, b) => acc + (Number(b.pourcentage) || 0), 0);
    });

    const beneficiaryValidationMessage = computed(() => {
      const beneficiaries = horsConventionForm.value.contrat.beneficiaries || [];
      if (beneficiaries.length === 0) {
        return 'Veuillez ajouter au moins un bénéficiaire.';
      }
      const sum = totalPercentage.value;
      if (sum !== 100) {
        return `Le total des parts doit être égal à 100%. Total actuel: ${sum}%.`;
      }
      return '';
    });

    const liensParenteList = ref<any[]>([
      { libelle: 'PERE' },
      { libelle: 'MERE' },
      { libelle: 'ENFANT' },
      { libelle: 'CONJOINT' },
      { libelle: 'FRERE' },
      { libelle: 'SOEUR' },
      { libelle: 'AUTRE' }
    ]);

    const fetchLiensParenteHC = async () => {
      try {
        const res = await ApiService.get('/lien-parente');
        const list = res.data.liensParente || res.data.data?.liensParente || res.data.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          liensParenteList.value = list.filter((i: any) => i.isActive !== false);
        }
      } catch (e) {
        console.warn('Fallback liens parente HC modal');
      }
    };

    onMounted(() => {
      fetchLiensParenteHC();
    });

    return {
      // État
      isCreating,
      showResult,
      liensParenteList,
      resultMessage,
      resultType,
      createdContract,
      createdContractId,
      isDownloadingPDF,
      currentStep,
      totalSteps,
      modalValidationError,
      horsConventionForm,
      horsConventionFormRef,
      horsConventionSchema,
      periodicites,
      loadingPeriodicites,
      natureCredits,
      loadingNatureCredits,
      dateEcheanceManuallyEdited,
      currentAge,
      totalPercentage,
      beneficiaryValidationMessage,
      
      // Méthodes
      closeModal,
      nextStep,
      prevStep,
      validateCurrentStep,
      adjustValuesToLimits,
      updateDatePremiereEcheance,
      validateDateEffet,
      validateDateEcheance,
      validateDateEch,
      calculatePutcc,
      handleCapitalInput,
      handleTauxInteretInput,
      handleDurationInput,
      handlePrimeInput,
      checkFormValidity,
      handleModalUppercaseInput,
      handleHorsConventionSubmit,
      createHorsConventionContract,
      formatCurrency,
      loadPeriodicites,
      resetForm,
      downloadContractPDF,
      goToContractsList,
      calculateDateEcheanceAuto,
      handleDateEcheanceManualEdit,
      handleDatePremiereEcheanceInput,
      resetDateEcheanceAuto,
      handlePeriodiciteChange,
      handleDiffereChange,
      getPeriodiciteLabel,
      addBeneficiary,
      removeBeneficiary,
      isObaOptionAgeValid,
      calculateAge,
      formatDateLabel,
      getCreditTypeLabel
    };
  }
});
</script>

<style scoped>
/* Styles pour la modal hors convention */
.hors-convention-modal-content .alert {
  border-left: 4px solid #33b04a;
  background-color: rgba(51, 176, 74, 0.1);
  border-color: rgba(51, 176, 74, 0.2);
}

.hors-convention-modal-content .alert i {
  color: #33b04a;
}

.form-step {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.text-uppercase {
  text-transform: uppercase !important;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Custom company colors for buttons */
.btn-success {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background-color: #2d9a41 !important;
  border-color: #2d9a41 !important;
  color: #231f20 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(51, 176, 74, 0.3);
}

.btn-primary {
  background-color: #ede947 !important;
  border-color: #ede947 !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #e8e441 !important;
  border-color: #e8e441 !important;
  color: #231f20 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(237, 233, 71, 0.3);
}

.btn-outline-primary {
  color: #33b04a !important;
  border-color: #33b04a !important;
  background-color: transparent;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(51, 176, 74, 0.3);
}

/* Form controls focus state */
.form-control:focus {
  border-color: #33b04a !important;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25) !important;
}

/* Text colors */
.text-primary {
  color: #33b04a !important;
}

/* Modal styling */
.modal-header {
  background-color: #231f20;
  border-bottom: 2px solid #33b04a;
  color: #ede947;
}

.modal-title {
  color: #ede947;
  font-weight: 600;
}

.modal-title .fas {
  color: #ede947;
}

/* Table styling */
.table th {
  background-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 600;
  border-color: #33b04a;
}

/* Badge styling */
.badge.bg-primary {
  background-color: #ede947 !important;
  color: #231f20 !important;
}

/* Styles pour formulaire multi-étapes dans la modal */
.hors-convention-modal-content .form-step {
  min-height: 200px;
  padding: 5px 0;
}

.hors-convention-modal-content .form-group {
  margin-bottom: 10px;
}

.hors-convention-modal-content .form-control {
  font-size: 16px;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.hors-convention-modal-content .form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.hors-convention-modal-content .form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 14px;
}

/* Styles pour le récapitulatif */
.hors-convention-modal-content .card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hors-convention-modal-content .card-header {
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
}

.hors-convention-modal-content .card-header.bg-success {
  background-color: #28a745 !important;
  border-color: #28a745;
}

.hors-convention-modal-content .card-body p {
  margin-bottom: 8px;
  font-size: 14px;
}

.hors-convention-modal-content .card-body strong {
  color: #495057;
  font-weight: 600;
}

/* Espacement optimisé pour la modal xlarge */
.modal-xlarge .modal-body {
  padding: 15px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* Footer fixe et toujours visible */
.modal-xlarge .modal-footer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  background: white !important;
  border-top: 1px solid #dee2e6 !important;
  padding: 15px 30px !important;
  z-index: 1050 !important;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1) !important;
  margin: 0 !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

/* Styles pour le slot footer du composant Modal */
.hors-convention-modal-wrapper .modal-footer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  background: white !important;
  border-top: 1px solid #dee2e6 !important;
  padding: 15px 30px !important;
  z-index: 1050 !important;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1) !important;
  margin: 0 !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.modal-xlarge .hors-convention-modal-content {
  min-height: 200px;
  max-height: none;
  overflow-y: visible;
  overflow-x: hidden;
  padding-bottom: 0;
}

/* S'assurer que le contenu ne déborde pas sur les boutons */
.hors-convention-modal-content .form-step {
  margin-bottom: 0px;
}

.hors-convention-modal-content .card {
  margin-bottom: 0px;
}

.hors-convention-modal-content .alert {
  margin-bottom: 0px;
}

/* Éviter le débordement horizontal */
.hors-convention-modal-content .row {
  margin-left: 0;
  margin-right: 0;
}

.hors-convention-modal-content .col-md-6,
.hors-convention-modal-content .col-md-4,
.hors-convention-modal-content .col-md-3 {
  padding-left: 8px;
  padding-right: 8px;
}

.hors-convention-modal-content .card-body {
  padding: 10px;
}

/* Styles pour la validation des champs requis */
.hors-convention-modal-content .form-control.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.hors-convention-modal-content .form-label .text-danger {
  font-weight: bold;
}

.hors-convention-modal-content .required {
  position: relative;
}

.hors-convention-modal-content .required::after {
  content: '*';
  color: #dc3545;
  font-weight: bold;
  margin-left: 4px;
}

/* Responsive pour mobile */
@media (max-width: 768px) {
  .modal-xlarge .modal-dialog {
    margin: 10px;
    max-width: calc(100% - 20px);
    height: calc(100vh - 20px);
  }
  
  .modal-xlarge .modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .modal-xlarge .modal-body {
    padding: 10px;
    flex: 1;
    overflow-y: auto;
    max-height: none;
    padding-bottom: 0;
  }
  
  .modal-xlarge .hors-convention-modal-content {
    min-height: auto;
    max-height: none;
    overflow-y: visible;
  }
  
  .hors-convention-modal-content .form-step {
    min-height: auto;
    padding: 10px 0;
  }
  
  .hors-convention-modal-content .form-group {
    margin-bottom: 15px;
  }
  
  .hors-convention-modal-content .card {
    margin-bottom: 10px;
  }
  
  .hors-convention-modal-content .card-body {
    padding: 10px;
  }
  
  /* Forcer l'affichage du footer sur mobile */
  .modal-xlarge .modal-footer,
  .hors-convention-modal-wrapper .modal-footer {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background: white !important;
    border-top: 1px solid #dee2e6 !important;
    padding: 15px 20px !important;
    z-index: 9999 !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
}

/* Responsive pour tablette */
@media (min-width: 769px) and (max-width: 1024px) {
  .modal-xlarge .modal-dialog {
    max-width: 90%;
    height: calc(100vh - 40px);
  }
  
  .modal-xlarge .modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .modal-xlarge .modal-body {
    flex: 1;
    overflow-y: auto;
    max-height: none;
  }
  
  .modal-xlarge .hors-convention-modal-content {
    max-height: none;
    overflow-y: visible;
  }
}

/* Responsive pour desktop */
@media (min-width: 1025px) {
  .modal-xlarge .modal-dialog {
    max-width: 80%;
    height: calc(100vh - 60px);
  }
  
  .modal-xlarge .modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .modal-xlarge .modal-body {
    flex: 1;
    overflow-y: auto;
    max-height: none;
  }
  
  .modal-xlarge .hors-convention-modal-content {
    max-height: none;
    overflow-y: visible;
  }
}

/* Style personnalisé pour l'alerte de validation */
.hors-convention-modal-content .alert-danger {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #dc3545;
  color: #721c24;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
}

.hors-convention-modal-content .alert-danger .fas {
  color: #dc3545;
}

/* Styles pour les summary-item */
.hors-convention-modal-content .summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #33b04a;
  margin-bottom: 3px;
}

.hors-convention-modal-content .summary-item .label {
  font-weight: 600;
  color: #495057;
}

.hors-convention-modal-content .summary-item .value {
  font-weight: 700;
  color: #33b04a;
  font-size: 1.1rem;
}

.hors-convention-modal-content .summary-item .value.highlight {
  color: #2d9a41;
  font-size: 1.3rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Premium Dashboard Styling for Recap Step */
.recap-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.recap-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.06);
  border-color: #33b04a;
}

.recap-card-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.recap-card-header h5 {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.recap-card-header i {
  font-size: 1rem;
  color: #33b04a;
}

.recap-card-body {
  padding: 0.85rem;
}

.recap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

@media (max-width: 576px) {
  .recap-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.recap-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.recap-item:hover {
  background-color: #f1f5f9;
}

.recap-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.recap-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}

/* Specific highlight for credit types */
.recap-badge-nature {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 700;
  background-color: #e2f5e5;
  color: #217a32;
  border: 1px solid #c7ebd1;
}

/* Premium dynamic pills for parameters */
.parameter-pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.parameter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.parameter-pill i {
  color: #33b04a;
}

.parameter-pill-label {
  color: #94a3b8;
  font-weight: 500;
}

/* Styled Premium Cards for calculated primes */
.premium-badges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
  width: 100%;
}

.premium-badges-grid.cp-oba {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 992px) {
  .premium-badges-grid,
  .premium-badges-grid.cp-oba {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .premium-badges-grid,
  .premium-badges-grid.cp-oba {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.premium-badge-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.premium-badge-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #cbd5e1;
}

.premium-badge-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.06);
}

.premium-badge-card.primary-premium {
  border-color: #c7ebd1;
  background: linear-gradient(135deg, #ffffff 0%, #f4fbf6 100%);
}

.premium-badge-card.primary-premium::before {
  background: #33b04a;
}

.premium-badge-card.primary-premium:hover {
  border-color: #33b04a;
}

.premium-card-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.premium-badge-card.primary-premium .premium-card-label {
  color: #1e6b2d;
}

.premium-card-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.premium-badge-card.primary-premium .premium-card-value {
  color: #217a32;
  font-size: 1.3rem;
}
</style>
