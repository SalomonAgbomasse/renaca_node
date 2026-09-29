<template>
  <!-- Modal d'import de contrats RENACA -->
  <Modal
    :is-visible="isVisible"
    title="Importer des contrats RENACA depuis Excel"
    icon="flaticon-upload"
    :size="hasData ? 'xxlarge' : 'large'"
    @close="closeModal"
    @update:is-visible="$emit('update:visible', $event)"
  >
    <!-- Section Dépôt & Téléchargement des Modèles -->
    <div v-if="!hasData || showInstructions" class="py-1 mb-3">
      <!-- 1. Zone d'Upload Directe -->
      <div class="mb-3">
        <DragDropUpload
          @file-selected="handleFileUpload"
          @upload-error="handleUploadError"
          :accepted-types="'.xlsx,.xls'"
          :allowed-mime-types="[
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/excel',
            'application/x-excel',
            'application/x-msexcel'
          ]"
          :max-size="10 * 1024 * 1024"
          title="Glissez et déposez votre fichier Excel ici"
          subtitle="ou <span class='text-primary fw-medium'>cliquez pour parcourir vos fichiers</span>"
          hint="Formats acceptés : .xlsx, .xls (max 10 Mo) — 1 ou 2 onglets (AMORT / CONST)"
          height="160px"
        />
      </div>

      <!-- 2. Barre de téléchargement des modèles -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2.5 px-3 bg-light rounded-3 border">
        <div class="d-flex align-items-center text-muted small">
          <i class="flaticon-download text-primary fs-5 me-2"></i>
          <div>
            <span class="fw-semibold text-dark d-block">Besoin d'un modèle vierge ?</span>
            <span class="text-muted" style="font-size: 11px;">Téléchargez un modèle Excel préformaté :</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button
            @click="downloadTemplate('AMORT')"
            class="btn btn-xs btn-outline-primary fw-semibold rounded-pill px-3 py-1.5"
            type="button"
          >
            Modèle Amortissable
          </button>
          <button
            @click="downloadTemplate('CONST')"
            class="btn btn-xs btn-outline-success fw-semibold rounded-pill px-3 py-1.5"
            type="button"
          >
            Modèle Constant
          </button>
          <button
            @click="downloadAllWorkbook"
            class="btn btn-xs btn-outline-secondary fw-semibold rounded-pill px-3 py-1.5"
            type="button"
            title="Classeur avec onglets AMORT et CONST"
          >
            Classeur complet (2 onglets)
          </button>
        </div>
      </div>
    </div>

    <!-- Tabbed Data Preview -->
    <div v-if="hasData" class="mt-3">
      <!-- Résultats de l'import -->
      <div v-if="showImportResults && importResults" class="mb-3">
        <div class="alert alert-info border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h6 class="mb-1 fw-bold">Importation terminée :</h6>
              <span class="badge bg-success fs-7 px-3 py-2 me-2">{{ getImportSummary()?.success || 0 }} contrat(s) créé(s) avec succès</span>
              <span class="badge bg-danger fs-7 px-3 py-2">{{ getImportSummary()?.failed || 0 }} échec(s)</span>
            </div>
            <div class="d-flex gap-2">
              <button
                @click="startNewImport"
                class="btn btn-sm btn-outline-primary"
              >
                <i class="flaticon-plus me-1"></i>
                Nouvel import
              </button>
              <button
                v-if="getImportSummary()?.success > 0"
                @click="downloadAllPDFs"
                :disabled="isGeneratingPDF"
                class="btn btn-sm btn-primary"
              >
                <i v-if="!isGeneratingPDF" class="flaticon-download me-1"></i>
                <i v-else class="bi bi-arrow-clockwise me-1 fa-spin"></i>
                {{ isGeneratingPDF ? 'Génération...' : 'Télécharger tous les PDFs' }}
              </button>
            </div>
          </div>

          <!-- Détail des échecs -->
          <div v-if="getImportResults()?.results && getImportResults().results.some(r => !r.success)" class="mt-3">
            <h6 class="text-danger fw-bold">Détails des échecs :</h6>
            <div class="small" style="max-height: 120px; overflow-y: auto;">
              <div
                v-for="(result, index) in getImportResults().results.filter(r => !r.success)"
                :key="index"
                class="text-danger mb-2 p-2 bg-light border-start border-3 border-danger rounded"
              >
                <strong>Ligne {{ result.index + 1 }} :</strong>
                <span class="ms-2">{{ result.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs header : AMORT / CONST -->
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'AMORT' }"
            @click="activeTab = 'AMORT'"
            type="button"
          >
            <i class="flaticon-file me-2"></i>
            Crédit Amortissable (AMORT)
            <span class="badge bg-secondary ms-1">{{ importDataAmort.length }}</span>
          </button>
        </li>

        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'CONST' }"
            @click="activeTab = 'CONST'"
            type="button"
          >
            <i class="flaticon-file me-2"></i>
            Capital Constant (CONST)
            <span class="badge bg-secondary ms-1">{{ importDataConst.length }}</span>
          </button>
        </li>
      </ul>

      <!-- Options prévisualisation -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 class="mb-0">
            <i class="flaticon-eye me-2 text-info"></i>
            Aperçu : {{ getActiveTabTitle() }} ({{ activeTabData.length }} contrat(s))
          </h6>
          <small class="text-muted">Cliquez sur un champ pour le modifier en ligne si nécessaire</small>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button
            @click="showInstructions = !showInstructions"
            class="btn btn-sm"
            :class="showInstructions ? 'btn-secondary text-white' : 'btn-outline-primary'"
          >
            <i class="flaticon-upload me-1"></i>
            {{ showInstructions ? 'Masquer zone d’import' : 'Changer de fichier' }}
          </button>
          <button
            @click="addNewRow"
            class="btn btn-sm btn-outline-success"
            :disabled="isAddingNewRow"
          >
            <i class="flaticon-plus me-1"></i>
            Ajouter une ligne
          </button>
          <button
            @click="clearAllData"
            class="btn btn-sm btn-outline-danger"
          >
            <i class="flaticon-trash me-1"></i>
            Vider tout
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-responsive">
        <table class="table table-striped table-hover align-middle">
          <thead class="table-dark">
            <tr class="text-nowrap">
              <th style="width: 3%;">#</th>
              <th>Nom*</th>
              <th>Prénom*</th>
              <th>Date Naissance*</th>
              <th>Lieu Naissance*</th>
              <th>Sexe*</th>
              <th>Profession*</th>
              <th>Téléphone*</th>
              <th>Email</th>
              <th>Adresse*</th>

              <!-- AMORT -->
              <template v-if="activeTab === 'AMORT'">
                <th>Capital (FCFA)*</th>
                <th>Durée (mois)*</th>
                <th>Date Effet*</th>
                <th>1re Échéance*</th>
                <th>Taux (%)*</th>
                <th>Périodicité*</th>
                <th>Perte Emploi</th>
                <th>Référence</th>
              </template>

              <!-- CONST -->
              <template v-else-if="activeTab === 'CONST'">
                <th>Capital (FCFA)*</th>
                <th>Durée (mois)*</th>
                <th>Date Effet*</th>
                <th>1re Échéance*</th>
                <th>Taux (%)*</th>
                <th>Périodicité*</th>
                <th>Référence</th>
              </template>

              <th>Statut</th>
              <th style="width: 5%;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in activeTabDataSliced"
              :key="index"
              :class="{
                'table-warning': isAddingNewRow && editingRow === index,
                'row-imported': row.importSuccess
              }"
            >
              <td class="text-center fw-bold text-muted">
                {{ index + 1 }}
              </td>

              <!-- Nom -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'nom'"
                  v-model="row.nom"
                  @blur="updateField(index, 'nom', row.nom); stopEditing()"
                  @keyup.enter="updateField(index, 'nom', row.nom); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 80px;"
                />
                <span v-else @click="startEditing(index, 'nom')" class="editable-field">{{ row.nom || '-' }}</span>
              </td>

              <!-- Prénom -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'prenom'"
                  v-model="row.prenom"
                  @blur="updateField(index, 'prenom', row.prenom); stopEditing()"
                  @keyup.enter="updateField(index, 'prenom', row.prenom); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 80px;"
                />
                <span v-else @click="startEditing(index, 'prenom')" class="editable-field">{{ row.prenom || '-' }}</span>
              </td>

              <!-- Date de naissance -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'dateNaissance'"
                  v-model="row.dateNaissance"
                  @blur="updateField(index, 'dateNaissance', row.dateNaissance); stopEditing()"
                  @keyup.enter="updateField(index, 'dateNaissance', row.dateNaissance); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 100px;"
                  placeholder="DD/MM/YYYY"
                />
                <span v-else @click="startEditing(index, 'dateNaissance')" class="editable-field">
                  {{ formatDateForUI(row.dateNaissance) }}
                </span>
              </td>

              <!-- Lieu naissance -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'lieuNaissance'"
                  v-model="row.lieuNaissance"
                  @blur="updateField(index, 'lieuNaissance', row.lieuNaissance); stopEditing()"
                  @keyup.enter="updateField(index, 'lieuNaissance', row.lieuNaissance); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 100px;"
                />
                <span v-else @click="startEditing(index, 'lieuNaissance')" class="editable-field">{{ row.lieuNaissance || '-' }}</span>
              </td>

              <!-- Sexe -->
              <td>
                <select
                  v-if="editingRow === index && editingField === 'sexe'"
                  v-model="row.sexe"
                  @change="updateField(index, 'sexe', row.sexe); stopEditing()"
                  class="form-select form-select-sm"
                  style="min-width: 65px;"
                >
                  <option value="">-</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
                <span v-else @click="startEditing(index, 'sexe')" class="editable-field">{{ row.sexe || '-' }}</span>
              </td>

              <!-- Profession -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'profession'"
                  v-model="row.profession"
                  @blur="updateField(index, 'profession', row.profession); stopEditing()"
                  @keyup.enter="updateField(index, 'profession', row.profession); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 80px;"
                />
                <span v-else @click="startEditing(index, 'profession')" class="editable-field">{{ row.profession || '-' }}</span>
              </td>

              <!-- Téléphone -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'telephone'"
                  v-model="row.telephone"
                  @blur="updateField(index, 'telephone', row.telephone); stopEditing()"
                  @keyup.enter="updateField(index, 'telephone', row.telephone); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 100px;"
                />
                <span v-else @click="startEditing(index, 'telephone')" class="editable-field">{{ row.telephone || '-' }}</span>
              </td>

              <!-- Email -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'email'"
                  v-model="row.email"
                  @blur="updateField(index, 'email', row.email); stopEditing()"
                  @keyup.enter="updateField(index, 'email', row.email); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 120px;"
                  type="email"
                />
                <span v-else @click="startEditing(index, 'email')" class="editable-field">{{ row.email || '-' }}</span>
              </td>

              <!-- Adresse -->
              <td>
                <input
                  v-if="editingRow === index && editingField === 'adresse'"
                  v-model="row.adresse"
                  @blur="updateField(index, 'adresse', row.adresse); stopEditing()"
                  @keyup.enter="updateField(index, 'adresse', row.adresse); stopEditing()"
                  class="form-control form-control-sm"
                  style="min-width: 100px;"
                />
                <span v-else @click="startEditing(index, 'adresse')" class="editable-field">{{ row.adresse || '-' }}</span>
              </td>

              <!-- ============================================ -->
              <!-- COLONNES SPÉCIFIQUES : AMORT -->
              <!-- ============================================ -->
              <template v-if="activeTab === 'AMORT'">
                <!-- Capital -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'capital'"
                    v-model.number="row.capital"
                    @blur="updateField(index, 'capital', row.capital); stopEditing()"
                    @keyup.enter="updateField(index, 'capital', row.capital); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 90px;"
                    type="number"
                  />
                  <span v-else @click="startEditing(index, 'capital')" class="editable-field">
                    {{ row.capital ? row.capital.toLocaleString('fr-FR') : '-' }}
                  </span>
                </td>

                <!-- Durée -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'duree'"
                    v-model.number="row.duree"
                    @blur="updateField(index, 'duree', row.duree); stopEditing()"
                    @keyup.enter="updateField(index, 'duree', row.duree); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 60px;"
                    type="number"
                  />
                  <span v-else @click="startEditing(index, 'duree')" class="editable-field">{{ row.duree || '-' }}</span>
                </td>

                <!-- Date Effet -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'dateEffet'"
                    v-model="row.dateEffet"
                    @blur="updateField(index, 'dateEffet', row.dateEffet); stopEditing()"
                    @keyup.enter="updateField(index, 'dateEffet', row.dateEffet); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 100px;"
                    placeholder="DD/MM/YYYY"
                  />
                  <span v-else @click="startEditing(index, 'dateEffet')" class="editable-field">
                    {{ formatDateForUI(row.dateEffet) }}
                  </span>
                </td>

                <!-- 1re Échéance -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'datePremiereEcheance'"
                    v-model="row.datePremiereEcheance"
                    @blur="updateField(index, 'datePremiereEcheance', row.datePremiereEcheance); stopEditing()"
                    @keyup.enter="updateField(index, 'datePremiereEcheance', row.datePremiereEcheance); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 100px;"
                    placeholder="DD/MM/YYYY"
                  />
                  <span v-else @click="startEditing(index, 'datePremiereEcheance')" class="editable-field">
                    {{ formatDateForUI(row.datePremiereEcheance) }}
                  </span>
                </td>

                <!-- Taux -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'taux'"
                    v-model.number="row.taux"
                    @blur="updateField(index, 'taux', row.taux); stopEditing()"
                    @keyup.enter="updateField(index, 'taux', row.taux); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 60px;"
                    type="number"
                    step="0.01"
                  />
                  <span v-else @click="startEditing(index, 'taux')" class="editable-field">{{ row.taux !== undefined ? row.taux : '-' }}</span>
                </td>

                <!-- Périodicité -->
                <td>
                  <select
                    v-if="editingRow === index && editingField === 'idPeriodicite'"
                    v-model.number="row.idPeriodicite"
                    @change="updateField(index, 'idPeriodicite', row.idPeriodicite); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 120px;"
                  >
                    <option v-for="p in periodicites" :key="p.id" :value="p.id">{{ p.libelle }}</option>
                  </select>
                  <span v-else @click="startEditing(index, 'idPeriodicite')" class="editable-field">
                    {{ getPeriodiciteLabel(row.idPeriodicite) }}
                  </span>
                </td>

                <!-- Perte Emploi -->
                <td>
                  <select
                    v-if="editingRow === index && editingField === 'perteEmploi'"
                    v-model="row.perteEmploi"
                    @change="updateField(index, 'perteEmploi', row.perteEmploi); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 75px;"
                  >
                    <option value="OUI">OUI</option>
                    <option value="NON">NON</option>
                  </select>
                  <span v-else @click="startEditing(index, 'perteEmploi')" class="editable-field">{{ row.perteEmploi || 'NON' }}</span>
                </td>

                <!-- Référence -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'reference'"
                    v-model="row.reference"
                    @blur="updateField(index, 'reference', row.reference); stopEditing()"
                    @keyup.enter="updateField(index, 'reference', row.reference); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 80px;"
                  />
                  <span v-else @click="startEditing(index, 'reference')" class="editable-field">{{ row.reference || '-' }}</span>
                </td>
              </template>

              <!-- ============================================ -->
              <!-- COLONNES SPÉCIFIQUES : CAPITAL CONSTANT -->
              <!-- ============================================ -->
              <template v-else-if="activeTab === 'CONST'">
                <!-- Capital -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'capital'"
                    v-model.number="row.capital"
                    @blur="updateField(index, 'capital', row.capital); stopEditing()"
                    @keyup.enter="updateField(index, 'capital', row.capital); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 90px;"
                    type="number"
                  />
                  <span v-else @click="startEditing(index, 'capital')" class="editable-field">
                    {{ row.capital ? row.capital.toLocaleString('fr-FR') : '-' }}
                  </span>
                </td>

                <!-- Durée -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'duree'"
                    v-model.number="row.duree"
                    @blur="updateField(index, 'duree', row.duree); stopEditing()"
                    @keyup.enter="updateField(index, 'duree', row.duree); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 60px;"
                    type="number"
                  />
                  <span v-else @click="startEditing(index, 'duree')" class="editable-field">{{ row.duree || '-' }}</span>
                </td>

                <!-- Date Effet -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'dateEffet'"
                    v-model="row.dateEffet"
                    @blur="updateField(index, 'dateEffet', row.dateEffet); stopEditing()"
                    @keyup.enter="updateField(index, 'dateEffet', row.dateEffet); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 100px;"
                    placeholder="DD/MM/YYYY"
                  />
                  <span v-else @click="startEditing(index, 'dateEffet')" class="editable-field">
                    {{ formatDateForUI(row.dateEffet) }}
                  </span>
                </td>

                <!-- 1re Échéance -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'datePremiereEcheance'"
                    v-model="row.datePremiereEcheance"
                    @blur="updateField(index, 'datePremiereEcheance', row.datePremiereEcheance); stopEditing()"
                    @keyup.enter="updateField(index, 'datePremiereEcheance', row.datePremiereEcheance); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 100px;"
                    placeholder="DD/MM/YYYY"
                  />
                  <span v-else @click="startEditing(index, 'datePremiereEcheance')" class="editable-field">
                    {{ formatDateForUI(row.datePremiereEcheance) }}
                  </span>
                </td>

                <!-- Taux -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'taux'"
                    v-model.number="row.taux"
                    @blur="updateField(index, 'taux', row.taux); stopEditing()"
                    @keyup.enter="updateField(index, 'taux', row.taux); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 60px;"
                    type="number"
                    step="0.01"
                  />
                  <span v-else @click="startEditing(index, 'taux')" class="editable-field">{{ row.taux !== undefined ? row.taux : '-' }}</span>
                </td>

                <!-- Périodicité -->
                <td>
                  <select
                    v-if="editingRow === index && editingField === 'idPeriodicite'"
                    v-model.number="row.idPeriodicite"
                    @change="updateField(index, 'idPeriodicite', row.idPeriodicite); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 120px;"
                  >
                    <option v-for="p in periodicites" :key="p.id" :value="p.id">{{ p.libelle }}</option>
                  </select>
                  <span v-else @click="startEditing(index, 'idPeriodicite')" class="editable-field">
                    {{ getPeriodiciteLabel(row.idPeriodicite) }}
                  </span>
                </td>

                <!-- Référence -->
                <td>
                  <input
                    v-if="editingRow === index && editingField === 'reference'"
                    v-model="row.reference"
                    @blur="updateField(index, 'reference', row.reference); stopEditing()"
                    @keyup.enter="updateField(index, 'reference', row.reference); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 80px;"
                  />
                  <span v-else @click="startEditing(index, 'reference')" class="editable-field">{{ row.reference || '-' }}</span>
                </td>
              </template>

              <!-- Statut -->
              <td>
                <div v-if="row.importSuccess" class="text-center">
                  <span class="badge bg-success">✓ Importé</span>
                </div>
                <div v-else-if="row.importError" class="text-center">
                  <div class="badge bg-danger mb-1">✗ Échec Import</div>
                  <div class="small text-danger fw-semibold" style="max-width: 150px; font-size: 0.72rem;" :title="row.importError">
                    {{ row.importError }}
                  </div>
                </div>
                <div v-else-if="getValidationStatus(row).isValid && getValidationStatus(row).warnings.length === 0" class="text-center">
                  <span class="badge bg-success">✓ Validé</span>
                </div>
                <div v-else-if="getValidationStatus(row).isValid && getValidationStatus(row).warnings.length > 0" class="text-center">
                  <div class="badge bg-warning text-dark mb-1">⚠ {{ getValidationStatus(row).warnings.length }} avertissement(s)</div>
                  <div class="small text-warning" style="max-width: 180px;">
                    <div v-for="(warning, warningIndex) in getValidationStatus(row).warnings" :key="warningIndex" class="text-start text-truncate">
                      • {{ warning }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-center">
                  <div class="badge bg-danger mb-1">✗ {{ getValidationStatus(row).errors.length }} erreur(s)</div>
                  <div class="small text-danger" style="max-width: 180px;">
                    <div v-for="(errorMsg, errorIndex) in getValidationStatus(row).errors" :key="errorIndex" class="text-start">
                      • {{ errorMsg }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td>
                <button
                  @click="removeRow(index)"
                  class="btn btn-xs btn-outline-danger p-1"
                  title="Supprimer cette ligne"
                >
                  <i class="flaticon-delete"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Résumé de l'onglet actif -->
      <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
        <div class="d-flex gap-2">
          <div class="badge bg-secondary px-3 py-2">
            <span class="fw-bold fs-6">{{ activeTabSummary.total }}</span>
            <span class="ms-1 small">Total</span>
          </div>
          <div class="badge bg-success px-3 py-2">
            <span class="fw-bold fs-6">{{ activeTabSummary.valid }}</span>
            <span class="ms-1 small">Valides</span>
          </div>
          <div class="badge bg-warning text-dark px-3 py-2">
            <span class="fw-bold fs-6">{{ activeTabSummary.warnings }}</span>
            <span class="ms-1 small">Avertissements</span>
          </div>
          <div class="badge bg-danger px-3 py-2">
            <span class="fw-bold fs-6">{{ activeTabSummary.errors }}</span>
            <span class="ms-1 small">Erreurs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer buttons -->
    <template #footer>
      <div class="d-flex flex-wrap gap-2 justify-content-end w-100">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="closeModal">
          <i class="flaticon-cancel me-1"></i>
          Fermer
        </button>

        <button
          type="button"
          class="btn btn-sm"
          v-if="hasData && globalSummary.valid > 0"
          :class="isImporting ? 'btn-warning' : 'btn-success'"
          :disabled="isImporting"
          @click="importContracts"
        >
          <i v-if="!isImporting" class="flaticon-upload me-1"></i>
          <i v-else class="flaticon-refresh me-1 fa-spin"></i>
          {{ isImporting ? 'Import en cours...' : `Importer ${globalSummary.valid} contrat(s)` }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import ApiService from '../../services/ApiService';
import { success, error } from '../../utils/utils';
import DragDropUpload from '../DragDropUpload.vue';
import Modal from './Modal.vue';

export default defineComponent({
  name: 'ImportContratModal',
  components: {
    DragDropUpload,
    Modal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['import-success', 'import-error', 'update:visible'],
  setup(props, { emit }) {
    // Arrays for the two real RENACA natures
    const importDataAmort = ref<any[]>([]);
    const importDataConst = ref<any[]>([]);

    // UI state
    const activeTab = ref<'AMORT' | 'CONST'>('AMORT');
    const showImportResults = ref(false);
    const isImporting = ref(false);
    const isGeneratingPDF = ref(false);
    const importResults = ref<any>(null);
    const showInstructions = ref(false);

    // Inline editing states
    const editingRow = ref<number | null>(null);
    const editingField = ref<string | null>(null);
    const isAddingNewRow = ref(false);

    // Natures de crédit et périodicités (chargées depuis le vrai backend)
    const natureCredits = ref<any[]>([]);
    const periodicites = ref<any[]>([]);

    const loadNatureCredits = async () => {
      try {
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
        console.error('Erreur chargement natures de crédit:', err);
        natureCredits.value = [
          { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT' },
          { id: 2, libelle: 'CONSTANT', code: 'CONST' }
        ];
      }
    };

    const loadPeriodicites = async () => {
      try {
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
      } catch (err) {
        console.error('Erreur chargement périodicités:', err);
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
    };

    const getNatureCreditId = (code: 'AMORT' | 'CONST'): number => {
      const nc = natureCredits.value.find((n: any) => n.code === code);
      return nc ? nc.id : (code === 'AMORT' ? 1 : 2);
    };

    const getPeriodiciteLabel = (id: number | undefined): string => {
      const p = periodicites.value.find((per: any) => per.id === id);
      return p ? p.libelle : '-';
    };

    const resolvePeriodiciteId = (label: any): number => {
      if (label === undefined || label === null || label === '') return periodicites.value[0]?.id || 1;
      if (typeof label === 'number') {
        const byId = periodicites.value.find((p: any) => p.id === label);
        if (byId) return byId.id;
      }
      const clean = String(label).trim().toUpperCase();
      const match = periodicites.value.find((p: any) => (p.libelle || '').toUpperCase().includes(clean) || clean.includes((p.libelle || '').toUpperCase()));
      return match ? match.id : (periodicites.value[0]?.id || 1);
    };

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        loadNatureCredits();
        loadPeriodicites();
      }
    });

    onMounted(() => {
      if (props.visible) {
        loadNatureCredits();
        loadPeriodicites();
      }
    });

    // Computed properties
    const hasData = computed(() => {
      return importDataAmort.value.length > 0 || importDataConst.value.length > 0;
    });

    const activeTabData = computed(() => {
      if (activeTab.value === 'AMORT') return importDataAmort.value;
      if (activeTab.value === 'CONST') return importDataConst.value;
      return [];
    });

    const activeTabDataSliced = computed(() => {
      return activeTabData.value;
    });

    const getActiveTabTitle = () => {
      if (activeTab.value === 'AMORT') return 'Crédit Amortissable';
      if (activeTab.value === 'CONST') return 'Capital Constant';
      return '';
    };

    // Active tab summary
    const activeTabSummary = computed(() => {
      const data = activeTabData.value;
      const total = data.length;
      let valid = 0;
      let warnings = 0;
      let errors = 0;
      let imported = 0;

      data.forEach(row => {
        if (row.importSuccess) {
          imported++;
          return;
        }
        const validation = validateRowData(row, activeTab.value);
        if (!validation.isValid) {
          errors++;
        } else if (validation.warnings.length > 0) {
          warnings++;
          valid++;
        } else {
          valid++;
        }
      });

      return { total, valid, warnings, errors, imported };
    });

    const globalSummary = computed(() => {
      let valid = 0;
      let errors = 0;
      let total = 0;
      let imported = 0;

      const processArray = (arr: any[], type: 'AMORT' | 'CONST') => {
        arr.forEach(row => {
          total++;
          if (row.importSuccess) {
            imported++;
            return;
          }
          const validation = validateRowData(row, type);
          if (!validation.isValid) errors++;
          else valid++;
        });
      };

      processArray(importDataAmort.value, 'AMORT');
      processArray(importDataConst.value, 'CONST');

      return { total, valid, errors, imported };
    });

    // Row edit inline handlers
    const startEditing = (row: number, field: string) => {
      editingRow.value = row;
      editingField.value = field;
    };

    const stopEditing = () => {
      editingRow.value = null;
      editingField.value = null;
      isAddingNewRow.value = false;
    };

    const updateField = (rowIndex: number, field: string, value: any) => {
      const targetArray = activeTab.value === 'AMORT' ? importDataAmort.value : importDataConst.value;

      if (targetArray[rowIndex]) {
        targetArray[rowIndex][field] = value;

        // Si la date d'effet est modifiée, ajuster la 1re échéance si elle est antérieure
        if (field === 'dateEffet') {
          const effIso = convertDateToISO(value);
          const premIso = convertDateToISO(targetArray[rowIndex].datePremiereEcheance);
          if (effIso && (!premIso || premIso < effIso)) {
            const dEff = new Date(effIso);
            if (!isNaN(dEff.getTime())) {
              const dPrem = new Date(dEff);
              dPrem.setMonth(dPrem.getMonth() + 1);
              const dStr = String(dPrem.getDate()).padStart(2, '0');
              const mStr = String(dPrem.getMonth() + 1).padStart(2, '0');
              targetArray[rowIndex].datePremiereEcheance = `${dStr}/${mStr}/${dPrem.getFullYear()}`;
            }
          }
        }
      }
    };

    const addNewRow = () => {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonthFormatted = `${String(nextMonthDate.getDate()).padStart(2, '0')}/${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}/${nextMonthDate.getFullYear()}`;

      const newRow: any = {
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        sexe: 'M',
        profession: '',
        telephone: '',
        email: '',
        adresse: '',
        capital: 5000000,
        duree: 24,
        dateEffet: formattedDate,
        datePremiereEcheance: nextMonthFormatted,
        taux: 10,
        idPeriodicite: periodicites.value[0]?.id || 1,
        reference: '',
        importSuccess: false,
        importError: null
      };

      if (activeTab.value === 'AMORT') {
        newRow.perteEmploi = 'NON';
        importDataAmort.value.push(newRow);
      } else {
        importDataConst.value.push(newRow);
      }

      editingRow.value = activeTabData.value.length - 1;
      editingField.value = 'nom';
      isAddingNewRow.value = true;
    };

    const removeRow = (index: number) => {
      if (activeTab.value === 'AMORT') importDataAmort.value.splice(index, 1);
      else importDataConst.value.splice(index, 1);
    };

    const clearAllData = () => {
      importDataAmort.value = [];
      importDataConst.value = [];
      showImportResults.value = false;
      importResults.value = null;
    };

    const handleUploadError = (err: any) => {
      error(`Erreur upload : ${err.message || err}`);
    };

    // Date formatting logic
    const calculateAge = (dateNaissance: any): number => {
      try {
        if (!dateNaissance) return 0;
        let birthDate: Date;

        if (dateNaissance instanceof Date) {
          birthDate = dateNaissance;
        } else {
          const dateStr = String(dateNaissance);
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const year = parseInt(parts[2]);
              birthDate = new Date(year, month - 1, day);
            } else {
              return 0;
            }
          } else {
            birthDate = new Date(dateStr);
          }
        }

        if (isNaN(birthDate.getTime())) return 0;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      } catch {
        return 0;
      }
    };

    const formatDateForUI = (dateVal: any): string => {
      if (!dateVal) return '-';
      if (typeof dateVal === 'string' && dateVal.includes('/')) return dateVal;
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
      } catch {
        return String(dateVal);
      }
    };

    const convertDateToISO = (dateStr: any): string => {
      if (!dateStr) return '';
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }
      return String(dateStr);
    };

    // Durée maximale RENACA : min(60, (70 - âge) * 12)
    const getMaxDuration = (age: number): number => {
      return Math.min(60, Math.max(0, (70 - age) * 12));
    };

    // ========================================================
    // VALIDATION DES DONNÉES PAR NATURE (vraies règles RENACA)
    // ========================================================
    const validateRowData = (row: any, type: 'AMORT' | 'CONST'): { isValid: boolean; errors: string[]; warnings: string[] } => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Contrôles communs
      if (!row.nom || !row.nom.trim()) errors.push('Nom client obligatoire');
      if (!row.prenom || !row.prenom.trim()) errors.push('Prénom client obligatoire');
      if (!row.dateNaissance) errors.push('Date de naissance obligatoire');
      if (!row.lieuNaissance) errors.push('Lieu de naissance obligatoire');
      if (!row.sexe) errors.push('Sexe obligatoire (M ou F)');
      if (!row.profession) errors.push('Profession obligatoire');
      if (!row.telephone) errors.push('Téléphone obligatoire');
      if (!row.adresse || !row.adresse.trim()) errors.push('Adresse obligatoire');
      if (!row.capital) errors.push('Capital obligatoire');
      if (!row.idPeriodicite) errors.push('Périodicité obligatoire');

      // Âge : 18 à 69 ans à la signature (formule de durée max RENACA)
      const age = calculateAge(row.dateNaissance);
      if (age === 0) {
        errors.push(`Date de naissance invalide : ${row.dateNaissance}`);
      } else if (age < 18 || age > 69) {
        errors.push(`Âge invalide : ${age} ans (requis : 18 à 69 ans)`);
      }

      // Capital max par nature
      const capitalMax = type === 'AMORT' ? 10000000 : 20000000;
      if (row.capital && row.capital > capitalMax) {
        errors.push(`Capital trop élevé : ${row.capital.toLocaleString('fr-FR')} FCFA (max ${capitalMax.toLocaleString('fr-FR')} FCFA pour ${type})`);
      }

      // Durée : obligatoire, max = min(60, (70-âge)*12)
      if (!row.duree || row.duree < 1) {
        errors.push('Durée obligatoire (en mois)');
      } else if (age > 0) {
        const maxDuration = getMaxDuration(age);
        if (row.duree > maxDuration) {
          errors.push(`Durée trop longue : ${row.duree} mois (max ${maxDuration} mois pour ${age} ans)`);
        }
      }

      // Date d'effet : ne peut pas être antérieure à aujourd'hui
      if (!row.dateEffet) {
        errors.push('Date d\'effet obligatoire');
      } else {
        const dEffIso = convertDateToISO(row.dateEffet);
        const todayIso = new Date().toISOString().split('T')[0];
        if (dEffIso < todayIso) {
          errors.push(`La date d'effet ne peut pas être antérieure à aujourd'hui (${formatDateForUI(row.dateEffet)})`);
        }
      }

      // Date 1re échéance : ne peut pas être antérieure à la date d'effet
      if (!row.datePremiereEcheance) {
        errors.push('Date 1re Échéance obligatoire');
      } else if (row.dateEffet) {
        const dEffIso = convertDateToISO(row.dateEffet);
        const dPremIso = convertDateToISO(row.datePremiereEcheance);
        if (dPremIso < dEffIso) {
          errors.push(`La date de 1re échéance ne peut pas être antérieure à la date d'effet (${formatDateForUI(row.datePremiereEcheance)} < ${formatDateForUI(row.dateEffet)})`);
        }
      }

      if (row.taux === undefined || row.taux === null || row.taux === '') {
        errors.push('Taux obligatoire');
      } else if (row.taux < 0 || row.taux > 100) {
        warnings.push(`Taux inhabituel : ${row.taux}%`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    };

    const getValidationStatus = (row: any) => {
      return validateRowData(row, activeTab.value);
    };

    const filterUnique = (data: any[]) => {
      const seen = new Set();
      return data.filter(item => {
        const key = `${item.nom?.trim().toLowerCase()}_${item.prenom?.trim().toLowerCase()}_${item.dateNaissance?.trim()}_${item.capital}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // ========================================================
    // MODÈLES EXCEL
    // ========================================================
    const getSampleDates = () => {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const formatDate = (date: Date) => {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      };
      return {
        dateEffet: formatDate(today),
        datePremiereEcheance: formatDate(nextMonth)
      };
    };

    const createAmortSheet = () => {
      const { dateEffet, datePremiereEcheance } = getSampleDates();
      const sample = [
        {
          'Nom Client': 'DUPONT',
          'Prénom Client': 'Jean',
          'Date de Naissance': '15/05/1985',
          'Lieu de Naissance': 'Cotonou',
          'Sexe (M/F)': 'M',
          'Profession': 'Ingénieur',
          'Téléphone': '+229 97 12 34 56',
          'Email': 'jean.dupont@email.com',
          'Adresse': 'Cotonou, Bénin',
          'Capital': 5000000,
          'Durée': 24,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 12.5,
          'Périodicité': 'Mensuelle',
          'Perte Emploi (OUI/NON)': 'NON',
          'Référence': ''
        },
        {
          'Nom Client': 'KOUDJO',
          'Prénom Client': 'Alice',
          'Date de Naissance': '22/11/1992',
          'Lieu de Naissance': 'Porto-Novo',
          'Sexe (M/F)': 'F',
          'Profession': 'Gestionnaire',
          'Téléphone': '+229 96 45 67 89',
          'Email': 'alice.koudjo@email.com',
          'Adresse': 'Porto-Novo, Bénin',
          'Capital': 2500000,
          'Durée': 18,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 11.0,
          'Périodicité': 'Trimestrielle',
          'Perte Emploi (OUI/NON)': 'OUI',
          'Référence': ''
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sample);
      ws['!cols'] = [
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 16 },
        { wch: 20 }, { wch: 16 }
      ];
      return ws;
    };

    const createConstSheet = () => {
      const { dateEffet, datePremiereEcheance } = getSampleDates();
      const sample = [
        {
          'Nom Client': 'SESSOU',
          'Prénom Client': 'Bernadette',
          'Date de Naissance': '03/02/1980',
          'Lieu de Naissance': 'Bohicon',
          'Sexe (M/F)': 'F',
          'Profession': 'Commerçante',
          'Téléphone': '+229 91 22 33 44',
          'Email': 'bernadette.sessou@email.com',
          'Adresse': 'Bohicon, Bénin',
          'Capital': 8000000,
          'Durée': 36,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 13.0,
          'Périodicité': 'Mensuelle',
          'Référence': ''
        },
        {
          'Nom Client': 'AGOSSOU',
          'Prénom Client': 'Fabrice',
          'Date de Naissance': '19/07/1988',
          'Lieu de Naissance': 'Cotonou',
          'Sexe (M/F)': 'M',
          'Profession': 'Chauffeur',
          'Téléphone': '+229 94 55 66 77',
          'Email': 'fabrice.agossou@email.com',
          'Adresse': 'Cotonou, Bénin',
          'Capital': 15000000,
          'Durée': 48,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 12.0,
          'Périodicité': 'Semestrielle',
          'Référence': ''
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sample);
      ws['!cols'] = [
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 16 },
        { wch: 16 }
      ];
      return ws;
    };

    const downloadTemplate = (nature: 'AMORT' | 'CONST') => {
      try {
        const wb = XLSX.utils.book_new();
        const todayStr = new Date().toISOString().split('T')[0];

        if (nature === 'AMORT') {
          XLSX.utils.book_append_sheet(wb, createAmortSheet(), 'AMORT');
          XLSX.writeFile(wb, `Modele_Import_AMORT_${todayStr}.xlsx`);
          success('Modèle Crédit Amortissable (AMORT) téléchargé');
        } else {
          XLSX.utils.book_append_sheet(wb, createConstSheet(), 'CONST');
          XLSX.writeFile(wb, `Modele_Import_CONST_${todayStr}.xlsx`);
          success('Modèle Capital Constant (CONST) téléchargé');
        }
      } catch (err) {
        console.error('Erreur téléchargement modèle:', err);
        error('Erreur lors de la génération du modèle Excel');
      }
    };

    const downloadAllWorkbook = () => {
      try {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, createAmortSheet(), 'AMORT');
        XLSX.utils.book_append_sheet(wb, createConstSheet(), 'CONST');

        const todayStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Modele_Import_Complet_${todayStr}.xlsx`);
        success('Classeur complet (2 onglets) téléchargé');
      } catch (err) {
        console.error('Erreur téléchargement classeur:', err);
        error('Erreur lors du téléchargement du classeur');
      }
    };

    // ========================================================
    // EXCEL FILE UPLOAD AND PARSING
    // ========================================================
    const parseAmortRows = (jsonData: any[]) => {
      const today = new Date();
      const defaultEffet = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const defaultEch1 = `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;

      return jsonData.map((row: any) => {
        const dateEffet = row['Date Effet'] || defaultEffet;
        let datePremiereEcheance = row['1re Échéance'] || row['1ère Échéance'] || row['Premiere Echeance'] || '';

        if (!datePremiereEcheance && dateEffet) {
          const effIso = convertDateToISO(dateEffet);
          const dEff = new Date(effIso);
          if (!isNaN(dEff.getTime())) {
            const dPrem = new Date(dEff);
            dPrem.setMonth(dPrem.getMonth() + 1);
            datePremiereEcheance = `${String(dPrem.getDate()).padStart(2, '0')}/${String(dPrem.getMonth() + 1).padStart(2, '0')}/${dPrem.getFullYear()}`;
          } else {
            datePremiereEcheance = defaultEch1;
          }
        }

        const perteEmploiRaw = String(row['Perte Emploi (OUI/NON)'] || row['Perte Emploi'] || 'NON').trim().toUpperCase();

        return {
          nom: row['Nom Client'] || row['Nom'] || '',
          prenom: row['Prénom Client'] || row['Prenom'] || '',
          dateNaissance: row['Date de Naissance'] || '',
          lieuNaissance: row['Lieu de Naissance'] || '',
          sexe: String(row['Sexe (M/F)'] || row['Sexe'] || 'M').trim().toUpperCase(),
          profession: row['Profession'] || '',
          telephone: String(row['Téléphone'] || row['Telephone'] || ''),
          email: row['Email'] || '',
          adresse: row['Adresse'] || '',
          capital: Number(row['Capital']) || 0,
          duree: Number(row['Durée'] || row['Duree']) || 0,
          dateEffet,
          datePremiereEcheance,
          taux: row['Taux'] !== undefined ? Number(row['Taux']) : 10,
          idPeriodicite: resolvePeriodiciteId(row['Périodicité'] || row['Periodicite']),
          perteEmploi: perteEmploiRaw === 'OUI' ? 'OUI' : 'NON',
          reference: row['Référence'] || row['Reference'] || '',
          importSuccess: false,
          importError: null
        };
      });
    };

    const parseConstRows = (jsonData: any[]) => {
      const today = new Date();
      const defaultEffet = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const defaultEch1 = `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;

      return jsonData.map((row: any) => {
        const dateEffet = row['Date Effet'] || defaultEffet;
        let datePremiereEcheance = row['1re Échéance'] || row['1ère Échéance'] || row['Premiere Echeance'] || '';

        if (!datePremiereEcheance && dateEffet) {
          const effIso = convertDateToISO(dateEffet);
          const dEff = new Date(effIso);
          if (!isNaN(dEff.getTime())) {
            const dPrem = new Date(dEff);
            dPrem.setMonth(dPrem.getMonth() + 1);
            datePremiereEcheance = `${String(dPrem.getDate()).padStart(2, '0')}/${String(dPrem.getMonth() + 1).padStart(2, '0')}/${dPrem.getFullYear()}`;
          } else {
            datePremiereEcheance = defaultEch1;
          }
        }

        return {
          nom: row['Nom Client'] || row['Nom'] || '',
          prenom: row['Prénom Client'] || row['Prenom'] || '',
          dateNaissance: row['Date de Naissance'] || '',
          lieuNaissance: row['Lieu de Naissance'] || '',
          sexe: String(row['Sexe (M/F)'] || row['Sexe'] || 'M').trim().toUpperCase(),
          profession: row['Profession'] || '',
          telephone: String(row['Téléphone'] || row['Telephone'] || ''),
          email: row['Email'] || '',
          adresse: row['Adresse'] || '',
          capital: Number(row['Capital']) || 0,
          duree: Number(row['Durée'] || row['Duree']) || 0,
          dateEffet,
          datePremiereEcheance,
          taux: row['Taux'] !== undefined ? Number(row['Taux']) : 10,
          idPeriodicite: resolvePeriodiciteId(row['Périodicité'] || row['Periodicite']),
          reference: row['Référence'] || row['Reference'] || '',
          importSuccess: false,
          importError: null
        };
      });
    };

    const handleFileUpload = async (file: File) => {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        let parsedAmort: any[] = [];
        let parsedConst: any[] = [];

        for (const sName of workbook.SheetNames) {
          const sNameUpper = sName.toUpperCase().trim();
          const worksheet = workbook.Sheets[sName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) continue;

          const isConst = sNameUpper.includes('CONST') || sNameUpper.includes('CONSTANT');
          const isAmort = !isConst && sNameUpper.includes('AMORT');

          if (isConst) {
            parsedConst.push(...parseConstRows(jsonData));
          } else if (isAmort) {
            parsedAmort.push(...parseAmortRows(jsonData));
          } else {
            // Onglet générique (ex: Sheet1) : se fier à l'onglet actif
            if (activeTab.value === 'CONST') {
              parsedConst.push(...parseConstRows(jsonData));
            } else {
              parsedAmort.push(...parseAmortRows(jsonData));
            }
          }
        }

        if (parsedAmort.length > 0) importDataAmort.value = filterUnique(parsedAmort);
        if (parsedConst.length > 0) importDataConst.value = filterUnique(parsedConst);

        if (importDataAmort.value.length > 0) {
          activeTab.value = 'AMORT';
        } else if (importDataConst.value.length > 0) {
          activeTab.value = 'CONST';
        }

        const totalLoaded = importDataAmort.value.length + importDataConst.value.length;
        if (totalLoaded > 0) {
          success(`Fichier importé avec succès : ${importDataAmort.value.length} Amortissable(s), ${importDataConst.value.length} Capital Constant`);
        } else {
          error('Aucune donnée valide trouvée dans le fichier.');
        }

      } catch (err) {
        console.error('Erreur lecture fichier Excel:', err);
        error('Impossible de lire le fichier Excel');
      }
    };

    // ========================================================
    // IMPORTATION EN BASE DE DONNÉES
    // ========================================================
    const importContracts = async () => {
      try {
        isImporting.value = true;
        showImportResults.value = false;
        importResults.value = null;

        const rowsToImport: Array<{ row: any; originalIndex: number; tab: 'AMORT' | 'CONST' }> = [];

        importDataAmort.value.forEach((row, idx) => {
          if (!row.importSuccess && validateRowData(row, 'AMORT').isValid) {
            rowsToImport.push({ row, originalIndex: idx, tab: 'AMORT' });
          }
        });

        importDataConst.value.forEach((row, idx) => {
          if (!row.importSuccess && validateRowData(row, 'CONST').isValid) {
            rowsToImport.push({ row, originalIndex: idx, tab: 'CONST' });
          }
        });

        if (rowsToImport.length === 0) {
          error('Aucun contrat valide à importer');
          isImporting.value = false;
          return;
        }

        const contractsToImport = rowsToImport.map(item => {
          const row = item.row;
          const placeOfBirthVal = (row.lieuNaissance || '').trim();
          const occupationVal = (row.profession || '').trim();
          const addressVal = (row.adresse || '').trim();

          const clientData = {
            lastname: row.nom?.trim().toUpperCase(),
            firstname: row.prenom?.trim().toUpperCase(),
            birthdate: convertDateToISO(row.dateNaissance),
            placeOfBirth: placeOfBirthVal.toUpperCase() || 'NON RENSEIGNÉ',
            gender: (row.sexe || 'M').trim().toUpperCase(),
            occupation: occupationVal.toUpperCase() || 'NON RENSEIGNÉ',
            phone: row.telephone || 'NON RENSEIGNÉ',
            email: row.email || '',
            address: addressVal.toUpperCase() || 'NON RENSEIGNÉE',
            idTypeCustomer: 1
          };

          return {
            capital: Number(row.capital),
            duration: Number(row.duree),
            dateEff: convertDateToISO(row.dateEffet),
            dateEch1: convertDateToISO(row.datePremiereEcheance),
            idNatureCredit: getNatureCreditId(item.tab),
            taux: Number(row.taux),
            idPeriodicite: Number(row.idPeriodicite),
            perteEmploi: item.tab === 'AMORT' && row.perteEmploi === 'OUI',
            tauxSurprime: 0,
            reference: row.reference || undefined,
            clientData
          };
        });

        const response = await ApiService.vueInstance.axios.post('/contracts/import', {
          contracts: contractsToImport
        });

        importResults.value = response.data;
        showImportResults.value = true;

        const resSummary = response.data.data?.summary || response.data.summary;
        const backendResults = response.data.data?.results || response.data.results || [];

        backendResults.forEach((res: any) => {
          const matchedItem = rowsToImport[res.index];
          if (matchedItem) {
            const targetArray = matchedItem.tab === 'AMORT' ? importDataAmort.value : importDataConst.value;

            const row = targetArray[matchedItem.originalIndex];
            if (row) {
              if (res.success) {
                row.importSuccess = true;
                row.importError = null;
              } else {
                row.importSuccess = false;
                row.importError = res.error || 'Erreur lors de l\'importation';
              }
            }
          }
        });

        if (resSummary && resSummary.success > 0) {
          if (resSummary.failed > 0) {
            error(`Importation partielle : ${resSummary.success} réussi(s), ${resSummary.failed} échec(s)`);
          } else {
            success(`Importation réussie : ${resSummary.success} contrat(s) créé(s)`);
          }
          emit('import-success', response.data);
        } else {
          const failedCount = resSummary?.failed || 0;
          error(`Erreur d'importation : ${failedCount} erreur(s) détectée(s)`);
          emit('import-error', response.data);
        }

      } catch (err: any) {
        console.error('Erreur import contrats:', err);
        error(err.response?.data?.message || 'Une erreur est survenue lors de l\'import');
        emit('import-error', err);
      } finally {
        isImporting.value = false;
      }
    };

    const downloadAllPDFs = async () => {
      try {
        isGeneratingPDF.value = true;
        const contractIds = getSuccessfulContractIds();
        if (contractIds.length === 0) {
          error('Aucun contrat importé avec succès pour générer les PDFs');
          return;
        }

        const response = await ApiService.vueInstance.axios.post('/contracts/import/bulk-pdf', {
          contractIds
        }, { responseType: 'blob' });

        // Vérifier si la réponse est en fait une erreur JSON
        if (response.data && response.data.type === 'application/json') {
          const text = await response.data.text();
          try {
            const errObj = JSON.parse(text);
            error(errObj.message || 'Erreur lors de la génération du ZIP des contrats');
          } catch {
            error('Erreur lors de la génération du ZIP des contrats');
          }
          return;
        }

        const blob = response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/zip' });

        // Déterminer le nom du fichier
        let filename = `Contrats_Importes_${new Date().toISOString().split('T')[0]}.zip`;
        const disposition = response.headers?.['content-disposition'];
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        success('Téléchargement du ZIP des contrats réussi');
      } catch (err: any) {
        console.error('Erreur téléchargement PDFs:', err);
        // Si l'erreur axios contient un blob avec le message d'erreur
        if (err.response?.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const errObj = JSON.parse(text);
            error(errObj.message || 'Erreur lors du téléchargement des PDFs');
            return;
          } catch {
            // Continuer vers l'erreur générale
          }
        }
        error(err.response?.data?.message || 'Erreur lors du téléchargement des PDFs');
      } finally {
        isGeneratingPDF.value = false;
      }
    };

    const startNewImport = () => {
      importDataAmort.value = [];
      importDataConst.value = [];
      showInstructions.value = false;
      showImportResults.value = false;
      importResults.value = null;
    };

    const closeModal = () => {
      emit('update:visible', false);
    };

    const getImportResults = () => {
      return importResults.value?.data || importResults.value;
    };

    const getImportSummary = () => {
      return getImportResults()?.summary || null;
    };

    const getSuccessfulContractIds = () => {
      if (importResults.value?.data?.successfulContractIds) {
        return importResults.value.data.successfulContractIds;
      }
      if (importResults.value?.successfulContractIds) {
        return importResults.value.successfulContractIds;
      }
      if (importResults.value?.data?.results) {
        return importResults.value.data.results
          .filter((r: any) => r.success && r.contract?.id)
          .map((r: any) => r.contract.id);
      }
      return [];
    };

    return {
      // Données par nature
      importDataAmort,
      importDataConst,
      activeTab,
      showImportResults,
      isImporting,
      isGeneratingPDF,
      importResults,
      editingRow,
      editingField,
      isAddingNewRow,
      hasData,
      showInstructions,
      activeTabData,
      activeTabDataSliced,
      activeTabSummary,
      globalSummary,
      getActiveTabTitle,
      periodicites,
      getPeriodiciteLabel,

      // Édition en ligne
      startEditing,
      stopEditing,
      updateField,
      addNewRow,
      removeRow,
      clearAllData,

      // Modèles et imports
      downloadTemplate,
      downloadAllWorkbook,
      handleFileUpload,
      handleUploadError,
      getValidationStatus,
      importContracts,
      downloadAllPDFs,
      formatDateForUI,
      startNewImport,
      closeModal,
      getImportResults,
      getImportSummary,
      getSuccessfulContractIds,
      isVisible: computed(() => props.visible)
    };
  }
});
</script>

<style scoped>
.editable-field {
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background-color 0.15s;
  display: inline-block;
  min-width: 40px;
}

.editable-field:hover {
  background-color: #f0f0f0;
}

.table-responsive {
  max-height: 480px;
  overflow-y: auto;
}

.card {
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.08) !important;
}

.badge {
  font-size: 0.72rem;
}

.btn {
  transition: all 0.15s ease;
}

.btn:hover {
  transform: translateY(-0.5px);
}

.nav-tabs .nav-link {
  font-weight: 600;
  color: #6c757d;
  border: 1px solid transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

.fs-7 {
  font-size: 0.8rem;
}

.x-small {
  font-size: 0.75rem;
}

.row-imported {
  background-color: rgba(25, 135, 84, 0.08) !important;
}
.row-imported span.editable-field {
  cursor: default !important;
}
.row-imported span.editable-field:hover {
  background-color: transparent !important;
}
</style>
