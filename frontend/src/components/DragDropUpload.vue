<!-- DragDropUpload.vue -->
<template>
    <div class="drag-drop-upload" style="width: 100%;">
      <div 
        :class="[
          'drag-drop-zone position-relative border-2 border-dashed rounded p-4 text-center transition-all cursor-pointer',
          isDragOver ? 'border-primary bg-light' : 'border-secondary bg-light',
          selectedFile ? 'border-success bg-success-subtle' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        @dragover.prevent="!disabled && handleDragOver()"
        @dragleave.prevent="!disabled && handleDragLeave()" 
        @drop.prevent="!disabled && handleDrop($event)"
        @click="!disabled && openFileDialog()"
        :style="{ minHeight: height, transition: 'all 0.3s ease' }"
      >
        <input 
          ref="fileInput"
          type="file"
          class="d-none"
          :accept="acceptedTypes"
          :multiple="multiple"
          @change="handleFileChange"
          :disabled="disabled"
        />
        
        <!-- État initial - pas de fichier -->
        <div v-if="!hasFiles" class="d-flex flex-column align-items-center justify-content-center h-100">
          <div class="fs-1 mb-3" style="font-size: 3rem !important;">
            {{ isDragOver ? '📥' : uploadIcon }}
          </div>
          <h5 class="mb-2 fw-semibold text-dark">
            {{ isDragOver ? dropText : title }}
          </h5>
          <p class="text-muted mb-3" v-html="subtitle"></p>
          <small class="text-muted">{{ hint }}</small>
        </div>
        
        <!-- Fichier(s) sélectionné(s) -->
        <div v-else class="text-start">
          <!-- Fichier unique -->
          <div v-if="!multiple && selectedFile" class="mb-3">
            <div class="d-flex align-items-center mb-3">
              <span class="fs-2 me-3">{{ getFileIcon(selectedFile.type) }}</span>
              <div class="flex-grow-1">
                <div class="fw-medium text-dark">{{ selectedFile.name }}</div>
                <small class="text-muted">{{ formatFileSize(selectedFile.size) }}</small>
              </div>
            </div>
            
            <!-- Barre de progression -->
            <div v-if="isUploading" class="mb-3">
              <div class="progress mb-2" style="height: 8px;">
                <div 
                  class="progress-bar bg-primary"
                  role="progressbar"
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
              <small class="text-primary">
                <span class="spinner-border spinner-border-sm me-2"></span>
                {{ progressText }}... {{ uploadProgress }}%
              </small>
            </div>
            
            <!-- Succès -->
            <div v-else-if="uploadProgress === 100" class="text-success mb-3">
              <i class="bi bi-check-circle-fill me-2"></i>
              <span class="fw-medium">{{ successText }}</span>
            </div>
          </div>
  
          <!-- Fichiers multiples -->
          <div v-else-if="multiple && selectedFiles.length > 0" class="mb-3">
            <div class="mb-3">
              <strong>{{ selectedFiles.length }} fichier(s) sélectionné(s)</strong>
            </div>
            <div class="max-height-200 overflow-auto">
              <div 
                v-for="(file, index) in selectedFiles" 
                :key="index"
                class="d-flex align-items-center p-2 border rounded mb-2"
              >
                <span class="me-3">{{ getFileIcon(file.type) }}</span>
                <div class="flex-grow-1">
                  <div class="fw-medium">{{ file.name }}</div>
                  <small class="text-muted">{{ formatFileSize(file.size) }}</small>
                </div>
                <button 
                  type="button"
                  class="btn btn-sm btn-outline-danger ms-2"
                  @click.stop="removeFileAtIndex(index)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          
          <!-- Boutons d'action -->
          <div class="d-flex gap-2 justify-content-center">
            <button 
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click.stop="openFileDialog"
              :disabled="disabled"
            >
              <i class="bi bi-paperclip me-1"></i>
              {{ multiple ? 'Ajouter' : 'Changer' }}
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click.stop="removeAllFiles"
              :disabled="disabled"
            >
              <i class="bi bi-trash me-1"></i>
              Supprimer {{ multiple ? 'tout' : '' }}
            </button>
          </div>
        </div>
  
        <!-- Effet d'overlay pendant le drag -->
        <div 
          v-if="isDragOver && !disabled" 
          class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style="background: rgba(13, 110, 253, 0.1); border-radius: 0.375rem; z-index: 10;"
        >
          <div class="text-primary fw-bold fs-5">
            <i class="bi bi-cloud-arrow-down me-2"></i>
            {{ dropText }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, ref, computed, watch } from 'vue';
  
  export default defineComponent({
    name: 'DragDropUpload',
    props: {
      // Types de fichiers acceptés
      acceptedTypes: {
        type: String,
        default: '.pdf,.doc,.docx,.jpg,.jpeg,.png'
      },
      
      // Types MIME autorisés pour validation
      allowedMimeTypes: {
        type: Array,
        default: () => [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ]
      },
      
      // Taille maximum en bytes
      maxSize: {
        type: Number,
        default: 10 * 1024 * 1024 // 10MB
      },
      
      // Fichiers multiples
      multiple: {
        type: Boolean,
        default: false
      },
      
      // Hauteur de la zone
      height: {
        type: String,
        default: '120px'
      },
      
      // Textes personnalisables
      title: {
        type: String,
        default: 'Glisser & Déposer'
      },
      
      subtitle: {
        type: String,
        default: 'ou <span class="text-primary fw-medium">cliquez pour parcourir</span>'
      },
      
      dropText: {
        type: String,
        default: 'Relâchez pour téléverser'
      },
      
      hint: {
        type: String,
        default: 'Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 10MB)'
      },
      
      progressText: {
        type: String,
        default: 'Téléversement'
      },
      
      successText: {
        type: String,
        default: 'Fichier téléversé avec succès!'
      },
      
      uploadIcon: {
        type: String,
        default: '☁️'
      },
      
      // Désactiver le composant
      disabled: {
        type: Boolean,
        default: false
      },
      
      // Auto-upload
      autoUpload: {
        type: Boolean,
        default: true
      }
    },
    
    emits: [
      'file-selected',
      'files-selected', 
      'file-removed',
      'upload-progress',
      'upload-complete',
      'upload-error'
    ],
    
    setup(props, { emit }) {
      // État du composant
      const isDragOver = ref(false);
      const selectedFile = ref(null);
      const selectedFiles = ref([]);
      const fileInput = ref(null);
      const uploadProgress = ref(0);
      const isUploading = ref(false);
      
      // Computed
      const hasFiles = computed(() => {
        return props.multiple ? selectedFiles.value.length > 0 : selectedFile.value !== null;
      });
      
      // Méthodes
      const handleDragOver = () => {
        isDragOver.value = true;
      };
  
      const handleDragLeave = () => {
        isDragOver.value = false;
      };
  
      const handleDrop = (e) => {
        isDragOver.value = false;
        const files = Array.from(e.dataTransfer.files);
        
        if (props.multiple) {
          files.forEach(file => handleFileSelect(file));
        } else if (files.length > 0) {
          handleFileSelect(files[0]);
        }
      };
  
      const openFileDialog = () => {
        fileInput.value?.click();
      };
  
      const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (props.multiple) {
          files.forEach(file => handleFileSelect(file));
        } else if (files.length > 0) {
          handleFileSelect(files[0]);
        }
      };
  
      const handleFileSelect = (file) => {
        // Validation du type
        if (!props.allowedMimeTypes.includes(file.type)) {
          emit('upload-error', {
            type: 'invalid-type',
            message: `Type de fichier non autorisé: ${file.type}`,
            file
          });
          return;
        }
        
        // Validation de la taille
        if (file.size > props.maxSize) {
          emit('upload-error', {
            type: 'file-too-large',
            message: `Fichier trop volumineux: ${formatFileSize(file.size)}. Maximum: ${formatFileSize(props.maxSize)}`,
            file
          });
          return;
        }
        
        if (props.multiple) {
          selectedFiles.value.push(file);
          emit('files-selected', selectedFiles.value);
        } else {
          selectedFile.value = file;
          emit('file-selected', file);
        }
        
        if (props.autoUpload) {
          simulateUpload();
        }
      };
  
      const simulateUpload = () => {
        isUploading.value = true;
        uploadProgress.value = 0;
        
        const interval = setInterval(() => {
          uploadProgress.value += 10;
          emit('upload-progress', uploadProgress.value);
          
          if (uploadProgress.value >= 100) {
            clearInterval(interval);
            isUploading.value = false;
            emit('upload-complete', props.multiple ? selectedFiles.value : selectedFile.value);
          }
        }, 200);
      };
  
      const removeAllFiles = () => {
        if (props.multiple) {
          selectedFiles.value = [];
        } else {
          selectedFile.value = null;
        }
        
        uploadProgress.value = 0;
        isUploading.value = false;
        
        if (fileInput.value) {
          fileInput.value.value = '';
        }
        
        emit('file-removed', null);
      };
  
      const removeFileAtIndex = (index) => {
        const removedFile = selectedFiles.value[index];
        selectedFiles.value.splice(index, 1);
        emit('file-removed', removedFile);
      };
  
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
  
      const getFileIcon = (type) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('image')) return '🖼️';
        return '📁';
      };
  
      // Méthodes publiques
      const getSelectedFiles = () => {
        return props.multiple ? selectedFiles.value : selectedFile.value;
      };
  
      const clearFiles = () => {
        removeAllFiles();
      };
  
      return {
        // État
        isDragOver,
        selectedFile,
        selectedFiles,
        fileInput,
        uploadProgress,
        isUploading,
        hasFiles,
        
        // Méthodes
        handleDragOver,
        handleDragLeave,
        handleDrop,
        openFileDialog,
        handleFileChange,
        removeAllFiles,
        removeFileAtIndex,
        formatFileSize,
        getFileIcon,
        getSelectedFiles,
        clearFiles
      };
    }
  });
  </script>
  
  <style scoped>
  .drag-drop-upload {
    width: 100%;
  }
  
  .drag-drop-zone {
    border: 2px dashed #dee2e6;
    transition: all 0.3s ease;
  }
  
  .drag-drop-zone:hover:not(.opacity-50) {
    border-color: #6c757d;
    background-color: #f8f9fa;
  }
  
  .max-height-200 {
    max-height: 200px;
  }
  
  .spinner-border-sm {
    width: 0.875rem;
    height: 0.875rem;
  }
  </style>