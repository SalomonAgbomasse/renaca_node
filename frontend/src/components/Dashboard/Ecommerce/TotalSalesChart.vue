<template>
  <div class="col-12">
    <div class="card mb-25 border-0 rounded-0 bg-white">
      <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
        <div class="mb-15 mb-md-30 d-sm-flex align-items-center justify-content-between">
          <h6 class="card-title fw-bold mb-0">Production de la semaine</h6>
          <router-link 
            to="/liste-contrats" 
            class="btn btn-company d-flex align-items-center gap-1 fw-medium"
            style="border-radius: 6px; transition: all 0.3s ease; font-size: 0.75rem; padding: 4px 10px;"
          >
            <span>Voir toute la production</span>
            <i class="flaticon-right-arrow" style="font-size: 12px;"></i>
          </router-link>
        </div>

        <!-- Liste des contrats -->
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>

        <div v-else-if="!contracts || contracts.length === 0" class="text-center py-4 text-muted">
          <i class="material-symbols-outlined" style="font-size: 3rem; opacity: 0.3;">📋</i>
          <p class="mt-2">Aucun contrat créé cette semaine</p>
        </div>

        <div v-else>
          <div class="table-responsive">
            <table class="table text-nowrap align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 ps-0">POLICE</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0">DATE</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0">GESTIONNAIRE</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0">CAPITAL</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0">PUTTC</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0">DURÉE</th>
                  <th scope="col" class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 pe-0">NATURE</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contract in (contracts || [])" :key="contract.id">
                  <th class="shadow-none lh-1 fw-bold ps-0">
                    <a href="#" class="text-decoration-none text-black-emphasis">{{ contract.police || 'N/A' }}</a>
                  </th>
                  <td class="shadow-none lh-1 fw-medium">{{ formatDateOnly(contract.date) }}</td>
                  <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                    <div class="d-flex align-items-center">
                      <span>{{ formatUserName(contract.user) }}</span>
                    </div>
                  </td>
                  <td class="shadow-none lh-1 fw-medium text-body-tertiary">{{ formatCurrency(contract.capital) }}</td>
                  <td class="shadow-none lh-1 fw-medium text-body-tertiary">{{ formatCurrency(contract.puttc) }}</td>
                  <td class="shadow-none lh-1 fw-medium text-body-tertiary">{{ contract.duree || 0 }}</td>
                  <td class="shadow-none lh-1 fw-medium pe-0">
                    <span class="badge text-outline-primary">{{ contract.natureCredit || 'Non défini' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
            v-if="total > 0"
          >
            <Pagination
              :page="currentPage"
              :totalPages="totalPages"
              :totalElements="total"
              :limit="selectedLimit"
              @paginate="handlePagination"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import ApiService from "../../../services/ApiService";
import Pagination from "../../Utilities/Pagination.vue";

interface Contract {
  id: number;
  police: string;
  reference: string;
  capital: number | string;
  duree: number;
  natureCredit: string;
  puttc: number | string;
  user: string;
  date: string;
  status: string;
}

export default defineComponent({
  name: "WeeklyProductionList",
  components: {
    Pagination
  },
  setup() {
    const contracts = ref<Contract[]>([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const selectedLimit = ref(5);
    const total = ref(0);
    const totalPages = ref(0);

    const loadContracts = async () => {
      try {
        loading.value = true;
        //console.log('🔄 Chargement des contrats de la semaine...');
        const response = await ApiService.get(
          `/dashboard/weekly-contracts?page=${currentPage.value}&limit=${selectedLimit.value}`
        );
        
        //console.log('📊 Réponse APIRéponse API data: contrats:', response);
        //console.log('📊 Réponse API data: contrats:vvvvvvvvvvvvvvvvvvvv', response.data.data.data.data);
        if (response.data && response.data.data) {
          //console.log('📋 Données contrats:', response.data.data.data);
          const data = response.data.data?.data || response.data.data;
          contracts.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
          total.value = data?.total || response.data.data?.total || 0;
          totalPages.value = data?.totalPages || response.data.data?.totalPages || 0;
        } else {
          console.warn('⚠️ Aucune donnée dans la réponse');
          contracts.value = [];
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des contrats:", error);
        contracts.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handlePagination = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        currentPage.value = page_;
        selectedLimit.value = limit_;
        loadContracts();
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    const formatCurrency = (amount: number | string) => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (!numAmount || isNaN(numAmount)) {
        return '0';
      }
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numAmount);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) {
        return 'Date inconnue';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDateShort = (dateString: string) => {
      if (!dateString) {
        return 'Date inconnue';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) {
        return 'À l\'instant';
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `${diffHours} h${diffHours > 1 ? 's' : ''}`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }
    };

    const formatDateOnly = (dateString: string) => {
      if (!dateString) {
        return 'Date inconnue';
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatUserName = (userName: string) => {
      if (!userName || userName === 'Inconnu') {
        return 'Inconnu';
      }
      
      // Séparer le nom et prénom
      const parts = userName.trim().split(' ');
      
      if (parts.length === 0) {
        return userName;
      }
      
      if (parts.length === 1) {
        return parts[0];
      }
      
      // Prendre la première lettre du prénom et le nom complet
      const prenom = parts[0];
      const nom = parts.slice(1).join(' ');
      
      // Retourner "P. NOM" ou juste le nom si le prénom est vide
      if (prenom && prenom.length > 0) {
        return `${prenom.charAt(0).toUpperCase()}. ${nom.toUpperCase()}`;
      }
      
      return nom.toUpperCase();
    };



    onMounted(() => {
      loadContracts();
    });

    return {
      contracts,
      loading,
      currentPage,
      selectedLimit,
      total,
      totalPages,
      loadContracts,
      handlePagination,
      formatCurrency,
      formatDate,
      formatDateShort,
      formatDateOnly,
      formatUserName
    };
  },
});
</script>

<style scoped>
.btn-company {
  border-color: #33b04a;
  color: #33b04a;
  background-color: transparent;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
    border-color: #33b04a;
    box-shadow: 0 0 0 rgba(51, 176, 74, 0);
  }
  50% {
    opacity: 0.7;
    border-color: #ede947;
    box-shadow: 0 0 10px rgba(237, 233, 71, 0.5);
  }
}

.btn-company:hover {
  background-color: #33b04a;
  color: #231f20;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(51, 176, 74, 0.3);
  animation: none;
}

.btn-company:active {
  transform: translateY(0);
}
</style>

