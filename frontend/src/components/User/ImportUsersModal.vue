<template>
  <Modal
    :isVisible="isVisible"
    :title="'Importation en masse d\'utilisateurs'"
    :icon="'fas fa-upload'"
    :size="'xlarge'"
    @close="closeModal"
  >
    <div class="import-container">
      <!-- Instructions -->
      <div class="alert alert-info mb-3">
        <h6 class="alert-heading mb-2">
          <i class="fas fa-info-circle me-2"></i>
          Instructions d'importation
        </h6>
        <ul class="mb-0 small">
          <li>Téléchargez le modèle Excel ci-dessous</li>
          <li>Remplissez les colonnes obligatoires (marquées d'un *)</li>
          <li>Utilisez les listes de référence ci-dessous pour les rôles et agences</li>
          <li>Rechargez le fichier Excel rempli</li>
          <li>Vérifiez les données avant validation</li>
        </ul>
      </div>

      <!-- Listes de référence -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card border-primary reference-card">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0">
                <i class="fas fa-shield-alt me-2"></i>
                Rôles disponibles
              </h6>
            </div>
            <div class="card-body">
              <div v-if="loadingRoles" class="text-center">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
                <small class="text-muted">Chargement des rôles...</small>
              </div>
              <div v-else-if="roles.length === 0" class="text-muted">
                <small>Aucun rôle trouvé</small>
              </div>
              <div v-else>
                <div v-for="role in roles" :key="role.id" class="reference-item">
                  <span class="badge bg-light text-dark me-1">{{ role.libelle }}</span>
                  <small class="text-muted">{{ role.desc || 'Sans description' }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-success reference-card">
            <div class="card-header bg-success text-white">
              <h6 class="mb-0">
                <i class="fas fa-building me-2"></i>
                Agences disponibles
              </h6>
            </div>
            <div class="card-body">
              <div v-if="loadingAgencies" class="text-center">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Chargement...</span>
                </div>
                <small class="text-muted">Chargement des agences...</small>
              </div>
              <div v-else-if="agencies.length === 0" class="text-muted">
                <small>Aucune agence trouvée</small>
              </div>
              <div v-else>
                <div v-for="agency in agencies" :key="agency.id" class="reference-item">
                  <div class="fw-bold text-dark">{{ agency.name }}</div>
                  <small class="text-muted">{{ agency.address || 'Adresse non renseignée' }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Téléchargement du modèle -->
      <div class="model-section mb-3">
        <h6 class="fw-bold text-dark mb-2">
          <i class="fas fa-download me-2"></i>
          Modèle Excel
        </h6>
        <div class="d-flex gap-3 align-items-center">
          <button 
            @click="downloadTemplate" 
            class="btn btn-outline-primary"
            :disabled="isDownloading"
          >
            <i class="fas fa-download me-2"></i>
            {{ isDownloading ? 'Téléchargement...' : 'Télécharger le modèle' }}
          </button>
          <small class="text-muted">
            Format: .xlsx | Colonnes: Nom*, Prénom*, Email*, Téléphone*, etc.
          </small>
        </div>
      </div>

      <!-- Upload du fichier -->
      <div class="upload-section mb-3">
        <h6 class="fw-bold text-dark mb-2">
          <i class="fas fa-upload me-2"></i>
          Fichier à importer
        </h6>
        <div class="upload-area" :class="{ 'is-dragover': isDragOver }" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileSelect"
            class="d-none"
          />
          <div v-if="!selectedFile" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p class="mb-2">Glissez-déposez votre fichier Excel ici</p>
            <p class="text-muted small">ou</p>
            <button @click="triggerFileSelect" class="btn btn-primary">
              <i class="fas fa-folder-open me-2"></i>
              Parcourir les fichiers
            </button>
          </div>
          <div v-else class="file-selected">
            <i class="fas fa-file-excel fa-2x text-success mb-2"></i>
            <p class="mb-1 fw-bold">{{ selectedFile.name }}</p>
            <p class="text-muted small mb-3">{{ formatFileSize(selectedFile.size) }}</p>
            <div class="d-flex gap-2">
              <button @click="processFile" class="btn btn-success" :disabled="isProcessing">
                <i class="fas fa-cog me-2"></i>
                {{ isProcessing ? 'Traitement...' : 'Traiter le fichier' }}
              </button>
              <button @click="removeFile" class="btn btn-outline-secondary">
                <i class="fas fa-times me-2"></i>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Aperçu des données -->
      <div v-if="previewData.length > 0" class="preview-section">
        <h6 class="fw-bold text-dark mb-3">
          <i class="fas fa-eye me-2"></i>
          Aperçu des données ({{ previewData.length }} utilisateur(s))
        </h6>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Agence</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in previewData.slice(0, 10)" :key="index" :class="{ 'table-warning': user.hasError }">
                <td>{{ user.lastname }}</td>
                <td>{{ user.firstname }}</td>
                <td>
                  <span :class="{ 'text-danger': user.emailError }">{{ user.email }}</span>
                  <small v-if="user.emailError" class="d-block text-danger">{{ user.emailError }}</small>
                </td>
                <td>{{ user.phone }}</td>
                <td>
                  <span :class="{ 'text-danger': user.roleError }">{{ user.roleName }}</span>
                  <small v-if="user.roleError" class="d-block text-danger">{{ user.roleError }}</small>
                </td>
                <td>
                  <span :class="{ 'text-danger': user.agencyError }">{{ user.agencyName }}</span>
                  <small v-if="user.agencyError" class="d-block text-danger">{{ user.agencyError }}</small>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(user.status)">
                    {{ getStatusLabel(user.status) }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="user.hasError" 
                    @click="editUser(index)" 
                    class="btn btn-sm btn-outline-warning"
                    title="Corriger"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="previewData.length > 10" class="text-center mt-3">
            <small class="text-muted">Affichage des 10 premiers utilisateurs sur {{ previewData.length }}</small>
          </div>
        </div>

        <!-- Résumé des erreurs -->
        <div v-if="errorCount > 0" class="alert alert-warning mt-3">
          <h6 class="alert-heading">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Erreurs détectées ({{ errorCount }})
          </h6>
          <p class="mb-0">Veuillez corriger les erreurs avant de procéder à l'importation.</p>
        </div>

        <!-- Boutons d'action -->
        <div class="d-flex justify-content-between mt-4">
          <button @click="resetImport" class="btn btn-outline-secondary">
            <i class="fas fa-undo me-2"></i>
            Recommencer
          </button>
          <div class="d-flex gap-2">
            <button @click="exportErrors" class="btn btn-warning" :disabled="errorCount === 0">
              <i class="fas fa-download me-2"></i>
              Exporter les erreurs
            </button>
            <button 
              @click="importUsers" 
              class="btn btn-success"
              :disabled="errorCount > 0 || isImporting"
            >
              <i class="fas fa-upload me-2"></i>
              {{ isImporting ? 'Importation...' : `Importer ${validCount} utilisateur(s)` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer de la modal -->
    <template #footer>
      <button @click="closeModal" class="btn btn-secondary">
        <i class="fas fa-times me-2"></i>
        Fermer
      </button>
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
  // Champs pour la validation
  hasError: boolean;
  emailError?: string;
  roleError?: string;
  agencyError?: string;
  roleName?: string;
  agencyName?: string;
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

    // Computed
    const errorCount = computed(() => previewData.value.filter(user => user.hasError).length);
    const validCount = computed(() => previewData.value.filter(user => !user.hasError).length);

    // Méthodes
    const closeModal = () => {
      emit('close');
      resetImport();
    };

    const triggerFileSelect = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      isDragOver.value = false;
      
      if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        selectedFile.value = event.dataTransfer.files[0];
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      isDragOver.value = true;
    };

    const handleDragLeave = () => {
      isDragOver.value = false;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const downloadTemplate = async () => {
      try {
        isDownloading.value = true;
        
        // Charger les rôles et agences si pas encore chargés
        if (roles.value.length === 0 || agencies.value.length === 0) {
          await loadRolesAndAgencies();
        }
        
        // Créer le modèle Excel avec des exemples basés sur les données réelles
        const exampleRole = roles.value.length > 0 ? roles.value[0].libelle : 'ADMIN';
        const exampleAgency = agencies.value.length > 0 ? agencies.value[0].name : 'L\'Africaine Vie Bénin SA';
        
        const templateData = [
          {
            'Nom*': 'DUPONT',
            'Prénom*': 'JEAN',
            'Email*': 'jean.dupont@example.com',
            'Téléphone*': '+22912345678',
            'Sexe*': 'M',
            'Date de naissance': '1990-01-01',
            'Adresse*': 'COTONOU, QUARTIER CENTRE',
            'Fonction': 'Gestionnaire',
            'Rôle*': exampleRole,
            'Agence*': exampleAgency,
            'Statut*': 'ACTIVE',
            'Mot de passe*': 'P@55WORD'
          }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
        
        // Télécharger le fichier
        XLSX.writeFile(wb, 'modele_import_utilisateurs.xlsx');
        
        success('Modèle Excel téléchargé avec succès !');
      } catch (err) {
        console.error('Erreur lors du téléchargement du modèle:', err);
        error('Erreur lors du téléchargement du modèle');
      } finally {
        isDownloading.value = false;
      }
    };

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
        }
        if (agenciesResponse.data?.data?.agencies) {
          agencies.value = agenciesResponse.data.data.agencies;
        }
      } catch (err) {
        console.error('Erreur lors du chargement des rôles/agences:', err);
      } finally {
        loadingRoles.value = false;
        loadingAgencies.value = false;
      }
    };

    const processFile = async () => {
      if (!selectedFile.value) return;

      try {
        isProcessing.value = true;
        await loadRolesAndAgencies();

        const file = selectedFile.value;
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convertir et valider les données
        const users: ImportUser[] = jsonData.map((row: any, index: number) => {
          const user: ImportUser = {
            lastname: (row['Nom*'] || '').toString().trim().toUpperCase(),
            firstname: (row['Prénom*'] || '').toString().trim().toUpperCase(),
            email: (row['Email*'] || '').toString().trim().toLowerCase(),
            phone: (row['Téléphone*'] || '').toString().trim(),
            gender: (row['Sexe*'] || '').toString().trim().toUpperCase(),
            birthdate: row['Date de naissance'] ? new Date(row['Date de naissance']).toISOString().split('T')[0] : undefined,
            address: (row['Adresse*'] || '').toString().trim().toUpperCase(),
            fonction: row['Fonction'] ? row['Fonction'].toString().trim() : undefined,
            idRole: 0,
            idAgency: 0,
            status: (row['Statut*'] || 'ACTIVE').toString().trim().toUpperCase(),
            password: (row['Mot de passe*'] || 'P@55WORD').toString().trim(),
            hasError: false
          };

          // Validation
          const errors: string[] = [];

          // Validation email
          if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
            errors.push('Email invalide');
            user.emailError = 'Format email invalide';
          }

          // Validation rôle
          const roleName = (row['Rôle*'] || '').toString().trim().toUpperCase();
          const role = roles.value.find(r => r.libelle?.toUpperCase() === roleName);
          if (role) {
            user.idRole = role.id;
            user.roleName = role.libelle;
          } else {
            errors.push('Rôle introuvable');
            user.roleError = 'Rôle non trouvé dans la liste';
          }

          // Validation agence
          const agencyName = (row['Agence*'] || '').toString().trim().toUpperCase();
          const agency = agencies.value.find(a => a.name?.toUpperCase() === agencyName);
          if (agency) {
            user.idAgency = agency.id;
            user.agencyName = agency.name;
          } else {
            errors.push('Agence introuvable');
            user.agencyError = 'Agence non trouvée dans la liste';
          }

          // Validation des champs obligatoires
          if (!user.lastname) errors.push('Nom manquant');
          if (!user.firstname) errors.push('Prénom manquant');
          if (!user.phone) errors.push('Téléphone manquant');
          if (!user.address) errors.push('Adresse manquante');

          user.hasError = errors.length > 0;
          return user;
        });

        previewData.value = users;
        success(`Fichier traité avec succès ! ${users.length} utilisateur(s) trouvé(s).`);
      } catch (err) {
        console.error('Erreur lors du traitement du fichier:', err);
        error('Erreur lors du traitement du fichier Excel');
      } finally {
        isProcessing.value = false;
      }
    };

    const removeFile = () => {
      selectedFile.value = null;
      previewData.value = [];
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const resetImport = () => {
      removeFile();
      isDragOver.value = false;
    };

    const editUser = (index: number) => {
      // TODO: Implémenter l'édition d'un utilisateur spécifique
    };

    const exportErrors = () => {
      const errorUsers = previewData.value.filter(user => user.hasError);
      if (errorUsers.length === 0) return;

      const errorData = errorUsers.map(user => ({
        'Nom': user.lastname,
        'Prénom': user.firstname,
        'Email': user.email,
        'Téléphone': user.phone,
        'Erreur Email': user.emailError || '',
        'Erreur Rôle': user.roleError || '',
        'Erreur Agence': user.agencyError || ''
      }));

      const ws = XLSX.utils.json_to_sheet(errorData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Erreurs');
      XLSX.writeFile(wb, 'erreurs_import_utilisateurs.xlsx');
    };

    const importUsers = async () => {
      if (errorCount.value > 0) {
        error('Veuillez corriger toutes les erreurs avant l\'importation');
        return;
      }

      try {
        isImporting.value = true;
        const validUsers = previewData.value.filter(user => !user.hasError);
        
        const { data } = await ApiService.post('/users/bulk-create', validUsers);
        
        success(`${validUsers.length} utilisateur(s) importé(s) avec succès !`);
        emit('imported', validUsers.length);
        closeModal();
      } catch (err: any) {
        console.error('Erreur lors de l\'importation:', err);
        error(err.response?.data?.message || 'Erreur lors de l\'importation');
      } finally {
        isImporting.value = false;
      }
    };

    const getStatusBadgeClass = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'bg-success';
        case 'INACTIVE': return 'bg-secondary';
        case 'SUSPENDED': return 'bg-warning';
        default: return 'bg-secondary';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'Actif';
        case 'INACTIVE': return 'Inactif';
        case 'SUSPENDED': return 'Suspendu';
        default: return status;
      }
    };

    // Charger les rôles et agences au montage du composant
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
      errorCount,
      validCount,
      closeModal,
      triggerFileSelect,
      handleFileSelect,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      formatFileSize,
      downloadTemplate,
      processFile,
      removeFile,
      resetImport,
      editUser,
      exportErrors,
      importUsers,
      getStatusBadgeClass,
      getStatusLabel
    };
  }
});
</script>

