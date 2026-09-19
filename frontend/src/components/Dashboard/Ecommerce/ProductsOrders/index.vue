<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
      <div
        class="mb-15 mb-md-30 d-sm-flex align-items-center justify-content-between"
      >
        <h6 class="card-title fw-bold mb-0">Les dix derniers contrats certicompte</h6>
      </div>
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 ps-0"
              >
                Code Contrat
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Prime TTC
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Client
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Agence
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Date Création
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0 pe-0"
              >
                Utilisateur
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(contrat, index) in contrats" :key="index">
              <th class="shadow-none lh-1 fw-bold ps-0">
                {{ contrat.code || 'N/A' }}
              </th>
              <td class="shadow-none lh-1 fw-medium">
                {{ formatCurrency(contrat.primeTTC) }}
                <span class="text-body-tertiary"> XAF</span>
              </td>
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div class="d-flex align-items-center">
                  {{ getCustomerName(contrat.customer) }}
                </div>
              </td>
              <td class="shadow-none lh-1 fw-medium text-body-tertiary">
                {{ getAgencyName(contrat.agency) }}
              </td>
              <td class="shadow-none lh-1 fw-medium text-body-tertiary">
                {{ formatDate(contrat.createdAt) }}
              </td>
              <td class="shadow-none lh-1 fw-medium pe-0">
                {{ getUserName(contrat.user) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Message si aucun contrat -->
      <div v-if="contrats.length === 0" class="text-center py-4">
        <p class="text-muted mb-0">Aucun contrat trouvé</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import ApiService from '../../../../services/ApiService';

interface Contrat {
  code?: string;
  primeTTC?: number;
  createdAt?: string;
  status?: string;
  customer?: {
    fullName?: string;
    nom?: string;
    prenom?: string;
  };
  agency?: {
    name?: string;
  };
  user?: {
    fullName?: string;
  };
}

export default defineComponent({
  name: "ProductsOrders",
  setup() {
    const contrats = ref<Contrat[]>([]);
    const loading = ref(false);

    const fetchContrats = async () => {
      try {
        loading.value = true;
        console.log('📋 [FRONTEND] Début du chargement des contrats récents...');
        
        const response = await ApiService.get('/dashboard/recent-contracts?limit=10');
        console.log('contrats recents',response);
        
        if (response && response.data && response.data.data) {
          const contratsData = response.data.data.data;
          console.log('📋 [FRONTEND] Contrats extraits:', contratsData);
          console.log('📋 [FRONTEND] Nombre de contrats:', contratsData.length);
          console.log('📋 [FRONTEND] Type des données:', typeof contratsData);
          console.log('📋 [FRONTEND] Premier contrat (détaillé):', contratsData[0]);
          
          // Log détaillé de chaque contrat
          contratsData.forEach((contrat: any, index: number) => {
            console.log(`📋 [FRONTEND] Contrat ${index + 1}:`, {
              code: contrat.code,
              primeTTC: contrat.primeTTC,
              status: contrat.status,
              createdAt: contrat.createdAt,
              customer: contrat.customer,
              agency: contrat.agency,
              user: contrat.user,
              customerName: contrat.customer ? 
                (contrat.customer.fullName || `${contrat.customer.prenom} ${contrat.customer.nom}`.trim()) : 
                'Pas de client',
              agencyName: contrat.agency?.name || 'Pas d\'agence',
              userName: contrat.user?.fullName || 'Pas d\'utilisateur'
            });
          });
          
          contrats.value = contratsData;
          console.log('📋 [FRONTEND] ✅ Contrats assignés à la vue:', contrats.value);
        } else {
          console.warn('📋 [FRONTEND] ⚠️ Aucune donnée trouvée dans response.data.data');
          console.log('📋 [FRONTEND] Structure de réponse inattendue:', {
            hasData: !!response?.data,
            dataKeys: response?.data ? Object.keys(response.data) : 'N/A',
            dataValue: response?.data
          });
        }
      } catch (error: any) {
        console.error('❌ [FRONTEND] Erreur lors du chargement des contrats:', error);
        console.error('❌ [FRONTEND] Détails de l\'erreur:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // En cas d'erreur, utiliser des données par défaut
        contrats.value = [];
      } finally {
        loading.value = false;
        console.log('📋 [FRONTEND] Fin du chargement. État final:', {
          nombreContrats: contrats.value.length,
          loading: loading.value
        });
      }
    };

    const formatCurrency = (amount: number | undefined) => {
      if (!amount) return '0';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const getCustomerName = (customer: { fullName?: string; nom?: string; prenom?: string } | undefined) => {
      if (!customer) return 'Client inconnu';
      
      if (customer.fullName) return customer.fullName;
      
      const nom = customer.nom || '';
      const prenom = customer.prenom || '';
      const fullName = `${prenom} ${nom}`.trim();
      
      return fullName || 'Client inconnu';
    };

    const getAgencyName = (agency: { name?: string } | undefined) => {
      if (!agency) return 'Agence inconnue';
      
      return agency.name || 'Agence inconnue';
    };

    const getUserName = (user: { fullName?: string } | undefined) => {
      if (!user) return 'Utilisateur inconnu';
      
      return user.fullName || 'Utilisateur inconnu';
    };

    onMounted(() => {
      fetchContrats();
    });

    return {
      contrats,
      loading,
      formatCurrency,
      formatDate,
      getCustomerName,
      getAgencyName,
      getUserName,
      fetchContrats,
    };
  },
});
</script>