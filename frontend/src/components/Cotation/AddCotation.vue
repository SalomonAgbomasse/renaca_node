<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white">
      <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
        
        <!-- Indicateur de chargement pour l'édition -->
        <div v-if="loadingData" class="text-center p-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement des données...</span>
          </div>
          <p class="mt-2">Chargement des informations de la cotation...</p>
        </div>

        <Form v-else ref="contratForm" @submit="addContrat" :validation-schema="contratSchema" :initial-values="initialValues" v-slot="{ errors }">
          
          <!-- Affichage des erreurs de validation pour le diagnostic -->
          <div v-if="Object.keys(errors).length > 0" class="alert alert-danger mb-4 rounded-3 shadow-sm">
            <h5 class="alert-heading mb-2">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Veuillez corriger les erreurs suivantes :
            </h5>
            <ul class="mb-0 ps-3">
              <li v-for="(message, field) in errors" :key="field">
                {{ message }}
              </li>
            </ul>
          </div>
        
        <!-- Résumé client (mode single step) -->
        <div v-if="isSingleStepMode" class="client-summary mb-4">
          <div class="card border-0 bg-light">
            <div class="card-body p-3">
              <h5 class="mb-2">
                <i class="fas fa-user me-2 text-primary"></i>
                {{ isEditMode ? 'Vous modifiez la cotation de' : 'Vous créez une cotation pour' }} :
              </h5>
              <div class="row">
                <div class="col-md-8">
                  <strong>{{ clientInfo.lastname }} {{ clientInfo.firstname }}</strong>
                  <span v-if="clientInfo.phone" class="text-muted ms-2">
                    <i class="fas fa-phone me-1"></i>{{ clientInfo.phone }}
                  </span>
                  <span v-if="clientInfo.email" class="text-muted ms-2">
                    <i class="fas fa-envelope me-1"></i>{{ clientInfo.email }}
                  </span>
                </div>
                <div class="col-md-4 text-end" v-if="isEditMode && contratCode">
                  <span class="badge bg-primary">{{ contratCode }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation par onglets moderne (Segmented Control) -->
        <div class="product-selector-container mb-4">
          <div class="modern-tabs">
            <div 
              v-for="natureCredit in natureCredits" 
              :key="natureCredit.id"
              class="tab-item"
              :class="{ 'active': creditType === natureCredit.code || creditType === (natureCredit.code || '').toUpperCase() }"
              @click="selectCreditType(natureCredit.code, natureCredit.libelle)"
            >
              <div class="tab-icon">
                <i v-if="(natureCredit.code || '').toUpperCase() === 'CP'" class="fas fa-shield-alt"></i>
                <i v-else-if="(natureCredit.code || '').toUpperCase() === 'OBA'" class="fas fa-hands-helping"></i>
                <i v-else-if="(natureCredit.code || '').toUpperCase() === 'AMORT'" class="fas fa-chart-line"></i>
                <i v-else class="fas fa-file-invoice-dollar"></i>
              </div>
              <div class="tab-label">
                <span class="full-label">{{ natureCredit.libelle }}</span>
                <span class="short-label">{{ natureCredit.code }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Champ caché pour creditType pour validation/soumission -->
        <Field name="creditType" type="hidden" v-model="creditType" />

          <div v-if="isCPMode || isOBAMode">
            <div class="row" v-if="isCPMode">
              <!-- Capital PADME for CP -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Capital <span class="text-danger">*</span>
                  </label>
                  <Field name="capital" v-slot="{ field }">
                    <select
                      v-bind="field"
                      class="form-control shadow-none fs-md-15 text-black"
                      style="height: 48px; border: 2px solid #e9ecef; border-radius: 8px;"
                      @change="handleSelectCapitalChange($event)"
                    >
                      <option :value="500000">Option 1 - 500 000 FCFA</option>
                      <option :value="1000000">Option 2 - 1 000 000 FCFA</option>
                    </select>
                  </Field>
                  <ErrorMessage name="capital" class="text-danger"/>
                </div>
              </div>

              <!-- Date de naissance for CP -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Date de naissance <span class="text-danger">*</span>
                    <span v-if="birthDateValue && calculatedAge > 0" 
                          class="ms-2" 
                          :class="calculatedAge >= 18 ? 'text-success' : 'text-danger'">
                      Âge : {{ calculatedAge }} ans
                    </span>
                  </label>
                  <Field name="birthdate" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="date"
                      class="form-control shadow-none fs-md-15 text-black"
                      :max="maxBirthdate"
                      @input="handleBirthDateInput"
                    />
                  </Field>
                  <ErrorMessage name="birthdate" class="text-danger"/>
                </div>
              </div>

              <!-- Durée en mois for CP -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Durée en mois <span class="text-danger">*</span>
                  </label>
                  <Field name="duration" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="number"
                      class="form-control shadow-none fs-md-15 text-black bg-light"
                      :disabled="true"
                      placeholder="Durée calculée"
                      :max="getDurationMaxPADME()"
                      maxlength="2"
                    />
                  </Field>
                  <ErrorMessage name="duration" class="text-danger"/>
                </div>
              </div>
            </div>

            <!-- OBA Dynamic Options Section -->
            <div v-else-if="isOBAMode" class="col-12 mb-4">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <h5 class="text-black fw-semibold mb-1">Choix des Assurés pour Obsèques Alafia</h5>
                  <p class="text-muted small mb-0">Cochez les assurés à inclure dans la couverture. Âge max : 65 ans (Assuré/Conjoint), 75 ans (Ascendants).</p>
                </div>
                <div class="alert alert-info px-4 py-2 shadow-sm rounded-pill border-2 border-info d-inline-flex align-items-center mb-0">
                  <i class="fas fa-shield-alt me-2 text-info fs-5"></i>
                  <span class="fs-15 fw-bold text-info-emphasis">Total Capital Assuré : <span class="fs-17 text-dark ms-1">{{ obaMainCapital.toLocaleString('fr-FR') }} FCFA</span></span>
                </div>
              </div>
              
              <!-- Hidden fields to satisfy VeeValidate validation schema -->
              <Field name="capital" type="hidden" v-model="obaMainCapital" />
              <Field name="birthdate" type="hidden" v-model="obaMainBirthdate" />
              <Field name="duration" type="hidden" :value="12" />
              <Field name="typeCustomer" type="hidden" v-model="obaTypeCustomer" />

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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-assure" v-model="obaSelectedOptions.assure.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-assure">
                          Assuré
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.assure.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.assure.birthdate" :max="maxBirthdate" />
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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-ascendant1" v-model="obaSelectedOptions.ascendant1.checked" :disabled="!obaSelectedOptions.assure.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-ascendant1">
                          Père Assuré
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.ascendant1.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant1.birthdate" :max="maxBirthdate" />
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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-ascendant2" v-model="obaSelectedOptions.ascendant2.checked" :disabled="!obaSelectedOptions.assure.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-ascendant2">
                          Mère Assuré
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.ascendant2.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant2.birthdate" :max="maxBirthdate" />
                      </div>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant2.checked && obaSelectedOptions.ascendant2.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                      <span class="small" :class="isObaOptionAgeValid('ascendant2') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                        Âge : {{ calculateAge(obaSelectedOptions.ascendant2.birthdate) }} ans
                        <span v-if="!isObaOptionAgeValid('ascendant2') && calculateAge(obaSelectedOptions.ascendant2.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant2.birthdate) <= 75" class="ms-1 fw-bold">
                          (Doit être plus âgé)
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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-conjoint" v-model="obaSelectedOptions.conjoint.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-conjoint">
                          Conjoint(e)
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.conjoint.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.conjoint.birthdate" :max="maxBirthdate" />
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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-ascendant3" v-model="obaSelectedOptions.ascendant3.checked" :disabled="!obaSelectedOptions.conjoint.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-ascendant3">
                          Père Conjoint(e)
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.ascendant3.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant3.birthdate" :max="maxBirthdate" />
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
                        <input class="form-check-input me-2" type="checkbox" id="oba-opt-ascendant4" v-model="obaSelectedOptions.ascendant4.checked" :disabled="!obaSelectedOptions.conjoint.checked" />
                        <label class="form-check-label fw-bold text-black cursor-pointer" for="oba-opt-ascendant4">
                          Mère Conjoint(e)
                        </label>
                      </div>
                      <div v-if="obaSelectedOptions.ascendant4.checked" class="flex-grow-1" style="max-width: 160px;">
                        <input type="date" class="form-control form-control-sm" v-model="obaSelectedOptions.ascendant4.birthdate" :max="maxBirthdate" />
                      </div>
                    </div>
                    <div v-if="obaSelectedOptions.ascendant4.checked && obaSelectedOptions.ascendant4.birthdate" class="text-end" style="margin-top: 2px; line-height: 1;">
                      <span class="small" :class="isObaOptionAgeValid('ascendant4') ? 'text-success' : 'text-danger'" style="font-size: 11px;">
                        Âge : {{ calculateAge(obaSelectedOptions.ascendant4.birthdate) }} ans
                        <span v-if="!isObaOptionAgeValid('ascendant4') && calculateAge(obaSelectedOptions.ascendant4.birthdate) >= 18 && calculateAge(obaSelectedOptions.ascendant4.birthdate) <= 75" class="ms-1 fw-bold">
                          (Doit être plus âgé)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div class="row">
              <!-- Nom -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Nom <span class="text-danger">*</span>
                  </label>
                  <Field name="lastname" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black text-uppercase"
                      placeholder="Nom du client"
                      @input="handleUppercaseInput($event, 'lastname')"
                    />
                  </Field>
                  <ErrorMessage name="lastname" class="text-danger"/>
                </div>
              </div>

              <!-- Prénoms -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Prénoms <span class="text-danger">*</span>
                  </label>
                  <Field name="firstname" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black text-uppercase"
                      placeholder="Prenoms du client"
                      @input="handleUppercaseInput($event, 'firstname')"
                    />
                  </Field>
                  <ErrorMessage name="firstname" class="text-danger"/>
                </div>
              </div>

              <!-- Établissement -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Établissement
                  </label>
                  <Field name="etablissement" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black"
                      placeholder="Nom de l'établissement (optionnel)"
                    />
                  </Field>
                  <ErrorMessage name="etablissement" class="text-danger"/>
                </div>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="row">
              <!-- Périodicité PADME -->
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Périodicité <span class="text-danger">*</span>
                  </label>
                  <Field name="idPeriodicite" v-slot="{ field }">
                    <select 
                      v-bind="field"
                      class="form-control shadow-none fs-md-15 text-black"
                      @change="onPeriodiciteChange($event)"
                      :disabled="loadingPeriodicites"
                      style="height: 48px; border: 2px solid #e9ecef; border-radius: 8px;"
                    >
                      <option value="" disabled>
                        {{ loadingPeriodicites ? 'Chargement...' : 'Sélectionner la périodicité' }}
                      </option>
                      <option 
                        v-for="periodicite in periodicites" 
                        :key="periodicite.id" 
                        :value="periodicite.id"
                      >
                        {{ periodicite.libelle }}
                      </option>
                    </select>
                  </Field>
                </div>
              </div>

              <!-- Date de naissance -->
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Date de naissance <span class="text-danger">*</span>
                    <span v-if="birthDateValue && isPeriodiciteValid && calculatedAge > 0" 
                          class="ms-2" 
                          :class="calculatedAge >= 18 ? 'text-success' : 'text-danger'">
                      Âge : {{ calculatedAge }} ans
                    </span>
                    <span v-if="!isPeriodiciteValid" class="text-muted ms-2">(Sélectionnez d'abord la périodicité)</span>
                  </label>
                  <Field name="birthdate" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="date"
                      class="form-control shadow-none fs-md-15 text-black"
                      :class="{ 'field-disabled': !isPeriodiciteValid }"
                      :disabled="!isPeriodiciteValid"
                      :max="maxBirthdate"
                      @input="handleBirthDateInput"
                    />
                  </Field>
                  <ErrorMessage name="birthdate" class="text-danger"/>
                </div>
              </div>

              <!-- Capital PADME -->
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Capital <span class="text-danger">*</span>
                    <span class="ms-2" v-if="isAmortMode">Max 10 000 000</span>
                    <span v-if="!isBirthDateValid && isAmortMode" class="text-muted ms-2">(Saisissez d'abord la date de naissance)</span>
                  </label>
                  
                  <!-- Si AMORTISSABLE, saisie libre -->
                  <Field v-if="isAmortMode" name="capital" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="tel"
                      class="form-control shadow-none fs-md-15 text-black text-uppercase"
                      :class="{ 'field-disabled': !isBirthDateValid }"
                      :disabled="!isBirthDateValid"
                      placeholder="Maximum 10 000 000 FCFA (PADME)"
                      maxlength="8"
                      @input="handleCapitalInput"
                    />
                  </Field>
                  
                  <Field v-else-if="isOBAMode" name="capital" v-slot="{ field }">
                    <select
                      v-bind="field"
                      class="form-control shadow-none fs-md-15 text-black"
                      style="height: 48px; border: 2px solid #e9ecef; border-radius: 8px;"
                      @change="handleSelectCapitalChange($event)"
                    >
                      <option :value="1000000">Option 1 - Assuré & Conjoint - 1 000 000 FCFA</option>
                      <option :value="2000000">Option 2 - Ascendants biologiques - 2 000 000 FCFA</option>
                    </select>
                  </Field>

                  <ErrorMessage name="capital" class="text-danger"/>
                </div>
              </div>

              <!-- Durée en mois -->
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Durée en mois <span class="text-danger">*</span>
                    <span v-if="!isCapitalValid && isAmortMode" class="text-muted ms-2">(Saisissez d'abord le capital)</span>
                  </label>
                  <Field name="duration" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="number"
                      class="form-control shadow-none fs-md-15 text-black"
                      :class="{ 'field-disabled': !isCapitalValid && isAmortMode, 'bg-light': !isAmortMode }"
                      :disabled="(!isCapitalValid && isAmortMode) || !isAmortMode"
                      placeholder="60 mois max (18-65 ans) / 12 mois max (65-70 ans)"
                      :max="getDurationMaxPADME()"
                      maxlength="2"
                      @input="handleDurationInput"
                    />
                  </Field>
                  <ErrorMessage name="duration" class="text-danger"/>
                </div>
              </div>

              <!-- Différée PADME -->
              <div class="col-md-6">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Différée (en mois - Laisser à 0 si non) <span class="text-danger">*</span>
                  </label>
                  <Field name="differe" v-slot="{ field }">
                    <select
                      v-bind="field"
                      class="form-control shadow-none fs-md-15 text-black"
                    >
                      <option value="0">0 mois</option>
                      <option value="1">1 mois</option>
                      <option value="2">2 mois</option>
                      <option value="3">3 mois</option>
                      <option value="4">4 mois</option>
                      <option value="5">5 mois</option>
                      <option value="6">6 mois</option>
                    </select>
                  </Field>
                  <ErrorMessage name="differe" class="text-danger"/>
                </div>
              </div>

              <!-- Type de client -->
              <div class="col-md-6">
                <label class="d-block text-black fw-semibold mb-10">Type de client <span class="text-danger">*</span></label>
                <div class="d-flex gap-3">
                  <label class="d-flex align-items-center gap-2">
                    <Field name="typeCustomer" type="radio" value="1" v-slot="{ field }">
                      <input type="radio" v-bind="field" value="1" />
                    </Field>
                    Particulier
                  </label>

                  <label class="d-flex align-items-center gap-2">
                    <Field name="typeCustomer" type="radio" value="2" v-slot="{ field }">
                      <input type="radio" v-bind="field" value="2" />
                    </Field>
                    Personnel
                  </label>
                </div>
                <ErrorMessage name="typeCustomer" class="text-danger" />
              </div>
            </div>

            <div class="row">
              <!-- Etablissement -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Établissement
                  </label>
                  <Field name="etablissement" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black"
                      placeholder="Nom de l'établissement (optionnel)"
                    />
                  </Field>
                  <ErrorMessage name="etablissement" class="text-danger"/>
                </div>
              </div>
              
              <!-- Nom -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Nom
                  </label>
                  <Field name="lastname" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black text-uppercase"
                      placeholder="Nom du client"
                      @input="handleUppercaseInput($event, 'lastname')"
                    />
                  </Field>
                  <ErrorMessage name="lastname" class="text-danger"/>
                </div>
              </div>

              <!-- Prénoms -->
              <div class="col-md-4">
                <div class="form-group mb-15 mb-sm-20 mb-md-25">
                  <label class="d-block text-black fw-semibold mb-10">
                    Prénoms
                  </label>
                  <Field name="firstname" v-slot="{ field }">
                    <input
                      v-bind="field"
                      type="text"
                      class="form-control shadow-none fs-md-15 text-black text-uppercase"
                      placeholder="Prenoms du client"
                      @input="handleUppercaseInput($event, 'firstname')"
                    />
                  </Field>
                  <ErrorMessage name="firstname" class="text-danger"/>
                </div>
              </div>
            </div>
          </div>
        <!-- Boutons de navigation -->
        <div class="row mt-4">
          <div class="col-12 d-flex justify-content-between">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCancel"
            >
              <i class="fas fa-times me-2"></i>
              Annuler
            </button>
            <div>
              <!-- Un seul bouton: soumission directe de l'étape Client -->
              <button
                type="submit"
                class="btn btn-success"
                :disabled="isSubmitting || !isObaAgesValid"
              >
                <span v-if="isSubmitting">
                  <i class="spinner-border spinner-border-sm me-2"></i>
                  Simulation en cours...
                </span>
                <span v-else>
                  <i class="fas fa-save me-2"></i>
                  Simuler
                </span>
              </button>
            </div>
          </div>
        </div>

        </Form>
      </div>
    </div>

    <!-- Modal des primes calculées -->
    <PrimesCalculatedModal
      :visible="showPrimesSection"
      :primes="calculatedPrimes"
      :is-converting="isConverting"
      context="add-cotation"
      @close="closePrimesSection"
      @convert-add-cotation="openConvertModalWithData"
    />

    <!-- Modal de conversion en contrat -->
    <CotationToContratModal
      :visible="showConvertModal"
      :selected-client="selectedClientForConversion"
      :selected-cotation="selectedCotationForConversion"
      :client-editable="true"
      modal-title="Conversion en Contrat"
      :default-credit-type="conversionForm.contrat.creditType"
      :default-duration="conversionForm.contrat.duration"
      :default-capital="conversionForm.contrat.capital"
      :default-garantie-compl="conversionForm.contrat.garantieCompl"
      :default-nom="conversionForm.client.nom"
      :default-prenoms="conversionForm.client.prenoms"
      :default-type-client="conversionForm.client.typeClient"
      :default-date-naissance="conversionForm.client.dateNaissance"
      @conversion-success="handleConversionSuccess"
      @close="closeConvertModal"
      @update:visible="showConvertModal = $event"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { error, success } from '../../utils/utils';
import { useRouter, useRoute } from "vue-router";
import ApiService from '../../services/ApiService';
import { useAuthStore } from '../../services/auth';
import JwtService from '../../services/JwtService';
import * as Yup from 'yup';
import Modal from '../Common/Modal.vue';
import PrimesCalculatedModal from '../Common/PrimesCalculatedModal.vue';
import CotationToContratModal from '../Common/CotationToContratModal.vue';

interface CalculatedValues {
capital: number | null;
}

interface ContratData {
// Données client
lastname: string;
firstname: string;
phone: string;
phone2?: string;
email?: string;
typeCustomer: string;
birthdate: string;
placeOfBirth?: string;
address?: string;
profession: string;
gender: string;
maritalStatus?: string;

// Données contrat
refCompte: string;
chosenOption: string;
capital: number | null;
garantieCompl: string;
taux?: string;
typeCompte: string;
ets?: string;
contractMonth: number;
}

export default defineComponent({
  name: "AddCotation",
  components: {
    Form,
    Field,
    ErrorMessage,
    Modal,
    PrimesCalculatedModal,
    CotationToContratModal,
  },

setup() {
  // Composables
  const router = useRouter();
  const route = useRoute();

  // Refs
  const contratForm = ref(null);
  const isSubmitting = ref(false);
  const isFormDirty = ref(false);
  const loadingData = ref(false);
  const showEtablissement = ref(false);
  const contratCode = ref('');
  const initialValues = ref<any>({
    typeCustomer: '1', // Particulier par défaut
    garantieCompl: 'NON', // NON par défaut pour PADME
    differe: 0 // Différée à 0 par défaut
  });
  const selectedOption = ref('');
  const selectedMonth = ref(new Date().getMonth() + 1); // Mois actuel (1-12)
  const idPeriodicite = ref('');
  const creditType = ref('AMORT'); // AMORT par défaut
  const isAmortMode = computed(() => (creditType.value || '').toUpperCase() === 'AMORT');
  const isCPMode = computed(() => (creditType.value || '').toUpperCase() === 'CP');
  const isOBAMode = computed(() => (creditType.value || '').toUpperCase() === 'OBA');
  const isTontineMode = computed(() => false); // Plus de mode Tontine
  const natureCredits = ref<any[]>([]);
  const loadingNatureCredits = ref(false);
  const selectedCreditType = ref('AMORTISSABLE');
  const periodicites = ref<any[]>([]);
  const loadingPeriodicites = ref(false);
  
  // Computed pour vérifier si c'est le mode HOMME CLE (HC)
  const isHommeCleMode = computed(() => false); // Pas de HC pour PADME
  
  // Variables pour la validation progressive PADME
  const isPeriodiciteValid = ref(false);
  const isBirthDateValid = ref(false);
  const isCapitalValid = ref(false);
  const isDurationValid = ref(false);
  
  const maxBirthdate = computed(() => {
    const today = new Date();
    const minAge = 18;
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  });
  
  // Variable pour l'âge calculé
  const calculatedAge = ref(0);
  const birthDateValue = ref('');
  
  const calculatedValues = ref<CalculatedValues>({
    capital: null
  });

  // Fonction utilitaire pour convertir le capital en nombre de manière sécurisée
  const safeParseCapital = (value: any): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  // Fonction pour obtenir le placeholder de durée selon le type de crédit
  const getDurationPlaceholder = (): string => {
    return '60 mois max (18-65 ans) / 12 mois max (65-70 ans)';
  };

  // Fonction pour obtenir la durée maximale PADME selon l'âge
  const getDurationMaxPADME = (): number => {
    if (calculatedAge.value >= 65 && calculatedAge.value <= 70) {
      return 12; // 65-70 ans: max 12 mois
    }
    return 60; // 18-65 ans: max 60 mois
  };

  // Fonction pour gérer le changement de périodicité
  const onPeriodiciteChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    idPeriodicite.value = target.value;
    
    // Mettre à jour VeeValidate
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('idPeriodicite', target.value);
    }
    
    isPeriodiciteValid.value = target.value !== '';
    if (!isPeriodiciteValid.value) {
      isBirthDateValid.value = false;
      isCapitalValid.value = false;
      isDurationValid.value = false;
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour gérer le changement de date de naissance (PADME)
  const handleBirthDateInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    birthDateValue.value = target.value;
    calculatedAge.value = calculateAge(target.value);
    
    const maxAge = (creditType.value === 'CP' || creditType.value === 'OBA') ? 75 : 70;
    isBirthDateValid.value = birthDateValue.value !== '' && calculatedAge.value >= 18 && calculatedAge.value <= maxAge;
    
    if (!isBirthDateValid.value) {
      if (creditType.value === 'AMORT') {
        isCapitalValid.value = false;
        isDurationValid.value = false;
      }
    } else {
      if (creditType.value === 'CP' || creditType.value === 'OBA') {
        isCapitalValid.value = true;
        isDurationValid.value = true;
      }
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour gérer l'input du capital (PADME: max 10M)
  const handleCapitalInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    let digits = (target.value || '').replace(/[^0-9]/g, '');
    
    if (digits) {
      const num = Math.max(1, Math.min(10000000, parseInt(digits, 10))); // Max 10M pour PADME
      digits = String(num);
    }
    
    target.value = digits;
    
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('capital', digits === '' ? null : Number(digits));
    }
    
    isCapitalValid.value = digits !== '' && Number(digits) > 0;
    
    if (!isCapitalValid.value) {
      isDurationValid.value = false;
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour gérer l'input de la durée (PADME)
  const handleDurationInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    let digits = (target.value || '').replace(/[^0-9]/g, '');
    
    if (digits) {
      const maxDuration = getDurationMaxPADME();
      const num = Math.max(1, Math.min(maxDuration, parseInt(digits, 10)));
      digits = String(num);
    }
    
    target.value = digits;
    
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('duration', digits === '' ? null : Number(digits));
    }
    
    isDurationValid.value = digits !== '' && Number(digits) > 0;
    isFormDirty.value = true;
  };

  // Variables pour les primes calculées
  const showPrimesSection = ref(false);
  const isConverting = ref(false);
  const calculatedPrimes = ref({
    pd: 0,
    pc: 0,
    surp: 0,
    acc: 0,
    fm: 0,
    puttc: 0
  });

  const obaSelectedOptions = ref({
    assure: { checked: true, birthdate: '' },
    conjoint: { checked: false, birthdate: '' },
    ascendant1: { checked: false, birthdate: '' },
    ascendant2: { checked: false, birthdate: '' },
    ascendant3: { checked: false, birthdate: '' },
    ascendant4: { checked: false, birthdate: '' }
  });

  const obaTypeCustomer = ref('1');

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
    if (creditType.value === 'OBA' && contratForm.value) {
      (contratForm.value as any).setFieldValue('capital', newCapital);
      (contratForm.value as any).setFieldValue('birthdate', newBirthdate);
    }
  });

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

  // Variables pour les alertes
  const showMedicalAlert = ref(false);
  const medicalAlertMessage = ref('');

  // Variables pour la gestion du succès de conversion
  const conversionSuccess = ref(false);
  const conversionMessage = ref('');
  const createdContractId = ref<number | null>(null);
  const isDownloadingPDF = ref(false);

  // Variables pour la modal de conversion
  const showConvertModal = ref(false);
  const selectedClientForConversion = ref<any>(null);
  const selectedCotationForConversion = ref<any>(null);
  
  // Variables pour le formulaire multi-étapes
  const currentStep = ref(1);
  const totalSteps = 3;
  
  // Variables pour stocker les valeurs du formulaire principal
  const formValues = ref({
    lastname: '',
    firstname: '',
    birthdate: '',
    capital: 0,
    duration: 0
  });
  
  // Données du formulaire de conversion
  const conversionForm = ref({
    // Étape 1: Informations complètes du client
    client: {
      nom: '',
      prenoms: '',
      adresse: '',
      email: '',
      telephone: '',
      sexe: '',
      dateNaissance: '',
      lieuNaissance: '',
      profession: '',
      typeClient: ''
    },
    // Étape 2: Informations du contrat
    contrat: {
      refrence: '',
      dateEffet: '',
      etablissement: '',
      duree: 60,
      duration: 60,
      tauxInteret: '',
      datePremiereEcheance: '',
      dateEch1: '',
      capital: 25000000,
      garantieCompl: 'OUI',
      creditType: ''
    },
    // Étape 3: Primes recalculées
    primes: {
      pd: 0,
      pc: 0,
      surp: 0,
      acc: 0,
      fm: 0,
      puttc: 0
    }
  });

  // Variable pour les erreurs de validation dans le modal
  const modalValidationError = ref('');
  const datePremiereEcheanceManuallyEdited = ref(false);
  
  // Variable pour indiquer si le recalcul des primes a échoué
  const primesCalculationFailed = ref(false);
  
  // Variable pour stocker la valeur de garantieCompl du formulaire principal
  const currentGarantieCompl = ref('OUI');

  // Watcher pour mettre à jour currentGarantieCompl en temps réel
  watch(() => {
    const garantieField = document.querySelector('input[name="garantieCompl"]:checked') as HTMLInputElement;
    return garantieField ? garantieField.value : 'OUI';
  }, (newValue) => {
    if (newValue) {
      currentGarantieCompl.value = newValue;
    }
  }, { immediate: true });

  // Référence pour le formulaire de conversion
  const conversionFormRef = ref(null);

  // Schéma de validation VeeValidate pour le formulaire de conversion
  const conversionSchema = Yup.object().shape({
    client: Yup.object().shape({
      nom: Yup.string().required('Le nom est obligatoire').trim(),
      prenoms: Yup.string().required('Les prénoms sont obligatoires').trim(),
      dateNaissance: Yup.date().required('La date de naissance est obligatoire'),
      sexe: Yup.string().required('Le sexe est obligatoire'),
      adresse: Yup.string().required('L\'adresse est obligatoire').trim(),
      telephone: Yup.string().required('Le téléphone est obligatoire').trim(),
      profession: Yup.string().required('La profession est obligatoire').trim(),
      lieuNaissance: Yup.string().required('Le lieu de naissance est obligatoire').trim(),
      typeClient: Yup.string().required('Le type de client est obligatoire'),
      email: Yup.string().email('Format d\'email invalide').nullable()
    }),
    contrat: Yup.object().shape({
      refrence: Yup.string().nullable(),
      dateEffet: Yup.date().required('La date d\'effet est obligatoire'),
      etablissement: Yup.string().nullable(),
      duree: Yup.number()
        .required('La durée est obligatoire')
        .min(1, 'La durée doit être d\'au moins 1 mois')
        .max(120, 'La durée ne peut pas dépasser 120 mois (10 ans)')
        .required('La durée est obligatoire'),
      duration: Yup.number()
        .required('La durée est obligatoire')
        .min(1, 'La durée doit être d\'au moins 1 mois')
        .max(120, 'La durée ne peut pas dépasser 120 mois (10 ans)')
        .required('La durée est obligatoire'),
      tauxInteret: Yup.number()
        .transform((value, originalValue) => {
          // Si la valeur est vide ou null, retourner undefined
          if (originalValue === '' || originalValue === null || originalValue === undefined) {
            return undefined;
          }
          // Convertir en nombre
          const num = Number(originalValue);
          return isNaN(num) ? undefined : num;
        })
        .typeError('Le taux d\'intérêt doit être un nombre valide')
        .required('Le taux d\'intérêt est obligatoire')
        .min(0, 'Le taux d\'intérêt ne peut pas être négatif')
        .max(100, 'Le taux d\'intérêt ne peut pas dépasser 100%'),
      datePremiereEcheance: Yup.date().required('La date de première échéance est obligatoire'),
      capital: Yup.number()
        .transform((value, originalValue) => {
          // Si la valeur est vide ou null, retourner undefined
          if (originalValue === '' || originalValue === null || originalValue === undefined) {
            return undefined;
          }
          // Convertir en nombre
          const num = Number(originalValue);
          return isNaN(num) ? undefined : num;
        })
        .typeError('Le capital doit être un nombre valide')
        .required('Le capital est obligatoire')
        .min(1, 'Le capital doit être d\'au moins 1')
        .max(25000000, 'Le capital maximal est 25 000 000 FCFA'),
      garantieCompl: Yup.string()
        .oneOf(['OUI', 'NON'], "Un choix pour la garantie perte d'emploi est obligatoire")
        .required("Un choix pour la garantie perte d'emploi est obligatoire"),
      creditType: Yup.string()
        .oneOf(['AMORT', 'CP', 'OBA'], "Choix invalide pour le type de crédit")
        .required('Le type de nature de crédit est obligatoire')
    })
  });




  // Computed
  const isEditMode = computed(() => !!route.params.code);
  const isClientExistingMode = computed(() => !!route.query.clientCode);
  const isSingleStepMode = computed(() => isEditMode.value || isClientExistingMode.value);
  const garantieComplValue = computed(() => {
    // Récupérer la valeur depuis le formulaire principal
    const garantieField = document.querySelector('input[name="garantieCompl"]:checked') as HTMLInputElement;
    return garantieField ? garantieField.value : 'OUI';
  });

  // Computed pour vérifier si on peut passer à l'étape suivante
  const canProceedToNextStep = computed(() => {
    if (currentStep.value === 1) {
      // Validation étape 1: Informations client
      const client = conversionForm.value.client;
      const isValid = !!(client.nom?.trim() && client.prenoms?.trim() && client.dateNaissance && 
                client.sexe && client.adresse?.trim() && client.telephone?.trim() && 
                client.profession?.trim() && client.lieuNaissance?.trim() && client.typeClient);
      
      // Log de débogage pour identifier les champs manquants
     /*  console.log('🔍 Validation étape 1 - État des champs:');
      console.log('  - nom:', client.nom?.trim() ? '✓' : '✗', `"${client.nom}"`);
      console.log('  - prenoms:', client.prenoms?.trim() ? '✓' : '✗', `"${client.prenoms}"`);
      console.log('  - dateNaissance:', client.dateNaissance ? '✓' : '✗', `"${client.dateNaissance}"`);
      console.log('  - sexe:', client.sexe ? '✓' : '✗', `"${client.sexe}"`);
      console.log('  - adresse:', client.adresse?.trim() ? '✓' : '✗', `"${client.adresse}"`);
      console.log('  - telephone:', client.telephone?.trim() ? '✓' : '✗', `"${client.telephone}"`);
      console.log('  - profession:', client.profession?.trim() ? '✓' : '✗', `"${client.profession}"`);
      console.log('  - lieuNaissance:', client.lieuNaissance?.trim() ? '✓' : '✗', `"${client.lieuNaissance}"`);
      console.log('  - typeClient:', client.typeClient ? '✓' : '✗', `"${client.typeClient}"`);
      console.log('🔍 Validation finale:', isValid);
      console.log('🔍 Valeur complète du client:', client); */
      
      return isValid;
    } else if (currentStep.value === 2) {
      // Validation étape 2: Informations contrat
      const contrat = conversionForm.value.contrat;
      
     // console.log('🔍 Validation étape 2 - État des champs:');
      const capitalValue = safeParseCapital(contrat.capital);
      /* console.log('  - capital:', contrat.capital, 'Valid:', !!(capitalValue && capitalValue > 0));
      console.log('  - duration:', contrat.duration, 'Valid:', !!(contrat.duration && Number(contrat.duration) > 0));
      console.log('  - tauxInteret:', contrat.tauxInteret, 'Valid:', !!(contrat.tauxInteret && Number(contrat.tauxInteret) > 0 && Number(contrat.tauxInteret) <= 100));
      console.log('  - dateEffet:', contrat.dateEffet, 'Valid:', !!contrat.dateEffet);
      console.log('  - datePremiereEcheance:', contrat.datePremiereEcheance, 'Valid:', !!contrat.datePremiereEcheance);
      console.log('  - creditType:', contrat.creditType);
       */
      // Vérifications de base
      if (!capitalValue || capitalValue <= 0) {
        //console.log('❌ Échec validation: capital manquant ou invalide');
        return false;
      }
      if (!contrat.duration || Number(contrat.duration) <= 0) {
        //console.log('❌ Échec validation: duration manquante ou invalide');
        return false;
      }
      if (!contrat.tauxInteret || Number(contrat.tauxInteret) <= 0 || Number(contrat.tauxInteret) > 100) {
        //console.log('❌ Échec validation: tauxInteret manquant ou invalide');
        return false;
      }
      if (!contrat.dateEffet || !contrat.datePremiereEcheance) {
        //console.log('❌ Échec validation: dates manquantes');
        return false;
      }
      
      // Validation spécifique pour la Tontine
      // Validation pour les types de crédit AMORT et HC
      if (capitalValue > 25000000) {
        //console.log('❌ Échec validation: capital trop élevé');
        return false;
      }
      if (Number(contrat.duration) > 120) {
        //console.log('❌ Échec validation: durée trop longue');
        return false;
      }
      
      //console.log('✅ Validation étape 2 réussie');
      return true;
    }
    
    return true;
  });

  // Computed pour vérifier si on peut créer le contrat
  const canCreateContract = computed(() => {
    // Vérifier que toutes les étapes sont valides ET que le recalcul des primes a réussi
    return canProceedToNextStep.value && !primesCalculationFailed.value && !modalValidationError.value;
  });
  const clientInfo = ref({
    lastname: '',
    firstname: '',
    phone: '',
    email: ''
  });

  // Schema de validation PADME - SEULEMENT les champs présents dans le formulaire
  const contratSchema = computed(() => {
    return Yup.object().shape({
      // Champs PADME
      idPeriodicite: (creditType.value === 'CP' || creditType.value === 'OBA')
        ? Yup.string().nullable().optional()
        : Yup.string().required('La périodicité est obligatoire'),
      
      birthdate: Yup.date()
        .nullable()
        .transform((value, originalValue) => {
          if (!originalValue || originalValue === '') {
            return null;
          }
          const parsedDate = new Date(originalValue);
          return isNaN(parsedDate.getTime()) ? null : parsedDate;
        })
        .required('La date de naissance est obligatoire')
        .test('valid-date', 'Veuillez saisir une date valide', function(value) {
          if (!value) return false;
          return !isNaN(value.getTime());
        })
        .test('age-minimum', 'Le client doit avoir au moins 18 ans (PADME)', function(value) {
          if (!value || isNaN(value.getTime())) return false;
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age >= 18;
        })
        .test('age-maximum', function(value) {
          if (!value || isNaN(value.getTime())) return false;
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          const maxAge = (creditType.value === 'CP' || creditType.value === 'OBA') ? 75 : 70;
          if (age > maxAge) {
            return this.createError({ message: `L'âge ne peut pas dépasser ${maxAge} ans (PADME)` });
          }
          return true;
        })
        .test('not-future', 'La date de naissance ne peut pas être dans le futur', function(value) {
          if (!value || isNaN(value.getTime())) return true;
          return value <= new Date();
        }),
      
      capital: Yup.number()
        .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
        .typeError('Le capital doit être un nombre')
        .required('Le capital est obligatoire')
        .min(1, 'Le capital doit être supérieur à 0')
        .max(10000000, 'Le capital maximal PADME est 10 000 000 FCFA'),
      
      duration: Yup.number()
        .transform((value, originalValue) => originalValue === '' || originalValue === null ? undefined : Number(originalValue))
        .typeError('La durée doit être un nombre')
        .required('La durée en mois est obligatoire')
        .integer('La durée doit être un entier')
        .min(1, 'La durée minimale est 1 mois')
        .test('max-duration-padme', 'Durée maximale dépassée', function(value) {
          if (!value) return true;
          if (creditType.value === 'CP' || creditType.value === 'OBA') {
            return true;
          }
          const age = calculatedAge.value;
          const maxDuration = (age >= 65 && age <= 70) ? 12 : 60;
          const message = (age >= 65 && age <= 70)
            ? 'La durée maximale pour 65-70 ans est 12 mois'
            : 'La durée maximale est 60 mois (18-65 ans)';
          
          if (value > maxDuration) {
            return this.createError({ message });
          }
          return true;
        }),
      
      differe: (creditType.value === 'CP' || creditType.value === 'OBA')
        ? Yup.number().nullable().optional()
        : Yup.number()
            .transform((value, originalValue) => originalValue === '' || originalValue === null ? 0 : Number(originalValue))
            .typeError('La différée doit être un nombre')
            .min(0, 'La différée ne peut pas être négative')
            .max(6, 'La différée maximale est 6 mois')
            .required('La différée est obligatoire (0 si non applicable)'),
      
      garantieCompl: (creditType.value === 'CP' || creditType.value === 'OBA')
        ? Yup.string().nullable().optional()
        : Yup.string()
            .oneOf(['NON'], "La garantie perte d'emploi n'est pas disponible pour PADME")
            .default('NON'),
      
      typeCustomer: (creditType.value === 'CP' || creditType.value === 'OBA')
        ? Yup.string().nullable().optional()
        : Yup.string()
            .oneOf(['1', '2'], "Choix invalide pour le type de client")
            .required('Le type de client est obligatoire'),
      
      etablissement: Yup.string()
        .nullable()
        .optional(),
      
      lastname: Yup.string()
        .transform((value) => value ? value.toUpperCase() : value)
        .optional(),
      
      firstname: Yup.string()
        .transform((value) => value ? value.toUpperCase() : value)
        .optional()
    });
  });

  // Fonctions utilitaires
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };



  // Fonction pour formater la date pour les inputs
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Si la date est au format DD/MM/YYYY, la convertir en YYYY-MM-DD
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Si c'est déjà au format ISO, extraire juste la date
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      return dateString;
    } catch {
      return '';
    }
  };

  const loadNatureCredits = async () => {
    try {
      loadingNatureCredits.value = true;
      const response = await ApiService.get('/nature-credits');
      
      if (response.data && response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        natureCredits.value = response.data.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        natureCredits.value = response.data.data;
      } else {
        console.warn('⚠️ Structure de réponse inattendue pour natureCredits, utilisation du fallback');
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
          { id: 2, libelle: 'PADME PROTECTION', code: 'CP' },
          { id: 3, libelle: 'OBSEQUES ALAFIA', code: 'OBA' }
        ];
      }
      
      // Filtrer pour ne garder que AMORT, CP et OBA
      natureCredits.value = natureCredits.value.filter(nc => 
        nc.code === 'AMORT' || nc.code === 'CP' || nc.code === 'OBA'
      );
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des natures de crédit, utilisation du fallback:', err);
      natureCredits.value = [
        { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
        { id: 2, libelle: 'PADME PROTECTION', code: 'CP' },
        { id: 3, libelle: 'OBSEQUES ALAFIA', code: 'OBA' }
      ];
    } finally {
      loadingNatureCredits.value = false;
    }
  };

  const loadPeriodicites = async () => {
    try {
      loadingPeriodicites.value = true;
      
      const response = await ApiService.get('/periodicite');

      console.log('🔍 Response periodicites:', response.data);
      
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
      error('Erreur lors du chargement des périodicités. Utilisation des valeurs par défaut.');
    } finally {
      loadingPeriodicites.value = false;
    }
  };

  const loadClientData = async (clientCode: string) => {
  try {
    loadingData.value = true;
    
    const { data } = await ApiService.get(`/customers/${clientCode}`);
    
    if (data && data.data) {
      const customerData = data.data;
      
      // Mettre à jour les infos client pour l'affichage
      clientInfo.value = {
        lastname: customerData.lastname || '',
        firstname: customerData.firstname || '',
        phone: customerData.phone || '',
        email: customerData.email || ''
      };
      
      // Préparer les valeurs initiales avec les données du client
      const initValues = {
        // Données client pré-remplies (cachées en mode single step)
        lastname: customerData.lastname || '',
        firstname: customerData.firstname || '',
        phone: customerData.phone || '',
        phone2: customerData.phone2 || '',
        email: customerData.email || '',
        typeCustomer: customerData.typeCustomer || '1', // Particulier par défaut
        birthdate: formatDateForInput(customerData.birthdate || ''),
        placeOfBirth: customerData.placeOfBirth || '',
        address: customerData.address || '',
        profession: customerData.profession || '',
        gender: customerData.gender || '',
        maritalStatus: customerData.maritalStatus || '',
        
        // Données contrat vides pour nouveau contrat
        refCompte: '',
        contractMonth: selectedMonth.value,
        chosenOption: '',
        capital: null,
        garantieCompl: 'NON', // Fixé à NON par défaut
        creditType: 'AMORT',
        taux: '15%',
        typeCompte: '',
        ets: '',
        differe: 0
      };
      
      // Mettre à jour les valeurs initiales
      initialValues.value = initValues;
      
      if (customerData.birthdate) {
        birthDateValue.value = formatDateForInput(customerData.birthdate);
        calculatedAge.value = calculateAge(birthDateValue.value);
        const maxAge = (creditType.value === 'CP' || creditType.value === 'OBA') ? 75 : 70;
        isBirthDateValid.value = calculatedAge.value >= 18 && calculatedAge.value <= maxAge;
      }
      
    }
  } catch (err: any) {
    console.error('❌ Erreur lors du chargement du client:', err);
    error(err?.response?.data?.message || 'Erreur lors du chargement des données client');
  } finally {
    loadingData.value = false;
  }
};

  // Fonction pour mettre à jour le formulaire
  const updateFormValues = (): void => {
    if (selectedOption.value && selectedMonth.value) {
      // Forcer la mise à jour des valeurs dans VeeValidate
      if (contratForm.value) {
        (contratForm.value as any).setFieldValue('capital', calculatedValues.value.capital);
        (contratForm.value as any).setFieldValue('contractMonth', selectedMonth.value);
      }
      
      isFormDirty.value = true;
      
    }
  };

  // Fonction pour récupérer les données du contrat en mode édition
  const loadContratData = async (code: string) => {
    try {
      loadingData.value = true;
      
      const { data } = await ApiService.get(`/contrats/${code}?include=customer`);
      
      if (data && data.data) {
        const contratData = data.data;
        const customerData = contratData.customer || {};
        
        
        // Préparer les valeurs initiales
        const initValues = {
          // Données client
          lastname: customerData.lastname || '',
          firstname: customerData.firstname || '',
          phone: customerData.phone || '',
          phone2: customerData.phone2 || '',
          email: customerData.email || '',
          typeCustomer: customerData.typeCustomer || '',
          birthdate: formatDateForInput(customerData.birthdate || ''),
          placeOfBirth: customerData.placeOfBirth || '',
          address: customerData.address || '',
          profession: customerData.profession || '',
          gender: customerData.gender || '',
          maritalStatus: customerData.maritalStatus || '',
          
          // Données contrat
          refCompte: contratData.refCompte || '',
          contractMonth: contratData.contractMonth || selectedMonth.value,
          chosenOption: contratData.chosenOption || '',
          capital: contratData.capital || null,
          garantieCompl: contratData.garantieCompl || 'OUI',
          creditType: contratData.creditType || 'AMORT',
          taux: contratData.taux || '15%',
          typeCompte: contratData.typeCompte || '',
          ets: contratData.ets || '',
          differe: contratData.differe || 0
        };
        
        // Mettre à jour les valeurs initiales
        initialValues.value = initValues;
        
        // Mettre à jour les infos client pour l'affichage
        clientInfo.value = {
          lastname: customerData.lastname || '',
          firstname: customerData.firstname || '',
          phone: customerData.phone || '',
          email: customerData.email || ''
        };
        
        // Mettre à jour les états
        selectedOption.value = contratData.chosenOption || '';
        selectedMonth.value = contratData.contractMonth || new Date().getMonth() + 1;
        
        // Mettre à jour les valeurs calculées
        calculatedValues.value = {
          capital: contratData.capital || null
        };
        
        // Mettre à jour les états conditionnels
        showEtablissement.value = contratData.typeCompte === 'Compte Professionnel';
        contratCode.value = contratData.code || '';
        
        // Initialiser les drapeaux de validation
        const codeUpper = (contratData.creditType || '').toUpperCase();
        if (codeUpper === 'CP' || codeUpper === 'OBA') {
          idPeriodicite.value = contratData.idPeriodicite || '1';
          isPeriodiciteValid.value = true;
          isCapitalValid.value = true;
          isDurationValid.value = true;
        } else {
          idPeriodicite.value = contratData.idPeriodicite || '';
          isPeriodiciteValid.value = !!idPeriodicite.value;
          isCapitalValid.value = contratData.capital !== null && contratData.capital > 0;
          isDurationValid.value = contratData.duration !== null && contratData.duration > 0;
        }
        if (customerData.birthdate) {
          birthDateValue.value = formatDateForInput(customerData.birthdate);
          calculatedAge.value = calculateAge(birthDateValue.value);
          const maxAge = (codeUpper === 'CP' || codeUpper === 'OBA') ? 75 : 70;
          isBirthDateValid.value = calculatedAge.value >= 18 && calculatedAge.value <= maxAge;
        }

        if (codeUpper === 'OBA' && contratData.obaOptions) {
          try {
            obaSelectedOptions.value = typeof contratData.obaOptions === 'string'
              ? JSON.parse(contratData.obaOptions)
              : contratData.obaOptions;
          } catch (e) {
            console.error('Error parsing obaOptions', e);
          }
        }
        
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement:', err);
      error(err?.response?.data?.message || 'Erreur lors du chargement du contrat');
      router.push('/liste-contrats');
    } finally {
      loadingData.value = false;
    }
  };

  // Methods

  const previousStep = (): void => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  };

  const handleOptionChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    selectedOption.value = target.value;
    
    if (target.value) {
      const selectedCapital = parseInt(target.value);
      calculatedValues.value.capital = selectedCapital;
      
      // Mettre à jour explicitement les valeurs du formulaire
      if (contratForm.value) {
        (contratForm.value as any).setFieldValue('capital', selectedCapital);
        (contratForm.value as any).setFieldValue('contractMonth', selectedMonth.value);
      }
    } else {
      calculatedValues.value.capital = null;
      
      // Réinitialiser les valeurs du formulaire
      if (contratForm.value) {
        (contratForm.value as any).setFieldValue('capital', null);
      }
    }
    
    isFormDirty.value = true;
  };

  const handleTypeCompteChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    showEtablissement.value = target.value === 'Compte Professionnel';
    
    // Mettre à jour la valeur dans VeeValidate
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('typeCompte', target.value);
    }
    
    isFormDirty.value = true;
  };


  const onCreditTypeChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const selectedCode = target.value;
    
    if (selectedCode) {
      const selectedOption = natureCredits.value.find(nc => nc.code === selectedCode);
      if (selectedOption) {
        selectedCreditType.value = selectedOption.libelle;
        
        // Mettre à jour la valeur dans VeeValidate
        if (contratForm.value) {
          (contratForm.value as any).setFieldValue('creditType', selectedCode);
        }
        
        // PADME : fonction obsolète, on utilise onPeriodiciteChange à la place
        // Cette fonction reste pour compatibilité mais n'est plus utilisée
        
        isFormDirty.value = true;
      }
    } else {
      // Réinitialiser la validation si aucun type sélectionné
      isBirthDateValid.value = false;
      isCapitalValid.value = false;
      isDurationValid.value = false;
    }
  };

  const selectCreditType = (code: string, libelle: string): void => {
    const normalizedCode = (code || '').toUpperCase();
    creditType.value = normalizedCode;
    selectedCreditType.value = libelle;
    
    // Mettre à jour la valeur dans VeeValidate
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('creditType', normalizedCode);
      
      if (normalizedCode === 'CP') {
        selectedOption.value = '500000';
        calculatedValues.value.capital = 500000;
        (contratForm.value as any).setFieldValue('capital', 500000);
        
        // Durée fixée à 1 an (12 mois) pour PADME PROTECTION
        (contratForm.value as any).setFieldValue('duration', 12);
        (contratForm.value as any).setFieldValue('differe', 0);
        
        // Périodicité par défaut pour PADME PROTECTION
        (contratForm.value as any).setFieldValue('idPeriodicite', '1');
        idPeriodicite.value = '1';
        isPeriodiciteValid.value = true;
        
        isCapitalValid.value = true;
        isDurationValid.value = true;
        (contratForm.value as any).setFieldValue('typeCustomer', '1'); // Forcer Particulier pour CP
      } else if (normalizedCode === 'OBA') {
        selectedOption.value = '1000000';
        calculatedValues.value.capital = 1000000;
        (contratForm.value as any).setFieldValue('capital', 1000000);
        (contratForm.value as any).setFieldValue('duration', 12);
        (contratForm.value as any).setFieldValue('differe', 0);
        
        obaSelectedOptions.value.assure.checked = true;
        obaSelectedOptions.value.conjoint.checked = true;
        obaSelectedOptions.value.ascendant1.checked = false;
        obaSelectedOptions.value.ascendant2.checked = false;
        obaSelectedOptions.value.ascendant3.checked = false;
        obaSelectedOptions.value.ascendant4.checked = false;
        
        if (birthDateValue.value) {
          obaSelectedOptions.value.assure.birthdate = birthDateValue.value;
        }
        
        if (!idPeriodicite.value || idPeriodicite.value === '') {
          (contratForm.value as any).setFieldValue('idPeriodicite', '1');
          idPeriodicite.value = '1';
        }
        isPeriodiciteValid.value = idPeriodicite.value !== '';
        
        isCapitalValid.value = true;
        isDurationValid.value = true;
        (contratForm.value as any).setFieldValue('typeCustomer', '1'); // Forcer Particulier pour OBA
      } else {
        selectedOption.value = '';
        calculatedValues.value.capital = null;
        (contratForm.value as any).setFieldValue('capital', null);
        (contratForm.value as any).setFieldValue('duration', '');
        (contratForm.value as any).setFieldValue('differe', 0);
        
        isPeriodiciteValid.value = idPeriodicite.value !== '';
        isCapitalValid.value = false;
        isDurationValid.value = false;
      }
    }
    
    isFormDirty.value = true;
  };

  const handleSelectCapitalChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value);
    calculatedValues.value.capital = value;
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('capital', value);
    }
    isCapitalValid.value = true;
    isFormDirty.value = true;
  };

  const getCreditTypeLabel = (code: string): string => {
    const selected = natureCredits.value.find(nc => nc.code === code);
    return selected ? selected.libelle : code;
  };

  // Fonction pour valider la date de naissance
  const validateBirthDate = (birthDate: string): void => {
    if (birthDate && birthDate.trim() !== '') {
      isBirthDateValid.value = true;
    } else {
      isBirthDateValid.value = false;
      isCapitalValid.value = false;
      isDurationValid.value = false;
    }
  };

  // Fonction pour valider le capital
  const validateCapital = (capital: any): void => {
    const capitalValue = safeParseCapital(capital);
    if (capitalValue && capitalValue > 0) {
      isCapitalValid.value = true;
    } else {
      isCapitalValid.value = false;
      isDurationValid.value = false;
    }
  };

  // Fonction pour valider la durée
  const validateDuration = (duration: any): void => {
    const durationValue = safeParseCapital(duration);
    if (durationValue && durationValue > 0) {
      isDurationValid.value = true;
    } else {
      isDurationValid.value = false;
    }
  };

  const addContrat = async (values: any): Promise<void> => {
    // Si OBA, valider les contraintes d'âge de chaque assuré coché
    if (creditType.value === 'OBA') {
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
          error("La Mère de l'Assuré doit être plus âgé que l'Assuré.");
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
    
    // Si OBA ou CP, forcer le type de client à '1' (Particulier)
    if (creditType.value === 'OBA' || creditType.value === 'CP') {
      values.typeCustomer = '1';
    }
    
    // Validation du type de client avant traitement
    if (!values.typeCustomer) {
      throw new Error('Le type de client est obligatoire. Veuillez sélectionner "Particulier" ou "Personnel PADME".');
    }
    
    const typeCustomerValue = parseInt(values.typeCustomer);
    if (isNaN(typeCustomerValue) || (typeCustomerValue !== 1 && typeCustomerValue !== 2)) {
      throw new Error('Type de client invalide. Veuillez sélectionner "Particulier" (1) ou "Personnel PADME" (2).');
    }
    
    // Stocker la valeur de garantieCompl pour la transmission au modal (fixée à NON pour PADME)
    currentGarantieCompl.value = 'NON';
    
    try {
      isSubmitting.value = true;

      // Récupérer les données utilisateur depuis le store auth
      const authStore = useAuthStore();
      const currentUser = authStore.user;
      
      // Vérifier que les données utilisateur sont disponibles
      if (!currentUser?.id) {
        throw new Error('Utilisateur non connecté ou ID utilisateur manquant');
      }
      
      // Trouver l'ID de la nature de crédit correspondante
      const selectedNatureCredit = natureCredits.value.find(nc => nc.code === creditType.value || nc.code === (creditType.value || '').toUpperCase());
      const idNatureCredit = selectedNatureCredit?.id || 1;

      // Préparer les données PADME
      const formData: any = {
        // Champs PADME obligatoires
        capital: (creditType.value === 'OBA')
          ? obaMainCapital.value
          : parseInt(values.capital),
        birthdate: (creditType.value === 'OBA')
          ? obaMainBirthdate.value
          : values.birthdate,
        duration: (creditType.value === 'CP')
          ? (12 - new Date().getMonth())
          : (creditType.value === 'OBA')
            ? 12
            : parseInt(values.duration),
        idPeriodicite: (creditType.value === 'CP' || creditType.value === 'OBA')
          ? 1
          : parseInt(values.idPeriodicite),
        differe: (creditType.value === 'CP' || creditType.value === 'OBA')
          ? 0
          : parseInt(values.differe || 0),
        idNatureCredit: idNatureCredit, // ID de la nature de crédit
        
        // Champs additionnels
        lastname: values.lastname?.toUpperCase() || '',
        firstname: values.firstname?.toUpperCase() || '',
        typeAss: values.typeCustomer, // Type de client
        etablissement: values.etablissement || '',
        
        // Fixes pour PADME
        typeContrat: 'BE',
        idCreditType: 'A', // Amortissable par défaut
        obaOptions: creditType.value === 'OBA' ? obaSelectedOptions.value : undefined
      };

      console.log('📤 Données PADME à envoyer:', formData);
      console.log('📤 Détails validation:', {
        capital: formData.capital,
        birthdate: formData.birthdate,
        duration: formData.duration,
        idPeriodicite: formData.idPeriodicite,
        differe: formData.differe
      });

      let response;
      if (isEditMode.value && route.params.code) {
        // Mise à jour
        response = await ApiService.put(`/cotations/${route.params.code}`, formData);
        
        const message = response.data?.message || 'Cotation mise à jour avec succès!';
        if (message.includes('Erreur')) {
          error(message);
        } else {
          success(message);
        }
      } else {
        // Création - appel endpoint PADME
        response = await ApiService.post('cotations/padme', formData);
        
        console.log('📥 Réponse API PADME:', response.data);
        
        // Le ResponseTransformInterceptor encapsule dans { code, message, data, timestamp }
        const responseData = response.data.data || response.data;
        
        // Vérifier la réponse PADME
        if (responseData.error) {
          error(responseData.message || 'Erreur lors du calcul de la prime PADME');
          return;
        }
        
        // Vérifier que les données de prime sont présentes
        if (!responseData.puttc) {
          error('Erreur: Données de prime manquantes dans la réponse');
          console.error('❌ Structure de réponse invalide:', response.data);
          return;
        }
        
        // Succès
        success(`Prime calculée: ${responseData.puttc.toLocaleString()} FCFA`);
        
        // Extraire les primes
        calculatedPrimes.value = {
          pd: responseData.pd || 0,
          pc: responseData.pc || 0,
          surp: responseData.surp || 0,
          acc: responseData.acc || 0,
          fm: responseData.fm || 0,
          puttc: responseData.puttc || 0
        };
        
        showPrimesSection.value = true;
        // Désactiver le scroll de la page
        document.body.classList.add('modal-open');
      }

      // Ne plus rediriger automatiquement après succès
      // L'utilisateur peut voir les primes calculées et choisir de convertir en contrat
      isFormDirty.value = false;

    } catch (err: any) {
      console.error('❌ Erreur lors de la simulation PADME:', err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors) {
          Object.keys(errors).forEach(key => {
            error(errors[key][0]);
          });
        } else {
          error('Données invalides. Veuillez vérifier le formulaire.');
        }
      } else if (err.response?.data?.message) {
        error(err.response.data.message);
      } else {
        error('Erreur lors de la simulation. Veuillez réessayer.');
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleCancel = (): void => {
    if (isFormDirty.value) {
      const confirmLeave = confirm(
        'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir annuler ?'
      );
      
      if (confirmLeave) {
        router.push('/liste-contrats');
      }
    } else {
      router.push('/liste-contrats');
    }
  };

  // Fonction pour gérer la conversion automatique en majuscules
  const handleUppercaseInput = (event: Event, fieldName: string): void => {
    const target = event.target as HTMLInputElement;
    const uppercaseValue = target.value.toUpperCase();
    
    // Mettre à jour la valeur dans l'input
    target.value = uppercaseValue;
    
    // Mettre à jour la valeur dans VeeValidate
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue(fieldName, uppercaseValue);
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour gérer les selects
  const handleSelectChange = (event: Event, fieldName: string): void => {
    const target = event.target as HTMLSelectElement;
    
    // Pour les selects, on garde la valeur telle quelle car les options sont déjà définies
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue(fieldName, target.value);
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour gérer les changements de date de naissance
  const handleBirthdateChange = (event: Event, fieldName: string): void => {
    const target = event.target as HTMLInputElement;
    const birthdate = target.value;
    
    // Mettre à jour la valeur dans VeeValidate
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue(fieldName, birthdate);
    }
    
    // Calculer l'âge et ajuster le capital si nécessaire
    if (birthdate) {
      const age = calculateAge(birthdate);
      const limits = getCapitalLimits(age);
      
      // Récupérer la valeur actuelle du capital
      const capitalField = document.querySelector('input[name="capital"]') as HTMLInputElement;
      const currentCapital = parseInt(capitalField?.value || '0');
      
      // Ajuster le capital si nécessaire
      if (currentCapital > limits.max) {
        const adjustedCapital = limits.max;
        capitalField.value = String(adjustedCapital);
        
        if (contratForm.value) {
          (contratForm.value as any).setFieldValue('capital', adjustedCapital);
        }
        
        // Afficher l'alerte si nécessaire
        if (limits.alert) {
          showMedicalAlert.value = true;
          medicalAlertMessage.value = limits.alert;
          console.warn('⚠️', limits.alert);
        } else {
          showMedicalAlert.value = false;
          medicalAlertMessage.value = '';
        }
      }
    }
    
    isFormDirty.value = true;
  };

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (birthdate: string): number => {
    if (!birthdate || birthdate.trim() === '') return 0;
    
    try {
      const today = new Date();
      const birth = new Date(birthdate);
      
      // Vérifier que la date est valide
      if (isNaN(birth.getTime())) return 0;
      
      // Vérifier que la date de naissance n'est pas dans le futur
      if (birth > today) return 0;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      // Vérifier que l'âge est raisonnable (entre 0 et 120 ans)
      if (age < 0 || age > 120) return 0;
      
      return age;
    } catch (error) {
      console.error('Erreur lors du calcul de l\'âge:', error);
      return 0;
    }
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

  // Fonction pour obtenir les limites de capital selon l'âge
  const getCapitalLimits = (age: number): { max: number; alert?: string } => {
    if (age >= 60 && age <= 64) {
      return { 
        max: 10000000, 
        alert: "Au delà de 10 M, rapport médical et PSA à faire" 
      };
    } else if (age >= 18 && age <= 59) {
      return { max: 30000000 };
    } else {
      return { max: 0 }; // Âge non éligible
    }
  };

  // Fonction pour gérer les inputs numériques (ex: duration)
  const handleNumberInput = (event: Event, fieldName: string): void => {
    const target = event.target as HTMLInputElement;
    // Ne garder que les chiffres
    let digits = (target.value || '').replace(/[^0-9]/g, '');

    // Contraintes par champ
    if (fieldName === 'duration' && digits) {
      const maxDuration = getDurationMaxPADME();
      const num = Math.max(1, Math.min(maxDuration, parseInt(digits, 10)));
      digits = String(num);
    } else if (fieldName === 'capital' && digits) {
      // Récupérer la date de naissance pour calculer l'âge
      const birthdateField = document.querySelector('input[name="birthdate"]') as HTMLInputElement;
      const birthdate = birthdateField?.value || '';
      const age = calculateAge(birthdate);
      const limits = getCapitalLimits(age);
      
      const num = Math.max(1, Math.min(limits.max, parseInt(digits, 10)));
      digits = String(num);
      
      // Afficher l'alerte si nécessaire
      if (limits.alert && parseInt(digits) > 10000000) {
        showMedicalAlert.value = true;
        medicalAlertMessage.value = limits.alert;
        console.warn('⚠️', limits.alert);
      } else {
        showMedicalAlert.value = false;
        medicalAlertMessage.value = '';
      }
    }

    target.value = digits;

    if (contratForm.value) {
      (contratForm.value as any).setFieldValue(fieldName, digits === '' ? null : Number(digits));
    }

    isFormDirty.value = true;
  };


  // Fonction pour fermer la section des primes
  const closePrimesSection = (): void => {
    showPrimesSection.value = false;
    // Réactiver le scroll de la page
    document.body.classList.remove('modal-open');
  };

  // Fonction pour ouvrir la modal de conversion avec les données du formulaire
  const openConvertModalWithData = async (): Promise<void> => {
    
    // Récupérer les valeurs depuis les champs du formulaire principal
    const lastnameField = document.querySelector('input[name="lastname"]') as HTMLInputElement;
    const firstnameField = document.querySelector('input[name="firstname"]') as HTMLInputElement;
    const birthdateField = document.querySelector('input[name="birthdate"]') as HTMLInputElement;
    const phoneField = document.querySelector('input[name="phone"]') as HTMLInputElement;
    const emailField = document.querySelector('input[name="email"]') as HTMLInputElement;
    const addressField = document.querySelector('input[name="address"]') as HTMLInputElement;
    const placeOfBirthField = document.querySelector('input[name="placeOfBirth"]') as HTMLInputElement;
    const occupationField = document.querySelector('input[name="occupation"]') as HTMLInputElement;
    const sexeField = document.querySelector('select[name="sexe"]') as HTMLSelectElement;
    const capitalField = document.querySelector('input[name="capital"]') as HTMLInputElement;
    const durationField = document.querySelector('input[name="duration"]') as HTMLInputElement;
    const creditTypeField = document.querySelector('select[name="creditType"]') as HTMLSelectElement;
    const idPeriodiciteField = document.querySelector('select[name="idPeriodicite"]') as HTMLSelectElement;
    const differeField = document.querySelector('select[name="differe"]') as HTMLSelectElement;
    
    // Récupérer la valeur de garantieCompl depuis le formulaire principal VeeValidate
    let garantieComplValue = 'OUI'; // Valeur par défaut
    
    if (contratForm.value) {
      const formValues = (contratForm.value as any).getValues();
      if (formValues && formValues.garantieCompl) {
        garantieComplValue = formValues.garantieCompl;
      } else {
        // Fallback: essayer de récupérer depuis le DOM
        const garantieComplField = document.querySelector('input[name="garantieCompl"]:checked') as HTMLInputElement;
        garantieComplValue = garantieComplField ? garantieComplField.value : currentGarantieCompl.value;
      }
    } else {
      // Fallback: utiliser la variable stockée
      garantieComplValue = currentGarantieCompl.value;
    }
    
    // Récupérer le type de client depuis le formulaire principal VeeValidate
    let typeClientValue = '';
    
    // 1. Essayer via getValues() du formulaire VeeValidate
    if (contratForm.value) {
      const formValues = (contratForm.value as any).getValues();
      if (formValues && formValues.typeCustomer) {
        typeClientValue = formValues.typeCustomer;
      }
    }
    
    // 2. Fallback : radio bouton coché dans le DOM
    if (!typeClientValue) {
      const typeClientRadioField = document.querySelector('input[name="typeCustomer"]:checked') as HTMLInputElement;
      if (typeClientRadioField && typeClientRadioField.value) {
        typeClientValue = typeClientRadioField.value;
      }
    }
    
    // 3. Fallback : obaTypeCustomer (ref réactive toujours initialisée à '1')
    if (!typeClientValue && obaTypeCustomer.value) {
      typeClientValue = obaTypeCustomer.value;
    }
    
    // 4. Fallback : initialValues si défini
    if (!typeClientValue && initialValues.value?.typeCustomer) {
      typeClientValue = initialValues.value.typeCustomer;
    }
    
    // 5. Valeur par défaut finale : '1' = Particulier
    if (!typeClientValue) {
      typeClientValue = '1';
    }
    
    // Mapper le type de client
    const mapTypeClient = (typeClient: string): string => {
      if (typeClient === '1' || typeClient === '2') {
        return typeClient;
      }
      switch (typeClient) {
        case 'PARTICULIER':
          return '1';
        case 'PERSONNEL_BANQUE':
          return '2';
        default:
          return '1';
      }
    };

    // Préparer les données client complètes pour le modal
    const clientData = {
      lastname: lastnameField?.value || '',
      firstname: firstnameField?.value || '',
      address: addressField?.value || '',
      email: emailField?.value || '',
      phone: phoneField?.value || '',
      gender: sexeField?.value === 'M' ? 'M' : 'F',
      typeClient: mapTypeClient(typeClientValue),
      birthdate: birthdateField?.value || '',
      placeOfBirth: placeOfBirthField?.value || '',
      occupation: occupationField?.value || ''
    };

    let capitalVal = 0;
    let durationVal = 0;
    let creditTypeVal = '';
    
    if (contratForm.value) {
      const values = (contratForm.value as any).getValues();
      capitalVal = Number(values.capital) || 0;
      durationVal = Number(values.duration) || 0;
      creditTypeVal = values.creditType || creditType.value || '';
    } else {
      const capitalDOM = document.querySelector('[name="capital"]') as HTMLInputElement | HTMLSelectElement;
      capitalVal = parseInt(capitalDOM?.value || '0') || 0;
      const durationDOM = document.querySelector('input[name="duration"]') as HTMLInputElement;
      durationVal = parseInt(durationDOM?.value || '0') || 0;
      creditTypeVal = (document.querySelector('input[name="creditType"]') as HTMLInputElement)?.value || creditType.value || '';
    }

    // Configurer les données de conversion
    conversionForm.value.client.nom = clientData.lastname;
    conversionForm.value.client.prenoms = clientData.firstname;
    conversionForm.value.client.dateNaissance = clientData.birthdate;
    conversionForm.value.client.typeClient = clientData.typeClient;
    conversionForm.value.contrat.capital = capitalVal;
    conversionForm.value.contrat.duration = durationVal;
    conversionForm.value.contrat.garantieCompl = garantieComplValue;
    conversionForm.value.contrat.creditType = creditTypeVal;
    
    
    // Définir les dates par défaut
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const nextMonthString = nextMonth.toISOString().split('T')[0];
    
    conversionForm.value.contrat.dateEffet = today.toISOString().split('T')[0];
    conversionForm.value.contrat.datePremiereEcheance = nextMonthString;
    conversionForm.value.contrat.dateEch1 = nextMonthString;
    
    // Configurer les données pour le modal
    selectedClientForConversion.value = clientData;
    selectedCotationForConversion.value = {
      capital: conversionForm.value.contrat.capital,
      duration: conversionForm.value.contrat.duration,
      creditType: conversionForm.value.contrat.creditType,
      garantieCompl: conversionForm.value.contrat.garantieCompl,
      idPeriodicite: parseInt(idPeriodiciteField?.value || '1') || 1,
      differe: parseInt(differeField?.value || '0') || 0,
      obaOptions: obaSelectedOptions.value
    };
    
    // Ouvrir la modal
    showConvertModal.value = true;
  };

  // Fonction pour ouvrir la modal de conversion (sans données)
  const openConvertModal = (): void => {
    showConvertModal.value = true;
    currentStep.value = 1;
  };

  // Fonction pour gérer le succès de la conversion
  const handleConversionSuccess = (contract: any): void => {
    conversionSuccess.value = true;
    conversionMessage.value = 'Contrat créé avec succès !';
    createdContractId.value = contract?.id || null;
    
    // Le modal reste ouvert pour permettre à l'utilisateur de télécharger le PDF
    // La redirection se fera uniquement quand l'utilisateur ferme le modal
  };

  // Fonction pour fermer la modal de conversion
  const closeConvertModal = (): void => {
    showConvertModal.value = false;
    currentStep.value = 1;
    
    // Si c'était un succès, rediriger vers la liste des contrats
    if (conversionSuccess.value) {
      // Réactiver le scroll avant la redirection
      document.body.classList.remove('modal-open');
      router.push('/liste-contrats');
    }
    
    // Réinitialiser les variables de succès
    conversionSuccess.value = false;
    conversionMessage.value = '';
    createdContractId.value = null;
    
  };



  // Fonctions pour la navigation entre les étapes
  const nextStep = async (): Promise<void> => {
    if (currentStep.value < totalSteps) {
      // Valider les champs requis avant de passer à l'étape suivante
      if (!validateCurrentStep()) {
        return;
      }
      
      // Effacer l'erreur de validation si la validation réussit
      modalValidationError.value = '';
      primesCalculationFailed.value = false; // Réinitialiser l'état d'erreur des primes
      currentStep.value++;
      
      // Si on passe à l'étape 3, recalculer les primes
      if (currentStep.value === 3) {
        await recalculatePrimes();
      }
    }
  };

  // Fonction de validation des champs requis par étape
  const validateCurrentStep = (): boolean => {
    const step = currentStep.value;
    const missingFields: string[] = [];
    
    if (step === 1) {
      // Validation étape 1: Informations client
      const client = conversionForm.value.client;
      
      /* console.log('🔍 Validation étape 1 - État des champs:');
      console.log('  - nom:', client.nom, 'Valid:', !!client.nom?.trim());
      console.log('  - prenoms:', client.prenoms, 'Valid:', !!client.prenoms?.trim());
      console.log('  - dateNaissance:', client.dateNaissance, 'Valid:', !!client.dateNaissance);
      console.log('  - sexe:', client.sexe, 'Valid:', !!client.sexe);
      console.log('  - adresse:', client.adresse, 'Valid:', !!client.adresse?.trim());
      console.log('  - telephone:', client.telephone, 'Valid:', !!client.telephone?.trim());
      console.log('  - profession:', client.profession, 'Valid:', !!client.profession?.trim());
      console.log('  - lieuNaissance:', client.lieuNaissance, 'Valid:', !!client.lieuNaissance?.trim());
      console.log('  - typeClient:', client.typeClient, 'Valid:', !!client.typeClient); */
      
      if (!client.nom?.trim()) missingFields.push('Nom');
      if (!client.prenoms?.trim()) missingFields.push('Prénoms');
      if (!client.dateNaissance) missingFields.push('Date de naissance');
      if (!client.sexe) missingFields.push('Sexe');
      if (!client.adresse?.trim()) missingFields.push('Adresse');
      if (!client.telephone?.trim()) missingFields.push('Téléphone');
      if (!client.profession?.trim()) missingFields.push('Profession');
      if (!client.lieuNaissance?.trim()) missingFields.push('Lieu de naissance');
      if (!client.typeClient) missingFields.push('Type de client');
      
      if (missingFields.length > 0) {
        modalValidationError.value = `Champs manquants dans les informations client : ${missingFields.join(', ')}`;
        return false;
      }
    } else if (step === 2) {
      // Validation étape 2: Informations contrat
      const contrat = conversionForm.value.contrat;
      
      const capitalValue = safeParseCapital(contrat.capital);
      
      if (!capitalValue || capitalValue <= 0) missingFields.push('Capital');
      if (!contrat.duration || Number(contrat.duration) <= 0) missingFields.push('Durée');
      
      // Validation du taux d'intérêt
      const tauxValue = contrat.tauxInteret;
      if (!tauxValue || tauxValue === '' || isNaN(Number(tauxValue))) {
        missingFields.push('Taux d\'intérêt (obligatoire)');
      } else {
        const taux = Number(tauxValue);
        if (taux < 0 || taux > 100) {
          missingFields.push('Taux d\'intérêt (doit être entre 0 et 100%)');
        }
      }
      
      // Validation de la garantie perte d'emploi
      if (!contrat.garantieCompl || (contrat.garantieCompl !== 'OUI' && contrat.garantieCompl !== 'NON')) {
        missingFields.push('Garantie Perte d\'Emploi (obligatoire)');
      }
      if (!contrat.creditType) missingFields.push('Type de Nature de crédit');
      if (!contrat.dateEffet) missingFields.push('Date d\'effet');
      if (!contrat.datePremiereEcheance) missingFields.push('Date 1re échéance');
      
      // Validation pour les types de crédit AMORT et HC
      if (capitalValue && capitalValue > 25000000) {
        missingFields.push('Capital (maximum 25 000 000 FCFA)');
      }
      if (contrat.duration && Number(contrat.duration) > 120) {
        missingFields.push('Durée (maximum 120 mois)');
      }
      
      if (missingFields.length > 0) {
        modalValidationError.value = `Erreurs de validation dans les informations contrat : ${missingFields.join(', ')}`;
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

  // Fonction de validation en temps réel pour le taux d'intérêt
  const validateTauxInteret = (): void => {
    const tauxValue = conversionForm.value.contrat.tauxInteret;
    
    // Si la valeur est vide, ne rien faire
    if (tauxValue === '' || tauxValue === null || tauxValue === undefined) {
      return;
    }
    
    const taux = Number(tauxValue);
    
    // Si ce n'est pas un nombre valide, réinitialiser
    if (isNaN(taux)) {
      conversionForm.value.contrat.tauxInteret = '';
      return;
    }
    
    // Appliquer les limites
    if (taux < 0) {
      conversionForm.value.contrat.tauxInteret = '0';
    } else if (taux > 100) {
      conversionForm.value.contrat.tauxInteret = '100';
    }
  };

  // Fonction pour mettre à jour la date de première échéance quand la date d'effet change
  const updateDatePremiereEcheance = (): void => {
    if (conversionForm.value.contrat.dateEffet) {
      if (!datePremiereEcheanceManuallyEdited.value) {
        const dateEffet = new Date(conversionForm.value.contrat.dateEffet);
        const datePremiereEcheance = new Date(dateEffet);
        datePremiereEcheance.setMonth(dateEffet.getMonth() + 1);
        
        const dateString = datePremiereEcheance.toISOString().split('T')[0];
        conversionForm.value.contrat.datePremiereEcheance = dateString;
        conversionForm.value.contrat.dateEch1 = dateString;
      }
    }
  };

  // Fonction pour gérer la conversion automatique en majuscules dans le modal
  const handleModalUppercaseInput = (event: Event, fieldPath: string): void => {
    const target = event.target as HTMLInputElement;
    const uppercaseValue = target.value.toUpperCase();
    
    // Mettre à jour la valeur dans l'input
    target.value = uppercaseValue;
    
    // Mettre à jour la valeur dans l'objet conversionForm
    const pathParts = fieldPath.split('.');
    if (pathParts.length === 2) {
      const [section, field] = pathParts;
      if (section === 'client' && field in conversionForm.value.client) {
        (conversionForm.value.client as any)[field] = uppercaseValue;
      } else if (section === 'contrat' && field in conversionForm.value.contrat) {
        (conversionForm.value.contrat as any)[field] = uppercaseValue;
      }
    }
  };


  // Fonction pour préparer les données client (sans création directe)
  const prepareCustomerData = (clientData: any): any => {
    
    // Validation explicite du type de client
    if (!clientData.typeClient) {
      throw new Error('Le type de client est obligatoire. Veuillez sélectionner "Particulier" ou "Personnel PADME".');
    }
    
    const typeClientValue = parseInt(clientData.typeClient);
    if (isNaN(typeClientValue) || (typeClientValue !== 1 && typeClientValue !== 2)) {
      throw new Error('Type de client invalide. Veuillez sélectionner "Particulier" (1) ou "Personnel PADME" (2).');
    }
    
    return {
      lastname: clientData.nom.toUpperCase(),
      firstname: clientData.prenoms.toUpperCase(),
      email: clientData.email || null,
      address: clientData.adresse.toUpperCase(),
      phone: clientData.telephone,
      placeOfBirth: clientData.lieuNaissance.toUpperCase(),
      birthdate: clientData.dateNaissance,
      occupation: clientData.profession.toUpperCase(),
      gender: clientData.sexe,
      idTypeCustomer: typeClientValue, // Utiliser la valeur du formulaire (obligatoire)
      isActive: true
    };
  };

  // Fonction pour créer un contrat
  const createContract = async (contractData: any): Promise<any> => {
    try {

      const response = await ApiService.post('/contracts', contractData);
      
      // Retourner la réponse complète pour gérer success/error
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du contrat:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Headers:', error.response?.headers);
      
      // Retourner la structure d'erreur au lieu de lancer une exception
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la création du contrat'
      };
    }
  };

  // Fonction de soumission du formulaire de conversion
  const handleConversionSubmit = async (values: any): Promise<void> => {
    try {
      
      // Récupérer l'ID de la nature de crédit sélectionnée
      const selectedNatureCredit = natureCredits.value.find(nc => nc.code === values.contrat.creditType);
      const idNatureCredit = selectedNatureCredit?.id;
      
      if (!idNatureCredit) {
        throw new Error('Nature de crédit non trouvée');
      }
      
      
      // Préparer les données client pour le backend
      const clientData = prepareCustomerData(values.client);
      
      // Créer le contrat avec les données client (le backend gère la création/recherche)
      const contractData: any = {
        clientData: clientData,
        capital: safeParseCapital(values.contrat.capital) || 0,
        duration: Number(values.contrat.duration),
        dateEff: values.contrat.dateEffet,
        dateEch1: values.contrat.datePremiereEcheance || values.contrat.dateEch1,
        dateEch: values.contrat.dateEcheance || values.contrat.dateEch,
        idNatureCredit: idNatureCredit, // Ajouter l'ID de la nature de crédit
        taux: Number(values.contrat.tauxInteret), // Mapper tauxInteret vers taux
        commission: 0, // Commission par défaut
        description: `Cotation convertie en contrat`,
        isActive: true,
        etablissement: values.contrat.etablissement,
        reference: values.contrat.refrence, // refrence du formulaire -> reference pour l'API
        // OBA : inclure les membres assurés secondaires
        obaOptions: values.contrat.creditType === 'OBA' ? obaSelectedOptions.value : undefined,
      };
      
      const response = await createContract(contractData);
      
      // Vérifier si la réponse indique un succès
      const isSuccess = response.success === true || 
                       response.success === undefined || 
                       (response.message && response.message.includes('créé avec succès'));
      
      if (isSuccess) {
        // Récupérer l'ID du contrat créé pour le téléchargement
        const contractId = response.data?.contract?.id || response.contract?.id;
        
        if (contractId) {
          // Stocker l'ID du contrat pour le téléchargement
          createdContractId.value = contractId;
        } else {
          console.warn('⚠️ ID du contrat non trouvé dans la réponse:', response);
        }
        
        // Afficher le message de succès dans le modal
        conversionSuccess.value = true;
        conversionMessage.value = response.message || 'Contrat créé avec succès !';
        
        // Ne pas fermer automatiquement le modal - l'utilisateur doit le fermer manuellement
      } else {
        // Fermer le modal temporairement pour afficher l'erreur
        showConvertModal.value = false;
        const errMsg = response.message || response.data?.message || 'Erreur lors de la création du contrat';
        setTimeout(() => {
          error(errMsg);
          // Rouvrir le modal après 8 secondes si nécessaire
          setTimeout(() => {
            showConvertModal.value = true;
          }, 8000);
        }, 100);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors de la création du contrat:', err);
      console.error('❌ Détails de l\'erreur:', err.response?.data || err.message);
      let errMsg = err.response?.data?.message || err.response?.data?.data?.message || err.message || 'Erreur lors de la création du contrat';
      if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
      error(errMsg);
    }
  };

  // Fonction pour télécharger le PDF d'un contrat
  const downloadContractPDF = async (contractId: number): Promise<void> => {
    if (isDownloadingPDF.value) {
      return;
    }

    try {
      isDownloadingPDF.value = true;
      
      // Utiliser l'ID du contrat dans l'URL avec axios directement
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
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat_${contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success(`PDF du contrat ${contractId} téléchargé avec succès`);

    } catch (err: any) {
      console.error('❌ Erreur lors du téléchargement PDF:', err);
      error(`Erreur lors du téléchargement du PDF: ${err.message || 'Erreur inconnue'}`);
    } finally {
      isDownloadingPDF.value = false;
    }
  };

  // Fonction pour recalculer les primes à l'étape 3
  const recalculatePrimes = async (): Promise<void> => {
    // Déterminer l'idCreditType selon le type de crédit
    const idCreditType = conversionForm.value.contrat.creditType === 'TONTINE' ? '2' : '1';
    
    try {
      
      // Validation du type de client avant le recalcul
      if (!conversionForm.value.client.typeClient) {
        throw new Error('Le type de client est obligatoire pour le recalcul des primes. Veuillez sélectionner "Particulier" ou "Personnel PADME".');
      }
      
      const typeClientValue = parseInt(conversionForm.value.client.typeClient);
      if (isNaN(typeClientValue) || (typeClientValue !== 1 && typeClientValue !== 2)) {
        throw new Error('Type de client invalide pour le recalcul. Veuillez sélectionner "Particulier" (1) ou "Personnel PADME" (2).');
      }
      
      // Récupérer l'ID de la nature de crédit pour le recalcul
      const selectedNatureCredit = natureCredits.value.find(nc => nc.code === conversionForm.value.contrat.creditType);
      const idNatureCredit = selectedNatureCredit?.id;
      
      if (!idNatureCredit) {
        console.warn('⚠️ ID Nature de crédit non trouvé pour le recalcul, utilisation de la valeur par défaut');
      }
      
      // Préparer les données pour le recalcul
      const recalculationData = {
        idUser: 1, // À récupérer depuis le contexte utilisateur
        idAgency: 1, // À récupérer depuis le contexte
        idCreditType: idCreditType, // Type de crédit : 2 pour Tontine, 1 pour Amortissable
        idNatureCredit: idNatureCredit, // ID de la nature de crédit sélectionnée
        typeAss: conversionForm.value.client.typeClient, // Type d'assurance depuis le formulaire (obligatoire)
        capital: conversionForm.value.contrat.capital,
        duration: conversionForm.value.contrat.duration,
        lastname: conversionForm.value.client.nom,
        firstname: conversionForm.value.client.prenoms,
        birthdate: conversionForm.value.client.dateNaissance
      };

      // Appel API pour recalculer les primes avec le bon idCreditType
      const response = await ApiService.post('/cotations', recalculationData);

      if (response.data && response.data.data && response.data.data.cotation) {
        const cotation = response.data.data.cotation;
        
        // Mettre à jour les primes recalculées
        conversionForm.value.primes = {
          pd: cotation.pd || 0,
          pc: cotation.pc || 0,
          surp: cotation.surp || 0,
          acc: cotation.acc || 0,
          fm: cotation.fm || 0,
          puttc: cotation.puttc || 0
        };

        primesCalculationFailed.value = false; // Marquer le succès du recalcul
      } else {
        console.error('❌ Structure de réponse inattendue:', response.data);
        modalValidationError.value = response.data.message;
        primesCalculationFailed.value = true; // Marquer l'échec du recalcul
      }
    } catch (error) {
      console.error('❌ Erreur lors du recalcul des primes:', error);
      console.error(`❌ Type de crédit concerné: ${conversionForm.value.contrat.creditType} (idCreditType: ${idCreditType})`);
      
      // En cas d'erreur, utiliser les primes existantes
      conversionForm.value.primes = {
        pd: calculatedPrimes.value.pd,
        pc: calculatedPrimes.value.pc,
        surp: calculatedPrimes.value.surp,
        acc: calculatedPrimes.value.acc,
        fm: calculatedPrimes.value.fm,
        puttc: calculatedPrimes.value.puttc
      };
      
      // Afficher un message d'erreur spécifique
      modalValidationError.value = `Erreur lors du recalcul des primes pour ${conversionForm.value.contrat.creditType === 'TONTINE' ? 'Tontine Solidarité' : 'Crédit Amortissable'}. Les primes existantes sont utilisées.`;
      primesCalculationFailed.value = true; // Marquer l'échec du recalcul
    }
  };

  // Fonction pour convertir en contrat (dans la modal)
  const convertToContract = async (): Promise<void> => {
    // Protection contre les doubles clics
    if (isConverting.value) {
      return;
    }
    
    try {
      isConverting.value = true;
      
      // Valider le formulaire VeeValidate avant soumission
      // TODO: Temporairement désactivé pour tester la création de contrat
      // if (conversionFormRef.value) {
      //   const { valid } = await (conversionFormRef.value as any).validate();
      //   if (!valid) {
      //     error('Veuillez corriger les erreurs du formulaire');
      //     return;
      //   }
      // }
      
      // Appeler la fonction de soumission qui utilise la vraie route de création
      await handleConversionSubmit(conversionForm.value);
      
    } catch (err: any) {
      console.error('❌ Erreur lors de la conversion:', err);
      error('Erreur lors de la conversion en contrat. Veuillez réessayer.');
    } finally {
      isConverting.value = false;
    }
  };

  // Protection contre la navigation non sauvegardée
  const beforeWindowUnload = (e: BeforeUnloadEvent): void => {
    if (isFormDirty.value) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  // Watcher pour détecter les changements de route
  watch(() => route.params.code, (newCode) => {
    if (newCode) {
      loadContratData(newCode as string);
    }
  }, { immediate: true });

  // Watcher pour mettre à jour le formulaire quand l'option change
  watch([selectedOption], () => {
    if (selectedOption.value && selectedMonth.value) {
      updateFormValues();
    }
  });


  // Ajoutez aussi ce watcher pour détecter les changements de query
watch(() => route.query.clientCode, (newClientCode) => {
  if (newClientCode && !route.params.code) {
    loadClientData(newClientCode as string);
  }
}, { immediate: true });

  // Watcher pour synchroniser formValues avec les valeurs du formulaire
  watch(() => formValues.value, (newValues) => {
  }, { deep: true });

  // Watcher pour synchroniser creditType avec les valeurs initiales
  watch(() => initialValues.value, (newValues) => {
    if (newValues.creditType) {
      creditType.value = newValues.creditType;
    }
  }, { deep: true });

  // Watcher pour gérer la garantie perte d'emploi selon le type de crédit dans la modal
  watch(() => conversionForm.value.contrat.creditType, (newCreditType) => {
    if (newCreditType === 'TONTINE') {
      // Pour la tontine, forcer la garantie à "NON" et la durée à 12 mois
      conversionForm.value.contrat.garantieCompl = 'NON';
      conversionForm.value.contrat.duration = 12;
      conversionForm.value.contrat.duree = 12;
    }
  });

  // Watcher pour forcer la mise à jour du formulaire quand garantieCompl change
  watch(() => conversionForm.value.contrat.garantieCompl, (newValue) => {
    // Forcer la mise à jour du DOM
    nextTick(() => {
      const garantieField = document.querySelector(`input[name="garantieCompl"][value="${newValue}"]`) as HTMLInputElement;
      if (garantieField) {
        garantieField.checked = true;
        
        // Déclencher l'événement change pour VeeValidate
        garantieField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // Gestionnaire pour fermer le dropdown en cliquant à l'extérieur
  const handleClickOutside = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-multiselect')) {
    }
  };


  // Lifecycle hooks
  onMounted(async () => {
    window.addEventListener('beforeunload', beforeWindowUnload);
    document.addEventListener('click', handleClickOutside);
    
    // Charger les périodicités depuis la base de données
    await loadPeriodicites();

    // Charger les natures de crédit depuis la base de données
    await loadNatureCredits();
    
    // Initialiser l'étape selon le mode
    if (isSingleStepMode.value) {
      currentStep.value = 2; // Directement à l'étape contrat
    }
    
    // Initialiser les valeurs par défaut pour PADME
    if (contratForm.value) {
      (contratForm.value as any).setFieldValue('contractMonth', selectedMonth.value);
      (contratForm.value as any).setFieldValue('differe', 0);
      (contratForm.value as any).setFieldValue('garantieCompl', 'NON');
      (contratForm.value as any).setFieldValue('typeCustomer', '1'); // Particulier par défaut
    }
    
    // S'assurer que initialValues contient typeCustomer
    if (!initialValues.value.typeCustomer) {
      initialValues.value.typeCustomer = '1';
    }
    
    // Vérifier s'il y a un code de contrat (mode édition)
    if (route.params.code) {
      await loadContratData(route.params.code as string);
    }
    // Sinon, vérifier s'il y a un code client (nouveau contrat pour client existant)
    else if (route.query.clientCode) {
      await loadClientData(route.query.clientCode as string);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeWindowUnload);
    document.removeEventListener('click', handleClickOutside);
  });

      return {
      // Refs
      contratForm,
      isSubmitting,
      isFormDirty,
      loadingData,
      showEtablissement,
      calculatedValues,
      contratCode,
      initialValues,
      selectedOption,
      selectedMonth,
      creditType,
      idPeriodicite,
      isTontineMode,
      natureCredits,
      loadingNatureCredits,
      selectedCreditType,
      periodicites,
      loadingPeriodicites,
      isHommeCleMode,
      isAmortMode,
      obaTypeCustomer,
      isObaOptionAgeValid,
      isObaAgesValid,
      isCPMode,
      isOBAMode,
      selectCreditType,
      handleSelectCapitalChange,
      isPeriodiciteValid,
      isBirthDateValid,
      isCapitalValid,
      isDurationValid,
      calculatedAge,
      birthDateValue,
      maxBirthdate,
      showPrimesSection,
      isConverting,
      calculatedPrimes,
      showConvertModal,
      
      // Variables pour les alertes
      showMedicalAlert,
      medicalAlertMessage,
      
      // Computed
      isEditMode,
      isClientExistingMode,
      isSingleStepMode,
      garantieComplValue,
      canProceedToNextStep,
      clientInfo,
      contratSchema,
      
      // Methods
      previousStep,
      handleOptionChange,
      handleTypeCompteChange,
      onCreditTypeChange,
      onPeriodiciteChange,
      validateBirthDate,
      validateCapital,
      validateDuration,
      handleDurationInput,
      handleCapitalInput,
      handleBirthDateInput,
      getCreditTypeLabel,
      getDurationMaxPADME,
      loadNatureCredits,
      addContrat,
      handleCancel,
      loadContratData,
      updateFormValues,
      formatCurrency,
      loadClientData,
      handleUppercaseInput,
      handleSelectChange,
      handleNumberInput,
      handleBirthdateChange,
      calculateAge,
      getCapitalLimits,
      getDurationPlaceholder,
      convertToContract,
      closePrimesSection,
      loadPeriodicites,
      openConvertModal,
      openConvertModalWithData,
      closeConvertModal,
      handleConversionSuccess,
      selectedClientForConversion,
      selectedCotationForConversion,
      // Variables pour le formulaire multi-étapes
      currentStep,
      totalSteps,
      conversionForm,
      nextStep,
      prevStep,
      recalculatePrimes,
      validateCurrentStep,
      modalValidationError,
      primesCalculationFailed,
      canCreateContract,
      currentGarantieCompl,
      validateTauxInteret,
      updateDatePremiereEcheance,
      handleModalUppercaseInput,
      conversionSchema,
      conversionFormRef,
      handleConversionSubmit,
      createContract,
      downloadContractPDF,
      conversionSuccess,
      conversionMessage,
      createdContractId,
      isDownloadingPDF,
      obaSelectedOptions,
      obaMainCapital,
      obaMainBirthdate
    };
  }
});
</script>

<style scoped>
.step-indicator {
display: flex;
justify-content: center;
align-items: center;
margin: 30px 0;
padding: 0 20px;
}

.step-item {
display: flex;
flex-direction: column;
align-items: center;
text-align: center;
flex: 1;
max-width: 200px;
}

.step-circle {
width: 50px;
height: 50px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-weight: bold;
font-size: 18px;
margin-bottom: 10px;
transition: all 0.3s ease;
border: 3px solid;
}

.step-circle.active {
background-color: #33b04a;
color: #231f20;
border-color: #33b04a;
box-shadow: 0 0 0 3px rgba(51, 176, 74, 0.25);
}

.step-circle.inactive {
background-color: #f8f9fa;
color: #6c757d;
border-color: #dee2e6;
}

.step-connector {
height: 3px;
background-color: #dee2e6;
flex: 1;
margin: 0 20px;
margin-bottom: 30px;
transition: background-color 0.3s ease;
}

.step-connector.active {
background-color: #33b04a;
}

.step-label {
font-size: 14px;
font-weight: 500;
color: #495057;
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

/* Client summary styling */
.client-summary .card {
  border: 2px solid rgba(51, 176, 74, 0.2);
  transition: all 0.3s ease;
}

.client-summary .card:hover {
  border-color: rgba(51, 176, 74, 0.4);
  box-shadow: 0 2px 8px rgba(51, 176, 74, 0.1);
}

.client-summary h5 {
  color: #231f20;
  font-weight: 600;
}

.client-summary .text-primary {
  color: #33b04a !important;
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

.btn-success:focus {
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.5) !important;
}

.btn-success:disabled {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  opacity: 0.6;
}

.btn-secondary {
  background-color: #231f20 !important;
  border-color: #231f20 !important;
  color: #ede947 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #1a1718 !important;
  border-color: #1a1718 !important;
  color: #ede947 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(35, 31, 32, 0.3);
}

.btn-secondary:focus {
  box-shadow: 0 0 0 0.2rem rgba(35, 31, 32, 0.5) !important;
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

.btn-primary:focus {
  box-shadow: 0 0 0 0.2rem rgba(237, 233, 71, 0.5) !important;
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

.btn-outline-primary:focus {
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.5) !important;
}

/* Custom badges */
.badge.bg-primary {
  background-color: #ede947 !important;
  color: #231f20 !important;
}

/* Form controls focus state */
.form-control:focus {
  border-color: #33b04a !important;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25) !important;
}

.form-select:focus {
  border-color: #33b04a !important;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25) !important;
}

/* Text colors */
.text-success {
  color: #33b04a !important;
}

.text-muted {
  color: rgba(35, 31, 32, 0.6) !important;
}

/* Modal title styling */
.modal-title {
  color: #231f20;
  font-weight: 600;
}

.modal-title .fas {
  color: #33b04a;
}

/* HR styling */
hr {
  border-color: rgba(51, 176, 74, 0.2);
  border-width: 2px;
}

/* Spinner customization */
.spinner-border {
  color: #33b04a !important;
}

.spinner-border.text-primary {
  color: #33b04a !important;
}

/* Form labels */
.fw-semibold {
  color: #231f20;
  font-weight: 600 !important;
}

/* Card styling */
.card {
  border: 1px solid rgba(51, 176, 74, 0.1);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(51, 176, 74, 0.1);
}

.card-header {
  background-color: #231f20;
  border-bottom: 2px solid #33b04a;
  color: #ede947;
}

.card-header h6 {
  color: #ede947;
  font-weight: 600;
}

.card-header .fas {
  color: #ede947;
}

/* Table styling */
.table-responsive {
max-height: 300px;
overflow-y: auto;
border: 1px solid rgba(51, 176, 74, 0.2);
border-radius: 0.375rem;
}

.table th, .table td {
text-align: center;
vertical-align: middle;
font-size: 0.875rem;
}

.table th {
  background-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 600;
  border-color: #33b04a;
}

.table-primary {
background-color: rgba(237, 233, 71, 0.2) !important;
color: #231f20 !important;
font-weight: 600;
}

.table-light {
  background-color: #f8f9fa !important;
}

/* Step label active state */
.step-item:has(.step-circle.active) .step-label {
  color: #33b04a;
  font-weight: 600;
}

/* Button transitions */
.btn {
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

/* Validation error styling */
.text-danger {
  color: #dc3545 !important;
}

/* Alert info styling */
.alert-info {
  background-color: rgba(51, 176, 74, 0.1) !important;
  border-color: rgba(51, 176, 74, 0.2) !important;
  color: #231f20 !important;
  border-left: 4px solid #33b04a !important;
}

.alert-info .fas {
  color: #33b04a !important;
}

/* Readonly field styling */
.form-control[readonly] {
  background-color: #f8f9fa !important;
  border-color: #dee2e6 !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
}

/* Disabled radio button styling */
input[type="radio"]:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

input[type="radio"]:disabled + span {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

/* Dropdown Multiselect styling */
.dropdown-multiselect {
  position: relative;
  width: 100%;
}

.dropdown-toggle {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background-color: #fff;
  transition: all 0.3s ease;
  min-height: 48px;
}

.dropdown-toggle:hover {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.dropdown-toggle.active {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.dropdown-toggle.disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.dropdown-toggle i {
  transition: transform 0.3s ease;
  color: #6c757d;
}

.dropdown-toggle i.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #fff;
  border: 2px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  margin-top: -1px;
}

.dropdown-item {
  padding: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f1f3f4;
}

.checkbox-item:last-child {
  border-bottom: none;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
  width: 18px;
  height: 18px;
  accent-color: #33b04a;
  cursor: pointer;
}

.checkbox-item span {
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  user-select: none;
}

.checkbox-item:hover {
  background-color: rgba(51, 176, 74, 0.1);
}

.checkbox-item:hover span {
  color: #33b04a;
  font-weight: 500;
}

/* Small text styling */
small.text-muted {
  color: rgba(35, 31, 32, 0.7) !important;
}

/* Styles pour la section des primes */
.primes-section {
  background: linear-gradient(135deg, rgba(51, 176, 74, 0.05) 0%, rgba(237, 233, 71, 0.05) 100%);
  border-radius: 15px;
  padding: 30px;
  border: 2px solid rgba(51, 176, 74, 0.1);
  box-shadow: 0 8px 25px rgba(51, 176, 74, 0.1);
  animation: slideInUp 0.6s ease-out;
}

/* Priorité visuelle pour la section des primes */
.primes-priority {
  position: relative;
  z-index: 10;
  margin-top: 2rem !important;
  margin-bottom: 2rem !important;
  transform: translateY(-20px);
  box-shadow: 0 15px 35px rgba(51, 176, 74, 0.2) !important;
  border: 3px solid rgba(51, 176, 74, 0.3) !important;
}

/* PRIORITÉ ABSOLUE - Sort complètement du flux */
.primes-priority-absolute {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 9999 !important;
  width: 95% !important;
  max-width: 1000px !important;
  max-height: 90vh !important;
  overflow: hidden !important;
  background: linear-gradient(135deg, rgba(51, 176, 74, 0.95) 0%, rgba(237, 233, 71, 0.95) 100%) !important;
  backdrop-filter: blur(10px) !important;
  border: 4px solid #33b04a !important;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3) !important;
  border-radius: 20px !important;
  padding: 20px !important;
  margin: 0 !important;
  animation: primeAbsoluteAppear 1s ease-out !important;
}

/* Contenu scrollable à l'intérieur de la modal */
.primes-priority-absolute .row {
  max-height: calc(85vh - 120px) !important;
  overflow-y: auto !important;
  padding-right: 10px !important;
}

/* Masquer les scrollbars mais garder la fonctionnalité */
.primes-priority-absolute .row::-webkit-scrollbar {
  width: 6px !important;
}

.primes-priority-absolute .row::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 3px !important;
}

.primes-priority-absolute .row::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3) !important;
  border-radius: 3px !important;
}

.primes-priority-absolute .row::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5) !important;
}

/* Overlay sombre derrière les primes */
.primes-priority-absolute::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
  animation: overlayFadeIn 0.5s ease-out;
}

/* Empêcher le scroll de la page quand la modal est ouverte */
body.modal-open {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
}

/* Styles pour la modal de conversion */
.conversion-modal-content .alert {
  border-left: 4px solid #33b04a;
  background-color: rgba(51, 176, 74, 0.1);
  border-color: rgba(51, 176, 74, 0.2);
}

.conversion-modal-content .alert i {
  color: #33b04a;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #33b04a;
  margin-bottom: 8px;
}

.summary-item .label {
  font-weight: 600;
  color: #495057;
}

.summary-item .value {
  font-weight: 700;
  color: #33b04a;
  font-size: 1.1rem;
}

.summary-item .value.highlight {
  color: #2d9a41;
  font-size: 1.3rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Styles pour formulaire multi-étapes dans la modal */
.conversion-modal-content .form-step {
  min-height: 400px;
  padding: 20px 0;
}



.conversion-modal-content .form-group {
  margin-bottom: 25px;
}

.conversion-modal-content .form-control {
  font-size: 16px;
  padding: 12px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.conversion-modal-content .form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.conversion-modal-content .form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 14px;
}

/* Styles pour le récapitulatif */
.conversion-modal-content .card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.conversion-modal-content .card-header {
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
}

.conversion-modal-content .card-header.bg-success {
  background-color: #28a745 !important;
  border-color: #28a745;
}

.conversion-modal-content .card-body p {
  margin-bottom: 8px;
  font-size: 14px;
}

.conversion-modal-content .card-body strong {
  color: #495057;
  font-weight: 600;
}

/* Espacement optimisé pour la modal xlarge */
.modal-xlarge .modal-body {
  padding: 30px;
  max-height: calc(90vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 0;
  padding-bottom: 20px;
}

/* Assurer que les boutons du footer restent visibles */
.modal-xlarge .modal-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #dee2e6;
  padding: 15px 30px;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 0;
}

.modal-xlarge .conversion-modal-content {
  min-height: 400px;
  max-height: calc(90vh - 220px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 10px;
}

/* S'assurer que le contenu ne déborde pas sur les boutons */
.conversion-modal-content .form-step {
  margin-bottom: 20px;
}

.conversion-modal-content .card {
  margin-bottom: 15px;
}

.conversion-modal-content .alert {
  margin-bottom: 15px;
}

/* Éviter le débordement horizontal */
.conversion-modal-content .row {
  margin-left: 0;
  margin-right: 0;
}

.conversion-modal-content .col-md-6,
.conversion-modal-content .col-md-4,
.conversion-modal-content .col-md-3 {
  padding-left: 8px;
  padding-right: 8px;
}

.conversion-modal-content .card-body {
  padding: 15px;
}

.conversion-modal-content .summary-item {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Styles pour la validation des champs requis */
.conversion-modal-content .form-control.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.conversion-modal-content .form-label .text-danger {
  font-weight: bold;
}

.conversion-modal-content .required {
  position: relative;
}

.conversion-modal-content .required::after {
  content: '*';
  color: #dc3545;
  font-weight: bold;
  margin-left: 4px;
}

/* Style personnalisé pour l'alerte de validation */
.conversion-modal-content .alert-danger {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #dc3545;
  color: #721c24;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
}

.conversion-modal-content .alert-danger .fas {
  color: #dc3545;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes primeAbsoluteAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  50% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  }
}

/* Effet de repoussement du formulaire quand les primes apparaissent */
.primes-priority ~ .card {
  transform: translateY(-30px);
  transition: transform 0.6s ease-out;
  opacity: 0.7;
}

/* Animation de retour du formulaire */
.primes-priority ~ .card {
  animation: formPushUp 0.8s ease-out;
}

@keyframes formPushUp {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-30px);
    opacity: 0.7;
  }
}

/* Animation d'apparition avec effet de priorité */
.primes-priority {
  animation: primePriorityAppear 0.8s ease-out;
}

@keyframes primePriorityAppear {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
    box-shadow: 0 5px 15px rgba(51, 176, 74, 0.1);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(51, 176, 74, 0.25);
  }
  100% {
    opacity: 1;
    transform: translateY(-20px) scale(1);
    box-shadow: 0 15px 35px rgba(51, 176, 74, 0.2);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.primes-section h4 {
  color: #231f20;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Titre mis en évidence pour la priorité */
.primes-priority h4 {
  color: #33b04a !important;
  font-size: 1.8rem;
  text-shadow: 0 3px 6px rgba(51, 176, 74, 0.3);
  animation: titleGlow 2s ease-in-out infinite alternate;
}

/* Styles pour la modal des primes */
.primes-priority-absolute h4 {
  color: #ffffff !important;
  font-size: 2rem;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  animation: titleGlowModal 2s ease-in-out infinite alternate;
}

/* Bouton de fermeture - Desktop */
.primes-priority-absolute .close-modal-btn {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border: 2px solid #ffffff !important;
  color: #ffffff !important;
  width: 45px !important;
  height: 45px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1.3rem !important;
  font-weight: bold !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
}

.primes-priority-absolute .close-modal-btn:hover {
  background-color: rgba(255, 255, 255, 0.25) !important;
  transform: scale(1.1) !important;
  color: #ffffff !important;
}

.primes-priority-absolute .close-modal-btn .close-symbol {
  color: #ffffff !important;
  font-size: 1.3rem !important;
  font-weight: bold !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
  display: block !important;
  line-height: 1 !important;
  font-family: Arial, sans-serif !important;
}

.primes-priority-absolute .close-modal-btn:hover .close-symbol {
  color: #ffffff !important;
  transform: scale(1.2) !important;
}

@keyframes titleGlowModal {
  0% {
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }
  100% {
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.2);
  }
}

/* Widgets dans la modal */
.primes-priority-absolute .prime-widget {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
}

.primes-priority-absolute .prime-widget-highlight {
  background: linear-gradient(135deg, #33b04a 0%, #2d9a41 100%) !important;
  color: #ffffff !important;
  border: 3px solid #ede947 !important;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3) !important;
}

.primes-priority-absolute .prime-widget-highlight .prime-icon {
  color: #ede947 !important;
}

.primes-priority-absolute .prime-widget-highlight .prime-title {
  color: #ffffff !important;
}

.primes-priority-absolute .prime-widget-highlight .prime-value {
  color: #ffffff !important;
}

.primes-priority-absolute .prime-widget-highlight .prime-label {
  color: #ede947 !important;
  background: rgba(237, 233, 71, 0.3) !important;
}

@keyframes titleGlow {
  0% {
    text-shadow: 0 3px 6px rgba(51, 176, 74, 0.3);
  }
  100% {
    text-shadow: 0 3px 6px rgba(51, 176, 74, 0.6), 0 0 20px rgba(51, 176, 74, 0.2);
  }
}

.primes-section hr {
  border-color: #33b04a;
  border-width: 3px;
  border-radius: 2px;
  margin: 20px 0;
}

/* Styles pour les widgets de primes */
.prime-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(51, 176, 74, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.prime-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #33b04a, #ede947);
  border-radius: 12px 12px 0 0;
}

.prime-widget:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(51, 176, 74, 0.2);
  border-color: #33b04a;
}

.prime-widget-highlight {
  background: linear-gradient(135deg, #33b04a 0%, #2d9a41 100%);
  color: #ffffff;
  border-color: #33b04a;
  box-shadow: 0 6px 20px rgba(51, 176, 74, 0.3);
}

.prime-widget-highlight::before {
  background: linear-gradient(90deg, #ede947, #33b04a);
}

.prime-widget-highlight:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(51, 176, 74, 0.4);
}

.prime-icon {
  font-size: 2.5rem;
  color: #33b04a;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.prime-widget-highlight .prime-icon {
  color: #ede947;
}

.prime-widget:hover .prime-icon {
  transform: scale(1.1);
  color: #2d9a41;
}

.prime-widget-highlight:hover .prime-icon {
  color: #ffffff;
}

.prime-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.prime-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #231f20;
  margin-bottom: 10px;
  line-height: 1.2;
}

.prime-widget-highlight .prime-title {
  color: #ffffff;
}

.prime-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #33b04a;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.prime-widget-highlight .prime-value {
  color: #ffffff;
  font-size: 1.6rem;
}

.prime-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(51, 176, 74, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
}

.prime-widget-highlight .prime-label {
  color: #ede947;
  background: rgba(237, 233, 71, 0.2);
}

/* Animation pour l'apparition des widgets */
.prime-widget {
  animation: fadeInScale 0.6s ease-out;
  animation-fill-mode: both;
}

.prime-widget:nth-child(1) { animation-delay: 0.1s; }
.prime-widget:nth-child(2) { animation-delay: 0.2s; }
.prime-widget:nth-child(3) { animation-delay: 0.3s; }
.prime-widget:nth-child(4) { animation-delay: 0.4s; }
.prime-widget:nth-child(5) { animation-delay: 0.5s; }
.prime-widget:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Bouton de conversion */
.btn-lg {
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(237, 233, 71, 0.3);
  transition: all 0.3s ease;
}

.btn-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(237, 233, 71, 0.4);
}

/* Responsive design */
@media (max-width: 768px) {
.step-indicator {
  flex-direction: column;
  gap: 15px;
}

.step-connector {
  width: 3px;
  height: 30px;
  margin: 0;
}

.step-item {
  max-width: none;
}

.table-responsive {
  font-size: 0.75rem;
}

.primes-section {
  padding: 20px;
  margin: 20px 0;
}

.prime-widget {
  padding: 15px;
  margin-bottom: 15px;
}

.prime-icon {
  font-size: 2rem;
}

.prime-value {
  font-size: 1.2rem;
}

.prime-widget-highlight .prime-value {
  font-size: 1.3rem;
}

.btn-lg {
  padding: 12px 30px;
  font-size: 1rem;
}
}

/* Styles spécifiques pour la modal sur mobile */
.primes-priority-absolute {
  width: 98% !important;
  max-height: 95vh !important;
  padding: 15px !important;
  border-radius: 15px !important;
}

.primes-priority-absolute h4 {
  font-size: 1.5rem !important;
  margin-bottom: 15px !important;
}

/* Bouton de fermeture plus visible sur mobile */
.primes-priority-absolute .btn-outline-light,
.primes-priority-absolute .close-modal-btn {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border: 2px solid #ffffff !important;
  color: #ffffff !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1.2rem !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
}

.primes-priority-absolute .btn-outline-light:hover,
.primes-priority-absolute .close-modal-btn:hover {
  background-color: rgba(255, 255, 255, 0.3) !important;
  transform: scale(1.1) !important;
  color: #ffffff !important;
}

/* S'assurer que l'icône X est visible */
.primes-priority-absolute .close-modal-btn .close-symbol {
  color: #ffffff !important;
  font-size: 1.2rem !important;
  font-weight: bold !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
  display: block !important;
  line-height: 1 !important;
  font-family: Arial, sans-serif !important;
}

.primes-priority-absolute .close-modal-btn:hover .close-symbol {
  color: #ffffff !important;
  transform: scale(1.1) !important;
}

/* Widgets sur mobile - 2 par ligne */
.primes-priority-absolute .col-md-4 {
  flex: 0 0 50% !important;
  max-width: 50% !important;
  margin-bottom: 10px !important;
}

.prime-widget {
  padding: 12px !important;
  margin-bottom: 10px !important;
}

.prime-icon {
  font-size: 1.8rem !important;
  margin-bottom: 10px !important;
}

.prime-title {
  font-size: 0.8rem !important;
  margin-bottom: 8px !important;
}

.prime-value {
  font-size: 1.1rem !important;
  margin-bottom: 6px !important;
}

.prime-widget-highlight .prime-value {
  font-size: 1.2rem !important;
}

.prime-label {
  font-size: 0.7rem !important;
  padding: 3px 6px !important;
}

/* Bouton de conversion plus visible sur mobile */
.primes-priority-absolute .btn-lg {
  padding: 15px 25px !important;
  font-size: 1.1rem !important;
  width: 100% !important;
  margin-top: 20px !important;
  border-radius: 25px !important;
  box-shadow: 0 4px 15px rgba(237, 233, 71, 0.4) !important;
}

/* Contenu scrollable sur mobile */
.primes-priority-absolute .row {
  max-height: calc(95vh - 180px) !important;
  padding-right: 5px !important;
}

/* Bouton de fermeture sur mobile */
.primes-priority-absolute .close-modal-btn .close-symbol {
  font-size: 1rem !important;
  color: #ffffff !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
}

/* Styles pour Multiselect */
.multiselect {
  min-height: 48px;
}

.multiselect__tags {
  min-height: 48px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 15px;
}

.multiselect__tags:focus-within {
  border-color: #33b04a;
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.25);
}

.multiselect__single {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font-size: 15px;
  color: #495057;
}

.multiselect__placeholder {
  color: #6c757d;
  font-size: 15px;
  margin: 0;
  padding: 0;
}

.multiselect__content-wrapper {
  border: 2px solid #e9ecef;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.multiselect__content {
  max-height: 200px;
}

.multiselect__option {
  padding: 12px 15px;
  font-size: 15px;
  color: #495057;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.multiselect__option:hover {
  background: #f8f9fa;
}

.multiselect__option--highlight {
  background: #33b04a;
  color: white;
}

.multiselect__option--selected {
  background: #f8f9fa;
  color: #495057;
  font-weight: normal;
}

.multiselect__option--selected.multiselect__option--highlight {
  background: #33b04a;
  color: white;
  font-weight: 600;
}

/* Forcer les options non sélectionnées à avoir un fond blanc */
.multiselect__option:not(.multiselect__option--selected) {
  background: white !important;
  color: #495057 !important;
}

.multiselect__option:not(.multiselect__option--selected):hover {
  background: #f8f9fa !important;
}

.multiselect__spinner {
  border-color: #33b04a transparent transparent;
}

/* Styles pour les champs désactivés */
.field-disabled {
  background-color: #f8f9fa !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
}

.field-disabled:focus {
  border-color: #ced4da !important;
  box-shadow: none !important;
}

/* Indicateurs de validation progressive */
.text-muted.ms-2 {
  font-size: 0.875rem;
  font-style: italic;
}

/* Affichage de l'âge */
.age-display {
  padding: 8px 12px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #e1bee7;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.age-display small {
  color: #5e35b1 !important;
  font-weight: 500;
}

.age-display strong {
  color: #4a148c;
  font-size: 0.9rem;
}

.age-status {
  display: inline-flex;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
}

.age-status i {
  font-size: 0.75rem;
}

/* Styles responsive pour le formulaire multi-étapes */
@media (max-width: 768px) {

  .conversion-modal-content .form-step {
    min-height: 300px;
    padding: 15px 0;
  }

  .conversion-modal-content .form-group {
    margin-bottom: 20px;
  }

  .conversion-modal-content .form-control {
    font-size: 14px;
    padding: 10px 12px;
  }

  /* Multiselect responsive */
  .multiselect__tags {
    padding: 10px 12px;
    font-size: 14px;
    min-height: 44px;
  }

  .multiselect__single {
    font-size: 14px;
  }

  .multiselect__placeholder {
    font-size: 14px;
  }

  .multiselect__option {
    padding: 10px 12px;
    font-size: 14px;
  }
}

/* Segmented Control / Tabs */
.product-selector-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.modern-tabs {
  display: flex;
  background: #f1f3f5;
  border-radius: 12px;
  padding: 6px;
  gap: 8px;
  width: 100%;
  max-width: 800px;
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
  color: #5e35b1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modern-tabs .tab-icon {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.modern-tabs .tab-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.modern-tabs .short-label {
  display: none;
}

@media (max-width: 768px) {
  .modern-tabs .full-label { display: none; }
  .modern-tabs .short-label { display: inline; }
}
</style>