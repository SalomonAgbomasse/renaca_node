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

      <!-- Step 2 (si CP): Bénéficiaires OU Step 2 (si OBA): Membres Assurés -->
      <template v-if="creditType === 'CP' || creditType === 'OBA'">
        <div 
          class="stepper-item" 
          :class="{ active: currentStep === 2, completed: currentStep > 2 }"
          @click="goToStep(2)"
        >
          <div class="step-counter">
            <i v-if="currentStep > 2" class="flaticon-check"></i>
            <span v-else>2</span>
          </div>
          <div class="step-name">{{ creditType === 'CP' ? '2. Bénéficiaires' : '2. Membres Assurés' }}</div>
        </div>

        <div class="stepper-line"></div>
      </template>

      <!-- Last Step: Récapitulatif & Primes -->
      <div 
        class="stepper-item" 
        :class="{ active: currentStep === totalSteps }"
        @click="goToStep(totalSteps)"
      >
        <div class="step-counter">{{ totalSteps }}</div>
        <div class="step-name">{{ totalSteps }}. Récapitulatif</div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- STEP 1: PARAMÈTRES DU CONTRAT SELON NATURE                      -->
    <!-- ============================================================== -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="row g-3">
        <!-- ========================================== -->
        <!-- CAS 1 : PADME PROTECTION (CP)              -->
        <!-- ========================================== -->
        <template v-if="creditType === 'CP'">
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

          <!-- Ligne 2 : Formule Capital & Type de Compte -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Formule / Capital Garanti <span class="text-danger">*</span></label>
            <select v-model.number="form.capital" class="form-select border-success fw-bold" required>
              <option :value="500000">Option 1 - 500 000 FCFA</option>
              <option :value="1000000">Option 2 - 1 000 000 FCFA</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Type de Compte <span class="text-danger">*</span></label>
            <select v-model="form.typeCompte" class="form-select" required>
              <option value="EPARGNE">EPARGNE</option>
              <option value="COURANT">COURANT</option>
            </select>
          </div>

          <!-- Ligne 3 : Numéro de compte, Établissement (Optionnel) & Renouvellement -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Numéro de compte <span class="text-danger">*</span></label>
            <input 
              type="text" 
              v-model="form.numeroCompte" 
              class="form-control" 
              placeholder="Ex: 253110248949" 
              required 
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Établissement / Employeur</label>
            <input 
              type="text" 
              v-model="form.etablissement" 
              class="form-control" 
              placeholder="Ex: PADME S.A"
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Renouvellement Automatique <span class="text-danger">*</span></label>
            <select v-model="form.renouvellement" class="form-select" required>
              <option value="OUI">OUI (Reconduction tacite annuelle)</option>
              <option value="NON">NON</option>
            </select>
          </div>

          <!-- Ligne 4 : Durée & 3 Dates -->
          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Durée (mois) <span class="text-danger">*</span></label>
            <input 
              type="number" 
              v-model.number="form.duration" 
              class="form-control bg-light" 
              disabled 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEffet" 
              class="form-control bg-light" 
              disabled
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date de la 1re échéance <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.datePremiereEcheance" 
              class="form-control bg-light" 
              disabled
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'échéance finale <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEch1" 
              class="form-control bg-light" 
              disabled
              required 
            />
          </div>
        </template>

        <!-- ========================================== -->
        <!-- CAS 2 : CRÉDIT AMORTISSABLE (AMORT)        -->
        <!-- ========================================== -->
        <template v-else-if="creditType === 'AMORT'">
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
            <label class="form-label fw-bold small text-muted text-uppercase">Capital Prêté (FCFA) <span class="text-danger">*</span></label>
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

          <!-- Ligne 3 : Durée, Différé, Établissement (Optionnel) -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Durée (mois) <span class="text-danger">*</span></label>
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

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Différé (mois) <span class="text-danger">*</span></label>
            <select v-model.number="form.dureeeDifferee" class="form-select" required>
              <option :value="0">0 mois</option>
              <option :value="1">1 mois</option>
              <option :value="2">2 mois</option>
              <option :value="3">3 mois</option>
              <option :value="4">4 mois</option>
              <option :value="5">5 mois</option>
              <option :value="6">6 mois</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Établissement / Employeur</label>
            <input type="text" v-model="form.etablissement" class="form-control" placeholder="Ex: PADME S.A" />
          </div>

          <!-- Ligne 4 : 3 Dates alignées -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input type="date" v-model="form.dateEffet" class="form-control" required />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date de la 1re échéance <span class="text-danger">*</span></label>
            <input type="date" v-model="form.datePremiereEcheance" class="form-control" required />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">
              Date d'échéance finale <span class="text-danger">*</span>
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

        <!-- ========================================== -->
        <!-- CAS 3 : OBSÈQUES ALAFIA (OBA)              -->
        <!-- ========================================== -->
        <template v-else-if="creditType === 'OBA'">
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

          <!-- Ligne 2 : Durée & Établissement (Optionnel) -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Durée (mois) <span class="text-danger">*</span></label>
            <input type="number" v-model.number="form.duration" class="form-control bg-light" disabled required />
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Établissement / Employeur</label>
            <input type="text" v-model="form.etablissement" class="form-control" placeholder="Ex: PADME S.A" />
          </div>

          <!-- Ligne 3 : 3 Dates alignées (Verrouillées pour OBA comme pour CP) -->
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEffet" 
              class="form-control bg-light" 
              disabled 
              required 
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date de la 1re échéance <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.datePremiereEcheance" 
              class="form-control bg-light" 
              disabled 
              required 
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'échéance finale <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEch1" 
              class="form-control bg-light" 
              disabled 
              required 
            />
          </div>

          <!-- Information discrète Combinaisons OBA -->
          <div class="col-12 mt-3">
            <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-white border d-flex align-items-center justify-content-center text-primary shadow-xs" style="width: 38px; height: 38px; min-width: 38px;">
                  <i class="fas fa-users fs-14"></i>
                </div>
                <div>
                  <div class="fw-semibold text-dark fs-13 mb-0.5">Combinaisons des membres assurés</div>
                  <div class="text-muted small fs-12">
                    Le choix des membres couverts (Assuré, Conjoint, Parents, Beaux-parents) se configure à l'<strong>Étape 2</strong>.
                  </div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-white text-secondary border px-2.5 py-1.5 fs-12 fw-normal">
                  <i class="fas fa-shield-alt text-primary me-1"></i>
                  {{ obaIncludedMembersCount }} membre(s) sélectionné(s) • {{ (form.capital || 500000).toLocaleString('fr-FR') }} FCFA
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- STEP 2: BÉNÉFICIAIRES (CP UNIQUEMENT)                           -->
    <!-- ============================================================== -->
    <div v-if="currentStep === 2 && creditType === 'CP'" class="step-content">
      <!-- En-tête de section épuré avec bouton d'ajout en haut à droite -->
      <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <div>
          <h6 class="text-black fw-bold mb-0">
            <i class="fas fa-users text-success me-2"></i>Bénéficiaires désignés
          </h6>
        </div>
        <button 
          type="button" 
          class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" 
          @click="addBeneficiary"
          :disabled="form.beneficiaries.length >= 5"
        >
          <i class="flaticon-plus"></i> Ajouter un bénéficiaire
        </button>
      </div>

      <!-- Beneficiary list -->
      <div v-for="(benef, idx) in form.beneficiaries" :key="idx" class="card border-0 shadow-sm mb-2 p-3 bg-white">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label fw-bold small text-muted text-uppercase mb-1">Nom & Prénoms <span class="text-danger">*</span></label>
            <input type="text" v-model="benef.nomPrenoms" class="form-control text-uppercase" placeholder="Ex: KOFFI Jean" required />
          </div>
          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase mb-1">Lien de Parenté <span class="text-danger">*</span></label>
            <select v-model="benef.lienParente" class="form-select" required>
              <option value="" disabled>-- Sélectionner --</option>
              <option v-for="l in liensParenteOptions" :key="l.id || l.code || l.libelle || l" :value="l.libelle || l.code || l">
                {{ l.description || l.libelle || l }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label fw-bold small text-muted text-uppercase mb-1">Part (%) <span class="text-danger">*</span></label>
            <input type="number" v-model.number="benef.pourcentage" class="form-control text-center fw-bold" min="1" max="100" step="1" required />
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm w-100" 
              @click="removeBeneficiary(idx)" 
              :disabled="form.beneficiaries.length <= 1"
              :title="form.beneficiaries.length <= 1 ? 'Au moins un bénéficiaire est obligatoire' : 'Supprimer'"
            >
              <i class="flaticon-delete"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="form.beneficiaries.length === 0" class="text-center text-muted py-4 border rounded bg-light">
        <i class="flaticon-user fs-1 mb-2 d-block text-muted"></i>
        Aucun bénéficiaire ajouté. Cliquez sur "+ Ajouter un bénéficiaire" ci-dessus.
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- ============================================================== -->
    <!-- STEP 2: MEMBRES ASSURÉS (OBA UNIQUEMENT)                        -->
    <!-- ============================================================== -->
    <div v-if="currentStep === 2 && creditType === 'OBA'" class="step-content">
      <!-- En-tête professionnel et aéré -->
      <div class="border-bottom pb-2.5 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h6 class="text-dark fw-bold mb-0.5 d-flex align-items-center gap-2 fs-14">
            <i class="fas fa-users-cog text-primary"></i>
            <span>Membres du Groupe Assuré (Obsèques Alafia)</span>
          </h6>
          <div class="text-muted small fs-12">
            Sélectionnez les personnes à couvrir. Chaque membre bénéficie d'une garantie de 500 000 FCFA.
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-white text-secondary border px-3 py-1.5 fs-12 fw-normal shadow-xs">
            <i class="fas fa-shield-alt text-primary me-1"></i>
            Total : <strong class="text-dark">{{ obaIncludedMembersCount }} assuré(s)</strong> • <strong class="text-primary">{{ (form.capital || 500000).toLocaleString('fr-FR') }} FCFA</strong>
          </span>
        </div>
      </div>
      
      <div class="row g-3">
        <!-- Colonne 1: Groupe Assuré Principal -->
        <div class="col-md-6">
          <div class="d-flex justify-content-between align-items-center mb-2.5 pb-1 border-bottom">
            <span class="fw-semibold text-dark fs-13">
              <i class="fas fa-user-circle text-primary me-1.5"></i>Groupe Assuré Principal
            </span>
            <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">Âge max : 75 ans</span>
          </div>

          <!-- Assuré Principal (Titulaire inclus d'office) -->
          <div class="card p-3 border rounded-3 mb-2.5 bg-white shadow-xs" style="border-left: 3px solid #0d6efd !important;">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2.5">
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; min-width: 36px;">
                  <i class="fas fa-user-check fs-14"></i>
                </div>
                <div>
                  <div class="fw-bold text-dark fs-13">
                    {{ contratDetails.customer?.lastname }} {{ contratDetails.customer?.firstname }}
                  </div>
                  <div class="text-muted small fs-11">
                    Titulaire • Né(e) le {{ formatDateDisplay(contratDetails.customer?.birthdate) }}
                  </div>
                </div>
              </div>
              <div class="text-end">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-11 fw-semibold d-block mb-1">
                  500 000 FCFA
                </span>
                <span class="text-muted small fs-11">
                  {{ calculateAge(contratDetails.customer?.birthdate) }} ans
                </span>
              </div>
            </div>
          </div>

          <!-- Père Assuré (Ascendant 1) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="[
            form.obaOptions.ascendant1.checked 
              ? (isObaOptionAgeValid('ascendant1') ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-danger-subtle border-danger border-opacity-50') 
              : 'bg-light bg-opacity-50 border-light-subtle'
          ]">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="oba-asc1" v-model="form.obaOptions.ascendant1.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="oba-asc1">
                  Père de l'assuré
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">
                  500 000 FCFA
                </span>
                <span v-if="form.obaOptions.ascendant1.checked && form.obaOptions.ascendant1.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal" :class="isObaOptionAgeValid('ascendant1') ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                  {{ calculateAge(form.obaOptions.ascendant1.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="form.obaOptions.ascendant1.checked" class="mt-2.5 pt-2 border-top">
              <div class="row g-2">
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Nom <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant1.lastname" class="form-control form-control-sm text-uppercase" placeholder="Nom du père" required @input="form.obaOptions.ascendant1.lastname = form.obaOptions.ascendant1.lastname.toUpperCase()" />
                </div>
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Prénoms <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant1.firstname" class="form-control form-control-sm" placeholder="Prénoms" required />
                </div>
                <div class="col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Date de naissance <span class="text-danger">*</span></label>
                  <input type="date" v-model="form.obaOptions.ascendant1.birthdate" class="form-control form-control-sm" required />
                  <div v-if="form.obaOptions.ascendant1.birthdate && !isObaOptionAgeValid('ascendant1')" class="text-danger small mt-1 fs-11">
                    <i class="fas fa-exclamation-circle me-1"></i> L'âge doit être compris entre 18 et 75 ans et supérieur à l'assuré ({{ calculateAge(contratDetails.customer?.birthdate) }} ans).
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mère Assuré (Ascendant 2) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="[
            form.obaOptions.ascendant2.checked 
              ? (isObaOptionAgeValid('ascendant2') ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-danger-subtle border-danger border-opacity-50') 
              : 'bg-light bg-opacity-50 border-light-subtle'
          ]">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="oba-asc2" v-model="form.obaOptions.ascendant2.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="oba-asc2">
                  Mère de l'assuré
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">
                  500 000 FCFA
                </span>
                <span v-if="form.obaOptions.ascendant2.checked && form.obaOptions.ascendant2.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal" :class="isObaOptionAgeValid('ascendant2') ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                  {{ calculateAge(form.obaOptions.ascendant2.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="form.obaOptions.ascendant2.checked" class="mt-2.5 pt-2 border-top">
              <div class="row g-2">
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Nom <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant2.lastname" class="form-control form-control-sm text-uppercase" placeholder="Nom de la mère" required @input="form.obaOptions.ascendant2.lastname = form.obaOptions.ascendant2.lastname.toUpperCase()" />
                </div>
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Prénoms <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant2.firstname" class="form-control form-control-sm" placeholder="Prénoms" required />
                </div>
                <div class="col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Date de naissance <span class="text-danger">*</span></label>
                  <input type="date" v-model="form.obaOptions.ascendant2.birthdate" class="form-control form-control-sm" required />
                  <div v-if="form.obaOptions.ascendant2.birthdate && !isObaOptionAgeValid('ascendant2')" class="text-danger small mt-1 fs-11">
                    <i class="fas fa-exclamation-circle me-1"></i> L'âge doit être compris entre 18 et 75 ans et supérieur à l'assuré ({{ calculateAge(contratDetails.customer?.birthdate) }} ans).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne 2: Groupe Conjoint(e) et Belle-Famille -->
        <div class="col-md-6">
          <div class="d-flex justify-content-between align-items-center mb-2.5 pb-1 border-bottom">
            <span class="fw-semibold text-dark fs-13">
              <i class="fas fa-user-friends text-primary me-1.5"></i>Groupe Conjoint(e) & Belle-Famille
            </span>
            <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">Max 65 ans (Conjoint)</span>
          </div>

          <!-- Conjoint(e) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="[
            form.obaOptions.conjoint.checked 
              ? (isObaOptionAgeValid('conjoint') ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-danger-subtle border-danger border-opacity-50') 
              : 'bg-light bg-opacity-50 border-light-subtle'
          ]">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="oba-conj" v-model="form.obaOptions.conjoint.checked" @change="onConjointChange" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="oba-conj">
                  Conjoint(e)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">
                  500 000 FCFA
                </span>
                <span v-if="form.obaOptions.conjoint.checked && form.obaOptions.conjoint.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal" :class="isObaOptionAgeValid('conjoint') ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                  {{ calculateAge(form.obaOptions.conjoint.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="form.obaOptions.conjoint.checked" class="mt-2.5 pt-2 border-top">
              <div class="row g-2">
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Nom <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.conjoint.lastname" class="form-control form-control-sm text-uppercase" placeholder="Nom du conjoint" required @input="form.obaOptions.conjoint.lastname = form.obaOptions.conjoint.lastname.toUpperCase()" />
                </div>
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Prénoms <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.conjoint.firstname" class="form-control form-control-sm" placeholder="Prénoms" required />
                </div>
                <div class="col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Date de naissance <span class="text-danger">*</span></label>
                  <input type="date" v-model="form.obaOptions.conjoint.birthdate" class="form-control form-control-sm" required />
                  <div v-if="form.obaOptions.conjoint.birthdate && !isObaOptionAgeValid('conjoint')" class="text-danger small mt-1 fs-11">
                    <i class="fas fa-exclamation-circle me-1"></i> L'âge du conjoint doit être compris entre 18 et 65 ans.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Père Conjoint(e) (Ascendant 3) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="[
            form.obaOptions.ascendant3.checked 
              ? (isObaOptionAgeValid('ascendant3') ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-danger-subtle border-danger border-opacity-50') 
              : 'bg-light bg-opacity-50 border-light-subtle',
            !form.obaOptions.conjoint.checked ? 'opacity-60' : ''
          ]">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="oba-asc3" v-model="form.obaOptions.ascendant3.checked" :disabled="!form.obaOptions.conjoint.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="oba-asc3">
                  Père du/de la conjoint(e)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">
                  500 000 FCFA
                </span>
                <span v-if="form.obaOptions.ascendant3.checked && form.obaOptions.ascendant3.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal" :class="isObaOptionAgeValid('ascendant3') ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                  {{ calculateAge(form.obaOptions.ascendant3.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="!form.obaOptions.conjoint.checked" class="text-muted small fs-11 mt-1 ps-4">
              <i class="fas fa-info-circle me-1"></i> Nécessite la sélection préalable du/de la conjoint(e)
            </div>

            <div v-if="form.obaOptions.ascendant3.checked && form.obaOptions.conjoint.checked" class="mt-2.5 pt-2 border-top">
              <div class="row g-2">
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Nom <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant3.lastname" class="form-control form-control-sm text-uppercase" placeholder="Nom" required @input="form.obaOptions.ascendant3.lastname = form.obaOptions.ascendant3.lastname.toUpperCase()" />
                </div>
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Prénoms <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant3.firstname" class="form-control form-control-sm" placeholder="Prénoms" required />
                </div>
                <div class="col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Date de naissance <span class="text-danger">*</span></label>
                  <input type="date" v-model="form.obaOptions.ascendant3.birthdate" class="form-control form-control-sm" required />
                  <div v-if="form.obaOptions.ascendant3.birthdate && !isObaOptionAgeValid('ascendant3')" class="text-danger small mt-1 fs-11">
                    <i class="fas fa-exclamation-circle me-1"></i> L'âge doit être compris entre 18 et 75 ans et supérieur au conjoint ({{ calculateAge(form.obaOptions.conjoint.birthdate) }} ans).
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mère Conjoint(e) (Ascendant 4) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="[
            form.obaOptions.ascendant4.checked 
              ? (isObaOptionAgeValid('ascendant4') ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-danger-subtle border-danger border-opacity-50') 
              : 'bg-light bg-opacity-50 border-light-subtle',
            !form.obaOptions.conjoint.checked ? 'opacity-60' : ''
          ]">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="oba-asc4" v-model="form.obaOptions.ascendant4.checked" :disabled="!form.obaOptions.conjoint.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="oba-asc4">
                  Mère du/de la conjoint(e)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">
                  500 000 FCFA
                </span>
                <span v-if="form.obaOptions.ascendant4.checked && form.obaOptions.ascendant4.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal" :class="isObaOptionAgeValid('ascendant4') ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'">
                  {{ calculateAge(form.obaOptions.ascendant4.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="!form.obaOptions.conjoint.checked" class="text-muted small fs-11 mt-1 ps-4">
              <i class="fas fa-info-circle me-1"></i> Nécessite la sélection préalable du/de la conjoint(e)
            </div>

            <div v-if="form.obaOptions.ascendant4.checked && form.obaOptions.conjoint.checked" class="mt-2.5 pt-2 border-top">
              <div class="row g-2">
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Nom <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant4.lastname" class="form-control form-control-sm text-uppercase" placeholder="Nom" required @input="form.obaOptions.ascendant4.lastname = form.obaOptions.ascendant4.lastname.toUpperCase()" />
                </div>
                <div class="col-md-6 col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Prénoms <span class="text-danger">*</span></label>
                  <input type="text" v-model="form.obaOptions.ascendant4.firstname" class="form-control form-control-sm" placeholder="Prénoms" required />
                </div>
                <div class="col-12">
                  <label class="small text-muted fs-11 text-uppercase fw-semibold mb-1">Date de naissance <span class="text-danger">*</span></label>
                  <input type="date" v-model="form.obaOptions.ascendant4.birthdate" class="form-control form-control-sm" required />
                  <div v-if="form.obaOptions.ascendant4.birthdate && !isObaOptionAgeValid('ascendant4')" class="text-danger small mt-1 fs-11">
                    <i class="fas fa-exclamation-circle me-1"></i> L'âge doit être compris entre 18 et 75 ans et supérieur au conjoint ({{ calculateAge(form.obaOptions.conjoint.birthdate) }} ans).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

                <!-- CP ou OBA : Détail Prime Décès -->
                <div v-if="creditType === 'CP' || creditType === 'OBA'" class="row g-2">
                  <div class="col-12">
                    <div class="p-2.5 rounded-2 border bg-light d-flex align-items-center justify-content-between px-3">
                      <span class="small text-secondary fw-bold text-uppercase fs-13">
                        <i class="fas fa-heartbeat text-danger me-1.5"></i>Prime Décès (PD)
                      </span>
                      <strong class="text-dark fs-16">{{ primes.pd.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                </div>

                <!-- AMORT : Grille détaillée -->
                <div v-else class="row g-2">
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Prime Décès (PD)</span>
                      <strong class="text-dark fs-15">{{ primes.pd.toLocaleString('fr-FR') }} FCFA</strong>
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
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Frais Médicaux (FM)</span>
                      <strong class="text-dark fs-15">{{ primes.fm.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 rounded-2 border bg-light">
                      <span class="small text-muted d-block fw-semibold fs-12 mb-0.5">Accessoires (ACC)</span>
                      <strong class="text-dark fs-15">{{ primes.acc.toLocaleString('fr-FR') }} FCFA</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte 2 : Spécifique à la nature pour combler harmonieusement le vide à droite -->
          <!-- Pour CP : Bénéficiaires désignés -->
          <div v-if="creditType === 'CP'" class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white flex-grow-1">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                  <i class="fas fa-users fs-14"></i>
                </div>
                <span class="fw-bold text-dark fs-15">Bénéficiaires désignés</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-12 fw-medium">
                {{ form.beneficiaries?.length || 0 }} ayant(s)-droit ({{ totalBenefPct }}%)
              </span>
            </div>
            <div class="card-body p-2.5">
              <div v-if="form.beneficiaries?.length" class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0">
                  <thead class="table-light small text-muted">
                    <tr>
                      <th class="py-1 fs-12">Nom & Prénoms</th>
                      <th class="py-1 fs-12">Lien</th>
                      <th class="py-1 text-end fs-12">Quote-part</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, bIdx) in form.beneficiaries" :key="bIdx" class="border-bottom-subtle">
                      <td class="py-2 fw-bold text-uppercase fs-14">{{ b.nomPrenoms || '-' }}</td>
                      <td class="py-2 text-secondary fs-13">{{ b.lienParente || '-' }}</td>
                      <td class="py-2 text-end">
                        <span class="badge bg-success-subtle text-success fw-bold px-2.5 py-1 fs-13">{{ b.pourcentage }}%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted small text-center py-2 fs-13">
                Aucun bénéficiaire désigné
              </div>
            </div>
          </div>

          <!-- Pour OBA : Membres du groupe assuré -->
          <div v-else-if="creditType === 'OBA'" class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white flex-grow-1">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                  <i class="fas fa-users fs-14"></i>
                </div>
                <span class="fw-bold text-dark fs-15">Membres du groupe assuré</span>
              </div>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fs-12 fw-medium">
                {{ obaIncludedMembersCount }} assuré(s)
              </span>
            </div>
            <div class="card-body p-2.5">
              <div class="d-flex flex-column gap-2">
                <div class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="fw-bold text-dark fs-14">ASSURÉ PRINCIPAL</span>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.conjoint?.checked" class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-bold text-dark fs-14">CONJOINT(E) : </span>
                    <span class="text-secondary fs-13">{{ form.obaOptions.conjoint.lastname }} {{ form.obaOptions.conjoint.firstname }}</span>
                  </div>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant1?.checked" class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-bold text-dark fs-14">PÈRE : </span>
                    <span class="text-secondary fs-13">{{ form.obaOptions.ascendant1.lastname }} {{ form.obaOptions.ascendant1.firstname }}</span>
                  </div>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant2?.checked" class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-bold text-dark fs-14">MÈRE : </span>
                    <span class="text-secondary fs-13">{{ form.obaOptions.ascendant2.lastname }} {{ form.obaOptions.ascendant2.firstname }}</span>
                  </div>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant3?.checked" class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-bold text-dark fs-14">PÈRE CONJOINT : </span>
                    <span class="text-secondary fs-13">{{ form.obaOptions.ascendant3.lastname }} {{ form.obaOptions.ascendant3.firstname }}</span>
                  </div>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant4?.checked" class="p-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-bold text-dark fs-14">MÈRE CONJOINT : </span>
                    <span class="text-secondary fs-13">{{ form.obaOptions.ascendant4.lastname }} {{ form.obaOptions.ascendant4.firstname }}</span>
                  </div>
                  <span class="badge bg-primary fs-13 px-2.5 py-1">500 000 FCFA</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pour AMORT : Synthèse financière -->
          <div v-else class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white flex-grow-1">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                  <i class="fas fa-shield-alt fs-14"></i>
                </div>
                <span class="fw-bold text-dark fs-15">Garantie & Couverture</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-12 fw-medium">
                Crédit Amortissable
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
                <div class="p-2.5 rounded-2 bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-secondary fs-13 fw-semibold">Différé d'amortissement</span>
                  <strong class="text-dark fs-15">{{ form.dureeeDifferee }} mois</strong>
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
import { success, error, warning, calculateDateEcheance } from '../../utils/utils';

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
    const liensParenteOptions = ref<any[]>([]);
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

    const totalSteps = computed(() => {
      if (creditType.value === 'CP' || creditType.value === 'OBA') return 3;
      return 2;
    });

    const modalTitle = computed(() => {
      if (currentStep.value === 1) {
        return `Modifier le contrat (Étape 1/${totalSteps.value} : Paramètres)`;
      } else if (currentStep.value === 2 && totalSteps.value === 3) {
        if (creditType.value === 'CP') {
          return `Modifier le contrat (Étape 2/${totalSteps.value} : Bénéficiaires)`;
        } else {
          return `Modifier le contrat (Étape 2/${totalSteps.value} : Membres Assurés)`;
        }
      }
      return `Modifier le contrat (Étape ${totalSteps.value}/${totalSteps.value} : Récapitulatif & Primes)`;
    });

    const form = ref({
      reference: '',
      idNatureCredit: 0,
      capital: 0,
      duration: 12,
      idPeriodicite: 0,
      dureeeDifferee: 0,
      dateEffet: '',
      datePremiereEcheance: '',
      dateEch1: '',
      tauxInteret: 0,
      garantieCompl: 'NON',
      typeCompte: 'EPARGNE',
      numeroCompte: '',
      numCompteEpargne: '',
      etablissement: '',
      renouvellement: 'OUI',
      beneficiaries: [] as any[],
      obaOptions: {
        conjoint: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant1: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant2: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant3: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant4: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' }
      }
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

    const loadLiensParente = async () => {
      try {
        const res = await ApiService.get('/lien-parente');
        const items = res.data?.liensParente || res.data?.data?.liensParente || (Array.isArray(res.data?.data) ? res.data.data : res.data);
        if (Array.isArray(items) && items.length > 0) {
          liensParenteOptions.value = items.filter((item: any) => item.isActive !== false);
        } else {
          throw new Error('Default fallback');
        }
      } catch (err) {
        liensParenteOptions.value = [
          { id: 1, libelle: 'ENFANT', code: 'ENFANT', description: 'Enfant (Fils/Fille)' },
          { id: 2, libelle: 'CONJOINT', code: 'CONJOINT', description: 'Conjoint / Époux / Épouse' },
          { id: 3, libelle: 'PERE', code: 'PERE', description: 'Père' },
          { id: 4, libelle: 'MERE', code: 'MERE', description: 'Mère' },
          { id: 5, libelle: 'FRERE', code: 'FRERE', description: 'Frère' },
          { id: 6, libelle: 'SOEUR', code: 'SOEUR', description: 'Sœur' },
          { id: 7, libelle: 'AUTRE', code: 'AUTRE', description: 'Autre / Ayant droit' }
        ];
      }
    };

    onMounted(() => {
      loadPeriodicites();
      loadLiensParente();
    });

    // Limites de crédit selon âge
    const getLimits = (natureCode: string, age: number) => {
      const isAmort = natureCode === 'AMORT';
      const isCP = natureCode === 'CP';
      const isOBA = natureCode === 'OBA';

      if (isAmort) {
        return {
          maxCapital: 10000000,
          maxDuration: age >= 65 ? 12 : 60,
          minDuration: 1
        };
      } else if (isCP) {
        return {
          maxCapital: 1000000,
          maxDuration: 12,
          minDuration: 12
        };
      } else if (isOBA) {
        return {
          maxCapital: 2000000,
          maxDuration: 12,
          minDuration: 12
        };
      }
      return { maxCapital: 10000000, maxDuration: 60, minDuration: 1 };
    };

    const currentLimits = computed(() => {
      return getLimits(creditType.value, clientAge.value);
    });

    const maxCapital = computed(() => currentLimits.value.maxCapital);
    const maxDuration = computed(() => currentLimits.value.maxDuration);
    const minDuration = computed(() => currentLimits.value.minDuration);

    const validateCapitalField = () => {
      if (creditType.value === 'AMORT' && form.value.capital > maxCapital.value) {
        form.value.capital = maxCapital.value;
      }
    };

    const validateDurationField = () => {
      if (creditType.value === 'AMORT' && form.value.duration > maxDuration.value) {
        form.value.duration = maxDuration.value;
      }
    };

    // Gestion des bénéficiaires (CP)
    const totalBenefPct = computed(() => {
      if (!form.value.beneficiaries || !Array.isArray(form.value.beneficiaries)) return 0;
      return form.value.beneficiaries.reduce((sum: number, b: any) => sum + (Number(b.pourcentage) || Number(b.part) || 0), 0);
    });

    const addBeneficiary = () => {
      const remaining = Math.max(0, 100 - totalBenefPct.value);
      form.value.beneficiaries.push({
        nomPrenoms: '',
        lienParente: '',
        pourcentage: remaining > 0 ? remaining : 0
      });
    };

    const removeBeneficiary = (index: number) => {
      if (creditType.value === 'CP' && form.value.beneficiaries.length <= 1) {
        warning('Au moins un bénéficiaire est obligatoire pour un contrat PADME PROTECTION (CP).');
        return;
      }
      form.value.beneficiaries.splice(index, 1);
    };

    // Calcul de l'âge à partir d'une date de naissance
    const calculateAge = (birthdate?: string): number => {
      if (!birthdate) return 0;
      const clean = birthdate.split('T')[0];
      const birthDateObj = new Date(clean);
      if (isNaN(birthDateObj.getTime())) return 0;
      const today = new Date();
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }
      return age;
    };

    // Validation des règles d'âge et écarts de générations OBA
    const isObaOptionAgeValid = (role: string): boolean => {
      const opt = (form.value.obaOptions as any)[role];
      if (!opt || !opt.checked || !opt.birthdate) return true;
      const age = calculateAge(opt.birthdate);
      
      // Conjoint : 18 à 65 ans
      if (role === 'conjoint') {
        return age >= 18 && age <= 65;
      }
      
      // Ascendants Assuré (Père / Mère) : 18 à 75 ans ET supérieur à l'Assuré
      if (role === 'ascendant1' || role === 'ascendant2') {
        const assureBirthdate = props.contratDetails?.customer?.birthdate;
        const assureAge = assureBirthdate ? calculateAge(assureBirthdate) : clientAge.value;
        return age >= 18 && age <= 75 && (assureAge === 0 || age > assureAge);
      }
      
      // Ascendants Conjoint (Père / Mère) : 18 à 75 ans ET supérieur au Conjoint
      if (role === 'ascendant3' || role === 'ascendant4') {
        const conjointBirthdate = form.value.obaOptions.conjoint?.birthdate;
        const conjointAge = conjointBirthdate ? calculateAge(conjointBirthdate) : 0;
        return age >= 18 && age <= 75 && (conjointAge === 0 || age > conjointAge);
      }
      
      return true;
    };

    // Initialisation
    const initForm = () => {
      currentStep.value = 1;
      dateEcheanceManuallyEdited.value = false;
      const c = props.contratDetails;
      if (!c) return;

      let obaOpts = {
        conjoint:   { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant1: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant2: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant3: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant4: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' }
      };

      // 1. Charger depuis insuredMembers si présent (BDD)
      if (Array.isArray(c.insuredMembers) && c.insuredMembers.length > 0) {
        c.insuredMembers.forEach((member: any) => {
          const role = member.role;
          if (role && (obaOpts as any)[role]) {
            (obaOpts as any)[role] = {
              checked: true,
              lastname: member.lastname || '',
              firstname: member.firstname || '',
              birthdate: member.birthdate ? member.birthdate.split('T')[0] : '',
              gender: member.gender || ((obaOpts as any)[role].gender || 'M')
            };
          }
        });
      } else if (c.obaOptions) {
        try {
          const parsed = typeof c.obaOptions === 'string' ? JSON.parse(c.obaOptions) : c.obaOptions;
          if (parsed && typeof parsed === 'object') {
            obaOpts = { ...obaOpts, ...parsed };
          }
        } catch (err) {
          console.error('Erreur parsing obaOptions:', err);
        }
      }

      // Initialiser les bénéficiaires
      let existingBenefs: any[] = [];
      if (Array.isArray(c.beneficiaries) && c.beneficiaries.length > 0) {
        existingBenefs = c.beneficiaries.map((b: any) => ({
          nomPrenoms: b.nomPrenoms || `${b.lastname || ''} ${b.firstname || ''}`.trim(),
          lienParente: b.lienParente || b.relation || '',
          pourcentage: Number(b.pourcentage || b.part || 0)
        }));
      } else {
        existingBenefs = [{ nomPrenoms: '', lienParente: '', pourcentage: 100 }];
      }

      const isOBAContract = (c.natureCredit?.code || '') === 'OBA' || (props.natureCredits.find(nc => nc.id === (c.idNatureCredit || c.natureCredit?.id))?.code === 'OBA');
      let calculatedCapital = Number(c.capital) || 0;
      if (isOBAContract) {
        let total = 500000;
        if (obaOpts.conjoint.checked) total += 500000;
        if (obaOpts.ascendant1.checked) total += 500000;
        if (obaOpts.ascendant2.checked) total += 500000;
        if (obaOpts.ascendant3.checked) total += 500000;
        if (obaOpts.ascendant4.checked) total += 500000;
        calculatedCapital = total;
      }

      form.value = {
        reference: c.reference || c.refContrat || c.numPolice || '',
        idNatureCredit: c.idNatureCredit || c.natureCredit?.id || 1,
        capital: calculatedCapital,
        duration: Number(c.duration || c.duree || 12),
        idPeriodicite: Number(c.idPeriodicite || c.periodicite?.id || 1),
        dureeeDifferee: Number(c.differe || 0),
        dateEffet: c.dateEff ? c.dateEff.split('T')[0] : '',
        datePremiereEcheance: c.dateEch1 ? c.dateEch1.split('T')[0] : '',
        dateEch1: c.dateEch ? c.dateEch.split('T')[0] : '',
        tauxInteret: c.taux !== undefined ? Number(c.taux) : 0,
        garantieCompl: c.garantieCompl || 'NON',
        typeCompte: c.typeCompte || (c.compteBancaire && ['EPARGNE', 'COURANT', 'TONTINE', 'AUTRE'].includes(c.compteBancaire) ? c.compteBancaire : 'EPARGNE'),
        numeroCompte: c.numeroCompte || c.numCompteEpargne || (!['EPARGNE', 'COURANT', 'TONTINE', 'AUTRE'].includes(c.compteBancaire) ? c.compteBancaire : '') || '',
        numCompteEpargne: c.numeroCompte || c.numCompteEpargne || '',
        etablissement: c.etablissement || c.customer?.etablissement || 'PADME S.A',
        renouvellement: c.renouvellementAuto === false ? 'NON' : 'OUI',
        beneficiaries: existingBenefs,
        obaOptions: obaOpts
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
      if (creditType.value === 'CP') {
        if (!form.value.numeroCompte || !form.value.typeCompte) return false;
      }
      return true;
    });

    const isStep2Valid = computed(() => {
      if (creditType.value === 'CP') {
        return form.value.beneficiaries.length > 0 && 
               totalBenefPct.value === 100 && 
               form.value.beneficiaries.every((b: any) => b.nomPrenoms?.trim() && b.lienParente && b.pourcentage > 0);
      }
      if (creditType.value === 'OBA') {
        const roles = ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4'];
        for (const role of roles) {
          const opt = (form.value.obaOptions as any)[role];
          if (opt && opt.checked) {
            if (!opt.lastname?.trim() || !opt.firstname?.trim() || !opt.birthdate) {
              return false;
            }
            if (!isObaOptionAgeValid(role)) {
              return false;
            }
          }
        }
        return true;
      }
      return true;
    });

    const isCurrentStepValid = computed(() => {
      if (currentStep.value === 1) return isStep1Valid.value;
      if (currentStep.value === 2 && totalSteps.value === 3) return isStep2Valid.value;
      return true;
    });

    const isFormValid = computed(() => {
      if (!isStep1Valid.value) return false;
      if (totalSteps.value === 3 && !isStep2Valid.value) return false;
      return true;
    });

    const onConjointChange = () => {
      if (!form.value.obaOptions.conjoint.checked) {
        form.value.obaOptions.ascendant3.checked = false;
        form.value.obaOptions.ascendant4.checked = false;
      }
    };

    const handleDateEcheanceManualEdit = () => {
      dateEcheanceManuallyEdited.value = true;
    };

    const resetDateEcheanceAuto = () => {
      dateEcheanceManuallyEdited.value = false;
      calculateDateEcheanceAuto();
    };

    const calculateDateEcheanceAuto = () => {
      if (creditType.value === 'CP' || dateEcheanceManuallyEdited.value) return;
      if (!form.value.datePremiereEcheance || !form.value.duration || !form.value.idPeriodicite) return;

      const pSelected = periodicites.value.find(p => p.id === form.value.idPeriodicite);
      if (!pSelected || !pSelected.nombreMois) return;

      const calculated = calculateDateEcheance(
        form.value.datePremiereEcheance,
        Number(form.value.duration),
        pSelected.nombreMois,
        Number(form.value.dureeeDifferee)
      );
      if (calculated) {
        form.value.dateEch1 = calculated;
      }
    };

    // Watcher dynamique lors du changement de nature de crédit
    watch(creditType, (newType) => {
      if (newType === 'CP') {
        form.value.duration = 12;
        form.value.dureeeDifferee = 0;
        if (form.value.capital !== 500000 && form.value.capital !== 1000000) {
          form.value.capital = 500000;
        }
        if (!form.value.beneficiaries || form.value.beneficiaries.length === 0) {
          form.value.beneficiaries = [{ nomPrenoms: '', lienParente: '', pourcentage: 100 }];
        }
      } else if (newType === 'OBA') {
        form.value.duration = 12;
        form.value.dureeeDifferee = 0;
        let total = 500000;
        const o = form.value.obaOptions;
        if (o.conjoint?.checked) total += 500000;
        if (o.ascendant1?.checked) total += 500000;
        if (o.ascendant2?.checked) total += 500000;
        if (o.ascendant3?.checked) total += 500000;
        if (o.ascendant4?.checked) total += 500000;
        form.value.capital = total;
      } else if (newType === 'AMORT') {
        if (!form.value.capital || form.value.capital < 10000) {
          form.value.capital = 1000000;
        }
        if (form.value.capital > 10000000) {
          form.value.capital = 10000000;
        }
        if (!form.value.idPeriodicite) {
          form.value.idPeriodicite = 1;
        }
      }
    });

    watch(() => form.value.obaOptions, (newOpts) => {
      if (creditType.value === 'OBA' && newOpts) {
        let total = 500000;
        if (newOpts.conjoint?.checked) total += 500000;
        if (newOpts.ascendant1?.checked) total += 500000;
        if (newOpts.ascendant2?.checked) total += 500000;
        if (newOpts.ascendant3?.checked) total += 500000;
        if (newOpts.ascendant4?.checked) total += 500000;
        form.value.capital = total;
      }
    }, { deep: true });

    const formatDateDisplay = (dateStr: string) => {
      if (!dateStr) return '-';
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    };

    const obaIncludedMembersCount = computed(() => {
      if (creditType.value !== 'OBA') return 1;
      let count = 1;
      const o = form.value.obaOptions;
      if (o.conjoint?.checked) count++;
      if (o.ascendant1?.checked) count++;
      if (o.ascendant2?.checked) count++;
      if (o.ascendant3?.checked) count++;
      if (o.ascendant4?.checked) count++;
      return count;
    });

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

      if (creditType.value === 'CP') {
        // Formule / Capital Garanti
        fields.push({
          field: 'capital',
          label: 'Formule / Capital Garanti',
          oldVal: c.capital ? `${Number(c.capital).toLocaleString('fr-FR')} FCFA` : '-',
          newVal: `${Number(form.value.capital).toLocaleString('fr-FR')} FCFA`,
          changed: Number(c.capital) !== Number(form.value.capital)
        });

        // Type de Compte
        const oldTypeCompte = c.typeCompte || (c.compteBancaire && ['EPARGNE', 'COURANT', 'TONTINE', 'AUTRE'].includes(c.compteBancaire) ? c.compteBancaire : 'EPARGNE');
        fields.push({
          field: 'typeCompte',
          label: 'Type de Compte',
          oldVal: oldTypeCompte === 'EPARGNE' ? 'Compte Épargne' : oldTypeCompte === 'COURANT' ? 'Compte Courant' : (oldTypeCompte || '-'),
          newVal: form.value.typeCompte === 'EPARGNE' ? 'Compte Épargne' : form.value.typeCompte === 'COURANT' ? 'Compte Courant' : form.value.typeCompte,
          changed: oldTypeCompte !== form.value.typeCompte
        });

        // Numéro de Compte
        const oldNumCompte = c.numeroCompte || c.numCompteEpargne || (!['EPARGNE', 'COURANT', 'TONTINE', 'AUTRE'].includes(c.compteBancaire) ? c.compteBancaire : '-') || '-';
        fields.push({
          field: 'numeroCompte',
          label: 'Numéro de Compte',
          oldVal: oldNumCompte,
          newVal: form.value.numeroCompte || '-',
          changed: (c.numeroCompte || c.numCompteEpargne) !== form.value.numeroCompte
        });

        // Renouvellement Automatique
        const oldRenouv = c.renouvellementAuto === false ? 'NON' : 'OUI';
        fields.push({
          field: 'renouvellement',
          label: 'Renouvellement automatique',
          oldVal: oldRenouv,
          newVal: form.value.renouvellement,
          changed: oldRenouv !== form.value.renouvellement
        });

        // Durée
        fields.push({
          field: 'duration',
          label: 'Durée',
          oldVal: c.duration || c.duree ? `${c.duration || c.duree} mois` : '-',
          newVal: `${form.value.duration} mois`,
          changed: Number(c.duration || c.duree) !== Number(form.value.duration)
        });

      } else if (creditType.value === 'AMORT') {
        // Capital Prêté
        fields.push({
          field: 'capital',
          label: 'Capital Prêté',
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

        // Différé
        const oldDiffere = c.differe !== undefined && c.differe !== null ? Number(c.differe) : 0;
        fields.push({
          field: 'dureeeDifferee',
          label: 'Différé',
          oldVal: `${oldDiffere} mois`,
          newVal: `${form.value.dureeeDifferee} mois`,
          changed: oldDiffere !== Number(form.value.dureeeDifferee)
        });

      } else if (creditType.value === 'OBA') {
        // Formule / Capital Total Garanti
        fields.push({
          field: 'capital',
          label: 'Capital Total Garanti',
          oldVal: c.capital ? `${Number(c.capital).toLocaleString('fr-FR')} FCFA` : '-',
          newVal: `${Number(form.value.capital).toLocaleString('fr-FR')} FCFA`,
          changed: Number(c.capital) !== Number(form.value.capital)
        });

        // Durée
        fields.push({
          field: 'duration',
          label: 'Durée',
          oldVal: c.duration || c.duree ? `${c.duration || c.duree} mois` : '-',
          newVal: `${form.value.duration} mois`,
          changed: Number(c.duration || c.duree) !== Number(form.value.duration)
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
        const isCPorOBA = creditType.value === 'CP' || creditType.value === 'OBA';
        const birthdate = props.contratDetails?.customer?.birthdate;
        const typeAss = String(props.contratDetails?.customer?.typeAss || props.contratDetails?.typeAss || '1');

        const recalculationData: any = {
          creditType: creditType.value,
          idNatureCredit: form.value.idNatureCredit,
          capital: Number(form.value.capital),
          birthdate: birthdate,
          duration: Number(form.value.duration),
          idPeriodicite: isCPorOBA ? 12 : Number(form.value.idPeriodicite || 1),
          differe: isCPorOBA ? 0 : Number(form.value.dureeeDifferee || 0),
          typeAss: typeAss,
          typeContrat: typeAss,
          garantieCompl: 'NON'
        };

        if (creditType.value === 'OBA') {
          const rawOpts = form.value.obaOptions;
          const configMap: Record<string, { capital: number, prime: number }> = {
            conjoint: { capital: 500000, prime: 2000 },
            ascendant1: { capital: 500000, prime: 2500 },
            ascendant2: { capital: 500000, prime: 2500 },
            ascendant3: { capital: 500000, prime: 2500 },
            ascendant4: { capital: 500000, prime: 2500 },
            assure: { capital: 500000, prime: 2000 }
          };
          const mappedOpts: any = {};
          mappedOpts.assure = {
            checked: true,
            birthdate: birthdate,
            lastname: props.contratDetails?.customer?.lastname || '',
            firstname: props.contratDetails?.customer?.firstname || '',
            gender: props.contratDetails?.customer?.gender || 'M',
            capitalAssure: configMap.assure.capital,
            prime: configMap.assure.prime
          };
          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = (rawOpts as any)[key];
            if (opt) {
              mappedOpts[key] = {
                checked: !!opt.checked,
                lastname: opt.lastname || '',
                firstname: opt.firstname || '',
                birthdate: opt.birthdate || '',
                gender: opt.gender || 'M',
                capitalAssure: opt.checked ? configMap[key].capital : 0,
                prime: opt.checked ? configMap[key].prime : 0
              };
            }
          }
          recalculationData.obaOptions = mappedOpts;
        }

        const response = await ApiService.post('/cotations/padme/calculate', recalculationData);
        let primesData: any = null;
        if (response.data?.data?.data && typeof response.data.data.data === 'object') {
          primesData = response.data.data.data;
        } else if (response.data?.data?.pd !== undefined || response.data?.data?.puttc !== undefined) {
          primesData = response.data.data;
        }
        if (primesData && !response.data?.data?.error) {
          primes.value = {
            pd: Number(primesData.pd) || 0,
            pc: Number(primesData.pc) || 0,
            surp: Number(primesData.surp) || 0,
            acc: Number(primesData.acc) || 0,
            fm: Number(primesData.fm) || 0,
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
          differe: form.value.dureeeDifferee,
          dateEff: form.value.dateEffet,
          dateEch1: form.value.datePremiereEcheance,
          dateEch: form.value.dateEch1,
          taux: form.value.tauxInteret,
          etablissement: form.value.etablissement,
          typeCompte: form.value.typeCompte,
          compteBancaire: form.value.typeCompte,
          numeroCompte: form.value.numeroCompte,
          numCompteEpargne: form.value.numeroCompte,
          renouvellement: form.value.renouvellement,
          renouvellementAuto: form.value.renouvellement === 'OUI',
          garantieCompl: 'NON',
          // Primes recalculées par le système
          pd: primes.value.pd || undefined,
          pc: primes.value.pc || undefined,
          surp: primes.value.surp || undefined,
          acc: primes.value.acc || undefined,
          fm: primes.value.fm || undefined,
          puttc: primes.value.puttc || undefined,
        };

        if (creditType.value === 'OBA') {
          const rawOpts = form.value.obaOptions;
          const configMap: Record<string, { capital: number, prime: number }> = {
            conjoint: { capital: 500000, prime: 2000 },
            ascendant1: { capital: 500000, prime: 2500 },
            ascendant2: { capital: 500000, prime: 2500 },
            ascendant3: { capital: 500000, prime: 2500 },
            ascendant4: { capital: 500000, prime: 2500 },
            assure: { capital: 500000, prime: 2000 }
          };
          const mappedOpts: any = {
            assure: {
              checked: true,
              birthdate: props.contratDetails?.customer?.birthdate?.split('T')[0] || form.value.dateEffet,
              lastname: props.contratDetails?.customer?.lastname || '',
              firstname: props.contratDetails?.customer?.firstname || '',
              gender: props.contratDetails?.customer?.gender || 'M',
              capitalAssure: configMap.assure.capital,
              prime: configMap.assure.prime
            }
          };
          for (const key of ['conjoint', 'ascendant1', 'ascendant2', 'ascendant3', 'ascendant4']) {
            const opt = (rawOpts as any)[key];
            if (opt) {
              mappedOpts[key] = {
                checked: !!opt.checked,
                lastname: (opt.lastname || '').toUpperCase().trim(),
                firstname: (opt.firstname || '').trim(),
                birthdate: opt.birthdate || '',
                gender: opt.gender || 'M',
                capitalAssure: opt.checked ? configMap[key].capital : 0,
                prime: opt.checked ? configMap[key].prime : 0
              };
            }
          }
          payload.obaOptions = mappedOpts;
        }

        if (creditType.value === 'CP') {
          payload.beneficiaries = form.value.beneficiaries;
        }

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
      liensParenteOptions,
      creditType,
      natureCreditLabel,
      clientAge,
      maxCapital,
      maxDuration,
      minDuration,
      form,
      totalBenefPct,
      isCurrentStepValid,
      isFormValid,
      comparisons,
      obaIncludedMembersCount,
      primes,
      isRecalculatingPrimes,
      dateEcheanceManuallyEdited,
      addBeneficiary,
      removeBeneficiary,
      onConjointChange,
      calculateAge,
      isObaOptionAgeValid,
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

/* Force clean, modern typography for all elements in this modal */
:deep(*), .step-content, .card, input, select, button, table {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}
</style>
