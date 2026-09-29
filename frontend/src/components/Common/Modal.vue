<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" :class="modalSize" @click.stop>
      <!-- Header de la modal -->
      <div class="modal-header">
        <h4 class="modal-title d-flex align-items-center gap-2">
          <img src="@/assets/images/logo-guda-with.png" alt="L'Africaine Vie" class="modal-inline-logo" />
          <span>{{ title }}</span>
        </h4>
        <div class="modal-header-actions d-flex align-items-center gap-2">
          <slot name="header-right"></slot>
          <slot name="header-actions"></slot>
          <button 
            type="button" 
            class="btn-close-modal"
            @click="closeModal"
            :title="closeButtonTitle"
          >
            <span class="close-symbol">×</span>
          </button>
        </div>
      </div>

      <!-- Contenu de la modal -->
      <div class="modal-body">
        <slot></slot>
      </div>

      <!-- Footer de la modal (optionnel) -->
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, computed } from 'vue';

export default defineComponent({
  name: 'Modal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Modal'
    },
    icon: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'medium', // small, medium, large, xlarge, xxlarge
      validator: (value: string) => ['small', 'medium', 'large', 'xlarge', 'xxlarge'].includes(value)
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    closeButtonTitle: {
      type: String,
      default: 'Fermer'
    }
  },
  emits: ['close', 'update:isVisible'],
  setup(props, { emit }) {
    const closeModal = (): void => {
      emit('close');
      emit('update:isVisible', false);
    };

    const handleOverlayClick = (): void => {
      if (props.closeOnOverlay) {
        closeModal();
      }
    };

    // Gérer l'escape key
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && props.isVisible) {
        closeModal();
      }
    };

    // Ajouter/supprimer l'event listener pour escape
    watch(() => props.isVisible, (newValue) => {
      if (newValue) {
        document.addEventListener('keydown', handleEscapeKey);
        document.body.classList.add('modal-open');
      } else {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.classList.remove('modal-open');
      }
    });

    const computedIcon = computed(() => {
      if (props.icon) return props.icon;
      
      const t = props.title.toLowerCase();
      if (t.includes('admin')) {
        return 'flaticon-settings';
      }
      if (t.includes('contrat') || t.includes('contract')) {
        return 'flaticon-file-1';
      }
      if (t.includes('cotation') || t.includes('prime') || t.includes('calcul')) {
        return 'flaticon-file-1';
      }
      if (t.includes('client') || t.includes('customer') || t.includes('assuré') || t.includes('user') || t.includes('souscripteur') || t.includes('subscriber') || t.includes('utilisateur')) {
        return 'flaticon-user';
      }
      if (t.includes('import')) {
        return 'flaticon-download';
      }
      if (t.includes('agence') || t.includes('agency')) {
        return 'flaticon-home';
      }
      return 'flaticon-file-1';
    });

    return {
      closeModal,
      handleOverlayClick,
      computedIcon
    };
  },
  computed: {
    modalSize(): string {
      return `modal-${this.size}`;
    }
  }
});
</script>

<style scoped>
/* Overlay de la modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Container de la modal */
.modal-container {
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.4s ease-out;
  position: relative;
  display: flex;
  flex-direction: column;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Tailles de modal */
.modal-small {
  width: 100%;
  max-width: 400px;
}

.modal-medium {
  width: 100%;
  max-width: 600px;
}

.modal-large {
  width: 100%;
  max-width: 800px;
}

.modal-xlarge {
  width: 100%;
  max-width: 1200px;
}

.modal-xxlarge {
  width: 98%;
  max-width: 1920px;
}

/* Header de la modal */
.modal-header {
  background: linear-gradient(135deg, #33b04a 0%, #2d9a41 100%);
  color: #ffffff;
  padding: 14px 22px;
  border-bottom: 2px solid #ede947;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-inline-logo {
  height: 26px;
  width: auto;
  object-fit: contain;
  background-color: #ffffff;
  padding: 2px 6px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  margin-right: 6px;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding-right: 15px;
  line-height: 1.2;
}

.modal-title i {
  color: #ede947;
  flex-shrink: 0;
}

/* Bouton de fermeture */
.btn-close-modal {
  background: rgba(255, 255, 255, 0.2) !important;
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
  cursor: pointer !important;
  position: relative !important;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: scale(1.1) !important;
}

/* Stepper moderne intégré dans le header à droite */
:deep(.modal-header-stepper) {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 30px;
  padding: 3px 6px;
  gap: 3px;
  margin-right: 6px;
}

:deep(.header-step-item) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: rgba(255, 255, 255, 0.85);
  user-select: none;
}

:deep(.header-step-item:hover) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

:deep(.header-step-item.active) {
  background: #ffffff;
  color: #33b04a;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

:deep(.header-step-item.completed) {
  color: #ffffff;
}

:deep(.header-step-circle) {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

:deep(.header-step-item.active .header-step-circle),
:deep(.header-step-item.completed .header-step-circle) {
  background: #33b04a;
  color: #ffffff;
}

:deep(.header-step-text) {
  font-size: 12px;
  white-space: nowrap;
}

:deep(.header-step-line) {
  width: 14px;
  height: 2px;
  background: rgba(255, 255, 255, 0.35);
}

.close-symbol {
  color: #ffffff !important;
  font-size: 1.8rem !important;
  font-weight: bold !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
  display: block !important;
  line-height: 1 !important;
  font-family: Arial, sans-serif !important;
}

.btn-close-modal:hover .close-symbol {
  color: #ffffff !important;
  transform: scale(1.2) !important;
}

/* Body de la modal */
.modal-body {
  padding: 25px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 0;
}

/* Footer de la modal */
.modal-footer {
  background: #f8f9fa;
  padding: 10px 25px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* Scrollbar personnalisée */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #33b04a;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #2d9a41;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-height: 95vh;
    border-radius: 10px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .btn-close-modal {
    width: 35px !important;
    height: 35px !important;
    font-size: 1rem !important;
  }

  .close-symbol {
    font-size: 1.5rem !important;
    color: #ffffff !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
  }

  .modal-body {
    padding: 20px;
    max-height: calc(95vh - 100px);
  }

  .modal-footer {
    padding: 12px 15px;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 10px !important;
    align-items: center !important;
  }

  .modal-footer :deep(.btn),
  .modal-footer :deep(button) {
    flex: 1 !important;
    width: auto !important;
    margin: 0 !important;
    padding: 10px 12px !important;
    font-size: 0.88rem !important;
    border-radius: 8px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    white-space: nowrap !important;
  }

  /* Modal xlarge et xxlarge sur mobile */
  .modal-xlarge,
  .modal-xxlarge {
    max-width: 98% !important;
    width: 98% !important;
  }

  .modal-xlarge .modal-body,
  .modal-xxlarge .modal-body {
    padding: 20px !important;
    max-height: calc(95vh - 120px) !important;
  }
}

/* Empêcher le scroll de la page quand la modal est ouverte */
body.modal-open {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
}
</style>
