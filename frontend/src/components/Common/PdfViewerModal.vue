<template>
  <div v-if="visible" class="pdf-viewer-overlay" @click="handleOverlayClick">
    <div class="pdf-viewer-container" @click.stop>
      <!-- EN-TÊTE DU VISIONNEUR -->
      <div class="pdf-viewer-header d-flex align-items-center justify-content-between p-15 px-20 bg-white border-bottom flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="viewer-logo me-2" />
          <div>
            <h6 class="mb-0 fw-bold text-black d-flex align-items-center flex-wrap gap-2">
              <i class="flaticon-file-1 text-primary"></i>
              <span>{{ title || 'Visionneur de Document' }}</span>
              <span v-if="documentKey" class="badge bg-primary-subtle text-primary font-monospace fs-12 px-2 py-1 rounded-1">
                {{ documentKey }}
              </span>
            </h6>
            <small v-if="subtitle" class="text-muted fs-11">{{ subtitle }}</small>
          </div>
        </div>

        <!-- ACTIONS DU VISIONNEUR -->
        <div class="d-flex align-items-center gap-2">
          <button
            v-if="pdfUrl && !loading"
            type="button"
            class="default-btn position-relative transition border-0 fw-medium text-white pt-8 pb-8 ps-12 pe-12 rounded-1 bg-success fs-12 d-inline-block text-nowrap"
            @click="download"
            title="Télécharger le fichier PDF sur votre ordinateur"
          >
            <i class="flaticon-download position-relative ms-1 fs-11"></i>
            Télécharger
          </button>

          <button
            v-if="pdfUrl && !loading"
            type="button"
            class="default-btn position-relative transition border-0 fw-medium text-white pt-8 pb-8 ps-12 pe-12 rounded-1 bg-dark fs-12 d-inline-block text-nowrap"
            @click="printPdf"
            title="Imprimer directement le document"
          >
            <i class="flaticon-printer position-relative ms-1 fs-11"></i>
            Imprimer
          </button>

          <button
            type="button"
            class="btn-close-viewer ms-2"
            @click="close"
            title="Fermer le lecteur"
          >
            &times;
          </button>
        </div>
      </div>

      <!-- CORPS DU VISIONNEUR (LECTEUR EMBARQUÉ) -->
      <div class="pdf-viewer-body position-relative">
        <!-- État de chargement / régénération -->
        <div v-if="loading" class="pdf-viewer-message text-center p-4">
          <div class="spinner-border text-success mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <h6 class="fw-bold text-white mb-1">Régénération du document en cours...</h6>
          <p class="text-white-50 small mb-0">Recompilation instantanée en mémoire vive via le moteur officiel.</p>
        </div>

        <!-- État d'erreur -->
        <div v-else-if="errorMessage" class="pdf-viewer-message text-center p-4">
          <i class="flaticon-cancel text-danger fs-36 mb-2 d-block"></i>
          <h6 class="text-white fw-bold mb-1">Impossible de charger le document</h6>
          <p class="text-white-50 small mb-3">{{ errorMessage }}</p>
          <button class="btn btn-sm btn-outline-light" @click="close">Fermer</button>
        </div>

        <!-- Visionneur PDF plein écran dans la modal -->
        <iframe
          v-else-if="pdfUrl"
          ref="pdfFrame"
          :src="pdfUrl"
          class="w-100 h-100 border-0 d-block"
          title="Lecteur PDF intégré"
        ></iframe>
      </div>

      <!-- PIED DU VISIONNEUR -->
      <div class="pdf-viewer-footer p-2 px-3 bg-white border-top d-flex align-items-center justify-content-between text-muted fs-11">
        <span class="d-flex align-items-center gap-1">
          <i class="flaticon-shield text-success"></i>
          <span>Document officiel régénéré à la volée (Zéro stockage disque)</span>
        </span>
        <span v-if="filename" class="text-truncate" style="max-width: 350px;">
          Fichier : <strong>{{ filename }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'PdfViewerModal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: 'Visionneur de Document',
    },
    subtitle: {
      type: String,
      default: '',
    },
    documentKey: {
      type: String,
      default: '',
    },
    filename: {
      type: String,
      default: 'Document.pdf',
    },
  },
  emits: ['close', 'download'],
  setup(props, { emit }) {
    const pdfFrame = ref<HTMLIFrameElement | null>(null);

    function close() {
      emit('close');
    }

    function handleOverlayClick() {
      close();
    }

    function download() {
      emit('download');
    }

    function printPdf() {
      if (pdfFrame.value && pdfFrame.value.contentWindow) {
        try {
          pdfFrame.value.contentWindow.focus();
          pdfFrame.value.contentWindow.print();
          return;
        } catch (e) {
          console.warn('Impression iframe bloquée, ouverture fallback:', e);
        }
      }
      if (props.pdfUrl) {
        const win = window.open(props.pdfUrl, '_blank');
        if (win) {
          win.onload = () => win.print();
        }
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && props.visible) {
        close();
      }
    }

    watch(
      () => props.visible,
      (val) => {
        if (val) {
          document.body.style.overflow = 'hidden';
          window.addEventListener('keydown', handleKeydown);
        } else {
          document.body.style.overflow = '';
          window.removeEventListener('keydown', handleKeydown);
        }
      }
    );

    onUnmounted(() => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeydown);
    });

    return {
      pdfFrame,
      close,
      handleOverlayClick,
      download,
      printPdf,
    };
  },
});
</script>

<style scoped>
.pdf-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 10500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.pdf-viewer-container {
  width: 96vw;
  max-width: 1250px;
  height: 94vh;
  background-color: #ffffff;
  border-radius: 2px;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: viewerFadeIn 0.2s ease-out;
}

.viewer-logo {
  height: 26px;
  width: auto;
  object-fit: contain;
}

.pdf-viewer-body {
  flex: 1;
  background-color: #404040;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pdf-viewer-message {
  max-width: 500px;
}

.btn-close-viewer {
  background: transparent;
  border: none;
  font-size: 30px;
  line-height: 1;
  color: #666;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.15s, transform 0.15s;
}

.btn-close-viewer:hover {
  color: #dc3545;
  transform: scale(1.15);
}

.fs-11 {
  font-size: 11px;
}
.fs-12 {
  font-size: 12px;
}
.fs-36 {
  font-size: 36px;
}
.p-15 {
  padding: 15px;
}
.px-20 {
  padding-left: 20px;
  padding-right: 20px;
}
.pt-8 {
  padding-top: 8px;
}
.pb-8 {
  padding-bottom: 8px;
}
.ps-12 {
  padding-left: 12px;
}
.pe-12 {
  padding-right: 12px;
}

@keyframes viewerFadeIn {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
