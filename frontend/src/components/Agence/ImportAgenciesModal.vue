<template>
  <Modal
    :isVisible="isVisible"
    :title="'Importation en masse d\'agences'"
    :icon="'fas fa-upload'"
    :size="'xlarge'"
    @close="closeModal"
  >
    <template #default>
      <div class="import-container">
      <!-- Instructions -->
      <div class="alert alert-info mb-4">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Instructions :</strong>
        <ul class="mb-0 mt-2">
          <li>Téléchargez le modèle Excel ci-dessous</li>
          <li>Remplissez les données des agences dans le fichier</li>
          <li>Glissez-déposez le fichier dans la zone ci-dessous ou cliquez pour le sélectionner</li>
          <li>Vérifiez l'aperçu des données et corrigez les erreurs si nécessaire</li>
          <li>Cliquez sur "Importer" pour créer les agences</li>
        </ul>
      </div>

      <!-- Bouton de téléchargement du modèle -->
      <div class="text-center mb-4">
        <button 
          class="btn btn-outline-primary"
          @click="downloadTemplate"
          :disabled="loadingTemplate">
          <i class="fas fa-download me-2"></i>
          {{ loadingTemplate ? 'Génération...' : 'Télécharger le modèle Excel' }}
        </button>
      </div>

      <!-- Zone de dépôt de fichier -->
      <div 
        class="upload-area"
        :class="{ 'dragover': isDragOver, 'has-file': selectedFile }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleFileDrop"
        @click="triggerFileInput">
        <div v-if="!selectedFile" class="upload-placeholder">
          <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Glissez-déposez votre fichier Excel ici</h5>
          <p class="text-muted">ou cliquez n'importe où dans cette zone pour sélectionner un fichier</p>
          <small class="text-muted">Formats supportés: .xlsx, .xls</small>
        </div>
        <div v-else class="file-selected">
          <i class="fas fa-file-excel fa-2x text-success mb-2"></i>
          <h6 class="text-success">{{ selectedFile.name }}</h6>
          <p class="text-muted mb-0">{{ formatFileSize(selectedFile.size) }}</p>
          <button class="btn btn-sm btn-outline-danger mt-2" @click.stop="removeFile">
            <i class="fas fa-times me-1"></i>
            Supprimer
          </button>
        </div>
      </div>

      <!-- Input fichier caché -->
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        @change="handleFileSelect"
        style="display: none"
      />

      <!-- Aperçu des données -->
      <div v-if="previewData.length > 0" class="mt-4">
        <h6 class="mb-3">
          <i class="fas fa-eye me-2"></i>
          Aperçu des données ({{ previewData.length }} agence(s))
        </h6>
        
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead class="table-dark">
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(agency, index) in previewData.slice(0, 10)" 
                :key="index"
                :class="{ 'table-danger': hasErrors(agency) }">
                <td>
                  <span v-if="agency.name && !agency._isDuplicate" class="text-success">
                    <i class="fas fa-check-circle me-1"></i>
                    {{ agency.name }}
                  </span>
                  <span v-else-if="agency._isDuplicate" class="text-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    {{ agency.name }} (Doublon)
                  </span>
                  <span v-else class="text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i>
                    Nom requis
                  </span>
                </td>
                <td>
                  <span v-if="agency.address" class="text-success">
                    <i class="fas fa-check-circle me-1"></i>
                    {{ agency.address }}
                  </span>
                  <span v-else class="text-muted">
                    <i class="fas fa-minus me-1"></i>
                    Optionnel
                  </span>
                </td>
                <td>
                  <span v-if="isValidEmail(agency.email)" class="text-success">
                    <i class="fas fa-check-circle me-1"></i>
                    {{ agency.email }}
                  </span>
                  <span v-else-if="agency.email" class="text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i>
                    Email invalide
                  </span>
                  <span v-else class="text-muted">
                    <i class="fas fa-minus me-1"></i>
                    Optionnel
                  </span>
                </td>
                <td>
                  <span v-if="agency.phone" class="text-success">
                    <i class="fas fa-check-circle me-1"></i>
                    {{ agency.phone }}
                  </span>
                  <span v-else class="text-muted">
                    <i class="fas fa-minus me-1"></i>
                    Optionnel
                  </span>
                </td>
                <td>
                  <span class="badge bg-success">Valide</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="previewData.length > 10" class="text-center mt-2">
          <small class="text-muted">
            ... et {{ previewData.length - 10 }} autre(s) agence(s)
          </small>
        </div>

        <!-- Résumé des erreurs -->
        <div v-if="errorCount > 0" class="alert alert-warning mt-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>{{ errorCount }} erreur(s) détectée(s)</strong>
          <p class="mb-0 mt-1">Veuillez corriger les erreurs avant de procéder à l'importation.</p>
        </div>
      </div>

      </div>
    </template>

    <template #footer>
      <button 
        class="btn btn-secondary"
        @click="closeModal"
        :disabled="importing">
        <i class="fas fa-times me-2"></i>
        Annuler
      </button>
      
      <button 
        v-if="previewData.length > 0"
        class="btn btn-outline-warning me-2"
        @click="exportErrors"
        :disabled="errorCount === 0">
        <i class="fas fa-download me-2"></i>
        Exporter les erreurs
      </button>
      
      <button 
        class="btn btn-success"
        @click="importAgencies"
        :disabled="previewData.length === 0 || errorCount > 0 || importing">
        <i v-if="!importing" class="fas fa-upload me-2"></i>
        <div v-else class="spinner-border spinner-border-sm me-2" role="status">
          <span class="visually-hidden">Importation...</span>
        </div>
        {{ importing ? 'Importation...' : `Importer ${previewData.length} agence(s)` }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '../Common/Modal.vue';
import * as XLSX from 'xlsx';
import ApiService from '../../services/ApiService';
import { success, error } from '../../utils/utils';

// Props
interface Props {
  isVisible: boolean;
}

// Interface pour les données d'agence
interface AgencyData {
  name: string;
  address: string;
  email: string;
  phone: string;
  fax: string;
  _rowIndex: number;
  _isDuplicate?: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  imported: [count: number];
}>();

// Refs
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const previewData = ref<AgencyData[]>([]);
const isDragOver = ref(false);
const loading = ref(false);
const loadingTemplate = ref(false);
const importing = ref(false);

// Computed
const errorCount = computed(() => {
  return previewData.value.filter(agency => hasErrors(agency)).length;
});

// Methods
const closeModal = () => {
  resetForm();
  emit('close');
};

const resetForm = () => {
  selectedFile.value = null;
  previewData.value = [];
  isDragOver.value = false;
  loading.value = false;
  importing.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};


const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (file && isValidFileType(file)) {
    processFile(file);
  }
};

