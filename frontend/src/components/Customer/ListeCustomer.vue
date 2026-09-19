<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <div
      class="card-head box-shadow bg-white d-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
      <div class="d-flex align-items-center">
        <button
          @click="openConversionModal"
          class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-none d-md-inline-block me-10 mb-0 text-decoration-none"
          style="background-color: #33b04a; color: #231f20; border-color: #33b04a;">
          <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-lg-inline">Ajouter un nouveau contrat</span>
          <span class="d-lg-none">Nouveau contrat</span>
        </button>
        
        <!-- Bouton ajouter client -->
        <button 
          class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-15 pe-15 ps-md-25 pe-md-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-14 fs-md-15 fs-lg-16 d-inline-block me-10 mb-0"
          style="background-color: #231f20; color: #ede947; border-color: #231f20;"
          @click="ajouterClient"
          type="button">
          <i class="flaticon-plus position-relative ms-2 ms-md-5 fs-12"></i>
          <span class="d-none d-sm-inline">Ajouter un client</span>
          <span class="d-sm-none">Client</span>
        </button>

      </div>
      <div class="d-flex align-items-center">
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
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Contact</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Profession</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Naissance</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Adresse</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Statut</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skeleton-row">
              <td>
                <div class="d-flex align-items-center">
                  <div class="skeleton-circle me-3"></div>
                  <div>
                    <div class="skeleton-line" style="width: 130px;"></div>
                    <div class="skeleton-line mt-1" style="width: 90px; height: 10px;"></div>
                  </div>
                </div>
              </td>
              <td><div class="skeleton-line" style="width: 110px;"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 80px;"></div></td>
              <td><div class="skeleton-line" style="width: 120px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
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

    <div v-else class="card-body p-15 p-sm-20 p-md-25">
      <div class="table-responsive">
        <table class="table text-nowrap align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Client</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Contact</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Profession</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Type</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Naissance</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Adresse</th>
              <th scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3">Statut</th>
              <th key="actions" scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 text pe-0 sticky-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clients.length === 0">
              <td colspan="8" class="text-center text-muted py-4">
                Aucun client trouvé
              </td>
            </tr>
            <tr v-for="(client, index) in clients" :key="`client-${client.id || index}`">
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div class="d-flex align-items-center">
                  <div class="me-3">
                    <div class="avatar-circle" :class="isMale(client.gender) ? 'bg-primary text-white' : 'bg-pink text-white'">
                      {{ getInitials(client.firstname, client.lastname) }}
                    </div>
                  </div>
                  <div>
                    <a href="javascript:void(0);" @click="voirDetails(client)" class="text-primary text-decoration-underline fw-bold">
                      {{ client.lastname }} {{ client.firstname }}
                    </a>
                    <div class="text-secondary small my-1">
                      N° Client : <span class="fw-bold">{{ client.numCustomer || client.code }}</span>
                    </div>
                    <small class="text-muted">
                      <i :class="isMale(client.gender) ? 'flaticon-male' : 'flaticon-female'" class="me-1"></i>
                      {{ getGenderText(client.gender) }}
                    </small>
                  </div>
                </div>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <span class="fw-bold text-dark">
                    <i class="flaticon-phone-call me-1"></i>
                    {{ client.phone }}
                  </span>
                  <div v-if="client.phone2" class="mt-1">
                    <small class="text-muted">{{ client.phone2 }}</small>
                  </div>
                  <div v-if="client.email" class="mt-1">
                    <small class="text-info">
                      <i class="flaticon-email me-1"></i>
                      {{ client.email }}
                    </small>
                  </div>
                </div>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span class="text-dark">{{ client.occupation }}</span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span :class="getTypeClass(client.typeCustomer?.libelle || 'Particulier')">
                  {{ client.typeCustomer?.libelle || 'Particulier' }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div>
                  <strong>{{ formatDate(client.birthdate) }}</strong>
                  <div v-if="client.placeOfBirth" class="mt-1">
                    <small class="text-muted">
                      <i class="flaticon-location me-1"></i>
                      {{ client.placeOfBirth }} - {{ calculateAge(client.birthdate) }} ans
                    </small>
                  </div>
                  <div v-else class="mt-1">
                    <small class="text-muted">
                      {{ calculateAge(client.birthdate) }} ans
                    </small>
                  </div>
                </div>
              </td>
              
              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <div v-if="client.address">
                  <span class="text-muted">{{ client.address }}</span>
                </div>
                <div v-if="client.residenceArea" class="mt-1">
                  <small class="badge bg-light text-dark">{{ client.residenceArea }}</small>
                </div>
                <span v-if="!client.address && !client.residenceArea" class="text-muted">Non renseignée</span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-black-emphasis">
                <span :class="getStatutClass(client)">
                  {{ getStatutTexte(client) }}
                </span>
              </td>

              <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0 sticky-actions">
                <div class="action-buttons-group">
                  <!-- Actions principales toujours visibles -->
                  <!-- Voir les détails -->
                  <button 
                    v-if="client.id"
                    type="button"
                    class="btn-action btn-action-view"
                    @click="voirDetails(client)"
                    title="Voir détails">
                    <i class="flaticon-eye"></i>
                  </button>
                  
                  <!-- Menu déroulant pour actions supplémentaires -->
                  <template v-if="hasMoreActions(client)">
                    <div class="dropdown">
                      <button 
                        type="button"
                        class="btn-action btn-action-more"
                        @click.stop="toggleActionMenu($event, client.id)"
                        :id="`action-menu-${client.id}`"
                        :ref="el => setButtonRef(client.id, el)"
                        title="Plus d'actions">
                        <i class="flaticon-dots"></i>
                      </button>
                    </div>
                    
                    <!-- Menu rendu via Teleport en dehors du tableau -->
                    <Teleport to="body">
                      <ul 
                        v-if="activeActionMenu === client.id"
                        class="dropdown-menu action-dropdown-menu show"
                        :data-menu-id="client.id"
                        :style="getMenuPosition(client.id)"
                        @click.stop>
                        <!-- Faire une cotation -->
                        <li v-if="client.id && client.isActive === true">
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="faireCotation(client); closeActionMenu()">
                            <i class="flaticon-settings me-2"></i>
                            Faire une cotation
                          </a>
                        </li>

                        <!-- Créer contrat -->
                        <li v-if="client.id && client.isActive === true">
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="creerContrat(client); closeActionMenu()">
                            <i class="flaticon-plus me-2"></i>
                            Créer un contrat
                          </a>
                        </li>

                        <!-- Créer contrat hors convention (ADMIN/MANAGER seulement) -->
                        <li v-if="client.id && client.isActive === true && canCreateHorsConvention">
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="creerContratHorsConvention(client); closeActionMenu()">
                            <i class="flaticon-file-1 me-2"></i>
                            Créer contrat hors convention
                          </a>
                        </li>

                        <!-- Modifier client -->
                        <li v-if="client.id">
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="modifierClient(client); closeActionMenu()">
                            <i class="flaticon-pen me-2"></i>
                            Modifier
                          </a>
                        </li>
                      </ul>
                    </Teleport>
                  </template>
                  
                  <!-- Si pas d'actions supplémentaires, afficher directement les actions -->
                  <template v-else>
                    <!-- Faire une cotation -->
                    <button 
                      v-if="client.id && client.isActive === true"
                      type="button"
                      class="btn-action btn-action-edit"
                      @click="faireCotation(client)"
                      title="Faire une cotation">
                      <i class="flaticon-settings"></i>
                    </button>
                    
                    <!-- Créer contrat -->
                    <button 
                      v-if="client.id && client.isActive === true"
                      type="button"
                      class="btn-action btn-action-edit"
                      @click="creerContrat(client)"
                      title="Créer un contrat">
                      <i class="flaticon-plus"></i>
                    </button>
                    
                    <!-- Modifier client -->
                    <button 
                      v-if="client.id"
                      type="button"
                      class="btn-action btn-action-edit"
                      @click="modifierClient(client)"
                      title="Modifier">
                      <i class="flaticon-pen"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div
        class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
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

  <!-- Modal détails -->
  <CustomerDetailsModal
    :isVisible="showDetailsModal"
    :clientId="selectedClientId"
    :canCreateHorsConvention="canCreateHorsConvention"
    @close="closeDetailsModal"
    @update:isVisible="showDetailsModal = $event"
    @createContrat="creerContrat"
    @faireCotation="faireCotation"
    @createHorsConvention="creerContratHorsConvention"
  />

  <!-- Modal de conversion cotation -->
  <CotationToContratModal
    ref="conversionModalRef"
    :visible="showConversionModal"
    :client-editable="true"
    modal-title="Nouveau Contrat"
    @conversion-success="handleConversionSuccess"
    @close="handleConversionClose"
    @update:visible="showConversionModal = $event"
  />

        <!-- Modal de cotation -->
        <CotationModal
          :visible="showCotationModal"
          :client-data="selectedClientForCotation || undefined"
          @update:visible="showCotationModal = $event"
          @cotation-success="handleCotationSuccess"
          @close="handleCotationClose"
        />

        <!-- Modal des primes calculées (flux cotation → conversion) -->
        <PrimesCalculatedModal
          :visible="showPrimesSection"
          :primes="calculatedPrimes"
          :is-converting="isConverting"
          context="cotation-modal"
          @close="closePrimesSection"
          @convert-cotation-modal="openConvertModalWithData"
        />

        <!-- Modal des primes calculées (exemple d'utilisation) -->
        <PrimesCalculatedModal
          :visible="showPrimesModal"
          :primes="examplePrimes"
          :show-convert-button="true"
          :client-data="clients[0] || null"
          :cotation-data="exampleCotation"
          @close="handlePrimesClose"
          @convert="handlePrimesConvert"
          @conversion-success="handlePrimesConversionSuccess"
        />

        <!-- Modal de conversion cotation vers contrat -->
        <CotationToContratModal
          :visible="showCotationToContratModal"
          :selected-client="selectedClientForConversion || undefined"
          :selected-cotation="selectedCotationForConversion || undefined"
          :client-editable="false"
          :modal-title="'Nouveau Contrat - ' + (selectedClientForConversion ? selectedClientForConversion.lastname + ' ' + selectedClientForConversion.firstname : '')"
          @conversion-success="handleCotationToContratSuccess"
          @close="handleCotationToContratClose"
          @update:visible="showCotationToContratModal = $event"
        />

        <!-- Modal hors convention -->
        <HorsConventionModal
          :visible="showHorsConventionModal"
          :selected-client="selectedClientForHorsConvention || undefined"
          @hors-convention-success="handleHorsConventionSuccess"
          @close="closeHorsConventionModal"
          @update:visible="showHorsConventionModal = $event"
        />

        <!-- Modal création contrat -->
        <CotationToContratModal
          :visible="showCreateContratModal"
          :selected-client="selectedClientForCreateContrat || undefined"
          :client-editable="false"
          :modal-title="'Créer un Contrat - ' + (selectedClientForCreateContrat ? selectedClientForCreateContrat.lastname + ' ' + selectedClientForCreateContrat.firstname : '')"
          @conversion-success="handleCreateContratSuccess"
          @close="closeCreateContratModal"
          @update:visible="showCreateContratModal = $event"
        />

        <!-- Modal ajouter client -->
        <CreateCustomerModal
          :isVisible="showAddClientModal"
          @close="closeAddClientModal"
          @update:isVisible="showAddClientModal = $event"
          @success="handleAddClientSuccess"
        />

        <!-- Modal modification client -->
        <CreateCustomerModal
          :isVisible="showEditClientModal"
          mode="edit"
          :clientToEdit="clientToEdit"
          @close="closeEditClientModal"
          @update:isVisible="showEditClientModal = $event"
          @success="handleEditClientSuccess"
        />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed, nextTick, Teleport, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAuthStore } from "../../services/auth";
import ApiService from "../../services/ApiService";
import { error, success } from "../../utils/utils";
import PaginationComponent from '../Utilities/Pagination.vue';
import CotationToContratModal from '../Common/CotationToContratModal.vue';
import CotationModal from './CotationModal.vue';
import CreateCustomerModal from './CreateCustomerModal.vue';
import CustomerDetailsModal from './CustomerDetailsModal.vue';
import Modal from '../Common/Modal.vue';
import PrimesCalculatedModal from '../Common/PrimesCalculatedModal.vue';
import HorsConventionModal from '../Common/HorsConventionModal.vue';

// Interface pour les clients
interface Client {
  id: number;
  uuid?: string;
  idTypeCustomer: number;
  idUser: number;
  updatedBy?: number;
  deletedBy?: number;
  lastname: string;
  firstname: string;
  email?: string;
  address: string;
  phone: string;
  placeOfBirth: string;
  birthdate: string;
  occupation: string;
  gender: "M" | "F";
  autreAss?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
  // Relations
  typeCustomer?: {
    id: number;
    libelle: string;
  };
  // Champs optionnels pour compatibilité
  code?: string;
  numCustomer?: string;
  profession?: string;
  phone2?: string;
  maritalStatus?: string;
  numberChildren?: string;
  salaryBracket?: string;
  residenceArea?: string;
  locomotion?: string;
  accomodation?: string;
  groupe?: string;
  ifu?: string;
  status?: number;
  contracts?: any[];
}

// Interface pour NatureCredit
interface NatureCredit {
  id: number;
  libelle: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

// Interface pour les contrats dans le modal
interface ContratClient {
  id: number;
  idCustomer: number;
  idUser: number;
  idProduct: number;
  idContractState: number;
  idAgency: number;
  capital: number;
  duration: number;
  dateEff: string;
  dateEch1: string;
  dateEch: string;
  pd: number;
  pc: number;
  surp: number;
  acc: number;
  fm: number;
  puttc: number;
  police: string;
  reference: string;
  garantieCompl: string;
  description?: string;
  keyCont: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Relations
  customer?: any;
  user?: any;
  product?: any;
  contractState?: {
    id: number;
    libelle: string;
  };
  agency?: any;
  createdByUser?: any;
  updatedByUser?: any;
  deletedByUser?: any;
  natureCredit?: NatureCredit;
}

export default defineComponent({
  name: "ListeClients",
  components: {
    PaginationComponent,
    CotationToContratModal,
    CotationModal,
    CreateCustomerModal,
    CustomerDetailsModal,
    Modal,
    PrimesCalculatedModal,
    HorsConventionModal
  },
  setup() {
    // Composables
    const router = useRouter();
    const authStore = useAuthStore();

    // Refs
    const clients = ref<Array<Client>>([]);   
    const selectedClientId = ref<number | null>(null);
    const loading = ref(false);
    const conversionModalRef = ref<any>(null);
    const showConversionModal = ref(false);
    const cotationModalRef = ref<any>(null);
    const selectedClientForCotation = ref<Client | null>(null);
    const showCotationModal = ref(false);
    const showDetailsModal = ref(false);
    
    // Gestion des rôles
    const userRole = ref<number | null>(null);
    
    // Variables pour le menu d'actions
    const activeActionMenu = ref<number | null>(null);
    const buttonRefs = ref<Record<number, HTMLElement>>({});
    const menuPosition = ref<Record<number, { top: string; left: string }>>({});
    
    // Modal de conversion cotation vers contrat
    const showCotationToContratModal = ref(false);
    const selectedClientForConversion = ref<Client | null>(null);
    const selectedCotationForConversion = ref<any>(null);
    
    // Modal des primes calculées (exemple d'utilisation)
    const showPrimesModal = ref(false);
    
    // Modal hors convention
    const showHorsConventionModal = ref(false);
    const selectedClientForHorsConvention = ref<Client | null>(null);
    
    // Modal création contrat
    const showCreateContratModal = ref(false);
    const selectedClientForCreateContrat = ref<Client | null>(null);
    
    // Modal ajouter client
    const showAddClientModal = ref(false);
    
    // Modal modifier client
    const showEditClientModal = ref(false);
    const clientToEdit = ref<Client | null>(null);
    
    const examplePrimes = ref({
      pd: 15000,
      pc: 8000,
      surp: 2000,
      acc: 5000,
      fm: 3000,
      puttc: 33000
    });
    const exampleCotation = ref({
      creditType: 'AMORT',
      duration: 12,
      capital: 25000000,
      garantieCompl: 'OUI'
    });

    // Variables pour le flux cotation → conversion
    const showPrimesSection = ref(false);
    const isConverting = ref(false);
    const calculatedPrimes = ref({
      pd: 0,
      pc: 0,
      surp: 0,
      acc: 0,
      fm: 0,
      puttc: 0
    });
    const cotationData = ref<any>(null);

    // Pagination
    const searchTerm = ref('');
    const page = ref(1);
    const totalPages = ref(0);
    const limit = ref(10);
    const totalElements = ref(0);

    // Computed pour vérifier les permissions
    const canCreateHorsConvention = computed(() => {
      // ADMIN (role = 1) ou SUPER ADMIN (role = 5)
      const canCreate = userRole.value === 1 || userRole.value === 5;
      return canCreate;
    });

    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        page.value = page_;
        limit.value = limit_;
        getAllClients(page_, limit_, searchTerm.value);
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    function rechercher() {
      page.value = 1;
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    async function getAllClients(pageNum = 1, limitNum = 10, search = '') {
      try {
        loading.value = true;
        
        const response = await ApiService.get(`/customers?page=${pageNum}&limit=${limitNum}&search=${encodeURIComponent(search)}`);
        
        const { data } = response;
        
        // Structure réelle : { code: 200, message: string, data: { customers: Customer[], pagination: { total, page, limit, totalPages } }, timestamp: string }
        if (data && data.data && data.data.customers && Array.isArray(data.data.customers)) {
          clients.value = data.data.customers;
          
          const pagination = data.data.pagination;
          if (pagination) {
            totalElements.value = pagination.total || 0;
            totalPages.value = pagination.totalPages || 0;
            page.value = pagination.page || pageNum;
            limit.value = pagination.limit || limitNum;
          } else {
            // Rétrocompatibilité
            totalElements.value = data.data.customers.length;
            totalPages.value = Math.ceil(data.data.customers.length / limitNum);
            page.value = pageNum;
            limit.value = limitNum;
          }
          
        } else {
          console.warn("⚠️ Structure de données inattendue:", data);
          clients.value = [];
          totalPages.value = 0;
          totalElements.value = 0;
        }
        
      } catch (err: any) {
        console.error("❌ Erreur lors de la récupération des clients:", err);
        error(err?.response?.data?.message || "Erreur lors de la récupération des clients");
        clients.value = [];
        totalPages.value = 0;
        totalElements.value = 0;
      } finally {
        loading.value = false;
      }
    }
    
    // Fonction utilitaire pour fermer le modal avant navigation
    function closeModalBeforeNavigation() {
      showDetailsModal.value = false;
    }

    // Fonction modifier
    function modifier(editClient: Client) {
      
      // Fermer le modal s'il est ouvert
      closeModalBeforeNavigation();
      
      // Rediriger vers la page de modification avec l'ID du client
      router.push({ 
        name: 'ListeCustomerPage',
        params: { id: editClient.id.toString() } 
      }).catch(err => {
        console.error('❌ Erreur de routing:', err);
        // Fallback: utiliser le path direct si le nom de route n'existe pas
        router.push(`/editer-client/${editClient.id}`);
      });
    }

    function voirDetails(client: Client) {
      if (client.uuid || client.id) {
        router.push(`/details-client/${client.uuid || client.id}`);
      }
    }

    function closeDetailsModal() {
      showDetailsModal.value = false;
      selectedClientId.value = null;
    }

    function voirContrats(client: Client) {
      const routeNames = ['ListeContrats', 'ContratsList', 'Contrats'];
      const fallbackPaths = ['/contrats', '/liste-contrats'];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName,
            query: { client: client.code }
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
          try {
            router.push(`${path}?client=${client.code}`);
            routeFound = true;
            break;
          } catch (err) {
            continue;
          }
        }
      }
      
      if (!routeFound) {
        error('Route de liste des contrats non configurée.');
        console.error('❌ Aucune route de liste des contrats trouvée.');
      }
    }

    function voirContrat(contractCode: string) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      try {
        // Rediriger vers /liste-contrats avec le code du contrat en paramètre
        router.push({
          path: '/liste-contrats',
          query: { 
            openContract: contractCode,
            autoOpen: 'true'
          }
        });
        
        
      } catch (err) {
        console.error('❌ Erreur lors de la navigation:', err);
        
        // Fallback : essayer avec différents chemins
        const fallbackPaths = ['/contrats', '/contract', '/liste-contrat'];
        
        let routeFound = false;
        for (const path of fallbackPaths) {
          try {
            router.push({
              path: path,
              query: { 
                openContract: contractCode,
                autoOpen: 'true'
              }
            });
            routeFound = true;
            break;
          } catch (fallbackErr) {
            continue;
          }
        }
        
        if (!routeFound) {
          console.warn('⚠️ Aucune route de liste contrats trouvée');
          error('Route de liste des contrats non configurée.');
        }
      }
    }

    function modifierContrat(contractCode: string) {
      
      // Fermer le modal avant de naviguer
      closeModalBeforeNavigation();
      
      const routeNames = ['ListeContratPage'];
      const fallbackPaths = ['/liste-contrats'];
      
      let routeFound = false;
      
      for (const routeName of routeNames) {
        try {
          router.push({ 
            name: routeName, 
            params: { code: contractCode } 
          });
          routeFound = true;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!routeFound) {
        for (const path of fallbackPaths) {
          try {
            router.push(path);
            routeFound = true;
            break;
          } catch (err) {
            continue;
          }
        }
      }
      
      if (!routeFound) {
        console.warn('⚠️ Aucune route de modification contrat trouvée');
        error('Route de modification du contrat non configurée.');
      }
    }

    function creerContrat(client: Client) {
      
      // Fermer le modal de détails s'il est ouvert
      closeModalBeforeNavigation();
      
      // Stocker le client sélectionné et ouvrir le modal de création de contrat
      selectedClientForCreateContrat.value = client;
      showCreateContratModal.value = true;
      
    }

    function creerContratHorsConvention(client: Client) {
      
      // Vérifier les permissions
      if (!canCreateHorsConvention.value) {
        error('Vous n\'avez pas les permissions pour créer un contrat hors convention');
        return;
      }
      
      // Fermer le modal de détails s'il est ouvert
      closeModalBeforeNavigation();
      
      // Stocker le client sélectionné et ouvrir le modal
      selectedClientForHorsConvention.value = client;
      showHorsConventionModal.value = true;
      
    }

    // Fonction pour fermer le modal hors convention
    function closeHorsConventionModal() {
      showHorsConventionModal.value = false;
      selectedClientForHorsConvention.value = null;
    }

    // Fonction pour gérer le succès de création d'un contrat hors convention
    function handleHorsConventionSuccess() {
      success('Contrat hors convention créé avec succès');
      
      // Recharger la liste des clients
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    // Fonctions pour le modal de création de contrat
    function closeCreateContratModal() {
      showCreateContratModal.value = false;
      selectedClientForCreateContrat.value = null;
    }

    function handleCreateContratSuccess(contract: any) {
      success('Contrat créé avec succès');
      
      // Recharger la liste des clients
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    // Fonctions pour le modal d'ajout de client
    function ajouterClient() {
      showAddClientModal.value = true;
    }

    function closeAddClientModal() {
      showAddClientModal.value = false;
    }

    function handleAddClientSuccess(customer: any) {
      // Recharger la liste des clients après ajout réussi
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    // Fonctions pour le modal de modification de client
    function modifierClient(client: Client) {
      clientToEdit.value = client;
      showEditClientModal.value = true;
    }

    function closeEditClientModal() {
      showEditClientModal.value = false;
      clientToEdit.value = null;
    }

    function handleEditClientSuccess(customer: any) {
      // Recharger la liste des clients après modification réussie
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    function faireCotation(client: Client) {
      
      // Fermer le modal de détails s'il est ouvert
      closeModalBeforeNavigation();
      
      // Stocker le client sélectionné
      selectedClientForCotation.value = client;
      
      // Ouvrir le modal de cotation
      showCotationModal.value = true;
    }

    async function toggleSuspension(client: Client) {
      try {
        const action = client.isActive === false ? 'réactiver' : 'suspendre';
        const newStatus = !client.isActive;
        
        const result = await Swal.fire({
          title: `Confirmer l'action`,
          text: `Voulez-vous vraiment ${action} ce client ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: `Oui, ${action}`,
          cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
          // Utiliser l'ID numérique pour l'API
          await ApiService.patch(`/customers/${client.id}`, {
            isActive: newStatus
          });
          
          // Mettre à jour le statut local
          client.isActive = newStatus;
          success(`Client ${action} avec succès`);
          
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du changement de statut:', err);
        error(`Erreur lors de la ${client.isActive === false ? 'réactivation' : 'suspension'}`);
      }
    }

    async function confirmerSuppression(clientToDelete: Client) {
      if (!clientToDelete.id) {
        console.error('ID de client manquant');
        return;
      }
      
      try {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr?',
          text: `Voulez-vous vraiment supprimer définitivement le client ${clientToDelete.id} (${clientToDelete.lastname} ${clientToDelete.firstname})?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler',
          heightAuto: false
        });

        if (result.isConfirmed) {
          await deleteClient(clientToDelete.id);
        }
      } catch (err) {
        console.error('Erreur lors de la confirmation:', err);
      }
    }

    async function deleteClient(id: number) {
      try {
        const { data } = await ApiService.delete(`/customers/${id}`);
        
        // Supprimer de la liste locale
        clients.value = clients.value.filter(c => c.id !== id);
        totalElements.value = Math.max(0, totalElements.value - 1);
        
        // Afficher message de succès
        await Swal.fire({
          text: data.message || 'Client supprimé avec succès',
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
        if (clients.value.length === 0 && page.value > 1) {
          page.value--;
          await getAllClients(page.value, limit.value, searchTerm.value);
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
        // Si c'est au format YYYY-MM-DD, le convertir en DD/MM/YYYY
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
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
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }

    function calculateAge(birthdate: string): number {
      if (!birthdate) return 0;
      try {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      } catch {
        return 0;
      }
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

    // Fonction pour obtenir l'icône selon le type
    function getTypeIcon(type: string): string {
      switch (type) {
        case 'Personnel':
          return 'flaticon-user-1';
        case 'Entreprise':
          return 'flaticon-briefcase';
        case 'Professionnel':
          return 'flaticon-user';
        case 'Particulier':
        default:
          return 'flaticon-user';
      }
    }

    function getStatutClass(item: any): string {
      const baseClass = 'badge fs-7 px-2 py-1';
      
      if (item.isActive === false) {
        return `${baseClass} bg-danger text-white`;      // Inactif
      } else if (item.isActive === true) {
        return `${baseClass} bg-success text-white`;     // Actif
      } else if (item.contractState?.libelle) {
        // Utiliser le statut du contrat s'il est disponible
        const statut = item.contractState.libelle.toLowerCase();
        if (statut.includes('actif') || statut.includes('active')) {
          return `${baseClass} bg-success text-white`;
        } else if (statut.includes('expiré') || statut.includes('expired')) {
          return `${baseClass} bg-warning text-dark`;
        } else if (statut.includes('annulé') || statut.includes('cancelled')) {
          return `${baseClass} bg-danger text-white`;
        } else if (statut.includes('en attente') || statut.includes('pending')) {
          return `${baseClass} bg-info text-white`;
        } else {
          return `${baseClass} bg-secondary text-white`;
        }
      } else {
        return `${baseClass} bg-secondary text-white`;   // Non défini
      }
    }

    function getStatutTexte(item: any): string {
      if (item.isActive === false) {
        return 'Inactif';
      } else if (item.isActive === true) {
        return 'Actif';
      } else if (item.contractState?.libelle) {
        return item.contractState.libelle;
      } else {
        return 'Non défini';
      }
    }

    function getStatutIcon(item: any): string {
      if (item.isActive === false) {
        return 'flaticon-pause';
      } else if (item.isActive === true) {
        return 'flaticon-check';
      } else {
        return 'flaticon-question';
      }
    }

    // Fonction pour générer les initiales du nom et prénom
    function getInitials(firstname: string, lastname: string): string {
      const firstInitial = firstname ? firstname.charAt(0).toUpperCase() : '';
      const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial;
    }

    // Fonction pour déterminer si le genre est masculin
    function isMale(gender: string): boolean {
      if (!gender) return false;
      const genderLower = gender.toLowerCase().trim();
      return genderLower === 'm' || 
             genderLower === 'masculin' || 
             genderLower === 'homme' || 
             genderLower === 'male';
    }

    // Fonction pour obtenir le texte d'affichage du genre
    function getGenderText(gender: string): string {
      if (!gender) return 'Non défini';
      const genderLower = gender.toLowerCase().trim();
      
      if (isMale(gender)) {
        return 'Masculin';
      } else if (genderLower === 'f' || 
                 genderLower === 'féminin' || 
                 genderLower === 'femme' || 
                 genderLower === 'female') {
        return 'Féminin';
      } else {
        // Retourner la valeur originale si elle n'est pas reconnue
        return gender;
      }
    }

    // Nouvelles fonctions pour utiliser les fonctionnalités avancées de l'API
    
    async function dupliquerClient(client: Client) {
      try {
        const { value: formValues } = await Swal.fire({
          title: 'Dupliquer le client',
          html: `
            <div class="text-start">
              <div class="mb-3">
                <label class="form-label">Nouveau prénom</label>
                <input id="firstname" class="form-control" placeholder="Prénom" value="${client.firstname}">
              </div>
              <div class="mb-3">
                <label class="form-label">Nouveau nom</label>
                <input id="lastname" class="form-control" placeholder="Nom" value="${client.lastname}">
              </div>
              <div class="mb-3">
                <label class="form-label">Nouveau téléphone</label>
                <input id="phone" class="form-control" placeholder="Téléphone" value="${client.phone}">
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Dupliquer',
          cancelButtonText: 'Annuler',
          preConfirm: () => {
            const firstname = (document.getElementById('firstname') as HTMLInputElement).value;
            const lastname = (document.getElementById('lastname') as HTMLInputElement).value;
            const phone = (document.getElementById('phone') as HTMLInputElement).value;
            
            if (!firstname || !lastname || !phone) {
              Swal.showValidationMessage('Tous les champs sont requis');
              return false;
            }
            
            return { firstname, lastname, phone };
          }
        });

        if (formValues) {
          const { data } = await ApiService.post(`/customers/${client.code}/duplicate`, formValues);
          
          if (data && data.data) {
            success(`Client dupliqué avec succès. Nouveau code: ${data.data.code}`);
            // Recharger la liste pour voir le nouveau client
            await getAllClients(page.value, limit.value, searchTerm.value);
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la duplication:', err);
        error('Erreur lors de la duplication du client');
      }
    }


    // Fonctions pour le modal de conversion
    function openConversionModal() {
      showConversionModal.value = true;
    }

    function handleConversionSuccess() {
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    function handleConversionClose() {
      showConversionModal.value = false;
    }

    // Fonctions pour le modal de cotation
    function handleCotationSuccess(cotation: any) {
      success('Cotation créée avec succès');
      
      // Stocker les données de cotation
      cotationData.value = cotation;
      
      // Mettre à jour les primes calculées
      if (cotation && cotation.primes) {
        calculatedPrimes.value = {
          pd: cotation.primes.pd || 0,
          pc: cotation.primes.pc || 0,
          surp: cotation.primes.surp || 0,
          acc: cotation.primes.acc || 0,
          fm: cotation.primes.fm || 0,
          puttc: cotation.primes.puttc || 0
        };
      }
      
      // Fermer le modal de cotation
      showCotationModal.value = false;
      
      // Ouvrir le modal des primes calculées
      showPrimesSection.value = true;
    }

    function handleCotationClose() {
      showCotationModal.value = false;
      selectedClientForCotation.value = null;
    }

    // Fonctions pour le modal des primes (exemple d'utilisation)
    function showExamplePrimes() {
      showPrimesModal.value = true;
    }

    function handlePrimesClose() {
      showPrimesModal.value = false;
    }

    function handlePrimesConvert(primes: any) {
      // Ici vous pouvez implémenter la logique de conversion
      // Par exemple, ouvrir un autre modal ou rediriger
    }

    function handlePrimesConversionSuccess(contract: any) {
      success('Contrat créé avec succès depuis les primes calculées');
      showPrimesModal.value = false;
      
      // Recharger la liste des clients
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    // Fonctions pour le modal de conversion cotation vers contrat
    function openCotationToContratModal(client: Client, cotation?: any) {
      selectedClientForConversion.value = client;
      selectedCotationForConversion.value = cotation || null;
      showCotationToContratModal.value = true;
    }

    function handleCotationToContratSuccess(contract: any) {
      // success('Contrat créé avec succès depuis la cotation'); // Supprimé pour éviter de fermer le modal
      
      // Ne pas fermer le modal automatiquement - l'utilisateur doit cliquer sur "Fermer"
      // showCotationToContratModal.value = false;
      // selectedClientForConversion.value = null;
      // selectedCotationForConversion.value = null;
      
      // Recharger la liste des clients
      getAllClients(page.value, limit.value, searchTerm.value);
    }

    function handleCotationToContratClose() {
      showCotationToContratModal.value = false;
      selectedClientForConversion.value = null;
      selectedCotationForConversion.value = null;
    }

    // Fonctions pour le modal des primes calculées
    function closePrimesSection() {
      showPrimesSection.value = false;
      // Réactiver le scroll de la page
      document.body.classList.remove('modal-open');
    }

    function openConvertModalWithData() {
      
      if (!selectedClientForCotation.value || !cotationData.value) {
        console.error('❌ Données client ou cotation manquantes');
        error('Données manquantes pour la conversion');
        return;
      }

      // Préparer les données client complètes
      const clientData = {
        lastname: selectedClientForCotation.value.lastname,
        firstname: selectedClientForCotation.value.firstname,
        address: selectedClientForCotation.value.address || '',
        email: selectedClientForCotation.value.email || '',
        phone: selectedClientForCotation.value.phone,
        gender: selectedClientForCotation.value.gender,
        typeClient: selectedClientForCotation.value.typeCustomer?.id?.toString() || '1',
        birthdate: selectedClientForCotation.value.birthdate,
        placeOfBirth: selectedClientForCotation.value.placeOfBirth || '',
        occupation: selectedClientForCotation.value.occupation || '',
        numCustomer: selectedClientForCotation.value.numCustomer,
        code: selectedClientForCotation.value.code
      };

      // Déterminer le type de crédit
      const idNC = cotationData.value.idNatureCredit || cotationData.value.natureCredit?.id;
      const codeNC = cotationData.value.natureCredit?.code;
      let mappedCreditType = cotationData.value.creditType || codeNC;
      if (!mappedCreditType && idNC) {
        mappedCreditType = idNC === 2 ? 'CP' : idNC === 3 ? 'OBA' : 'AMORT';
      }

      // Préparer les données de cotation
      const cotationInfo = {
        capital: cotationData.value.capital || 0,
        duration: cotationData.value.duration || 0,
        creditType: mappedCreditType || 'AMORT',
        idNatureCredit: idNC,
        garantieCompl: cotationData.value.garantieCompl || 'NON'
      };

      // Configurer les données pour le modal de conversion
      selectedClientForConversion.value = clientData as any;
      selectedCotationForConversion.value = cotationInfo;

      // Fermer le modal des primes
      showPrimesSection.value = false;

      // Ouvrir le modal de conversion avec champs client verrouillés (CotationToContratModal)
      showCotationToContratModal.value = true;
    }

    // Fonction pour vérifier si le client a des actions supplémentaires
    function hasMoreActions(client: Client): boolean {
      // Compter les actions supplémentaires disponibles
      const hasFaireCotation = !!(client.id && client.isActive === true);
      const hasCreerContrat = !!(client.id && client.isActive === true);
      const hasCreerHorsConvention = !!(client.id && client.isActive === true && canCreateHorsConvention.value);
      const hasModifier = !!client.id;
      
      // Utiliser le menu si on a au moins une action supplémentaire
      return hasFaireCotation || hasCreerContrat || hasCreerHorsConvention || hasModifier;
    }

    // Fonction pour stocker la référence du bouton
    function setButtonRef(clientId: number, el: any) {
      if (el && el instanceof HTMLElement) {
        buttonRefs.value[clientId] = el;
      } else if (el && (el as any).$el instanceof HTMLElement) {
        buttonRefs.value[clientId] = (el as any).$el;
      }
    }

    // Fonction pour calculer la position du menu
    function getMenuPosition(clientId: number): Record<string, string> {
      if (!menuPosition.value[clientId]) {
        return { top: '0px', left: '0px' };
      }
      return menuPosition.value[clientId];
    }

    // Fonction pour ouvrir/fermer le menu d'actions
    function toggleActionMenu(event: Event, clientId: number) {
      if (activeActionMenu.value === clientId) {
        closeActionMenu();
      } else {
        activeActionMenu.value = clientId;
        const button = buttonRefs.value[clientId] || (event.currentTarget as HTMLElement);
        
        // Calculer la position du menu après que Vue ait rendu le Teleport
        nextTick(() => {
          if (button) {
            const buttonRect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Dimensions estimées du menu
            const menuHeight = 200;
            const menuWidth = 220;
            
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
            menuPosition.value[clientId] = {
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

    // Charger le rôle depuis le store Pinia (déjà disponible après login, sans appel API)
    function loadUserRole() {
      const roleMapping: { [key: string]: number } = {
        'ADMIN': 1,
        'MANAGER': 2,
        'USER': 3,
        'SUPER ADMIN': 5
      };

      const storeUser = (authStore.user as any);
      
      // Lire depuis idRole en priorité (toujours disponible)
      if (storeUser?.idRole) {
        userRole.value = storeUser.idRole;
        return;
      }
      
      // Sinon lire depuis role.name ou role.libelle
      const roleName = storeUser?.role?.name || storeUser?.role?.libelle;
      if (roleName && roleMapping[roleName] !== undefined) {
        userRole.value = roleMapping[roleName];
        return;
      }

      userRole.value = null;
    }


    // Lifecycle
    onMounted(() => {
      // Lire le rôle depuis le store Pinia (synchrone, pas d'appel API)
      loadUserRole();

      // Charger la liste immédiatement sans attendre le profil
      getAllClients().catch(err => {
        console.error('❌ Erreur dans onMounted:', err);
      });
    });

    return {
      // Refs
      clients,
      selectedClientId,
      loading,
      showConversionModal,
      showDetailsModal,
      searchTerm,
      page, 
      totalPages,
      limit,
      totalElements,
      
      // Methods
      getAllClients,
      deleteClient,
      confirmerSuppression,
      toggleSuspension,
      voirDetails,
      closeDetailsModal,
      voirContrats,
      voirContrat,
      modifierContrat,
      creerContrat,
      faireCotation,
      modifier,
      handlePaginate,
      rechercher,
      formatDate,
      formatMontant,
      calculateAge,
      getTypeClass,
      getTypeIcon,
      getStatutClass,
      getStatutTexte,
      getStatutIcon,
      getInitials,
      isMale,
      getGenderText,
      dupliquerClient,
      openConversionModal,
      handleConversionSuccess,
      handleConversionClose,
      conversionModalRef,
      cotationModalRef,
      selectedClientForCotation,
      showCotationModal,
      handleCotationSuccess,
      handleCotationClose,
      showPrimesModal,
      examplePrimes,
      exampleCotation,
      showExamplePrimes,
      handlePrimesClose,
      handlePrimesConvert,
      handlePrimesConversionSuccess,
      // Modal de conversion cotation vers contrat
      showCotationToContratModal,
      selectedClientForConversion,
      selectedCotationForConversion,
      openCotationToContratModal,
      handleCotationToContratSuccess,
      handleCotationToContratClose,
      // Variables pour le flux cotation → conversion
      showPrimesSection,
      isConverting,
      calculatedPrimes,
      cotationData,
      closePrimesSection,
      openConvertModalWithData,
      // Gestion des rôles et permissions
      userRole,
      canCreateHorsConvention,
      creerContratHorsConvention,
      loadUserRole,
      showHorsConventionModal,
      selectedClientForHorsConvention,
      closeHorsConventionModal,
      handleHorsConventionSuccess,
      // Modal création contrat
      showCreateContratModal,
      selectedClientForCreateContrat,
      closeCreateContratModal,
      handleCreateContratSuccess,
      // Modal ajouter client
      showAddClientModal,
      ajouterClient,
      closeAddClientModal,
      handleAddClientSuccess,
      // Modal modifier client
      showEditClientModal,
      clientToEdit,
      modifierClient,
      closeEditClientModal,
      handleEditClientSuccess,
      // Variables pour le menu d'actions
      activeActionMenu,
      hasMoreActions,
      setButtonRef,
      getMenuPosition,
      toggleActionMenu,
      closeActionMenu
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
.info-item {
  margin-bottom: 1rem;
}

.info-item label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.modal-xl {
  max-width: 80vw;
}

@media (min-width: 1400px) {
  .modal-xl {
    max-width: 1200px;
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

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 3px solid #dee2e6;
  margin: 0 auto;
}

/* Styles pour les badges colorés */
.bg-pink {
  background-color: #e91e63 !important;
  color: white !important;
}

/* Style pour les onglets personnalisés */
.nav-tabs-custom .nav-link {
  border: 1px solid transparent;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-bottom: -1px;
}

.nav-tabs-custom .nav-link.active {
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

/* Responsive design pour les tableaux */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .avatar-circle {
    width: 30px;
    height: 30px;
  }
  
  .search-box {
    width: 250px;
  }
}

/* Styles personnalisés avec les couleurs de l'entreprise */

/* Styles pour l'avatar de profil */
.avatar-profile {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  font-size: 2rem;
  text-transform: uppercase;
}

.avatar-profile i {
  font-size: 2.5rem;
}

/* Styles pour les champs d'information */
.info-field {
  margin-bottom: 1.5rem;
}

.info-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 0.95rem;
  color: #495057;
  font-weight: 500;
  display: flex;
  align-items: center;
  min-height: 1.5rem;
}

.info-value i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

/* Styles pour les badges personnalisés */
.bg-pink {
  background-color: #e91e63 !important;
  color: white !important;
}

/* Styles pour les badges de type de client plus subtils */
.badge.bg-light {
  background-color: #f8f9fa !important;
  border: 1px solid #dee2e6 !important;
  color: #6c757d !important;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
}

.badge.bg-light.text-dark {
  color: #495057 !important;
  font-weight: 600;
}

/* Styles pour les cartes */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* Styles pour les boutons au survol */
.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* Animation pour les cartes */
.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  /* box-shadow removed on hover as requested */
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
  min-width: 220px;
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

/* Bouton Modifier */
.btn-action-edit {
  color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
}

.btn-action-edit:hover {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
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

/* Colonne Actions - permettre les clics sur les boutons */
.table td:last-child {
  pointer-events: none;
}

.table td:last-child .action-buttons-group {
  pointer-events: auto;
}

.table td:last-child .btn-action {
  pointer-events: auto;
  cursor: pointer;
}

/* Indicateur visuel pour scroll horizontal */
.table-responsive {
  position: relative;
  overflow-x: auto;
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

/* Styles pour les onglets gérés par Vue */
.nav-tabs-custom .nav-link {
  border: 1px solid transparent;
  border-radius: 0.5rem 0.5rem 0 0;
  margin-bottom: -1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-tabs-custom .nav-link.active {
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
  color: #0d6efd;
  font-weight: 600;
}

.nav-tabs-custom .nav-link:not(.active) {
  color: #6c757d;
}

.nav-tabs-custom .nav-link:not(.active):hover {
  color: #0d6efd;
  background-color: #f8f9fa;
}

/* Forcer l'affichage des tab-pane quand ils sont visibles via v-show */
.tab-content .tab-pane[style*="display: block"],
.tab-content .tab-pane:not([style*="display: none"]) {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}
</style>