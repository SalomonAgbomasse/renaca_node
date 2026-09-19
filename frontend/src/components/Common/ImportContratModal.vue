<template>
  <!-- Modal d'import de contrats -->
  <Modal
    :is-visible="isVisible"
    title="Importer des contrats depuis Excel"
    icon="flaticon-upload"
    :size="hasData ? 'xxlarge' : 'xlarge'"
    @close="closeModal"
    @update:is-visible="$emit('update:visible', $event)"
  >
    <!-- Instructions & Modèles personnalisés -->
    <div v-if="!hasData || showInstructions" class="row g-3 mb-3">
      <div class="col-12">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-primary text-white border-0 py-2">
            <h6 class="mb-0 fw-bold">
              <i class="flaticon-information me-2"></i>
              Modèles Excel personnalisés par nature de crédit
            </h6>
          </div>
          <div class="card-body p-3">
            <p class="text-muted small mb-3">
              Téléchargez le modèle spécifique correspondant à la nature de crédit autorisée pour votre groupe :
            </p>

            <div class="row g-3">
              <!-- 1. AMORTISSABLE -->
              <div v-if="isNatureAuthorized('AMORT')" class="col-md-6 col-lg-4">
                <div class="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center mb-2">
                      <span class="badge bg-primary me-2">AMORT</span>
                      <strong class="text-dark small">Crédit Amortissable</strong>
                    </div>
                    <p class="text-muted x-small mb-3">
                      Crédit classique sans bénéficiaires ni membres de famille. Capital jusqu'à 30M FCFA.
                    </p>
                  </div>
                  <button 
                    @click="downloadTemplate('AMORT')" 
                    class="btn btn-sm btn-outline-primary w-100 fw-semibold"
                    type="button"
                  >
                    <i class="flaticon-download me-1"></i> Modèle AMORT
                  </button>
                </div>
              </div>

              <!-- 2. COMPTE PARRAINÉ (CP) -->
              <div v-if="isNatureAuthorized('CP')" class="col-md-6 col-lg-4">
                <div class="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between border-success-subtle">
                  <div>
                    <div class="d-flex align-items-center mb-2">
                      <span class="badge bg-success me-2">CP</span>
                      <strong class="text-dark small">Compte Parrainé</strong>
                    </div>
                    <p class="text-muted x-small mb-1">
                      <strong>2 options exclusives :</strong>
                    </p>
                    <ul class="text-muted x-small ps-3 mb-3">
                      <li>Option 1 : 500 000 FCFA</li>
                      <li>Option 2 : 1 000 000 FCFA</li>
                      <li>1 à 5 bénéficiaires (100%)</li>
                    </ul>
                  </div>
                  <button 
                    @click="downloadTemplate('CP')" 
                    class="btn btn-sm btn-success w-100 fw-semibold text-white"
                    type="button"
                  >
                    <i class="flaticon-download me-1"></i> Modèle CP (2 options)
                  </button>
                </div>
              </div>

              <!-- 3. OBSÈQUES ALAFIA (OBA) -->
              <div v-if="isNatureAuthorized('OBA')" class="col-md-6 col-lg-4">
                <div class="p-3 border rounded bg-light h-100 d-flex flex-column justify-content-between border-warning-subtle">
                  <div>
                    <div class="d-flex align-items-center mb-2">
                      <span class="badge bg-warning text-dark me-2">OBA</span>
                      <strong class="text-dark small">Obsèques Alafia</strong>
                    </div>
                    <p class="text-muted x-small mb-1">
                      <strong>Capital fixé à 1M ou 2M :</strong>
                    </p>
                    <ul class="text-muted x-small ps-3 mb-3">
                      <li>Capital : 1 000 000 ou 2 000 000 FCFA</li>
                      <li>Durée max : 12 mois</li>
                      <li>Conjoint et ascendants garantis</li>
                    </ul>
                  </div>
                  <button 
                    @click="downloadTemplate('OBA')" 
                    class="btn btn-sm btn-outline-warning text-dark w-100 fw-semibold"
                    type="button"
                  >
                    <i class="flaticon-download me-1"></i> Modèle OBA
                  </button>
                </div>
              </div>
            </div>

            <!-- Bouton pack complet si plus d'une nature autorisée -->
            <div v-if="authorizedCount > 1" class="mt-3 pt-2 border-top d-flex justify-content-end">
              <button 
                @click="downloadAllWorkbook" 
                class="btn btn-sm btn-outline-secondary px-3 py-1"
                type="button"
              >
                <i class="flaticon-file me-1"></i> Télécharger le classeur complet ({{ authorizedCount }} onglets autorisés)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zone de téléchargement / Upload -->
    <div v-if="!hasData || showInstructions" class="row g-3 mb-3">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-info text-white border-0 py-2">
            <h6 class="mb-0 fw-bold">
              <i class="flaticon-upload me-2"></i>
              Déposer votre fichier Excel
            </h6>
          </div>
          <div class="card-body p-3">
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
              title="Glisser-déposez votre fichier Excel ici"
              hint="Formats acceptés: .xlsx, .xls (max 10MB)"
              class="mb-2"
            />
            <div class="text-center text-muted">
              <small>
                <i class="flaticon-info me-1"></i>
                Le fichier peut contenir une seule nature ou les onglets correspondant à vos natures autorisées.
              </small>
            </div>
          </div>
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

      <!-- Tabs header filtrés par autorisations de groupe -->
      <ul class="nav nav-tabs mb-3" role="tablist">
        <!-- Onglet AMORT -->
        <li v-if="isNatureAuthorized('AMORT')" class="nav-item" role="presentation">
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

        <!-- Onglet CP (Compte Parrainé) -->
        <li v-if="isNatureAuthorized('CP')" class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'CP' }" 
            @click="activeTab = 'CP'" 
            type="button"
          >
            <i class="flaticon-users me-2"></i>
            Compte Parrainé (CP)
            <span class="badge bg-secondary ms-1">{{ importDataCp.length }}</span>
          </button>
        </li>

        <!-- Onglet OBA (Obsèques Alafia) -->
        <li v-if="isNatureAuthorized('OBA')" class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'OBA' }" 
            @click="activeTab = 'OBA'" 
            type="button"
          >
            <i class="flaticon-shield me-2"></i>
            Obsèques Alafia (OBA)
            <span class="badge bg-secondary ms-1">{{ importDataOba.length }}</span>
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
            class="btn btn-sm animate-button"
            :class="showInstructions ? 'btn-info text-white' : 'btn-outline-info'"
          >
            <i class="flaticon-information me-1"></i>
            {{ showInstructions ? 'Masquer consignes' : 'Afficher consignes' }}
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
              <th>Nom</th>
              <th>Prénom</th>
              <th>Date Naissance</th>
              <th>Lieu Naissance</th>
              <th>Sexe</th>
              <th>Profession</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>

              <!-- Colonnes selon Nature -->
              <!-- AMORT -->
              <template v-if="activeTab === 'AMORT'">
                <th>Capital (FCFA)</th>
                <th>Durée (mois)</th>
                <th>Date Effet</th>
                <th>1re Échéance</th>
                <th>Taux (%)</th>
                <th>Référence</th>
              </template>

              <!-- CP (Compte Parrainé) -->
              <template v-else-if="activeTab === 'CP'">
                <th>Option Capital</th>
                <th>Taux (%)</th>
                <th>Compte Bancaire</th>
                <th>Réf Compte</th>
                <th>Renouv. Auto</th>
                <th>Bénéficiaires (1 à 5)</th>
              </template>

              <!-- OBA (Obsèques Alafia) -->
              <template v-else-if="activeTab === 'OBA'">
                <th>Capital (1M ou 2M)</th>
                <th>Durée (mois)</th>
                <th>Date Effet</th>
                <th>1re Échéance</th>
                <th>Taux (%)</th>
                <th>Membres Famille</th>
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
              <!-- COLONNES SPÉCIFIQUES : COMPTE PARRAINÉ (CP) -->
              <!-- ============================================ -->
              <template v-else-if="activeTab === 'CP'">
                <!-- Option Capital : 500 000 ou 1 000 000 FCFA -->
                <td>
                  <select 
                    v-if="editingRow === index && editingField === 'capital'"
                    v-model.number="row.capital"
                    @change="updateField(index, 'capital', row.capital); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 125px;"
                  >
                    <option :value="500000">Option 1 - 500 000</option>
                    <option :value="1000000">Option 2 - 1 000 000</option>
                  </select>
                  <span v-else @click="startEditing(index, 'capital')" class="editable-field fw-semibold" :class="row.capital === 500000 ? 'text-primary' : row.capital === 1000000 ? 'text-success' : 'text-danger'">
                    {{ row.capital === 500000 ? 'Opt 1 : 500 000' : row.capital === 1000000 ? 'Opt 2 : 1 000 000' : (row.capital ? row.capital.toLocaleString('fr-FR') + ' (Invalide)' : '-') }}
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

                <!-- Compte Bancaire -->
                <td>
                  <select 
                    v-if="editingRow === index && editingField === 'compteBancaire'"
                    v-model="row.compteBancaire"
                    @change="updateField(index, 'compteBancaire', row.compteBancaire); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 100px;"
                  >
                    <option value="COURANT">COURANT</option>
                    <option value="EPARGNE">EPARGNE</option>
                  </select>
                  <span v-else @click="startEditing(index, 'compteBancaire')" class="editable-field">{{ row.compteBancaire || '-' }}</span>
                </td>

                <!-- Réf Compte -->
                <td>
                  <input 
                    v-if="editingRow === index && editingField === 'numeroCompte'"
                    v-model="row.numeroCompte"
                    @blur="updateField(index, 'numeroCompte', row.numeroCompte); stopEditing()"
                    @keyup.enter="updateField(index, 'numeroCompte', row.numeroCompte); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 110px;"
                  />
                  <span v-else @click="startEditing(index, 'numeroCompte')" class="editable-field">{{ row.numeroCompte || '-' }}</span>
                </td>

                <!-- Renouvellement Auto -->
                <td>
                  <select 
                    v-if="editingRow === index && editingField === 'renouvellementAuto'"
                    v-model="row.renouvellementAuto"
                    @change="updateField(index, 'renouvellementAuto', row.renouvellementAuto); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 75px;"
                  >
                    <option :value="true">OUI</option>
                    <option :value="false">NON</option>
                  </select>
                  <span v-else @click="startEditing(index, 'renouvellementAuto')" class="editable-field">
                    {{ row.renouvellementAuto ? 'OUI' : 'NON' }}
                  </span>
                </td>

                <!-- Bénéficiaires -->
                <td>
                  <button 
                    class="btn btn-xs btn-outline-info p-1 py-0 fs-7 text-nowrap" 
                    @click="openBeneficiaryEditor(index)"
                    title="Gérer les bénéficiaires de ce Compte Parrainé"
                  >
                    👥 ({{ (row.beneficiaries || []).length }})
                  </button>
                  <div class="x-small text-muted text-truncate mt-1" style="max-width: 120px;" :title="(row.beneficiaries || []).map(b => `${b.nom || b.nomPrenoms} (${b.pourcentage}%)`).join(', ')">
                    {{ (row.beneficiaries || []).map(b => `${b.nom || b.nomPrenoms} (${b.pourcentage}%)`).join(', ') }}
                  </div>
                </td>
              </template>

              <!-- ============================================ -->
              <!-- COLONNES SPÉCIFIQUES : OBSÈQUES ALAFIA (OBA) -->
              <!-- ============================================ -->
              <template v-else-if="activeTab === 'OBA'">
                <!-- Capital OBA : 1 000 000 ou 2 000 000 FCFA -->
                <td>
                  <select 
                    v-if="editingRow === index && editingField === 'capital'"
                    v-model.number="row.capital"
                    @change="updateField(index, 'capital', row.capital); stopEditing()"
                    class="form-select form-select-sm"
                    style="min-width: 125px;"
                  >
                    <option :value="1000000">1 000 000 FCFA</option>
                    <option :value="2000000">2 000 000 FCFA</option>
                  </select>
                  <span v-else @click="startEditing(index, 'capital')" class="editable-field fw-semibold" :class="row.capital === 1000000 || row.capital === 2000000 ? 'text-dark' : 'text-danger'">
                    {{ row.capital ? row.capital.toLocaleString('fr-FR') : '-' }}
                  </span>
                </td>

                <!-- Durée OBA (1 à 12 mois) -->
                <td>
                  <input 
                    v-if="editingRow === index && editingField === 'duree'"
                    v-model.number="row.duree"
                    @blur="updateField(index, 'duree', row.duree); stopEditing()"
                    @keyup.enter="updateField(index, 'duree', row.duree); stopEditing()"
                    class="form-control form-control-sm"
                    style="min-width: 60px;"
                    type="number"
                    min="1"
                    max="12"
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

                <!-- Membres Famille -->
                <td>
                  <button 
                    class="btn btn-xs btn-outline-warning text-dark p-1 py-0 fs-7 text-nowrap" 
                    @click="openObaEditor(index)"
                    title="Gérer les membres de la famille assurés (Conjoint, Ascendants)"
                  >
                    👨‍👩‍👧‍👦 ({{ getObaMembersCount(row) }})
                  </button>
                  <div class="x-small text-muted text-truncate mt-1" style="max-width: 120px;" :title="getObaMembersSummary(row)">
                    {{ getObaMembersSummary(row) }}
                  </div>
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

    <!-- Modal d'édition des bénéficiaires (Compte Parrainé) -->
    <div 
      v-if="showBeneficiaryModal" 
      class="modal fade show d-block" 
      style="background-color: rgba(0, 0, 0, 0.55); z-index: 1060;" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-success text-white border-0 py-3">
            <h5 class="modal-title fw-bold">
              <i class="flaticon-users me-2"></i>
              Bénéficiaires du Compte Parrainé (Somme des parts = 100%)
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showBeneficiaryModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="alert alert-light border mb-3 small py-2">
              Saisissez de 1 à 5 bénéficiaires. La somme des parts doit faire <strong>exactement 100%</strong> pour que le contrat soit valide.
            </div>
            <div class="table-responsive" style="max-height: 350px;">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Lien de parenté</th>
                    <th style="width: 20%;">Part (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(b, idx) in tempBeneficiaries" :key="idx">
                    <td class="fw-bold text-muted">{{ idx + 1 }}</td>
                    <td>
                      <input v-model="b.nom" class="form-control form-control-sm" placeholder="Nom" />
                    </td>
                    <td>
                      <input v-model="b.prenom" class="form-control form-control-sm" placeholder="Prénom" />
                    </td>
                    <td>
                      <select v-model="b.lienParente" class="form-select form-select-sm shadow-none">
                        <option value="">-- Sélectionner --</option>
                        <option v-for="l in liensParenteList" :key="l.id || l.libelle || l" :value="l.libelle || l">
                          {{ l.description ? `${l.libelle} (${l.description})` : (l.libelle || l) }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input v-model.number="b.pourcentage" type="number" min="0" max="100" class="form-control form-control-sm text-end" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer border-0 p-3 bg-light d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="showBeneficiaryModal = false">Annuler</button>
            <button type="button" class="btn btn-sm btn-success px-3" @click="saveBeneficiaries">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'édition des membres famille (Obsèques Alafia - OBA) -->
    <div 
      v-if="showObaModal" 
      class="modal fade show d-block" 
      style="background-color: rgba(0, 0, 0, 0.55); z-index: 1060;" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-warning text-dark border-0 py-3">
            <h5 class="modal-title fw-bold">
              <i class="flaticon-shield me-2"></i>
              Membres de famille garantis (Obsèques Alafia)
            </h5>
            <button type="button" class="btn-close" @click="showObaModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="alert alert-light border mb-3 small py-2">
              Cochez les membres de la famille à couvrir sous la garantie Obsèques Alafia et renseignez leurs informations.
            </div>

            <div class="row g-3">
              <!-- Conjoint -->
              <div class="col-12 p-2 border rounded bg-white">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="conjointCheck" v-model="tempObaMembers.conjoint.checked" />
                  <label class="form-check-label fw-bold" for="conjointCheck">Conjoint(e) Garanti(e)</label>
                </div>
                <div v-if="tempObaMembers.conjoint.checked" class="row g-2">
                  <div class="col-md-3">
                    <input v-model="tempObaMembers.conjoint.nom" class="form-control form-control-sm" placeholder="Nom Conjoint" />
                  </div>
                  <div class="col-md-3">
                    <input v-model="tempObaMembers.conjoint.prenom" class="form-control form-control-sm" placeholder="Prénom Conjoint" />
                  </div>
                  <div class="col-md-3">
                    <input v-model="tempObaMembers.conjoint.dateNaissance" class="form-control form-control-sm" placeholder="DD/MM/YYYY" />
                  </div>
                  <div class="col-md-3">
                    <input v-model.number="tempObaMembers.conjoint.capital" type="number" class="form-control form-control-sm" placeholder="Capital (ex: 500000)" />
                  </div>
                </div>
              </div>

              <!-- Père Assuré -->
              <div class="col-12 p-2 border rounded bg-white">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="pereAssureCheck" v-model="tempObaMembers.pereAssure.checked" />
                  <label class="form-check-label fw-bold" for="pereAssureCheck">Père de l'Assuré Garanti</label>
                </div>
                <div v-if="tempObaMembers.pereAssure.checked" class="row g-2">
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereAssure.nom" class="form-control form-control-sm" placeholder="Nom Père" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereAssure.prenom" class="form-control form-control-sm" placeholder="Prénom Père" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereAssure.dateNaissance" class="form-control form-control-sm" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
              </div>

              <!-- Mère Assuré -->
              <div class="col-12 p-2 border rounded bg-white">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="mereAssureCheck" v-model="tempObaMembers.mereAssure.checked" />
                  <label class="form-check-label fw-bold" for="mereAssureCheck">Mère de l'Assuré Garantie</label>
                </div>
                <div v-if="tempObaMembers.mereAssure.checked" class="row g-2">
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereAssure.nom" class="form-control form-control-sm" placeholder="Nom Mère" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereAssure.prenom" class="form-control form-control-sm" placeholder="Prénom Mère" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereAssure.dateNaissance" class="form-control form-control-sm" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
              </div>

              <!-- Père Conjoint -->
              <div class="col-12 p-2 border rounded bg-white">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="pereConjointCheck" v-model="tempObaMembers.pereConjoint.checked" />
                  <label class="form-check-label fw-bold" for="pereConjointCheck">Père du Conjoint Garanti</label>
                </div>
                <div v-if="tempObaMembers.pereConjoint.checked" class="row g-2">
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereConjoint.nom" class="form-control form-control-sm" placeholder="Nom" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereConjoint.prenom" class="form-control form-control-sm" placeholder="Prénom" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.pereConjoint.dateNaissance" class="form-control form-control-sm" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
              </div>

              <!-- Mère Conjoint -->
              <div class="col-12 p-2 border rounded bg-white">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="mereConjointCheck" v-model="tempObaMembers.mereConjoint.checked" />
                  <label class="form-check-label fw-bold" for="mereConjointCheck">Mère du Conjoint Garantie</label>
                </div>
                <div v-if="tempObaMembers.mereConjoint.checked" class="row g-2">
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereConjoint.nom" class="form-control form-control-sm" placeholder="Nom" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereConjoint.prenom" class="form-control form-control-sm" placeholder="Prénom" />
                  </div>
                  <div class="col-md-4">
                    <input v-model="tempObaMembers.mereConjoint.dateNaissance" class="form-control form-control-sm" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 p-3 bg-light d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="showObaModal = false">Annuler</button>
            <button type="button" class="btn btn-sm btn-warning text-dark px-3 fw-semibold" @click="saveObaMembers">Enregistrer</button>
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
          {{ isImporting ? 'Import en cours...' : `Importer ${globalSummary.valid} contrat(s) (Natures autorisées)` }}
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
    // Arrays for the three credit natures
    const importDataAmort = ref<any[]>([]);
    const importDataCp = ref<any[]>([]);
    const importDataOba = ref<any[]>([]);
    
    // UI state & Permissions
    const authorizedNatures = ref<any[]>([]);
    const isLoadingNatures = ref(false);
    const activeTab = ref<'AMORT' | 'CP' | 'OBA'>('AMORT');
    const showImportResults = ref(false);
    const isImporting = ref(false);
    const isGeneratingPDF = ref(false);
    const importResults = ref<any>(null);
    const showInstructions = ref(false);
    
    // Inline editing states
    const editingRow = ref<number | null>(null);
    const editingField = ref<string | null>(null);
    const isAddingNewRow = ref(false);

    // Beneficiary editing modal states (CP)
    const showBeneficiaryModal = ref(false);
    const editingBeneficiaryRowIndex = ref<number | null>(null);
    const tempBeneficiaries = ref<any[]>([]);

    // OBA members editing modal states
    const showObaModal = ref(false);
    const editingObaRowIndex = ref<number | null>(null);
    const tempObaMembers = ref<any>({
      conjoint: { checked: false, nom: '', prenom: '', dateNaissance: '', genre: 'F', capital: 0 },
      pereAssure: { checked: false, nom: '', prenom: '', dateNaissance: '', capital: 0 },
      mereAssure: { checked: false, nom: '', prenom: '', dateNaissance: '', capital: 0 },
      pereConjoint: { checked: false, nom: '', prenom: '', dateNaissance: '', capital: 0 },
      mereConjoint: { checked: false, nom: '', prenom: '', dateNaissance: '', capital: 0 }
    });

    // Load authorized natures for the logged-in user's group
    const loadAuthorizedNatures = async () => {
      try {
        isLoadingNatures.value = true;
        const response = await ApiService.get('/nature-credits');
        const responseData = response.data;
        let list: any[] = [];
        if (Array.isArray(responseData)) {
          list = responseData;
        } else if (Array.isArray(responseData?.data)) {
          list = responseData.data;
        } else if (Array.isArray(responseData?.data?.data)) {
          list = responseData.data.data;
        }

        if (list && list.length > 0) {
          authorizedNatures.value = list;
        } else {
          // Fallback par défaut si vide : AMORT
          authorizedNatures.value = [{ id: 1, code: 'AMORT', libelle: 'AMORTISSABLE' }];
        }

        // Définir automatiquement l'onglet actif sur la 1re nature autorisée
        const firstAuth = (['AMORT', 'CP', 'OBA'] as const).find(code => isNatureAuthorized(code));
        if (firstAuth && !isNatureAuthorized(activeTab.value)) {
          activeTab.value = firstAuth;
        }
      } catch (err) {
        console.error('Erreur chargement natures autorisées:', err);
        // En cas d'erreur de réseau, conserver l'accès standard
        authorizedNatures.value = [
          { id: 1, code: 'AMORT', libelle: 'AMORTISSABLE' },
          { id: 2, code: 'CP', libelle: 'PADME PROTECTION' },
          { id: 3, code: 'OBA', libelle: 'OBSEQUES ALAFIA' }
        ];
      } finally {
        isLoadingNatures.value = false;
      }
    };

    // Helper to check if a nature is authorized for the user
    const isNatureAuthorized = (code: 'AMORT' | 'CP' | 'OBA'): boolean => {
      if (!authorizedNatures.value || authorizedNatures.value.length === 0) return true;
      return authorizedNatures.value.some((n: any) => {
        const c = (n.code || '').toUpperCase().trim();
        const l = (n.libelle || '').toUpperCase().trim();
        if (code === 'AMORT') return c === 'AMORT' || l.includes('AMORT');
        if (code === 'CP') return c === 'CP' || l.includes('PARRAINE') || l.includes('PROTECTION');
        if (code === 'OBA') return c === 'OBA' || l.includes('OBSEQUE');
        return false;
      });
    };

    const authorizedCount = computed(() => {
      let count = 0;
      if (isNatureAuthorized('AMORT')) count++;
      if (isNatureAuthorized('CP')) count++;
      if (isNatureAuthorized('OBA')) count++;
      return count;
    });

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        loadAuthorizedNatures();
      }
    });

    onMounted(() => {
      if (props.visible) {
        loadAuthorizedNatures();
      }
    });

    // Computed properties
    const hasData = computed(() => {
      return importDataAmort.value.length > 0 || 
             importDataCp.value.length > 0 ||
             importDataOba.value.length > 0;
    });

    const activeTabData = computed(() => {
      if (activeTab.value === 'AMORT') return importDataAmort.value;
      if (activeTab.value === 'CP') return importDataCp.value;
      if (activeTab.value === 'OBA') return importDataOba.value;
      return [];
    });

    const activeTabDataSliced = computed(() => {
      return activeTabData.value;
    });

    const getActiveTabTitle = () => {
      if (activeTab.value === 'AMORT') return 'Crédit Amortissable';
      if (activeTab.value === 'CP') return 'Compte Parrainé (CP)';
      if (activeTab.value === 'OBA') return 'Obsèques Alafia (OBA)';
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

      const processArray = (arr: any[], type: 'AMORT' | 'CP' | 'OBA') => {
        if (!isNatureAuthorized(type)) return;
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
      processArray(importDataCp.value, 'CP');
      processArray(importDataOba.value, 'OBA');

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
      const targetArray = activeTab.value === 'AMORT' 
        ? importDataAmort.value 
        : activeTab.value === 'CP' 
          ? importDataCp.value 
          : importDataOba.value;

      if (targetArray[rowIndex]) {
        targetArray[rowIndex][field] = value;

        // Si la date d'effet est modifiée pour AMORT ou OBA, ajuster la 1re échéance si elle est antérieure
        if (field === 'dateEffet' && (activeTab.value === 'AMORT' || activeTab.value === 'OBA')) {
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
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Date de 1re échéance standard pour AMORT / OBA (1 mois après date d'effet)
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonthFormatted = `${String(nextMonthDate.getDate()).padStart(2, '0')}/${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}/${nextMonthDate.getFullYear()}`;

      // Date d'effet CP : Demain (date du jour + 1 jour comme dans conversion contrat)
      const tomorrowCP = new Date();
      tomorrowCP.setDate(tomorrowCP.getDate() + 1);
      const dTomCP = String(tomorrowCP.getDate()).padStart(2, '0');
      const mTomCP = String(tomorrowCP.getMonth() + 1).padStart(2, '0');
      const yTomCP = tomorrowCP.getFullYear();
      const cpEffetFormatted = `${dTomCP}/${mTomCP}/${yTomCP}`;

      // Date d'échéance CP : date d'effet + 1 an - 1 jour (la veille dans un an)
      const cpEchDate = new Date(tomorrowCP);
      cpEchDate.setFullYear(cpEchDate.getFullYear() + 1);
      cpEchDate.setDate(cpEchDate.getDate() - 1);
      const dEchCP = String(cpEchDate.getDate()).padStart(2, '0');
      const mEchCP = String(cpEchDate.getMonth() + 1).padStart(2, '0');
      const yEchCP = cpEchDate.getFullYear();
      const cpEcheanceFormatted = `${dEchCP}/${mEchCP}/${yEchCP}`;

      let newRow: any = {
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        sexe: 'M',
        profession: '',
        telephone: '',
        email: '',
        adresse: '',
        taux: 10,
        importSuccess: false,
        importError: null
      };

      if (activeTab.value === 'AMORT') {
        newRow = {
          ...newRow,
          capital: 5000000,
          duree: 24,
          dateEffet: formattedDate,
          datePremiereEcheance: nextMonthFormatted,
          reference: ''
        };
        importDataAmort.value.push(newRow);
      } else if (activeTab.value === 'CP') {
        newRow = {
          ...newRow,
          capital: 500000, // Option 1 par défaut
          duree: 12, // Toujours 12 mois pour CP
          dateEffet: cpEffetFormatted, // Toujours date du jour + 1 jour
          datePremiereEcheance: cpEcheanceFormatted, // dateEffet + 1 an - 1 jour
          dateEcheance: cpEcheanceFormatted,
          compteBancaire: 'COURANT',
          numeroCompte: '',
          renouvellementAuto: true,
          beneficiaries: [],
          reference: ''
        };
        importDataCp.value.push(newRow);
      } else if (activeTab.value === 'OBA') {
        newRow = {
          ...newRow,
          capital: 1000000,
          duree: 12, // Toujours 12 mois pour OBA
          dateEffet: formattedDate,
          datePremiereEcheance: nextMonthFormatted,
          conjointChecked: 'NON',
          conjointNom: '',
          conjointPrenom: '',
          conjointDateNaissance: '',
          conjointGenre: 'F',
          conjointCapital: 0,
          pereAssureChecked: 'NON',
          pereAssureNom: '',
          pereAssurePrenom: '',
          pereAssureDateNaissance: '',
          pereAssureCapital: 0,
          mereAssureChecked: 'NON',
          mereAssureNom: '',
          mereAssurePrenom: '',
          mereAssureDateNaissance: '',
          mereAssureCapital: 0,
          pereConjointChecked: 'NON',
          pereConjointNom: '',
          pereConjointPrenom: '',
          pereConjointDateNaissance: '',
          pereConjointCapital: 0,
          mereConjointChecked: 'NON',
          mereConjointNom: '',
          mereConjointPrenom: '',
          mereConjointDateNaissance: '',
          mereConjointCapital: 0
        };
        importDataOba.value.push(newRow);
      }

      editingRow.value = activeTabData.value.length - 1;
      editingField.value = 'nom';
      isAddingNewRow.value = true;
    };

    const removeRow = (index: number) => {
      if (activeTab.value === 'AMORT') importDataAmort.value.splice(index, 1);
      else if (activeTab.value === 'CP') importDataCp.value.splice(index, 1);
      else if (activeTab.value === 'OBA') importDataOba.value.splice(index, 1);
    };

    const clearAllData = () => {
      importDataAmort.value = [];
      importDataCp.value = [];
      importDataOba.value = [];
      showImportResults.value = false;
      importResults.value = null;
    };

    const liensParenteList = ref<any[]>([
      { libelle: 'ENFANT', description: 'Enfant (Fils/Fille)' },
      { libelle: 'CONJOINT', description: 'Conjoint / Époux / Épouse' },
      { libelle: 'PERE', description: 'Père' },
      { libelle: 'MERE', description: 'Mère' },
      { libelle: 'FRERE', description: 'Frère' },
      { libelle: 'SOEUR', description: 'Sœur' },
      { libelle: 'AUTRE', description: 'Autre / Ayant droit' },
    ]);

    const normalizeLienParente = (lien?: string): string => {
      if (!lien || !lien.trim()) return 'AUTRE';
      const clean = lien.trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (clean.includes('ENFANT') || clean.includes('FILS') || clean.includes('FILLE')) {
        return 'ENFANT';
      }
      if (clean.includes('CONJOINT') || clean.includes('EPOUX') || clean.includes('EPOUSE') || clean.includes('MARI') || clean.includes('FEMME')) {
        return 'CONJOINT';
      }
      if (clean.includes('PERE') || clean.includes('PAPA')) {
        return 'PERE';
      }
      if (clean.includes('MERE') || clean.includes('MAMAN')) {
        return 'MERE';
      }
      if (clean.includes('FRERE')) {
        return 'FRERE';
      }
      if (clean.includes('SOEUR')) {
        return 'SOEUR';
      }
      if (clean.includes('AUTRE') || clean.includes('AYANT') || clean.includes('DROIT')) {
        return 'AUTRE';
      }

      const validCodes = ['PERE', 'MERE', 'ENFANT', 'CONJOINT', 'FRERE', 'SOEUR', 'AUTRE'];
      if (validCodes.includes(clean)) {
        return clean;
      }

      return 'AUTRE';
    };

    const fetchLiensParente = async () => {
      try {
        const res = await ApiService.vueInstance.axios.get('/lien-parente');
        const list = res.data.liensParente || res.data.data?.liensParente || res.data.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          liensParenteList.value = list.filter((i: any) => i.isActive !== false);
        }
      } catch (e) {
        console.warn('Fallback liens parente import modal');
      }
    };

    fetchLiensParente();

    // Beneficiary modal (Compte Parrainé)
    const openBeneficiaryEditor = (rowIndex: number) => {
      editingBeneficiaryRowIndex.value = rowIndex;
      const row = importDataCp.value[rowIndex];
      const existing = (row && row.beneficiaries) ? JSON.parse(JSON.stringify(row.beneficiaries)) : [];

      const padded = [...existing];
      while (padded.length < 5) {
        padded.push({ nom: '', prenom: '', lienParente: '', pourcentage: 0 });
      }
      tempBeneficiaries.value = padded;
      showBeneficiaryModal.value = true;
    };

    const saveBeneficiaries = () => {
      const filtered = tempBeneficiaries.value.filter(b => b.nom || b.prenom || b.lienParente || b.pourcentage > 0);
      let total = 0;
      for (const b of filtered) {
        total += Number(b.pourcentage) || 0;
      }

      if (filtered.length > 0 && Math.abs(total - 100) > 0.01) {
        error(`La somme des parts doit faire exactement 100% (total actuel: ${total}%)`);
        return;
      }

      const idx = editingBeneficiaryRowIndex.value;
      if (idx !== null && importDataCp.value[idx]) {
        importDataCp.value[idx].beneficiaries = filtered.map(b => ({
          nom: b.nom?.trim() || '',
          prenom: b.prenom?.trim() || '',
          nomPrenoms: `${b.nom || ''} ${b.prenom || ''}`.trim(),
          lienParente: normalizeLienParente(b.lienParente),
          pourcentage: Number(b.pourcentage) || 0
        }));
      }

      showBeneficiaryModal.value = false;
      success('Bénéficiaires mis à jour');
    };

    // OBA members modal
    const openObaEditor = (rowIndex: number) => {
      editingObaRowIndex.value = rowIndex;
      const row = importDataOba.value[rowIndex];
      if (!row) return;

      tempObaMembers.value = {
        conjoint: {
          checked: row.conjointChecked === 'OUI',
          nom: row.conjointNom || '',
          prenom: row.conjointPrenom || '',
          dateNaissance: row.conjointDateNaissance || '',
          genre: row.conjointGenre || 'F',
          capital: row.conjointCapital || 0
        },
        pereAssure: {
          checked: row.pereAssureChecked === 'OUI',
          nom: row.pereAssureNom || '',
          prenom: row.pereAssurePrenom || '',
          dateNaissance: row.pereAssureDateNaissance || '',
          capital: row.pereAssureCapital || 0
        },
        mereAssure: {
          checked: row.mereAssureChecked === 'OUI',
          nom: row.mereAssureNom || '',
          prenom: row.mereAssurePrenom || '',
          dateNaissance: row.mereAssureDateNaissance || '',
          capital: row.mereAssureCapital || 0
        },
        pereConjoint: {
          checked: row.pereConjointChecked === 'OUI',
          nom: row.pereConjointNom || '',
          prenom: row.pereConjointPrenom || '',
          dateNaissance: row.pereConjointDateNaissance || '',
          capital: row.pereConjointCapital || 0
        },
        mereConjoint: {
          checked: row.mereConjointChecked === 'OUI',
          nom: row.mereConjointNom || '',
          prenom: row.mereConjointPrenom || '',
          dateNaissance: row.mereConjointDateNaissance || '',
          capital: row.mereConjointCapital || 0
        }
      };

      showObaModal.value = true;
    };

    const saveObaMembers = () => {
      const idx = editingObaRowIndex.value;
      if (idx === null || !importDataOba.value[idx]) return;

      const row = importDataOba.value[idx];
      const m = tempObaMembers.value;

      row.conjointChecked = m.conjoint.checked ? 'OUI' : 'NON';
      row.conjointNom = m.conjoint.nom?.trim() || '';
      row.conjointPrenom = m.conjoint.prenom?.trim() || '';
      row.conjointDateNaissance = m.conjoint.dateNaissance?.trim() || '';
      row.conjointGenre = m.conjoint.genre || 'F';
      row.conjointCapital = Number(m.conjoint.capital) || 0;

      row.pereAssureChecked = m.pereAssure.checked ? 'OUI' : 'NON';
      row.pereAssureNom = m.pereAssure.nom?.trim() || '';
      row.pereAssurePrenom = m.pereAssure.prenom?.trim() || '';
      row.pereAssureDateNaissance = m.pereAssure.dateNaissance?.trim() || '';
      row.pereAssureCapital = Number(m.pereAssure.capital) || 0;

      row.mereAssureChecked = m.mereAssure.checked ? 'OUI' : 'NON';
      row.mereAssureNom = m.mereAssure.nom?.trim() || '';
      row.mereAssurePrenom = m.mereAssure.prenom?.trim() || '';
      row.mereAssureDateNaissance = m.mereAssure.dateNaissance?.trim() || '';
      row.mereAssureCapital = Number(m.mereAssure.capital) || 0;

      row.pereConjointChecked = m.pereConjoint.checked ? 'OUI' : 'NON';
      row.pereConjointNom = m.pereConjoint.nom?.trim() || '';
      row.pereConjointPrenom = m.pereConjoint.prenom?.trim() || '';
      row.pereConjointDateNaissance = m.pereConjoint.dateNaissance?.trim() || '';
      row.pereConjointCapital = Number(m.pereConjoint.capital) || 0;

      row.mereConjointChecked = m.mereConjoint.checked ? 'OUI' : 'NON';
      row.mereConjointNom = m.mereConjoint.nom?.trim() || '';
      row.mereConjointPrenom = m.mereConjoint.prenom?.trim() || '';
      row.mereConjointDateNaissance = m.mereConjoint.dateNaissance?.trim() || '';
      row.mereConjointCapital = Number(m.mereConjoint.capital) || 0;

      showObaModal.value = false;
      success('Membres de la famille mis à jour');
    };

    const getObaMembersCount = (row: any): number => {
      let count = 0;
      if (row.conjointChecked === 'OUI') count++;
      if (row.pereAssureChecked === 'OUI') count++;
      if (row.mereAssureChecked === 'OUI') count++;
      if (row.pereConjointChecked === 'OUI') count++;
      if (row.mereConjointChecked === 'OUI') count++;
      return count;
    };

    const getObaMembersSummary = (row: any): string => {
      const parts: string[] = [];
      if (row.conjointChecked === 'OUI') parts.push(`Conjoint (${row.conjointNom || 'Oui'})`);
      if (row.pereAssureChecked === 'OUI') parts.push('Père');
      if (row.mereAssureChecked === 'OUI') parts.push('Mère');
      if (row.pereConjointChecked === 'OUI') parts.push('Père Conj.');
      if (row.mereConjointChecked === 'OUI') parts.push('Mère Conj.');
      return parts.join(', ') || 'Aucun';
    };

    // ========================================================
    // EXCEL TEMPLATES GENERATION (Personnalisés par nature)
    // ========================================================
    const getSampleDates = () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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
          'Référence': 'REF-AMORT-001'
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
          'Référence': 'REF-AMORT-002'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sample);
      ws['!cols'] = [
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 16 }
      ];
      return ws;
    };

    const createCpSheet = () => {
      const sample = [
        {
          'Nom Client': 'SOGLO',
          'Prénom Client': 'Albert',
          'Date de Naissance': '10/10/1990',
          'Lieu de Naissance': 'Abomey',
          'Sexe (M/F)': 'M',
          'Profession': 'Comptable',
          'Téléphone': '+229 90 12 34 56',
          'Email': 'albert.soglo@email.com',
          'Adresse': 'Abomey-Calavi, Bénin',
          'Option Capital (500000 ou 1000000)': 500000, // Option 1
          'Taux': 10.0,
          'Compte Bancaire (COURANT/EPARGNE)': 'COURANT',
          'Ref Compte': 'BJ060 01001 001234567890 12',
          'Renouvellement Auto (OUI/NON)': 'OUI',
          'Ben1_Nom': 'SOGLO',
          'Ben1_Prenom': 'Marc',
          'Ben1_Lien': 'Fils',
          'Ben1_Part': 60,
          'Ben2_Nom': 'SOGLO',
          'Ben2_Prenom': 'Lucie',
          'Ben2_Lien': 'Fille',
          'Ben2_Part': 40,
          'Ben3_Nom': '', 'Ben3_Prenom': '', 'Ben3_Lien': '', 'Ben3_Part': '',
          'Ben4_Nom': '', 'Ben4_Prenom': '', 'Ben4_Lien': '', 'Ben4_Part': '',
          'Ben5_Nom': '', 'Ben5_Prenom': '', 'Ben5_Lien': '', 'Ben5_Part': ''
        },
        {
          'Nom Client': 'HOUNNOU',
          'Prénom Client': 'Claire',
          'Date de Naissance': '18/03/1982',
          'Lieu de Naissance': 'Cotonou',
          'Sexe (M/F)': 'F',
          'Profession': 'Enseignante',
          'Téléphone': '+229 95 88 77 66',
          'Email': 'claire.hounnou@email.com',
          'Adresse': 'Cotonou, Bénin',
          'Option Capital (500000 ou 1000000)': 1000000, // Option 2
          'Taux': 10.0,
          'Compte Bancaire (COURANT/EPARGNE)': 'EPARGNE',
          'Ref Compte': 'BJ060 01002 009876543210 34',
          'Renouvellement Auto (OUI/NON)': 'OUI',
          'Ben1_Nom': 'HOUNNOU',
          'Ben1_Prenom': 'Eric',
          'Ben1_Lien': 'Conjoint',
          'Ben1_Part': 100,
          'Ben2_Nom': '', 'Ben2_Prenom': '', 'Ben2_Lien': '', 'Ben2_Part': '',
          'Ben3_Nom': '', 'Ben3_Prenom': '', 'Ben3_Lien': '', 'Ben3_Part': '',
          'Ben4_Nom': '', 'Ben4_Prenom': '', 'Ben4_Lien': '', 'Ben4_Part': '',
          'Ben5_Nom': '', 'Ben5_Prenom': '', 'Ben5_Lien': '', 'Ben5_Part': ''
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sample);
      ws['!cols'] = [
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 22 },
        { wch: 32 }, { wch: 10 }, { wch: 30 }, { wch: 26 }, { wch: 26 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }
      ];
      return ws;
    };

    const createObaSheet = () => {
      const { dateEffet, datePremiereEcheance } = getSampleDates();
      const sample = [
        {
          'Nom Client': 'MARTIN',
          'Prénom Client': 'Marie',
          'Date de Naissance': '20/08/1975',
          'Lieu de Naissance': 'Porto-Novo',
          'Sexe (M/F)': 'F',
          'Profession': 'Commerçante',
          'Téléphone': '+229 95 67 89 01',
          'Email': 'marie.martin@email.com',
          'Adresse': 'Porto-Novo, Bénin',
          'Capital (1000000 ou 2000000)': 1000000,
          'Durée': 12,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 15.0,
          'Référence': 'REF-OBA-001',
          'Conjoint(e) Garanti? (OUI/NON)': 'OUI',
          'Conjoint(e) Nom': 'MARTIN',
          'Conjoint(e) Prénom': 'Pierre',
          'Conjoint(e) Date Naissance (JJ/MM/AAAA)': '15/03/1970',
          'Conjoint(e) Genre (M/F)': 'M',
          'Conjoint(e) Capital': 500000,
          'Père de l\'Assuré Garanti? (OUI/NON)': 'OUI',
          'Père de l\'Assuré Nom': 'SESSOU',
          'Père de l\'Assuré Prénom': 'Jacques',
          'Père de l\'Assuré Date Naissance (JJ/MM/AAAA)': '12/10/1950',
          'Père de l\'Assuré Capital': 500000,
          'Mère de l\'Assuré Garanti? (OUI/NON)': 'NON',
          'Mère de l\'Assuré Nom': '', 'Mère de l\'Assuré Prénom': '', 'Mère de l\'Assuré Date Naissance (JJ/MM/AAAA)': '', 'Mère de l\'Assuré Capital': 0,
          'Père du (de la) Conjoint(e) Garanti? (OUI/NON)': 'NON',
          'Père du (de la) Conjoint(e) Nom': '', 'Père du (de la) Conjoint(e) Prénom': '', 'Père du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)': '', 'Père du (de la) Conjoint(e) Capital': 0,
          'Mère du (de la) Conjoint(e) Garanti? (OUI/NON)': 'NON',
          'Mère du (de la) Conjoint(e) Nom': '', 'Mère du (de la) Conjoint(e) Prénom': '', 'Mère du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)': '', 'Mère du (de la) Conjoint(e) Capital': 0
        },
        {
          'Nom Client': 'BIO',
          'Prénom Client': 'Ousmane',
          'Date de Naissance': '10/01/1980',
          'Lieu de Naissance': 'Parakou',
          'Sexe (M/F)': 'M',
          'Profession': 'Artisan',
          'Téléphone': '+229 97 33 22 11',
          'Email': 'ousmane.bio@email.com',
          'Adresse': 'Parakou, Bénin',
          'Capital (1000000 ou 2000000)': 2000000,
          'Durée': 12,
          'Date Effet': dateEffet,
          '1re Échéance': datePremiereEcheance,
          'Taux': 15.0,
          'Référence': 'REF-OBA-002',
          'Conjoint(e) Garanti? (OUI/NON)': 'NON',
          'Conjoint(e) Nom': '', 'Conjoint(e) Prénom': '', 'Conjoint(e) Date Naissance (JJ/MM/AAAA)': '', 'Conjoint(e) Genre (M/F)': '', 'Conjoint(e) Capital': 0,
          'Père de l\'Assuré Garanti? (OUI/NON)': 'NON',
          'Père de l\'Assuré Nom': '', 'Père de l\'Assuré Prénom': '', 'Père de l\'Assuré Date Naissance (JJ/MM/AAAA)': '', 'Père de l\'Assuré Capital': 0,
          'Mère de l\'Assuré Garanti? (OUI/NON)': 'NON',
          'Mère de l\'Assuré Nom': '', 'Mère de l\'Assuré Prénom': '', 'Mère de l\'Assuré Date Naissance (JJ/MM/AAAA)': '', 'Mère de l\'Assuré Capital': 0,
          'Père du (de la) Conjoint(e) Garanti? (OUI/NON)': 'NON',
          'Père du (de la) Conjoint(e) Nom': '', 'Père du (de la) Conjoint(e) Prénom': '', 'Père du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)': '', 'Père du (de la) Conjoint(e) Capital': 0,
          'Mère du (de la) Conjoint(e) Garanti? (OUI/NON)': 'NON',
          'Mère du (de la) Conjoint(e) Nom': '', 'Mère du (de la) Conjoint(e) Prénom': '', 'Mère du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)': '', 'Mère du (de la) Conjoint(e) Capital': 0
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sample);
      ws['!cols'] = [
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 26 },
        { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 16 },
        { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 10 }, { wch: 16 },
        { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 16 },
        { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 16 },
        { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 16 },
        { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 26 }, { wch: 16 }
      ];
      return ws;
    };

    const downloadTemplate = (nature: 'AMORT' | 'CP' | 'OBA') => {
      try {
        if (!isNatureAuthorized(nature)) {
          error(`Votre groupe n'est pas autorisé à accéder aux modèles de type ${nature}`);
          return;
        }

        const wb = XLSX.utils.book_new();
        const todayStr = new Date().toISOString().split('T')[0];

        if (nature === 'AMORT') {
          const ws = createAmortSheet();
          XLSX.utils.book_append_sheet(wb, ws, 'AMORT');
          XLSX.writeFile(wb, `Modele_Import_AMORT_${todayStr}.xlsx`);
          success('Modèle Crédit Amortissable (AMORT) téléchargé');
        } else if (nature === 'CP') {
          const ws = createCpSheet();
          XLSX.utils.book_append_sheet(wb, ws, 'CP');
          XLSX.writeFile(wb, `Modele_Import_Compte_Parraine_CP_${todayStr}.xlsx`);
          success('Modèle Compte Parrainé (CP - 2 options) téléchargé');
        } else if (nature === 'OBA') {
          const ws = createObaSheet();
          XLSX.utils.book_append_sheet(wb, ws, 'OBA');
          XLSX.writeFile(wb, `Modele_Import_OBA_${todayStr}.xlsx`);
          success('Modèle Obsèques Alafia (OBA) téléchargé');
        }
      } catch (err) {
        console.error('Erreur téléchargement modèle:', err);
        error('Erreur lors de la génération du modèle Excel');
      }
    };

    const downloadAllWorkbook = () => {
      try {
        const wb = XLSX.utils.book_new();
        let appended = 0;

        if (isNatureAuthorized('AMORT')) {
          XLSX.utils.book_append_sheet(wb, createAmortSheet(), 'AMORT');
          appended++;
        }
        if (isNatureAuthorized('CP')) {
          XLSX.utils.book_append_sheet(wb, createCpSheet(), 'CP');
          appended++;
        }
        if (isNatureAuthorized('OBA')) {
          XLSX.utils.book_append_sheet(wb, createObaSheet(), 'OBA');
          appended++;
        }

        if (appended === 0) {
          error('Aucune nature autorisée');
          return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Modele_Import_Complet_${todayStr}.xlsx`);
        success(`Classeur complet (${appended} onglets autorisés) téléchargé`);
      } catch (err) {
        console.error('Erreur téléchargement classeur:', err);
        error('Erreur lors du téléchargement du classeur');
      }
    };

    // ========================================================
    // EXCEL FILE UPLOAD AND PARSING
    // ========================================================
    const handleFileUpload = async (file: File) => {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        let parsedAmort: any[] = [];
        let parsedCp: any[] = [];
        let parsedOba: any[] = [];

        const rejectedUnauthorizedSheets: string[] = [];

        for (const sName of workbook.SheetNames) {
          const sNameUpper = sName.toUpperCase().trim();
          const worksheet = workbook.Sheets[sName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) continue;

          // Détection par nom d'onglet ou contenu
          const isAmort = sNameUpper.includes('AMORT');
          const isCp = sNameUpper.includes('CP') || sNameUpper.includes('PARRAINE') || sNameUpper.includes('PROTECTION');
          const isOba = sNameUpper.includes('OBA') || sNameUpper.includes('OBSEQUE');

          // 1. Feuille AMORT
          if (isAmort) {
            if (!isNatureAuthorized('AMORT')) {
              rejectedUnauthorizedSheets.push(`AMORT (Onglet: ${sName})`);
              continue;
            }
            parsedAmort.push(...parseAmortRows(jsonData));
          } 
          // 2. Feuille CP
          else if (isCp) {
            if (!isNatureAuthorized('CP')) {
              rejectedUnauthorizedSheets.push(`Compte Parrainé (Onglet: ${sName})`);
              continue;
            }
            parsedCp.push(...parseCpRows(jsonData));
          } 
          // 3. Feuille OBA
          else if (isOba) {
            if (!isNatureAuthorized('OBA')) {
              rejectedUnauthorizedSheets.push(`Obsèques Alafia (Onglet: ${sName})`);
              continue;
            }
            parsedOba.push(...parseObaRows(jsonData));
          } 
          // 4. Feuille générique (ex: Sheet1, Feuil1)
          else {
            const firstRow: any = jsonData[0] || {};
            const keys = Object.keys(firstRow).map(k => k.toLowerCase());

            if (keys.some(k => k.includes('ben1') || k.includes('compte bancaire') || k.includes('parrainé'))) {
              if (isNatureAuthorized('CP')) {
                parsedCp.push(...parseCpRows(jsonData));
              } else {
                rejectedUnauthorizedSheets.push(`Compte Parrainé (détecté dans ${sName})`);
              }
            } else if (keys.some(k => k.includes('conjoint') || k.includes('assuré') || k.includes('alafia'))) {
              if (isNatureAuthorized('OBA')) {
                parsedOba.push(...parseObaRows(jsonData));
              } else {
                rejectedUnauthorizedSheets.push(`Obsèques Alafia (détecté dans ${sName})`);
              }
            } else {
              // Par défaut selon l'onglet actif s'il est autorisé
              if (activeTab.value === 'CP' && isNatureAuthorized('CP')) {
                parsedCp.push(...parseCpRows(jsonData));
              } else if (activeTab.value === 'OBA' && isNatureAuthorized('OBA')) {
                parsedOba.push(...parseObaRows(jsonData));
              } else if (isNatureAuthorized('AMORT')) {
                parsedAmort.push(...parseAmortRows(jsonData));
              }
            }
          }
        }

        // Avertissement pour les feuilles non autorisées
        if (rejectedUnauthorizedSheets.length > 0) {
          error(`Attention : votre groupe n'est pas autorisé à importer les natures suivantes qui ont été ignorées : ${rejectedUnauthorizedSheets.join(', ')}`);
        }

        // Remplir les listes avec déduplication
        if (parsedAmort.length > 0) importDataAmort.value = filterUnique(parsedAmort);
        if (parsedCp.length > 0) importDataCp.value = filterUnique(parsedCp);
        if (parsedOba.length > 0) importDataOba.value = filterUnique(parsedOba);

        // Basculer l'onglet actif vers la 1re nature qui a reçu des données
        if (importDataAmort.value.length > 0 && isNatureAuthorized('AMORT')) {
          activeTab.value = 'AMORT';
        } else if (importDataCp.value.length > 0 && isNatureAuthorized('CP')) {
          activeTab.value = 'CP';
        } else if (importDataOba.value.length > 0 && isNatureAuthorized('OBA')) {
          activeTab.value = 'OBA';
        }

        const totalLoaded = importDataAmort.value.length + importDataCp.value.length + importDataOba.value.length;
        if (totalLoaded > 0) {
          success(`Fichier importé avec succès : ${importDataAmort.value.length} Amortissable(s), ${importDataCp.value.length} Compte(s) Parrainé(s), ${importDataOba.value.length} OBA`);
        } else if (rejectedUnauthorizedSheets.length === 0) {
          error('Aucune donnée valide trouvée dans le fichier.');
        }

      } catch (err) {
        console.error('Erreur lecture fichier Excel:', err);
        error('Impossible de lire le fichier Excel');
      }
    };

    const parseAmortRows = (jsonData: any[]) => {
      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      const defaultEffet = `${d}/${m}/${y}`;

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const dNext = String(nextMonth.getDate()).padStart(2, '0');
      const mNext = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const yNext = nextMonth.getFullYear();
      const defaultEch1 = `${dNext}/${mNext}/${yNext}`;

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
          prenom: row['Prénom Client'] || row['Prénom'] || row['Prenom'] || '',
          dateNaissance: row['Date de Naissance'] || row['Date Naissance'] || '',
          lieuNaissance: row['Lieu de Naissance'] || row['Lieu Naissance'] || '',
          sexe: (row['Sexe (M/F)'] || row['Sexe'] || 'M').toString().toUpperCase().trim(),
          profession: row['Profession'] || '',
          telephone: row['Téléphone'] || row['Telephone'] || '',
          email: row['Email'] || '',
          adresse: row['Adresse'] || '',
          capital: parseFloat(row['Capital'] || row['Capital (FCFA)']) || 0,
          duree: parseInt(row['Durée'] || row['Duree'] || row['Durée (mois)']) || 0,
          dateEffet,
          datePremiereEcheance,
          taux: parseFloat(row['Taux'] || row['Taux (%)']) || 0,
          reference: row['Référence'] || row['Reference'] || '',
          importSuccess: false,
          importError: null
        };
      });
    };

    const parseCpRows = (jsonData: any[]) => {
      // Date d'effet CP sera la date du jour plus 1 jour (comme dans CotationToContratModal.vue)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dTom = String(tomorrow.getDate()).padStart(2, '0');
      const mTom = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const yTom = tomorrow.getFullYear();
      const defaultEffet = `${dTom}/${mTom}/${yTom}`;

      // Date d'échéance CP = Date d'effet + 1 an - 1 jour (la veille dans un an)
      const dEch = new Date(tomorrow);
      dEch.setFullYear(dEch.getFullYear() + 1);
      dEch.setDate(dEch.getDate() - 1);
      const dEchDay = String(dEch.getDate()).padStart(2, '0');
      const dEchMonth = String(dEch.getMonth() + 1).padStart(2, '0');
      const dEchYear = dEch.getFullYear();
      const defaultEcheance = `${dEchDay}/${dEchMonth}/${dEchYear}`;

      return jsonData.map((row: any) => {
        const beneficiaries: any[] = [];
        for (let j = 1; j <= 5; j++) {
          const bNom = row[`Ben${j}_Nom`]?.toString().trim() || '';
          const bPrenom = row[`Ben${j}_Prenom`]?.toString().trim() || '';
          const bLien = row[`Ben${j}_Lien`]?.toString().trim() || '';
          const bPart = parseFloat(row[`Ben${j}_Part`] || row[`Ben${j}_Part (%)`]);
          
          if (bNom || bPrenom || bLien || !isNaN(bPart)) {
            beneficiaries.push({
              nom: bNom,
              prenom: bPrenom,
              nomPrenoms: `${bNom} ${bPrenom}`.trim(),
              lienParente: normalizeLienParente(bLien),
              pourcentage: isNaN(bPart) ? 0 : bPart
            });
          }
        }

        const rawCapital = parseFloat(row['Option Capital (500000 ou 1000000)'] || row['Option Capital'] || row['Capital']) || 0;
        const cbRaw = String(row['Compte Bancaire (COURANT/EPARGNE)'] || row['Compte Bancaire'] || '').trim().toUpperCase();
        let cb = cbRaw;
        if (cbRaw.includes('COURANT')) cb = 'COURANT';
        else if (cbRaw.includes('EPARGNE') || cbRaw.includes('ÉPARGNE')) cb = 'EPARGNE';

        return {
          nom: row['Nom Client'] || row['Nom'] || '',
          prenom: row['Prénom Client'] || row['Prénom'] || row['Prenom'] || '',
          dateNaissance: row['Date de Naissance'] || row['Date Naissance'] || '',
          lieuNaissance: row['Lieu de Naissance'] || row['Lieu Naissance'] || '',
          sexe: (row['Sexe (M/F)'] || row['Sexe'] || 'M').toString().toUpperCase().trim(),
          profession: row['Profession'] || '',
          telephone: row['Téléphone'] || row['Telephone'] || '',
          email: row['Email'] || '',
          adresse: row['Adresse'] || '',
          capital: rawCapital,
          duree: 12, // Toujours 12 mois pour CP
          dateEffet: defaultEffet, // Date du jour + 1 jour
          datePremiereEcheance: defaultEcheance, // dateEffet + 1 an - 1 jour
          dateEcheance: defaultEcheance,
          taux: parseFloat(row['Taux'] || row['Taux (%)']) || 10,
          compteBancaire: cb || 'COURANT',
          numeroCompte: row['Ref Compte'] || row['Réf Compte'] || row['Numéro Compte'] || row['Numero Compte'] || '',
          renouvellementAuto: String(row['Renouvellement Auto (OUI/NON)'] || row['Renouvellement Auto'] || '').toUpperCase() === 'OUI',
          beneficiaries,
          reference: row['Référence'] || row['Reference'] || '',
          importSuccess: false,
          importError: null
        };
      });
    };

    const parseObaRows = (jsonData: any[]) => {
      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      const defaultEffet = `${d}/${m}/${y}`;

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const dNext = String(nextMonth.getDate()).padStart(2, '0');
      const mNext = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const yNext = nextMonth.getFullYear();
      const defaultEch1 = `${dNext}/${mNext}/${yNext}`;

      return jsonData.map((row: any) => {
        const dateEffet = row['Date Effet'] || defaultEffet;
        let datePremiereEcheance = row['1re Échéance'] || row['1ère Échéance'] || '';

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
          prenom: row['Prénom Client'] || row['Prénom'] || row['Prenom'] || '',
          dateNaissance: row['Date de Naissance'] || row['Date Naissance'] || '',
          lieuNaissance: row['Lieu de Naissance'] || row['Lieu Naissance'] || '',
          sexe: (row['Sexe (M/F)'] || row['Sexe'] || 'M').toString().toUpperCase().trim(),
          profession: row['Profession'] || '',
          telephone: row['Téléphone'] || row['Telephone'] || '',
          email: row['Email'] || '',
          adresse: row['Adresse'] || '',
          capital: parseFloat(row['Capital (1000000 ou 2000000)'] || row['Capital']) || 0,
          duree: 12, // Toujours 12 mois pour OBA
          dateEffet,
          datePremiereEcheance,
          taux: parseFloat(row['Taux'] || row['Taux (%)']) || 15,
          reference: row['Référence'] || row['Reference'] || '',
        // Conjoint
        conjointChecked: (row['Conjoint(e) Garanti? (OUI/NON)'] || row['Conjoint Garanti?'] || 'NON').toString().toUpperCase().trim(),
        conjointNom: row['Conjoint(e) Nom'] || row['Conjoint Nom'] || '',
        conjointPrenom: row['Conjoint(e) Prénom'] || row['Conjoint Prénom'] || '',
        conjointDateNaissance: row['Conjoint(e) Date Naissance (JJ/MM/AAAA)'] || row['Conjoint Date Naissance'] || '',
        conjointGenre: (row['Conjoint(e) Genre (M/F)'] || 'F').toString().toUpperCase().trim(),
        conjointCapital: parseFloat(row['Conjoint(e) Capital'] || row['Conjoint Capital']) || 0,
        // Père Assuré
        pereAssureChecked: (row['Père de l\'Assuré Garanti? (OUI/NON)'] || row['Père Assuré Garanti?'] || 'NON').toString().toUpperCase().trim(),
        pereAssureNom: row['Père de l\'Assuré Nom'] || row['Père Assuré Nom'] || '',
        pereAssurePrenom: row['Père de l\'Assuré Prénom'] || row['Père Assuré Prénom'] || '',
        pereAssureDateNaissance: row['Père de l\'Assuré Date Naissance (JJ/MM/AAAA)'] || row['Père Assuré Date Naissance'] || '',
        pereAssureCapital: parseFloat(row['Père de l\'Assuré Capital']) || 0,
        // Mère Assuré
        mereAssureChecked: (row['Mère de l\'Assuré Garanti? (OUI/NON)'] || row['Mère Assuré Garantie?'] || 'NON').toString().toUpperCase().trim(),
        mereAssureNom: row['Mère de l\'Assuré Nom'] || row['Mère Assuré Nom'] || '',
        mereAssurePrenom: row['Mère de l\'Assuré Prénom'] || row['Mère Assuré Prénom'] || '',
        mereAssureDateNaissance: row['Mère de l\'Assuré Date Naissance (JJ/MM/AAAA)'] || row['Mère Assuré Date Naissance'] || '',
        mereAssureCapital: parseFloat(row['Mère de l\'Assuré Capital']) || 0,
        // Père Conjoint
        pereConjointChecked: (row['Père du (de la) Conjoint(e) Garanti? (OUI/NON)'] || 'NON').toString().toUpperCase().trim(),
        pereConjointNom: row['Père du (de la) Conjoint(e) Nom'] || '',
        pereConjointPrenom: row['Père du (de la) Conjoint(e) Prénom'] || '',
        pereConjointDateNaissance: row['Père du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)'] || '',
        pereConjointCapital: parseFloat(row['Père du (de la) Conjoint(e) Capital']) || 0,
        // Mère Conjoint
        mereConjointChecked: (row['Mère du (de la) Conjoint(e) Garanti? (OUI/NON)'] || 'NON').toString().toUpperCase().trim(),
        mereConjointNom: row['Mère du (de la) Conjoint(e) Nom'] || '',
        mereConjointPrenom: row['Mère du (de la) Conjoint(e) Prénom'] || '',
        mereConjointDateNaissance: row['Mère du (de la) Conjoint(e) Date Naissance (JJ/MM/AAAA)'] || '',
        mereConjointCapital: parseFloat(row['Mère du (de la) Conjoint(e) Capital']) || 0,
        importSuccess: false,
        importError: null
      };
    });
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

    // ========================================================
    // VALIDATION DES DONNÉES PAR NATURE
    // ========================================================
    const validateRowData = (row: any, type: 'AMORT' | 'CP' | 'OBA'): { isValid: boolean; errors: string[]; warnings: string[] } => {
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

      // Contrôle de l'âge
      const age = calculateAge(row.dateNaissance);
      if (age === 0) {
        errors.push(`Date de naissance invalide : ${row.dateNaissance}`);
      }

      // Règles spécifiques : AMORT
      if (type === 'AMORT') {
        if (age > 0 && (age < 18 || age > 64)) {
          errors.push(`Âge invalide pour Amortissable : ${age} ans (requis : 18 à 64 ans)`);
        }
        if (!row.duree || row.duree < 1 || row.duree > 120) {
          errors.push(`Durée incorrecte : ${row.duree} mois (doit être de 1 à 120 mois)`);
        }

        // Date d'effet : ne peut pas être antérieure à aujourd'hui (aligné avec conversion contrat)
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

        let capitalMax = 30000000;
        if (age >= 60 && age <= 64) capitalMax = 10000000;
        if (row.capital > capitalMax) {
          errors.push(`Capital trop élevé (max ${capitalMax.toLocaleString('fr-FR')} FCFA pour ${age} ans)`);
        }
      }

      // Règles spécifiques : CP (Compte Parrainé)
      else if (type === 'CP') {
        if (age > 0 && (age < 18 || age > 75)) {
          errors.push(`Âge invalide pour Compte Parrainé : ${age} ans (requis : 18 à 75 ans)`);
        }

        // Durée obligatoirement 12 mois
        if (row.duree && row.duree !== 12) {
          errors.push('La durée d\'un Compte Parrainé est obligatoirement de 12 mois');
        }
        
        // CAPITAL STRICT : 2 options (500 000 ou 1 000 000)
        if (row.capital !== 500000 && row.capital !== 1000000) {
          errors.push(`Option Capital invalide : ${row.capital ? row.capital.toLocaleString('fr-FR') : 0} FCFA (doit être exclusivement 500 000 FCFA [Option 1] ou 1 000 000 FCFA [Option 2])`);
        }

        if (!row.compteBancaire || (row.compteBancaire !== 'COURANT' && row.compteBancaire !== 'EPARGNE')) {
          errors.push('Compte Bancaire obligatoire (COURANT ou EPARGNE)');
        }
        if (!row.numeroCompte || !row.numeroCompte.trim()) {
          errors.push('Réf Compte obligatoire');
        }

        // Bénéficiaires : 1 à 5, total 100%
        const bens = row.beneficiaries || [];
        if (bens.length === 0) {
          errors.push('Au moins 1 bénéficiaire requis pour un Compte Parrainé');
        } else if (bens.length > 5) {
          errors.push('Maximum 5 bénéficiaires autorisés');
        } else {
          let sumParts = 0;
          bens.forEach((b: any, idx: number) => {
            if (!b.nom && !b.nomPrenoms) errors.push(`Bénéficiaire ${idx + 1} : nom/prénom manquant`);
            if (!b.lienParente) errors.push(`Bénéficiaire ${idx + 1} : lien manquant`);
            if (isNaN(b.pourcentage) || b.pourcentage <= 0) {
              errors.push(`Bénéficiaire ${idx + 1} : part (%) invalide`);
            } else {
              sumParts += b.pourcentage;
            }
          });
          if (bens.length > 0 && Math.abs(sumParts - 100) > 0.01) {
            errors.push(`Somme des parts des bénéficiaires : ${sumParts}% (doit être exactement 100%)`);
          }
        }
      }

      // Règles spécifiques : OBA (Obsèques Alafia)
      else if (type === 'OBA') {
        if (age > 0 && (age < 18 || age > 75)) {
          errors.push(`Âge invalide pour Obsèques Alafia : ${age} ans (requis : 18 à 75 ans)`);
        }
        if (row.capital !== 1000000 && row.capital !== 2000000) {
          errors.push(`Capital OBA invalide : ${row.capital ? row.capital.toLocaleString('fr-FR') : 0} FCFA (doit être 1 000 000 ou 2 000 000 FCFA)`);
        }
        if (row.duree && row.duree !== 12) {
          errors.push(`Durée OBA incorrecte : ${row.duree} mois (la durée est obligatoirement de 12 mois)`);
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

        // Validation conjoint si garanti
        if (row.conjointChecked === 'OUI') {
          if (!row.conjointNom || !row.conjointPrenom) errors.push('Nom et prénom du conjoint requis');
          if (!row.conjointDateNaissance) errors.push('Date de naissance du conjoint requise');
        }
      }

      if (row.taux < 0 || row.taux > 100) {
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

    // ========================================================
    // IMPORTATION EN BASE DE DONNÉES
    // ========================================================
    const importContracts = async () => {
      try {
        isImporting.value = true;
        showImportResults.value = false;
        importResults.value = null;

        const rowsToImport: Array<{ row: any; originalIndex: number; tab: 'AMORT' | 'CP' | 'OBA' }> = [];

        // AMORT
        if (isNatureAuthorized('AMORT')) {
          importDataAmort.value.forEach((row, idx) => {
            if (!row.importSuccess && validateRowData(row, 'AMORT').isValid) {
              rowsToImport.push({ row, originalIndex: idx, tab: 'AMORT' });
            }
          });
        }

        // CP (Compte Parrainé)
        if (isNatureAuthorized('CP')) {
          importDataCp.value.forEach((row, idx) => {
            if (!row.importSuccess && validateRowData(row, 'CP').isValid) {
              rowsToImport.push({ row, originalIndex: idx, tab: 'CP' });
            }
          });
        }

        // OBA (Obsèques Alafia)
        if (isNatureAuthorized('OBA')) {
          importDataOba.value.forEach((row, idx) => {
            if (!row.importSuccess && validateRowData(row, 'OBA').isValid) {
              rowsToImport.push({ row, originalIndex: idx, tab: 'OBA' });
            }
          });
        }

        if (rowsToImport.length === 0) {
          error('Aucun contrat valide à importer pour vos natures autorisées');
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
            birthplace: placeOfBirthVal.toUpperCase() || 'NON RENSEIGNÉ',
            gender: (row.sexe || 'M').trim().toUpperCase(),
            occupation: occupationVal.toUpperCase() || 'NON RENSEIGNÉ',
            profession: occupationVal.toUpperCase() || 'NON RENSEIGNÉ',
            phone: row.telephone || 'NON RENSEIGNÉ',
            email: row.email || '',
            address: addressVal.toUpperCase() || 'NON RENSEIGNÉE',
            idTypeCustomer: 1
          };

          if (item.tab === 'AMORT') {
            return {
              contractType: 'STANDARD',
              capital: row.capital,
              duration: row.duree,
              dateEff: convertDateToISO(row.dateEffet),
              dateEch1: convertDateToISO(row.datePremiereEcheance),
              taux: row.taux,
              garantieCompl: 'NON',
              idNatureCredit: 1, // AMORT
              creditType: 'AMORT',
              clientData
            };
          } else if (item.tab === 'CP') {
            // Calcul date d'effet et date d'échéance selon conversion contrat
            const effIso = convertDateToISO(row.dateEffet);
            const dEff = new Date(effIso);
            let echIso = '';
            if (!isNaN(dEff.getTime())) {
              const dEch = new Date(dEff);
              dEch.setFullYear(dEch.getFullYear() + 1);
              dEch.setDate(dEch.getDate() - 1);
              echIso = dEch.toISOString().split('T')[0];
            } else {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dEch = new Date(tomorrow);
              dEch.setFullYear(dEch.getFullYear() + 1);
              dEch.setDate(dEch.getDate() - 1);
              echIso = dEch.toISOString().split('T')[0];
            }

            return {
              contractType: 'STANDARD',
              capital: row.capital,
              duration: 12, // Toujours 12 mois pour CP
              dateEff: effIso,
              dateEch1: echIso, // Date d'effet + 1 an - 1 jour
              dateEch: echIso,  // Date d'effet + 1 an - 1 jour
              taux: row.taux,
              garantieCompl: 'NON',
              idNatureCredit: 2, // CP (Compte Parrainé)
              creditType: 'CP',
              compteBancaire: row.compteBancaire,
              numeroCompte: row.numeroCompte,
              renouvellementAuto: row.renouvellementAuto,
              beneficiaries: row.beneficiaries || [],
              clientData
            };
          } else { // OBA
            const obaOptions: any = {};
            if (row.conjointChecked === 'OUI') {
              obaOptions.conjoint = {
                checked: true,
                lastname: row.conjointNom?.toUpperCase().trim() || '',
                firstname: row.conjointPrenom?.trim() || '',
                birthdate: convertDateToISO(row.conjointDateNaissance),
                gender: row.conjointGenre || 'F',
                capitalAssure: Number(row.conjointCapital) || 0
              };
            }
            if (row.pereAssureChecked === 'OUI') {
              obaOptions.ascendant1 = {
                checked: true,
                lastname: row.pereAssureNom?.toUpperCase().trim() || '',
                firstname: row.pereAssurePrenom?.trim() || '',
                birthdate: convertDateToISO(row.pereAssureDateNaissance),
                gender: 'M',
                capitalAssure: Number(row.pereAssureCapital) || 0
              };
            }
            if (row.mereAssureChecked === 'OUI') {
              obaOptions.ascendant2 = {
                checked: true,
                lastname: row.mereAssureNom?.toUpperCase().trim() || '',
                firstname: row.mereAssurePrenom?.trim() || '',
                birthdate: convertDateToISO(row.mereAssureDateNaissance),
                gender: 'F',
                capitalAssure: Number(row.mereAssureCapital) || 0
              };
            }
            if (row.pereConjointChecked === 'OUI') {
              obaOptions.ascendant3 = {
                checked: true,
                lastname: row.pereConjointNom?.toUpperCase().trim() || '',
                firstname: row.pereConjointPrenom?.trim() || '',
                birthdate: convertDateToISO(row.pereConjointDateNaissance),
                gender: 'M',
                capitalAssure: Number(row.pereConjointCapital) || 0
              };
            }
            if (row.mereConjointChecked === 'OUI') {
              obaOptions.ascendant4 = {
                checked: true,
                lastname: row.mereConjointNom?.toUpperCase().trim() || '',
                firstname: row.mereConjointPrenom?.trim() || '',
                birthdate: convertDateToISO(row.mereConjointDateNaissance),
                gender: 'F',
                capitalAssure: Number(row.mereConjointCapital) || 0
              };
            }

            return {
              contractType: 'STANDARD',
              capital: row.capital,
              duration: row.duree,
              dateEff: convertDateToISO(row.dateEffet),
              dateEch1: convertDateToISO(row.datePremiereEcheance),
              taux: row.taux,
              garantieCompl: 'NON',
              idNatureCredit: 3, // OBA (Obsèques Alafia)
              creditType: 'OBA',
              obaOptions: Object.keys(obaOptions).length > 0 ? obaOptions : undefined,
              clientData
            };
          }
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
            const targetArray = matchedItem.tab === 'AMORT' 
              ? importDataAmort.value 
              : matchedItem.tab === 'CP' 
                ? importDataCp.value 
                : importDataOba.value;

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
      importDataCp.value = [];
      importDataOba.value = [];
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
      importDataCp,
      importDataOba,
      authorizedNatures,
      authorizedCount,
      isNatureAuthorized,
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

      // Modal Bénéficiaires (CP)
      showBeneficiaryModal,
      tempBeneficiaries,
      liensParenteList,
      openBeneficiaryEditor,
      saveBeneficiaries,

      // Modal Membres Famille (OBA)
      showObaModal,
      tempObaMembers,
      openObaEditor,
      saveObaMembers,
      getObaMembersCount,
      getObaMembersSummary,

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