const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  return validTypes.includes(file.type) || 
         file.name.endsWith('.xlsx') || 
         file.name.endsWith('.xls');
};

const processFile = async (file: File) => {
  if (!isValidFileType(file)) {
    error('Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx ou .xls)');
    return;
  }

  try {
    loading.value = true;
    selectedFile.value = file;

    const data = await readExcelFile(file);
    const validatedData = validateAgencyData(data);
    
    previewData.value = validatedData;
    
    if (validatedData.length === 0) {
      error('Aucune donnée valide trouvée dans le fichier');
    } else {
      success(`${validatedData.length} agence(s) trouvée(s) dans le fichier`);
    }
  } catch (err) {
    console.error('Erreur lors du traitement du fichier:', err);
    error('Erreur lors du traitement du fichier');
  } finally {
    loading.value = false;
  }
};

const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsBinaryString(file);
  });
};

const validateAgencyData = (data: any[]): AgencyData[] => {
  const agencies = data.map((row, index): AgencyData => {
    const agency: AgencyData = {
      name: row['Nom'] || row['name'] || '',
      address: row['Adresse'] || row['address'] || '',
      email: row['Email'] || row['email'] || '',
      phone: row['Téléphone'] || row['phone'] || row['Phone'] || '',
      fax: row['Fax'] || row['fax'] || '',
      _rowIndex: index + 2 // +2 car l'index commence à 0 et on a l'en-tête
    };
    return agency;
  }).filter(agency => agency.name.trim() !== ''); // Filtrer les lignes vides

  // Vérifier les doublons de noms et marquer les doublons
  const names = agencies.map(agency => agency.name.trim().toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    error(`Noms d'agence en doublon détectés dans le fichier: ${uniqueDuplicates.join(', ')}`);
    
    // Marquer les agences en doublon
    agencies.forEach(agency => {
      const nameLower = agency.name.trim().toLowerCase();
      agency._isDuplicate = duplicates.includes(nameLower);
    });
  }

  return agencies;
};