<style scoped>
.import-container {
  max-height: none;
  overflow-y: visible;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 10px;
  padding: 25px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.upload-area.is-dragover {
  border-color: #33b04a;
  background: #e8f5e8;
}

.upload-placeholder {
  color: #6c757d;
}

.file-selected {
  color: #212529;
}

.preview-section {
  border-top: 1px solid #dee2e6;
  padding-top: 20px;
}

.table th {
  font-size: 0.875rem;
  font-weight: 600;
}

.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}

.alert {
  border-radius: 8px;
}

.alert-heading {
  font-size: 1rem;
  font-weight: 600;
}

.btn {
  border-radius: 6px;
  font-weight: 500;
}

.btn-success {
  background-color: #33b04a;
  border-color: #33b04a;
}

.btn-success:hover {
  background-color: #2a8f3c;
  border-color: #2a8f3c;
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #d39e00;
  color: #000;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

/* Styles pour les cartes de référence */
.card.border-primary .card-header {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
}

.card.border-success .card-header {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%) !important;
}

.reference-card {
  transition: all 0.3s ease;
}

.reference-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.reference-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
}

.reference-item:hover {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 0.5rem;
  margin: 0 -0.5rem;
}

.reference-item:last-child {
  border-bottom: none;
}

.badge.bg-light {
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #dee2e6;
}

