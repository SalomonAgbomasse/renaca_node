<template>
  <div class="card mb-25 border-0 rounded-0 bg-white">
    <div class="card-body p-15 p-sm-20 p-md-25 p-lg-30 letter-spacing">
      <div
        class="mb-15 mb-md-30 d-sm-flex align-items-center justify-content-between"
      >
        <h6 class="card-title fw-bold mb-0">Les derniers contrats emprunteur</h6>
       <!--<div
          class="card-select mt-10 mt-sm-0 mb-10 mb-sm-0 d-flex align-items-center ps-10 pe-10 pt-5 pb-5"
        >
          <span class="fw-medium text-muted me-8">Statut</span>
          <select
            class="form-select shadow-none text-black border-0 ps-0 pt-0 pb-0 pe-20 fs-14 fw-medium"
          >
            <option selected class="fw-medium">Tous les types</option>
            <option value="1" class="fw-medium">Abonnement</option>
            <option value="1" class="fw-medium">Attestation</option>
            <option value="1" class="fw-medium">Transfert</option>
            <option value="1" class="fw-medium">Resiliation</option>
            <option value="1" class="fw-medium">Cession</option>
          </select>
        </div> -->
      </div>
      
      <!-- Message d'information pour les contrats emprunteur -->
      <div class="alert alert-info mb-3">
        <i class="flaticon-info me-2"></i>
        <strong>Information :</strong> Les contrats emprunteur ne sont pas encore implémentés dans le système. Cette section affichera les données une fois la fonctionnalité développée.
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
                Emprunteur
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Montant Emprunté
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Date Création
              </th>
              <th
                scope="col"
                class="text-uppercase fw-medium shadow-none text-body-tertiary fs-13 pt-0"
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Données vides pour le moment -->
            <tr v-if="contratsEmprunteur.length === 0">
              <td colspan="5" class="text-center py-4 text-muted">
                <i class="flaticon-folder fs-2 mb-2 d-block"></i>
                Aucun contrat emprunteur disponible
                <br>
                <small>Cette fonctionnalité sera disponible prochainement</small>
              </td>
            </tr>
            
            <!-- Template pour les futurs contrats emprunteur -->
            <tr v-for="(contrat, index) in contratsEmprunteur" :key="index">
              <th class="shadow-none lh-1 fw-bold ps-0">
                {{ contrat.code || 'N/A' }}
              </th>
              <td class="shadow-none lh-1 fw-semibold text-black-emphasis">
                {{ contrat.emprunteurNom || 'Nom non disponible' }}
              </td>
              <td class="shadow-none lh-1 fw-medium text-body-tertiary">
                {{ formatCurrency(contrat.montantEmprunte || 0) }} XAF
              </td>
              <td class="shadow-none lh-1 fw-medium text-body-tertiary">
                {{ formatDate(contrat.createdAt || '') }}
              </td>
              <td class="shadow-none lh-1 fw-medium">
                <span 
                  :class="getStatusBadgeClass(contrat.status || '')"
                  class="badge">
                  {{ getStatusText(contrat.status || '') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

interface ContratEmprunteur {
  code?: string;
  emprunteurNom?: string;
  montantEmprunte?: number;
  createdAt?: string;
  status?: string;
}

export default defineComponent({
  name: "StockReport",
  setup() {
    // Pour le moment, tableau vide - sera rempli quand la fonctionnalité sera implémentée
    const contratsEmprunteur = ref<ContratEmprunteur[]>([]);
    const loading = ref(false);

    const formatCurrency = (amount: number) => {
      if (!amount) return '0';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const getStatusBadgeClass = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return 'text-outline-success';
        case 'SUSPENDED':
          return 'text-outline-warning';
        case 'CANCELLED':
          return 'text-outline-danger';
        case 'PENDING':
          return 'text-outline-info';
        default:
          return 'text-outline-secondary';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return 'Actif';
        case 'SUSPENDED':
          return 'Suspendu';
        case 'CANCELLED':
          return 'Annulé';
        case 'PENDING':
          return 'En attente';
        default:
          return status || 'Inconnu';
      }
    };

    // Fonction pour charger les contrats emprunteur (à implémenter plus tard)
    const loadContratsEmprunteur = async () => {
      try {
        loading.value = true;
        // TODO: Implémenter l'appel API quand les contrats emprunteur seront disponibles
        // const response = await ApiService.get('/dashboard/contrats-emprunteur?limit=10');
        // contratsEmprunteur.value = response.data.data;
        
        // Pour le moment, tableau vide
        contratsEmprunteur.value = [];
      } catch (error) {
        console.error('Erreur lors du chargement des contrats emprunteur:', error);
        contratsEmprunteur.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await loadContratsEmprunteur();
    });

    return {
      contratsEmprunteur,
      loading,
      formatCurrency,
      formatDate,
      getStatusBadgeClass,
      getStatusText,
    };
  },
});
</script>