const hasErrors = (agency: AgencyData): boolean => {
  return !agency.name || (agency.email && !isValidEmail(agency.email)) || !!agency._isDuplicate;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const removeFile = () => {
  selectedFile.value = null;
  previewData.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const downloadTemplate = async () => {
  try {
    loadingTemplate.value = true;
    
    // Créer le modèle Excel
    const templateData = [
      {
        'Nom': 'L\'Africaine Vie Bénin SA',
        'Adresse': 'Lot 19 Pate d\'Oie. 01PB 2040',
        'Email': 'africainevie@lafricaineviebenin.com',
        'Téléphone': '+229 21 30 39 93',
        'Fax': '+229 30 00 91'
      },
      {
        'Nom': 'Agence Cotonou Centre',
        'Adresse': 'Avenue Clozel, Cotonou',
        'Email': 'cotonou@lafricaineviebenin.com',
        'Téléphone': '+229 21 30 39 94',
        'Fax': '+229 30 00 92'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agences');

    // Télécharger le fichier
    XLSX.writeFile(workbook, 'modele_agences.xlsx');
    success('Modèle téléchargé avec succès');
  } catch (err) {
    console.error('Erreur lors du téléchargement du modèle:', err);
    error('Erreur lors du téléchargement du modèle');
  } finally {
    loadingTemplate.value = false;
  }
};

const exportErrors = () => {
  const errorData = previewData.value.filter(agency => hasErrors(agency));
  
  if (errorData.length === 0) {
    error('Aucune erreur à exporter');
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erreurs');
    XLSX.writeFile(workbook, 'erreurs_agences.xlsx');
    success('Fichier d\'erreurs exporté avec succès');
  } catch (err) {
    console.error('Erreur lors de l\'export des erreurs:', err);
    error('Erreur lors de l\'export des erreurs');
  }
};

const importAgencies = async () => {
  if (previewData.value.length === 0 || errorCount.value > 0) {
    error('Veuillez corriger les erreurs avant de procéder à l\'importation');
    return;
  }

  try {
    importing.value = true;
    
    // Validation supplémentaire avant envoi
    const agenciesData = previewData.value.map(agency => {
      const name = agency.name.trim();
      if (!name) {
        throw new Error('Tous les noms d\'agence sont requis');
      }
      if (name.length > 255) {
        throw new Error(`Le nom "${name}" est trop long (max 255 caractères)`);
      }
      
      return {
        name,
        address: agency.address?.trim() || null,
        email: agency.email?.trim() || null,
        phone: agency.phone?.trim() || null,
        fax: agency.fax?.trim() || null
      };
    });

    // Appel API pour créer les agences
    const response = await ApiService.post('/agencies/bulk-create', agenciesData);
    
    success(`${response.data.agencies?.length || agenciesData.length} agence(s) créée(s) avec succès !`);
    emit('imported', response.data.agencies?.length || agenciesData.length);
    closeModal();
    
  } catch (err: any) {
    console.error('Erreur lors de l\'importation:', err);
    
    // Gestion détaillée des erreurs
    let errorMessage = 'Erreur lors de l\'importation des agences';
    
    if (err?.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err?.response?.status === 500) {
      errorMessage = 'Erreur serveur. Vérifiez que les noms d\'agence ne sont pas déjà utilisés.';
    } else if (err?.response?.status === 400) {
      errorMessage = 'Données invalides. Vérifiez le format des données.';
    } else if (err?.response?.status === 403) {
      errorMessage = 'Vous n\'avez pas les permissions pour créer des agences.';
    } else if (err?.response?.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    error(errorMessage);
    // Ne pas fermer le modal en cas d'erreur pour que l'utilisateur puisse voir l'erreur
  } finally {
    importing.value = false;
  }
};
</script>

<script lang="ts">
export default {
  name: 'ImportAgenciesModal'
};
</script>

<style scoped>
.import-container {
  max-height: none;
  overflow-y: visible;
  padding-bottom: 0;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.upload-area:hover {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.upload-area.dragover {
  border-color: #28a745;
  background-color: #d4edda;
}

.upload-area.has-file {
  border-color: #28a745;
  background-color: #d4edda;
}

.upload-placeholder {
  color: #6c757d;
}

.file-selected {
  color: #28a745;
}

.table-danger {
  background-color: #f8d7da !important;
}

.table-danger td {
  border-color: #f5c6cb !important;
}

/* Responsive */
@media (max-width: 768px) {
  .upload-area {
    padding: 25px 15px;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
