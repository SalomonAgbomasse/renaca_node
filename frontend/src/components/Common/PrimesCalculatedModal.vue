<!-- PrimesCalculatedModal.vue -->
<template>
  <Modal
    :is-visible="visible"
    title="Primes Calculées"
    icon="fas fa-calculator"
    size="large"
    @close="handleClose"
    @update:is-visible="$emit('update:visible', $event)"
  >
    <!-- Body du modal -->
    <div class="primes-modal-body">
      <!-- Six widgets des primes - Responsive -->
      <div class="row g-2 g-md-4">
        <!-- Prime Unique TTC - PREMIER -->
        <div class="col-6 col-md-4">
          <div class="prime-widget prime-widget-highlight">
            <div class="prime-icon">
              <i class="fas fa-coins"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Prime Unique TTC</h6>
              <div class="prime-value">{{ formatCurrency(primes.puttc) }}</div>
              <small class="prime-label">PUTTC</small>
            </div>
          </div>
        </div>

        <!-- Prime Décès -->
        <div class="col-6 col-md-4">
          <div class="prime-widget">
            <div class="prime-icon">
              <i class="fas fa-heart-broken"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Prime Décès</h6>
              <div class="prime-value">{{ formatCurrency(primes.pd) }}</div>
              <small class="prime-label">PD</small>
            </div>
          </div>
        </div>

        <!-- Perte d'Emploi -->
        <div class="col-6 col-md-4">
          <div class="prime-widget">
            <div class="prime-icon">
              <i class="fas fa-briefcase"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Perte d'Emploi</h6>
              <div class="prime-value">{{ formatCurrency(primes.pc) }}</div>
              <small class="prime-label">PC</small>
            </div>
          </div>
        </div>

        <!-- Surprime -->
        <div class="col-6 col-md-4">
          <div class="prime-widget">
            <div class="prime-icon">
              <i class="fas fa-plus-circle"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Surprime</h6>
              <div class="prime-value">{{ formatCurrency(primes.surp) }}</div>
              <small class="prime-label">SURP</small>
            </div>
          </div>
        </div>

        <!-- Accessoires -->
        <div class="col-6 col-md-4">
          <div class="prime-widget">
            <div class="prime-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Accessoires</h6>
              <div class="prime-value">{{ formatCurrency(primes.acc) }}</div>
              <small class="prime-label">ACC</small>
            </div>
          </div>
        </div>

        <!-- Frais Médicaux -->
        <div class="col-6 col-md-4">
          <div class="prime-widget">
            <div class="prime-icon">
              <i class="fas fa-stethoscope"></i>
            </div>
            <div class="prime-content">
              <h6 class="prime-title">Frais Médicaux</h6>
              <div class="prime-value">{{ formatCurrency(primes.fm) }}</div>
              <small class="prime-label">FM</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer du modal -->
    <template #footer>
      <div class="d-flex justify-content-end gap-2 w-100">
        <!-- Bouton Fermer -->
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="handleClose"
        >
          <i class="fas fa-times me-2"></i>
          Fermer
        </button>
        
        <!-- Bouton Convertir en Contrat -->
        <button
          v-if="showConvertButton"
          type="button"
          class="btn btn-primary btn-sm"
          @click="handleConvert"
          :disabled="isConverting"
        >
          <span v-if="isConverting">
            <i class="spinner-border spinner-border-sm me-2"></i>
            Conversion en cours...
          </span>
          <span v-else>
            <i class="fas fa-file-contract me-2"></i>
            Convertir en Contrat
          </span>
        </button>
      </div>
    </template>

  </Modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import Modal from './Modal.vue';

interface PrimesData {
  pd: number;
  pc: number;
  surp: number;
  acc: number;
  fm: number;
  puttc: number;
}

export default defineComponent({
  name: "PrimesCalculatedModal",
  components: {
    Modal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    primes: {
      type: Object as () => PrimesData,
      default: () => ({
        pd: 0,
        pc: 0,
        surp: 0,
        acc: 0,
        fm: 0,
        puttc: 0
      })
    },
    showConvertButton: {
      type: Boolean,
      default: true
    },
    isConverting: {
      type: Boolean,
      default: false
    },
    // Nouveau prop pour déterminer le contexte d'appel
    context: {
      type: String,
      default: 'default', // 'default', 'cotation-modal', 'add-cotation', 'liste-contrat'
      validator: (value: string) => ['default', 'cotation-modal', 'add-cotation', 'liste-contrat'].includes(value)
    },
  },
  emits: ['close', 'convert', 'convert-cotation-modal', 'convert-add-cotation', 'convert-liste-contrat', 'conversion-success', 'update:visible'],
  setup(props, { emit }) {
    // Watcher pour les logs
    watch(() => props.visible, (newValue, oldValue) => {
      // Props visible changed
    }, { immediate: true });

    // Watcher pour fermer automatiquement après succès de conversion
    watch(() => props.isConverting, (isConverting, wasConverting) => {
      if (wasConverting && !isConverting) {
        setTimeout(() => {
          emit('close');
        }, 500); // Délai pour laisser le temps à l'utilisateur de voir le succès
      }
    });

    // Fonction pour gérer le succès de conversion
    const handleConversionSuccess = () => {
      emit('close');
    };

    // Fonction pour formater la monnaie
    const formatCurrency = (amount: number): string => {
      if (amount == null) return '0 FCFA';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    // Fonction pour fermer le modal
    const handleClose = () => {
      emit('close');
    };

    // Fonction pour convertir en contrat - émet l'événement approprié selon le contexte
    const handleConvert = () => {
      switch (props.context) {
        case 'cotation-modal':
          emit('convert-cotation-modal');
          // Fermer immédiatement le modal des primes
          emit('close');
          break;
        case 'add-cotation':
          emit('convert-add-cotation');
          break;
        case 'liste-contrat':
          emit('convert-liste-contrat');
          break;
        default:
          emit('convert');
          break;
      }
    };

    // Fonction pour fermer le modal après succès de création
    const closeAfterSuccess = () => {
      emit('close');
    };


    return {
      formatCurrency,
      handleClose,
      handleConvert,
      closeAfterSuccess,
      handleConversionSuccess
    };
  }
});
</script>

<style scoped>
/* Couleurs exactes APA ASSURANCES */
:root {
  --apa-green: #33b04a;
  --apa-yellow: #ede947;
  --apa-black: #231f20;
}

.primes-modal-body {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--apa-green) 0%, #2d9a41 100%);
  border-radius: 15px;
}

