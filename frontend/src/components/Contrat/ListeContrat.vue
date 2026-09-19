<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <div
      class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
      <div class="d-flex align-items-center">
        <button
          @click="openConversionModal"
          class="default-btn position-relative transition border-0 fw-medium text-white pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 bg-success fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0 text-decoration-none">
          <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-sm-inline">Ajouter un contrat</span>
          <span class="d-sm-none">Ajouter</span>
        </button>
        
        <button
          @click="openImportModal"
          class="default-btn position-relative transition border-0 fw-medium text-white pt-11 pb-11 ps-25 pe-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-md-15 fs-lg-16 d-none d-md-inline-block me-10 mb-10 mb-lg-0 text-decoration-none"
          style="background-color: #231f20; color: #ede947; border-color: #231f20;">
          <i class="flaticon-upload position-relative ms-5 fs-12"></i>
          Importer des contrats
        </button>
      </div>
      <div class="d-flex align-items-center gap-3">
        <!-- Filtre Nature Crédit -->
        <div class="nature-credit-filter d-none d-sm-block" style="min-width: 220px;">
          <select 
            v-model="selectedNatureCredit" 
            @change="filtrerParNature" 
            class="form-select border-gray rounded-1 fs-14 py-2 px-3 shadow-none text-black bg-white"
          >
            <option value="">Toutes les natures de crédit</option>
            <option v-for="nature in natureCredits" :key="nature.id" :value="nature.id">
              {{ nature.libelle }}
            </option>
          </select>
        </div>

        <form class="search-box position-relative me-15" @submit.prevent="rechercher">
          <input
            type="text"
            v-model="searchTerm"
            @keyup="rechercher"
            class="form-control shadow-none text-black rounded-0 border-0"
            placeholder="Rechercher..."
          />
          <button
            type="submit"
            class="bg-transparent text-primary transition p-0 border-0"
          >
            <i class="flaticon-search-interface-symbol"></i>
          </button>
        </form>
      </div>
    </div>
   
    
    <!-- Skeleton loader -->
    <div v-if="loading" class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive" style="overflow-x: auto;">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type client</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Police</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Référence</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Capital</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Durée</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Nature crédit</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime TTC</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date effet</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">1ère échéance</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Échéance</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Gestionnaire</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Statut</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Établissement</th>
              <th class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skeleton-row">
              <td>
                <div class="d-flex align-items-center">
                  <div class="skeleton-circle me-3"></div>
                  <div>
                    <div class="skeleton-line" style="width: 120px;"></div>
                    <div class="skeleton-line mt-1" style="width: 80px; height: 10px;"></div>
                  </div>
                </div>
              </td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td><div class="skeleton-line" style="width: 60px;"></div></td>
              <td><div class="skeleton-line" style="width: 100px;"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="skeleton-circle me-2"></div>
                  <div class="skeleton-line" style="width: 80px;"></div>
                </div>
              </td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td>
                <div class="d-flex gap-1">
                  <div class="skeleton-btn"></div>
                  <div class="skeleton-btn"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loader global pour la génération PDF -->
    <div v-if="isGeneratingPDFGlobal" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style="background-color: rgba(0, 0, 0, 0.3); z-index: 9999; pointer-events: auto;">
      <div class="bg-white rounded-3 p-4 text-center shadow-lg" style="pointer-events: none;">
        <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Génération PDF...</span>
        </div>
        <h5 class="text-primary mb-2">Génération du PDF en cours...</h5>
        <p class="text-muted mb-0">Veuillez patienter pendant la génération du contrat</p>
      </div>
    </div>

    <div v-if="!loading" class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive" style="overflow-x: auto;">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type de client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Police</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Référence</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Capital</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Durée</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Nature de crédit</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Prime TTC</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date d'effet</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date 1ère échéance</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Date d'échéance</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">GESTIONNAIRE</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Statut</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Établissement</th>
              <th key="actions" scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 text pe-0 sticky-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="contrats.length === 0">
              <td colspan="14" class="text-center text-muted py-4">
                Aucun contrat trouvé
              </td>
            </tr>
            <tr v-for="(contrat, index) in contrats" :key="`contrat-${contrat.id || index}`">
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div v-if="contrat.customer">
                  <strong>{{ contrat.customer.lastname }} {{ contrat.customer.firstname }}</strong>
                  <br>
                  <small class="text-muted">{{ contrat.customer.phone }}</small>
                </div>
                <span v-else class="text-muted">{{ contrat.codeCustomer }}</span>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-dark fw-bold">
                  {{ contrat.customer?.typeCustomer?.libelle || 'Particulier' }}
                </strong>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-dark fw-bold">
                  {{ contrat.police }}
                </strong>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-dark fw-bold">
                  {{ contrat.reference }}
                </strong>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="fw-bold text-success fs-6 bg-light-success px-2 py-1 rounded">
                  {{ formatMontant(contrat.capital) }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-dark fw-bold">
                  {{ contrat.duration || contrat.duree || '-' }} mois
                </strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong class="text-dark fw-bold">
                  {{ contrat.natureCredit?.libelle || 'Non défini' }}
                </strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="fw-bold text-warning fs-6 bg-light-warning px-2 py-1 rounded">
                  {{ formatMontant(contrat.puttc) }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                {{ formatDate(contrat.dateEff) }}
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                {{ formatDate(contrat.dateEch1) }}
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                {{ formatDate(contrat.dateEch) }}
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div class="d-flex align-items-center">
                  <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                    <i class="flaticon-user text-white fs-6"></i>
                  </div>
                  <div>
                    <div class="fw-bold text-dark">{{ contrat.user?.lastname || 'N/A' }}</div>
                    <small class="text-muted">{{ contrat.user?.firstname || '' }}</small>
                  </div>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <strong v-if="contrat.contractState" class="text-dark fw-bold">
                  <i :class="getStatutIcon(contrat)" class="me-1"></i>
                  {{ contrat.contractState.libelle }}
                </strong>
                <strong v-else class="text-dark fw-bold">
                  <i class="flaticon-question me-1"></i>
                  Non défini
                </strong>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="fw-bold text-dark">
                  {{ contrat.etablissement || '-' }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0 sticky-actions">
                <div class="action-buttons-group">
                  <!-- Actions principales toujours visibles -->
                    <!-- Voir les détails -->
                  <button 
                    v-if="contrat.id"
                    type="button"
                    class="btn-action btn-action-view"
                    @click="voirDetails(contrat)"
                    title="Voir détails">
                    <i class="flaticon-eye"></i>
                  </button>

                    <!-- Générer PDF -->
                  <button 
                    v-if="contrat.id"
                    type="button"
                    class="btn-action btn-action-pdf"
                        @click="generateContractPDF(contrat)"
                    :disabled="isGeneratingPDF"
                    title="Générer PDF">
                    <i v-if="!isGeneratingPDF" class="flaticon-file" style="font-size: 18px; display: block; width: 18px; height: 18px; line-height: 18px;"></i>
                    <div v-else class="spinner-border spinner-border-sm" role="status" style="width: 14px; height: 14px;">
                          <span class="visually-hidden">Chargement...</span>
                        </div>
                  </button>
                  
                  <!-- Fin des actions (Modifier supprimé — accès via page de détails) -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div
        class="pagination-area d-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
        v-if="totalElements > 0"
      >
        <PaginationComponent 
          :page="page" 
          :totalPages="totalPages" 
          :totalElements="totalElements" 
          :limit="limit" 
          @paginate="handlePaginate" 
        />
      </div>
    </div>
  </div>

  <!-- Modal de conversion cotation / édition contrat -->
  <CotationToContratModal
    ref="conversionModalRef"
    :visible="showConversionModal"
    :client-editable="true"
    :modal-title="contractToEdit ? 'Modifier le contrat' : 'Nouveau Contrat'"
    :contract-to-edit="contractToEdit || undefined"
    @conversion-success="handleConversionSuccess"
    @close="handleConversionClose"
    @update:visible="showConversionModal = $event"
  />



      <!-- Modal d'import de contrats -->
      <ImportContratModal
        :visible="showImportModal"
        @import-success="handleImportSuccess"
        @import-error="handleImportError"
        @update:visible="showImportModal = $event"
      />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";
import ApiService from "../../services/ApiService";
import JwtService from "../../services/JwtService";
import { suppression, error, success, extractFilenameFromResponse } from "../../utils/utils";
import PaginationComponent from '../Utilities/Pagination.vue';
import CotationToContratModal from '../Common/CotationToContratModal.vue';
import ImportContratModal from '../Common/ImportContratModal.vue';


// Interface pour les contrats
interface Contrat {
  id: number;
  idCustomer: number;
  idUser: number;
  updatedBy?: number;
  deletedBy?: number;
  idProduct: number;
  idContractState: number;
  idAgency: number;
  police: string;
  reference: string;
  capital: number;
  puttc: number;
  garantieCompl: string;
  dateEff: string;
  dateEch: string;
  dateEch1: string;
  duration: number;
  duree?: number;
  isActive: boolean;
  codeCustomer?: string;
  // Champs supplémentaires de l'entité
  refCompte?: string;
  typeCompte?: string;
  ets?: string;
  etablissement?: string;
  taux?: string;
  chosenOption?: string;
  status?: number;
  pd: number;
  pc: number;
  surp: number;
  acc: number;
  fm: number;
  description?: string;
  keyCont: string;
  
  // Relations
  customer?: {
    id: number;
    code?: string;
    lastname: string;
    firstname: string;
    email?: string;
    address: string;
    phone: string;
    placeOfBirth: string;
    birthdate: string;
    occupation: string;
    profession?: string;
    gender: string;
    autreAss?: string;
    isActive: boolean;
    typeCustomer: {
      id: number;
      libelle: string;
    };
  };
  contractState?: {
    id: number;
    libelle: string;
    description?: string;
  };
  user?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  product?: {
    id: number;
    libelle: string;
  };
  agency?: {
    id: number;
    libelle: string;
  };
  natureCredit?: {
    id: number;
    libelle: string;
    code: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export default defineComponent({
  name: "ListeContrats",
  components: {
    PaginationComponent,
    CotationToContratModal,
    ImportContratModal
  },
  setup() {
    // Composables
    const router = useRouter();
    const route = useRoute();
    const isGeneratingPDF = ref(false);

    // Refs
    const contrats = ref<Array<Contrat>>([]);   
    const contrat = ref<Contrat | null>(null);
    const contratDetails = ref<Contrat | null>(null);
    const loading = ref(false);
    const conversionModalRef = ref<any>(null);
    const showConversionModal = ref(false);
    const isGeneratingPDFGlobal = ref(false);
    const contractToEdit = ref<Contrat | null>(null);
    const selectedNatureCredit = ref('');
    const natureCredits = ref<any[]>([]);
    
    // Variable pour le modal d'import
    const showImportModal = ref(false);
    
    // Variable pour le modal de détails
    const showDetailsModal = ref(false);
    
    // Variables pour le menu d'actions
    const activeActionMenu = ref<number | null>(null);
    const buttonRefs = ref<Record<number, HTMLElement>>({});
    const menuPosition = ref<Record<number, { top: string; left: string }>>({});
    
    // Permissions retournées par le backend
    const canModifyPermission = ref<boolean>(false);
    
    // Rôle de l'utilisateur connecté
    const userRole = ref<string | null>(null);

    // Pagination
    const searchTerm = ref('');
    const page = ref(1);
    const totalPages = ref(0);
    const limit = ref(10);
    const totalElements = ref(0);

    async function generateContractPDF(contrat: Contrat) {
      if (!contrat || !contrat.id) {
        error('Contrat invalide ou ID manquant');
        return;
      }

      // Empêcher les clics multiples
      if (isGeneratingPDF.value) {
        return;
      }

      isGeneratingPDF.value = true;
      isGeneratingPDFGlobal.value = true;

      try {
        // Utiliser l'ID du contrat dans l'URL avec axios directement
        // Timeout de 120 secondes (2 minutes) pour la génération PDF qui peut être longue
        const response = await ApiService.vueInstance.axios.get(`/contracts/${contrat.id}/pdf`, {
          responseType: 'blob',
          timeout: 120000, // 120 secondes = 2 minutes
          headers: { 
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${JwtService.getToken()}`
          },
          // Gérer la progression du téléchargement
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              // Optionnel : afficher la progression dans la console
              // console.log(`Téléchargement PDF: ${percentCompleted}%`);
            }
          }
        });

        // Vérifier que c'est bien un blob
        if (!(response.data instanceof Blob)) {
          throw new Error('Réponse invalide du serveur');
        }

        // Vérifier que le blob n'est pas vide
        if (response.data.size === 0) {
          throw new Error('Le PDF généré est vide');
        }

        // Créer un blob PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Extraire le nom de fichier du header Content-Disposition
        const filename = extractFilenameFromResponse(response, `contrat_${contrat.reference || contrat.id}.pdf`);

        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        // Télécharger
        document.body.appendChild(link);
        link.click();
        
        // Attendre un peu avant de nettoyer pour s'assurer que le téléchargement démarre
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        success('PDF généré avec succès !');

      } catch (err: any) {
        console.error('❌ Erreur génération PDF:', err);
        
        // Gestion spécifique des erreurs de timeout
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          error('La génération du PDF prend trop de temps. Veuillez réessayer ou contacter le support.');
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          error('Erreur de connexion réseau. Vérifiez votre connexion internet.');
        } else if (err.response?.status === 404) {
          error('Contrat non trouvé');
        } else if (err.response?.status === 400) {
          error('ID de contrat invalide');
        } else if (err.response?.status === 500) {
          error('Erreur serveur lors de la génération. Le serveur peut être surchargé, veuillez réessayer dans quelques instants.');
        } else if (err.response?.status === 503) {
          error('Service temporairement indisponible. Veuillez réessayer plus tard.');
        } else if (err.message?.includes('vide')) {
          error('Le PDF généré est vide. Veuillez contacter le support.');
        } else {
          error('Erreur lors de la génération du PDF. Veuillez réessayer.');
        }
      } finally {
        isGeneratingPDF.value = false;
        isGeneratingPDFGlobal.value = false;
      }
    }


    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        // Conserver le critère de recherche lors du changement de page
        getAllContrats(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllContrats(page.value, limit.value, searchTerm.value);
    }

    async function getAllContrats(pageNum = 1, limitNum = 10, search = '') {
      try {
        loading.value = true;
        
        // Construire les paramètres de requête avec pagination
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageNum.toString());
        queryParams.append('limit', limitNum.toString());
        
        // Ajouter le paramètre de recherche si fourni (le backend ne le supporte peut-être pas encore)
        if (search && search.trim()) {
          queryParams.append('search', search.trim());
        }

        // Ajouter le filtre natureCredit si sélectionné
        if (selectedNatureCredit.value) {
          queryParams.append('natureCredit', selectedNatureCredit.value);
        }

        if (route.query.my === '1' || route.query.my === 'true') {
          queryParams.append('my', '1');
        }
        
        // Appeler l'API avec les paramètres de pagination
        const { data } = await ApiService.get(`/contracts?${queryParams.toString()}`);
        
        // Adapter à la structure de réponse du backend : { data: { message: string, contracts: Contract[], pagination: {...}, permissions?: { canModify: boolean } } }
        if (data && data.data) {
          // Récupérer les contrats - le backend gère maintenant la recherche
          if (data.data.contracts && Array.isArray(data.data.contracts)) {
            contrats.value = data.data.contracts;
          } else {
            contrats.value = [];
          }
          
          // Utiliser la pagination retournée par le backend
          if (data.data.pagination) {
            totalElements.value = data.data.pagination.total;
            totalPages.value = data.data.pagination.totalPages;
            page.value = data.data.pagination.page;
            limit.value = data.data.pagination.limit;
          } else {
            // Fallback si pas de pagination dans la réponse
            totalElements.value = contrats.value.length;
            totalPages.value = 1;
            page.value = pageNum;
            limit.value = limitNum;
          }
          
          // Récupérer les permissions depuis la réponse du backend
          if (data.data.permissions) {
            canModifyPermission.value = data.data.permissions.canModify || false;
          }
        } else {
          contrats.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
        }
        
      } catch (err: any) {
        console.error("❌ Erreur lors de la récupération:", err);
        error(err?.response?.data?.message || "Erreur lors de la récupération des contrats");
        contrats.value = [];
        totalPages.value = 0;
        totalElements.value = 0;
      } finally {
        loading.value = false;
      }
    }
    
    // Fonction modifier - ouvre le modal en mode édition
    function modifier(editContrat: Contrat) {
      // Fermer le modal de détails s'il est ouvert
      showDetailsModal.value = false;
      
      // Charger les détails complets du contrat depuis l'API
      loadContractForEdit(editContrat.id);
    }
    
    // Fonction pour charger les détails complets du contrat pour l'édition
    async function loadContractForEdit(contractId: number) {
      try {
        loading.value = true;
        const { data } = await ApiService.get(`/contracts/${contractId}`);
        
        if (data && data.data && data.data.contract) {
          contractToEdit.value = data.data.contract;
          showConversionModal.value = true;
        } else {
          error('Impossible de charger les détails du contrat');
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement du contrat:', err);
        error(err?.response?.data?.message || 'Erreur lors du chargement du contrat');
      } finally {
        loading.value = false;
      }
    }

    function voirDetails(contrat: Contrat) {
      if (contrat.id || (contrat as any).uuid) {
        const slug = (contrat as any).uuid || contrat.id;
        router.push(`/details-contrat/${slug}`);
      }
    }
    
    function closeDetailsModal() {
      showDetailsModal.value = false;
      contratDetails.value = null;
    }

    function handleGeneratePDFFromModal(contrat: Contrat) {
      // Cette fonction peut être utilisée pour des actions supplémentaires après génération PDF
      // Pour l'instant, on ne fait rien de spécial
      generateContractPDF(contrat);
    }
    
    function handleImportError(errorData: any) {
      console.error('Erreur import:', errorData);
      error('Erreur lors de l\'import des contrats');
    }

    async function toggleSuspension(contrat: Contrat) {
      try {
        const action = contrat.isActive === false ? 'réactiver' : 'suspendre';
        const result = await Swal.fire({
          title: `Confirmer l'action`,
          text: `Voulez-vous vraiment ${action} ce contrat ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: `Oui, ${action}`,
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          await ApiService.patch(`/contracts/${contrat.reference}/statut`, {
            isActive: !contrat.isActive
          });
          
          contrat.isActive = !contrat.isActive;
          success(`Contrat ${action} avec succès`);
        }
      } catch (err: any) {
        console.error('Erreur lors de la suspension/réactivation:', err);
        error(`Erreur lors de la ${contrat.isActive === false ? 'réactivation' : 'suspension'}`);
      }
    }

    async function renouvelerContrat(contrat: Contrat) {
      try {
        const result = await Swal.fire({
          title: 'Renouveler le contrat',
          text: 'Voulez-vous renouveler ce contrat pour une nouvelle période ?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Oui, renouveler',
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          await ApiService.post(`/contracts/${contrat.reference}/renouvellement`, {});
          success('Contrat renouvelé avec succès');
          getAllContrats(page.value, limit.value, searchTerm.value);
        }
      } catch (err: any) {
        console.error('Erreur lors du renouvellement:', err);
        error('Erreur lors du renouvellement');
      }
    }

    async function confirmerSuppression(contratToDelete: Contrat) {
      if (!contratToDelete.reference) {
        console.error('Référence de contrat manquante');
        return;
      }
      
      try {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr?',
          text: `Voulez-vous vraiment supprimer définitivement le contrat ${contratToDelete.reference}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          heightAuto: false
        });

        if (result.isConfirmed) {
          await deleteContrat(contratToDelete.reference);
        }
      } catch (err) {
        console.error('Erreur lors de la confirmation:', err);
      }
    }

    async function deleteContrat(reference: string) {
      try {
        const { data } = await ApiService.delete(`/contracts/${reference}`);
        
        // Supprimer de la liste locale
        contrats.value = contrats.value.filter(c => c.reference !== reference);
        totalElements.value = Math.max(0, totalElements.value - 1);
        
        // Afficher message de succès
        await Swal.fire({
          text: data.message || 'Contrat supprimé avec succès',
          toast: true,
          icon: 'success',
          title: 'Suppression réussie',
          animation: false,
          position: 'top-right',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          heightAuto: false
        });

        // Recharger si la page courante est vide
        if (contrats.value.length === 0 && page.value > 1) {
          page.value--;
          await getAllContrats(page.value, limit.value, searchTerm.value);
        }
      } catch (err: any) {
        console.error('Erreur suppression:', err);
        await Swal.fire({
          text: err?.response?.data?.message || 'Erreur lors de la suppression',
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Réessayer",
          heightAuto: false,
          customClass: {
            confirmButton: "btn fw-semibold btn-light-danger",
          },
        });
      }
    }

    // Utilitaires de formatage
    function formatDate(dateString: string | null | undefined): string {
      if (!dateString) return '-';
      try {
        // Si c'est déjà au format DD/MM/YYYY, le retourner tel quel
        if (dateString.includes('/')) {
          return dateString;
        }
        // Sinon, essayer de le convertir depuis ISO
        return new Date(dateString).toLocaleDateString('fr-FR');
      } catch {
        return dateString;
      }
    }

    function formatMontant(montant: number | null | undefined): string {
      if (montant == null) return '-';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }

    // Utilitaires de style
    function getTypeClass(type: string): string {
      const baseClass = 'badge fs-7 px-2 py-1';
      
      switch (type) {
        case 'Personnel':
          return `${baseClass} bg-warning text-dark`;
        case 'Entreprise':
          return `${baseClass} bg-info text-white`;
        case 'Professionnel':
          return `${baseClass} bg-primary text-white`;
        case 'Particulier':
        default:
          return `${baseClass} bg-secondary text-white`;
      }
    }

    // Utilitaires de statut
    function getStatutClass(contrat: Contrat): string {
      if (contrat.isActive === false) {
        return 'badge bg-danger';      // Inactif
      } else if (contrat.isActive === true) {
        return 'badge bg-success';     // Actif
      } else {
        return 'badge bg-secondary';   // Non défini
      }
    }

    function getStatutTexte(contrat: Contrat): string {
      if (contrat.contractState) {
        return contrat.contractState.libelle;
      } else if (contrat.isActive === false) {
        return 'Inactif';
      } else if (contrat.isActive === true) {
        return 'Actif';
      } else {
        return 'Non défini';
      }
    }

    function getStatutIcon(contrat: Contrat): string {
      if (contrat.isActive === false) {
        return 'flaticon-pause';
      } else if (contrat.isActive === true) {
        return 'flaticon-check';
      } else {
        return 'flaticon-question';
      }
    }


    // Fonction pour ouvrir automatiquement le modal d'un contrat
    async function ouvrirContratAutomatiquement(contractCode: string) {
      try {
        // Chercher le contrat dans la liste actuelle
        let contratTrouve = contrats.value.find(c => c.reference === contractCode);
        
        if (!contratTrouve) {
          // Si le contrat n'est pas dans la liste actuelle, le chercher via l'API
          const { data } = await ApiService.get(`/contracts/${contractCode}`);
          
          if (data && data.data && data.data.contract) {
            contratTrouve = data.data.contract;
          } else {
            error(`Contrat ${contractCode} non trouvé`);
            return;
          }
        }
        
        // Vérification de sécurité TypeScript
        if (!contratTrouve) {
          error(`Impossible de charger le contrat ${contractCode}`);
          return;
        }
        
        // Ouvrir le modal avec les détails du contrat
        await voirDetails(contratTrouve);
        
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'ouverture automatique:', err);
        error(`Erreur lors de l'ouverture du contrat ${contractCode}`);
      }
    }

    // Watcher pour détecter les paramètres de requête
    watch(() => route.query, async (newQuery) => {
      const openContract = newQuery.openContract as string;
      const autoOpen = newQuery.autoOpen as string;
      
      if (openContract && autoOpen === 'true') {
        // Attendre que les contrats soient chargés
        if (contrats.value.length === 0) {
          await getAllContrats();
        }
        
        // Ouvrir le modal automatiquement
        await ouvrirContratAutomatiquement(openContract);
        
        // Nettoyer les paramètres de requête pour éviter les réouvertures
        router.replace({ 
          path: route.path,
          query: { ...route.query, openContract: undefined, autoOpen: undefined }
        });
      }
    }, { immediate: true });

    watch(() => route.query.my, () => {
      page.value = 1;
      getAllContrats(1, limit.value, searchTerm.value);
    });

    // Filtre par Nature de Crédit
    async function loadNatureCredits() {
      try {
        const response = await ApiService.get('/nature-credits');
        const responseData = response.data;
        let credits: any[] | null = null;
        if (Array.isArray(responseData)) {
          credits = responseData;
        } else if (Array.isArray(responseData?.data)) {
          credits = responseData.data;
        } else if (Array.isArray(responseData?.data?.data)) {
          credits = responseData.data.data;
        }
        if (credits && credits.length > 0) {
          natureCredits.value = credits;
        } else {
          throw new Error('Format inattendu');
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des natures de crédit:', err);
        natureCredits.value = [
          { id: 1, code: 'AMORT', libelle: 'Amortissable' },
          { id: 2, code: 'CP', libelle: 'Crédit de Campagne' },
          { id: 3, code: 'OBA', libelle: 'Obligation Cautionnée' }
        ];
      }
    }

    function filtrerParNature() {
      page.value = 1;
      getAllContrats(page.value, limit.value, searchTerm.value);
    }

    // Lifecycle
    onMounted(async () => {
      // Charger les natures de crédit et le rôle de l'utilisateur en premier
      await loadNatureCredits();
      await loadUserRole();
      
      await getAllContrats();
      
      // Vérifier les paramètres de requête après le montage
      const openContract = route.query.openContract as string;
      const autoOpen = route.query.autoOpen as string;
      
      if (openContract && autoOpen === 'true') {
        await ouvrirContratAutomatiquement(openContract);
        
        // Nettoyer les paramètres de requête
        router.replace({ 
          path: route.path,
          query: { ...route.query, openContract: undefined, autoOpen: undefined }
        });
      }
    });

    // Fonction pour ouvrir le modal de conversion
    function openConversionModal() {
      // Ouvrir le modal de conversion directement
      showConversionModal.value = true;
    }

    // Gestionnaire de succès de conversion
    function handleConversionSuccess() {
      getAllContrats(page.value, limit.value, searchTerm.value);
    }

    // Gestionnaire de fermeture du modal de conversion
    function handleConversionClose() {
      showConversionModal.value = false;
      contractToEdit.value = null; // Réinitialiser le contrat à éditer
    }

    // Fonctions pour l'import
    function openImportModal() {
      showImportModal.value = true;
    }
    
    function closeImportModal() {
      showImportModal.value = false;
    }

    // Gestionnaire de succès d'import
    function handleImportSuccess() {
      // Recharger la liste des contrats après un import réussi
      getAllContrats(page.value, limit.value, searchTerm.value);
    }

    // Fonction pour charger le rôle de l'utilisateur
    async function loadUserRole() {
      try {
        const response = await ApiService.get('auth/profile');
        
        if (response.data && response.data.data && response.data.data.user) {
          const user = response.data.data.user;
          
          if (user.role && user.role.libelle) {
            userRole.value = user.role.libelle.toUpperCase();
          } else {
            userRole.value = null;
          }
        } else {
          userRole.value = null;
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du rôle utilisateur:', err);
        userRole.value = null;
      }
    }
    
    // Fonction pour vérifier si l'utilisateur peut modifier un contrat spécifique
    // Règle : 
    // - Si le contrat a été créé il y a moins d'un mois : tous les utilisateurs actifs peuvent modifier
    // - Si le contrat a été créé il y a plus d'un mois : seuls ADMIN et SUPER ADMIN peuvent modifier
    function canModifyContract(contrat: Contrat): boolean {
      if (!contrat || !contrat.id) {
        return false;
      }
      
      // Vérifier la date de création du contrat
      if (!contrat.createdAt) {
        // Si pas de date de création, on utilise la permission globale (fallback)
        return canModifyPermission.value;
      }
      
      try {
        const contractCreatedAt = new Date(contrat.createdAt);
        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const isWithinOneMonth = contractCreatedAt >= oneMonthAgo;
        
        // Si le contrat a été créé il y a moins d'un mois, tous les utilisateurs actifs peuvent modifier
        if (isWithinOneMonth) {
          return true;
        }
        
        // Si le contrat a été créé il y a plus d'un mois, seuls ADMIN et SUPER ADMIN peuvent modifier
        const normalizedRole = userRole.value?.toUpperCase() || '';
        const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATEUR';
        const isSuperAdmin = normalizedRole === 'SUPER ADMIN' || normalizedRole === 'SUPER ADMINISTRATEUR';
        
        return isAdmin || isSuperAdmin;
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de la date de création:', error);
        // En cas d'erreur, utiliser la permission globale (fallback)
        return canModifyPermission.value;
      }
    }
    
    // Fonction pour vérifier si l'utilisateur peut modifier (utilise les permissions du backend)
    // Conservée pour compatibilité, mais devrait utiliser canModifyContract pour chaque contrat
    function canModify(): boolean {
      return canModifyPermission.value;
    }
    
    function hasMoreActions(contrat: Contrat): boolean {
      // Les actions principales toujours visibles : Voir détails, Générer PDF
      // Les actions secondaires dans le menu : Modifier (seulement si autorisé)
      // Si on a Modifier, on utilise le menu déroulant
      const hasModifier = canModifyContract(contrat);
      
      // Utiliser le menu si on a l'action Modifier
      return hasModifier;
    }

    // Fonction pour stocker la référence du bouton
    function setButtonRef(contratId: number, el: any) {
      if (el && el instanceof HTMLElement) {
        buttonRefs.value[contratId] = el;
      } else if (el && (el as any).$el instanceof HTMLElement) {
        buttonRefs.value[contratId] = (el as any).$el;
      }
    }

    // Fonction pour calculer la position du menu
    function getMenuPosition(contratId: number): Record<string, string> {
      if (!menuPosition.value[contratId]) {
        return { top: '0px', left: '0px' };
      }
      return menuPosition.value[contratId];
    }

    // Fonction pour ouvrir/fermer le menu d'actions
    function toggleActionMenu(event: Event, contratId: number) {
      if (activeActionMenu.value === contratId) {
        closeActionMenu();
        } else {
        activeActionMenu.value = contratId;
        const button = buttonRefs.value[contratId] || (event.currentTarget as HTMLElement);
        
        // Calculer la position du menu après que Vue ait rendu le Teleport
        nextTick(() => {
          if (button) {
            const buttonRect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Dimensions estimées du menu
            const menuHeight = 120;
            const menuWidth = 180;
            
            // Calculer la position du menu
            let menuTop = buttonRect.bottom + 8;
            let menuLeft = buttonRect.right - menuWidth;
            
            // Vérifier si le menu dépasse en bas
            if (buttonRect.bottom + menuHeight + 10 > viewportHeight) {
              // Positionner le menu au-dessus du bouton
              menuTop = buttonRect.top - menuHeight - 8;
              // S'assurer qu'on ne dépasse pas le haut
              if (menuTop < 10) {
                menuTop = buttonRect.bottom + 8; // Revenir en dessous si pas de place en haut
              }
            }
            
            // Vérifier si le menu dépasse à droite
            if (buttonRect.right - menuWidth < 10) {
              // Positionner le menu à gauche du bouton
              menuLeft = buttonRect.left - menuWidth;
            }
            
            // Vérifier si le menu dépasse à gauche
            if (menuLeft < 10) {
              menuLeft = 10;
            }
            
            // Stocker la position calculée
            menuPosition.value[contratId] = {
              top: `${menuTop}px`,
              left: `${menuLeft}px`
            };
          }
        });
        
        // Fermer le menu si on clique ailleurs
        setTimeout(() => {
          document.addEventListener('click', closeActionMenuOnOutsideClick, { once: true });
        }, 50);
      }
    }

    function closeActionMenu() {
      activeActionMenu.value = null;
      // Nettoyer la position après fermeture
      setTimeout(() => {
        if (!activeActionMenu.value) {
          menuPosition.value = {};
        }
      }, 200);
    }

    function closeActionMenuOnOutsideClick(event: Event) {
      const target = event.target as HTMLElement;
      if (!target.closest('.action-dropdown-menu') && !target.closest('.btn-action-more')) {
        closeActionMenu();
      }
    }

    return {
      // Refs
      contrats,
      contratDetails,
      loading,
      showConversionModal,
      contractToEdit,
      searchTerm,
      page, 
      totalPages,
      limit,
      totalElements,
      
      
      // Methods
      getAllContrats,
      toggleSuspension,
      renouvelerContrat,
      voirDetails,
      modifier,
      loadContractForEdit,
      handlePaginate,
      rechercher,
      formatDate,
      formatMontant,
      getTypeClass,
      getStatutClass,
      getStatutTexte,
      getStatutIcon,
      isGeneratingPDF,
      isGeneratingPDFGlobal,
      generateContractPDF,
      openConversionModal,
      conversionModalRef,
      handleConversionSuccess,
      handleConversionClose,
      // Import functions
      openImportModal,
      closeImportModal,
      showImportModal,
      handleImportSuccess,
      // Variables pour le modal de détails
      showDetailsModal,
      closeDetailsModal,
      handleGeneratePDFFromModal,
      handleImportError,
      // Variables pour le menu d'actions
      activeActionMenu,
      hasMoreActions,
      setButtonRef,
      getMenuPosition,
      toggleActionMenu,
      closeActionMenu,
      canModify,
      canModifyContract,
      canModifyPermission,
      userRole,
      selectedNatureCredit,
      natureCredits,
      filtrerParNature
    };
  },
});
</script>

<style scoped>
/* Optimisation mobile pour le header */
@media (max-width: 768px) {
  .card-head {
    padding: 10px 15px !important;
  }
  
  .search-box {
    width: 200px !important;
    max-width: 200px !important;
  }
  
  .search-box input {
    font-size: 14px !important;
    padding: 8px 12px !important;
  }
  
  .default-btn {
    font-size: 13px !important;
    padding: 8px 12px !important;
  }
}
</style>

<style scoped>
.modal-xl {
  max-width: 80vw;
}

.modal-xxl {
  max-width: 95vw;
}

@media (min-width: 1200px) {
  .modal-xxl {
    max-width: 1500px;
  }
}

@media (min-width: 1400px) {
  .modal-xl {
    max-width: 1200px;
  }
  
  .modal-xxl {
    max-width: 1700px;
  }
}

@media (min-width: 1600px) {
  .modal-xxl {
    max-width: 1800px;
  }
}

@media (min-width: 1920px) {
  .modal-xxl {
    max-width: 1900px;
  }
}

.table th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.875rem;
}

.search-box {
  width: 300px;
}

.search-box input {
  padding-left: 15px;
  padding-right: 40px;
}

.search-box button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* Custom company colors for specific elements */
.default-btn.bg-success {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.default-btn.bg-success:hover {
  background-color: #2d9a41 !important;
  border-color: #2d9a41 !important;
  color: #231f20 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(51, 176, 74, 0.3);
  text-decoration: none;
}

.default-btn.bg-success:focus {
  box-shadow: 0 0 0 0.2rem rgba(51, 176, 74, 0.5) !important;
}

/* Actions badge styling */
.badge.bg-primary {
  background-color: #33b04a !important;
  border-color: #33b04a !important;
  color: #231f20 !important;
  font-weight: 500;
  transition: all 0.3s ease;
}

.badge.bg-primary:hover {
  background-color: #2d9a41 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(51, 176, 74, 0.3);
}

/* Nouveaux styles de badges inspirés de l'image */
.badge {
  border-radius: 0 !important;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 6px 12px;
  border: none;
  transition: all 0.3s ease;
}

.badge-reference {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

/* Colonne Actions - permettre les clics sur les boutons */
.table td:last-child {
  pointer-events: none;
}

.table td:last-child .dropdown {
  pointer-events: auto;
}

.table td:last-child .badge {
  pointer-events: auto;
  cursor: pointer;
}

.table td:last-child .action-buttons-group {
  pointer-events: auto;
}

.table td:last-child .btn-action {
  pointer-events: auto;
  cursor: pointer;
}

/* Styles pour le composant PDF dans le dropdown */
.dropdown-item.p-0 {
  padding: 0 !important;
}

.dropdown-item .pdf-generator {
  width: 100%;
}

.dropdown-item .pdf-generator .btn {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  padding: 8px 16px;
  border-radius: 0;
}

.dropdown-item .pdf-generator .btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.dropdown-item .pdf-generator .btn:disabled {
  background-color: transparent;
  color: #6c757d;
}

/* Style spécial pour les informations du compte dans le tableau */
.table td small {
  display: block;
  margin-top: 2px;
}

.table td .badge {
  font-size: 0.75rem;
  margin-top: 2px;
}

/* Styles pour les messages d'erreur */
.badge.bg-danger {
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.badge.bg-danger:hover {
  white-space: normal;
  max-width: none;
  position: relative;
  z-index: 1000;
  background-color: #dc3545 !important;
}

/* Styles pour l'édition en ligne */
.editable-field {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-block;
  min-width: 60px;
  border: 1px solid transparent;
  position: relative;
}

.editable-field:hover {
  background-color: #e3f2fd;
  border: 1px dashed #2196f3;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.1);
}

.editable-field:active {
  background-color: #bbdefb;
  transform: translateY(1px);
}

.editable-field::after {
  content: '✏️';
  position: absolute;
  right: 2px;
  top: 2px;
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.editable-field:hover::after {
  opacity: 0.6;
}

.table .form-control-sm,
.table .form-select-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  height: auto;
  min-height: 1.5rem;
}

.table-warning {
  background-color: #fff3cd !important;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Styles pour les champs en cours d'édition */
.table .form-control-sm:focus,
.table .form-select-sm:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.25);
  outline: none;
}

/* Indicateur visuel pour les champs éditables */
.table td {
  position: relative;
}

.table td:hover .editable-field {
  background-color: #f8f9fa;
}

/* Animation pour les modifications */
@keyframes fieldUpdate {
  0% { background-color: #d4edda; }
  100% { background-color: transparent; }
}

.field-updated {
  animation: fieldUpdate 1s ease-out;
}

/* Styles pour les boutons PDF dans le rapport d'import */
.btn-outline-success {
  border-color: #28a745;
  color: #28a745;
  transition: all 0.3s ease;
}

.btn-outline-success:hover {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.btn-outline-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Styles pour le bouton "Nouvel import" */
.btn-outline-primary {
  border-color: #007bff;
  color: #007bff;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

/* Amélioration de l'affichage des résultats d'import */
.table-success {
  background-color: #d4edda !important;
  border-left: 4px solid #28a745 !important;
}

.table-danger {
  background-color: #f8d7da !important;
  border-left: 4px solid #dc3545 !important;
}

/* Styles pour les détails des contrats réussis */
.d-flex.align-items-center.text-success {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.d-flex.align-items-start.text-danger {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

/* Styles pour le loader global PDF */
.position-fixed {
  backdrop-filter: blur(1px);
  animation: fadeIn 0.3s ease-in-out;
  transition: all 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.position-fixed .bg-white {
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.position-fixed .spinner-border {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Colonne Actions fixe à droite - Style professionnel */
.sticky-actions {
  position: sticky !important;
  right: 0 !important;
  background-color: white !important;
  z-index: 10;
  min-width: 180px;
  white-space: nowrap;
  padding: 8px 12px !important;
  transition: box-shadow 0.3s ease;
  isolation: isolate; /* Créer un nouveau contexte d'empilement */
  box-shadow: none;
}

/* Ombre subtile pour indiquer la colonne fixe */
.table-responsive:hover .sticky-actions {
  box-shadow: -3px 0 8px rgba(0, 0, 0, 0.08);
}

.table thead th.sticky-actions {
  background-color: #f8f9fa !important;
  z-index: 11;
  border-left: 1px solid #dee2e6;
  text-align: center;
  position: sticky !important;
  right: 0 !important;
}

.table tbody td.sticky-actions {
  border-left: 1px solid #e9ecef;
  text-align: center;
  background-color: white !important;
  position: sticky !important;
  right: 0 !important;
}

/* Groupe de boutons d'action */
.action-buttons-group {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  position: relative;
}

/* Menu déroulant pour actions supplémentaires */
.action-buttons-group .dropdown {
  position: relative;
}

.action-dropdown-menu {
  position: fixed !important;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background-color: white !important;
  z-index: 10000 !important;
  padding: 5px 0;
  display: none;
  max-height: 300px;
  overflow-y: auto;
  margin: 0 !important;
}

.action-dropdown-menu.show {
  display: block;
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-dropdown-menu .dropdown-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  color: #212529;
  text-decoration: none;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.action-dropdown-menu .dropdown-item:hover {
  background-color: #f8f9fa;
}

.action-dropdown-menu .dropdown-item.text-danger {
  color: #dc3545;
}

.action-dropdown-menu .dropdown-item.text-danger:hover {
  background-color: #fff5f5;
}

.action-dropdown-menu .dropdown-divider {
  margin: 5px 0;
  border-top: 1px solid #e9ecef;
}

/* Style des boutons d'action */
.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  padding: 0;
  background-color: transparent;
  color: #6c757d;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-action:active {
  transform: translateY(0);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Bouton Voir détails */
.btn-action-view {
  color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.1);
}

.btn-action-view:hover {
  background-color: rgba(13, 110, 253, 0.2);
  color: #0d6efd;
}

/* Bouton Générer PDF */
.btn-action-pdf {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.btn-action-pdf:hover {
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.btn-action-pdf i {
  font-size: 18px !important;
  display: block !important;
  line-height: 1 !important;
  width: 18px;
  height: 18px;
  text-align: center;
}

/* Bouton Modifier */
.btn-action-edit {
  color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
}

.btn-action-edit:hover {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

/* Bouton Supprimer */
.btn-action-delete {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.btn-action-delete:hover {
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

/* Bouton Plus d'actions */
.btn-action-more {
  color: #6c757d;
  background-color: rgba(108, 117, 125, 0.1);
}

.btn-action-more:hover {
  background-color: rgba(108, 117, 125, 0.2);
  color: #495057;
}

/* Indicateur visuel pour scroll horizontal */
.table-responsive {
  position: relative;
}

.table-responsive::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 5;
}

.table-responsive:not(:hover)::after {
  opacity: 1;
}
</style>
