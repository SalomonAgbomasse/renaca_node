<template>
  <div>
    <div class="card mb-25 border-0 rounded-0 bg-white letter-spacing">
    <div
      class="card-head box-shadow bg-white d-lg-flex align-items-center justify-content-between p-15 p-sm-20 p-md-25">
      <div class="d-sm-flex align-items-center">
        <button
          @click="redirectToGenerate"
          class="default-btn position-relative transition border-0 fw-medium pt-11 pb-11 ps-25 pe-25 pt-md-12 pb-md-12 ps-md-30 pe-md-30 rounded-1 fs-md-15 fs-lg-16 d-inline-block me-10 mb-10 mb-lg-0 text-decoration-none"
          style="background-color: #33b04a; color: #231f20; border-color: #33b04a;">
          <i class="flaticon-plus position-relative ms-5 fs-12"></i>
          Générer un état
        </button>
      </div>
      <div class="d-flex align-items-center">
        <form class="search-box position-relative me-15" @submit.prevent="rechercher">
          <input
            type="text"
            v-model="searchTerm"
            @keyup="rechercher"
            class="form-control shadow-none text-black rounded-0 border-0"
            placeholder="Rechercher un état de production"
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
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>Code</th>
              <th>Agence</th>
              <th>Période</th>
              <th>Généré par</th>
              <th>Date génération</th>
              <th>Statut</th>
              <th>Statistiques</th>
              <th class="pe-0">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i" class="skeleton-row">
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td>
                <div class="skeleton-line" style="width: 110px;"></div>
                <div class="skeleton-line mt-1" style="width: 70px; height: 10px;"></div>
              </td>
              <td>
                <div class="skeleton-line" style="width: 80px;"></div>
                <div class="skeleton-line mt-1" style="width: 80px; height: 10px;"></div>
              </td>
              <td><div class="skeleton-line" style="width: 100px;"></div></td>
              <td><div class="skeleton-line" style="width: 120px;"></div></td>
              <td><div class="skeleton-badge"></div></td>
              <td><div class="skeleton-line" style="width: 90px;"></div></td>
              <td>
                <div class="d-flex gap-1">
                  <div class="skeleton-btn"></div>
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
  
        <!-- Table -->
        <div class="table-responsive" style="overflow-x: auto;">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Agence</th>
                <th>Période</th>
                <th>Généré par</th>
                <th>Date génération</th>
                <th>Statut</th>
                <th>Statistiques</th>
                <th key="actions" scope="col" class="text-uppercase fw-semibold shadow-none text-body-tertiary fs-7 py-3 text pe-0 sticky-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                  <p class="mt-2 mb-0">Chargement des états de production...</p>
                </td>
              </tr>
              <tr v-else-if="productions.length === 0">
                <td colspan="8" class="text-center py-4">
                  <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p class="text-muted mb-0">Aucun état de production trouvé</p>
                </td>
              </tr>
              <tr v-else v-for="production in productions" :key="production.code">
                <td>
                  <span class="fw-bold text-primary">{{ production.code }}</span>
                </td>
                <td>
                  <div>
                    <span class="fw-semibold">{{ production.agency?.name }}</span>
                    <small v-if="production.agency?.location" class="d-block text-muted">
                      {{ production.agency.location }}
                    </small>
                  </div>
                </td>
                <td>
                  <small class="text-muted">
                    Du {{ formatDate(production.startDate) }}<br>
                    au {{ formatDate(production.endDate) }}
                  </small>
                </td>
                <td>
                  <span class="text-dark">
                    {{ production.user?.firstname }} {{ production.user?.lastname }}
                  </span>
                </td>
                <td>
                  <small class="text-muted">
                    {{ formatDateTime(production.createdAt) }}
                  </small>
                </td>
                <td>
                  <span :class="getStatusBadgeClass(production.status)">
                    {{ getStatusLabel(production.status) }}
                  </span>
                </td>
                <td>
                  <div v-if="production.summary && production.summary.totalContracts > 0" class="small">
                    <div><strong>{{ production.summary.totalContracts }}</strong> contrats</div>
                    <div class="text-muted">{{ formatCurrency(production.summary.totalCapital) }}</div>
                  </div>
                  <div v-else-if="production.summary && production.summary.totalContracts === 0" class="small text-warning">
                    <div><strong>0</strong> contrat</div>
                    <div class="text-muted">Aucune donnée</div>
                  </div>
                  <span v-else class="text-muted">En attente...</span>
                </td>
                <td class="shadow-none lh-1 fw-medium text-body-tertiary text pe-0 sticky-actions">
                  <div class="action-buttons-group">
                    <!-- Actions principales toujours visibles -->
                    <!-- Voir les détails -->
                    <button 
                      type="button"
                      class="btn-action btn-action-view"
                      @click="viewDetails(production)"
                      title="Voir détails">
                      <i class="flaticon-eye"></i>
                    </button>

                    <!-- Télécharger -->
                    <button
                      v-if="production.status === 'completed'"
                      type="button"
                      class="btn-action btn-action-excel"
                      @click="downloadFile(production)"
                      title="Télécharger">
                      <i class="flaticon-file" style="font-size: 18px; display: block; width: 18px; height: 18px; line-height: 18px;"></i>
                    </button>
                    
                    <!-- Menu déroulant pour actions supplémentaires -->
                    <div class="dropdown">
                      <button 
                        type="button"
                        class="btn-action btn-action-more"
                        @click.stop="toggleActionMenu($event, production.id)"
                        :id="`action-menu-${production.id}`"
                        :ref="el => setButtonRef(production.id, el)"
                        title="Plus d'actions">
                        <i class="flaticon-dots"></i>
                      </button>
                    </div>
                    
                    <!-- Menu rendu via Teleport en dehors du tableau -->
                    <Teleport to="body">
                      <ul 
                        v-if="activeActionMenu === production.id"
                        class="dropdown-menu action-dropdown-menu show"
                        :data-menu-id="production.id"
                        :style="getMenuPosition(production.id)"
                        @click.stop>
                        <!-- Modifier -->
                        <li>
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="editProduction(production); closeActionMenu()">
                            <i class="flaticon-pen me-2"></i>
                            Modifier
                          </a>
                        </li>
                        <!-- Relancer -->
                        <li v-if="production.status === 'failed'">
                          <a class="dropdown-item d-flex align-items-center" 
                            href="javascript:void(0);" 
                            @click="retryGeneration(production); closeActionMenu()">
                            <i class="flaticon-refresh me-2"></i>
                            Relancer
                          </a>
                        </li>
                        <!-- Divider -->
                        <li v-if="production.status === 'failed'"><hr class="dropdown-divider"></li>
                        <!-- Supprimer -->
                        <li>
                          <a class="dropdown-item d-flex align-items-center text-danger" 
                            href="javascript:void(0);" 
                            @click="confirmDelete(production); closeActionMenu()">
                            <i class="flaticon-trash me-2"></i>
                            Supprimer
                          </a>
                        </li>
                      </ul>
                    </Teleport>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Pagination -->
        <div
          class="pagination-area d-md-flex mt-15 mt-sm-20 mt-md-25 justify-content-between align-items-center"
          v-if="pagination.total > 0"
        >
          <PaginationComponent 
            :page="pagination.page" 
            :totalPages="pagination.totalPages" 
            :totalElements="pagination.total" 
            :limit="pagination.limit" 
            @paginate="handlePaginate" 
          />
        </div>
      </div>
    </div>
  
    <!-- Modal de détails -->
    <div v-if="showModal" class="modal-backdrop-custom"></div>
    <div
      v-if="showModal"
      class="modal-custom"
      @click.self="closeModal"
    >
      <div class="modal-dialog-custom">
        <div class="modal-content-custom">
          <div class="modal-header-custom">
            <h5 class="modal-title-custom">
              <i class="fas fa-info-circle me-2"></i>
              Détails de l'état de production
            </h5>
            <button type="button" class="btn-close-custom" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body-custom" v-if="selectedProduction">
            <div class="row">
              <div class="col-md-6">
                <h6>Informations générales</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Code :</strong></td>
                      <td>{{ selectedProduction.code }}</td>
                    </tr>
                    <tr>
                      <td><strong>Agence :</strong></td>
                      <td>{{ selectedProduction.agency?.name }}</td>
                    </tr>
                    <tr>
                      <td><strong>Période :</strong></td>
                      <td>{{ formatDate(selectedProduction.startDate) }} - {{ formatDate(selectedProduction.endDate) }}</td>
                    </tr>
                    <tr>
                      <td><strong>Statut :</strong></td>
                      <td>
                        <span :class="getStatusBadgeClass(selectedProduction.status)">
                          {{ getStatusLabel(selectedProduction.status) }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Généré par :</strong></td>
                      <td>{{ selectedProduction.user?.firstname }} {{ selectedProduction.user?.lastname }}</td>
                    </tr>
                    <tr>
                      <td><strong>Date de génération :</strong></td>
                      <td>{{ formatDateTime(selectedProduction.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6" v-if="selectedProduction.summary">
                <h6>Statistiques</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Nombre de contrats :</strong></td>
                      <td>
                        <span class="badge" :class="selectedProduction.summary.totalContracts > 0 ? 'badge-success-custom' : 'bg-warning'">
                          {{ selectedProduction.summary.totalContracts }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Capital total :</strong></td>
                      <td>{{ formatCurrency(selectedProduction.summary.totalCapital) }}</td>
                    </tr>
                    <tr>
                      <td><strong>Prime TTC totale :</strong></td>
                      <td>{{ formatCurrency(selectedProduction.summary.totalPrimeTTC) }}</td>
                    </tr>
                    <tr v-if="getProductionSummary(selectedProduction).avgCapital">
                      <td><strong>Capital moyen :</strong></td>
                      <td>{{ formatCurrency(getProductionSummary(selectedProduction).avgCapital) }}</td>
                    </tr>
                    <tr v-if="getProductionSummary(selectedProduction).avgPrimeTTC">
                      <td><strong>Prime TTC moyenne :</strong></td>
                      <td>{{ formatCurrency(getProductionSummary(selectedProduction).avgPrimeTTC) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
  
            <!-- Message d'erreur si échec -->
            <div v-if="selectedProduction.status === 'failed' && selectedProduction.errorMessage" class="alert alert-danger mt-3">
              <h6>Erreur lors de la génération :</h6>
              <p class="mb-0">{{ selectedProduction.errorMessage }}</p>
            </div>
  
            <!-- Statistiques détaillées -->
            <div v-if="getProductionSummary(selectedProduction) && getProductionSummary(selectedProduction).totalContracts > 0" class="mt-4">
              <div class="row">
                <div class="col-md-6" v-if="getProductionSummary(selectedProduction).contractsByUser && Object.keys(getProductionSummary(selectedProduction).contractsByUser).length > 0">
                  <h6>Répartition par utilisateur</h6>
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Nombre de contrats</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(count, userCode) in getProductionSummary(selectedProduction).contractsByUser" :key="userCode">
                          <td>{{ userCode }}</td>
                          <td>{{ count }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="col-md-6" v-if="getProductionSummary(selectedProduction).contractsByOption && Object.keys(getProductionSummary(selectedProduction).contractsByOption).length > 0">
                  <h6>Répartition par option</h6>
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Option</th>
                          <th>Nombre de contrats</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(count, option) in getProductionSummary(selectedProduction).contractsByOption" :key="option">
                          <td>{{ option }}</td>
                          <td>{{ count }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Message si aucune donnée -->
            <div v-else-if="getProductionSummary(selectedProduction) && getProductionSummary(selectedProduction).totalContracts === 0" class="mt-4">
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Aucun contrat trouvé</strong> pour cette période et cette agence.
              </div>
            </div>
          </div>
          <div class="modal-footer-custom">
            <button
              v-if="selectedProduction?.status === 'completed'"
              type="button"
              class="btn"
              style="background-color: #33b04a; color: #231f20; border-color: #33b04a;"
              @click="downloadFile(selectedProduction)"
            >
              <i class="fas fa-download me-2"></i>
              Télécharger le fichier
            </button>
            <button
              type="button"
              class="btn"
              style="background-color: #ede947; color: #231f20; border-color: #ede947;"
              @click="selectedProduction && editProduction(selectedProduction)"
            >
              <i class="fas fa-edit me-2"></i>
              Modifier
            </button>
            <button
              type="button"
              class="btn"
              style="background-color: #dc3545; color: #fff; border-color: #dc3545;"
              @click="selectedProduction && confirmDelete(selectedProduction)"
            >
              <i class="fas fa-trash me-2"></i>
              Supprimer
            </button>
            <button type="button" class="btn" 
                    style="background-color: #231f20; color: #ede947; border-color: #231f20;" 
                    @click="closeModal">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal-backdrop-custom"></div>
    <div
      v-if="showDeleteModal"
      class="modal-custom"
      @click.self="closeDeleteModal"
    >
      <div class="modal-dialog-custom" style="max-width: 500px;">
        <div class="modal-content-custom">
          <div class="modal-header-custom">
            <h5 class="modal-title-custom">
              <i class="fas fa-exclamation-triangle me-2 text-warning"></i>
              Confirmer la suppression
            </h5>
            <button type="button" class="btn-close-custom" @click="closeDeleteModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body-custom">
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Attention !</strong> Cette action est irréversible.
            </div>
            <p v-if="productionToDelete">
              Êtes-vous sûr de vouloir supprimer l'état de production 
              <strong class="text-primary">{{ productionToDelete.code }}</strong> ?
            </p>
            <div v-if="productionToDelete" class="mt-3">
              <h6>Détails de l'état :</h6>
              <ul class="list-unstyled">
                <li><strong>Agence :</strong> {{ productionToDelete.agency?.name }}</li>
                <li><strong>Période :</strong> {{ formatDate(productionToDelete.startDate) }} - {{ formatDate(productionToDelete.endDate) }}</li>
                <li><strong>Statut :</strong> 
                  <span :class="getStatusBadgeClass(productionToDelete.status)">
                    {{ getStatusLabel(productionToDelete.status) }}
                  </span>
                </li>
                <li v-if="productionToDelete.summary && productionToDelete.summary.totalContracts > 0">
                  <strong>Contrats :</strong> {{ productionToDelete.summary.totalContracts }} contrats
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-footer-custom">
            <button
              type="button"
              class="btn"
              style="background-color: #dc3545; color: #fff; border-color: #dc3545;"
              @click="deleteProduction"
              :disabled="isDeleting"
            >
              <i class="fas fa-trash me-2"></i>
              <span v-if="isDeleting">
                <i class="spinner-border spinner-border-sm me-2"></i>
                Suppression...
              </span>
              <span v-else>Oui, supprimer</span>
            </button>
            <button
              type="button"
              class="btn"
              style="background-color: #6c757d; color: #fff; border-color: #6c757d;"
              @click="closeDeleteModal"
              :disabled="isDeleting"
            >
              <i class="fas fa-times me-2"></i>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
// Cache buster: 2025-09-23-09-05
import { defineComponent, ref, onMounted, computed, onBeforeUnmount, nextTick, Teleport } from 'vue';
import { useRouter } from 'vue-router';
import ApiService from '../../services/ApiService';
import { error, success } from '../../utils/utils';
import PaginationComponent from '../Utilities/Pagination.vue';

interface ProductionState {
  id: number;
  code: string;
  idAgency: number;
  startDate: string;
  endDate: string;
  generatedBy: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  summary?: {
    totalContracts: number;
    totalCapital: number;
    totalPrimeTTC: number;
    avgCapital?: number;
    avgPrimeTTC?: number;
    contractsByUser: { [key: string]: number };
    contractsByOption: { [key: string]: number };
  };
  errorMessage?: string;
  agency?: {
    id: number;
    name: string;
    location?: string;
    phone?: string;
    email?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
  };
  user?: {
    id: number;
    lastname: string;
    firstname: string;
    email?: string;
    phone?: string;
    address?: string;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}


export default defineComponent({
  name: 'ListeEtatsProduction',
  components: {
    PaginationComponent
  },
  
  setup() {
    const router = useRouter();
    
    // Refs
    const loading = ref(false);
    const productions = ref<ProductionState[]>([]);
    const selectedProduction = ref<ProductionState | null>(null);
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const productionToDelete = ref<ProductionState | null>(null);
    const isDeleting = ref(false);
    const searchTerm = ref('');
    
    // Variables pour le menu d'actions
    const activeActionMenu = ref<number | null>(null);
    const buttonRefs = ref<Record<number, HTMLElement>>({});
    const menuPosition = ref<Record<number, { top: string; left: string }>>({});
    
    const pagination = ref({
      page: 1,
      limit: 15,
      total: 0,
      totalPages: 0
    });

    // Fonctions utilitaires
    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatDateTime = (dateString: string): string => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('fr-FR');
    };

    const formatCurrency = (amount: number): string => {
      if (amount === undefined || amount === null || amount === 0) {
        return '0 FCFA';
      }
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount) + ' FCFA';
    };

    const getStatusLabel = (status: string): string => {
      const labels = {
        pending: 'En attente',
        processing: 'En traitement',
        completed: 'Terminé',
        failed: 'Échoué'
      };
      return labels[status] || status;
    };

    const getStatusBadgeClass = (status: string): string => {
      const classes = {
        pending: 'badge bg-warning',
        processing: 'badge bg-info',
        completed: 'badge badge-success-custom',
        failed: 'badge bg-danger'
      };
      return classes[status] || 'badge bg-secondary';
    };

    const getProductionSummary = (production: ProductionState): any => {
      if (!production.summary) return null;
      
      
      // Si c'est déjà un objet, le retourner
      if (typeof production.summary === 'object') {
        return production.summary;
      }
      
      // Si c'est une chaîne de caractères, essayer de la parser
      if (typeof production.summary === 'string') {
        try {
          const parsed = JSON.parse(production.summary);
          return parsed;
        } catch (error) {
          console.error('❌ Erreur lors du parsing des statistiques:', error);
          return null;
        }
      }
      
      return null;
    };

    // Fonctions de données
    const loadProductions = async (): Promise<void> => {
      try {
        loading.value = true;
        
        const params = new URLSearchParams({
          page: pagination.value.page.toString(),
          limit: pagination.value.limit.toString()
        });

        if (searchTerm.value) params.append('search', searchTerm.value);

        const response = await ApiService.get(`/production_states?${params.toString()}`);
        //console.log('Réponse API complète:', response);
        
        if (response.data && response.data.data) {
          // Structure: { code, message, data: { productionStates: [...] } }
          productions.value = response.data.data.productionStates || [];
          
          //console.log('📊 États de production chargés:', productions.value);
          
          if (response.data.data.pagination) {
            const apiPagination = response.data.data.pagination;
            pagination.value = {
              page: apiPagination.currentPage || 1,
              limit: apiPagination.elementsPerPage || 15,
              total: apiPagination.totalElements || 0,
              totalPages: apiPagination.totalPages || 1
            };
            
            //console.log('Pagination mappée:', pagination.value);
          } else {
            // Si pas de pagination, utiliser les valeurs par défaut
            pagination.value = {
              page: 1,
              limit: 15,
              total: productions.value.length,
              totalPages: 1
            };
          }
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        error('Erreur lors du chargement des états de production');
      } finally {
        loading.value = false;
      }
    };


    // Fonctions d'action
    const redirectToGenerate = (): void => {
      router.push('/generer-etat-production');
    };

    const editProduction = (production: ProductionState): void => {
      if (!production) {
        console.error('❌ Aucune production sélectionnée pour la modification');
        return;
      }
      
      //console.log('✏️ Modification de la production:', production.code, 'ID:', production.id);
      closeModal();
      
      try {
        // Rediriger vers la page de génération avec l'ID pour le mode d'édition
        router.push({
          path: `/generer-etat-production/${production.id}`
        });
        //console.log('✅ Redirection vers la page de génération réussie');
      } catch (err: any) {
        console.error('❌ Erreur lors de la redirection:', err);
        error('Erreur lors de la redirection vers la page de modification');
      }
    };

    const viewDetails = (production: ProductionState): void => {
      console.log('👁️ Ouverture des détails pour:', production.code);
      selectedProduction.value = production;
      showModal.value = true;
      document.body.style.overflow = 'hidden';
    };

    const closeModal = (): void => {
      //console.log('❌ Fermeture du modal');
      showModal.value = false;
      selectedProduction.value = null;
      document.body.style.overflow = '';
    };

    // Méthode de téléchargement utilisant fetch natif
    const downloadFileDirect = async (production: ProductionState): Promise<void> => {
      try {
        //console.log('📥 Téléchargement direct pour:', production.code);
        
        const filename = `production_${production.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        // Utiliser la même méthode que l'ApiService pour récupérer le token
        const token = localStorage.getItem('id_token');
        //console.log('🔑 Token récupéré:', token ? token.substring(0, 20) + '...' : 'AUCUN');
        
        const baseUrl = '/api';
        const downloadUrl = `${baseUrl}/production_states/${production.id}/download`;
        
        //console.log('🔗 URL de téléchargement:', downloadUrl);
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        success('Fichier téléchargé avec succès');
        //console.log('✅ Téléchargement terminé avec succès');

      } catch (err: any) {
        console.error('❌ Erreur lors du téléchargement:', err);
        
        if (err.message?.includes('404')) {
          error('Fichier non trouvé ou non encore généré');
        } else if (err.message?.includes('401')) {
          error('Authentification requise pour télécharger le fichier');
        } else {
          error(`Erreur lors du téléchargement: ${err.message || 'Erreur inconnue'}`);
        }
      }
    };

    const downloadFile = downloadFileDirect;

    const retryGeneration = async (production: ProductionState): Promise<void> => {
      try {
        await ApiService.post(`/production_states/${production.code}/retry`, {});
        success('Régénération lancée');
        await loadProductions();
      } catch (err: any) {
        console.error('Erreur lors de la régénération:', err);
        error('Erreur lors de la régénération');
      }
    };

    // Fonctions de suppression
    const confirmDelete = (production: ProductionState): void => {
      //console.log('🗑️ Confirmation de suppression pour:', production.code);
      productionToDelete.value = production;
      showDeleteModal.value = true;
      document.body.style.overflow = 'hidden';
    };

    const closeDeleteModal = (): void => {
      //console.log('❌ Fermeture du modal de suppression');
      showDeleteModal.value = false;
      productionToDelete.value = null;
      isDeleting.value = false;
      document.body.style.overflow = '';
    };

    const deleteProduction = async (): Promise<void> => {
      if (!productionToDelete.value) {
        console.error('❌ Aucune production à supprimer');
        return;
      }

      try {
        isDeleting.value = true;
        //console.log('🗑️ Suppression de la production:', productionToDelete.value.code);
        
        await ApiService.delete(`/production_states/${productionToDelete.value.id}`);
        
        success('État de production supprimé avec succès');
        //console.log('✅ Suppression réussie');
        
        // Fermer le modal et recharger la liste
        closeDeleteModal();
        await loadProductions();
        
      } catch (err: any) {
        console.error('❌ Erreur lors de la suppression:', err);
        
        if (err.response?.status === 404) {
          error('État de production non trouvé');
        } else if (err.response?.status === 403) {
          error('Vous n\'avez pas les droits pour supprimer cet état');
        } else if (err.response?.status === 409) {
          error('Impossible de supprimer cet état (en cours de traitement)');
        } else {
          error(`Erreur lors de la suppression: ${err.response?.data?.message || err.message || 'Erreur inconnue'}`);
        }
      } finally {
        isDeleting.value = false;
      }
    };

    // Fonctions de recherche et pagination
    const rechercher = (): void => {
      pagination.value.page = 1;
      loadProductions();
    };

    let searchTimeout: ReturnType<typeof setTimeout>;
    const debounceSearch = (): void => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        rechercher();
      }, 500);
    };

    const changePage = (page: number): void => {
      if (page >= 1 && page <= pagination.value.totalPages) {
        pagination.value.page = page;
        loadProductions();
      }
    };

    const handlePaginate = ({ page_, limit_ }: { page_: number; limit_: number }) => {
      try {
        pagination.value.page = page_;
        pagination.value.limit = limit_;
        loadProductions();
      } catch (err) {
        console.error('Erreur pagination:', err);
      }
    };

    // Fonctions pour le menu d'actions
    function setButtonRef(productionId: number, el: any) {
      if (el && el instanceof HTMLElement) {
        buttonRefs.value[productionId] = el;
      } else if (el && (el as any).$el instanceof HTMLElement) {
        buttonRefs.value[productionId] = (el as any).$el;
      }
    }

    function getMenuPosition(productionId: number): Record<string, string> {
      if (!menuPosition.value[productionId]) {
        return { top: '0px', left: '0px' };
      }
      return menuPosition.value[productionId];
    }

    function toggleActionMenu(event: Event, productionId: number) {
      if (activeActionMenu.value === productionId) {
        closeActionMenu();
      } else {
        activeActionMenu.value = productionId;
        const button = buttonRefs.value[productionId] || (event.currentTarget as HTMLElement);
        
        // Calculer la position du menu après que Vue ait rendu le Teleport
        nextTick(() => {
          if (button) {
            const buttonRect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Dimensions estimées du menu
            const menuHeight = 150;
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
            menuPosition.value[productionId] = {
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


    // Auto-actualisation
    let refreshInterval: ReturnType<typeof setInterval>;
    const startAutoRefresh = (): void => {
      refreshInterval = setInterval(() => {
        const hasProcessing = productions.value.some(p => 
          p.status === 'pending' || p.status === 'processing'
        );
        
        if (hasProcessing) {
          loadProductions();
        }
      }, 30000);
    };

    const stopAutoRefresh = (): void => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };

    // Lifecycle
    onMounted(async () => {
      await loadProductions();
      startAutoRefresh();
    });

    // Cleanup
    onBeforeUnmount(() => {
      stopAutoRefresh();
      document.body.style.overflow = '';
    });

    return {
      // Data
      loading,
      productions,
      selectedProduction,
      showModal,
      showDeleteModal,
      productionToDelete,
      isDeleting,
      searchTerm,
      pagination,
      
      // Methods
      formatDate,
      formatDateTime,
      formatCurrency,
      getStatusLabel,
      getStatusBadgeClass,
      getProductionSummary,
      redirectToGenerate,
      editProduction,
      viewDetails,
      closeModal,
      downloadFile,
      retryGeneration,
      confirmDelete,
      closeDeleteModal,
      deleteProduction,
      rechercher,
      debounceSearch,
      changePage,
      handlePaginate,
      // Variables pour le menu d'actions
      activeActionMenu,
      setButtonRef,
      getMenuPosition,
      toggleActionMenu,
      closeActionMenu
    };
  }
});
</script>
  
<style scoped>
.table th {
  border-top: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.table td {
  vertical-align: middle;
}

/* Amélioration des boutons d'actions */
.gap-1 {
  gap: 0.25rem !important;
}

.btn-sm {
  font-size: 0.8rem;
  padding: 0.375rem 0.5rem;
}


/* Styles pour le modal personnalisé et centré */
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-custom {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: modalFadeIn 0.2s ease-out;
}

.modal-dialog-custom {
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  margin: 0 auto;
}

.modal-content-custom {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.modal-title-custom {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
}

.btn-close-custom {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;
}

.btn-close-custom:hover {
  background-color: #e9ecef;
  color: #495057;
}

.modal-body-custom {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer-custom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

/* Amélioration des tableaux dans le modal */
.modal-body-custom .table {
  margin-bottom: 1rem;
}

.modal-body-custom .table td {
  padding: 0.5rem;
  border-top: 1px solid #dee2e6;
  vertical-align: top;
}

.modal-body-custom .table td:first-child {
  width: 40%;
  font-weight: 500;
  color: #495057;
}

.modal-body-custom h6 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

/* Animation du modal */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive pour le modal */
@media (max-width: 768px) {
  .modal-custom {
    padding: 0.5rem;
  }
  
  .modal-dialog-custom {
    max-height: 95vh;
  }
  
  .modal-header-custom,
  .modal-body-custom,
  .modal-footer-custom {
    padding: 1rem;
  }
  
  .modal-title-custom {
    font-size: 1.1rem;
  }
  
  .modal-body-custom .row {
    margin: 0;
  }
  
  .modal-body-custom .col-md-6 {
    padding: 0;
    margin-bottom: 1.5rem;
  }
}

/* Styles pour les alertes dans le modal */
.modal-body-custom .alert {
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
}

.modal-body-custom .alert-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.modal-body-custom .alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

/* Styles pour les badges dans le modal */
.modal-body-custom .badge {
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  font-weight: 500;
}

/* Amélioration des boutons du footer */
.modal-footer-custom .btn {
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.modal-footer-custom .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge {
  font-size: 0.75rem;
}

/* Responsive amélioré pour les boutons d'actions */
@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
  
  .d-none.d-md-inline {
    display: none !important;
  }
  
  .d-flex.flex-wrap {
    flex-direction: column;
  }
  
  .d-flex.flex-wrap .btn {
    margin-bottom: 0.25rem;
    width: 100%;
    justify-content: flex-start;
  }
}

/* Amélioration de l'affichage des actions */
.btn-group-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 180px;
}

.btn-group-actions .btn {
  flex: 1;
  min-width: 80px;
  white-space: nowrap;
}

/* Couleurs personnalisées avec les couleurs de l'entreprise */
.badge-success-custom {
  background-color: #33b04a !important;
  color: #231f20 !important;
}

.bg-warning {
  background-color: #ffc107 !important;
  color: #000 !important;
}

.bg-info {
  background-color: #0dcaf0 !important;
  color: #000 !important;
}

.bg-danger {
  background-color: #dc3545 !important;
  color: #fff !important;
}

/* Styles pour les boutons au survol */
.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* Amélioration du design général */
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.fw-bold {
  font-weight: 600 !important;
}

.text-primary {
  color: #0d6efd !important;
}

/* Loading spinner amélioré */
.spinner-border {
  width: 2rem;
  height: 2rem;
}

/* Style pour la recherche */
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

.form-control:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Animation des boutons */
.btn {
  transition: all 0.15s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.btn:active {
  transform: translateY(0);
}


/* Amélioration des icônes */
.fas {
  font-size: 0.875rem;
}

/* Style pour les messages d'état vides */
.fa-inbox {
  color: #adb5bd !important;
}

/* Amélioration de l'affichage des statistiques */
.small {
  font-size: 0.875rem;
}

/* Style pour les tooltips */
[title] {
  cursor: help;
}

/* Amélioration de l'espacement */
.mb-25 {
  margin-bottom: 1.5rem;
}

.p-15 {
  padding: 1rem;
}

.p-sm-20 {
  padding: 1.25rem;
}

.p-md-25 {
  padding: 1.5rem;
}

.p-lg-30 {
  padding: 2rem;
}

/* Style pour la recherche */
.form-control[placeholder] {
  font-style: italic;
}

.form-control:focus[placeholder] {
  font-style: normal;
}

/* Amélioration de l'accessibilité */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Style pour les liens et boutons focus */
.btn:focus,
.form-control:focus,
.page-link:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Amélioration de l'affichage des dates */
.text-muted {
  color: #6c757d !important;
}

/* Style pour les codes de production */
.fw-semibold {
  font-weight: 600;
}

/* Responsive final */
@media (max-width: 576px) {
  .modal-dialog-custom {
    margin: 0.5rem;
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .table {
    font-size: 0.8rem;
  }
  
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

/* Bouton Générer PDF / Télécharger */
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

/* Bouton Télécharger Excel */
.btn-action-excel {
  color: #217346;
  background-color: rgba(33, 115, 70, 0.1);
}

.btn-action-excel:hover {
  background-color: rgba(33, 115, 70, 0.2);
  color: #217346;
}

.btn-action-excel i {
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

/* Colonne Actions - permettre les clics sur les boutons */
.table td:last-child {
  pointer-events: none;
}

.table td:last-child .dropdown {
  pointer-events: auto;
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