<template>
  <div class="card bg-white border-0 rounded-3 mb-4">
    <div class="card-body p-4">
      <div
        class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 mb-lg-4"
      >
        <h3 class="mb-0">Contrats à Échoir</h3>

        <div class="dropdown action-opt">
          <button
            class="btn bg-transparent p-0"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="material-symbols-outlined">more_horiz</i>
          </button>

          <ul
            class="dropdown-menu dropdown-menu-end bg-white border box-shadow"
          >
            <li>
              <a class="dropdown-item" href="javascript:;" @click="loadContracts('7days')">
                <i class="material-symbols-outlined">schedule</i>
                Prochaines 7 jours
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;" @click="loadContracts('30days')">
                <i class="material-symbols-outlined">pie_chart</i>
                Prochains 30 jours
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;" @click="loadContracts('3months')">
                <i class="material-symbols-outlined">refresh</i>
                Prochains 3 mois
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;" @click="loadContracts('6months')">
                <i class="material-symbols-outlined">calendar_month</i>
                Prochains 6 mois
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;" @click="loadContracts('1year')">
                <i class="material-symbols-outlined">bar_chart</i>
                Prochaine année
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-2 text-muted">Chargement des contrats...</p>
      </div>

      <!-- Message si pas de données -->
      <div v-else-if="contracts.length === 0" class="text-center py-4">
        <div class="text-muted">
          <i class="fas fa-file-contract fa-2x mb-2"></i>
          <p class="mb-0">Aucun contrat à échoir pour cette période</p>
        </div>
      </div>

      <!-- Liste des contrats -->
      <div v-else class="contracts-list">
        <div 
          v-for="contract in contracts" 
          :key="contract.id"
          class="contract-item"
        >
          <div class="contract-header">
            <div class="contract-info">
              <h6 class="contract-number">{{ contract.contractNumber }}</h6>
              <p class="contract-customer">{{ contract.customerName }}</p>
            </div>
            <div class="contract-urgency" :class="getUrgencyClass(contract.daysUntilExpiry)">
              <span class="urgency-text">{{ getUrgencyText(contract.daysUntilExpiry) }}</span>
              <span class="days-count">{{ contract.daysUntilExpiry }} jours</span>
            </div>
          </div>
          
          <div class="contract-details">
            <div class="detail-row">
              <span class="detail-label">Agence:</span>
              <span class="detail-value">{{ contract.agencyName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Montant:</span>
              <span class="detail-value">{{ formatCurrency(contract.amount) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date d'échéance:</span>
              <span class="detail-value">{{ formatDate(contract.expiryDate) }}</span>
            </div>
          </div>

          <div class="contract-progress">
            <div class="progress" role="progressbar">
              <div
                class="progress-bar"
                :class="getProgressBarClass(contract.daysUntilExpiry)"
                :style="{ width: getProgressWidth(contract.daysUntilExpiry) + '%' }"
              >
                <span class="progress-text">
                  {{ getProgressText(contract.daysUntilExpiry) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Résumé des statistiques -->
      <div v-if="!loading && contracts.length > 0" class="contracts-summary">
        <div class="summary-item">
          <span class="summary-label">Total contrats:</span>
          <span class="summary-value">{{ contracts.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Montant total:</span>
          <span class="summary-value">{{ formatCurrency(totalAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Période:</span>
          <span class="summary-value">{{ currentPeriod }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import ApiService from "../../../services/ApiService";

export default defineComponent({
  name: "SalesByLocations",
  setup() {
    const loading = ref(true);
    const contracts = ref([] as Array<{
      id: number;
      contractNumber: string;
      customerName: string;
      agencyName: string;
      amount: number;
      expiryDate: string;
      daysUntilExpiry: number;
    }>);
    const currentPeriod = ref('Prochains 30 jours');

    // Fonction de formatage des devises
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0
      }).format(value);
    };

    // Fonction de formatage des dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Calculer le montant total
    const totalAmount = computed(() => {
      return contracts.value.reduce((sum, contract) => sum + contract.amount, 0);
    });

    // Déterminer la classe d'urgence
    const getUrgencyClass = (days: number) => {
      if (days <= 7) return 'urgent';
      if (days <= 30) return 'warning';
      return 'normal';
    };

    // Déterminer le texte d'urgence
    const getUrgencyText = (days: number) => {
      if (days <= 7) return 'URGENT';
      if (days <= 30) return 'ATTENTION';
      return 'NORMAL';
    };

    // Déterminer la classe de la barre de progression
    const getProgressBarClass = (days: number) => {
      if (days <= 7) return 'bg-danger';
      if (days <= 30) return 'bg-warning';
      return 'bg-success';
    };

    // Calculer la largeur de la barre de progression
    const getProgressWidth = (days: number) => {
      if (days <= 7) return 100;
      if (days <= 30) return 80;
      if (days <= 90) return 60;
      return 40;
    };

    // Déterminer le texte de progression
    const getProgressText = (days: number) => {
      if (days <= 7) return 'Échéance imminente';
      if (days <= 30) return 'Échéance proche';
      if (days <= 90) return 'Échéance dans 3 mois';
      return 'Échéance future';
    };

    // Charger les contrats selon la période
    const loadContracts = async (period: string) => {
      try {
        loading.value = true;
        //console.log('📋 Chargement des contrats pour la période:', period);
        
        const response = await ApiService.get(`/dashboard-test/contracts-expiring?period=${period}`);
        //console.log('📋 Réponse contrats:', response);
        
        if (response.data && response.data.data) {
          contracts.value = response.data.data;
          currentPeriod.value = getPeriodLabel(period);
          //console.log('✅ Contrats chargés:', contracts.value);
        } else {
          console.warn('⚠️ Aucun contrat trouvé pour cette période');
          contracts.value = [];
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des contrats:', error);
        contracts.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Obtenir le libellé de la période
    const getPeriodLabel = (period: string) => {
      const labels: { [key: string]: string } = {
        '7days': 'Prochaines 7 jours',
        '30days': 'Prochains 30 jours',
        '3months': 'Prochains 3 mois',
        '6months': 'Prochains 6 mois',
        '1year': 'Prochaine année'
      };
      return labels[period] || 'Période inconnue';
    };


    onMounted(async () => {
      await loadContracts('30days'); // Charger par défaut les 30 prochains jours
    });

    return {
      loading,
      contracts,
      currentPeriod,
      totalAmount,
      formatCurrency,
      formatDate,
      getUrgencyClass,
      getUrgencyText,
      getProgressBarClass,
      getProgressWidth,
      getProgressText,
      loadContracts,
    };
  },
});
</script>

<style scoped>
.spinner-border {
  width: 2rem;
  height: 2rem;
}

.text-primary {
  color: #33b04a !important;
}

.contracts-list {
  max-height: 400px;
  overflow-y: auto;
}

.contract-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #33b04a;
  transition: all 0.2s ease;
}

.contract-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.contract-item:last-child {
  margin-bottom: 0;
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.contract-info {
  flex: 1;
}

.contract-number {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.contract-customer {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.contract-urgency {
  text-align: right;
  padding: 0.5rem;
  border-radius: 6px;
  min-width: 100px;
}

.contract-urgency.urgent {
  background: #fee2e2;
  color: #dc2626;
}

.contract-urgency.warning {
  background: #fef3c7;
  color: #d97706;
}

.contract-urgency.normal {
  background: #d1fae5;
  color: #059669;
}

.urgency-text {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.days-count {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
}

.contract-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
}

.contract-progress {
  margin-top: 0.75rem;
}

.progress {
  height: 8px;
  border-radius: 4px;
  background-color: #e5e7eb;
}

.progress-bar {
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.contracts-summary {
  background: #f1f5f9;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #33b04a;
}

/* Responsive */
@media (max-width: 768px) {
  .contract-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .contract-urgency {
    text-align: left;
    min-width: auto;
  }
  
  .contract-details {
    grid-template-columns: 1fr;
  }
  
  .contracts-summary {
    flex-direction: column;
    text-align: center;
  }
}
</style>
