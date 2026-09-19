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
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEffet" 
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date de la 1re échéance <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.datePremiereEcheance" 
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'échéance finale <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEch1" 
              class="form-control" 
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
              required 
            />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small text-muted text-uppercase">Différé (mois)</label>
            <input 
              type="number" 
              v-model.number="form.dureeeDifferee" 
              class="form-control" 
              min="0" 
              max="6" 
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

        <!-- ========================================== -->
        <!-- CAS 3 : OBLIGATION CAUTIONNÉE (OBA)        -->
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

          <!-- Ligne 2 : Capital Global & Établissement (Optionnel) -->
          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Capital Total Assuré (FCFA) <span class="text-danger">*</span></label>
            <input 
              type="number" 
              v-model.number="form.capital" 
              class="form-control fw-bold" 
              required 
            />
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold small text-muted text-uppercase">Établissement / Employeur</label>
            <input 
              type="text" 
              v-model="form.etablissement" 
              class="form-control" 
              placeholder="Ex: PADME S.A" 
            />
          </div>

          <!-- Ligne 3 : Durée & 3 Dates -->
          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Durée (mois) <span class="text-danger">*</span></label>
            <input 
              type="number" 
              v-model.number="form.duration" 
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'effet <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEffet" 
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date de la 1re échéance <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.datePremiereEcheance" 
              class="form-control" 
              required 
            />
          </div>

          <div class="col-md-3">
            <label class="form-label fw-bold small text-muted text-uppercase">Date d'échéance finale <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.dateEch1" 
              class="form-control" 
              required 
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- STEP 2 (CP) : BÉNÉFICIAIRES                                     -->
    <!-- ============================================================== -->
    <div v-else-if="currentStep === 2 && creditType === 'CP'" class="step-content">
      <!-- Jauge de répartition compacte -->
      <div class="p-2.5 px-3 mb-3 rounded-3 border bg-white shadow-xs">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="fw-bold text-dark fs-12 text-uppercase" style="letter-spacing: 0.3px;">Répartition du capital :</span>
            <span 
              class="badge px-2 py-1 fs-12 fw-bold"
              :class="totalBenefPct === 100 ? 'bg-success text-white' : totalBenefPct > 100 ? 'bg-danger text-white' : 'bg-warning text-dark'"
            >
              {{ totalBenefPct }}% / 100%
            </span>
            
            <span v-if="totalBenefPct === 100" class="text-success fs-12 fw-semibold ms-1 d-inline-flex align-items-center">
              <i class="flaticon-tick me-1"></i> Répartition valide (100%)
            </span>
            <span v-else-if="totalBenefPct < 100" class="text-dark fs-12 fw-medium ms-1 d-inline-flex align-items-center">
              <i class="flaticon-warning text-warning me-1"></i> Reste <b class="text-warning ms-1">{{ 100 - totalBenefPct }}%</b>
            </span>
            <span v-else class="text-danger fs-12 fw-semibold ms-1 d-inline-flex align-items-center">
              <i class="flaticon-warning me-1"></i> Dépassement (+{{ totalBenefPct - 100 }}%)
            </span>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button 
              type="button" 
              class="btn btn-sm btn-outline-primary py-1 px-2.5 fs-11 fw-semibold border bg-white"
              @click="splitBenefEvenly"
              title="Diviser équitablement 100% entre tous les bénéficiaires"
            >
              <i class="fas fa-magic me-1"></i>Répartir équitablement
            </button>
          </div>
        </div>

        <div class="progress" style="height: 4px; border-radius: 4px; background-color: #f1f5f9;">
          <div 
            class="progress-bar transition-all" 
            role="progressbar" 
            :style="{ width: Math.min(100, totalBenefPct) + '%' }" 
            :class="totalBenefPct === 100 ? 'bg-success' : totalBenefPct > 100 ? 'bg-danger' : 'bg-warning'"
          ></div>
        </div>
      </div>

      <!-- En-tête des colonnes -->
      <div class="row g-2 align-items-center px-2 py-1 mb-1 text-muted text-uppercase fw-bold fs-11">
        <div class="col-auto text-center" style="width: 28px;">#</div>
        <div class="col-md-5">Nom & Prénoms <span class="text-danger">*</span></div>
        <div class="col-md-3">Lien de Parenté <span class="text-danger">*</span></div>
        <div class="col-md-2">Part (%) <span class="text-danger">*</span></div>
        <div class="col-auto" style="width: 28px;"></div>
      </div>

      <!-- Lignes de bénéficiaires -->
      <div class="beneficiaries-list">
        <div 
          v-for="(b, idx) in form.beneficiaries" 
          :key="idx" 
          class="row g-2 align-items-center p-2 mb-2 rounded border bg-white shadow-xs"
        >
          <div class="col-auto">
            <span class="badge rounded-circle bg-light-primary text-primary d-inline-flex align-items-center justify-content-center" style="width: 28px; height: 28px; font-size: 11px; font-weight: bold;">
              {{ Number(idx) + 1 }}
            </span>
          </div>

          <div class="col-md-5">
            <input 
              type="text" 
              v-model="b.nomPrenoms" 
              class="form-control form-control-sm text-uppercase" 
              placeholder="Ex: KOFFI Jean" 
              required 
            />
          </div>

          <div class="col-md-3">
            <select v-model="b.lienParente" class="form-select form-select-sm" required>
              <option value="" disabled>-- Sélectionner --</option>
              <option 
                v-for="lp in liensParenteOptions" 
                :key="lp.id || lp.code || lp.libelle" 
                :value="lp.libelle || lp.code"
              >
                {{ lp.libelle }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <div class="input-group input-group-sm">
              <input 
                type="number" 
                v-model.number="b.pourcentage" 
                class="form-control text-center fw-bold" 
                min="1" 
                max="100" 
                step="1" 
                required 
              />
              <span class="input-group-text">%</span>
            </div>
          </div>

          <div class="col-auto d-flex align-items-center">
            <button 
              type="button" 
              class="btn btn-sm btn-outline-danger border-0 p-1" 
              @click="removeBeneficiary(Number(idx))"
              :disabled="form.beneficiaries.length <= 1"
              :title="form.beneficiaries.length <= 1 ? 'Au moins un bénéficiaire obligatoire' : 'Retirer ce bénéficiaire'"
            >
              <i class="flaticon-delete fs-14"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Bouton Ajouter -->
      <div class="mt-3">
        <button 
          type="button" 
          class="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
          @click="addBeneficiary"
        >
          <i class="flaticon-plus fs-12"></i>
          <span>Ajouter un autre bénéficiaire</span>
        </button>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- STEP 2 (OBA) : MEMBRES DU GROUPE ASSURÉ                         -->
    <!-- ============================================================== -->
    <div v-else-if="currentStep === 2 && creditType === 'OBA'" class="step-content">
      <div class="row g-3">
        <!-- Colonne 1: Assuré Principal & Ascendants Directs -->
        <div class="col-md-6">
          <div class="d-flex justify-content-between align-items-center mb-2.5 pb-1 border-bottom">
            <span class="fw-semibold text-dark fs-13">
              <i class="fas fa-user-shield text-primary me-1.5"></i>Assuré Principal & Ascendants Directs
            </span>
            <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA / personne</span>
          </div>

          <!-- Assuré Principal -->
          <div class="card p-3 border rounded-3 mb-2.5 bg-white shadow-xs" style="border-left: 3px solid #0d6efd !important;">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2.5">
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; min-width: 36px;">
                  <i class="fas fa-user-check fs-14"></i>
                </div>
                <div>
                  <div class="fw-bold text-dark fs-13">
                    {{ contratDetails?.customer?.lastname }} {{ contratDetails?.customer?.firstname }}
                  </div>
                  <div class="text-muted small fs-11">
                    Titulaire • Né(e) le {{ formatDateDisplay(contratDetails?.customer?.birthdate) }}
                  </div>
                </div>
              </div>
              <div class="text-end">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-11 fw-semibold d-block mb-1">
                  500 000 FCFA
                </span>
                <span class="text-muted small fs-11">
                  {{ calculateAge(contratDetails?.customer?.birthdate) }} ans
                </span>
              </div>
            </div>
          </div>

          <!-- Père Assuré (Ascendant 1) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="form.obaOptions.ascendant1.checked ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="admin-oba-asc1" v-model="form.obaOptions.ascendant1.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="admin-oba-asc1">
                  Père de l'assuré
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA</span>
                <span v-if="form.obaOptions.ascendant1.checked && form.obaOptions.ascendant1.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal bg-success-subtle text-success border border-success-subtle">
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
                </div>
              </div>
            </div>
          </div>

          <!-- Mère Assuré (Ascendant 2) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="form.obaOptions.ascendant2.checked ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="admin-oba-asc2" v-model="form.obaOptions.ascendant2.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="admin-oba-asc2">
                  Mère de l'assuré
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA</span>
                <span v-if="form.obaOptions.ascendant2.checked && form.obaOptions.ascendant2.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal bg-success-subtle text-success border border-success-subtle">
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
            <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA / personne</span>
          </div>

          <!-- Conjoint(e) -->
          <div class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="form.obaOptions.conjoint.checked ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="admin-oba-conj" v-model="form.obaOptions.conjoint.checked" @change="onConjointChange" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="admin-oba-conj">
                  Conjoint(e)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA</span>
                <span v-if="form.obaOptions.conjoint.checked && form.obaOptions.conjoint.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal bg-success-subtle text-success border border-success-subtle">
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
                </div>
              </div>
            </div>
          </div>

          <!-- Père Conjoint(e) (Ascendant 3) -->
          <div v-if="form.obaOptions.conjoint.checked" class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="form.obaOptions.ascendant3.checked ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="admin-oba-asc3" v-model="form.obaOptions.ascendant3.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="admin-oba-asc3">
                  Père du conjoint (Beau-père)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA</span>
                <span v-if="form.obaOptions.ascendant3.checked && form.obaOptions.ascendant3.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal bg-success-subtle text-success border border-success-subtle">
                  {{ calculateAge(form.obaOptions.ascendant3.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="form.obaOptions.ascendant3.checked" class="mt-2.5 pt-2 border-top">
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
                </div>
              </div>
            </div>
          </div>

          <!-- Mère Conjoint(e) (Ascendant 4) -->
          <div v-if="form.obaOptions.conjoint.checked" class="card p-2.5 rounded-3 mb-2.5 border transition-all" :class="form.obaOptions.ascendant4.checked ? 'bg-white shadow-xs border-primary border-opacity-50' : 'bg-light bg-opacity-50 border-light-subtle'">
            <div class="d-flex align-items-center justify-content-between">
              <div class="form-check mb-0 d-flex align-items-center">
                <input class="form-check-input me-2 mt-0 cursor-pointer" type="checkbox" id="admin-oba-asc4" v-model="form.obaOptions.ascendant4.checked" />
                <label class="form-check-label fw-semibold text-dark cursor-pointer fs-13 mb-0" for="admin-oba-asc4">
                  Mère du conjoint (Belle-mère)
                </label>
              </div>
              <div class="d-flex align-items-center gap-1.5">
                <span class="badge bg-light text-muted border px-2 py-0.5 fs-11 fw-normal">500 000 FCFA</span>
                <span v-if="form.obaOptions.ascendant4.checked && form.obaOptions.ascendant4.birthdate" class="badge px-2 py-0.5 fs-11 fw-normal bg-success-subtle text-success border border-success-subtle">
                  {{ calculateAge(form.obaOptions.ascendant4.birthdate) }} ans
                </span>
              </div>
            </div>

            <div v-if="form.obaOptions.ascendant4.checked" class="mt-2.5 pt-2 border-top">
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
                </div>
              </div>
            </div>
          </div>
        </div>
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

          <!-- Carte 2 : Synthèse Spécifique (Bénéficiaires CP ou Membres OBA ou Couverture AMORT) -->
          <!-- Pour CP : Bénéficiaires désignés -->
          <div v-if="creditType === 'CP'" class="card border rounded-3 bg-white shadow-xs overflow-hidden">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-1.5">
                <i class="fas fa-users text-primary fs-12"></i>
                <span class="fw-bold text-dark fs-13">Bénéficiaires désignés</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fs-11 fw-semibold">
                {{ form.beneficiaries?.length || 0 }} ayant(s)-droit ({{ totalBenefPct }}%)
              </span>
            </div>
            <div class="card-body p-2">
              <div v-if="form.beneficiaries?.length" class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0">
                  <thead class="table-light text-muted small">
                    <tr>
                      <th class="py-1 px-2 fs-11 text-uppercase fw-semibold">Nom & Prénoms</th>
                      <th class="py-1 px-2 fs-11 text-uppercase fw-semibold">Lien</th>
                      <th class="py-1 px-2 fs-11 text-uppercase fw-semibold text-end">Quote-part</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, bIdx) in form.beneficiaries" :key="bIdx">
                      <td class="py-1.5 px-2 fw-semibold text-dark fs-12">{{ b.nomPrenoms || '-' }}</td>
                      <td class="py-1.5 px-2 text-muted fs-12">{{ b.lienParente || '-' }}</td>
                      <td class="py-1.5 px-2 text-end">
                        <span class="badge bg-success-subtle text-success fw-bold px-2 py-0.5 fs-11">{{ b.pourcentage }}%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted small text-center py-2 fs-12">
                Aucun bénéficiaire désigné
              </div>
            </div>
          </div>

          <!-- Pour OBA : Membres du groupe assuré -->
          <div v-else-if="creditType === 'OBA'" class="card border rounded-3 bg-white shadow-xs overflow-hidden">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-1.5">
                <i class="fas fa-users text-primary fs-12"></i>
                <span class="fw-bold text-dark fs-13">Membres du groupe assuré</span>
              </div>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 fs-11 fw-semibold">
                {{ obaIncludedMembersCount }} assuré(s)
              </span>
            </div>
            <div class="card-body p-2">
              <div class="d-flex flex-column gap-1.5">
                <div class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="fw-semibold text-dark fs-12">ASSURÉ PRINCIPAL</span>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.conjoint?.checked" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-semibold text-dark fs-12">CONJOINT(E) : </span>
                    <span class="text-muted fs-12">{{ form.obaOptions.conjoint.lastname }} {{ form.obaOptions.conjoint.firstname }}</span>
                  </div>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant1?.checked" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-semibold text-dark fs-12">PÈRE : </span>
                    <span class="text-muted fs-12">{{ form.obaOptions.ascendant1.lastname }} {{ form.obaOptions.ascendant1.firstname }}</span>
                  </div>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant2?.checked" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-semibold text-dark fs-12">MÈRE : </span>
                    <span class="text-muted fs-12">{{ form.obaOptions.ascendant2.lastname }} {{ form.obaOptions.ascendant2.firstname }}</span>
                  </div>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant3?.checked" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-semibold text-dark fs-12">PÈRE CONJOINT : </span>
                    <span class="text-muted fs-12">{{ form.obaOptions.ascendant3.lastname }} {{ form.obaOptions.ascendant3.firstname }}</span>
                  </div>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
                <div v-if="form.obaOptions.ascendant4?.checked" class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <div>
                    <span class="fw-semibold text-dark fs-12">MÈRE CONJOINT : </span>
                    <span class="text-muted fs-12">{{ form.obaOptions.ascendant4.lastname }} {{ form.obaOptions.ascendant4.firstname }}</span>
                  </div>
                  <span class="badge bg-primary-subtle text-primary fs-11 px-2 py-0.5">500 000 FCFA</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pour AMORT : Synthèse financière -->
          <div v-else class="card border rounded-3 bg-white shadow-xs overflow-hidden">
            <div class="card-header bg-light bg-opacity-75 border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-1.5">
                <i class="fas fa-shield-alt text-primary fs-12"></i>
                <span class="fw-bold text-dark fs-13">Garantie & Couverture</span>
              </div>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fs-11 fw-semibold">
                Crédit Amortissable
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
                <div class="p-1.5 px-2.5 rounded bg-light border d-flex justify-content-between align-items-center">
                  <span class="text-muted fs-12 fw-semibold">Différé d'amortissement</span>
                  <strong class="text-dark fs-13">{{ form.dureeeDifferee }} mois</strong>
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
import { success, error, warning } from '../../utils/utils';

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
    const liensParenteOptions = ref<any[]>([
      { id: 1, code: 'PERE', libelle: 'PERE' },
      { id: 2, code: 'MERE', libelle: 'MERE' },
      { id: 3, code: 'ENFANT', libelle: 'ENFANT' },
      { id: 4, code: 'CONJOINT', libelle: 'CONJOINT(E)' },
      { id: 5, code: 'FRERE', libelle: 'FRERE' },
      { id: 6, code: 'SOEUR', libelle: 'SOEUR' },
      { id: 7, code: 'AUTRE', libelle: 'AUTRE' }
    ]);

    // Formulaire principal
    const form = ref<any>({
      reference: '',
      idNatureCredit: 1,
      capital: 0,
      duration: 12,
      idPeriodicite: 1,
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
      // Primes éditables manuellement par l'admin
      pd: 0,
      pc: 0,
      surp: 0,
      fm: 0,
      acc: 0,
      puttc: 0,
      beneficiaries: [],
      obaOptions: {
        conjoint:   { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant1: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant2: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant3: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant4: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' }
      }
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
      const code = selectedNatureCode.value;
      if (code === 'CP') return 'CP';
      if (code === 'OBA') return 'OBA';
      return 'AMORT';
    });

    // Total steps (3 si CP ou OBA, 2 si AMORT)
    const totalSteps = computed(() => {
      return (creditType.value === 'CP' || creditType.value === 'OBA') ? 3 : 2;
    });

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

      let obaOpts = {
        conjoint:   { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant1: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant2: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' },
        ascendant3: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'M' },
        ascendant4: { checked: false, lastname: '', firstname: '', birthdate: '', gender: 'F' }
      };

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

      form.value = {
        reference: c.reference || c.refContrat || c.numPolice || '',
        idNatureCredit: c.idNatureCredit || c.natureCredit?.id || 1,
        capital: Number(c.capital) || 0,
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
        // Primes initialisées avec les montants actuels du contrat
        pd: Number(c.pd || 0),
        pc: Number(c.pc || 0),
        surp: Number(c.surp || 0),
        fm: Number(c.fm || 0),
        acc: Number(c.acc || 0),
        puttc: Number(c.puttc || 0),
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

    const onConjointChange = () => {
      if (!form.value.obaOptions.conjoint.checked) {
        form.value.obaOptions.ascendant3.checked = false;
        form.value.obaOptions.ascendant4.checked = false;
      }
    };

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

    // Bénéficiaires CP
    const totalBenefPct = computed(() => {
      if (!form.value.beneficiaries || !Array.isArray(form.value.beneficiaries)) return 0;
      return form.value.beneficiaries.reduce((sum: number, b: any) => sum + (Number(b.pourcentage) || 0), 0);
    });

    const addBeneficiary = () => {
      const currentSum = totalBenefPct.value;
      const rem = Math.max(0, 100 - currentSum);
      form.value.beneficiaries.push({
        nomPrenoms: '',
        lienParente: '',
        pourcentage: rem > 0 ? rem : 0
      });
    };

    const removeBeneficiary = (idx: number | string) => {
      if (form.value.beneficiaries.length <= 1) {
        warning('Au moins un bénéficiaire est obligatoire.');
        return;
      }
      form.value.beneficiaries.splice(Number(idx), 1);
    };

    const splitBenefEvenly = () => {
      const n = form.value.beneficiaries.length;
      if (n === 0) return;
      const base = Math.floor(100 / n);
      const rem = 100 - (base * n);
      form.value.beneficiaries.forEach((b: any, idx: number) => {
        b.pourcentage = base + (idx === 0 ? rem : 0);
      });
    };

    // OBA Count
    const obaIncludedMembersCount = computed(() => {
      let count = 1; // Assuré principal
      const o = form.value.obaOptions;
      if (o.conjoint?.checked) count++;
      if (o.ascendant1?.checked) count++;
      if (o.ascendant2?.checked) count++;
      if (o.ascendant3?.checked) count++;
      if (o.ascendant4?.checked) count++;
      return count;
    });

    const calculateAge = (birthdate: string | null | undefined): number => {
      if (!birthdate) return 0;
      const birth = new Date(birthdate);
      if (isNaN(birth.getTime())) return 0;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
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

      if (creditType.value === 'AMORT') {
        compList.push({
          label: 'Périodicité',
          oldVal: currentPer?.libelle || c.periodicite?.libelle || 'Mensuelle',
          newVal: newPer?.libelle || 'Mensuelle',
          changed: currentPer?.id !== newPer?.id
        });
        compList.push({
          label: 'Différé (mois)',
          oldVal: `${c.differe || 0} mois`,
          newVal: `${form.value.dureeeDifferee || 0} mois`,
          changed: Number(c.differe || 0) !== Number(form.value.dureeeDifferee || 0)
        });
        compList.push({
          label: 'Taux d\'intérêt',
          oldVal: `${c.taux || 0}%`,
          newVal: `${form.value.tauxInteret || 0}%`,
          changed: Number(c.taux || 0) !== Number(form.value.tauxInteret || 0)
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
      if (step < currentStep.value) {
        currentStep.value = step;
      } else if (step === 2 && isStep1Valid.value) {
        currentStep.value = 2;
      } else if (step === totalSteps.value && isCurrentStepValid.value) {
        currentStep.value = totalSteps.value;
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

    const fetchLiensParente = async () => {
      try {
        const res = await ApiService.get('/lien-parente');
        const list = res.data?.liensParente || res.data?.data?.liensParente || res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          liensParenteOptions.value = list.filter((item: any) => item.isActive !== false);
        }
      } catch (err) {
        console.warn('Utilisation des liens de parenté par défaut');
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
          differe: Number(form.value.dureeeDifferee || 0),
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
          // Primes saisies manuellement par l'administrateur
          pd: Number(form.value.pd) || 0,
          pc: Number(form.value.pc) || 0,
          surp: Number(form.value.surp) || 0,
          fm: Number(form.value.fm) || 0,
          acc: Number(form.value.acc) || 0,
          puttc: Number(form.value.puttc) || 0
        };

        if (creditType.value === 'OBA') {
          const rawOpts = form.value.obaOptions;
          const mappedOpts: any = {
            assure: {
              checked: true,
              birthdate: props.contratDetails?.customer?.birthdate?.split('T')[0] || form.value.dateEffet,
              lastname: props.contratDetails?.customer?.lastname || '',
              firstname: props.contratDetails?.customer?.firstname || '',
              gender: props.contratDetails?.customer?.gender || 'M',
              capitalAssure: 500000,
              prime: 2000
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
                capitalAssure: opt.checked ? 500000 : 0,
                prime: opt.checked ? (key.startsWith('ascendant') ? 2500 : 2000) : 0
              };
            }
          }
          payload.obaOptions = mappedOpts;
        }

        if (creditType.value === 'CP') {
          payload.beneficiaries = form.value.beneficiaries;
        }

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
      fetchLiensParente();
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
      liensParenteOptions,
      form,
      creditType,
      selectedNatureCode,
      maxCapital,
      minDuration,
      maxDuration,
      isCurrentStepValid,
      isStep1Valid,
      isStep2Valid,
      totalBenefPct,
      obaIncludedMembersCount,
      comparisons,
      addBeneficiary,
      removeBeneficiary,
      splitBenefEvenly,
      onConjointChange,
      recalcSumTotalPuttc,
      onSubPrimeInput,
      calculateAge,
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