/* Optimisation de l'espace pour éviter les scrollbars */
.reference-card .card-body {
  max-height: none !important;
  overflow-y: visible !important;
}

/* Réduction des marges et paddings */
.import-container .mb-4 {
  margin-bottom: 1.5rem !important;
}

.import-container .mb-3 {
  margin-bottom: 1rem !important;
}

.import-container .mb-2 {
  margin-bottom: 0.5rem !important;
}

/* Optimisation des cartes de référence */
.reference-item {
  padding: 0.4rem 0;
  margin-bottom: 0.3rem;
}

.reference-item:last-child {
  margin-bottom: 0;
}

/* Réduction de l'espace dans les sections */
.model-section,
.upload-section {
  margin-bottom: 1.5rem !important;
}

/* Optimisation des boutons */
.btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .upload-area {
    padding: 20px 15px;
  }
  
  .table-responsive {
    font-size: 0.8rem;
  }
  
  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  .d-flex.gap-2 .btn {
    width: 100%;
  }
  
  .reference-item {
    font-size: 0.9rem;
  }
  
  .badge.bg-light {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }
  
  /* Sur mobile, on peut garder une hauteur limitée pour les cartes */
  .reference-card .card-body {
    max-height: 200px !important;
    overflow-y: auto !important;
  }
}
</style>
