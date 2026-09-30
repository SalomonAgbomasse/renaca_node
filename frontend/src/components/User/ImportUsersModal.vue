<template>
  <Modal
    :isVisible="isVisible"
    :title="'Importation en masse d\'utilisateurs'"
    :icon="'fas fa-users-cog'"
    :size="'xlarge'"
    @close="closeModal"
  >
    <div class="import-modal-wrapper">
      <!-- 1. En-tête rapide & Guide d'importation -->
      <div class="top-action-bar mb-3 p-3 rounded-3 bg-light border d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="step-guide-icon bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center">
            <i class="fas fa-file-excel fs-4"></i>
          </div>
          <div>
            <h6 class="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
              <span>Guide d'importation rapide</span>
              <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill fw-medium">Format .xlsx / .xls</span>
            </h6>
            <p class="mb-0 text-muted small">
              <span class="step-num">1</span> Téléchargez le modèle 
              <i class="fas fa-chevron-right text-muted mx-1" style="font-size: 0.7rem;"></i>
              <span class="step-num">2</span> Renseignez les colonnes (*)
              <i class="fas fa-chevron-right text-muted mx-1" style="font-size: 0.7rem;"></i>
              <span class="step-num">3</span> Déposez le fichier ci-dessous
            </p>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Bouton Télécharger le modèle -->
          <button 
            type="button"
            class="btn btn-outline-success d-inline-flex align-items-center gap-2 shadow-sm"
            @click="downloadTemplate" 
            :disabled="isDownloading"
          >
            <i v-if="!isDownloading" class="fas fa-download"></i>
            <div v-else class="spinner-border spinner-border-sm" role="status"></div>
            <span>{{ isDownloading ? 'Génération...' : 'Télécharger le modèle Excel' }}</span>
          </button>

          <!-- Bouton toggle références (Rôles & Agences) -->
          <button 
            type="button"
            class="btn btn-outline-secondary d-inline-flex align-items-center gap-2 shadow-sm"
            :class="{ 'active': showReferenceDrawer }"
            @click="showReferenceDrawer = !showReferenceDrawer"
          >
            <i class="fas fa-database"></i>
            <span>Valeurs de référence</span>
            <span class="badge bg-secondary rounded-pill ms-1">{{ roles.length + agencies.length }}</span>
            <i class="fas" :class="showReferenceDrawer ? 'fa-chevron-up' : 'fa-chevron-down'" style="font-size: 0.8rem;"></i>
          </button>
        </div>
      </div>

      <!-- 2. Tiroir escamotable des références (Rôles & Agences) -->
      <transition name="drawer-fade">
        <div v-if="showReferenceDrawer" class="reference-drawer card shadow-sm border mb-3">
          <div class="card-header bg-white py-2 px-3 d-flex justify-content-between align-items-center">
            <span class="fw-bold small text-secondary d-flex align-items-center gap-2">
              <i class="fas fa-info-circle text-primary"></i>
              Valeurs exactes à renseigner dans les colonnes <strong>Rôle*</strong> et <strong>Agence*</strong> du fichier Excel
            </span>
            <button class="btn btn-sm btn-link text-decoration-none text-muted p-0" @click="showReferenceDrawer = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="card-body p-3">
            <div class="row g-3">
              <!-- Rôles -->
              <div class="col-md-6 border-end-md">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-bold text-primary small d-flex align-items-center gap-2">
                    <i class="fas fa-shield-alt"></i> Rôles autorisés ({{ roles.length }})
                  </span>
                  <small class="text-muted fst-italic">Cliquer pour copier</small>
                </div>
                <div v-if="loadingRoles" class="text-center py-2 text-muted small">
                  <div class="spinner-border spinner-border-sm me-1"></div> Chargement des rôles...
                </div>
                <div v-else class="reference-tags-container">
                  <div 
                    v-for="role in roles" 
                    :key="role.id" 
                    class="reference-tag role-tag"
                    :title="role.desc || role.libelle"
                    @click="copyToClipboard(role.libelle)"
                  >
                    <span class="tag-title">{{ role.libelle }}</span>
                    <span v-if="role.desc" class="tag-desc">{{ role.desc }}</span>
                  </div>
                </div>
              </div>

              <!-- Agences -->
              <div class="col-md-6">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fw-bold text-success small d-flex align-items-center gap-2">
                    <i class="fas fa-building"></i> Agences disponibles ({{ agencies.length }})
                  </span>
                  <small class="text-muted fst-italic">Cliquer pour copier</small>
                </div>
                <div v-if="loadingAgencies" class="text-center py-2 text-muted small">
                  <div class="spinner-border spinner-border-sm me-1"></div> Chargement des agences...
                </div>
                <div v-else class="reference-tags-container">
                  <div 
                    v-for="agency in agencies" 
                    :key="agency.id" 
                    class="reference-tag agency-tag"
                    :title="agency.address || agency.name"
                    @click="copyToClipboard(agency.name)"
                  >
                    <span class="tag-title">{{ agency.name }}</span>
                    <span v-if="agency.address" class="tag-desc">{{ agency.address }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 3. Zone de Drag & Drop héroïque (immédiatement accessible) -->
      <div 
        v-if="!selectedFile"
        class="upload-dropzone mb-3"
        :class="{ 'drag-active': isDragOver }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @click="triggerFileSelect"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          class="d-none"
          @change="handleFileSelect"
        />
        <div class="dropzone-content text-center py-4 px-3">
          <div class="dropzone-icon mb-3">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <h5 class="fw-bold text-dark mb-1">Glissez-déposez votre fichier Excel ici</h5>
          <p class="text-muted mb-3 small">
            ou <span class="text-success fw-bold text-decoration-underline">cliquez pour parcourir vos dossiers</span>
          </p>
          <div class="dropzone-badges d-flex justify-content-center gap-2 flex-wrap">
            <span class="badge bg-light text-secondary border">
              <i class="fas fa-file-excel text-success me-1"></i> Fichiers .xlsx, .xls
            </span>
            <span class="badge bg-light text-secondary border">
              <i class="fas fa-bolt text-warning me-1"></i> Analyse et validation automatique
            </span>
          </div>
        </div>
      </div>

      <!-- Fichier sélectionné : Carte résumé élégante -->
      <div v-else class="file-loaded-card card border-0 shadow-sm mb-3">
        <div class="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="file-card-icon rounded-3 bg-success text-white d-flex align-items-center justify-content-center">
              <i class="fas fa-file-excel fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="fw-bold text-dark fs-6">{{ selectedFile.name }}</span>
                <span class="badge bg-light text-muted border">{{ formatFileSize(selectedFile.size) }}</span>
                <span v-if="isProcessing" class="badge bg-info-subtle text-info border border-info-subtle">
                  <div class="spinner-border spinner-border-sm me-1" style="width: 12px; height: 12px;"></div>
                  Analyse en cours...
                </span>
                <span v-else-if="previewData.length > 0" class="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {{ previewData.length }} ligne(s) détectée(s)
                </span>
              </div>
              <small class="text-muted d-block mt-1">
                Fichier chargé avec succès. Vous pouvez inspecter et valider les données ci-dessous.
              </small>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 shadow-none"
              @click="triggerFileSelect"
              :disabled="isProcessing"
            >
              <i class="fas fa-sync-alt me-1"></i> Changer de fichier
            </button>
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 shadow-none"
              @click="removeFile"
              :disabled="isProcessing"
            >
              <i class="fas fa-trash-alt me-1"></i> Retirer
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Section d'aperçu des données & validation -->
      <div v-if="previewData.length > 0" class="preview-panel">
        <!-- KPI summary stats -->
        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <div class="stat-pill-card stat-total">
              <div class="stat-icon"><i class="fas fa-users"></i></div>
              <div class="stat-data">
                <span class="stat-num">{{ previewData.length }}</span>
                <span class="stat-label">Utilisateurs détectés</span>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-pill-card stat-valid">
              <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
              <div class="stat-data">
                <span class="stat-num">{{ validCount }}</span>
                <span class="stat-label">Prêts à être créés</span>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-pill-card" :class="errorCount > 0 ? 'stat-error' : 'stat-neutral'">
              <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
              <div class="stat-data">
                <span class="stat-num">{{ errorCount }}</span>
                <span class="stat-label">{{ errorCount > 0 ? 'Lignes à corriger' : 'Aucune anomalie' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alert si erreurs bloquantes -->
        <div v-if="errorCount > 0" class="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="fas fa-exclamation-circle text-warning fs-5"></i>
            <span class="small">
              <strong>{{ errorCount }} utilisateur(s)</strong> comportent des informations invalides (rôle inexistant, email invalide, champs obligatoires manquants).
            </span>
          </div>
          <button 
            type="button" 
            class="btn btn-warning btn-sm d-inline-flex align-items-center gap-1 fw-bold shadow-none"
            @click="exportErrors"
          >
            <i class="fas fa-file-export"></i>
            Exporter le rapport des erreurs (.xlsx)
          </button>
        </div>

        <!-- Toolbar Filtres & Recherche -->
        <div class="table-toolbar mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              class="btn" 
              :class="activeFilter === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'"
              @click="activeFilter = 'ALL'"
            >
              Tous <span class="badge bg-secondary ms-1">{{ previewData.length }}</span>
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="activeFilter === 'VALID' ? 'btn-success' : 'btn-outline-secondary'"
              @click="activeFilter = 'VALID'"
            >
              Valides <span class="badge bg-success-subtle text-success ms-1">{{ validCount }}</span>
            </button>
            <button 
              type="button" 
              class="btn" 
              :class="activeFilter === 'ERROR' ? 'btn-danger' : 'btn-outline-secondary'"
              @click="activeFilter = 'ERROR'"
            >
              Erreurs <span class="badge bg-danger-subtle text-danger ms-1">{{ errorCount }}</span>
            </button>
          </div>

          <div class="search-box position-relative" style="min-width: 250px;">
            <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style="font-size: 0.85rem;"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-control form-control-sm ps-5 pe-4 rounded-pill shadow-none"
              placeholder="Filtrer par nom, email, rôle..."
            />
            <button 
              v-if="searchQuery" 
              class="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-2"
              @click="searchQuery = ''"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Table de prévisualisation moderne -->
        <div class="preview-table-container border rounded-3 overflow-hidden shadow-sm bg-white mb-2">
          <div class="table-responsive" style="max-height: 340px;">
            <table class="table table-hover align-middle mb-0 custom-preview-table">
              <thead>
                <tr>
                  <th style="width: 45px;" class="text-center">#</th>
                  <th>Nom & Prénoms</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Agence</th>
                  <th>Statut</th>
                  <th style="min-width: 170px;">Validation</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="user in filteredPreviewData" 
                  :key="user.rowNumber"
                  :class="{ 'row-error': user.hasError, 'row-valid': !user.hasError }"
                >
                  <td class="text-center text-muted small fw-bold">{{ user.rowNumber }}</td>
                  <td>
                    <div class="fw-bold text-dark">{{ user.lastname }} {{ user.firstname }}</div>
                    <small v-if="user.fonction" class="text-muted d-block" style="font-size: 0.75rem;">
                      {{ user.fonction }}
                    </small>
                  </td>
                  <td>
                    <span :class="user.emailError ? 'text-danger fw-bold' : 'text-dark'">
                      {{ user.email || '—' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-nowrap">{{ user.phone || '—' }}</span>
                  </td>
                  <td>
                    <span 
                      v-if="user.roleName" 
                      class="badge bg-primary-subtle text-primary border border-primary-subtle"
                    >
                      {{ user.roleName }}
                    </span>
                    <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle">
                      {{ user.rawRole || 'Non spécifié' }}
                    </span>
                  </td>
                  <td>
                    <span 
                      v-if="user.agencyName" 
                      class="badge bg-success-subtle text-success border border-success-subtle"
                    >
                      {{ user.agencyName }}
                    </span>
                    <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle">
                      {{ user.rawAgency || 'Non spécifiée' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(user.status)">
                      {{ getStatusLabel(user.status) }}
                    </span>
                  </td>
                  <td>
                    <div v-if="!user.hasError" class="d-inline-flex align-items-center gap-1 text-success small fw-bold">
                      <i class="fas fa-check-circle"></i> Valide
                    </div>
                    <div v-else class="errors-list">
                      <div v-for="(err, eIdx) in user.errorsList" :key="eIdx" class="error-chip text-danger small">
                        <i class="fas fa-times-circle me-1"></i> {{ err }}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredPreviewData.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fas fa-filter me-2"></i> Aucun utilisateur ne correspond à ce filtre ou recherche.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center text-muted small px-1">
          <span>Affichage de {{ filteredPreviewData.length }} utilisateur(s) sur {{ previewData.length }}</span>
          <span v-if="errorCount > 0" class="text-danger fw-bold">
            <i class="fas fa-ban me-1"></i> L'importation est désactivée tant qu'il subsiste des erreurs.
          </span>
          <span v-else class="text-success fw-bold">
            <i class="fas fa-check-double me-1"></i> Toutes les données sont conformes et prêtes à être importées.
          </span>
        </div>
      </div>
    </div>

    <!-- 5. Footer unifié & toujours accessible -->
    <template #footer>
      <div class="w-100 d-flex justify-content-between align-items-center">
        <div>
          <button 
            type="button" 
            class="btn btn-outline-secondary me-2" 
            @click="closeModal" 
            :disabled="isImporting"
          >
            <i class="fas fa-times me-2"></i>
            {{ previewData.length > 0 ? 'Annuler' : 'Fermer' }}
          </button>
          <button 
            v-if="selectedFile" 
            type="button" 
            class="btn btn-link text-muted text-decoration-none p-0" 
            @click="removeFile"
            :disabled="isImporting"
          >
            <small><i class="fas fa-undo me-1"></i> Réinitialiser</small>
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- Exporter les erreurs si présentes -->
          <button 
            v-if="errorCount > 0" 
            type="button" 
            class="btn btn-outline-warning" 
            @click="exportErrors"
            :disabled="isImporting"
          >
            <i class="fas fa-file-export me-2"></i>
            Exporter erreurs ({{ errorCount }})
          </button>

          <!-- Bouton final d'importation -->
          <button 
            type="button" 
            class="btn btn-success d-inline-flex align-items-center gap-2 px-3 fw-bold shadow-sm"
            @click="importUsers" 
            :disabled="previewData.length === 0 || errorCount > 0 || isImporting"
          >
            <i v-if="!isImporting" class="fas fa-check-circle"></i>
            <div v-else class="spinner-border spinner-border-sm" role="status"></div>
            <span>
              {{ isImporting ? 'Importation en cours...' : `Importer ${validCount} utilisateur(s)` }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import Modal from '../Common/Modal.vue';
import ApiService from '../../services/ApiService';
import { success, error } from '../../utils/utils';
import * as XLSX from 'xlsx';

interface ImportUser {
  rowNumber: number;
  lastname: string;
  firstname: string;
  email: string;
  phone: string;
  gender: string;
  birthdate?: string;
  address: string;
  fonction?: string;
  idRole: number;
  idAgency: number;
  status: string;
  password: string;
  // Champs d'aide et validation
  rawRole?: string;
  rawAgency?: string;
  hasError: boolean;
  emailError?: string;
  roleError?: string;
  agencyError?: string;
  roleName?: string;
  agencyName?: string;
  errorsList: string[];
}

export default defineComponent({
  name: 'ImportUsersModal',
  components: {
    Modal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'imported'],
  setup(props, { emit }) {
    // Refs
    const fileInput = ref<HTMLInputElement | null>(null);
    const selectedFile = ref<File | null>(null);
    const isDragOver = ref(false);
    const isDownloading = ref(false);
    const isProcessing = ref(false);
    const isImporting = ref(false);
    const previewData = ref<ImportUser[]>([]);
    const roles = ref<any[]>([]);
    const agencies = ref<any[]>([]);
    const loadingRoles = ref(false);
    const loadingAgencies = ref(false);
    const showReferenceDrawer = ref(false);
    const activeFilter = ref<'ALL' | 'VALID' | 'ERROR'>('ALL');
    const searchQuery = ref('');

    // Computed
    const errorCount = computed(() => previewData.value.filter(u => u.hasError).length);
    const validCount = computed(() => previewData.value.filter(u => !u.hasError).length);

    const filteredPreviewData = computed(() => {
      let list = previewData.value;

      // Filtre de validité
      if (activeFilter.value === 'VALID') {
        list = list.filter(u => !u.hasError);
      } else if (activeFilter.value === 'ERROR') {
        list = list.filter(u => u.hasError);
      }

      // Filtre de recherche
      const q = searchQuery.value.trim().toLowerCase();
      if (q) {
        list = list.filter(u => 
          (u.lastname && u.lastname.toLowerCase().includes(q)) ||
          (u.firstname && u.firstname.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          (u.roleName && u.roleName.toLowerCase().includes(q)) ||
          (u.agencyName && u.agencyName.toLowerCase().includes(q))
        );
      }

      return list;
    });

    // Copier un libellé de référence dans le presse-papier
    const copyToClipboard = async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        success(`"${text}" copié dans le presse-papier !`);
      } catch (err) {
        console.warn('Impossible de copier automatiquement', err);
      }
    };

    // Fermeture
    const closeModal = () => {
      emit('close');
      resetImport();
    };

    const triggerFileSelect = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
        await processFile();
      }
    };

    const handleDrop = async (event: DragEvent) => {
      isDragOver.value = false;
      if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        selectedFile.value = event.dataTransfer.files[0];
        await processFile();
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Octet';
      const k = 1024;
      const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Chargement des données de référence (rôles et agences)
    const loadRolesAndAgencies = async () => {
      try {
        loadingRoles.value = true;
        loadingAgencies.value = true;
        
        const [rolesResponse, agenciesResponse] = await Promise.all([
          ApiService.get('/roles'),
          ApiService.get('/agencies?limit=-1')
        ]);

        if (rolesResponse.data?.data?.roles) {
          roles.value = rolesResponse.data.data.roles;
        } else if (Array.isArray(rolesResponse.data?.data)) {
          roles.value = rolesResponse.data.data;
        }

        if (agenciesResponse.data?.data?.agencies) {
          agencies.value = agenciesResponse.data.data.agencies;
        } else if (Array.isArray(agenciesResponse.data?.data)) {
          agencies.value = agenciesResponse.data.data;
        }
      } catch (err) {
        console.error('Erreur lors du chargement des rôles/agences:', err);
      } finally {
        loadingRoles.value = false;
        loadingAgencies.value = false;
      }
    };

    // Téléchargement du modèle Excel multi-feuilles avec références incluses
    const downloadTemplate = async () => {
      try {
        isDownloading.value = true;
        if (roles.value.length === 0 || agencies.value.length === 0) {
          await loadRolesAndAgencies();
        }

        const wb = XLSX.utils.book_new();

        // Feuille 1: Modèle Utilisateurs
        const exampleRole = roles.value.length > 0 ? roles.value[0].libelle : 'USER';
        const exampleAgency = agencies.value.length > 0 ? agencies.value[0].name : "Direction Renaca";

        const templateData = [
          {
            'Nom*': 'DUPONT',
            'Prénom*': 'Jean',
            'Email*': 'jean.dupont@example.com',
            'Téléphone*': '+22997000001',
            'Sexe*': 'M',
            'Date de naissance': '1990-01-15',
            'Adresse*': 'Cotonou, Akpakpa',
            'Fonction': 'Conseiller Clientèle',
            'Rôle*': exampleRole,
            'Agence*': exampleAgency,
            'Statut*': 'ACTIVE',
            'Mot de passe*': 'P@55word2026'
          },
          {
            'Nom*': 'KOUASSI',
            'Prénom*': 'Amina',
            'Email*': 'amina.kouassi@example.com',
            'Téléphone*': '+22997000002',
            'Sexe*': 'F',
            'Date de naissance': '1992-06-20',
            'Adresse*': 'Cotonou, Cadjehoun',
            'Fonction': 'Responsable Commercial',
            'Rôle*': exampleRole,
            'Agence*': exampleAgency,
            'Statut*': 'ACTIVE',
            'Mot de passe*': 'P@55word2026'
          }
        ];

        const wsUsers = XLSX.utils.json_to_sheet(templateData);
        // Largeurs de colonnes esthétiques
        wsUsers['!cols'] = [
          { wch: 15 }, // Nom
          { wch: 15 }, // Prénom
          { wch: 28 }, // Email
          { wch: 16 }, // Téléphone
          { wch: 8 },  // Sexe
          { wch: 16 }, // Date de naissance
          { wch: 25 }, // Adresse
          { wch: 22 }, // Fonction
          { wch: 20 }, // Rôle
          { wch: 28 }, // Agence
          { wch: 12 }, // Statut
          { wch: 16 }  // Mot de passe
        ];
        XLSX.utils.book_append_sheet(wb, wsUsers, 'Utilisateurs');

        // Feuille 2: Rôles de référence
        if (roles.value.length > 0) {
          const rolesData = roles.value.map(r => ({
            'Libellé du Rôle (à copier)': r.libelle,
            'Description': r.desc || ''
          }));
          const wsRoles = XLSX.utils.json_to_sheet(rolesData);
          wsRoles['!cols'] = [{ wch: 25 }, { wch: 45 }];
          XLSX.utils.book_append_sheet(wb, wsRoles, 'Rôles autorisés');
        }

        // Feuille 3: Agences de référence
        if (agencies.value.length > 0) {
          const agenciesData = agencies.value.map(a => ({
            'Nom de l\'Agence (à copier)': a.name,
            'Adresse / Ville': a.address || ''
          }));
          const wsAgencies = XLSX.utils.json_to_sheet(agenciesData);
          wsAgencies['!cols'] = [{ wch: 30 }, { wch: 40 }];
          XLSX.utils.book_append_sheet(wb, wsAgencies, 'Agences disponibles');
        }

        XLSX.writeFile(wb, 'modele_import_utilisateurs.xlsx');
        success('Modèle Excel complet téléchargé avec succès !');
      } catch (err) {
        console.error('Erreur lors du téléchargement du modèle:', err);
        error('Erreur lors de la génération du modèle Excel');
      } finally {
        isDownloading.value = false;
      }
    };

    // Traitement & validation automatique dès sélection du fichier
    const processFile = async () => {
      if (!selectedFile.value) return;

      try {
        isProcessing.value = true;
        if (roles.value.length === 0 || agencies.value.length === 0) {
          await loadRolesAndAgencies();
        }

        const data = await selectedFile.value.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          error('Le fichier Excel sélectionné est vide ou ne contient aucune ligne de données.');
          removeFile();
          return;
        }

        const seenEmails = new Set<string>();
        const seenPhones = new Set<string>();

        const users: ImportUser[] = jsonData.map((row: any, index: number) => {
          const rowNumber = index + 2; // Ligne 1 = en-têtes
          const errorsList: string[] = [];

          const lastname = (row['Nom*'] || row['Nom'] || row['NOM*'] || row['NOM'] || '').toString().trim().toUpperCase();
          const firstname = (row['Prénom*'] || row['Prenom*'] || row['Prénom'] || row['Prenom'] || row['PRENOM'] || '').toString().trim();
          const email = (row['Email*'] || row['Email'] || row['EMAIL*'] || row['EMAIL'] || '').toString().trim().toLowerCase();
          const phone = (row['Téléphone*'] || row['Telephone*'] || row['Téléphone'] || row['Telephone'] || '').toString().trim();
          
          let gender = (row['Sexe*'] || row['Sexe'] || row['SEXE*'] || row['SEXE'] || '').toString().trim().toUpperCase();
          if (gender === 'HOMME' || gender === 'MASCULIN') gender = 'M';
          if (gender === 'FEMME' || gender === 'FEMININ') gender = 'F';

          let birthdate: string | undefined = undefined;
          const rawBirth = row['Date de naissance'] || row['DateNaissance'] || row['Birthdate'];
          if (rawBirth) {
            try {
              const d = new Date(rawBirth);
              if (!isNaN(d.getTime())) {
                birthdate = d.toISOString().split('T')[0];
              }
            } catch {
              // Date invalide, ignorée
            }
          }

          const address = (row['Adresse*'] || row['Adresse'] || row['ADRESSE'] || '').toString().trim();
          const fonction = (row['Fonction'] || row['FONCTION'] || '').toString().trim() || undefined;
          const status = (row['Statut*'] || row['Statut'] || row['STATUT'] || 'ACTIVE').toString().trim().toUpperCase();
          const password = (row['Mot de passe*'] || row['Mot de passe'] || row['Password'] || 'P@55word2026').toString().trim();

          const rawRole = (row['Rôle*'] || row['Role*'] || row['Rôle'] || row['Role'] || '').toString().trim();
          const rawAgency = (row['Agence*'] || row['Agence'] || row['AGENCE'] || '').toString().trim();

          let idRole = 0;
          let roleName: string | undefined = undefined;
          let roleError: string | undefined = undefined;

          if (!rawRole) {
            errorsList.push('Rôle obligatoire');
            roleError = 'Rôle manquant';
          } else {
            // Match insensible à la casse
            const normalizedRole = rawRole.toLowerCase();
            const matchedRole = roles.value.find(r => 
              (r.libelle && r.libelle.trim().toLowerCase() === normalizedRole) ||
              (r.code && r.code.trim().toLowerCase() === normalizedRole) ||
              String(r.id) === rawRole
            );
            if (matchedRole) {
              idRole = matchedRole.id;
              roleName = matchedRole.libelle;
            } else {
              errorsList.push(`Rôle "${rawRole}" introuvable`);
              roleError = `Rôle inconnu`;
            }
          }

          let idAgency = 0;
          let agencyName: string | undefined = undefined;
          let agencyError: string | undefined = undefined;

          if (!rawAgency) {
            errorsList.push('Agence obligatoire');
            agencyError = 'Agence manquante';
          } else {
            const normalizedAgency = rawAgency.toLowerCase();
            const matchedAgency = agencies.value.find(a => 
              (a.name && a.name.trim().toLowerCase() === normalizedAgency) ||
              (a.code && a.code.trim().toLowerCase() === normalizedAgency) ||
              String(a.id) === rawAgency
            );
            if (matchedAgency) {
              idAgency = matchedAgency.id;
              agencyName = matchedAgency.name;
            } else {
              errorsList.push(`Agence "${rawAgency}" introuvable`);
              agencyError = `Agence inconnue`;
            }
          }

          // Validation Email
          let emailError: string | undefined = undefined;
          if (!email) {
            errorsList.push('Email manquant');
            emailError = 'Email obligatoire';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorsList.push('Format email invalide');
            emailError = 'Email invalide';
          } else if (seenEmails.has(email)) {
            errorsList.push('Email en doublon dans le fichier');
            emailError = 'Doublon dans le fichier';
          } else {
            seenEmails.add(email);
          }

          // Validation Téléphone
          if (!phone) {
            errorsList.push('Téléphone manquant');
          } else if (seenPhones.has(phone)) {
            errorsList.push('Téléphone en doublon dans le fichier');
          } else {
            seenPhones.add(phone);
          }

          // Validation Champs Obligatoires
          if (!lastname) errorsList.push('Nom manquant');
          if (!firstname) errorsList.push('Prénom manquant');
          if (!address) errorsList.push('Adresse manquante');
          if (!gender || (gender !== 'M' && gender !== 'F')) {
            errorsList.push('Sexe invalide (doit être M ou F)');
          }

          const user: ImportUser = {
            rowNumber,
            lastname,
            firstname,
            email,
            phone,
            gender,
            birthdate,
            address,
            fonction,
            idRole,
            idAgency,
            status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            password,
            rawRole,
            rawAgency,
            hasError: errorsList.length > 0,
            emailError,
            roleError,
            agencyError,
            roleName,
            agencyName,
            errorsList
          };

          return user;
        });

        previewData.value = users;
        const errC = users.filter(u => u.hasError).length;
        if (errC === 0) {
          success(`Fichier validé avec succès : ${users.length} utilisateur(s) prêt(s) à être importé(s) !`);
        } else {
          error(`${errC} ligne(s) comportent des erreurs dans le fichier Excel.`);
        }
      } catch (err) {
        console.error('Erreur lors du traitement du fichier:', err);
        error('Impossible de lire le fichier Excel. Vérifiez qu\'il s\'agit d\'un format valide.');
      } finally {
        isProcessing.value = false;
      }
    };

    const removeFile = () => {
      selectedFile.value = null;
      previewData.value = [];
      activeFilter.value = 'ALL';
      searchQuery.value = '';
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const resetImport = () => {
      removeFile();
      isDragOver.value = false;
      showReferenceDrawer.value = false;
    };

    // Exporter un rapport des erreurs Excel
    const exportErrors = () => {
      const errorUsers = previewData.value.filter(u => u.hasError);
      if (errorUsers.length === 0) return;

      const reportData = errorUsers.map(u => ({
        'Ligne': u.rowNumber,
        'Nom': u.lastname,
        'Prénom': u.firstname,
        'Email': u.email,
        'Téléphone': u.phone,
        'Rôle spécifié': u.rawRole || '',
        'Agence spécifiée': u.rawAgency || '',
        'Motifs de l\'erreur': u.errorsList.join(' ; ')
      }));

      const ws = XLSX.utils.json_to_sheet(reportData);
      ws['!cols'] = [
        { wch: 8 },  // Ligne
        { wch: 15 }, // Nom
        { wch: 15 }, // Prénom
        { wch: 25 }, // Email
        { wch: 16 }, // Téléphone
        { wch: 18 }, // Rôle
        { wch: 25 }, // Agence
        { wch: 45 }  // Motifs
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Erreurs Détectées');
      XLSX.writeFile(wb, 'rapport_erreurs_import_utilisateurs.xlsx');
      success('Rapport des erreurs téléchargé.');
    };

    // Importer les utilisateurs valides vers l'API
    const importUsers = async () => {
      if (errorCount.value > 0) {
        error('Veuillez corriger toutes les erreurs dans votre fichier Excel avant de lancer l\'importation.');
        return;
      }

      const validUsers = previewData.value.filter(u => !u.hasError).map(u => ({
        lastname: u.lastname,
        firstname: u.firstname,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        birthdate: u.birthdate,
        address: u.address,
        fonction: u.fonction,
        idRole: u.idRole,
        idAgency: u.idAgency,
        status: u.status,
        password: u.password
      }));

      if (validUsers.length === 0) {
        error('Aucun utilisateur valide à importer.');
        return;
      }

      try {
        isImporting.value = true;
        await ApiService.post('/users/bulk-create', validUsers);
        
        success(`Félicitations ! ${validUsers.length} utilisateur(s) importé(s) avec succès.`);
        emit('imported', validUsers.length);
        closeModal();
      } catch (err: any) {
        console.error('Erreur lors de l\'importation en masse:', err);
        const msg = err.response?.data?.message || err.message || 'Erreur lors de l\'importation des utilisateurs';
        error(msg);
      } finally {
        isImporting.value = false;
      }
    };

    const getStatusBadgeClass = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'bg-success-subtle text-success border border-success-subtle';
        case 'INACTIVE': return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
        default: return 'bg-secondary-subtle text-secondary';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'Actif';
        case 'INACTIVE': return 'Inactif';
        default: return status;
      }
    };

    onMounted(async () => {
      await loadRolesAndAgencies();
    });

    return {
      fileInput,
      selectedFile,
      isDragOver,
      isDownloading,
      isProcessing,
      isImporting,
      previewData,
      roles,
      agencies,
      loadingRoles,
      loadingAgencies,
      showReferenceDrawer,
      activeFilter,
      searchQuery,
      errorCount,
      validCount,
      filteredPreviewData,
      copyToClipboard,
      closeModal,
      triggerFileSelect,
      handleFileSelect,
      handleDrop,
      formatFileSize,
      downloadTemplate,
      processFile,
      removeFile,
      resetImport,
      exportErrors,
      importUsers,
      getStatusBadgeClass,
      getStatusLabel
    };
  }
});
</script>

<style scoped>
.import-modal-wrapper {
  color: #212529;
}

/* Guide & Actions top bar */
.top-action-bar {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

.step-guide-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #33b04a;
  color: white;
  font-size: 10px;
  font-weight: bold;
  margin-right: 2px;
}

/* Tiroir de références */
.reference-drawer {
  border-radius: 10px;
  overflow: hidden;
  border-color: #cbd5e1;
  background: #ffffff;
}

.reference-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.reference-tag {
  display: inline-flex;
  flex-direction: column;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 0.8rem;
}

.reference-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.role-tag {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #3730a3;
}

.role-tag:hover {
  background: #e0e7ff;
  border-color: #818cf8;
}

.agency-tag {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.agency-tag:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

.tag-title {
  font-weight: 700;
}

.tag-desc {
  font-size: 0.7rem;
  opacity: 0.8;
}

@media (min-width: 768px) {
  .border-end-md {
    border-right: 1px solid #e2e8f0;
  }
}

/* Zone héroïque de Drag & Drop */
.upload-dropzone {
  border: 2px dashed #94a3b8;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  cursor: pointer;
  transition: all 0.25s ease-in-out;
}

.upload-dropzone:hover,
.upload-dropzone.drag-active {
  border-color: #33b04a;
  background: #f0fdf4;
  transform: scale(1.005);
  box-shadow: 0 6px 20px rgba(51, 176, 74, 0.12);
}

.dropzone-icon {
  font-size: 3rem;
  color: #33b04a;
  transition: transform 0.2s ease;
}

.upload-dropzone:hover .dropzone-icon {
  transform: translateY(-3px);
}

/* Fichier chargé */
.file-loaded-card {
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0 !important;
}

.file-card-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #33b04a 0%, #228b36 100%) !important;
}

/* KPI Summary Cards */
.stat-pill-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.stat-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-num {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
  display: block;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-total {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
}

.stat-valid {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.stat-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.stat-neutral {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

/* Table */
.custom-preview-table {
  font-size: 0.85rem;
}

.custom-preview-table thead th {
  background: #1e293b;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 10px 12px;
  border: none;
  position: sticky;
  top: 0;
  z-index: 2;
}

.custom-preview-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.row-error {
  background-color: #fff1f2 !important;
}

.row-error:hover {
  background-color: #ffe4e6 !important;
}

.row-valid:hover {
  background-color: #f8fafc !important;
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-chip {
  font-size: 0.72rem;
  line-height: 1.2;
}

/* Animation tiroir */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: all 0.25s ease-out;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