.prime-widget {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.prime-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--apa-green);
  border-radius: 12px 12px 0 0;
}

.prime-widget:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%);
}

.prime-widget:not(.prime-widget-highlight):hover {
  border-color: #33b04a;
  box-shadow: 0 8px 25px rgba(51, 176, 74, 0.1);
}

.prime-widget-highlight {
  background: linear-gradient(135deg, #33b04a 0%, #2d9a41 100%) !important;
  color: #231f20 !important;
  border: 3px solid #ede947 !important;
  box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4) !important;
  transform: scale(1.08) !important;
  z-index: 10;
  position: relative;
}

.prime-widget-highlight::before {
  background: var(--apa-green);
  height: 3px;
}

.prime-widget-highlight:hover {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 15px 35px rgba(51, 176, 74, 0.5);
}

.prime-widget-highlight .prime-title {
  color: #231f20 !important;
  font-weight: 700 !important;
}

.prime-widget-highlight .prime-label {
  color: #231f20 !important;
  background: rgba(35, 31, 32, 0.1) !important;
  border: 1px solid rgba(35, 31, 32, 0.2) !important;
}

.prime-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #6c757d;
  transition: all 0.3s ease;
}

.prime-widget-highlight .prime-icon {
  color: #ede947 !important;
  font-size: 2.2rem !important;
  animation: iconPulse 1.5s ease-in-out infinite;
}

@keyframes iconPulse {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}

.prime-widget:hover .prime-icon {
  transform: scale(1.1);
  color: var(--apa-green);
}

.prime-widget-highlight:hover .prime-icon {
  color: white;
  transform: scale(1.1);
}

.prime-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.prime-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--apa-black);
  line-height: 1.2;
}

.prime-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--apa-green);
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.prime-widget-highlight .prime-value {
  color: #231f20 !important;
  font-size: 1.5rem !important;
  font-weight: 800 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

.prime-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8f9fa;
  padding: 3px 10px;
  border-radius: 10px;
  display: inline-block;
  border: 1px solid #e9ecef;
}

.prime-widget-highlight .prime-label {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Boutons d'action */
.btn-outline-secondary {
  border: 2px solid #6c757d !important;
  color: #231f20 !important;
  background: white !important;
  transition: all 0.3s ease;
  font-weight: 600;
  padding: 0.5rem 1rem;
  min-width: 100px;
}

.btn-outline-secondary:hover {
  background-color: #6c757d !important;
  border-color: #6c757d !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn-primary {
  background: #ede947 !important;
  border: 2px solid #ede947 !important;
  color: #231f20 !important;
  transition: all 0.3s ease;
  font-weight: 700;
  padding: 0.5rem 1.5rem;
  box-shadow: 0 4px 15px rgba(237, 233, 71, 0.3);
  min-width: 150px;
}

.btn-primary:hover {
  background: #ede947 !important;
  border-color: #ede947 !important;
  color: #231f20 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(237, 233, 71, 0.4);
}

/* Responsive design */
@media (max-width: 768px) {
  .primes-modal-body {
    padding: 1rem;
  }
  
  .prime-widget {
    padding: 1rem 0.75rem;
    min-height: 100px;
  }
  
  .prime-icon {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  .prime-title {
    font-size: 0.8rem;
  }
  
  .prime-value {
    font-size: 1.1rem;
  }
  
  .prime-widget-highlight .prime-value {
    font-size: 1.3rem;
  }
  
  .prime-label {
    font-size: 0.7rem;
  }
  
  /* Boutons responsives */
  .btn-sm {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    min-width: 80px;
  }
  
  .btn-primary {
    min-width: 120px;
  }
  
  .d-flex {
    flex-direction: column;
    gap: 8px !important;
  }
  
  .d-flex .btn {
    width: 100%;
  }
}

/* Animation d'entrée */
.prime-widget {
  animation: slideInUp 0.3s ease-out;
  animation-fill-mode: both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Délai d'animation pour chaque widget */
.prime-widget:nth-child(1) { animation-delay: 0.1s; }
.prime-widget:nth-child(2) { animation-delay: 0.2s; }
.prime-widget:nth-child(3) { animation-delay: 0.3s; }
.prime-widget:nth-child(4) { animation-delay: 0.4s; }
.prime-widget:nth-child(5) { animation-delay: 0.5s; }
.prime-widget:nth-child(6) { animation-delay: 0.6s; }

/* Animation de pulsation pour le widget principal - Battement de cœur */
.prime-widget-highlight {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4);
  }
  14% {
    transform: scale(1.12);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4), 0 0 0 8px rgba(237, 233, 71, 0.2);
  }
  28% {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4);
  }
  42% {
    transform: scale(1.12);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4), 0 0 0 8px rgba(237, 233, 71, 0.2);
  }
  70% {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4);
  }
  100% {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(51, 176, 74, 0.4);
  }
}
</style>
