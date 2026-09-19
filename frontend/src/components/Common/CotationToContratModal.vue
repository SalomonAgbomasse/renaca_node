<!-- CotationToContratModal.vue -->
<template>
  <Modal
    :is-visible="visible"
    :title="computedModalTitle"
    icon="fas fa-file-contract"
    size="xlarge"
    @close="closeModal"
    @update:is-visible="$emit('update:visible', $event)"
    class="conversion-modal-wrapper"
  >
    <Form 
      ref="conversionFormRef" 
      :validation-schema="conversionSchema" 
      :initial-values="conversionForm"
      @submit="handleConversionSubmit"
      class="conversion-modal-content"
    >
      <!-- Message d'erreur de validation -->
      <div v-if="modalValidationError" class="alert alert-danger mb-4">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ modalValidationError }}
      </div>

      <!-- Message de succès de conversion -->
      <div v-if="conversionSuccess" class="alert alert-success mb-4">
        <div class="d-flex align-items-center">
          <i class="fas fa-check-circle me-3 fs-4"></i>
          <div class="flex-grow-1">
            <h5 class="mb-2">{{ conversionMessage }}</h5>
            <p class="mb-3">{{ isEditMode ? 'Le contrat a été modifié avec succès.' : 'Le contrat a été créé avec succès.' }} Vous pouvez maintenant télécharger le PDF du contrat.</p>
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
                @click="goToContractsList"
              >
                <i class="fas fa-list me-2"></i>
                Voir la liste des contrats
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Étape 1: Informations complètes du client -->
      <div v-if="currentStep === 1 && !conversionSuccess" class="form-step">
        <h5 class="mb-3 text-uppercase">
          <i class="fas fa-user-circle me-2"></i>
          Informations complètes de l'assuré
        </h5>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Nom <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.nom"
                v-model="conversionForm.client.nom"
                type="text" 
                class="form-control"
                placeholder="Nom de famille"
                required
                @input="handleModalUppercaseInput($event, 'client.nom')"
              />
              <input
                v-else
                v-model="conversionForm.client.nom"
                type="text" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.nom" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Prénoms <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.prenoms"
                v-model="conversionForm.client.prenoms"
                type="text" 
                class="form-control"
                placeholder="Prénoms"
                required
                @input="handleModalUppercaseInput($event, 'client.prenoms')"
              />
              <input
                v-else
                v-model="conversionForm.client.prenoms"
                type="text" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.prenoms" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Numéro Client <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.numCustomer"
                v-model="conversionForm.client.numCustomer"
                type="text" 
                class="form-control"
                placeholder="Numéro du client"
                maxlength="15"
                required
                @input="handleModalUppercaseInput($event, 'client.numCustomer')"
              />
              <input
                v-else
                v-model="conversionForm.client.numCustomer"
                type="text" 
                class="form-control bg-light"
                maxlength="15"
                readonly
                disabled
              />
              <ErrorMessage name="client.numCustomer" class="text-danger" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Lieu de naissance <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.lieuNaissance"
                v-model="conversionForm.client.lieuNaissance"
                type="text" 
                class="form-control"
                placeholder="Lieu de naissance"
                required
                @input="handleModalUppercaseInput($event, 'client.lieuNaissance')"
              />
              <input
                v-else
                v-model="conversionForm.client.lieuNaissance"
                type="text" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.lieuNaissance" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Email</label>
              <Field
                v-if="clientEditable"
                name="client.email"
                v-model="conversionForm.client.email"
                type="email" 
                class="form-control"
                placeholder="Adresse email"
              />
              <input
                v-else
                v-model="conversionForm.client.email"
                type="email" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.email" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Téléphone <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.telephone"
                v-model="conversionForm.client.telephone"
                type="tel" 
                class="form-control"
                placeholder="Téléphone"
                required
              />
              <input
                v-else
                v-model="conversionForm.client.telephone"
                type="tel" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.telephone" class="text-danger" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Sexe <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.sexe"
                v-model="conversionForm.client.sexe"
                as="select"
                class="form-select"
                required
              >
                <option value="">Sélectionner</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </Field>
              <select
                v-else
                v-model="conversionForm.client.sexe"
                class="form-select bg-light"
                disabled
              >
                <option value="">Sélectionner</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
              <ErrorMessage name="client.sexe" class="text-danger" />
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Type de client <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.typeAss"
                v-model="conversionForm.client.typeAss"
                as="select"
                class="form-select"
                required
              >
                <option value="">Sélectionner</option>
                <option value="1">Particulier</option>
                <option value="2">Personnel PADME</option>
              </Field>
              <select
                v-else
                v-model="conversionForm.client.typeAss"
                class="form-select bg-light"
                disabled
              >
                <option value="">Sélectionner</option>
                <option value="1">Particulier</option>
                <option value="2">Personnel PADME</option>
              </select>
              <ErrorMessage name="client.typeAss" class="text-danger" />
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group mb-3">
              <label class="form-label">Profession <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.profession"
                v-model="conversionForm.client.profession"
                type="text" 
                class="form-control"
                placeholder="Profession"
                required
                @input="handleModalUppercaseInput($event, 'client.profession')"
              />
              <input
                v-else
                v-model="conversionForm.client.profession"
                type="text" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.profession" class="text-danger" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Adresse <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.adresse"
                v-model="conversionForm.client.adresse"
                type="text" 
                class="form-control"
                placeholder="Adresse du client"
                required
                @input="handleModalUppercaseInput($event, 'client.adresse')"
              />
              <input
                v-else
                v-model="conversionForm.client.adresse"
                type="text" 
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.adresse" class="text-danger" />
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mb-3">
              <label class="form-label">Date de naissance <span class="text-danger">*</span></label>
              <Field
                v-if="clientEditable"
                name="client.dateNaissance"
                v-model="conversionForm.client.dateNaissance"
                type="date"
                class="form-control"
                :max="maxBirthDate"
                required
              />
              <input
                v-else
                v-model="conversionForm.client.dateNaissance"
                type="date"
                class="form-control bg-light"
                readonly
                disabled
              />
              <ErrorMessage name="client.dateNaissance" class="text-danger" />
              <div v-if="conversionForm.client.dateNaissance" class="text-muted small mt-1">
                <i class="fas fa-info-circle me-1"></i>
                Âge : {{ calculateAge(conversionForm.client.dateNaissance) }} ans
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Étape 2: Informations du contrat -->
      <div v-if="currentStep === 2 && !conversionSuccess && !isLoadingContract" class="form-step">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h5 class="text-uppercase mb-0">
            <i class="fa fa-file-contract me-2"></i>
            Informations du contrat
          </h5>
          <div v-if="conversionForm.contrat.creditType === 'OBA'" class="alert alert-info px-4 py-2 shadow-sm rounded-pill border-2 border-info d-inline-flex align-items-center mb-0">
            <i class="fas fa-shield-alt me-2 text-info fs-5"></i>
            <span class="fs-15 fw-bold text-info-emphasis">Total Capital Assuré : <span class="fs-17 text-dark ms-1">{{ conversionForm.contrat.capital.toLocaleString('fr-FR') }} FCFA</span></span>
          </div>
        </div>
        <div class="row">
          <!-- Nature de crédit -->
          <div class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Nature de crédit <span class="text-danger">*</span></label>
              <Field
                name="contrat.creditType"
                v-model="conversionForm.contrat.creditType"
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
            <div class="form-group mb-4">
              <label class="form-label">Taux d'intérêt <span class="text-danger">*</span></label>
              <Field
                name="contrat.tauxInteret"
                v-model="conversionForm.contrat.tauxInteret"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="form-control"
                :class="{ 'border-warning': Number(conversionForm.contrat.tauxInteret) === 0 }"
                placeholder="Taux d'intérêt (%)"
                required
                @input="validateTauxInteret"
              />
              <ErrorMessage name="contrat.tauxInteret" class="text-danger" />
              <!-- Avertissement si le taux est à 0 -->
              <div v-if="Number(conversionForm.contrat.tauxInteret) === 0" class="text-warning small mt-1 d-flex align-items-center gap-1">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Le taux d'intérêt est à 0%. Veuillez vérifier cette valeur.</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Rangée Capital & Durée pour NON-OBA -->
        <div v-if="conversionForm.contrat.creditType !== 'OBA'" class="row">
          <!-- Capital -->
          <div class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Capital <span class="text-danger">*</span></label>
              
              <!-- Dropdown pour CP -->
              <Field
                v-if="conversionForm.contrat.creditType === 'CP'"
                name="contrat.capital"
                as="select"
                class="form-select shadow-none"
                v-model="conversionForm.contrat.capital"
                required
              >
                <option :value="500000">Option 1 - 500 000 FCFA</option>
                <option :value="1000000">Option 2 - 1 000 000 FCFA</option>
              </Field>
              
              <!-- Input standard pour AMORT / Autre -->
              <Field
                v-else
                name="contrat.capital"
                v-model="conversionForm.contrat.capital"
                type="number" 
                class="form-control" 
                placeholder="Capital"
                :min="1"
                :max="10000000"
                @input="validateCapital"
                @blur="validateCapital"
                required
              />
              <ErrorMessage name="contrat.capital" class="text-danger" />
            </div>
          </div>
          <!-- Périodicité -->
          <div v-if="conversionForm.contrat.creditType !== 'CP'" class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Périodicité <span class="text-danger">*</span></label>
              <Field
                name="contrat.idPeriodicite"
                v-model="conversionForm.contrat.idPeriodicite"
                as="select"
                class="form-select"
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
          <!-- Durée (en mois) -->
          <div class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Durée (en mois) <span class="text-danger">*</span></label>
              <Field
                name="contrat.duration"
                v-model="conversionForm.contrat.duration"
                type="number" 
                class="form-control" 
                :class="{ 'bg-light': conversionForm.contrat.creditType === 'CP' }"
                placeholder="Durée en mois"
                :disabled="conversionForm.contrat.creditType === 'CP'"
                :min="minDuration"
                :max="maxDuration"
                @input="validateDuration"
                @blur="validateDuration"
                required
              />
              <small v-if="maxDuration < 120" class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Durée maximale : {{ maxDuration }} mois (Type: {{ conversionForm.contrat.creditType }}, Âge: {{ currentAge }} ans)
              </small>
              <ErrorMessage name="contrat.duration" class="text-danger" />
            </div>
          </div>
          <!-- Durée de différée (en mois) -->
          <div v-if="conversionForm.contrat.creditType !== 'CP'" class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Durée de différée (en mois) <span class="text-danger">*</span></label>
              <Field
                name="contrat.dureeeDifferee"
                v-model="conversionForm.contrat.dureeeDifferee"
                as="select"
                class="form-select"
                required
              >
                <option value="0">0 mois</option>
                <option value="1">1 mois</option>
                <option value="2">2 mois</option>
                <option value="3">3 mois</option>
                <option value="4">4 mois</option>
                <option value="5">5 mois</option>
                <option value="6">6 mois</option>
              </Field>
            </div>
          </div>
        </div>

        <!-- Rangée Capital, Durée & Checklist pour OBA -->
        <div v-else class="mb-4">

          <!-- Hidden fields for VeeValidate to pass OBA capital and duration -->
          <Field name="contrat.capital" type="hidden" v-model="conversionForm.contrat.capital" />
          <Field name="contrat.duration" type="hidden" :value="12" />

          <div class="row">
            <!-- Groupe Assuré -->
            <div class="col-md-6">
              <div class="border-bottom pb-2 mb-3">
                <h6 class="text-black fw-bold mb-0">
                  <i class="fas fa-user-circle text-primary me-2"></i>Groupe Assuré
                </h6>
              </div>

              <!-- Assuré (Toujours coché/activé car renseigné à l'étape 1) -->
              <div class="card p-3 border-2 border-primary mb-3 bg-light shadow-sm">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" checked disabled id="modal-oba-opt-assure" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-assure">
                      Assuré Principal
                    </label>
                  </div>
                  <span class="badge bg-primary">Renseigné Étape 1</span>
                </div>
              </div>

              <!-- Père Assuré -->
              <div class="card p-3 border-2 mb-3" :class="conversionForm.contrat.obaOptions.ascendant1.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant1" v-model="conversionForm.contrat.obaOptions.ascendant1.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant1">
                      Père Assuré
                    </label>
                  </div>
                </div>
                
                <!-- Inputs Père Assuré si coché -->
                <div v-if="conversionForm.contrat.obaOptions.ascendant1.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant1.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant1.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant1.firstname"
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
                          v-model="conversionForm.contrat.obaOptions.ascendant1.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mère Assuré -->
              <div class="card p-3 border-2 mb-3" :class="conversionForm.contrat.obaOptions.ascendant2.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant2" v-model="conversionForm.contrat.obaOptions.ascendant2.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant2">
                      Mère Assuré
                    </label>
                  </div>
                </div>
                
                <!-- Inputs Mère Assuré si coché -->
                <div v-if="conversionForm.contrat.obaOptions.ascendant2.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant2.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant2.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant2.firstname"
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
                          v-model="conversionForm.contrat.obaOptions.ascendant2.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
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
              <div class="card p-3 border-2 mb-3" :class="conversionForm.contrat.obaOptions.conjoint.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle'">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-conjoint" v-model="conversionForm.contrat.obaOptions.conjoint.checked" @change="if(!conversionForm.contrat.obaOptions.conjoint.checked) { conversionForm.contrat.obaOptions.ascendant3.checked = false; conversionForm.contrat.obaOptions.ascendant4.checked = false; }" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-conjoint">
                      Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <!-- Inputs conjoint si coché -->
                <div v-if="conversionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom <span class="text-danger">*</span></label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.conjoint.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom du conjoint"
                          required
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.conjoint.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms <span class="text-danger">*</span></label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.conjoint.firstname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Prénoms du conjoint"
                          required
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Date de naissance <span class="text-danger">*</span></label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.conjoint.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Père Conjoint -->
              <div class="card p-3 border-2 mb-3" :class="[
                conversionForm.contrat.obaOptions.ascendant3.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle',
                !conversionForm.contrat.obaOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
              ]">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant3" v-model="conversionForm.contrat.obaOptions.ascendant3.checked" :disabled="!conversionForm.contrat.obaOptions.conjoint.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant3">
                      Père Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <!-- Inputs Père Conjoint si coché -->
                <div v-if="conversionForm.contrat.obaOptions.ascendant3.checked && conversionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant3.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant3.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant3.firstname"
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
                          v-model="conversionForm.contrat.obaOptions.ascendant3.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mère Conjoint -->
              <div class="card p-3 border-2 mb-3" :class="[
                conversionForm.contrat.obaOptions.ascendant4.checked ? 'border-primary bg-light-subtle shadow-sm' : 'border-light-subtle',
                !conversionForm.contrat.obaOptions.conjoint.checked ? 'bg-light text-muted opacity-50' : ''
              ]">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 38px;">
                  <div class="form-check mb-0">
                    <input class="form-check-input me-2" type="checkbox" id="modal-oba-opt-ascendant4" v-model="conversionForm.contrat.obaOptions.ascendant4.checked" :disabled="!conversionForm.contrat.obaOptions.conjoint.checked" />
                    <label class="form-check-label fw-bold text-black cursor-pointer" for="modal-oba-opt-ascendant4">
                      Mère Conjoint(e)
                    </label>
                  </div>
                </div>
                
                <!-- Inputs Mère Conjoint si coché -->
                <div v-if="conversionForm.contrat.obaOptions.ascendant4.checked && conversionForm.contrat.obaOptions.conjoint.checked" class="mt-3 pt-3 border-top">
                  <div class="row">
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Nom (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant4.lastname"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Nom"
                          @input="handleModalUppercaseInput($event, 'contrat.obaOptions.ascendant4.lastname')"
                        />
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="form-group mb-2">
                        <label class="form-label small text-dark fw-bold">Prénoms (Optionnel)</label>
                        <input
                          v-model="conversionForm.contrat.obaOptions.ascendant4.firstname"
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
                          v-model="conversionForm.contrat.obaOptions.ascendant4.birthdate"
                          type="date"
                          class="form-control form-control-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">Date d'effet <span class="text-danger">*</span></label>
              <Field
                name="contrat.dateEffet"
                v-model="conversionForm.contrat.dateEffet"
                type="date" 
                class="form-control" 
                :class="{ 'bg-light': conversionForm.contrat.creditType === 'CP' }"
                :min="conversionForm.contrat.creditType === 'CP' ? null : todayDate"
                :readonly="conversionForm.contrat.creditType === 'CP'"
                :disabled="conversionForm.contrat.creditType === 'CP'"
                @change="updateDatePremiereEcheance"
                @input="validateDateEffet"
                required
              />
              <ErrorMessage name="contrat.dateEffet" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">Date de la 1re échéance <span class="text-danger">*</span></label>
              <Field
                name="contrat.datePremiereEcheance"
                v-model="conversionForm.contrat.datePremiereEcheance"
                type="date" 
                class="form-control" 
                :class="{ 'bg-light': conversionForm.contrat.creditType === 'CP' }"
                :min="conversionForm.contrat.creditType === 'CP' ? null : conversionForm.contrat.dateEffet"
                :readonly="conversionForm.contrat.creditType === 'CP'"
                :disabled="conversionForm.contrat.creditType === 'CP'"
                required
                @change="validateDatePremiereEcheance"
                @blur="validateDatePremiereEcheance"
              />
              <ErrorMessage name="contrat.datePremiereEcheance" class="text-danger" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">
                Date d'échéance <span class="text-danger">*</span>
                <button
                  v-if="dateEcheanceManuallyEdited && conversionForm.contrat.creditType !== 'CP'"
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
                v-model="conversionForm.contrat.dateEch1"
                type="date" 
                class="form-control" 
                :class="{ 'bg-light': conversionForm.contrat.creditType === 'CP' }"
                :min="conversionForm.contrat.creditType === 'CP' ? null : getMinDateEcheance"
                :readonly="conversionForm.contrat.creditType === 'CP'"
                :disabled="conversionForm.contrat.creditType === 'CP'"
                required
                @input="handleDateEcheanceManualEdit"
                @change="validateDateEcheance"
                @blur="validateDateEcheance"
              />
              <small v-if="!dateEcheanceManuallyEdited" class="text-muted d-block">
                <i class="fas fa-info-circle me-1"></i>
                Calculée automatiquement
              </small>
              <small v-else class="text-info d-block">
                <i class="fas fa-edit me-1"></i>
                Modifiée manuellement
              </small>
              <ErrorMessage name="contrat.dateEch1" class="text-danger" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Référence dossier </label>
              <Field
                name="contrat.reference"
                v-model="conversionForm.contrat.reference"
                type="text"
                class="form-control"
                placeholder="Référence dossier"
                required
                @input="handleModalUppercaseInput($event, 'contrat.reference')"
              />
              <ErrorMessage name="contrat.reference" class="text-danger" />
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mb-4">
              <label class="form-label">Établissement</label>
              <Field
                name="contrat.etablissement"
                v-model="conversionForm.contrat.etablissement"
                type="text"
                class="form-control"
                placeholder="Établissement"
                @input="handleModalUppercaseInput($event, 'contrat.etablissement')"
              />
              <ErrorMessage name="contrat.etablissement" class="text-danger" />
            </div>
          </div>
        </div>

        <!-- Champs spécifiques CP (PADME PROTECTION) -->
        <div v-if="conversionForm.contrat.creditType === 'CP'" class="row">
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">Renouvellement automatique <span class="text-danger">*</span></label>
              <select
                v-model="conversionForm.contrat.renouvellementAuto"
                class="form-select"
                required
              >
                <option value="">Sélectionner</option>
                <option :value="true">OUI</option>
                <option :value="false">NON</option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">Compte bancaire <span class="text-danger">*</span></label>
              <select
                v-model="conversionForm.contrat.compteBancaire"
                class="form-select"
                required
              >
                <option value="">Sélectionner</option>
                <option value="EPARGNE">EPARGNE</option>
                <option value="COURANT">COURANT</option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group mb-4">
              <label class="form-label">Numéro de compte <span class="text-danger">*</span></label>
              <input
                v-model="conversionForm.contrat.numeroCompte"
                type="text"
                class="form-control"
                placeholder="Numéro de compte"
                required
              />
            </div>
          </div>
        </div>
        
        
        

        
        <!-- Garantie Perte d'Emploi cachée -->
        <div class="row" style="display: none;">
          <div class="col-md-12">
            <div class="form-group mb-3">
              <label class="form-label">Garantie Perte d'Emploi <span class="text-danger">*</span></label>
              <div class="d-flex gap-3">
                <label class="d-flex align-items-center gap-2">
                  <input 
                    v-model="conversionForm.contrat.garantieCompl"
                    type="radio" 
                    value="OUI"
                  />
                  <span>Oui</span>
                </label>
                <label class="d-flex align-items-center gap-2">
                  <input 
                    v-model="conversionForm.contrat.garantieCompl"
                    type="radio" 
                    value="NON"
                  />
                  <span>Non</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Étape 3: Enregistrement des bénéficiaires (CP uniquement) -->
      <div v-if="currentStep === 3 && conversionForm.contrat.creditType === 'CP' && !conversionSuccess && !isLoadingContract" class="form-step">
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
              <tr v-for="(beneficiary, index) in conversionForm.contrat.beneficiaries" :key="index">
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
                    class="form-select"
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
                    <i class="flaticon-trash"></i>
                    <span>Supprimer</span>
                  </button>
                </td>
              </tr>
              <tr v-if="conversionForm.contrat.beneficiaries.length === 0">
                <td colspan="4" class="text-center text-muted py-3">
                  Aucun bénéficiaire enregistré. Cliquez sur "Ajouter un bénéficiaire" ci-dessous.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <button
            v-if="conversionForm.contrat.beneficiaries.length < 5"
            type="button"
            class="btn btn-outline-success btn-sm"
            @click="addBeneficiary"
          >
            <i class="fas fa-plus me-2"></i> Ajouter un bénéficiaire
          </button>
          
          <div class="text-end">
            <span class="badge" :class="totalPercentage === 100 ? 'bg-success' : 'bg-warning text-dark'">
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

      <!-- Étape 3 ou 4: Récapitulatif et validation -->
      <div v-if="((currentStep === 3 && conversionForm.contrat.creditType !== 'CP') || (currentStep === 4 && conversionForm.contrat.creditType === 'CP')) && !conversionSuccess && !isLoadingContract" class="form-step recap-step">
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
                    <span class="recap-value">{{ conversionForm.client.nom }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Prénoms</span>
                    <span class="recap-value">{{ conversionForm.client.prenoms }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date de naissance</span>
                    <span class="recap-value">{{ formatDateLabel(conversionForm.client.dateNaissance) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Sexe</span>
                    <span class="recap-value">{{ conversionForm.client.sexe }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Type de client</span>
                    <span class="recap-value">{{ conversionForm.client.typeAss === '1' ? 'Particulier' : 'Personnel de PADME' }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Adresse</span>
                    <span class="recap-value">{{ conversionForm.client.adresse }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Téléphone</span>
                    <span class="recap-value">{{ conversionForm.client.telephone }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Profession</span>
                    <span class="recap-value">{{ conversionForm.client.profession }}</span>
                  </div>
                  <div v-if="conversionForm.client.email" class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Email</span>
                    <span class="recap-value">{{ conversionForm.client.email }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bénéficiaires (CP uniquement) -->
            <div v-if="conversionForm.contrat.creditType === 'CP'" class="recap-card">
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
                      <tr v-for="(b, idx) in conversionForm.contrat.beneficiaries" :key="idx" style="border-bottom: 1px solid #f1f5f9;">
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
                    <span class="recap-value text-success">{{ formatCurrency(conversionForm.contrat.capital) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Durée</span>
                    <span class="recap-value">{{ conversionForm.contrat.duration }} mois</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Taux d'intérêt</span>
                    <span class="recap-value">{{ conversionForm.contrat.tauxInteret }}%</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date d'effet</span>
                    <span class="recap-value">{{ formatDateLabel(conversionForm.contrat.dateEffet) }}</span>
                  </div>
                  <div class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Type de crédit</span>
                    <span class="recap-value">
                      <span class="recap-badge-nature">{{ getCreditTypeLabel(conversionForm.contrat.creditType) }}</span>
                    </span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Date Ech 1</span>
                    <span class="recap-value">{{ formatDateLabel(conversionForm.contrat.datePremiereEcheance) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Établissement</span>
                    <span class="recap-value">{{ conversionForm.contrat.etablissement || 'N/A' }}</span>
                  </div>
                  <div class="recap-item" style="grid-column: span 2;">
                    <span class="recap-label">Référence dossier</span>
                    <span class="recap-value">{{ conversionForm.contrat.reference || 'N/A' }}</span>
                  </div>
                  <template v-if="conversionForm.contrat.creditType === 'CP'">
                    <div class="recap-item">
                      <span class="recap-label">Renouvellement auto</span>
                      <span class="recap-value">{{ conversionForm.contrat.renouvellementAuto ? 'OUI' : 'NON' }}</span>
                    </div>
                    <div class="recap-item">
                      <span class="recap-label">Compte bancaire</span>
                      <span class="recap-value">{{ conversionForm.contrat.compteBancaire }}</span>
                    </div>
                    <div class="recap-item" style="grid-column: span 2;">
                      <span class="recap-label">Numéro de compte</span>
                      <span class="recap-value">{{ conversionForm.contrat.numeroCompte }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Primes Recalculées -->
        <div class="recap-card" style="border-left: 4px solid #33b04a;">
          <div class="recap-card-header">
            <i class="fas fa-coins text-success"></i>
            <h5>Primes Recalculées</h5>
          </div>
          <div class="recap-card-body">
            <!-- Parameter Pills horizontally -->
            <div class="parameter-pills-container mb-4">
              <span class="parameter-pill">
                <i class="fas fa-wallet"></i>
                <span class="parameter-pill-label">Capital:</span>
                <span>{{ formatCurrency(conversionForm.contrat.capital) }}</span>
              </span>
              <span class="parameter-pill">
                <i class="fas fa-hourglass-half"></i>
                <span class="parameter-pill-label">Durée:</span>
                <span>{{ conversionForm.contrat.duration }} mois</span>
              </span>
              <span class="parameter-pill">
                <i class="fas fa-birthday-cake"></i>
                <span class="parameter-pill-label">Né le:</span>
                <span>{{ formatDateLabel(conversionForm.client.dateNaissance) }}</span>
              </span>
              <span class="parameter-pill">
                <i class="fas fa-user-tag"></i>
                <span class="parameter-pill-label">Tarif:</span>
                <span>{{ conversionForm.client.typeAss === '1' ? 'Particulier' : 'Personnel de PADME' }}</span>
              </span>
            </div>

            <!-- Loader / recalculated primes -->
            <div v-if="isRecalculatingPrimes" class="text-center py-4">
              <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Recalcul en cours...</span>
              </div>
              <p class="mt-2 text-muted fw-semibold">Recalcul des primes en cours...</p>
            </div>
            
            <div v-else>
              <!-- Si CP ou OBA: Afficher uniquement Prime Unique TTC et Prime Décès -->
              <div v-if="conversionForm.contrat.creditType === 'CP' || conversionForm.contrat.creditType === 'OBA'" class="premium-badges-grid cp-oba">
                <div class="premium-badge-card primary-premium">
                  <span class="premium-card-label">
                    <i class="fas fa-check-double"></i> Prime Unique TTC
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.puttc) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-heartbeat"></i> Prime Décès
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.pd) }}</span>
                </div>
              </div>
              
              <!-- Si AMORT: Afficher les 6 primes -->
              <div v-else class="premium-badges-grid">
                <div class="premium-badge-card primary-premium">
                  <span class="premium-card-label">
                    <i class="fas fa-check-double"></i> Prime Unique TTC
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.puttc) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-heartbeat"></i> Prime Décès
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.pd) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-briefcase"></i> Perte d'Emploi
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.pc) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-hand-holding-medical"></i> Surprime
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.surp) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-concierge-bell"></i> Accessoires
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.acc) }}</span>
                </div>
                <div class="premium-badge-card">
                  <span class="premium-card-label">
                    <i class="fas fa-file-medical-alt"></i> Frais Médicaux
                  </span>
                  <span class="premium-card-value">{{ formatCurrency(conversionForm.primes.fm) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Form>

    <template #footer>
      <div v-if="!conversionSuccess" class="modal-footer-buttons">
        <div class="footer-left">
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
        <div class="footer-right">
          <!-- Message d'erreur pour les champs manquants -->
          <div v-if="!canProceedToNextStep && missingRequiredFields.length > 0" class="me-3 alert alert-danger mb-0 py-2 px-3">
            <small class="d-flex align-items-center">
              <i class="fas fa-exclamation-circle me-2"></i>
              <span><strong>Champs requis non remplis :</strong> {{ missingRequiredFields.join(', ') }}</span>
            </small>
          </div>
          <button
            v-if="currentStep < totalSteps"
            type="button"
            :class="['btn', canProceedToNextStep ? 'btn-primary' : 'btn-danger']"
            :disabled="!canProceedToNextStep"
            @click="nextStep"
          >
            <i v-if="!canProceedToNextStep" class="fas fa-exclamation-triangle me-2"></i>
            Suivant
            <i class="fas fa-arrow-right ms-2"></i>
          </button>
          <button
            v-if="currentStep === totalSteps"
            type="button"
            class="btn btn-success"
            @click="convertToContract"
            :disabled="isConverting"
            :style="{ 
              opacity: isConverting ? 0.6 : 1,
              cursor: isConverting ? 'not-allowed' : 'pointer'
            }"
          >
            <span v-if="isConverting">
              <i class="spinner-border spinner-border-sm me-2"></i>
              {{ isEditMode ? 'Mise à jour en cours...' : 'Création en cours...' }}
            </span>
            <span v-else>
              <i class="fas fa-check me-2"></i>
              <span class="d-none d-sm-inline">{{ isEditMode ? 'Mettre à jour le contrat' : 'Créer le Contrat' }}</span>
              <span class="d-inline d-sm-none">{{ isEditMode ? 'Modifier' : 'Créer' }}</span>
            </span>
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, toRef } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success, calculateDateEcheance, extractFilenameFromResponse } from '../../utils/utils';
import {
  dateEffetSchema,
  datePremiereEcheanceSchema,
  dateEcheanceSchema,
  isDatePremiereEcheanceValid,
  isDateEcheanceValid,
  handleValidateDatePremiereEcheance,
  handleValidateDateEcheance,
  getMinDateEcheance as getMinDateEcheanceUtil
} from '../../utils/dateValidations';
import ApiService from '../../services/ApiService';
import JwtService from '../../services/JwtService';
import * as Yup from 'yup';
import Modal from './Modal.vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'CotationToContratModal',
  components: {
    Form,
    Field,
    ErrorMessage,
    Modal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedClient: {
      type: Object,
      default: null
    },
    selectedCotation: {
      type: Object,
      default: null
    },
    clientEditable: {
      type: Boolean,
      default: true
    },
    modalTitle: {
      type: String,
      default: 'Conversion en Contrat'
    },
    // Nouvelles props pour les valeurs par défaut
    defaultCreditType: {
      type: String,
      default: ''
    },
    defaultDuration: {
      type: Number,
      default: 12
    },
    defaultCapital: {
      type: Number,
      default: 0
    },
    defaultGarantieCompl: {
      type: String,
      default: 'OUI'
    },
    defaultNom: {
      type: String,
      default: ''
    },
    defaultPrenoms: {
      type: String,
      default: ''
    },
    defaultTypeClient: {
      type: String,
      default: '1'
    },
    defaultDateNaissance: {
      type: String,
      default: ''
    },
    contractToEdit: {
      type: Object,
      default: null
    }
  },
  emits: ['conversion-success', 'close', 'update:visible'],
  setup(props, { emit }) {
    // Composables
    const router = useRouter();
    
    // Refs
    const conversionFormRef = ref(null);
    const currentStep = ref(1);
    const totalSteps = computed(() => {
      return conversionForm.value.contrat.creditType === 'CP' ? 4 : 3;
    });
    const modalValidationError = ref('');
    const conversionSuccess = ref(false);
    const conversionMessage = ref('');
    const createdContractId = ref<number | null>(null);
    const isDownloadingPDF = ref(false);
    const isConverting = ref(false);
    const natureCredits = ref<any[]>([]);
    const loadingNatureCredits = ref(false);
    const isRecalculatingPrimes = ref(false);
    const periodicites = ref<any[]>([]);
    const loadingPeriodicites = ref(false);
    const dateEcheanceManuallyEdited = ref(false); // Indique si l'utilisateur a modifié manuellement la date d'échéance
    const datePremiereEcheanceManuallyEdited = ref(false); // Indique si l'utilisateur a modifié manuellement la date de 1re échéance
    const isLoadingContract = ref(false);
    const originalClientData = ref<any>(null); // Stocker les données client originales pour détecter les changements
    
    // Props réactifs
    const clientEditable = toRef(props, 'clientEditable');
    
    // Computed pour détecter le mode modification
    const isEditMode = computed(() => {
      return !!props.contractToEdit && !!props.contractToEdit.id;
    });
    
    // Debug
    watch(clientEditable, (newValue) => {
    }, { immediate: true });

    // Formulaire de conversion avec valeurs par défaut
    const conversionForm = ref({
      client: {
        nom: props.defaultNom || '',
        prenoms: props.defaultPrenoms || '',
        numCustomer: '',
        telephone: '',
        lieuNaissance: '',
        adresse: '',
        email: '',
        typeAss: props.defaultTypeClient || '1',
        sexe: '',
        profession: '',
        dateNaissance: props.defaultDateNaissance || ''
      },
      contrat: {
        creditType: props.defaultCreditType || '',
        dateEffet: new Date().toISOString().split('T')[0], // Date du jour par défaut
        duration: props.defaultDuration || 12,
        dureeeDifferee: '0', // Valeur par défaut pour le select
        idPeriodicite: 1, // Périodicité par défaut (Mensuelle)
        capital: props.defaultCapital || 0,
        tauxInteret: 0,
        dateEch1: (() => {
          // Calculer la date de première échéance (1 mois après la date d'effet)
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth.toISOString().split('T')[0];
        })(),
        datePremiereEcheance: (() => {
          // Calculer la date de première échéance (1 mois après la date d'effet)
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth.toISOString().split('T')[0];
        })(),
        garantieCompl: props.defaultGarantieCompl || 'OUI',
        etablissement: '',
        reference: '',
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
      primes: {
        pd: 0,
        pc: 0,
        surp: 0,
        acc: 0,
        fm: 0,
        puttc: 0
      }
    });

    // Schéma de validation
    const conversionSchema = Yup.object().shape({
      client: Yup.object().shape({
        nom: Yup.string().required('Le nom est obligatoire'),
        prenoms: Yup.string().required('Les prénoms sont obligatoires'),
        numCustomer: Yup.string()
          .required('Le numéro de client est obligatoire')
          .min(1, 'Le numéro de client est obligatoire')
          .max(15, 'Le numéro de client ne doit pas dépasser 15 caractères'),
        telephone: Yup.string().required('Le téléphone est obligatoire'),
        lieuNaissance: Yup.string().required('Le lieu de naissance est obligatoire'),
        adresse: Yup.string().required('L\'adresse est obligatoire'),
        email: Yup.string().email('Email invalide'),
        typeAss: Yup.string()
          .oneOf(['1', '2'], 'Le type de client est obligatoire')
          .required('Le type de client est obligatoire'),
        sexe: Yup.string().required('Le sexe est obligatoire'),
        profession: Yup.string().required('La profession est obligatoire'),
        dateNaissance: Yup.string()
          .required('La date de naissance est obligatoire')
          .test('valid-date', 'Veuillez saisir une date valide', function(value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          })
          .test('age-minimum', 'Le client doit avoir au moins 18 ans', function(value) {
            if (!value) return false;
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) { age--; }
            return age >= 18;
          })
          .test('age-maximum', function(value) {
            if (!value) return false;
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) { age--; }
            
            // Calculer l'âge limite selon le type de crédit
            const creditType = conversionForm.value.contrat.creditType || '';
            const maxAge = (creditType === 'CP' || creditType === 'OBA') ? 75 : 70;
            
            if (age > maxAge) {
              return this.createError({ message: `L'âge ne peut pas dépasser ${maxAge} ans (PADME)` });
            }
            return true;
          })
          .test('not-future', 'La date de naissance ne peut pas être dans le futur', function(value) {
            if (!value) return true;
            return new Date(value) <= new Date();
          })
      }),
      contrat: Yup.object().shape({
        creditType: Yup.string().required('Le type de crédit est obligatoire'),
        idPeriodicite: Yup.number()
          .nullable()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? null : Number(originalValue))
          .test('required-periodicite', 'La périodicité est obligatoire', function(value) {
            const creditType = conversionForm.value.contrat.creditType;
            if (creditType === 'CP' || creditType === 'OBA') {
              return true;
            }
            return value !== null && value !== undefined && value >= 1;
          }),
        dateEffet: Yup.string()
          .required('La date d\'effet est obligatoire')
          .test('not-past', 'La date d\'effet ne peut pas être antérieure à aujourd\'hui', function(value) {
            if (!value) return true;
            const creditType = conversionForm.value.contrat.creditType;
            if (creditType === 'CP') {
              return true;
            }
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate >= today;
          }),
        datePremiereEcheance: datePremiereEcheanceSchema('contrat'),
        duration: Yup.number()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
          .typeError('La durée doit être un nombre')
          .required('La durée en mois est obligatoire')
          .integer('La durée doit être un entier')
          .min(1, 'La durée minimale est 1 mois')
          .test('max-duration-padme', 'Durée maximale dépassée', function(value) {
            if (!value) return true;
            const creditType = conversionForm.value.contrat.creditType || '';
            if (creditType === 'CP' || creditType === 'OBA') {
              return true;
            }
            // Calcul dynamique selon l'âge (cohérent PADME)
            const contratForm = this.parent;
            let birthdate = (contratForm && contratForm.dateNaissance) || (contratForm && contratForm.client && contratForm.client.dateNaissance) || conversionForm.value.client.dateNaissance;
            if (!birthdate) return true;
            const today = new Date();
            const date = new Date(birthdate);
            let age = today.getFullYear() - date.getFullYear();
            const m = today.getMonth() - date.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < date.getDate())) { age--; }
            const maxDuration = (age >= 65 && age <= 70) ? 12 : 60;
            const message = (age >= 65 && age <= 70)
                ? 'La durée maximale pour 65-70 ans est 12 mois'
                : 'La durée maximale est 60 mois (18-65 ans)';
            if (value > maxDuration) {
              return this.createError({ message });
            }
            return true;
          })
        ,
        capital: Yup.number()
          .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
          .typeError('Le capital doit être un nombre')
          .required('Le capital est obligatoire')
          .min(1, 'Le capital doit être supérieur à 0')
          .max(10000000, 'Le capital maximal est 10 000 000 FCFA'),
        tauxInteret: Yup.number()
          .nullable()
          .transform((value, originalValue) => {
            // Accepter 0 comme valeur valide
            if (originalValue === '' || originalValue === null || originalValue === undefined) {
              return null;
            }
            const numValue = Number(originalValue);
            // Si c'est 0, le retourner tel quel (pas null)
            if (numValue === 0) {
              return 0;
            }
            return isNaN(numValue) ? null : numValue;
          })
          .required('Le taux d\'intérêt est obligatoire')
          .min(0, 'Le taux d\'intérêt ne peut pas être négatif')
          .max(100, 'Le taux d\'intérêt ne peut pas dépasser 100%'),
        dateEch1: dateEcheanceSchema('contrat'),
        dureeeDifferee: Yup.string()
          .oneOf(['0', '1', '2', '3', '4', '5', '6'], 'La durée de différée doit être entre 0 et 6 mois')
          .required('La durée de différée est obligatoire'),
        garantieCompl: Yup.string()
          .oneOf(['OUI', 'NON'], 'Un choix pour la garantie perte d\'emploi est obligatoire')
          .required('Un choix pour la garantie perte d\'emploi est obligatoire')
      })
    });

    // Fonction pour valider l'âge (18-70/75 ans)
    const isValidAge = (birthdate: string): boolean => {
      if (!birthdate) return false;
      
      const birthDate = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      const creditType = conversionForm.value.contrat.creditType || '';
      const maxAge = (creditType === 'CP' || creditType === 'OBA') ? 75 : 70;
      
      return actualAge >= 18 && actualAge <= maxAge;
    };

    // Fonction pour calculer l'âge
    const calculateAge = (birthdate: string): number => {
      if (!birthdate) return 0;
      
      const birthDate = new Date(birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      return actualAge;
    };

    // Fonction pour obtenir les limites selon le type de crédit et l'âge
    const getLimits = (creditType: string, age: number) => {
      const isAmort = creditType === 'AMORT';
      const isCP = creditType === 'CP';
      const isOBA = creditType === 'OBA';
      const isYoungAge = age >= 18 && age <= 59;
      const isOldAge = age >= 60 && age <= 64;

      if (isAmort) {
        return {
          maxCapital: isYoungAge ? 30000000 : (isOldAge ? 10000000 : 0),
          maxDuration: 120, // Pas de limite spécifique pour AMORT
          minDuration: 1
        };
      } else if (isCP) {
        return {
          maxCapital: 1000000,
          maxDuration: 12,
          minDuration: 1
        };
      } else if (isOBA) {
        return {
          maxCapital: 2000000,
          maxDuration: 12,
          minDuration: 12
        };
      }
      
      return {
        maxCapital: 0,
        maxDuration: 120,
        minDuration: 1
      };
    };

    /**
     * Liste des champs obligatoires manquants pour l'étape actuelle
     */
    const missingRequiredFields = computed(() => {
      const missing: string[] = [];
      
      if (currentStep.value === 1) {
        if (!conversionForm.value.client.nom) missing.push('Nom');
        if (!conversionForm.value.client.prenoms) missing.push('Prénoms');
        if (!conversionForm.value.client.numCustomer) missing.push('Numéro Client');
        if (!conversionForm.value.client.telephone) missing.push('Téléphone');
        if (!conversionForm.value.client.lieuNaissance) missing.push('Lieu de naissance');
        if (!conversionForm.value.client.adresse) missing.push('Adresse');
        if (!conversionForm.value.client.typeAss) missing.push('Type de client');
        if (!conversionForm.value.client.sexe) missing.push('Sexe');
        if (!conversionForm.value.client.profession) missing.push('Profession');
        if (!conversionForm.value.client.dateNaissance) missing.push('Date de naissance');
        else if (!isValidAge(conversionForm.value.client.dateNaissance)) {
          missing.push('Date de naissance (âge invalide)');
        }
      } else if (currentStep.value === 2) {
        if (!conversionForm.value.contrat.creditType) missing.push('Type de crédit');
        if (!conversionForm.value.contrat.dateEffet) missing.push('Date d\'effet');

        // Validation durée
        const durationVal = Number(conversionForm.value.contrat.duration);
        if (!conversionForm.value.contrat.duration || isNaN(durationVal)) {
          missing.push('Durée');
        } else if (durationVal < minDuration.value) {
          missing.push(`Durée (inférieure au minimum de ${minDuration.value} mois)`);
        } else if (durationVal > maxDuration.value) {
          missing.push(`Durée (dépasse le maximum de ${maxDuration.value} mois)`);
        }

        // Validation capital
        const capitalVal = Number(conversionForm.value.contrat.capital);
        if (!conversionForm.value.contrat.capital || isNaN(capitalVal)) {
          missing.push('Capital');
        } else if (capitalVal < 1) {
          missing.push('Capital (doit être supérieur à 0)');
        } else if (capitalVal > 10000000) {
          missing.push('Capital (dépasse le maximum de 10 000 000 FCFA)');
        } else if (maxCapital.value > 0 && capitalVal > maxCapital.value) {
          missing.push(`Capital (dépasse le maximum de ${maxCapital.value.toLocaleString('fr-FR')} FCFA)`);
        }

        // Le taux d'intérêt peut être 0, donc on vérifie seulement s'il n'est pas null/undefined
        const tauxInteret = conversionForm.value.contrat.tauxInteret;
        if (tauxInteret === null || tauxInteret === undefined || (typeof tauxInteret === 'number' && isNaN(tauxInteret))) {
          missing.push('Taux d\'intérêt');
        }
        
        const isYearValid = (dStr?: string) => {
          if (!dStr) return false;
          const y = new Date(dStr).getFullYear();
          return !isNaN(y) && y >= 1900 && y <= 2100;
        };

        // Validation des dates de contrat
        if (!conversionForm.value.contrat.datePremiereEcheance || !isYearValid(conversionForm.value.contrat.datePremiereEcheance)) {
          missing.push('Date de première échéance');
        } else if (conversionForm.value.contrat.dateEffet && isYearValid(conversionForm.value.contrat.dateEffet) && !isDatePremiereEcheanceValid(conversionForm.value.contrat.datePremiereEcheance, conversionForm.value.contrat.dateEffet)) {
          missing.push('Date de première échéance (antérieure à la date d\'effet)');
        }

        if (!conversionForm.value.contrat.dateEch1 || !isYearValid(conversionForm.value.contrat.dateEch1)) {
          missing.push('Date d\'échéance');
        } else if (conversionForm.value.contrat.datePremiereEcheance && isYearValid(conversionForm.value.contrat.datePremiereEcheance) && !isDateEcheanceValid(conversionForm.value.contrat.dateEch1, conversionForm.value.contrat.datePremiereEcheance)) {
          missing.push('Date d\'échéance (antérieure à la 1re échéance)');
        }

        if (!conversionForm.value.contrat.garantieCompl) missing.push('Garantie perte d\'emploi');
        
        // Validation spécifique CP
        if (conversionForm.value.contrat.creditType === 'CP') {
          if (conversionForm.value.contrat.renouvellementAuto === null || conversionForm.value.contrat.renouvellementAuto === undefined || conversionForm.value.contrat.renouvellementAuto === '') {
            missing.push('Renouvellement automatique');
          }
          if (!conversionForm.value.contrat.compteBancaire) {
            missing.push('Compte bancaire');
          }
          if (!conversionForm.value.contrat.numeroCompte || !conversionForm.value.contrat.numeroCompte.trim()) {
            missing.push('Numéro de compte');
          }
        }
        
        // Validation spécifique OBA
        if (conversionForm.value.contrat.creditType === 'OBA') {
          const opts = conversionForm.value.contrat.obaOptions;
          if (opts) {
            if (opts.conjoint?.checked) {
              if (!opts.conjoint.lastname || !opts.conjoint.lastname.trim()) {
                missing.push('Nom du conjoint');
              }
              if (!opts.conjoint.firstname || !opts.conjoint.firstname.trim()) {
                missing.push('Prénoms du conjoint');
              }
              if (!opts.conjoint.birthdate) {
                missing.push('Date de naissance du conjoint');
              }
            }
            if (opts.ascendant1?.checked && !opts.ascendant1.birthdate) {
              missing.push('Date de naissance du père assuré');
            }
            if (opts.ascendant2?.checked && !opts.ascendant2.birthdate) {
              missing.push('Date de naissance de la mère assuré');
            }
            if (opts.ascendant3?.checked && !opts.ascendant3.birthdate) {
              missing.push('Date de naissance du père conjoint');
            }
            if (opts.ascendant4?.checked && !opts.ascendant4.birthdate) {
              missing.push('Date de naissance de la mère conjoint');
            }
          }
        }
      } else if (currentStep.value === 3 && conversionForm.value.contrat.creditType === 'CP') {
        const list = conversionForm.value.contrat.beneficiaries;
        if (list.length === 0) {
          missing.push('Au moins un bénéficiaire');
        } else if (list.length > 5) {
          missing.push('Maximum 5 bénéficiaires');
        } else {
          let hasEmptyFields = false;
          for (const b of list) {
            if (!b.nomPrenoms || !b.nomPrenoms.trim()) hasEmptyFields = true;
            if (!b.lienParente) hasEmptyFields = true;
            if (!b.pourcentage || parseFloat(String(b.pourcentage)) <= 0) hasEmptyFields = true;
          }
          if (hasEmptyFields) {
            missing.push('Champs de bénéficiaire obligatoires');
          }
          if (totalPercentage.value !== 100) {
            missing.push('Somme des parts égale à 100%');
          }
        }
      }
      
      return missing;
    });

    // Computed
    const canProceedToNextStep = computed(() => {
      return missingRequiredFields.value.length === 0;
    });

    const canCreateContract = computed(() => {
      const canProceed = canProceedToNextStep.value;
      const isLastStep = currentStep.value === totalSteps.value;
      const result = canProceed && isLastStep;
      
      
      
      return result;
    });

    const todayDate = computed(() => {
      return new Date().toISOString().split('T')[0];
    });

    const minBirthDate = computed(() => {
      const today = new Date();
      const maxAge = 64;
      const minAge = 18;
      
      // Date minimum (18 ans aujourd'hui)
      const minDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      
      // Date maximum (64 ans aujourd'hui)
      const maxDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
      
      return maxDate.toISOString().split('T')[0];
    });

    const maxBirthDate = computed(() => {
      const today = new Date();
      const minAge = 18;
      
      // Date maximum (18 ans aujourd'hui)
      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      
      return maxDate.toISOString().split('T')[0];
    });

    // Computed pour les limites dynamiques
    const currentAge = computed(() => {
      return calculateAge(conversionForm.value.client.dateNaissance);
    });

    const currentLimits = computed(() => {
      return getLimits(conversionForm.value.contrat.creditType, currentAge.value);
    });

    const maxCapital = computed(() => {
      return currentLimits.value.maxCapital;
    });

    const maxDuration = computed(() => {
      return currentLimits.value.maxDuration;
    });

    const minDuration = computed(() => {
      return currentLimits.value.minDuration;
    });

    /**
     * Calcule la date minimale pour la date d'échéance
     * Elle doit être strictement supérieure à la date de première échéance
     * Utilise la fonction utilitaire réutilisable
     */
    const getMinDateEcheance = computed(() => {
      return getMinDateEcheanceUtil(
        conversionForm.value.contrat.datePremiereEcheance,
        conversionForm.value.contrat.dateEffet,
        todayDate.value
      );
    });

    /**
     * Titre du modal calculé dynamiquement selon le mode (création/modification)
     */
    const computedModalTitle = computed(() => {
      if (isEditMode.value && props.contractToEdit) {
        // En mode modification, afficher la référence ou la police du contrat
        const reference = props.contractToEdit.reference || conversionForm.value.contrat.reference;
        const police = props.contractToEdit.police;
        const identifier = reference || police || `#${props.contractToEdit.id}`;
        return `Modifier le contrat ${identifier}`;
      }
      // En mode création, utiliser le titre par défaut
      return props.modalTitle || 'Conversion en Contrat';
    });

    /**
     * Vérifie si les données client ont changé
     */
    const hasClientDataChanged = (original: any, current: any): boolean => {
      const fieldsToCheck = [
        'lastname', 'firstname', 'phone', 'email', 'address',
        'placeOfBirth', 'birthdate', 'occupation', 'gender',
        'idTypeCustomer', 'numCustomer'
      ];

      for (const field of fieldsToCheck) {
        const originalVal = original[field];
        const currentVal = current[field];
        
        // Normaliser les valeurs pour la comparaison
        const normalizedOriginal = originalVal === null || originalVal === undefined ? '' : String(originalVal).trim();
        const normalizedCurrent = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim();
        
        if (normalizedOriginal !== normalizedCurrent) {
          return true;
        }
      }
      return false;
    };

    // Méthodes
    const closeModal = () => {
      emit('update:visible', false);
      emit('close');
      resetModal();
    };

    const addBeneficiary = () => {
      if (conversionForm.value.contrat.beneficiaries.length < 5) {
        conversionForm.value.contrat.beneficiaries.push({
          nomPrenoms: '',
          lienParente: '',
          pourcentage: 0
        });
      }
    };

    const removeBeneficiary = (index: number) => {
      conversionForm.value.contrat.beneficiaries.splice(index, 1);
    };

    const totalPercentage = computed(() => {
      return conversionForm.value.contrat.beneficiaries.reduce((acc, curr) => {
        const val = parseFloat(String(curr.pourcentage));
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    });

    const beneficiaryValidationMessage = computed(() => {
      const list = conversionForm.value.contrat.beneficiaries;
      if (list.length === 0) {
        return "Vous devez ajouter au moins un bénéficiaire.";
      }
      const pct = totalPercentage.value;
      if (pct !== 100) {
        return `La somme des parts est actuellement de ${pct}%. Elle doit être exactement de 100%.`;
      }
      return '';
    });

    const resetModal = () => {
      currentStep.value = 1;
      conversionSuccess.value = false;
      conversionMessage.value = '';
      createdContractId.value = null;
      modalValidationError.value = '';
      isConverting.value = false;
      isDownloadingPDF.value = false;
      dateEcheanceManuallyEdited.value = false; // Réinitialiser le flag de modification manuelle
      originalClientData.value = null; // Réinitialiser les données client originales
      
      // Réinitialiser les champs CP
      conversionForm.value.contrat.renouvellementAuto = '' as any;
      conversionForm.value.contrat.compteBancaire = '';
      conversionForm.value.contrat.numeroCompte = '';
      conversionForm.value.contrat.beneficiaries = [];
    };

    const validateCapital = (event: Event) => {
      const target = event.target as HTMLInputElement;
      let value = parseFloat(target.value);
      
      if (isNaN(value)) {
        conversionForm.value.contrat.capital = target.value as any;
        return;
      }

      conversionForm.value.contrat.capital = value;
      
      // Maximum absolu PADME : 10 000 000 FCFA
      const MAX_CAPITAL_PADME = 10000000;
      const limits = currentLimits.value;
      const effectiveMax = (limits && limits.maxCapital > 0) ? Math.min(MAX_CAPITAL_PADME, limits.maxCapital) : MAX_CAPITAL_PADME;
      
      if (event.type === 'blur' || event.type === 'change') {
        if (value < 1) {
          conversionForm.value.contrat.capital = 1;
          target.value = '1';
        } else if (value > effectiveMax) {
          conversionForm.value.contrat.capital = effectiveMax;
          target.value = effectiveMax.toString();
          error(`Le capital maximal est ${effectiveMax.toLocaleString('fr-FR')} FCFA. La valeur a été ajustée automatiquement.`);
        }
      }
    };

    const nextStep = async () => {
      
      if (canProceedToNextStep.value && currentStep.value < totalSteps.value) {
        currentStep.value++;
        
        // Si on passe à l'étape 2 (Informations du contrat), ajuster les valeurs selon les limites
        if (currentStep.value === 2) {
          adjustValuesToLimits();
          // Calculer la date d'échéance si elle n'a pas été modifiée manuellement
          if (!dateEcheanceManuallyEdited.value && periodicites.value.length > 0) {
            nextTick(() => {
              calculateDateEcheanceAuto();
            });
          }
        }
        
        // Si on passe à l'étape 3 (Bénéficiaires pour CP, Recap pour non-CP)
        if (currentStep.value === 3) {
          if (conversionForm.value.contrat.creditType !== 'CP') {
            await recalculatePrimes();
          }
        }
        
        // Si on passe à l'étape 4 (Recap pour CP)
        if (currentStep.value === 4 && conversionForm.value.contrat.creditType === 'CP') {
          await recalculatePrimes();
        }
      } else {
      }
    };

    const prevStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };

    const handleModalUppercaseInput = (event: Event, fieldPath: string) => {
      const target = event.target as HTMLInputElement;
      if (target) {
        target.value = target.value.toUpperCase();
        // Mettre à jour la valeur dans le formulaire
        const pathParts = fieldPath.split('.');
        let current: any = conversionForm.value;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = target.value;
      }
    };

    const updateDatePremiereEcheance = () => {
      if (conversionForm.value.contrat.creditType === 'CP') {
        if (conversionForm.value.contrat.dateEffet) {
          const dEff = new Date(conversionForm.value.contrat.dateEffet);
          if (!isNaN(dEff.getTime())) {
            const dEch = new Date(dEff);
            dEch.setFullYear(dEch.getFullYear() + 1);
            dEch.setDate(dEch.getDate() - 1);
            const y = dEch.getFullYear();
            const m = String(dEch.getMonth() + 1).padStart(2, '0');
            const day = String(dEch.getDate()).padStart(2, '0');
            const dateEchCP = `${y}-${m}-${day}`;
            conversionForm.value.contrat.datePremiereEcheance = dateEchCP;
            conversionForm.value.contrat.dateEch1 = dateEchCP;
          }
        }
        return;
      }
      if (conversionForm.value.contrat.dateEffet) {
        if (!datePremiereEcheanceManuallyEdited.value) {
          const dateEffet = new Date(conversionForm.value.contrat.dateEffet);
          const dateEch1 = new Date(dateEffet);
          dateEch1.setMonth(dateEch1.getMonth() + 1);
          conversionForm.value.contrat.dateEch1 = dateEch1.toISOString().split('T')[0];
          conversionForm.value.contrat.datePremiereEcheance = dateEch1.toISOString().split('T')[0];
        }
        
        // Recalculer la date d'échéance si elle n'a pas été modifiée manuellement
        if (!dateEcheanceManuallyEdited.value) {
          calculateDateEcheanceAuto();
        }
      }
    };

    /**
     * Calcule automatiquement la date d'échéance en fonction de :
     * - La date de première échéance
     * - La durée totale en mois
     * - La périodicité
     * - Le différé
     */
    const calculateDateEcheanceAuto = () => {
      if (conversionForm.value.contrat.creditType === 'CP') {
        return;
      }
      if (!conversionForm.value.contrat.datePremiereEcheance || 
          !conversionForm.value.contrat.duration || 
          !conversionForm.value.contrat.idPeriodicite) {
        return;
      }

      // Trouver la périodicité sélectionnée pour obtenir nombreMois
      const periodiciteSelected = periodicites.value.find(
        p => p.id === conversionForm.value.contrat.idPeriodicite
      );

      if (!periodiciteSelected || !periodiciteSelected.nombreMois) {
        console.warn('Périodicité non trouvée ou nombreMois manquant');
        return;
      }

      const nombreMoisPeriodicite = periodiciteSelected.nombreMois;
      const dureeMois = Number(conversionForm.value.contrat.duration);
      const differeMois = Number(conversionForm.value.contrat.dureeeDifferee || '0');

      // Calculer la date d'échéance
      const dateEcheanceCalculee = calculateDateEcheance(
        conversionForm.value.contrat.datePremiereEcheance,
        dureeMois,
        nombreMoisPeriodicite,
        differeMois
      );

      if (dateEcheanceCalculee) {
        conversionForm.value.contrat.dateEch1 = dateEcheanceCalculee;
      }
    };

    /**
     * Gère la modification manuelle de la date d'échéance
     */
    const handleDateEcheanceManualEdit = () => {
      if (conversionForm.value.contrat.creditType === 'CP') {
        return;
      }
      dateEcheanceManuallyEdited.value = true;
    };

    /**
     * Réinitialise le calcul automatique de la date d'échéance
     */
    const resetDateEcheanceAuto = () => {
      if (conversionForm.value.contrat.creditType === 'CP') {
        return;
      }
      dateEcheanceManuallyEdited.value = false;
      calculateDateEcheanceAuto();
    };

    const validateDateEffet = (event: Event) => {
      const creditType = conversionForm.value.contrat.creditType;
      if (creditType === 'CP') {
        return;
      }
      const target = event.target as HTMLInputElement;
      const selectedDate = new Date(target.value);
      if (isNaN(selectedDate.getTime())) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(selectedDate);
      checkDate.setHours(0, 0, 0, 0);
      if (checkDate < today) {
        const todayString = today.toISOString().split('T')[0];
        target.value = todayString;
        conversionForm.value.contrat.dateEffet = todayString;
        updateDatePremiereEcheance();
        return;
      }

      // Vérifier que la date de première échéance est toujours valide
      if (conversionForm.value.contrat.datePremiereEcheance) {
        const datePremiere = new Date(conversionForm.value.contrat.datePremiereEcheance);
        selectedDate.setHours(0, 0, 0, 0);
        datePremiere.setHours(0, 0, 0, 0);
        
        if (datePremiere < selectedDate) {
          updateDatePremiereEcheance();
        }
      }
    };

    /**
     * Valide que la date de première échéance n'est pas antérieure à la date d'effet
     * Utilise la fonction utilitaire réutilisable
     */
    const validateDatePremiereEcheance = (event: Event) => {
      // Ne pas valider pendant la frappe
      if (event && event.type === 'input') {
        return;
      }
      datePremiereEcheanceManuallyEdited.value = true;
      if (conversionForm.value.contrat.creditType === 'CP') {
        if (!dateEcheanceManuallyEdited.value) {
          calculateDateEcheanceAuto();
        }
        return;
      }
      handleValidateDatePremiereEcheance(
        event,
        {
          dateEffet: conversionForm.value.contrat.dateEffet,
          datePremiereEcheance: conversionForm.value.contrat.datePremiereEcheance
        },
        (correctedDate) => {
          conversionForm.value.contrat.datePremiereEcheance = correctedDate;
          if (!dateEcheanceManuallyEdited.value) {
            calculateDateEcheanceAuto();
          }
        }
      );
      
      if (!dateEcheanceManuallyEdited.value) {
        calculateDateEcheanceAuto();
      }
    };

    /**
     * Valide que la date d'échéance n'est pas antérieure à la date de première échéance
     * Utilise la fonction utilitaire réutilisable
     */
    const validateDateEcheance = (event: Event) => {
      // Ne pas valider pendant la frappe
      if (event && event.type === 'input') {
        return;
      }
      dateEcheanceManuallyEdited.value = true;
      if (conversionForm.value.contrat.creditType === 'CP') {
        return;
      }
      handleValidateDateEcheance(
        event,
        {
          datePremiereEcheance: conversionForm.value.contrat.datePremiereEcheance,
          dateEch1: conversionForm.value.contrat.dateEch1
        },
        (correctedDate) => {
          conversionForm.value.contrat.dateEch1 = correctedDate;
        }
      );
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

    const validateDuration = (event: Event) => {
      const target = event.target as HTMLInputElement;
      let value = parseInt(target.value);
      
      if (isNaN(value)) {
        conversionForm.value.contrat.duration = target.value as any;
        return;
      }
      
      conversionForm.value.contrat.duration = value;
      
      const limits = currentLimits.value;
      
      if (event.type === 'blur' || event.type === 'change') {
        if (value < minDuration.value) {
          conversionForm.value.contrat.duration = minDuration.value;
          target.value = minDuration.value.toString();
        } else if (value > limits.maxDuration) {
          conversionForm.value.contrat.duration = limits.maxDuration;
          target.value = limits.maxDuration.toString();
        }
      }
    };

    // Fonction pour ajuster automatiquement les valeurs selon les limites
    const adjustValuesToLimits = () => {
      const age = currentAge.value;
      const creditType = conversionForm.value.contrat.creditType;
      
      // Vérifier que nous avons les données nécessaires
      if (!age || !creditType) {
        return;
      }
      
      const limits = getLimits(creditType, age);
      let hasChanges = false;
      
      // Ajuster le capital et la durée selon la nature
      if (creditType === 'CP') {
        if (conversionForm.value.contrat.capital !== 500000 && conversionForm.value.contrat.capital !== 1000000) {
          conversionForm.value.contrat.capital = 500000; // option 1 par défaut
          hasChanges = true;
        }
        
        // Durée fixée à 1 an (12 mois) pour PADME PROTECTION
        if (conversionForm.value.contrat.duration !== 12) {
          conversionForm.value.contrat.duration = 12;
          hasChanges = true;
        }

        // Périodicité et différée forcées pour CP
        if (conversionForm.value.contrat.idPeriodicite !== 12) {
          conversionForm.value.contrat.idPeriodicite = 12;
          hasChanges = true;
        }
        if (conversionForm.value.contrat.dureeeDifferee !== '0') {
          conversionForm.value.contrat.dureeeDifferee = '0';
          hasChanges = true;
        }

        // Date d'effet sera la date du jour plus 1 jour
        const dateEffCPObj = new Date();
        dateEffCPObj.setDate(dateEffCPObj.getDate() + 1);
        const yEffCP = dateEffCPObj.getFullYear();
        const mEffCP = String(dateEffCPObj.getMonth() + 1).padStart(2, '0');
        const dEffCP = String(dateEffCPObj.getDate()).padStart(2, '0');
        const dateEffCPStr = `${yEffCP}-${mEffCP}-${dEffCP}`;

        if (conversionForm.value.contrat.dateEffet !== dateEffCPStr) {
          conversionForm.value.contrat.dateEffet = dateEffCPStr;
          hasChanges = true;
        }

        // Date d'échéance = Date d'effet + 1 an - 1 jour (la veille dans un an)
        if (conversionForm.value.contrat.dateEffet) {
          const dEff = new Date(conversionForm.value.contrat.dateEffet);
          if (!isNaN(dEff.getTime())) {
            const dEch = new Date(dEff);
            dEch.setFullYear(dEch.getFullYear() + 1);
            dEch.setDate(dEch.getDate() - 1);
            const yCP = dEch.getFullYear();
            const mCP = String(dEch.getMonth() + 1).padStart(2, '0');
            const dayCP = String(dEch.getDate()).padStart(2, '0');
            const dateEchCP = `${yCP}-${mCP}-${dayCP}`;

            if (conversionForm.value.contrat.datePremiereEcheance !== dateEchCP) {
              conversionForm.value.contrat.datePremiereEcheance = dateEchCP;
              hasChanges = true;
            }
            if (conversionForm.value.contrat.dateEch1 !== dateEchCP) {
              conversionForm.value.contrat.dateEch1 = dateEchCP;
              hasChanges = true;
            }
          }
        }
      } else if (creditType === 'OBA') {
        
        // Durée forcée pour Obsèques Alafia (toujours 12 mois)
        if (conversionForm.value.contrat.duration !== 12) {
          conversionForm.value.contrat.duration = 12;
          hasChanges = true;
        }

        // Périodicité et différée forcées pour OBA
        if (conversionForm.value.contrat.idPeriodicite !== 12) {
          conversionForm.value.contrat.idPeriodicite = 12;
          hasChanges = true;
        }
        if (conversionForm.value.contrat.dureeeDifferee !== '0') {
          conversionForm.value.contrat.dureeeDifferee = '0';
          hasChanges = true;
        }
      } else {
        // AMORT / Autre
        if (conversionForm.value.contrat.capital > limits.maxCapital) {
          conversionForm.value.contrat.capital = limits.maxCapital;
          hasChanges = true;
        }
        if (conversionForm.value.contrat.duration > limits.maxDuration) {
          conversionForm.value.contrat.duration = limits.maxDuration;
          hasChanges = true;
        }
        if (conversionForm.value.contrat.duration < limits.minDuration) {
          conversionForm.value.contrat.duration = limits.minDuration;
          hasChanges = true;
        }
      }
      
      // Si la nature n'est pas CP, on valide que la date d'effet n'est pas antérieure à aujourd'hui,
      // et que la date de la 1re échéance n'est pas antérieure à la date d'effet.
      if (creditType !== 'CP') {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentEffet = conversionForm.value.contrat.dateEffet;
        
        // Si la date d'effet est vide ou antérieure à aujourd'hui, on la remet à aujourd'hui
        if (!currentEffet || currentEffet < todayStr) {
          conversionForm.value.contrat.dateEffet = todayStr;
          hasChanges = true;
        }

        const currentEffetDate = new Date(conversionForm.value.contrat.dateEffet);
        const currentPremiere = conversionForm.value.contrat.datePremiereEcheance;
        
        // Si la date de la 1re échéance est vide ou antérieure à la date d'effet, on la recalcule (1 mois après la date d'effet)
        if (!currentPremiere || new Date(currentPremiere) < currentEffetDate) {
          const nextMonth = new Date(currentEffetDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          conversionForm.value.contrat.datePremiereEcheance = nextMonth.toISOString().split('T')[0];
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // Notification optionnelle
      }
    };

    // Fonction pour recalculer les primes à l'étape 3
    const recalculatePrimes = async (): Promise<void> => {
      try {
        isRecalculatingPrimes.value = true;
        
        // Validation du type de client avant le recalcul
        if (!conversionForm.value.client.typeAss) {
          throw new Error('Le type de client est obligatoire pour le recalcul des primes.');
        }
        
        const typeClientValue = parseInt(conversionForm.value.client.typeAss);
        if (isNaN(typeClientValue) || (typeClientValue !== 1 && typeClientValue !== 2)) {
          throw new Error('Type de client invalide pour le recalcul.');
        }
        
        // Validation de la date de naissance
        if (!conversionForm.value.client.dateNaissance) {
          throw new Error('La date de naissance est obligatoire pour le recalcul des primes.');
        }
        
        const isCPorOBA = conversionForm.value.contrat.creditType === 'CP' || conversionForm.value.contrat.creditType === 'OBA';
        
        let idNatureCredit = 1;
        if (conversionForm.value.contrat.creditType === 'CP') idNatureCredit = 2;
        else if (conversionForm.value.contrat.creditType === 'OBA') idNatureCredit = 3;

        // Préparer les données pour le recalcul PADME
        const recalculationData: any = {
          creditType: conversionForm.value.contrat.creditType,
          idNatureCredit: idNatureCredit,
          capital: Number(conversionForm.value.contrat.capital),
          birthdate: conversionForm.value.client.dateNaissance, // birthdate au lieu de dateNaissance
          duration: Number(conversionForm.value.contrat.duration), // duration au lieu de duree
          idPeriodicite: isCPorOBA ? 12 : Number(conversionForm.value.contrat.idPeriodicite || 1),
          differe: isCPorOBA ? 0 : Number(conversionForm.value.contrat.dureeeDifferee || '0'),
          typeAss: String(conversionForm.value.client.typeAss), // typeAss au lieu de typeContrat pour correspondre à l'entité
          typeContrat: String(conversionForm.value.client.typeAss), // Garder aussi typeContrat pour compatibilité
          garantieCompl: isCPorOBA ? "NON" : (conversionForm.value.contrat.garantieCompl || "OUI")
        };

        if (conversionForm.value.contrat.creditType === 'OBA') {
          const rawOpts = conversionForm.value.contrat.obaOptions;
          const configMap: Record<string, { capital: number, prime: number }> = {
            conjoint: { capital: 500000, prime: 2000 },
            ascendant1: { capital: 500000, prime: 2500 },
            ascendant2: { capital: 500000, prime: 2500 },
            ascendant3: { capital: 500000, prime: 2500 },
            ascendant4: { capital: 500000, prime: 2500 },
            assure: { capital: 500000, prime: 2000 }
          };

          const mappedOpts: any = {};
          
          // Assuré principal
          mappedOpts.assure = {
            checked: true,
            birthdate: conversionForm.value.client.dateNaissance,
            lastname: conversionForm.value.client.nom,
            firstname: conversionForm.value.client.prenoms,
            gender: conversionForm.value.client.sexe === 'Homme' ? 'M' : 'F',
            capitalAssure: configMap.assure.capital,
            prime: configMap.assure.prime
          };

          // Membres secondaires
          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = rawOpts[key];
            if (opt) {
              mappedOpts[key] = {
                checked: !!opt.checked,
                lastname: opt.lastname || '',
                firstname: opt.firstname || '',
                birthdate: opt.birthdate || '',
                gender: opt.gender || (key.endsWith('2') || key.endsWith('4') || key === 'conjoint' ? 'F' : 'M'),
                capitalAssure: opt.checked ? configMap[key].capital : 0,
                prime: opt.checked ? configMap[key].prime : 0
              };
            }
          }

          recalculationData.obaOptions = mappedOpts;
        }

        console.log('📤 Données envoyées pour recalcul:', recalculationData);

        // Appel API PADME pour calculer uniquement les primes (sans créer de cotation)
        const response = await ApiService.post('/cotations/padme/calculate', recalculationData);

        console.log('📥 Réponse API recalcul:', response.data);

        // Gérer la réponse - l'intercepteur transforme la réponse du contrôleur
        // Structure: { code: 201, message: '...', data: { code: 200, data: {...}, error: false }, timestamp: '...' }
        // Il faut accéder à response.data.data.data pour obtenir les primes réelles
        let primesData: any = null;
        
        if (response.data && response.data.data) {
          // Si la réponse du contrôleur a une structure avec data.data
          if (response.data.data.data && typeof response.data.data.data === 'object') {
            primesData = response.data.data.data;
          } 
          // Sinon, utiliser directement response.data.data si c'est déjà les primes
          else if ((response.data.data as any).pd !== undefined || (response.data.data as any).puttc !== undefined) {
            primesData = response.data.data;
          }
        }

        if (primesData && !response.data.data?.error) {
          // Mettre à jour les primes recalculées avec les valeurs directes du backend
          conversionForm.value.primes = {
            pd: Number(primesData.pd) || 0,
            pc: Number(primesData.pc) || 0,
            surp: Number(primesData.surp) || 0,
            acc: Number(primesData.acc) || 0,
            fm: Number(primesData.fm) || 0,
            puttc: Number(primesData.puttc) || 0
          };

          console.log('✅ Primes recalculées avec succès:', conversionForm.value.primes);
        } else {
          console.error('❌ Structure de réponse inattendue:', response.data);
          throw new Error(response.data?.message || (response.data?.data as any)?.message || 'Erreur lors du recalcul des primes');
        }
      } catch (error: any) {
        console.error('❌ Erreur lors du recalcul des primes:', error);
        modalValidationError.value = error?.response?.data?.message || error?.message || 'Erreur lors du recalcul des primes';
      } finally {
        isRecalculatingPrimes.value = false;
      }
    };

    const getCreditTypeLabel = (code: string) => {
      const natureCredit = natureCredits.value.find(nc => nc.code === code);
      return natureCredit ? natureCredit.libelle : code;
    };

    const formatCurrency = (amount: number) => {
      if (!amount) return '0 FCFA';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatDateLabel = (dateStr: string | null | undefined) => {
      if (!dateStr) return 'N/A';
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return cleanDate;
    };

    const loadNatureCredits = async () => {
      try {
        loadingNatureCredits.value = true;
        const response = await ApiService.get('/nature-credits');
        const raw = response.data?.data?.data || response.data?.data?.natureCredits || response.data?.data || response.data?.natureCredits;
        if (Array.isArray(raw)) {
          natureCredits.value = raw.filter((nc: any) => nc.code === 'AMORT' || nc.code === 'CP' || nc.code === 'OBA');
        } else {
          natureCredits.value = [
            { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' }
          ];
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des types de crédit:', err);
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' }
        ];
      } finally {
        loadingNatureCredits.value = false;
      }
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
            { id: 4, libelle: 'Quadrimesuelle', code: '4', nombreMois: 4 },
            { id: 5, libelle: 'Quinquamestrielle', code: '5', nombreMois: 5 },
            { id: 6, libelle: 'Semestrielle', code: '6', nombreMois: 6 },
            { id: 12, libelle: 'Annuelle/Constant', code: '12', nombreMois: 12 }
          ];
        }
        
        // Après le chargement des périodicités, calculer la date d'échéance si nécessaire
        if (periodicites.value.length > 0 && !dateEcheanceManuallyEdited.value) {
          nextTick(() => {
            calculateDateEcheanceAuto();
          });
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
        
        // Calculer la date d'échéance même en cas d'erreur avec les valeurs par défaut
        if (!dateEcheanceManuallyEdited.value) {
          nextTick(() => {
            calculateDateEcheanceAuto();
          });
        }
      } finally {
        loadingPeriodicites.value = false;
      }
    };

    /**
     * Charge les données du contrat depuis l'API pour le mode modification
     */
    const loadContractForEdit = async (contractId: number) => {
      if (!contractId) {
        console.warn('⚠️ Aucun ID de contrat fourni pour le chargement');
        return;
      }

      try {
        isLoadingContract.value = true;
        modalValidationError.value = '';

        const response = await ApiService.get(`/contracts/${contractId}`);
        
        // Structure de réponse: { code: 200, message: '...', data: { contract: {...}, customer: {...} } }
        let contractData: any = null;
        let customerData: any = null;

        if (response.data && response.data.data) {
          contractData = response.data.data.contract || response.data.data;
          customerData = response.data.data.customer || contractData?.customer;
        }

        if (!contractData) {
          throw new Error('Données du contrat non trouvées dans la réponse');
        }

        // Pré-remplir les données du client
        if (customerData) {
          conversionForm.value.client.nom = customerData.lastname || '';
          conversionForm.value.client.prenoms = customerData.firstname || '';
          conversionForm.value.client.numCustomer = customerData.numCustomer || '';
          conversionForm.value.client.telephone = customerData.phone || '';
          conversionForm.value.client.email = customerData.email || '';
          conversionForm.value.client.adresse = customerData.address || '';
          conversionForm.value.client.lieuNaissance = customerData.placeOfBirth || '';
          conversionForm.value.client.dateNaissance = customerData.birthdate || '';
          conversionForm.value.client.profession = customerData.occupation || '';
          conversionForm.value.client.sexe = customerData.gender === 'M' ? 'Homme' : 'Femme';
          conversionForm.value.client.typeAss = String(customerData.idTypeCustomer || customerData.typeCustomer?.id || '1');
          
          // Stocker les données originales pour détecter les changements
          originalClientData.value = {
            lastname: customerData.lastname || '',
            firstname: customerData.firstname || '',
            numCustomer: customerData.numCustomer || '',
            phone: customerData.phone || '',
            email: customerData.email || '',
            address: customerData.address || '',
            placeOfBirth: customerData.placeOfBirth || '',
            birthdate: customerData.birthdate || '',
            occupation: customerData.occupation || '',
            gender: customerData.gender || '',
            idTypeCustomer: customerData.idTypeCustomer || customerData.typeCustomer?.id || 1
          };
        }

        // Pré-remplir les données du contrat
        conversionForm.value.contrat.capital = contractData.capital || 0;
        conversionForm.value.contrat.duration = contractData.duration || contractData.duree || 12;
        conversionForm.value.contrat.tauxInteret = contractData.taux || contractData.tauxInteret || 0;
        
        // Mapper les dates selon la structure du backend :
        // - dateEff = Date d'effet
        // - dateEch1 = Date de première échéance
        // - dateEch = Date d'échéance finale
        
        // Déterminer le type de crédit
        let cType = 'AMORT';
        if (contractData.natureCredit) {
          cType = contractData.natureCredit.code || 'AMORT';
        } else if (contractData.idNatureCredit) {
          const matchingNature = natureCredits.value.find(nc => nc.id === contractData.idNatureCredit);
          cType = matchingNature ? matchingNature.code : 'AMORT';
        } else if (props.defaultCreditType) {
          cType = props.defaultCreditType;
        }

        // Date d'effet : utiliser dateEff (format backend) ou dateEffet (format alternatif)
        if (cType === 'CP') {
          const dateEffCPObj = new Date();
          dateEffCPObj.setDate(dateEffCPObj.getDate() + 1);
          conversionForm.value.contrat.dateEffet = dateEffCPObj.toISOString().split('T')[0];
          console.log('📅 [CP] Date d\'effet forcée:', conversionForm.value.contrat.dateEffet);
        } else {
          const dateEffet = contractData.dateEff || contractData.dateEffet;
          if (dateEffet) {
            // S'assurer que la date est au format YYYY-MM-DD pour les champs input type="date"
            const dateEffetFormatted = dateEffet.includes('T') ? dateEffet.split('T')[0] : dateEffet.split(' ')[0];
            conversionForm.value.contrat.dateEffet = dateEffetFormatted;
            console.log('📅 Date d\'effet chargée:', dateEffetFormatted);
          } else {
            conversionForm.value.contrat.dateEffet = new Date().toISOString().split('T')[0];
          }
        }
        
        // Date de première échéance : utiliser dateEch1 (format backend) ou datePremiereEcheance (format alternatif)
        const datePremiereEch = contractData.dateEch1 || contractData.datePremiereEcheance;
        if (datePremiereEch) {
          // S'assurer que la date est au format YYYY-MM-DD
          const datePremiereEchFormatted = datePremiereEch.includes('T') ? datePremiereEch.split('T')[0] : datePremiereEch.split(' ')[0];
          conversionForm.value.contrat.datePremiereEcheance = datePremiereEchFormatted;
          console.log('📅 Date de première échéance chargée:', datePremiereEchFormatted);
        } else {
          // Si pas de date de première échéance, la calculer à partir de la date d'effet
          if (conversionForm.value.contrat.dateEffet) {
            updateDatePremiereEcheance();
          }
        }
        
        // Date d'échéance finale : utiliser dateEch (format backend) ou dateEch1 (format alternatif)
        const dateEchFinale = contractData.dateEch || contractData.dateEch1;
        if (dateEchFinale) {
          // S'assurer que la date est au format YYYY-MM-DD
          const dateEchFinaleFormatted = dateEchFinale.includes('T') ? dateEchFinale.split('T')[0] : dateEchFinale.split(' ')[0];
          conversionForm.value.contrat.dateEch1 = dateEchFinaleFormatted;
          console.log('📅 Date d\'échéance finale chargée:', dateEchFinaleFormatted);
        }
        conversionForm.value.contrat.garantieCompl = contractData.garantieCompl || 'OUI';
        conversionForm.value.contrat.etablissement = contractData.etablissement || contractData.ets || '';
        conversionForm.value.contrat.reference = contractData.reference || '';
        conversionForm.value.contrat.idPeriodicite = contractData.idPeriodicite || 1;
        conversionForm.value.contrat.dureeeDifferee = String(contractData.differe || contractData.dureeeDifferee || 0);
        
        // CP fields
        conversionForm.value.contrat.renouvellementAuto = contractData.renouvellementAuto ?? false;
        conversionForm.value.contrat.compteBancaire = contractData.compteBancaire || '';
        conversionForm.value.contrat.numeroCompte = contractData.numeroCompte || '';
        
        // Mapper les bénéficiaires si existants (pour l'affichage en mode modification)
        if (contractData.beneficiaries && Array.isArray(contractData.beneficiaries)) {
          conversionForm.value.contrat.beneficiaries = contractData.beneficiaries.map((b: any) => ({
            id: b.id,
            nomPrenoms: b.nomPrenoms,
            lienParente: b.lienParente,
            pourcentage: Number(b.pourcentage)
          }));
        } else {
          conversionForm.value.contrat.beneficiaries = [];
        }
        
        // Mapper le type de crédit depuis natureCredit
        if (contractData.natureCredit) {
          conversionForm.value.contrat.creditType = contractData.natureCredit.code || 'AMORT';
        } else if (contractData.idNatureCredit) {
          const matchingNature = natureCredits.value.find(nc => nc.id === contractData.idNatureCredit);
          conversionForm.value.contrat.creditType = matchingNature ? matchingNature.code : 'AMORT';
        }

        // Pré-remplir les primes si disponibles
        if (contractData.puttc !== undefined) {
          conversionForm.value.primes.puttc = contractData.puttc || 0;
          conversionForm.value.primes.pd = contractData.pd || 0;
          conversionForm.value.primes.pc = contractData.pc || 0;
          conversionForm.value.primes.surp = contractData.surp || 0;
          conversionForm.value.primes.acc = contractData.acc || 0;
          conversionForm.value.primes.fm = contractData.fm || 0;
        }

        // Mettre à jour la date de première échéance si nécessaire
        if (conversionForm.value.contrat.dateEffet && !conversionForm.value.contrat.datePremiereEcheance) {
          updateDatePremiereEcheance();
        }

        // Calculer la date d'échéance après le chargement des périodicités
        if (periodicites.value.length > 0) {
          nextTick(() => {
            calculateDateEcheanceAuto();
          });
        }

        console.log('✅ Données du contrat chargées avec succès:', { contractData, customerData });
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du contrat:', err);
        modalValidationError.value = err?.response?.data?.message || err?.message || 'Erreur lors du chargement du contrat';
        error(modalValidationError.value);
      } finally {
        isLoadingContract.value = false;
      }
    };

    const convertToContract = async () => {
      
      if (isConverting.value) {
        return;
      }

      try {
        isConverting.value = true;
        modalValidationError.value = '';

        // Mapper le type de crédit vers l'ID correspondant
        let idNatureCredit = 1; // Valeur par défaut
        const selectedNature = natureCredits.value.find(nc => nc.code === conversionForm.value.contrat.creditType);
        if (selectedNature) {
          idNatureCredit = selectedNature.id;
        }
        

        // Préparer les données pour la création/modification du contrat
        const contractData: any = {
          capital: Number(conversionForm.value.contrat.capital),
          duration: Number(conversionForm.value.contrat.duration),
          dateEff: conversionForm.value.contrat.dateEffet,
          dateEch1: conversionForm.value.contrat.datePremiereEcheance,
          dateEch: conversionForm.value.contrat.dateEch1,
          garantieCompl: conversionForm.value.contrat.garantieCompl,
          idNatureCredit: idNatureCredit, // Mappé depuis creditType
          taux: Number(conversionForm.value.contrat.tauxInteret),
          commission: 0,
          description: isEditMode.value ? `Contrat modifié` : `Contrat créé depuis cotation`,
          isActive: true,
          etablissement: conversionForm.value.contrat.etablissement,
          reference: conversionForm.value.contrat.reference,
          idPeriodicite: (conversionForm.value.contrat.creditType === 'CP' || conversionForm.value.contrat.creditType === 'OBA')
            ? 12
            : Number(conversionForm.value.contrat.idPeriodicite),
          differe: (conversionForm.value.contrat.creditType === 'CP' || conversionForm.value.contrat.creditType === 'OBA')
            ? 0
            : Number(conversionForm.value.contrat.dureeeDifferee || '0')
        };

        // Remplir les champs spécifiques CP
        if (conversionForm.value.contrat.creditType === 'CP') {
          contractData.renouvellementAuto = conversionForm.value.contrat.renouvellementAuto;
          contractData.compteBancaire = conversionForm.value.contrat.compteBancaire;
          contractData.numeroCompte = conversionForm.value.contrat.numeroCompte;
          contractData.beneficiaries = conversionForm.value.contrat.beneficiaries.map((b: any) => ({
            nomPrenoms: b.nomPrenoms,
            lienParente: b.lienParente,
            pourcentage: Number(b.pourcentage)
          }));
        }
        
        // Remplir les champs spécifiques OBA
        if (conversionForm.value.contrat.creditType === 'OBA') {
          const rawOpts = conversionForm.value.contrat.obaOptions;
          const configMap: Record<string, { capital: number, prime: number }> = {
            conjoint: { capital: 500000, prime: 2000 },
            ascendant1: { capital: 500000, prime: 2500 },
            ascendant2: { capital: 500000, prime: 2500 },
            ascendant3: { capital: 500000, prime: 2500 },
            ascendant4: { capital: 500000, prime: 2500 },
            assure: { capital: 500000, prime: 2000 }
          };

          const mappedOpts: any = {};
          
          // Assuré principal
          mappedOpts.assure = {
            checked: true,
            birthdate: conversionForm.value.client.dateNaissance,
            lastname: conversionForm.value.client.nom,
            firstname: conversionForm.value.client.prenoms,
            gender: conversionForm.value.client.sexe === 'Homme' ? 'M' : 'F',
            capitalAssure: configMap.assure.capital,
            prime: configMap.assure.prime
          };

          // Membres secondaires
          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = rawOpts[key];
            if (opt) {
              mappedOpts[key] = {
                checked: !!opt.checked,
                lastname: opt.lastname || '',
                firstname: opt.firstname || '',
                birthdate: opt.birthdate || '',
                gender: opt.gender || (key.endsWith('2') || key.endsWith('4') || key === 'conjoint' ? 'F' : 'M'),
                capitalAssure: opt.checked ? configMap[key].capital : 0,
                prime: opt.checked ? configMap[key].prime : 0
              };
            }
          }

          contractData.obaOptions = mappedOpts;
        }

        // Préparer les données du client
        const currentClientData = {
          lastname: conversionForm.value.client.nom,
          firstname: conversionForm.value.client.prenoms,
          phone: conversionForm.value.client.telephone,
          email: conversionForm.value.client.email,
          address: conversionForm.value.client.adresse,
          placeOfBirth: conversionForm.value.client.lieuNaissance,
          birthdate: conversionForm.value.client.dateNaissance,
          occupation: conversionForm.value.client.profession,
          gender: conversionForm.value.client.sexe === 'Homme' ? 'M' : 'F',
          idTypeCustomer: parseInt(conversionForm.value.client.typeAss),
          typeAss: conversionForm.value.client.typeAss,
          numCustomer: conversionForm.value.client.numCustomer || undefined
        };

        // En mode création, inclure les données du client
        if (!isEditMode.value) {
          contractData.clientData = currentClientData;
          contractData.createdBy = 1;
        } else {
          // En mode modification, vérifier si les données client ont changé
          if (originalClientData.value) {
            const hasClientChanges = hasClientDataChanged(originalClientData.value, currentClientData);
            if (hasClientChanges) {
              // Inclure les données client modifiées pour mise à jour
              contractData.clientData = currentClientData;
            }
          }
        }

        
        console.log('📤 Données envoyées pour ' + (isEditMode.value ? 'modification' : 'création') + ' de contrat:', contractData);
        
        let response;
        if (isEditMode.value && props.contractToEdit?.id) {
          // Mode modification : PUT
          response = await ApiService.put(`/contracts/${props.contractToEdit.id}`, contractData);
        } else {
          // Mode création : POST
          response = await ApiService.post('/contracts', contractData);
        }
        console.log('📥 Réponse complète de création de contrat:', response);
        console.log('📥 response.data:', response.data);
        console.log('📥 response.data.data:', response.data?.data);
        
        // Gérer la réponse transformée par l'intercepteur
        let rawResponseData = response.data;
        let responseData = rawResponseData;
        if (responseData?.data && typeof responseData.data === 'object') {
          if (responseData.data.success !== undefined || responseData.data.contract) {
            responseData = responseData.data;
          }
        }
        
        // Extraire le message du serveur (niveau supérieur ou dans data)
        let serverMessage = responseData?.message || rawResponseData?.message || response.data?.message;
        if (Array.isArray(serverMessage)) {
          serverMessage = serverMessage.join(', ');
        } else if (typeof serverMessage === 'object' && serverMessage !== null) {
          serverMessage = (serverMessage as any).message || JSON.stringify(serverMessage);
        }
        
        // Vérifier si la réponse indique un succès
        const isSuccess = response.status >= 200 && response.status < 300 && responseData?.success !== false && rawResponseData?.data?.success !== false;
        
        if (isSuccess) {
          const contract = responseData?.contract || responseData?.data?.contract || rawResponseData?.data?.contract;
          const contractId = contract?.id;
          const contractRef = contract?.reference;
          
          console.log('✅ Contrat créé:', { contractId, contractRef, contract });
          
          if (!contractId) {
            console.error('❌ Aucun ID de contrat dans la réponse:', responseData);
            throw new Error('Réponse invalide du serveur: aucun contrat créé');
          }
          
          createdContractId.value = contractId;
          conversionSuccess.value = true;
          conversionMessage.value = serverMessage || 
            (isEditMode.value 
              ? `Contrat "${contractRef || contractId}" modifié avec succès !`
              : `Contrat "${contractRef || contractId}" créé avec succès !`);
          emit('conversion-success', contract);
        } else {
          const errorMessage = serverMessage || 'Erreur lors de la création du contrat';
          console.error('❌ Erreur de création:', errorMessage, responseData);
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la création du contrat:', err);
        let errorMsg = err?.response?.data?.message || err?.response?.data?.data?.message || err?.message || 'Erreur lors de la création du contrat';
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg.join(', ');
        } else if (typeof errorMsg === 'object' && errorMsg !== null) {
          errorMsg = errorMsg.message || JSON.stringify(errorMsg);
        }
        modalValidationError.value = errorMsg;
        error(modalValidationError.value);
      } finally {
        isConverting.value = false;
      }
    };

    const downloadContractPDF = async (contractId: number) => {
      if (isDownloadingPDF.value) return;

      try {
        isDownloadingPDF.value = true;
        
        // Utiliser la même méthode que dans ListeContrat.vue
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

    const goToContractsList = () => {
      // Fermer le modal - la redirection se fera dans closeConvertModal du parent
      closeModal();
    };

    const handleConversionSubmit = async (values: any) => {
    };

    // Watcher pour ajuster automatiquement les valeurs quand le type de crédit change
    watch(() => conversionForm.value.contrat.creditType, (newCreditType, oldCreditType) => {
      if (newCreditType && newCreditType !== oldCreditType && currentStep.value >= 2) {
        adjustValuesToLimits();
      }
      if (newCreditType === 'OBA') {
        let total = 500000; // Assuré principal toujours inclus (500 000 FCFA)
        const opts = conversionForm.value.contrat.obaOptions;
        if (opts) {
          if (opts.conjoint?.checked) total += 500000;
          if (opts.ascendant1?.checked) total += 500000;
          if (opts.ascendant2?.checked) total += 500000;
          if (opts.ascendant3?.checked) total += 500000;
          if (opts.ascendant4?.checked) total += 500000;
        }
        conversionForm.value.contrat.capital = total;
      }
    });

    // Watcher pour calculer automatiquement le capital pour OBA en fonction des membres cochés
    watch(() => conversionForm.value.contrat.obaOptions, (newOpts) => {
      if (conversionForm.value.contrat.creditType === 'OBA' && newOpts) {
        let total = 500000; // Assuré principal toujours inclus (500 000 FCFA)
        if (newOpts.conjoint?.checked) total += 500000;
        if (newOpts.ascendant1?.checked) total += 500000;
        if (newOpts.ascendant2?.checked) total += 500000;
        if (newOpts.ascendant3?.checked) total += 500000;
        if (newOpts.ascendant4?.checked) total += 500000;
        conversionForm.value.contrat.capital = total;
      }
    }, { deep: true, immediate: true });

    // Watcher pour ajuster automatiquement les valeurs quand l'âge change
    watch(() => conversionForm.value.client.dateNaissance, (newBirthdate, oldBirthdate) => {
      if (newBirthdate && newBirthdate !== oldBirthdate && currentStep.value >= 2) {
        adjustValuesToLimits();
      }
    });

    // Watchers pour recalculer automatiquement la date d'échéance
    watch(() => conversionForm.value.contrat.datePremiereEcheance, (newDate, oldDate) => {
      if (newDate && newDate !== oldDate && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => conversionForm.value.contrat.duration, (newDuration, oldDuration) => {
      if (newDuration && newDuration !== oldDuration && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => conversionForm.value.contrat.idPeriodicite, (newPeriodicite, oldPeriodicite) => {
      if (newPeriodicite && newPeriodicite !== oldPeriodicite && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    watch(() => conversionForm.value.contrat.dureeeDifferee, (newDiffere, oldDiffere) => {
      if (newDiffere !== undefined && newDiffere !== oldDiffere && !dateEcheanceManuallyEdited.value && currentStep.value >= 2) {
        calculateDateEcheanceAuto();
      }
    });

    // Watcher pour pré-remplir le formulaire avec les props par défaut
    watch(() => props.visible, async (isVisible) => {
      if (isVisible) {
        // Réinitialiser le formulaire
        resetModal();
        
        // Si on est en mode modification, charger les données du contrat
        if (isEditMode.value && props.contractToEdit?.id) {
          await loadContractForEdit(props.contractToEdit.id);
          return; // Ne pas continuer avec le pré-remplissage par défaut
        }
        
        // Si une cotation est sélectionnée, pré-remplir avec ses données
        if (props.selectedCotation) {
          conversionForm.value.contrat.capital = props.selectedCotation.capital || props.defaultCapital || 0;
          conversionForm.value.contrat.duration = props.selectedCotation.duration || props.defaultDuration || 12;
          conversionForm.value.contrat.tauxInteret = props.selectedCotation.taux || 0;
          conversionForm.value.contrat.garantieCompl = props.selectedCotation.garantieCompl || props.defaultGarantieCompl || 'OUI';
          const idNC = props.selectedCotation.idNatureCredit || props.selectedCotation.natureCredit?.id;
          const codeNC = props.selectedCotation.natureCredit?.code;
          let mappedCreditType = props.selectedCotation.creditType || codeNC;
          if (!mappedCreditType && idNC) {
            mappedCreditType = idNC === 2 ? 'CP' : idNC === 3 ? 'OBA' : 'AMORT';
          }
          conversionForm.value.contrat.creditType = mappedCreditType || props.defaultCreditType || 'AMORT';
          conversionForm.value.contrat.reference = props.selectedCotation.reference || '';
          conversionForm.value.contrat.etablissement = props.selectedCotation.etablissement || '';
          
          const isCPorOBA = conversionForm.value.contrat.creditType === 'CP' || conversionForm.value.contrat.creditType === 'OBA';
          conversionForm.value.contrat.dureeeDifferee = isCPorOBA ? '0' : String(props.selectedCotation.differe || 0);
          conversionForm.value.contrat.idPeriodicite = isCPorOBA ? 12 : (props.selectedCotation.idPeriodicite || 1);
          
          // Pré-remplir les primes calculées
          if (props.selectedCotation.pd !== undefined) {
            conversionForm.value.primes.pd = props.selectedCotation.pd || 0;
            conversionForm.value.primes.pc = props.selectedCotation.pc || 0;
            conversionForm.value.primes.surp = props.selectedCotation.surp || 0;
            conversionForm.value.primes.acc = props.selectedCotation.acc || 0;
            conversionForm.value.primes.fm = props.selectedCotation.fm || 0;
            conversionForm.value.primes.puttc = props.selectedCotation.puttc || 0;
          }

          // Charger les options OBA
          if (props.selectedCotation.obaOptions) {
            const opts = props.selectedCotation.obaOptions;
            conversionForm.value.contrat.obaOptions = {
              conjoint: { 
                checked: !!opts.conjoint?.checked, 
                lastname: opts.conjoint?.lastname || '', 
                firstname: opts.conjoint?.firstname || '', 
                birthdate: opts.conjoint?.birthdate || '', 
                gender: opts.conjoint?.gender || 'F',
                capitalAssure: opts.conjoint?.capitalAssure || 0,
                prime: opts.conjoint?.prime || 0
              },
              ascendant1: { 
                checked: !!opts.ascendant1?.checked, 
                lastname: opts.ascendant1?.lastname || '', 
                firstname: opts.ascendant1?.firstname || '', 
                birthdate: opts.ascendant1?.birthdate || '', 
                gender: opts.ascendant1?.gender || 'M',
                capitalAssure: opts.ascendant1?.capitalAssure || 0,
                prime: opts.ascendant1?.prime || 0
              },
              ascendant2: { 
                checked: !!opts.ascendant2?.checked, 
                lastname: opts.ascendant2?.lastname || '', 
                firstname: opts.ascendant2?.firstname || '', 
                birthdate: opts.ascendant2?.birthdate || '', 
                gender: opts.ascendant2?.gender || 'F',
                capitalAssure: opts.ascendant2?.capitalAssure || 0,
                prime: opts.ascendant2?.prime || 0
              },
              ascendant3: { 
                checked: !!opts.ascendant3?.checked, 
                lastname: opts.ascendant3?.lastname || '', 
                firstname: opts.ascendant3?.firstname || '', 
                birthdate: opts.ascendant3?.birthdate || '', 
                gender: opts.ascendant3?.gender || 'M',
                capitalAssure: opts.ascendant3?.capitalAssure || 0,
                prime: opts.ascendant3?.prime || 0
              },
              ascendant4: { 
                checked: !!opts.ascendant4?.checked, 
                lastname: opts.ascendant4?.lastname || '', 
                firstname: opts.ascendant4?.firstname || '', 
                birthdate: opts.ascendant4?.birthdate || '', 
                gender: opts.ascendant4?.gender || 'F',
                capitalAssure: opts.ascendant4?.capitalAssure || 0,
                prime: opts.ascendant4?.prime || 0
              }
            };
          }
        } else {
          // Sinon, utiliser les valeurs par défaut
          conversionForm.value.contrat.creditType = props.defaultCreditType || '';
          conversionForm.value.contrat.duration = props.defaultDuration || 12;
          conversionForm.value.contrat.capital = props.defaultCapital || 0;
          conversionForm.value.contrat.garantieCompl = props.defaultGarantieCompl || 'OUI';
          conversionForm.value.contrat.idPeriodicite = 1; // Périodicité par défaut (Mensuelle)
          conversionForm.value.contrat.dureeeDifferee = '0'; // Différée par défaut
        }
        
        // Définir la date d'effet par défaut
        if (conversionForm.value.contrat.creditType === 'CP') {
          const dateEffCPObj = new Date();
          dateEffCPObj.setDate(dateEffCPObj.getDate() + 1);
          conversionForm.value.contrat.dateEffet = dateEffCPObj.toISOString().split('T')[0];
        } else {
          const today = new Date().toISOString().split('T')[0];
          conversionForm.value.contrat.dateEffet = today;
        }
        
        // Mettre à jour la date de première échéance automatiquement
        updateDatePremiereEcheance();
        
        // Calculer la date d'échéance après un court délai pour s'assurer que les périodicités sont chargées
        nextTick(() => {
          if (periodicites.value.length > 0) {
            calculateDateEcheanceAuto();
          }
        });
        
        // Mettre à jour les valeurs du client (seulement si fournies)
        if (props.defaultNom) {
          conversionForm.value.client.nom = props.defaultNom;
        }
        if (props.defaultPrenoms) {
          conversionForm.value.client.prenoms = props.defaultPrenoms;
        }
        if (props.defaultTypeClient) {
          conversionForm.value.client.typeAss = props.defaultTypeClient;
        }
        if (props.defaultDateNaissance) {
          conversionForm.value.client.dateNaissance = props.defaultDateNaissance;
        }
        
        // Si un client est sélectionné, utiliser ses données
        if (props.selectedClient) {
          conversionForm.value.client.nom = props.selectedClient.lastname || props.selectedClient.nom || conversionForm.value.client.nom;
          conversionForm.value.client.prenoms = props.selectedClient.firstname || props.selectedClient.prenoms || conversionForm.value.client.prenoms;
          conversionForm.value.client.telephone = props.selectedClient.phone || props.selectedClient.telephone || '';
          conversionForm.value.client.email = props.selectedClient.email || '';
          conversionForm.value.client.adresse = props.selectedClient.address || props.selectedClient.adresse || '';
          conversionForm.value.client.lieuNaissance = props.selectedClient.placeOfBirth || props.selectedClient.lieuNaissance || '';
          conversionForm.value.client.dateNaissance = props.selectedClient.birthdate || props.selectedClient.dateNaissance || conversionForm.value.client.dateNaissance;
          conversionForm.value.client.profession = props.selectedClient.occupation || props.selectedClient.profession || '';
          
          if (props.selectedClient.gender) {
            conversionForm.value.client.sexe = props.selectedClient.gender === 'M' ? 'Homme' : 'Femme';
          } else if (props.selectedClient.sexe) {
            conversionForm.value.client.sexe = props.selectedClient.sexe;
          }
          
          conversionForm.value.client.typeAss = props.selectedClient.typeAss || props.selectedClient.typeClient || props.selectedClient.typeCustomer?.id?.toString() || conversionForm.value.client.typeAss;
          conversionForm.value.client.numCustomer = props.selectedClient.numCustomer || props.selectedClient.code || '';
        }
        
        
        // Ajuster les valeurs selon les limites après le pré-remplissage
        if (conversionForm.value.client.dateNaissance && conversionForm.value.contrat.creditType) {
          adjustValuesToLimits();
        }
        
        // Réinitialiser le flag de modification manuelle de la date d'échéance
        dateEcheanceManuallyEdited.value = false;
      }
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

    const fetchLiensParenteModal = async () => {
      try {
        const res = await ApiService.get('/lien-parente');
        const list = res.data.liensParente || res.data.data?.liensParente || res.data.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          liensParenteList.value = list.filter((i: any) => i.isActive !== false);
        }
      } catch (e) {
        console.warn('Fallback liens parente modal');
      }
    };

    // Lifecycle
    loadNatureCredits();
    loadPeriodicites();
    fetchLiensParenteModal();

    return {
      // Refs
      conversionFormRef,
      currentStep,
      totalSteps,
      modalValidationError,
      conversionSuccess,
      conversionMessage,
      createdContractId,
      isDownloadingPDF,
      isConverting,
      natureCredits,
      loadingNatureCredits,
      isRecalculatingPrimes,
      periodicites,
      loadingPeriodicites,
      liensParenteList,
      conversionForm,
      conversionSchema,
      
      // Props
      clientEditable,
      
      // Computed
      canProceedToNextStep,
      missingRequiredFields,
      canCreateContract,
      todayDate,
      minBirthDate,
      maxBirthDate,
      currentAge,
      currentLimits,
      maxCapital,
      maxDuration,
      minDuration,
      getMinDateEcheance,
      isEditMode,
      computedModalTitle,
      
      // Refs additionnels
      isLoadingContract,
      
      // Méthodes
      closeModal,
      resetModal,
      validateCapital,
      nextStep,
      prevStep,
      handleModalUppercaseInput,
      updateDatePremiereEcheance,
      validateDateEffet,
      validateDatePremiereEcheance,
      validateDateEcheance,
      validateTauxInteret,
      validateDuration,
      adjustValuesToLimits,
      recalculatePrimes,
      getCreditTypeLabel,
      formatCurrency,
      formatDateLabel,
      convertToContract,
      downloadContractPDF,
      goToContractsList,
      handleConversionSubmit,
      isValidAge,
      calculateAge,
      getLimits,
      loadPeriodicites,
      loadContractForEdit,
      calculateDateEcheanceAuto,
      resetDateEcheanceAuto,
      handleDateEcheanceManualEdit,
      dateEcheanceManuallyEdited,
      
      // Beneficiary helpers & state
      addBeneficiary,
      removeBeneficiary,
      totalPercentage,
      beneficiaryValidationMessage
    };
  }
});
</script>

<style scoped>
/* Styles pour le wrapper du modal */
.conversion-modal-wrapper {
  overflow-x: hidden;
}

.conversion-modal-wrapper .modal-body {
  padding: 0;
  overflow-x: hidden;
}

/* Styles pour la modal de conversion */
.conversion-modal-content {
  padding: 20px;
  max-width: 100%;
  overflow-x: hidden;
}

.conversion-modal-content .alert {
  border-radius: 0.5rem;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.conversion-modal-content .alert i {
  font-size: 1.1rem;
}

.conversion-modal-content .form-step {
  min-height: 400px;
  padding: 1rem 0;
}

.conversion-modal-content .form-group {
  margin-bottom: 1rem;
}

.conversion-modal-content .form-control {
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
  transition: all 0.15s ease-in-out;
}

.conversion-modal-content .form-control:focus {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.conversion-modal-content .form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.conversion-modal-content .card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.conversion-modal-content .card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
}

.conversion-modal-content .card-header.bg-success {
  background-color: #33b04a !important;
  color: white;
}

.conversion-modal-content .card-body p {
  margin-bottom: 0.5rem;
  color: #495057;
}

.conversion-modal-content .card-body strong {
  color: #212529;
  font-weight: 600;
}

/* Styles pour les éléments de résumé */
.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.summary-item .label {
  font-weight: 500;
  color: #495057;
}

.summary-item .value {
  font-weight: 600;
  color: #212529;
}

.summary-item .value.highlight {
  color: #33b04a;
  font-size: 1.1rem;
}

/* Styles pour les boutons */
.btn {
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
}

.btn-primary {
  background-color: #33b04a;
  border-color: #33b04a;
}

.btn-primary:hover {
  background-color: #2a8f3d;
  border-color: #2a8f3d;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-danger:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* Styles pour les champs de formulaire */
.form-control.is-invalid {
  border-color: #dc3545;
}

.form-label .text-danger {
  color: #dc3545 !important;
}

.required {
  position: relative;
}

.required::after {
  content: " *";
  color: #dc3545;
  font-weight: bold;
}

/* Styles pour les alertes */
.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-danger .fas {
  color: #721c24;
}

/* Styles pour le modal wrapper - FORCER la hauteur maximale */
.conversion-modal-wrapper .modal-container {
  max-height: 90vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  min-width: 400px !important;
  width: 100% !important;
}

.conversion-modal-wrapper .modal-body {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1.5rem !important;
  max-height: calc(90vh - 140px) !important; /* Réserve de l'espace pour le header et footer */
}

.conversion-modal-wrapper .modal-footer {
  flex-shrink: 0 !important;
  padding: 1rem 1.5rem !important;
  border-top: 1px solid #dee2e6 !important;
  background-color: #f8f9fa !important;
  position: relative !important;
  z-index: 10 !important;
  min-height: 70px !important;
  width: 100% !important;
  overflow: visible !important;
}

/* Styles pour les boutons du footer */
.modal-footer-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.footer-left {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-right {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Responsive design */
@media (max-width: 1200px) {
  .conversion-modal-wrapper .modal-dialog {
    max-width: 95%;
    margin: 0.5rem auto;
  }
}

@media (max-width: 768px) {
  .conversion-modal-wrapper .modal-container {
    max-width: 98% !important;
    margin: 0.25rem auto !important;
    max-height: 95vh !important;
    min-height: 95vh !important;
  }

  .conversion-modal-wrapper .modal-body {
    padding: 1rem !important;
    padding-bottom: 90px !important; /* Plus d'espace pour le footer sur mobile */
    max-height: calc(95vh - 140px) !important;
  }

  .conversion-modal-wrapper .modal-footer {
    padding: 0.75rem 1rem;
  }

  .modal-footer-buttons {
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 0.25rem !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .footer-left,
  .footer-right {
    width: auto !important;
    display: flex !important;
    gap: 0.25rem !important;
    flex-shrink: 0 !important;
  }

  .footer-left .btn,
  .footer-right .btn {
    flex: none !important;
    min-width: 80px !important;
    max-width: 120px !important;
    margin: 0 !important;
    white-space: nowrap !important;
    font-size: 0.85rem !important;
    padding: 0.5rem 0.8rem !important;
  }

  .conversion-modal-wrapper .modal-footer .btn {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }

  .conversion-modal-content {
    padding: 2px 0;
  }

  .conversion-modal-content .form-step {
    min-height: 250px;
    padding: 0.125rem 0;
  }

  .conversion-modal-content .form-group {
    margin-bottom: 0.75rem;
  }

  .conversion-modal-content .form-control {
    font-size: 0.9rem;
  }

  .conversion-modal-content .card {
    margin-bottom: 1rem;
  }

  .conversion-modal-content .alert {
    font-size: 0.9rem;
  }

  .conversion-modal-content .row {
    margin: 0;
  }

  .conversion-modal-content .col-md-6,
  .conversion-modal-content .col-md-4,
  .conversion-modal-content .col-md-3 {
    padding: 0 0.5rem;
    margin-bottom: 0.25rem;
  }
}

/* Styles pour très petits écrans (smartphones) */
@media (max-width: 480px) {
  .conversion-modal-wrapper .modal-container {
    max-width: 100% !important;
    margin: 0 !important;
    max-height: 100vh !important;
    min-height: 100vh !important;
    border-radius: 0 !important;
  }

  .conversion-modal-wrapper .modal-body {
    padding: 0.75rem !important;
    padding-bottom: 100px !important; /* Plus d'espace pour le footer sur smartphone */
    max-height: calc(100vh - 120px) !important;
  }

  .conversion-modal-wrapper .modal-footer {
    padding: 0.5rem;
  }

  .modal-footer-buttons {
    gap: 0.5rem;
  }

  .footer-left .btn,
  .footer-right .btn {
    min-width: 70px !important;
    max-width: 100px !important;
    font-size: 0.75rem !important;
    padding: 0.4rem 0.5rem !important;
    white-space: nowrap !important;
  }

  .modal-footer-buttons {
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 0.15rem !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .footer-left,
  .footer-right {
    width: auto !important;
    display: flex !important;
    gap: 0.15rem !important;
    flex-shrink: 0 !important;
  }

  .conversion-modal-content .form-step {
    min-height: 200px;
  }

  .conversion-modal-content .card {
    margin-bottom: 0.75rem;
  }

  .conversion-modal-content .alert {
    font-size: 0.85rem;
    padding: 0.75rem;
  }

  .conversion-modal-content .summary-item {
    font-size: 0.9rem;
  }

  .conversion-modal-content .summary-item .label {
    font-size: 0.85rem;
  }

  .conversion-modal-content .summary-item .value {
    font-size: 0.9rem;
  }

  .conversion-modal-content .card-body {
    padding: 1rem;
  }
}

/* Styles spécifiques pour l'étape récapitulatif */
.conversion-modal-content .recap-step {
  max-height: calc(90vh - 200px) !important;
  overflow-y: auto !important;
}

.conversion-modal-content .recap-step .card {
  margin-bottom: 1rem !important;
}

.conversion-modal-content .recap-step .summary-item {
  margin-bottom: 0.5rem !important;
}

/* FORCER le footer à rester visible - APPROCHE AMÉLIORÉE */
.conversion-modal-wrapper .modal-container {
  position: relative !important;
  min-height: 90vh !important;
}

.conversion-modal-wrapper .modal-footer {
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  background: #f8f9fa !important;
  border-top: 2px solid #dee2e6 !important;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important;
  z-index: 1000 !important;
  margin: 0 !important;
  border-radius: 0 0 8px 8px !important;
}

.conversion-modal-wrapper .modal-body {
  padding-bottom: 80px !important; /* Espace pour le footer */
}

/* Améliorer l'apparence du footer */
.conversion-modal-wrapper .modal-footer {
  backdrop-filter: blur(10px) !important;
  background: rgba(248, 249, 250, 0.95) !important;
  border-top: 3px solid #33b04a !important;
}

/* Améliorer les boutons du footer */
.conversion-modal-wrapper .modal-footer .btn {
  font-weight: 600 !important;
  border-radius: 6px !important;
  padding: 0.6rem 1.2rem !important;
  transition: all 0.2s ease !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.conversion-modal-wrapper .modal-footer .btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
}

/* FORCER la visibilité du bouton Suivant */
.footer-right {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.footer-right .btn {
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Styles pour les très petits écrans - étape récapitulatif */
@media (max-width: 768px) {
  .conversion-modal-content .recap-step {
    max-height: calc(95vh - 180px);
  }
}

@media (max-width: 480px) {
  .conversion-modal-content .recap-step {
    max-height: calc(100vh - 140px);
  }
}

/* Optimisation pour les primes recalculées */
.conversion-modal-content .primes-recalculated {
  max-height: 60vh;
  overflow-y: auto;
}

.conversion-modal-content .primes-recalculated .row {
  margin-bottom: 0.5rem;
}

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

/* Styles pour éviter le scroll horizontal */
.conversion-modal-content .row {
  margin-left: 0;
  margin-right: 0;
}

.conversion-modal-content .col-md-6,
.conversion-modal-content .col-md-4,
.conversion-modal-content .col-md-3,
.conversion-modal-content .col-md-5,
.conversion-modal-content .col-md-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

/* Ajustement des marges pour éviter le débordement */
.conversion-modal-content .container-fluid {
  padding-left: 0;
  padding-right: 0;
}

.conversion-modal-content .d-flex.gap-3 {
  flex-wrap: wrap;
  gap: 0.5rem !important;
}

/* Correction spécifique pour éviter le scroll horizontal */
.conversion-modal-content .form-group {
  margin-bottom: 1rem;
  max-width: 100%;
}

.conversion-modal-content .form-control {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.conversion-modal-content .d-flex {
  flex-wrap: wrap;
}

.conversion-modal-content .d-flex.gap-2 {
  gap: 0.5rem !important;
}

.conversion-modal-content .d-flex.gap-3 {
  gap: 0.75rem !important;
}

/* Ajustement pour les radio buttons */
.conversion-modal-content .d-flex.align-items-center.gap-2 {
  margin-bottom: 0.5rem;
}

/* Ajustement pour les colonnes sur petits écrans */
@media (max-width: 576px) {
  .conversion-modal-content .col-md-6,
  .conversion-modal-content .col-md-4,
  .conversion-modal-content .col-md-3,
  .conversion-modal-content .col-md-5,
  .conversion-modal-content .col-md-2 {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    margin-bottom: 0.25rem;
  }
  
  .conversion-modal-content {
    padding: 2px 0;
  }
}

/* Styles pour les modales extra-larges */
.modal-xlarge .conversion-modal-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* Amélioration de l'espacement - plus compact */
.conversion-modal-content {
  padding: 5px 0 0 0;
}

.conversion-modal-content .form-step {
  padding: 0.25rem 0;
}

.conversion-modal-content .card {
  margin-bottom: 0.75rem;
}

.conversion-modal-content .alert {
  margin-bottom: 0.75rem;
}

.conversion-modal-content .row {
  margin-bottom: 0.25rem;
}

.conversion-modal-content .col-md-6,
.conversion-modal-content .col-md-4,
.conversion-modal-content .col-md-3 {
  margin-bottom: 0.25rem;
}

.conversion-modal-content .card-body {
  padding: 0.75rem;
}

/* Styles pour les éléments de résumé */
.summary-item {
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-left: 4px solid #33b04a;
}

/* Styles pour les champs de formulaire */
.form-control.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.form-label .text-danger {
  color: #dc3545 !important;
}

.required {
  position: relative;
}

.required::after {
  content: " *";
  color: #dc3545;
  font-weight: bold;
}

/* Styles pour les alertes */
.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-danger .fas {
  color: #721c24;
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
